import React, { useState, useEffect } from "react"
import { Check, Layout, Loader2, Eye, Settings2, X, Info } from "lucide-react"
import { supabase } from "@/lib/supabase"
import clsx from "clsx"

interface Template {
    id: string
    name: string
    slug: string
    description: string
    preview_image_url: string
    is_pro: boolean
}

interface TemplateSelectorProps {
    selectedTemplateId: string
    onSelect: (templateId: string) => void
    overrides: any
    setOverrides: (overrides: any) => void
}

export default function TemplateSelector({
    selectedTemplateId,
    onSelect,
    overrides,
    setOverrides,
}: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [localOverrides, setLocalOverrides] = useState(JSON.stringify(overrides || {}, null, 2))

    useEffect(() => {
        fetchTemplates()
    }, [])

    useEffect(() => {
        setLocalOverrides(JSON.stringify(overrides || {}, null, 2))
    }, [overrides])

    const fetchTemplates = async () => {
        try {
            const { data, error } = await supabase
                .from("auth_page_templates")
                .select(
                    "id, name, slug, description, preview_image_url, is_pro"
                )
                .order("slug", { ascending: true })

            if (error) throw error

            setTemplates(data || [])

            if (
                (!selectedTemplateId || selectedTemplateId.trim() === "") &&
                data &&
                data.length > 0
            ) {
                onSelect(data[0].id)
            }
        } catch (error) {
            console.error("Error fetching templates:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleOverrideChange = (val: string) => {
        setLocalOverrides(val)
        try {
            const parsed = JSON.parse(val)
            setOverrides(parsed)
        } catch (e) {
            // Invalid JSON, wait for user to finish typing
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-[#444] text-xs p-8 font-mono">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>FETCHING_TEMPLATES...</span>
            </div>
        )
    }

    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#444] tracking-widest uppercase">
                    <Layout className="w-3 h-3" /> Visual Interface
                </div>
                
                {selectedTemplateId && (
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={clsx(
                            "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold transition-all",
                            showAdvanced ? "bg-fuchsia-500/20 text-fuchsia-400" : "text-[#444] hover:text-[#666]"
                        )}
                    >
                        <Settings2 className="w-3 h-3" />
                        {showAdvanced ? "CLOSE_EDITOR" : "CUSTOM_OVERRIDES"}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {templates.map((template) => {
                    const isSelected = template.id === selectedTemplateId

                    return (
                        <div
                            key={template.id}
                            className={clsx(
                                "group relative flex flex-col gap-2 transition-all duration-200",
                                isSelected ? "opacity-100" : "opacity-60 hover:opacity-100"
                            )}
                        >
                            <div 
                                onClick={() => onSelect(template.id)}
                                className={clsx(
                                    "relative aspect-[3/4] rounded-lg overflow-hidden border transition-all duration-300 bg-[#1C1C1E] cursor-pointer",
                                    isSelected ? "border-fuchsia-500/50 ring-1 ring-fuchsia-500/20" : "border-[#2A2A2E] group-hover:border-[#333336]"
                                )}
                            >
                                <img
                                    src={template.preview_image_url}
                                    alt={template.name}
                                    className="w-full h-full object-cover select-none"
                                    loading="lazy"
                                />
                                
                                <div className={clsx(
                                    "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3",
                                    isSelected && "opacity-100"
                                )}>
                                    {isSelected && (
                                        <div className="bg-fuchsia-500 text-black rounded-full p-1.5 shadow-xl shadow-fuchsia-500/20">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewTemplate(template);
                                        }}
                                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-bold flex items-center gap-1.5 transition-all transform translate-y-2 group-hover:translate-y-0"
                                    >
                                        <Eye className="w-3 h-3" />
                                        PREVIEW
                                    </button>
                                </div>

                                {template.is_pro && (
                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-yellow-400 text-black text-xs font-black rounded uppercase tracking-tighter">
                                        PRO
                                    </div>
                                )}
                            </div>

                            <div 
                                onClick={() => onSelect(template.id)}
                                className="flex flex-col gap-0.5 px-1 cursor-pointer"
                            >
                                <span className={clsx(
                                    "text-xs font-bold uppercase tracking-wider transition-colors",
                                    isSelected ? "text-fuchsia-400" : "text-[#444] group-hover:text-[#666]"
                                )}>
                                    {template.name}
                                </span>
                                <span className="text-xs text-[#333] line-clamp-1 font-mono uppercase">
                                    {template.slug}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Advanced Override Editor */}
            {showAdvanced && selectedTemplateId && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-[#1C1C1E] border border-fuchsia-500/20 rounded-lg overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-fuchsia-500/5 border-b border-fuchsia-500/10">
                            <Settings2 className="w-3.5 h-3.5 text-fuchsia-400" />
                            <span className="text-xs font-bold text-fuchsia-400 uppercase tracking-widest">Advanced Configuration Overrides</span>
                        </div>
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-md">
                                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-[#666] leading-relaxed">
                                    Override template variables such as <code className="text-blue-300">title</code>, <code className="text-blue-300">primaryColor</code>, or <code className="text-blue-300">welcomeMessage</code> by providing a JSON object.
                                </p>
                            </div>
                            <textarea
                                value={localOverrides}
                                onChange={(e) => handleOverrideChange(e.target.value)}
                                className="w-full h-40 bg-black border border-[#333336] rounded p-3 font-mono text-xs text-fuchsia-300 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/20 outline-none transition-all"
                                placeholder='{ "title": "Welcome Back", "primaryColor": "#00E0FF" }'
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewTemplate && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative w-full max-w-4xl h-[85vh] bg-[#1C1C1E] border border-[#333336] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2E]">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                    <Eye className="w-4 h-4 text-fuchsia-400" />
                                    Preview: {previewTemplate.name}
                                </h3>
                                <p className="text-xs text-[#444] uppercase font-mono">{previewTemplate.description}</p>
                            </div>
                            <button
                                onClick={() => setPreviewTemplate(null)}
                                className="p-2 hover:bg-white/5 rounded-full text-[#444] hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center bg-black">
                            {/* Device Frame Simulation */}
                            <div className="relative w-full max-w-[280px] aspect-[9/19] bg-[#2A2A2E] rounded-[3rem] p-3 border-[6px] border-[#333336] shadow-2xl">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#222] rounded-b-2xl z-10" />
                                <div className="w-full h-full rounded-[2.2rem] overflow-hidden bg-black relative">
                                    <img
                                        src={previewTemplate.preview_image_url}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#333] rounded-full" />
                            </div>

                            <div className="hidden lg:flex flex-col gap-4 ml-12 max-w-[300px]">
                                <div className="p-4 bg-[#2A2A2E] rounded-xl border border-[#333336] flex flex-col gap-2">
                                    <span className="text-xs font-bold text-[#444] uppercase tracking-wider">Interface Type</span>
                                    <span className="text-white text-xs">Dynamic Responsive Form</span>
                                </div>
                                <div className="p-4 bg-[#2A2A2E] rounded-xl border border-[#333336] flex flex-col gap-2">
                                    <span className="text-xs font-bold text-[#444] uppercase tracking-wider">Features</span>
                                    <ul className="text-xs text-[#666] flex flex-col gap-1.5">
                                        <li>• Email & Password Login</li>
                                        <li>• Social OAuth Support</li>
                                        <li>• Magic Link compatible</li>
                                        <li>• Fully Customizable</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

