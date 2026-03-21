"use client"
import React from "react"
import DomainsTab from "@/components/project/tabs/DomainsTab/DomainsTab"

export default function ProjectDomainsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = React.use(params)
    return <DomainsTab projectId={resolvedParams.id} />
}
