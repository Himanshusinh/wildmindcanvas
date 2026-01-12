'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, MessageSquare, ChevronDown, Check, Trash2, Zap } from 'lucide-react';
import { useChatEngine, ChatMessage } from './useChatEngine';
import { useIntentExecutor } from './useIntentExecutor';

interface ChatPanelProps {
    canvasState: any;
    canvasSelection: any;
    props: any;
    viewportSize: { width: number; height: number };
    position: { x: number; y: number };
    scale: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    canvasState,
    canvasSelection,
    props,
    viewportSize,
    position,
    scale,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const chatEngine = useChatEngine({ canvasState, canvasSelection });
    const executor = useIntentExecutor({
        canvasState,
        canvasSelection,
        props,
        viewportSize,
        position,
        scale,
    });

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatEngine.messages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        chatEngine.sendMessage(inputValue);
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
            className="fixed bottom-6 right-6 z-[10000] flex flex-col items-end"
        >
            {/* Chat Window */}
            {isOpen && (
                <div
                    className="mb-4 w-96 h-[500px] flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right scale-100 opacity-100"
                    style={{
                        background: 'transparent',
                    }}
                >
                    {/* Messages Area with Content-Aware Fade */}
                    <div className="flex-1 relative overflow-hidden group/list">
                        {/* More subtle top fade for floating UI */}
                        <div
                            className="absolute top-0 left-0 right-0 h-20 z-10 pointer-events-none"
                            style={{
                                background: 'linear-gradient(to bottom, transparent 0%, transparent 100%)'
                            }}
                        />

                        <div
                            ref={scrollRef}
                            className="h-full overflow-y-auto p-4 pt-4 space-y-4 custom-scrollbar"
                            style={{
                                maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 100%)'
                            }}
                        >
                            {chatEngine.messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/5 border border-white/5">
                                        <MessageSquare size={24} />
                                    </div>
                                    <p className="text-white/10 text-[10px] font-light tracking-[0.3em] uppercase">
                                        System Ready
                                    </p>
                                </div>
                            ) : (
                                chatEngine.messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[12px] font-light leading-relaxed tracking-wide transition-all ${msg.role === 'user'
                                                ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30 rounded-tr-none backdrop-blur-sm'
                                                : 'bg-white/5 text-white/60 border border-white/10 rounded-tl-none shadow-sm backdrop-blur-md'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>

                                        {/* Action Verification Segment */}
                                        {msg.role === 'assistant' && msg.action && (
                                            <div className="mt-3 w-full max-w-[90%] p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 backdrop-blur-sm">
                                                <div className="flex items-center gap-2 text-[9px] font-medium text-white/20 uppercase tracking-[0.3em]">
                                                    <span>Automation Plan</span>
                                                </div>

                                                <button
                                                    onClick={() => handleExecute(msg)}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300/80 border border-blue-500/20 transition-all font-medium text-[11px] uppercase tracking-widest"
                                                >
                                                    <Zap size={13} className="opacity-50" />
                                                    Generate
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                            {chatEngine.isProcessing && (
                                <div className="flex items-center gap-1.5 text-blue-400/20 ml-2">
                                    <div className="w-1 h-1 rounded-full bg-current animate-pulse" />
                                    <div className="w-1 h-1 rounded-full bg-current animate-pulse [animation-delay:0.2s]" />
                                    <div className="w-1 h-1 rounded-full bg-current animate-pulse [animation-delay:0.4s]" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Input Field - Fully Transparent */}
                    <div className="p-4 bg-transparent mt-auto">
                        <div className="relative group">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Enter system command..."
                                className="w-full bg-white/5 border border-white/10 focus:border-blue-500/30 rounded-2xl py-3.5 pl-4 pr-12 text-[12px] text-white placeholder-white/10 outline-none transition-all focus:shadow-[0_0_20px_-5px_rgba(59,130,246,0.1)]"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-transparent hover:bg-white/5 text-white/10 hover:text-blue-400 disabled:opacity-0 transition-all"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Terminal Access Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative flex items-center justify-center w-11 h-11 rounded-xl shadow-2xl transition-all duration-700 ${isOpen
                    ? 'rotate-90 bg-white/10 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 backdrop-blur-xl'
                    }`}
            >
                {isOpen ? (
                    <X size={20} />
                ) : (
                    <>
                        <Sparkles size={20} className="transition-transform group-hover:scale-110 duration-500 text-blue-400/80" />
                        <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping opacity-50" />
                        <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    </>
                )}
            </button>

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
