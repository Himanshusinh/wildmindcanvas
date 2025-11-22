'use client';

import { useState, useRef, useEffect } from 'react';
import '@/app/components/common/canvasCaptureGuard';
import { TextModalTooltip } from './TextModalTooltip';
import { ModalActionIcons } from '@/app/components/common/ModalActionIcons';
import { TextModalFrame } from './TextModalFrame';
import { TextModalNodes } from './TextModalNodes';
import { TextModalControls } from './TextModalControls';

interface TextInputProps {
  id: string;
  x: number;
  y: number;
  autoFocusInput?: boolean;
  onConfirm: (text: string, model?: string) => void;
  onCancel: () => void;
  onPositionChange?: (x: number, y: number) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onValueChange?: (value: string) => void;
  stageRef: React.RefObject<any>;
  scale: number;
  position: { x: number; y: number };
  isSelected?: boolean;

  
}

export const TextInput: React.FC<TextInputProps> = ({
  id,
  x,
  y,
  autoFocusInput,
  onConfirm,
  onCancel,
  onPositionChange,
  onSelect,
  onDelete,
  onDuplicate,
  onValueChange,
  stageRef,
  scale,
  position,
  isSelected,
}) => {
  const [text, setText] = useState('');
  const [selectedModel, setSelectedModel] = useState('GPT-4');
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isModelHovered, setIsModelHovered] = useState(false);
  const [isTextFocused, setIsTextFocused] = useState(false);
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);


  // Listen for global node-drag active state so nodes stay visible during drag
  useEffect(() => {
    const handleActive = (e: Event) => {
      const ce = e as CustomEvent;
      const { active } = ce.detail || {};
      setGlobalDragActive(Boolean(active));
    };
    window.addEventListener('canvas-node-active', handleActive as any);
    return () => window.removeEventListener('canvas-node-active', handleActive as any);
  }, []);


  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected ? '#437eb5' : 'rgba(0, 0, 0, 0.3)';
  const frameBorderWidth = 2;

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag if clicking on the header or container background, not on input/buttons
    const target = e.target as HTMLElement;
    const isHeader = target.closest('.text-input-header');
    const isInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isControls = target.closest('.controls-overlay');
    
    // Call onSelect when clicking on the text input container
    if (onSelect && !isInput && !isButton && !isControls) {
      onSelect();
    }
    
    if (isHeader || (!isInput && !isButton && !isControls && target === containerRef.current)) {
      setIsDragging(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !onPositionChange) return;

      // Calculate new screen position
      const newScreenX = e.clientX - dragOffset.x;
      const newScreenY = e.clientY - dragOffset.y;

      // Convert screen coordinates back to canvas coordinates
      const newCanvasX = (newScreenX - position.x) / scale;
      const newCanvasY = (newScreenY - position.y) / scale;

      onPositionChange(newCanvasX, newCanvasY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, scale, position, onPositionChange]);

  const handleConfirm = () => {
    if (text.trim()) {
      onConfirm(text, selectedModel);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      ref={containerRef}
      data-modal-component="text"
      data-overlay-id={id}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        zIndex: isHovered || isSelected ? 2001 : 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: `${1 * scale}px`,
        padding: `${12 * scale}px`,
        backgroundColor: '#ffffff',
        borderRadius: (isHovered || isPinned) ? '0px' : `${12 * scale}px`,
        borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderBottom: (isHovered || isPinned) ? 'none' : `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        transition: 'border 0.3s ease',
        boxShadow: 'none',
        minWidth: `${400 * scale}px`,
        cursor: isDragging ? 'grabbing' : (isHovered || isSelected ? 'grab' : 'pointer'),
        userSelect: 'none',
        overflow: 'visible',
      }}
    >
      <TextModalTooltip
        isHovered={isHovered}
        scale={scale}
      />

      <ModalActionIcons
        isSelected={!!isSelected}
        scale={scale}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        variant="text"
      />

      <div style={{ position: 'relative' }}>
        <TextModalFrame
          id={id}
          scale={scale}
          isHovered={isHovered}
          isPinned={isPinned}
          isSelected={!!isSelected}
          isDragging={isDragging}
          frameBorderColor={frameBorderColor}
          frameBorderWidth={frameBorderWidth}
          text={text}
          isTextFocused={isTextFocused}
          autoFocusInput={autoFocusInput}
          onTextChange={(v) => {
            setText(v);
            if (onValueChange) onValueChange(v);
          }}
          onTextFocus={() => setIsTextFocused(true)}
          onTextBlur={() => setIsTextFocused(false)}
          onKeyDown={handleKeyDown}
          onConfirm={handleConfirm}
          selectedModel={selectedModel}
          onSetIsPinned={setIsPinned}
          onMouseDown={handleMouseDown}
        />

        <TextModalNodes
          id={id}
          scale={scale}
          isHovered={isHovered}
          isSelected={!!isSelected}
          globalDragActive={globalDragActive}
        />
      </div>

      <TextModalControls
        scale={scale}
        isHovered={isHovered}
        isPinned={isPinned}
        selectedModel={selectedModel}
        isModelDropdownOpen={isModelDropdownOpen}
        isModelHovered={isModelHovered}
        frameBorderColor={frameBorderColor}
        frameBorderWidth={frameBorderWidth}
        onModelChange={(model) => {
          setSelectedModel(model);
        }}
        onSetIsHovered={setIsHovered}
        onSetIsPinned={setIsPinned}
        onSetIsModelDropdownOpen={setIsModelDropdownOpen}
        onSetIsModelHovered={setIsModelHovered}
      />
    </div>
  );
};

