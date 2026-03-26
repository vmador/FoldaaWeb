import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Project {
  id: string;
  type: 'url' | 'bundle';
  source: string;
  status: 'deploying' | 'active' | 'failed' | 'error';
  url: string;
  previewUrl: string;
  createdAt: string;
}

export interface DomainStatus {
  domain: string;
  verified: boolean;
  instructions?: string;
}

export interface AnalyticsData {
  visitors: number;
  installs: number;
  lastUpdated: string;
}

export class FoldaaClient {
  private supabase: SupabaseClient;
  private onTokenRefreshed?: (data: { apiKey: string; refreshToken?: string }) => void;

  constructor(options: { 
    supabaseUrl: string;
    supabaseAnonKey: string;
    apiKey?: string; 
    refreshToken?: string;
    onTokenRefreshed?: (data: { apiKey: string; refreshToken?: string }) => void;
  }) {
    this.supabase = createClient(options.supabaseUrl, options.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
      },
      global: {
        headers: options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {},
      }
    });

    this.onTokenRefreshed = options.onTokenRefreshed;

    // Set up auth state change listener to notify CLI about token refreshes
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[FoldaaClient] Auth event: ${event}`);
      if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && session) {
        this.onTokenRefreshed?.({ 
          apiKey: session.access_token, 
          refreshToken: session.refresh_token 
        });
      }
    });

    // If we have a refresh token, make sure the session is "caught up"
    if (options.refreshToken && options.apiKey) {
      this.supabase.auth.setSession({
        access_token: options.apiKey,
        refresh_token: options.refreshToken
      });
    }
    
    console.log(`[FoldaaClient] Initialized with Direct Supabase Mode (hasRefreshToken=${!!options.refreshToken}).`);
  }

  async login(apiKey: string): Promise<void> {
    const { data: { user }, error } = await this.supabase.auth.getUser(apiKey);
    if (error || !user) throw new Error('Unauthorized: Invalid API Key');
    
    // Update the client with the verified token
    this.supabase = createClient(
      (this.supabase as any).supabaseUrl, 
      (this.supabase as any).supabaseKey,
      {
        global: { headers: { Authorization: `Bearer ${apiKey}` } }
      }
    );
  }

  async inspectWebsite(url: string): Promise<any> {
    // This now calls the Edge Function directly
    const { data, error } = await this.supabase.functions.invoke('inspect-website', {
      body: { url }
    });
    if (error) throw new Error(`Inspection failed: ${error.message}`);
    return data;
  }

  async createDraftProject(params: { 
    name: string; 
    type: 'url' | 'bundle'; 
    source: string;
    workspaceId?: string;
  }): Promise<{ projectId: string }> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 1. Check if it already exists
    const { data: existingProject } = await this.supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', params.name)
      .single();

    if (existingProject) {
      return { projectId: existingProject.id };
    }

    // 2. Otherwise insert
    const { data: project, error } = await this.supabase
      .from('projects')
      .insert({
        name: params.name,
        original_url: params.source,
        user_id: user.id,
        workspace_id: params.workspaceId,
        status: 'deploying'
      })
      .select().single();

    if (error) throw new Error(`Project creation failed: ${error.message}`);
    return { projectId: project.id };
  }

  async deployProject(params: any): Promise<any> {
    const urlStr = params.url.startsWith('http') ? params.url : `https://${params.url}`;
    let subdomain = 'app';
    try {
      const hostname = new URL(urlStr).hostname.replace(/^www\./, '');
      const parts = hostname.split('.');
      // Use the first part of the domain as default subdomain
      subdomain = parts[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');
      // If we have a project name that's a valid slug and it's not "Home", etc., use that instead
      if (params.name && params.name.length > 2) {
        const nameSlug = params.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
        if (nameSlug.length > 2 && !['home', 'index', 'welcome'].includes(nameSlug)) {
          subdomain = nameSlug;
        }
      }
    } catch (e) {}
    
    // Identify icons from the array or object
    const pwaIcons = params.pwaAssets?.icons;
    let icon192 = '';
    let icon512 = '';

    if (pwaIcons) {
      if (Array.isArray(pwaIcons)) {
        // Handle legacy array format
        icon192 = pwaIcons.find((i: any) => i.sizes === '192x192')?.src || params.pwaAssets?.favicon || '';
        icon512 = pwaIcons.find((i: any) => i.sizes === '512x512')?.src || icon192;
      } else {
        // Handle new structured object format
        icon192 = pwaIcons.icon192 || pwaIcons.favicon || '';
        icon512 = pwaIcons.icon512 || icon192;
      }
    }

    const projectData = {
      viewport_mode: params.options?.pwa?.viewport_mode || 'dvh',
      ignore_safe_area: params.options?.pwa?.ignore_safe_area || false,
      orientation: params.options?.pwa?.orientation || 'any',
      subdomain,
      name: params.name,
      app_description: params.options?.pwa?.description || "Auto-generated by Foldaa CLI",
      original_url: urlStr,
      theme_color: params.options?.pwa?.theme_color || '#000000',
      background_color: params.options?.pwa?.background_color || '#ffffff',
      // Added branding metadata
      favicon_url: params.pwaAssets?.icons?.favicon || '',
      apple_touch_icon_url: params.pwaAssets?.icons?.appleTouchIcon || '',
      icon_192_url: icon192,
      icon_512_url: icon512,
      og_image_url: params.pwaAssets?.images?.ogImage || '',
      og_title: params.name || '',
      og_description: params.options?.pwa?.description || '',
      theme_color_extracted: params.options?.pwa?.theme_color || '',
      background_color_extracted: params.pwaAssets?.colors?.background || '',
      allow_fullscreen: true,
      allow_geolocation: false,
      allow_camera: false,
      allow_microphone: false,
      allow_storage_access: true
    };

    // Unified deployment pipeline for V2
    const { data: deployData, error: deployError } = await this.supabase.functions.invoke('deploy-project', {
      body: { 
        action: "deploy", 
        project_id: params.projectId, 
        project_data: projectData,
        images: {
          'icon-192x192.png': icon192,
          'icon-512x512.png': icon512
        }
      }
    });

    if (deployError || !deployData?.success) {
      throw new Error(`Deployment Failed: ${deployError?.message || deployData?.error}`);
    }

    return {
      projectId: params.projectId,
      url: deployData.worker_url,
      previewUrl: deployData.worker_url,
      createdAt: new Date().toISOString()
    };
  }

  async getProjects(): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch projects: ${error.message}`);

    return data.map((p: any) => ({
      id: p.id,
      type: p.type || 'url',
      source: p.source || p.original_url,
      status: p.status || p.deployment_status || 'active',
      url: p.worker_url || `https://${p.name}.foldaa.app`,
      previewUrl: p.worker_url || `https://${p.name}.foldaa.app`,
      createdAt: p.created_at
    }));
  }

  async activateProject(projectId: string): Promise<any> {
    const { error } = await this.supabase
      .from('projects')
      .update({ status: 'active' })
      .eq('id', projectId);
    
    if (error) throw new Error(`Activation failed: ${error.message}`);
    return { success: true };
  }

  async getAnalytics(projectId: string): Promise<AnalyticsData> {
    const { data, error } = await this.supabase.functions.invoke('get-project-analytics', {
      body: { project_id: projectId }
    });
    if (error) throw new Error(`Analytics failed: ${error.message}`);
    return data;
  }

  // --- V2 Operations ---

  async claimDomain(domain: string): Promise<{ token: string }> {
    const { data, error } = await this.supabase.functions.invoke('claim-domain', {
      body: { domain }
    });
    if (error) throw new Error(`Claim failed: ${error.message}`);
    return data;
  }

  async verifyDomain(domain: string): Promise<{ success: boolean }> {
    const { data, error } = await this.supabase.functions.invoke('verify-domain', {
      body: { domain }
    });
    if (error) throw new Error(`Verification failed: ${error.message}`);
    return data;
  }

  async launchProject(params: { projectId: string; domain: string }): Promise<any> {
    const { data, error } = await this.supabase.functions.invoke('deploy-project', {
      body: { action: "launch", project_id: params.projectId, domain: params.domain }
    });
    if (error) throw new Error(`Launch failed: ${error.message}`);
    return data;
  }

  // --- Legacy Compatibility / Stub Functions ---
  async wrap(url: string, onProgress?: (step: string) => void): Promise<Project> {
    throw new Error('Method "wrap" is deprecated. Use the split pipeline instead.');
  }

  async redeployProject(projectId: string): Promise<any> {
    const { data: project } = await this.supabase.from('projects').select('*').eq('id', projectId).single();
    if (!project) throw new Error('Project not found');
    return this.deployProject({ projectId, ...project });
  }
}

