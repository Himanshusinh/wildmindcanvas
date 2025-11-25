'use client';
import React, { useRef, useEffect, useState } from 'react';
import { queryCanvasPrompt } from '@/lib/api';

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
  onScriptGenerated?: (script: string) => void;
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
  onScriptGenerated,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceStatus, setEnhanceStatus] = useState('');
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

  useEffect(() => {
    // Only autofocus the inner textarea when allowed. Default is to autofocus
    // for backwards compatibility; creating via toolbar/tool should pass
    // `autoFocusInput: false` to prevent forcing text cursor on the stage.
    if (autoFocusInput === false) return;
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocusInput]);

  const inputBg = isDark ? '#121212' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const inputText = isDark ? '#ffffff' : '#1f2937';
  const pinBg = isDark ? (isPinned ? 'rgba(67, 126, 181, 0.2)' : '#121212') : (isPinned ? 'rgba(67, 126, 181, 0.2)' : '#ffffff');
  const pinBorder = isDark ? (isPinned ? '#437eb5' : 'rgba(255, 255, 255, 0.15)') : (isPinned ? '#437eb5' : 'rgba(0, 0, 0, 0.1)');
  const pinIconColor = isDark ? (isPinned ? '#437eb5' : '#cccccc') : (isPinned ? '#437eb5' : '#4b5563');
  const handleBg = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)';

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
            backgroundColor: handleBg,
            borderRadius: `${2 * scale}px`,
            margin: '0 auto',
            transition: 'background-color 0.3s ease',
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
          background: inputBg,
          border: `${1 * scale}px solid ${inputBorder}`,
          borderRadius: (isHovered || isPinned) ? '0px' : `${8 * scale}px`,
          padding: `${10 * scale}px`,
          color: inputText,
          fontSize: `${16 * scale}px`,
          fontFamily: 'Arial, sans-serif',
          outline: 'none',
          resize: 'vertical',
          minHeight: `${80 * scale}px`,
          width: '100%',
          cursor: isTextFocused ? 'text' : 'default',
          transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
        }}
      />
      <div style={{ display: 'flex', gap: `${8 * scale}px`, justifyContent: 'flex-end', alignItems: 'center' }}>
        {/* Enhance Button */}
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (!text.trim() || isEnhancing) return;

            setIsEnhancing(true);
            setEnhanceStatus('Preparing storyboard script...');
            try {
              const result = await queryCanvasPrompt(text, undefined, {
                onAttempt: (attempt, maxAttempts) => {
                  if (attempt === 1) {
                    setEnhanceStatus('Generating storyboard scenes...');
                  } else {
                    setEnhanceStatus(`Still generating (${attempt}/${maxAttempts})...`);
                  }
                },
              });
              const enhancedText =
                (typeof result?.enhanced_prompt === 'string' && result.enhanced_prompt.trim()) ||
                (typeof result?.response === 'string' && result.response.trim());

              if (enhancedText) {
                if (onScriptGenerated) {
                  onScriptGenerated(enhancedText);
                }
              } else {
                console.warn('[TextModalFrame] No enhanced text returned from queryCanvasPrompt response:', result);
                alert('Gemini did not return any text. Please try again with a different prompt.');
              }
            } catch (error: any) {
              console.error('[TextModalFrame] Error enhancing prompt:', error);
              alert(`Failed to enhance prompt: ${error.message || 'Unknown error'}`);
            } finally {
              setIsEnhancing(false);
              setEnhanceStatus('');
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title={isEnhancing ? enhanceStatus || 'Enhancing...' : 'Enhance prompt'}
          style={{
            width: `${30 * scale}px`,
            height: `${30 * scale}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isEnhancing 
              ? 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0.4) 100%)'
              : 'linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(168,85,247,0.6) 100%)',
            border: `${1 * scale}px solid rgba(168,85,247,0.65)`,
            borderRadius: `${12 * scale}px`,
            color: '#6d28d9',
            cursor: isEnhancing || !text.trim() ? 'not-allowed' : 'pointer',
            boxShadow: `0 ${6 * scale}px ${16 * scale}px rgba(168,85,247,0.35)`,
            padding: 0,
            transition: 'none',
            opacity: isEnhancing || !text.trim() ? 0.6 : 1,
          }}
          disabled={!text.trim() || isEnhancing}
          onMouseEnter={(e) => {
            if (!isEnhancing && text.trim()) {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 ${10 * scale}px ${24 * scale}px rgba(168,85,247,0.45)`;
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(168,85,247,0.35)`;
          }}
        >
          {isEnhancing ? (
            <svg 
              width={20 * scale} 
              height={20 * scale} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ 
                animation: 'spin 1s linear infinite',
                transformOrigin: 'center',
              }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
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
          )}
        </button>
        {enhanceStatus && (
          <span
            style={{
              fontSize: `${11 * scale}px`,
              color: isDark ? '#9CA3AF' : '#4B5563',
            }}
          >
            {enhanceStatus}
          </span>
        )}
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
          backgroundColor: pinBg,
          border: `1px solid ${pinBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 20,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.18s ease, background-color 0.3s ease, border-color 0.3s ease',
          pointerEvents: 'auto',
          boxShadow: isPinned ? `0 ${2 * scale}px ${8 * scale}px rgba(67, 126, 181, 0.3)` : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isPinned) {
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isPinned) {
            e.currentTarget.style.backgroundColor = pinBg;
          }
        }}
        title={isPinned ? 'Unpin controls' : 'Pin controls'}
      >
        <svg
          width={16 * scale}
          height={16 * scale}
          viewBox="0 0 24 24"
          fill={isPinned ? '#437eb5' : 'none'}
          stroke={pinIconColor}
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

