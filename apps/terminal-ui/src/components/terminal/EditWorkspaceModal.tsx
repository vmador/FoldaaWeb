"use client"
import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Check, CircleDashed, Image as ImageIcon, UploadSimple } from "@phosphor-icons/react"
import { useWorkspaces, Workspace } from "@/lib/contexts/WorkspaceContext"
import { supabase } from "@/lib/supabase"
import { useUI } from "@/lib/contexts/UIContext"
import Image from "next/image"
import clsx from "clsx"

interface EditWorkspaceModalProps {
    workspace: Workspace;
    isOpen: boolean;
    onClose: () => void;
}

export default function EditWorkspaceModal({ workspace, isOpen, onClose }: EditWorkspaceModalProps) {
    const { refreshWorkspaces } = useWorkspaces()
    const { addToast } = useUI()
    const [name, setName] = useState(workspace.name)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(workspace.logo_url || null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        setName(workspace.name)
        setLogoPreview(workspace.logo_url || null)
        setLogoFile(null)
    }, [workspace])

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setLogoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setLogoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            let logoUrl = workspace.logo_url || ""
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop()
                const fileName = `${user.id}/${Math.random()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('logos')
                    .upload(fileName, logoFile)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('logos')
                    .getPublicUrl(fileName)
                
                logoUrl = publicUrl
            }

            const { error } = await supabase
                .from('workspaces')
                .update({ name, logo_url: logoUrl })
                .eq('id', workspace.id)

            if (error) throw error

            await refreshWorkspaces()
            addToast(`Workspace updated!`, 'success')
            onClose()
        } catch (err: any) {
            addToast(err.message || "Failed to update workspace", 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[201] flex items-center justify-center p-6 sm:p-0">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-[400px] bg-[#0A0A0A] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Workspace Settings</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5">
                    {/* Logo Upload */}
                    <div className="flex flex-col items-center justify-center py-2">
                        <label className="group relative w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer flex items-center justify-center overflow-hidden">
                            {logoPreview ? (
                                <Image src={logoPreview} alt="Logo preview" fill className="object-cover" />
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                    <ImageIcon size={20} />
                                    <span className="text-[8px] font-bold uppercase tracking-tighter">Add Logo</span>
                                </div>
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleLogoChange}
                                className="hidden" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <UploadSimple size={18} className="text-white" />
                            </div>
                        </label>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#444] ml-0.5">Workspace Name</label>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="My Creative Team"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-[#111] border border-white/[0.05] rounded-md px-3 py-2 text-sm text-white focus:border-white/20 outline-none transition-all placeholder:text-zinc-800 font-sans"
                        />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 border border-zinc-800 text-zinc-500 rounded-md font-bold text-[11px] hover:text-white hover:border-zinc-700 transition-all uppercase tracking-wider"
                            style={{ height: '24.5px' }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={!name.trim() || isSubmitting || (name === workspace.name && !logoFile)}
                            className={clsx(
                                "flex-1 px-4 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-lg uppercase tracking-wider",
                                (name.trim() && !isSubmitting && (name !== workspace.name || logoFile)) ? "bg-white text-black hover:bg-zinc-200" : "bg-[#111] text-zinc-700 border border-white/[0.02]"
                            )}
                            style={{ height: '24.5px' }}
                        >
                            {isSubmitting ? <CircleDashed size={14} className="animate-spin" /> : (
                                <>
                                    <Check size={12} weight="bold" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>,
        document.body
    )
}
