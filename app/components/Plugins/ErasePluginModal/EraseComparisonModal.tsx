'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface EraseComparisonModalProps {
    originalImageUrl: string;
    erasedImageUrl: string;
    onClose: () => void;
    scale?: number;
}

export const EraseComparisonModal: React.FC<EraseComparisonModalProps> = ({
    originalImageUrl,
    erasedImageUrl,
    onClose,
    scale = 1,
}) => {
    const isDark = useIsDarkTheme();
    const [sliderPosition, setSliderPosition] = useState(50); // Percentage 0-100
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        e.preventDefault();
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMove = (clientX: number) => {
            if (!isDragging || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percentage = (x / rect.width) * 100;

            setSliderPosition(percentage);
        };

        const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
        const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);

        const handleEnd = () => setIsDragging(false);

        if (isDragging) {
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
    }, [isDragging]);

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
                Eraser Comparison
                <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '4px' }}>
                    Drag slider to compare
                </div>
            </div>

            {/* Comparison Container */}
            <div
                ref={containerRef}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    maxWidth: '90vw',
                    maxHeight: '80vh',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    userSelect: 'none',
                    cursor: 'ew-resize',
                }}
            >
                {/* Base Image (Erased - Right Side) */}
                <img
                    src={erasedImageUrl}
                    alt="Erased"
                    style={{
                        display: 'block',
                        maxWidth: '100%',
                        maxHeight: '80vh',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        position: 'relative',
                        zIndex: 1,
                    }}
                />

                {/* Label: Erased (Right) */}
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
                    Erased
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
                        backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0',
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
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
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
