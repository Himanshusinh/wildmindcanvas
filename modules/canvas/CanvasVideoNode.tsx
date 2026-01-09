'use client';

import { useEffect, useRef, useState } from 'react';
import { Group, Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import { VideoModalState } from '@/modules/canvas-overlays/types';
import { buildProxyMediaUrl } from '@/core/api/proxyUtils';

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
    onSelect?: (e?: { ctrlKey?: boolean; metaKey?: boolean }) => void;
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
    const imageRef = useRef<Konva.Image>(null);
    const animRef = useRef<number | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

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

    // Dragging logic
    const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        const newX = node.x();
        const newY = node.y();

        if (onUpdate) {
            onUpdate({ x: newX, y: newY });
        }
    };

    const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // Prevent selecting if we are dragging
        if (e.target.getStage()?.isDragging()) return;

        if (onSelect) {
            onSelect({
                ctrlKey: e.evt.ctrlKey,
                metaKey: e.evt.metaKey,
            });
        }
    };

    if (!videoElement) return null;

    return (
        <Group
            x={videoState.x}
            y={videoState.y}
            draggable={isDraggable}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            onTap={handleClick}
        >
            <KonvaImage
                ref={imageRef}
                image={videoElement}
                width={videoState.frameWidth || 600}
                height={videoState.frameHeight || 400} // Default fallback
                stroke={isSelected ? '#437eb5' : 'transparent'}
                strokeWidth={2}
                cornerRadius={16} // Match CSS border radius
            />
        </Group>
    );
};
