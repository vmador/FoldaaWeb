// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { action, ...params } = await req.json()

    switch (action) {
      case 'connect_seller': {
        // Mock LemonSqueezy connection URL or logic
        // In a real scenario, this would generate an OAuth URL
        const { data, error } = await supabaseClient
          .from('seller_accounts')
          .upsert({
            user_id: user.id,
            store_name: `${user.email?.split('@')[0]}'s Store`,
            status: 'active',
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'create_checkout': {
        const { project_id, price, name, description } = params
        
        // Mock LemonSqueezy checkout creation
        const checkout_url = `https://foldaa.lemonsqueezy.com/checkout/buy/mock-${project_id}`
        
        const { data, error } = await supabaseClient
          .from('marketplace_listings')
          .update({
            ls_checkout_url: checkout_url,
            ls_checkout_id: `ck_${Math.random().toString(36).substring(7)}`,
            asking_price: price,
            updated_at: new Date().toISOString()
          })
          .eq('project_id', project_id)
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify({ checkout_url, ...data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'update_price': {
        const { project_id, price } = params
        const { data, error } = await supabaseClient
          .from('marketplace_listings')
          .update({ asking_price: price, updated_at: new Date().toISOString() })
          .eq('project_id', project_id)
          .select()
          .single()

        if (error) throw error
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      case 'get_transactions': {
        // Mock transactions
        const transactions = [
          { id: 1, amount: 5000, project: 'Project Alpha', status: 'completed', date: new Date().toISOString() },
          { id: 2, amount: 12000, project: 'Project Beta', status: 'pending', date: new Date().toISOString() }
        ]
        return new Response(JSON.stringify({ transactions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
