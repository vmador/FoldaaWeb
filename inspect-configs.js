const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('apps/terminal-ui/.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL.trim(),
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()
);

async function inspectIntegration() {
  console.log("Inspecting OneSignal integrations...");
  const { data, error } = await supabase
    .from('project_integrations')
    .select('project_id, config, integration_types(name)')
    .eq('integration_types.name', 'onesignal');

  if (error) {
    console.error("DB Error:", error);
    return;
  }

  data.forEach(i => {
    console.log(`Project: ${i.project_id}`);
    console.log(`Config Keys: ${Object.keys(i.config || {})}`);
    // DO NOT print the actual keys for security, just preview prefix if safe
    const config = i.config || {};
    const key = config.restApiKey || config.apiKey || config.api_key || config.rest_api_key || '';
    console.log(`Key Prefix: ${key.substring(0, 10)}...`);
  });
}

inspectIntegration();
