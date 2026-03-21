"use client"
import React, { useState, useEffect } from "react"
import { Check, AlertCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import clsx from "clsx"

interface AppStoreMetadataFormProps {
    projectId: string
    onSaved?: () => void
}

const APP_STORE_CATEGORIES = [
    { value: "books", label: "Books" },
    { value: "business", label: "Business" },
    { value: "developer_tools", label: "Developer Tools" },
    { value: "education", label: "Education" },
    { value: "entertainment", label: "Entertainment" },
    { value: "finance", label: "Finance" },
    { value: "food_drink", label: "Food & Drink" },
    { value: "games", label: "Games" },
    { value: "graphics_design", label: "Graphics & Design" },
    { value: "health_fitness", label: "Health & Fitness" },
    { value: "lifestyle", label: "Lifestyle" },
    { value: "magazines_newspapers", label: "Magazines & Newspapers" },
    { value: "medical", label: "Medical" },
    { value: "music", label: "Music" },
    { value: "navigation", label: "Navigation" },
    { value: "news", label: "News" },
    { value: "photo_video", label: "Photo & Video" },
    { value: "productivity", label: "Productivity" },
    { value: "reference", label: "Reference" },
    { value: "shopping", label: "Shopping" },
    { value: "social_networking", label: "Social Networking" },
    { value: "sports", label: "Sports" },
    { value: "travel", label: "Travel" },
    { value: "utilities", label: "Utilities" },
    { value: "weather", label: "Weather" },
]

const AGE_RATINGS = [
    { value: "4+", label: "4+ (Ages 4 and up)" },
    { value: "9+", label: "9+ (Ages 9 and up)" },
    { value: "12+", label: "12+ (Ages 12 and up)" },
    { value: "17+", label: "17+ (Ages 17 and up)" },
]

export default function AppStoreMetadataForm({
    projectId,
    onSaved,
}: AppStoreMetadataFormProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const [formData, setFormData] = useState({
        primary_category: "productivity",
        secondary_category: "",
        age_rating: "4+",
        copyright: "",
        support_url: "",
        marketing_url: "",
        promotional_text: "",
        keywords: "",
        privacy_choices_url: "",
    })

    useEffect(() => {
        loadMetadata()
    }, [projectId])

    const loadMetadata = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { data: existingMetadata } = await supabase
                .from("app_store_metadata")
                .select("*")
                .eq("project_id", projectId)
                .maybeSingle()

            if (existingMetadata) {
                setFormData({
                    primary_category: existingMetadata.primary_category || "productivity",
                    secondary_category: existingMetadata.secondary_category || "",
                    age_rating: existingMetadata.age_rating || "4+",
                    copyright: existingMetadata.copyright || "",
                    support_url: existingMetadata.support_url || "",
                    marketing_url: existingMetadata.marketing_url || "",
                    promotional_text: existingMetadata.promotional_text || "",
                    keywords: existingMetadata.keywords || "",
                    privacy_choices_url: existingMetadata.privacy_choices_url || "",
                })
            } else {
                const { data: listing } = await supabase
                    .from("marketplace_listings")
                    .select("*")
                    .eq("project_id", projectId)
                    .maybeSingle()

                if (listing) {
                    const currentYear = new Date().getFullYear()
                    setFormData((prev) => ({
                        ...prev,
                        support_url: listing.support_email ? `mailto:${listing.support_email}` : "",
                        marketing_url: listing.developer_url || "",
                        keywords: listing.tags?.join(", ") || "",
                        copyright: `© ${currentYear} ${listing.developer_name || ""}`,
                        privacy_choices_url: listing.privacy_policy_url || "",
                    }))
                }
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.primary_category || !formData.support_url || !formData.copyright) {
            setError("Category, Support URL, and Copyright are required")
            return
        }

        setIsSaving(true)
        setError("")
        setSuccess("")

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { data: existing } = await supabase
                .from("app_store_metadata")
                .select("id")
                .eq("project_id", projectId)
                .maybeSingle()

            const metadata = {
                project_id: projectId,
                user_id: user.id,
                primary_category: formData.primary_category,
                secondary_category: formData.secondary_category || null,
                age_rating: formData.age_rating,
                copyright: formData.copyright,
                support_url: formData.support_url,
                marketing_url: formData.marketing_url || null,
                promotional_text: formData.promotional_text || null,
                keywords: formData.keywords,
                privacy_choices_url: formData.privacy_choices_url || null,
                updated_at: new Date().toISOString(),
            }

            if (existing) {
                const { error: updateError } = await supabase
                    .from("app_store_metadata")
                    .update(metadata)
                    .eq("id", existing.id)
                if (updateError) throw updateError
            } else {
                const { error: insertError } = await supabase
                    .from("app_store_metadata")
                    .insert(metadata)
                if (insertError) throw insertError
            }

            setSuccess("Metadata saved successfully!")
            onSaved?.()
            setTimeout(() => setSuccess(""), 3000)
        } catch (err: any) {
            setError(err.message || "Failed to save metadata")
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="w-5 h-5 text-[#666] animate-spin" />
            </div>
        )
    }

    return (
        <div className="w-full space-y-8">
            {/* Alerts */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-[10px] text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <div className="flex-1">{error}</div>
                    <button onClick={() => setError("")} className="hover:text-red-300">×</button>
                </div>
            )}

            {success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-[10px] text-xs text-green-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {success}
                </div>
            )}

            <div className="grid gap-8">
                {/* Categories Section */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-[#666] uppercase tracking-[0.1em]">Store Classification</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#444] uppercase tracking-wide">Primary Category</label>
                            <select
                                value={formData.primary_category}
                                onChange={(e) => setFormData((prev) => ({ ...prev, primary_category: e.target.value }))}
                                className="w-full h-9 bg-transparent border border-[#1C1C1E] rounded-[10px] px-3 text-xs text-white outline-none focus:border-[#2A2A2E]"
                            >
                                {APP_STORE_CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value} className="bg-[#0A0A0B]">{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#444] uppercase tracking-wide">Age Rating</label>
                            <select
                                value={formData.age_rating}
                                onChange={(e) => setFormData((prev) => ({ ...prev, age_rating: e.target.value }))}
                                className="w-full h-9 bg-transparent border border-[#1C1C1E] rounded-[10px] px-3 text-xs text-white outline-none focus:border-[#2A2A2E]"
                            >
                                {AGE_RATINGS.map((rating) => (
                                    <option key={rating.value} value={rating.value} className="bg-[#0A0A0B]">{rating.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-[#666] uppercase tracking-[0.1em]">Marketing & SEO</h3>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#444] uppercase tracking-wide flex justify-between">
                                Keywords
                                <span className="text-[9px] lowercase font-normal">{formData.keywords.length}/100</span>
                            </label>
                            <input
                                type="text"
                                value={formData.keywords}
                                maxLength={100}
                                onChange={(e) => setFormData((prev) => ({ ...prev, keywords: e.target.value }))}
                                placeholder="productivity, task, organize"
                                className="w-full h-9 bg-transparent border border-[#1C1C1E] rounded-[10px] px-3 text-xs text-white outline-none focus:border-[#2A2A2E]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#444] uppercase tracking-wide">Copyright</label>
                            <input
                                type="text"
                                value={formData.copyright}
                                onChange={(e) => setFormData((prev) => ({ ...prev, copyright: e.target.value }))}
                                placeholder="© 2025 Your Company"
                                className="w-full h-9 bg-transparent border border-[#1C1C1E] rounded-[10px] px-3 text-xs text-white font-mono outline-none focus:border-[#2A2A2E]"
                            />
                        </div>
                    </div>
                </div>

                {/* Support Section */}
                <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-[#666] uppercase tracking-[0.1em]">Legal & Links</h3>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#444] uppercase tracking-wide">Support URL</label>
                            <input
                                type="url"
                                value={formData.support_url}
                                onChange={(e) => setFormData((prev) => ({ ...prev, support_url: e.target.value }))}
                                className="w-full h-9 bg-transparent border border-[#1C1C1E] rounded-[10px] px-3 text-xs text-white/50 font-mono outline-none focus:border-[#2A2A2E]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[#444] uppercase tracking-wide">Marketing URL</label>
                            <input
                                type="url"
                                value={formData.marketing_url}
                                onChange={(e) => setFormData((prev) => ({ ...prev, marketing_url: e.target.value }))}
                                className="w-full h-9 bg-transparent border border-[#1C1C1E] rounded-[10px] px-3 text-xs text-white/50 font-mono outline-none focus:border-[#2A2A2E]"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={clsx(
                        "w-full h-10 rounded-[10px] text-xs font-bold transition-all flex items-center justify-center gap-2",
                        isSaving ? "bg-[#1C1C1E] text-[#444] cursor-not-allowed" : "bg-white text-black hover:bg-[#E0E0E0]"
                    )}
                >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {isSaving ? "Saving..." : "Save Metadata"}
                </button>
            </div>
        </div>
    )
}
