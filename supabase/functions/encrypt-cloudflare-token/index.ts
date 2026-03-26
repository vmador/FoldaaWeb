import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

async function encrypt(plaintext: string, key: string, userId: string): Promise<string> {
  try {
    console.log("🔐 Starting encryption process...")
    
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)
    
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const salt = encoder.encode(`foldaa-v2-2025-${userId}`)
    
    const cleanKey = key.trim()
    let keyBuffer = encoder.encode(cleanKey)
    if (/^[0-9a-fA-F]+$/.test(cleanKey) && cleanKey.length % 2 === 0) {
      keyBuffer = new Uint8Array(cleanKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    }

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    )

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    )

    const encryptedBytes = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      derivedKey,
      data
    )

    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')
    const encryptedHex = Array.from(new Uint8Array(encryptedBytes))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    
    const result = `${ivHex}:${encryptedHex}`
    
    console.log("✅ Encryption successful")
    return result
  } catch (error) {
    console.error("❌ Encryption failed:", error)
    throw new Error(`Encryption failed: ${error.message}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const ENCRYPTION_KEY = Deno.env.get("ENCRYPTION_KEY")
    if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY is not set")

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) throw new Error("Missing Authorization header")

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { api_token, account_id, zone_id } = await req.json()
    if (!api_token || !account_id) throw new Error("api_token and account_id are required")

    // Validation
    const accountResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account_id}`, {
      headers: { "Authorization": `Bearer ${api_token}`, "Content-Type": "application/json" }
    })
    if (!accountResponse.ok) throw new Error("Invalid Cloudflare credentials")
    const accountData = await accountResponse.json()
    const accountName = accountData.result?.name || null

    let zoneName = null
    if (zone_id) {
       const zoneResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone_id}`, {
         headers: { "Authorization": `Bearer ${api_token}`, "Content-Type": "application/json" }
       })
       if (zoneResponse.ok) {
         const zoneData = await zoneResponse.json()
         zoneName = zoneData.result?.name || null
       }
    }

    const encryptedToken = await encrypt(api_token, ENCRYPTION_KEY, user.id)
    
    const credentialsData = {
      user_id: user.id,
      encrypted_api_token: encryptedToken,
      account_id: account_id.trim(),
      zone_id: zone_id?.trim() || null,
      zone_name: zoneName || null,
      encryption_version: 'v2',
      updated_at: new Date().toISOString(),
    }

    const { error: dbError } = await supabaseClient.from("cloudflare_credentials").upsert(credentialsData, { onConflict: 'user_id' })
    if (dbError) throw dbError

    // Also update cloudflare_accounts for compatibility
    await supabaseClient.from("cloudflare_accounts").upsert({
        user_id: user.id,
        account_id: credentialsData.account_id,
        account_name: accountName,
        zone_id: credentialsData.zone_id,
        zone_name: credentialsData.zone_name,
        status: 'active',
        connected_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return new Response(JSON.stringify({ success: true, account_name: accountName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
