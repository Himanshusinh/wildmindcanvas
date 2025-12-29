import React, { useState, useEffect } from 'react';

interface CanvasTextControlsProps {
    fontSize: number;
    fontWeight: string;
    fontStyle?: string;
    fontFamily?: string;
    onFontSizeChange: (size: number) => void;
    onFontWeightChange: (weight: string) => void;
    onFontStyleChange?: (style: string) => void;
    onFontFamilyChange?: (family: string) => void;
    onDelete?: () => void;
    onMoveStart?: (e: React.MouseEvent) => void;
    scale?: number; // Canvas zoom scale
}

// Common font families for text controls
const FONT_FAMILIES = [
    { name: 'Inter', family: 'Inter, sans-serif' },
    { name: 'Roboto', family: 'Roboto, sans-serif' },
    { name: 'Open Sans', family: '"Open Sans", sans-serif' },
    { name: 'Lato', family: 'Lato, sans-serif' },
    { name: 'Montserrat', family: 'Montserrat, sans-serif' },
    { name: 'Poppins', family: 'Poppins, sans-serif' },
    { name: 'Helvetica', family: 'Helvetica, sans-serif' },
    { name: 'Arial', family: 'Arial, sans-serif' },
    { name: 'Times New Roman', family: '"Times New Roman", serif' },
    { name: 'Georgia', family: 'Georgia, serif' },
    { name: 'Courier New', family: '"Courier New", monospace' },
    { name: 'Pacifico', family: 'Pacifico, cursive' },
    { name: 'Lobster', family: 'Lobster, cursive' },
];

export const CanvasTextControls: React.FC<CanvasTextControlsProps> = ({
    fontSize,
    fontWeight,
    fontStyle = 'normal',
    fontFamily = 'Inter, sans-serif',
    onFontSizeChange,
    onFontWeightChange,
    onFontStyleChange,
    onFontFamilyChange,
    onDelete,
    onMoveStart,
    scale = 1,
}) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Scale all UI elements based on zoom - ensure controls remain usable at all zoom levels
    // When scale increases (zoomed in), controls get smaller proportionally
    // When scale decreases (zoomed out), controls get larger proportionally
    const baseFontSize = 12;
    const basePadding = 6;
    const baseGap = 6;
    const baseIconSize = 16;
    const baseInputWidth = 40;
    const baseSelectMinWidth = 90;
    const baseBorderRadius = 8;
    const baseBorderWidth = 1;

    // Apply DIRECT scaling: controls scale with canvas zoom
    // When zoomed out (scale < 1), controls get smaller
    // When zoomed in (scale > 1), controls get larger
    // This ensures controls scale proportionally with canvas zoom
    const scaledFontSize = Math.max(8, Math.min(18, baseFontSize * scale));
    const scaledPadding = Math.max(2, Math.min(12, basePadding * scale));
    const scaledGap = Math.max(2, Math.min(12, baseGap * scale));
    const iconSize = Math.max(10, Math.min(22, baseIconSize * scale));
    const inputWidth = Math.max(30, Math.min(65, baseInputWidth * scale));
    const selectMinWidth = Math.max(60, Math.min(130, baseSelectMinWidth * scale));

    // Calculate top offset: fixed 4px spacing above text border, scaled with zoom
    // This creates a floating effect - controls appear 4px above the text border
    const baseSpacingFromText = 20; // Fixed 4px spacing from text border
    const spacingFromText = baseSpacingFromText * scale;
    const controlsHeight = (scaledPadding * 2) + (scaledFontSize * 1.5); // Approximate controls height
    const topOffset = controlsHeight + spacingFromText;

    const borderRadius = Math.max(4, Math.min(14, baseBorderRadius * scale));
    const borderWidth = Math.max(0.5, Math.min(2, baseBorderWidth * scale));

    return (
        <div
            data-canvas-text-controls="true"
            className="absolute flex items-center gap-1 border shadow-lg backdrop-blur-md"
            style={{
                top: `-${topOffset}px`,
                left: 0,
                zIndex: 100,
                padding: `${scaledPadding}px`,
                gap: `${scaledGap}px`,
                fontSize: `${scaledFontSize}px`,
                borderRadius: `${borderRadius}px`,
                borderWidth: `${borderWidth}px`,
                backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                borderStyle: 'solid',
                color: isDark ? '#ffffff' : '#000000',
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {/* Font Size Input */}
            <input
                type="number"
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="border outline-none focus:border-blue-500"
                style={{
                    width: `${inputWidth}px`,
                    padding: `${scaledPadding / 2}px`,
                    fontSize: `${scaledFontSize}px`,
                    borderRadius: `${borderRadius * 0.5}px`,
                    borderWidth: `${borderWidth}px`,
                    borderStyle: 'solid',
                    backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#ffffff' : '#000000',
                }}
                min="8"
                max="200"
            />

            {/* Font Family Selector */}
            {onFontFamilyChange && (
                <select
                    value={fontFamily}
                    onChange={(e) => onFontFamilyChange(e.target.value)}
                    className="border outline-none focus:border-blue-500"
                    style={{
                        minWidth: `${selectMinWidth}px`,
                        padding: `${scaledPadding / 2}px ${scaledPadding}px`,
                        fontSize: `${scaledFontSize}px`,
                        borderRadius: `${borderRadius * 0.5}px`,
                        borderWidth: `${borderWidth}px`,
                        borderStyle: 'solid',
                        backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        color: isDark ? '#ffffff' : '#000000',
                        cursor: 'pointer',
                    }}
                >
                    {FONT_FAMILIES.map((font) => (
                        <option key={font.name} value={font.family}>
                            {font.name}
                        </option>
                    ))}
                </select>
            )}

            {/* Font Weight Selector */}
            <select
                value={fontWeight}
                onChange={(e) => onFontWeightChange(e.target.value)}
                className="border outline-none focus:border-blue-500"
                style={{
                    minWidth: `${selectMinWidth * 0.7}px`,
                    padding: `${scaledPadding / 2}px ${scaledPadding}px`,
                    fontSize: `${scaledFontSize}px`,
                    borderRadius: `${borderRadius * 0.5}px`,
                    borderWidth: `${borderWidth}px`,
                    borderStyle: 'solid',
                    backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#ffffff' : '#000000',
                    cursor: 'pointer',
                }}
            >
                <option value="300">Light</option>
                <option value="normal">Regular</option>
                <option value="600">SemiBold</option>
                <option value="bold">Bold</option>
                <option value="800">ExtraBold</option>
            </select>

            {/* Font Style Selector */}
            {onFontStyleChange && (
                <select
                    value={fontStyle}
                    onChange={(e) => onFontStyleChange(e.target.value)}
                    className="border outline-none focus:border-blue-500"
                    style={{
                        minWidth: `${selectMinWidth * 0.6}px`,
                        padding: `${scaledPadding / 2}px ${scaledPadding}px`,
                        fontSize: `${scaledFontSize}px`,
                        borderRadius: `${borderRadius * 0.5}px`,
                        borderWidth: `${borderWidth}px`,
                        borderStyle: 'solid',
                        backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        color: isDark ? '#ffffff' : '#000000',
                        cursor: 'pointer',
                    }}
                >
                    <option value="normal">Normal</option>
                    <option value="italic">Italic</option>
                </select>
            )}

            {/* Move Button - Using toolbar move icon */}
            {onMoveStart && (
                <button
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onMoveStart(e);
                    }}
                    className="transition-colors cursor-move hover:opacity-80"
                    style={{
                        padding: `${scaledPadding / 2}px`,
                        borderRadius: `${borderRadius * 0.5}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title="Move Text (Click and drag)"
                >
                    <svg
                        width={iconSize}
                        height={iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            color: isDark ? '#60a5fa' : '#3b82f6',
                        }}
                    >
                        <polyline points="5 9 2 12 5 15" />
                        <polyline points="9 5 12 2 15 5" />
                        <polyline points="15 19 12 22 9 19" />
                        <polyline points="19 9 22 12 19 15" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <line x1="12" y1="2" x2="12" y2="22" />
                    </svg>
                </button>
            )}

            {/* Delete Button */}
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="transition-colors hover:opacity-80"
                    style={{
                        padding: `${scaledPadding / 2}px`,
                        borderRadius: `${borderRadius * 0.5}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title="Delete Text"
                >
                    <svg
                        width={iconSize}
                        height={iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            color: isDark ? '#f87171' : '#ef4444',
                        }}
                    >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                </button>
            )}
        </div>
    );
};
