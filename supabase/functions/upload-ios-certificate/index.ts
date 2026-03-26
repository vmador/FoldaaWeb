import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function encrypt(plaintext: string, masterKey: string, userId: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const salt = encoder.encode(`ios-cert-v2-${userId}`)

  const cleanKey = masterKey.trim()
  let keyBuffer = encoder.encode(cleanKey)
  if (/^[0-9a-fA-F]+$/.test(cleanKey) && cleanKey.length % 2 === 0) {
    keyBuffer = new Uint8Array(cleanKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  }

  const keyMaterial = await crypto.subtle.importKey("raw", keyBuffer, { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"])
  const derivedKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
  )

  const encryptedBytes = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, derivedKey, data)
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')
  const encryptedHex = Array.from(new Uint8Array(encryptedBytes)).map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `${ivHex}:${encryptedHex}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Unauthorized')

    const formData = await req.formData()
    const p12File = formData.get('p12_file') as File
    const provisioningFile = formData.get('provisioning_file') as File
    const password = (formData.get('p12_password') || formData.get('password')) as string
    const name = formData.get('name') as string
    const projectId = formData.get('project_id') as string

    if (!p12File || !password || !provisioningFile) {
      throw new Error('P12 file, provisioning profile, and password are required')
    }

    const encryptionKey = Deno.env.get('ENCRYPTION_KEY')
    if (!encryptionKey) throw new Error('ENCRYPTION_KEY not set')

    const encrypted = await encrypt(password, encryptionKey, user.id)

    // Storage
    const p12Path = `${user.id}/${Date.now()}_dist.p12`
    await supabase.storage.from('ios-certificates').upload(p12Path, p12File)

    const provPath = `${user.id}/${Date.now()}_dist.mobileprovision`
    await supabase.storage.from('ios-certificates').upload(provPath, provisioningFile)

    // Extract metadata
    const provBuffer = await provisioningFile.arrayBuffer()
    const provText = new TextDecoder().decode(new Uint8Array(provBuffer))
    const appIdMatch = provText.match(/<key>application-identifier<\/key>\s*<string>([^<]+)<\/string>/)
    let bundleId = appIdMatch ? appIdMatch[1] : null
    if (bundleId && bundleId.includes('.')) bundleId = bundleId.substring(bundleId.indexOf('.') + 1)

    const { data, error } = await supabase
      .from('ios_certificates')
      .insert({
        user_id: user.id,
        project_id: projectId || null,
        cert_name: name || p12File.name,
        distribution_cert_url: p12Path,
        distribution_cert_password_encrypted: encrypted,
        provisioning_profile_url: provPath,
        profile_bundle_id: bundleId,
        updated_at: new Date().toISOString(),
        is_valid: true
      })
      .select()
      .single()

    if (error) throw error
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
