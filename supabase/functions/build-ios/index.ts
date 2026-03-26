import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function decrypt(encryptedText: string, userId: string, supabase: any, buildId: string): Promise<string> {
  const parts = encryptedText.trim().split(':')
  if (parts.length !== 2) throw new Error('Invalid encrypted text format')
  
  const iv = new Uint8Array(parts[0].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  const ciphertext = new Uint8Array(parts[1].match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  const encoder = new TextEncoder()
  
  const logs: string[] = []
  const log = (msg: string) => {
    console.log(msg)
    logs.push(`[${new Date().toISOString()}] ${msg}`)
  }

  const flush = async () => {
    if (supabase && buildId) {
       await supabase.from('ios_builds').update({ build_logs: logs }).eq('id', buildId)
    }
  }

  const masterKeys = [
    { name: "ENV", val: Deno.env.get("ENCRYPTION_KEY") },
    { name: "INT", val: Deno.env.get("INTEGRATION_ENCRYPTION_KEY") },
    { name: "H1", val: "01c56479d6f2ec59347b0156c2a8f8ab7148195b4dcbf6aa0e83f7204dd26f51" },
    { name: "H2", val: "c871130c55c8dad596a9ec95c68b346b05025ecda658978ca75a3118a70ae6cc" }
  ].filter(k => !!k.val) as {name: string, val: string}[]

  const saltStrings = [
    `ios-cert-v2-${userId}`,
    `ios-cert-v2-${userId.toUpperCase()}`,
    `ios-cert-v1-${userId}`,
    `foldaa-v2-2025-${userId}`,
    userId,
    "ios-cert-salt",
    "foldaa-v2-2025"
  ]
  
  const iterations = [100000, 10000]

  log(`[Decrypt] Attempting standardized decryption search...`)

  for (const mk of masterKeys) {
    const cleanKey = mk.val.trim()
    const keyMaterials = [
      { name: `${mk.name}_S`, data: encoder.encode(cleanKey) }
    ]
    if (/^[0-9a-fA-F]+$/.test(cleanKey) && cleanKey.length % 2 === 0) {
      keyMaterials.push({ name: `${mk.name}_B`, data: new Uint8Array(cleanKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))) })
    }

    for (const km of keyMaterials) {
      for (const iter of iterations) {
        for (const saltStr of saltStrings) {
          try {
            const keyMaterial = await crypto.subtle.importKey("raw", km.data, { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"])
            const salt = encoder.encode(saltStr)
            const derivedKey = await crypto.subtle.deriveKey(
              { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
              keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
            )
            const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, derivedKey, ciphertext)
            log(`[Decrypt] SUCCESS! Pattern: ${km.name} | Salt: ${saltStr}`)
            await flush()
            return new TextDecoder().decode(decrypted)
          } catch (e) { /* continue */ }
        }
      }
      
      try {
        const rawKey = await crypto.subtle.importKey("raw", km.data, { name: "AES-GCM" }, false, ["decrypt"])
        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, rawKey, ciphertext)
        log(`[Decrypt] SUCCESS! Pattern: ${km.name} | Naive`)
        await flush()
        return new TextDecoder().decode(decrypted)
      } catch (e) { /* continue */ }
    }
  }

  log(`[Decrypt] FAILED ALL COMBINATIONS. Returning error.`)
  await flush()
  throw new Error('Decryption failed for all known patterns')
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

    const { project_id, version, build_number, certificate_id } = await req.json()

    if (!project_id || !version || !build_number || !certificate_id) {
      throw new Error('Missing required build parameters')
    }

    const { data: project } = await supabase.from('projects').select('*').eq('id', project_id).single()
    const { data: certificate } = await supabase.from('ios_certificates').select('*').eq('id', certificate_id).single()
    const { data: appleAccount } = await supabase.from('apple_accounts').select('*').eq('user_id', user.id).single()

    if (!project || !certificate || !appleAccount) {
      throw new Error('Project, Certificate, or Apple Account not found')
    }

    const { data: build, error: buildError } = await supabase
      .from('ios_builds')
      .insert({
        project_id,
        user_id: user.id,
        certificate_id,
        version,
        build_number: parseInt(build_number),
        bundle_id: appleAccount.bundle_id,
        pwa_url: project.worker_url || `https://${project.subdomain}.foldaa.com`,
        status: 'pending'
      })
      .select()
      .single()

    if (buildError) throw buildError

    // Step 1: Decrypt
    const logs: string[] = []
    const log = (msg: string) => {
        console.log(msg)
        logs.push(`[${new Date().toISOString()}] ${msg}`)
    }
    
    const decryptedPasswordOrig = await decrypt(certificate.distribution_cert_password_encrypted, user.id, supabase, build.id)
    const decryptedPassword = decryptedPasswordOrig.trim()
    
    log(`[Build] Decrypted password length: ${decryptedPasswordOrig.length}`)
    if (decryptedPasswordOrig.length !== decryptedPassword.length) {
        log(`[Build] WARNING: Password had whitespace! Cleaned length: ${decryptedPassword.length}`)
    }
    await supabase.from('ios_builds').update({ build_logs: logs }).eq('id', build.id)
    
    // Step 2: Generate Signed URLs for GitHub
    const { data: certUrlData } = await supabase.storage.from('ios-certificates').createSignedUrl(certificate.distribution_cert_url, 3600)
    const { data: profileUrlData } = await supabase.storage.from('ios-certificates').createSignedUrl(certificate.provisioning_profile_url, 3600)

    if (!certUrlData?.signedUrl || !profileUrlData?.signedUrl) {
        throw new Error('Failed to generate signed URLs for build assets')
    }

    // Step 3: Trigger GitHub Action (Full Inputs)
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN')
    const GITHUB_REPO = Deno.env.get('IOS_BUILD_REPO') || 'vmador/foldaa-ios-builds'

    const ghResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/ios-build.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
            build_id: build.id,
            pwa_url: build.pwa_url,
            bundle_id: build.bundle_id,
            apple_team_id: appleAccount.team_id,
            certificate_url: certUrlData.signedUrl,
            certificate_password: decryptedPassword,
            profile_url: profileUrlData.signedUrl,
            version_number: version,
            build_number: build_number
        }
      })
    })

    if (!ghResponse.ok) {
        const ghError = await ghResponse.text()
        await supabase.from('ios_builds').update({ status: 'failed', error_message: `GitHub trigger failed: ${ghError}` }).eq('id', build.id)
        throw new Error(`GitHub trigger failed: ${ghError}`)
    }

    return new Response(JSON.stringify({ success: true, build }), {
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
