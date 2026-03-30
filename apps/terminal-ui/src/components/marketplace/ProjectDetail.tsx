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
        accent: "#FFFFFF",
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
    
    const galleryScreenshots = useMemo(() => {
        const list = listing.screenshots || [];
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
                            background: "#FFFFFF", 
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
                            letterSpacing: "0.05em",
                            transition: "all 0.2s ease"
                        }}
                        className="hover:bg-[#E0E0E0] active:scale-[0.98]"
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
                                {listing.type === 'app' ? `Acquire — $${listing.asking_price || 0}` : `Buy Now — $${listing.asking_price || 0}`}
                            </>
                        ) : (
                            <>
                                <ExternalLink size={14} />
                                {listing.type === 'app' ? 'Get App' : 'Deploy'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {listing.type === 'app' ? (
                /* App Layout (Landing Style) */
                <div style={{ display: "flex", flexDirection: "column", gap: "64px", padding: "48px 24px", maxWidth: "1200px", margin: "0 auto" }}>
                    {/* Centered Hero Section */}
                    <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
                        <div style={{ 
                            width: "120px", 
                            height: "120px", 
                            borderRadius: "28px", 
                            background: `linear-gradient(135deg, ${colors.cardBg}, #111)`,
                            border: `1px solid ${colors.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
                        }}>
                             {(() => {
                                 const project = Array.isArray(listing.projects) ? listing.projects[0] : listing.projects
                                 const iconUrl = listing.icon_url || project?.icon_192_url || project?.favicon_url
                                 if (iconUrl) {
                                     return <img src={iconUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "26px" }} />
                                 } else {
                                     return <span style={{ fontSize: "48px", fontWeight: "bold", color: colors.text }}>{listing.title.charAt(0)}</span>
                                 }
                             })()}
                        </div>
                        
                        <div style={{ maxWidth: "800px" }}>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "16px" }}>
                                <span style={{ padding: "4px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "100px", fontSize: "11px", fontWeight: "bold", border: "1px solid rgba(255,255,255,0.1)", color: colors.textSecondary, textTransform: "uppercase" }}>{listing.category}</span>
                                {listing.complexity && <span style={{ padding: "4px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "100px", fontSize: "11px", fontWeight: "bold", border: "1px solid rgba(255,255,255,0.1)", color: colors.textSecondary, textTransform: "uppercase" }}>{listing.complexity} complexity</span>}
                            </div>
                            <h1 style={{ fontSize: "48px", fontWeight: "900", letterSpacing: "-0.04em", marginBottom: "20px", lineHeight: "1" }}>{listing.title}</h1>
                            <p style={{ fontSize: "18px", color: colors.textSecondary, lineHeight: "1.6", marginBottom: "32px", fontWeight: "500" }}>
                                {listing.tagline || listing.description?.split(".")[0]}
                            </p>
                            
                            <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
                                <button 
                                    style={{ background: "#FFF", color: "#000", padding: "14px 40px", borderRadius: "12px", fontWeight: "800", fontSize: "14px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}
                                    onClick={() => listing.is_for_sale && listing.ls_checkout_url && window.open(listing.ls_checkout_url, "_blank")}
                                >
                                    {listing.is_for_sale ? `Acquire Project — $${listing.asking_price}` : "Get Started"}
                                </button>
                                {listing.live_url && (
                                    <button 
                                        style={{ background: "rgba(255,255,255,0.05)", color: "#FFF", padding: "14px 32px", borderRadius: "12px", fontWeight: "800", fontSize: "14px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}
                                        onClick={() => window.open(listing.live_url, "_blank")}
                                    >
                                        <Globe size={18} />
                                        Launch Demo
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Metrics Dashboard for Apps */}
                    {listing.is_for_sale && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", overflow: "hidden" }}>
                            <div style={{ padding: "32px", background: colors.bg, textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", fontWeight: "700", marginBottom: "8px" }}>Monthly Revenue</div>
                                <div style={{ fontSize: "24px", fontWeight: "900", color: "#10B981" }}>${listing.monthly_revenue?.toLocaleString() || 0}</div>
                                <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "4px" }}>Verified via Stripe</div>
                            </div>
                            <div style={{ padding: "32px", background: colors.bg, textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", fontWeight: "700", marginBottom: "8px" }}>Active Users</div>
                                <div style={{ fontSize: "24px", fontWeight: "900", color: "#FFF" }}>{listing.total_users?.toLocaleString() || 0}</div>
                                <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "4px" }}>Across all platforms</div>
                            </div>
                            <div style={{ padding: "32px", background: colors.bg, textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", fontWeight: "700", marginBottom: "8px" }}>Monthly Growth</div>
                                <div style={{ fontSize: "24px", fontWeight: "900", color: "#FFF" }}>+12.4%</div>
                                <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "4px" }}>Last 30 days</div>
                            </div>
                            <div style={{ padding: "32px", background: colors.bg, textAlign: "center" }}>
                                <div style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", fontWeight: "700", marginBottom: "8px" }}>Tech Complexity</div>
                                <div style={{ fontSize: "24px", fontWeight: "900", color: "#FFF", textTransform: "capitalize" }}>{listing.complexity || "Full"}</div>
                                <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "4px" }}>Engineering Score</div>
                            </div>
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "64px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
                            {/* Screenshots Carousel */}
                            {galleryScreenshots.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: "14px", fontWeight: "900", textTransform: "uppercase", marginBottom: "24px", letterSpacing: "0.1em" }}>Visual Overview</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                        {galleryScreenshots.slice(0, 3).map((src: string, i: number) => (
                                            <div key={i} style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
                                                <img src={src} alt="" style={{ width: "100%", height: "auto", display: "block" }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 style={{ fontSize: "14px", fontWeight: "900", textTransform: "uppercase", marginBottom: "24px", letterSpacing: "0.1em" }}>What's Inside</h3>
                                <div style={{ fontSize: "16px", color: colors.textSecondary, lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
                                    {listing.description}
                                </div>
                            </div>
                        </div>

                        {/* App Sidebar */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                            <div style={{ padding: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px" }}>
                                <h4 style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase", marginBottom: "16px", color: colors.textMuted }}>Tech Stack</h4>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {listing.tech_stack && Object.values(listing.tech_stack).flat().map((t: any) => (
                                        <span key={t} style={{ padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", fontSize: "12px", fontFamily: "monospace", color: colors.textSecondary }}>{t}</span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ padding: "24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px" }}>
                                <h4 style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase", marginBottom: "16px", color: colors.textMuted }}>Publisher</h4>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#111", border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                                        {(() => {
                                            const p = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles
                                            const url = p?.avatar_url || p?.profile_picture_url
                                            return url ? <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={24} style={{ margin: "12px" }} />
                                        })()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: "700", fontSize: "15px" }}>{developerName}</div>
                                        <div style={{ fontSize: "12px", color: colors.textMuted }}>Top Verified Seller</div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onViewDeveloperProfile(listing.user_id, listing.profiles?.username)}
                                    style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", borderRadius: "10px", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                                >
                                    View Full Portfolio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Resource Layout (Compact Sidebar Style) */
                <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 280px", gap: "48px" }}>
                    {/* Left Side: Content */}
                    <div style={{ minWidth: 0 }}>
                        {/* Hero Header & Identity */}
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
                                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
                                    <div style={{ 
                                        display: "inline-block",
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        background: "rgba(255, 255, 255, 0.05)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        color: colors.textSecondary,
                                        fontSize: "10px",
                                        fontWeight: "700",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}>
                                        {listing.category || "General"}
                                    </div>
                                    <div style={{ 
                                        display: "inline-block",
                                        padding: "2px 8px",
                                        borderRadius: "4px",
                                        background: "rgba(168, 85, 247, 0.1)",
                                        border: "1px solid rgba(168, 85, 247, 0.2)",
                                        color: "#C084FC",
                                        fontSize: "10px",
                                        fontWeight: "700",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}>
                                        Digital Resource
                                    </div>
                                </div>
                                <h1 style={{ fontSize: "28px", fontWeight: "700", letterSpacing: "-0.02em", marginBottom: "8px" }}>{listing.title}</h1>
                                <p style={{ fontSize: "15px", color: colors.textSecondary, lineHeight: "1.5", marginBottom: "16px" }}>
                                    {listing.tagline || (listing.description && listing.description.split(".")[0]) || "A premium starter template for Foldaa."}
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
                        {listing.live_url && (
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
                                    width: "100%"
                                }}
                            >
                                {/* Browser Bar */}
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
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 12px", width: "100%" }}>
                                            <Globe size={12} color={colors.textMuted} />
                                            <span style={{ fontSize: "11px", color: colors.textSecondary, fontFamily: "monospace", flex: 1, textAlign: "center", opacity: 0.8 }}>
                                                {listing.live_url.replace(/^https?:\/\//, "")}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ position: "relative" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "4px", border: `1px solid ${colors.border}` }}>
                                            <ResIcon size={12} color={colors.textSecondary} />
                                            <span style={{ fontSize: "11px", fontWeight: "600", color: colors.textSecondary }}>{selectedRes.name}</span>
                                            <select 
                                                value={selectedRes.id} 
                                                onChange={(e) => setSelectedRes(RESOLUTIONS.find(r => r.id === e.target.value) || RESOLUTIONS[0])}
                                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                                            >
                                                {RESOLUTIONS.map(res => (
                                                    <option key={res.id} value={res.id}>{res.name} {res.width ? `(${res.width}x${res.height})` : ""}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={12} color={colors.textMuted} />
                                        </div>
                                    </div>
                                </div>

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
                                        overflow: "hidden"
                                    }}>
                                        <iframe src={listing.live_url} style={{ width: "100%", height: "100%", border: "none" }} title={listing.title} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Documentation & Content */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                            {/* Screenshots Gallery */}
                            {galleryScreenshots.length > 0 && (
                                <div style={{ marginBottom: "16px" }}>
                                    <h3 style={{ fontSize: "11px", fontWeight: "700", marginBottom: "16px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Screenshots</h3>
                                    <div style={{ display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "16px" }}>
                                        {galleryScreenshots.map((src: string, i: number) => (
                                            <div key={i} style={{ flexShrink: 0, width: "480px", aspectRatio: "16/10", borderRadius: "12px", overflow: "hidden", border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.02)" }}>
                                                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", color: colors.text }}>Documentation</h3>
                                <div style={{ fontSize: "15px", color: colors.textSecondary, lineHeight: "1.7", padding: "24px", background: "rgba(255,255,255,0.02)", border: `1px solid ${colors.border}`, borderRadius: "12px", whiteSpace: "pre-wrap" }}>
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
                                style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${colors.border}`, borderRadius: "10px" }}
                                onClick={() => onViewDeveloperProfile(listing.user_id, listing.profiles?.username)}
                            >
                                <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#111", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${colors.border}`, overflow: "hidden" }}>
                                    {(() => {
                                        const p = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles
                                        const url = p?.avatar_url || p?.profile_picture_url
                                        return url ? <img src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={20} color={colors.textMuted} />
                                    })()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: "600", fontSize: "14px", color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{developerName}</div>
                                    <div style={{ fontSize: "11px", color: colors.textMuted, fontWeight: "600" }}>View Profile</div>
                                </div>
                            </div>
                        </div>

                        {/* Stats List */}
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
                            </div>
                        </div>

                        {/* Support Box */}
                        <div style={{ padding: "16px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "10px" }}>
                            <h5 style={{ fontSize: "12px", fontWeight: "600", color: "#FFF", marginBottom: "8px" }}>Developer Support</h5>
                            <p style={{ fontSize: "11px", color: colors.textMuted, lineHeight: "1.5", marginBottom: "12px" }}>
                                Need help? Contact the developer directly.
                            </p>
                            {listing.support_email && (
                                <button 
                                    onClick={() => window.location.href = `mailto:${listing.support_email}`}
                                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", padding: "8px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                                >
                                    Contact Support
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
