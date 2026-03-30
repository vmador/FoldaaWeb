'use client'

import React, { useState } from 'react'
import DeveloperProfile from '@/components/marketplace/DeveloperProfile'
import ProjectDetail from '@/components/marketplace/ProjectDetail'
import { useUser } from '@/lib/contexts/UserContext'
import { useRouter } from 'next/navigation'

interface ProfileClientProps {
  username: string
}

export default function ProfileClient({ username }: ProfileClientProps) {
  const { profile: user } = useUser()
  const router = useRouter()
  const [pageView, setPageView] = useState<'profile' | 'project'>('profile')
  const [selectedProject, setSelectedProject] = useState<any>(null)

  const handleBack = () => {
    if (pageView === 'project') {
      setPageView('profile')
      setSelectedProject(null)
    } else {
      router.push('/campfire')
    }
  }

  if (pageView === 'project' && selectedProject) {
    return (
      <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
        <ProjectDetail 
          listing={selectedProject}
          onBack={handleBack}
          onViewDeveloperProfile={() => setPageView('profile')}
        />
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
        <DeveloperProfile 
          username={username} 
          currentUser={user}
          onBack={handleBack}
          onProjectClick={(project) => {
            setSelectedProject(project)
            setPageView('project')
          }}
        />
    </div>
  )
}
