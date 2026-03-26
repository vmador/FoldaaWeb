import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const ENCRYPTION_KEY = Deno.env.get("ENCRYPTION_KEY")!

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    })

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error("Unauthorized")

    const { domain, domain_id } = await req.json()
    if (!domain || !domain_id) throw new Error("Domain and Domain ID are required")

    console.log(`🚀 Automated DNS setup for ${domain} (ID: ${domain_id})`)

    // 2. Get Cloudflare Credentials
    const { data: credentials, error: cError } = await supabaseClient
      .from("cloudflare_credentials")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (cError || !credentials) {
      throw new Error("Cloudflare credentials not found. Please connect your Cloudflare account first.")
    }

    // 3. Decrypt Token
    const apiToken = await decryptToken(credentials.encrypted_api_token, user.id)
    const accountId = credentials.account_id

    // 4. Find Zone ID or Create Zone
    let zoneId: string | undefined = undefined
    let nameServers: string[] = []
    const rootDomain = domain.split('.').slice(-2).join('.')

    console.log(`🔍 Searching Zone ID for ${rootDomain}...`)
    const zoneRes = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${rootDomain}`, {
      headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" }
    })
    const zoneData = await zoneRes.json()
    zoneId = zoneData.result?.[0]?.id
    nameServers = zoneData.result?.[0]?.name_servers || []

    // If zone doesn't exist, CREATE it
    if (!zoneId) {
      console.log(`➕ Zone not found. Creating Cloudflare zone for ${rootDomain}...`)
      const createRes = await fetch(`https://api.cloudflare.com/client/v4/zones`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rootDomain,
          account: { id: credentials.account_id },
          type: "full"
        })
      })
      const createData = await createRes.json()
      if (!createData.success) {
         throw new Error(`Failed to create Cloudflare zone: ${JSON.stringify(createData.errors)}`)
      }
      zoneId = createData.result.id
      nameServers = createData.result.name_servers || []
      console.log(`✅ Zone created. Nameservers: ${nameServers.join(", ")}`)

    } else {
      // Zone exists, get full details to fetch nameservers if needed
      if (nameServers.length === 0) {
        const nsRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, {
          headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" }
        })
        const nsData = await nsRes.json()
        nameServers = nsData.result?.name_servers || []
      }
    }

    // 5. Create DNS Records
    console.log(`📝 Creating DNS records in Zone ${zoneId}...`)

    // A Record
    await createOrUpdateDnsRecord(zoneId, apiToken, {
      type: "A",
      name: domain,
      content: "76.76.21.21",
      proxied: true
    })

    // Update Domain record with zone_id
    await supabaseClient.from("domains").update({
      zone_id: zoneId,
      status: "pending"
    }).eq("id", domain_id)

    return new Response(JSON.stringify({ 
      success: true, 
      message: "DNS records created successfully",
      name_servers: nameServers 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err: any) {
    console.error("❌ DNS Setup Failed:", err.message)
    return new Response(JSON.stringify({ success: false, error: err.message, stack: err.stack }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    })
  }
})

async function createOrUpdateDnsRecord(zoneId: string, token: string, record: any) {
  // Check if exists
  const listRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${record.name}&type=${record.type}`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const listData = await listRes.json()
  const existing = listData.result?.[0]

  const method = existing ? "PUT" : "POST"
  const url = existing 
    ? `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existing.id}`
    : `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`

  const res = await fetch(url, {
    method,
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(record)
  })
  
  const data = await res.json()
  if (!data.success) {
    throw new Error(`Cloudflare DNS error: ${JSON.stringify(data.errors)}`)
  }
  return data.result
}

async function decryptToken(encryptedToken: string, userId: string): Promise<string> {
  const parts = encryptedToken.split(":")
  if (parts.length !== 2) throw new Error("Invalid format: expected iv:cipher")
  const [ivHex, cipherHex] = parts
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map((byte: any) => parseInt(byte, 16)))
  const cipher = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map((byte: any) => parseInt(byte, 16)))
  const encoder = new TextEncoder()
  
  const masterKeys = [
    Deno.env.get("ENCRYPTION_KEY"),
    Deno.env.get("INTEGRATION_ENCRYPTION_KEY"),
    "01c56479d6f2ec59347b0156c2a8f8ab7148195b4dcbf6aa0e83f7204dd26f51",
    "c871130c55c8dad596a9ec95c68b346b05025ecda658978ca75a3118a70ae6cc"
  ].filter(Boolean) as string[]
  
  const saltStrings = [
    `foldaa-v2-2025-${userId}`,
    userId,
    "cloudflare-api-token-salt",
    "foldaa-v2-2025"
  ]

  for (const masterKey of masterKeys) {
    const keyMaterials = [
      { name: "StringKey", data: encoder.encode(masterKey) }
    ]
    if (/^[0-9a-fA-F]+$/.test(masterKey) && masterKey.length % 2 === 0) {
      keyMaterials.push({ name: "BinaryKey", data: new Uint8Array(masterKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))) })
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
        } catch (e) { 
           continue 
        }
      }
    }
  }
  
  throw new Error("Decryption failed after trying all combinations.")
}
