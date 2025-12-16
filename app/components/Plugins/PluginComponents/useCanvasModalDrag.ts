'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Point = { x: number; y: number };

export function defaultShouldIgnoreCanvasDragTarget(target: Element | null): boolean {
  if (!target) return true;
  const el = target as HTMLElement;

  const tag = el.tagName;
  const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  if (isInput) return true;

  const isButton = tag === 'BUTTON' || Boolean(el.closest('button'));
  if (isButton) return true;

  // Controls overlay area
  if (el.closest('.controls-overlay')) return true;

  // Action icons container
  if (el.closest('[data-action-icons]')) return true;

  // Connection nodes (send/receive)
  if (el.closest('[data-node-id]')) return true;
  if (el.hasAttribute('data-node-id') || el.hasAttribute('data-node-side')) return true;

  return false;
}

export interface UseCanvasModalDragArgs {
  enabled?: boolean;

  x: number;
  y: number;
  scale: number;
  position: Point;

  containerRef: React.RefObject<HTMLElement | null>;

  onPositionChange?: (x: number, y: number) => void;
  onPositionCommit?: (x: number, y: number) => void;
  onSelect?: () => void;

  // Called when pointer up happens without a real drag (tap/click)
  onTap?: () => void;

  // Pixels of movement required to treat as a drag (not a click)
  dragThresholdPx?: number;

  // Return true to ignore starting a drag from this target
  shouldIgnoreTarget?: (target: Element | null) => boolean;
}

export function useCanvasModalDrag({
  enabled = true,
  x,
  y,
  scale,
  position,
  containerRef,
  onPositionChange,
  onPositionCommit,
  onSelect,
  onTap,
  dragThresholdPx = 5,
  shouldIgnoreTarget = defaultShouldIgnoreCanvasDragTarget,
}: UseCanvasModalDragArgs) {
  const [isDragging, setIsDragging] = useState(false);

  const MOUSE_POINTER_ID = -1;
  const activePointerIdRef = useRef<number | null>(null);
  const startClientRef = useRef<Point | null>(null);
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<Point>({ x, y });
  const hasDraggedRef = useRef(false);

  const scaleRef = useRef(scale);
  const positionRef = useRef(position);
  useEffect(() => {
    scaleRef.current = scale;
    positionRef.current = position;
  }, [scale, position]);

  const onPositionChangeRef = useRef(onPositionChange);
  const onPositionCommitRef = useRef(onPositionCommit);
  const onSelectRef = useRef(onSelect);
  const onTapRef = useRef(onTap);
  const dragThresholdRef = useRef(dragThresholdPx);
  const shouldIgnoreTargetRef = useRef(shouldIgnoreTarget);
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
    onPositionCommitRef.current = onPositionCommit;
    onSelectRef.current = onSelect;
    onTapRef.current = onTap;
    dragThresholdRef.current = dragThresholdPx;
    shouldIgnoreTargetRef.current = shouldIgnoreTarget;
  }, [onPositionChange, onPositionCommit, onSelect, onTap, dragThresholdPx, shouldIgnoreTarget]);

  useEffect(() => {
    lastCanvasPosRef.current = { x, y };
  }, [x, y]);

  const cleanupListenersRef = useRef<(() => void) | null>(null);

  const stopEvent = (e: any) => {
    try {
      e.preventDefault?.();
      e.stopPropagation?.();
      if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
        e.nativeEvent.stopImmediatePropagation();
      }
    } catch {}
  };

  const endDrag = useCallback((e?: PointerEvent | MouseEvent) => {
    if (activePointerIdRef.current == null) return;

    // Release pointer capture
    try {
      const el = containerRef.current;
      if (el && activePointerIdRef.current !== MOUSE_POINTER_ID && typeof (el as any).releasePointerCapture === 'function') {
        (el as any).releasePointerCapture(activePointerIdRef.current);
      }
    } catch {}

    // Remove window listeners
    cleanupListenersRef.current?.();
    cleanupListenersRef.current = null;

    const wasDragging = hasDraggedRef.current;
    hasDraggedRef.current = false;

    activePointerIdRef.current = null;
    startClientRef.current = null;

    setIsDragging(false);
    try {
      document.body.style.cursor = '';
    } catch {}

    if (!wasDragging) {
      try {
        onTapRef.current?.();
      } catch {}
    }

    if (onPositionCommitRef.current) {
      const finalX = lastCanvasPosRef.current.x;
      const finalY = lastCanvasPosRef.current.y;
      try {
        onPositionCommitRef.current(finalX, finalY);
      } catch {}
    }
  }, [containerRef]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      if (e.button !== 0) return; // left click only

      const target = e.target as Element | null;
      const ignore = shouldIgnoreTargetRef.current?.(target) ?? false;

      // Selection should still happen if the click isn't on ignored UI
      if (!ignore) {
        try {
          onSelectRef.current?.();
        } catch {}
      }

      if (ignore) return;

      const el = containerRef.current;
      if (!el) return;

      stopEvent(e);

      activePointerIdRef.current = e.pointerId;
      startClientRef.current = { x: e.clientX, y: e.clientY };
      hasDraggedRef.current = false;

      const rect = el.getBoundingClientRect();
      dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      setIsDragging(true);
      try {
        document.body.style.cursor = 'grabbing';
      } catch {}

      // Capture pointer so we keep receiving move/up events
      try {
        if (typeof (el as any).setPointerCapture === 'function') {
          (el as any).setPointerCapture(e.pointerId);
        }
      } catch {}

      const handlePointerMove = (ev: PointerEvent) => {
        if (activePointerIdRef.current == null) return;
        if (ev.pointerId !== activePointerIdRef.current) return;
        if (!startClientRef.current) return;
        if (!onPositionChangeRef.current) return;

        const dx = Math.abs(ev.clientX - startClientRef.current.x);
        const dy = Math.abs(ev.clientY - startClientRef.current.y);
        if (dx > dragThresholdRef.current || dy > dragThresholdRef.current) {
          hasDraggedRef.current = true;
        }

        const newScreenX = ev.clientX - dragOffsetRef.current.x;
        const newScreenY = ev.clientY - dragOffsetRef.current.y;
        const newCanvasX = (newScreenX - positionRef.current.x) / scaleRef.current;
        const newCanvasY = (newScreenY - positionRef.current.y) / scaleRef.current;

        try {
          onPositionChangeRef.current(newCanvasX, newCanvasY);
          lastCanvasPosRef.current = { x: newCanvasX, y: newCanvasY };
        } catch {}
      };

      const handlePointerUp = (ev: PointerEvent) => {
        if (activePointerIdRef.current == null) return;
        if (ev.pointerId !== activePointerIdRef.current) return;
        endDrag(ev);
      };

      // Capture phase so stopPropagation in children can't block cleanup
      window.addEventListener('pointermove', handlePointerMove, true);
      window.addEventListener('pointerup', handlePointerUp, true);
      window.addEventListener('pointercancel', handlePointerUp, true);

      cleanupListenersRef.current = () => {
        window.removeEventListener('pointermove', handlePointerMove, true);
        window.removeEventListener('pointerup', handlePointerUp, true);
        window.removeEventListener('pointercancel', handlePointerUp, true);
      };
    },
    [containerRef, enabled, endDrag],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;
      if (e.button !== 0) return; // left click only

      const target = e.target as Element | null;
      const ignore = shouldIgnoreTargetRef.current?.(target) ?? false;

      if (!ignore) {
        try {
          onSelectRef.current?.();
        } catch {}
      }

      if (ignore) return;

      const el = containerRef.current;
      if (!el) return;

      stopEvent(e);

      activePointerIdRef.current = MOUSE_POINTER_ID;
      startClientRef.current = { x: e.clientX, y: e.clientY };
      hasDraggedRef.current = false;

      const rect = el.getBoundingClientRect();
      dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      setIsDragging(true);
      try {
        document.body.style.cursor = 'grabbing';
      } catch {}

      const handleMouseMove = (ev: MouseEvent) => {
        if (activePointerIdRef.current !== MOUSE_POINTER_ID) return;
        if (!startClientRef.current) return;
        if (!onPositionChangeRef.current) return;

        const dx = Math.abs(ev.clientX - startClientRef.current.x);
        const dy = Math.abs(ev.clientY - startClientRef.current.y);
        if (dx > dragThresholdRef.current || dy > dragThresholdRef.current) {
          hasDraggedRef.current = true;
        }

        const newScreenX = ev.clientX - dragOffsetRef.current.x;
        const newScreenY = ev.clientY - dragOffsetRef.current.y;
        const newCanvasX = (newScreenX - positionRef.current.x) / scaleRef.current;
        const newCanvasY = (newScreenY - positionRef.current.y) / scaleRef.current;

        try {
          onPositionChangeRef.current(newCanvasX, newCanvasY);
          lastCanvasPosRef.current = { x: newCanvasX, y: newCanvasY };
        } catch {}
      };

      const handleMouseUp = (ev: MouseEvent) => {
        if (activePointerIdRef.current !== MOUSE_POINTER_ID) return;
        endDrag(ev);
      };

      window.addEventListener('mousemove', handleMouseMove, true);
      window.addEventListener('mouseup', handleMouseUp, true);

      cleanupListenersRef.current = () => {
        window.removeEventListener('mousemove', handleMouseMove, true);
        window.removeEventListener('mouseup', handleMouseUp, true);
      };
    },
    [containerRef, enabled, endDrag],
  );

  // Safety cleanup if unmounted mid-drag
  useEffect(() => {
    return () => {
      cleanupListenersRef.current?.();
      cleanupListenersRef.current = null;
      try {
        document.body.style.cursor = '';
      } catch {}
    };
  }, []);

  return { isDragging, onPointerDown, onMouseDown };
}

