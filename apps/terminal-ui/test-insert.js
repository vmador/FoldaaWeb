const { createClient } = require('@supabase/supabase-js')

async function test() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: types } = await supabase.from('integration_types').select('id').limit(1)
  const { data: projects } = await supabase.from('projects').select('id').limit(1)
  
  if (!types || !projects || !types[0] || !projects[0]) {
    console.log('No types or projects')
    return
  }
  
  const { data, error } = await supabase.from('project_integrations').insert({
    project_id: projects[0].id,
    integration_type_id: types[0].id,
    config: { appId: "test" },
    is_enabled: true
  }).select()
  
  if (error) {
    console.error("DB Error:", JSON.stringify(error, null, 2))
  } else {
    console.log("Success:", data)
  }
}
test()
