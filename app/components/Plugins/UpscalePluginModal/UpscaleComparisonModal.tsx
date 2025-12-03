'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface UpscaleComparisonModalProps {
    originalImageUrl: string;
    upscaledImageUrl: string;
    onClose: () => void;
    scale?: number;
}

export const UpscaleComparisonModal: React.FC<UpscaleComparisonModalProps> = ({
    originalImageUrl,
    upscaledImageUrl,
    onClose,
    scale = 1,
}) => {
    const isDark = useIsDarkTheme();
    const [sliderPosition, setSliderPosition] = useState(50); // Percentage 0-100
    const [isDraggingSlider, setIsDraggingSlider] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [isSpacebarHeld, setIsSpacebarHeld] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);

    const handleSliderMouseDown = (e: React.MouseEvent) => {
        setIsDraggingSlider(true);
        e.preventDefault();
        e.stopPropagation(); // Prevent panning when starting slider drag
    };

    const handleSliderTouchStart = (e: React.TouchEvent) => {
        setIsDraggingSlider(true);
        e.stopPropagation();
    };

    // Panning handlers
    const handlePanStart = (clientX: number, clientY: number) => {
        if (zoomLevel > 1 || isSpacebarHeld) {
            setIsPanning(true);
            lastPanPointRef.current = { x: clientX, y: clientY };
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        handlePanStart(e.clientX, e.clientY);
        e.preventDefault(); // Prevent image drag behavior
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        handlePanStart(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleZoomIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoomLevel(prev => Math.min(prev + 0.5, 4));
    };

    const handleZoomOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoomLevel(prev => {
            const newZoom = Math.max(prev - 0.5, 1);
            if (newZoom === 1) {
                setPanPosition({ x: 0, y: 0 }); // Reset pan when zooming out to 1x
            }
            return newZoom;
        });
    };

    const handleResetZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
    };

    useEffect(() => {
        const handleMove = (clientX: number, clientY: number) => {
            if (isDraggingSlider && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
                const percentage = (x / rect.width) * 100;
                setSliderPosition(percentage);
            } else if (isPanning && lastPanPointRef.current) {
                const dx = clientX - lastPanPointRef.current.x;
                const dy = clientY - lastPanPointRef.current.y;
                setPanPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                lastPanPointRef.current = { x: clientX, y: clientY };
            }
        };

        const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX, e.touches[0].clientY);

        const handleEnd = () => {
            setIsDraggingSlider(false);
            setIsPanning(false);
            lastPanPointRef.current = null;
        };

        if (isDraggingSlider || isPanning) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDraggingSlider, isPanning]);

    // Handle scroll/pinch zoom
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (!containerRef.current) return;

            // Check if this is a pinch gesture (ctrlKey is set for pinch on trackpad)
            // or a regular scroll with Ctrl key held
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();

                const delta = -e.deltaY;
                const zoomIntensity = 0.002;
                const newZoom = Math.max(1, Math.min(4, zoomLevel + delta * zoomIntensity));

                setZoomLevel(newZoom);

                if (newZoom === 1) {
                    setPanPosition({ x: 0, y: 0 });
                }
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            if (container) {
                container.removeEventListener('wheel', handleWheel);
            }
        };
    }, [zoomLevel]);

    // Handle spacebar for pan mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !isSpacebarHeld) {
                e.preventDefault();
                setIsSpacebarHeld(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                setIsSpacebarHeld(false);
                setIsPanning(false);
                lastPanPointRef.current = null;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isSpacebarHeld]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                backdropFilter: 'blur(5px)',
                border: '3px solid rgba(255, 255, 255, 0.2)',
            }}
            onClick={onClose}
        >
            {/* Header / Controls */}
            <div
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 10001
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            <div
                style={{
                    color: 'white',
                    marginBottom: '20px',
                    fontSize: '18px',
                    fontWeight: 500,
                    textAlign: 'center',
                    pointerEvents: 'none',
                }}
            >
                Upscale Comparison
                <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '4px' }}>
                    {isSpacebarHeld ? 'Release Space to exit pan mode' : `Drag slider to compare • ${zoomLevel > 1 ? 'Drag to pan' : 'Hold Space or Scroll/Pinch to zoom'}`}
                </div>
            </div>

            {/* Zoom Controls */}
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '15px',
                    zIndex: 10002
                }}>
                <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        padding: '8px',
                        color: zoomLevel <= 1 ? 'rgba(255,255,255,0.3)' : 'white',
                        cursor: zoomLevel <= 1 ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ZoomOut size={20} />
                </button>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    minWidth: '40px',
                    fontWeight: 500
                }}>
                    {Math.round(zoomLevel * 100)}%
                </div>
                <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 4}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        padding: '8px',
                        color: zoomLevel >= 4 ? 'rgba(255,255,255,0.3)' : 'white',
                        cursor: zoomLevel >= 4 ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ZoomIn size={20} />
                </button>
                <button
                    onClick={handleResetZoom}
                    disabled={zoomLevel === 1}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        padding: '8px',
                        color: zoomLevel === 1 ? 'rgba(255,255,255,0.3)' : 'white',
                        cursor: zoomLevel === 1 ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: '10px'
                    }}
                    title="Reset Zoom"
                >
                    <Maximize size={20} />
                </button>
            </div>

            {/* Comparison Container */}
            <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    maxWidth: '90vw',
                    maxHeight: '80vh',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    userSelect: 'none',
                    cursor: isSpacebarHeld ? (isPanning ? 'grabbing' : 'grab') : (zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'),
                }}
            >
                {/* Base Image (Upscaled - Right Side) */}
                <img
                    src={upscaledImageUrl}
                    alt="Upscaled"
                    style={{
                        display: 'block',
                        maxWidth: '100%',
                        maxHeight: '80vh',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                        transformOrigin: 'center',
                        transition: isPanning ? 'none' : 'transform 0.2s ease-out',
                    }}
                />

                {/* Label: Upscaled (Right) */}
                <div
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(67, 126, 181, 0.9)',
                        color: 'white',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 600,
                        pointerEvents: 'none',
                        zIndex: 5, // Behind the clipped div
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }}
                >
                    Upscaled
                </div>

                {/* Overlay Image (Original - Left Side) - Clipped */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: `${sliderPosition}%`,
                        overflow: 'hidden',
                        borderRight: '2px solid white',
                        zIndex: 10,
                    }}
                >
                    <img
                        src={originalImageUrl}
                        alt="Original"
                        style={{
                            display: 'block',
                            height: '100%',
                            width: 'auto', // Should match height aspect ratio
                            maxWidth: 'none',
                            objectFit: 'contain',
                            pointerEvents: 'none',
                            transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                            transformOrigin: 'center',
                            transition: isPanning ? 'none' : 'transform 0.2s ease-out',
                        }}
                    />

                    {/* Label: Original (Left) */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '20px',
                            left: '20px',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            padding: '6px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 600,
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        }}
                    >
                        Original
                    </div>
                </div>

                {/* Slider Handle */}
                <div
                    onMouseDown={handleSliderMouseDown}
                    onTouchStart={handleSliderTouchStart}
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: `${sliderPosition}%`,
                        width: '40px',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'ew-resize',
                        zIndex: 20,
                    }}
                >
                    <div
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'white',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#333',
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8L22 12L18 16" />
                            <path d="M6 8L2 12L6 16" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
