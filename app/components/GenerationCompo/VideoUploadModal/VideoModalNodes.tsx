'use client';
import React from 'react';

interface VideoModalNodesProps {
  id?: string;
  scale: number;
  isHovered: boolean;
  isSelected: boolean;
  globalDragActive: boolean;
}

export const VideoModalNodes: React.FC<VideoModalNodesProps> = ({
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
          window.dispatchEvent(new CustomEvent('canvas-node-complete', { detail: { id, side: 'receive' } }));
          try {
            const active: any = (window as any).__canvas_active_capture;
            if (active?.element && typeof active?.pid === 'number') {
              try { active.element.releasePointerCapture(active.pid); } catch (err) {}
              delete (window as any).__canvas_active_capture;
            }
          } catch (err) {}
        }}
        style={{
          position: 'absolute',
          left: `${-12 * scale}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: `${20 * scale}px`,
          height: `${20 * scale}px`,
          borderRadius: '50%',
          backgroundColor: '#437eb5',
          cursor: 'pointer',
          border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
          zIndex: 5000,
          opacity: (isHovered || isSelected || globalDragActive) ? 1 : 0,
          transition: 'opacity 0.18s ease',
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
          try { el.setPointerCapture?.(pid); } catch (err) {}
          if (!id) return;
          e.stopPropagation();
          e.preventDefault();
          const color = '#437eb5';

          const handlePointerUp = (pe: any) => {
            try { el.releasePointerCapture?.(pe?.pointerId ?? pid); } catch (err) {}
            window.removeEventListener('canvas-node-complete', handleComplete as any);
            window.removeEventListener('pointerup', handlePointerUp as any);
          };

          const handleComplete = () => {
            try { el.releasePointerCapture?.(pid); } catch (err) {}
            window.removeEventListener('canvas-node-complete', handleComplete as any);
            window.removeEventListener('pointerup', handlePointerUp as any);
          };

          window.addEventListener('canvas-node-complete', handleComplete as any);
          window.addEventListener('pointerup', handlePointerUp as any);

          window.dispatchEvent(new CustomEvent('canvas-node-start', { detail: { id, side: 'send', color, startX: e.clientX, startY: e.clientY } }));
        }}
        style={{
          position: 'absolute',
          right: `${-12 * scale}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          width: `${18 * scale}px`,
          height: `${18 * scale}px`,
          borderRadius: '50%',
          backgroundColor: '#437eb5',
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

