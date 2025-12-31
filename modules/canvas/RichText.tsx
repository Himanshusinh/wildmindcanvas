import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Group, Rect, Transformer, Text } from 'react-konva';
import { Html } from 'react-konva-utils';
import Konva from 'konva';
import { CanvasTextState } from '@/modules/canvas-overlays/types';
import {
    Bold,
    Italic,
    Underline,
    Type,
    Palette,
    Highlighter,
    AlignLeft,
    AlignCenter,
    AlignRight,
    ChevronDown
} from 'lucide-react';

interface RichTextProps {
    data: CanvasTextState;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onChange: (id: string, updates: Partial<CanvasTextState>) => void;
    onInteractionStart?: () => void;
    onInteractionEnd?: () => void;
    isDarkTheme?: boolean;
}

const FONTS = [
    'Inter, sans-serif',
    'Roboto, sans-serif',
    'Montserrat, sans-serif',
    'Playfair Display, serif',
    'Courier New, monospace'
];

export const RichText: React.FC<RichTextProps> = ({
    data,
    isSelected,
    onSelect,
    onChange,
    onInteractionStart,
    onInteractionEnd,
    isDarkTheme = true,
}) => {
    const textRef = useRef<Konva.Text>(null);
    const groupRef = useRef<Konva.Group>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const [isEditing, setIsEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showFontDropdown, setShowFontDropdown] = useState(false);

    useEffect(() => {
        if (isSelected && !isEditing && trRef.current && groupRef.current) {
            trRef.current.nodes([groupRef.current]);
            trRef.current.getLayer()?.batchDraw();
        }
    }, [isSelected, isEditing]);

    // Handle close on deselect (e.g. clicking canvas background)
    useEffect(() => {
        if (!isSelected && isEditing) {
            if (textareaRef.current) {
                onChange(data.id, { text: textareaRef.current.value });
            }
            setIsEditing(false);
            setShowFontDropdown(false);
        }
    }, [isSelected, isEditing, data.id, onChange]);

    const handleDblClick = useCallback(() => {
        setIsEditing(true);
    }, []);

    // Global click listener to close editing when clicking outside
    useEffect(() => {
        if (!isEditing) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if click is inside toolbar or textarea or font dropdown
            const isToolbar = target.closest('.rich-text-toolbar');
            const isTextarea = target.classList.contains('rich-text-edit-area');
            const isDropdown = target.closest('.font-dropdown');

            if (!isToolbar && !isTextarea && !isDropdown) {
                if (textareaRef.current) {
                    onChange(data.id, { text: textareaRef.current.value });
                }
                setIsEditing(false);
                setShowFontDropdown(false);
            }
        };

        // Use mousedown to catch it early, before other actions
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [isEditing, data.id, onChange]);

    const handleBlur = useCallback((e: React.FocusEvent) => {
        // Only blur if we're not clicking inside the toolbar
        if (e.relatedTarget && (e.relatedTarget as HTMLElement).closest('.rich-text-toolbar')) {
            return;
        }
        // If we are clicking purely on the window/canvas, the HandleClickOutside might handle it, 
        // but blur is good backup for keyboard navigation or other focus shifts.
        if (textareaRef.current) {
            onChange(data.id, { text: textareaRef.current.value });
        }
        setIsEditing(false);
        setShowFontDropdown(false);
    }, [data.id, onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (textareaRef.current) {
                onChange(data.id, { text: textareaRef.current.value });
            }
            setIsEditing(false);
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
        }
    }, [data.id, onChange]);

    const handleInput = useCallback(() => {
        if (!textareaRef.current || !textRef.current) return;
        const textarea = textareaRef.current;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;

        // Update width/height in parent to keep Konva Rect synced
        onChange(data.id, {
            width: textarea.clientWidth,
            height: textarea.scrollHeight
        });
    }, [data.id, onChange]);

    const handleTransform = useCallback(() => {
        const group = groupRef.current;
        const text = textRef.current;
        if (!group || !text) return;

        const scaleX = group.scaleX();
        const scaleY = group.scaleY();
        const newWidth = Math.max(30, text.width() * scaleX);
        const newFontSize = Math.max(5, (text.fontSize() || 20) * scaleY);

        group.setAttrs({
            scaleX: 1,
            scaleY: 1,
        });

        text.setAttrs({
            width: newWidth,
            fontSize: newFontSize,
        });

        // We update the data, which triggers a re-render
        onChange(data.id, {
            x: group.x(),
            y: group.y(),
            width: newWidth,
            height: text.height(),
            fontSize: newFontSize,
        });
    }, [data.id, onChange]);

    // Focus and initial height for textarea
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
            textarea.focus();
        }
    }, [isEditing]);

    const toggleStyle = useCallback((key: keyof CanvasTextState, value: string, defaultValue: string) => {
        onChange(data.id, { [key]: (data as any)[key] === value ? defaultValue : value });
    }, [data, onChange]);

    const konvaFontStyle = `${data.fontStyle || 'normal'} ${data.fontWeight || 'normal'}`.trim();

    return (
        <>
            <Group
                ref={groupRef}
                x={data.x}
                y={data.y}
                draggable={!isEditing}
                onDragStart={onInteractionStart}
                onDragEnd={(e) => {
                    onChange(data.id, { x: e.target.x(), y: e.target.y() });
                    onInteractionEnd?.();
                }}
                onTransformStart={onInteractionStart}
                onTransform={handleTransform}
                onTransformEnd={onInteractionEnd}
                onDblClick={handleDblClick}
                onDblTap={handleDblClick}
                onClick={(e) => {
                    onSelect(data.id);
                    e.cancelBubble = true;
                }}
                onTap={(e) => {
                    onSelect(data.id);
                    e.cancelBubble = true;
                }}
            >
                {/* Background Rect for text block */}
                {data.backgroundColor && data.backgroundColor !== 'transparent' && (
                    <Rect
                        x={0}
                        y={0}
                        width={data.width || 200}
                        height={textRef.current?.height() || data.height || 50}
                        fill={data.backgroundColor}
                    />
                )}

                <Text
                    ref={textRef}
                    text={data.text || ''}
                    x={0}
                    y={0}
                    width={data.width || 200}
                    fontSize={data.fontSize || 20}
                    fontFamily={data.fontFamily || 'Inter, sans-serif'}
                    fill={data.color || '#FFFFFF'}
                    fontStyle={konvaFontStyle}
                    textDecoration={data.textDecoration || 'none'}
                    align={data.textAlign || 'left'}
                    lineHeight={1.2}
                    visible={!isEditing}
                />
            </Group>

            {isEditing && (
                <Html
                    divProps={{
                        style: {
                            pointerEvents: 'none',
                        }
                    }}
                >
                    <div style={{ pointerEvents: 'auto' }}>
                        <style>
                            {`
                            .rich-text-toolbar {
                                position: absolute;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                background: rgba(26, 26, 26, 0.95);
                                backdrop-filter: blur(10px);
                                -webkit-backdrop-filter: blur(10px);
                                border: 1px solid rgba(255, 255, 255, 0.1);
                                border-radius: 12px;
                                padding: 8px 12px;
                                z-index: 1000;
                                box-shadow: 
                                    0 4px 6px -1px rgba(0, 0, 0, 0.1),
                                    0 2px 4px -1px rgba(0, 0, 0, 0.06),
                                    0 20px 25px -5px rgba(0, 0, 0, 0.1),
                                    0 8px 10px -6px rgba(0, 0, 0, 0.1);
                                transform: translate(-50%, -115%);
                                left: ${data.x + (data.width || 200) / 2}px;
                                top: ${data.y - 10}px;
                                min-width: max-content;
                                animation: fadeIn 0.15s ease-out;
                            }
                            @keyframes fadeIn {
                                from { opacity: 0; transform: translate(-50%, -110%); }
                                to { opacity: 1; transform: translate(-50%, -115%); }
                            }
                            .toolbar-btn {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                width: 34px;
                                height: 34px;
                                border-radius: 8px;
                                border: 1px solid transparent;
                                background: transparent;
                                color: #a1a1aa;
                                cursor: pointer;
                                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                            }
                            .toolbar-btn:hover {
                                background: rgba(255, 255, 255, 0.1);
                                color: #fff;
                                border-color: rgba(255, 255, 255, 0.1);
                            }
                            .toolbar-btn.active {
                                background: #3b82f6;
                                color: #fff;
                                border-color: #2563eb;
                            }
                            .toolbar-divider {
                                width: 1px;
                                height: 24px;
                                background: rgba(255, 255, 255, 0.15);
                                margin: 0 4px;
                            }
                            .font-size-input {
                                width: 44px;
                                height: 34px;
                                background: rgba(0, 0, 0, 0.2);
                                border: 1px solid rgba(255, 255, 255, 0.1);
                                color: #fff;
                                border-radius: 6px;
                                padding: 0 8px;
                                font-size: 14px;
                                font-weight: 500;
                                text-align: center;
                                outline: none;
                                transition: all 0.2s;
                            }
                            .font-size-input:focus {
                                border-color: #3b82f6;
                                background: rgba(0, 0, 0, 0.4);
                            }
                            .font-select {
                                position: relative;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                background: rgba(0, 0, 0, 0.2);
                                border: 1px solid rgba(255, 255, 255, 0.1);
                                border-radius: 8px;
                                padding: 0 12px;
                                height: 34px;
                                cursor: pointer;
                                color: #e4e4e7;
                                font-size: 14px;
                                font-weight: 500;
                                min-width: 140px;
                                transition: all 0.2s;
                            }
                            .font-select:hover {
                                background: rgba(255, 255, 255, 0.05);
                                border-color: rgba(255, 255, 255, 0.2);
                            }
                            .font-dropdown {
                                position: absolute;
                                top: calc(100% + 8px);
                                left: 0;
                                width: 100%;
                                background: #1a1a1a;
                                border: 1px solid rgba(255, 255, 255, 0.1);
                                border-radius: 12px;
                                overflow: hidden;
                                z-index: 1001;
                                box-shadow: 
                                    0 10px 15px -3px rgba(0, 0, 0, 0.3),
                                    0 4px 6px -2px rgba(0, 0, 0, 0.2);
                                padding: 4px;
                            }
                            .font-option {
                                padding: 8px 12px;
                                cursor: pointer;
                                transition: background 0.15s;
                                color: #e4e4e7;
                                border-radius: 6px;
                                font-size: 13px;
                            }
                            .font-option:hover {
                                background: #3b82f6;
                                color: #fff;
                            }
                            .color-picker-wrapper {
                                position: relative;
                                display: flex;
                                align-items: center;
                            }
                            .color-picker-input {
                                position: absolute;
                                opacity: 0;
                                width: 100%;
                                height: 100%;
                                cursor: pointer;
                                left: 0;
                                top: 0;
                            }

                            .dark textarea.rich-text-edit-area,
                            textarea.rich-text-edit-area {
                                background-color: ${data.backgroundColor || 'transparent'} !important;
                                border: none !important;
                                outline: none !important;
                                box-shadow: none !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                -webkit-appearance: none !important;
                                appearance: none !important;
                                color: ${data.color || '#FFFFFF'} !important;
                                line-height: 1.2 !important;
                                letter-spacing: normal !important;
                            }
                            `}
                        </style>

                        <div className="rich-text-toolbar" onMouseDown={(e) => e.stopPropagation()}>
                            {/* Font Family */}
                            <div className="font-select" onClick={() => setShowFontDropdown(!showFontDropdown)}>
                                <span style={{ fontFamily: data.fontFamily }}>{data.fontFamily?.split(',')[0]}</span>
                                <ChevronDown size={14} />
                                {showFontDropdown && (
                                    <div className="font-dropdown">
                                        {FONTS.map(font => (
                                            <div
                                                key={font}
                                                className="font-option"
                                                style={{ fontFamily: font }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onChange(data.id, { fontFamily: font });
                                                    setShowFontDropdown(false);
                                                }}
                                            >
                                                {font.split(',')[0]}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="toolbar-divider" />

                            {/* Font Size */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button className="toolbar-btn" onClick={() => onChange(data.id, { fontSize: Math.max(8, (data.fontSize || 20) - 2) })}>-</button>
                                <input
                                    type="number"
                                    className="font-size-input"
                                    value={data.fontSize}
                                    onChange={(e) => onChange(data.id, { fontSize: parseInt(e.target.value) || 20 })}
                                />
                                <button className="toolbar-btn" onClick={() => onChange(data.id, { fontSize: (data.fontSize || 20) + 2 })}>+</button>
                            </div>

                            <div className="toolbar-divider" />

                            {/* Styles */}
                            <button
                                className={`toolbar-btn ${data.fontWeight === 'bold' ? 'active' : ''}`}
                                onClick={() => toggleStyle('fontWeight', 'bold', 'normal')}
                            >
                                <Bold size={18} />
                            </button>
                            <button
                                className={`toolbar-btn ${data.fontStyle === 'italic' ? 'active' : ''}`}
                                onClick={() => toggleStyle('fontStyle', 'italic', 'normal')}
                            >
                                <Italic size={18} />
                            </button>
                            <button
                                className={`toolbar-btn ${data.textDecoration === 'underline' ? 'active' : ''}`}
                                onClick={() => toggleStyle('textDecoration', 'underline', 'none')}
                            >
                                <Underline size={18} />
                            </button>

                            <div className="toolbar-divider" />

                            {/* Alignment */}
                            <button
                                className={`toolbar-btn ${data.textAlign === 'left' ? 'active' : ''}`}
                                onClick={() => onChange(data.id, { textAlign: 'left' })}
                            >
                                <AlignLeft size={18} />
                            </button>
                            <button
                                className={`toolbar-btn ${data.textAlign === 'center' ? 'active' : ''}`}
                                onClick={() => onChange(data.id, { textAlign: 'center' })}
                            >
                                <AlignCenter size={18} />
                            </button>
                            <button
                                className={`toolbar-btn ${data.textAlign === 'right' ? 'active' : ''}`}
                                onClick={() => onChange(data.id, { textAlign: 'right' })}
                            >
                                <AlignRight size={18} />
                            </button>

                            <div className="toolbar-divider" />

                            {/* Colors */}
                            <div className="color-picker-wrapper">
                                <button className="toolbar-btn" title="Text Color">
                                    <Palette size={18} style={{ color: data.color }} />
                                    <input
                                        type="color"
                                        className="color-picker-input"
                                        value={data.color || '#FFFFFF'}
                                        onChange={(e) => onChange(data.id, { color: e.target.value })}
                                    />
                                </button>
                            </div>
                            <div className="color-picker-wrapper">
                                <button className="toolbar-btn" title="Background Color">
                                    <Highlighter size={18} style={{ color: data.backgroundColor === 'transparent' ? '#ccc' : data.backgroundColor }} />
                                    <input
                                        type="color"
                                        className="color-picker-input"
                                        value={data.backgroundColor === 'transparent' ? '#000000' : data.backgroundColor}
                                        onChange={(e) => onChange(data.id, { backgroundColor: e.target.value })}
                                    />
                                </button>
                                {data.backgroundColor && data.backgroundColor !== 'transparent' && (
                                    <button
                                        className="toolbar-btn"
                                        style={{ fontSize: '14px', marginLeft: '-8px', width: '20px' }}
                                        onClick={() => onChange(data.id, { backgroundColor: 'transparent' })}
                                        title="Remove Background"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>

                        <textarea
                            ref={textareaRef}
                            className="rich-text-edit-area"
                            defaultValue={data.text}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            onInput={handleInput}
                            style={{
                                position: 'absolute',
                                top: `${data.y}px`,
                                left: `${data.x}px`,
                                width: `${(data.width || 200)}px`,
                                fontSize: `${data.fontSize || 20}px`,
                                fontFamily: data.fontFamily || 'Inter, sans-serif',
                                fontWeight: data.fontWeight || 'normal',
                                fontStyle: data.fontStyle || 'normal',
                                textDecoration: data.textDecoration || 'none',
                                textAlign: (data.textAlign as any) || 'left',
                                resize: 'none',
                                overflow: 'hidden',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: '1.2',
                            }}
                        />
                    </div>
                </Html>
            )}

            {isSelected && !isEditing && (
                <Transformer
                    ref={trRef}
                    rotateEnabled={false}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 30) return oldBox;
                        return newBox;
                    }}
                />
            )}
        </>
    );
};
