"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import SettingsLayout, { SettingsTab } from "@/components/account/SettingsLayout"
import ProfileSection from "@/components/account/ProfileSection"
import AccountSection from "@/components/account/AccountSection"
import GeneralSettingsSection from "@/components/account/GeneralSettingsSection"
import CloudflareCard from "@/components/account/integrations/CloudflareCard"
import AppleCard from "@/components/account/integrations/AppleCard"
import MarketplaceCard from "@/components/account/integrations/MarketplaceCard"
import ApiKeysSection from "@/components/account/ApiKeysSection"
import SubscriptionSection from "@/components/account/SubscriptionSection"

function AccountSettingsContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const tabParam = searchParams.get("tab") as SettingsTab
    const [activeTab, setActiveTab] = useState<SettingsTab>(tabParam || "account")

    useEffect(() => {
        if (tabParam && tabParam !== activeTab) {
            setActiveTab(tabParam)
        }
    }, [tabParam])

    const handleTabChange = (tab: SettingsTab) => {
        setActiveTab(tab)
        const params = new URLSearchParams(searchParams.toString())
        params.set("tab", tab)
        router.push(`/account?${params.toString()}`, { scroll: false })
    }

    const renderContent = () => {
        switch (activeTab) {
            case "account":
                return <ProfileSection />
            case "general":
                return <GeneralSettingsSection />
            case "cloudflare":
                return <CloudflareCard />
            case "apple":
                return <AppleCard />
            case "lemonsqueezy":
                return <MarketplaceCard />
            case "apikeys":
                return <ApiKeysSection />
            case "subscription":
                return <SubscriptionSection />
            case "support":
                return (
                    <div className="flex flex-col items-center justify-center py-20 text-[#666] font-mono text-xs">
                        {activeTab.toUpperCase()} _ MODULE_NOT_INITIALIZED
                    </div>
                )
            default:
                return <ProfileSection />
        }
    }

    const tabMetadata = {
        account: { title: "Profile", description: "Manage your personal information and security settings." },
        general: { title: "Preferences", description: "Manage your dashboard appearance and automation behavior." },
        cloudflare: { title: "Cloudflare", description: "Configure your Cloudflare integration for automated DNS." },
        apple: { title: "Apple Developer", description: "Manage your Apple Developer account for native iOS builds." },
        lemonsqueezy: { title: "Marketplace", description: "Configure your Lemon Squeezy integration for payments." },
        apikeys: { title: "API Keys", description: "Manage your personal access tokens for the Foldaa CLI." },
        subscription: { title: "Subscription", description: "Manage your billing and plan details." },
        support: { title: "Support", description: "Get in touch with the Foldaa team." }
    };

    const currentMetadata = tabMetadata[activeTab] || tabMetadata.account;

    return (
        <SettingsLayout 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            title={currentMetadata.title}
            description={currentMetadata.description}
        >
            {renderContent()}
        </SettingsLayout>
    )
}

export default function AccountPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center bg-black text-[#444] font-mono">
                <div className="animate-pulse">BOOTSTRAPPING_ENVIRONMENT...</div>
            </div>
        }>
            <AccountSettingsContent />
        </Suspense>
    )
}
