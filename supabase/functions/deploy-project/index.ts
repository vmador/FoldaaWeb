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

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 8, initialDelay: number = 2000): Promise<T> {
  let lastError: any
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try { return await fn() } catch (error) {
      lastError = error
      const errorMessage = (error as any)?.message || JSON.stringify(error)
      if (!errorMessage.includes('code":971') && !errorMessage.includes('throttling') && !errorMessage.includes('rate limit') || attempt === maxRetries - 1) throw error
      const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.log(`⏳ Rate limit hit, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError
}

async function cloudflareApiRequest(url: string, options: RequestInit, description: string): Promise<any> {
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })
  try {
    const bodyText = await req.text()
    if (!bodyText) throw new Error("Empty body")
    const body = JSON.parse(bodyText)
    const { project_id, project_data: input_data } = body
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: req.headers.get("Authorization")! } } })
    const { data: project } = await supabaseClient.from("projects").select("*").eq("id", project_id).single()
    const project_data = { ...project, ...(input_data || {}) }
    
    let oneSignalAppId = ""
    try {
      const { data: onesignal } = await supabaseClient.from('project_integrations').select('config, integration_types!inner(name)').eq('project_id', project_id).eq('integration_types.name', 'onesignal').eq('is_enabled', true).maybeSingle()
      if (onesignal) oneSignalAppId = (onesignal.config as any)?.appId || (onesignal.config as any)?.app_id || ""
    } catch (e) {
      console.error("Error fetching OneSignal integration:", e)
    }

    const workerScript = generateWorkerScript(project_data, FOLDAA_CF_ACCOUNT_ID, project_id, oneSignalAppId)
    
    const scriptName = project_data.subdomain || project_id
    const cfUrl = `https://api.cloudflare.com/client/v4/accounts/${FOLDAA_CF_ACCOUNT_ID}/workers/scripts/${scriptName}`
    
    await cloudflareApiRequest(cfUrl, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${FOLDAA_CF_TOKEN}`,
        'Content-Type': 'application/javascript'
      },
      body: workerScript
    }, "Deploying Worker Script")

    // 1. Fetch current workers routes for this zone
    const listRoutesUrl = `https://api.cloudflare.com/client/v4/zones/${FOLDAA_CF_ZONE_ID}/workers/routes`
    const routesResp = await cloudflareApiRequest(listRoutesUrl, {
      headers: { 'Authorization': `Bearer ${FOLDAA_CF_TOKEN}` }
    }, "Listing existing Cloudflare routes")
    
    const existingRoutes = routesResp.result || []
    const routeMap = new Map(existingRoutes.map((r: any) => [r.pattern, r.id]))

    // 2. Fetch custom domains from our domains table
    const { data: dbDomains } = await supabaseClient
      .from("domains")
      .select("domain_name")
      .eq("project_id", project_id)
    
    const domains = (dbDomains || []).map(d => d.domain_name)
    const baseSlug = project_data.subdomain || project_data.slug || project_id
    const foldaaSubdomain = `${baseSlug}.foldaa.com`
    const patterns = [foldaaSubdomain, ...domains].map(d => `${d}/*`)

    for (const pattern of patterns) {
      const existingRouteId = routeMap.get(pattern)
      const routeUrl = existingRouteId 
        ? `https://api.cloudflare.com/client/v4/zones/${FOLDAA_CF_ZONE_ID}/workers/routes/${existingRouteId}`
        : `https://api.cloudflare.com/client/v4/zones/${FOLDAA_CF_ZONE_ID}/workers/routes`
      
      try {
        await cloudflareApiRequest(routeUrl, {
          method: existingRouteId ? 'PUT' : 'POST',
          headers: {
            'Authorization': `Bearer ${FOLDAA_CF_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ pattern, script: scriptName })
        }, `${existingRouteId ? 'Updating' : 'Creating'} route ${pattern}`)
      } catch (e) {
        if (!e.message.includes("already exists")) {
            console.error(`Failed to ${existingRouteId ? 'update' : 'create'} route ${pattern}:`, e)
        }
      }
    }

    const { error: finalUpdateError } = await supabaseClient.from("projects").update({ 
      deployment_status: 'ready',
      last_deployed_at: new Date().toISOString(),
      subdomain: project_data.subdomain,
      worker_url: project_data.worker_url || `https://${project_data.subdomain}.foldaa.com`,
      status: 'success'
    }).eq("id", project_id)

    if (finalUpdateError) {
      console.error("Final database update failed:", finalUpdateError)
      // We don't throw here to ensure the function returns success for the deployment itself,
      // but we log it clearly. Actually, it's better to return success: false if persistence fails.
      return new Response(JSON.stringify({ success: false, error: `Deployment succeeded but database update failed: ${finalUpdateError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, version: 'v238' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function generateWorkerScript(project_data: any, kvId: string, project_id: string, oneSignalAppId: string = ""): string {
  const safeUrl = (project_data.original_url || '').replace(/'/g, "\\'")
  const themeColor = project_data.theme_color || '#000000'
  const backgroundColor = project_data.background_color || '#ffffff'
  const viewportFit = project_data.ignore_safe_area ? 'cover' : 'contain'
  const projectName = (project_data.name || 'Foldaa App').replace(/'/g, "\\'")

  const onesignalBodyHtml = '<style>#foldaa-push-banner{position:fixed;top:-120px;left:50%;transform:translateX(-50%);width:90%;max-width:400px;background:rgba(10,10,10,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:12px 16px;display:flex;align-items:center;gap:12px;z-index:99999999;box-shadow:0 20px 40px rgba(0,0,0,0.4);transition:all 0.6s cubic-bezier(0.16,1,0.3,1);font-family:-apple-system,sans-serif;}#foldaa-push-banner.visible{top:20px;}#foldaa-push-banner .icon{width:40px;height:40px;border-radius:10px;background:#222;overflow:hidden;flex-shrink:0;}#foldaa-push-banner .icon img{width:100%;height:100%;object-fit:cover;}#foldaa-push-banner .content{flex:1;min-width:0;}#foldaa-push-banner .title{color:white;font-size:13px;font-weight:600;margin:0;}#foldaa-push-banner .subtitle{color:rgba(255,255,255,0.5);font-size:11px;margin:2px 0 0 0;}#foldaa-push-banner .actions{display:flex;gap:8px;}#foldaa-push-banner button{border:none;padding:8px 14px;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;}#foldaa-push-banner .btn-later{background:transparent;color:rgba(255,255,255,0.4);}#foldaa-push-banner .btn-allow{background:white;color:black;}</style>' +
    '<div id="foldaa-push-banner"><div class="icon"><img src="/pwa-icon-192.png"></div><div class="content"><p class="title">' + projectName + '</p><p class="subtitle">Enable notifications</p></div><div class="actions"><button class="btn-later" onclick="dismissFoldaaBanner()">Later</button><button class="btn-allow" onclick="allowFoldaaPush()">Allow</button></div></div>' +
    '<script>(function(){const b=document.getElementById("foldaa-push-banner");window.dismissFoldaaBanner=()=>{if(b)b.classList.remove("visible");};window.allowFoldaaPush=()=>{if(b)b.classList.remove("visible");window.OneSignalDeferred=window.OneSignalDeferred||[];OneSignalDeferred.push(function(OS){OS.Notifications.requestPermission();});};const trigger=()=>{setTimeout(()=>{if(b)b.classList.add("visible");},500);document.removeEventListener("click",trigger);document.removeEventListener("touchstart",trigger);};document.addEventListener("click",trigger);document.addEventListener("touchstart",trigger);})();</script>';

  let script = "addEventListener('fetch', event => { event.respondWith(handleRequest(event.request)) })\n";
  script += "async function handleRequest(request) {\n";
  script += "  const url = new URL(request.url)\n";
  script += "  const path = url.pathname\n";
  script += "  if (path === '/manifest.json') return new Response(JSON.stringify({name: '" + projectName + "', short_name: '" + (projectName.split(' ')[0]) + "', id: '/', start_url: '/', scope: '/', display: 'standalone', background_color: '" + backgroundColor + "', theme_color: '" + themeColor + "', icons: [{src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any'}]}), { headers: { 'Content-Type': 'application/manifest+json', 'Access-Control-Allow-Origin': '*' } })\n";
  script += "  if (path === '/sw.js' || path === '/OneSignalSDKWorker.js') return new Response(\"importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');\", { headers: { 'Content-Type': 'application/javascript' } })\n";
  script += "  if (path === '/pwa-icon-192.png') {\n";
  script += "    const iconUrl = '" + (project_data.icon_192_url || project_data.logo_url || '') + "'\n";
  script += "    if (iconUrl) { try { const res = await fetch(iconUrl); if (res.ok) return new Response(res.body, { headers: { 'Content-Type': 'image/png' } }) } catch (e) {} }\n";
  script += "    return fetch('https://hueirgbgitrhqoopfxcu.supabase.co/storage/v1/object/public/branding/default-icon-192.png')\n";
  script += "  }\n";
  script += "  const response = await fetch('" + safeUrl + "' + url.pathname + url.search)\n";
  script += "  const ct = (response.headers.get('Content-Type') || '').toLowerCase()\n";
  script += "  if (ct.includes('text/html')) {\n";
  script += "    let h = await response.text()\n";
  script += "    h = h.replace(/<meta[^>]*name=['\"]?(viewport|theme-color)['\"]?[^>]*>/gi, '')\n";
  script += "    const meta = '<!-- FOLDAA_START v238 -->\\n' +\n";
  script += "      '<link rel=\"manifest\" href=\"/manifest.json\">\\n' +\n";
  script += "      '<link rel=\"apple-touch-icon\" href=\"/pwa-icon-192.png\">\\n' +\n";
  script += "      '<meta name=\"theme-color\" content=\"" + themeColor + "\">\\n' +\n";
  script += "      '<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\\n' +\n";
  script += "      '<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=" + viewportFit + "\">\\n' +\n";
  script += "      '<meta name=\"onesignal-app-id\" content=\"" + oneSignalAppId + "\">\\n' +\n";
  script += "      '<style>body, #main { background-color: " + backgroundColor + " !important; }</style>\\n' +\n";
  script += "      '<script src=\"https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js\" defer></script>\\n' +\n";
  script += "      '<script>window.OneSignalDeferred=window.OneSignalDeferred||[];OneSignalDeferred.push(function(OS){OS.init({appId:\"" + oneSignalAppId + "\",allowLocalhostAsSecureOrigin:true,notifyButton:{enable:false}}); OS.User.PushSubscription.addEventListener(\"change\", (e) => { console.log(\"🔔 FOLDAA: Subscription changed\", e.current.token, e.current.optedIn); }); console.log(\"🔔 FOLDAA: OneSignal Ready (v238)\"); });</script>\\n' +\n";
  script += "      '<!-- FOLDAA_END -->';\n";
  script += "    h = h.replace(/<!-- FOLDAA_START [\\\\s\\\\S]*?<!-- FOLDAA_END -->/g, '')\n";
  script += "    let f = h.includes('</head>') || h.includes('</HEAD>') ? h.replace(/<\\/head>/i, meta + '</head>') : meta + h\n";
  script += "    const b = '" + onesignalBodyHtml.replace(/'/g, "\\'").replace(/\n/g, "") + "';\n";
  script += "    if (f.includes('<body') || f.includes('<BODY')) f = f.replace(/<body([^>]*)>/i, (m, g) => '<body' + g + '>' + b);\n";
  script += "    else f = b + f;\n";
  script += "    return new Response(f, { headers: { ...Object.fromEntries(response.headers.entries()), 'X-Foldaa-PWA': 'v238' } });\n";
  script += "  }\n";
  script += "  return response\n";
  script += "}\n";

  return script
}
