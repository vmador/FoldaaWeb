import { useUser } from "../contexts/UserContext";

export type UserProfile = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    website: string | null;
    location: string | null;
    company: string | null;
    twitter: string | null;
    github: string | null;
    subscriptionPlan?: 'free' | 'pro';
}

export type UserSettings = {
    user_id: string;
    theme: 'light' | 'dark' | 'auto';
    auto_open_projects: boolean;
    notifications_enabled: boolean;
}

export function useUserProfile() {
    return useUser();
}
