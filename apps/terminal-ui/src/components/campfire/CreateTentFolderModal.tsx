"use client"
import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
    X, Plus, CircleDashed, Folder as FolderIcon,
    Code, BracketsCurly, Lightning, Brain, Palette
} from "@phosphor-icons/react"
import clsx from "clsx"

interface CreateTentFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, icon: string) => void;
}

export default function CreateTentFolderModal({ isOpen, onClose, onCreate }: CreateTentFolderModalProps) {
    const [name, setName] = useState("")
    const [selectedIcon, setSelectedIcon] = useState<string>("folder")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setName("")
            setSelectedIcon("folder")
        }
    }, [isOpen])

    const presets = [
        { id: 'folder', Icon: FolderIcon, label: 'Default' },
        { id: 'code', Icon: Code, label: 'Backend' },
        { id: 'design', Icon: Palette, label: 'Design' },
        { id: 'ai', Icon: Brain, label: 'Intelligence' },
        { id: 'logic', Icon: BracketsCurly, label: 'Logic' },
        { id: 'ignited', Icon: Lightning, label: 'Ignited' },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || isSubmitting) return

        setIsSubmitting(true)
        // Simulate a small delay for "authenticity"
        setTimeout(() => {
            onCreate(name.trim(), selectedIcon)
            setIsSubmitting(false)
            onClose()
        }, 400);
    }

    if (!isOpen) return null

    const currentPreset = presets.find(p => p.id === selectedIcon)

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
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                        New Tent Folder
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-6">
                    <div className="flex flex-col items-center justify-center py-4 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-white/90 group relative overflow-hidden">
                             {(() => {
                                 const Icon = currentPreset?.Icon || FolderIcon;
                                 return <Icon size={32} weight="fill" className="text-emerald-500" />;
                             })()}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest mt-3">Tent Hierarchy</span>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">Folder Name</label>
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="infrastructure"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[#111] border border-white/[0.05] rounded-md px-3 py-2 text-sm text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-800 font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">Category Icon</label>
                             <div className="grid grid-cols-6 gap-2">
                                 {presets.map((preset) => (
                                     <button
                                         key={preset.id}
                                         type="button"
                                         onClick={() => setSelectedIcon(preset.id)}
                                         className={clsx(
                                             "flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-1 group relative",
                                             selectedIcon === preset.id 
                                                 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                                 : "bg-transparent border-white/[0.04] text-zinc-600 hover:border-white/10 hover:text-zinc-400"
                                         )}
                                     >
                                        <preset.Icon size={18} weight={selectedIcon === preset.id ? "fill" : "regular"} />
                                         <span className="text-[8px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-3">{preset.label}</span>
                                     </button>
                                 ))}
                             </div>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 border border-zinc-800 text-zinc-500 rounded-md font-bold text-[11px] hover:text-white hover:border-zinc-700 transition-all uppercase tracking-wider h-[24.5px]"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={!name.trim() || isSubmitting}
                            className={clsx(
                                "flex-1 px-4 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-lg uppercase tracking-wider h-[24.5px]",
                                name.trim() && !isSubmitting ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-[#111] text-zinc-700 border border-white/[0.02]"
                            )}
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
