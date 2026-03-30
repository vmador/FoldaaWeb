const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: 'apps/terminal-ui/.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
async function test() {
  const { data: types } = await supabase.from('integration_types').select('*').limit(1)
  const { data: projects } = await supabase.from('projects').select('*').limit(1)
  console.log("Types:", types?.length, "Projects:", projects?.length)
  if (!types || !projects || !types.length || !projects.length) return;
  const { data, error } = await supabase.from('project_integrations').insert({
    project_id: projects[0].id,
    integration_type_id: types[0].id,
    config: { appId: "test" },
    is_enabled: true
  }).select()
  console.log("Insert result:", { data, error })
}
test()
