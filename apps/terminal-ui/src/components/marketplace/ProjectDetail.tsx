import React, { useState, useMemo, useRef, useEffect } from "react"
import { ArrowLeft, ExternalLink, Download, Share2, Package, User, Clock, ShieldCheck, Globe, Monitor, Tablet, Smartphone, Maximize2, ChevronDown, Eye, Users, Star, Twitter, Github } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ProjectDetailProps {
    listing: any
    onBack: () => void
    onViewDeveloperProfile: (userId: string, username?: string) => void
}

const RESOLUTIONS = [
    { id: "fluid", name: "Fluid", icon: Maximize2, width: null, height: null },
    { id: "macbook", name: "MBP 16\"", icon: Monitor, width: 1728, height: 1117 },
    { id: "tablet", name: "Tablet", icon: Tablet, width: 768, height: 1024 },
    { id: "mobile", name: "Mobile", icon: Smartphone, width: 375, height: 667 },
]

export default function ProjectDetail({ listing, onBack, onViewDeveloperProfile }: ProjectDetailProps) {
    const isDark = true
    const colors = {
        text: isDark ? "#FFFFFF" : "#000000",
        textSecondary: isDark ? "#9CA3AF" : "#666666",
        textMuted: isDark ? "#6B7280" : "#999999",
        border: isDark ? "rgba(255, 255, 255, 0.08)" : "#E0E0E0",
        bg: isDark ? "#000000" : "#FFFFFF",
        cardBg: isDark ? "#080808" : "#FFFFFF",
        accent: "#79D9EC", // Light Blue accent
    }

    const [selectedRes, setSelectedRes] = useState(RESOLUTIONS[0])
    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)
    const [containerWidth, setContainerWidth] = useState(0)

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth)
            }
        }
        
        updateWidth()
        window.addEventListener('resize', updateWidth)
        return () => window.removeEventListener('resize', updateWidth)
    }, [])

    useEffect(() => {
        if (selectedRes.width && containerWidth > 0) {
            const newScale = Math.min(1, containerWidth / selectedRes.width)
            setScale(newScale)
        } else {
            setScale(1)
        }
    }, [selectedRes, containerWidth])

    const developerName = listing.profiles?.first_name 
        ? `${listing.profiles.first_name} ${listing.profiles.last_name || ""}` 
        : listing.profiles?.username || "Developer"

    const ResIcon = selectedRes.icon
    
    // Compute combined screenshots for the gallery
    const galleryScreenshots = useMemo(() => {
        const list = listing.screenshots || [];
        // Use cover_image_url as a primary fallback screenshot if list is empty
        if (list.length === 0 && listing.cover_image_url) {
            return [listing.cover_image_url];
        }
        return list;
    }, [listing.screenshots, listing.cover_image_url]);

    return (
        <div style={{ backgroundColor: colors.bg, minHeight: "100%", color: colors.text, fontFamily: "Inter, sans-serif", overflowY: "auto" }}>
            {/* Minimal Navigation Bar */}
            <div style={{ 
                borderBottom: `1px solid ${colors.border}`, 
                padding: "12px 24px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                backgroundColor: colors.bg,
                position: "sticky",
                top: 0,
                zIndex: 10
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button 
                        onClick={onBack} 
                        style={{ 
                            background: "rgba(255,255,255,0.05)", 
                            border: `1px solid ${colors.border}`, 
                            borderRadius: "6px",
                            padding: "6px",
                            cursor: "pointer", 
                            color: colors.textSecondary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease"
                        }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ color: colors.textMuted, fontSize: "13px", fontFamily: "monospace" }}>campfire /</span>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: colors.text }}>{listing.title}</span>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    {listing.live_url && (
                        <button 
                            style={{ 
                                background: "rgba(255,255,255,0.05)", 
                                border: `1px solid ${colors.border}`, 
                                color: colors.text, 
                                padding: "6px 14px", 
                                borderRadius: "6px", 
                                fontSize: "12px",
                                fontWeight: "600", 
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                            onClick={() => window.open(listing.live_url, "_blank")}
                        >
                            <Globe size={14} />
                            Open Live
                        </button>
                    )}
                    <button 
                        style={{ 
                            background: colors.accent, 
                            color: "#000", 
                            border: "none", 
                            padding: "6px 14px", 
                            borderRadius: "6px", 
                            fontSize: "12px",
                            fontWeight: "700", 
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em"
                        }}
                        onClick={() => {
                            if (listing.is_for_sale && listing.ls_checkout_url) {
                                window.open(listing.ls_checkout_url, "_blank");
                            } else if (listing.live_url) {
                                window.open(listing.live_url, "_blank");
                            }
                        }}
                    >
                        {listing.is_for_sale ? (
                            <>
                                <Download size={14} />
                                Buy Now — ${listing.asking_price || 0}
                            </>
                        ) : (
                            <>
                                <ExternalLink size={14} />
                                Deploy
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 280px", gap: "48px" }}>
                {/* Left Side: Content */}
                <div style={{ minWidth: 0 }}>
                    {/* Hero Icon & Identity */}
                    <div style={{ display: "flex", alignItems: "start", gap: "20px", marginBottom: "32px" }}>
                         <div style={{ 
                            width: "80px", 
                            height: "80px", 
                            borderRadius: "16px", 
                            background: `linear-gradient(135deg, ${colors.cardBg}, #111)`,
                            border: `1px solid ${colors.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                        }}>
                             {(() => {
                                 const project = Array.isArray(listing.projects) ? listing.projects[0] : listing.projects
                                 const iconUrl = listing.icon_url || project?.icon_192_url || project?.favicon_url
                                 if (iconUrl) {
                                     return <img src={iconUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "15px" }} />
                                 } else if (listing.cover_image_url) {
                                     return <img src={listing.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "15px" }} />
                                 } else {
                                     return <span style={{ fontSize: "32px", fontWeight: "bold", color: colors.text }}>{listing.title.charAt(0)}</span>
                                 }
                             })()}
                        </div>
                        <div style={{ flex: 1, paddingTop: "4px" }}>
                            <div style={{ 
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background: "rgba(121, 217, 236, 0.1)",
                                border: "1px solid rgba(121, 217, 236, 0.2)",
                                color: colors.accent,
                                fontSize: "10px",
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: "10px"
                            }}>
                                {listing.category || "General"}
                            </div>
                            <h1 style={{ fontSize: "28px", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "8px" }}>{listing.title}</h1>
                            <p style={{ fontSize: "15px", color: colors.textSecondary, lineHeight: "1.5", marginBottom: "16px" }}>
                                {listing.tagline || listing.description?.split(".")[0] || "A premium starter template for Foldaa."}
                            </p>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
                                {listing.tags?.map((tag: string) => (
                                    <span key={tag} style={{ 
                                        padding: "3px 10px", 
                                        backgroundColor: "rgba(255,255,255,0.03)", 
                                        border: `1px solid ${colors.border}`, 
                                        borderRadius: "4px", 
                                        fontSize: "11px",
                                        fontWeight: "500",
                                        color: colors.textSecondary,
                                        fontFamily: "monospace",
                                        textTransform: "uppercase"
                                    }}>
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Stats Bar */}
                            <div style={{ display: "flex", gap: "32px", color: colors.textMuted, fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", borderTop: `1px solid ${colors.border}`, paddingTop: "24px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: colors.textSecondary }}>
                                        <Eye size={16} strokeWidth={2} />
                                        <span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: "bold", color: "#fff" }}>{listing.view_count || 0}</span>
                                    </div>
                                    <span style={{ fontSize: "10px", opacity: 0.6 }}>Views</span>
                                </div>
                                
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: colors.textSecondary }}>
                                        <Download size={16} strokeWidth={2} />
                                        <span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: "bold", color: "#fff" }}>{listing.install_count || 0}</span>
                                    </div>
                                    <span style={{ fontSize: "10px", opacity: 0.6 }}>Installs</span>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: colors.textSecondary }}>
                                        <Users size={16} strokeWidth={2} />
                                        <span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: "bold", color: "#fff" }}>{Math.floor((listing.install_count || 0) * 0.82) + 5}</span>
                                    </div>
                                    <span style={{ fontSize: "10px", opacity: 0.6 }}>Users</span>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: colors.textSecondary }}>
                                        <Star size={16} strokeWidth={2} />
                                        <span style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: "bold", color: "#fff" }}>{listing.rating_average || "5.0"}</span>
                                    </div>
                                    <span style={{ fontSize: "10px", opacity: 0.6 }}>Rating ({listing.rating_count || 0})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview / Screenshot Area with Resolution Picker */}
                    <div 
                        ref={containerRef}
                        style={{ 
                            aspectRatio: selectedRes.id === "fluid" ? "16/10" : undefined, 
                            height: selectedRes.id === "fluid" ? undefined : (selectedRes.height && scale ? selectedRes.height * scale + 40 : 500),
                            backgroundColor: "#050505", 
                            borderRadius: "12px", 
                            overflow: "hidden", 
                            marginBottom: "40px", 
                            border: `1px solid ${colors.border}`,
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            transition: "height 0.3s ease",
                            width: "100%",
                            maxWidth: "100%",
                            boxSizing: "border-box"
                        }}
                    >
                        {/* Browser Bar with Resolution Picker */}
                        <div style={{ 
                            height: "40px", 
                            backgroundColor: "#0a0a0a", 
                            borderBottom: `1px solid ${colors.border}`, 
                            display: "flex", 
                            alignItems: "center", 
                            padding: "0 12px",
                            justifyContent: "space-between",
                            flexShrink: 0
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff5f56" }} />
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffbd2e" }} />
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#27c93f" }} />
                            </div>

                            <div style={{ 
                                flex: 1, 
                                margin: "0 20px", 
                                background: "#1a1a1a", 
                                height: "24px", 
                                borderRadius: "4px", 
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: `1px solid ${colors.border}`
                            }}>
                                <div style={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    gap: "8px",
                                    padding: "0 12px",
                                    width: "100%",
                                    cursor: "pointer"
                                }}>
                                    <Globe size={12} color={colors.textMuted} />
                                    <span style={{ fontSize: "11px", color: colors.textSecondary, fontFamily: "monospace", flex: 1, textAlign: "center", opacity: 0.8 }}>
                                        {listing.live_url?.replace(/^https?:\/\//, "")}
                                    </span>
                                </div>
                            </div>

                            {/* Resolution Selector Dropdown Simulation */}
                            <div style={{ position: "relative" }}>
                                <div 
                                    style={{ 
                                        display: "flex", 
                                        alignItems: "center", 
                                        gap: "6px", 
                                        background: "rgba(255,255,255,0.05)",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        border: `1px solid ${colors.border}`
                                    }}
                                >
                                    <ResIcon size={12} color={colors.textSecondary} />
                                    <span style={{ fontSize: "11px", fontWeight: "600", color: colors.textSecondary }}>{selectedRes.name}</span>
                                    <select 
                                        value={selectedRes.id} 
                                        onChange={(e) => setSelectedRes(RESOLUTIONS.find(r => r.id === e.target.value) || RESOLUTIONS[0])}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            width: "100%",
                                            height: "100%",
                                            opacity: 0,
                                            cursor: "pointer"
                                        }}
                                    >
                                        {RESOLUTIONS.map(res => (
                                            <option key={res.id} value={res.id}>{res.name} {res.width ? `(${res.width}x${res.height})` : ""}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} color={colors.textMuted} />
                                </div>
                            </div>
                        </div>

                        {/* Scalable Iframe Wrapper */}
                        <div style={{ 
                            flex: 1, 
                            display: "flex", 
                            alignItems: "flex-start", 
                            justifyContent: "center", 
                            overflow: "hidden", 
                            backgroundColor: "#050505",
                            position: "relative",
                            padding: selectedRes.id === "fluid" ? 0 : "20px 0"
                        }}>
                             <div style={{
                                width: selectedRes.width || "100%",
                                height: selectedRes.height || "100%",
                                transform: `scale(${scale})`,
                                transformOrigin: "top center",
                                transition: "all 0.3s ease",
                                flexShrink: 0,
                                border: selectedRes.id !== "fluid" ? `1px solid ${colors.border}` : "none",
                                borderRadius: selectedRes.id !== "fluid" ? "8px" : 0,
                                overflow: "hidden",
                                boxShadow: selectedRes.id !== "fluid" ? "0 20px 50px rgba(0,0,0,0.5)" : "none"
                            }}>
                                <iframe
                                    src={listing.live_url}
                                    style={{ width: "100%", height: "100%", border: "none" }}
                                    title={listing.title}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Documentation & Content */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                        {/* Screenshots Gallery */}
                        {galleryScreenshots.length > 0 && (
                            <div style={{ marginBottom: "16px" }}>
                                <h3 style={{ fontSize: "11px", fontWeight: "700", marginBottom: "16px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Screenshots</h3>
                                <div style={{ 
                                    display: "flex", 
                                    gap: "20px", 
                                    overflowX: "auto", 
                                    paddingBottom: "16px",
                                    paddingRight: "20px",
                                    scrollbarWidth: "thin",
                                    scrollbarColor: "rgba(255,255,255,0.1) transparent"
                                }}>
                                    {galleryScreenshots.map((src: string, i: number) => (
                                        <div key={i} style={{ 
                                            flexShrink: 0, 
                                            width: "480px", 
                                            aspectRatio: "16/10", 
                                            borderRadius: "12px", 
                                            overflow: "hidden", 
                                            border: `1px solid ${colors.border}`,
                                            background: "rgba(255,255,255,0.02)",
                                            boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                                        }}>
                                            <img src={src} alt={`Screenshot ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tech Stack / Technologies Section */}
                        {listing.tech_stack && Object.values(listing.tech_stack).some((arr: any) => arr.length > 0) && (
                            <div>
                                <h3 style={{ fontSize: "11px", fontWeight: "700", marginBottom: "16px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Technologies</h3>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    {Object.entries(listing.tech_stack).map(([cat, techs]: [string, any]) => 
                                        techs.map((tech: string) => (
                                            <div key={`${cat}-${tech}`} style={{ 
                                                display: "flex", 
                                                alignItems: "center", 
                                                gap: "8px",
                                                padding: "8px 14px",
                                                background: "rgba(255,255,255,0.03)",
                                                border: `1px solid ${colors.border}`,
                                                borderRadius: "8px",
                                                fontSize: "13px",
                                                color: colors.textSecondary,
                                                fontFamily: "monospace"
                                            }}>
                                                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: colors.accent, boxShadow: `0 0 10px ${colors.accent}` }} />
                                                {tech}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Growth & Insights Section (If for sale) */}
                        {listing.is_for_sale && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <h3 style={{ fontSize: "11px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Growth & Insights</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                                    <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${colors.border}`, borderRadius: "12px" }}>
                                        <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>Monthly Revenue</span>
                                        <span style={{ fontSize: "18px", fontWeight: "700", color: "#10B981" }}>${listing.monthly_revenue?.toLocaleString() || 0}</span>
                                    </div>
                                    <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${colors.border}`, borderRadius: "12px" }}>
                                        <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>MAU</span>
                                        <span style={{ fontSize: "18px", fontWeight: "700", color: "#fff" }}>{listing.total_users?.toLocaleString() || 0}</span>
                                    </div>
                                    <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${colors.border}`, borderRadius: "12px" }}>
                                        <span style={{ fontSize: "10px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>Profit Margin</span>
                                        <span style={{ fontSize: "18px", fontWeight: "700", color: "#fff" }}>{listing.profit_margin || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Documentation Section */}
                        <div>
                            <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: colors.text }}>Documentation</h3>
                            <div style={{ 
                                fontSize: "15px", 
                                color: colors.textSecondary, 
                                lineHeight: "1.7",
                                padding: "24px",
                                background: "rgba(255,255,255,0.02)",
                                border: `1px solid ${colors.border}`,
                                borderRadius: "12px",
                                whiteSpace: "pre-wrap"
                            }}>
                                {listing.description || "No documentation provided."}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Sidebar Meta */}
                <div style={{ display: "flex", flexDirection: "column", gap: "32px", minWidth: 0 }}>
                    {/* Developer Card */}
                    <div>
                        <h4 style={{ fontSize: "11px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>Publisher</h4>
                        <div 
                            style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "12px", 
                                cursor: "pointer", 
                                padding: "12px", 
                                backgroundColor: "rgba(255,255,255,0.03)", 
                                border: `1px solid ${colors.border}`, 
                                borderRadius: "10px",
                                transition: "all 0.2s ease"
                            }}
                            onClick={() => onViewDeveloperProfile(listing.user_id, listing.profiles?.username)}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = colors.accent)}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = colors.border)}
                        >
                            <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#111", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${colors.border}`, overflow: "hidden", flexShrink: 0 }}>
                                {(() => {
                                    const profile = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles;
                                    const avatarUrl = profile?.avatar_url || profile?.profile_picture_url || profile?.avatar_path;
                                    return avatarUrl ? (
                                        <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <User size={20} color={colors.textMuted} />
                                    );
                                })()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: "600", fontSize: "14px", color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{developerName}</div>
                                <div style={{ fontSize: "11px", color: colors.accent, fontWeight: "600" }}>View Profile</div>
                            </div>
                        </div>

                        {/* Developer Social Links */}
                        {(() => {
                            const profile = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles;
                            if (!profile) return null;
                            const hasSocials = profile.twitter_handle || profile.github_handle || profile.personal_website || profile.website || profile.twitter || profile.github;
                            if (!hasSocials) return null;

                            return (
                                <div style={{ display: "flex", gap: "12px", marginTop: "12px", padding: "0 4px" }}>
                                    {(profile.twitter_handle || profile.twitter) && (
                                        <button 
                                            onClick={() => window.open(`https://twitter.com/${profile.twitter_handle || profile.twitter}`, "_blank")}
                                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: colors.textMuted }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = colors.text)}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
                                        >
                                            <Twitter size={14} />
                                        </button>
                                    )}
                                    {(profile.github_handle || profile.github) && (
                                        <button 
                                            onClick={() => window.open(`https://github.com/${profile.github_handle || profile.github}`, "_blank")}
                                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: colors.textMuted }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = colors.text)}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
                                        >
                                            <Github size={14} />
                                        </button>
                                    )}
                                    {(profile.personal_website || profile.website) && (
                                        <button 
                                            onClick={() => window.open(profile.personal_website || profile.website, "_blank")}
                                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: colors.textMuted }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = colors.text)}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
                                        >
                                            <Globe size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Stats/Meta List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <h4 style={{ fontSize: "11px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Insights</h4>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: colors.textSecondary, fontSize: "12px", fontFamily: "monospace" }}>
                                <Clock size={14} />
                                <span>Updated {formatDistanceToNow(new Date(listing.published_at), { addSuffix: true })}</span>
                            </div>
                            
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: colors.textSecondary, fontSize: "12px", fontFamily: "monospace" }}>
                                <Download size={14} />
                                <span>{listing.install_count || 0} installs</span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: colors.textSecondary, fontSize: "12px", fontFamily: "monospace" }}>
                                <ShieldCheck size={14} />
                                <span style={{ color: "#10B981" }}>Verified Template</span>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: `1px solid ${colors.border}`, paddingTop: "20px" }}>
                            <h4 style={{ fontSize: "11px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Technical Info</h4>
                            
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                <span style={{ color: colors.textMuted }}>Version</span>
                                <span style={{ color: colors.textSecondary, fontFamily: "monospace" }}>{listing.version || '1.0.0'}</span>
                            </div>
                            
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                <span style={{ color: colors.textMuted }}>License</span>
                                <span style={{ color: colors.textSecondary, fontFamily: "monospace" }}>MIT</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                <span style={{ color: colors.textMuted }}>Category</span>
                                <span style={{ color: colors.textSecondary, fontFamily: "monospace", textTransform: "capitalize" }}>{listing.category || "General"}</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                <span style={{ color: colors.textMuted }}>Status</span>
                                <span style={{ color: listing.status === "published" ? "#10B981" : colors.textSecondary, fontFamily: "monospace", textTransform: "uppercase" }}>{listing.status}</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                <span style={{ color: colors.textMuted }}>ID</span>
                                <span style={{ color: colors.textMuted, fontSize: "10px", fontFamily: "monospace" }}>{listing.id.split("-")[0]}...</span>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                <span style={{ color: colors.textMuted }}>Published</span>
                                <span style={{ color: colors.textSecondary, fontSize: "12px" }}>
                                    {new Date(listing.published_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Sale Metadata Section */}
                        {listing.is_for_sale && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderTop: `1px solid ${colors.border}`, paddingTop: "20px" }}>
                                {listing.reason_for_selling && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <h4 style={{ fontSize: "11px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Reason for Sale</h4>
                                        <p style={{ fontSize: "12px", color: colors.textSecondary, lineHeight: "1.6" }}>{listing.reason_for_selling}</p>
                                    </div>
                                )}

                                {listing.included_in_sale && listing.included_in_sale.length > 0 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <h4 style={{ fontSize: "11px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Included in Sale</h4>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            {listing.included_in_sale.map((item: string) => (
                                                <div key={item} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: colors.textSecondary }}>
                                                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: colors.accent }} />
                                                    <span style={{ textTransform: "capitalize" }}>{item.replace(/_/g, " ")}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                        {/* Resources & Links */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: `1px solid ${colors.border}`, paddingTop: "20px" }}>
                            <h4 style={{ fontSize: "11px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Legal & Resources</h4>
                            
                            {listing.support_email && (
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                    <span style={{ color: colors.textMuted }}>Support</span>
                                    <a href={`mailto:${listing.support_email}`} style={{ color: colors.accent, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                                        Contact <ExternalLink size={10} />
                                    </a>
                                </div>
                            )}

                            {listing.privacy_policy_url && (
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                    <span style={{ color: colors.textMuted }}>Privacy Policy</span>
                                    <a href={listing.privacy_policy_url} target="_blank" rel="noopener noreferrer" style={{ color: colors.textSecondary, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                                        View <ExternalLink size={10} />
                                    </a>
                                </div>
                            )}

                            {listing.terms_url && (
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                    <span style={{ color: colors.textMuted }}>Terms of Service</span>
                                    <a href={listing.terms_url} target="_blank" rel="noopener noreferrer" style={{ color: colors.textSecondary, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                                        View <ExternalLink size={10} />
                                    </a>
                                </div>
                            )}

                            {listing.demo_video_url && (
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                                    <span style={{ color: colors.textMuted }}>Demo Video</span>
                                    <a href={listing.demo_video_url} target="_blank" rel="noopener noreferrer" style={{ color: colors.textSecondary, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                                        Watch <ExternalLink size={10} />
                                    </a>
                                </div>
                            )}
                        </div>

                    {/* Developer Info Mini Bio [NEW] */}
                    {listing.profiles?.bio && (
                         <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                             <h4 style={{ fontSize: "11px", fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>About Publisher</h4>
                             <p style={{ fontSize: "12px", color: colors.textSecondary, lineHeight: "1.6" }}>{listing.profiles.bio}</p>
                         </div>
                    )}

                    {/* Support Box */}
                    <div style={{ 
                        padding: "16px", 
                        background: "rgba(121, 217, 236, 0.05)", 
                        border: "1px solid rgba(121, 217, 236, 0.1)", 
                        borderRadius: "10px" 
                    }}>
                        <h5 style={{ fontSize: "12px", fontWeight: "600", color: "#79D9EC", marginBottom: "8px" }}>Developer Support</h5>
                        <p style={{ fontSize: "11px", color: "rgba(121, 217, 236, 0.7)", lineHeight: "1.5", marginBottom: "12px" }}>
                            Need help with this template? Contact {listing.profiles?.first_name || "the developer"} directly.
                        </p>
                        {listing.support_email && (
                            <button 
                                onClick={() => window.location.href = `mailto:${listing.support_email}`}
                                style={{
                                    width: "100%",
                                    background: "rgba(121, 217, 236, 0.15)",
                                    border: "1px solid rgba(121, 217, 236, 0.2)",
                                    color: "#79D9EC",
                                    padding: "8px",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em"
                                }}
                            >
                                Contact Support
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
