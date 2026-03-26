"use client"
import React, { useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus, CircleDashed, Folder as FolderIcon } from "@phosphor-icons/react"
import { useFolders } from "@/lib/hooks/useProjects"
import { useUI } from "@/lib/contexts/UIContext"
import clsx from "clsx"

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateFolderModal({ isOpen, onClose }: CreateFolderModalProps) {
    const { createFolder } = useFolders()
    const { addToast } = useUI()
    const [name, setName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            await createFolder(name.trim())
            addToast(`Folder "${name}" created!`, 'success')
            onClose()
            setName("")
        } catch (err: any) {
            addToast(err.message || "Failed to create folder", 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-0">
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
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">New Folder</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-5">
                    <div className="flex flex-col items-center justify-center py-2">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-600">
                             <FolderIcon size={32} weight="fill" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#444] ml-0.5">Folder Name</label>
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="Design Assets"
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
                            disabled={!name.trim() || isSubmitting}
                            className={clsx(
                                "flex-1 px-4 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-lg uppercase tracking-wider",
                                name.trim() && !isSubmitting ? "bg-white text-black hover:bg-zinc-200" : "bg-[#111] text-zinc-700 border border-white/[0.02]"
                            )}
                            style={{ height: '24.5px' }}
                        >
                            {isSubmitting ? <CircleDashed size={14} className="animate-spin" /> : (
                                <>
                                    <Plus size={12} weight="bold" />
                                    Create
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
