import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const signature = req.headers.get('x-signature');
        if (!signature) {
             console.log("Missing Lemon Squeezy signature check");
             // Un-comment when enforcing in production
             // return new Response('Missing signature', { status: 400 });
        }

        const bodyText = await req.text();
        const payload = JSON.parse(bodyText);
        const eventName = payload.meta.event_name;
        
        // Initialize Supabase admin client to bypass RLS for creating core records
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        if (eventName === 'order_created' || eventName === 'subscription_created') {
             // Extract custom metadata passed to Lemon Squeezy checkout
            const customData = payload.meta.custom_data || {};
            const projectId = customData.project_id; 
            const buyerId = customData.buyer_id;

            if (projectId && buyerId) {
                 // Fetch the listing corresponding to the project id
                 const { data: listing } = await supabaseAdmin
                    .from('marketplace_listings')
                    .select('*')
                    .eq('project_id', projectId)
                    .single();

                 if (listing && listing.type === 'service') {
                      // 1. Create Workspace for the Engagement
                      const { data: workspace, error: wsError } = await supabaseAdmin
                           .from('workspaces')
                           .insert({
                                name: `${listing.title} Setup`,
                                owner_id: listing.user_id, // Creator owns the workspace initially
                           })
                           .select()
                           .single();

                      if (!wsError && workspace) {
                           // 2. Map Buyer as a Workspace Member so they have RLS access
                           await supabaseAdmin.from('workspace_members').insert({
                               workspace_id: workspace.id,
                               user_id: buyerId,
                           });

                           // 3. Create the Core Service Engagement
                           await supabaseAdmin.from('service_engagements').insert({
                                listing_id: listing.id,
                                creator_id: listing.user_id,
                                buyer_id: buyerId,
                                workspace_id: workspace.id,
                                status: 'active',
                                start_date: new Date().toISOString(),
                                max_active_requests: listing.max_active_requests || 1,
                                billing_type: listing.pricing_model === 'monthly' ? 'monthly' : 'one_time'
                           });
                      } else {
                           console.error("Failed to create workspace:", wsError);
                      }
                 }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("Webhook processing error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
