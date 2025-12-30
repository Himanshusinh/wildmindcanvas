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
  const isSettingHeightRef = useRef(false); // Flag to prevent ResizeObserver from firing during programmatic changes
  const previousScaleRef = useRef(scale); // Track previous scale to detect scale changes
  const isDark = useIsDarkTheme();
  const [textareaHeight, setTextareaHeight] = useState<number | null>(null); // Store height in canvas coordinates (will be scaled)

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');

  useEffect(() => {
    // Only autofocus the inner textarea when allowed. Default is to autofocus
    // for backwards compatibility; creating via toolbar/tool should pass
    // `autoFocusInput: false` to prevent forcing text cursor on the stage.
    if (autoFocusInput === false) return;
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocusInput]);

  // Initialize textarea height on mount (in canvas coordinates, not scaled)
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea || textareaHeight !== null) return;

    // Set initial height in canvas coordinates (80 canvas units, will be scaled)
    const initialHeight = 80; // Canvas coordinates, not pixels
    setTextareaHeight(initialHeight);
    isSettingHeightRef.current = true;
    textarea.style.height = `${initialHeight * scale}px`; // Scale for display
    // Reset flag after a brief delay to allow ResizeObserver to settle
    setTimeout(() => {
      isSettingHeightRef.current = false;
    }, 100);
  }, []); // Only run once on mount

  // Track textarea height changes (when user manually resizes)
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    // Use ResizeObserver to track when user manually resizes
    const resizeObserver = new ResizeObserver((entries) => {
      // Ignore if we're programmatically setting the height
      if (isSettingHeightRef.current) return;

      // Ignore if scale has changed (this is a scale change, not a user resize)
      if (previousScaleRef.current !== scale) {
        previousScaleRef.current = scale;
        return;
      }

      for (const entry of entries) {
        const height = entry.contentRect.height;
        // Convert screen pixels to canvas coordinates by dividing by current scale
        const canvasHeight = height / scale;
        // Only update if height changed significantly (user manually resized)
        // Use a larger threshold to avoid small fluctuations
        if (canvasHeight > 0 && (textareaHeight === null || Math.abs(canvasHeight - textareaHeight) > 5 / scale)) {
          setTextareaHeight(canvasHeight); // Store in canvas coordinates
        }
      }
    });

    resizeObserver.observe(textarea);

    // Update previous scale ref
    previousScaleRef.current = scale;

    return () => {
      resizeObserver.disconnect();
    };
  }, [textareaHeight, scale]);

  // Apply stored height when scale changes (scale the canvas height to screen pixels)
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea || textareaHeight === null) return;

    // When scale changes, convert canvas height to screen pixels
    // Set flag to prevent ResizeObserver from interfering
    isSettingHeightRef.current = true;
    const newHeight = textareaHeight * scale;
    textarea.style.height = `${newHeight}px`; // Scale canvas height to screen
    // Also ensure width is properly constrained
    textarea.style.width = '100%';
    textarea.style.maxWidth = '100%';
    textarea.style.minWidth = '0';

    // Update previous scale ref immediately
    previousScaleRef.current = scale;

    // Reset flag after a longer delay to ensure ResizeObserver doesn't interfere
    setTimeout(() => {
      isSettingHeightRef.current = false;
    }, 150);
  }, [scale, textareaHeight]);

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
            resize: 'vertical',
            minHeight: `${80 * scale}px`,
            height: textareaHeight !== null ? `${textareaHeight * scale}px` : `${80 * scale}px`,
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

