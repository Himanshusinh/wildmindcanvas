'use client';
import React, { useState, useEffect, useRef } from 'react';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { GenerateArrowIcon } from '@/modules/ui-global/common/GenerateArrowIcon';

interface MusicCategoryProps {
    scale: number;
    isDark: boolean;
    controlFontSize: string;
    inputFontSize: string;
    dropdownBorderColor: string;
    iconColor: string;
    selectedModel: string;
    onModelChange: (model: string) => void;
    prompt: string;
    onPromptChange: (val: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    lyricsPrompt: string;
    onLyricsPromptChange: (val: string) => void;
    models: string[];
    modelDropdownRef: React.RefObject<HTMLDivElement | null>;
    isModelDropdownOpen: boolean;
    onSetIsModelDropdownOpen: (open: boolean) => void;
    isPromptDisabled?: boolean;
    isLyricsDisabled?: boolean;
}

export const MusicCategoryView: React.FC<MusicCategoryProps> = ({
    scale,
    isDark,
    controlFontSize,
    inputFontSize,
    dropdownBorderColor,
    iconColor,
    selectedModel,
    onModelChange,
    prompt,
    onPromptChange,
    onGenerate,
    isGenerating,
    lyricsPrompt,
    onLyricsPromptChange,
    models,
    modelDropdownRef,
    isModelDropdownOpen,
    onSetIsModelDropdownOpen,
    isPromptDisabled = false,
    isLyricsDisabled = false,
}) => {
    const [showPromptTip, setShowPromptTip] = useState(false);
    const [showLyricsTip, setShowLyricsTip] = useState(false);

    const promptInfoRef = useRef<HTMLDivElement>(null);
    const promptInfoBtnRef = useRef<HTMLButtonElement>(null);
    const lyricsInfoRef = useRef<HTMLDivElement>(null);
    const lyricsInfoBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (promptInfoRef.current && !promptInfoRef.current.contains(event.target as Node) && !promptInfoBtnRef.current?.contains(event.target as Node)) {
                setShowPromptTip(false);
            }
            if (lyricsInfoRef.current && !lyricsInfoRef.current.contains(event.target as Node) && !lyricsInfoBtnRef.current?.contains(event.target as Node)) {
                setShowLyricsTip(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const disabledInputBg = isDark ? '#1a1a1a' : '#f3f4f6';
    const disabledText = isDark ? '#666666' : '#6b7280';
    const enabledInputBg = '#000000';
    const enabledText = '#ffffff';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${16 * scale}px`, width: '100%', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: `${12 * scale}px`, alignItems: 'center', width: '100%' }}>
                <div ref={modelDropdownRef} style={{ position: 'relative', width: 'fit-content', zIndex: 3004 }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSetIsModelDropdownOpen(!isModelDropdownOpen); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: `${8 * scale}px`,
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            color: isDark ? '#ffffff' : '#000000',
                            padding: `${8 * scale}px ${16 * scale}px`,
                            borderRadius: `${8 * scale}px`,
                            border: `1px solid ${dropdownBorderColor}`,
                            fontSize: controlFontSize,
                            fontWeight: '600',
                            cursor: 'pointer',
                        }}
                    >
                        <span>{selectedModel}</span>
                        <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ transform: isModelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    {isModelDropdownOpen && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: `${4 * scale}px`, backgroundColor: '#000000', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: `${12 * scale}px`, zIndex: 10, minWidth: `${180 * scale}px` }}>
                            {models.map(m => (
                                <div key={m} onClick={() => { onModelChange(m); onSetIsModelDropdownOpen(false); }} style={{ padding: `${10 * scale}px ${16 * scale}px`, cursor: 'pointer', color: '#ffffff', fontSize: controlFontSize, backgroundColor: selectedModel === m ? '#333' : 'transparent', whiteSpace: 'nowrap' }}>{m}</div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={onGenerate}
                    disabled={(isGenerating || !prompt.trim())}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: `${40 * scale}px`,
                        height: `${40 * scale}px`,
                        padding: 0,
                        backgroundColor: SELECTION_COLOR,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: `${10 * scale}px`,
                        cursor: (isGenerating || !prompt.trim()) ? 'not-allowed' : 'pointer',
                        opacity: (isGenerating || !prompt.trim()) ? 0.7 : 1,
                        boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`,
                        transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                        if (!isGenerating && prompt.trim()) {
                            e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(76, 131, 255, 0.5)`;
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isGenerating && prompt.trim()) {
                            e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`;
                        }
                    }}
                >
                    {isGenerating ? (
                        <div className="animate-spin" style={{ width: `${16 * scale}px`, height: `${16 * scale}px`, border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    ) : (
                        <GenerateArrowIcon scale={scale * 1.1} />
                    )}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: `${12 * scale}px` }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${6 * scale}px` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px` }}>
                        <div style={{ fontSize: `${13 * scale}px`, fontWeight: '600', color: isDark ? '#eee' : '#333' }}>Prompt</div>
                        <div style={{ position: 'relative' }}>
                            <button
                                ref={promptInfoBtnRef}
                                onClick={() => setShowPromptTip(!showPromptTip)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isDark ? '#888' : '#666', display: 'flex', alignItems: 'center' }}
                            >
                                <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            </button>
                            {showPromptTip && (
                                <div ref={promptInfoRef} style={{ position: 'absolute', top: '100%', left: 0, marginTop: `${8 * scale}px`, width: `${240 * scale}px`, backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: `${8 * scale}px`, padding: `${12 * scale}px`, zIndex: 3005, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                    <div style={{ fontSize: `${12 * scale}px`, color: '#bbb', lineHeight: 1.5 }}>
                                        <div style={{ color: '#fff', fontWeight: '600', marginBottom: `${4 * scale}px` }}>COMPOSITION TIPS</div>
                                        Specify genre (pop, lo-fi), mood (happy, dark), pace, and instruments to fit your scene.
                                        <div style={{ marginTop: `${8 * scale}px`, color: SELECTION_COLOR, fontWeight: '500' }}>80 credits per track</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        placeholder={isPromptDisabled ? 'Controlled by input node' : "Describe your music..."}
                        disabled={isPromptDisabled}
                        style={{
                            width: '100%',
                            height: `${36 * scale}px`,
                            backgroundColor: isPromptDisabled ? disabledInputBg : enabledInputBg,
                            border: `1px solid rgba(255, 255, 255, 0.1)`,
                            borderRadius: `${8 * scale}px`,
                            padding: `0 ${12 * scale}px`,
                            fontSize: controlFontSize,
                            color: isPromptDisabled ? disabledText : enabledText,
                            outline: 'none',
                            cursor: isPromptDisabled ? 'not-allowed' : 'text'
                        }}
                        onFocus={(e) => { if (!isPromptDisabled) e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)'; }}
                        onBlur={(e) => { if (!isPromptDisabled) e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'; }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: `${6 * scale}px` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px` }}>
                        <div style={{ fontSize: `${13 * scale}px`, fontWeight: '600', color: isDark ? '#eee' : '#333' }}>Lyrics Prompt</div>
                        <div style={{ position: 'relative' }}>
                            <button
                                ref={lyricsInfoBtnRef}
                                onClick={() => setShowLyricsTip(!showLyricsTip)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isDark ? '#888' : '#666', display: 'flex', alignItems: 'center' }}
                            >
                                <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            </button>
                            {showLyricsTip && (
                                <div ref={lyricsInfoRef} style={{ position: 'absolute', top: '100%', left: 0, marginTop: `${8 * scale}px`, width: `${240 * scale}px`, backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: `${8 * scale}px`, padding: `${12 * scale}px`, zIndex: 3005, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                    <div style={{ fontSize: `${12 * scale}px`, color: '#bbb', lineHeight: 1.5 }}>
                                        <div style={{ color: '#fff', fontWeight: '600', marginBottom: `${4 * scale}px` }}>STRUCTURE TAGS</div>
                                        Use tags like <span style={{ color: '#fff' }}>[Intro]</span>, <span style={{ color: '#fff' }}>[Verse]</span>, or <span style={{ color: '#fff' }}>[Chorus]</span> to arrange your song. Use \n for line breaks.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <textarea
                        value={lyricsPrompt}
                        onChange={(e) => onLyricsPromptChange(e.target.value)}
                        placeholder={isLyricsDisabled ? 'Controlled by input node' : "Enter lyrics"}
                        disabled={isLyricsDisabled}
                        style={{
                            width: '100%',
                            height: `${60 * scale}px`,
                            backgroundColor: isLyricsDisabled ? disabledInputBg : enabledInputBg,
                            border: `1px solid rgba(255, 255, 255, 0.1)`,
                            borderRadius: `${8 * scale}px`,
                            padding: `${8 * scale}px ${12 * scale}px`,
                            fontSize: controlFontSize,
                            color: isLyricsDisabled ? disabledText : enabledText,
                            outline: 'none',
                            resize: 'none',
                            cursor: isLyricsDisabled ? 'not-allowed' : 'text'
                        }}
                        onFocus={(e) => { if (!isLyricsDisabled) e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)'; }}
                        onBlur={(e) => { if (!isLyricsDisabled) e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'; }}
                    />
                </div>
            </div>
        </div>
    );
};
