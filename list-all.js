const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('apps/terminal-ui/.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL.trim(),
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()
);

async function listAll() {
  console.log("Listing all project integrations...");
  const { data, error } = await supabase
    .from('project_integrations')
    .select('project_id, is_enabled, integration_types(name)');

  if (error) {
    console.error("DB Error:", error);
    return;
  }

  data.forEach(i => {
    console.log(`Project: ${i.project_id} | Type: ${i.integration_types?.name} | Enabled: ${i.is_enabled}`);
  });
}

listAll();
