"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import SettingsLayout, { SettingsTab } from "@/components/account/SettingsLayout"
import ProfileSection from "@/components/account/ProfileSection"
import AccountSection from "@/components/account/AccountSection"
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
                return <ProfileSection /> // We will rename/merge Profile/Account in next step
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

    return (
        <SettingsLayout activeTab={activeTab} onTabChange={handleTabChange}>
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
