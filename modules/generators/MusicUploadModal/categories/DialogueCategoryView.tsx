'use client';
import React from 'react';
import { Slider } from './common/Slider';
import { DialogueInput } from '../../../canvas-overlays/types';

interface DialogueCategoryViewProps {
    scale: number;
    isDark: boolean;
    controlFontSize: string;
    inputFontSize: string;
    dialogueInputs: DialogueInput[];
    onDialogueInputsChange: (inputs: DialogueInput[]) => void;
    stability: number;
    onStabilityChange: (val: number) => void;
    useSpeakerBoost: boolean;
    onUseSpeakerBoostChange: (val: boolean) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    filename: string;
    onFilenameChange: (val: string) => void;
}

export const DialogueCategoryView: React.FC<DialogueCategoryViewProps> = ({
    scale,
    isDark,
    controlFontSize,
    inputFontSize,
    dialogueInputs,
    onDialogueInputsChange,
    stability,
    onStabilityChange,
    useSpeakerBoost,
    onUseSpeakerBoostChange,
    onGenerate,
    isGenerating,
    filename,
    onFilenameChange,
}) => {
    const voices = [
        { id: 'Aria', name: 'Aria' },
        { id: 'Roger', name: 'Roger' },
        { id: 'Sarah', name: 'Sarah' },
        { id: 'Laura', name: 'Laura' },
        { id: 'Charlie', name: 'Charlie' },
        { id: 'George', name: 'George' },
        { id: 'Callum', name: 'Callum' },
        { id: 'Liam', name: 'Liam' },
        { id: 'Charlotte', name: 'Charlotte' },
        { id: 'Alice', name: 'Alice' },
        { id: 'Matilda', name: 'Matilda' },
        { id: 'Will', name: 'Will' },
        { id: 'Jessica', name: 'Jessica' },
        { id: 'Eric', name: 'Eric' },
        { id: 'Chris', name: 'Chris' },
        { id: 'Brian', name: 'Brian' },
    ];

    const handleAddInput = () => {
        onDialogueInputsChange([...dialogueInputs, { text: '', voice: 'Aria' }]);
    };

    const handleRemoveInput = (index: number) => {
        const newInputs = dialogueInputs.filter((_, i) => i !== index);
        onDialogueInputsChange(newInputs);
    };

    const handleInputChange = (index: number, field: keyof DialogueInput, value: string) => {
        const newInputs = dialogueInputs.map((input, i) => {
            if (i === index) {
                return { ...input, [field]: value };
            }
            return input;
        });
        onDialogueInputsChange(newInputs);
    };

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
                        <span>ElevenLabs Dialogue V3</span>
                    </div>
                    <span style={{ fontSize: `${11 * scale}px`, color: labelColor }}>220 credits</span>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onGenerate(); }}
                    disabled={isGenerating || dialogueInputs.some(i => !i.text.trim())}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: `${36 * scale}px`,
                        height: `${36 * scale}px`,
                        padding: 0,
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: `${8 * scale}px`,
                        cursor: (isGenerating || dialogueInputs.some(i => !i.text.trim())) ? 'not-allowed' : 'pointer',
                        opacity: (isGenerating || dialogueInputs.some(i => !i.text.trim())) ? 0.7 : 1,
                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                    }}
                >
                    {isGenerating ? (
                        <div className="animate-spin" style={{ width: `${16 * scale}px`, height: `${16 * scale}px`, border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    ) : (
                        <svg width={20 * scale} height={20 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    )}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
                <label style={{ fontSize: `${11 * scale}px`, color: labelColor, fontWeight: '500' }}>File Name</label>
                <input
                    type="text"
                    value={filename}
                    onChange={(e) => onFilenameChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="Enter file name (e.g. my_dialogue_1)"
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

            <div style={{ fontSize: controlFontSize, fontWeight: '500', color: textColor }}>
                Dialogue Inputs
            </div>

            {/* Dialogue Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${12 * scale}px` }}>
                {dialogueInputs.map((input, index) => (
                    <div key={index} style={{
                        position: 'relative',
                        padding: `${16 * scale}px`,
                        borderRadius: `${12 * scale}px`,
                        border: `1px solid ${borderColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: `${12 * scale}px`,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: `${11 * scale}px`, color: labelColor, fontWeight: '500' }}>
                                Input {index + 1}
                            </span>
                            {dialogueInputs.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleRemoveInput(index);
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#ef4444',
                                        fontSize: `${11 * scale}px`,
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
                            <label style={{ fontSize: `${11 * scale}px`, color: labelColor }}>Text</label>
                            <textarea
                                value={input.text}
                                onChange={(e) => handleInputChange(index, 'text', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                placeholder="Enter dialogue text... You can use emotion tags like [applause], [excited], etc."
                                style={{
                                    width: '100%',
                                    height: `${60 * scale}px`,
                                    padding: `${10 * scale}px`,
                                    backgroundColor: inputBg,
                                    border: `1px solid ${borderColor}`,
                                    borderRadius: `${8 * scale}px`,
                                    color: textColor,
                                    fontSize: inputFontSize,
                                    resize: 'none',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
                            <label style={{ fontSize: `${11 * scale}px`, color: labelColor }}>Voice</label>
                            <select
                                value={input.voice}
                                onChange={(e) => handleInputChange(index, 'voice', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                style={{
                                    width: '100%',
                                    padding: `${8 * scale}px`,
                                    backgroundColor: inputBg,
                                    border: `1px solid ${borderColor}`,
                                    borderRadius: `${8 * scale}px`,
                                    color: textColor,
                                    fontSize: inputFontSize,
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {voices.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleAddInput();
                }}
                style={{
                    width: '100%',
                    padding: `${12 * scale}px`,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    border: `1px dashed ${borderColor}`,
                    borderRadius: `${12 * scale}px`,
                    color: textColor,
                    fontSize: controlFontSize,
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
            >
                + Add Dialogue Input
            </button>

            {/* Global Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${16 * scale}px`, marginTop: `${8 * scale}px` }}>
                <Slider
                    label="Stability"
                    value={stability}
                    onChange={onStabilityChange}
                    min={0}
                    max={1}
                    step={0.01}
                    scale={scale}
                    isDark={isDark}
                    controlFontSize={controlFontSize}
                    inputFontSize={inputFontSize}
                />

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
                        <span style={{ fontSize: controlFontSize, color: textColor, fontWeight: '500' }}>Use Speaker Boost</span>
                        <span style={{ fontSize: `${11 * scale}px`, color: labelColor }}>Boosts similarity to the original speaker</span>
                    </div>
                    <div
                        onClick={() => onUseSpeakerBoostChange(!useSpeakerBoost)}
                        style={{
                            width: `${40 * scale}px`,
                            height: `${20 * scale}px`,
                            backgroundColor: useSpeakerBoost ? '#437eb5' : (isDark ? '#333' : '#ccc'),
                            borderRadius: `${20 * scale}px`,
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            top: `${2 * scale}px`,
                            left: useSpeakerBoost ? `${22 * scale}px` : `${2 * scale}px`,
                            width: `${16 * scale}px`,
                            height: `${16 * scale}px`,
                            backgroundColor: '#fff',
                            borderRadius: '50%',
                            transition: 'left 0.2s'
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
};
