import React, { useState } from "react"
import { BookOpen, Copy, Check, Code2, ExternalLink } from "lucide-react"

interface IntegrationGuideProps {
    supabaseUrl: string
    anonKey: string
}

export default function IntegrationGuide({ supabaseUrl, anonKey }: IntegrationGuideProps) {
    const [copied, setCopied] = useState<string | null>(null)

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopied(id)
        setTimeout(() => setCopied(null), 2000)
    }

    const snippets = [
        {
            id: "client",
            title: "Supabase Client",
            description: "Initialize the client in your project.",
            code: `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${supabaseUrl || "YOUR_SUPABASE_URL"}'
const supabaseAnonKey = '${anonKey || "YOUR_ANON_KEY"}'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)`
        },
        {
            id: "protect",
            title: "Protect a Page",
            description: "Check for an active session and redirect if missing.",
            code: `import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from './supabaseClient'

export default function ProtectedPage() {
    const router = useRouter()

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                router.push('/login')
            }
        })

        return () => subscription.unsubscribe()
    }, [router])

    return <div>Protected Content</div>
}`
        }
    ]

    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-[#444] tracking-widest uppercase">
                <BookOpen className="w-3 h-3" /> Integration Guide
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <h3 className="text-white font-bold text-sm">How to use Auth in your project</h3>
                    <p className="text-xs text-[#666] leading-relaxed">
                        Once you've configured your Supabase credentials, you can protect any page or resource in your application using the standard Supabase client.
                    </p>
                    <div className="flex flex-col gap-2 mt-2">
                        <a 
                            href="https://supabase.com/docs/guides/auth" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-brand-400 hover:text-brand-300 text-xs transition-colors w-fit"
                        >
                            <ExternalLink className="w-3 h-3" />
                            OFFICIAL_SUPABASE_DOCS
                        </a>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {snippets.map((snippet) => (
                        <div key={snippet.id} className="bg-[#1C1C1E] border border-[#2A2A2E] rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 bg-[#2A2A2E] border-b border-[#2A2A2E]">
                                <div className="flex items-center gap-2">
                                    <Code2 className="w-3 h-3 text-brand-500" />
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">{snippet.title}</span>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(snippet.code, snippet.id)}
                                    className="text-[#444] hover:text-brand-400 transition-colors"
                                >
                                    {copied === snippet.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </button>
                            </div>
                            <div className="p-3">
                                <p className="text-xs text-[#444] mb-2">{snippet.description}</p>
                                <pre className="text-xs font-mono text-[#666] overflow-x-auto">
                                    <code>{snippet.code}</code>
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
