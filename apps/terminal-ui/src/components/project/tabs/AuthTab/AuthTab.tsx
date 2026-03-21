import React, { useState, useEffect } from "react"
import { Shield, ShieldOff, AlertCircle, CheckCircle2, Info, Save, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import SupabaseConfigForm from "./SupabaseConfigForm"
import ProtectionSettings from "./ProtectionSettings"
import AdvancedSettings from "./AdvancedSettings"
import TemplateSelector from "./TemplateSelector"
import IntegrationGuide from "./IntegrationGuide"
import clsx from "clsx"

interface AuthTabProps {
    projectId: string
}

const SUPABASE_URL = "https://hueirgbgitrhqoopfxcu.supabase.co"

import { TabHeader } from "@/components/ui/TabHeader"

export default function AuthTab({ projectId }: AuthTabProps) {
    const [isEnabled, setIsEnabled] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [message, setMessage] = useState<{
        type: "success" | "error" | "info" | null
        text: string
    }>({ type: null, text: "" })

    // Supabase Config
    const [supabaseUrl, setSupabaseUrl] = useState<string>("")
    const [anonKey, setAnonKey] = useState<string>("")
    const [serviceKey, setServiceKey] = useState<string>("")
    const [hasServiceKey, setHasServiceKey] = useState<boolean>(false)

    // Protection Settings
    const [allowedRoles, setAllowedRoles] = useState<string[]>([])
    const [redirectAfterLogin, setRedirectAfterLogin] = useState<string>("/")
    const [redirectAfterLogout, setRedirectAfterLogout] = useState<string>("/")

    // Advanced Settings
    const [sessionDuration, setSessionDuration] = useState<number>(7)
    const [requireEmailVerification, setRequireEmailVerification] =
        useState<boolean>(true)
    const [allowSignups, setAllowSignups] = useState<boolean>(true)

    // Template Selection & Overrides
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
    const [templateOverrides, setTemplateOverrides] = useState<any>({})

    useEffect(() => {
        let isMounted = true;
        if (projectId) {
            loadAuthConfig(isMounted)
        } else {
            setIsLoading(false);
            showMessage("error", "Project ID is missing");
        }
        return () => { isMounted = false; };
    }, [projectId])

    const loadAuthConfig = async (isMounted: boolean = true) => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("project_auth_config")
                .select("*")
                .eq("project_id", projectId)
                .maybeSingle()

            if (error && error.code !== "PGRST116") {
                throw error
            }

            if (isMounted && data) {
                setIsEnabled(data.is_enabled)
                setSupabaseUrl(data.supabase_url || "")
                setAnonKey(data.supabase_anon_key || "")
                setHasServiceKey(!!data.encrypted_service_key)
                setAllowedRoles(data.allowed_roles || [])
                setRedirectAfterLogin(data.redirect_after_login || "/")
                setRedirectAfterLogout(data.redirect_after_logout || "/")
                setSessionDuration(data.session_duration_days || 7)
                setRequireEmailVerification(
                    data.require_email_verification !== false
                )
                setAllowSignups(data.allow_signups !== false)
                setSelectedTemplateId(data.selected_template_id || "")
                setTemplateOverrides(data.template_overrides || {})
            }
        } catch (error: any) {
            if (isMounted) {
                console.error("Auth config loading error:", error);
                showMessage(
                    "error",
                    `Failed to load configuration: ${error.message}`
                )
            }
        } finally {
            if (isMounted) setIsLoading(false)
        }
    }

    const showMessage = (
        type: "success" | "error" | "info" | null,
        text: string
    ) => {
        setMessage({ type, text })
        if (type) {
            setTimeout(() => setMessage({ type: null, text: "" }), 5000)
        }
    }

    const handleToggleAuth = async () => {
        if (!isEnabled && (!supabaseUrl || !anonKey || !hasServiceKey)) {
            showMessage(
                "error",
                "Please save your Supabase credentials first before enabling authentication"
            )
            return
        }

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (!session) {
                showMessage("error", "Not authenticated")
                return
            }

            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/toggle-auth`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        project_id: projectId,
                        is_enabled: !isEnabled,
                    }),
                }
            )

            const result = await response.json()

            if (!response.ok) {
                throw new Error(
                    result.error || "Failed to toggle authentication"
                )
            }

            setIsEnabled(!isEnabled)
            showMessage(
                "success",
                `Authentication ${!isEnabled ? "enabled" : "disabled"} successfully!`
            )
        } catch (error: any) {
            showMessage("error", `Failed to toggle: ${error.message}`)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (!session) {
                showMessage("error", "Not authenticated")
                return
            }

            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/save-auth-config`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        project_id: projectId,
                        supabase_url: supabaseUrl,
                        supabase_anon_key: anonKey,
                        supabase_service_key: serviceKey || null,
                        allowed_roles: allowedRoles,
                        redirect_after_login: redirectAfterLogin,
                        redirect_after_logout: redirectAfterLogout,
                        session_duration_days: sessionDuration,
                        require_email_verification: requireEmailVerification,
                        allow_signups: allowSignups,
                        selected_template_id: selectedTemplateId || null,
                        template_overrides: templateOverrides,
                    }),
                }
            )

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Failed to save configuration")
            }

            showMessage("success", "Configuration saved successfully!")
            await loadAuthConfig()
        } catch (error: any) {
            showMessage("error", `Failed to save: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-[#444] text-sm p-8 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>SYNCING_AUTH_STATE...</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 text-sm pb-12 animate-in fade-in duration-500">
            <TabHeader 
                title="Authentication"
                description="Configure Supabase Auth to protect your project and manage user access."
                action={{
                    label: "Save Changes",
                    onClick: handleSave,
                    icon: Save,
                    loading: isSaving,
                    disabled: !supabaseUrl || !anonKey
                }}
                customActionContent={
                    <div className="flex items-center gap-3 pr-4 border-r border-[#2A2A2E]">
                        <span className="text-xs font-bold text-[#444] font-mono">PROTECTION</span>
                        <button
                            onClick={handleToggleAuth}
                            className={clsx(
                                "font-mono text-xs px-2 py-0.5 rounded border transition-all",
                                isEnabled ? "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30" : "bg-[#2A2A2E] text-[#444] border-[#333336]"
                            )}
                        >
                            {isEnabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                    </div>
                }
            />

            {/* Page Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-2">
                {/* Left Column: Configuration & Status Messages */}
                <div className="flex flex-col gap-8">
                    {/* Status Message */}
                    {message.type && (
                        <div className={clsx(
                            "flex items-center gap-3 px-4 py-3 rounded-md border text-xs font-mono",
                            message.type === "success" ? "bg-fuchsia-500/5 border-fuchsia-500/20 text-fuchsia-400" : 
                            message.type === "error" ? "bg-red-500/5 border-red-500/20 text-red-400" : 
                            "bg-[#2A2A2E] border-[#333336] text-[#888]"
                        )}>
                            {message.type === "success" ? <CheckCircle2 size={14} /> : 
                             message.type === "error" ? <AlertCircle size={14} /> : 
                             <Info size={14} />}
                            {message.text.toUpperCase()}
                        </div>
                    )}

                    {/* Supabase Config */}
                    <SupabaseConfigForm
                        supabaseUrl={supabaseUrl}
                        setSupabaseUrl={setSupabaseUrl}
                        anonKey={anonKey}
                        setAnonKey={setAnonKey}
                        serviceKey={serviceKey}
                        setServiceKey={setServiceKey}
                        hasServiceKey={hasServiceKey}
                        setHasServiceKey={setHasServiceKey}
                        projectId={projectId}
                        showMessage={showMessage}
                    />

                    {/* Conditional Settings */}
                    {isEnabled && (
                        <div className="flex flex-col gap-10 mt-2">
                            <ProtectionSettings
                                allowedRoles={allowedRoles}
                                setAllowedRoles={setAllowedRoles}
                                redirectAfterLogin={redirectAfterLogin}
                                setRedirectAfterLogin={setRedirectAfterLogin}
                                redirectAfterLogout={redirectAfterLogout}
                                setRedirectAfterLogout={setRedirectAfterLogout}
                            />

                            <AdvancedSettings
                                sessionDuration={sessionDuration}
                                setSessionDuration={setSessionDuration}
                                requireEmailVerification={requireEmailVerification}
                                setRequireEmailVerification={setRequireEmailVerification}
                                allowSignups={allowSignups}
                                setAllowSignups={setAllowSignups}
                            />

                            <TemplateSelector
                                selectedTemplateId={selectedTemplateId}
                                onSelect={setSelectedTemplateId}
                                overrides={templateOverrides}
                                setOverrides={setTemplateOverrides}
                            />
                        </div>
                    )}
                </div>

                {/* Right Column: Integration Guide */}
                <div className="flex flex-col gap-8 pt-px border-l border-[#2A2A2E] pl-10">
                    <IntegrationGuide 
                        supabaseUrl={supabaseUrl}
                        anonKey={anonKey}
                    />
                </div>
            </div>
        </div>
    )
}

