'use client';

import React, { useEffect, useState } from 'react';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

export function PluginConnectionNodes(props: {
  id: string | undefined;
  scale: number;
  isHovered: boolean;
  isSelected: boolean;
  color?: string;
}) {
  const { id, scale, isHovered, isSelected, color = '#437eb5' } = props;
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const isDark = useIsDarkTheme();

  useEffect(() => {
    const handleActive = (e: Event) => {
      const ce = e as CustomEvent;
      setGlobalDragActive(Boolean(ce.detail?.active));
    };
    window.addEventListener('canvas-node-active', handleActive as any);
    return () => window.removeEventListener('canvas-node-active', handleActive as any);
  }, []);

  const nodeOpacity = (isHovered || isSelected || globalDragActive) ? 1 : 0.85;
  const nodeColor = isDark ? '#808080' : '#606060';
  const nodeBorder = isDark ? '#2a2a2a' : '#c0c0c0';

  const nodeSize = 18 * scale;
  const nodeOffset = 9 * scale;

  return (
    <>
      <div
        data-node-id={id}
        data-node-side="receive"
        onPointerEnter={() => {
          if (!id) return;
          window.dispatchEvent(new CustomEvent('canvas-node-hover', { detail: { nodeId: id } }));
        }}
        onPointerLeave={() => {
          if (!id) return;
          window.dispatchEvent(new CustomEvent('canvas-node-leave', { detail: { nodeId: id } }));
        }}
        onPointerUp={(e) => {
          if (!id) return;
          e.stopPropagation();
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('canvas-node-complete', { detail: { id, side: 'receive' } }));
          try {
            const active: any = (window as any).__canvas_active_capture;
            if (active?.element && typeof active?.pid === 'number') {
              try { active.element.releasePointerCapture(active.pid); } catch {}
              delete (window as any).__canvas_active_capture;
            }
          } catch {}
        }}
        style={{
          position: 'absolute',
          left: `${-nodeOffset}px`,
          top: '50%',
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

      <div
        data-node-id={id}
        data-node-side="send"
        onPointerDown={(e: React.PointerEvent) => {
          const el = e.currentTarget as HTMLElement;
          const pid = e.pointerId;
          try { el.setPointerCapture?.(pid); } catch {}
          try { (window as any).__canvas_active_capture = { element: el, pid }; } catch {}
          if (!id) return;
          e.stopPropagation();
          e.preventDefault();

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

          const cleanup = (pe?: any) => {
            try { el.releasePointerCapture?.(pe?.pointerId ?? pid); } catch {}
            try { delete (window as any).__canvas_active_capture; } catch {}
            window.removeEventListener('canvas-node-complete', handleComplete as any);
            window.removeEventListener('pointerup', handlePointerUp as any);
            window.removeEventListener('pointercancel', handlePointerUp as any);
            window.removeEventListener('pointermove', handlePointerMove as any);
          };

          const handlePointerUp = (pe: any) => cleanup(pe);
          const handleComplete = () => cleanup();

          window.addEventListener('canvas-node-complete', handleComplete as any);
          window.addEventListener('pointerup', handlePointerUp as any);
          window.addEventListener('pointercancel', handlePointerUp as any);
          window.addEventListener('pointermove', handlePointerMove as any, { passive: true } as any);
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
}

