import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
        },
      }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { api_key } = await req.json()

    if (!api_key) {
      return NextResponse.json({ success: false, error: 'API Key is required' }, { status: 400 })
    }

    const response = await fetch("https://api.lemonsqueezy.com/v1/stores", {
      headers: {
        Authorization: `Bearer ${api_key}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      cache: 'no-store'
    })

    const data = await response.json()
    
    if (!response.ok) {
        return NextResponse.json({ 
            success: false, 
            error: data.errors?.[0]?.detail || 'Failed to fetch stores from Lemon Squeezy' 
        }, { status: response.status })
    }

    return NextResponse.json({ success: true, data: data.data })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
