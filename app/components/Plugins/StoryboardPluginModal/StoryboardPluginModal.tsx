'use client';

import { useState, useRef, useEffect } from 'react';
import '../../common/canvasCaptureGuard';
import { ConnectionNodes } from '../UpscalePluginModal/ConnectionNodes';

interface StoryboardPluginModalProps {
  isOpen: boolean;
  id?: string;
  onClose: () => void;
  stageRef: React.RefObject<any>;
  scale: number;
  position: { x: number; y: number };
  x: number;
  y: number;
  onPositionChange?: (x: number, y: number) => void;
  onPositionCommit?: (x: number, y: number) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onDuplicate?: () => void;
  isSelected?: boolean;
  frameWidth?: number;
  frameHeight?: number;
  onOptionsChange?: (opts: { frameWidth?: number; frameHeight?: number }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }>;
  textInputStates?: Array<{ id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }>;
  scriptText?: string | null;
}

export const StoryboardPluginModal: React.FC<StoryboardPluginModalProps> = ({
  isOpen,
  id,
  onClose,
  stageRef,
  scale,
  position,
  x,
  y,
  onPositionChange,
  onPositionCommit,
  onSelect,
  onDelete,
  onDownload,
  onDuplicate,
  isSelected,
  frameWidth = 400,
  frameHeight = 500,
  onOptionsChange,
  connections = [],
  textInputStates = [],
  scriptText,
}) => {
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;

  // No additional variables needed for simple circular plugin

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left mouse button

    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isImage = target.tagName === 'IMG';
    const isControls = target.closest('[data-controls]');
    // Check if clicking on connection nodes - prevent popup and dragging
    const isConnectionNode = target.closest('[data-node-id]') || target.hasAttribute('data-node-id') || target.hasAttribute('data-node-side');

    // Don't do anything if clicking on connection nodes
    if (isConnectionNode) {
      return;
    }

    // Call onSelect when clicking on the modal
    if (onSelect && !isInput && !isButton && !isControls && !isConnectionNode) {
      onSelect();
    }

    // Only allow dragging from the frame, not from controls or connection nodes
    if (!isInput && !isButton && !isImage && !isControls && !isConnectionNode) {
      // Track initial mouse position to detect drag vs click
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      hasDraggedRef.current = false;

      setIsDraggingContainer(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      lastCanvasPosRef.current = { x, y };
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Handle drag
  useEffect(() => {
    if (!isDraggingContainer) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !onPositionChange) return;

      // Check if mouse moved significantly (more than 5px) to detect drag
      if (dragStartPosRef.current) {
        const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
        const dy = Math.abs(e.clientY - dragStartPosRef.current.y);
        if (dx > 5 || dy > 5) {
          hasDraggedRef.current = true;
        }
      }

      // Calculate new screen position
      const newScreenX = e.clientX - dragOffset.x;
      const newScreenY = e.clientY - dragOffset.y;

      // Convert screen coordinates back to canvas coordinates
      const newCanvasX = (newScreenX - position.x) / scale;
      const newCanvasY = (newScreenY - position.y) / scale;

      onPositionChange(newCanvasX, newCanvasY);
      lastCanvasPosRef.current = { x: newCanvasX, y: newCanvasY };
    };

    const handleMouseUp = (e?: MouseEvent) => {
      // Don't toggle popup if the mouse up was on a connection node
      if (e) {
        const target = e.target as HTMLElement;
        const isConnectionNode = target.closest('[data-node-id]') || target.hasAttribute('data-node-id') || target.hasAttribute('data-node-side');
        if (isConnectionNode) {
          setIsDraggingContainer(false);
          dragStartPosRef.current = null;
          hasDraggedRef.current = false;
          return; // Don't toggle popup or commit position if clicking on connection node
        }
      }

      const wasDragging = hasDraggedRef.current;
      setIsDraggingContainer(false);
      dragStartPosRef.current = null;

      if (onPositionCommit) {
        const finalX = lastCanvasPosRef.current?.x ?? x;
        const finalY = lastCanvasPosRef.current?.y ?? y;
        onPositionCommit(finalX, finalY);
      }

      hasDraggedRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingContainer, dragOffset, scale, position, onPositionChange, onPositionCommit, x, y]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      data-modal-component="storyboard"
      data-overlay-id={id}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        zIndex: isHovered || isSelected ? 2001 : 2000,
        userSelect: 'none',
      }}
    >
      {/* Plugin node design with icon and label */}
      <div
        data-frame-id={id ? `${id}-frame` : undefined}
        style={{
          position: 'relative',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 10,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
      >
        {/* Main plugin container - Circular */}
        <div
          style={{
            position: 'relative',
            width: `${100 * scale}px`,
            height: `${100 * scale}px`,
            backgroundColor: isDark ? '#2d2d2d' : '#e5e5e5',
            borderRadius: '50%',
            border: `${1.5 * scale}px solid ${isDark ? '#3a3a3a' : '#a0a0a0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: isDark
              ? (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.3)`)
              : (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.2)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.1)`),
            transform: (isHovered || isSelected) ? `scale(1.03)` : 'scale(1)',
            overflow: 'visible',
          }}
        >
          {/* Storyboard Icon - Using SVG */}
          <svg
            width={40 * scale}
            height={40 * scale}
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDark ? '#ffffff' : '#1a1a1a'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <line x1="2" y1="9" x2="22" y2="9" />
            <line x1="12" y1="3" x2="12" y2="9" />
          </svg>

          <ConnectionNodes
            id={id}
            scale={scale}
            isHovered={isHovered}
            isSelected={isSelected || false}
          />
        </div>

        {/* Label below */}
        <div
          style={{
            marginTop: `${8 * scale}px`,
            fontSize: `${12 * scale}px`,
            fontWeight: 500,
            color: isDark ? '#ffffff' : '#1a1a1a',
            textAlign: 'center',
            userSelect: 'none',
            transition: 'color 0.3s ease',
            letterSpacing: '0.2px',
          }}
        >
          Storyboard
        </div>
      </div>
    </div>
  );
};

