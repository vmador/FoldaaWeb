import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
// Map font-mono to Inter as well to globalize the non-terminal look requested by user
const jetbrains = Inter({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Foldaa | Warp Dashboard',
  description: 'Control your Foldaa apps like a pro.',
}

import { UserProvider } from '@/lib/contexts/UserContext'
import { UIProvider } from '@/lib/contexts/UIContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrains.variable} font-sans min-h-screen bg-black text-[#D8D8D8] antialiased selection:bg-[#343A46]`}>
        <UserProvider>
          <UIProvider>
            {children}
          </UIProvider>
        </UserProvider>
      </body>
    </html>
  )
}
