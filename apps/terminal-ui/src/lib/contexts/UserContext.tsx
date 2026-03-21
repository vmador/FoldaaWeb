"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { UserProfile, UserSettings } from "@/lib/hooks/useUserProfile";

type UserContextType = {
    profile: UserProfile | null;
    settings: UserSettings | null;
    loading: boolean;
    saving: boolean;
    error: any;
    updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: any }>;
    updateSettings: (updates: Partial<UserSettings>) => Promise<{ success: boolean; error?: any }>;
    refreshData: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<any>(null);

    const fetchData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setLoading(false);
            return;
        }

        const userId = session.user.id;
        const userMetadata = session.user.user_metadata || {};

        try {
            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError && profileError.code !== 'PGRST116') throw profileError;

            // Fetch settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

            // Fetch active subscription
            const { data: licenseData } = await supabase
                .from('user_licenses')
                .select('plan_type, expires_at')
                .eq('user_id', userId)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            let subscriptionPlan: 'free' | 'pro' = 'free';
            if (licenseData) {
                if (!licenseData.expires_at || new Date() < new Date(licenseData.expires_at)) {
                    subscriptionPlan = licenseData.plan_type as 'free' | 'pro';
                }
            }

            // Merge profile with auth metadata for fallbacks
            const mergedProfile = {
                id: userId,
                email: session.user.email || null,
                ...profileData,
                // Fallbacks from auth metadata
                avatar_url: profileData?.avatar_url || userMetadata.avatar_url || userMetadata.picture || null,
                first_name: profileData?.first_name || userMetadata.full_name?.split(' ')[0] || userMetadata.name?.split(' ')[0] || null,
                last_name: profileData?.last_name || userMetadata.full_name?.split(' ').slice(1).join(' ') || userMetadata.name?.split(' ').slice(1).join(' ') || null,
                username: profileData?.username || userMetadata.user_name || userMetadata.preferred_username || null,
                subscriptionPlan,
            };

            setProfile(mergedProfile as UserProfile);
            setSettings(settingsData || null);
        } catch (err) {
            console.error("Error fetching user data in Context:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const updateProfile = async (updates: Partial<UserProfile>) => {
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            const { error } = await supabase
                .from('profiles')
                .upsert({ ...updates, id: session.user.id, updated_at: new Date().toISOString() });

            if (error) throw error;
            setProfile(prev => prev ? { ...prev, ...updates } : updates as UserProfile);
            return { success: true };
        } catch (err) {
            console.error("Error updating profile:", err);
            return { success: false, error: err };
        } finally {
            setSaving(false);
        }
    };

    const updateSettings = async (updates: Partial<UserSettings>) => {
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            const { error } = await supabase
                .from('user_settings')
                .upsert({ ...updates, user_id: session.user.id, updated_at: new Date().toISOString() });

            if (error) throw error;
            setSettings(prev => prev ? { ...prev, ...updates } : updates as UserSettings);
            return { success: true };
        } catch (err) {
            console.error("Error updating settings:", err);
            return { success: false, error: err };
        } finally {
            setSaving(false);
        }
    };

    return (
        <UserContext.Provider value={{ 
            profile, 
            settings, 
            loading, 
            saving, 
            error, 
            updateProfile, 
            updateSettings,
            refreshData: fetchData 
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
