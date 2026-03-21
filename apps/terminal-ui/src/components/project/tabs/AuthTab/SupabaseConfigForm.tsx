import React from "react"
import { ExternalLink, CheckCircle2, RefreshCw } from "lucide-react"

interface SupabaseConfigFormProps {
    supabaseUrl: string
    anonKey: string
    serviceKey: string
    hasServiceKey: boolean
    projectId: string
    setSupabaseUrl: (value: string) => void
    setAnonKey: (value: string) => void
    setServiceKey: (value: string) => void
    setHasServiceKey: (value: boolean) => void
    showMessage: (type: "success" | "error", text: string) => void
}

export default function SupabaseConfigForm({
    supabaseUrl,
    anonKey,
    serviceKey,
    hasServiceKey,
    projectId,
    setSupabaseUrl,
    setAnonKey,
    setServiceKey,
    setHasServiceKey,
    showMessage,
}: SupabaseConfigFormProps) {
    const handleOpenSupabase = () => {
        window.open(
            "https://supabase.com/dashboard",
            "_blank",
            "noopener,noreferrer"
        )
    }

    return (
        <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-[#444] tracking-widest uppercase flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" /> Supabase Configuration
                </div>
                <button
                    type="button"
                    onClick={handleOpenSupabase}
                    className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1.5 transition-colors font-mono"
                >
                    GET_CREDENTIALS <ExternalLink size={10} />
                </button>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[#666] text-xs uppercase tracking-wider">PROJECT_URL</label>
                    <input
                        type="url"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        placeholder="https://xxxxx.supabase.co"
                        className="bg-[#1C1C1E] border border-[#333336] rounded px-3 py-1.5 text-white focus:border-fuchsia-500/50 outline-none font-mono text-sm"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[#666] text-xs uppercase tracking-wider">ANON_KEY</label>
                    <input
                        type="password"
                        value={anonKey}
                        onChange={(e) => setAnonKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="bg-[#1C1C1E] border border-[#333336] rounded px-3 py-1.5 text-white focus:border-fuchsia-500/50 outline-none font-mono text-sm"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[#666] text-xs uppercase tracking-wider">SERVICE_ROLE_KEY</label>
                    {hasServiceKey ? (
                        <div className="bg-fuchsia-500/5 border border-fuchsia-500/20 rounded px-3 py-1.5 flex items-center justify-between group">
                            <div className="flex items-center gap-2 text-fuchsia-400 text-sm font-mono">
                                <CheckCircle2 size={14} />
                                <span>CONFIGURED_ENCRYPTED</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setHasServiceKey(false)
                                    setServiceKey("")
                                }}
                                className="text-xs text-[#444] group-hover:text-fuchsia-400 transition-colors font-bold uppercase tracking-wider"
                            >
                                Replace
                            </button>
                        </div>
                    ) : (
                        <input
                            type="password"
                            value={serviceKey}
                            onChange={(e) => setServiceKey(e.target.value)}
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                            className="bg-[#1C1C1E] border border-[#333336] rounded px-3 py-1.5 text-white focus:border-fuchsia-500/50 outline-none font-mono text-sm"
                        />
                    )}
                    <p className="text-xs text-[#444] mt-1 italic">
                        Required for secure user verification. Locate in Settings → API.
                    </p>
                </div>
            </div>
        </section>
    )
}

