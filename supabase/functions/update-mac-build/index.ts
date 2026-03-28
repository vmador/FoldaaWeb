// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Basic shared secret auth to ensure only GitHub Actions can call this
    const authHeader = req.headers.get("Authorization")
    if (!authHeader || authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
      throw new Error("Unauthorized Webhook")
    }

    const { build_id, status, logs, dmg_url } = await req.json()
    if (!build_id || !status) throw new Error("build_id and status are required")

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // 1. Update the build status in the database
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    }
    
    if (logs) updateData.logs = logs
    if (dmg_url) updateData.dmg_url = dmg_url

    const { error: updateError } = await supabase
      .from("mac_builds")
      .update(updateData)
      .eq("id", build_id)

    if (updateError) throw updateError

    // 2. If build is ready, send a beautiful email notification
    console.log(`Checking email trigger: status=${status}, hasDmg=${!!dmg_url}, hasResendKey=${!!RESEND_API_KEY}`)

    if (status === 'ready' && dmg_url && RESEND_API_KEY) {
      try {
        console.log(`Fetching project and user data for build_id: ${build_id}`)
        
        // Fetch project info
        const { data: buildData, error: buildFetchError } = await supabase
          .from("mac_builds")
          .select("project_id")
          .eq("id", build_id)
          .single()
          
        if (buildFetchError || !buildData) {
          console.error("Error fetching build data:", buildFetchError)
          throw new Error("Build data not found")
        }

        const { data: projectData, error: projFetchError } = await supabase
          .from("projects")
          .select("name, user_id, icon_512_url, theme_color, subdomain, worker_url")
          .eq("id", buildData.project_id)
          .single()

        if (projFetchError || !projectData) {
          console.error("Error fetching project data:", projFetchError)
          throw new Error("Project data not found")
        }

        // Fetch user email
        const { data: userData, error: userFetchError } = await supabase.auth.admin.getUserById(projectData.user_id)
        
        if (userFetchError || !userData?.user?.email) {
          console.error("Error fetching user email:", userFetchError)
          throw new Error("User email not found")
        }

        console.log(`Sending email to ${userData.user.email} for project ${projectData.name}`)

        const themeColor = projectData.theme_color || '#ff00ff'
        const iconUrl = projectData.icon_512_url || 'https://foldaa.com/icon.png'
        const buildUid = Math.random().toString(36).substring(7).toUpperCase()

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    body { font-family: 'Inter', -apple-system, sans-serif; background-color: #ffffff; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; color: #000000; }
    .container { max-width: 600px; margin: 0 auto; padding: 60px 20px; text-align: center; }
    .logo { font-size: 32px; margin-bottom: 20px; display: block; text-decoration: none; color: #000000; font-weight: bold; }
    
    .build-ref-header {
      font-size: 10px;
      color: #888888;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-weight: 600;
    }

    .title {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 40px;
      line-height: 1.1;
      letter-spacing: -0.03em;
      color: #000000;
    }
    
    .mockup-container {
      margin: 20px auto 60px auto;
      text-align: center;
      width: 100%;
    }

    .dock-table {
      margin: 0 auto;
      background: transparent;
      padding: 10px 16px;
      border: none;
    }

    .dock-icon-ghost {
      width: 52px;
      height: 52px;
      background: #f8f8f8;
      border-radius: 12px;
      border: 1px solid #f0f0f0;
    }

    .dock-icon-main {
      width: 72px;
      height: 72px;
      border-radius: 18px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      background: #ffffff;
      border: 1px solid #eeeeee;
      overflow: hidden;
      margin: 0 auto;
    }

    .app-name {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 18px 0;
      letter-spacing: -0.02em;
      color: #000000;
    }
    
    .btn {
      display: inline-block;
      padding: 12px 32px;
      background: #000000;
      border-radius: 8px;
      color: #ffffff;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 35px;
    }
    
    .description {
      color: #bbbbbb;
      font-size: 14px;
      line-height: 1.6;
      max-width: 420px;
      margin: 0 auto;
    }
    
    .footer {
      margin-top: 80px;
      font-size: 10px;
      color: #eeeeee;
    }
  </style>
</head>
<body>
  <!-- Hidden Preheader -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    Your macOS application build #${buildUid} for ${projectData.name} is now ready for download. &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <div class="container">
    <div class="logo">Foldaa</div>
    
    <div class="build-ref-header">Build #${buildUid}</div>

    <h1 class="title">Your macOS<br>App is Ready</h1>
    
    <div class="mockup-container">
      <table class="dock-table" cellspacing="12" cellpadding="0" border="0">
        <tr>
          <td><div class="dock-icon-ghost"></div></td>
          <td><div class="dock-icon-ghost"></div></td>
          <td align="center">
            <div class="dock-icon-main">
              <table width="100%" height="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" valign="middle">
                    <img src="${iconUrl}" width="48" height="48" alt="${projectData.name}" style="display: block; width: 48px; height: 48px; border-radius: 12px;">
                  </td>
                </tr>
              </table>
            </div>
          </td>
          <td><div class="dock-icon-ghost"></div></td>
          <td><div class="dock-icon-ghost"></div></td>
        </tr>
      </table>
    </div>
    
    <h2 class="app-name">${projectData.name}</h2>
    
    <a href="https://app.foldaa.com/project/${projectData.id}/overview" class="btn">
      <span style="color: #ffffff;">Download via Dashboard</span>
    </a>
    
    <p class="description">
      The cloud build for ${projectData.name} has completed successfully.<br>
      Access your dashboard to safely download your native desktop wrapper.
    </p>
    
    <div class="footer">
      Foldaa Notifications | ${buildUid}
    </div>
  </div>
</body>
</html>
`

        const _emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Foldaa <welcome@notifications.foldaa.com>',
            to: userData.user.email,
            subject: `፨ @${projectData.name} — Your Mac App is ready! #${buildUid}`,
            html: htmlContent
          })
        })
        
        const resendResult = await _emailRes.json()
        console.log("Resend API Full Response:", JSON.stringify(resendResult))
        
        if (!_emailRes.ok) {
          throw new Error(`Resend API error: ${resendResult.message || _emailRes.statusText}`)
        }
      } catch (emailErr) {
        console.error("CRITICAL: Failed to send email notification:", emailErr.message)
        return new Response(JSON.stringify({ success: false, emailError: emailErr.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error("Update build error:", error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    })
  }
})
