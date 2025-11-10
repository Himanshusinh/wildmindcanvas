'use client';

import { useState, useRef, useEffect } from 'react';

interface TextInputProps {
  x: number;
  y: number;
  onConfirm: (text: string, model?: string) => void;
  onCancel: () => void;
  onPositionChange?: (x: number, y: number) => void;
  onSelect?: () => void;
  stageRef: React.RefObject<any>;
  scale: number;
  position: { x: number; y: number };
}

export const TextInput: React.FC<TextInputProps> = ({
  x,
  y,
  onConfirm,
  onCancel,
  onPositionChange,
  onSelect,
  stageRef,
  scale,
  position,
}) => {
  const [text, setText] = useState('');
  const [selectedModel, setSelectedModel] = useState('GPT-4');
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
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
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: `${1 * scale}px`,
        padding: `${12 * scale}px`,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: isHovered ? '0' : `${12 * scale}px`,
        border: isHovered ? `${2 * scale}px solid rgba(0, 0, 0, 0.1)` : `${1 * scale}px solid rgba(255, 255, 255, 0.2)`,
        borderBottom: isHovered ? 'none' : `${1 * scale}px solid rgba(255, 255, 255, 0.2)`,
        borderTopLeftRadius: isHovered ? '0' : `${12 * scale}px`,
        borderTopRightRadius: isHovered ? '0' : `${12 * scale}px`,
        borderBottomLeftRadius: isHovered ? '0' : `${12 * scale}px`,
        borderBottomRightRadius: isHovered ? '0' : `${12 * scale}px`,
        boxShadow: `0 ${8 * scale}px ${32 * scale}px 0 rgba(31, 38, 135, 0.37)`,
        minWidth: `${400 * scale}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transition: 'border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1), border 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
            border: `${1 * scale}px solid rgba(255, 255, 255, 0.2)`,
            borderBottom: 'none',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 3000,
            boxShadow: 'none',
            transform: 'translateY(0)',
            opacity: 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'slideInFromTop 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <style>{`
            @keyframes slideInFromTop {
              from {
                transform: translateY(-${8 * scale}px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `}</style>
          AI Companion
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
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Cancel"
          style={{
            width: `${32 * scale}px`,
            height: `${32 * scale}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: `${1 * scale}px solid rgba(255, 255, 255, 0.2)`,
            borderRadius: `${8 * scale}px`,
            color: '#ef4444',
            cursor: 'pointer',
            transition: 'all 0.2s',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleConfirm();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Run"
          style={{
            width: `${32 * scale}px`,
            height: `${32 * scale}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            border: `${1 * scale}px solid rgba(59, 130, 246, 0.5)`,
            borderRadius: `${8 * scale}px`,
            color: '#3b82f6',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(59, 130, 246, 0.3)`,
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.4)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
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
          border: `${2 * scale}px solid rgba(0, 0, 0, 0.1)`,
          borderTop: 'none',
          borderRadius: `0 0 ${12 * scale}px ${12 * scale}px`,
          boxShadow: 'none',
          transform: isHovered ? 'translateY(0)' : `translateY(-100%)`,
          opacity: isHovered ? 1 : 0,
          maxHeight: isHovered ? '200px' : '0px',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
              transition: 'all 0.2s',
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

