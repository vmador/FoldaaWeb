import React from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, Trash, Warning, CircleDashed } from "@phosphor-icons/react"
import clsx from "clsx"

interface DeleteFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    folderName: string;
}

export default function DeleteFolderModal({ isOpen, onClose, onConfirm, folderName }: DeleteFolderModalProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleConfirm = async () => {
        setIsSubmitting(true)
        try {
            await onConfirm()
            onClose()
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 sm:p-0">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-[400px] bg-[#0A0A0A] border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                            <Trash size={20} weight="fill" />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Delete Folder</h3>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-4 text-center">
                    <p className="text-sm text-zinc-400">
                        Are you sure you want to delete <span className="text-white font-bold">"{folderName}"</span>?
                    </p>
                    
                    <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-left">
                        <Warning size={24} className="text-red-500 shrink-0" weight="fill" />
                        <p className="text-[11px] text-red-200/60 leading-relaxed uppercase tracking-wider font-bold">
                            Warning: Projects inside will be unorganized. The folder itself will be permanently removed.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 border border-zinc-800 text-zinc-500 rounded-md font-bold text-[11px] hover:text-white hover:border-zinc-700 transition-all uppercase tracking-wider h-10"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className={clsx(
                                "flex-1 px-4 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/10 uppercase tracking-wider h-10",
                                "bg-red-600 text-white hover:bg-red-500"
                            )}
                        >
                            {isSubmitting ? <CircleDashed size={14} className="animate-spin" /> : "Delete Folder"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    )
}
