'use client';
import React from 'react';

interface SliderProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step: number;
    infoRef?: React.RefObject<HTMLDivElement | null>;
    showTip?: boolean;
    setShowTip?: (show: boolean) => void;
    tooltip?: string;
    scale: number;
    isDark: boolean;
    controlFontSize: string;
    inputFontSize: string;
    formatValue?: (val: number) => string;
}

export const Slider: React.FC<SliderProps> = ({
    label,
    value,
    onChange,
    min,
    max,
    step,
    infoRef,
    showTip,
    setShowTip,
    tooltip,
    scale,
    isDark,
    controlFontSize,
    inputFontSize,
    formatValue,
}) => {
    const clampedValue = Math.max(min, Math.min(max, value));
    const percentage = ((clampedValue - min) / (max - min)) * 100;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${6 * scale}px`, width: '100%' }}>
            {/* Top Row: Label and Value Display */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: controlFontSize, color: isDark ? '#e5e7eb' : '#374151' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px` }}>
                    <span style={{ fontWeight: '500' }}>{label}</span>
                    {tooltip && setShowTip && (
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <button
                                onMouseEnter={() => setShowTip(true)}
                                onMouseLeave={() => setShowTip(false)}
                                onClick={(e) => { e.stopPropagation(); setShowTip(!showTip); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: `${14 * scale}px`,
                                    height: `${14 * scale}px`,
                                    borderRadius: '50%',
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                    border: 'none',
                                    color: isDark ? '#888' : '#666',
                                    cursor: 'pointer',
                                    fontSize: `${9 * scale}px`,
                                    padding: 0,
                                    fontWeight: 'bold',
                                }}
                            >
                                i
                            </button>
                            {showTip && (
                                <div
                                    ref={infoRef}
                                    style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '0',
                                        marginBottom: `${8 * scale}px`,
                                        padding: `${8 * scale}px ${12 * scale}px`,
                                        backgroundColor: '#000000',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: `${8 * scale}px`,
                                        color: '#ffffff',
                                        fontSize: `${11 * scale}px`,
                                        width: `${180 * scale}px`,
                                        zIndex: 3005,
                                        pointerEvents: 'none',
                                    }}
                                >
                                    {tooltip}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <span style={{ fontSize: `${11 * scale}px`, opacity: 0.8 }}>
                    {formatValue ? formatValue(value) : value.toFixed(2)}
                </span>
            </div>

            {/* Bottom Row: Slider and Input Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: `${12 * scale}px` }}>
                <div
                    style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={(e) => {
                            e.stopPropagation();
                            const val = parseFloat(e.target.value);
                            onChange(val);
                        }}
                        style={{
                            width: '100%',
                            height: `${6 * scale}px`,
                            borderRadius: `${3 * scale}px`,
                            cursor: 'pointer',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            background: `linear-gradient(to right, #4a90e2 ${percentage}%, ${isDark ? '#2a2a2a' : '#e5e7eb'} ${percentage}%)`,
                            outline: 'none',
                            transition: 'background 0.1s ease-out',
                        }}
                    />
                    <style jsx>{`
            input[type='range']::-webkit-slider-thumb {
              -webkit-appearance: none;
              height: ${16 * scale}px;
              width: ${16 * scale}px;
              border-radius: 50%;
              background: #4a90e2;
              cursor: pointer;
              box-shadow: 0 0 4px rgba(0,0,0,0.3);
              border: 2px solid #ffffff;
              margin-top: 0px;
              z-index: 2;
              transition: transform 0.1s ease;
            }
            input[type='range']:active::-webkit-slider-thumb {
              transform: scale(1.15);
            }
            input[type='range']::-moz-range-thumb {
              height: ${16 * scale}px;
              width: ${16 * scale}px;
              border-radius: 50%;
              background: #4a90e2;
              cursor: pointer;
              border: 2px solid #ffffff;
              box-shadow: 0 0 4px rgba(0,0,0,0.3);
              z-index: 2;
            }
          `}</style>
                </div>
                <input
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) onChange(Math.max(min, Math.min(max, val)));
                    }}
                    style={{
                        width: `${55 * scale}px`,
                        padding: `${4 * scale}px ${6 * scale}px`,
                        backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#d1d5db'}`,
                        borderRadius: `${6 * scale}px`,
                        color: isDark ? 'white' : '#111827',
                        fontSize: inputFontSize,
                        textAlign: 'center',
                        outline: 'none',
                        MozAppearance: 'textfield',
                    }}
                />
            </div>
        </div>
    );
};
