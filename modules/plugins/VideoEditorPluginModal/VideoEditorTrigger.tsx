'use client';

import React, { useState, useRef } from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { PluginConnectionNodes, PluginNodeShell, useCanvasModalDrag } from '../PluginComponents';

interface VideoEditorTriggerProps {
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
}

export const VideoEditorTrigger: React.FC<VideoEditorTriggerProps> = ({
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
        onTap: () => onOpenEditor(),
    });

    return (
        <PluginNodeShell
            modalKey="videoeditor"
            id={id}
            containerRef={containerRef}
            screenX={screenX}
            screenY={screenY}
            isHovered={isHovered}
            isSelected={Boolean(isSelected)}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
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
                {/* Label */}
                <div style={{
                    marginBottom: `${8 * scale}px`,
                    fontSize: `${12 * scale}px`,
                    fontWeight: 500,
                    color: isDark ? '#ffffff' : '#1a1a1a',
                    textAlign: 'center',
                    userSelect: 'none',
                    transition: 'color 0.3s ease',
                    letterSpacing: '0.2px',
                }}>
                    Video Editor
                </div>

                {/* Main plugin container - Circular */}
                <div
                    style={{
                        position: 'relative',
                        width: `${screenWidth}px`,
                        height: `${screenHeight}px`,
                        backgroundColor: isDark ? '#2d2d2d' : '#e5e5e5',
                        borderRadius: '50%',
                        border: `${1.5 * scale}px solid ${isSelected ? '#437eb5' : (isDark ? '#3a3a3a' : '#a0a0a0')}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isDark
                            ? (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.3)`)
                            : (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.2)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.1)`),
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        transform: (isHovered || isSelected) ? `scale(1.03)` : 'scale(1)',
                        overflow: 'visible',
                        zIndex: 20,
                    }}
                >
                    {/* Video Editor Icon */}
                    <img
                        src="/icons/video-editor.svg"
                        alt="Video Editor"
                        style={{
                            width: `${Math.min(screenWidth, screenHeight) * 0.4}px`,
                            height: `${Math.min(screenWidth, screenHeight) * 0.4}px`,
                            objectFit: 'contain',
                            display: 'block',
                            userSelect: 'none',
                            pointerEvents: 'none',
                            filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)',

                        }}
                        onError={(e) => {
                            console.error('[VideoEditorTrigger] Failed to load video-editor.svg icon');
                            // Fallback to inline SVG
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.insertAdjacentHTML('afterend', `
                                <svg width="${Math.min(screenWidth, screenHeight) * 0.4}px" height="${Math.min(screenWidth, screenHeight) * 0.4}px" viewBox="0 0 24 24" fill="none" stroke="${isDark ? '#ffffff' : '#000000'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: block; user-select: none; pointer-events: none;">
                                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                                    <line x1="7" y1="2" x2="7" y2="22" />
                                    <line x1="17" y1="2" x2="17" y2="22" />
                                    <line x1="2" y1="12" x2="22" y2="12" />
                                    <line x1="2" y1="7" x2="7" y2="7" />
                                    <line x1="2" y1="17" x2="7" y2="17" />
                                    <line x1="17" y1="17" x2="22" y2="17" />
                                    <line x1="17" y1="7" x2="22" y2="7" />
                                </svg>
                            `);
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
};
