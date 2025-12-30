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


  const inputBg = isDark ? '#121212' : '#ffffff';
  const inputBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const inputText = isDark ? '#ffffff' : '#1f2937';
  const handleBg = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)';

  return (
    <div
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      {/* Drag handle header */}
      <div
        className="text-input-header"
        style={{
          height: `${16 * scale}px`,
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          padding: `${8 * scale}px ${4 * scale}px`,
          marginBottom: `${4 * scale}px`,
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

      <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
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
            // Delay hiding suggestions to allow click event
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
                  // Need to update cursor position manually if possible, but React state update might make it tricky
                }
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            } else {
              onKeyDown(e);
            }
          }}
          placeholder="Enter text here..."
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            background: inputBg,
            border: `${1 * scale}px solid ${inputBorder}`,
            borderRadius: `${8 * scale}px`,
            padding: `${10 * scale}px`,
            color: inputText,
            fontSize: `${16 * scale}px`,
            fontFamily: 'Arial, sans-serif',
            outline: 'none',
            resize: 'none',
            minHeight: `${80 * scale}px`,
            height: `${textareaHeight * scale}px`,
            width: '100%',
            minWidth: 0,
            maxWidth: '100%',
            boxSizing: 'border-box',
            cursor: isTextFocused ? 'text' : 'default',
            transition: 'background-color 0.3s ease, color 0.3s ease, border-radius 0.3s ease',
            overflow: 'auto',
          }}
          onFocus={(e) => {
            onTextFocus();
            // Keep border color the same on focus (prevent blue border)
            e.currentTarget.style.border = `${1 * scale}px solid ${inputBorder}`;
            e.currentTarget.style.borderColor = inputBorder;
          }}
        />

        {/* Custom Resize Handle (3 refined dots) */}
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            bottom: `${8 * scale}px`,
            right: `${8 * scale}px`,
            width: `${16 * scale}px`,
            height: `${16 * scale}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            gap: `${2 * scale}px`,
            cursor: 'ns-resize',
            zIndex: 10,
            opacity: isHovered || isResizing ? 0.8 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          <div style={{ width: `${2 * scale}px`, height: `${2 * scale}px`, backgroundColor: handleBg, borderRadius: '50%' }} />
          <div style={{ display: 'flex', gap: `${2 * scale}px` }}>
            <div style={{ width: `${2 * scale}px`, height: `${2 * scale}px`, backgroundColor: handleBg, borderRadius: '50%' }} />
            <div style={{ width: `${2 * scale}px`, height: `${2 * scale}px`, backgroundColor: handleBg, borderRadius: '50%' }} />
          </div>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          style={{
            position: 'absolute',
            top: `${cursorPosition > 0 ? 40 * scale : 0}px`, // Rough positioning, could be improved with textarea-caret library
            left: `${12 * scale}px`,
            zIndex: 3000,
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: `${8 * scale}px`,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            maxHeight: `${150 * scale}px`,
            overflowY: 'auto',
            minWidth: `${120 * scale}px`,
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
                padding: `${6 * scale}px ${12 * scale}px`,
                cursor: 'pointer',
                backgroundColor: index === suggestionIndex ? (isDark ? '#374151' : '#f3f4f6') : 'transparent',
                color: isDark ? '#e5e7eb' : '#374151',
                fontSize: `${14 * scale}px`,
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

