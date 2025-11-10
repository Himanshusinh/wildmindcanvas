'use client';

import { useState, useRef, useEffect } from 'react';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoSelect?: (file: File) => void;
  onGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => void;
  generatedVideoUrl?: string | null;
  stageRef: React.RefObject<any>;
  scale: number;
  position: { x: number; y: number };
  x: number;
  y: number;
  onPositionChange?: (x: number, y: number) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  isOpen,
  onClose,
  onVideoSelect,
  onGenerate,
  generatedVideoUrl,
  stageRef,
  scale,
  position,
  x,
  y,
  onPositionChange,
  onSelect,
  onDelete,
  isSelected,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('Seedream 4K');
  const [selectedFrame, setSelectedFrame] = useState('Frame');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('16:9');
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);

  // Calculate aspect ratio from string (e.g., "16:9" -> 16/9)
  const getAspectRatio = (ratio: string): string => {
    const [width, height] = ratio.split(':').map(Number);
    return `${width} / ${height}`;
  };

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;

  const handleGenerate = () => {
    if (onGenerate && prompt.trim()) {
      onGenerate(prompt, selectedModel, selectedFrame, selectedAspectRatio);
      // The generated video will be set by the parent component via props or callback
    }
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isImage = target.tagName === 'IMG';
    const isVideo = target.tagName === 'VIDEO';
    const isControls = target.closest('.controls-overlay');
    
    // Call onSelect when clicking on the modal (this will trigger context menu)
    if (onSelect && !isInput && !isButton && !isControls) {
      onSelect();
    }
    
    // Only allow dragging from the frame, not from controls
    if (!isInput && !isButton && !isImage && !isVideo && !isControls) {
      setIsDraggingContainer(true);
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
    if (!isDraggingContainer) return;

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
      setIsDraggingContainer(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingContainer, dragOffset, scale, position, onPositionChange]);

  if (!isOpen) return null;

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
        userSelect: 'none',
      }}
    >
      {/* Tooltip - Attached to Top, Full Width */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            top: `${-32 * scale}px`,
            left: 0,
            width: `${600 * scale}px`,
            maxWidth: '90vw',
            padding: `${6 * scale}px ${12 * scale}px`,
            backgroundColor: '#f0f2f5',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            color: '#1f2937',
            fontSize: `${12 * scale}px`,
            fontWeight: '600',
            borderRadius: `${16 * scale}px ${16 * scale}px 0 0`,
            border: `${2 * scale}px solid rgba(0, 0, 0, 0.1)`,
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
          Video Generator
        </div>
      )}
      {/* Video Frame */}
      <div
        ref={imageAreaRef}
        style={{
          width: `${600 * scale}px`,
          maxWidth: '90vw',
          aspectRatio: getAspectRatio(selectedAspectRatio),
          minHeight: `${400 * scale}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: isHovered ? '0' : `${16 * scale}px`,
          border: `${2 * scale}px solid rgba(0, 0, 0, 0.1)`,
          borderTop: isHovered ? 'none' : `${2 * scale}px solid rgba(0, 0, 0, 0.1)`,
          borderTopLeftRadius: isHovered ? '0' : `${16 * scale}px`,
          borderTopRightRadius: isHovered ? '0' : `${16 * scale}px`,
          borderBottomLeftRadius: isHovered ? '0' : `${16 * scale}px`,
          borderBottomRightRadius: isHovered ? '0' : `${16 * scale}px`,
          boxShadow: `0 ${8 * scale}px ${32 * scale}px 0 rgba(0, 0, 0, 0.15)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1), border 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: isDraggingContainer ? 'grabbing' : 'grab',
          overflow: 'visible',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {generatedVideoUrl ? (
          <video
            src={generatedVideoUrl}
            controls
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <svg
              width={64 * scale}
              height={64 * scale}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto 16px', opacity: 0.3 }}
            >
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
        )}
        {/* Delete button removed - now handled by context menu in header */}
      </div>

      {/* Controls - Behind Frame, Slides Out on Hover */}
      <div
        className="controls-overlay"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          width: `${600 * scale}px`,
          maxWidth: '90vw',
          padding: `${16 * scale}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `${2 * scale}px solid rgba(0, 0, 0, 0.1)`,
          borderTop: 'none',
          borderRadius: `0 0 ${16 * scale}px ${16 * scale}px`,
          boxShadow: 'none',
          transform: isHovered ? 'translateY(0)' : `translateY(-100%)`,
          opacity: isHovered ? 1 : 0,
          maxHeight: isHovered ? '500px' : '0px',
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
        {/* Prompt Input */}
        <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center' }}>
          <input
            className="prompt-input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Enter prompt here..."
            style={{
              flex: 1,
              padding: `${10 * scale}px ${14 * scale}px`,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: `${1 * scale}px solid rgba(0, 0, 0, 0.1)`,
              borderRadius: `${10 * scale}px`,
              fontSize: `${13 * scale}px`,
              color: '#1f2937',
              outline: 'none',
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
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            style={{
              width: `${40 * scale}px`,
              height: `${40 * scale}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: prompt.trim() ? 'rgba(59, 130, 246, 0.9)' : 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              borderRadius: `${10 * scale}px`,
              cursor: prompt.trim() ? 'pointer' : 'not-allowed',
              color: 'white',
              transition: 'all 0.2s',
              boxShadow: prompt.trim() ? `0 ${4 * scale}px ${12 * scale}px rgba(59, 130, 246, 0.4)` : 'none',
              padding: 0,
            }}
            onMouseEnter={(e) => {
              if (prompt.trim()) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(59, 130, 246, 0.5)`;
              }
            }}
            onMouseLeave={(e) => {
              if (prompt.trim()) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(59, 130, 246, 0.4)`;
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        </div>

        {/* Settings Row */}
        <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Model Selector */}
          <div style={{ position: 'relative', flex: 1, minWidth: `${140 * scale}px` }}>
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
              <option value="Seedream 4K">Seedream 4K</option>
              <option value="Runway Gen-3">Runway Gen-3</option>
              <option value="Pika Labs">Pika Labs</option>
              <option value="Stable Video">Stable Video</option>
              <option value="Kling AI">Kling AI</option>
            </select>
          </div>

          {/* Aspect Ratio Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedAspectRatio}
              onChange={(e) => setSelectedAspectRatio(e.target.value)}
              style={{
                padding: `${10 * scale}px ${28 * scale}px ${10 * scale}px ${14 * scale}px`,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: `${1 * scale}px solid rgba(59, 130, 246, 0.2)`,
                borderRadius: `${10 * scale}px`,
                fontSize: `${12 * scale}px`,
                fontWeight: '600',
                color: '#3b82f6',
                minWidth: `${70 * scale}px`,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4L6 8L10 4' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `right ${10 * scale}px center`,
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = `0 0 0 ${2 * scale}px rgba(59, 130, 246, 0.1)`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
              <option value="4:3">4:3</option>
              <option value="3:4">3:4</option>
              <option value="21:9">21:9</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

