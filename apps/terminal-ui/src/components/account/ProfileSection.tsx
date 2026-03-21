"use client"
import React, { useState, useEffect } from "react"
import { Save, User, MapPin, Globe, Twitter, Github, Building2, Loader2 } from "lucide-react"
import { useUserProfile, UserProfile } from "@/lib/hooks/useUserProfile"
import { supabase } from "@/lib/supabase"

export default function ProfileSection() {
    const { profile, loading, saving, updateProfile } = useUserProfile()
    const [formData, setFormData] = useState<Partial<UserProfile>>({})
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        if (profile) {
            setFormData({
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                username: profile.username || "",
                avatar_url: profile.avatar_url || "",
                bio: profile.bio || "",
                website: profile.website || "",
                location: profile.location || "",
                company: profile.company || "",
                twitter: profile.twitter || "",
                github: profile.github || "",
            })
        }
    }, [profile])

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No user found")

            // Create a unique file path
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            // Upload the file to the 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            // Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Update the profile with the new avatar URL
            await updateProfile({ avatar_url: publicUrl })
            setFormData(prev => ({ ...prev, avatar_url: publicUrl }))
        } catch (err) {
            console.error("Error uploading avatar:", err)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        await updateProfile(formData)
    }

    if (loading) return null

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-2xl">
            <form onSubmit={handleSave} className="space-y-6">
                
                {/* Visual Header / Avatar */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative group">
                        <div className="w-12 h-12 rounded-xl bg-[#1C1C1E] border border-[#2A2A2E] flex items-center justify-center text-lg font-bold text-white overflow-hidden shadow-inner">
                            {(formData.avatar_url || profile?.avatar_url) ? (
                                <img 
                                    src={formData.avatar_url || profile?.avatar_url || ""} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                (formData.first_name || profile?.first_name || profile?.email || "U").charAt(0).toUpperCase()
                            )}
                        </div>
                        {(saving || isUploading) && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <input
                            type="file"
                            id="avatar-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            disabled={saving || isUploading}
                        />
                        <button 
                            type="button" 
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                            disabled={saving || isUploading}
                            className="px-3 py-1 bg-transparent border border-[#333336] rounded text-xs font-bold text-[#888] hover:text-white hover:border-[#444] transition-all disabled:opacity-50 inline-block w-fit"
                        >
                            Change Avatar
                        </button>
                        <span className="text-xs text-[#444] font-mono uppercase tracking-widest">JPG, GIF or PNG. Max 2MB.</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs uppercase font-mono tracking-widest text-[#555]">First Name</label>
                        <input
                            type="text"
                            value={formData.first_name || ""}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-white text-xs focus:border-[#333] outline-none transition-all placeholder-[#333]"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs uppercase font-mono tracking-widest text-[#555]">Last Name</label>
                        <input
                            type="text"
                            value={formData.last_name || ""}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-white text-xs focus:border-[#333] outline-none transition-all placeholder-[#333]"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase font-mono tracking-widest text-[#555]">Display Name</label>
                    <input
                        type="text"
                        value={formData.first_name ? `${formData.first_name} ${formData.last_name || ''}`.trim() : ""}
                        readOnly
                        className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-[#888] text-xs focus:border-[#333] outline-none transition-all cursor-default"
                        placeholder="Auto-generated"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase font-mono tracking-widest text-[#555]">Username</label>
                    <input
                        type="text"
                        value={formData.username || ""}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-white text-xs focus:border-[#333] outline-none transition-all placeholder-[#333]"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase font-mono tracking-widest text-[#555]">Email</label>
                    <input
                        type="email"
                        value={profile?.email || ""}
                        readOnly
                        className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-[#888] text-xs focus:border-[#333] outline-none transition-all cursor-default"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase font-mono tracking-widest text-[#555]">Role</label>
                    <input
                        type="text"
                        value={formData.company || ""}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-white text-xs focus:border-[#333] outline-none transition-all placeholder-[#333]"
                        placeholder="Design Engineer"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase font-mono tracking-widest text-[#555]">Bio</label>
                    <textarea
                        value={formData.bio || ""}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-white text-xs focus:border-[#333] outline-none transition-all h-20 resize-none placeholder-[#333]"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs uppercase font-mono tracking-widest text-[#555]">Website</label>
                        <input
                            type="text"
                            value={formData.website || ""}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-white text-xs focus:border-[#333] outline-none transition-all placeholder-[#333]"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs uppercase font-mono tracking-widest text-[#555]">Location</label>
                        <input
                            type="text"
                            value={formData.location || ""}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-white text-xs focus:border-[#333] outline-none transition-all placeholder-[#333]"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase font-mono tracking-widest text-[#555]">Store Description</label>
                    <textarea
                        className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-white text-xs focus:border-[#333] outline-none transition-all h-20 resize-none placeholder-[#333]"
                        placeholder="Soundscapes and meditations"
                    />
                </div>

                <div className="flex flex-col gap-1.5 pt-2">
                    <label className="text-xs uppercase font-mono tracking-widest text-[#555]">Social Profiles</label>
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={formData.twitter || ""}
                            onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                            className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-white text-xs focus:border-[#333] outline-none transition-all placeholder-[#333]"
                        />
                        <input
                            type="text"
                            value={formData.github || ""}
                            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                            className="w-full bg-black border border-[#2A2A2E] rounded-md px-3 py-2 text-white text-xs focus:border-[#333] outline-none transition-all placeholder-[#333]"
                        />
                    </div>
                </div>
                
                {/* Hidden submit button to allow enter to save, saving is triggered via global command or button if implemented */}
                <button type="submit" className="hidden">Save</button>
            </form>
        </div>
    )
}
