'use client';
import React, { useRef, useEffect, useState } from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

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
  connections?: Array<{ from: string; to: string }>;
  storyboardModalStates?: Array<{ id: string; characterNamesMap?: Record<number, string>; propsNamesMap?: Record<number, string>; backgroundNamesMap?: Record<number, string> }>;
  onHoverChange?: (hovered: boolean) => void;
  onSendPrompt?: () => void;
  hasConnectedComponents?: boolean;
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
  connections = [],
  storyboardModalStates = [],
  onHoverChange,
  onSendPrompt,
  hasConnectedComponents = false,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isDark = useIsDarkTheme();
  const [textareaHeight, setTextareaHeight] = useState<number>(80); // Canvas coordinates

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ y: number; height: number } | null>(null);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      y: e.clientY,
      height: textareaHeight || 80,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const deltaY = e.clientY - resizeStartRef.current.y;
      const canvasDeltaY = deltaY / scale;
      const newHeight = Math.max(80, resizeStartRef.current.height + canvasDeltaY);
      setTextareaHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, scale, textareaHeight]);

  useEffect(() => {
    // Only autofocus the inner textarea when allowed. Default is to autofocus
    // for backwards compatibility; creating via toolbar/tool should pass
    // `autoFocusInput: false` to prevent forcing text cursor on the stage.
    if (autoFocusInput === false) return;
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocusInput]);


  // Determine placeholder color based on theme
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)';

  return (
    <div
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Invisible Drag Area at Top */}
      <div
        className="text-input-header" // Keep class for drag detection in parent
        style={{
          height: `${24 * scale}px`,
          cursor: 'grab',
          width: '100%',
          flexShrink: 0,
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onMouseDown(e);
        }}
      />

      <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box', flex: 1, padding: `${6 * scale}px ${16 * scale}px ${16 * scale}px ${16 * scale}px` }}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            onTextChange(v);

            // Check for mention trigger
            const cursor = e.target.selectionStart;
            setCursorPosition(cursor);

            const textBeforeCursor = v.slice(0, cursor);
            const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

            if (lastAtSymbol !== -1) {
              const query = textBeforeCursor.slice(lastAtSymbol + 1);
              // Only show suggestions if there's no space after @ (or typing a name)
              if (!query.includes(' ')) {
                setMentionQuery(query);

                // Find connected storyboards
                const connectedStoryboardIds = connections
                  .filter(c => c.from === id || c.to === id)
                  .map(c => c.from === id ? c.to : c.from);

                const relevantStoryboards = storyboardModalStates.filter(s => connectedStoryboardIds.includes(s.id));

                // Collect all names
                const allNames: string[] = [];
                relevantStoryboards.forEach(s => {
                  if (s.characterNamesMap) {
                    Object.values(s.characterNamesMap).forEach(name => {
                      if (name && name.toLowerCase().includes(query.toLowerCase())) {
                        allNames.push(name);
                      }
                    });
                  }
                  if (s.propsNamesMap) {
                    Object.values(s.propsNamesMap).forEach(name => {
                      if (name && name.toLowerCase().includes(query.toLowerCase())) {
                        allNames.push(name);
                      }
                    });
                  }
                  if (s.backgroundNamesMap) {
                    Object.values(s.backgroundNamesMap).forEach(name => {
                      if (name && name.toLowerCase().includes(query.toLowerCase())) {
                        allNames.push(name);
                      }
                    });
                  }
                });

                const uniqueNames = Array.from(new Set(allNames));

                if (uniqueNames.length > 0) {
                  setSuggestions(uniqueNames);
                  setShowSuggestions(true);
                  setSuggestionIndex(0);
                } else {
                  setShowSuggestions(false);
                }
              } else {
                setShowSuggestions(false);
              }
            } else {
              setShowSuggestions(false);
            }
          }}
          onBlur={() => {
            onTextBlur();
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyDown={(e) => {
            if (showSuggestions) {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSuggestionIndex(prev => (prev + 1) % suggestions.length);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
              } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const selectedName = suggestions[suggestionIndex];
                if (selectedName) {
                  const textBeforeCursor = text.slice(0, cursorPosition);
                  const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
                  const newText = text.slice(0, lastAtSymbol) + '@' + selectedName + ' ' + text.slice(cursorPosition);
                  onTextChange(newText);
                  setShowSuggestions(false);
                }
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            } else {
              onKeyDown(e);
            }
          }}
          placeholder="Enter text here..."
          onMouseDown={(e) => {
            // Allow event to bubble to parent for selection, but prevent event for other things if needed
            // e.stopPropagation(); // REMOVED: sticky selection bug fix
          }}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            color: isDark ? '#ffffff' : '#111827',
            caretColor: isDark ? '#3b82f6' : '#2563eb', // Nice caret color
            fontSize: `${16 * scale}px`,
            lineHeight: '1.5',
            fontFamily: 'Inter, sans-serif',
            minHeight: `${80 * scale}px`,
            height: `${textareaHeight * scale}px`,
            width: '100%',
            boxSizing: 'border-box',
            cursor: 'text',
          }}
        />

        {/* Placeholder styling hack if needed, but native is usually fine.
             Let's use ::placeholder CSS in global or just rely on transparency.
             Inline styles for ::placeholder aren't possible directly in React style prop.
          */}

        {/* Resize Handle - Minimal Corner */}
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            bottom: `${2 * scale}px`,
            right: `${2 * scale}px`,
            width: `${12 * scale}px`,
            height: `${12 * scale}px`,
            cursor: 'ns-resize',
            zIndex: 10,
            opacity: isHovered || isResizing ? 0.6 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <path d="M10.5 4.5L10.5 10.5L4.5 10.5" stroke={isDark ? "white" : "black"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          style={{
            position: 'absolute',
            top: `${cursorPosition > 0 ? 80 * scale : 40 * scale}px`, // Simple fallback
            left: `${16 * scale}px`,
            zIndex: 3000,
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: `${8 * scale}px`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: `${160 * scale}px`,
            overflowY: 'auto',
            minWidth: `${140 * scale}px`,
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => {
                const textBeforeCursor = text.slice(0, cursorPosition);
                const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
                const newText = text.slice(0, lastAtSymbol) + '@' + suggestion + ' ' + text.slice(cursorPosition);
                onTextChange(newText);
                setShowSuggestions(false);
              }}
              style={{
                padding: `${8 * scale}px ${12 * scale}px`,
                cursor: 'pointer',
                backgroundColor: index === suggestionIndex ? (isDark ? '#374151' : '#f3f4f6') : 'transparent',
                color: isDark ? '#e5e7eb' : '#374151',
                fontSize: `${13 * scale}px`,
                fontWeight: index === suggestionIndex ? 500 : 400,
              }}
              onMouseEnter={() => setSuggestionIndex(index)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

