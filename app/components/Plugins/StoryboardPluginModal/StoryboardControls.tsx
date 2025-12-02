'use client';

import React, { useState, useEffect } from 'react';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface StoryboardControlsProps {
    id?: string;
    scale: number;
    characterInput: string;
    characterNames: string;
    backgroundDescription: string;
    specialRequest: string;
    connectedCharacterImages?: string[];
    connectedBackgroundImages?: string[];
    connectedPropsImages?: string[];
    frameBorderColor: string;
    frameBorderWidth: number;
    onCharacterInputChange: (value: string) => void;
    onCharacterNamesChange: (value: string) => void;
    onBackgroundDescriptionChange: (value: string) => void;
    onSpecialRequestChange: (value: string) => void;
    onGenerate: () => void;
    onHoverChange: (hovered: boolean) => void;
    characterNamesMap: Record<number, string>;
    propsNamesMap: Record<number, string>;
    onCharacterNamesMapChange: (map: Record<number, string>) => void;
    onPropsNamesMapChange: (map: Record<number, string>) => void;
    backgroundNamesMap: Record<number, string>;
    onBackgroundNamesMapChange: (map: Record<number, string>) => void;
    extraTopPadding?: number;
    isAiMode: boolean;
    onAiModeChange: (isAiMode: boolean) => void;
    manualScript: string;
    onManualScriptChange: (script: string) => void;
}

export const StoryboardControls: React.FC<StoryboardControlsProps> = ({
    id,
    scale,
    characterInput,
    characterNames,
    backgroundDescription,
    specialRequest,
    connectedCharacterImages = [],
    connectedBackgroundImages = [],
    connectedPropsImages = [],
    frameBorderColor,
    frameBorderWidth,
    onCharacterInputChange,
    onCharacterNamesChange,
    onBackgroundDescriptionChange,
    onSpecialRequestChange,
    onGenerate,
    onHoverChange,
    characterNamesMap,
    propsNamesMap,
    onCharacterNamesMapChange,
    onPropsNamesMapChange,
    backgroundNamesMap,
    onBackgroundNamesMapChange,
    extraTopPadding,
    isAiMode,
    onAiModeChange,
    manualScript,
    onManualScriptChange,
}) => {
    const isDark = useIsDarkTheme();
    const [selectedCharacterIndex, setSelectedCharacterIndex] = useState<number | null>(null);
    const [selectedPropsIndex, setSelectedPropsIndex] = useState<number | null>(null);
    const [selectedBackgroundIndex, setSelectedBackgroundIndex] = useState<number | null>(null);

    const inputStyle = {
        width: '100%',
        padding: `${8 * scale}px`,
        borderRadius: `${8 * scale}px`,
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        color: isDark ? '#ffffff' : '#000000',
        fontSize: `${14 * scale}px`,
        outline: 'none',
        transition: 'border-color 0.2s ease',
    };

    const labelStyle = {
        fontSize: `${12 * scale}px`,
        fontWeight: 500,
        color: isDark ? '#a0a0a0' : '#666666',
        marginBottom: `${4 * scale}px`,
        display: 'block',
    };

    const renderReceiveNode = (side: string, label: string) => (
        <div
            data-node-id={id}
            data-node-side={side}
            title={label}
            onPointerEnter={(e) => {
                if (!id) return;
                window.dispatchEvent(new CustomEvent('canvas-node-hover', { detail: { nodeId: id } }));
            }}
            onPointerLeave={(e) => {
                if (!id) return;
                window.dispatchEvent(new CustomEvent('canvas-node-leave', { detail: { nodeId: id } }));
            }}
            onPointerUp={(e) => {
                if (!id) return;
                e.stopPropagation();
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('canvas-node-complete', { detail: { id, side } }));
                try {
                    const active: any = (window as any).__canvas_active_capture;
                    if (active?.element && typeof active?.pid === 'number') {
                        try { active.element.releasePointerCapture(active.pid); } catch (err) { }
                        delete (window as any).__canvas_active_capture;
                    }
                } catch (err) { }
            }}
            style={{
                position: 'absolute',
                left: `${-24 * scale}px`, // Position to the left of the container
                top: '50%',
                transform: 'translateY(-50%)',
                width: `${16 * scale}px`,
                height: `${16 * scale}px`,
                borderRadius: '50%',
                backgroundColor: isDark ? '#808080' : '#606060',
                cursor: 'pointer',
                border: `${2 * scale}px solid ${isDark ? '#2a2a2a' : '#c0c0c0'}`,
                zIndex: 5000,
                boxSizing: 'border-box',
                boxShadow: isDark
                    ? `0 0 ${4 * scale}px rgba(0, 0, 0, 0.5), inset 0 0 ${2 * scale}px rgba(255, 255, 255, 0.1)`
                    : `0 0 ${4 * scale}px rgba(0, 0, 0, 0.2), inset 0 0 ${2 * scale}px rgba(255, 255, 255, 0.3)`,
            }}
        />
    );

    const basePadding = 16 * scale;
    const computedTopPadding = Math.max(basePadding, extraTopPadding ?? basePadding);

    return (
        <div
            className="controls-overlay"
            style={{
                position: 'relative',
                width: `${400 * scale}px`,
                maxWidth: '90vw',
                backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: `${16 * scale}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: `${12 * scale}px`,
                overflow: 'visible',
                zIndex: 10,
                border: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
                padding: `${basePadding}px`,
                paddingTop: `${computedTopPadding}px`,
                transition: 'background-color 0.3s ease, border-color 0.3s ease',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            }}
            onMouseEnter={() => onHoverChange(true)}
            onMouseLeave={() => onHoverChange(false)}
            onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking inside controls
        >
            {/* AI Mode Toggle */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: `${8 * scale}px`,
                borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                marginBottom: `${4 * scale}px`,
            }}>
                <span style={{
                    fontSize: `${14 * scale}px`,
                    fontWeight: 600,
                    color: isDark ? '#ffffff' : '#000000',
                }}>
                    AI Mode
                </span>
                <div
                    onClick={() => onAiModeChange(!isAiMode)}
                    style={{
                        width: `${40 * scale}px`,
                        height: `${24 * scale}px`,
                        backgroundColor: isAiMode ? '#437eb5' : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'),
                        borderRadius: `${12 * scale}px`,
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                    }}
                >
                    <div style={{
                        width: `${20 * scale}px`,
                        height: `${20 * scale}px`,
                        backgroundColor: '#ffffff',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: `${2 * scale}px`,
                        left: isAiMode ? `${18 * scale}px` : `${2 * scale}px`,
                        transition: 'left 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }} />
                </div>
            </div>

            {/* Script Input Section */}
            <div style={{ position: 'relative' }}>
                {isAiMode && renderReceiveNode('receive-script', 'Script Input')}
                <label style={labelStyle}>Script Input</label>
                {isAiMode ? (
                    <div style={{
                        fontSize: `${12 * scale}px`,
                        color: isDark ? '#a0a0a0' : '#666666',
                        fontStyle: 'italic',
                        padding: `${8 * scale}px`,
                        border: `1px dashed ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
                        borderRadius: `${8 * scale}px`,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    }}>
                        Connect a Text Node to use as script...
                    </div>
                ) : (
                    <div style={{ position: 'relative' }}>
                        <textarea
                            value={manualScript}
                            onChange={(e) => onManualScriptChange(e.target.value)}
                            placeholder="Enter your story script here... Use @CharacterName to mention characters."
                            style={{
                                ...inputStyle,
                                minHeight: `${80 * scale}px`,
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                paddingRight: `${40 * scale}px`, // Make room for button
                            }}
                        />
                        <div
                            onClick={onGenerate}
                            style={{
                                position: 'absolute',
                                right: `${8 * scale}px`,
                                bottom: `${8 * scale}px`,
                                width: `${28 * scale}px`,
                                height: `${28 * scale}px`,
                                borderRadius: '50%',
                                backgroundColor: '#437eb5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease, background-color 0.2s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                zIndex: 10,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.backgroundColor = '#3b6ea0';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.backgroundColor = '#437eb5';
                            }}
                            title="Generate Script Frame & Scenes"
                        >
                            <svg width={`${16 * scale}`} height={`${16 * scale}`} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>
            <div style={{ position: 'relative' }}>
                {renderReceiveNode('receive-character', 'Character Input')}
                <label style={labelStyle}>Character Input</label>
                {connectedCharacterImages.length > 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: `${8 * scale}px`,
                        marginTop: `${4 * scale}px`,
                    }}>
                        {connectedCharacterImages.map((imgUrl, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: `${4 * scale}px`,
                                }}
                            >
                                <div
                                    onClick={() => {
                                        const newIndex = selectedCharacterIndex === index ? null : index;
                                        setSelectedCharacterIndex(newIndex);
                                        // Populate input with existing name if selecting
                                        if (newIndex !== null) {
                                            onCharacterNamesChange(characterNamesMap[index] || '');
                                        } else {
                                            onCharacterNamesChange('');
                                        }
                                    }}
                                    style={{
                                        width: `${60 * scale}px`,
                                        height: `${60 * scale}px`,
                                        borderRadius: `${8 * scale}px`,
                                        overflow: 'hidden',
                                        border: `2px solid ${selectedCharacterIndex === index ? '#437eb5' : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')}`,
                                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s ease',
                                    }}>
                                    <img
                                        src={imgUrl}
                                        alt={`Character ${index + 1}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                {characterNamesMap[index] && (
                                    <div style={{
                                        fontSize: `${10 * scale}px`,
                                        color: isDark ? '#a0a0a0' : '#666666',
                                        maxWidth: `${60 * scale}px`,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        textAlign: 'center',
                                    }}>
                                        {characterNamesMap[index]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        width: `${60 * scale}px`,
                        height: `${60 * scale}px`,
                        borderRadius: `${8 * scale}px`,
                        border: `1px dashed ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                        marginTop: `${4 * scale}px`,
                    }} />
                )}
            </div>

            {/* Character Names - Only show when a character is selected */}
            {selectedCharacterIndex !== null && (
                <div>
                    <label style={labelStyle}>Character Names</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
                        <input
                            type="text"
                            value={characterNames}
                            onChange={(e) => onCharacterNamesChange(e.target.value)}
                            placeholder="Enter name..."
                            style={{
                                ...inputStyle,
                                flex: 1, // Fill available space
                            }}
                        />
                        <div
                            onClick={() => {
                                if (selectedCharacterIndex !== null && characterNames.trim()) {
                                    onCharacterNamesMapChange({
                                        ...characterNamesMap,
                                        [selectedCharacterIndex]: characterNames
                                    });
                                }
                            }}
                            style={{
                                width: `${32 * scale}px`,
                                height: `${32 * scale}px`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: isDark ? '#ffffff' : '#000000',
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                borderRadius: `${8 * scale}px`,
                                transition: 'background-color 0.2s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                        >
                            <svg width={`${16 * scale}`} height={`${16 * scale}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ position: 'relative' }}>
                {renderReceiveNode('receive-background', 'Background Input')}
                <label style={labelStyle}>Background Image / Description</label>
                {connectedBackgroundImages.length > 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: `${8 * scale}px`,
                        marginTop: `${4 * scale}px`,
                    }}>
                        {connectedBackgroundImages.map((imgUrl, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: `${4 * scale}px`,
                                }}
                            >
                                <div
                                    onClick={() => {
                                        const newIndex = selectedBackgroundIndex === index ? null : index;
                                        setSelectedBackgroundIndex(newIndex);
                                        // Populate input with existing name if selecting
                                        if (newIndex !== null) {
                                            onBackgroundDescriptionChange(backgroundNamesMap[index] || '');
                                        } else {
                                            onBackgroundDescriptionChange('');
                                        }
                                    }}
                                    style={{
                                        width: `${60 * scale}px`,
                                        height: `${60 * scale}px`,
                                        borderRadius: `${8 * scale}px`,
                                        overflow: 'hidden',
                                        border: `2px solid ${selectedBackgroundIndex === index ? '#437eb5' : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')}`,
                                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s ease',
                                    }}>
                                    <img
                                        src={imgUrl}
                                        alt={`Background ${index + 1}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                {backgroundNamesMap[index] && (
                                    <div style={{
                                        fontSize: `${10 * scale}px`,
                                        color: isDark ? '#a0a0a0' : '#666666',
                                        maxWidth: `${60 * scale}px`,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        textAlign: 'center',
                                    }}>
                                        {backgroundNamesMap[index]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        width: `${60 * scale}px`,
                        height: `${60 * scale}px`,
                        borderRadius: `${8 * scale}px`,
                        border: `1px dashed ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                        marginTop: `${4 * scale}px`,
                    }} />
                )}
            </div>

            {/* Background Names - Only show when a background is selected */}
            {selectedBackgroundIndex !== null && (
                <div>
                    <label style={labelStyle}>Background Name</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
                        <input
                            type="text"
                            value={backgroundDescription}
                            onChange={(e) => onBackgroundDescriptionChange(e.target.value)}
                            placeholder="Enter name..."
                            style={{
                                ...inputStyle,
                                flex: 1,
                            }}
                        />
                        <div
                            onClick={() => {
                                if (selectedBackgroundIndex !== null && backgroundDescription.trim()) {
                                    onBackgroundNamesMapChange({
                                        ...backgroundNamesMap,
                                        [selectedBackgroundIndex]: backgroundDescription
                                    });
                                }
                            }}
                            style={{
                                width: `${32 * scale}px`,
                                height: `${32 * scale}px`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: isDark ? '#ffffff' : '#000000',
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                borderRadius: `${8 * scale}px`,
                                transition: 'background-color 0.2s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                        >
                            <svg width={`${16 * scale}`} height={`${16 * scale}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ position: 'relative' }}>
                {renderReceiveNode('receive-props', 'Props Input')}
                <label style={labelStyle}>Props Input</label>
                {connectedPropsImages.length > 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: `${8 * scale}px`,
                        marginTop: `${4 * scale}px`,
                    }}>
                        {connectedPropsImages.map((imgUrl, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: `${4 * scale}px`,
                                }}
                            >
                                <div
                                    onClick={() => {
                                        const newIndex = selectedPropsIndex === index ? null : index;
                                        setSelectedPropsIndex(newIndex);
                                        // Populate input with existing name if selecting
                                        if (newIndex !== null) {
                                            onSpecialRequestChange(propsNamesMap[index] || '');
                                        } else {
                                            onSpecialRequestChange('');
                                        }
                                    }}
                                    style={{
                                        width: `${60 * scale}px`,
                                        height: `${60 * scale}px`,
                                        borderRadius: `${8 * scale}px`,
                                        overflow: 'hidden',
                                        border: `2px solid ${selectedPropsIndex === index ? '#437eb5' : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')}`,
                                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s ease',
                                    }}>
                                    <img
                                        src={imgUrl}
                                        alt={`Props ${index + 1}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                {propsNamesMap[index] && (
                                    <div style={{
                                        fontSize: `${10 * scale}px`,
                                        color: isDark ? '#a0a0a0' : '#666666',
                                        maxWidth: `${60 * scale}px`,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        textAlign: 'center',
                                    }}>
                                        {propsNamesMap[index]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        width: `${60 * scale}px`,
                        height: `${60 * scale}px`,
                        borderRadius: `${8 * scale}px`,
                        border: `1px dashed ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                        marginTop: `${4 * scale}px`,
                    }} />
                )}
            </div>

            {/* Props Names - Only show when a prop is selected */}
            {selectedPropsIndex !== null && (
                <div>
                    <label style={labelStyle}>Props Name</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
                        <input
                            type="text"
                            value={specialRequest}
                            onChange={(e) => onSpecialRequestChange(e.target.value)}
                            placeholder="Enter name..."
                            style={{
                                ...inputStyle,
                                flex: 1,
                            }}
                        />
                        <div
                            onClick={() => {
                                if (selectedPropsIndex !== null && specialRequest.trim()) {
                                    onPropsNamesMapChange({
                                        ...propsNamesMap,
                                        [selectedPropsIndex]: specialRequest
                                    });
                                }
                            }}
                            style={{
                                width: `${32 * scale}px`,
                                height: `${32 * scale}px`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: isDark ? '#ffffff' : '#000000',
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                borderRadius: `${8 * scale}px`,
                                transition: 'background-color 0.2s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
                        >
                            <svg width={`${16 * scale}`} height={`${16 * scale}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Generate Button */}
            <button
                onClick={onGenerate}
                style={{
                    width: '100%',
                    padding: `${10 * scale}px`,
                    borderRadius: `${8 * scale}px`,
                    border: 'none',
                    background: '#437eb5',
                    color: '#ffffff',
                    fontSize: `${14 * scale}px`,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    marginTop: `${4 * scale}px`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#3b6ea0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#437eb5'}
            >
                Generate Storyboard
            </button>
        </div>
    );
};
