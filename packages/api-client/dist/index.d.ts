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
export declare class FoldaaClient {
    private supabase;
    private onTokenRefreshed?;
    constructor(options: {
        supabaseUrl: string;
        supabaseAnonKey: string;
        apiKey?: string;
        refreshToken?: string;
        onTokenRefreshed?: (data: {
            apiKey: string;
            refreshToken?: string;
        }) => void;
    });
    login(apiKey: string): Promise<void>;
    inspectWebsite(url: string): Promise<any>;
    createDraftProject(params: {
        name: string;
        type: 'url' | 'bundle';
        source: string;
    }): Promise<{
        projectId: string;
    }>;
    deployProject(params: any): Promise<any>;
    getProjects(): Promise<Project[]>;
    activateProject(projectId: string): Promise<any>;
    getAnalytics(projectId: string): Promise<AnalyticsData>;
    claimDomain(domain: string): Promise<{
        token: string;
    }>;
    verifyDomain(domain: string): Promise<{
        success: boolean;
    }>;
    launchProject(params: {
        projectId: string;
        domain: string;
    }): Promise<any>;
    wrap(url: string, onProgress?: (step: string) => void): Promise<Project>;
    redeployProject(projectId: string): Promise<any>;
}
