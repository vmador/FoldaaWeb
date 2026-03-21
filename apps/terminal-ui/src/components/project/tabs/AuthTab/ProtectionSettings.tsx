import React from "react"
import { ShieldAlert, Plus, X } from "lucide-react"

interface ProtectionSettingsProps {
    allowedRoles: string[]
    setAllowedRoles: (roles: string[]) => void
    redirectAfterLogin: string
    setRedirectAfterLogin: (url: string) => void
    redirectAfterLogout: string
    setRedirectAfterLogout: (url: string) => void
}

export default function ProtectionSettings({
    allowedRoles,
    setAllowedRoles,
    redirectAfterLogin,
    setRedirectAfterLogin,
    redirectAfterLogout,
    setRedirectAfterLogout,
}: ProtectionSettingsProps) {
    const [newRole, setNewRole] = React.useState("")

    const handleAddRole = () => {
        const trimmedRole = newRole.trim()
        if (trimmedRole && !allowedRoles.includes(trimmedRole)) {
            setAllowedRoles([...allowedRoles, trimmedRole])
            setNewRole("")
        }
    }

    const handleRemoveRole = (roleToRemove: string) => {
        setAllowedRoles(allowedRoles.filter((role) => role !== roleToRemove))
    }

    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-[#444] tracking-widest uppercase">
                <ShieldAlert className="w-3 h-3" /> Protection Settings
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {/* Roles Section */}
                <div className="flex flex-col gap-3 md:col-span-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-[#666] text-xs uppercase tracking-wider">ALLOWED_ROLES</label>
                        <p className="text-xs text-[#444] italic">Optional: restrict access to specific user roles.</p>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleAddRole()
                                }
                            }}
                            placeholder="ADMIN, EDITOR..."
                            className="flex-1 bg-[#1C1C1E] border border-[#333336] rounded px-3 py-1.5 text-white focus:border-fuchsia-500/50 outline-none font-mono text-sm uppercase"
                        />
                        <button
                            type="button"
                            onClick={handleAddRole}
                            disabled={!newRole.trim()}
                            className="px-3 py-1.5 bg-[#2A2A2E] hover:bg-[#1a1a1a] text-[#666] hover:text-fuchsia-400 border border-[#333336] rounded transition-all disabled:opacity-30 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
                        >
                            <Plus size={14} /> ADD
                        </button>
                    </div>

                    {allowedRoles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                            {allowedRoles.map((role) => (
                                <div
                                    key={role}
                                    className="flex items-center gap-2 px-2 py-1 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded text-fuchsia-400 text-xs font-mono group transition-all"
                                >
                                    <span>{role.toUpperCase()}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRole(role)}
                                        className="text-[#444] hover:text-red-400 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Redirects Section */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[#666] text-xs uppercase tracking-wider">REDIRECT_LOGIN</label>
                    <input
                        type="text"
                        value={redirectAfterLogin}
                        onChange={(e) => setRedirectAfterLogin(e.target.value)}
                        placeholder="/"
                        className="bg-[#1C1C1E] border border-[#333336] rounded px-3 py-1.5 text-white focus:border-fuchsia-500/50 outline-none font-mono text-sm"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[#666] text-xs uppercase tracking-wider">REDIRECT_LOGOUT</label>
                    <input
                        type="text"
                        value={redirectAfterLogout}
                        onChange={(e) => setRedirectAfterLogout(e.target.value)}
                        placeholder="/"
                        className="bg-[#1C1C1E] border border-[#333336] rounded px-3 py-1.5 text-white focus:border-fuchsia-500/50 outline-none font-mono text-sm"
                    />
                </div>
            </div>
        </section>
    )
}

