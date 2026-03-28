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
        setLoading(true);
        try {
            let { data: { session } } = await supabase.auth.getSession();
            
            // Defensive parsing: if session is a string, try to parse it
            if (typeof session === 'string') {
                try {
                    session = JSON.parse(session);
                } catch (e) {
                    console.error("[ANTIGRAVITY V2] Failed to parse session string:", e);
                    session = null;
                }
            }

            if (!session || !session.user) {
                setLoading(false);
                return;
            }

            const userId = session.user.id;
            const userMetadata = session.user.user_metadata || {};

            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (profileError) {
                console.error("[ANTIGRAVITY V2] Error fetching profile detail:", {
                    message: profileError.message,
                    details: profileError.details,
                    hint: profileError.hint,
                    code: profileError.code,
                    fullError: JSON.stringify(profileError)
                });
            }

            // Fetch settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (settingsError) {
                console.error("[ANTIGRAVITY V2] Error fetching settings detail:", {
                    message: settingsError.message,
                    details: settingsError.details,
                    hint: settingsError.hint,
                    code: settingsError.code,
                    fullError: JSON.stringify(settingsError)
                });
            }

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
            const avatarUrl = profileData?.avatar_url || userMetadata.avatar_url || userMetadata.picture || userMetadata.avatar || null;
            const firstName = profileData?.first_name || userMetadata.full_name?.split(' ')[0] || userMetadata.name?.split(' ')[0] || null;
            const lastName = profileData?.last_name || userMetadata.full_name?.split(' ').slice(1).join(' ') || userMetadata.name?.split(' ').slice(1).join(' ') || null;
            const userName = profileData?.username || userMetadata.user_name || userMetadata.preferred_username || null;

            const mergedProfile = {
                id: userId,
                email: session.user.email || null,
                ...profileData,
                avatar_url: avatarUrl,
                first_name: firstName,
                last_name: lastName,
                username: userName,
                subscriptionPlan,
                onboarding_completed: profileData?.onboarding_completed || false,
                role: profileData?.role || null,
            };

            setProfile({ ...mergedProfile } as UserProfile);
            setSettings(settingsData || null);
        } catch (err: any) {
            console.error("[ANTIGRAVITY V2] Error fetching user data detail (catch block):", {
                message: err.message,
                name: err.name,
                stack: err.stack,
                fullError: JSON.stringify(err)
            });
            
            // Self-healing: if the session string in local storage was corrupted and throws a TypeError 
            // inside Supabase Auth JS, clear the storage and reload to force a fresh login state
            if (
                err instanceof TypeError || 
                (err && err.message && typeof err.message === 'string' && err.message.includes('Cannot create property'))
            ) {
                console.warn("[ANTIGRAVITY V2] Detected corrupted Auth session string. Clearing local storage to recover...");
                if (typeof window !== 'undefined') {
                    const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0];
                    if (projectId) {
                        localStorage.removeItem(`sb-${projectId}-auth-token`);
                    }
                    // Fallback to clearing all local storage if specific key isn't enough
                    const keys = Object.keys(localStorage);
                    keys.forEach(key => {
                        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                            localStorage.removeItem(key);
                        }
                    });
                    
                    // Also clear cookies
                    document.cookie.split(";").forEach((c) => { 
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                    });
                    
                    window.location.href = '/login';
                    return;
                }
            }

            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Listen for auth state changes (login, logout, session refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                fetchData();
            } else if (event === 'SIGNED_OUT') {
                setProfile(null);
                setSettings(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        const accent = settings?.accent_color || 'fuchsia';
        
        if (accent.startsWith('#')) {
            document.documentElement.setAttribute('data-accent', 'custom');
            document.documentElement.style.setProperty('--theme-brand-50', `color-mix(in srgb, ${accent} 6%, transparent)`);
            document.documentElement.style.setProperty('--theme-brand-100', `color-mix(in srgb, ${accent} 12%, transparent)`);
            document.documentElement.style.setProperty('--theme-brand-200', `color-mix(in srgb, ${accent} 25%, transparent)`);
            document.documentElement.style.setProperty('--theme-brand-300', `color-mix(in srgb, ${accent} 50%, transparent)`);
            document.documentElement.style.setProperty('--theme-brand-400', `color-mix(in srgb, ${accent} 75%, transparent)`);
            document.documentElement.style.setProperty('--theme-brand-500', accent);
            document.documentElement.style.setProperty('--theme-brand-600', `color-mix(in srgb, ${accent} 80%, black)`);
            document.documentElement.style.setProperty('--theme-brand-700', `color-mix(in srgb, ${accent} 60%, black)`);
            document.documentElement.style.setProperty('--theme-brand-800', `color-mix(in srgb, ${accent} 40%, black)`);
            document.documentElement.style.setProperty('--theme-brand-900', `color-mix(in srgb, ${accent} 20%, black)`);
            document.documentElement.style.setProperty('--theme-brand-950', `color-mix(in srgb, ${accent} 10%, black)`);
        } else {
            document.documentElement.setAttribute('data-accent', accent);
            const root = document.documentElement;
            const rootStyle = root.style;
            const props = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
            props.forEach(p => rootStyle.removeProperty(`--theme-brand-${p}`));
        }
    }, [settings?.accent_color]);

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
