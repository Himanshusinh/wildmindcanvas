'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

import { ConnectionNodes } from './ConnectionNodes';

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
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
    const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const hasDraggedRef = useRef(false);
    const isDark = useIsDarkTheme();

    const screenX = x * scale + position.x;
    const screenY = y * scale + position.y;
    const width = 100;
    const height = 100;
    const screenWidth = width * scale;
    const screenHeight = height * scale;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSelect) onSelect();

        dragStartPosRef.current = { x: e.clientX, y: e.clientY };
        hasDraggedRef.current = false;
        setIsDragging(true);
        dragOffset.current = {
            x: e.clientX - screenX,
            y: e.clientY - screenY
        };
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                if (dragStartPosRef.current) {
                    const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
                    const dy = Math.abs(e.clientY - dragStartPosRef.current.y);
                    if (dx > 5 || dy > 5) hasDraggedRef.current = true;
                }

                if (onPositionChange) {
                    const newScreenX = e.clientX - dragOffset.current.x;
                    const newScreenY = e.clientY - dragOffset.current.y;
                    const newCanvasX = (newScreenX - position.x) / scale;
                    const newCanvasY = (newScreenY - position.y) / scale;
                    onPositionChange(newCanvasX, newCanvasY);
                }
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (isDragging) {
                setIsDragging(false);
                if (!hasDraggedRef.current) {
                    onOpenEditor();
                } else if (onPositionCommit) {
                    const newScreenX = e.clientX - dragOffset.current.x;
                    const newScreenY = e.clientY - dragOffset.current.y;
                    const newCanvasX = (newScreenX - position.x) / scale;
                    const newCanvasY = (newScreenY - position.y) / scale;
                    onPositionCommit(newCanvasX, newCanvasY);
                }
                hasDraggedRef.current = false;
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onOpenEditor, onPositionChange, onPositionCommit, position, scale, screenX, screenY]);

    return (
        <div
            style={{
                position: 'absolute',
                left: `${screenX}px`,
                top: `${screenY}px`,
                zIndex: isHovered || isSelected ? 2001 : 2000,
                userSelect: 'none',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={handleMouseDown}
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
                {/* Label above */}
                <div style={{
                    position: 'relative',
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

                    {/* Delete button - always visible */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (onDelete) {
                                onDelete();
                            }
                        }}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            const defaultBg = isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)';
                            const defaultColor = isDark ? '#cccccc' : '#4b5563';
                            e.currentTarget.style.backgroundColor = defaultBg;
                            e.currentTarget.style.color = defaultColor;
                            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                        }}
                        style={{
                            position: 'absolute',
                            top: `${-36 * scale}px`,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: `${28 * scale}px`,
                            height: `${28 * scale}px`,
                            padding: 0,
                            backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}`,
                            borderRadius: `${8 * scale}px`,
                            color: isDark ? '#cccccc' : '#4b5563',
                            cursor: 'pointer',
                            boxShadow: `0 ${4 * scale}px ${12 * scale}px ${isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)'}`,
                            zIndex: 3001,
                            pointerEvents: 'auto',
                        }}
                        title="Delete plugin"
                    >
                        <svg
                            width={`${16 * scale}px`}
                            height={`${16 * scale}px`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                    </button>
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
                    <svg width={`${Math.min(screenWidth, screenHeight) * 0.4}px`} height={`${Math.min(screenWidth, screenHeight) * 0.4}px`} viewBox="0 0 24 24" fill="none" stroke={isDark ? '#ffffff' : '#000000'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                        <line x1="7" y1="2" x2="7" y2="22" />
                        <line x1="17" y1="2" x2="17" y2="22" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <line x1="2" y1="7" x2="7" y2="7" />
                        <line x1="2" y1="17" x2="7" y2="17" />
                        <line x1="17" y1="17" x2="22" y2="17" />
                        <line x1="17" y1="7" x2="22" y2="7" />
                    </svg>

                    <ConnectionNodes
                        id={id}
                        scale={scale}
                        isHovered={isHovered}
                        isSelected={isSelected || false}
                    />
                </div>
            </div>
        </div>
    );
};
