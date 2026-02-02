'use client';

import React, { useRef, useState } from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { PluginConnectionNodes, PluginNodeShell, useCanvasModalDrag } from '../PluginComponents';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';

interface ImageEditorTriggerProps {
    id: string;
    x: number;
    y: number;
    scale: number;
    position: { x: number; y: number };
    isSelected?: boolean;
    onSelect?: () => void;
    onOpenEditor: () => void;
    onPositionChange?: (x: number, y: number) => void;
    onPositionCommit?: (x: number, y: number) => void;
    onDelete?: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    isAttachedToChat?: boolean;
    selectionOrder?: number;
}

export const ImageEditorTrigger = React.memo<ImageEditorTriggerProps>(({
    id,
    x,
    y,
    scale,
    position,
    isSelected,
    onSelect,
    onOpenEditor,
    onPositionChange,
    onPositionCommit,
    onDelete,
    onContextMenu,
    isAttachedToChat,
    selectionOrder,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDark = useIsDarkTheme();

    const screenX = x * scale + position.x;
    const screenY = y * scale + position.y;
    const width = 100;
    const height = 100;
    const screenWidth = width * scale;
    const screenHeight = height * scale;

    const { onMouseDown: handleMouseDown } = useCanvasModalDrag({
        enabled: true,
        x,
        y,
        scale,
        position,
        containerRef,
        onPositionChange,
        onPositionCommit,
        onSelect,
        onTap: () => {
            onOpenEditor();
        },
    });

    return (
        <PluginNodeShell
            modalKey="imageeditor"
            id={id}
            containerRef={containerRef}
            screenX={screenX}
            screenY={screenY}
            isHovered={isHovered}
            isSelected={Boolean(isSelected)}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onContextMenu={onContextMenu}
        >
            {isAttachedToChat && selectionOrder && (
                <div
                    className="absolute top-0 flex items-center justify-center bg-blue-500 text-white font-bold rounded-full shadow-lg z-[2002] border border-white/20 animate-in fade-in zoom-in duration-300"
                    style={{
                        left: `${-40 * scale}px`,
                        top: `${-8 * scale}px`,
                        width: `${32 * scale}px`,
                        height: `${32 * scale}px`,
                        fontSize: `${20 * scale}px`,
                        minWidth: `${32 * scale}px`,
                        minHeight: `${32 * scale}px`,
                    }}
                >
                    {selectionOrder}
                </div>
            )}
            <div
                style={{
                    position: 'relative',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                }}
            >
                <div
                    style={{
                        marginBottom: `${8 * scale}px`,
                        fontSize: `${12 * scale}px`,
                        fontWeight: 500,
                        color: isDark ? '#ffffff' : '#1a1a1a',
                        textAlign: 'center',
                        userSelect: 'none',
                        transition: 'color 0.3s ease',
                        letterSpacing: '0.2px',
                    }}
                >
                    Image Editor
                </div>

                <div
                    style={{
                        position: 'relative',
                        width: `${screenWidth}px`,
                        height: `${screenHeight}px`,
                        backgroundColor: isDark ? '#2d2d2d' : '#e5e5e5',
                        borderRadius: '50%',
                        border: `${1.5 * scale}px solid ${isSelected ? SELECTION_COLOR : isDark ? '#3a3a3a' : '#a0a0a0'
                            }`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isDark
                            ? isHovered || isSelected
                                ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.5)`
                                : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.3)`
                            : isHovered || isSelected
                                ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.2)`
                                : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.1)`,
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        transform: isHovered || isSelected ? `scale(1.03)` : 'scale(1)',
                        overflow: 'visible',
                        zIndex: 20,
                    }}
                >
                    <img
                        src="/icons/layer.png"
                        alt="Image Editor"
                        style={{
                            width: `${Math.min(screenWidth, screenHeight) * 0.45}px`,
                            height: `${Math.min(screenWidth, screenHeight) * 0.45}px`,
                            objectFit: 'contain',
                            display: 'block',
                            userSelect: 'none',
                            pointerEvents: 'none',
                            filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)',
                        }}
                    />

                    <PluginConnectionNodes
                        id={id}
                        scale={scale}
                        isHovered={isHovered}
                        isSelected={isSelected || false}
                    />
                </div>
            </div>
        </PluginNodeShell>
    );
});

ImageEditorTrigger.displayName = 'ImageEditorTrigger';
