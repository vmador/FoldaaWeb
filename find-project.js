const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('apps/terminal-ui/.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL.trim(),
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()
);

async function findCurrentProject() {
  console.log("Finding last updated project...");
  // Assuming the user is working on the most recently updated project
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    console.error("Error finding project:", error);
    return;
  }

  const project = data[0];
  console.log(`Working on Project: ${project.name} (${project.id})`);

  const { data: integrations } = await supabase
    .from('project_integrations')
    .select('config, is_enabled, integration_types(name)')
    .eq('project_id', project.id);

  console.log("Integrations found:", integrations?.map(i => i.integration_types?.name) || 'none');
  
  const onesignal = integrations?.find(i => i.integration_types?.name === 'onesignal');
  if (onesignal) {
    console.log(`OneSignal Enabled: ${onesignal.is_enabled}`);
    console.log(`Config Keys: ${Object.keys(onesignal.config || {})}`);
    console.log(`App ID: ${onesignal.config.appId || onesignal.config.app_id}`);
  }
}

findCurrentProject();
