import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

async function checkDnsTxt(domain: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=_foldaa-challenge.${domain}&type=TXT`);
    if (!res.ok) return false;
    const data = await res.json();
    
    if (data.Answer && Array.isArray(data.Answer)) {
      for (const record of data.Answer) {
        if (record.data && record.data.includes(token)) {
          return true;
        }
      }
    }
  } catch (e) {
    console.error("DNS check failed", e);
  }
  return false;
}

async function checkHttp(domain: string, token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://${domain}/.well-known/foldaa.txt`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const text = await res.text();
      if (text.trim() === token) return true;
    }
  } catch (e) {
    console.error("HTTP check failed", e);
  }
  return false;
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

    if (!domain) throw new Error("Domain is required")

    // Fetch the pending verification
    const { data: verification, error: fetchError } = await supabaseClient
      .from("domain_verifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("domain", domain.toLowerCase())
      .single()

    if (fetchError || !verification) {
      throw new Error("No pending verification found for this domain. Run claim first.")
    }

    if (verification.status === "verified") {
      return new Response(JSON.stringify({ success: true, message: "Already verified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { token } = verification
    const isVerifiedDns = await checkDnsTxt(domain, token)
    const isVerifiedHttp = await checkHttp(domain, token)

    if (isVerifiedDns || isVerifiedHttp) {
      const now = new Date().toISOString()
      await supabaseClient
        .from("domain_verifications")
        .update({ status: "verified", verified_at: now, last_checked_at: now })
        .eq("id", verification.id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    } else {
      throw new Error(`DNS record not found. Please add a TXT record to _foldaa-challenge.${domain} with value: ${token}`)
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    })
  }
})
