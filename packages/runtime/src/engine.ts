export interface AppConfig {
    name: string;
    originUrl: string;
    extensions: {
        auth?: { enabled: boolean; provider: string };
        payments?: { enabled: boolean; provider: string };
        analytics?: { enabled: boolean };
    };
}

export class FoldaaEngine {
    private config: AppConfig;

    constructor(config: AppConfig) {
        this.config = config;
    }

    generatePipeline(): string[] {
        const pipeline: string[] = [];
        if (this.config.extensions.analytics?.enabled) pipeline.push('withAnalytics');
        if (this.config.extensions.auth?.enabled) pipeline.push('withAuth');
        pipeline.push('withProxy');
        return pipeline;
    }

    /**
     * Compiles the dynamic Cloudflare worker file (Returns string).
     * Runs inside the Supabase Edge Function to avoid client dependencies.
     */
    async buildWorker(): Promise<string> {
        const pipelineStr = this.generatePipeline().join(', ');

        const workerContent = `
import { withProxy } from './nodes/proxy';
import { withAuth } from './nodes/auth';
import { withAnalytics } from './nodes/analytics';
import { compose } from './utils';

const middlewares = [${pipelineStr}];
const appPipeline = compose(middlewares);

export default {
  async fetch(request, env, ctx) {
    return appPipeline(request, env, ctx);
  }
};
    `;

        return workerContent;
    }
}
