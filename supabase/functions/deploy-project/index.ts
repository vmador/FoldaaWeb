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
// EVENT TRACKING HELPER
// ============================================================================
async function trackEvent(supabaseClient: any, data: any): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from('project_events')
      .insert({
        project_id: data.project_id,
        event_type: data.event_type,
        user_agent: data.user_agent,
        metadata: data.metadata || {}
      })
    return !error
  } catch (error) {
    return false
  }
}

// ============================================================================
// CLOUDFLARE API HELPERS
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
    
    console.log(`🚀 Deployment requested for project: ${pid}`)
    console.log(`📦 Project Data: ${JSON.stringify(project_data, null, 2)}`)

    project_id = pid

    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    })
    
    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single()
    if (projectError) throw new Error(`Project not found: ${projectError.message}`)

    console.log(`🔍 DB Project Record: name="${project.name}", subdomain="${project.subdomain}"`)
    console.log(`🔍 Request Body manifest: ${JSON.stringify(body.manifest)}`)
    console.log(`🔍 Request Body project_data: ${JSON.stringify(body.project_data)}`)

    // Merge provided project_data with existing project data from DB 
    // to preserve all missing fields during a Redeploy.
    // CRITICAL: Preserve existing subdomain to prevent URL changes on redeploy.
    const existingSubdomain = project.subdomain;
    const existingName      = project.name;

    project_data = {
        ...project,
        ...(body.manifest ? {
            name: body.manifest.name || existingName || 'app',
            subdomain: existingSubdomain || (body.manifest.name || existingName || 'app').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            original_url: body.manifest.url || project.original_url || ''
        } : {}),
        ...(body.project_data || {})
    }

    // Secondary enforcement: if we have an existing subdomain in DB, ALWAYS use it
    if (existingSubdomain) {
        console.log(`✅ Locking subdomain to: ${existingSubdomain}`)
        project_data.subdomain = existingSubdomain;
    }
    
    // Also preserve name from DB if body didn't explicitly provide a new one
    if (existingName && !body.project_data?.name && !body.manifest?.name) {
        console.log(`✅ Preserving name from DB: ${existingName}`)
        project_data.name = existingName;
    }

    console.log(`🚀 Resulting Project Data: name="${project_data.name}", subdomain="${project_data.subdomain}"`)

    const { data: credentials, error: credError } = await supabaseClient
      .from("cloudflare_credentials")
      .select("*")
      .eq("user_id", project.user_id)
      .single()
    if (credError || !credentials) throw new Error("Cloudflare credentials not found")

    const userApiToken = await decryptToken(credentials.encrypted_api_token, project.user_id)
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

    console.log("📦 Resolving KV namespace...")
    const listKvData = await cloudflareApiRequest(
      `https://api.cloudflare.com/client/v4/accounts/${deployAccountId}/storage/kv/namespaces`,
      { headers: { Authorization: `Bearer ${deployToken}` } },
      "Listing KV namespaces"
    )

    let kvNamespaceId: string | undefined
    console.log(`🔍 Checking for existing KV namespace: ${kvNamespaceName}`)
    const existingKv = listKvData.result?.find((ns: any) => ns.title === kvNamespaceName)

    if (existingKv) {
      console.log(`✅ Found existing KV: ${existingKv.id}`)
      kvNamespaceId = existingKv.id
    } else {
      console.log(`🆕 KV not found in first ${listKvData.result?.length || 0} results. Creating...`)
      const kvData = await cloudflareApiRequest(
        `https://api.cloudflare.com/client/v4/accounts/${deployAccountId}/storage/kv/namespaces`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${deployToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ title: kvNamespaceName }),
        },
        "Creating KV namespace"
      )
      console.log(`📦 KV creation response success: ${kvData.success}`)
      kvNamespaceId = kvData.result?.id
      if (!kvNamespaceId && !kvData.success) {
         console.log("🔄 KV already exists but was not in the first page. Searching all...")
         // Try to find it in the list again, maybe with a filter or just log more
         const retryList = await cloudflareApiRequest(`https://api.cloudflare.com/client/v4/accounts/${deployAccountId}/storage/kv/namespaces?per_page=100`, { headers: { Authorization: `Bearer ${deployToken}` } }, "Listing retry")
         console.log(`🔍 Retry list count: ${retryList.result?.length || 0}`)
         kvNamespaceId = retryList.result?.find((n: any) => n.title === kvNamespaceName)?.id
      }
      if (!kvNamespaceId) throw new Error("Failed to resolve KV namespace ID")
    }

    // ── Image Upload ─────────────────────────────────────────
    if (images && typeof images === 'object') {
      console.log("📤 Uploading assets...")
      for (const [filename, imageData] of Object.entries(images)) {
        const imageContent = imageData as string
        if (!imageContent) continue
        
        const kvKey = `images/${filename}`
        let body: Uint8Array | null = null
        let contentType = "image/png"

        if (imageContent.startsWith("http")) {
          try {
            const imgRes = await fetch(imageContent, { headers: { 'User-Agent': 'Mozilla/5.0' } })
            if (imgRes.ok) {
              body = new Uint8Array(await imgRes.arrayBuffer())
              contentType = imgRes.headers.get("content-type") || "image/png"
            }
          } catch (e) { console.error("Fetch error", e) }
        } else if (imageContent.startsWith("data:")) {
          try {
            const parts = imageContent.split(",")
            if (parts.length === 2) {
               contentType = (parts[0].match(/data:(.*?);/) || [])[1] || "image/png"
               const binaryString = atob(parts[1])
               body = new Uint8Array(binaryString.length)
               for (let j = 0; j < binaryString.length; j++) body[j] = binaryString.charCodeAt(j)
            }
          } catch (e) { console.error("Data URL error", e) }
        } else {
          try {
             const binaryString = atob(imageContent)
             body = new Uint8Array(binaryString.length)
             for (let j = 0; j < binaryString.length; j++) body[j] = binaryString.charCodeAt(j)
          } catch (e) { /* skip */ }
        }

        if (body) {
          await retryWithBackoff(async () => {
             await cloudflareApiRequest(`https://api.cloudflare.com/client/v4/accounts/${deployAccountId}/storage/kv/namespaces/${kvNamespaceId}/values/${kvKey}`, {
               method: "PUT",
               headers: { Authorization: `Bearer ${deployToken}`, "Content-Type": contentType },
               body: body as any
             }, "Uploading asset")
          })
        }
      }
    }

    const workerScript = generateWorkerScript(project_data, kvNamespaceId!, project_id!)
    const formData = new FormData()
    formData.append("metadata", JSON.stringify({
      body_part: "script",
      bindings: [{ type: "kv_namespace", name: "PWA_KV", namespace_id: kvNamespaceId }],
    }))
    formData.append("script", new Blob([workerScript], { type: "application/javascript" }))

    await cloudflareApiRequest(`https://api.cloudflare.com/client/v4/accounts/${deployAccountId}/workers/scripts/${workerName}`, {
      method: "PUT", headers: { Authorization: `Bearer ${deployToken}` }, body: formData
    }, "Deploying Worker")

    const routePattern = `${routeHost}/*`
    await cloudflareApiRequest(`https://api.cloudflare.com/client/v4/zones/${routeZoneId}/workers/routes`, {
      method: "POST", headers: { Authorization: `Bearer ${routeToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ pattern: routePattern, script: workerName }),
    }, "Creating Route")

    // ── Update Project Record ───────────────────────────────
    console.log("📝 Updating project record with branding...")
    const projectUpdate = {
      subdomain: project_data.subdomain,
      worker_url: `https://${routeHost}`,
      status: "active",
      deployment_status: 'deployed',
      last_deployed_at: new Date().toISOString(),
      // Branding assets from project_data
      favicon_url: project_data.favicon_url || null,
      apple_touch_icon_url: project_data.apple_touch_icon_url || null,
      icon_192_url: project_data.icon_192_url || null,
      icon_512_url: project_data.icon_512_url || null,
      og_image_url: project_data.og_image_url || null,
      og_title: project_data.og_title || project_data.name || null,
      og_description: project_data.og_description || project_data.app_description || null,
      theme_color_extracted: project_data.theme_color_extracted || null,
      background_color_extracted: project_data.background_color_extracted || null,
      brand_assets_updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabaseClient
      .from("projects")
      .update(projectUpdate)
      .eq("id", project_id)
    
    if (updateError) console.error("⚠️ Failed to update project branding:", updateError.message)

    // ── Sync project_images ───────────────────────────────
    console.log("🖼️ Syncing project images...")
    const imageRecords = []
    if (project_data.favicon_url) imageRecords.push({ project_id, image_type: 'favicon', image_url: project_data.favicon_url })
    if (project_data.apple_touch_icon_url) imageRecords.push({ project_id, image_type: 'apple-touch-icon', image_url: project_data.apple_touch_icon_url })
    if (project_data.icon_192_url) imageRecords.push({ project_id, image_type: 'icon-192', image_url: project_data.icon_192_url })
    if (project_data.icon_512_url) imageRecords.push({ project_id, image_type: 'icon-512', image_url: project_data.icon_512_url })
    if (project_data.og_image_url) imageRecords.push({ project_id, image_type: 'og-image', image_url: project_data.og_image_url })
    
    if (imageRecords.length > 0) {
      const { error: imagesError } = await supabaseClient
        .from('project_images')
        .upsert(imageRecords, { onConflict: 'project_id,image_type' })
      if (imagesError) console.error("⚠️ Failed to sync project images:", imagesError.message)
    }

    return new Response(JSON.stringify({ success: true, worker_url: `https://${routeHost}` }), { headers: { "Content-Type": "application/json", ...corsHeaders } })
  } catch (error: any) {
    console.error("❌ Error:", error)
    if (project_id && supabaseClient) await supabaseClient.from("projects").update({ status: "error", error_message: error.message }).eq("id", project_id)
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } })
  }
})

async function decryptToken(encryptedToken: string, userId: string): Promise<string> {
  const parts = encryptedToken.split(":")
  if (parts.length !== 2) throw new Error("Invalid format")
  const [ivHex, cipherHex] = parts
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  const cipher = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  const encoder = new TextEncoder()
  const saltVersions = [`foldaa-v2-2025-${userId}`, userId, "cloudflare-api-token-salt"]

  for (const saltStr of saltVersions) {
    try {
      const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(ENCRYPTION_KEY), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"])
      const salt = encoder.encode(saltStr)
      const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"])
      const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher)
      return new TextDecoder().decode(dec)
    } catch (e) { continue }
  }
  throw new Error("Decryption failed")
}

function generateWorkerScript(projectData: any, kvId: string, projectId: string): string {
  const safeUrl = (projectData.original_url || '').replace(/'/g, "\\'")
  const name = (projectData.name || 'Foldaa App').replace(/'/g, "\\'")
  const themeColor = projectData.theme_color || '#000000'
  const backgroundColor = projectData.background_color || '#ffffff'
  const description = (projectData.app_description || 'Deployed with Foldaa').replace(/'/g, "\\'")
  
  // PWA Manifest Definition
  const manifest = {
    name: projectData.name || 'Foldaa App',
    short_name: projectData.name?.split(' ')[0] || 'App',
    description: projectData.app_description || 'Deployed with Foldaa',
    start_url: '/',
    display: 'standalone',
    background_color: backgroundColor,
    theme_color: themeColor,
    icons: [
      { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  }

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
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Serve Manifest
  if (url.pathname === "/manifest.json") {
    return new Response(JSON.stringify(${JSON.stringify(manifest)}), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  // Serve Icons
  if (url.pathname === "/pwa-icon-192.png") {
    const data = await PWA_KV.get("images/icon-192x192.png", { type: "arrayBuffer" });
    return data ? new Response(data, { headers: { "Content-Type": "image/png" } }) : fetch("${safeUrl}/favicon.ico");
  }
  if (url.pathname === "/pwa-icon-512.png") {
    const data = await PWA_KV.get("images/icon-512x512.png", { type: "arrayBuffer" });
    return data ? new Response(data, { headers: { "Content-Type": "image/png" } }) : fetch("${safeUrl}/favicon.ico");
  }

  // Proxy Request
  const response = await fetch("${safeUrl}" + url.pathname + url.search);
  const ct = response.headers.get("Content-Type") || "";

  if (ct.includes("text/html")) {
    let h = await response.text();
    
    // Remove existing viewport and theme-color meta tags
    h = h.replace(/<meta[^>]*name=["']?viewport["']?[^>]*>/gi, '');
    h = h.replace(/<meta[^>]*name=["']?theme-color["']?[^>]*>/gi, '');

    // Strip out env() safe areas if ignoring safe area
    if (${isIgnoreSafeArea}) {
        h = h.replace(/env\\(\\s*safe-area-inset-(top|right|bottom|left)\\s*\\)/ig, '0px');
    }

    const metaTags = [
      '<link rel="manifest" href="/manifest.json">',
      '<link rel="apple-touch-icon" href="/pwa-icon-192.png">',
      '<meta name="theme-color" content="${themeColor}">',
      '<meta name="apple-mobile-web-app-capable" content="yes">',
      '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=${viewportFit}">',
      \`${ignoreSafeCssString.replace(/`/g, '\\`')}\`,
      '<style>body, #main { background-color: ${backgroundColor} !important; }</style>'
    ].join('\\n');

    h = h.replace("</head>", metaTags + "\\n</head>");
    
    return new Response(h, { headers: response.headers });
  }
  
  return response;
}
`
}
