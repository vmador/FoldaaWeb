const projectData = { ignore_safe_area: true };
const themeColor = '#000000';
const backgroundColor = '#ffffff';

const script = `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  
  if (url.pathname === "/manifest.json") {
    return new Response(JSON.stringify({}), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  const response = await fetch("https://example.com" + url.pathname + url.search);
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
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no${projectData.ignore_safe_area ? ', viewport-fit=cover' : ''}">',
      '<style>body { background-color: ${backgroundColor} !important; }</style>'
    ].join('\\n');

    h = h.replace("<head>", "<head>" + metaTags);
    
    return new Response(h, { headers: response.headers });
  }
  
  return response;
}`;

console.log(script);
