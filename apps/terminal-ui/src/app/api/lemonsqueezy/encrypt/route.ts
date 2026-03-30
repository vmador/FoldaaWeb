import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY
const ENCRYPTION_PASSWORD = process.env.ENCRYPTION_PASSWORD

export async function POST(req: Request) {
  try {
    if (!NEXT_PUBLIC_SUPABASE_URL || !SERVICE_ROLE_KEY) {
        console.error("❌ SUPABASE_URL or SERVICE_ROLE_KEY missing from server environment");
        return NextResponse.json({ success: false, error: 'Server configuration error: Missing Supabase credentials' }, { status: 500 })
    }

    if (!ENCRYPTION_PASSWORD) {
        console.error("❌ ENCRYPTION_PASSWORD missing from server environment");
        return NextResponse.json({ success: false, error: 'Server configuration error: Encryption password not found' }, { status: 500 })
    }

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
              // Ignore
            }
          },
        },
      }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { api_key, store_id, store_name, template_variant_id } = await req.json()

    if (!api_key) {
      return NextResponse.json({ success: false, error: 'API Key is required' }, { status: 400 })
    }

    if (!ENCRYPTION_PASSWORD) {
        console.error("❌ ENCRYPTION_PASSWORD missing from server environment");
        return NextResponse.json({ success: false, error: 'Server configuration error: Encryption password not found' }, { status: 500 })
    }

    console.log(`🛡️ Validating API key for user ${user.id}... (Key prefix: ${api_key.substring(0, 4)})`);

    // 0. Validate the API key with Lemon Squeezy before proceeding
    const lsResponse = await fetch("https://api.lemonsqueezy.com/v1/users/me", {
      headers: {
        Authorization: `Bearer ${api_key}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      cache: 'no-store'
    })

    if (!lsResponse.ok) {
        const lsData = await lsResponse.json()
        const errorDetail = lsData.errors?.[0]?.detail || 'Invalid key';
        console.error(`❌ Lemon Squeezy validation failed: ${errorDetail}`);
        return NextResponse.json({ 
            success: false, 
            error: `Lemon Squeezy verification failed: ${errorDetail}` 
        }, { status: 401 })
    }

    console.log("✅ API key validated with Lemon Squeezy. Proceeding to encryption...");

    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(
        NEXT_PUBLIC_SUPABASE_URL,
        SERVICE_ROLE_KEY
    )

    // 1. Encrypt the key using the same RPC the edge function would use
    const { data: encryptedKey, error: encryptError } = await adminClient
      .rpc('encrypt_service_key', {
        p_service_key: api_key,
        p_encryption_password: ENCRYPTION_PASSWORD
      })

    if (encryptError || !encryptedKey) {
        console.error("❌ Encryption RPC failure:", encryptError)
        return NextResponse.json({ success: false, error: 'Encryption failed: ' + (encryptError?.message || 'Unknown error') }, { status: 500 })
    }

    console.log("🔐 Key encrypted successfully. Upserting to database...");

    // 2. Upsert into seller_accounts
    const { data, error } = await adminClient
      .from('seller_accounts')
      .upsert({
        user_id: user.id,
        encrypted_api_key: encryptedKey,
        store_id: store_id ? String(store_id) : null,
        store_name: store_name || null,
        template_variant_id: template_variant_id ? String(template_variant_id) : null,
        status: 'active',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()

    if (error) {
      console.error("❌ Database upsert failure:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`🚀 Successfully connected Lemon Squeezy for user ${user.id}`);
    return NextResponse.json({ success: true, data: data[0] })
  } catch (error: any) {
    console.error('🔥 Global API Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
