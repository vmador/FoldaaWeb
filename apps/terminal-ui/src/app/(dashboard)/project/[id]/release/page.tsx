"use client"
import React from 'react';
import { useProjects } from '@/lib/hooks/useProjects';
import ReleaseContent from '@/components/release/ReleaseContent';

export default function ReleasePage({ params }: { params: Promise<{ id: string }> }) {
    const { projects, loading } = useProjects();
    const resolvedParams = React.use(params);
    const projectId = resolvedParams.id;
    const project = projects.find(p => p.id === projectId) as any;

    if (loading) {
        return (
            <div className="flex-1 flex flex-col min-w-0 bg-black p-6 text-[#666] text-sm font-mono">
                Loading project details...
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex-1 flex flex-col min-w-0 bg-black p-6 text-red-500 text-sm font-mono">
                Project not found.
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-6 py-4">
            <ReleaseContent project={project} projectId={projectId} />
        </div>
    );
}
