"use client"

import React from "react"
import AuthTab from "@/components/project/tabs/AuthTab/AuthTab"

export default function ProjectAuthPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = React.use(params)
    const projectId = resolvedParams.id

    return <AuthTab projectId={projectId} />
}
