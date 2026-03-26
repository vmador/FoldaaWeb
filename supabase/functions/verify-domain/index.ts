import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const ENCRYPTION_KEY = Deno.env.get("ENCRYPTION_KEY")!

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

    const { domain } = await req.json()
    if (!domain) throw new Error("Domain is required")

    // Fetch the domain
    const { data: domainData, error: dbError } = await supabaseClient
      .from("domains")
      .select("*")
      .eq("domain_name", domain.toLowerCase())
      .single()

    if (dbError || !domainData) throw new Error("Domain not found in database")

    if (domainData.status === "verified") {
      return new Response(JSON.stringify({ success: true, message: "Already verified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (domainData.zone_id) {
      // Cloudflare Verification
      const { data: credentials } = await supabaseClient
        .from("cloudflare_credentials")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (!credentials) throw new Error("Cloudflare credentials missing")

      const apiToken = await decryptToken(credentials.encrypted_api_token, user.id)
      const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${domainData.zone_id}`, {
        headers: { "Authorization": `Bearer ${apiToken}` }
      })
      const cfData = await cfRes.json()

      if (cfData.result?.status === "active") {
        await supabaseClient.from("domains").update({ status: "verified" }).eq("id", domainData.id)
        return new Response(JSON.stringify({ success: true, message: "Verified via Cloudflare" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      } else {
        // Trigger activation check
        await fetch(`https://api.cloudflare.com/client/v4/zones/${domainData.zone_id}/activation_check`, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${apiToken}` }
        })
        throw new Error("Cloudflare zone is still pending. Try again in a few minutes.")
      }
    } else {
      throw new Error("Only Cloudflare automated domains are supported right now.")
    }

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    })
  }
})

async function decryptToken(encryptedToken: string, userId: string): Promise<string> {
  const parts = encryptedToken.split(":")
  if (parts.length !== 2) throw new Error("Invalid format: expected iv:cipher")
  const [ivHex, cipherHex] = parts
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map((byte: any) => parseInt(byte, 16)))
  const cipher = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map((byte: any) => parseInt(byte, 16)))
  const encoder = new TextEncoder()
  const masterKeys = [ENCRYPTION_KEY, Deno.env.get("INTEGRATION_ENCRYPTION_KEY")].filter(Boolean) as string[]
  const saltStrings = [`foldaa-v2-2025-${userId}`, userId, "cloudflare-api-token-salt", "foldaa-v2-2025"]

  for (const masterKey of masterKeys) {
    const keyMaterials = [{ name: "StringKey", data: encoder.encode(masterKey) }]
    if (/^[0-9a-fA-F]+$/.test(masterKey) && masterKey.length % 2 === 0) {
      keyMaterials.push({ name: "BinaryKey", data: new Uint8Array(masterKey.match(/.{1,2}/g)!.map(x => parseInt(x, 16))) })
    }
    for (const km of keyMaterials) {
      for (const saltStr of saltStrings) {
        try {
          const keyMaterial = await crypto.subtle.importKey("raw", km.data, { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"])
          const salt = encoder.encode(saltStr)
          const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"])
          const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher)
          const result = new TextDecoder().decode(dec)
          if (result) return result
        } catch (e) { continue }
      }
    }
  }
  throw new Error("Decryption failed")
}
