import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';

// Canvas pattern configuration
const DOT_SPACING = 30;
const DOT_SIZE = 4;
const DOT_OPACITY = 0.10;
const INFINITE_CANVAS_SIZE = 1000000;

interface UseCanvasViewportOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  stageRef: React.RefObject<Konva.Stage>;
  onViewportChange?: (center: { x: number; y: number }, scale: number) => void;
}

interface UseCanvasViewportReturn {
  viewportSize: { width: number; height: number };
  scale: number;
  position: { x: number; y: number };
  patternImage: HTMLImageElement | null;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  setPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  updateViewportCenter: (pos: { x: number; y: number }, currentScale: number) => void;
  canvasSize: { width: number; height: number };
}

/**
 * Hook for managing canvas viewport (size, scale, position, pattern)
 * Handles viewport resizing, canvas pattern creation, and wheel zoom
 */
export function useCanvasViewport(options: UseCanvasViewportOptions): UseCanvasViewportReturn {
  const { containerRef, stageRef, onViewportChange } = options;
  
  const initializedRef = useRef(false);
  const [patternImage, setPatternImage] = useState<HTMLImageElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const canvasSize = { width: INFINITE_CANVAS_SIZE, height: INFINITE_CANVAS_SIZE };

  // Calculate and expose viewport center
  const updateViewportCenter = (pos: { x: number; y: number }, currentScale: number) => {
    if (onViewportChange && stageRef.current) {
      const centerX = (viewportSize.width / 2 - pos.x) / currentScale;
      const centerY = (viewportSize.height / 2 - pos.y) / currentScale;
      onViewportChange({ x: centerX, y: centerY }, currentScale);
    }
  };

  // Update viewport size on window resize and center initial view
  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        const newSize = {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        };
        setViewportSize(newSize);
        
        // Center the view on the canvas initially (only once)
        if (!initializedRef.current) {
          initializedRef.current = true;
          const initialPos = {
            x: (newSize.width - canvasSize.width) / 2,
            y: (newSize.height - canvasSize.height) / 2,
          };
          setPosition(initialPos);
          setTimeout(() => updateViewportCenter(initialPos, scale), 0);
        }
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, [containerRef, canvasSize.width, canvasSize.height, scale]);

  // Create canvas pattern
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = DOT_SPACING;
    canvas.height = DOT_SPACING;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, DOT_SPACING, DOT_SPACING);
      ctx.fillStyle = `rgba(0, 0, 0, ${DOT_OPACITY})`;
      ctx.beginPath();
      ctx.arc(DOT_SPACING / 2, DOT_SPACING / 2, DOT_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const img = new Image();
    img.onload = () => {
      setPatternImage(img);
    };
    img.src = canvas.toDataURL();

    // Enable WebGL optimization
    try {
      Konva.pixelRatio = window.devicePixelRatio || 1;
    } catch (e) {
      console.warn('WebGL optimization not available');
    }
  }, []);

  // Handle wheel zoom
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      // Detect macOS two-finger trackpad scroll for panning
      const isMac = typeof navigator !== 'undefined' && (/Mac|iPad|iPhone|Macintosh/.test(navigator.platform || '') || /Macintosh/.test(navigator.userAgent || ''));
      const isModifier = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;
      const absDeltaX = Math.abs(e.deltaX || 0);
      const absDeltaY = Math.abs(e.deltaY || 0);

      // If on Mac, no modifier keys, and we have horizontal/vertical deltas from touchpad, treat as pan
      if (isMac && !isModifier && (absDeltaX > 0 || absDeltaY > 0) && Math.max(absDeltaX, absDeltaY) < 400) {
        setPosition(prev => {
          const newPos = { x: prev.x - e.deltaX, y: prev.y - e.deltaY };
          setTimeout(() => {
            if (onViewportChange && stageRef.current) {
              const centerX = (viewportSize.width / 2 - newPos.x) / scale;
              const centerY = (viewportSize.height / 2 - newPos.y) / scale;
              onViewportChange({ x: centerX, y: centerY }, scale);
            }
          }, 0);
          return newPos;
        });
        return;
      }

      // Otherwise, treat as zoom (mouse wheel)
      const currentScale = scale;
      const currentPosition = position;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - currentPosition.x) / currentScale,
        y: (pointer.y - currentPosition.y) / currentScale,
      };

      const direction = e.deltaY > 0 ? -1 : 1;
      const scaleBy = 1.1;
      const newScale = direction > 0 ? currentScale * scaleBy : currentScale / scaleBy;
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      setScale(clampedScale);

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      setPosition(newPos);
      setTimeout(() => {
        if (onViewportChange && stageRef.current) {
          const centerX = (viewportSize.width / 2 - newPos.x) / clampedScale;
          const centerY = (viewportSize.height / 2 - newPos.y) / clampedScale;
          onViewportChange({ x: centerX, y: centerY }, clampedScale);
        }
      }, 0);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [scale, position, stageRef, onViewportChange, viewportSize]);

  // Update viewport center when scale or position changes
  useEffect(() => {
    if (initializedRef.current && onViewportChange) {
      updateViewportCenter(position, scale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.x, position.y, scale, viewportSize.width, viewportSize.height, onViewportChange]);

  return {
    viewportSize,
    scale,
    position,
    patternImage,
    setScale,
    setPosition,
    updateViewportCenter,
    canvasSize,
  };
}

