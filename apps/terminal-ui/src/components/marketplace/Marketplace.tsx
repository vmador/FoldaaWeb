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

type ViewMode = "featured" | "apps" | "resources" | "all" | "categories"
type PageView = "marketplace" | "project" | "developer"
type SortOption = "trending" | "new" | "most_viewed" | "most_installed"

// ── Theme is managed via next-themes and Tailwind semantic classes ──

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
            className="group hover:bg-neutral-100 active:scale-[0.98] transition-all duration-200 p-4 rounded-2xl flex items-center gap-4 cursor-pointer"
        >
            {/* App Icon */}
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-50 border border-neutral-200 flex-shrink-0 shadow-lg">
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
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[15px] font-bold text-foreground m-0 tracking-tight">
                        {listing.title}
                    </h3>
                    <span className={clsx(
                        "text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider border",
                        listing.type === 'app' 
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                            : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                    )}>
                        {listing.type || 'resource'}
                    </span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onViewDeveloper(listing.user_id, listing.profiles?.username)
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-0 border-none bg-transparent cursor-pointer"
                >
                    <div className="w-4 h-4 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden">
                        {(() => {
                            const profile = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles;
                            const avatarUrl = profile?.avatar_url || profile?.profile_picture_url || profile?.avatar_path;
                            return avatarUrl ? (
                                <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <User size={10} className="text-muted-foreground" />
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
const FeaturedCarousel = ({ listings, onClick }: any) => {
    const featured = listings.slice(0, 3); // Take first 3 for carousel
    const [activeIndex, setActiveIndex] = useState(0);

    if (featured.length === 0) return null;

    const current = featured[activeIndex];

    return (
        <div style={{ marginBottom: "48px" }}>
            <div 
                onClick={() => onClick(current)}
                className="relative w-full aspect-[21/9] rounded-[22px] overflow-hidden cursor-pointer group shadow-2xl border border-border"
            >
                {/* Holographic/Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/80 to-background" />
                <div className="absolute inset-0 opacity-40 mix-blend-screen">
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-foreground/5 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[100%] bg-foreground/5 blur-[100px] rounded-full" />
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
                <div className="absolute inset-0 p-12 flex flex-col justify-end bg-gradient-to-t from-background/90 via-background/20 to-transparent">
                    <div className="flex items-end justify-between gap-8">
                        <div className="flex items-center gap-4">
                            {/* Icon */}
                            <div className="w-20 h-20 rounded-[20px] bg-neutral-50 border border-neutral-200 shadow-2xl overflow-hidden p-0.5">
                                {(() => {
                                    const project = Array.isArray(current.projects) ? current.projects[0] : current.projects;
                                    const iconUrl = project?.icon_512_url || project?.icon_192_url || project?.favicon_url || current.icon_url;
                                    return iconUrl ? (
                                        <img src={iconUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-foreground/10 font-bold text-lg">
                                            {current.title.charAt(0)}
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-lg font-extrabold text-foreground tracking-tight">{current.title}</h2>
                                <p className="text-sm text-foreground/60 font-medium max-w-xl line-clamp-2 leading-relaxed">
                                    {current.tagline || current.description}
                                </p>
                            </div>
                        </div>
                        <button className="px-10 py-4 bg-foreground text-background text-sm font-black rounded-full hover:bg-foreground/90 transition-all hover:scale-105 shadow-xl uppercase tracking-widest border border-neutral-200">
                             {current.is_for_sale 
                                ? (current.type === 'app' ? "Acquire" : `Buy — $${current.asking_price}`)
                                : (current.type === 'app' ? "Get App" : "Deploy")}
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
                                idx === activeIndex ? "w-10 bg-foreground" : "w-6 bg-foreground/10 hover:bg-foreground/20"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Marketplace Filters ───────────────────────────────────────────────────
const MarketplaceFilters = ({ sortBy, onSortChange, viewMode, setViewMode }: any) => {
    return (
        <div className="flex items-center justify-between px-10 border-b border-neutral-200 bg-background">
            <div className="flex gap-6 ml-1">
                {[
                    { id: "featured", label: "Featured" },
                    { id: "apps", label: "Apps" },
                    { id: "resources", label: "Resources" },
                    { id: "all", label: "All Items" },
                    { id: "categories", label: "Categories" },
                ].map((tab) => {
                    const isActive = viewMode === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setViewMode(tab.id as ViewMode)}
                            className={clsx(
                                "py-2.5 bg-transparent border-none text-[13px] font-medium cursor-pointer flex items-center gap-1.5 transition-all",
                                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <span className={clsx(
                                "text-[10px] mt-0.5",
                                isActive ? "text-foreground" : "text-muted-foreground/40"
                            )}>
                                {"\u2237"}
                            </span>
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Sort by:</span>
                <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 text-foreground text-xs px-3 py-1.5 rounded-md outline-none cursor-pointer hover:border-neutral-300 transition-colors"
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
const MarketplacePagination = ({ currentPage, totalPages, onPageChange }: any) => {
    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-center gap-2 py-10">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 bg-neutral-100 border border-neutral-200 rounded-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
            >
                <ChevronLeft size={16} />
            </button>

            <span className="text-[13px] text-foreground font-medium mx-3">
                Page {currentPage} of {totalPages}
            </span>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 bg-neutral-100 border border-neutral-200 rounded-md cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    )
}

// ── Main Marketplace Orchestrator ───────────────────────────────────────────────
export default function Marketplace() {
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

            // ── Segmentation Filter ──────────────────────────────────────────
            if (viewMode === "apps") {
                query = query.eq("type", "app")
            } else if (viewMode === "resources") {
                query = query.eq("type", "resource")
            } else {
                query = query.neq("type", "service")
            }

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
        <div className="h-full bg-background flex flex-col overflow-hidden">
            <MarketplaceFilters 
                sortBy={sortBy} 
                onSortChange={setSortBy} 
                viewMode={viewMode}
                setViewMode={setViewMode}
            />

            <div className="flex-1 px-10 py-16 max-w-[1100px] mx-auto w-full overflow-y-auto custom-scrollbar h-full min-h-0">
                {isLoading ? (
                    <div className="flex justify-center pt-20">
                        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center pt-20">
                        <AlertCircle className="w-12 h-12 text-muted-foreground/40 mb-4 mx-auto" />
                        <h3 className="text-foreground">{error}</h3>
                        <button onClick={loadListings} className="mt-4 text-muted-foreground hover:text-foreground">Try Again</button>
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center pt-20 text-muted-foreground/60">
                        <Package size={48} className="mb-4 mx-auto opacity-20" />
                        <p className="text-sm font-medium">No listings found matching your filters.</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {/* Featured Carousel only on Featured tab */}
                        {viewMode === "featured" && (
                            <FeaturedCarousel 
                                listings={listings} 
                                onClick={handleCardClick}
                            />
                        )}

                        <div className="space-y-8">
                            <h2 className="text-lg font-black text-foreground px-1 tracking-tight">Browse Apps</h2>
                            
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
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
