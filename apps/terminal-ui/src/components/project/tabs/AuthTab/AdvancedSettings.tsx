import React from "react"
import { Settings2, CheckCircle2 } from "lucide-react"
import clsx from "clsx"

interface AdvancedSettingsProps {
    sessionDuration: number
    setSessionDuration: (days: number) => void
    requireEmailVerification: boolean
    setRequireEmailVerification: (value: boolean) => void
    allowSignups: boolean
    setAllowSignups: (value: boolean) => void
}

export default function AdvancedSettings({
    sessionDuration,
    setSessionDuration,
    requireEmailVerification,
    setRequireEmailVerification,
    allowSignups,
    setAllowSignups,
}: AdvancedSettingsProps) {
    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-[#444] tracking-widest uppercase">
                <Settings2 className="w-3 h-3" /> Advanced Parameters
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {/* Session Duration */}
                <div className="flex flex-col gap-1.5 md:col-span-2 max-w-xs">
                    <label className="text-[#666] text-xs uppercase tracking-wider">SESSION_TIMEOUT</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={sessionDuration}
                            onChange={(e) =>
                                setSessionDuration(parseInt(e.target.value) || 7)
                            }
                            className="w-20 bg-[#1C1C1E] border border-[#333336] rounded px-3 py-1.5 text-white focus:border-fuchsia-500/50 outline-none font-mono text-sm"
                        />
                        <span className="text-[#444] text-xs font-bold uppercase tracking-widest">DAYS</span>
                    </div>
                    <p className="text-xs text-[#444] mt-0.5 italic">Maximum duration before re-authentication is required.</p>
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between group py-1">
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[#666] text-xs uppercase tracking-wider">EMAIL_VERIFICATION</label>
                        <p className="text-xs text-[#444]">Restrict access to verified accounts.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setRequireEmailVerification(!requireEmailVerification)}
                        className={clsx(
                            "font-mono text-xs px-2 py-0.5 rounded border transition-all font-bold",
                            requireEmailVerification ? "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30" : "bg-[#2A2A2E] text-[#444] border-[#333336]"
                        )}
                    >
                        {requireEmailVerification ? 'MANDATORY' : 'OPTIONAL'}
                    </button>
                </div>

                <div className="flex items-center justify-between group py-1">
                    <div className="flex flex-col gap-0.5">
                        <label className="text-[#666] text-xs uppercase tracking-wider">NEW_USER_REGISTRATION</label>
                        <p className="text-xs text-[#444]">Allow external sign-up flows.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAllowSignups(!allowSignups)}
                        className={clsx(
                            "font-mono text-xs px-2 py-0.5 rounded border transition-all font-bold",
                            allowSignups ? "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30" : "bg-[#2A2A2E] text-[#444] border-[#333336]"
                        )}
                    >
                        {allowSignups ? 'OPEN_ACCESS' : 'INVITE_ONLY'}
                    </button>
                </div>
            </div>
        </section>
    )
}

