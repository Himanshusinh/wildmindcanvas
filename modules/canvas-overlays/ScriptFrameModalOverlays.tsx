'use client';

import React, { useState, useEffect } from 'react';
import Konva from 'konva';
import { ScriptFrame } from '@/modules/plugins/StoryboardPluginModal/ScriptFrame';
import { PluginConnectionNodes } from '@/modules/plugins/PluginComponents';
import { ModalActionIcons } from '@/modules/ui-global/common/ModalActionIcons';

interface ScriptFrameModalState {
  id: string;
  pluginId: string;
  x: number;
  y: number;
  frameWidth: number;
  frameHeight: number;
  text: string;
  isLoading?: boolean;
}

interface ScriptFrameModalOverlaysProps {
  scriptFrameModalStates: ScriptFrameModalState[];
  onDelete?: (frameId: string) => void;
  onDuplicate?: (frameId: string) => void;
  onPositionChange?: (frameId: string, x: number, y: number) => void;
  onPositionCommit?: (frameId: string, x: number, y: number) => void;
  onTextUpdate?: (frameId: string, text: string) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  onGenerateScenes?: (scriptFrameId: string) => void;
  clearAllSelections: () => void;
}

export const ScriptFrameModalOverlays: React.FC<ScriptFrameModalOverlaysProps> = ({
  scriptFrameModalStates,
  onDelete,
  onDuplicate,
  onGenerateScenes,
  onPositionChange,
  onPositionCommit,
  onTextUpdate,
  stageRef,
  scale,
  position,
  clearAllSelections,
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
          onDuplicate={onDuplicate}
          onGenerateScenes={onGenerateScenes}
          onPositionChange={onPositionChange}
          onPositionCommit={onPositionCommit}
          onTextUpdate={onTextUpdate}
              clearAllSelections={clearAllSelections}
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
  onDuplicate?: (frameId: string) => void;
  onGenerateScenes?: (scriptFrameId: string) => void;
  onPositionChange?: (frameId: string, x: number, y: number) => void;
  onPositionCommit?: (frameId: string, x: number, y: number) => void;
  onTextUpdate?: (frameId: string, text: string) => void;
  clearAllSelections: () => void;
}

const ScriptFrameModal: React.FC<ScriptFrameModalProps> = ({
  frame,
  isDark,
  scale,
  position,
  onDelete,
  onDuplicate,
  onGenerateScenes,
  onPositionChange,
  onPositionCommit,
  onTextUpdate,
  clearAllSelections,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const lastCanvasPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const dragStartPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = React.useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

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
    const isActionIcons = target.closest('[data-action-icons]');

    // Don't drag if clicking on buttons, connection nodes, or action icons
    if (isButton || isConnectionNode || isActionIcons) {
      return;
    }

    clearAllSelections();
    // Set selected on click
    setIsSelected(true);

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
    // Capture so stopPropagation can't block drag end
    window.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [isDragging, dragOffset, scale, position, onPositionChange, onPositionCommit, frame.id, frame.x, frame.y]);

  useEffect(() => {
    const handleClear = () => setIsSelected(false);
    window.addEventListener('canvas-clear-selection', handleClear as any);
    return () => window.removeEventListener('canvas-clear-selection', handleClear as any);
  }, []);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const handleOverlayBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsSelected(false);
    }
  };

  return (
    <div
      ref={containerRef}
      data-modal-component="script-frame"
      data-overlay-id={frame.id}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsSelected(true);
      }}
      tabIndex={0}
      onBlur={handleOverlayBlur}
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        zIndex: isHovered || isSelected ? 2001 : 2000,
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
          border: isSelected ? `${2 * scale}px solid #4C83FF` : `1.5px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`,
          boxShadow: isSelected
            ? '0 0 0 3px rgba(67, 126, 181, 0.25)'
            : isDark
              ? '0 12px 24px rgba(0,0,0,0.6)'
              : '0 12px 24px rgba(15,23,42,0.18)',
          padding: `${cardPadding}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: 'box-shadow 0.2s ease, border 0.2s ease',
        }}
      >
        <PluginConnectionNodes
          id={frame.id}
          scale={scale}
          isHovered={isHovered}
          isSelected={isSelected}
        />

        <ModalActionIcons
          isSelected={isSelected}
          scale={scale}
          onDelete={() => onDelete?.(frame.id)}
          onCopy={() => {
            try {
              navigator.clipboard.writeText(frame.text || '');
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch (err) {
              console.warn('Clipboard copy failed', err);
            }
          }}
          onEdit={() => setIsEditing(prev => !prev)}
          editActive={isEditing}
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
          </div>
        </div>

        <ScriptFrame
          scale={scale}
          text={frame.text}
          isDark={isDark}
          isLoading={frame.isLoading}
          onTextChange={(newText) => onTextUpdate?.(frame.id, newText)}
          isEditing={isEditing}
          onEditToggle={setIsEditing}
        />
      </div>
    </div>
  );
};




