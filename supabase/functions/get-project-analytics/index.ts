import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/**
 * Decrypts a hex-encoded string using AES-GCM
 */
async function decrypt(
  encryptedData: string,
  key: string,
  userId: string,
  version: string = 'v2'
): Promise<string> {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error(`Invalid format: expected IV:DATA, got ${parts.length} parts`);
    }
    
    const [ivHex, encryptedHex] = parts;
    
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const encryptedBytes = new Uint8Array(encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const encoder = new TextEncoder();
    const salt = version === 'v2' 
      ? encoder.encode(`foldaa-v2-2025-${userId}`)
      : encoder.encode("foldaa-salt-v1-2025");

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(key),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const decryptedBytes = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      derivedKey,
      encryptedBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBytes);
  } catch (error) {
    if (version === 'v2') {
      console.log('⚠️ v2 failed, trying v1...');
      return await decrypt(encryptedData, key, userId, 'v1');
    }
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Recovers Cloudflare credentials for a user
 */
async function getDecryptedToken(userId: string, supabaseAdmin: any) {
  const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY');
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not configured');
  }

  // Check cloudflare_credentials (modern)
  const { data: credentials } = await supabaseAdmin
    .from('cloudflare_credentials')
    .select('encrypted_api_token, account_id, encryption_version')
    .eq('user_id', userId)
    .maybeSingle();

  if (credentials?.encrypted_api_token) {
    console.log('🔐 Using cloudflare_credentials');
    const version = credentials.encryption_version || 'v1';
    const apiToken = await decrypt(credentials.encrypted_api_token, ENCRYPTION_KEY, userId, version);
    return { apiToken, accountId: credentials.account_id };
  }

  // Check cloudflare_accounts (legacy/raw)
  const { data: account } = await supabaseAdmin
    .from('cloudflare_accounts')
    .select('api_token, access_token, account_id, status')
    .eq('user_id', userId)
    .neq('status', 'skipped')
    .maybeSingle();

  if (!account) {
    throw new Error('Cloudflare credentials not found. Please connect your Cloudflare account.');
  }

  const rawToken = account.api_token || account.access_token;
  if (!rawToken) {
    throw new Error('No valid Cloudflare API token found in account.');
  }

  console.log('🔐 Using cloudflare_accounts (raw token)');
  return { apiToken: rawToken, accountId: account.account_id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }
  
  try {
    console.log('📊 Get Project Analytics - Start');
    
    // Create admin client to query restricted tables
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) throw new Error('Unauthorized');
    
    console.log('✅ User authorized:', user.id);
    
    const body = await req.json();
    let { 
      project_id, 
      worker_name, 
      days = 7,
      period = '7d', // legacy field for safety
      offset = 0,
      includeHistory = true,
      since: customSince,
      until: customUntil
    } = body;

    let startDate: Date;
    let endDate: Date;

    if (customSince && customUntil) {
      startDate = new Date(customSince);
      endDate = new Date(customUntil);
      // Recalculate days for history seeding
      days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // Handle string based period labels from frontend
      if (period === '1h') days = 1; 
      else if (period === '24h') days = 1;
      else if (period === '7d') days = 7;
      else if (period === '30d') days = 30;

      endDate = new Date();
      endDate.setDate(endDate.getDate() - offset);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);
    }
    
    if (!project_id) {
      throw new Error('project_id is required');
    }

    // Recover worker_name from DB if missing
    if (!worker_name) {
      const { data: proj } = await supabaseClient
        .from('projects')
        .select('worker_name, subdomain')
        .eq('id', project_id)
        .single();
      
      worker_name = proj?.worker_name || (proj?.subdomain ? `pwa-${proj.subdomain}` : null);
    }

    if (!worker_name) {
      throw new Error('Could not resolve worker_name for project');
    }
    
    console.log('📦 Worker:', worker_name);
    console.log('📅 Date Range:', startDate.toISOString(), 'to', endDate.toISOString());
    
    // 1. Fetch Cloudflare Analytics (Total Traffic)
    let totalRequests = 0;
    let totalSubrequests = 0;
    let cfDailyMap = new Map();

    try {
      const { apiToken, accountId } = await getDecryptedToken(user.id, supabaseClient);
      
      const since = startDate.toISOString();
      const until = endDate.toISOString();
      
      const graphqlQuery = `
        query {
          viewer {
            accounts(filter: { accountTag: "${accountId}" }) {
              workersInvocationsAdaptive(
                filter: {
                  scriptName: "${worker_name}"
                  datetime_geq: "${since}"
                  datetime_leq: "${until}"
                }
                limit: 10000
              ) {
                dimensions { date }
                sum { requests subrequests }
              }
            }
          }
        }
      `;
      
      const cfResponse = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: graphqlQuery })
      });
      
      if (cfResponse.ok) {
        const cfData = await cfResponse.json();
        if (cfData.data?.viewer?.accounts?.[0]?.workersInvocationsAdaptive) {
          const stats = cfData.data.viewer.accounts[0].workersInvocationsAdaptive;
          stats.forEach((day: any) => {
            const d = day.dimensions.date;
            totalRequests += day.sum.requests;
            totalSubrequests += day.sum.subrequests;
            cfDailyMap.set(d, { requests: day.sum.requests, subrequests: day.sum.subrequests });
          });
        }
      }
    } catch (e) {
      console.warn('⚠️ Cloudflare fetch failed or skipped:', e.message);
    }

    // 2. Fetch Supabase Event Analytics (Real Views, Installs, Breakdowns)
    const sinceIso = startDate.toISOString();

    // Views & Visits
    const { data: events, error: eventError } = await supabaseClient
      .from('project_events')
      .select('event_type, ip_address, created_at, country_code, device_type')
      .eq('project_id', project_id)
      .gte('created_at', sinceIso);

    if (eventError) console.error('❌ Supabase events error:', eventError);

    const viewEvents = events?.filter((e: any) => e.event_type === 'view') || [];
    const installEvents = events?.filter((e: any) => e.event_type === 'install') || [];
    
    const views = viewEvents.length;
    const uniqueVisits = new Set(viewEvents.map((e: any) => e.ip_address)).size;
    const pwaInstalls = installEvents.length;

    // Calculate Live Visitors (Unique IP in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).getTime();
    const liveVisitorIps = new Set(
      viewEvents
        .filter((e: any) => new Date(e.created_at).getTime() > fiveMinutesAgo)
        .map((e: any) => e.ip_address)
    );
    const liveVisitors = liveVisitorIps.size;

    // Countries breakdown
    const countryMap = new Map<string, number>();
    viewEvents.forEach((e: any) => {
      const code = e.country_code || 'Unknown';
      countryMap.set(code, (countryMap.get(code) || 0) + 1);
    });
    const countries = Array.from(countryMap.entries())
      .map(([country, visits]) => ({ country, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);

    // Devices breakdown
    const deviceMap = new Map<string, number>();
    viewEvents.forEach((e: any) => {
      const type = e.device_type || 'Desktop';
      deviceMap.set(type, (deviceMap.get(type) || 0) + 1);
    });
    const devices = Array.from(deviceMap.entries())
      .map(([type, visits]) => ({ type, visits }))
      .sort((a, b) => b.visits - a.visits);

    // 3. Generate Combined History
    let history: any[] = [];
    if (includeHistory) {
      const dayMap = new Map<string, any>();
      
      // Seed with last X days
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        dayMap.set(ds, { date: ds, requests: 0, views: 0, visits: new Set() });
      }

      // Add Supabase views
      viewEvents.forEach((e: any) => {
        const ds = new Date(e.created_at).toISOString().split('T')[0];
        if (dayMap.has(ds)) {
          const point = dayMap.get(ds);
          point.views += 1;
          point.visits.add(e.ip_address);
        }
      });

      // Update history objects
      history = Array.from(dayMap.values()).map(point => {
        const cfData = cfDailyMap.get(point.date) || { requests: 0 };
        return {
          date: point.date,
          requests: cfData.requests,
          views: point.views,
          visits: point.visits.size
        };
      });
    }

    const responseData = {
      requests: totalRequests,
      subrequests: totalSubrequests,
      views: views,
      visits: uniqueVisits,
      live_visitors: liveVisitors,
      pwa_installs: pwaInstalls,
      countries,
      devices,
      history
    };

    console.log('✅ Final Analytics Data prepared');

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('❌ Error in function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
