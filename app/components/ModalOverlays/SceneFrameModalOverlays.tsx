'use client';

import React, { useState, useEffect } from 'react';
import Konva from 'konva';
import { SceneFrame } from '@/app/components/Plugins/StoryboardPluginModal/SceneFrame';
import { ConnectionNodes } from '@/app/components/Plugins/UpscalePluginModal/ConnectionNodes';

interface SceneFrameModalState {
    id: string;
    scriptFrameId: string;
    sceneNumber: number;
    x: number;
    y: number;
    frameWidth: number;
    frameHeight: number;
    content: string;
}

interface SceneFrameModalOverlaysProps {
    sceneFrameModalStates: SceneFrameModalState[];
    onDelete?: (frameId: string) => void;
    onPositionChange?: (frameId: string, x: number, y: number) => void;
    onPositionCommit?: (frameId: string, x: number, y: number) => void;
    stageRef: React.RefObject<Konva.Stage | null>;
    scale: number;
    position: { x: number; y: number };
}

export const SceneFrameModalOverlays: React.FC<SceneFrameModalOverlaysProps> = ({
    sceneFrameModalStates,
    onDelete,
    onPositionChange,
    onPositionCommit,
    stageRef,
    scale,
    position,
}) => {
    const [isDark, setIsDark] = useState(false);

    console.log('[SceneFrameModalOverlays] Rendering with states:', sceneFrameModalStates);

    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return (
        <>
            {sceneFrameModalStates.map((frame) => (
                <SceneFrameModal
                    key={frame.id}
                    frame={frame}
                    isDark={isDark}
                    scale={scale}
                    position={position}
                    onDelete={onDelete}
                    onPositionChange={onPositionChange}
                    onPositionCommit={onPositionCommit}
                />
            ))}
        </>
    );
};

// Individual scene frame modal with dragging functionality
interface SceneFrameModalProps {
    frame: SceneFrameModalState;
    isDark: boolean;
    scale: number;
    position: { x: number; y: number };
    onDelete?: (frameId: string) => void;
    onPositionChange?: (frameId: string, x: number, y: number) => void;
    onPositionCommit?: (frameId: string, x: number, y: number) => void;
}

const SceneFrameModal: React.FC<SceneFrameModalProps> = ({
    frame,
    isDark,
    scale,
    position,
    onDelete,
    onPositionChange,
    onPositionCommit,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const containerRef = React.useRef<HTMLDivElement>(null);
    const lastCanvasPosRef = React.useRef<{ x: number; y: number } | null>(null);
    const dragStartPosRef = React.useRef<{ x: number; y: number } | null>(null);
    const hasDraggedRef = React.useRef(false);
    const activePointerIdRef = React.useRef<number | null>(null);

    const screenX = frame.x * scale + position.x;
    const screenY = frame.y * scale + position.y;
    const cardWidth = frame.frameWidth * scale;
    const cardMinHeight = frame.frameHeight * scale;
    const cardPadding = 16 * scale;
    const cardRadius = 16 * scale;
    const headerBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

    // Use pointer events for more reliable dragging (supports touch + mouse)
    const handlePointerDown = (e: React.PointerEvent) => {
        // Only handle primary button / primary touch
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        const target = e.target as HTMLElement;
        const isButton = target.tagName === 'BUTTON' || target.closest('button');
        const isConnectionNode = target.closest('[data-node-id]') || target.hasAttribute('data-node-id');
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

        // Don't drag if clicking on buttons, connection nodes, or inputs
        if (isButton || isConnectionNode || isInput) {
            return;
        }

        // Capture this pointer so we reliably receive move/up events
        try {
            (e.target as Element).setPointerCapture?.(e.pointerId);
            activePointerIdRef.current = e.pointerId;
        } catch (err) {
            // ignore if not supported
            activePointerIdRef.current = e.pointerId;
        }

        // Track initial pointer position to detect drag vs click
        dragStartPosRef.current = { x: e.clientX, y: e.clientY };
        hasDraggedRef.current = false;

        setIsDragging(true);
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
        lastCanvasPosRef.current = { x: frame.x, y: frame.y };
        e.preventDefault();
        e.stopPropagation();
    };

    // Handle drag
    useEffect(() => {
        if (!isDragging) return;

        const handlePointerMove = (e: PointerEvent) => {
            if (!containerRef.current || !onPositionChange) return;

            // Only respond to the active pointer
            const activePointerId = activePointerIdRef.current;
            if (activePointerId !== null && e.pointerId !== activePointerId) return;

            // Check if pointer moved significantly (more than 5px) to detect drag
            if (dragStartPosRef.current) {
                const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
                const dy = Math.abs(e.clientY - dragStartPosRef.current.y);
                if (dx > 5 || dy > 5) {
                    hasDraggedRef.current = true;
                    // Prevent scrolling when dragging
                    e.preventDefault();
                    e.stopPropagation();
                }
            }

            if (!hasDraggedRef.current) return;

            // Calculate new screen position
            const newScreenX = e.clientX - dragOffset.x;
            const newScreenY = e.clientY - dragOffset.y;

            // Convert screen coordinates back to canvas coordinates
            const newCanvasX = (newScreenX - position.x) / scale;
            const newCanvasY = (newScreenY - position.y) / scale;

            onPositionChange(frame.id, newCanvasX, newCanvasY);
            lastCanvasPosRef.current = { x: newCanvasX, y: newCanvasY };
        };

        const handlePointerUp = (e: PointerEvent) => {
            // Only respond to the active pointer
            const activePointerId = activePointerIdRef.current;
            if (activePointerId !== null && e.pointerId !== activePointerId) return;

            try {
                (document.elementFromPoint(e.clientX, e.clientY) as Element)?.releasePointerCapture?.(activePointerId as number);
            } catch (err) {
                // ignore
            }

            setIsDragging(false);
            dragStartPosRef.current = null;

            if (onPositionCommit && lastCanvasPosRef.current) {
                onPositionCommit(frame.id, lastCanvasPosRef.current.x, lastCanvasPosRef.current.y);
            }

            hasDraggedRef.current = false;
            activePointerIdRef.current = null;
        };

        const preventScroll = (e: Event) => {
            if (hasDraggedRef.current) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        // Capture the pointer id from the drag start ref if available
        if (dragStartPosRef.current) {
            // We don't have the pointerId here directly; rely on pointer events to set activePointerId in pointerdown handler
        }

        window.addEventListener('pointermove', handlePointerMove, { passive: false });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('wheel', preventScroll, { passive: false });
        window.addEventListener('scroll', preventScroll, { passive: false });

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('wheel', preventScroll);
            window.removeEventListener('scroll', preventScroll);
        };
    }, [isDragging, dragOffset, scale, position, onPositionChange, onPositionCommit, frame.id, frame.x, frame.y]);

    return (
        <div
            ref={containerRef}
            data-modal-component="scene-frame"
            data-overlay-id={frame.id}
            onPointerDown={handlePointerDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'absolute',
                left: `${screenX}px`,
                top: `${screenY}px`,
                zIndex: isHovered ? 2001 : 2000,
                userSelect: 'none',
                cursor: isDragging ? 'grabbing' : 'grab',
            }}
        >
            <div
                data-frame-id={`${frame.id}-frame`}
                style={{
                    position: 'relative',
                    width: `${cardWidth}px`,
                    minHeight: `${cardMinHeight}px`,
                    backgroundColor: isDark ? '#1b1b1b' : '#ffffff',
                    borderRadius: `${cardRadius}px`,
                    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`,
                    boxShadow: isDark
                        ? '0 12px 24px rgba(0,0,0,0.6)'
                        : '0 12px 24px rgba(15,23,42,0.18)',
                    padding: `${cardPadding}px`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transition: 'box-shadow 0.2s ease',
                    pointerEvents: 'auto',
                }}
            >
                <ConnectionNodes
                    id={frame.id}
                    scale={scale}
                    isHovered={isHovered}
                    isSelected={false}
                />
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: `${12 * scale}px`,
                        paddingBottom: `${6 * scale}px`,
                        borderBottom: `1px solid ${headerBorder}`,
                    }}
                >
                    <div
                        style={{
                            fontSize: `${16 * scale}px`,
                            fontWeight: 600,
                            color: isDark ? '#f8fafc' : '#0f172a',
                        }}
                    >
                        Scene {frame.sceneNumber}
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(frame.id);
                        }}
                        title="Delete scene frame"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: `${28 * scale}px`,
                            height: `${28 * scale}px`,
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: isDark ? 'rgba(248,113,113,0.15)' : 'rgba(239,68,68,0.12)',
                            color: isDark ? '#fecaca' : '#dc2626',
                            cursor: 'pointer',
                        }}
                    >
                        <svg
                            width={14 * scale}
                            height={14 * scale}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                    </button>
                </div>

                <SceneFrame
                    scale={scale}
                    sceneNumber={frame.sceneNumber}
                    sceneContent={frame.content}
                    isDark={isDark}
                />
            </div>
        </div>
    );
};
