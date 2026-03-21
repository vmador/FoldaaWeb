import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import ProfileClient from './ProfileClient'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) return { title: 'Developer Not Found | Foldaa' }

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username
  const ogImage = profile.avatar_url || profile.avatar_path || profile.profile_picture_url || 'https://hueirgbgitrhqoopfxcu.supabase.co/storage/v1/object/public/marketplace-assets/og-default.png'

  return {
    title: `${name} (@${profile.username}) | Foldaa Developer`,
    description: profile.bio || `Explore the projects and portfolio of ${name} on Foldaa.`,
    openGraph: {
      title: `${name} on Foldaa`,
      description: profile.bio || `Explore the projects and portfolio of ${name} on Foldaa.`,
      images: [ogImage],
      type: 'profile',
      username: profile.username,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} on Foldaa`,
      description: profile.bio || `Explore the projects and portfolio of ${name} on Foldaa.`,
      images: [ogImage],
    }
  }
}

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <ProfileClient username={username} />
}
