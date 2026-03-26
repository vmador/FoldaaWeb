Deno.serve(async (req) => { return new Response(JSON.stringify(Deno.env.toObject()), { headers: { "Content-Type": "application/json" } }) })
