import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error("Unauthorized")

    const body = await req.json()
    const { domain } = body

    if (!domain || !domain.includes('.')) {
      throw new Error("Valid domain is required")
    }

    // Generate a unique token
    const token = `foldaa-verification=${crypto.randomUUID()}`

    // Insert or update verification record
    const { data, error } = await supabaseClient
      .from("domain_verifications")
      .upsert({
        user_id: user.id,
        domain: domain.toLowerCase(),
        token,
        status: "pending",
        verification_method: "dns"
      }, { onConflict: 'user_id, domain' })
      .select()
      .single()

    if (error) throw new Error(`Failed to claim domain: ${error.message}`)

    return new Response(JSON.stringify({ token, domain: data.domain }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    })
  }
})
