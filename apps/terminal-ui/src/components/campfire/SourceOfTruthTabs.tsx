"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Palette, MapTrifold, Books, Hash } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';

import { useSearchParams } from 'next/navigation';

interface SourceOfTruthTabsProps {
    manifests: {
        system: string;
        design: string;
        roadmap: string;
        stack: string;
    };
}

export default function SourceOfTruthViewer({ manifests }: SourceOfTruthTabsProps) {
    const searchParams = useSearchParams();
    const activeTab = searchParams?.get('file') as 'system' | 'design' | 'roadmap' | 'stack' || 'roadmap';

    // Define the tabs with their respective metadata
    const TABS = [
        { id: 'roadmap', label: 'roadmap.md', icon: MapTrifold, content: manifests.roadmap, type: 'Execution' },
        { id: 'system', label: 'system.md', icon: FileText, content: manifests.system, type: 'Architecture' },
        { id: 'design', label: 'design.md', icon: Palette, content: manifests.design, type: 'Aesthetics' },
        { id: 'stack', label: 'stack.md', icon: Books, content: manifests.stack, type: 'Technical' },
    ];

    const currentTabContent = TABS.find(t => t.id === activeTab)?.content || '';

    return (
        <div className="flex flex-col h-full bg-[#080808] border border-neutral-200/20 rounded-2xl overflow-hidden relative">

            {/* Markdown Viewer */}
            <div className="flex-1 overflow-y-auto w-full p-8 prose prose-invert prose-sm max-w-none 
                            prose-headings:text-foreground prose-headings:tracking-tight
                            prose-a:text-blue-400 hover:prose-a:text-blue-300
                            prose-code:text-emerald-400 prose-code:bg-emerald-400/10 prose-code:px-1 prose-code:rounded
                            prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800
                            prose-li:text-neutral-300">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* File Metadata Header */}
                        <div className="flex items-center gap-4 py-2 px-4 mb-8 -ml-4 -mr-4 bg-neutral-100/5 border-y border-neutral-200/10 text-[10px] font-mono-hud text-muted-foreground uppercase tracking-widest">
                            <Hash size={12} />
                            <span>Source of Truth Manifest</span>
                            <div className="w-px h-3 bg-neutral-200/20" />
                            <span className="text-foreground/80">{TABS.find(t => t.id === activeTab)?.type}</span>
                            <div className="ml-auto flex items-center gap-2 text-emerald-500/80">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                synced
                            </div>
                        </div>

                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {currentTabContent}
                        </ReactMarkdown>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
