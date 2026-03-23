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
    
    project_id = pid
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    })
    
    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single()
    if (projectError) throw new Error(`Project not found`)

    // Preserve existing data
    project_data = { ...project, ...(body.project_data || {}) }
    if (project.subdomain) project_data.subdomain = project.subdomain;

    const { data: credentials } = await supabaseClient.from("cloudflare_credentials").select("*").eq("user_id", project.user_id).single()
    if (!credentials) throw new Error("Cloudflare credentials not found")

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

    const listKvData = await cloudflareApiRequest(`https://api.cloudflare.com/client/v4/accounts/${deployAccountId}/storage/kv/namespaces`, { headers: { Authorization: `Bearer ${deployToken}` } }, "List KV")
    let kvNamespaceId = listKvData.result?.find((ns: any) => ns.title === kvNamespaceName)?.id

    if (!kvNamespaceId) {
      const kvData = await cloudflareApiRequest(`https://api.cloudflare.com/client/v4/accounts/${deployAccountId}/storage/kv/namespaces`, {
        method: "POST", headers: { Authorization: `Bearer ${deployToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: kvNamespaceName }),
      }, "Create KV")
      kvNamespaceId = kvData.result?.id
    }

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
    }, "Create Route")

    await supabaseClient.from("projects").update({ deployment_status: 'deployed', last_deployed_at: new Date().toISOString() }).eq("id", project_id)

    return new Response(JSON.stringify({ success: true, worker_url: `https://${routeHost}` }), { headers: { "Content-Type": "application/json", ...corsHeaders } })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } })
  }
})

async function decryptToken(encryptedToken: string, userId: string): Promise<string> {
  const parts = encryptedToken.split(":")
  const [ivHex, cipherHex] = parts
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  const cipher = new Uint8Array(cipherHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(ENCRYPTION_KEY), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"])
  const salt = encoder.encode(`foldaa-v2-2025-${userId}`)
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"])
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher)
  return new TextDecoder().decode(dec)
}

function generateWorkerScript(projectData: any, kvId: string, projectId: string): string {
  const safeUrl = (projectData.original_url || '').replace(/'/g, "\\'")
  const themeColor = projectData.theme_color || '#000000'
  const backgroundColor = projectData.background_color || '#ffffff'
  const manifestJsonObject = {
    name: projectData.name || 'Foldaa App',
    short_name: projectData.name || 'App',
    id: '/', start_url: '/', scope: '/', display: 'standalone',
    background_color: backgroundColor, theme_color: themeColor,
    icons: [
      { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
    ]
  };

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
    const iconUrl = is192 
      ? "${projectData.icon_192_url || projectData.logo_url || projectData.favicon_url || ''}" 
      : "${projectData.icon_512_url || projectData.logo_url || projectData.favicon_url || ''}";
    if (iconUrl) {
       try {
         const res = await fetch(iconUrl);
         if (res.ok) return new Response(res.body, { headers: { "Content-Type": "image/png" } });
       } catch (e) {}
    }
    return fetch("https://hueirgbgitrhqoopfxcu.supabase.co/storage/v1/object/public/branding/default-icon-192.png");
  }

  const response = await fetch("${safeUrl}" + url.pathname + url.search);
  const ct = (response.headers.get("Content-Type") || "").toLowerCase();

  if (ct.includes("text/html")) {
    let h = await response.text();
    const meta = \`
      <link rel="manifest" href="/manifest.json">
      <link rel="apple-touch-icon" href="/pwa-icon-192.png">
      <meta name="theme-color" content="${themeColor}">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
      <script>if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }</script>
    \`;
    return new Response(h.replace(/<\\/head>/i, meta + "</head>"), {
       headers: { ...Object.fromEntries(response.headers.entries()), "X-Foldaa-PWA": "v180" }
    });
  }
  return response;
}
`
}
