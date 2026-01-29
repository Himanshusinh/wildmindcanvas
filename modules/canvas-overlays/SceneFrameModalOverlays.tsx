'use client';

import React, { useState, useEffect } from 'react';
import Konva from 'konva';
import { SceneFrame } from '@/modules/plugins/StoryboardPluginModal/SceneFrame';
import { PluginConnectionNodes } from '@/modules/plugins/PluginComponents';
import { ModalActionIcons } from '@/modules/ui-global/common/ModalActionIcons';

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
    onDuplicate?: (frameId: string) => void;
    onContentUpdate?: (frameId: string, content: string) => void;
    onPositionChange?: (frameId: string, x: number, y: number) => void;
    onPositionCommit?: (frameId: string, x: number, y: number) => void;
    stageRef: React.RefObject<Konva.Stage | null>;
    scale: number;
    position: { x: number; y: number };
    clearAllSelections: () => void;
}

export const SceneFrameModalOverlays: React.FC<SceneFrameModalOverlaysProps> = ({
    sceneFrameModalStates,
    onDelete,
    onDuplicate,
    onContentUpdate,
    onPositionChange,
    onPositionCommit,
    stageRef,
    scale,
    position,
    clearAllSelections,
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
                    onDuplicate={onDuplicate}
                    onContentUpdate={onContentUpdate}
                    onPositionChange={onPositionChange}
                    onPositionCommit={onPositionCommit}
                    clearAllSelections={clearAllSelections}
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
    onDuplicate?: (frameId: string) => void;
    onContentUpdate?: (frameId: string, content: string) => void;
    onPositionChange?: (frameId: string, x: number, y: number) => void;
    onPositionCommit?: (frameId: string, x: number, y: number) => void;
    clearAllSelections: () => void;
}

const SceneFrameModal: React.FC<SceneFrameModalProps> = ({
    frame,
    isDark,
    scale,
    position,
    onDelete,
    onDuplicate,
    onContentUpdate,
    onPositionChange,
    onPositionCommit,
    clearAllSelections,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isSelected, setIsSelected] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(frame.content);
    const [copied, setCopied] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const containerRef = React.useRef<HTMLDivElement>(null);
    const lastCanvasPosRef = React.useRef<{ x: number; y: number } | null>(null);
    const dragStartPosRef = React.useRef<{ x: number; y: number } | null>(null);
    const hasDraggedRef = React.useRef(false);
    const activePointerIdRef = React.useRef<number | null>(null);

    useEffect(() => {
        if (!isEditing) {
            setEditContent(frame.content);
        }
    }, [frame.content, isEditing]);

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

        clearAllSelections();
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

    useEffect(() => {
        const handleClear = () => setIsSelected(false);
        window.addEventListener('canvas-clear-selection', handleClear as any);
        return () => window.removeEventListener('canvas-clear-selection', handleClear as any);
    }, []);

    useEffect(() => {
        const handleDocumentClick = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setIsSelected(false);
            }
        };
        document.addEventListener('mousedown', handleDocumentClick);
        return () => document.removeEventListener('mousedown', handleDocumentClick);
    }, []);

    return (
        <div
            ref={containerRef}
            data-modal-component="scene-frame"
            data-overlay-id={frame.id}
            onPointerDown={handlePointerDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
                e.stopPropagation();
                setIsSelected(true);
            }}
            style={{
                position: 'absolute',
                left: `${screenX}px`,
                top: `${screenY}px`,
                zIndex: isHovered || isSelected ? 2001 : 2000,
                userSelect: 'none',
                cursor: isDragging ? 'grabbing' : 'grab',
            }}
            tabIndex={0}
            onBlur={(e) => {
                if (!containerRef.current?.contains(e.relatedTarget as Node)) {
                    setIsSelected(false);
                }
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
                    border: isSelected ? `${2 * scale}px solid #4C83FF` : `1.5px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`,
                    boxShadow: isSelected
                        ? '0 0 0 3px rgba(67, 126, 181, 0.25)'
                        : isDark
                            ? '0 12px 24px rgba(0,0,0,0.6)'
                            : '0 12px 24px rgba(15,23,42,0.18)',
                    padding: `${cardPadding}px`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transition: 'box-shadow 0.2s ease, border 0.2s ease',
                    pointerEvents: 'auto',
                }}
            >
                <PluginConnectionNodes
                    id={frame.id}
                    scale={scale}
                    isHovered={isHovered}
                    isSelected={isSelected}
                />
                <ModalActionIcons
                    isSelected={isSelected}
                    scale={scale}
                    onDelete={() => onDelete?.(frame.id)}
                    onCopy={() => {
                        try {
                            navigator.clipboard.writeText(frame.content || '');
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                        } catch (err) {
                            console.warn('Scene copy failed', err);
                        }
                    }}
                    onEdit={() => setIsEditing(prev => !prev)}
                    editActive={isEditing}
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
                        {copied && (
                            <span
                                style={{
                                    fontSize: `${11 * scale}px`,
                                    color: isDark ? '#a7f3d0' : '#047857',
                                    marginLeft: `${8 * scale}px`,
                                }}
                            >
                                Copied!
                            </span>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: `${10 * scale}px`,
                        }}
                    >
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            placeholder="Describe the scene details..."
                            style={{
                                width: '100%',
                                minHeight: `${160 * scale}px`,
                                fontSize: `${13 * scale}px`,
                                lineHeight: `${20 * scale}px`,
                                color: isDark ? '#f8fafc' : '#0f172a',
                                backgroundColor: isDark ? 'rgba(15,15,15,0.9)' : '#f8fafc',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                                borderRadius: `${8 * scale}px`,
                                padding: `${12 * scale}px`,
                                resize: 'vertical',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                            }}
                        />
                        <div style={{ display: 'flex', gap: `${8 * scale}px` }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onContentUpdate?.(frame.id, editContent);
                                    setIsEditing(false);
                                }}
                                style={{
                                    padding: `${6 * scale}px ${12 * scale}px`,
                                    borderRadius: `${6 * scale}px`,
                                    border: 'none',
                                    backgroundColor: '#2563eb',
                                    color: '#ffffff',
                                    fontSize: `${12 * scale}px`,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Save
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditContent(frame.content);
                                    setIsEditing(false);
                                }}
                                style={{
                                    padding: `${6 * scale}px ${12 * scale}px`,
                                    borderRadius: `${6 * scale}px`,
                                    border: 'none',
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)',
                                    color: isDark ? '#f8fafc' : '#0f172a',
                                    fontSize: `${12 * scale}px`,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <SceneFrame
                        scale={scale}
                        sceneNumber={frame.sceneNumber}
                        sceneContent={frame.content}
                        isDark={isDark}
                    />
                )}
            </div>
        </div>
    );
};
