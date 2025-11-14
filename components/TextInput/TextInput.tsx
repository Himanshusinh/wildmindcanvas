'use client';

import { useState, useRef, useEffect } from 'react';

interface TextInputProps {
  id: string;
  x: number;
  y: number;
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
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
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

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;

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
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: `${12 * scale}px`,
        border: isSelected ? `${4 * scale}px solid #22D3EE` : `${2 * scale}px solid #06B6D4`,
        transition: 'border 0.3s ease, box-shadow 0.3s ease',
        boxShadow: `0 ${8 * scale}px ${32 * scale}px 0 rgba(31, 38, 135, 0.37)`,
        minWidth: `${400 * scale}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
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
            backgroundColor: '#f0f2f5',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
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
          <div
            data-node-id={id}
            data-node-side="receive"
            onMouseUp={(e) => {
              if (!id) return;
              e.stopPropagation();
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('canvas-node-complete', { detail: { id, side: 'receive' } }));
            }}
            style={{
              position: 'absolute',
              left: `${-12 * scale}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              width: `${18 * scale}px`,
              height: `${18 * scale}px`,
              borderRadius: '50%',
              backgroundColor: isSelected ? '#C084FC' : '#8B5CF6',
              boxShadow: `0 0 ${8 * scale}px rgba(0,0,0,0.25)`,
              cursor: 'pointer',
              border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
              zIndex: 5000,
              opacity: (isHovered || isSelected || globalDragActive) ? 1 : 0.14,
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
              try { el.setPointerCapture?.(e.pointerId); } catch (err) {}
              if (!id) return;
              e.stopPropagation();
              e.preventDefault();
              const color = isSelected ? '#C084FC' : '#8B5CF6';
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
              backgroundColor: isSelected ? '#C084FC' : '#8B5CF6',
              boxShadow: `0 0 ${8 * scale}px rgba(0,0,0,0.25)`,
              cursor: 'grab',
              border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
              zIndex: 5000,
              opacity: (isHovered || isSelected || globalDragActive) ? 1 : 0.14,
              transition: 'opacity 0.18s ease, transform 0.12s ease',
              pointerEvents: 'auto',
            }}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title="Delete"
            style={{
              padding: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid rgba(0, 0, 0, 0.1)`,
              borderRadius: `${8 * scale}px`,
              color: '#4b5563',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
              (e.currentTarget as HTMLElement).style.color = '#22c55e';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
              (e.currentTarget as HTMLElement).style.color = '#4b5563';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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
          onMouseUp={(e) => {
            e.stopPropagation();
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('canvas-node-complete', { detail: { id, side: 'receive' } }));
          }}
          style={{
            position: 'absolute',
            left: `${-12 * scale}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: `${18 * scale}px`,
            height: `${18 * scale}px`,
            borderRadius: '50%',
            backgroundColor: isSelected ? '#22D3EE' : '#06B6D4',
            boxShadow: `0 0 ${8 * scale}px rgba(0,0,0,0.25)`,
            cursor: 'pointer',
            border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
            zIndex: 5000,
            opacity: (isHovered || isSelected || globalDragActive) ? 1 : 0.14,
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
            try { el.setPointerCapture?.(e.pointerId); } catch (err) {}
            e.stopPropagation();
            e.preventDefault();
            const color = isSelected ? '#22D3EE' : '#06B6D4';
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
            backgroundColor: isSelected ? '#22D3EE' : '#06B6D4',
            boxShadow: `0 0 ${8 * scale}px rgba(0,0,0,0.25)`,
            cursor: 'grab',
            border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
            zIndex: 5000,
            opacity: (isHovered || isSelected || globalDragActive) ? 1 : 0.14,
            transition: 'opacity 0.18s ease, transform 0.12s ease',
            pointerEvents: 'auto',
          }}
        />
      </>
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          if (onValueChange) onValueChange(v);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Enter text here..."
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: `${1 * scale}px solid rgba(255, 255, 255, 0.3)`,
          borderRadius: `${8 * scale}px`,
          padding: `${10 * scale}px`,
          color: '#1f2937',
          fontSize: `${16 * scale}px`,
          fontFamily: 'Arial, sans-serif',
          outline: 'none',
          resize: 'vertical',
          minHeight: `${80 * scale}px`,
          width: '100%',
          cursor: 'text',
        }}
      />
      <div style={{ display: 'flex', gap: `${8 * scale}px`, justifyContent: 'flex-end', alignItems: 'center' }}>
        {/* Run Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleConfirm();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Run"
          style={{
            width: `${40 * scale}px`,
            height: `${40 * scale}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0.55) 100%)',
            border: `${1 * scale}px solid rgba(59,130,246,0.6)`,
            borderRadius: `${12 * scale}px`,
            color: '#1d4ed8',
            cursor: 'pointer',
            boxShadow: `0 ${6 * scale}px ${16 * scale}px rgba(59,130,246,0.35)`,
            padding: 0,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            transition: 'all 0.25s ease',
          }}
          disabled={!text.trim()}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
            e.currentTarget.style.boxShadow = `0 ${10 * scale}px ${24 * scale}px rgba(59,130,246,0.45)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(59,130,246,0.35)`;
          }}
        >
          <svg width={20 * scale} height={20 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
        {/* Enhance Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Simple client-side enhancement placeholder: trim + collapse spaces
            const enhanced = text.replace(/\s+/g, ' ').trim();
            if (enhanced) {
              onConfirm(enhanced, selectedModel + ' (enhance)');
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Enhance"
          style={{
            width: `${40 * scale}px`,
            height: `${40 * scale}px`,
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
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            transition: 'all 0.25s ease',
          }}
          disabled={!text.trim()}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
            e.currentTarget.style.boxShadow = `0 ${10 * scale}px ${24 * scale}px rgba(168,85,247,0.45)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(168,85,247,0.35)`;
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
          left: 0,
          width: '100%',
          padding: `${16 * scale}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: 'none',
          borderTop: 'none',
          borderRadius: `0 0 ${12 * scale}px ${12 * scale}px`,
          boxShadow: 'none',
          transform: isHovered ? 'translateY(0)' : `translateY(-100%)`,
          opacity: isHovered ? 1 : 0,
          maxHeight: isHovered ? '200px' : '0px',
          display: 'flex',
          flexDirection: 'column',
          gap: `${12 * scale}px`,
          pointerEvents: isHovered ? 'auto' : 'none',
          overflow: 'hidden',
          zIndex: 1,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Model Selector */}
        <div style={{ position: 'relative', width: '100%' }}>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              width: '100%',
              padding: `${10 * scale}px ${28 * scale}px ${10 * scale}px ${14 * scale}px`,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: `${1 * scale}px solid rgba(0, 0, 0, 0.1)`,
              borderRadius: `${10 * scale}px`,
              fontSize: `${12 * scale}px`,
              fontWeight: '500',
              color: '#1f2937',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4L6 8L10 4' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: `right ${12 * scale}px center`,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.boxShadow = `0 0 0 ${2 * scale}px rgba(59, 130, 246, 0.1)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <option value="GPT-4">GPT-4</option>
            <option value="GPT-3.5">GPT-3.5</option>
            <option value="Claude 3">Claude 3</option>
            <option value="Gemini Pro">Gemini Pro</option>
            <option value="Llama 2">Llama 2</option>
          </select>
        </div>
      </div>
    </div>
  );
};

