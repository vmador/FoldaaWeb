"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, DownloadSimple, Check, Code, ClockCounterClockwise, Eye } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';

interface Version {
    id: string;
    date: string;
    author: string;
    message: string;
    content: string;
}

interface TentFileWorkspaceProps {
    fileId: string;
    manifestContent: string;
    onSave?: (content: string) => void;
    onRestore?: (content: string) => void;
}

export default function TentFileWorkspace({ fileId, manifestContent, onSave, onRestore }: TentFileWorkspaceProps) {
    const [viewMode, setViewMode] = useState<'view' | 'edit' | 'history'>('view');
    const [content, setContent] = useState(manifestContent || '');
    const [isSaving, setIsSaving] = useState(false);

    // Synchronize content if prop changes (e.g., switched file)
    useEffect(() => {
        setContent(manifestContent || '');
        setViewMode('view');
    }, [manifestContent, fileId]);

    // Expanded Mock History with content for diffs
    const MOCK_HISTORY = [
        { 
            id: 'v3', 
            date: 'Just now', 
            author: 'Sparky', 
            message: 'Applied AI optimizations for latency.',
            content: content // current
        },
        { 
            id: 'v2', 
            date: '2 hours ago', 
            author: 'Sarah Connor', 
            message: 'Updated initial schema requirements.',
            content: `# System: OpenTable + AI (v2)\n\nThis version includes the basic database schema for restaurants and reservations.\n\n## Changes in v2\n- Added tables and availability sync.\n- Redesigned the merchant portal.`
        },
        { 
            id: 'v1', 
            date: '1 day ago', 
            author: 'J. Doe', 
            message: 'Initial manifest creation.',
            content: `# Initial System Seed\n\nFirst draft of the OpenTable + AI project.`
        },
    ];

    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
    const selectedVersion = MOCK_HISTORY.find(v => v.id === selectedVersionId);

    const handleRestore = (version: Version) => {
        setContent(version.content);
        if (onRestore) onRestore(version.content);
        setViewMode('view');
        setSelectedVersionId(null);
    };

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API delay
        setTimeout(() => {
            setIsSaving(false);
            if (onSave) onSave(content);
            setViewMode('view');
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full bg-[#080808]/80 backdrop-blur-xl border border-neutral-200/10 rounded-2xl overflow-hidden shadow-2xl relative">
            
            {/* Toolbar Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-neutral-100/5 border-b border-neutral-200/10">
                <div className="flex items-center gap-3 text-foreground">
                    <Hash size={18} className="text-muted-foreground" />
                    <h2 className="text-sm font-bold tracking-tight uppercase">{fileId}{!fileId.endsWith('.md') && '.md'}</h2>
                    
                    <div className="w-px h-4 bg-neutral-200/20 mx-2" />
                    
                    <div className={clsx(
                        "flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500/80 text-[10px] uppercase font-bold tracking-widest transition-opacity",
                        viewMode === 'history' && selectedVersionId ? "opacity-30" : "opacity-100"
                    )}>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        synced
                    </div>

                    {viewMode === 'history' && selectedVersionId && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2"
                        >
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Inspecting {selectedVersionId}</span>
                            <button 
                                onClick={() => setSelectedVersionId(null)}
                                className="text-[10px] text-muted-foreground hover:text-foreground underline decoration-muted-foreground/30"
                            >
                                Clear
                            </button>
                        </motion.div>
                    )}
                </div>

                {/* View Toggles */}
                <div className="flex items-center bg-[#080808] border border-neutral-200/10 rounded-lg p-1">
                    <button
                        onClick={() => { setViewMode('view'); setSelectedVersionId(null); }}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-widest transition-all",
                            viewMode === 'view' ? "bg-neutral-100/10 text-foreground" : "text-muted-foreground hover:text-neutral-300"
                        )}
                    >
                        <Eye size={14} weight={viewMode === 'view' ? 'fill' : 'regular'} />
                        Preview
                    </button>
                    <button
                        onClick={() => { setViewMode('edit'); setSelectedVersionId(null); }}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-widest transition-all",
                            viewMode === 'edit' ? "bg-neutral-100/10 text-foreground" : "text-muted-foreground hover:text-neutral-300"
                        )}
                    >
                        <Code size={14} weight={viewMode === 'edit' ? 'fill' : 'regular'} />
                        Edit
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-widest transition-all",
                            viewMode === 'history' ? "bg-neutral-100/10 text-foreground" : "text-muted-foreground hover:text-neutral-300"
                        )}
                    >
                        <ClockCounterClockwise size={14} weight={viewMode === 'history' ? 'fill' : 'regular'} />
                        History
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    
                    {/* PREVIEW MODE */}
                    {viewMode === 'view' && (
                        <motion.div
                            key="view"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 p-8 overflow-y-auto"
                        >
                            <div className="prose prose-invert prose-sm max-w-none 
                                            prose-headings:text-foreground prose-headings:tracking-tight
                                            prose-a:text-blue-400 hover:prose-a:text-blue-300
                                            prose-code:text-emerald-400 prose-code:bg-emerald-400/10 prose-code:px-1 prose-code:rounded
                                            prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800
                                            prose-li:text-neutral-300">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {content}
                                </ReactMarkdown>
                            </div>
                        </motion.div>
                    )}

                    {/* EDIT MODE */}
                    {viewMode === 'edit' && (
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 p-6 flex flex-col"
                        >
                            <textarea 
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="flex-1 w-full bg-transparent border-0 outline-none resize-none font-mono text-[13px] leading-relaxed text-neutral-300 placeholder-neutral-600 custom-scrollbar"
                                spellCheck={false}
                                placeholder="Write markup here..."
                            />
                            
                            {/* Save Action Footer */}
                            {content !== manifestContent && (
                                <div className="mt-4 pt-4 border-t border-neutral-200/10 flex justify-end">
                                    <button 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className={clsx(
                                            "btn-primary flex items-center gap-2",
                                            isSaving && "opacity-50 cursor-not-allowed"
                                        )}
                                    >
                                        {isSaving ? (
                                            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Check size={14} weight="bold" />
                                        )}
                                        {isSaving ? 'Syncing...' : 'Commit Changes'}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* HISTORY MODE */}
                    {viewMode === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                            className="absolute inset-0 flex"
                        >
                            {/* Timeline Sidebar */}
                            <div className="w-[300px] border-r border-neutral-200/10 p-6 overflow-y-auto bg-[#080808]/30">
                                <h3 className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-8">Revision History</h3>
                                <div className="space-y-4 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-neutral-200/10">
                                    {MOCK_HISTORY.map((entry, idx) => (
                                        <div key={entry.id} className="relative pl-10">
                                            {/* Timeline Node */}
                                            <div className={clsx(
                                                "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-[#080808] flex items-center justify-center transition-colors",
                                                selectedVersionId === entry.id ? "bg-blue-500 scale-110" : 
                                                idx === 0 ? "bg-emerald-500" : "bg-neutral-500/50"
                                            )}>
                                                {idx === 0 && !selectedVersionId && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                                            </div>
                                            
                                            <div 
                                                onClick={() => setSelectedVersionId(entry.id)}
                                                className={clsx(
                                                    "bg-neutral-100/5 hover:bg-neutral-100/10 transition-all border rounded-xl p-3 cursor-pointer group",
                                                    selectedVersionId === entry.id ? "border-blue-500/50 bg-blue-500/5" : "border-neutral-200/10"
                                                )}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-foreground">{entry.author}</span>
                                                        <span className="text-[9px] text-muted-foreground font-bold">{entry.date}</span>
                                                    </div>
                                                    <p className="text-[10px] text-neutral-400 line-clamp-1 group-hover:text-neutral-300 transition-colors">{entry.message}</p>
                                                    <span className="text-[8px] bg-neutral-100/10 px-1.5 py-0.5 rounded self-start font-bold text-muted-foreground/60">
                                                        {entry.id}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Diff / Version Preview Content */}
                            <div className="flex-1 p-8 overflow-y-auto bg-[#080808]/10 custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    {selectedVersionId ? (
                                        <motion.div
                                            key={selectedVersionId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-6"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-sm font-bold text-foreground tracking-tight">Comparing Version {selectedVersionId}</h3>
                                                    <p className="text-xs text-muted-foreground">{selectedVersion?.message}</p>
                                                </div>
                                                <button 
                                                    onClick={() => selectedVersion && handleRestore(selectedVersion)}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-bold transition-all"
                                                >
                                                    <DownloadSimple size={14} weight="bold" />
                                                    Restore this version
                                                </button>
                                            </div>

                                            <div className="bg-[#0c0c0c] border border-neutral-200/10 rounded-xl p-6 font-mono text-[12px] leading-relaxed">
                                                <div className="flex flex-col gap-0.5">
                                                    {/* Mock Diff Layout */}
                                                    <div className="bg-rose-500/10 text-rose-400/80 -mx-6 px-6 py-1 border-y border-rose-500/5">
                                                        - Previous content that was removed in subsequent edits.
                                                    </div>
                                                    <div className="bg-emerald-500/10 text-emerald-400/80 -mx-6 px-6 py-1 border-y border-emerald-500/5 mb-4">
                                                        + New optimized content added by {selectedVersion?.author}.
                                                    </div>
                                                    <div className="text-neutral-400">
                                                        {selectedVersion?.content.split('\n').map((line, i) => (
                                                            <div key={i}>{line}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }}
                                            className="h-full flex flex-col items-center justify-center text-center space-y-4"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-neutral-100/5 flex items-center justify-center border border-neutral-200/10">
                                                <ClockCounterClockwise size={24} className="text-muted-foreground/40" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold text-foreground">Select a version to compare</h4>
                                                <p className="text-xs text-muted-foreground max-w-[240px]">Inspect previous commits and technical evolutions of this manifest.</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
