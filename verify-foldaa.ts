import { FoldaaCore } from './packages/core/src/index.js';
import { FoldaaClient } from './packages/api-client/src/index.js';

// Mock API Client to bypass external Supabase calls
class MockApiClient extends FoldaaClient {
  constructor() {
    super({ baseURL: 'http://mock', apiKey: 'mock-key' });
  }

  // We only mock the methods that might be called during inspection if any
  async extractBrandAssets(url: string) {
    return {
      name: 'Mock Site',
      icon: 'https://example.com/icon.png',
      socialPreview: '',
      metadata: {}
    };
  }

  async createDraftProject(params: any) {
    return { projectId: 'mock-project-id' };
  }

  async deployProject(params: any) {
    return {
      projectId: 'mock-project-id',
      url: 'https://verification-app.foldaa.com',
      createdAt: new Date().toISOString()
    };
  }
}

async function runVerification() {
  const targetUrl = 'https://example.com';
  console.log(`\n--- Starting Foldaa Verification for: ${targetUrl} ---`);

  const mockApi = new MockApiClient();
  const core = new FoldaaCore(mockApi as any);

  try {
    // 1. Test Inspection
    console.log('\n[1/3] Running Inspection Pipeline...');
    const inspection = await core.runInspection(targetUrl, {});

    console.log('✅ Inspection Successful!');
    console.log('Detected Properties:');
    console.log(` - Framework: ${inspection.framework || 'None'}`);
    console.log(` - Analytics: ${inspection.analytics.join(', ') || 'None'}`);
    console.log(` - Auth:      ${inspection.auth || 'None'}`);
    console.log(` - PWA:       ${inspection.pwa ? 'Enabled' : 'Disabled'}`);
    console.log(` - Title:      ${inspection.metadata.title}`);

    // 2. Test Worker Generation (Internal logic check)
    console.log('\n[2/3] Generating Edge Worker Bundle...');

    // We access the builders directly instead of the pipeline to avoid DeploymentService
    // which would try to hit Cloudflare/Supabase.

    // Inspect core's internal state to get the builders
    const coreInternal = core as any;
    const workerBuilder = coreInternal.workerBuilder;

    // Run the same logic as CreateProjectPipeline but skip deploymentService.deploy
    const pwaAssets = await coreInternal.pwaBuilderInstance.build(inspection);
    const workerBundle = await workerBuilder.build(targetUrl, inspection.framework || 'Unknown', pwaAssets);

    console.log('✅ Worker Generation Successful!');

    console.log('\n[3/3] Inspecting Generated Worker Code Snippet:');
    const codeSnippet = workerBundle.workerCode.substring(0, 300);
    console.log('--- START Worker JS ---');
    console.log(codeSnippet + '...');
    console.log('--- END Snippet ---');

    console.log('\n--- Verification Complete! ---');
    console.log('The system successfully analyzed the site and prepared the transformation layer.');

  } catch (error: any) {
    console.error('\n❌ Verification Failed!');
    console.error(`Error: ${error.message}`);
    console.error(error.stack);
  }
}

runVerification();
