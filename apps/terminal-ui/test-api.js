async function test() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hueirgbgitrhqoopfxcu.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZWlyZ2JnaXRyaHFvb3BmeGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MzkxNDIsImV4cCI6MjA2NDIxNTE0Mn0.AnBtCG1lO3RYYSjxuE4qFbLu-f_WO8va2mrG1DApwM0';
  const jwt = 'eyJhbGciOiJIUzI1NiIsImtpZCI6Ii9iWTY0M2RqZzJvZWM5ZGUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2h1ZWlyZ2JnaXRyaHFvb3BmeGN1LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI4MDkwOTY4Yi1kMDFkLTQ5NzAtYTMxZC04MzdlMzU1NGIyYTkiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc0NTk1NTkxLCJpYXQiOjE3NzQ1OTE5OTEsImVtYWlsIjoiamVzdXNhYzE5OTJAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCIsImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTGp1WkZsb1FOY0hKeVY0Vmc3b3VTWlV5TXY1VG1ia0lEZ0NUNHFGdUhRSnVpNXk1WGI9czk2LWMiLCJkaXNwbGF5X25hbWUiOiJDaHV6IiwiZW1haWwiOiJqZXN1c2FjMTk5MkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZnVsbF9uYW1lIjoiSmVzw7pzIEFtYWRvciIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jTGp1WkZsb1FOY0hKeVY0Vmc3b3VTWlV5TXY1VG1ia0lEZ0NUNHFGdUhRSnVpNXk1WGI9czk2LWMiLCJwcm92aWRlcl9pZCI6IjExNjgzMjgyMDUyMjI3MjMzMDY4MiIsInN1YiI6IjExNjgzMjgyMDUyMjI3MjMzMDY4MiJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzc0NTkxOTkxfV0sInNlc3Npb25faWQiOiIyMWZkMmMyMS1kN2ZlLTRkM2YtYTlkNC00MTFjYzViNjFlM2QiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.mM6upTo90KKTqoJX-pEaDTCYQIxXRliYgtxKQsqJWm8';

  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const projectsRes = await fetch(`${url}/rest/v1/projects?select=id&limit=1`, { headers });
  const projects = await projectsRes.json();

  const typesRes = await fetch(`${url}/rest/v1/integration_types?name=eq.onesignal&select=id&limit=1`, { headers });
  const types = await typesRes.json();

  console.log("Projects:", projects);
  console.log("Types:", types);

  if (projects.length > 0 && types.length > 0) {
    const payload = {
      project_id: projects[0].id,
      integration_type_id: types[0].id,
      config: { appId: "test" },
      is_enabled: true
    };
    console.log("Attempting insert with payload:", payload);

    const insertRes = await fetch(`${url}/rest/v1/project_integrations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    const insertData = await insertRes.json();
    console.log("Insert Response:", insertRes.status, insertData);
  }
}

test();
