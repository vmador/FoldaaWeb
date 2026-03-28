'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import clsx from 'clsx';
import { TerminalEngine } from './terminalEngine';
import {
    TerminalWindow,
    Folder,
    Command,
    ArrowDown,
    Question,
    DeviceMobile,
    ArrowSquareOut,
    Eye,
    EyeSlash,
    CircleDashed,
    CheckCircle,
    XCircle,
    Info
} from "@phosphor-icons/react";
import { useUI } from '@/lib/contexts/UIContext';
import { useProjectData } from '@/lib/contexts/ProjectContext';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';

interface TerminalProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
  previewMode?: boolean;
}

interface CommandStep {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'error' | 'info';
  message?: string;
}

interface CommandBlock {
  id: string;
  command: string;
  steps: CommandStep[];
  result?: {
    previewUrl?: string;
    qrData?: string;
  };
}

import { useTheme } from 'next-themes';

const TerminalUI: React.FC<TerminalProps> = ({ supabaseUrl, supabaseAnonKey, previewMode = false }) => {
  const { resolvedTheme } = useTheme();
  const { addToast } = useUI();
  const { folders: rawFolders } = useProjectData();
  const folders = previewMode ? [] : rawFolders;
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const selectedFolder = useMemo(() => {
    return folders.find(f => f.id === selectedFolderId) || null;
  }, [folders, selectedFolderId]);
  
  const colors = useMemo(() => {
    const isDark = resolvedTheme === "dark" || !resolvedTheme; // Fallback to dark
    return {
        overlay: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.4)",
        bg: isDark ? "#000000" : "#FFFFFF",
        drawerBg: isDark ? "#0A0A0A" : "#FFFFFF",
        drawerBorder: isDark ? "#1A1A1A" : "#E5E7EB",
        inputBg: isDark ? "#0D0D0D" : "#F9FAFB",
        cardBg: isDark ? "#0D0D0D" : "#F9FAFB",
        textPrimary: isDark ? "#FFFFFF" : "#111827",
        textSecondary: isDark ? "#6B7280" : "#6B7280",
        textTertiary: isDark ? "#9CA3AF" : "#6B7280",
        textMuted: isDark ? "#6B7280" : "#9CA3AF",
        textLabel: isDark ? "#9CA3AF" : "#6B7280",
        border: isDark ? "#262626" : "#D1D5DB",
        borderLight: isDark ? "#1A1A1A" : "#E5E7EB",
        buttonPrimaryBg: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        buttonPrimaryText: isDark ? "#FFFFFF" : "#000000",
        iconAccent: isDark ? "#FFFFFF" : "#000000",
        iconMuted: isDark ? "#9CA3AF" : "#6B7280",
        success: isDark ? "#10B981" : "#059669",
        error: isDark ? "#EF4444" : "#DC2626",
        terminalPrompt: isDark ? "#555555" : "#9CA3AF",
        kbdBg: isDark ? "#111111" : "#F3F4F6",
        kbdBorder: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        kbdText: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
    }
  }, [resolvedTheme]);

  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const engineRef = useRef<TerminalEngine | null>(null);
  const currentLine = useRef('');
  const [currentInputText, setCurrentInputText] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [history, setHistory] = useState<CommandBlock[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOpenedRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const addBlock = useCallback((command: string) => {
    const id = Math.random().toString(36).substring(7);
    const newBlock: CommandBlock = {
      id,
      command,
      steps: [
        { id: 'init', name: `⚡ Foldaa: Running ${command.split(' ')[0]}...`, status: 'info' }
      ]
    };
    setHistory(prev => [...prev, newBlock]);
    return id;
  }, []);

  const updateBlock = useCallback((blockId: string, msg: any) => {
    setHistory(prev => {
      return prev.map(block => {
        if (block.id !== blockId) return block;

        const newSteps = [...block.steps];
        let newResult = block.result;

        if (msg.event === 'progress') {
          const { step, status } = msg.data;
          // Robust normalization: lowercase, alphanumeric only, trimmed
          const normalize = (s: string) => s.toLowerCase().replace(/[^\w]/g, '').trim();
          const normalizedTarget = normalize(step);
          
          const existingStepIndex = newSteps.findIndex(s => normalize(s.name) === normalizedTarget);

          if (existingStepIndex > -1) {
            newSteps[existingStepIndex] = {
              ...newSteps[existingStepIndex],
              status: status as any
            };
          } else {
            newSteps.push({
              id: Math.random().toString(36).substring(7),
              name: step,
              status: status as any
            });
          }
        } else if (msg.event === 'output') {
          newSteps.push({ 
            id: Math.random().toString(36).substring(7), 
            name: msg.data, 
            status: 'info' 
          });
        }

        return { ...block, steps: newSteps, result: newResult };
      });
    });
  }, []);

  const [isExecuting, setIsExecuting] = useState(false);
  const isExecutingRef = useRef(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      letterSpacing: 0,
      theme: {
        background: 'transparent',
        foreground: colors.textPrimary,
        cursor: colors.textPrimary,
        selectionBackground: 'rgba(255, 255, 255, 0.1)',
      },
      allowTransparency: true,
      cols: 100,
      rows: 1,
      cursorStyle: 'bar',
      cursorInactiveStyle: 'none',
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    let isInternalDisposed = false;
    let fitTimeout: NodeJS.Timeout;
    let initTimeoutId: NodeJS.Timeout;
    let rafId: number;

    // SAFETY NET: Monkey-patch internal refresh and resize to skip if dimensions or core references are missing
    const applyTerminalPatches = (t: XTerm) => {
        try {
            const core = (t as any)._core;
            if (!core) return;
            
            const isSafeToRender = () => {
                return !isInternalDisposed && !!core?._renderService?.dimensions;
            };

            // Patch refresh
            const originalRefresh = core.refresh?.bind(core);
            if (originalRefresh) {
                core.refresh = (start: number, end: number) => {
                    if (!isSafeToRender()) return;
                    try { originalRefresh(start, end); } catch (e) {}
                };
            }

            // Patch viewport refresh and sync
            if (core.viewport) {
                const v = core.viewport;
                const originalVRefresh = v._innerRefresh?.bind(v);
                if (originalVRefresh) {
                    v._innerRefresh = () => {
                        if (!isSafeToRender()) return;
                        try { originalVRefresh(); } catch (e) {}
                    };
                }

                const originalSync = v.syncScrollArea?.bind(v);
                if (originalSync) {
                    v.syncScrollArea = () => {
                        if (!isSafeToRender()) return;
                        try { originalSync(); } catch (e) {}
                    };
                }
            }
        } catch (e) {
            console.error("Failed to apply terminal patches:", e);
        }
    };

    const safeFit = () => {
      if (isInternalDisposed || !terminalRef.current || !isOpenedRef.current) return;
      try {
        // Only fit if visible and attached to DOM
        const rect = terminalRef.current.getBoundingClientRect();
        if (terminalRef.current.offsetParent === null || rect.width === 0 || rect.height === 0) return;
        
        // Final sanity check on xterm core
        const core = (term as any)._core;
        if (!core?._renderService?.dimensions) return;

        fitAddon.fit();
      } catch (e) {
        /* Fit might still fail during rapid unmounts or if xterm is inconsistent */
      }
    };

    // DEFERRED OPEN: Wait for visibility.
    const checkAndOpen = () => {
        if (isInternalDisposed || isOpenedRef.current || !terminalRef.current) return;
        
        if (terminalRef.current.offsetParent !== null && 
            terminalRef.current.clientWidth > 0 && 
            terminalRef.current.clientHeight > 0) {
            try {
                term.open(terminalRef.current);
                isOpenedRef.current = true;
                // Apply patches AFTER open so core components like viewport exist
                applyTerminalPatches(term);
                // Give it a bit more time to settle
                initTimeoutId = setTimeout(safeFit, 100);
            } catch (e) {
                console.error("XTerm open error:", e);
            }
        } else {
            // Check again in next frame
            rafId = requestAnimationFrame(checkAndOpen);
        }
    };

    checkAndOpen();

    const resizeObserver = new ResizeObserver(() => {
      if (isInternalDisposed) return;
      clearTimeout(fitTimeout);
      fitTimeout = setTimeout(safeFit, 100);
    });

    resizeObserver.observe(terminalRef.current);

    xtermRef.current = term;
    engineRef.current = new TerminalEngine(term);

    const updateSuggestion = (input: string) => {
      if (!engineRef.current) return;
      const sugg = engineRef.current.getSuggestion(input);
      setSuggestion(sugg);
    };

    const disposable = term.onData(async (data) => {
      if (isInternalDisposed || isExecutingRef.current) return;
      
      // Handle ANSI escape sequences (Arrow Keys)
      if (data === '\u001b[A') { // Up Arrow
        const prev = engineRef.current?.getPreviousHistory();
        if (typeof prev === 'string') {
          for (let i = 0; i < currentLine.current.length; i++) term.write('\b \b');
          currentLine.current = prev;
          setCurrentInputText(prev);
          term.write(prev);
          updateSuggestion(prev);
        }
        return;
      }
      if (data === '\u001b[B') { // Down Arrow
        const next = engineRef.current?.getNextHistory();
        if (typeof next === 'string') {
          for (let i = 0; i < currentLine.current.length; i++) term.write('\b \b');
          currentLine.current = next;
          setCurrentInputText(next);
          term.write(next);
          updateSuggestion(next);
        }
        return;
      }
      
      // Handle Tab (9) or Arrow Right (Esc[C) for suggestion completion
      if ((data === '\t' || data === '\u001b[C') && suggestion) {
        // Only autocomplete if we are at the end of the line
        // (In this minimal terminal, we are always at the end usually)
        const addition = suggestion.slice(currentLine.current.length);
        currentLine.current = suggestion;
        setCurrentInputText(suggestion);
        term.write(addition);
        setSuggestion(null);
        return;
      }

      // Handle Multi-character data (e.g. paste)
      if (data.length > 1 && !data.includes('\r')) {
        currentLine.current += data;
        setCurrentInputText(currentLine.current);
        term.write(data);
        updateSuggestion(currentLine.current);
        return;
      }

      for (let i = 0; i < data.length; i++) {
        const char = data[i];
        const code = char.charCodeAt(0);

        if (code === 13) { // Enter
          term.write('\r\n');
          const input = currentLine.current.trim();
          
          currentLine.current = '';
          setCurrentInputText('');
          setSuggestion(null);
          
          if (input) {
            setIsExecuting(true);
            isExecutingRef.current = true;
            const blockId = addBlock(input);
            if (engineRef.current) {
              try {
                const result = await engineRef.current.execute(input, (msg) => {
                  if (!isInternalDisposed) updateBlock(blockId, msg);
                });
                
                if (!isInternalDisposed) {
                  setHistory(prev => prev.map(block => {
                    if (block.id !== blockId) return block;
                    
                    const newSteps = [...block.steps];
                    // Mark everything beforehand as success
                    newSteps.forEach(s => { if (s.status === 'pending') s.status = 'success'; });

                    // More robust success check
                    const hasExplicitError = result?.success === false || 
                                          (result?.error && typeof result.error === 'string' && result.error.length > 0) ||
                                          (result?.status === 'error');
                    const isSuccess = !hasExplicitError;
                    
                    const finalMsg = isSuccess 
                        ? (result?.message || (input.includes('foldaa') ? 'Project deployed' : 'Command completed'))
                        : (result?.error || result?.message || 'Command failed');
                    
                    if (isSuccess && input.includes('foldaa')) {
                        addToast(finalMsg, 'success');
                    } else if (hasExplicitError) {
                        addToast(finalMsg, 'error');
                    }
                    
                    // Use normalization for duplicate check
                    const normalize = (s: string) => s.toLowerCase().replace(/[^\w]/g, '').trim();
                    const normalizedFinal = normalize(finalMsg);
                    const alreadyHasFinalMsg = newSteps.some(s => normalize(s.name) === normalizedFinal);
                    
                    if (!alreadyHasFinalMsg) {
                      newSteps.push({
                        id: 'final',
                        name: finalMsg,
                        status: isSuccess ? 'success' : 'error'
                      });
                    } else {
                        // Update existing final step status
                        const idx = newSteps.findIndex(s => normalize(s.name) === normalizedFinal);
                        if (idx > -1) newSteps[idx].status = isSuccess ? 'success' : 'error';
                    }

                    const previewUrl = result?.url || result?.previewUrl || result?.data?.url;

                    return {
                      ...block,
                      steps: newSteps,
                      result: isSuccess && previewUrl ? {
                        previewUrl,
                        qrData: result?.qrData || previewUrl
                      } : block.result
                    };
                  }));
                }
              } catch (err: any) {
                if (!isInternalDisposed) {
                  updateBlock(blockId, { event: 'progress', data: { step: err.message || 'Unknown error', status: 'error' } });
                }
              }
            }
            setIsExecuting(false);
            isExecutingRef.current = false;
          }
        } else if (code === 127) { // Backspace
          if (currentLine.current.length > 0) {
            currentLine.current = currentLine.current.slice(0, -1);
            setCurrentInputText(currentLine.current);
            term.write('\b \b');
            updateSuggestion(currentLine.current);
          }
        } else if (code >= 32) { // Normal character
          currentLine.current += char;
          setCurrentInputText(currentLine.current);
          term.write(char);
          updateSuggestion(currentLine.current);
        }
      }
    });

    return () => {
      isInternalDisposed = true;
      isOpenedRef.current = false;
      cancelAnimationFrame(rafId);
      clearTimeout(initTimeoutId);
      clearTimeout(fitTimeout);
      resizeObserver.disconnect();
      
      // Instance-aware cleanup to prevent Strict Mode bugs
      if (xtermRef.current === term) xtermRef.current = null;
      
      disposable.dispose();
      try {
        term.dispose();
      } catch (e) {
        /* Dispose can fail if terminal is in a weird state */
      }
    };
  }, [addBlock, updateBlock]); // Initialize once, sync separately

  // SYNC THEME: Update xterm theme without re-initializing
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = {
        background: 'transparent',
        foreground: colors.textPrimary,
        cursor: colors.textPrimary,
        selectionBackground: 'rgba(255, 255, 255, 0.1)',
      };
    }
  }, [colors]);

  const handleContainerClick = () => {
    xtermRef.current?.focus();
  };

  return (
    <div 
      className="flex flex-col h-full w-full overflow-hidden antialiased text-xs"
      style={{ 
        backgroundColor: colors.bg,
        color: colors.textSecondary,
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <style jsx global>{`
        .xterm-minimal .xterm-viewport {
          background-color: transparent !important;
          overflow: hidden !important;
        }
        .xterm-minimal .xterm-screen {
          background-color: transparent !important;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header Area */}
      <div 
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: colors.borderLight }}
      >
        <div className="flex items-center gap-2">
            <TerminalWindow size={16} weight="bold" style={{ color: colors.textPrimary }} />
            <span className="font-bold tracking-tight" style={{ color: colors.textPrimary }}>Foldaa Terminal</span>
        </div>
        <button 
          className="text-xs transition-colors font-medium flex items-center gap-1"
          style={{ color: colors.textMuted }}
        >
          <EyeSlash size={14} />
          Hide
        </button>
      </div>

      {/* Shortcuts / Hints Area */}
      <div className="px-4 py-4 space-y-3" style={{ backgroundColor: colors.bg }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <kbd 
              className="px-1.5 py-0.5 rounded border text-xs min-w-[20px] text-center"
              style={{ backgroundColor: colors.kbdBg, borderColor: colors.kbdBorder, color: colors.kbdText }}
            >
              <Command size={10} weight="bold" />
            </kbd>
            <kbd 
              className="px-1.5 py-0.5 rounded border text-xs min-w-[20px] text-center"
              style={{ backgroundColor: colors.kbdBg, borderColor: colors.kbdBorder, color: colors.kbdText }}
            >
              ↩
            </kbd>
          </div>
          <span style={{ color: colors.textSecondary }}>deploy a new site: <span className="font-mono text-xs font-bold" style={{ color: colors.textPrimary }}>foldaa &lt;url&gt;</span></span>
        </div>

        <div className="flex items-center gap-2">
          <kbd 
            className="px-1.5 py-0.5 rounded border text-xs min-w-[20px] text-center"
            style={{ backgroundColor: colors.kbdBg, borderColor: colors.kbdBorder, color: colors.kbdText }}
          >
            <ArrowDown size={10} weight="bold" />
          </kbd>
          <span style={{ color: colors.textSecondary }}>cycle past deployments</span>
        </div>

        <div className="flex items-center gap-2">
          <span 
            className="px-2 py-0.5 rounded-full border text-xs font-bold"
            style={{ backgroundColor: colors.kbdBg, borderColor: colors.kbdBorder, color: colors.kbdText }}
          >
            --help
          </span>
          <span style={{ color: colors.textSecondary }}>Discover the entire list of the commands</span>
        </div>

        <div className="flex items-center gap-2">
          <span 
            className="px-2 py-0.5 rounded-full border text-xs font-bold"
            style={{ backgroundColor: colors.kbdBg, borderColor: colors.kbdBorder, color: colors.kbdText }}
          >
            Tab
          </span>
          <span style={{ color: colors.textSecondary }}>Autocomplete suggestions</span>
        </div>
      </div>
      
      {/* History Blocks Area (Scrollable) */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-2 scroll-smooth"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          userSelect: 'text',
          WebkitUserSelect: 'text'
        }}
      >
        <div className="flex flex-col gap-6">
          {history.map((block) => (
            <div key={block.id} className="flex flex-col gap-4">
              <div className="flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <span style={{ color: colors.terminalPrompt, opacity: 0.5 }}>❯</span>
                <span className="font-mono">{block.command}</span>
              </div>

              <div className="flex flex-col gap-2 pl-4 border-l" style={{ borderColor: colors.borderLight }}>
                {block.steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <span style={{ color: step.status === 'success' ? colors.success : step.status === 'error' ? colors.error : colors.terminalPrompt }}>
                      {step.status === 'success' ? <CheckCircle size={14} weight="fill" /> : step.status === 'error' ? <XCircle size={14} weight="fill" /> : <CircleDashed size={14} className={step.status === 'pending' ? 'animate-spin' : ''} />}
                    </span>
                    <span style={{ color: step.status === 'success' ? colors.textPrimary : step.status === 'error' ? colors.error : colors.textSecondary }}>
                      {step.name}
                    </span>
                  </div>
                ))}

                {/* Result Card */}
                {block.result?.previewUrl && (
                  <div 
                    className="mt-4 p-4 rounded-[3px] border flex flex-col gap-4 max-w-sm"
                    style={{ backgroundColor: colors.cardBg, borderColor: colors.border }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.textLabel }}>Deployment Live</span>
                        <span className="font-mono text-xs truncate" style={{ color: colors.textPrimary }}>{block.result.previewUrl}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a 
                          href={block.result.previewUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 rounded-full hover:bg-white/5 transition-colors"
                          style={{ color: colors.iconAccent }}
                        >
                          <ArrowSquareOut size={18} weight="bold" />
                        </a>
                      </div>
                    </div>

                    {block.result.qrData && (
                      <div className="flex justify-center p-2 rounded-[3px] bg-white/5 border border-white/10 group/qr relative">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(block.result.qrData)}&bgcolor=ffffff&color=000000&margin=10`}
                          alt="Deployment QR Code"
                          className="w-32 h-32 rounded-[3px] transition-transform group-hover/qr:scale-105"
                        />
                        <div className="absolute top-2 right-2 opacity-0 group-hover/qr:opacity-100 transition-opacity">
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-black/80 text-white font-bold backdrop-blur-sm">SCAN ME</span>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => window.open(block.result?.previewUrl, '_blank')}
                      className="w-full py-1.5 rounded-[3px] font-bold flex items-center justify-center gap-2 border border-white/[0.05] hover:bg-white/[0.08] transition-all"
                      style={{ backgroundColor: colors.buttonPrimaryBg, color: colors.buttonPrimaryText }}
                    >
                      <Eye size={16} weight="bold" />
                      Open Preview
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input / Prompt Area */}
      <div 
        className={clsx(
          "w-full border-t pt-6 pb-12 px-4 shadow-2xl transition-opacity duration-300",
          isExecuting ? "opacity-60 pointer-events-none" : "opacity-100"
        )}
        style={{ backgroundColor: colors.bg, borderColor: colors.borderLight }}
        onClick={handleContainerClick}
      >
        <div className="flex flex-col gap-4">
          {/* Folder Pill */}
          <Dropdown
            align="left"
            side="top"
            trigger={
              <div 
                className="flex items-center gap-2 w-fit px-2 py-1 rounded border cursor-pointer hover:bg-white/5 transition-colors"
                style={{ backgroundColor: colors.kbdBg, borderColor: colors.kbdBorder }}
              >
                {isExecuting ? (
                  <CircleDashed size={14} className="animate-spin" style={{ color: colors.iconAccent }} />
                ) : (
                  <Folder size={14} weight="bold" style={{ color: colors.terminalPrompt }} />
                )}
                <span className="text-xs font-bold" style={{ color: colors.textTertiary }}>
                  {selectedFolder ? `/${selectedFolder.name}` : '/Foldaa'}
                </span>
              </div>
            }
          >
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Folder</p>
            </div>
            <div className="max-h-[200px] overflow-y-auto py-1 px-1 flex flex-col gap-0.5">
              <DropdownItem 
                onClick={() => setSelectedFolderId(null)}
                className={clsx(selectedFolderId === null && "bg-black/5 dark:bg-white/10 text-foreground")}
              >
                <Folder size={14} />
                <span className="truncate">/Foldaa (Root)</span>
              </DropdownItem>
              {folders.map((folder) => (
                <DropdownItem 
                  key={folder.id} 
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={clsx(selectedFolderId === folder.id && "bg-black/5 dark:bg-white/10 text-foreground")}
                >
                  <Folder size={14} />
                  <span className="truncate">/{folder.name}</span>
                </DropdownItem>
              ))}
            </div>
          </Dropdown>

          <div className="flex items-center gap-3 group/input">
            {/* Input Icon (፨) */}
            <div className="shrink-0 opacity-80 flex items-center h-6">
                <span className="text-xl font-bold text-white select-none">፨</span>
            </div>
            
            <div className="flex-1 flex items-center gap-0 min-w-0 h-6 relative">
              {currentInputText.length === 0 && !isExecuting && (
                <span 
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-xs pointer-events-none truncate select-none tracking-tight font-medium"
                  style={{ color: colors.textMuted }}
                >
                  <span style={{ color: colors.iconAccent, opacity: 0.5, marginRight: '6px' }}>|</span>
                  <span className="opacity-60">foldaa arpal.framer.website --pwa</span>
                </span>
              )}

              {isExecuting && (
                <span 
                    className="absolute left-0 top-1/2 -translate-y-1/2 text-xs pointer-events-none truncate select-none tracking-tight font-medium"
                    style={{ color: colors.textMuted }}
                >
                    <span style={{ color: colors.iconAccent, opacity: 0.5, marginRight: '4px' }}>⚡</span>
                    Foldaa is working...
                </span>
              )}

              {/* Ghost Text Suggestion */}
              {suggestion && currentInputText.length > 0 && (
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 text-xs pointer-events-none select-none tracking-normal whitespace-pre leading-none"
                  style={{ 
                    color: colors.textPrimary, 
                    opacity: 0.2,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  }}
                >
                  <span className="invisible">{currentInputText}</span>
                  <span>{suggestion.slice(currentInputText.length)}</span>
                </div>
              )}
              
              <div 
                ref={terminalRef} 
                className="flex-1 h-full min-w-0 xterm-minimal relative z-20"
                style={{ 
                    marginTop: '1px' // Micro-alignment for the font baseline
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalUI;
