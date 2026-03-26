// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

const SUPABASE_URL       = Deno.env.get("SUPABASE_URL")!
const SUPABASE_ANON_KEY  = Deno.env.get("SUPABASE_ANON_KEY")!
const ENCRYPTION_KEY     = Deno.env.get("ENCRYPTION_KEY")!
const FOLDAA_CF_TOKEN    = Deno.env.get("CLOUDFLARE_API_TOKEN")!
const FOLDAA_CF_ZONE_ID  = Deno.env.get("CLOUDFLARE_ZONE_ID")!
const FOLDAA_CF_ACCOUNT_ID = Deno.env.get("CLOUDFLARE_ACCOUNT_ID")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// ============================================================================
// RETRY HELPER
// ============================================================================
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 8,
  initialDelay: number = 2000
): Promise<T> {
  let lastError: any
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const errorMessage = (error as any)?.message || JSON.stringify(error)
      const isRateLimit = errorMessage.includes('code":971') || 
                         errorMessage.includes('throttling') ||
                         errorMessage.includes('rate limit')
      if (!isRateLimit || attempt === maxRetries - 1) throw error
      const delay = initialDelay * Math.pow(2, attempt)
      const jitter = Math.random() * 1000 
      const totalDelay = delay + jitter
      console.log(`⏳ Rate limit hit, retrying in ${Math.round(totalDelay)}ms (attempt ${attempt + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, totalDelay))
    }
  }
  throw lastError
}

// ============================================================================
// CLOUDFLARE API HELPER
// ============================================================================
async function cloudflareApiRequest(
  url: string,
  options: RequestInit,
  description: string
): Promise<any> {
  return await retryWithBackoff(async () => {
    console.log(`🌐 ${description}...`)
    const response = await fetch(url, options)
    const data = await response.json()
    if (data.errors?.some((e: any) => e.code === 971)) throw new Error(JSON.stringify(data.errors))
    if (!data.success && !data.errors?.some((e: any) => e.message?.includes("already exists"))) {
      throw new Error(`${description} failed: ${JSON.stringify(data.errors)}`)
    }
    return data
  })
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })

  let project_id: string | null = null
  let supabaseClient: any = null

  try {
    const bodyText = await req.text()
    const body = JSON.parse(bodyText)
    let { project_id: pid, project_data, images } = body
    
    console.log("🚀 DEPLOY-PROJECT STARTING for id:", pid)
    project_id = pid
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    })
    console.log("   Client initialized")
    
    // Get triggering user info
    const { data: { user: triggeringUser } } = await supabaseClient.auth.getUser()
    console.log("   Triggering user:", triggeringUser?.id)

    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single()
    if (projectError) throw new Error(`Project not found: ${projectError.message}`)
    console.log("   Project owner:", project.user_id)

    // Ensure project_data has all needed fields
    project_data = { ...project, ...(body.project_data || {}) }
    if (project.subdomain) project_data.subdomain = project.subdomain;

    // Try finding credentials for owner FIRST, then triggerer
    let credentials = null
    const ownerId = project.user_id
    const triggererId = triggeringUser?.id
    
    console.log(`🔍 Checking credentials. Owner: ${ownerId}, Triggerer: ${triggererId}`)
    
    const { data: ownerCreds } = await supabaseClient.from("cloudflare_credentials").select("*").eq("user_id", ownerId).single()
    
    if (ownerCreds) {
      credentials = ownerCreds
      console.log(`   ✅ Found credentials for owner (${ownerId})`)
    } else if (triggererId && triggererId !== ownerId) {
      const { data: triggererCreds } = await supabaseClient.from("cloudflare_credentials").select("*").eq("user_id", triggererId).single()
      if (triggererCreds) {
        credentials = triggererCreds
        console.log(`   ✅ Found credentials for triggerer (${triggererId})`)
      }
    }

    if (!credentials) {
      const dbStatus = `Owner had creds: ${!!ownerCreds}, Triggerer had creds: ${!!triggererId}. Search IDs: ${ownerId}, ${triggererId}`
      console.error(`❌ ${dbStatus}`)
      throw new Error(`Cloudflare credentials not found. ${dbStatus}`)
    }

    console.log("🔐 Decrypting user token...")
    // Try exhaustive decryption with all possible IDs as salts
    const possibleSalts = [ownerId]
    if (triggererId) possibleSalts.push(triggererId)
    if (credentials.user_id && !possibleSalts.includes(credentials.user_id)) possibleSalts.push(credentials.user_id)
    
    console.log(`   Trying salts: ${possibleSalts.join(", ")}`)

    let userApiToken = ""
    let lastError = ""
    for (const saltId of possibleSalts) {
      try {
        userApiToken = await decryptToken(credentials.encrypted_api_token, saltId)
        if (userApiToken) break
      } catch (e) { 
        lastError = e.message
        continue 
      }
    }

    if (!userApiToken) {
       const failMsg = `Decryption failed. Salts tried: ${possibleSalts.length}. Creds row user_id: ${credentials.user_id}. Last error: ${lastError}`
       console.error(`❌ ${failMsg}`)
       throw new Error(failMsg)
    }

    console.log("✅ Token decrypted successfully")
    const accountId   = credentials.account_id
    const userZoneId   = credentials.zone_id
    const userZoneName = credentials.zone_name

    const routeZoneId = userZoneId || FOLDAA_CF_ZONE_ID
    const routeToken  = userZoneId ? userApiToken : FOLDAA_CF_TOKEN
    const deployToken = userZoneId ? userApiToken : FOLDAA_CF_TOKEN
    const deployAccountId = userZoneId ? accountId : FOLDAA_CF_ACCOUNT_ID
    const routeHost   = userZoneId ? `${project_data.subdomain}.${userZoneName}` : `${project_data.subdomain}.foldaa.com`

    const workerName = `pwa-${project_data.subdomain}`
    const kvNamespaceName = `pwa-kv-${project_data.subdomain}`

    // 🔍 FIND KV NAMESPACE (WITH LARGE PAGINATION)
    const listKvData = await cloudflareApiRequest(
      `https://api.cloudflare.com/client/v4/accounts/${deployAccountId}/storage/kv/namespaces?per_page=100`, 
      { headers: { Authorization: `Bearer ${deployToken}` } }, 
      "List KV"
    )
    let kvNamespaceId = listKvData.result?.find((ns: any) => ns.title === kvNamespaceName)?.id

    // ➕ CREATE IF MISSING
    if (!kvNamespaceId) {
      try {
        const kvData = await cloudflareApiRequest(`https://api.cloudflare.com/client/v4/accounts/${deployAccountId}/storage/kv/namespaces`, {
          method: "POST", headers: { Authorization: `Bearer ${deployToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ title: kvNamespaceName }),
        }, "Create KV")
        kvNamespaceId = kvData.result?.id
      } catch (err: any) {
        // If it was just a conflict, try to find it one last time (maybe on another page or just registered)
        if (err.message?.includes("already exists")) {
           const retryList = await cloudflareApiRequest(
             `https://api.cloudflare.com/client/v4/accounts/${deployAccountId}/storage/kv/namespaces?per_page=100`, 
             { headers: { Authorization: `Bearer ${deployToken}` } }, 
             "Retry List KV"
           )
           kvNamespaceId = retryList.result?.find((ns: any) => ns.title === kvNamespaceName)?.id
        } else {
           throw err;
        }
      }
    }

    if (!kvNamespaceId) {
      console.error(`❌ KV Namespace ID could not be determined for: ${kvNamespaceName}`)
      throw new Error(`Cloudflare KV error: Could not find or create namespace '${kvNamespaceName}'. If you have more than 100 namespaces, please delete some or contact support.`)
    }
    
    console.log(`✅ KV Namespace ready: ${kvNamespaceId}`)

    // Asset Upload
    if (images) {
      for (const [filename, imageData] of Object.entries(images)) {
        if (!imageData) continue
        const body = (imageData as string).startsWith("data:") ? 
            new Uint8Array(atob((imageData as string).split(",")[1]).split("").map(c => c.charCodeAt(0))) :
            null;
        if (body) {
          await fetch(`https://api.cloudflare.com/client/v4/accounts/${deployAccountId}/storage/kv/namespaces/${kvNamespaceId}/values/images/${filename}`, {
            method: "PUT", headers: { Authorization: `Bearer ${deployToken}` }, body
          })
        }
      }
    }

    const workerScript = generateWorkerScript(project_data, kvNamespaceId!, project_id!)
    const formData = new FormData()
    formData.append("metadata", JSON.stringify({ body_part: "script", bindings: [{ type: "kv_namespace", name: "PWA_KV", namespace_id: kvNamespaceId }] }))
    formData.append("script", new Blob([workerScript], { type: "application/javascript" }))

    await cloudflareApiRequest(`https://api.cloudflare.com/client/v4/accounts/${deployAccountId}/workers/scripts/${workerName}`, {
      method: "PUT", headers: { Authorization: `Bearer ${deployToken}` }, body: formData
    }, "Deploy Worker")

    await cloudflareApiRequest(`https://api.cloudflare.com/client/v4/zones/${routeZoneId}/workers/routes`, {
      method: "POST", headers: { Authorization: `Bearer ${routeToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ pattern: `${routeHost}/*`, script: workerName }),
    }, "Create Route").catch(err => {
      // Ignore if it already exists
      if (!err.message?.includes("already exists") && !err.message?.includes("10020")) throw err;
    })

    console.log("   Fetching custom domain routes...")
    const { data: customRoutes } = await supabaseClient
      .from("domain_routes")
      .select(`
        pattern,
        domains (
          domain_name,
          zone_id
        )
      `)
      .eq("project_id", project_id)
      .eq("is_enabled", true)
    
    if (customRoutes && customRoutes.length > 0) {
      console.log(`   Found ${customRoutes.length} custom route(s). Attaching...`)
      for (const route of customRoutes) {
        if (!route.domains?.zone_id || !route.domains?.domain_name) continue

        const cleanPattern = route.pattern.endsWith("/") ? route.pattern + "*" : route.pattern + "/*"
        const cfPattern = `${route.domains.domain_name}${cleanPattern}`

        try {
          await cloudflareApiRequest(`https://api.cloudflare.com/client/v4/zones/${route.domains.zone_id}/workers/routes`, {
            method: "POST", headers: { Authorization: `Bearer ${userApiToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ pattern: cfPattern, script: workerName }),
          }, `Create Custom Route (${cfPattern})`)
        } catch (err: any) {
           if (!err.message?.includes("already exists") && !err.message?.includes("10020")) {
              console.error(`❌ Failed to bind ${cfPattern}:`, err.message)
           }
        }
      }
    }

    await supabaseClient.from("projects").update({ deployment_status: 'deployed', last_deployed_at: new Date().toISOString() }).eq("id", project_id)

    return new Response(JSON.stringify({ success: true, worker_url: `https://${routeHost}` }), { headers: { "Content-Type": "application/json", ...corsHeaders } })
  } catch (error: any) {
    const errorDetails = error.stack || error.message || JSON.stringify(error)
    console.error("🚀 DEPLOY-PROJECT CRASHED:", errorDetails);
    
    // Return a more descriptive error body so the frontend can see what happened
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: errorDetails,
      phase: "deployment_execution" 
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", ...corsHeaders } 
    })
  }
})

async function decryptToken(encryptedToken: string, userId: string): Promise<string> {
  const parts = encryptedToken.split(":")
  if (parts.length !== 2) throw new Error("Invalid format: expected iv:cipher")
  const [ivHex, cipherHex] = parts
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  const cipher = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  const encoder = new TextEncoder()
  
  console.log(`🔍 Starting exhaustive decryption for ${parts[0].substring(0,8)}...`)
  
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
          if (result) {
            console.log(`✅ Success with ${km.name} and salt ${saltStr.substring(0,10)}...`)
            return result
          }
        } catch (e) { 
           // console.log(`   Failed with ${km.name} and ${saltStr.substring(0,10)}...: ${e.message}`)
           continue 
        }
      }
    }
  }
  
  const errorMsg = `Decryption failed after trying all combinations. Key count: ${masterKeys.length}, Salt count: ${saltStrings.length}. Last tried key format: ${masterKeys[0]?.length} chars.`
  console.error(`❌ ${errorMsg}`)
  throw new Error(errorMsg)
}

function generateWorkerScript(projectData: any, kvId: string, projectId: string): string {
  const safeUrl = (projectData.original_url || '').replace(/'/g, "\\'")
  const themeColor = projectData.theme_color || '#000000'
  const backgroundColor = projectData.background_color || '#ffffff'
  
  const manifestJsonObject = {
    name: projectData.name || 'Foldaa App',
    short_name: projectData.name?.split(' ')[0] || 'App',
    id: '/', start_url: '/', scope: '/', display: 'standalone',
    background_color: backgroundColor, theme_color: themeColor,
    icons: [
      { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  };

  const ignoreSafeCssString = projectData.ignore_safe_area ? 
      '<style>' +
      ':root { --framer-safe-area-inset-top: 0px !important; --framer-safe-area-inset-bottom: 0px !important; --viewport-height: 100dvh; }' +
      'html, body { margin: 0; padding: 0; width: 100%; height: 100%; min-height: 100vh; min-height: -webkit-fill-available; }' +
      'html, body, #main { padding-top: 0px !important; margin-top: 0px !important; }' +
      '#main > div { padding-top: 0px !important; margin-top: 0px !important; }' +
      '#main > div > div:first-child { padding-top: 0px !important; margin-top: 0px !important; }' +
      '</style>' +
      '<script>' +
      '  const setupPWA = () => {' +
      '     document.documentElement.style.cssText = "height:100%;min-height:-webkit-fill-available;margin:0;padding:0;width:100%;";' +
      '     document.body.style.cssText = "height:100%;min-height:-webkit-fill-available;margin:0;padding:0;width:100%;";' +
      '     const main = document.getElementById("main");' +
      '     if (main) {' +
      '       main.style.setProperty("padding-top", "0px", "important");' +
      '       if (main.firstElementChild) {' +
      '         main.firstElementChild.style.setProperty("padding-top", "0px", "important");' +
      '       }' +
      '     }' +
      '  };' +
      '  document.addEventListener("DOMContentLoaded", setupPWA);' +
      '  setupPWA();' +
      '</script>' : '';
      
  const isIgnoreSafeArea = projectData.ignore_safe_area ? 'true' : 'false';
  const viewportFit = projectData.ignore_safe_area ? 'cover' : 'contain';

  return `
addEventListener('fetch', event => { event.respondWith(handleRequest(event.request)) })

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  if (path === "/manifest.json") {
    return new Response(JSON.stringify(${JSON.stringify(manifestJsonObject)}), {
      headers: { "Content-Type": "application/manifest+json", "Access-Control-Allow-Origin": "*" }
    });
  }

  if (path === "/sw.js") {
    return new Response("self.addEventListener('fetch', e => {});", { headers: { "Content-Type": "application/javascript" } });
  }

  if (path === "/pwa-icon-192.png" || path === "/pwa-icon-512.png") {
    const is192 = path.includes("192");
    const buster = "${projectData.brand_assets_updated_at ? '?t=' + new Date(projectData.brand_assets_updated_at).getTime() : ''}";
    const iconUrl = (is192 
      ? "${projectData.icon_192_url || projectData.logo_url || projectData.favicon_url || ''}" 
      : "${projectData.icon_512_url || projectData.logo_url || projectData.favicon_url || ''}") + buster;
    if (iconUrl) {
       try {
         const res = await fetch(iconUrl);
         if (res.ok) return new Response(res.body, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000" } });
       } catch (e) {}
    }
    return fetch("https://hueirgbgitrhqoopfxcu.supabase.co/storage/v1/object/public/branding/default-icon-192.png");
  }

  const response = await fetch("${safeUrl}" + url.pathname + url.search);
  const ct = (response.headers.get("Content-Type") || "").toLowerCase();

  if (ct.includes("text/html")) {
    let h = await response.text();
    
    // Remove existing viewport and theme-color meta tags
    h = h.replace(/<meta[^>]*name=["']?viewport["']?[^>]*>/gi, '');
    h = h.replace(/<meta[^>]*name=["']?theme-color["']?[^>]*>/gi, '');

    // Strip out env() safe areas if ignoring safe area
    if (${isIgnoreSafeArea}) {
        h = h.replace(/env\\(\\s*safe-area-inset-(top|right|bottom|left)\\s*\\)/ig, '0px');
    }

    const meta = \`
      <link rel="manifest" href="/manifest.json">
      <link rel="apple-touch-icon" href="/pwa-icon-192.png">
      <meta name="theme-color" content="${themeColor}">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=${viewportFit}">
      ${ignoreSafeCssString}
      <style>body, #main { background-color: ${backgroundColor} !important; }</style>
      <script>if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }</script>
    \`;
    return new Response(h.replace(new RegExp("</head>", "i"), meta + "</head>"), {
       headers: { ...Object.fromEntries(response.headers.entries()), "X-Foldaa-PWA": "v180" }
    });
  }
  return response;
}
`
}
