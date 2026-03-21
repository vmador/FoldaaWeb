// Marketplace.tsx - REFACTORED FOR SCALABILITY & PERFORMANCE
import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
    Loader2,
    Eye,
    AlertCircle,
    Download,
    User,
    Package,
    ChevronLeft,
    ChevronRight,
    Zap,
    BookOpen,
    Gamepad2,
    Heart,
    Newspaper,
    Palette,
    ShoppingBag,
    Briefcase,
    Users,
    Wrench,
    Clock,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import ProjectDetail from "./ProjectDetail"
import DeveloperProfile from "./DeveloperProfile"
import { formatDistanceToNow } from "date-fns"
import clsx from "clsx"

type ViewMode = "featured" | "all" | "categories"
type PageView = "marketplace" | "project" | "developer"
type SortOption = "trending" | "new" | "most_viewed" | "most_installed"

// ── Theme Hook ───────────────────────────────────────────────────────────────
const useFramerTheme = () => {
    const [theme, setTheme] = React.useState<"light" | "dark">("dark")

    React.useEffect(() => {
        const getTheme = (): "light" | "dark" => {
            const framerTheme = document.body.dataset.framerTheme
            if (framerTheme === "dark" || framerTheme === "light") {
                return framerTheme
            }
            if (
                window.matchMedia &&
                window.matchMedia("(prefers-color-scheme: dark)").matches
            ) {
                return "dark"
            }
            return "light"
        }

        setTheme(getTheme())

        const observer = new MutationObserver(() => {
            setTheme(getTheme())
        })

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["data-framer-theme"],
        })

        return () => {
            observer.disconnect()
        }
    }, [])

    return theme
}

// ── Utility Components ──────────────────────────────────────────────────────

const formatNumber = (num: number | null | undefined): string => {
    if (!num) return "0"
    if (num >= 1000) return (num / 1000).toFixed(1) + "k"
    return new Intl.NumberFormat("en-US").format(num)
}

// ── Marketplace Card (Compact version for Browse Apps) ───────────────────────
const MarketplaceCard = ({ listing, onClick, onViewDeveloper, colors }: any) => {
    const developerName = useMemo(() => {
        if (listing.profiles) {
            if (listing.profiles.first_name && listing.profiles.last_name) {
                return `${listing.profiles.first_name} ${listing.profiles.last_name}`
            } else if (listing.profiles.username) {
                return listing.profiles.username
            }
        }
        return "Unknown"
    }, [listing.profiles])

    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: "transparent",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "16px",
            }}
            className="group hover:bg-white/5 active:scale-[0.98]"
        >
            {/* App Icon */}
            <div
                style={{
                    width: "56px",
                    height: "56px",

                    borderRadius: "14px",
                    overflow: "hidden",
                    backgroundColor: "#1C1C1E",
                    border: "1px solid rgba(255,255,255,0.1)",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                }}
            >
                {(() => {
                    const project = Array.isArray(listing.projects) ? listing.projects[0] : listing.projects;
                    const iconUrl = project?.icon_512_url || project?.icon_192_url || project?.favicon_url || listing.icon_url;
                    return iconUrl ? (
                        <img src={iconUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Package size={24} color="#444" />
                        </div>
                    );
                })()}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
                <h3
                    style={{
                        fontSize: "15px",
                        fontWeight: "700",
                        color: "white",
                        margin: "0 0 2px 0",
                        letterSpacing: "-0.01em"
                    }}
                >
                    {listing.title}
                </h3>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onViewDeveloper(listing.user_id, listing.profiles?.username)
                    }}
                    style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontSize: "12px",
                        color: "#666",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontWeight: "500"
                    }}
                    className="hover:text-white/60 transition-colors"
                >
                    <div className="w-4 h-4 rounded-full bg-[#1C1C1E] flex items-center justify-center overflow-hidden">
                        {(() => {
                            const profile = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles;
                            const avatarUrl = profile?.avatar_url || profile?.profile_picture_url || profile?.avatar_path;
                            return avatarUrl ? (
                                <img src={avatarUrl} className="w-full h-full object-cover" />
                            ) : (
                                <User size={10} color="#666" />
                            );
                        })()}
                    </div>
                    {developerName}
                </button>
            </div>
        </div>
    )
}

// ── Featured Carousel (New Component) ─────────────────────────────────────────
const FeaturedCarousel = ({ listings, onClick, colors }: any) => {
    const featured = listings.slice(0, 3); // Take first 3 for carousel
    const [activeIndex, setActiveIndex] = useState(0);

    if (featured.length === 0) return null;

    const current = featured[activeIndex];

    return (
        <div style={{ marginBottom: "48px" }}>
            <div 
                onClick={() => onClick(current)}
                className="relative w-full aspect-[21/9] rounded-[22px] overflow-hidden cursor-pointer group shadow-2xl border border-white/[0.05]"
            >
                {/* Holographic/Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] to-[#0A0A0B]" />
                <div className="absolute inset-0 opacity-40 mix-blend-screen">
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-fuchsia-500/20 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[100%] bg-blue-500/10 blur-[100px] rounded-full" />
                </div>
                
                {/* Banner Image (if available) */}
                {current.cover_image_url && (
                    <img 
                        src={current.cover_image_url} 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" 
                        alt=""
                    />
                )}

                {/* Content Overlay */}
                <div className="absolute inset-0 p-12 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                    <div className="flex items-end justify-between gap-8">
                        <div className="flex items-center gap-4">
                            {/* Icon */}
                            <div className="w-20 h-20 rounded-[20px] bg-[#1C1C1E] border border-white/10 shadow-2xl overflow-hidden p-0.5">
                                {(() => {
                                    const project = Array.isArray(current.projects) ? current.projects[0] : current.projects;
                                    const iconUrl = project?.icon_512_url || project?.icon_192_url || project?.favicon_url || current.icon_url;
                                    return iconUrl ? (
                                        <img src={iconUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/10 font-bold text-lg">
                                            {current.title.charAt(0)}
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-lg font-extrabold text-white tracking-tight">{current.title}</h2>
                                <p className="text-sm text-white/60 font-medium max-w-xl line-clamp-2 leading-relaxed">
                                    {current.tagline || current.description}
                                </p>
                            </div>
                        </div>
                        <button className="px-10 py-4 bg-white text-black text-sm font-black rounded-full hover:bg-white/90 transition-all hover:scale-105 shadow-xl uppercase tracking-widest">
                            Install
                        </button>
                    </div>
                </div>
            </div>

            {/* Pagination Dots */}
            {featured.length > 1 && (
                <div className="flex justify-center gap-3 mt-8">
                    {featured.map((_: any, idx: number) => (
                        <button
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={clsx(
                                "h-1.5 rounded-full transition-all duration-300",
                                idx === activeIndex ? "w-10 bg-white" : "w-6 bg-white/10 hover:bg-white/20"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Marketplace Filters ───────────────────────────────────────────────────
const MarketplaceFilters = ({ sortBy, onSortChange, colors, viewMode, setViewMode }: any) => {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 40px",
                borderBottom: `1px solid ${colors.headerBorder}`,
                backgroundColor: colors.headerBg,
            }}
        >
            <div style={{ display: "flex", gap: "24px", marginLeft: "4px" }}>
                {[
                    { id: "featured", label: "Featured" },
                    { id: "all", label: "All Templates" },
                    { id: "categories", label: "Categories" },
                ].map((tab) => {
                    const isActive = viewMode === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setViewMode(tab.id as ViewMode)}
                            style={{
                                padding: "10px 0",
                                background: "none",
                                border: "none",
                                color: isActive ? colors.tabActive : colors.tabInactive,
                                fontSize: "13px",
                                fontWeight: "500",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.2s ease",
                            }}
                        >
                            <span style={{ 
                                fontSize: '10px', 
                                color: isActive ? colors.tabActive : colors.statsText,
                                marginTop: "1px"
                            }}>
                                {"\u2237"}
                            </span>
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "12px", color: colors.textMuted }}>Sort by:</span>
                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                    style={{
                        backgroundColor: colors.searchBg,
                        border: `1px solid ${colors.searchBorder}`,
                        color: colors.text,
                        fontSize: "12px",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        outline: "none",
                        cursor: "pointer",
                    }}
                >
                    <option value="trending">Trending</option>
                    <option value="new">Newest</option>
                    <option value="most_viewed">Most Viewed</option>
                    <option value="most_installed">Most Installed</option>
                </select>
            </div>
        </div>
    )
}

// ── Marketplace Pagination ──────────────────────────────────────────────────
const MarketplacePagination = ({ currentPage, totalPages, onPageChange, colors }: any) => {
    if (totalPages <= 1) return null

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "40px 0" }}>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                    padding: "8px",
                    backgroundColor: colors.paginBg,
                    border: `1px solid ${colors.paginBorder}`,
                    borderRadius: "6px",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    opacity: currentPage === 1 ? 0.5 : 1,
                    color: colors.paginText,
                }}
            >
                <ChevronLeft size={16} />
            </button>

            <span style={{ fontSize: "13px", color: colors.text, fontWeight: "500", margin: "0 12px" }}>
                Page {currentPage} of {totalPages}
            </span>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                    padding: "8px",
                    backgroundColor: colors.paginBg,
                    border: `1px solid ${colors.paginBorder}`,
                    borderRadius: "6px",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    opacity: currentPage === totalPages ? 0.5 : 1,
                    color: colors.paginText,
                }}
            >
                <ChevronRight size={16} />
            </button>
        </div>
    )
}

// ── Main Marketplace Orchestrator ───────────────────────────────────────────────
export default function Marketplace() {
    const theme = useFramerTheme()
    const colors = useMemo(() => {
        const isDark = theme === "dark"
        return {
            pageBg: isDark ? "#000000" : "#FAFAFA",
            headerBg: isDark ? "#000000" : "#FFFFFF",
            headerBorder: isDark ? "#1A1A1A" : "#E0E0E0",
            text: isDark ? "#FFFFFF" : "#000000",
            textSecondary: isDark ? "#9CA3AF" : "#666666",
            textMuted: isDark ? "#6B7280" : "#999999",
            searchBg: isDark ? "#0A0A0A" : "#F5F5F5",
            searchBorder: isDark ? "#1A1A1A" : "#E0E0E0",
            tabActive: isDark ? "#FFFFFF" : "#000000",
            tabInactive: isDark ? "#6B7280" : "#666666",
            tabBorder: isDark ? "#79D9EC" : "#79D9EC",
            cardBg: isDark ? "#080808" : "#FFFFFF",
            cardBgHover: isDark ? "#0C0C0C" : "#FAFAFA",
            cardBorder: isDark ? "#121212" : "#E0E0E0",
            cardPreviewBg: isDark ? "#050505" : "#F5F5F5",
            iconBg: isDark ? "#0A0A0A" : "#F5F5F5",
            iconBorder: isDark ? "#1A1A1A" : "#E0E0E0",
            iconPlaceholder: isDark ? "#333333" : "#CCCCCC",
            statsText: isDark ? "#666666" : "#888888",
            statsBorder: isDark ? "#121212" : "#F0F0F0",
            badgeBg: isDark ? "rgba(121, 217, 236, 0.1)" : "rgba(121, 217, 236, 0.1)",
            badgeText: "#79D9EC",
            paginBg: isDark ? "#0A0A0A" : "#FFFFFF",
            paginBorder: isDark ? "#1A1A1A" : "#E0E0E0",
            paginText: isDark ? "#FFFFFF" : "#000000",
        }
    }, [theme])

    const [listings, setListings] = useState<any[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentUser, setCurrentUser] = useState<any>(null)
    
    // Filters & Pagination state
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState<ViewMode>("featured")
    const [selectedCategory, setSelectedCategory] = useState<string>("all")
    const [sortBy, setSortBy] = useState<SortOption>("trending")
    const [currentPage, setCurrentPage] = useState(1)

    // ── Auth ────────────────────────────────────────────────────────────────
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setCurrentUser(session?.user || null)
        }
        getSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUser(session?.user || null)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Navigation state
    const [pageView, setPageView] = useState<PageView>("marketplace")
    const [selectedProject, setSelectedProject] = useState<any>(null)
    const [selectedDeveloperId, setSelectedDeveloperId] = useState<string | null>(null)

    const ITEMS_PER_PAGE = 12

    // ── Data Fetching ────────────────────────────────────────────────────────
    const loadListings = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const start = (currentPage - 1) * ITEMS_PER_PAGE
            const end = start + ITEMS_PER_PAGE - 1

            let query = supabase
                .from("marketplace_listings")
                .select("*, profiles(*), projects(icon_192_url, favicon_url)", { count: "exact" })
                .eq("status", "published")

            // Category Filter
            if (viewMode === "categories" && selectedCategory !== "all") {
                query = query.eq("category", selectedCategory)
            }

            // Search Filter
            if (searchQuery.trim()) {
                query = query.or(`title.ilike.%${searchQuery}%,tagline.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
            }

            // Sorting
            switch (sortBy) {
                case "trending":
                    // Fallback to published_at since trending_score is a "future column" 
                    // and might not exist yet in the database.
                    query = query.order("published_at", { ascending: false })
                    break
                case "new":
                    query = query.order("published_at", { ascending: false })
                    break
                case "most_viewed":
                    query = query.order("view_count", { ascending: false })
                    break
                case "most_installed":
                    query = query.order("install_count", { ascending: false })
                    break
            }

            const { data, count, error: queryError } = await query.range(start, end)

            if (queryError) throw queryError

            setListings(data || [])
            setTotalCount(count || 0)
        } catch (err: any) {
            setError(err.message || "Failed to load listings")
        } finally {
            setIsLoading(false)
        }
    }, [currentPage, selectedCategory, searchQuery, sortBy, viewMode])

    useEffect(() => {
        loadListings()
    }, [loadListings])

    // ── Event Handlers (Sidebar Sync) ──────────────────────────────────────────
    useEffect(() => {
        const handleSearch = (e: any) => {
            setSearchQuery(e.detail || "")
            setCurrentPage(1)
        }
        const handleCategory = (e: any) => {
            setSelectedCategory(e.detail || "all")
            setViewMode("categories")
            setCurrentPage(1)
        }

        window.addEventListener("marketplace-search", handleSearch)
        window.addEventListener("marketplace-category-select", handleCategory)

        return () => {
            window.removeEventListener("marketplace-search", handleSearch)
            window.removeEventListener("marketplace-category-select", handleCategory)
        }
    }, [])

    // ── Navigation ──────────────────────────────────────────────────────────
    const handleCardClick = (listing: any) => {
        setSelectedProject(listing)
        setPageView("project")
    }

    const handleBackToMarketplace = () => {
        setPageView("marketplace")
        setSelectedProject(null)
        setSelectedDeveloperId(null)
        // Reset URL when going back
        window.history.pushState(null, '', '/campfire')
    }

    // ── Render ─────────────────────────────────────────────────────────────
    if (pageView === "project" && selectedProject) {
        return (
            <ProjectDetail 
                listing={selectedProject} 
                onBack={handleBackToMarketplace} 
                onViewDeveloperProfile={(id: string, username?: string) => {
                    setSelectedDeveloperId(id)
                    setPageView("developer")
                    if (username) {
                        window.history.pushState(null, '', `/u/${username}`)
                    }
                }} 
            />
        )
    }

    if (pageView === "developer" && selectedDeveloperId) {
        // Fallback for username if we don't have it (though we should)
        const profile = listings.find((p: any) => p.user_id === selectedDeveloperId)?.profiles
        const username = Array.isArray(profile) ? profile[0]?.username : profile?.username

        return (
            <DeveloperProfile 
                developerId={selectedDeveloperId}
                username={username}
                currentUser={currentUser}
                onBack={handleBackToMarketplace}
                onProjectClick={(item) => {
                    setPageView("project")
                    setSelectedProject(item)
                }}
            />
        )
    }

    return (
        <div style={{ height: "100%", backgroundColor: "#000000", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <MarketplaceFilters 
                sortBy={sortBy} 
                onSortChange={setSortBy} 
                colors={{...colors, headerBg: "#000000", headerBorder: "rgba(255,255,255,0.05)"}} 
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            <div style={{ 
                flex: 1, 
                padding: "60px 40px", 
                maxWidth: "1100px", 
                margin: "0 auto", 
                width: "100%", 
                overflowY: "auto",
                height: "100%",
                minHeight: 0
            }} className="custom-scrollbar">
                {isLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", paddingTop: "80px" }}>
                        <Loader2 size={32} color="white" style={{ animation: "spin 1s linear infinite" }} />
                    </div>
                ) : error ? (
                    <div style={{ textAlign: "center", paddingTop: "80px" }}>
                        <AlertCircle size={48} color="#444" style={{ marginBottom: "16px" }} />
                        <h3 style={{ color: "white" }}>{error}</h3>
                        <button onClick={loadListings} style={{ marginTop: "16px", color: "#666" }}>Try Again</button>
                    </div>
                ) : listings.length === 0 ? (
                    <div style={{ textAlign: "center", paddingTop: "80px", color: "#666" }}>
                        <Package size={48} style={{ marginBottom: "16px", opacity: 0.3 }} />
                        <p>No listings found matching your filters.</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {/* Featured Carousel only on Featured tab */}
                        {viewMode === "featured" && (
                            <FeaturedCarousel 
                                listings={listings} 
                                onClick={handleCardClick}
                                colors={colors}
                            />
                        )}

                        <div className="space-y-8">
                            <h2 className="text-lg font-black text-white px-1 tracking-tight">Browse Apps</h2>
                            
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                                    gap: "20px",
                                }}
                            >
                                {listings.map((listing) => (
                                    <MarketplaceCard
                                        key={listing.id}
                                        listing={listing}
                                        colors={colors}
                                        onClick={() => handleCardClick(listing)}
                                        onViewDeveloper={(id: string, username?: string) => {
                                            setSelectedDeveloperId(id)
                                            setPageView("developer")
                                            if (username) {
                                                window.history.pushState(null, '', `/u/${username}`)
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <MarketplacePagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
                            onPageChange={(page: number) => {
                                setCurrentPage(page)
                                const container = document.querySelector('.overflow-y-auto')
                                container?.scrollTo({ top: 0, behavior: "smooth" })
                            }}
                            colors={colors}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
