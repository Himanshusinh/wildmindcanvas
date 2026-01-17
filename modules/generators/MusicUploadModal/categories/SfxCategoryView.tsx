'use client';
import React from 'react';
import { Slider } from './common/Slider';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { GenerateArrowIcon } from '@/modules/ui-global/common/GenerateArrowIcon';

interface SfxCategoryViewProps {
    scale: number;
    isDark: boolean;
    controlFontSize: string;
    inputFontSize: string;
    prompt: string;
    onPromptChange: (val: string) => void;
    duration: number;
    onDurationChange: (val: number) => void;
    promptInfluence: number;
    onPromptInfluenceChange: (val: number) => void;
    audioFormat: string;
    onAudioFormatChange: (val: string) => void;
    loop: boolean;
    onLoopChange: (val: boolean) => void;
    filename: string;
    onFilenameChange: (val: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    isPromptDisabled?: boolean;
}

export const SfxCategoryView: React.FC<SfxCategoryViewProps> = ({
    scale,
    isDark,
    controlFontSize,
    inputFontSize,
    prompt,
    onPromptChange,
    duration,
    onDurationChange,
    promptInfluence,
    onPromptInfluenceChange,
    audioFormat,
    onAudioFormatChange,
    loop,
    onLoopChange,
    filename,
    onFilenameChange,
    onGenerate,
    isGenerating,
    isPromptDisabled = false,
}) => {
    const outputFormats = [
        { id: 'mp3_22050_32', label: 'mp3_22050_32' },
        { id: 'mp3_44100_32', label: 'mp3_44100_32' },
        { id: 'mp3_44100_64', label: 'mp3_44100_64' },
        { id: 'mp3_44100_96', label: 'mp3_44100_96' },
        { id: 'mp3_44100_128', label: 'mp3_44100_128' },
        { id: 'mp3_44100_192', label: 'mp3_44100_192' },
        { id: 'pcm_8000', label: 'pcm_8000' },
        { id: 'pcm_16000', label: 'pcm_16000' },
        { id: 'pcm_22050', label: 'pcm_22050' },
        { id: 'pcm_24000', label: 'pcm_24000' },
        { id: 'pcm_44100', label: 'pcm_44100' },
        { id: 'pcm_48000', label: 'pcm_48000' },
        { id: 'ulaw_8000', label: 'ulaw_8000' },
        { id: 'alaw_8000', label: 'alaw_8000' },
        { id: 'opus_48000_32', label: 'opus_48000_32' },
        { id: 'opus_48000_64', label: 'opus_48000_64' },
        { id: 'opus_48000_96', label: 'opus_48000_96' },
        { id: 'opus_48000_128', label: 'opus_48000_128' },
        { id: 'opus_48000_192', label: 'opus_48000_192' },
    ];

    const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const labelColor = isDark ? '#999' : '#666';
    const textColor = isDark ? '#fff' : '#000';
    const inputBg = isDark ? '#121212' : '#f9f9f9';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${16 * scale}px` }}>
            {/* Header Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: `${8 * scale}px`,
                        backgroundColor: '#fff',
                        color: '#000',
                        padding: `${6 * scale}px ${12 * scale}px`,
                        borderRadius: `${8 * scale}px`,
                        width: 'fit-content',
                        fontWeight: '600',
                        fontSize: controlFontSize
                    }}>
                        <span>🎵</span>
                        <span>ElevenLabs Sound Effects</span>
                    </div>
                    <span style={{ fontSize: `${11 * scale}px`, color: labelColor }}>6 credits per second</span>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onGenerate(); }}
                    disabled={isGenerating || !(prompt?.trim())}
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
                        cursor: (isGenerating || !(prompt?.trim())) ? 'not-allowed' : 'pointer',
                        opacity: (isGenerating || !(prompt?.trim())) ? 0.7 : 1,
                        boxShadow: (isGenerating || !(prompt?.trim())) ? 'none' : `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`,
                        transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                        if (!isGenerating && prompt?.trim()) {
                            e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(76, 131, 255, 0.5)`;
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isGenerating && prompt?.trim()) {
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

            {/* Prompt Text Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * scale}px` }}>
                <div style={{
                    position: 'relative',
                    width: '100%',
                    backgroundColor: inputBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: `${12 * scale}px`,
                    padding: `${12 * scale}px`,
                }}>
                    <textarea
                        value={prompt || ''}
                        onChange={(e) => onPromptChange(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        placeholder={isPromptDisabled ? 'Controlled by input node' : "Describe the sound effect you want to generate. e.g., 'Spacious braam suitable for high-impact movie trailer moments'..."}
                        disabled={isPromptDisabled}
                        style={{
                            width: '100%',
                            height: `${100 * scale}px`,
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: isPromptDisabled ? (isDark ? '#666666' : '#6b7280') : textColor,
                            fontSize: inputFontSize,
                            resize: 'none',
                            outline: 'none',
                            fontFamily: 'inherit',
                            padding: 0,
                            lineHeight: '1.5',
                            cursor: isPromptDisabled ? 'not-allowed' : 'text'
                        }}
                    />
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: `${8 * scale}px`,
                        fontSize: `${11 * scale}px`,
                        color: labelColor
                    }}>
                        <span>The text to be converted to speech (maximum 1000 characters).</span>
                        <span>({(prompt || '').length}/1000)</span>
                    </div>
                </div>
            </div>

            {/* Duration Slider */}
            <Slider
                label="Duration (seconds)"
                value={duration}
                onChange={onDurationChange}
                min={0.5}
                max={22}
                step={0.1}
                scale={scale}
                isDark={isDark}
                controlFontSize={controlFontSize}
                inputFontSize={inputFontSize}
                formatValue={(val: number) => val.toFixed(2)}
            />

            {/* Prompt Influence Slider */}
            <Slider
                label="Prompt Influence"
                value={promptInfluence}
                onChange={onPromptInfluenceChange}
                min={0.3}
                max={1.0}
                step={0.01}
                scale={scale}
                isDark={isDark}
                controlFontSize={controlFontSize}
                inputFontSize={inputFontSize}
                formatValue={(val: number) => val.toFixed(2)}
            />

            {/* Output Format Dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
                <label style={{ fontSize: `${11 * scale}px`, color: labelColor, fontWeight: '500' }}>Output Format</label>
                <select
                    value={audioFormat}
                    onChange={(e) => onAudioFormatChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        padding: `${10 * scale}px`,
                        backgroundColor: inputBg,
                        border: `1px solid ${borderColor}`,
                        borderRadius: `${8 * scale}px`,
                        color: textColor,
                        fontSize: inputFontSize,
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {outputFormats.map(fmt => (
                        <option key={fmt.id} value={fmt.id}>{fmt.label}</option>
                    ))}
                </select>
            </div>

            {/* Loop Toggle */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: `${12 * scale}px`,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                borderRadius: `${12 * scale}px`,
                border: `1px solid ${borderColor}`
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
                    <span style={{ fontSize: controlFontSize, color: textColor, fontWeight: '500' }}>Loop</span>
                    <span style={{ fontSize: `${11 * scale}px`, color: labelColor }}>Create a sound effect that loops smoothly</span>
                </div>
                <div
                    onClick={() => onLoopChange(!loop)}
                    style={{
                        width: `${40 * scale}px`,
                        height: `${20 * scale}px`,
                        backgroundColor: loop ? SELECTION_COLOR : (isDark ? '#333' : '#ccc'),
                        borderRadius: `${20 * scale}px`,
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        top: `${2 * scale}px`,
                        left: loop ? `${22 * scale}px` : `${2 * scale}px`,
                        width: `${16 * scale}px`,
                        height: `${16 * scale}px`,
                        backgroundColor: '#fff',
                        borderRadius: '50%',
                        transition: 'left 0.2s'
                    }} />
                </div>
            </div>

            {/* File Name Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
                <label style={{ fontSize: `${11 * scale}px`, color: labelColor, fontWeight: '500' }}>File Name (optional)</label>
                <input
                    type="text"
                    value={filename || ''}
                    onChange={(e) => onFilenameChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="Enter file name..."
                    style={{
                        width: '100%',
                        padding: `${10 * scale}px`,
                        backgroundColor: inputBg,
                        border: `1px solid ${borderColor}`,
                        borderRadius: `${8 * scale}px`,
                        color: textColor,
                        fontSize: inputFontSize,
                        outline: 'none',
                        fontFamily: 'inherit'
                    }}
                />
            </div>
        </div>
    );
};
