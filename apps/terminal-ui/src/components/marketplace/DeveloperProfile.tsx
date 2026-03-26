import React, { useState, useEffect, useRef, useCallback } from "react"
import { ArrowLeft, User, Mail, Globe, Twitter, Github, MapPin, Calendar, Package, ExternalLink, Loader2, Edit, Camera, Check, X, LogOut, ZoomIn, ZoomOut, Save, Share2, Copy, Link as LinkIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface DeveloperProfileProps {
    developerId?: string
    username?: string
    currentUser?: any
    onBack?: () => void
    onProjectClick?: (project: any) => void
}

export default function DeveloperProfile({ developerId, username, currentUser, onBack, onProjectClick }: DeveloperProfileProps) {
    const [profile, setProfile] = useState<any>(null)
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(false) // Start false, set true in useEffect
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState<any>({})
    const [isSaving, setIsSaving] = useState(false)
    const [croppingImage, setCroppingImage] = useState<{ type: 'avatar' | 'cover', dataUrl: string, file: File } | null>(null)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isOwner = currentUser?.id && profile?.id && currentUser.id === profile.id

    const isDark = true
    const colors = {
        text: isDark ? "#FFFFFF" : "#000000",
        textSecondary: isDark ? "#9CA3AF" : "#666666",
        textMuted: isDark ? "#6B7280" : "#999999",
        border: isDark ? "rgba(255, 255, 255, 0.08)" : "#E0E0E0",
        bg: isDark ? "#000000" : "#FFFFFF",
        cardBg: isDark ? "#080808" : "#FFFFFF",
        accent: "#FFFFFF",
    }

    useEffect(() => {
        const fetchDeveloperData = async () => {
            if (!developerId && !username) {
                console.log("DeveloperProfile: No ID or username yet")
                setLoading(false)
                return
            }

            console.log("DeveloperProfile: Fetching data for", { developerId, username })
            setLoading(true)
            setError(null)
            
            try {
                let query = supabase.from('profiles').select('*')
                
                if (developerId) {
                    query = query.eq('id', developerId)
                } else if (username) {
                    query = query.eq('username', username)
                }

                const { data: profileData, error: profileError } = await query.single()

                if (profileError) {
                    console.error("DeveloperProfile: Profile fetch error:", profileError)
                    throw profileError
                }

                if (!profileData) {
                    throw new Error("Developer not found")
                }

                console.log("DeveloperProfile: Profile found:", profileData.username)

                const fullName = [profileData.first_name, profileData.last_name].filter(Boolean).join(' ')
                const enhancedProfile = {
                    ...profileData,
                    full_name: fullName,
                    cover_url: profileData.cover_image_url
                }

                setProfile(enhancedProfile)
                setEditData(enhancedProfile)

                const { data: projectData, error: projectError } = await supabase
                    .from('marketplace_listings')
                    .select('*, projects(*)')
                    .eq('user_id', profileData.id)
                    .eq('status', 'published')

                if (projectError) {
                    console.error("DeveloperProfile: Projects fetch error:", projectError)
                } else {
                    console.log("DeveloperProfile: Projects loaded:", projectData?.length || 0)
                    setProjects(projectData || [])
                }
            } catch (err: any) {
                console.error("DeveloperProfile: Error loading data:", err)
                setError(err.message || "Failed to load profile")
            } finally {
                setLoading(false)
            }
        }

        fetchDeveloperData()
    }, [developerId, username])

    const getAvatarUrl = (p: any) => {
        if (!p) return null
        // Handle potential array or object structure
        const profileData = Array.isArray(p) ? p[0] : p
        let url = profileData?.avatar_url || profileData?.avatar_path || profileData?.profile_picture_url

        // Fallback to auth if this is the current user's profile and no avatar is set in profile
        if (!url && currentUser?.id === profile?.id) {
            url = currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture
        }

        return url
    }

    const getListingCover = (item: any) => {
        return item.preview_image_url || item.projects?.preview_image_url || item.projects?.cover_url || item.cover_image_url
    }

    const getListingVideo = (item: any) => {
        return item.preview_video_url || item.projects?.preview_video_url
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const names = (editData.full_name || "").split(' ')
            const first_name = names[0] || ""
            const last_name = names.slice(1).join(' ')

            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name,
                    last_name,
                    username: editData.username,
                    bio: editData.bio,
                    website: editData.website,
                    twitter: editData.twitter,
                    github: editData.github,
                    avatar_url: editData.avatar_url,
                    cover_image_url: editData.cover_url
                })
                .eq('id', profile.id)

            if (error) throw error
            setProfile(editData)
            setIsEditing(false)
        } catch (err: any) {
            console.error("Error saving profile:", err)
            alert("Error saving profile: " + err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleCopyLink = () => {
        if (!profile?.username) return
        const url = `${window.location.origin}/u/${profile.username}`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleImageUpload = async (type: 'avatar' | 'cover', file: File) => {
        setIsSaving(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', type)

            // Explicitly get the session to ensure we have the token
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error("No active session. Please log in again.")

            // Use the direct URL to have more control over the request
            // We need the Supabase URL and Anon Key (apikey)
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hueirgbgitrhqoopfxcu.supabase.co'
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

            const response = await fetch(`${supabaseUrl}/functions/v1/upload-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'apikey': supabaseAnonKey || ''
                },
                body: formData
            })

            const responseData = await response.json()

            if (!response.ok) {
                console.error("Edge Function Error Details:", responseData)
                throw new Error(responseData.error || `Server responded with status ${response.status}`)
            }

            if (!responseData.success) {
                throw new Error(responseData.error || "Upload failed without specific error message")
            }

            // responseData.url is the public Cloudflare R2 URL
            setEditData({ ...editData, [type === 'avatar' ? 'avatar_url' : 'cover_url']: responseData.url })
        } catch (err: any) {
            console.error("Error uploading image:", err)
            const friendlyMsg = err.message || "An unknown error occurred during upload"
            alert(`Upload Error: ${friendlyMsg}`)
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) {
        return (
            <div style={{ backgroundColor: colors.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Loader2 className="animate-spin" color={colors.accent} size={32} />
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ backgroundColor: colors.bg, minHeight: "100vh", color: colors.text, padding: "80px 40px", textAlign: "center" }}>
                <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <div style={{ color: '#EF4444', marginBottom: '16px', fontSize: '24px' }}>✕</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Error Loading Profile</h3>
                    <p style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '24px' }}>{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        style={{ 
                            backgroundColor: colors.accent, 
                            color: '#000', 
                            border: 'none', 
                            padding: '10px 20px', 
                            borderRadius: '6px', 
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Try Again
                    </button>
                    {onBack && (
                        <button onClick={onBack} style={{ display: 'block', margin: '16px auto', color: colors.accent, background: 'none', border: 'none', cursor: 'pointer' }}>
                            Go Back to Marketplace
                        </button>
                    )}
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div style={{ backgroundColor: colors.bg, minHeight: "100vh", color: colors.text, padding: "40px", textAlign: "center" }}>
                <p>Developer not found.</p>
                <button onClick={onBack} style={{ marginTop: "20px", color: colors.accent, background: "none", border: "none", cursor: "pointer" }}>Go Back</button>
            </div>
        )
    }

    const avatarUrl = isEditing ? (editData.avatar_url || getAvatarUrl(editData)) : getAvatarUrl(profile)
    const bannerUrl = isEditing
        ? (editData.cover_url || editData.banner_url || "https://images.unsplash.com/photo-1614850523296-d8c1afc3d400?q=80&w=2070&auto=format&fit=crop")
        : (profile.banner_url || profile.cover_url || "https://images.unsplash.com/photo-1614850523296-d8c1afc3d400?q=80&w=2070&auto=format&fit=crop")

    return (
        <div style={{
            backgroundColor: colors.bg,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            color: colors.text,
            position: "absolute",
            inset: 0
        }}>
            {/* Sticky Header with Breadcrumbs */}
            <div style={{
                borderBottom: `1px solid ${colors.border}`,
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                backgroundColor: "rgba(0,0,0,0.8)",
                backdropFilter: "blur(12px)",
                zIndex: 100,
                flexShrink: 0
            }}>
                {onBack && (
                    <button
                        onClick={onBack}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: colors.textSecondary,
                            display: "flex",
                            alignItems: "center",
                            padding: "4px",
                            borderRadius: "100px"
                        }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                )}
                <div style={{ fontSize: "11px", color: colors.textMuted, fontFamily: "monospace", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "0.05em", flex: 1 }}>
                    {onBack && (
                        <>
                            <span style={{ cursor: "pointer" }} onClick={onBack}>marketplace</span>
                            <span>/</span>
                        </>
                    )}
                    <span style={{ color: colors.textSecondary }}>developers</span>
                    <span style={{ color: colors.textSecondary, fontWeight: "bold" }}>/{profile.username || "profile"}</span>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                        onClick={handleCopyLink}
                        style={{
                            padding: "6px 12px",
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: `1px solid ${colors.border}`,
                            borderRadius: "8px",
                            color: colors.textSecondary,
                            fontSize: "12px",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                            transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"
                            e.currentTarget.style.borderColor = colors.textSecondary
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"
                            e.currentTarget.style.borderColor = colors.border
                        }}
                    >
                        {copied ? <Check size={14} color="#10B981" /> : <LinkIcon size={14} />}
                        {copied ? "Copied!" : "Copy Link"}
                    </button>

                    {isOwner && (
                        <div style={{ display: "flex", gap: "10px" }}>
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => {
                                        setIsEditing(false)
                                        setEditData(profile)
                                    }}
                                    style={{
                                        background: "rgba(255,255,255,0.05)",
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: "6px",
                                        padding: "6px 12px",
                                        cursor: "pointer",
                                        color: colors.textSecondary,
                                        fontSize: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px"
                                    }}
                                >
                                    <X size={14} /> Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    style={{
                                        background: colors.accent,
                                        border: "none",
                                        borderRadius: "6px",
                                        padding: "6px 12px",
                                        cursor: isSaving ? "not-allowed" : "pointer",
                                        color: "#000",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        opacity: isSaving ? 0.7 : 1
                                    }}
                                >
                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                style={{
                                    background: "rgba(255,255,255,0.05)",
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: "6px",
                                    padding: "6px 12px",
                                    cursor: "pointer",
                                    color: "#FFF",
                                    fontSize: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                            >
                                <Edit size={14} /> Edit Profile
                            </button>
                        )}
                    </div>
                )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: "auto" }}>
                {/* Nike-Style Hero Area */}
                <div style={{ position: "relative", width: "100%", marginBottom: "80px" }}>
                    {/* Banner */}
                    <div style={{
                        width: "100%",
                        height: "300px",
                        backgroundColor: "#050505",
                        overflow: "hidden",
                        position: "relative"
                    }}>
                        <img
                            src={isEditing ? (editData.cover_url || editData.banner_url || bannerUrl) : bannerUrl}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                opacity: 1
                            }}
                        />
                        {isEditing && (
                            <label
                                style={{
                                    position: "absolute",
                                    bottom: "20px",
                                    right: "20px",
                                    background: "rgba(0,0,0,0.7)",
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: "8px",
                                    padding: "8px 16px",
                                    color: colors.text,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    backdropFilter: "blur(8px)",
                                    zIndex: 20,
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                <Camera size={14} /> Change Banner
                                <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            const reader = new FileReader()
                                            reader.onload = () => setCroppingImage({ type: 'cover', dataUrl: reader.result as string, file })
                                            reader.readAsDataURL(file)
                                        }
                                    }}
                                />
                            </label>
                        )}
                    </div>

                    {/* Profile Identity Overlap */}
                    <div style={{
                        maxWidth: "1200px",
                        margin: "-60px auto 0 auto",
                        padding: "0 40px",
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "24px"
                    }}>
                        <div 
                            id="avatar-container"
                            style={{
                                width: "120px",
                                height: "120px",
                                borderRadius: "100px",
                                backgroundColor: "#111",
                                border: `4px solid ${colors.bg}`,
                                overflow: "hidden",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.5)",
                                zIndex: 10,
                                position: "relative"
                            }}
                        >
                            {avatarUrl ? (
                                <img 
                                    src={avatarUrl} 
                                    alt={profile.full_name} 
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={(e) => {
                                        // If image fails to load, hide it and the parent container will show the fallback if we had one,
                                        // or we can just replace the src with a transparent pixel and show an icon instead.
                                        e.currentTarget.style.display = 'none';
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                            const icon = document.createElement('div');
                                            icon.style.display = 'flex';
                                            icon.style.alignItems = 'center';
                                            icon.style.justifyContent = 'center';
                                            icon.style.width = '100%';
                                            icon.style.height = '100%';
                                            icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                                            icon.style.color = colors.textMuted;
                                            parent.appendChild(icon);
                                        }
                                    }}
                                />
                            ) : (
                                <User size={48} color={colors.textMuted} />
                            )}
                            {isEditing && (
                                <label
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        background: "rgba(0,0,0,0.5)",
                                        border: "none",
                                        color: colors.text,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 11
                                    }}
                                >
                                    <Camera size={24} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        hidden
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                const reader = new FileReader()
                                                reader.onload = () => setCroppingImage({ type: 'avatar', dataUrl: reader.result as string, file })
                                                reader.readAsDataURL(file)
                                            }
                                        }}
                                    />
                                </label>
                            )}
                        </div>
                        <div style={{ paddingBottom: "12px", zIndex: 10, flex: 1 }}>
                            {isEditing ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <input
                                        value={editData.full_name || ""}
                                        onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                        placeholder="Full Name"
                                        style={{
                                            background: "rgba(255,255,255,0.05)",
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: "6px",
                                            padding: "8px 12px",
                                            color: colors.text,
                                            fontSize: "24px",
                                            fontWeight: "800",
                                            width: "300px"
                                        }}
                                    />
                                    <input
                                        value={editData.username || ""}
                                        onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                                        placeholder="Username"
                                        style={{
                                            background: "rgba(255,255,255,0.05)",
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: "6px",
                                            padding: "4px 12px",
                                            color: colors.textMuted,
                                            fontFamily: "monospace",
                                            fontSize: "14px",
                                            width: "200px"
                                        }}
                                    />
                                </div>
                            ) : (
                                <>
                                    <h1 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "0px", letterSpacing: "-0.03em" }}>
                                        {profile.full_name || profile.username}
                                    </h1>
                                    <div style={{ fontSize: "14px", color: colors.textMuted, fontFamily: "monospace" }}>
                                        @{profile.username || "developer"}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 40px 100px 40px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "60px" }}>
                        {/* Sidebar: Bio & Links */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: colors.textMuted }}>About</h3>
                                {isEditing ? (
                                    <textarea
                                        value={editData.bio || ""}
                                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                        placeholder="Tell us about yourself..."
                                        style={{
                                            background: "rgba(255,255,255,0.05)",
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: "8px",
                                            padding: "12px",
                                            color: colors.textSecondary,
                                            fontSize: "14px",
                                            lineHeight: "1.7",
                                            width: "100%",
                                            minHeight: "120px",
                                            resize: "vertical"
                                        }}
                                    />
                                ) : (
                                    <p style={{ color: colors.textSecondary, fontSize: "14px", lineHeight: "1.7", margin: 0 }}>
                                        {profile.bio || "Crafting premium templates and applications for the Foldaa ecosystem."}
                                    </p>
                                )}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <h3 style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: colors.textMuted }}>Links</h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {isEditing ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <Globe size={14} color={colors.accent} />
                                                <input
                                                    value={editData.website || ""}
                                                    onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                                                    placeholder="Website URL"
                                                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border}`, borderRadius: "6px", padding: "6px 12px", color: colors.text, fontSize: "13px", flex: 1 }}
                                                />
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <Twitter size={14} color="#1DA1F2" />
                                                <input
                                                    value={editData.twitter || editData.twitter_handle || ""}
                                                    onChange={(e) => setEditData({ ...editData, twitter: e.target.value })}
                                                    placeholder="Twitter Handle"
                                                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border}`, borderRadius: "6px", padding: "6px 12px", color: colors.text, fontSize: "13px", flex: 1 }}
                                                />
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <Github size={14} color={colors.text} />
                                                <input
                                                    value={editData.github || editData.github_handle || ""}
                                                    onChange={(e) => setEditData({ ...editData, github: e.target.value })}
                                                    placeholder="GitHub Handle"
                                                    style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border}`, borderRadius: "6px", padding: "6px 12px", color: colors.text, fontSize: "13px", flex: 1 }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {profile.website && (
                                                <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "10px", color: colors.textSecondary, textDecoration: "none", fontSize: "13px" }}>
                                                    <Globe size={14} color={colors.accent} /> {profile.website.replace(/^https?:\/\//, '')}
                                                </a>
                                            )}
                                            {(profile.twitter || profile.twitter_handle) && (
                                                <a href={`https://twitter.com/${profile.twitter || profile.twitter_handle}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "10px", color: colors.textSecondary, textDecoration: "none", fontSize: "13px" }}>
                                                    <Twitter size={14} color="#1DA1F2" /> @{profile.twitter || profile.twitter_handle}
                                                </a>
                                            )}
                                            {(profile.github || profile.github_handle) && (
                                                <a href={`https://github.com/${profile.github || profile.github_handle}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "10px", color: colors.textSecondary, textDecoration: "none", fontSize: "13px" }}>
                                                    <Github size={14} color={colors.text} /> @{profile.github || profile.github_handle}
                                                </a>
                                            )}
                                        </>
                                    )}
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: colors.textMuted, fontSize: "13px", marginTop: "8px", paddingTop: "16px", borderTop: `1px solid ${colors.border}` }}>
                                        <Calendar size={14} />
                                        <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Stream: Assets */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                            <div style={{ borderBottom: `1px solid ${colors.border}`, display: "flex", gap: "32px", paddingBottom: "1px" }}>
                                <div style={{
                                    paddingBottom: "16px",
                                    borderBottom: `2px solid #FFF`,
                                    color: colors.text,
                                    fontSize: "14px",
                                    fontWeight: "700",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}>
                                    <span style={{ color: "#FFF" }}>∷</span> Published Assets
                                    <span style={{
                                        fontSize: "11px",
                                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                                        color: "#FFF",
                                        padding: "2px 8px",
                                        borderRadius: "6px",
                                        marginLeft: "4px"
                                    }}>{projects.length}</span>
                                </div>
                            </div>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                                gap: "24px"
                            }}>
                                {projects.map((item) => {
                                    const coverUrl = getListingCover(item)
                                    const videoUrl = getListingVideo(item)
                                    const isVideo = videoUrl && (videoUrl.endsWith('.mp4') || videoUrl.includes('youtube') || videoUrl.includes('vimeo'))

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => onProjectClick?.(item)}
                                            style={{
                                                backgroundColor: colors.cardBg,
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: "16px",
                                                overflow: "hidden",
                                                cursor: "pointer",
                                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.borderColor = colors.accent
                                                e.currentTarget.style.transform = "translateY(-4px)"
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.borderColor = colors.border
                                                e.currentTarget.style.transform = "translateY(0)"
                                            }}
                                        >
                                            <div style={{ height: "180px", backgroundColor: "#020202", position: "relative", borderBottom: `1px solid ${colors.border}` }}>
                                                {videoUrl ? (
                                                    <video
                                                        src={videoUrl}
                                                        muted
                                                        autoPlay
                                                        loop
                                                        playsInline
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    />
                                                ) : coverUrl ? (
                                                    <img src={coverUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, #080808 0%, #121212 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <Package size={40} color="rgba(255,255,255,0.03)" />
                                                    </div>
                                                )}
                                                <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                                                    <div style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700", color: "#fff", textTransform: "uppercase" }}>
                                                        {item.category}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ padding: "20px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                                                    <h4 style={{ fontSize: "16px", fontWeight: "700", color: colors.text, margin: 0 }}>{item.title}</h4>
                                                    <ExternalLink size={14} color={colors.textMuted} />
                                                </div>
                                                <p style={{ fontSize: "13px", color: colors.textSecondary, marginBottom: "20px", height: "36px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: "1.5" }}>{item.tagline}</p>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: `1px solid ${colors.border}` }}>
                                                    <span style={{ fontSize: "14px", color: colors.accent, fontWeight: "800", fontFamily: "monospace" }}>
                                                        {item.is_for_sale ? `$${item.asking_price}` : "FREE"}
                                                    </span>
                                                    <div style={{ display: "flex", gap: "8px", color: colors.textMuted, fontSize: "11px" }}>
                                                        <span>{item.view_count || 0} views</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {croppingImage && (
                <ImageCropModal
                    type={croppingImage.type}
                    dataUrl={croppingImage.dataUrl}
                    colors={colors}
                    onCancel={() => setCroppingImage(null)}
                    onCrop={(blob) => {
                        const file = new File([blob], croppingImage.file.name, { type: croppingImage.file.type })
                        handleImageUpload(croppingImage.type, file)
                        setCroppingImage(null)
                    }}
                />
            )}
        </div>
    )
}

function ImageCropModal({ type, dataUrl, onCrop, onCancel, colors }: { type: 'avatar' | 'cover', dataUrl: string, onCrop: (blob: Blob) => void, onCancel: () => void, colors: any }) {
    const [zoom, setZoom] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const imgRef = useRef<HTMLImageElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        })
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleApply = () => {
        const canvas = document.createElement('canvas')
        const img = imgRef.current
        const container = containerRef.current
        if (!img || !container) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size to match the frame aspect ratio but in good quality
        const cropWidth = type === 'avatar' ? 400 : 1200
        const cropHeight = type === 'avatar' ? 400 : 400
        canvas.width = cropWidth
        canvas.height = cropHeight

        // Fill background
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Calculate drawing parameters
        const rect = container.getBoundingClientRect()
        const scale = img.naturalWidth / (img.width * zoom)

        // Draw the image onto the canvas based on current position and zoom
        // We need to map the visible area in the container to the image coordinates
        const drawX = position.x * (img.naturalWidth / (img.width * zoom))
        const drawY = position.y * (img.naturalHeight / (img.height * zoom))

        ctx.drawImage(
            img,
            -position.x * (img.naturalWidth / (img.width * zoom)),
            -position.y * (img.naturalHeight / (img.height * zoom)),
            container.offsetWidth * (img.naturalWidth / (img.width * zoom)),
            container.offsetHeight * (img.naturalHeight / (img.height * zoom)),
            0,
            0,
            canvas.width,
            canvas.height
        )

        canvas.toBlob((blob) => {
            if (blob) onCrop(blob)
        }, 'image/jpeg', 0.9)
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: type === 'avatar' ? '500px' : '900px',
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '24px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Crop {type === 'avatar' ? 'Avatar' : 'Banner'}</h3>
                    <button onClick={onCancel} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
                    <div
                        ref={containerRef}
                        style={{
                            width: '100%',
                            aspectRatio: type === 'avatar' ? '1/1' : '3/1',
                            maxWidth: type === 'avatar' ? '300px' : '800px',
                            border: `2px dashed ${colors.accent}`,
                            borderRadius: type === 'avatar' ? '50%' : '12px',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            backgroundColor: '#050505'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <img
                            ref={imgRef}
                            src={dataUrl}
                            alt="To crop"
                            draggable={false}
                            style={{
                                position: 'absolute',
                                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                transformOrigin: '0 0',
                                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                            }}
                        />
                        {/* Overlay to show what will be cropped */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            pointerEvents: 'none',
                            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                            borderRadius: type === 'avatar' ? '50%' : '12px'
                        }} />
                    </div>

                    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <ZoomOut size={16} color={colors.textMuted} />
                        <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.01"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            style={{ flex: 1, accentColor: colors.accent, height: '4px', cursor: 'pointer' }}
                        />
                        <ZoomIn size={16} color={colors.textMuted} />
                    </div>

                    <p style={{ fontSize: '12px', color: colors.textMuted, textAlign: 'center', margin: 0 }}>
                        Drag to reposition. Use the slider to zoom.
                    </p>
                </div>

                <div style={{ padding: '24px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            background: 'none',
                            color: colors.text,
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            background: colors.accent,
                            color: '#000',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Save size={16} /> Apply Crop
                    </button>
                </div>
            </div>
        </div>
    )
}
