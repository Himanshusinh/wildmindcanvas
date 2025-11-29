'use client';

import React, { useState, useEffect } from 'react';
import Konva from 'konva';
import { ScriptFrame } from '@/app/components/Plugins/StoryboardPluginModal/ScriptFrame';
import { ConnectionNodes } from '@/app/components/Plugins/UpscalePluginModal/ConnectionNodes';

interface ScriptFrameModalState {
  id: string;
  pluginId: string;
  x: number;
  y: number;
  frameWidth: number;
  frameHeight: number;
  text: string;
}

interface ScriptFrameModalOverlaysProps {
  scriptFrameModalStates: ScriptFrameModalState[];
  onDelete?: (frameId: string) => void;
  onPositionChange?: (frameId: string, x: number, y: number) => void;
  onPositionCommit?: (frameId: string, x: number, y: number) => void;
  onTextUpdate?: (frameId: string, text: string) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  onGenerateScenes?: (scriptFrameId: string) => void;
}

export const ScriptFrameModalOverlays: React.FC<ScriptFrameModalOverlaysProps> = ({
  scriptFrameModalStates,
  onDelete,
  onGenerateScenes,
  onPositionChange,
  onPositionCommit,
  onTextUpdate,
  stageRef,
  scale,
  position,
}) => {
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

  return (
    <>
      {scriptFrameModalStates.map((frame) => (
        <ScriptFrameModal
          key={frame.id}
          frame={frame}
          isDark={isDark}
          scale={scale}
          position={position}
          onDelete={onDelete}
          onGenerateScenes={onGenerateScenes}
          onPositionChange={onPositionChange}
          onPositionCommit={onPositionCommit}
          onTextUpdate={onTextUpdate}
        />
      ))}
    </>
  );
};

// Individual script frame modal with dragging functionality
interface ScriptFrameModalProps {
  frame: ScriptFrameModalState;
  isDark: boolean;
  scale: number;
  position: { x: number; y: number };
  onDelete?: (frameId: string) => void;
  onGenerateScenes?: (scriptFrameId: string) => void;
  onPositionChange?: (frameId: string, x: number, y: number) => void;
  onPositionCommit?: (frameId: string, x: number, y: number) => void;
  onTextUpdate?: (frameId: string, text: string) => void;
}

const ScriptFrameModal: React.FC<ScriptFrameModalProps> = ({
  frame,
  isDark,
  scale,
  position,
  onDelete,
  onGenerateScenes,
  onPositionChange,
  onPositionCommit,
  onTextUpdate,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lastCanvasPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const dragStartPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = React.useRef(false);

  const screenX = frame.x * scale + position.x;
  const screenY = frame.y * scale + position.y;
  const cardWidth = frame.frameWidth * scale;
  const cardMinHeight = frame.frameHeight * scale;
  const cardPadding = 16 * scale;
  const cardRadius = 16 * scale;
  const headerBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left mouse button

    const target = e.target as HTMLElement;
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isConnectionNode = target.closest('[data-node-id]') || target.hasAttribute('data-node-id');

    // Don't drag if clicking on buttons or connection nodes
    if (isButton || isConnectionNode) {
      return;
    }

    // Track initial mouse position to detect drag vs click
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;

    setIsDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    lastCanvasPosRef.current = { x: frame.x, y: frame.y };
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle drag
  useEffect(() => {
    if (!isDragging) return;

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

      onPositionChange(frame.id, newCanvasX, newCanvasY);
      lastCanvasPosRef.current = { x: newCanvasX, y: newCanvasY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartPosRef.current = null;

      if (onPositionCommit && lastCanvasPosRef.current) {
        onPositionCommit(frame.id, lastCanvasPosRef.current.x, lastCanvasPosRef.current.y);
      }

      hasDraggedRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, scale, position, onPositionChange, onPositionCommit, frame.id, frame.x, frame.y]);

  return (
    <div
      ref={containerRef}
      data-modal-component="script-frame"
      data-overlay-id={frame.id}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        zIndex: isHovered ? 2001 : 2000,
        userSelect: 'none',
      }}
    >
      <div
        data-frame-id={`${frame.id}-frame`}
        style={{
          position: 'relative',
          width: `${cardWidth}px`,
          minHeight: `${cardMinHeight}px`,
          backgroundColor: isDark ? '#1b1b1b' : '#ffffff',
          borderRadius: `${cardRadius}px`,
          border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`,
          boxShadow: isDark
            ? '0 12px 24px rgba(0,0,0,0.6)'
            : '0 12px 24px rgba(15,23,42,0.18)',
          padding: `${cardPadding}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <ConnectionNodes
          id={frame.id}
          scale={scale}
          isHovered={isHovered}
          isSelected={false}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: `${12 * scale}px`,
            paddingBottom: `${6 * scale}px`,
            borderBottom: `1px solid ${headerBorder}`,
          }}
        >
          <div
            style={{
              fontSize: `${16 * scale}px`,
              fontWeight: 600,
              color: isDark ? '#f8fafc' : '#0f172a',
            }}
          >
            Script Preview
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateScenes?.(frame.id);
              }}
              title="Generate Scenes"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: `0 ${10 * scale}px`,
                height: `${28 * scale}px`,
                borderRadius: `${14 * scale}px`,
                border: 'none',
                backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)',
                color: isDark ? '#6ee7b7' : '#059669',
                cursor: 'pointer',
                fontSize: `${12 * scale}px`,
                fontWeight: 600,
              }}
            >
              Generate Scenes
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!frame.text.trim()) return;
                navigator.clipboard.writeText(frame.text).catch(console.error);
              }}
              title="Copy script"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${28 * scale}px`,
                height: `${28 * scale}px`,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(37,99,235,0.12)',
                color: isDark ? '#bae6fd' : '#1d4ed8',
                cursor: frame.text.trim() ? 'pointer' : 'not-allowed',
                opacity: frame.text.trim() ? 1 : 0.5,
              }}
              disabled={!frame.text.trim()}
            >
              <svg
                width={14 * scale}
                height={14 * scale}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4 a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(frame.id);
              }}
              title="Delete script frame"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${28 * scale}px`,
                height: `${28 * scale}px`,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: isDark ? 'rgba(248,113,113,0.15)' : 'rgba(239,68,68,0.12)',
                color: isDark ? '#fecaca' : '#dc2626',
                cursor: 'pointer',
              }}
            >
              <svg
                width={14 * scale}
                height={14 * scale}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        </div>

        <ScriptFrame
          scale={scale}
          text={frame.text}
          isDark={isDark}
          onTextChange={(newText) => onTextUpdate?.(frame.id, newText)}
        />
      </div>
    </div>
  );
};




