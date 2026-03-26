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
  const salt = encoder.encode(`apple-account-v2-${userId}`)

  // Support both hex string and binary formats for the master key
  const cleanKey = masterKey.trim()
  let keyBuffer = encoder.encode(cleanKey)
  if (/^[0-9a-fA-F]+$/.test(cleanKey) && cleanKey.length % 2 === 0) {
    keyBuffer = new Uint8Array(cleanKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
  }

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  )

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  )

  const encryptedBytes = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    derivedKey,
    data
  )

  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')
  const encryptedHex = Array.from(new Uint8Array(encryptedBytes))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `${ivHex}:${encryptedHex}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Unauthorized')

    const { action, team_id, key_id, private_key, bundle_id, account_name } = await req.json()

    if (action === "delete") {
      const { error: deleteError } = await supabase
        .from('apple_accounts')
        .delete()
        .eq('user_id', user.id)
      
      if (deleteError) throw deleteError
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!team_id || !key_id || !private_key) {
      throw new Error('Team ID, Key ID, and Private Key are required')
    }

    const encryptionKey = Deno.env.get('ENCRYPTION_KEY')
    if (!encryptionKey) throw new Error('ENCRYPTION_KEY not set')

    const encryptedPrivateKey = await encrypt(private_key, encryptionKey, user.id)

    const { data, error } = await supabase
      .from('apple_accounts')
      .upsert({
        user_id: user.id,
        team_id,
        key_id,
        private_key_encrypted: encryptedPrivateKey,
        bundle_id,
        account_name: account_name || 'Primary Account',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
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
