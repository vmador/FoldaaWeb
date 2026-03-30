import React, { useState, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
    X, Plus, CircleDashed, Folder as FolderIcon,
    UploadSimple,
    Smiley
} from "@phosphor-icons/react"
import { useFolders } from "@/lib/hooks/useProjects"
import { useUI } from "@/lib/contexts/UIContext"
import { supabase } from "@/lib/supabase"
import clsx from "clsx"
import { 
    WEBFLOW_ICON_URL, FRAMER_ICON_URL, VERCEL_ICON_URL
} from "../ui/BrandIcons"
import { Folder } from "@/lib/contexts/ProjectContext"

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Folder | null;
}

export default function CreateFolderModal({ isOpen, onClose, initialData }: CreateFolderModalProps) {
    const { createFolder, updateFolder } = useFolders()
    const { addToast } = useUI()
    const [name, setName] = useState("")
    const [selectedIcon, setSelectedIcon] = useState<string>("folder")
    const [customIconUrl, setCustomIconUrl] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Sync state with initialData when modal opens
    React.useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name)
                if (initialData.icon?.startsWith('http')) {
                    setSelectedIcon('custom')
                    setCustomIconUrl(initialData.icon)
                } else {
                    setSelectedIcon(initialData.icon || 'folder')
                    setCustomIconUrl("")
                }
            } else {
                setName("")
                setSelectedIcon("folder")
                setCustomIconUrl("")
            }
        }
    }, [isOpen, initialData])

    const presets = [
        { id: 'folder', Icon: FolderIcon, label: 'Default' },
        { id: 'webflow', url: WEBFLOW_ICON_URL, label: 'Webflow' },
        { id: 'framer', url: FRAMER_ICON_URL, label: 'Framer' },
        { id: 'vercel', url: VERCEL_ICON_URL, label: 'Vercel' },
        { id: 'custom', Icon: UploadSimple, label: 'Upload' },
    ]

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `folder-icons/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath)

            setCustomIconUrl(publicUrl)
            setSelectedIcon('custom')
            addToast("Icon uploaded!", "success")
        } catch (err: any) {
            addToast(err.message || "Upload failed", "error")
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || isSubmitting || isUploading) return

        setIsSubmitting(true)
        try {
            const iconToSave = selectedIcon === 'custom' ? customIconUrl : selectedIcon
            
            if (initialData) {
                await updateFolder(initialData.id, { name: name.trim(), icon: iconToSave })
                addToast(`Folder updated!`, 'success')
            } else {
                await createFolder(name.trim(), iconToSave)
                addToast(`Folder "${name}" created!`, 'success')
            }
            onClose()
            setName("")
            setSelectedIcon("folder")
            setCustomIconUrl("")
        } catch (err: any) {
            addToast(err.message || "Failed to save folder", 'error')
        } finally {
            setIsSubmitting(false)
        }
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
                        {initialData ? "Edit Folder" : "New Folder"}
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-6">
                    <div className="flex flex-col items-center justify-center py-4 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-white/90 group relative overflow-hidden">
                             {selectedIcon === 'custom' && customIconUrl ? (
                                 <img src={customIconUrl} alt="" className="w-10 h-10 object-contain shadow-sm rounded-lg" />
                             ) : isUploading ? (
                                 <CircleDashed size={32} className="animate-spin text-zinc-600" />
                             ) : currentPreset?.url ? (
                                 <img src={currentPreset.url} alt="" className="w-8 h-8 object-contain brightness-0 invert opacity-90" />
                             ) : (
                                 (() => {
                                     const Icon = currentPreset?.Icon || FolderIcon;
                                     return <Icon size={32} weight="fill" className="text-white/90" />;
                                 })()
                             )}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-3">Preview Icon</span>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">Folder Name</label>
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Design Assets"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[#111] border border-white/[0.05] rounded-md px-3 py-2 text-sm text-white focus:border-white/20 outline-none transition-all placeholder:text-zinc-800 font-sans"
                            />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-0.5">Stack / Icon Preset</label>
                             <div className="grid grid-cols-4 gap-2">
                                 {presets.map((preset) => (
                                     <button
                                         key={preset.id}
                                         type="button"
                                         onClick={() => {
                                             if (preset.id === 'custom') {
                                                 fileInputRef.current?.click()
                                             } else {
                                                 setSelectedIcon(preset.id)
                                             }
                                         }}
                                         className={clsx(
                                             "flex flex-col items-center justify-center p-2 rounded-lg border transition-all gap-1 group relative",
                                             selectedIcon === preset.id 
                                                 ? "bg-white/[0.08] border-white/20 text-white" 
                                                 : "bg-transparent border-white/[0.04] text-zinc-600 hover:border-white/10 hover:text-zinc-400"
                                         )}
                                     >
                                         {preset.url ? (
                                             <img 
                                                 src={preset.url} 
                                                 alt="" 
                                                 className={clsx(
                                                     "w-4.5 h-4.5 object-contain transition-all",
                                                     selectedIcon === preset.id ? "brightness-0 invert opacity-100" : "brightness-0 invert opacity-40 group-hover:opacity-60"
                                                 )} 
                                             />
                                         ) : (
                                             (() => {
                                                 const Icon = preset.Icon || FolderIcon;
                                                 return <Icon size={18} weight={selectedIcon === preset.id ? "fill" : "regular"} className={clsx(
                                                     selectedIcon === preset.id ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                                                 )} />;
                                             })()
                                         )}
                                         <span className="text-[8px] font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-3">{preset.label}</span>
                                     </button>
                                 ))}
                                 <input 
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                 />
                             </div>
                        </div>
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
                            disabled={!name.trim() || isSubmitting || isUploading}
                            className={clsx(
                                "flex-1 px-4 rounded-md font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-lg uppercase tracking-wider",
                                name.trim() && !isSubmitting && !isUploading ? "bg-white text-black hover:bg-zinc-200" : "bg-[#111] text-zinc-700 border border-white/[0.02]"
                            )}
                            style={{ height: '24.5px' }}
                        >
                            {isSubmitting || isUploading ? <CircleDashed size={14} className="animate-spin" /> : (
                                <>
                                    {initialData ? (
                                        <span>Save Changes</span>
                                    ) : (
                                        <>
                                            <Plus size={12} weight="bold" />
                                            Create
                                        </>
                                    )}
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
