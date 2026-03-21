"use client"
import React, { useState, useEffect } from "react"
import { Globe, Plus, Loader2, ChevronLeft } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import DomainList from "./DomainList"
import DomainDetail from "./DomainDetail"
import AddDomainWizard from "./modals/AddDomainWizard"

interface DomainsTabProps {
    projectId: string
}

import { TabHeader } from "@/components/ui/TabHeader"

export default function DomainsTab({ projectId }: DomainsTabProps) {
    const [view, setView] = useState<"list" | "detail">("list")
    const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [domains, setDomains] = useState<any[]>([])
    const [showAddModal, setShowAddModal] = useState(false)

    const searchParams = useSearchParams()
    const router = useRouter()
    const domainIdParam = searchParams.get("domainId")
    const addParam = searchParams.get("add")

    useEffect(() => {
        if (domainIdParam) {
            setSelectedDomainId(domainIdParam)
            setView("detail")
        }
    }, [domainIdParam])

    useEffect(() => {
        if (addParam === "true") {
            setShowAddModal(true)
            // Clear the param after opening to avoid re-opening on manual refresh/navigation
            const params = new URLSearchParams(searchParams.toString())
            params.delete("add")
            router.replace(`/project/${projectId}/domains?${params.toString()}`, { scroll: false })
        }
    }, [addParam, projectId, router, searchParams])

    useEffect(() => {
        const handleOpenAddDomain = () => setShowAddModal(true)
        window.addEventListener('open-add-domain', handleOpenAddDomain)
        return () => window.removeEventListener('open-add-domain', handleOpenAddDomain)
    }, [])

    useEffect(() => {
        fetchDomains()
    }, [projectId])

    const fetchDomains = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("domains")
                .select("*")
                .eq("project_id", projectId)
                .order("created_at", { ascending: false })

            if (error) throw error
            setDomains(data || [])
        } catch (error) {
            console.error("Error fetching domains:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleViewDetail = (id: string) => {
        setSelectedDomainId(id)
        setView("detail")
    }

    const handleBackToList = () => {
        setView("list")
        setSelectedDomainId(null)
        // Clear query param
        const params = new URLSearchParams(searchParams.toString())
        params.delete("domainId")
        router.push(`/project/${projectId}/domains?${params.toString()}`, { scroll: false })
        fetchDomains()
    }

    if (isLoading && view === "list") {
        return (
            <div className="flex items-center gap-2 text-[#444] text-sm p-8 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>SYNCING_DOMAINS...</span>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
            <TabHeader 
                title={view === "detail" ? "Domain Details" : "Custom Domains"}
                description={view === "detail" 
                    ? "Manage routing rules and DNS configuration for your domain." 
                    : "Connect custom domains to your project and manage SSL certificates."
                }
                backAction={view === "detail" ? { onClick: handleBackToList } : undefined}
                action={view === "list" ? {
                    label: "Add Domain",
                    onClick: () => setShowAddModal(true),
                    icon: Plus
                } : undefined}
            />

            {view === "list" ? (
                <DomainList 
                    domains={domains} 
                    onViewDetail={handleViewDetail} 
                    onRefresh={fetchDomains}
                />
            ) : (
                <DomainDetail 
                    domainId={selectedDomainId!} 
                    onBack={handleBackToList} 
                />
            )}

            {showAddModal && (
                <AddDomainWizard 
                    projectId={projectId}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false)
                        fetchDomains()
                    }}
                />
            )}
        </div>
    )
}
