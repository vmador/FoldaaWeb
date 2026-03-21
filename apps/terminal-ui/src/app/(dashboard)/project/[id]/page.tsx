import { redirect } from 'next/navigation';

export default async function ProjectRootPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    redirect(`/project/${resolvedParams.id}/overview`);
}
