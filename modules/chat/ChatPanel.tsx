'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Send,
    Sparkles,
    X,
    MessageSquare,
    ChevronRight,
    Check,
    Zap,
    Mic,
    MicOff,
    RefreshCcw,
    Video,
    ChevronDown,
    Music,
    Wand2,
    Loader2,
} from 'lucide-react';
import { useChatEngine, ChatMessage } from './useChatEngine';
import { useIntentExecutor } from './useIntentExecutor';
import { useSpeechToText } from './useSpeechToText';
import { FormattedMessage } from './FormattedMessage';
import { Option } from './messageFormatter';
import { queryCanvasPrompt } from '@/core/api/api';
import { anchorSmartTokens, SmartToken } from '@/modules/generators/TextInput/smartTerms';

type ChatMode = 'agent' | 'general';

interface ChatPanelProps {
    canvasState: any;
    canvasSelection: any;
    props: any;
    viewportSize: { width: number; height: number };
    position: { x: number; y: number };
    scale: number;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    canvasState,
    canvasSelection,
    props,
    viewportSize,
    position,
    scale,
    isOpen,
    setIsOpen,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [chatMode, setChatMode] = useState<ChatMode>('agent');
    const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

    // Smart Tokens State
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [aiSmartTokens, setAiSmartTokens] = useState<SmartToken[]>([]);
    const smartTokens = React.useMemo(() => anchorSmartTokens(inputValue, aiSmartTokens), [inputValue, aiSmartTokens]);
    const [activeTokenIndex, setActiveTokenIndex] = useState<number | null>(null);
    const [activeTokenRect, setActiveTokenRect] = useState<{ top: number; left: number } | null>(null);
    const [isTokenHovered, setIsTokenHovered] = useState(false);
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const tokenOverlayRef = useRef<HTMLDivElement>(null);

    const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        const pos = e.currentTarget.selectionStart;
        if (pos === null) return;

        const tokenIndex = smartTokens.findIndex(t => pos >= t.startIndex && pos <= t.endIndex);

        if (tokenIndex !== -1 && tokenOverlayRef.current) {
            const span = tokenOverlayRef.current.querySelector(`[data-token-index="${tokenIndex}"]`);
            if (span) {
                const rect = (span as HTMLElement).getBoundingClientRect();
                const containerRect = inputContainerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
                setActiveTokenIndex(tokenIndex);
                setActiveTokenRect({
                    top: rect.bottom - containerRect.top,
                    left: rect.left - containerRect.left,
                });
            }
        } else {
            setActiveTokenIndex(null);
        }
    };

    const handleTextareaMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        const caretPos = e.currentTarget.selectionStart;
        if (caretPos === null) {
            setIsTokenHovered(false);
            return;
        }
        const isOverToken = smartTokens.some(t => caretPos >= t.startIndex && caretPos <= t.endIndex);
        setIsTokenHovered(isOverToken);
    };

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (tokenOverlayRef.current) {
            tokenOverlayRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    const handleEnhance = async () => {
        if (!inputValue.trim() || isEnhancing) return;
        setIsEnhancing(true);
        try {
            const result = await queryCanvasPrompt(inputValue);
            const enhancedText = result?.enhanced_prompt || result?.response;
            if (enhancedText) {
                setInputValue(enhancedText);
                if (result.smart_tokens) {
                    setAiSmartTokens(result.smart_tokens);
                }
            }
        } catch (error) {
            console.error('Enhance error:', error);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleTokenClick = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (activeTokenIndex === index) {
            setActiveTokenIndex(null);
        } else {
            setActiveTokenIndex(index);
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const containerRect = inputContainerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
            setActiveTokenRect({
                top: rect.bottom - containerRect.top,
                left: rect.left - containerRect.left,
            });
        }
    };

    const chatEngine = useChatEngine({ canvasState, canvasSelection });
    const executor = useIntentExecutor({ canvasState, canvasSelection, props, viewportSize, position, scale });

    const { isListening, toggleListening, isSupported } = useSpeechToText({
        onTranscriptChange: (text) => setInputValue(text),
        onFinalTranscript: (text) => {
            // Voice UX: auto-send when recognition ends, so no click is required.
            if (!text.trim()) return;
            chatEngine.sendMessage(text);
            setInputValue('');
        },
        continuous: false,
        interimResults: true,
    });

    // Attachment counts (used by UI only)
    const attachmentCounts = React.useMemo(() => {
        const ids = new Set(canvasSelection?.selectedIds || []);
        if (ids.size === 0) return { imageCount: 0, videoCount: 0, musicCount: 0, pluginCount: 0, total: 0 };

        const countedImageIds = new Set<string>();
        const countedVideoIds = new Set<string>();
        const countedMusicIds = new Set<string>();
        const countedPluginIds = new Set<string>();

        const imageArrays = [canvasState?.images, canvasState?.imageGenerators, canvasState?.imageModalStates];
        const videoArrays = [canvasState?.videoGenerators, canvasState?.videoModalStates];
        const musicArrays = [canvasState?.musicGenerators, canvasState?.musicModalStates];
        const pluginArrays = [
            canvasState?.upscaleModalStates,
            canvasState?.removeBgModalStates,
            canvasState?.eraseModalStates,
            canvasState?.expandModalStates,
            canvasState?.vectorizeModalStates,
            canvasState?.nextSceneModalStates,
            canvasState?.compareModalStates,
            canvasState?.multiangleCameraModalStates,
            canvasState?.storyboardModalStates,
            canvasState?.scriptFrameModalStates,
            canvasState?.sceneFrameModalStates,
            canvasState?.imageEditorModalStates,
            canvasState?.videoEditorModalStates,
        ];

        imageArrays.forEach(arr => {
            if (!Array.isArray(arr)) return;
            arr.forEach((item: any) => {
                if (item?.id && ids.has(item.id) && !countedImageIds.has(item.id)) countedImageIds.add(item.id);
            });
        });

        videoArrays.forEach(arr => {
            if (!Array.isArray(arr)) return;
            arr.forEach((item: any) => {
                if (item?.id && ids.has(item.id) && !countedVideoIds.has(item.id)) countedVideoIds.add(item.id);
            });
        });

        musicArrays.forEach(arr => {
            if (!Array.isArray(arr)) return;
            arr.forEach((item: any) => {
                if (item?.id && ids.has(item.id) && !countedMusicIds.has(item.id)) countedMusicIds.add(item.id);
            });
        });

        pluginArrays.forEach(arr => {
            if (!Array.isArray(arr)) return;
            arr.forEach((item: any) => {
                if (item?.id && ids.has(item.id) && !countedPluginIds.has(item.id)) countedPluginIds.add(item.id);
            });
        });

        const imageCount = countedImageIds.size;
        const videoCount = countedVideoIds.size;
        const musicCount = countedMusicIds.size;
        const pluginCount = countedPluginIds.size;
        return { imageCount, videoCount, musicCount, pluginCount, total: imageCount + videoCount + musicCount + pluginCount };
    }, [canvasSelection?.selectedIds, canvasState]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [chatEngine.messages.length, chatEngine.isProcessing]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        const maxHeight = 160;
        textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }, [inputValue]);

    // Prevent the canvas from reacting to trackpad/mouse wheel when the pointer is over the chat,
    // while still allowing the chat history to scroll.
    //
    // We do this by:
    // - capturing wheel events at the window level (so Konva/canvas doesn't see them)
    // - preventing default (so the canvas doesn't zoom/pan)
    // - manually scrolling the chat container
    useEffect(() => {
        if (!isOpen) return;
        const panel = panelRef.current;
        if (!panel) return;

        const stopPointerBubble = (e: Event) => {
            e.stopPropagation();
            (e as any).stopImmediatePropagation?.();
        };

        const onWindowWheelCapture = (e: WheelEvent) => {
            // Only intercept wheel events that originate within the chat panel.
            // Using composedPath is more reliable than hover flags for trackpads.
            const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
            const isInPanel = path.includes(panel) || (e.target instanceof Node && panel.contains(e.target));
            if (!isInPanel) return;

            // Block canvas/Konva wheel handlers
            e.preventDefault();
            e.stopPropagation();
            (e as any).stopImmediatePropagation?.();

            const target = e.target as HTMLElement;
            const dropdown = target.closest('.smart-dropdown') || target.closest('.suggestions-dropdown');

            if (dropdown) {
                dropdown.scrollTop += e.deltaY;
                return;
            }

            const scroller = scrollRef.current;
            if (scroller) {
                // Use scrollTop directly (more reliable than scrollBy across browsers).
                scroller.scrollTop += e.deltaY;
                scroller.scrollLeft += e.deltaX || 0;
            }
        };

        window.addEventListener('wheel', onWindowWheelCapture, { passive: false, capture: true });
        panel.addEventListener('pointerdown', stopPointerBubble);
        panel.addEventListener('mousedown', stopPointerBubble);

        return () => {
            window.removeEventListener('wheel', onWindowWheelCapture as any, true);
            panel.removeEventListener('pointerdown', stopPointerBubble as any);
            panel.removeEventListener('mousedown', stopPointerBubble as any);
        };
    }, [isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        chatEngine.sendMessage(inputValue, chatMode);
        setInputValue('');
    };

    const handleExecute = (message: ChatMessage) => {
        if (message.action) executor.executeIntent(message.action);
    };

    const handleOptionSelect = (messageId: string, option: Option) => {
        setSelectedOptions(prev => ({ ...prev, [messageId]: option.label }));
        chatEngine.sendMessage(option.label, chatMode);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-10000 h-14 w-10 rounded-l-xl bg-[#0a1428]/90 hover:bg-[#0a1428] border border-white/10 border-r-0 shadow-lg backdrop-blur-xl transition-all flex items-center justify-center"
                title="Open"
            >
                <ChevronRight size={18} />
            </button>
        );
    }

    return (
        <div
            ref={panelRef}
            className="fixed top-0 bottom-0 right-0 z-10000 w-96 bg-black/95 border border-white/10 rounded-l-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden"
        >
            {/* Side collapse handle (matches screenshot tab) */}
            <button
                onClick={() => setIsOpen(false)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full z-30 h-14 w-10 rounded-l-xl bg-[#0a1428]/90 hover:bg-[#0a1428] border border-white/10 border-r-0 shadow-lg backdrop-blur-xl transition-all flex items-center justify-center"
                title="Collapse"
            >
                <ChevronRight size={18} className="text-white/70" />
            </button>

            {/* Header / Top Area */}
            <div className="flex items-center justify-between p-6 pb-2 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                        <Sparkles size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-medium text-white/90 tracking-wide">WILDMIND</h2>
                        <p className="text-[10px] text-blue-400/60 uppercase tracking-widest">System Online</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                    title="Close"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 relative overflow-hidden group/list z-10">
                {/* subtle top fade */}
                <div
                    className="absolute top-0 left-0 right-0 h-12 z-10 pointer-events-none"
                    style={{ background: 'linear-gradient(to bottom, rgba(10,20,40,0) 0%, transparent 100%)' }}
                />

                {/* Clear Button */}
                <div className="absolute top-2 right-4 z-20 opacity-0 group-hover/list:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={() => chatEngine.clearMessages()}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/20 hover:text-white/60 border border-white/5 transition-all"
                        title="Clear history"
                    >
                        <RefreshCcw size={12} />
                    </button>
                </div>

                <div
                    ref={scrollRef}
                    className="h-full overflow-y-auto p-4 pt-2 space-y-4 custom-scrollbar overscroll-contain"
                >
                    {chatEngine.messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-50">
                            <div className="w-16 h-16 rounded-3xl bg-blue-500/5 flex items-center justify-center text-blue-400/20 border border-blue-500/10">
                                <MessageSquare size={32} />
                            </div>
                            <p className="text-blue-200/20 text-[10px] font-light tracking-[0.3em] uppercase">
                                Awaiting Command
                            </p>
                        </div>
                    ) : (
                        chatEngine.messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`max-w-[90%] px-4 py-3 rounded-2xl text-[13px] font-light leading-relaxed tracking-wide shadow-sm backdrop-blur-md ${msg.role === 'user'
                                        ? 'bg-blue-600/20 text-blue-50 border border-blue-500/30 rounded-tr-sm'
                                        : 'bg-white/5 text-white/80 border border-white/10 rounded-tl-sm'
                                        }`}
                                >
                                    {msg.role === 'assistant' ? (
                                        <FormattedMessage
                                            content={msg.content}
                                            onOptionSelect={(option) => handleOptionSelect(msg.id, option)}
                                            selectedOption={selectedOptions[msg.id] || null}
                                        />
                                    ) : (
                                        msg.content
                                    )}
                                </div>

                                {/* Action Plan */}
                                {msg.role === 'assistant' && msg.action?.intent === 'EXECUTE_PLAN' && (
                                    <div className="mt-2 w-full max-w-[95%] p-4 rounded-xl bg-blue-950/30 border border-blue-500/10 space-y-4 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 text-[9px] font-medium text-blue-300/40 uppercase tracking-[0.2em]">
                                            <Zap size={10} />
                                            <span>Action Plan</span>
                                        </div>

                                        {msg.action.intent === 'EXECUTE_PLAN' && (
                                            <div className="space-y-2">
                                                {(() => {
                                                    const preview = (msg.action?.payload as any)?.__preview as any;
                                                    const warnings: string[] = Array.isArray(preview?.warnings) ? preview.warnings : [];
                                                    const fixes: any[] = Array.isArray(preview?.fixes) ? preview.fixes : [];
                                                    const timeline = preview?.timeline as any;

                                                    return (
                                                        <>
                                                            {warnings.length > 0 && (
                                                                <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
                                                                    <div className="text-[10px] text-yellow-200/70 font-medium mb-2">Warnings:</div>
                                                                    <div className="space-y-1.5 text-[10px] text-yellow-100/70">
                                                                        {warnings.map((w, idx) => (
                                                                            <div key={idx} className="flex items-start gap-2">
                                                                                <span className="mt-0.5 text-yellow-300/60">•</span>
                                                                                <span>{w}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {timeline?.boundaryMarks && (
                                                                <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                                                                    <div className="text-[10px] text-white/60 font-medium mb-2">Timeline:</div>
                                                                    <div className="text-[10px] text-white/70 leading-relaxed">
                                                                        {timeline.boundaryMarks}
                                                                    </div>
                                                                    {Array.isArray(timeline.clips) && timeline.clips.length > 0 && (
                                                                        <div className="mt-2 space-y-1 text-[10px] text-white/60">
                                                                            {timeline.clips.slice(0, 6).map((c: any) => (
                                                                                <div key={c.index} className="flex gap-2">
                                                                                    <span className="text-blue-300/50">{c.start}s–{c.end}s</span>
                                                                                    <span className="truncate">{c.prompt || `Clip ${c.index}`}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {fixes.length > 0 && (
                                                                <div className="rounded-lg bg-blue-500/5 border border-blue-500/15 p-3">
                                                                    <div className="text-[10px] text-blue-200/60 font-medium mb-2">Auto-fix:</div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {fixes.map((f: any) => (
                                                                            <button
                                                                                key={f.id || f.label}
                                                                                onClick={() => chatEngine.applyAutoFix(f)}
                                                                                className="px-2.5 py-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-100/80 border border-blue-500/20 text-[10px] transition-all"
                                                                            >
                                                                                {f.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                                <div className="text-[11px] text-white/70 font-medium mb-2">Summary:</div>
                                                <div className="text-[11px] text-white/80 font-light leading-relaxed pl-3 border-l-2 border-blue-500/40 space-y-1.5">
                                                    {String(msg.action.payload?.summary || '')
                                                        .split('\n')
                                                        .filter(Boolean)
                                                        .map((line: string, idx: number) => (
                                                            <div key={idx} className="flex items-start gap-2">
                                                                <span className="text-blue-400/60 mt-0.5">•</span>
                                                                <span>{line}</span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-2 border-t border-blue-500/10">
                                            <div className="text-[10px] text-blue-300/60 mb-3 text-center">
                                                Click "Proceed" to start generating, or type any changes below.
                                            </div>
                                            <button
                                                onClick={() => handleExecute(msg)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30 transition-all font-medium text-[10px] uppercase tracking-wider hover:shadow-lg hover:shadow-blue-500/10"
                                            >
                                                <Check size={12} />
                                                Proceed
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {chatEngine.isProcessing && (
                        <div className="flex items-center gap-1.5 text-blue-400 pl-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.1s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 pt-2 z-20 overflow-hidden">
                {/* Attachment Count Indicator - Above Mode Selector */}
                {attachmentCounts.total > 0 && (
                    <div className="mb-2 mt-2 flex items-center justify-end opacity-0 animate-[fadeIn_0.2s_ease-in-out_forwards]">
                        <div className="flex items-center gap-1.5 text-[10px] text-blue-300/70 font-medium">
                            {attachmentCounts.imageCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_2px_rgba(96,165,250,0.6)]" />
                                    <span>{attachmentCounts.imageCount}</span>
                                </span>
                            )}
                            {attachmentCounts.imageCount > 0 && (attachmentCounts.videoCount > 0 || attachmentCounts.musicCount > 0 || attachmentCounts.pluginCount > 0) && (
                                <span className="text-blue-200/30 mx-0.5">•</span>
                            )}
                            {attachmentCounts.videoCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <Video size={10} className="text-blue-400" />
                                    <span>{attachmentCounts.videoCount}</span>
                                </span>
                            )}
                            {attachmentCounts.videoCount > 0 && (attachmentCounts.musicCount > 0 || attachmentCounts.pluginCount > 0) && (
                                <span className="text-blue-200/30 mx-0.5">•</span>
                            )}
                            {attachmentCounts.musicCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <Music size={10} className="text-blue-400" />
                                    <span>{attachmentCounts.musicCount}</span>
                                </span>
                            )}
                            {attachmentCounts.musicCount > 0 && attachmentCounts.pluginCount > 0 && (
                                <span className="text-blue-200/30 mx-0.5">•</span>
                            )}
                            {attachmentCounts.pluginCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <Zap size={10} className="text-blue-400" />
                                    <span>{attachmentCounts.pluginCount}</span>
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Mode Selector */}
                <div className="mb-2 relative">
                    <button
                        onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 text-xs transition-all"
                    >
                        <span className="flex items-center gap-2">
                            {chatMode === 'agent' ? (
                                <>
                                    <Sparkles size={14} className="text-blue-400" />
                                    <span>Agent Mode</span>
                                </>
                            ) : (
                                <>
                                    <MessageSquare size={14} className="text-green-400" />
                                    <span>General Question</span>
                                </>
                            )}
                        </span>
                        <ChevronDown size={14} className={`transition-transform ${isModeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isModeDropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-30"
                                onClick={() => setIsModeDropdownOpen(false)}
                            />
                            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg bg-black/95 border border-white/10 shadow-xl backdrop-blur-xl z-40 overflow-hidden">
                                <button
                                    onClick={() => {
                                        setChatMode('agent');
                                        setIsModeDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-all ${chatMode === 'agent'
                                        ? 'bg-blue-500/20 text-blue-200 border-l-2 border-blue-500'
                                        : 'text-white/70 hover:bg-white/5'
                                        }`}
                                >
                                    <Sparkles size={14} className="text-blue-400" />
                                    <span>Agent Mode</span>
                                    <span className="ml-auto text-[10px] text-white/40">Generate videos/images</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setChatMode('general');
                                        setIsModeDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-all border-t border-white/5 ${chatMode === 'general'
                                        ? 'bg-green-500/20 text-green-200 border-l-2 border-green-500'
                                        : 'text-white/70 hover:bg-white/5'
                                        }`}
                                >
                                    <MessageSquare size={14} className="text-green-400" />
                                    <span>General Question</span>
                                    <span className="ml-auto text-[10px] text-white/40">Ask anything</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="relative group" ref={inputContainerRef}>
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onScroll={handleScroll}
                        onClick={handleTextareaClick}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                            if (e.key === 'Escape') {
                                setActiveTokenIndex(null);
                            }
                        }}
                        placeholder={isListening ? "Listening..." : (chatMode === 'general' ? "Ask a question..." : "Type a command...")}
                        rows={1}
                        onMouseMove={handleTextareaMouseMove}
                        style={{
                            minHeight: '40px',
                            maxHeight: '160px',
                            scrollbarWidth: 'none',
                            color: smartTokens.length > 0 ? 'transparent' : 'inherit',
                            caretColor: 'white',
                            position: 'relative',
                            zIndex: 2,
                            cursor: isTokenHovered ? 'pointer' : 'text',
                        }}
                        onWheel={(e) => e.stopPropagation()}
                        className={`w-full resize-none rounded-xl px-4 py-3 pr-28 text-[13px] leading-relaxed bg-white/5 placeholder:text-white/25 border outline-none transition-all ${isInputFocused ? 'border-blue-500/30' : 'border-white/10'}`}
                    />

                    {/* Smart Tokens Overlay - Always visible, rendered behind the transparent textarea */}
                    {smartTokens.length > 0 && (
                        <div
                            ref={tokenOverlayRef}
                            className={`absolute inset-0 px-4 py-3 pr-28 pointer-events-none text-[13px] leading-relaxed whitespace-pre-wrap break-words overflow-hidden border border-transparent transition-opacity duration-200`}
                            style={{
                                zIndex: 1,
                                color: isInputFocused ? 'rgba(255,255,255,0.7)' : 'white'
                            }}
                        >
                            {renderSmartTokens(inputValue, smartTokens, activeTokenIndex)}
                        </div>
                    )}

                    {/* Smart Category Dropdown */}
                    {activeTokenIndex !== null && activeTokenRect && (
                        <div
                            className="smart-dropdown absolute z-[100] bg-[#1e293b] border border-white/10 rounded-xl shadow-2xl p-1.5 min-w-[160px] max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-1"
                            style={{
                                top: `${activeTokenRect.top + 4}px`,
                                left: `${activeTokenRect.left}px`,
                            }}
                            onWheel={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div className="px-2 py-1 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                                {smartTokens[activeTokenIndex].category}
                            </div>
                            {smartTokens[activeTokenIndex].options.map((option: string) => (
                                <div
                                    key={option}
                                    onClick={() => {
                                        const token = smartTokens[activeTokenIndex];
                                        const newText = inputValue.slice(0, token.startIndex) + option + inputValue.slice(token.endIndex);

                                        // Update the AI smart tokens state so this token PERSISTS with its new text
                                        setAiSmartTokens(prev => prev.map(t => {
                                            // Identify which token we are updating in the original array
                                            // using category and options as a heuristic (since text changed)
                                            if (t.category === token.category && t.options.join(',') === token.options.join(',')) {
                                                return { ...t, text: option };
                                            }
                                            return t;
                                        }));

                                        setInputValue(newText);
                                        setActiveTokenIndex(null);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg text-sm cursor-pointer text-white hover:bg-white/10 transition-colors flex items-center justify-between group"
                                >
                                    <span className="font-medium">{option}</span>
                                    {inputValue.includes(option) && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.8)]" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                        <button
                            onClick={handleEnhance}
                            disabled={!inputValue.trim() || isEnhancing}
                            className={`p-1.5 rounded-lg transition-all ${isEnhancing
                                ? 'bg-purple-500/20 text-purple-300 animate-pulse'
                                : 'bg-white/5 text-white/40 hover:text-purple-400 hover:bg-purple-500/10 border border-white/10'}`}
                            title="Enhance prompt"
                        >
                            {isEnhancing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                        </button>
                        {isSupported && (
                            <button
                                onClick={toggleListening}
                                className={`p-2 rounded-lg transition-all ${isListening
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                                    }`}
                                title={isListening ? 'Stop listening' : 'Start voice input'}
                            >
                                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                        )}

                        <button
                            onClick={handleSend}
                            disabled={!inputValue.trim() || isListening}
                            className={`p-2 rounded-lg transition-all ${!inputValue.trim() || isListening
                                ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                                : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30'
                                }`}
                            title="Send"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes tokenPulse {
                    0% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }
                    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.7); }
                    100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.4); }
                }
            `}</style>
        </div>
    );
};

/**
 * Helper to render text with interactive smart tokens in ChatPanel
 */
function renderSmartTokens(
    text: string,
    tokens: SmartToken[],
    activeIndex: number | null
) {
    if (tokens.length === 0) return text;

    const result: (string | React.ReactNode)[] = [];
    let lastIndex = 0;

    tokens.forEach((token, index) => {
        // Add text before token
        if (token.startIndex > lastIndex) {
            result.push(text.slice(lastIndex, token.startIndex));
        }

        // Add token
        result.push(
            <span
                key={index}
                data-token-index={index}
                style={{
                    color: activeIndex === index ? '#3B82F6' : '#60A5FA',
                    position: 'relative',
                    textDecoration: 'underline',
                    textDecorationColor: 'rgba(59, 130, 246, 0.4)',
                    textUnderlineOffset: '4px',
                }}
                className={`inline font-black transition-all cursor-pointer`}
            >
                {token.text}
                <span style={{
                    position: 'absolute',
                    bottom: '-12px',
                    left: '50%',
                    transform: `translateX(-50%) ${activeIndex === index ? 'rotate(180deg)' : ''}`,
                    fontSize: '10px',
                    color: '#60A5FA',
                    pointerEvents: 'none',
                    opacity: 0.8,
                }}>▾</span>
            </span>
        );

        lastIndex = token.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
        result.push(text.slice(lastIndex));
    }

    return result;
}
