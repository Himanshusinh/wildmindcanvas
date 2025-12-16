'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '../../common/canvasCaptureGuard';
import { MultiangleControls } from './MultiangleControls';
import { MultiangleImageFrame } from './MultiangleImageFrame';
import { ConnectionNodes } from './ConnectionNodes';
import { useCanvasModalDrag } from '../PluginComponents/useCanvasModalDrag';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';
import { useCanvasFrameDim, useConnectedSourceImage, useLatestRef, usePersistedPopupState } from '../PluginComponents';
import { PluginNodeShell } from '../PluginComponents';

interface MultianglePluginModalProps {
    isOpen: boolean;
    isExpanded?: boolean;
    id?: string;
    onClose: () => void;
    multiangleImageUrl?: string | null;
    isProcessing?: boolean;
    stageRef: React.RefObject<any>;
    scale: number;
    position: { x: number; y: number };
    x: number;
    y: number;
    onPositionChange?: (x: number, y: number) => void;
    onPositionCommit?: (x: number, y: number) => void;
    onSelect?: () => void;
    onDelete?: () => void;
    onDownload?: () => void;
    onDuplicate?: () => void;
    isSelected?: boolean;
    initialSourceImageUrl?: string | null;
    initialLocalMultiangleImageUrl?: string | null;
    onOptionsChange?: (opts: { sourceImageUrl?: string | null; localMultiangleImageUrl?: string | null; isProcessing?: boolean }) => void;
    onUpdateModalState?: (modalId: string, updates: { multiangleImageUrl?: string | null; isProcessing?: boolean; isExpanded?: boolean }) => void;
    connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
    imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
    images?: Array<{ elementId?: string; url?: string; type?: string }>;
    onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
    onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
    onUpdateImageModalState?: (modalId: string, updates: Partial<{ generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }>) => void;
}

export const MultianglePluginModal: React.FC<MultianglePluginModalProps> = ({
    isOpen,
    isExpanded,
    id,
    onClose,
    multiangleImageUrl,
    isProcessing: externalIsProcessing,
    stageRef,
    scale,
    position,
    x,
    y,
    onPositionChange,
    onPositionCommit,
    onSelect,
    onDelete,
    onDownload,
    onDuplicate,
    isSelected,
    initialSourceImageUrl,
    initialLocalMultiangleImageUrl,
    onOptionsChange,
    onUpdateModalState,
    connections = [],
    imageModalStates = [],
    images = [],
    onPersistConnectorCreate,
    onPersistImageModalCreate,
    onUpdateImageModalState,
}) => {
    // ... (existing state) ...
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { isDimmed, setIsDimmed } = useCanvasFrameDim(id);
    const { isPopupOpen, togglePopup } = usePersistedPopupState({ isExpanded, id, onUpdateModalState, defaultOpen: false });
    const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(initialSourceImageUrl ?? null);
    const [localMultiangleImageUrl, setLocalMultiangleImageUrl] = useState<string | null>(initialLocalMultiangleImageUrl ?? null);
    const onOptionsChangeRef = useLatestRef(onOptionsChange);
    const [rotateDegrees, setRotateDegrees] = useState(0);
    const [prompt, setPrompt] = useState<string>('');
    const [loraScale, setLoraScale] = useState<number>(2.0);

    // Sync external isProcessing state
    useEffect(() => {
        if (externalIsProcessing !== undefined) {
            setIsProcessing(externalIsProcessing);
        }
    }, [externalIsProcessing]);

    const isDark = useIsDarkTheme();
    const circleDiameter = 100 * scale;
    const controlsWidthPx = `${400 * scale}px`;
    const overlapRatio = 0.3;
    const popupOverlap = Math.max(0, (circleDiameter * overlapRatio) - (8 * scale));
    const frameBorderColor = isDark ? '#3a3a3a' : '#a0a0a0';
    const frameBorderWidth = 2;

    const connectedImageSource = useConnectedSourceImage({ id, connections, imageModalStates, images });

    // Handle source image updates from connections
    useEffect(() => {
        if (connectedImageSource && connectedImageSource !== sourceImageUrl) {
            setSourceImageUrl(connectedImageSource);
            // Clear dimming when image is connected
            setIsDimmed(false);
            if (onOptionsChangeRef.current && connectedImageSource !== initialSourceImageUrl) {
                onOptionsChangeRef.current({ sourceImageUrl: connectedImageSource });
            }
        }
    }, [connectedImageSource, initialSourceImageUrl, sourceImageUrl]);

    const { isDragging: isDraggingContainer, onMouseDown: handleMouseDown } = useCanvasModalDrag({
        enabled: isOpen,
        x,
        y,
        scale,
        position,
        containerRef,
        onPositionChange,
        onPositionCommit,
        onSelect,
        onTap: () => togglePopup(),
    });

    // Handle Generate Action
    const handleGenerate = async (params?: any) => {
        if (!sourceImageUrl || !id) return;

        // Prevent double submission
        if (isProcessing) return;

        setIsProcessing(true);
        if (onUpdateModalState) onUpdateModalState(id, { isProcessing: true });

        console.log('[Multiangle] Generating for:', sourceImageUrl, 'with params:', params);

        // 1. Create a new image modal placeholder immediately (Optimistic UI)
        // Similar to UpscalePluginModal
        const newModalId = `image-multiangle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const frameWidth = 600;
        const frameHeight = 600;
        const offsetX = 400 * scale + 50; // Place it to the right
        const targetX = x + (offsetX / scale); // Convert back to canvas coords if X is canvas coord
        const targetY = y;

        if (onPersistImageModalCreate) {
            onPersistImageModalCreate({
                id: newModalId,
                x: targetX,
                y: targetY,
                generatedImageUrl: null,
                frameWidth,
                frameHeight,
                model: 'Multiangle',
                frame: 'Frame', // Media frame style
                aspectRatio: params?.aspect_ratio || '1:1',
                prompt: params ? JSON.stringify(params) : '', // Store params as prompt/metadata if needed
                isGenerating: true, // Show loading spinner
            });
        }

        // 2. Connect the plugin to the new frame
        if (onPersistConnectorCreate && id) {
            onPersistConnectorCreate({
                from: id,
                to: newModalId,
                color: '#437eb5',
                fromX: x + (100 * scale) + 20, // Approx exit point
                fromY: y + (50 * scale),
                toX: targetX,
                toY: targetY + (frameHeight / 2),
                fromAnchor: 'send',
                toAnchor: 'receive',
            });
        }

        try {
            const res = await fetch('/api/replicate/multiangle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: sourceImageUrl,
                    go_fast: false, // Legacy fallback
                    prompt,
                    lora_scale: loraScale,
                    ...params // Spread new params: rotate_degrees, move_forward, etc.
                }),
            });

            // Check if response is JSON
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Generation failed');
            if (data.responseStatus !== 'success') throw new Error(data.message || 'Generation failed');

            const resultImages = data.data?.images || [];
            if (!resultImages.length) throw new Error('No images returned');

            const finalUrl = resultImages[0].url;
            if (onUpdateImageModalState) {
                onUpdateImageModalState(newModalId, {
                    generatedImageUrl: finalUrl,
                    isGenerating: false,
                });
            }
        } catch (e) {
            console.error('[Multiangle] Error:', e);
            if (onUpdateImageModalState) {
                onUpdateImageModalState(newModalId, {
                    isGenerating: false,
                });
            }
        } finally {
            setIsProcessing(false);
            if (onUpdateModalState) onUpdateModalState(id, { isProcessing: false });
        }
    };

    if (!isOpen) return null;

    const screenX = x * scale + position.x;
    const screenY = y * scale + position.y;

    return (
        <PluginNodeShell
            modalKey=".multiangle"
            id={id}
            containerRef={containerRef}
            screenX={screenX}
            screenY={screenY}
            isHovered={isHovered}
            isSelected={Boolean(isSelected)}
            isDimmed={isDimmed}
            onMouseDown={handleMouseDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Plugin node design with icon and label */}
            <div
                data-frame-id={id ? `${id}-frame` : undefined}
                style={{
                    position: 'relative',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseDown={handleMouseDown}
            >
                {/* Label above */}
                <div
                    style={{
                        position: 'relative',
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
                    Multiangle Camara

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
                        width: `${100 * scale}px`,
                        height: `${100 * scale}px`,
                        backgroundColor: isDark ? '#2d2d2d' : '#e5e5e5',
                        borderRadius: '50%',
                        border: `${1.5 * scale}px solid ${isSelected ? '#437eb5' : (isDark ? '#3a3a3a' : '#a0a0a0')}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'opacity 0.2s ease, box-shadow 0.2s ease',
                        boxShadow: isDark
                            ? (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.3)`)
                            : (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.2)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.1)`),
                        transform: (isHovered || isSelected) ? `scale(1.03)` : 'scale(1)',
                        overflow: 'visible',
                        zIndex: 20,
                    }}
                >
                    {/* Multiangle Icon */}
                    <img
                        src="/icons/multiangle.svg"
                        alt="Multiangle"
                        style={{
                            width: `${40 * scale}px`,
                            height: `${40 * scale}px`,
                            objectFit: 'contain',
                            display: 'block',
                            userSelect: 'none',
                            pointerEvents: 'none',
                            filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)',
                            transition: 'filter 0.3s ease',
                        }}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />

                    <ConnectionNodes
                        id={id}
                        scale={scale}
                        isHovered={isHovered}
                        isSelected={isSelected || false}
                    />
                </div>

                {/* Controls shown/hidden on click */}
                {isPopupOpen && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: `translateX(-50%) scale(${scale})`,
                            transformOrigin: 'top center',
                            marginTop: `${-popupOverlap}px`,
                            zIndex: 15,
                            width: '400px', // Fixed base width
                            maxWidth: '90vw',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                gap: 0,
                            }}
                        >
                            <MultiangleControls
                                scale={1} // Base scale
                                isProcessing={isProcessing}
                                sourceImageUrl={sourceImageUrl}
                                frameBorderColor={frameBorderColor}
                                frameBorderWidth={frameBorderWidth} // Pass unscaled? No parent scales it.
                                onGenerate={handleGenerate}
                                onHoverChange={setIsHovered}
                                extraTopPadding={(popupOverlap / scale) + 16} // Convert to base pixels
                                rotateDegrees={rotateDegrees}
                                onRotateChange={setRotateDegrees}
                                prompt={prompt}
                                onPromptChange={setPrompt}
                                loraScale={loraScale}
                                onLoraScaleChange={setLoraScale}
                            />

                            {/* Image Preview - Simplified without connection nodes */}
                            <div
                                style={{
                                    width: '400px', // Base width
                                    // Removed transform here
                                    minHeight: '150px',
                                    maxHeight: '400px',
                                    height: sourceImageUrl ? '220px' : 'auto',
                                    backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    borderRadius: '0 0 16px 16px',
                                    border: `${frameBorderWidth}px solid ${frameBorderColor}`, // Border width effectively scaled by parent
                                    borderTop: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    padding: '16px',
                                    marginTop: '-1px', // Base pixel overlap
                                }}
                            >
                                {sourceImageUrl ? (
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            perspective: '1000px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <img
                                            src={sourceImageUrl}
                                            alt="Preview"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                objectFit: 'contain',
                                                borderRadius: '8px',
                                                transform: `rotateY(${rotateDegrees}deg)`, // Direct rotation based on user feedback
                                                transition: 'transform 0.1s ease-out',
                                                transformStyle: 'preserve-3d',
                                                boxShadow: Math.abs(rotateDegrees) > 5 ? '0 10px 30px rgba(0,0,0,0.2)' : 'none',
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', opacity: 0.5, fontSize: '12px', color: isDark ? '#fff' : '#000' }}>
                                        No Image Connected
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PluginNodeShell>
    );
};
