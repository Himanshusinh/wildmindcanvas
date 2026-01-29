'use client';
import React from 'react';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { GenerateArrowIcon } from '@/modules/ui-global/common/GenerateArrowIcon';

interface DefaultCategoryProps {
    scale: number;
    isDark: boolean;
    controlFontSize: string;
    inputFontSize: string;
    dropdownBorderColor: string;
    dropdownBg: string;
    dropdownText: string;
    iconColor: string;
    inputText: string;
    inputBg: string;
    selectedModel: string;
    onModelChange: (model: string) => void;
    prompt: string;
    onPromptChange: (val: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    selectedAspectRatio: string;
    onAspectRatioChange: (ratio: string) => void;
    selectedFrame: string;
    isPromptDisabled: boolean;
    placeholder: string;
    models: string[];
    modelDropdownRef: React.RefObject<HTMLDivElement | null>;
    isModelDropdownOpen: boolean;
    onSetIsModelDropdownOpen: (open: boolean) => void;
    aspectRatioDropdownRef: React.RefObject<HTMLDivElement | null>;
    isAspectRatioDropdownOpen: boolean;
    onSetIsAspectRatioDropdownOpen: (open: boolean) => void;
    onOptionsChange?: (opts: any) => void;
}

export const DefaultCategoryView: React.FC<DefaultCategoryProps> = ({
    scale,
    isDark,
    controlFontSize,
    inputFontSize,
    dropdownBorderColor,
    dropdownBg,
    dropdownText,
    iconColor,
    inputText,
    inputBg,
    selectedModel,
    onModelChange,
    prompt,
    onPromptChange,
    onGenerate,
    isGenerating,
    selectedAspectRatio,
    onAspectRatioChange,
    selectedFrame,
    isPromptDisabled,
    placeholder,
    models,
    modelDropdownRef,
    isModelDropdownOpen,
    onSetIsModelDropdownOpen,
    aspectRatioDropdownRef,
    isAspectRatioDropdownOpen,
    onSetIsAspectRatioDropdownOpen,
    onOptionsChange,
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * scale}px`, width: '100%' }}>
            <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center' }}>
                <input
                    className="prompt-input"
                    type="text"
                    value={prompt}
                    onChange={(e) => {
                        const val = e.target.value;
                        onPromptChange(val);
                        onOptionsChange?.({ prompt: val, model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame });
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onGenerate(); } }}
                    placeholder={placeholder}
                    disabled={isPromptDisabled}
                    style={{
                        flex: 1,
                        padding: `${10 * scale}px ${14 * scale}px`,
                        backgroundColor: inputBg,
                        border: `1px solid ${dropdownBorderColor}`,
                        borderRadius: `${10 * scale}px`,
                        fontSize: controlFontSize,
                        color: inputText,
                        outline: 'none',
                        cursor: isPromptDisabled ? 'not-allowed' : 'text',
                        opacity: isPromptDisabled ? 0.7 : 1
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                />
                <button
                    onClick={onGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    style={{
                        width: `${40 * scale}px`,
                        height: `${40 * scale}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: (prompt.trim() && !isGenerating) ? SELECTION_COLOR : 'rgba(0, 0, 0, 0.1)',
                        border: 'none',
                        borderRadius: `${10 * scale}px`,
                        cursor: (prompt.trim() && !isGenerating) ? 'pointer' : 'not-allowed',
                        color: 'white',
                        boxShadow: (prompt.trim() && !isGenerating) ? `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)` : 'none',
                        padding: 0,
                        opacity: isGenerating ? 0.6 : 1,
                        transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                        if (prompt.trim() && !isGenerating) {
                            e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(76, 131, 255, 0.5)`;
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (prompt.trim() && !isGenerating) {
                            e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`;
                        }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <GenerateArrowIcon scale={scale * 1.1} />
                </button>
            </div>

            <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', flexWrap: 'wrap' }}>
                <div ref={modelDropdownRef} style={{ position: 'relative', flex: 1, minWidth: `${140 * scale}px`, zIndex: 10 }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSetIsModelDropdownOpen(!isModelDropdownOpen); }}
                        style={{
                            width: '100%',
                            padding: `${10 * scale}px ${14 * scale}px`,
                            backgroundColor: dropdownBg,
                            border: `1px solid ${dropdownBorderColor}`,
                            borderRadius: `${9999 * scale}px`,
                            fontSize: controlFontSize,
                            fontWeight: '500',
                            color: dropdownText,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <span>{selectedModel}</span>
                        <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ transform: isModelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}><path d="M2 4L6 8L10 4" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    {isModelDropdownOpen && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: `${4 * scale}px`, backgroundColor: dropdownBg, border: `1px solid ${dropdownBorderColor}`, borderRadius: `${12 * scale}px`, zIndex: 10 }}>
                            {models.map(m => (
                                <div key={m} onClick={() => { onModelChange(m); onSetIsModelDropdownOpen(false); }} style={{ padding: `${8 * scale}px ${16 * scale}px`, cursor: 'pointer', color: dropdownText, fontSize: controlFontSize, backgroundColor: selectedModel === m ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent' }}>{m}</div>
                            ))}
                        </div>
                    )}
                </div>

                <div ref={aspectRatioDropdownRef} style={{ position: 'relative', zIndex: 9 }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSetIsAspectRatioDropdownOpen(!isAspectRatioDropdownOpen); }}
                        style={{
                            padding: `${10 * scale}px ${14 * scale}px`,
                            backgroundColor: dropdownBg,
                            border: `1px solid ${dropdownBorderColor}`,
                            borderRadius: `${9999 * scale}px`,
                            fontSize: controlFontSize,
                            fontWeight: '600',
                            color: dropdownText,
                            minWidth: `${70 * scale}px`,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}
                    >
                        <span>{selectedAspectRatio}</span>
                        <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ transform: isAspectRatioDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}><path d="M2 4L6 8L10 4" stroke={SELECTION_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    {isAspectRatioDropdownOpen && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: `${4 * scale}px`, backgroundColor: dropdownBg, border: `1px solid ${dropdownBorderColor}`, borderRadius: `${12 * scale}px`, zIndex: 10 }}>
                            {['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'].map(ratio => (
                                <div key={ratio} onClick={() => { onAspectRatioChange(ratio); onSetIsAspectRatioDropdownOpen(false); }} style={{ padding: `${8 * scale}px ${16 * scale}px`, cursor: 'pointer', color: dropdownText, fontSize: controlFontSize }}>{ratio}</div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
