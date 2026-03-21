import { supabase } from './supabase';

export interface MarketplaceListing {
    id: string;
    project_id: string;
    user_id: string;
    title: string;
    tagline?: string;
    description: string;
    category: string;
    tags?: string[];
    icon_url?: string;
    cover_image_url?: string;
    screenshots?: string[];
    demo_video_url?: string;
    developer_name?: string;
    developer_url?: string;
    support_email?: string;
    privacy_policy_url?: string;
    terms_url?: string;
    version?: string;
    whats_new?: string;
    live_url: string;
    preview_url?: string;
    status: 'draft' | 'published' | 'unlisted';
    view_count?: number;
    install_count?: number;
    rating_average?: number;
    rating_count?: number;
    published_at?: string;
    last_updated_at?: string;
    created_at?: string;
    tech_stack?: {
        frontend: string[];
        backend: string[];
        database: string[];
        infrastructure: string[];
        other: string[];
    };
    built_with?: string;
    monthly_revenue?: number;
    monthly_costs?: number;
    profit_margin?: number;
    total_users?: number;
    monthly_active_users?: number;
    asking_price?: number;
    is_for_sale: boolean;
    year_established?: number;
    reason_for_selling?: string;
    included_in_sale?: string[];
    ls_checkout_url?: string;
    ls_product_id?: string;
    ls_checkout_id?: string;
    sale_status?: 'draft' | 'available' | 'sold' | 'cancelled' | 'pending' | 'withdrawn';
    updated_at: string;
}

export interface SellerAccount {
    id: string;
    user_id: string;
    store_id?: string;
    store_name?: string;
    status: string;
    created_at: string;
}

/**
 * Fetches the seller account for the current user.
 */
export const getSellerAccount = async (): Promise<SellerAccount | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
        .from('seller_accounts')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('Error fetching seller account:', error);
    }

    return data;
};

/**
 * Connects the user's seller account (LemonSqueezy integration).
 */
export const connectSellerAccount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Unauthorized');

    // This would typically involve redirecting to LemonSqueezy OAuth
    // For now, we invoke a bridge function if it exists, or return a placeholder
    const { data, error } = await supabase.functions.invoke('marketplace-checkout', {
        body: { action: 'connect_seller' }
    });

    if (error) throw error;
    return data;
};

/**
 * Disconnects the user's seller account.
 */
export const disconnectSellerAccount = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('seller_accounts')
        .delete()
        .eq('user_id', session.user.id);

    if (error) throw error;
    return { success: true };
};

/**
 * Creates a marketplace checkout for a project.
 */
export const createMarketplaceCheckout = async (params: { 
    projectId: string, 
    price: number,
    name: string,
    description: string 
}) => {
    const { data, error } = await supabase.functions.invoke('marketplace-checkout', {
        body: { 
            action: 'create_checkout', 
            project_id: params.projectId,
            price: params.price,
            name: params.name,
            description: params.description
        }
    });

    if (error) throw error;
    return data;
};

/**
 * Retrieves the checkout details for a specific project listing.
 */
export const getListingCheckout = async (projectId: string) => {
    const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('project_id', projectId)
        .single();

    if (error && error.code !== 'PGRST116') {
        throw error;
    }
    return data;
};

/**
 * Updates the checkout price for a listing.
 */
export const updateCheckoutPrice = async (projectId: string, price: number) => {
    const { data, error } = await supabase.functions.invoke('marketplace-checkout', {
        body: { 
            action: 'update_price', 
            project_id: projectId, 
            price 
        }
    });

    if (error) throw error;
    
    // Also update the local listing record
    await supabase
        .from('marketplace_listings')
        .update({ asking_price: price })
        .eq('project_id', projectId);

    return data;
};

/**
 * Fetches transactions for the current seller.
 */
export const getSellerTransactions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    // Assuming a transactions table or similar via edge function
    const { data, error } = await supabase.functions.invoke('marketplace-checkout', {
        body: { action: 'get_transactions' }
    });

    if (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
    return data?.transactions || [];
};

/**
 * Fetches purchases made by the current user.
 */
export const getBuyerPurchases = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    const { data, error } = await supabase
        .from('marketplace_purchases')
        .select('*, marketplace_listings(*)')
        .eq('buyer_id', session.user.id);

    if (error) throw error;
    return data;
};

/**
 * Helper to get a direct checkout URL.
 */
export const getCheckoutUrl = async (projectId: string) => {
    const listing = await getListingCheckout(projectId);
    return listing?.ls_checkout_url || null;
};
