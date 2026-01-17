'use client';
import React, { useRef, useState, useEffect } from 'react';
import { Slider } from './common/Slider';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { GenerateArrowIcon } from '@/modules/ui-global/common/GenerateArrowIcon';

interface VoiceCategoryProps {
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
    voiceId?: string;
    onVoiceIdChange?: (val: string) => void;
    stability?: number;
    onStabilityChange?: (val: number) => void;
    similarityBoost?: number;
    onSimilarityBoostChange?: (val: number) => void;
    style?: number;
    onStyleChange?: (val: number) => void;
    speed?: number;
    onSpeedChange?: (val: number) => void;
    exaggeration?: number;
    onExaggerationChange?: (val: number) => void;
    temperature?: number;
    onTemperatureChange?: (val: number) => void;
    cfgScale?: number;
    onCfgScaleChange?: (val: number) => void;
    voicePrompt?: string;
    onVoicePromptChange?: (val: string) => void;
    topP?: number;
    onTopPChange?: (val: number) => void;
    maxTokens?: number;
    onMaxTokensChange?: (val: number) => void;
    repetitionPenalty?: number;
    onRepetitionPenaltyChange?: (val: number) => void;
    models: string[];
    modelDropdownRef: React.RefObject<HTMLDivElement | null>;
    isModelDropdownOpen: boolean;
    onSetIsModelDropdownOpen: (open: boolean) => void;
    filename: string;
    onFilenameChange: (val: string) => void;
    isPromptDisabled?: boolean;
}

export const VoiceCategoryView: React.FC<VoiceCategoryProps> = ({
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
    voiceId,
    onVoiceIdChange,
    stability,
    onStabilityChange,
    similarityBoost,
    onSimilarityBoostChange,
    style,
    onStyleChange,
    speed,
    onSpeedChange,
    exaggeration,
    onExaggerationChange,
    temperature,
    onTemperatureChange,
    cfgScale,
    onCfgScaleChange,
    voicePrompt,
    onVoicePromptChange,
    topP,
    onTopPChange,
    maxTokens,
    onMaxTokensChange,
    repetitionPenalty,
    onRepetitionPenaltyChange,
    models,
    modelDropdownRef,
    isModelDropdownOpen,
    onSetIsModelDropdownOpen,
    filename,
    onFilenameChange,
    isPromptDisabled = false,
}) => {
    const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
    const [showLanguageTip, setShowLanguageTip] = useState(false);
    const [showVoiceLibraryTip, setShowVoiceLibraryTip] = useState(false);
    const [showExaggerationTip, setShowExaggerationTip] = useState(false);
    const [showTemperatureTip, setShowTemperatureTip] = useState(false);
    const [showCfgScaleTip, setShowCfgScaleTip] = useState(false);
    const [showCreditsInfo, setShowCreditsInfo] = useState(false);
    const [showEmotionInfo, setShowEmotionInfo] = useState(false);

    const voiceDropdownRef = useRef<HTMLDivElement>(null);
    const languageInfoBtnRef = useRef<HTMLButtonElement>(null);
    const languageInfoRef = useRef<HTMLDivElement>(null);
    const voiceLibInfoBtnRef = useRef<HTMLButtonElement>(null);
    const voiceLibInfoRef = useRef<HTMLDivElement>(null);
    const exaggerationInfoRef = useRef<HTMLDivElement>(null);
    const temperatureInfoRef = useRef<HTMLDivElement>(null);
    const cfgScaleInfoRef = useRef<HTMLDivElement>(null);

    const isChatterbox = selectedModel === 'Chatterbox Multilingual';
    const isMaya = selectedModel === 'Maya TTS';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(event.target as Node)) {
                setIsVoiceDropdownOpen(false);
            }
            if (languageInfoRef.current && !languageInfoRef.current.contains(event.target as Node) && !languageInfoBtnRef.current?.contains(event.target as Node)) {
                setShowLanguageTip(false);
            }
            if (voiceLibInfoRef.current && !voiceLibInfoRef.current.contains(event.target as Node) && !voiceLibInfoBtnRef.current?.contains(event.target as Node)) {
                setShowVoiceLibraryTip(false);
            }
            if (exaggerationInfoRef.current && !exaggerationInfoRef.current.contains(event.target as Node)) {
                setShowExaggerationTip(false);
            }
            if (temperatureInfoRef.current && !temperatureInfoRef.current.contains(event.target as Node)) {
                setShowTemperatureTip(false);
            }
            if (cfgScaleInfoRef.current && !cfgScaleInfoRef.current.contains(event.target as Node)) {
                setShowCfgScaleTip(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const voices = ['Aria', 'Roger', 'Sarah', 'Charlie', 'George', 'Callum', 'Liam', 'Charlotte', 'Alice', 'Matilda', 'Will', 'James', 'Jessie'];
    const chatterboxLanguages = ['english', 'arabic', 'danish', 'german', 'greek', 'spanish', 'finnish', 'french', 'hebrew', 'hindi', 'italian', 'japanese', 'korean', 'malay', 'dutch', 'norwegian', 'polish', 'portuguese', 'russian', 'swedish', 'swahili', 'turkish', 'chinese'];
    const dropdownItems = isChatterbox ? chatterboxLanguages : voices;
    const displayVoiceId = isChatterbox ? (voiceId ? (voiceId.charAt(0).toUpperCase() + voiceId.slice(1)) : 'Select language...') : (voiceId || 'Aria');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${16 * scale}px`, width: '100%', height: '100%', overflowY: 'auto', paddingRight: `${4 * scale}px` }}>
            {/* Top Row: Model selection, Voice selection, and Generate button */}
            <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', width: '100%' }}>
                <div ref={modelDropdownRef} style={{ position: 'relative', width: '45%', zIndex: 3004 }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSetIsModelDropdownOpen(!isModelDropdownOpen); }}
                        style={{
                            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            color: isDark ? '#ffffff' : '#000000', padding: `${8 * scale}px ${12 * scale}px`,
                            borderRadius: `${8 * scale}px`, border: `1px solid ${dropdownBorderColor}`,
                            fontSize: `${13 * scale}px`, fontWeight: '500', cursor: 'pointer'
                        }}
                    >
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedModel}</span>
                        <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transform: isModelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    {isModelDropdownOpen && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: `${4 * scale}px`, backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.2)', borderRadius: `${8 * scale}px`, zIndex: 10 }}>
                            {models.map(m => (
                                <div key={m} onClick={() => { onModelChange(m); onSetIsModelDropdownOpen(false); }} style={{ padding: `${10 * scale}px ${12 * scale}px`, cursor: 'pointer', fontSize: controlFontSize, color: '#ffffff', backgroundColor: selectedModel === m ? '#333' : 'transparent' }}>{m}</div>
                            ))}
                        </div>
                    )}
                </div>

                {!isMaya && (
                    <div ref={voiceDropdownRef} style={{ position: 'relative', width: '45%', zIndex: 3003 }}>
                        <button
                            onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                            style={{
                                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                backgroundColor: 'transparent', color: isDark ? '#ffffff' : '#000000',
                                padding: `${8 * scale}px ${12 * scale}px`, borderRadius: `${8 * scale}px`,
                                border: `1px solid ${dropdownBorderColor}`, fontSize: `${13 * scale}px`, fontWeight: '500', cursor: 'pointer'
                            }}
                        >
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayVoiceId}</span>
                            <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transform: isVoiceDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {isVoiceDropdownOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: `${4 * scale}px`, backgroundColor: '#000000', border: '1px solid rgba(255,255,255,0.2)', borderRadius: `${8 * scale}px`, zIndex: 10, maxHeight: `${200 * scale}px`, overflowY: 'auto' }}>
                                {dropdownItems.map(v => (
                                    <div key={v} onClick={() => { onVoiceIdChange?.(v); setIsVoiceDropdownOpen(false); }} style={{ padding: `${10 * scale}px ${12 * scale}px`, cursor: 'pointer', fontSize: controlFontSize, backgroundColor: voiceId === v ? '#333' : 'transparent', color: '#ffffff' }}>
                                        {isChatterbox ? v.charAt(0).toUpperCase() + v.slice(1) : v}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={onGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: `${40 * scale}px`,
                        height: `${40 * scale}px`,
                        backgroundColor: SELECTION_COLOR,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: `${10 * scale}px`,
                        cursor: (isGenerating || !prompt.trim()) ? 'not-allowed' : 'pointer',
                        opacity: (isGenerating || !prompt.trim()) ? 0.7 : 1,
                        marginLeft: 'auto',
                        boxShadow: (isGenerating || !prompt.trim()) ? 'none' : `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`,
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
                <label style={{ fontSize: `${11 * scale}px`, color: isDark ? '#888' : '#666', fontWeight: '500' }}>File Name</label>
                <input
                    type="text"
                    value={filename}
                    onChange={(e) => onFilenameChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="Enter file name..."
                    style={{
                        width: '100%',
                        padding: `${10 * scale}px`,
                        backgroundColor: '#121212',
                        border: `1px solid rgba(255, 255, 255, 0.1)`,
                        borderRadius: `${8 * scale}px`,
                        color: '#ffffff',
                        fontSize: `${12 * scale}px`,
                        outline: 'none',
                        fontFamily: 'inherit'
                    }}
                />
            </div>

            {/* Main Text Area with info labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * scale}px` }}>
                {(isChatterbox || isMaya) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: `${11 * scale}px`, color: isDark ? '#888' : '#666', padding: `0 ${4 * scale}px` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px` }}>
                            <span>{isMaya ? 'Credits: 6 per second' : 'Pricing apply'}</span>
                            <div style={{ position: 'relative' }}>
                                <button
                                    onMouseEnter={() => setShowCreditsInfo(true)} onMouseLeave={() => setShowCreditsInfo(false)}
                                    style={{
                                        width: `${14 * scale}px`, height: `${14 * scale}px`, borderRadius: '50%',
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                        border: 'none', color: iconColor, cursor: 'pointer', fontSize: `${9 * scale}px`, padding: 0, fontWeight: 'bold'
                                    }}
                                >i</button>
                                {showCreditsInfo && (
                                    <div style={{
                                        position: 'absolute', bottom: '100%', left: 0, marginBottom: `${8 * scale}px`,
                                        padding: `${8 * scale}px ${12 * scale}px`, backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: `${8 * scale}px`, color: '#fff', fontSize: `${11 * scale}px`, width: `${200 * scale}px`, zIndex: 10
                                    }}>
                                        {isMaya ? 'Maya TTS costs 6 credits per second of generated audio.' : 'Chatterbox pricing is based on model usage.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <textarea
                    value={prompt}
                    onChange={(e) => onPromptChange(e.target.value)}
                    placeholder={isPromptDisabled ? 'Controlled by input node' : (isMaya ? "Enter the text you want to convert to speech..." : "Enter text to convert to speech...")}
                    disabled={isPromptDisabled}
                    style={{
                        width: '100%', height: `${80 * scale}px`,
                        backgroundColor: isPromptDisabled ? (isDark ? '#1a1a1a' : '#f3f4f6') : '#121212',
                        border: `1px solid rgba(255, 255, 255, 0.1)`, borderRadius: `${8 * scale}px`,
                        padding: `${10 * scale}px`, fontSize: controlFontSize,
                        color: isPromptDisabled ? (isDark ? '#666666' : '#6b7280') : '#ffffff',
                        outline: 'none', resize: 'none', fontFamily: 'inherit',
                        cursor: isPromptDisabled ? 'not-allowed' : 'text'
                    }}
                />
                {(isChatterbox || isMaya) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: `${11 * scale}px`, color: isDark ? '#666' : '#999', padding: `0 ${4 * scale}px` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: `${4 * scale}px` }}>
                            <span>{isMaya ? 'Emotion tags supported' : 'Model Info'}</span>
                            <div style={{ position: 'relative' }}>
                                <button
                                    onMouseEnter={() => isMaya ? setShowEmotionInfo(true) : setShowLanguageTip(true)}
                                    onMouseLeave={() => isMaya ? setShowEmotionInfo(false) : setShowLanguageTip(false)}
                                    style={{
                                        width: `${14 * scale}px`, height: `${14 * scale}px`, borderRadius: '50%',
                                        backgroundColor: 'transparent', border: 'none', color: iconColor, cursor: 'pointer', fontSize: `${9 * scale}px`, padding: 0, fontWeight: 'bold'
                                    }}
                                >i</button>
                                {isMaya && showEmotionInfo && (
                                    <div style={{
                                        position: 'absolute', bottom: '100%', left: 0, marginBottom: `${8 * scale}px`,
                                        padding: `${8 * scale}px ${12 * scale}px`, backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: `${8 * scale}px`, color: '#fff', fontSize: `${11 * scale}px`, width: `${280 * scale}px`, zIndex: 10
                                    }}>
                                        Available emotions: laugh, laugh_harder, sigh, chuckle, gasp, angry, excited, whisper, cry, scream, sing, snort, exhale, gulp, giggle, sarcastic, curious.
                                    </div>
                                )}
                                {isChatterbox && showLanguageTip && (
                                    <div style={{
                                        position: 'absolute', bottom: '100%', left: 0, marginBottom: `${8 * scale}px`,
                                        padding: `${8 * scale}px ${12 * scale}px`, backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: `${8 * scale}px`, color: '#fff', fontSize: `${11 * scale}px`, width: `${240 * scale}px`, zIndex: 10
                                    }}>
                                        Supports 23 languages including English, French, German, Spanish, Italian, Hindi, Arabic, Chinese, Japanese, Korean, and more.
                                    </div>
                                )}
                            </div>
                        </div>
                        <span>({prompt.length}/{isChatterbox ? 300 : 1000})</span>
                    </div>
                )}
            </div>

            {/* Voice Prompt (Maya only) or Output Language (Chatterbox) label area */}
            {isMaya ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * scale}px` }}>
                    <div style={{ fontSize: controlFontSize, fontWeight: '600', color: isDark ? '#e5e7eb' : '#374151' }}>Voice Prompt</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
                        <textarea
                            value={voicePrompt}
                            onChange={(e) => onVoicePromptChange?.(e.target.value)}
                            placeholder="Realistic male voice in the 30s age with american accent..."
                            style={{
                                width: '100%', height: `${60 * scale}px`, padding: `${10 * scale}px`,
                                backgroundColor: '#121212', border: `1px solid rgba(255, 255, 255, 0.1)`,
                                borderRadius: `${8 * scale}px`, color: '#ffffff', fontSize: `${12 * scale}px`,
                                resize: 'none', outline: 'none', fontFamily: 'inherit'
                            }}
                        />
                        <span style={{ fontSize: `${11 * scale}px`, color: isDark ? '#666' : '#999' }}>
                            Description of the voice/character. Includes attributes like age, accent, pitch, timbre, pacing, tone, and intensity.
                        </span>
                    </div>
                </div>
            ) : null}

            {/* Sliders Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${16 * scale}px` }}>
                {isMaya ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${16 * scale}px` }}>
                        <Slider
                            label="Temperature" value={temperature ?? 0.4} onChange={onTemperatureChange ?? (() => { })}
                            min={0} max={2} step={0.01} scale={scale} isDark={isDark}
                            tooltip="Controls randomness: Higher values make output more varied."
                            controlFontSize={controlFontSize} inputFontSize={inputFontSize}
                        />
                        <Slider
                            label="Top P" value={topP ?? 0.9} onChange={onTopPChange ?? (() => { })}
                            min={0} max={1} step={0.01} scale={scale} isDark={isDark}
                            tooltip="Nucleus sampling: Only considers tokens with top P total probability."
                            controlFontSize={controlFontSize} inputFontSize={inputFontSize}
                        />
                        <Slider
                            label="Max Tokens" value={maxTokens ?? 2000} onChange={onMaxTokensChange ?? (() => { })}
                            min={1} max={4000} step={1} scale={scale} isDark={isDark}
                            tooltip="Maximum token length of the generated audio."
                            controlFontSize={controlFontSize} inputFontSize={inputFontSize}
                        />
                        <Slider
                            label="Repetition Penalty" value={repetitionPenalty ?? 1.1} onChange={onRepetitionPenaltyChange ?? (() => { })}
                            min={1} max={2} step={0.01} scale={scale} isDark={isDark}
                            tooltip="Penalizes repetitive patterns."
                            controlFontSize={controlFontSize} inputFontSize={inputFontSize}
                        />
                    </div>
                ) : isChatterbox ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: `${16 * scale}px` }}>
                        <Slider
                            label="Exaggeration" value={exaggeration ?? 0.5} onChange={onExaggerationChange!}
                            min={0.0} max={2.0} step={0.01} scale={scale} isDark={isDark}
                            tooltip="Controls emotional emphasis."
                            controlFontSize={controlFontSize} inputFontSize={inputFontSize}
                        />
                        <Slider
                            label="Temperature" value={temperature ?? 0.8} onChange={onTemperatureChange!}
                            min={0.0} max={2.0} step={0.01} scale={scale} isDark={isDark}
                            tooltip="Higher values lead to more variety."
                            controlFontSize={controlFontSize} inputFontSize={inputFontSize}
                        />
                        <Slider
                            label="CFG Scale" value={cfgScale ?? 0.5} onChange={onCfgScaleChange!}
                            min={0.0} max={1.0} step={0.01} scale={scale} isDark={isDark}
                            tooltip="Classifier-Free Guidance."
                            controlFontSize={controlFontSize} inputFontSize={inputFontSize}
                        />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${16 * scale}px` }}>
                        {stability !== undefined && (
                            <Slider
                                label="Stability" value={stability} onChange={onStabilityChange!}
                                min={0} max={1} step={0.01} scale={scale} isDark={isDark}
                                controlFontSize={controlFontSize} inputFontSize={inputFontSize}
                            />
                        )}
                        {similarityBoost !== undefined && (
                            <Slider
                                label="Similarity Boost" value={similarityBoost} onChange={onSimilarityBoostChange!}
                                min={0} max={1} step={0.01} scale={scale} isDark={isDark}
                                controlFontSize={controlFontSize} inputFontSize={inputFontSize}
                            />
                        )}
                        {style !== undefined && (
                            <Slider
                                label="Style" value={style} onChange={onStyleChange!}
                                min={0} max={1} step={0.01} scale={scale} isDark={isDark}
                                controlFontSize={controlFontSize} inputFontSize={inputFontSize}
                            />
                        )}
                        {speed !== undefined && (
                            <Slider
                                label="Speed" value={speed} onChange={onSpeedChange!}
                                min={0} max={1.2} step={0.01} scale={scale} isDark={isDark}
                                controlFontSize={controlFontSize} inputFontSize={inputFontSize}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
