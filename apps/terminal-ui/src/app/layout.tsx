import './globals.css'
import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Foldaa',
  description: 'Control your Foldaa apps like a pro.',
  icons: {
    icon: '/icon.svg',
  },
}

import { UserProvider } from '@/lib/contexts/UserContext'
import { UIProvider } from '@/lib/contexts/UIContext'
import { WorkspaceProvider } from '@/lib/contexts/WorkspaceContext'
import { ProjectProvider } from '@/lib/contexts/ProjectContext'
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} font-sans min-h-screen bg-background text-foreground antialiased selection:bg-[#343A46]`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <UserProvider>
            <UIProvider>
              <WorkspaceProvider>
                <ProjectProvider>
                  {children}
                </ProjectProvider>
              </WorkspaceProvider>
            </UIProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
