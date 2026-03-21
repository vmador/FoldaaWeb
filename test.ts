const projectData = {
      "subdomain": "olgas",
      "name": "Olgas App",
      "app_description": "Deployed with Foldaa",
      "theme_color": "#8B5CF6",
      "background_color": "#1F2937",
      "ignore_safe_area": true,
      "original_url": "https://olgas.framer.website"
    };

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
    
    // PWA & Native Meta Tags
    const metaTags = [
      '<link rel="manifest" href="/manifest.json">',
      '<link rel="apple-touch-icon" href="/pwa-icon-192.png">',
      '<meta name="theme-color" content="${themeColor}">',
      '<meta name="apple-mobile-web-app-capable" content="yes">',
      '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no${projectData.ignore_safe_area ? \', viewport-fit=cover\' : \'\'}">',
      '<style>body { background-color: ${backgroundColor} !important; }</style>'
    ].join('\\n');

    h = h.replace("<head>", "<head>" + metaTags);
    
    return new Response(h, { headers: response.headers });
  }
  
  return response;
}`
}

console.log(generateWorkerScript(projectData, "test", "test"));
