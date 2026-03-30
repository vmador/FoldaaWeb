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
        const { 
            project_id, price, name, description, 
            receipt_button_text, receipt_link_url, receipt_thank_you_note, redirect_url 
        } = params
        
        console.log(`🔍 Processing checkout for user ${user.id} on project ${project_id}`);
        if (receipt_link_url) console.log(`🔗 Receipt Link URL: ${receipt_link_url}`);

        // 1. Fetch user's seller account credentials
        // We use a privileged client (no user auth header) to ensure we can read the seller account
        const privilegedClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: seller, error: sellerError } = await privilegedClient
          .from('seller_accounts')
          .select('encrypted_api_key, store_id, template_variant_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (sellerError) {
            console.error("Seller lookup error:", sellerError);
            throw sellerError;
        }

        if (!seller) {
            // Log the total count for debugging
            const { count } = await privilegedClient.from('seller_accounts').select('*', { count: 'exact', head: true });
            console.warn(`⚠️ No seller account found for user ${user.id}. Total accounts in table: ${count}`);
            throw new Error(`Please connect your Lemon Squeezy account in settings first. (User ID: ${user.id.substring(0,8)}...)`)
        }

        console.log(`✅ Found seller account. Store ID: ${seller.store_id}`);

        // 2. Decrypt the API key
        const encryption_password = Deno.env.get('ENCRYPTION_PASSWORD')
        if (!encryption_password) throw new Error('System error: Encryption password not configured.')

        const { data: ls_api_key, error: decryptError } = await supabaseClient
          .rpc('decrypt_service_key', {
            p_encrypted_key: seller.encrypted_api_key,
            p_encryption_password: encryption_password
          })

        if (decryptError || !ls_api_key) {
            console.error("Decryption error:", decryptError)
            throw new Error('Failed to decrypt Lemon Squeezy API credentials.')
        }

        const lsStoreId = seller.store_id
        const lsVariantId = seller.template_variant_id

        let checkout_url = `https://foldaa.lemonsqueezy.com/checkout/buy/mock-${project_id}`
        let ls_checkout_id = `ck_${Math.random().toString(36).substring(7)}`

        if (ls_api_key && lsStoreId && lsVariantId) {
            const lsResponse = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.api+json',
                    'Content-Type': 'application/vnd.api+json',
                    'Authorization': `Bearer ${ls_api_key}`,
                },
                body: JSON.stringify({
                    data: {
                        type: "checkouts",
                        attributes: {
                            custom_price: price, // Cents
                            product_options: {
                                name: name || 'Marketplace Item',
                                description: description || 'No description provided.',
                                receipt_button_text: receipt_button_text || undefined,
                                receipt_link_url: receipt_link_url || undefined,
                                receipt_thank_you_note: receipt_thank_you_note || undefined,
                                redirect_url: redirect_url || undefined,
                            },
                            checkout_data: {
                                custom: {
                                    project_id: project_id,
                                    user_id: user.id
                                }
                            }
                        },
                        relationships: {
                            store: { data: { type: "stores", id: lsStoreId } },
                            variant: { data: { type: "variants", id: lsVariantId } }
                        }
                    }
                })
            });

            if (!lsResponse.ok) {
                const lsError = await lsResponse.text();
                throw new Error(`Lemon Squeezy API failed: ${lsResponse.status} ${lsError}`);
            }

            const lsData = await lsResponse.json();
            checkout_url = lsData.data.attributes.url;
            ls_checkout_id = String(lsData.data.id);
        }
        
        const { data, error } = await supabaseClient
          .from('marketplace_listings')
          .upsert({
            project_id: project_id,
            user_id: user.id,
            title: name || 'Untitled Project',
            description: description || 'No description provided.',
            live_url: '', // Required field
            category: 'other', // Required field
            ls_checkout_url: checkout_url,
            ls_checkout_id: ls_checkout_id,
            asking_price: price,
            receipt_button_text: receipt_button_text || null,
            receipt_link_url: receipt_link_url || null,
            receipt_thank_you_note: receipt_thank_you_note || null,
            redirect_url: redirect_url || null,
            last_updated_at: new Date().toISOString()
          }, { onConflict: 'project_id' })
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
          .update({ asking_price: price, last_updated_at: new Date().toISOString() })
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
    console.error("Marketplace checkout error:", err);
    return new Response(JSON.stringify({ error: err.message || 'Unknown error', details: err, rawError: String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
