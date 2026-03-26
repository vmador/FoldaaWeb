import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function encryptToken(token: string, userId: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ENCRYPTION_KEY),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  )

  const salt = encoder.encode(`foldaa-v2-2025-${userId}`)
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  )

  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(token)
  )

  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')
  const cipherHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join('')

  return `${ivHex}:${cipherHex}`
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { api_token, account_id, zone_id, zone_name } = await req.json()

    if (!api_token || !account_id) {
      return NextResponse.json({ success: false, error: 'API Token and Account ID are required' }, { status: 400 })
    }

    if (!ENCRYPTION_KEY) {
      return NextResponse.json({ success: false, error: 'Server configuration error: Encryption key not found' }, { status: 500 })
    }

    const encryptedToken = await encryptToken(api_token, user.id)

    const { data, error } = await supabase
      .from('cloudflare_credentials')
      .upsert({
        user_id: user.id,
        account_id,
        encrypted_api_token: encryptedToken,
        zone_id: zone_id || null,
        zone_name: zone_name || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data[0] })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
