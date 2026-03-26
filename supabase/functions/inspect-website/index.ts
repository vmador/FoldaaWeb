// @ts-nocheck
// Edge Function: extract-brand-assets (SIMPLE VERSION)
// Just extract basic public meta tags, nothing fancy

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function extractBrandAssets(url: string) {
  const validUrl = url.startsWith('http') ? url : `https://${url}`
  const domain = new URL(validUrl).hostname.replace(/^www\./, '')
  const siteName = domain.split('.')[0]
  const capitalizedName = siteName.charAt(0).toUpperCase() + siteName.slice(1)
  
  console.log('📥 Fetching:', domain)
  
  // Fetch HTML
  const response = await fetch(validUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    }
  })
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  
  const html = await response.text()
  const doc = new DOMParser().parseFromString(html, 'text/html')
  
  // 1. Extract Title (Sanitized & Truncated)
  let title = 
    doc?.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc?.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
    doc?.querySelector('title')?.textContent ||
    capitalizedName

  // Remove common suffixes like " | Home", " - Login", etc.
  title = title.split(/[|—-]/)[0].trim()
  
  // Quality Check: If the title is "Home", "Index", or less than 3 characters, or is just the domain
  const genericTitles = ['home', 'index', 'welcome', 'untitled', siteName.toLowerCase(), domain.toLowerCase()]
  if (!title || title.length < 3 || genericTitles.includes(title.toLowerCase())) {
    title = capitalizedName
  }

  if (title.length > 50) title = title.substring(0, 47) + "..."
  
  // 2. Extract Description
  const description = 
    doc?.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    doc?.querySelector('meta[name="description"]')?.getAttribute('content') ||
    doc?.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
    `Progressive Web App for ${domain}`
  
  const ogImage = doc?.querySelector('meta[property="og:image"]')?.getAttribute('content') || 
                  doc?.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || null
  
  // 3. Extract Icons (Multiple methods)
  const iconSelectors = [
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]',
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="alternate icon"]'
  ]
  
  let icons: string[] = []
  iconSelectors.forEach(selector => {
      const el = doc?.querySelector(selector)
      const href = el?.getAttribute('href')
      if (href) icons.push(href)
  })

  // 3b. Try to find manifest.json
  const manifestEl = doc?.querySelector('link[rel="manifest"]')
  const manifestHref = manifestEl?.getAttribute('href')
  if (manifestHref) {
    try {
      const manifestUrl = manifestHref.startsWith('http') ? manifestHref : new URL(manifestHref, validUrl).href
      console.log('📄 Fetching manifest:', manifestUrl)
      const mRes = await fetch(manifestUrl)
      if (mRes.ok) {
        const manifest = await mRes.json()
        if (manifest.icons && Array.isArray(manifest.icons)) {
          manifest.icons.forEach((icon: any) => {
            if (icon.src) icons.push(icon.src)
          })
        }
      }
    } catch (e) {
      console.warn('Failed to parse manifest:', e)
    }
  }

  // Fallback to /favicon.ico if nothing found
  if (icons.length === 0) {
    icons.push('/favicon.ico')
  }

  // Sort by specificity/likely size (apple-touch-icon or high res first)
  const getAbsoluteUrl = (path: string) => {
      if (!path) return null
      try {
        return path.startsWith('http') ? path : new URL(path, validUrl).href
      } catch (e) {
        return null
      }
  }

  const bestIcon = icons.find(i => i.includes('apple') || i.includes('512') || i.includes('192')) || icons[0]
  const favicon = getAbsoluteUrl(bestIcon || '/favicon.ico')!
  const finalAppleIcon = getAbsoluteUrl(icons.find(i => i.includes('apple')) || bestIcon) || favicon
  
  // 4. Fallback Colors
  const themeColor = doc?.querySelector('meta[name="theme-color"]')?.getAttribute('content') || '#000000'
  
  // Build response
  const assets = {
    metadata: {
      title,
      description,
      keywords: []
    },
    icons: {
      favicon: favicon,
      appleTouchIcon: finalAppleIcon,
      icon192: finalAppleIcon || favicon,
      icon512: finalAppleIcon || favicon,
      logo: finalAppleIcon || favicon,
      list: icons.map(i => getAbsoluteUrl(i)).filter(Boolean) as string[]
    },
    colors: {
      primary: themeColor,
      theme: themeColor,
      background: '#ffffff',
      palette: [themeColor, themeColor + 'dd', themeColor + 'aa']
    },
    images: {
      ogImage: getAbsoluteUrl(ogImage as string)
    },
    domain,
    siteName
  }
  
  console.log('✅ Extracted:', { title, favicon, ogImage })
  
  return {
    success: true,
    cached: false,
    title,
    description,
    themeColor,
    assets,
    confidence: 0.9,
    extractionMethod: 'improved-simple',
    platform: 'generic'
  }
}

// Cache functions
async function checkCache(supabase: SupabaseClient, domain: string) {
  const { data, error } = await supabase
    .from('brand_assets_cache')
    .select('*')
    .eq('domain', domain)
    .single()
  
  if (error || !data) return null
  
  const expiresAt = new Date(data.expires_at)
  if (expiresAt < new Date()) return null
  
  console.log('✅ Cache hit')
  
  return {
    success: true,
    cached: true,
    title: data.title || '',
    description: data.description || '',
    themeColor: data.theme_color || '#000000',
    assets: {
      metadata: {
        title: data.title || '',
        description: data.description || '',
        keywords: data.keywords || []
      },
      icons: {
        favicon: data.favicon_url,
        icon192: data.icon_192_url,
        icon512: data.icon_512_url,
        logo: data.logo_url,
        list: [data.favicon_url, data.icon_192_url, data.icon_512_url, data.logo_url].filter(Boolean)
      },
      colors: {
        primary: data.primary_color,
        theme: data.theme_color,
        background: data.background_color,
        palette: data.color_palette || []
      },
      images: {
        ogImage: data.og_image_url
      },
      domain: data.domain,
      siteName: data.domain.split('.')[0]
    },
    confidence: data.confidence_score || 0.8,
    extractionMethod: 'simple',
    platform: 'generic'
  }
}

// deno-lint-ignore no-explicit-any
async function saveToCache(supabase: SupabaseClient, url: string, domain: string, result: any) {
  const { error } = await supabase
    .from('brand_assets_cache')
    .upsert({
      domain,
      url,
      title: result.assets.metadata.title,
      description: result.assets.metadata.description,
      keywords: result.assets.metadata.keywords,
      favicon_url: result.assets.icons.favicon,
      icon_192_url: result.assets.icons.icon192,
      icon_512_url: result.assets.icons.icon512,
      logo_url: result.assets.icons.logo,
      primary_color: result.assets.colors.primary,
      theme_color: result.assets.colors.theme,
      background_color: result.assets.colors.background,
      color_palette: result.assets.colors.palette,
      og_image_url: result.assets.images.ogImage,
      extraction_method: 'simple',
      confidence_score: result.confidence,
      last_updated: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
  
  if (error) console.error('Cache failed:', error)
  else console.log('💾 Cached')
}

// Main handler
Deno.serve(async (req) => {
  console.log('--- INSPECT WEBSITE V5 ---')
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const { url, refresh } = await req.json()
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const validUrl = url.startsWith('http') ? url : `https://${url}`
    const domain = new URL(validUrl).hostname.replace(/^www\./, '')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Check cache (unless refresh is requested)
    if (!refresh) {
      const cached = await checkCache(supabase, domain)
      if (cached) {
        return new Response(
          JSON.stringify(cached),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      console.log('🔄 Forced refresh requested, bypassing cache for:', domain)
    }
    
    // Extract
    const result = await extractBrandAssets(validUrl)
    
    // Cache
    await saveToCache(supabase, validUrl, domain, result)
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
