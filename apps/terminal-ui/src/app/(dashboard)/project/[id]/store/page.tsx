"use client"
import React, { useState, useEffect } from 'react';
import { useProjects } from '@/lib/hooks/useProjects';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { 
    getSellerAccount, 
    getListingCheckout, 
    createMarketplaceCheckout, 
    updateCheckoutPrice,
    disconnectSellerAccount,
    connectSellerAccount,
    MarketplaceListing,
    SellerAccount,
    getListingCheckout as getListingCheckoutApi
} from '@/lib/marketplace';
import { 
    Loader2, Save, Globe, Image as ImageIcon, 
    ExternalLink, RefreshCw, ShoppingCart, CheckCircle, 
    AlertCircle, DollarSign, Package, Link as LinkIcon, Plus, Trash2,
    Check, Apple, Monitor, Smartphone, Tablet, ArrowLeft, Eye, Download, Users, Star,
    CreditCard, Mail, Shield, FileText, Globe as GlobeIcon, Heart, Upload, Edit2, X
} from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation'; // Added for router.push

const CATEGORIES = [
    { value: "business", label: "Business", emoji: "💼" },
    { value: "productivity", label: "Productivity", emoji: "⚡" },
    { value: "education", label: "Education", emoji: "📚" },
    { value: "entertainment", label: "Entertainment", emoji: "🎮" },
    { value: "social", label: "Social", emoji: "👥" },
    { value: "utilities", label: "Utilities", emoji: "🔧" },
    { value: "lifestyle", label: "Lifestyle", emoji: "🌟" },
    { value: "news", label: "News", emoji: "📰" },
    { value: "portfolio", label: "Portfolio", emoji: "🎨" },
    { value: "ecommerce", label: "E-commerce", emoji: "🛍️" },
    { value: "other", label: "Other", emoji: "📱" },
];

const TECH_CATEGORIES = {
    frontend: {
        label: "Frontend",
        options: [
            "React", "Vue", "Angular", "Next.js", "Nuxt", "Svelte",
            "HTML/CSS/JS", "TypeScript", "Tailwind CSS", "Bootstrap"
        ]
    },
    backend: {
        label: "Backend",
        options: [
            "Node.js", "Python", "Ruby", "PHP", "Go", "Java",
            "C#", ".NET", "Django", "Express", "FastAPI"
        ]
    },
    database: {
        label: "Database",
        options: [
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite",
            "Firebase", "Supabase", "DynamoDB"
        ]
    },
    infrastructure: {
        label: "Infrastructure",
        options: [
            "Cloudflare", "AWS", "Vercel", "Netlify", "Heroku",
            "DigitalOcean", "GCP", "Azure", "Docker"
        ]
    },
    other: {
        label: "Other Tools",
        options: [
            "Stripe", "SendGrid", "Twilio", "OpenAI", "Anthropic",
            "GitHub Actions", "Zapier"
        ]
    },
};

const INCLUDED_IN_SALE_OPTIONS = [
    { value: "source_code", label: "📦 Source Code" },
    { value: "domain", label: "🌐 Domain Name" },
    { value: "database", label: "💾 Database & Content" },
    { value: "users", label: "👥 User Base" },
    { value: "social_accounts", label: "📱 Social Media Accounts" },
    { value: "documentation", label: "📚 Documentation" },
    { value: "support", label: "🤝 30-day Support" },
    { value: "training", label: "🎓 Training Session" },
];

const MetaField = ({ label, value, onChange, placeholder, type = 'input' }: any) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[#444] text-xs uppercase tracking-widest font-bold">{label}</label>
        {type === 'textarea' ? (
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="bg-black border border-[#2A2A2E] rounded px-3 py-2 text-[#D8D8D8] outline-none font-mono text-xs h-28 resize-none focus:border-white/20 transition-colors placeholder:text-[#222]"
            />
        ) : type === 'select' ? (
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="bg-black border border-[#2A2A2E] rounded px-3 py-1.5 text-[#D8D8D8] outline-none font-mono text-xs focus:border-white/20 transition-colors"
            >
                {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
                ))}
            </select>
        ) : (
            <input
                type={type}
                value={value}
                onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                placeholder={placeholder}
                className="bg-black border border-[#2A2A2E] rounded px-3 py-1.5 text-[#D8D8D8] outline-none font-mono text-xs focus:border-white/20 transition-colors placeholder:text-[#222]"
            />
        )}
    </div>
);

import { TabHeader } from '@/components/ui/TabHeader';

export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
    const { projects, loading: projectsLoading } = useProjects();
    const { showToast } = useToast();
    const resolvedParams = React.use(params);
    const projectId = resolvedParams.id;
    const project = projects.find(p => p.id === projectId);
    const router = useRouter(); // Initialize router

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [extracting, setExtracting] = useState(false);

    // Store Data State
    const [metadata, setMetadata] = useState<any>(null);
    const [assets, setAssets] = useState<any[]>([]);
    const [listing, setListing] = useState<MarketplaceListing | null>(null);
    const [sellerAccount, setSellerAccount] = useState<SellerAccount | null>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [publisher, setPublisher] = useState<any>(null);

    // Marketplace / Tech States
    const [selectedTechCategory, setSelectedTechCategory] = useState<keyof typeof TECH_CATEGORIES>("frontend");
    const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [user, setUser] = useState<any>(null);
    const [imagePreviews, setImagePreviews] = useState<any>({ icon: null, cover: null });
    const [imageErrors, setImageErrors] = useState<any>({ icon: false, cover: false });
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
    const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isExtractingAssets, setIsExtractingAssets] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!projectId) return;
            setLoading(true);

            try {
                // Parallel fetch
                const promiseResults = await Promise.all([
                    supabase.from('app_store_metadata').select('*').eq('project_id', projectId).single(),
                    supabase.from('project_store_assets').select('*').eq('project_id', projectId),
                    getListingCheckoutApi(projectId),
                    getSellerAccount(),
                    supabase.functions.invoke('marketplace-checkout', { body: { action: 'get_transactions' } }),
                    getCurrentUser()
                ]);

                const metaData = promiseResults[0].data;
                const assetData = promiseResults[1].data;
                const listingData = promiseResults[2];
                const sellerData = promiseResults[3];
                const transactionInvokeData = promiseResults[4];
                const userData = promiseResults[5];

                if (userData) {
                    setUser(userData);
                    // Fetch profile for the current user (if listing doesn't specify otherwise yet)
                    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userData.id).single();
                    if (profile) setPublisher(profile);
                }

                if (metaData || listingData) {
                    const combinedData = {
                        ...(metaData || {}),
                        ...(listingData || {}),
                        // Explicitly merge complex fields
                        tech_stack: (listingData as any)?.tech_stack || metaData?.tech_stack || { frontend: [], backend: [], database: [], infrastructure: [], other: [] },
                        included_in_sale: (listingData as any)?.included_in_sale || metaData?.included_in_sale || ['source_code'],
                        // Prioritize project name/desc if not in metadata/listing
                        name: (listingData as any)?.title || metaData?.name || project?.og_title || project?.name || '',
                        subtitle: (listingData as any)?.tagline || metaData?.subtitle || project?.og_description || '',
                        description: (listingData as any)?.description || metaData?.description || project?.app_description || project?.og_description || '',
                        privacy_policy_url: (listingData as any)?.privacy_policy_url || metaData?.privacy_choices_url || '',
                        icon_url: (listingData as any)?.icon_url || metaData?.icon_url || project?.icon_512_url || project?.icon_192_url || project?.apple_touch_icon_url || project?.favicon_url || null,
                        logo_url: project?.logo_url || null,
                        cover_image_url: (listingData as any)?.cover_image_url || metaData?.cover_image_url || null,
                        asking_price: (listingData as any)?.asking_price || metaData?.asking_price || 0,
                        monthly_revenue: (listingData as any)?.monthly_revenue || metaData?.monthly_revenue || 0,
                        monthly_costs: (listingData as any)?.monthly_costs || metaData?.monthly_costs || 0,
                        total_users: (listingData as any)?.total_users || metaData?.total_users || 0,
                        monthly_active_users: (listingData as any)?.monthly_active_users || metaData?.monthly_active_users || 0,
                        is_for_sale: (listingData as any)?.is_for_sale ?? metaData?.is_for_sale ?? false,
                        is_public: (listingData as any)?.status === 'published' || metaData?.is_public || false,
                        developer_name: (listingData as any)?.developer_name || metaData?.developer_name || '',
                        developer_url: (listingData as any)?.developer_url || metaData?.developer_url || '',
                        version: (listingData as any)?.version || metaData?.version || '1.0.0',
                        keywords: (listingData as any)?.tags?.join(', ') || metaData?.keywords || '',
                    };
                    setMetadata(combinedData);
                    setImagePreviews({
                        icon: combinedData.icon_url,
                        cover: combinedData.cover_image_url
                    });
                    
                    // Load existing screenshots
                    if ((listingData as any)?.screenshots?.length > 0) {
                        setScreenshotPreviews((listingData as any).screenshots);
                    }
                } else {
                    setMetadata({
                        name: project?.og_title || project?.name || '',
                        subtitle: project?.og_description || '',
                        description: project?.app_description || project?.og_description || '',
                        keywords: '',
                        support_url: project?.github_repo ? `https://github.com/${project.github_repo}/issues` : '',
                        marketing_url: project?.worker_url || '',
                        privacy_policy_url: '',
                        terms_url: '',
                        primary_category: 'productivity',
                        secondary_category: '',
                        version: '1.0.0',
                        built_with: project?.framework || 'Next.js',
                        tech_stack: {
                            frontend: project?.framework ? [project.framework] : [],
                            backend: [],
                            database: [],
                            infrastructure: ['Cloudflare'],
                            other: [],
                        },
                        is_for_sale: false,
                        asking_price: 0,
                        monthly_revenue: 0,
                        monthly_costs: 0,
                        total_users: 0,
                        monthly_active_users: 0,
                        reason_for_selling: '',
                        included_in_sale: ['source_code'],
                        icon_url: project?.icon_512_url || project?.icon_192_url || project?.apple_touch_icon_url || project?.favicon_url || null,
                        logo_url: project?.logo_url || null,
                        live_url: project?.worker_url || ''
                    });
                    setImagePreviews({
                        icon: project?.icon_512_url || project?.icon_192_url || project?.apple_touch_icon_url || project?.favicon_url || null,
                        cover: null
                    });
                }

                if (assetData) setAssets(assetData);
                if (listingData) setListing(listingData as any);
                setSellerAccount(sellerData);
                if (transactionInvokeData?.data?.transactions) setTransactions(transactionInvokeData.data.transactions);

                // If listing has a user_id, fetch that profile instead
                if ((listingData as any)?.user_id) {
                    const { data: prof } = await supabase.from('profiles').select('*').eq('id', (listingData as any).user_id).single();
                    if (prof) setPublisher(prof);
                }
            } catch (err) {
                console.error("Error fetching store data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (project) fetchData();
    }, [projectId, project]);

    useEffect(() => {
        if (listing && project?.name && !metadata?.name) {
             setMetadata((prev: any) => ({ ...prev, name: project.name }));
        }
    }, [project, listing, metadata?.name]);

    if (projectsLoading || loading) return <div className="text-[#666] font-mono text-sm">Loading store data...</div>;
    if (!project || !metadata) return null;

    const handleSaveMetadata = async () => {
        setSaving(true);
        try {
            const user = await getCurrentUser();
            if (!user) throw new Error("Unauthorized");

            // Helper to upload to R2 via Edge Function
            const uploadToR2 = async (file: File, type: string) => {
                // Client-side size check for immediate feedback (Increased to 50MB)
                if (file.size > 50 * 1024 * 1024) {
                    throw new Error(`File "${file.name}" is too large (max 50MB)`);
                }

                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', type);
                formData.append('project_id', projectId); // Better grouping in R2

                const { data, error } = await supabase.functions.invoke('upload-image', {
                    body: formData
                });

                if (error || !data?.success) throw new Error(error?.message || data?.error || "Upload failed");
                return data.url;
            };

            // 0. Upload new assets
            let iconUrl = metadata.icon_url;
            let coverUrl = metadata.cover_image_url;
            let avatarUrl = publisher?.avatar_url;
            let screenshotUrls = [...screenshotPreviews].filter(p => p.startsWith('http')); // Keep existing full URLs

            if (iconFile) {
                iconUrl = await uploadToR2(iconFile, 'icon');
            }
            if (coverFile) {
                coverUrl = await uploadToR2(coverFile, 'cover');
            }
            if (avatarFile) {
                avatarUrl = await uploadToR2(avatarFile, 'avatar');
            }
            if (screenshotFiles.length > 0) {
                const newScreenshotUrls = await Promise.all(
                    screenshotFiles.map(f => uploadToR2(f, 'screenshot'))
                );
                screenshotUrls = [...screenshotUrls, ...newScreenshotUrls].slice(0, 5);
            }

            // Filter metadata to only include valid columns for app_store_metadata
            const filteredMetadata = {
                project_id: projectId,
                user_id: user.id,
                primary_category: metadata.primary_category,
                secondary_category: metadata.secondary_category,
                age_rating: metadata.age_rating,
                copyright: metadata.copyright,
                support_url: metadata.support_url,
                marketing_url: metadata.marketing_url,
                promotional_text: metadata.promotional_text,
                keywords: metadata.keywords,
                privacy_choices_url: metadata.privacy_policy_url, // Map privacy_policy_url to privacy_choices_url for app_store_metadata
                updated_at: new Date().toISOString()
            };

            // 1. Update app_store_metadata
            const { error: metaError } = await supabase
                .from('app_store_metadata')
                .upsert(filteredMetadata, { onConflict: 'project_id' }); // Prevent unique constraint violation

            if (metaError) {
                console.error('App Store Metadata Error:', metaError);
                throw new Error(`Store metadata: ${metaError.message}`);
            }

            // 1.5 Update user profile if avatar changed
            if (avatarUrl !== publisher?.avatar_url) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ avatar_url: avatarUrl })
                    .eq('id', user.id);

                if (profileError) {
                    console.error('Profile Update Error:', profileError);
                    // Don't throw here, just log it as it's secondary to the project save
                } else {
                    setPublisher({ ...publisher, avatar_url: avatarUrl });
                }
            }

            // 2. Update projects table with basic app info and pending status
            const { error: projectError } = await supabase
                .from('projects')
                .update({
                    name: metadata.name,
                    og_title: metadata.name,
                    og_description: metadata.subtitle,
                    app_description: metadata.description,
                    logo_url: metadata.logo_url,
                    banner_config: {
                        ...(project.banner_config || {}),
                        deployment_pending: true
                    }
                })
                .eq('id', projectId);

            if (projectError) {
                console.error('Project Update Error:', projectError);
                throw new Error(`Project: ${projectError.message}`);
            }

            // 3. Update marketplace listing if it exists
            const listingPayload = {
                title: metadata.name,
                tagline: metadata.subtitle,
                description: metadata.description,
                category: metadata.primary_category,
                tags: metadata.keywords ? metadata.keywords.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
                asking_price: metadata.asking_price,
                monthly_revenue: metadata.monthly_revenue,
                monthly_costs: metadata.monthly_costs,
                total_users: metadata.total_users,
                monthly_active_users: metadata.monthly_active_users,
                tech_stack: metadata.tech_stack,
                built_with: metadata.built_with,
                included_in_sale: metadata.included_in_sale,
                is_for_sale: metadata.is_for_sale,
                status: metadata.is_public ? 'published' : 'unlisted',
                privacy_policy_url: metadata.privacy_policy_url,
                terms_url: metadata.terms_url,
                support_email: metadata.support_email,
                developer_name: metadata.developer_name,
                developer_url: metadata.developer_url,
                version: metadata.version,
                live_url: metadata.live_url || project?.worker_url || '',
                icon_url: iconUrl,
                cover_image_url: coverUrl,
                screenshots: screenshotUrls,
                reason_for_selling: metadata.reason_for_selling,
                last_updated_at: new Date().toISOString(),
                // Update profit margin if revenue/costs exist
                profit_margin: (metadata.monthly_revenue > 0) 
                    ? Math.round(((metadata.monthly_revenue - metadata.monthly_costs) / metadata.monthly_revenue) * 10000) / 100 
                    : 0
            };

            // Transition published_at if publishing for the first time
            if (metadata.is_public && (!listing || !listing.published_at)) {
                (listingPayload as any).published_at = new Date().toISOString();
            }

            if (listing) {
                const { error: listingError } = await supabase
                    .from('marketplace_listings')
                    .update(listingPayload)
                    .eq('project_id', projectId);
                
                if (listingError) {
                    console.error('Marketplace Listing Update Error:', listingError);
                    throw new Error(`Marketplace update: ${listingError.message}`);
                }
            } else {
                // Optionally create listing if it's for sale
                if (metadata.is_for_sale) {
                    const { data: newListing, error: createError } = await supabase
                        .from('marketplace_listings')
                        .insert({
                            ...listingPayload,
                            project_id: projectId,
                            user_id: user.id,
                            status: 'draft'
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error('Marketplace Listing Create Error:', createError);
                        throw new Error(`Marketplace create: ${createError.message}`);
                    }
                    setListing(newListing);
                }
            }
            
            // 4. Update local state with permanent URLs if save was successful
            if (listingPayload.screenshots) {
                setScreenshotPreviews(listingPayload.screenshots);
                setScreenshotFiles([]);
            }

            // Clear file states after successful save
            setIconFile(null);
            setCoverFile(null);
            setAvatarFile(null);
            setAvatarPreview(null);
            setScreenshotFiles([]);
            setScreenshotPreviews(screenshotUrls);

            setImagePreviews({
                icon: iconUrl,
                cover: coverUrl
            });

            showToast('Store configuration saved successfully', 'success');
        } catch (error: any) {
            console.error('Error saving metadata:', error);
            showToast(`Error saving store metadata: ${error.message || 'Unknown error'}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateListing = async () => {
        setSaving(true);
        try {
            const user = await getCurrentUser();
            if (!user) throw new Error("Unauthorized");
            const { data, error } = await supabase
                .from('marketplace_listings')
                .insert({
                    project_id: projectId,
                    user_id: user.id,
                    title: metadata.name || project.name,
                    tagline: metadata.subtitle || '',
                    description: metadata.description || project.app_description || '',
                    category: metadata.primary_category || 'productivity',
                    status: 'draft',
                    is_for_sale: metadata.is_for_sale || false,
                    asking_price: metadata.asking_price || 0,
                    tech_stack: metadata.tech_stack,
                    built_with: metadata.built_with,
                    included_in_sale: metadata.included_in_sale
                })
                .select()
                .single();

            if (error) throw error;
            setListing(data);
            showToast('Listing created as draft', 'success');
        } catch (err) {
            console.error("Error creating listing:", err);
            showToast("Failed to create marketplace listing", 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleConnectSeller = async () => {
        setSaving(true);
        try {
            const data = await connectSellerAccount();
            if (data) setSellerAccount(data);
        } catch (err) {
            console.error("Error connecting seller account:", err);
            showToast("Failed to connect seller account", 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDisconnectSeller = async () => {
        if (!confirm("Are you sure you want to disconnect your seller account?")) return;
        setSaving(true);
        try {
            await disconnectSellerAccount();
            setSellerAccount(null);
        } catch (err) {
            console.error("Error disconnecting seller account:", err);
            showToast("Failed to disconnect seller account", 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateCheckout = async (price: number) => {
        if (!price || price <= 0) {
            showToast("Please enter a valid price before enabling checkout", 'info');
            return;
        }
        setSaving(true);
        try {
            const result = await createMarketplaceCheckout({
                projectId,
                price: Math.round(price * 100), // LemonSqueezy uses cents
                name: metadata.name || project.name,
                description: metadata.description || ''
            });
            if (result?.ls_checkout_url) {
                setListing(result);
            }
        } catch (err) {
            console.error("Checkout error:", err);
            showToast("Failed to create checkout", 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateCheckoutPrice = async () => {
        if (!projectId || !metadata.asking_price) return;
        setSaving(true);
        try {
            await updateCheckoutPrice(projectId, Math.round(metadata.asking_price * 100));
            showToast('Remote checkout price updated');
        } catch (err) {
            console.error("Update price error:", err);
            showToast("Failed to update remote price", 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleExtractAssets = async () => {
        if (!project?.worker_url) {
            showToast("Project URL not available for extraction", "error");
            return;
        }

        setIsExtractingAssets(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const response = await fetch(
                "https://hueirgbgitrhqoopfxcu.supabase.co/functions/v1/extract-brand-assets",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ url: project.worker_url }),
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to extract assets: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || "Failed to extract assets");
            }

            setMetadata((prev: any) => ({
                ...prev,
                name: prev.name || result.assets.metadata.title || project.name,
                subtitle: prev.subtitle || result.assets.metadata.description?.slice(0, 80) || "",
                description: prev.description || result.assets.metadata.description || "",
                logo_url: prev.logo_url || result.assets.icons.logo || null,
            }));

            setImagePreviews({
                icon: result.assets.icon_512_url || result.assets.icon_192_url || result.assets.favicon_url || null,
                cover: result.assets.og_image_url || result.assets.logo_url || null,
            });

            showToast("Brand assets extracted successfully!");
            showToast("Brand assets extracted successfully!");
        } catch (error: any) {
            console.error("Error extracting brand assets:", error);
            showToast(`Failed to extract assets: ${error.message || "Unknown error"}`, "error");
        } finally {
            setIsExtractingAssets(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden text-sm animate-in fade-in duration-500 bg-black">
            {/* Unified Full-Width Header */}
            <div className="h-[60px] flex-shrink-0 flex items-center justify-between px-8 border-b border-white/[0.05] bg-black/40 backdrop-blur-md sticky top-0 z-20 w-full">
                <div className="flex items-center gap-4">
                    <h2 className="text-[#D8D8D8] text-base font-bold tracking-tight">Store configuration</h2>
                </div>
                <div className="flex items-center gap-6">
                    {/* Device Selector */}
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/[0.03]">
                        {[
                            { id: 'desktop', icon: Monitor },
                            { id: 'tablet', icon: Tablet },
                            { id: 'mobile', icon: Smartphone }
                        ].map(device => {
                            const Icon = device.icon;
                            return (
                                <button 
                                    key={device.id}
                                    onClick={() => setPreviewMode(device.id as any)}
                                    className={clsx(
                                        "p-1.5 rounded transition-all",
                                        previewMode === device.id ? "bg-white/10 text-white" : "text-[#444] hover:text-[#666]"
                                    )}
                                >
                                    <Icon size={14} />
                                </button>
                            );
                        })}
                    </div>
                    {/* Save and update button */}
                    <button
                        onClick={handleSaveMetadata}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-1.5 bg-[#111] hover:bg-[#1A1A1A] border border-[#333] hover:border-white/20 text-white rounded text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        <span>Save and update</span>
                        <span className="ml-2 px-1 py-0.5 bg-black/10 rounded text-xs opacity-40">⌘+S</span>
                    </button>
                </div>
            </div>

            {/* Split Screen Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Side: Configuration Panel (Scrollable) */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-white/[0.05]">
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-8 pb-20">
                        <div className="max-w-[640px] flex flex-col gap-10">
                            {/* Toggle: Show Public */}
                            <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                                <span className="text-[#D8D8D8] text-sm font-medium">Show Public on Store</span>
                                <button 
                                    onClick={() => setMetadata({...metadata, is_public: !metadata.is_public})}
                                    className={clsx(
                                        "w-10 h-5 rounded-full relative transition-all duration-300",
                                        metadata.is_public ? "bg-white/20" : "bg-[#1A1A1A]"
                                    )}
                                >
                                        metadata.is_public ? "translate-x-5" : "translate-x-0"
                                </button>
                            </div>

                            {/* Automation */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-white/60 text-xs uppercase tracking-widest font-bold">Automation</label>
                                    <div className="h-[1px] flex-1 ml-4 bg-white/[0.05]" />
                                </div>
                                
                                {!isExtractingAssets ? (
                                    <button
                                        onClick={handleExtractAssets}
                                        disabled={saving || isExtractingAssets || !project?.worker_url}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30 group"
                                    >
                                        <RefreshCw size={14} className={clsx("transition-transform group-hover:rotate-180 duration-500")} />
                                        <span>Auto-Sync Details from Site</span>
                                    </button>
                                ) : (
                                    <div className="w-full flex items-center justify-center gap-3 py-3 bg-white/5 border border-white/10 rounded-xl">
                                        <Loader2 size={16} className="animate-spin text-white" />
                                        <span className="text-white/40 text-xs font-bold uppercase tracking-widest">AI Extraction in progress...</span>
                                    </div>
                                )}
                            </div>

                            {/* App Icon Area */}
                            <div className="flex flex-col gap-4">
                                <h4 className="text-[#444] text-xs uppercase tracking-widest font-bold">App Icon</h4>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-black border border-white/5 flex items-center justify-center relative group overflow-hidden">
                                        {imagePreviews.icon ? (
                                            <img src={imagePreviews.icon} alt="Icon" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon size={24} className="text-[#222]" />
                                        )}
                                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Upload size={16} className="text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setIconFile(file);
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setImagePreviews({...imagePreviews, icon: reader.result});
                                                    reader.readAsDataURL(file);
                                                }
                                            }} />
                                        </label>
                                    </div>
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <span className="text-[#D8D8D8] text-xs font-medium">Global App Icon</span>
                                        <p className="text-[#444] text-xs leading-relaxed">
                                            High-resolution 512x512 icon for store listings and dashboard.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Standard Metadata */}
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-[#444] text-xs uppercase tracking-widest font-bold">Standard Metadata</label>
                                    <div className="h-[1px] flex-1 ml-4 bg-white/[0.03]" />
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <MetaField 
                                        label="App Title" 
                                        value={metadata.name} 
                                        placeholder="Enter app name..."
                                        onChange={(v: string) => setMetadata({...metadata, name: v})} 
                                    />
                                    <MetaField 
                                        label="Tagline" 
                                        placeholder="One-liner that sells your app"
                                        value={metadata.subtitle} 
                                        type="textarea"
                                        onChange={(v: string) => setMetadata({...metadata, subtitle: v})} 
                                    />
                                    <MetaField 
                                        label="Description" 
                                        type="textarea"
                                        value={metadata.description} 
                                        placeholder="Detailed app description..."
                                        onChange={(v: string) => setMetadata({...metadata, description: v})} 
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <MetaField 
                                            label="Category" 
                                            type="select"
                                            value={metadata.primary_category} 
                                            onChange={(v: string) => setMetadata({...metadata, primary_category: v})} 
                                        />
                                        <MetaField 
                                            label="Version" 
                                            value={metadata.version} 
                                            placeholder="1.0.0"
                                            onChange={(v: string) => setMetadata({...metadata, version: v})} 
                                        />
                                    </div>
                                    <MetaField 
                                        label="Search Keywords" 
                                        value={metadata.keywords} 
                                        placeholder="Search and add..."
                                        onChange={(v: string) => setMetadata({...metadata, keywords: v})} 
                                    />
                                </div>
                            </div>

                            {/* Publisher Branding */}
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-[#444] text-xs uppercase tracking-widest font-bold">Publisher Branding</label>
                                    <div className="h-[1px] flex-1 ml-4 bg-white/[0.03]" />
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-full bg-black border border-white/5 flex items-center justify-center relative group overflow-hidden">
                                        {avatarPreview || publisher?.avatar_url || publisher?.profile_picture_url || publisher?.avatar_path ? (
                                            <img src={avatarPreview || publisher?.avatar_url || publisher?.profile_picture_url || publisher?.avatar_path} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <Users size={20} className="text-[#222]" />
                                        )}
                                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <Upload size={14} className="text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setAvatarFile(file);
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setAvatarPreview(reader.result as string);
                                                    reader.readAsDataURL(file);
                                                }
                                            }} />
                                        </label>
                                    </div>
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <span className="text-[#D8D8D8] text-xs font-medium">Developer Avatar</span>
                                        <p className="text-[#444] text-xs leading-relaxed">
                                            This avatar will represent you across the marketplace.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <MetaField 
                                        label="Developer Name" 
                                        value={metadata.developer_name} 
                                        placeholder="Your Name or Studio"
                                        onChange={(v: string) => setMetadata({...metadata, developer_name: v})} 
                                    />
                                    <MetaField 
                                        label="Developer Website" 
                                        value={metadata.developer_url} 
                                        placeholder="https://..."
                                        onChange={(v: string) => setMetadata({...metadata, developer_url: v})} 
                                    />
                                </div>
                            </div>

                            {/* Support & Legal */}
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-[#444] text-xs uppercase tracking-widest font-bold">Support & Legal</label>
                                    <div className="h-[1px] flex-1 ml-4 bg-white/[0.03]" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <MetaField 
                                        label="Support Email" 
                                        value={metadata.support_email} 
                                        placeholder="support@example.com"
                                        onChange={(v: string) => setMetadata({...metadata, support_email: v})} 
                                    />
                                    <MetaField 
                                        label="Support URL" 
                                        value={metadata.support_url} 
                                        placeholder="https://..."
                                        onChange={(v: string) => setMetadata({...metadata, support_url: v})} 
                                    />
                                    <MetaField 
                                        label="Privacy Policy URL" 
                                        value={metadata.privacy_policy_url} 
                                        placeholder="https://..."
                                        onChange={(v: string) => setMetadata({...metadata, privacy_policy_url: v})} 
                                    />
                                    <MetaField 
                                        label="Terms of Service URL" 
                                        value={metadata.terms_url} 
                                        placeholder="https://..."
                                        onChange={(v: string) => setMetadata({...metadata, terms_url: v})} 
                                    />
                                </div>
                            </div>

                            {/* Technologies & Stack */}
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <label className="text-[#444] text-xs uppercase tracking-widest font-bold">Technologies & Stack</label>
                                    <div className="h-[1px] flex-1 ml-4 bg-white/[0.03]" />
                                </div>

                                <div className="flex flex-col gap-6">
                                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                        {Object.entries(TECH_CATEGORIES).map(([key, cat]) => (
                                            <button
                                                key={key}
                                                onClick={() => setSelectedTechCategory(key as any)}
                                                className={clsx(
                                                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border",
                                                    selectedTechCategory === key 
                                                        ? "bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
                                                        : "bg-white/[0.02] border-white/5 text-[#444] hover:border-white/10"
                                                )}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {(TECH_CATEGORIES[selectedTechCategory]?.options || []).map(opt => {
                                            const isSelected = metadata.tech_stack?.[selectedTechCategory]?.includes(opt);
                                            return (
                                                <button
                                                    key={opt}
                                                    onClick={() => {
                                                        const current = metadata.tech_stack?.[selectedTechCategory] || [];
                                                        const next = isSelected 
                                                            ? current.filter((i: string) => i !== opt)
                                                            : [...current, opt];
                                                        setMetadata({
                                                            ...metadata,
                                                            tech_stack: {
                                                                ...metadata.tech_stack,
                                                                [selectedTechCategory]: next
                                                            }
                                                        });
                                                    }}
                                                    className={clsx(
                                                        "px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all",
                                                        isSelected 
                                                            ? "bg-white/[0.05] border-white/20 text-[#D8D8D8]" 
                                                            : "bg-black/20 border-white/[0.03] text-[#444] hover:border-white/10 hover:text-[#666]"
                                                    )}
                                                >
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Interface Assets (Screenshots) */}
                            <div className="flex flex-col gap-6 relative z-10">
                                <div className="flex items-center justify-between">
                                    <label className="text-[#444] text-xs uppercase tracking-widest font-bold">Interface Assets</label>
                                    <div className="h-[1px] flex-1 ml-4 bg-white/[0.03]" />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="w-full h-48 rounded-2xl bg-black border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-3 group hover:border-white/20 transition-all cursor-pointer relative overflow-hidden">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Upload size={20} className="text-[#444] group-hover:text-white" />
                                        </div>
                                        <span className="text-[#444] text-xs uppercase tracking-widest font-bold group-hover:text-white/60">Drag or paste images here</span>
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                if (files.length > 0) {
                                                    const newPreviews = files.map(f => URL.createObjectURL(f));
                                                    setScreenshotPreviews(prev => [...prev, ...newPreviews].slice(0, 5));
                                                    setScreenshotFiles(prev => [...prev, ...files].slice(0, 5));
                                                }
                                            }}
                                        />
                                    </div>

                                    {screenshotPreviews.length > 0 && (
                                        <div className="grid grid-cols-5 gap-3">
                                            {screenshotPreviews.map((preview, i) => (
                                                <div key={i} className="aspect-[9/16] rounded-lg bg-black border border-white/5 relative group overflow-hidden">
                                                    <img src={preview} alt={`Screenshot ${i+1}`} className="w-full h-full object-cover" />
                                                    <button 
                                                        onClick={() => {
                                                            const preview = screenshotPreviews[i];
                                                            setScreenshotPreviews(prev => prev.filter((_, idx) => idx !== i));
                                                            // If it was a new file (blob), remove it from the files array
                                                            if (preview.startsWith('blob:')) {
                                                                // Find which file this preview belongs to
                                                                const fileIndex = screenshotPreviews.slice(0, i).filter(p => p.startsWith('blob:')).length;
                                                                setScreenshotFiles(prev => prev.filter((_, idx) => idx !== fileIndex));
                                                            }
                                                        }}
                                                        className="absolute top-2 right-2 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-500"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Marketplace Status */}
                            <div className="flex flex-col gap-6 relative z-20">
                                <div className="flex items-center gap-2">
                                     <label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Marketplace Status</label>
                                     <div className="h-[1px] flex-1 bg-white/[0.05]" />
                                </div>
                                
                                <div className="flex items-center justify-between px-5 py-4 bg-white/[0.02] border border-white/[0.05] rounded-xl transition-colors hover:bg-white/[0.04]">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[#D8D8D8] text-xs font-medium">Available for Acquisition</span>
                                        <span className="text-[#444] text-xs uppercase tracking-tight">Enable automated transfer flow</span>
                                    </div>
                                    <button 
                                        onClick={() => setMetadata({...metadata, is_for_sale: !metadata.is_for_sale})}
                                        className={clsx(
                                            "w-10 h-5 rounded-full relative transition-all duration-300",
                                            metadata.is_for_sale ? "bg-white/20" : "bg-[#1A1A1A]"
                                        )}
                                    >
                                        <div className={clsx(
                                            "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 border border-white/10",
                                            metadata.is_for_sale ? "translate-x-5" : "translate-x-0"
                                        )} />
                                    </button>
                                </div>

                                {metadata.is_for_sale && (
                                    <div className="flex flex-col gap-8 animate-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <MetaField 
                                                label="Asking Price (USD)" 
                                                type="number"
                                                value={metadata.asking_price} 
                                                onChange={(v: number) => setMetadata({...metadata, asking_price: v})} 
                                            />
                                            <MetaField 
                                                label="Monthly Revenue (USD)" 
                                                type="number"
                                                value={metadata.monthly_revenue} 
                                                onChange={(v: number) => setMetadata({...metadata, monthly_revenue: v})} 
                                            />
                                            <MetaField 
                                                label="Monthly Costs (USD)" 
                                                type="number"
                                                value={metadata.monthly_costs} 
                                                onChange={(v: number) => setMetadata({...metadata, monthly_costs: v})} 
                                            />
                                            <MetaField 
                                                label="Total Users" 
                                                type="number"
                                                value={metadata.total_users} 
                                                onChange={(v: number) => setMetadata({...metadata, total_users: v})} 
                                            />
                                            <MetaField 
                                                label="Monthly Active Users" 
                                                type="number"
                                                value={metadata.monthly_active_users} 
                                                onChange={(v: number) => setMetadata({...metadata, monthly_active_users: v})} 
                                            />
                                        </div>

                                        <div className="flex flex-col gap-6 pt-6 border-t border-white/5">
                                            <h4 className="text-[#444] text-xs uppercase tracking-widest font-bold">Sale Details</h4>
                                            
                                            <MetaField 
                                                label="Reason for Selling" 
                                                type="textarea"
                                                value={metadata.reason_for_selling} 
                                                placeholder="Why are you selling this project?"
                                                onChange={(v: string) => setMetadata({...metadata, reason_for_selling: v})} 
                                            />

                                            <div className="flex flex-col gap-3">
                                                <label className="text-[#444] text-xs uppercase tracking-widest font-bold">What's included</label>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {INCLUDED_IN_SALE_OPTIONS.map(opt => {
                                                        const isSelected = metadata.included_in_sale?.includes(opt.value);
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => {
                                                                    const current = metadata.included_in_sale || [];
                                                                    const next = isSelected 
                                                                        ? current.filter((i: string) => i !== opt.value)
                                                                        : [...current, opt.value];
                                                                    setMetadata({...metadata, included_in_sale: next});
                                                                }}
                                                                className={clsx(
                                                                    "flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-medium transition-all text-left",
                                                                    isSelected 
                                                                        ? "bg-white/[0.05] border-white/20 text-[#D8D8D8]" 
                                                                        : "bg-black/20 border-white/[0.03] text-[#444] hover:border-white/10"
                                                                )}
                                                            >
                                                                {opt.label}
                                                                {isSelected && <Check size={14} className="text-[#444]" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payouts & Monetization */}
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-2">
                                    <label className="text-[#444] text-xs uppercase tracking-widest font-bold">Payouts & Monetization</label>
                                    <div className="h-[1px] flex-1 bg-white/[0.03]" />
                                </div>

                                {!sellerAccount ? (
                                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 flex flex-col items-center text-center gap-6">
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                            <CreditCard size={32} className="text-white/20" />
                                        </div>
                                        <div className="flex flex-col gap-2 max-w-[280px]">
                                            <h3 className="text-[#D8D8D8] text-sm font-bold">Connect your Store</h3>
                                            <p className="text-[#666] text-xs leading-relaxed">
                                                We use Lemon Squeezy to handle global payments, taxes, and payouts automatically.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleConnectSeller}
                                            disabled={saving}
                                            className="px-8 py-3 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                                        >
                                            {saving ? <Loader2 size={16} className="animate-spin" /> : "Connect Lemon Squeezy"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                                    <CheckCircle size={20} className="text-green-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[#D8D8D8] text-xs font-medium">{sellerAccount.store_name || "Merchant Account"}</span>
                                                    <span className="text-[#444] text-xs uppercase tracking-widest">{user?.email}</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleDisconnectSeller}
                                                className="p-2 opacity-0 group-hover:opacity-100 text-[#444] hover:text-red-500 transition-all"
                                                title="Disconnect Account"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Checkout Management */}
                                        {metadata.is_for_sale && (
                                            <div className="p-5 bg-white/[0.02] border border-white/[0.05] rounded-xl flex flex-col gap-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[#D8D8D8] text-xs font-medium uppercase tracking-widest">Marketplace Checkout</span>
                                                        <span className="text-[#444] text-xs">Automated Lemon Squeezy link</span>
                                                    </div>
                                                    {listing?.ls_checkout_url && (
                                                        <div className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-xs font-bold">
                                                            LIVE
                                                        </div>
                                                    )}
                                                </div>

                                                {!listing?.ls_checkout_url ? (
                                                    <button 
                                                        onClick={() => handleCreateCheckout(metadata.asking_price)}
                                                        disabled={saving}
                                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
                                                    >
                                                        {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : (
                                                            <>
                                                                <ShoppingCart size={14} />
                                                                Enable One-Click Checkout
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <div className="flex flex-col gap-3">
                                                        <div className="flex items-center gap-2 p-3 bg-black/40 border border-white/5 rounded-xl overflow-hidden">
                                                            <LinkIcon size={14} className="text-[#444] shrink-0" />
                                                            <span className="text-xs text-[#666] truncate">{listing.ls_checkout_url}</span>
                                                        </div>
                                                        
                                                        {metadata.asking_price !== (listing as any).asking_price && (
                                                            <button 
                                                                onClick={handleUpdateCheckoutPrice}
                                                                disabled={saving}
                                                                className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 text-white/60 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
                                                            >
                                                                {saving ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                                                Sync Price (${metadata.asking_price})
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Fixed Full Height Preview */}
                <div className="w-[420px] xl:w-[480px] bg-black border-l border-white/[0.05] flex flex-col relative shrink-0">
                    <div className="sticky top-0 h-full flex flex-col overflow-hidden">
                        {/* Preview Content (Internal Scroll) */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col gap-10">
                            {/* Title Section */}
                            <div className="flex items-start gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-[#1C1C1E] border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden shrink-0">
                                    {imagePreviews.icon ? (
                                        <img src={imagePreviews.icon} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-lg font-bold text-white/10">{metadata.name?.charAt(0) || project?.name?.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-[#D8D8D8] text-lg font-bold tracking-tight leading-none truncate">{metadata.name || project?.name}</h2>
                                        {metadata.is_for_sale && (
                                            <span className="px-1.5 py-0.5 bg-white/10 text-white text-[10px] font-bold rounded border border-white/10 uppercase tracking-widest">
                                                PRO
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[#666] text-sm leading-snug">
                                        {metadata.subtitle || "Your application tagline goes here"}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center border border-white/10 overflow-hidden">
                                            {publisher?.avatar_url || publisher?.profile_picture_url || publisher?.avatar_path ? (
                                                <img src={publisher.avatar_url || publisher.profile_picture_url || publisher.avatar_path} alt={publisher.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <Users size={12} className="text-white/60" />
                                            )}
                                        </div>
                                        <span className="text-xs text-[#D8D8D8] font-medium">{publisher?.username || publisher?.first_name || 'Anonymous Developer'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics Bar */}
                            <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1.5 text-white/40">
                                        <Eye size={12} />
                                        <span className="text-xs uppercase tracking-widest font-bold">Views</span>
                                    </div>
                                    <span className="text-sm font-bold text-white leading-none">{listing?.view_count || 0}</span>
                                </div>
                                <div className="w-[1px] h-8 bg-white/[0.05]" />
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1.5 text-white/40">
                                        <Download size={12} />
                                        <span className="text-xs uppercase tracking-widest font-bold">Installs</span>
                                    </div>
                                    <span className="text-sm font-bold text-white leading-none">{listing?.install_count || 0}</span>
                                </div>
                                <div className="w-[1px] h-8 bg-white/[0.05]" />
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1.5 text-white/40">
                                        <Users size={12} />
                                        <span className="text-xs uppercase tracking-widest font-bold">Users</span>
                                    </div>
                                    <span className="text-sm font-bold text-white leading-none">{metadata.total_users || 0}</span>
                                </div>
                                <div className="w-[1px] h-8 bg-white/[0.05]" />
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-1.5 text-white/40">
                                        <Star size={12} className="text-yellow-500/50" />
                                        <span className="text-xs uppercase tracking-widest font-bold">Rating</span>
                                    </div>
                                    <span className="text-sm font-bold text-white leading-none">{listing?.rating_average || 5.0}</span>
                                </div>
                            </div>

                            {/* Buy Button (if for sale) */}
                            <div className="flex gap-3">
                                {metadata.live_url && (
                                    <a 
                                        href={metadata.live_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/[0.05] border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                                    >
                                        <Globe size={14} />
                                        Open Live
                                    </a>
                                )}
                                {metadata.is_for_sale && (
                                    <button className={clsx(
                                        "flex-[2] flex items-center justify-center gap-2 py-3 bg-[#111] border border-white/20 text-white hover:text-white/60 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#1A1A1A] hover:border-white/40 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.05)]",
                                        !metadata.live_url && "w-full"
                                    )}>
                                        <CreditCard size={14} />
                                        Buy — ${metadata.asking_price?.toLocaleString()}
                                    </button>
                                )}
                            </div>

                            {/* Screenshots Preview */}
                            {screenshotPreviews.length > 0 && (
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-[#D8D8D8] text-sm font-bold">Gallery</h3>
                                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                        {screenshotPreviews.map((p, i) => (
                                            <div key={i} className="shrink-0 w-48 aspect-[9/16] rounded-xl border border-white/5 overflow-hidden bg-black snap-start">
                                                <img src={p} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* About Section */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#444]">Description</h3>
                                <p className="text-[#999] text-sm leading-relaxed whitespace-pre-wrap">
                                    {metadata.description || "No description provided yet."}
                                </p>
                            </div>

                            {/* Tech Stack Section */}
                            {metadata.tech_stack && Object.values(metadata.tech_stack).some((arr: any) => arr.length > 0) && (
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#444]">Technologies</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(metadata.tech_stack).map(([cat, techs]: [string, any]) => 
                                            techs.map((tech: string) => (
                                                <div key={`${cat}-${tech}`} className="px-2.5 py-1 bg-white/[0.03] border border-white/10 rounded-lg flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.1)]" />
                                                    <span className="text-xs text-[#D8D8D8] font-mono">{tech}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Insights Section (If for sale) */}
                            {metadata.is_for_sale && (
                                <div className="flex flex-col gap-4">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#444]">Growth & Insights</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                                            <span className="text-xs text-[#444] uppercase tracking-widest font-bold block mb-1">Monthly Revenue</span>
                                            <span className="text-sm font-bold text-green-500">${metadata.monthly_revenue?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                                            <span className="text-xs text-[#444] uppercase tracking-widest font-bold block mb-1">MAU</span>
                                            <span className="text-sm font-bold text-white">{metadata.monthly_active_users?.toLocaleString() || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Technical Info Table */}
                            <div className="flex flex-col gap-4">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#444]">Technical Info</h3>
                                <div className="flex flex-col border border-white/[0.05] rounded-xl overflow-hidden divide-y divide-white/[0.05]">
                                    <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                                        <span className="text-[#444]">Version</span>
                                        <span className="text-[#D8D8D8] font-mono">{metadata.version || '1.0.0'}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                                        <span className="text-[#444]">Category</span>
                                        <span className="text-[#D8D8D8] capitalize">{metadata.primary_category}</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                                        <span className="text-[#444]">Platform</span>
                                        <span className="text-[#D8D8D8]">Web / Cloudflare</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-2.5 text-xs">
                                        <span className="text-[#444]">Published</span>
                                        <span className="text-[#D8D8D8]">{listing?.published_at ? new Date(listing.published_at).toLocaleDateString() : 'Draft'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Developer Support Section */}
                            <div className="p-5 bg-[#080808] border border-white/[0.05] rounded-2xl flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-white/60">
                                    <Shield size={14} />
                                    <h3 className="text-xs font-bold uppercase tracking-widest">Developer Support</h3>
                                </div>
                                <p className="text-xs text-[#666] leading-relaxed">
                                    Need help with this project? Contact the developer directly for assistance with deployment or customization.
                                </p>
                                {metadata.support_url && (
                                    <a 
                                        href={metadata.support_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="mt-1 flex items-center gap-2 text-white/40 text-xs font-bold hover:underline"
                                    >
                                        <ExternalLink size={10} />
                                        Support Resource
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
