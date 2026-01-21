'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, MessageSquare, ChevronDown, ChevronRight, Check, Trash2, Zap, Mic, MicOff, RefreshCcw, ArrowRight, Video, Film } from 'lucide-react';
import { useChatEngine, ChatMessage } from './useChatEngine';
import { useIntentExecutor } from './useIntentExecutor';
import { useSpeechToText } from './useSpeechToText';
import { VIDEO_TEMPLATES, VideoTemplate, parseVideoFlowRequest, VideoFlowConfig } from './videoTemplateFlow';
import { executeVideoFlow } from './videoFlowExecutor';

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
    // const [isOpen, setIsOpen] = useState(false); // Removed local state
    const [inputValue, setInputValue] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [inputLineCount, setInputLineCount] = useState(1);
    const [showTemplates, setShowTemplates] = useState(false);
    const [videoFlowConfig, setVideoFlowConfig] = useState<VideoFlowConfig | null>(null);
    const chatEngine = useChatEngine({ canvasState, canvasSelection });
    const executor = useIntentExecutor({
        canvasState,
        canvasSelection,
        props,
        viewportSize,
        position,
        scale,
    });

    const selectedReferences = React.useMemo(() => {
        const refs: { id: string, url: string }[] = [];
        const ids = new Set(canvasSelection?.selectedIds || []);
        if (ids.size === 0) return refs;

        const lookupArrays = [
            canvasState?.images,
            canvasState?.imageGenerators,
            canvasState?.imageModalStates,
            canvasState?.videoGenerators,
            canvasState?.videoModalStates
        ];

        lookupArrays.forEach(arr => {
            if (Array.isArray(arr)) {
                arr.forEach((item: any) => {
                    if (ids.has(item.id)) {
                        // ONLY show generated images/videos, NEVER show reference/source images
                        // For images: generatedImageUrl > generatedImageUrls[0] > url
                        // For videos: generatedVideoUrl > previewUrl > url
                        // NEVER use sourceImageUrl or sourceImageUrlPreview
                        
                        let urlToUse: string | null = null;
                        
                        // Check if this is a video modal (has generatedVideoUrl)
                        const isVideo = item.generatedVideoUrl !== undefined;
                        
                        if (isVideo) {
                            // For videos: prioritize generated video URL
                            if (item.generatedVideoUrl && typeof item.generatedVideoUrl === 'string') {
                                urlToUse = item.generatedVideoUrl;
                            }
                            // Fallback to preview URL for videos
                            else if (item.previewUrl && typeof item.previewUrl === 'string') {
                                urlToUse = item.previewUrl;
                            }
                            // Last resort: regular URL (but not if it's a reference)
                            else if (item.url && typeof item.url === 'string') {
                                if (item.url !== item.sourceImageUrl && item.url !== item.sourceImageUrlPreview) {
                                    urlToUse = item.url;
                                }
                            }
                        } else {
                            // For images: First priority - generated image URL
                            if (item.generatedImageUrl && typeof item.generatedImageUrl === 'string') {
                                urlToUse = item.generatedImageUrl;
                            } 
                            // Second priority: generated image URLs array
                            else if (item.generatedImageUrls && Array.isArray(item.generatedImageUrls) && item.generatedImageUrls.length > 0) {
                                urlToUse = item.generatedImageUrls[0];
                            }
                            // Third priority: regular image URL (for canvas images that aren't modals)
                            else if (item.url && typeof item.url === 'string') {
                                // Only use if it's not a reference image
                                if (item.url !== item.sourceImageUrl && item.url !== item.sourceImageUrlPreview) {
                                    urlToUse = item.url;
                                }
                            }
                        }
                        
                        // Only add if we have a valid URL and it's definitely NOT a reference image
                        if (urlToUse && 
                            typeof urlToUse === 'string' &&
                            !urlToUse.includes('reference-stitched') &&
                            urlToUse !== item.sourceImageUrl &&
                            urlToUse !== item.sourceImageUrlPreview &&
                            // Additional check: if the item has sourceImageUrl but no generated image/video, skip it
                            !(item.sourceImageUrl && !item.generatedImageUrl && !item.generatedImageUrls && !item.generatedVideoUrl)) {
                            refs.push({ id: item.id, url: urlToUse });
                        }
                    }
                });
            }
        });
        return refs;
    }, [canvasSelection?.selectedIds, canvasState]);

    const { isListening, toggleListening, isSupported } = useSpeechToText({
        onTranscriptChange: (text) => setInputValue(text),
        continuous: false,
        interimResults: true
    });

    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatEngine.messages]);

    // Auto-resize textarea up to 4 lines and calculate line count
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 96; // 4 lines at 24px line height
            textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
            
            // Calculate number of lines (line height is 24px)
            const lineCount = Math.ceil(scrollHeight / 24);
            setInputLineCount(lineCount);
        }
    }, [inputValue]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        
        // Check if this is a video > 12 seconds request FIRST (before chat engine)
        console.log('[ChatPanel] Checking for video flow request:', inputValue);
        const flowConfig = parseVideoFlowRequest(inputValue);
        if (flowConfig) {
            console.log('[ChatPanel] Video flow detected! Duration:', flowConfig.totalDuration, 'Topic:', flowConfig.topic);
            // Show template selection
            setVideoFlowConfig(flowConfig);
            setShowTemplates(true);
            // Don't send to chat engine yet, wait for template selection
            // Clear input but don't send to chat
            setInputValue('');
            return;
        }
        
        console.log('[ChatPanel] Not a video flow request, sending to chat engine');
        // Normal chat flow
        chatEngine.sendMessage(inputValue);
        setInputValue('');
    };
    
    const handleTemplateSelect = async (template: VideoTemplate) => {
        if (!videoFlowConfig) return;
        
        setShowTemplates(false);
        
        // Show processing message
        const processingMsg = `Creating ${videoFlowConfig.totalDuration} second video using "${template.name}" template. Generating script and dividing into scenes...`;
        chatEngine.sendMessage(processingMsg);
        
        // Execute the flow
        try {
            console.log('[ChatPanel] Executing video flow with template:', template.id, 'Template name:', template.name);
            console.log('[ChatPanel] Video flow config:', videoFlowConfig);
            await executeVideoFlow(videoFlowConfig, template.id, {
                canvasState,
                props,
                viewportSize,
                position,
                scale,
            });
            console.log('[ChatPanel] Video flow execution completed');
            
            // Send confirmation message with details
            const frameCount = Math.ceil(videoFlowConfig.totalDuration / 8);
            const isFirstLastFlow = template.id === 'first-last-frame';
            const imageCount = isFirstLastFlow ? frameCount * 2 : frameCount;
            const confirmationMsg = isFirstLastFlow
                ? `✅ Video flow created successfully!\n\n📝 Script generated and divided into ${frameCount} scenes\n🎬 ${imageCount} image generation frames created (2 per scene: first & last frame)\n🎥 ${frameCount} video generation nodes created\n🔗 All frames connected automatically\n\nYou can now generate images and videos. Each video will use first frame and last frame.`
                : `✅ Video flow created successfully!\n\n📝 Script generated and divided into ${frameCount} scenes\n🎬 ${imageCount} image generation frames created\n🎥 ${frameCount} video generation nodes created\n🔗 All frames connected automatically\n\nYou can now generate images and videos for each scene.`;
            chatEngine.sendMessage(confirmationMsg);
        } catch (error) {
            console.error('[ChatPanel] Error executing video flow:', error);
            chatEngine.sendMessage('❌ Failed to create video flow. Please try again.');
        }
        
        setVideoFlowConfig(null);
        setInputValue('');
    };

    const handleExecute = (message: ChatMessage) => {
        if (message.action) {
            executor.executeIntent(message.action);
        }
    };

    const panelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;
        // Stop wheel events from bubbling to the canvas container
        const stopPropagation = (e: WheelEvent) => {
            e.stopPropagation();
        };
        // Use capture phase or just typical bubbling? 
        // Bubbling from panel -> container. Panel listener fires first.
        panel.addEventListener('wheel', stopPropagation, { passive: false });
        // Also stop pointer events if needed? Canvas usually uses pointer/mouse events.
        // But the user specifically mentioned scrolling (wheel).
        // Let's also stop mousedown propagation to prevent canvas selection/deselection when clicking chat
        const stopPointerPropagation = (e: PointerEvent | MouseEvent) => {
            e.stopPropagation();
        };
        panel.addEventListener('pointerdown', stopPointerPropagation);
        panel.addEventListener('mousedown', stopPointerPropagation);

        return () => {
            panel.removeEventListener('wheel', stopPropagation);
            panel.removeEventListener('pointerdown', stopPointerPropagation);
            panel.removeEventListener('mousedown', stopPointerPropagation);
        };
    }, []);

    return (
        <div
            ref={panelRef}
            className="fixed inset-0 z-[10000] pointer-events-none"
        >
            {/* Chat Window - Full Height Right Sidebar */}
            {isOpen && (
                <div
                    className="absolute top-0 right-0 h-full w-[400px] flex flex-col transition-all duration-300 transform origin-right animate-in slide-in-from-right pointer-events-auto border-l border-white/10"
                    style={{
                        background: '#121212', // Solid dark background matching theme
                    }}
                >

                    {/* Side Toggle / Close Handle - Outside & Facing Right */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-5 h-10 bg-[#0A101A]/80 backdrop-blur-md border border-white/10 border-r-0 rounded-l-md flex items-center justify-center hover:bg-blue-500/20 text-white/40 hover:text-white transition-all z-[10002] shadow-[-5px_0_15px_-5px_rgba(0,0,0,0.3)]"
                        title="Close Panel"
                    >
                        <ChevronRight size={14} />
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
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Area - Inner container controls overflow */}
                    <div className="flex-1 relative overflow-hidden group/list z-10">
                        {/* subtle top fade */}
                        <div
                            className="absolute top-0 left-0 right-0 h-12 z-10 pointer-events-none"
                            style={{
                                background: 'linear-gradient(to bottom, rgba(10,20,40,0) 0%, transparent 100%)'
                            }}
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
                            className="h-full overflow-y-auto p-4 pt-2 space-y-4 custom-scrollbar"
                        >
                            {showTemplates && videoFlowConfig ? (
                                <div className="h-full flex flex-col items-center justify-center p-6 space-y-6">
                                    <div className="text-center space-y-2">
                                        <h3 className="text-white/90 text-sm font-medium">
                                            Select a Template for {videoFlowConfig.totalDuration}s Video
                                        </h3>
                                        <p className="text-white/50 text-xs">
                                            Topic: {videoFlowConfig.topic}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 w-full max-w-md">
                                        {VIDEO_TEMPLATES.map((template) => (
                                            <button
                                                key={template.id}
                                                onClick={() => handleTemplateSelect(template)}
                                                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-left group"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                                                        {template.id === 'sequential-frames' ? (
                                                            <Video size={20} className="text-blue-400" />
                                                        ) : (
                                                            <Film size={20} className="text-blue-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-white/90 text-sm font-medium mb-1">
                                                            {template.name}
                                                        </h4>
                                                        <p className="text-white/50 text-xs leading-relaxed">
                                                            {template.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowTemplates(false);
                                            setVideoFlowConfig(null);
                                        }}
                                        className="text-white/40 hover:text-white/60 text-xs transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : chatEngine.messages.length === 0 ? (
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
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[90%] px-4 py-3 rounded-2xl text-[13px] font-light leading-relaxed tracking-wide shadow-sm backdrop-blur-md ${msg.role === 'user'
                                                ? 'bg-blue-600/20 text-blue-50 border border-blue-500/30 rounded-tr-sm'
                                                : 'bg-white/5 text-white/80 border border-white/10 rounded-tl-sm'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>

                                        {/* Action Verification Segment */}
                                        {msg.role === 'assistant' && msg.action && (
                                            <div className="mt-2 w-full max-w-[95%] p-4 rounded-xl bg-blue-950/30 border border-blue-500/10 space-y-4 backdrop-blur-sm">
                                                <div className="flex items-center gap-2 text-[9px] font-medium text-blue-300/40 uppercase tracking-[0.2em]">
                                                    <Zap size={10} />
                                                    <span>Action Plan</span>
                                                </div>

                                                {msg.action.intent === 'EXECUTE_PLAN' && (
                                                    <div className="space-y-2">
                                                        <div className="text-[11px] text-white/70 font-medium mb-2">Summary:</div>
                                                        <div className="text-[11px] text-white/80 font-light leading-relaxed pl-3 border-l-2 border-blue-500/40 space-y-1.5">
                                                            {msg.action.payload.summary.split('\n').map((line: string, idx: number) => (
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
                    <div className="p-4 pt-2 z-20">
                        {/* Selected references are hidden from UI but still available for chat functionality */}
                        {/* {selectedReferences.length > 0 && (
                            <div className="flex items-center gap-2 mb-3 px-1 overflow-x-auto custom-scrollbar pb-2">
                                {selectedReferences.map((ref) => (
                                    <div key={ref.id} className="relative group/ref shrink-0 animate-in fade-in zoom-in duration-300">
                                        <div className="w-10 h-10 rounded-lg border border-blue-500/20 overflow-hidden bg-blue-900/20">
                                            <img src={ref.url} alt="Ref" className="w-full h-full object-cover opacity-70 group-hover/ref:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                                            <Check size={6} className="text-blue-950 font-bold" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )} */}
                        <div className="relative group">
                            <textarea
                                ref={textareaRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder={isListening ? "Listening..." : "Type a command..."}
                                rows={1}
                                style={{
                                    minHeight: '40px',
                                    maxHeight: '96px', // ~4 lines at 24px line height
                                    lineHeight: '24px',
                                    resize: 'none',
                                    overflowY: 'auto',
                                }}
                                className={`w-full bg-blue-950/40 border ${
                                    isListening 
                                        ? 'border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                                        : 'border-white/10'
                                } ${inputLineCount >= 2 ? 'rounded-2xl' : 'rounded-full'} py-2.5 pl-4 pr-24 text-[13px] text-white placeholder-blue-200/20 outline-none transition-all focus:bg-blue-950/60 focus:border-white/10 custom-scrollbar`}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                {isSupported && (
                                    <button
                                        onClick={toggleListening}
                                        className={`p-2 rounded-lg transition-all ${isListening
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                            : 'text-blue-200/20 hover:text-blue-200/60 hover:bg-blue-500/10'
                                            }`}
                                    >
                                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                                    </button>
                                )}
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isListening}
                                    className={`p-2 rounded-lg text-white shadow-lg hover:scale-105 transition-all duration-300 ${
                                        !inputValue.trim() || isListening
                                            ? 'bg-blue-500/30 cursor-not-allowed'
                                            : 'bg-blue-500 hover:bg-blue-400 shadow-blue-500/20'
                                    }`}
                                >
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button (Visible when closed) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto fixed bottom-6 right-6 group flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-blue-200/80 hover:text-white border border-white/10 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 z-[10001]"
                >
                    <Sparkles size={24} className="group-hover:rotate-12 transition-transform duration-500" />
                    <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                </button>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.05);
                  border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
};
