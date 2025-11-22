'use client';
import React, { useRef, useEffect } from 'react';

interface TextModalFrameProps {
  id: string;
  scale: number;
  isHovered: boolean;
  isPinned: boolean;
  isSelected: boolean;
  isDragging: boolean;
  frameBorderColor: string;
  frameBorderWidth: number;
  text: string;
  isTextFocused: boolean;
  autoFocusInput?: boolean;
  onTextChange: (value: string) => void;
  onTextFocus: () => void;
  onTextBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onConfirm: (text: string, model: string) => void;
  selectedModel: string;
  onSetIsPinned: (pinned: boolean) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export const TextModalFrame: React.FC<TextModalFrameProps> = ({
  id,
  scale,
  isHovered,
  isPinned,
  isSelected,
  isDragging,
  frameBorderColor,
  frameBorderWidth,
  text,
  isTextFocused,
  autoFocusInput,
  onTextChange,
  onTextFocus,
  onTextBlur,
  onKeyDown,
  onConfirm,
  selectedModel,
  onSetIsPinned,
  onMouseDown,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Only autofocus the inner textarea when allowed. Default is to autofocus
    // for backwards compatibility; creating via toolbar/tool should pass
    // `autoFocusInput: false` to prevent forcing text cursor on the stage.
    if (autoFocusInput === false) return;
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocusInput]);

  return (
    <>
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
          onMouseDown(e);
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
        onChange={(e) => {
          const v = e.target.value;
          onTextChange(v);
        }}
        onFocus={onTextFocus}
        onBlur={onTextBlur}
        onKeyDown={onKeyDown}
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

      {/* Pin Icon Button - Bottom Right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSetIsPinned(!isPinned);
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
    </>
  );
};

