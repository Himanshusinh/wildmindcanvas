'use client';

import React, { useState } from 'react';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';
import { Sparkles, ChevronDown } from 'lucide-react';

interface MultiangleControlsProps {
    scale: number;
    isProcessing: boolean;
    sourceImageUrl: string | null;
    frameBorderColor: string;
    frameBorderWidth: number;
    onGenerate: (params?: any) => void;
    onHoverChange: (hovered: boolean) => void;
    extraTopPadding?: number;
    rotateDegrees: number;
    onRotateChange: (degrees: number) => void;
    prompt: string;
    onPromptChange: (value: string) => void;
    loraScale: number;
    onLoraScaleChange: (value: number) => void;
}

export const MultiangleControls: React.FC<MultiangleControlsProps> = ({
    scale,
    isProcessing,
    sourceImageUrl,
    frameBorderColor,
    frameBorderWidth,
    onGenerate,
    onHoverChange,
    extraTopPadding,
    rotateDegrees,
    onRotateChange,
    prompt,
    onPromptChange,
    loraScale,
    onLoraScaleChange,
}) => {
    const isDark = useIsDarkTheme();
    // Base values (unscaled)
    const basePadding = 16;
    // We expect extraTopPadding to be passed in SCALED pixels if it comes from the parent measuring overlap.
    // However, since we are now scaling the entire container internally, we need to convert that external scaled value back to base pixels.
    const computedTopPadding = Math.max(basePadding, (extraTopPadding ? extraTopPadding / scale : basePadding));

    // Parameters State
    // rotateDegrees is now controlled by parent
    const [moveForward, setMoveForward] = useState(0);
    const [verticalTilt, setVerticalTilt] = useState(0);
    const [wideAngle, setWideAngle] = useState(false);
    const [aspectRatio, setAspectRatio] = useState('image');

    const labelStyle = {
        fontSize: '12px',
        color: isDark ? '#aaaaaa' : '#666666',
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px'
    };

    const inputContainerStyle = {
        marginBottom: '12px'
    };

    return (
        <div
            className="controls-overlay"
            style={{
                position: 'relative',
                width: '400px', // Fixed base width
                // transform: `scale(${scale})`, // Handled by parent
                // transformOrigin: 'top left',
                backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '16px 16px 0 0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
                zIndex: 10,
                borderLeft: `${frameBorderWidth}px solid ${frameBorderColor}`,
                borderRight: `${frameBorderWidth}px solid ${frameBorderColor}`,
                borderTop: `${frameBorderWidth}px solid ${frameBorderColor}`,
                padding: `${basePadding}px`,
                paddingTop: `${computedTopPadding}px`,
                transition: 'background-color 0.3s ease, border-color 0.3s ease',
            }}
            onMouseEnter={() => onHoverChange(true)}
            onMouseLeave={() => onHoverChange(false)}
        >
            {/* Parameters Section */}
            <div style={{ paddingBottom: '12px' }}>

                {/* Prompt Input */}
                <div style={inputContainerStyle}>
                    <div style={labelStyle}>
                        <span>Prompt (Optional)</span>
                    </div>
                    <textarea
                        value={prompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        placeholder="Describe the subject..."
                        style={{
                            width: '100%',
                            minHeight: '60px',
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            color: isDark ? '#ffffff' : '#000000',
                            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                            borderRadius: '8px',
                            padding: '8px 12px',
                            fontSize: '13px',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                {/* LoRA Scale */}
                <div style={inputContainerStyle}>
                    <div style={labelStyle}>
                        <span>LoRA Scale</span>
                        <span>{loraScale.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="range"
                            min="0"
                            max="4"
                            step="0.01"
                            value={loraScale}
                            onChange={(e) => onLoraScaleChange(Number(e.target.value))}
                            style={{ flex: 1, accentColor: '#437eb5' }}
                        />
                        <input
                            type="number"
                            min="0"
                            max="4"
                            step="0.1"
                            value={loraScale}
                            onChange={(e) => {
                                let val = parseFloat(e.target.value);
                                if (isNaN(val)) val = 0;
                                if (val > 4) val = 4;
                                if (val < 0) val = 0;
                                onLoraScaleChange(val);
                            }}
                            style={{
                                width: '50px',
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                color: isDark ? '#ffffff' : '#000000',
                                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                borderRadius: '4px',
                                padding: '4px',
                                fontSize: '12px',
                                textAlign: 'center',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Rotation */}
                <div style={inputContainerStyle}>
                    <div style={labelStyle}>
                        <span>Rotation</span>
                        <span>
                            {Math.abs(rotateDegrees)}° {rotateDegrees > 0 ? '(Left)' : rotateDegrees < 0 ? '(Right)' : ''}
                        </span>
                    </div>
                    <input
                        type="range"
                        min="-90"
                        max="90"
                        value={rotateDegrees}
                        onChange={(e) => onRotateChange(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#437eb5' }}
                    />
                </div>

                {/* Move Forward */}
                <div style={inputContainerStyle}>
                    <div style={labelStyle}>
                        <span>Move Forward</span>
                        <span>{moveForward}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={moveForward}
                        onChange={(e) => setMoveForward(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#437eb5' }}
                    />
                </div>

                {/* Tilt & Wide Angle Row */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                        <div style={labelStyle}>Vertical Tilt</div>
                        <div style={{ display: 'flex', gap: '2px', backgroundColor: isDark ? '#333' : '#eee', borderRadius: '6px', padding: '2px' }}>
                            {[-1, 0, 1].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setVerticalTilt(v)}
                                    style={{
                                        flex: 1,
                                        border: 'none',
                                        background: verticalTilt === v ? (isDark ? '#555' : '#fff') : 'transparent',
                                        color: isDark ? '#fff' : '#000',
                                        fontSize: '12px',
                                        padding: '4px 0',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        boxShadow: verticalTilt === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ width: '40%' }}>
                        <div style={labelStyle}>Wide Angle</div>
                        <button
                            onClick={() => setWideAngle(!wideAngle)}
                            style={{
                                width: '100%',
                                border: `1px solid ${isDark ? '#444' : '#ccc'}`,
                                background: wideAngle ? '#437eb5' : 'transparent',
                                color: wideAngle ? '#fff' : (isDark ? '#fff' : '#000'),
                                fontSize: '12px',
                                padding: '4px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                height: '28px'
                            }}
                        >
                            {wideAngle ? 'On' : 'Off'}
                        </button>
                    </div>
                </div>

                {/* Aspect Ratio */}
                <div style={inputContainerStyle}>
                    <div style={labelStyle}>Aspect Ratio</div>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            style={{
                                width: '100%',
                                appearance: 'none',
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                color: isDark ? '#ffffff' : '#000000',
                                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '14px',
                                outline: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            <option value="image">Input Image</option>
                            <option value="1:1">1:1 Square</option>
                            <option value="16:9">16:9 Landscape</option>
                            <option value="9:16">9:16 Portrait</option>
                            <option value="4:3">4:3 Standard</option>
                            <option value="3:4">3:4 Vertical</option>
                        </select>
                        <ChevronDown
                            size={16}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
                            }}
                        />
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isProcessing && sourceImageUrl) {
                            onGenerate({
                                rotate_degrees: rotateDegrees,
                                move_forward: moveForward,
                                vertical_tilt: verticalTilt,
                                wide_angle: wideAngle,
                                aspect_ratio: aspectRatio
                            });
                        }
                    }}
                    disabled={isProcessing || !sourceImageUrl}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px',
                        backgroundColor: isProcessing ? (isDark ? '#333' : '#ddd') : '#437eb5',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: (isProcessing || !sourceImageUrl) ? 'not-allowed' : 'pointer',
                        opacity: (isProcessing || !sourceImageUrl) ? 0.7 : 1,
                        marginTop: '8px'
                    }}
                >
                    <Sparkles size={16} />
                    {isProcessing ? 'Processing' : 'Generate'}
                </button>
            </div>
        </div>
    );
};
