import React, { useRef, useEffect, useState } from 'react';
import { X, Check, RotateCw } from 'lucide-react';
import { TimelineItem, Track, CanvasDimension, Transition } from '../types';

interface CanvasProps {
    dimension: CanvasDimension;
    tracks: Track[];
    currentTime: number;
    isPlaying: boolean;
    previewTransition?: Transition | null;
    previewTargetId?: string | null;
    selectedItemId: string | null;

    // Global Interaction Props
    interactionMode: 'none' | 'crop' | 'erase';
    setInteractionMode: (mode: 'none' | 'crop' | 'erase') => void;
    eraserSettings: { size: number; type: 'erase' | 'restore'; showOriginal: boolean };

    onSelectClip: (trackId: string, itemId: string | null) => void;
    onUpdateClip: (trackId: string, item: TimelineItem) => void;
    onDeleteClip: (trackId: string, itemId: string) => void;
    onSplitClip: () => void;
    onOpenEditPanel?: (view?: 'main' | 'adjust' | 'eraser' | 'color' | 'animate' | 'text-effects' | 'font') => void;
    onOpenColorPanel?: () => void;
    onCopy: (item: TimelineItem) => void;
    onPaste: (trackId: string) => void;
    onDuplicate: (trackId: string, itemId: string) => void;
    onLock: (trackId: string, itemId: string) => void;
    onDetach: (trackId: string, itemId: string) => void;
    onAlign: (trackId: string, itemId: string, align: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
    scalePercent: number;
    setScalePercent: (scale: number) => void;
}

const Canvas: React.FC<CanvasProps> = ({
    dimension, tracks, currentTime, isPlaying, previewTransition, previewTargetId, selectedItemId,
    interactionMode, setInteractionMode, eraserSettings,
    onSelectClip, onUpdateClip, onDeleteClip, onSplitClip, onOpenEditPanel, onOpenColorPanel,
    onCopy, onPaste, onDuplicate, onLock, onDetach, onAlign,
    scalePercent, setScalePercent
}) => {
    const canvasWrapperRef = useRef<HTMLDivElement>(null);
    const mediaRefs = useRef<{ [key: string]: HTMLMediaElement | null }>({});
    const [currentScale, setCurrentScale] = useState(1);

    // Interaction State
    const [isDraggingItem, setIsDraggingItem] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isRotating, setIsRotating] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false); // For eraser
    const dragStartRef = useRef<{ x: number, y: number } | null>(null);
    const itemStartPosRef = useRef<{ x: number, y: number, width: number, height: number, rotation: number } | null>(null);
    const resizeStartRef = useRef<{ x: number, y: number, direction: string } | null>(null);
    const rotateCenterRef = useRef<{ x: number, y: number } | null>(null);

    // Text Editing State
    const [isEditingText, setIsEditingText] = useState(false);
    const textInputRef = useRef<HTMLDivElement>(null);

    // Eraser State
    const eraserCanvasRef = useRef<HTMLCanvasElement>(null);
    const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

    // Crop State
    const [cropState, setCropState] = useState({ zoom: 1, x: 0, y: 0 });

    // Auto-fit canvas to container on mount/resize
    useEffect(() => {
        const updateScale = () => {
            if (canvasWrapperRef.current && canvasWrapperRef.current.parentElement) {
                const parent = canvasWrapperRef.current.parentElement;
                const parentW = parent.clientWidth - 64; // Padding
                const parentH = parent.clientHeight - 64;
                const scaleW = parentW / dimension.width;
                const scaleH = parentH / dimension.height;
                // Use user defined scalePercent as a multiplier on top of "fit" scale or just absolute?
                // For this UI, let's say scalePercent is relative to "100% = actual pixel size"
                // But usually we want "fit" as default.
                // Let's make scalePercent absolute: 1 = 100%.
                // But we also want to fit initially.
                // For now, let's respect the passed scalePercent prop.
                setCurrentScale(scalePercent);
            }
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [dimension, scalePercent]);

    // Sync Media Playback
    useEffect(() => {
        Object.values(mediaRefs.current).forEach(media => {
            if (media) {
                if (Math.abs(media.currentTime - currentTime / 1000) > 0.3) {
                    media.currentTime = currentTime / 1000;
                }
                if (isPlaying) {
                    media.play().catch(() => { });
                } else {
                    media.pause();
                }
            }
        });
    }, [currentTime, isPlaying, tracks]);

    // --- Helper: Get Render Items (Handle Transitions & Layers) ---
    const getRenderItems = () => {
        const active: { item: TimelineItem, role: 'main' | 'outgoing', opacity?: number, transition?: Transition, transitionProgress?: number, zIndexBase: number }[] = [];

        tracks.forEach((track, trackIndex) => {
            if (track.isHidden) return;
            const zIndexBase = trackIndex * 10;

            if (track.type === 'video') {
                const sortedItems = [...track.items].sort((a, b) => a.start - b.start);

                // 1. Find the item that *should* be playing at currentTime (Main Item)
                const mainItemIndex = sortedItems.findIndex(i => currentTime >= i.start && currentTime < i.start + i.duration);
                const mainItem = mainItemIndex !== -1 ? sortedItems[mainItemIndex] : undefined;

                // 2. Find the *next* item (for Prefix/Overlap-Left checks)
                // If mainItem exists, next is mainItemIndex + 1. If not, find first item starting after currentTime.
                let nextItemIndex = -1;
                if (mainItem) {
                    nextItemIndex = mainItemIndex + 1;
                } else {
                    nextItemIndex = sortedItems.findIndex(i => i.start > currentTime);
                }
                const nextItem = (nextItemIndex !== -1 && nextItemIndex < sortedItems.length) ? sortedItems[nextItemIndex] : undefined;

                let isTransitioning = false;
                let transition: Transition | undefined;
                let progress = 0;
                let outgoingItem: TimelineItem | undefined;
                let incomingItem: TimelineItem | undefined;

                // --- CHECK 1: Incoming Transition on Main Item (Postfix / Overlap-Right) ---
                if (mainItem) {
                    let t = mainItem.transition;
                    if (previewTransition && previewTargetId === mainItem.id) t = previewTransition;

                    if (t && t.type !== 'none') {
                        const timing = t.timing || 'postfix';
                        const timeIntoClip = currentTime - mainItem.start;

                        let transStart = 0;
                        if (timing === 'postfix') transStart = 0;
                        else if (timing === 'overlap') transStart = -t.duration / 2;
                        else if (timing === 'prefix') transStart = -t.duration;

                        // Check if we are in the transition window
                        if (timeIntoClip >= transStart && timeIntoClip < transStart + t.duration) {
                            isTransitioning = true;
                            transition = t;
                            progress = (timeIntoClip - transStart) / t.duration;
                            incomingItem = mainItem;
                            if (mainItemIndex > 0) outgoingItem = sortedItems[mainItemIndex - 1];
                        }
                    }
                }

                // --- CHECK 2: Outgoing Transition on Next Item (Prefix / Overlap-Left) ---
                // Only check if we haven't already found an active transition
                if (!isTransitioning && nextItem) {
                    let t = nextItem.transition;
                    if (previewTransition && previewTargetId === nextItem.id) t = previewTransition;

                    if (t && t.type !== 'none') {
                        const timing = t.timing || 'postfix';
                        const timeUntilNext = nextItem.start - currentTime;

                        // Only relevant if timing puts transition BEFORE the clip starts
                        if (timing === 'prefix' || timing === 'overlap') {
                            let transDurationBeforeStart = 0;
                            if (timing === 'prefix') transDurationBeforeStart = t.duration;
                            if (timing === 'overlap') transDurationBeforeStart = t.duration / 2;

                            if (timeUntilNext <= transDurationBeforeStart) {
                                isTransitioning = true;
                                transition = t;
                                // Calculate progress
                                // Start time relative to nextItem.start: -transDurationBeforeStart
                                // Current time relative to nextItem.start: -timeUntilNext
                                // Progress = (Current - Start) / Duration
                                // = (-timeUntilNext - (-transDurationBeforeStart)) / Duration
                                progress = (transDurationBeforeStart - timeUntilNext) / t.duration;

                                incomingItem = nextItem;
                                if (nextItemIndex > 0) outgoingItem = sortedItems[nextItemIndex - 1];
                            }
                        }
                    }
                }

                // --- RENDER ---
                if (isTransitioning && transition && incomingItem) {
                    // Render Outgoing (if exists)
                    if (outgoingItem) {
                        active.push({ item: outgoingItem, role: 'outgoing', zIndexBase, transition, transitionProgress: progress });
                    }
                    // Render Incoming (Main)
                    active.push({ item: incomingItem, role: 'main', transition, transitionProgress: progress, zIndexBase });
                } else if (mainItem) {
                    // No transition, just render main item
                    active.push({ item: mainItem, role: 'main', zIndexBase });
                }

            } else {
                // Non-video tracks (simple render)
                const activeItems = track.items.filter(i => currentTime >= i.start && currentTime < i.start + i.duration);
                activeItems.forEach(item => { active.push({ item, role: 'main', zIndexBase }); });
            }
        });
        return active;
    };

    const renderItems = getRenderItems();

    // --- Transition Styles ---
    const getTransitionStyle = (itemObj: typeof renderItems[0]) => {
        if (!itemObj.transition || itemObj.transitionProgress === undefined) return {};
        const { type, direction } = itemObj.transition;
        const p = itemObj.transitionProgress;
        const role = itemObj.role;

        // Direction Multipliers
        let xMult = 1; let yMult = 0;
        if (direction === 'right') { xMult = -1; yMult = 0; }
        else if (direction === 'up') { xMult = 0; yMult = 1; }
        else if (direction === 'down') { xMult = 0; yMult = -1; }

        switch (type) {
            // --- Dissolves ---
            case 'dissolve': return { opacity: role === 'main' ? p : 1 - p };
            case 'film-dissolve': return { opacity: role === 'main' ? p : 1 - p }; // Similar to dissolve but usually linear light
            case 'additive-dissolve':
                return role === 'main'
                    ? { opacity: p, mixBlendMode: 'plus-lighter' }
                    : { opacity: 1 - p, mixBlendMode: 'plus-lighter' };
            case 'dip-to-black':
                // Fade out outgoing to black, then fade in incoming from black
                // p: 0 -> 0.5 (fade out), 0.5 -> 1 (fade in)
                if (role === 'outgoing') return { opacity: p < 0.5 ? 1 - (p * 2) : 0 };
                if (role === 'main') return { opacity: p > 0.5 ? (p - 0.5) * 2 : 0 };
                return {};
            case 'dip-to-white':
                // Similar to dip-to-black but with white overlay (simulated by brightness/opacity or overlay div)
                // For simplicity, we'll use opacity and a white background on container (assumed)
                if (role === 'outgoing') return { filter: `brightness(${1 + p * 2})`, opacity: p < 0.5 ? 1 - (p * 2) : 0 };
                if (role === 'main') return { filter: `brightness(${1 + (1 - p) * 2})`, opacity: p > 0.5 ? (p - 0.5) * 2 : 0 };
                return {};

            // --- Slides & Pushes ---
            case 'slide':
                // Incoming slides over outgoing
                return role === 'main'
                    ? { transform: `translate(${xMult * 100 * (1 - p)}%, ${yMult * 100 * (1 - p)}%)`, zIndex: 20 }
                    : { transform: 'none', zIndex: 10 };
            case 'push':
                // Incoming pushes outgoing
                return role === 'main'
                    ? { transform: `translate(${xMult * 100 * (1 - p)}%, ${yMult * 100 * (1 - p)}%)` }
                    : { transform: `translate(${xMult * -100 * p}%, ${yMult * -100 * p}%)` };
            case 'whip':
                // Fast push with blur
                return role === 'main'
                    ? { transform: `translate(${xMult * 100 * (1 - p)}%, ${yMult * 100 * (1 - p)}%)`, filter: `blur(${Math.sin(p * Math.PI) * 20}px)` }
                    : { transform: `translate(${xMult * -100 * p}%, ${yMult * -100 * p}%)`, filter: `blur(${Math.sin(p * Math.PI) * 20}px)` };
            case 'split':
                // Incoming splits from center (simulated as simple slide for now or clip)
                // Better: Clip path split
                return role === 'main'
                    ? { clipPath: `inset(${direction === 'up' || direction === 'down' ? `0 ${50 * (1 - p)}% 0 ${50 * (1 - p)}%` : `${50 * (1 - p)}% 0 ${50 * (1 - p)}% 0`})` }
                    : {};
            case 'band-slide':
                // Slide strips (simplified to push for now)
                return role === 'main' ? { transform: `translate(${xMult * 100 * (1 - p)}%, ${yMult * 100 * (1 - p)}%)` } : {};

            // --- Iris Shapes ---
            case 'iris-round':
                // Circular reveal
                return role === 'main'
                    ? { clipPath: `circle(${p * 150}% at 50% 50%)`, zIndex: 20 }
                    : { zIndex: 10 };
            case 'iris-box':
                // Box reveal
                return role === 'main'
                    ? { clipPath: `inset(${50 * (1 - p)}%)`, zIndex: 20 }
                    : { zIndex: 10 };

            // --- Wipes ---
            case 'wipe':
                // Simple linear wipe
                // clip-path inset(top right bottom left)
                // right wipe: reveal from left to right -> inset(0 100%->0 0 0)
                if (direction === 'right') return role === 'main' ? { clipPath: `inset(0 ${100 * (1 - p)}% 0 0)`, zIndex: 20 } : {};
                if (direction === 'left') return role === 'main' ? { clipPath: `inset(0 0 0 ${100 * (1 - p)}%)`, zIndex: 20 } : {};
                if (direction === 'up') return role === 'main' ? { clipPath: `inset(${100 * (1 - p)}% 0 0 0)`, zIndex: 20 } : {};
                if (direction === 'down') return role === 'main' ? { clipPath: `inset(0 0 ${100 * (1 - p)}% 0)`, zIndex: 20 } : {};
                return {};
            case 'gradient-wipe':
                // Requires mask image, simplified to dissolve for now
                return { opacity: role === 'main' ? p : 1 - p };
            case 'clock-wipe':
                // Conic gradient clip path
                return role === 'main'
                    ? { clipPath: `polygon(50% 50%, 50% 0%, ${p > 0.125 ? '100% 0%,' : ''} ${p > 0.375 ? '100% 100%,' : ''} ${p > 0.625 ? '0% 100%,' : ''} ${p > 0.875 ? '0% 0%,' : ''} ${50 + 50 * Math.sin(p * Math.PI * 2)}% ${50 - 50 * Math.cos(p * Math.PI * 2)}%)`, zIndex: 20 }
                    : {};

            // --- Zooms ---
            case 'zoom-in':
                // Incoming zooms in from 0 scale
                return role === 'main'
                    ? { transform: `scale(${p})`, opacity: p }
                    : { transform: `scale(${1 + p})`, opacity: 1 - p };
            case 'zoom-out':
                // Outgoing zooms out to 0
                return role === 'main'
                    ? { transform: `scale(${2 - p})`, opacity: p }
                    : { transform: `scale(${1 - p})`, opacity: 1 - p };

            default: return {};
        }
    };

    // --- Interaction Handlers ---

    const handleItemMouseDown = (e: React.MouseEvent, item: TimelineItem) => {
        if (interactionMode !== 'none' && interactionMode !== 'crop') return;
        e.stopPropagation();
        onSelectClip(item.trackId, item.id);

        if (item.isBackground) return;

        setIsDraggingItem(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        itemStartPosRef.current = {
            x: item.x || 0,
            y: item.y || 0,
            width: item.width || 0,
            height: item.height || 0,
            rotation: item.rotation || 0
        };
    };

    const handleItemDrag = (e: React.MouseEvent) => {
        if (!isDraggingItem || !dragStartRef.current || !itemStartPosRef.current || !selectedItemId) return;
        const item = tracks.find(t => t.items.some(i => i.id === selectedItemId))?.items.find(i => i.id === selectedItemId);
        if (!item) return;

        const deltaX = (e.clientX - dragStartRef.current.x) / currentScale;
        const deltaY = (e.clientY - dragStartRef.current.y) / currentScale;

        // Convert pixel delta to percentage delta relative to canvas size
        const percentDeltaX = (deltaX / dimension.width) * 100;
        const percentDeltaY = (deltaY / dimension.height) * 100;

        onUpdateClip(item.trackId, {
            ...item,
            x: itemStartPosRef.current.x + percentDeltaX,
            y: itemStartPosRef.current.y + percentDeltaY
        });
    };

    const handleResizeMouseDown = (e: React.MouseEvent, item: TimelineItem, direction: string) => {
        e.stopPropagation();
        setIsResizing(true);
        resizeStartRef.current = { x: e.clientX, y: e.clientY, direction };
        itemStartPosRef.current = {
            x: item.x || 0,
            y: item.y || 0,
            width: item.width || (item.type === 'text' ? 0 : 50), // Default width if missing
            height: item.height || (item.type === 'text' ? 0 : 50),
            rotation: item.rotation || 0
        };
    };

    const handleResizeDrag = (e: React.MouseEvent) => {
        if (!isResizing || !resizeStartRef.current || !itemStartPosRef.current || !selectedItemId) return;
        const item = tracks.find(t => t.items.some(i => i.id === selectedItemId))?.items.find(i => i.id === selectedItemId);
        if (!item) return;

        const deltaX = (e.clientX - resizeStartRef.current.x) / currentScale;
        const deltaY = (e.clientY - resizeStartRef.current.y) / currentScale;

        // Convert to percentage
        const pDeltaX = (deltaX / dimension.width) * 100;
        const pDeltaY = (deltaY / dimension.height) * 100;

        let newW = itemStartPosRef.current.width;
        let newH = itemStartPosRef.current.height;
        let newX = itemStartPosRef.current.x;
        let newY = itemStartPosRef.current.y;

        const { direction } = resizeStartRef.current;

        // Aspect Ratio Lock (Shift key usually, but let's assume locked for images/video, unlocked for shape/text box)
        // For simplicity, free resize for now unless corner
        // Actually, let's just do simple resizing

        if (direction.includes('e')) newW += pDeltaX;
        if (direction.includes('w')) { newW -= pDeltaX; newX += pDeltaX; }
        if (direction.includes('s')) newH += pDeltaY;
        if (direction.includes('n')) { newH -= pDeltaY; newY += pDeltaY; }

        // Min size check
        if (newW < 5) newW = 5;
        if (newH < 5) newH = 5;

        onUpdateClip(item.trackId, { ...item, width: newW, height: newH, x: newX, y: newY });
    };

    const handleRotateMouseDown = (e: React.MouseEvent, item: TimelineItem) => {
        e.stopPropagation();
        setIsRotating(true);
        // Calculate center relative to screen for rotation
        const element = document.getElementById(`item-${item.id}`); // We need to add ID to elements
        if (element) {
            const rect = element.getBoundingClientRect();
            rotateCenterRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
    };

    const handleRotateDrag = (e: React.MouseEvent) => {
        if (!isRotating || !rotateCenterRef.current || !selectedItemId) return;
        const item = tracks.find(t => t.items.some(i => i.id === selectedItemId))?.items.find(i => i.id === selectedItemId);
        if (!item) return;

        const deltaX = e.clientX - rotateCenterRef.current.x;
        const deltaY = e.clientY - rotateCenterRef.current.y;
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        // Snap to 45 degrees
        const snappedAngle = e.shiftKey ? Math.round(angle / 45) * 45 : angle;

        onUpdateClip(item.trackId, { ...item, rotation: snappedAngle + 90 }); // +90 to align with handle position (bottom)
    };

    // --- Eraser Handlers ---
    const handleEraserMouseMove = (e: React.MouseEvent) => {
        if (interactionMode !== 'erase' || !selectedItemId) return;
        const rect = canvasWrapperRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left); // Relative to canvas wrapper (scaled)
        const y = (e.clientY - rect.top);

        setCursorPos({ x: e.clientX, y: e.clientY }); // Global for cursor element

        if (e.buttons === 1) { // Left click held
            const ctx = eraserCanvasRef.current?.getContext('2d');
            if (ctx) {
                ctx.globalCompositeOperation = eraserSettings.type === 'erase' ? 'destination-out' : 'source-over';
                ctx.beginPath();
                ctx.arc(x / currentScale, y / currentScale, eraserSettings.size / 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,0,0,1)';
                ctx.fill();
                setIsDrawing(true);
            }
        }
    };

    const handleEraserMouseUp = (trackId: string, item: TimelineItem) => {
        if (isDrawing && eraserCanvasRef.current) {
            const dataUrl = eraserCanvasRef.current.toDataURL();
            onUpdateClip(trackId, { ...item, maskImage: dataUrl });
            setIsDrawing(false);
        }
    };

    // --- Crop Handlers ---
    const handleCropDrag = (e: React.MouseEvent) => {
        // Simplified pan for crop
        if (interactionMode === 'crop') {
            setCropState(prev => ({ ...prev, x: prev.x + e.movementX, y: prev.y + e.movementY }));
        }
    };

    const saveCrop = (trackId: string, item: TimelineItem) => {
        // Apply crop state to item (simplified)
        onUpdateClip(trackId, { ...item, crop: cropState });
        setInteractionMode('none');
    };

    // --- Render Helpers ---

    const getTextEffectStyle = (effect: any, color: string) => {
        switch (effect.type) {
            case 'shadow': return { textShadow: `${effect.x}px ${effect.y}px ${effect.blur}px ${effect.color}` };
            case 'outline': return { WebkitTextStroke: `${effect.width}px ${effect.color}` };
            case 'neon': return { textShadow: `0 0 5px ${color}, 0 0 10px ${color}, 0 0 20px ${color}` };
            case 'glitch': return { textShadow: `2px 0 red, -2px 0 blue` }; // Simplified
            default: return {};
        }
    };

    const renderItemContent = (itemObj: typeof renderItems[0], isOverlayPass: boolean) => {
        const { item, role, transition, transitionProgress, zIndexBase } = itemObj;

        // Calculate Position & Transform
        const x = item.x || 0;
        const y = item.y || 0;
        const rotation = item.rotation || 0;

        // For background items, we ignore x/y/rotation and fill the canvas
        const posStyle: React.CSSProperties = item.isBackground
            ? { top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }
            : { top: `${y}%`, left: `${x}%`, width: `${item.width}%`, height: `${item.height}%` };

        const transform = item.isBackground ? 'none' : `rotate(${rotation}deg)`;

        // Apply Crop (Simplified: using object-position for images/video)
        const objectPosition = item.crop ? `${50 + item.crop.x}px ${50 + item.crop.y}px` : 'center'; // Very rough approx

        // Apply Filters
        const filterStyle = item.filter ? `brightness(${100 + (item.adjustments?.brightness || 0)}%) contrast(${100 + (item.adjustments?.contrast || 0)}%) saturate(${100 + (item.adjustments?.saturation || 0)}%)` : undefined;
        // Note: Real implementation would map filter ID to CSS filter string
        const presetFilterStyle = item.filter ? (item.filter === 'grayscale' ? 'grayscale(100%)' : item.filter === 'sepia' ? 'sepia(100%)' : undefined) : undefined;
        const intensity = item.filterIntensity || 100;

        // Combined Filter
        const adjustmentStyle = [
            filterStyle,
            presetFilterStyle ? `${presetFilterStyle} opacity(${intensity}%)` : '' // This is tricky in CSS, usually requires overlay or backdrop-filter.
            // Simplified: Just apply adjustments for now.
        ].filter(Boolean).join(' ');

        // Apply Vignette
        const vignetteOpacity = item.adjustments?.vignette || 0;

        // Transition Styles
        const transitionStyle = getTransitionStyle(itemObj);

        // Animation Styles (CSS Keyframes - would need to inject styles or use a library like framer-motion)
        // For now, we'll use simple inline styles or class names if defined
        const animationStyle: React.CSSProperties = {};
        if (item.animation) {
            const { type, duration = 1000, delay = 0 } = item.animation;
            // We would map 'type' to a CSS animation name defined in global CSS
            // e.g. 'fade-in', 'slide-up'
            // For this prototype, we'll assume classes exist or use a simple transform
            if (isPlaying) {
                // Only animate during playback
                // We need to trigger reflow or use key to restart animation
                // Key is already unique per item render
                // We need to set animation properties
                // animation: name duration easing delay fill-mode
                // We'll use a data attribute or class and assume CSS handles it
            }
        }

        // Apply item transform + transition transform
        // Note: Order matters. Usually Item Transform (pos/rot) -> Transition Transform
        // But since we use absolute positioning for x/y, transform is mostly rotation + scale
        let itemTransform = transform;
        if (item.type === 'text' || !item.isBackground) {
            // Add scale if needed
            // itemTransform += ` scale(${scale})`;
        }

        if (item.animation && isPlaying) {
            // Calculate animation progress or just apply class
            // If we want to preview animation in editor without playing, we might need a 'hover' state or similar
            // For now, let's just apply the class
            if (item.animation.type === 'fade') {
                animationStyle.animationName = 'fadeIn';
                animationStyle.animationDuration = `${item.animation.duration}ms`;
            }
            // ... map other animations
            // Let's use a helper for class names
            // We'll assume Tailwind animate-in classes or custom ones
            if (item.animation.type === 'fade') {
                // animationStyle.opacity = 0; // Start hidden
                // animationStyle.animation = `fadeIn ${item.animation.duration}ms forwards`;
            }
        }

        // Fix for animations: We need to ensure they run when the item appears
        // Since we mount/unmount items based on time, they will auto-play on mount.
        // We just need to set the right CSS.
        if (item.animation) {
            const animDuration = item.animation.duration || 1000;
            const isEnter = item.animation.timing === 'enter' || item.animation.timing === 'both' || !item.animation.timing;
            const isExit = item.animation.timing === 'exit' || item.animation.timing === 'both';

            // Calculate if we are in enter or exit phase relative to item start/end
            const timeIn = currentTime - item.start;
            const timeLeft = (item.start + item.duration) - currentTime;

            if (isEnter && timeIn < animDuration / 1000) {
                // Enter animation
                // We can use a key to force re-render if needed, but mounting should be enough
                animationStyle.animationName = `anim-${item.animation.type}-enter`;
                animationStyle.animationDuration = `${animDuration}ms`;
                animationStyle.animationFillMode = 'both';
            } else if (isExit && timeLeft < animDuration / 1000) {
                // Exit animation
                animationStyle.animationName = `anim-${item.animation.type}-exit`;
                animationStyle.animationDuration = `${animDuration}ms`;
                animationStyle.animationFillMode = 'both';
            } else {
                // Static state (between enter and exit)
                // If we have an enter animation, we want to maintain the final state (visible)
                // If we have an exit animation, we want to maintain initial state (visible)
                // Usually 'both' fill mode handles this if the animation is structured right.
                // But if we are in the middle, we shouldn't be animating.
                // We can just set no animation and ensure opacity is 1.
                // Unless it's a continuous animation like 'pulse'.
                if (item.animation.category === 'loop') {
                    animationStyle.animationName = `anim-${item.animation.type}`;
                    animationStyle.animationDuration = `${animDuration}ms`;
                    animationStyle.animationIterationCount = 'infinite';
                } else {
                    // Ensure we are visible
                    // animationStyle.opacity = 1;
                }
            }

            // Hack for 'page' animations which are usually full transitions
            if (item.animation.category === 'page') {
                animationStyle.animationName = `anim-${item.animation.type}`;
                animationStyle.animationDuration = `${animDuration}ms`;
                animationStyle.animationFillMode = 'both, forwards';
                animationStyle.animationTimingFunction = 'cubic-bezier(0.2, 0.8, 0.2, 1), cubic-bezier(0.2, 0.8, 0.2, 1)';
            }
        }

        // Restore animation class to ensure static CSS properties (masks, filters) are applied
        const animationClass = item.animation ? `anim-${item.animation.type}` : '';

        let zIndex = zIndexBase;
        if (item.isBackground) { zIndex = 1; if (role === 'outgoing') zIndex = 0; } else { zIndex = zIndexBase + 5; if (item.type === 'text') zIndex += 2; }
        if (item.id === selectedItemId) { zIndex = item.isBackground ? 1 : 1000; }

        const isSelected = selectedItemId === item.id;
        const isDragging = isSelected && isDraggingItem;
        const isErasing = isSelected && interactionMode === 'erase';
        const isEditing = isSelected && isEditingText;

        const maskStyle = item.maskImage && !isErasing ? { WebkitMaskImage: `url(${item.maskImage})`, maskImage: `url(${item.maskImage})`, WebkitMaskSize: 'cover', maskSize: 'cover', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' } : {};
        const borderStyle = item.border ? { border: `${item.border.width}px ${item.border.style} ${item.border.color}` } : {};
        const borderRadiusStyle = item.borderRadius ? { borderRadius: `${item.borderRadius}px` } : {};

        // Text Specific Styles (Common for rendering and measuring)
        const textBaseStyle: React.CSSProperties = item.type === 'text' ? {
            fontFamily: item.fontFamily,
            fontSize: `${item.fontSize}px`,
            fontWeight: item.fontWeight,
            fontStyle: item.fontStyle,
            textDecoration: item.textDecoration,
            textAlign: item.textAlign,
            textTransform: item.textTransform,
            color: item.color,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.4,
            // We add padding directly to the text container to create space from the border
            padding: '8px',
            boxSizing: 'border-box', // Ensures border is outside content+padding
            wordBreak: 'break-word', // Ensure long words break
            overflowWrap: 'break-word', // Ensure text wraps
        } : {};

        const textEffectStyle: React.CSSProperties = item.type === 'text' && item.textEffect
            ? getTextEffectStyle(item.textEffect, item.color || '#000000')
            : {};

        const fullTextStyle = { ...textBaseStyle, ...textEffectStyle };

        // Shared text rendering function to keep visual consistency
        const renderTextContent = () => {
            if (item.listType && item.listType !== 'none') {
                const listClass = item.listType === 'bullet' ? "list-disc list-inside text-left" : "list-decimal list-inside text-left";
                const lines = item.name.split('\n');
                return (
                    item.listType === 'bullet' ? (
                        <ul className={listClass}>
                            {lines.map((line, i) => <li key={i}>{line}</li>)}
                        </ul>
                    ) : (
                        <ol className={listClass}>
                            {lines.map((line, i) => <li key={i}>{line}</li>)}
                        </ol>
                    )
                );
            }
            return item.name;
        };

        // For text items, we want auto-height so it grows with text content
        // We also override overflow to visible for text so content doesn't get clipped
        const finalStyle: React.CSSProperties = {
            zIndex, inset: item.isBackground ? 0 : undefined,
            ...posStyle,
            width: item.isBackground ? '100%' : (item.width ? `${item.width}%` : 'auto'),
            height: item.isBackground ? '100%' : (item.height ? `${item.height}%` : 'auto'),
            transform: itemTransform, opacity: isDragging && !item.isBackground && (Math.abs(item.x || 0) > 65 || Math.abs(item.y || 0) > 65) ? 0.4 : (item.opacity ?? 100) / 100,
            ...maskStyle, filter: adjustmentStyle, ...transitionStyle
        };

        if (transitionStyle.transform && itemTransform) finalStyle.transform = `${itemTransform} ${transitionStyle.transform}`;
        else if (transitionStyle.transform) finalStyle.transform = transitionStyle.transform;
        if (transitionStyle.opacity !== undefined) finalStyle.opacity = Number(transitionStyle.opacity) * (finalStyle.opacity as number);

        const contentJsx = (
            <div
                key={item.id}
                className={`absolute flex items-center justify-center origin-center ${isSelected ? (interactionMode === 'crop' ? 'cursor-move' : item.isBackground ? 'cursor-default' : 'cursor-move') : 'cursor-pointer'}`}
                style={finalStyle}
                onMouseDown={(e) => handleItemMouseDown(e, item)}
                onClick={(e) => e.stopPropagation()}
                onMouseMove={(e) => { if (isSelected && interactionMode === 'crop') handleCropDrag(e); }}
                onDoubleClick={(e) => {
                    if (item.type === 'text') {
                        e.stopPropagation();
                    }
                }}
            >
                <div style={{ width: '100%', height: '100%', background: item.backgroundColor || 'transparent', ...borderStyle, ...borderRadiusStyle, ...animationStyle }} className={`relative ${item.type === 'text' ? 'overflow-visible' : 'overflow-hidden'} pointer-events-none ${animationClass}`}>
                    {vignetteOpacity > 0 && <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: `radial-gradient(circle, transparent 50%, rgba(0,0,0,${vignetteOpacity}) 100%)` }}></div>}
                    {(!isErasing || item.type === 'text' || item.type === 'color') && (
                        <>
                            {item.type === 'video' && (
                                <>
                                    <video ref={(el) => { mediaRefs.current[item.id] = el; }} src={item.src} className={`pointer-events-none block ${item.isBackground ? 'w-full h-full object-cover' : 'w-full h-full object-cover shadow-sm'}`} style={{ objectPosition: item.isBackground ? objectPosition : undefined }} playsInline crossOrigin="anonymous" />
                                    {presetFilterStyle && <div className="absolute inset-0" style={{ opacity: intensity / 100 }}><video ref={(el) => { mediaRefs.current[item.id + '_filter'] = el; }} src={item.src} className={`pointer-events-none block ${item.isBackground ? 'w-full h-full object-cover' : 'w-full h-full object-cover shadow-sm'}`} style={{ filter: presetFilterStyle, objectPosition: item.isBackground ? objectPosition : undefined }} playsInline crossOrigin="anonymous" /></div>}
                                    {item.backgroundColor && (
                                        <div className="absolute inset-0 pointer-events-none z-[1]" style={{ backgroundColor: item.backgroundColor, mixBlendMode: 'overlay', opacity: 0.5 }}></div>
                                    )}
                                </>
                            )}
                            {item.type === 'image' && (
                                <>
                                    <img src={item.src} className={`pointer-events-none block ${item.isBackground ? 'w-full h-full object-cover' : 'w-full h-full object-cover shadow-sm'}`} style={{ objectPosition: item.isBackground ? objectPosition : undefined }} />
                                    {presetFilterStyle && <div className="absolute inset-0" style={{ opacity: intensity / 100 }}><img src={item.src} className={`pointer-events-none block ${item.isBackground ? 'w-full h-full object-cover' : 'w-full h-full object-cover shadow-sm'}`} style={{ filter: presetFilterStyle, objectPosition: item.isBackground ? objectPosition : undefined }} /></div>}
                                    {/* Add Color Overlay for Tinting Images */}
                                    {item.backgroundColor && (
                                        <div className="absolute inset-0 pointer-events-none z-[1]" style={{ backgroundColor: item.backgroundColor, mixBlendMode: 'overlay', opacity: 0.5 }}></div>
                                    )}
                                </>
                            )}
                            {item.type === 'color' && <div className="w-full h-full" style={{ background: item.src }}></div>}
                            {item.type === 'text' && (
                                isEditing ? (
                                    // Use correct tag for editing to show bullets/numbers natively
                                    React.createElement(
                                        item.listType === 'bullet' ? 'ul' : item.listType === 'number' ? 'ol' : 'div',
                                        {
                                            ref: textInputRef,
                                            contentEditable: true,
                                            suppressContentEditableWarning: true,
                                            className: `outline-none pointer-events-auto cursor-text ${item.listType === 'bullet' ? 'list-disc list-inside' : item.listType === 'number' ? 'list-decimal list-inside' : ''}`,
                                            style: {
                                                ...fullTextStyle, // Apply full styling (including padding) to input
                                                width: '100%',
                                                height: '100%',
                                                background: 'transparent',
                                                border: 'none',
                                                overflow: 'visible',
                                                display: 'inline-block',
                                                minWidth: '10px'
                                            },
                                            onBlur: (e: React.FocusEvent<HTMLElement>) => {
                                                onUpdateClip(item.trackId, { ...item, name: e.currentTarget.innerText });
                                                setIsEditingText(false);
                                            },
                                            onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
                                            children: item.listType !== 'none'
                                                ? item.name.split('\n').map((line, i) => <li key={i}>{line}</li>)
                                                : item.name
                                        }
                                    )
                                ) : (
                                    <div className="whitespace-pre-wrap" style={fullTextStyle}>
                                        {renderTextContent()}
                                    </div>
                                )
                            )}
                        </>
                    )}
                    {isErasing && (item.type === 'image' || item.type === 'video') && (
                        <>
                            <canvas ref={compositeCanvasRef} width={dimension.width} height={dimension.height} className={`w-full h-full ${item.isBackground ? 'object-cover' : 'object-contain'}`} style={{ objectPosition, mixBlendMode: (item.type === 'image' ? (item.opacity && item.opacity < 100 ? 'normal' : 'normal') : 'normal') as any }} />
                            <canvas ref={eraserCanvasRef} width={dimension.width} height={dimension.height} className="absolute inset-0 hidden pointer-events-none" />
                        </>
                    )}
                </div>
            </div>
        );

        if (!isOverlayPass) { if (isDragging && !item.isBackground) return null; return contentJsx; }
        else {
            const children = [];
            if (isDragging && !item.isBackground) children.push(contentJsx);
            if (isSelected && interactionMode === 'none' && !item.isBackground) {
                children.push(
                    <div key={`overlay-${item.id}`} className="absolute pointer-events-none flex items-center justify-center origin-center" style={{ zIndex, ...posStyle, width: item.isBackground ? '100%' : (item.width ? `${item.width}%` : 'auto'), height: item.isBackground ? '100%' : (item.type === 'text' ? 'auto' : (item.height ? `${item.height}%` : 'auto')), transform: itemTransform }}>
                        <div style={{ width: '100%', height: '100%', ...animationStyle }} className={animationClass}>
                            {/* Invisible Text Clone to Force Selection Box to Fit Content EXACTLY including padding */}
                            {item.type === 'text' && (
                                <div style={{
                                    ...fullTextStyle,
                                    opacity: 0,
                                    pointerEvents: 'none',
                                    overflow: 'hidden',
                                    position: 'static', // Let it flow naturally to size parent
                                    width: '100%', // Force width to match parent container width
                                    height: 'auto', // Let it grow vertically
                                    border: 'none',
                                    margin: 0
                                }}>
                                    {renderTextContent()}
                                </div>
                            )}

                            {/* The Selection Border Container */}
                            <div className={`absolute -inset-[2px] border-[2px] border-violet-600 z-50 pointer-events-none ${isEditing ? 'opacity-0' : 'opacity-100'}`} style={{ borderRadius: item.borderRadius ? `${item.borderRadius}px` : 0, boxSizing: 'border-box' }}>

                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border border-violet-600 rounded-full shadow-sm z-50 pointer-events-auto cursor-grab active:cursor-grabbing flex items-center justify-center hover:scale-110 transition-transform" onMouseDown={(e) => handleRotateMouseDown(e, item)}><RotateCw size={14} className="text-violet-600" /></div>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-px h-4 bg-violet-600"></div>

                                {/* Corner Handles - Positioned relative to the border box */}
                                <div className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-white border border-violet-600 rounded-full shadow-sm z-50 pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeMouseDown(e, item, 'nw')}></div>
                                <div className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white border border-violet-600 rounded-full shadow-sm z-50 pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeMouseDown(e, item, 'ne')}></div>
                                <div className="absolute -bottom-2.5 -left-2.5 w-5 h-5 bg-white border border-violet-600 rounded-full shadow-sm z-50 pointer-events-auto cursor-nesw-resize hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeMouseDown(e, item, 'sw')}></div>
                                <div className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-white border border-violet-600 rounded-full shadow-sm z-50 pointer-events-auto cursor-nwse-resize hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeMouseDown(e, item, 'se')}></div>

                                {/* Side Handles */}
                                <div className="absolute top-1/2 -right-2 w-2.5 h-10 -translate-y-1/2 bg-white border border-violet-600 rounded-full shadow-sm z-50 pointer-events-auto cursor-ew-resize hover:scale-110 transition-transform" onMouseDown={(e) => handleResizeMouseDown(e, item, 'e')}></div>
                                <div className="absolute top-1/2 -left-2 w-2.5 h-10 -translate-y-1/2 bg-white border border-violet-600 rounded-full shadow-sm z-50 pointer-events-auto cursor-ew-resize hover:scale-110 transition-transform" onMouseDown={(e) => handleResizeMouseDown(e, item, 'w')}></div>

                                {/* Top/Bottom Handles - Hidden for text items */}
                                {item.type !== 'text' && (
                                    <>
                                        <div className="absolute left-1/2 -top-2 w-10 h-2.5 -translate-x-1/2 bg-white border border-violet-600 rounded-full shadow-sm z-50 pointer-events-auto cursor-ns-resize hover:scale-110 transition-transform" onMouseDown={(e) => handleResizeMouseDown(e, item, 'n')}></div>
                                        <div className="absolute left-1/2 -bottom-2 w-10 h-2.5 -translate-x-1/2 bg-white border border-violet-600 rounded-full shadow-sm z-50 pointer-events-auto cursor-ns-resize hover:scale-110 transition-transform" onMouseDown={(e) => handleResizeMouseDown(e, item, 's')}></div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }
            return <React.Fragment key={`${item.id}-overlay-wrapper`}>{children}</React.Fragment>;
        }
    };

    const selectedItem = tracks.find(t => t.items.some(i => i.id === selectedItemId))?.items.find(i => i.id === selectedItemId) || null;

    return (
        <div
            className="flex-1 bg-gray-100 relative overflow-hidden flex items-center justify-center p-8"
            onClick={(e) => {
                if (selectedItemId) {
                    onSelectClip('', null);
                }

                setInteractionMode('none');
            }}
            onMouseMove={(e) => {
                if (interactionMode === 'erase') handleEraserMouseMove(e);
                else if (isResizing) handleResizeDrag(e);
                else if (isRotating) handleRotateDrag(e);
                else if (isDraggingItem) handleItemDrag(e);
            }}
            onMouseUp={(e) => {
                if (interactionMode === 'erase' && selectedItem) handleEraserMouseUp(selectedItem.trackId, selectedItem);

                if (isDraggingItem && selectedItem && !selectedItem.isBackground) {
                    const deleteThreshold = 65;
                    if (Math.abs(selectedItem.x || 0) > deleteThreshold || Math.abs(selectedItem.y || 0) > deleteThreshold) {
                        onDeleteClip(selectedItem.trackId, selectedItem.id);
                    }
                }

                setIsDraggingItem(false);
                setIsResizing(false);
                setIsRotating(false);
                dragStartRef.current = null;
                itemStartPosRef.current = null;
                resizeStartRef.current = null;
                rotateCenterRef.current = null;
            }}
        >
            <div className="w-full h-full flex items-center justify-center overflow-hidden relative">

                {/* Main Canvas Background / Wrapper */}
                <div
                    ref={canvasWrapperRef}
                    className="bg-white shadow-2xl relative transition-transform duration-300 ease-in-out origin-center group"
                    style={{
                        width: dimension.width,
                        height: dimension.height,
                        transform: `scale(${currentScale})`,
                        flexShrink: 0
                    }}
                    onClick={(e) => {
                        // Only deselect if not drawing or dragging
                        if (!isDrawing && !isDraggingItem && !isResizing && !isRotating) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (selectedItemId) onSelectClip('', null);

                            setInteractionMode('none');
                        }
                    }}
                >
                    {/* Layer 1: Content (Clipped) */}
                    <div className="absolute inset-0 overflow-hidden bg-white">
                        {renderItems.length === 0 && (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-4xl">
                                Empty
                            </div>
                        )}

                        {renderItems.filter(obj => obj.item.type !== 'audio').map((obj) => renderItemContent(obj, false))}

                        {/* Cursor for Eraser - Moved outside to fixed position */}
                    </div>

                    {/* Layer 2: UI Overlays (Not Clipped by viewport, but inside canvas wrapper) */}
                    <div className="absolute inset-0 pointer-events-none">
                        {renderItems.filter(obj => obj.item.type !== 'audio').map((obj) => renderItemContent(obj, true))}
                    </div>

                    {/* Audio Elements (Invisible) */}
                    {renderItems.filter(obj => obj.item.type === 'audio').map((obj) => (
                        <audio
                            key={`${obj.item.id}-${obj.role}`}
                            ref={(el) => { mediaRefs.current[obj.item.id] = el; }}
                            src={obj.item.src}
                            preload="auto"
                        />
                    ))}

                </div>

                {/* Eraser Cursor (Fixed Position) */}
                {selectedItemId && interactionMode === 'erase' && cursorPos && (
                    <div
                        className="fixed rounded-full border border-gray-800 bg-white/20 backdrop-invert pointer-events-none z-[9999] shadow-sm"
                        style={{
                            width: eraserSettings.size * currentScale,
                            height: eraserSettings.size * currentScale,
                            left: cursorPos.x,
                            top: cursorPos.y,
                            transform: 'translate(-50%, -50%)'
                        }}
                    ></div>
                )}



                {/* Crop Popup (unchanged logic) */}
                {selectedItem && interactionMode === 'crop' && (
                    <div
                        className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-xl py-2 px-4 flex items-center gap-3 z-[100] animate-in fade-in slide-in-from-top-4 duration-200 border border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col w-32">
                            <label className="text-[10px] font-bold text-gray-500 mb-1">Zoom</label>
                            <input type="range" min="1" max="3" step="0.1" value={cropState.zoom} onChange={(e) => setCropState(prev => ({ ...prev, zoom: Number(e.target.value) }))} className="w-full accent-violet-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="text-xs text-gray-500 font-medium">Drag image to pan</div>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <button onClick={() => setInteractionMode('none')} className="p-2 hover:bg-red-50 rounded-full text-red-500"><X size={20} /></button>
                        <button onClick={() => saveCrop(selectedItem.trackId, selectedItem)} className="p-2 bg-violet-600 hover:bg-violet-700 rounded-full text-white"><Check size={20} /></button>
                    </div>
                )}
            </div>


        </div>
    );
};

export default Canvas;
