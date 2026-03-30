"use client"
import React, { useState, useEffect } from 'react';
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileMd, Plus, CircleDashed } from '@phosphor-icons/react';
import clsx from 'clsx';

type CreateFileModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (filename: string, parentId?: string) => void;
    folders: { id: string, label: string }[];
};

export default function CreateFileModal({ isOpen, onClose, onCreate, folders }: CreateFileModalProps) {
    const [fileName, setFileName] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFileName('');
            setSelectedFolderId(undefined);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileName.trim() || isSubmitting) return;
        
        setIsSubmitting(true);
        
        let finalName = fileName.trim().toLowerCase().replace(/\s+/g, '-');
        if (!finalName.endsWith('.md')) {
            finalName += '.md';
        }

        setTimeout(() => {
            onCreate(finalName, selectedFolderId);
            setIsSubmitting(false);
            onClose();
        }, 400);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-0">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-[400px] bg-[#0A0A0A] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                        New Tent Manifest
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-6">
                    <div className="flex flex-col items-center justify-center py-4 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-white/90 group relative overflow-hidden text-emerald-500">
                             <FileMd size={32} weight="fill" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest mt-3">SOT Manifest</span>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">Manifest Name</label>
                            <div className="relative">
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="api-architecture"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    className="w-full bg-[#111] border border-white/[0.05] rounded-md px-3 py-2 text-sm text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-zinc-800 font-mono pr-10"
                                />
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground/30 font-mono text-[10px] uppercase">
                                    .md
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">Parent Location</label>
                             <div className="grid grid-cols-2 gap-2">
                                 <button
                                     type="button"
                                     onClick={() => setSelectedFolderId(undefined)}
                                     className={clsx(
                                         "px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all text-center",
                                         selectedFolderId === undefined
                                             ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                             : "bg-transparent border-white/[0.04] text-zinc-600 hover:border-white/10 hover:text-zinc-400"
                                     )}
                                 >
                                     Root (/)
                                 </button>
                                 
                                 {folders.map(folder => (
                                     <button
                                         key={folder.id}
                                         type="button"
                                         onClick={() => setSelectedFolderId(folder.id)}
                                         className={clsx(
                                             "px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all text-center truncate",
                                             selectedFolderId === folder.id
                                                 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                 : "bg-transparent border-white/[0.04] text-zinc-600 hover:border-white/10 hover:text-zinc-400"
                                         )}
                                     >
                                         {folder.label}
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
                            disabled={!fileName.trim() || isSubmitting}
                            className={clsx(
                                "flex-1 px-4 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-lg uppercase tracking-wider h-[24.5px]",
                                fileName.trim() && !isSubmitting ? "bg-emerald-500 text-black hover:bg-emerald-400" : "bg-[#111] text-zinc-700 border border-white/[0.02]"
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
    );
}
