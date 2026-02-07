'use client';

import { useEffect, useRef, useState } from 'react';
import { Group, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { VideoModalState } from '@/modules/canvas-overlays/types';
import { buildProxyMediaUrl } from '@/core/api/proxyUtils';
import { useCanvasCoordinates } from './hooks/useCanvasCoordinates';

// Global registry for video elements to allow external control (from HTML overlays)
if (typeof window !== 'undefined') {
    (window as any).__CANVAS_VIDEOS_MAP = (window as any).__CANVAS_VIDEOS_MAP || {};
}

// Helper to calculate aspect ratio string
const calculateAspectRatio = (width: number, height: number): string => {
    const gcd = (a: number, b: number): number => {
        return b === 0 ? a : gcd(b, a % b);
    };
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
};

interface CanvasVideoNodeProps {
    videoState: VideoModalState;
    index: number;
    onUpdate?: (updates: Partial<VideoModalState>) => void;
    onSelect?: (e?: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }) => void;
    isSelected?: boolean;
    stageRef?: React.RefObject<any>;
    position?: { x: number; y: number };
    scale?: number;
    isDraggable?: boolean;
}

export const CanvasVideoNode: React.FC<CanvasVideoNodeProps> = ({
    videoState,
    index,
    onUpdate,
    onSelect,
    isSelected,
    stageRef,
    position = { x: 0, y: 0 },
    scale = 1,
    isDraggable = true,
}) => {
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [currentX, setCurrentX] = useState(videoState.x || 50);
    const [currentY, setCurrentY] = useState(videoState.y || 50);
    const imageRef = useRef<Konva.Image>(null);
    const animRef = useRef<number | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const groupRef = useRef<Konva.Group>(null);
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const currentPositionRef = useRef<{ x: number; y: number }>({ x: videoState.x || 50, y: videoState.y || 50 });
    const justFinishedDragRef = useRef(false);
    const { screenToCanvas } = useCanvasCoordinates({ position, scale });

    // Register/Unregister video element
    useEffect(() => {
        if (videoElement && videoState.id) {
            (window as any).__CANVAS_VIDEOS_MAP[videoState.id] = videoElement;
        }
        return () => {
            if (videoState.id) {
                delete (window as any).__CANVAS_VIDEOS_MAP[videoState.id];
            }
        };
    }, [videoElement, videoState.id]);

    // Sync position from parent when not dragging
    useEffect(() => {
        if (isDragging || justFinishedDragRef.current) return;
        const incomingX = videoState.x || 50;
        const incomingY = videoState.y || 50;
        setCurrentX(incomingX);
        setCurrentY(incomingY);
        currentPositionRef.current = { x: incomingX, y: incomingY };
    }, [videoState.x, videoState.y, isDragging]);

    // Manual drag handling (same pattern as music modal)
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent | TouchEvent) => {
            const stage = stageRef?.current;
            if (!stage) return;

            stage.setPointersPositions(e as any);
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const { x: worldX, y: worldY } = screenToCanvas(pointer);
            const newX = worldX - dragOffsetRef.current.x;
            const newY = worldY - dragOffsetRef.current.y;

            setCurrentX(newX);
            setCurrentY(newY);
            currentPositionRef.current = { x: newX, y: newY };
        };

        const handleMouseUp = () => {
            if (!isDragging) return;

            const finalX = currentPositionRef.current.x;
            const finalY = currentPositionRef.current.y;

            setIsDragging(false);
            justFinishedDragRef.current = true;

            onUpdate?.({ x: finalX, y: finalY });

            setTimeout(() => {
                justFinishedDragRef.current = false;
            }, 50);
        };

        window.addEventListener('mousemove', handleMouseMove, true);
        window.addEventListener('mouseup', handleMouseUp, true);
        window.addEventListener('touchmove', handleMouseMove, { capture: true, passive: false });
        window.addEventListener('touchend', handleMouseUp, true);
        window.addEventListener('touchcancel', handleMouseUp, true);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove, true);
            window.removeEventListener('mouseup', handleMouseUp, true);
            window.removeEventListener('touchmove', handleMouseMove, true as any);
            window.removeEventListener('touchend', handleMouseUp, true);
            window.removeEventListener('touchcancel', handleMouseUp, true);
        };
    }, [isDragging, position.x, position.y, scale, onUpdate, stageRef, screenToCanvas]);

    useEffect(() => {
        let mounted = true;
        const rawUrl = videoState.generatedVideoUrl;
        // Apply proxy utility to allow loading from external sources/CORS
        // Robustly handles unwrapping of existing proxies to prevent double-proxying
        const url = rawUrl ? buildProxyMediaUrl(rawUrl) : null;

        if (url) {
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.src = url;
            video.muted = false;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'auto'; // Change to auto to ensure it loads

            video.onloadedmetadata = () => {
                if (!mounted) return;

                // Auto-detect and update aspect ratio if needed
                if (onUpdate) {
                    const vW = video.videoWidth;
                    const vH = video.videoHeight;
                    const currentWidth = videoState.frameWidth || 600;
                    const targetHeight = (vH / vW) * currentWidth;

                    // Check if dimensions or aspect ratio mismatch (with small tolerance)
                    const heightMismatch = !videoState.frameHeight || Math.abs(videoState.frameHeight - targetHeight) > 1;

                    if (heightMismatch) {
                        const ratioString = calculateAspectRatio(vW, vH);
                        onUpdate({
                            frameWidth: currentWidth,
                            frameHeight: targetHeight,
                            aspectRatio: ratioString
                        });
                    }
                }

                video.pause();
                video.currentTime = 0;
                setVideoElement(video);
                videoRef.current = video;

                // imageRef is null here because we haven't rendered with videoElement yet
                // The animation loop effect will pick it up once rendered
            };

            // Also handle oncanplay in case metadata loaded doesn't fire for some cached videos
            video.oncanplay = () => {
                if (!videoElement && mounted) {
                    setVideoElement(video);
                    videoRef.current = video;
                }
            }

            video.onplay = () => {
                if (mounted) setIsPlaying(true);
            };

            video.onpause = () => {
                if (mounted) setIsPlaying(false);
            };

            video.onended = () => {
                if (mounted) setIsPlaying(false);
            };

            video.onerror = (e) => {
                if (!mounted) return;
                const errorDetail = video.error ? {
                    code: video.error.code,
                    message: video.error.message
                } : 'unknown';
                console.error('[CanvasVideoNode] Video load error:', {
                    id: videoState.id,
                    url: url,
                    errorDetail,
                    // nativeEvent: e // serializing event often results in {}
                });
            };

            return () => {
                mounted = false;
                video.pause();
                video.src = '';
                if (videoState.id) {
                    delete (window as any).__CANVAS_VIDEOS_MAP[videoState.id];
                }
            };
        }
    }, [videoState.generatedVideoUrl]); // Removed videoState dependency to avoid loop, dependent on URL only

    // Animation loop
    useEffect(() => {
        if (videoElement && imageRef.current && isPlaying) {
            const layer = imageRef.current.getLayer();
            const anim = () => {
                if (videoElement && !videoElement.paused && !videoElement.ended) {
                    layer?.batchDraw();
                    animRef.current = requestAnimationFrame(anim);
                }
            };
            anim();
            return () => {
                if (animRef.current) cancelAnimationFrame(animRef.current);
            };
        }
    }, [isPlaying, videoElement]);

    const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // Prevent selecting if we are dragging
        if (e.target.getStage()?.isDragging()) return;

        if (onSelect) {
            onSelect({
                ctrlKey: e.evt.ctrlKey,
                metaKey: e.evt.metaKey,
                shiftKey: e.evt.shiftKey,
            });
        }
    };

    if (!videoElement) return null;

    return (
        <Group
            id={videoState.id}
            ref={groupRef}
            x={currentX}
            y={currentY}
            draggable={false}
            onMouseDown={(e) => {
                if (!isDraggable) return;
                if (e.evt.button !== undefined && e.evt.button !== 0) return;

                const stage = stageRef?.current;
                if (!stage) return;

                stage.setPointersPositions(e.evt);
                const pointer = stage.getPointerPosition();
                if (!pointer) return;

                const { x: worldX, y: worldY } = screenToCanvas(pointer);
                dragOffsetRef.current = { x: worldX - currentX, y: worldY - currentY };

                setIsDragging(true);
            }}
            onTouchStart={(e) => {
                if (!isDraggable) return;

                const stage = stageRef?.current;
                if (!stage) return;

                stage.setPointersPositions(e.evt);
                const pointer = stage.getPointerPosition();
                if (!pointer) return;

                const { x: worldX, y: worldY } = screenToCanvas(pointer);
                dragOffsetRef.current = { x: worldX - currentX, y: worldY - currentY };

                setIsDragging(true);
            }}
            onClick={handleClick}
            onTap={handleClick}
        >
            <KonvaImage
                ref={imageRef}
                image={videoElement}
                width={videoState.frameWidth || 600}
                height={videoState.frameHeight || 400} // Default fallback
                stroke={isSelected ? '#4C83FF' : 'transparent'}
                strokeWidth={2}
                cornerRadius={16} // Match CSS border radius
            />
        </Group>
    );
};
