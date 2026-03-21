/**
 * Verification script for Project Branding and Deployment
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testBranding(url: string) {
  console.log(`\n🔍 Testing branding for: ${url}`);
  try {
    const { data, error } = await supabase.functions.invoke('inspect-website', {
      body: { url }
    });

    if (error) {
      console.error(`❌ Inspection failed: ${error.message}`);
      return;
    }

    console.log(`✅ Title: ${data.title}`);
    console.log(`✅ Favicon: ${data.assets.icons.favicon}`);
    console.log(`✅ Assets keys: ${Object.keys(data.assets).join(', ')}`);
    console.log(`✅ Site Name: ${data.assets.siteName}`);
    console.log(`✅ Domain: ${data.assets.domain}`);
    
    if (data.assets.icons.icon192 && data.assets.icons.icon192.includes('manifest')) {
      console.log('✅ Found icons from manifest!');
    }
  } catch (e) {
    console.error(`❌ Error testing ${url}:`, e);
  }
}

async function main() {
  const testUrls = [
    'https://google.com',
    'https://github.com',
    'https://foldaa.com',
    'https://olgas.framer.website'
  ];

  for (const url of testUrls) {
    await testBranding(url);
  }
}

main();
