'use client';

import { useState, useRef, useEffect } from 'react';
import '../common/canvasCaptureGuard';

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only autofocus the inner textarea when allowed. Default is to autofocus
    // for backwards compatibility; creating via toolbar/tool should pass
    // `autoFocusInput: false` to prevent forcing text cursor on the stage.
    if (autoFocusInput === false) return;
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen]);

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected ? '#437eb5' : 'rgba(0, 0, 0, 0.3)';
  const frameBorderWidth = 2;
  const dropdownBorderColor = 'rgba(0,0,0,0.1)'; // Fixed border color for dropdowns
  const controlFontSize = `${13 * scale}px`;

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
      {/* Tooltip - Attached to Top, Full Width */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            top: `${-32 * scale}px`,
            left: 0,
            width: '100%',
            padding: `${6 * scale}px ${12 * scale}px`,
          backgroundColor: '#ffffff',
            color: '#1f2937',
            fontSize: `${12 * scale}px`,
            fontWeight: '600',
            borderRadius: `${12 * scale}px ${12 * scale}px 0 0`,
            border: 'none',
            borderBottom: 'none',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 3000,
            boxShadow: 'none',
            transform: 'translateY(0)',
            opacity: 1,
          }}
        >
          AI Companion
        </div>
      )}

      {/* Action Icons - Right Side Top, Outside Frame (Only when selected) */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: `${-40 * scale}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: `${6 * scale}px`,
            zIndex: 3001,
            pointerEvents: 'auto',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Delete Icon */}
          {/* Receive Node (Left) */}
          
          {/* Send Node (Right) */}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title="Delete"
            style={{
              padding: 0,
              backgroundColor: '#ffffff',
              border: `1px solid rgba(0, 0, 0, 0.1)`,
              borderRadius: `${8 * scale}px`,
              color: '#4b5563',
              cursor: 'pointer',
              transition: 'box-shadow 0.12s, background-color 0.12s',
              boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(34, 197, 94, 0.12)';
              (e.currentTarget as HTMLElement).style.color = '#15803d';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 ${6 * scale}px ${14 * scale}px rgba(16, 185, 129, 0.12)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff';
              (e.currentTarget as HTMLElement).style.color = '#4b5563';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`;
            }}
          >
            <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
              <path d="M10 6V4h4v2" />
            </svg>
          </button>
          {/* Duplicate Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onDuplicate) onDuplicate();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title="Duplicate"
            style={{
              padding: 0,
              backgroundColor: '#ffffff',
              border: `1px solid rgba(0, 0, 0, 0.1)`,
              borderRadius: `${8 * scale}px`,
              color: '#4b5563',
              cursor: 'pointer',
              transition: 'box-shadow 0.12s, background-color 0.12s',
              boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(59,130,246,0.12)';
              (e.currentTarget as HTMLElement).style.color = '#1e40af';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 ${6 * scale}px ${14 * scale}px rgba(59,130,246,0.12)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff';
              (e.currentTarget as HTMLElement).style.color = '#4b5563';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`;
            }}
          >
            <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <rect x="3" y="3" width="13" height="13" rx="2" ry="2" />
            </svg>
          </button>
        </div>
      )}
      {/* Drag handle header */}
      <div
        className="text-input-header"
        style={{
          height: ``,
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          padding: `0 ${4 * scale}px`,
          marginBottom: `${-4 * scale}px`,
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e);
        }}
      >
        <div
          style={{
            width: `${40 * scale}px`,
            height: `${4 * scale}px`,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: `${2 * scale}px`,
            margin: '0 auto',
          }}
        />
      </div>
      {/* Connection Nodes - always rendered but subtle until hovered or during drag
          NOTE: right-side is the send/start node and left-side is the receive node */}
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
            width: `${18 * scale}px`,
            height: `${18 * scale}px`,
            borderRadius: '50%',
            backgroundColor: '#437eb5',
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
              try { el.setPointerCapture?.(pid); } catch (err) {}
              // Record active capture globally so receivers can attempt release
              try { (window as any).__canvas_active_capture = { element: el, pid }; } catch (err) {}
              e.stopPropagation();
              e.preventDefault();
              const color = '#437eb5';

              const handlePointerUp = (pe: any) => {
                try { el.releasePointerCapture?.(pe?.pointerId ?? pid); } catch (err) {}
                try { delete (window as any).__canvas_active_capture; } catch (err) {}
                window.removeEventListener('canvas-node-complete', handleComplete as any);
                window.removeEventListener('pointerup', handlePointerUp as any);
              };

              const handleComplete = () => {
                try { el.releasePointerCapture?.(pid); } catch (err) {}
                try { delete (window as any).__canvas_active_capture; } catch (err) {}
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
      {/* Pin Icon Button - Bottom Right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsPinned(!isPinned);
        }}
        style={{
          position: 'absolute',
          bottom: `${8 * scale}px`,
          right: `${8 * scale}px`,
          width: `${28 * scale}px`,
          height: `${28 * scale}px`,
          borderRadius: `${6 * scale}px`,
          backgroundColor: isPinned ? 'rgba(67, 126, 181, 0.2)' : '#ffffff',
          border: `1px solid ${isPinned ? '#437eb5' : 'rgba(0, 0, 0, 0.1)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 20,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.18s ease, background-color 0.2s ease, border-color 0.2s ease',
          pointerEvents: 'auto',
          boxShadow: isPinned ? `0 ${2 * scale}px ${8 * scale}px rgba(67, 126, 181, 0.3)` : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isPinned) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isPinned) {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }
        }}
        title={isPinned ? 'Unpin controls' : 'Pin controls'}
      >
        <svg
          width={16 * scale}
          height={16 * scale}
          viewBox="0 0 24 24"
          fill={isPinned ? '#437eb5' : 'none'}
          stroke={isPinned ? '#437eb5' : '#4b5563'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 17v5M9 10V7a3 3 0 0 1 6 0v3M5 10h14l-1 7H6l-1-7z" />
        </svg>
      </button>
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          if (onValueChange) onValueChange(v);
        }}
        onFocus={() => setIsTextFocused(true)}
        onBlur={() => setIsTextFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder="Enter text here..."
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          border: `${1 * scale}px solid rgba(0, 0, 0, 0.1)`,
          borderRadius: (isHovered || isPinned) ? '0px' : `${8 * scale}px`,
          padding: `${10 * scale}px`,
          color: '#1f2937',
          fontSize: `${16 * scale}px`,
          fontFamily: 'Arial, sans-serif',
          outline: 'none',
          resize: 'vertical',
          minHeight: `${80 * scale}px`,
          width: '100%',
          cursor: isTextFocused ? 'text' : 'default',
        }}
      />
      <div style={{ display: 'flex', gap: `${8 * scale}px`, justifyContent: 'flex-end', alignItems: 'center' }}>
        {/* Enhance Button (restored) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Simple client-side enhancement placeholder: trim + collapse spaces
            const enhanced = text.replace(/\s+/g, ' ').trim();
            if (enhanced && onConfirm) {
              onConfirm(enhanced, selectedModel + ' (enhance)');
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Enhance"
          style={{
            width: `${30 * scale}px`,
            height: `${30 * scale}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(168,85,247,0.6) 100%)',
            border: `${1 * scale}px solid rgba(168,85,247,0.65)`,
            borderRadius: `${12 * scale}px`,
            color: '#6d28d9',
            cursor: 'pointer',
            boxShadow: `0 ${6 * scale}px ${16 * scale}px rgba(168,85,247,0.35)`,
            padding: 0,
            transition: 'none',
          }}
          disabled={!text.trim()}
          onMouseEnter={(e) => {
            // subtle hover effect without scaling
            (e.currentTarget as HTMLElement).style.boxShadow = `0 ${10 * scale}px ${24 * scale}px rgba(168,85,247,0.45)`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(168,85,247,0.35)`;
          }}
        >
          <svg width={20 * scale} height={20 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v4" />
            <path d="M12 17v4" />
            <path d="M3 12h4" />
            <path d="M17 12h4" />
            <path d="M5.6 5.6l2.8 2.8" />
            <path d="M15.6 15.6l2.8 2.8" />
            <path d="M18.4 5.6l-2.8 2.8" />
            <path d="M8.4 15.6l-2.8 2.8" />
          </svg>
        </button>
      </div>

      {/* Controls - Behind Frame, Slides Out on Hover */}
      <div
        className="controls-overlay"
        style={{
          position: 'absolute',
          top: '100%',
          left: `${-2 * scale}px`,
          width: `calc(100% + ${2 * scale}px)`,
          padding: `${12 * scale}px`,
          backgroundColor: '#ffffff',
          border: 'none',
          borderTop: 'none',
          borderRadius: `0 0 ${12 * scale}px ${12 * scale}px`,
          boxShadow: 'none',
          transform: (isHovered || isPinned) ? 'translateY(0)' : `translateY(-100%)`,
          opacity: isHovered ? 1 : 0,
          maxHeight: (isHovered || isPinned) ? '200px' : '0px',
          display: 'flex',
          flexDirection: 'column',
          gap: `${12 * scale}px`,
          pointerEvents: (isHovered || isPinned) ? 'auto' : 'none',
          overflow: 'visible',
          zIndex: 1,
          borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderBottom: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Model Selector - Custom Dropdown */}
        <div ref={modelDropdownRef} style={{ position: 'relative', width: '100%', overflow: 'visible', zIndex: 3002 }} onMouseEnter={() => setIsModelHovered(true)} onMouseLeave={() => setIsModelHovered(false)}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsModelDropdownOpen(!isModelDropdownOpen);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              padding: `${10 * scale}px ${28 * scale}px ${10 * scale}px ${14 * scale}px`,
              backgroundColor: '#ffffff',
              border: `1px solid ${dropdownBorderColor}`,
              borderRadius: `${9999 * scale}px`,
              fontSize: controlFontSize,
              fontWeight: '500',
              color: '#1f2937',
              outline: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{selectedModel}</span>
            <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isModelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M2 4L6 8L10 4" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          {isModelDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: `${4 * scale}px`,
                backgroundColor: '#ffffff',
                border: `1px solid ${dropdownBorderColor}`,
                borderRadius: `${12 * scale}px`,
                boxShadow: `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.15)`,
                maxHeight: `${200 * scale}px`,
                overflowY: 'auto',
                zIndex: 3003,
                padding: `${4 * scale}px 0`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
              {['GPT-4', 'GPT-3.5', 'Claude 3', 'Gemini Pro', 'Llama 2'].map((model) => (
                <div
                  key={model}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedModel(model);
                    setIsModelDropdownOpen(false);
                  }}
                  style={{
                    padding: `${8 * scale}px ${16 * scale}px`,
                    fontSize: controlFontSize,
                    color: '#1f2937',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: selectedModel === model ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    borderLeft: selectedModel === model ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedModel !== model) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedModel !== model) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {selectedModel === model && (
                    <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  <span>{model}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

