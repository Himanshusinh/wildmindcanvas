'use client';
import React from 'react';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';

interface TextModalNodesProps {
  id: string;
  scale: number;
  isHovered: boolean;
  isSelected: boolean;
  globalDragActive: boolean;
}

export const TextModalNodes: React.FC<TextModalNodesProps> = ({
  id,
  scale,
  isHovered,
  isSelected,
  globalDragActive,
}) => {
  return (
    <>
      {/* Receive Node (Left) */}
      <div
        data-node-id={id}
        data-node-side="receive"
        onPointerEnter={(e) => {
          window.dispatchEvent(new CustomEvent('canvas-node-hover', { detail: { nodeId: id } }));
        }}
        onPointerLeave={(e) => {
          window.dispatchEvent(new CustomEvent('canvas-node-leave', { detail: { nodeId: id } }));
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('canvas-node-complete', { detail: { id, side: 'receive' } }));
          // Try to release any active capture recorded by the sender
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
          left: `${-25 * scale}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: `${20 * scale}px`,
          height: `${20 * scale}px`,
          borderRadius: '50%',
          backgroundColor: SELECTION_COLOR,
          cursor: 'pointer',
          border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
          zIndex: 5000,
          opacity: (isHovered || isSelected || globalDragActive) ? 1 : 0,
          transition: 'opacity 0.18s ease, transform 0.12s ease',
          pointerEvents: 'auto',
        }}
      />
      {/* Send Node (Right) */}
      <div
        data-node-id={id}
        data-node-side="send"
        onPointerDown={(e: React.PointerEvent) => {
          const el = e.currentTarget as HTMLElement;
          const pid = e.pointerId;
          try { el.setPointerCapture?.(pid); } catch (err) { }
          // Record active capture globally so receivers can attempt release
          try { (window as any).__canvas_active_capture = { element: el, pid }; } catch (err) { }
          e.stopPropagation();
          e.preventDefault();
          const color = SELECTION_COLOR;
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
          right: `${-25 * scale}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: `${20 * scale}px`,
          height: `${20 * scale}px`,
          borderRadius: '50%',
          backgroundColor: SELECTION_COLOR,
          boxShadow: `0 0 ${8 * scale}px rgba(0,0,0,0.25)`,
          cursor: 'grab',
          border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
          zIndex: 5000,
          opacity: (isHovered || isSelected || globalDragActive) ? 1 : 0,
          transition: 'opacity 0.18s ease, transform 0.12s ease',
          pointerEvents: 'auto',
        }}
      />
    </>
  );
};

