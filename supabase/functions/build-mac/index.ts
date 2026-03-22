// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN")!
const GITHUB_REPO = Deno.env.get("GITHUB_REPO") || "vmador/FoldaaWeb"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")!
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
    if (authError || !user) throw new Error("Unauthorized")

    const { project_id, build_mode = 'fast', build_config = {} } = await req.json()
    if (!project_id) throw new Error("project_id is required")

    // Verify ownership and get live URL
    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("id, name, subdomain, worker_url, icon_512_url, icon_192_url, favicon_url, mac_config")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single()

    if (projError || !project) throw new Error("Project not found or unauthorized")

    const live_url = project.worker_url || `https://${project.subdomain}.foldaa.com`
    // Use branding from build_config if available, otherwise fallback to project defaults
    const project_name = build_config?.branding?.app_name || project.name
    const icon_url = build_config?.branding?.icon_url || project.icon_512_url || project.icon_192_url || project.favicon_url

    // Delete existing builds for this project to keep only one (User Request V19)
    await supabase.from("mac_builds").delete().eq("project_id", project_id)

    // Create a new build record
    const { data: build, error: buildError } = await supabase
      .from("mac_builds")
      .insert({
        project_id,
        user_id: user.id,
        status: "pending",
        build_mode,
        build_config: {
          ...build_config,
          // Ensure branding is stored even if it was fallback
          branding: {
            app_name: project_name,
            icon_url: icon_url
          }
        }
      })
      .select("id")
      .single()

    if (buildError) throw buildError

    // Trigger GitHub Action
    const ghResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'build-mac-app',
        client_payload: {
          build_id: build.id,
          project_id: project.id,
          project_name, // Updated from build_config or fallback
          live_url,
          icon_url,     // Updated from build_config or fallback
          build_mode,
          mac_config: build_config // V26: Use the specific build_config for this build
        }
      })
    })

    if (!ghResponse.ok) {
      const errorText = await ghResponse.text()
      // Mark as error immediately if dispatch fails
      await supabase.from("mac_builds").update({ status: "error", logs: `Dispatch failed: ${errorText}` }).eq("id", build.id)
      throw new Error(`GitHub action trigger failed: ${ghResponse.status} ${errorText}`)
    }

    return new Response(JSON.stringify({ success: true, build_id: build.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error("Build trigger error:", error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    })
  }
})
