const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read directly from .env.local in apps/terminal-ui
const envFile = fs.readFileSync('apps/terminal-ui/.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => l.split('=')));

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL.trim(),
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()
);

async function checkRecentBroadcasts() {
  console.log("Fetching last 5 broadcasts...");
  const { data, error } = await supabase
    .from('broadcast_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("DB Error:", error);
    return;
  }

  console.log("Recent Broadcasts:");
  data.forEach(b => {
    console.log(`- ID: ${b.id} | Status: ${b.status} | Recipients: ${b.recipients_count} | Error: ${JSON.stringify(b.error_details || 'none')}`);
  });
}

checkRecentBroadcasts();
