'use client';

import React, { useEffect, useState } from 'react';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface StoryboardConnectionNodesProps {
    id: string | undefined;
    scale: number;
    isHovered: boolean;
    isSelected: boolean;
}

export const StoryboardConnectionNodes: React.FC<StoryboardConnectionNodesProps> = ({
    id,
    scale,
    isHovered,
    isSelected,
}) => {
    const [globalDragActive, setGlobalDragActive] = useState(false);

    // Listen for global node-drag active state so nodes remain visible while dragging
    useEffect(() => {
        const handleActive = (e: Event) => {
            const ce = e as CustomEvent;
            setGlobalDragActive(Boolean(ce.detail?.active));
        };
        window.addEventListener('canvas-node-active', handleActive as any);
        return () => window.removeEventListener('canvas-node-active', handleActive as any);
    }, []);

    // Always show nodes clearly - higher base opacity for better visibility
    const nodeOpacity = (isHovered || isSelected || globalDragActive) ? 1 : 0.85;

    const isDark = useIsDarkTheme();

    // Darker, more visible nodes with better contrast
    const nodeColor = isDark ? '#808080' : '#606060';
    const nodeBorder = isDark ? '#2a2a2a' : '#c0c0c0';

    // Node size - larger and more visible
    const nodeSize = 18 * scale;
    const nodeOffset = 9 * scale; // Distance from container edge

    // Helper function to render a receive node
    const renderReceiveNode = (anchor: string, topPercent: number, label: string) => (
        <div
            key={anchor}
            data-node-id={id}
            data-node-side={anchor}
            title={label}
            onPointerEnter={(e) => {
                if (!id) return;
                window.dispatchEvent(new CustomEvent('canvas-node-hover', { detail: { nodeId: id } }));
            }}
            onPointerLeave={(e) => {
                if (!id) return;
                window.dispatchEvent(new CustomEvent('canvas-node-leave', { detail: { nodeId: id } }));
            }}
            onPointerUp={(e) => {
                if (!id) return;
                e.stopPropagation();
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('canvas-node-complete', { detail: { id, side: anchor } }));
                try {
                    const active: any = (window as any).__canvas_active_capture;
                    if (active?.element && typeof active?.pid === 'number') {
                        try { active.element.releasePointerCapture(active.pid); } catch (err) { }
                        delete (window as any).__canvas_active_capture;
                    }
                } catch (err) { }
            }}
            style={{
                position: 'absolute',
                left: `${-nodeOffset}px`,
                top: `${topPercent}%`,
                transform: 'translate(-50%, -50%)',
                width: `${nodeSize}px`,
                height: `${nodeSize}px`,
                borderRadius: '50%',
                backgroundColor: nodeColor,
                cursor: 'pointer',
                border: `${2.5 * scale}px solid ${nodeBorder}`,
                zIndex: 5000,
                opacity: nodeOpacity,
                transition: 'opacity 0.18s ease, transform 0.12s ease',
                pointerEvents: 'auto',
                boxSizing: 'border-box',
                boxShadow: isDark
                    ? `0 0 ${4 * scale}px rgba(0, 0, 0, 0.5), inset 0 0 ${2 * scale}px rgba(255, 255, 255, 0.1)`
                    : `0 0 ${4 * scale}px rgba(0, 0, 0, 0.2), inset 0 0 ${2 * scale}px rgba(255, 255, 255, 0.3)`,
            }}
        />
    );

    return (
        <>
            {/* Three Receive Nodes (Left) - One for each anchor type */}
            {renderReceiveNode('receive-character', 30, 'Character image ')}
            {renderReceiveNode('receive-background', 50, 'Background Input')}
            {renderReceiveNode('receive-props', 70, 'Props Input')}
            {/* Send Node (Right) - Circle */}
            <div
                data-node-id={id}
                data-node-side="send"
                onPointerDown={(e: React.PointerEvent) => {
                    const el = e.currentTarget as HTMLElement;
                    const pid = e.pointerId;
                    try { el.setPointerCapture?.(pid); } catch (err) { }
                    // store active capture so receiver can release if needed
                    try { (window as any).__canvas_active_capture = { element: el, pid }; } catch (err) { }
                    if (!id) return;
                    e.stopPropagation();
                    e.preventDefault();
                    const color = '#437eb5';
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const DRAG_THRESHOLD_PX = 1;
                    let started = false;

                    const maybeStart = (mx: number, my: number) => {
                        if (started) return;
                        const dx = Math.abs(mx - startX);
                        const dy = Math.abs(my - startY);
                        if (dx >= DRAG_THRESHOLD_PX || dy >= DRAG_THRESHOLD_PX) {
                            started = true;
                            window.dispatchEvent(new CustomEvent('canvas-node-start', { detail: { id, side: 'send', color, startX, startY } }));
                        }
                    };

                    const handlePointerMove = (pe: PointerEvent) => {
                        if (pe.pointerId !== pid) return;
                        maybeStart(pe.clientX, pe.clientY);
                    };

                    const handlePointerUp = (pe: any) => {
                        try { el.releasePointerCapture?.(pe?.pointerId ?? pid); } catch (err) { }
                        try { delete (window as any).__canvas_active_capture; } catch (err) { }
                        window.removeEventListener('canvas-node-complete', handleComplete as any);
                        window.removeEventListener('pointerup', handlePointerUp as any);
                        window.removeEventListener('pointercancel', handlePointerUp as any);
                        window.removeEventListener('pointermove', handlePointerMove as any);
                    };

                    const handleComplete = () => {
                        try { el.releasePointerCapture?.(pid); } catch (err) { }
                        try { delete (window as any).__canvas_active_capture; } catch (err) { }
                        window.removeEventListener('canvas-node-complete', handleComplete as any);
                        window.removeEventListener('pointerup', handlePointerUp as any);
                        window.removeEventListener('pointercancel', handlePointerUp as any);
                        window.removeEventListener('pointermove', handlePointerMove as any);
                    };

                    window.addEventListener('canvas-node-complete', handleComplete as any);
                    window.addEventListener('pointerup', handlePointerUp as any);
                    window.addEventListener('pointercancel', handlePointerUp as any);
                    window.addEventListener('pointermove', handlePointerMove as any, { passive: true } as any);
                    // Do NOT start on simple click — only start once user drags while holding
                }}
                style={{
                    position: 'absolute',
                    right: `${-nodeOffset}px`,
                    top: '50%',
                    transform: 'translate(50%, -50%)',
                    width: `${nodeSize}px`,
                    height: `${nodeSize}px`,
                    borderRadius: '50%',
                    backgroundColor: nodeColor,
                    cursor: 'grab',
                    border: `${2.5 * scale}px solid ${nodeBorder}`,
                    zIndex: 10,
                    opacity: nodeOpacity,
                    transition: 'opacity 0.18s ease',
                    pointerEvents: 'auto',
                    boxSizing: 'border-box',
                    boxShadow: isDark
                        ? `0 0 ${4 * scale}px rgba(0, 0, 0, 0.5), inset 0 0 ${2 * scale}px rgba(255, 255, 255, 0.1)`
                        : `0 0 ${4 * scale}px rgba(0, 0, 0, 0.2), inset 0 0 ${2 * scale}px rgba(255, 255, 255, 0.3)`,
                }}
            />
        </>
    );
};
