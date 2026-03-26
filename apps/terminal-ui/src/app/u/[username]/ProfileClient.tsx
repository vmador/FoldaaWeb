'use client'

import React from 'react'
import DeveloperProfile from '@/components/marketplace/DeveloperProfile'
import { useUser } from '@/lib/contexts/UserContext'

interface ProfileClientProps {
  username: string
}

export default function ProfileClient({ username }: ProfileClientProps) {
  const { profile: user } = useUser()

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
        <DeveloperProfile 
          username={username} 
          currentUser={user}
        />
    </div>
  )
}
