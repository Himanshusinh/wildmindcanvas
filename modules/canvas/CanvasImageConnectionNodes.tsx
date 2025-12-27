'use client';

import { useEffect, useState } from 'react';
import { ImageUpload } from '@/core/types/canvas';

interface CanvasImageConnectionNodesProps {
  images: ImageUpload[];
  stageRef: React.RefObject<any>;
  position: { x: number; y: number };
  scale: number;
  selectedImageIndices: number[];
}

export const CanvasImageConnectionNodes: React.FC<CanvasImageConnectionNodesProps> = ({
  images,
  stageRef,
  position,
  scale,
  selectedImageIndices,
}) => {
  const [stageState, setStageState] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const [hoveredIndices, setHoveredIndices] = useState<Set<number>>(new Set());

  // Update stage state when stage moves or zooms
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateState = () => {
      setStageState({
        x: stage.x(),
        y: stage.y(),
        scale: stage.scaleX(),
      });
    };

    // Initial state
    updateState();

    // Listen for stage changes
    const interval = setInterval(updateState, 16); // ~60fps

    return () => clearInterval(interval);
  }, [stageRef]);

  // Listen for global node-drag active state
  useEffect(() => {
    const handleActive = (e: Event) => {
      const ce = e as CustomEvent;
      setGlobalDragActive(Boolean(ce.detail?.active));
    };
    window.addEventListener('canvas-node-active', handleActive as any);
    return () => window.removeEventListener('canvas-node-active', handleActive as any);
  }, []);

  // Set up hover detection for uploaded images using custom events from CanvasImage
  useEffect(() => {
    const handleImageHover = (e: Event) => {
      const ce = e as CustomEvent;
      const { index, hovered } = ce.detail || {};
      if (typeof index !== 'number') return;
      
          setHoveredIndices(prev => {
            const next = new Set(prev);
        if (hovered) {
          next.add(index);
        } else {
          next.delete(index);
        }
            return next;
          });
    };

    window.addEventListener('canvas-image-hover', handleImageHover as any);
    return () => {
      window.removeEventListener('canvas-image-hover', handleImageHover as any);
    };
  }, []);

  // Get stage container for positioning
  const container = stageRef.current?.container?.();
  if (!container) return null;

  const containerRect = container.getBoundingClientRect();

  return (
    <>
      {images
        .filter((img) => img.type !== 'model3d' && img.type !== 'text')
        .map((imageData, index) => {
          // Check if this is an uploaded image
          const isUploaded = 
            imageData.file || 
            (imageData.url && (
              imageData.url.toLowerCase().startsWith('blob:') || 
              imageData.url.toLowerCase().includes('/input/') ||
              (imageData.url.toLowerCase().includes('upload-') && imageData.url.toLowerCase().includes('zata.ai'))
            ));

          // Only show nodes for uploaded images (they should have connection nodes like generation frames)
          if (!isUploaded) return null;
          
          // Debug: Log when nodes should be shown
          // console.log('[CanvasImageConnectionNodes] Rendering nodes for uploaded image:', {
          //   index,
          //   isUploaded,
          //   hasFile: !!imageData.file,
          //   url: imageData.url?.substring(0, 50)
          // });

          const actualIndex = images.findIndex(img => img === imageData);
          const isSelected = selectedImageIndices.includes(actualIndex);
          const isHovered = hoveredIndices.has(actualIndex);
          
          // Generate unique ID for connection nodes
          const nodeId = imageData.elementId || `canvas-image-${actualIndex}`;
          
          // Calculate screen position
          const canvasX = imageData.x || 0;
          const canvasY = imageData.y || 0;
          const canvasWidth = imageData.width || 400;
          const canvasHeight = imageData.height || 400;

          // Use stage scale for positioning (this matches Konva's coordinate system)
          const screenX = canvasX * stageState.scale + stageState.x;
          const screenY = canvasY * stageState.scale + stageState.y;
          const screenWidth = canvasWidth * stageState.scale;
          const screenHeight = canvasHeight * stageState.scale;

          // Use the scale prop for node size (UI scaling)
          const nodeSize = 20 * scale;
          const nodeOffset = 12 * scale;
          
          const shouldShowNodes = isSelected || globalDragActive || isHovered;

          return (
            <div key={`connection-nodes-${actualIndex}`}>
              {/* Receive Node (Left) */}
              <div
                data-node-id={nodeId}
                data-node-side="receive"
                data-component-type={imageData.type === 'video' ? 'video' : 'image'}
                onPointerEnter={(e) => {
                  window.dispatchEvent(new CustomEvent('canvas-node-hover', { detail: { nodeId } }));
                }}
                onPointerLeave={(e) => {
                  window.dispatchEvent(new CustomEvent('canvas-node-leave', { detail: { nodeId } }));
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('canvas-node-complete', { detail: { id: nodeId, side: 'receive' } }));
                  try {
                    const active: any = (window as any).__canvas_active_capture;
                    if (active?.element && typeof active?.pid === 'number') {
                      try { active.element.releasePointerCapture(active.pid); } catch (err) {}
                      delete (window as any).__canvas_active_capture;
                    }
                  } catch (err) {}
                }}
                style={{
                  position: 'fixed',
                  left: `${containerRect.left + screenX - nodeOffset}px`,
                  top: `${containerRect.top + screenY + screenHeight / 2}px`,
                  transform: 'translateY(-50%)',
                  width: `${nodeSize}px`,
                  height: `${nodeSize}px`,
                  borderRadius: '50%',
                  backgroundColor: '#437eb5',
                  cursor: 'pointer',
                  border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
                  zIndex: 5000,
                  opacity: shouldShowNodes ? 1 : 0,
                  transition: 'opacity 0.18s ease, transform 0.12s ease',
                  pointerEvents: 'auto',
                  boxShadow: `0 0 ${8 * scale}px rgba(0,0,0,0.25)`,
                }}
              />
              {/* Send Node (Right) */}
              <div
                data-node-id={nodeId}
                data-node-side="send"
                data-component-type={imageData.type === 'video' ? 'video' : 'image'}
                onPointerDown={(e: React.PointerEvent) => {
                  const el = e.currentTarget as HTMLElement;
                  const pid = e.pointerId;
                  try { el.setPointerCapture?.(pid); } catch (err) {}
                  try { (window as any).__canvas_active_capture = { element: el, pid }; } catch (err) {}
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
                      window.dispatchEvent(new CustomEvent('canvas-node-start', { detail: { id: nodeId, side: 'send', color, startX, startY } }));
                    }
                  };

                  const handlePointerMove = (pe: PointerEvent) => {
                    if (pe.pointerId !== pid) return;
                    maybeStart(pe.clientX, pe.clientY);
                  };

                  const handlePointerUp = (pe: any) => {
                    try { el.releasePointerCapture?.(pe?.pointerId ?? pid); } catch (err) {}
                    try { delete (window as any).__canvas_active_capture; } catch (err) {}
                    window.removeEventListener('canvas-node-complete', handleComplete as any);
                    window.removeEventListener('pointerup', handlePointerUp as any);
                    window.removeEventListener('pointercancel', handlePointerUp as any);
                    window.removeEventListener('pointermove', handlePointerMove as any);
                  };

                  const handleComplete = () => {
                    try { el.releasePointerCapture?.(pid); } catch (err) {}
                    try { delete (window as any).__canvas_active_capture; } catch (err) {}
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
                  position: 'fixed',
                  left: `${containerRect.left + screenX + screenWidth + nodeOffset}px`,
                  top: `${containerRect.top + screenY + screenHeight / 2}px`,
                  transform: 'translateY(-50%)',
                  width: `${nodeSize}px`,
                  height: `${nodeSize}px`,
                  borderRadius: '50%',
                  backgroundColor: '#437eb5',
                  boxShadow: `0 0 ${8 * scale}px rgba(0,0,0,0.25)`,
                  cursor: 'grab',
                  border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
                  zIndex: 10,
                  opacity: shouldShowNodes ? 1 : 0,
                  transition: 'opacity 0.18s ease',
                  pointerEvents: 'auto',
                }}
              />
            </div>
          );
        })}
    </>
  );
};

