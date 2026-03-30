import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { project_id, title, message, launch_url, send_after, local_time_delivery } = await req.json()

    if (!project_id || !title || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify user
    const authHeader = req.headers.get('Authorization')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    // User client (for integration fetch, respects RLS)
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      authHeader ? { global: { headers: { Authorization: authHeader } } } : {}
    )

    // Admin client (for history logging, bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    const jwt = authHeader?.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
         status: 401,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch the OneSignal Integration Config for this project
    const { data: integration, error: integrationError } = await supabaseClient
      .from('project_integrations')
      .select('config, integration_types!inner(name)')
      .eq('project_id', project_id)
      .eq('integration_types.name', 'onesignal')
      .eq('is_enabled', true)
      .maybeSingle()

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ error: "OneSignal integration not found or disabled." }), {
         status: 404,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const config = (integration.config || {}) as any;
    const appId = config.appId || config.app_id;
    const restApiKey = config.restApiKey || config.apiKey || config.api_key || config.rest_api_key;

    if (!appId || !restApiKey) {
      return new Response(JSON.stringify({ error: "OneSignal configuration is incomplete." }), {
         status: 400,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send the Push Notification via OneSignal REST API
    // Using filters instead of segments to ensure we reach all active devices
    const pushPayload: any = {
      app_id: appId,
      filters: [
        { field: "last_session", relation: ">", value: "0" }
      ],
      contents: { en: message },
      headings: { en: title },
      url: launch_url || undefined,
    }
    
    // Fallback for scheduled notifications (some OneSignal versions prefer segments for scheduling)
    if (send_after) {
      delete pushPayload.filters;
      pushPayload.included_segments = ['Subscribed Users'];
      pushPayload.send_after = send_after;
      if (local_time_delivery) {
        pushPayload.delayed_option = "timezone";
      }
    }

    if (send_after) {
      pushPayload.send_after = send_after;
      if (local_time_delivery) {
        pushPayload.delayed_option = "timezone";
      }
    }

    const oneSignalAuthHeader = (restApiKey.startsWith('os_v2_app_') || restApiKey.length > 40) ? `Key ${restApiKey}` : `Basic ${restApiKey}`

    console.log(`Sending to OneSignal with auth header type: ${oneSignalAuthHeader.split(' ')[0]}`);

    const osResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': oneSignalAuthHeader,
      },
      body: JSON.stringify(pushPayload),
    })

    const osResult = await osResponse.json()

    // Log to history
    try {
        await adminClient.from('broadcast_history').insert({
            project_id,
            title,
            message,
            scheduled_for: send_after || null,
            sent_at: send_after ? null : new Date().toISOString(),
            status: osResponse.ok ? (send_after ? 'scheduled' : 'sent') : 'failed',
            recipients_count: osResult.recipients || 0,
            external_id: osResult.id || null,
            error_details: osResponse.ok ? null : osResult
        });
    } catch (e) {
        console.error("Failed to log to broadcast_history:", e);
    }

    if (!osResponse.ok) {
      return new Response(JSON.stringify({ error: "OneSignal rejected the request", details: osResult }), {
         status: osResponse.status,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, id: osResult.id, recipients: osResult.recipients || 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
