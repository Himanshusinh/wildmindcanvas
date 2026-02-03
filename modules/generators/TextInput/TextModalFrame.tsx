import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { anchorSmartTokens, SmartToken } from './smartTerms';

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
  smartTokens?: SmartToken[];
  onSmartTokensChange?: (tokens: SmartToken[]) => void;
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
  smartTokens: externalSmartTokens = [],
  onSmartTokensChange,
}: TextModalFrameProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isDark = useIsDarkTheme();
  const [textareaHeight, setTextareaHeight] = useState<number>(400); // Start at max height

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ y: number; height: number } | null>(null);

  // Smart Tokens State
  const smartTokens = useMemo(() => {
    const anchored = anchorSmartTokens(text, externalSmartTokens);
    console.log(`[TextModalFrame] 🔍 USE_MEMO: Count=${anchored.length}, TextLen=${text.length}`);
    return anchored;
  }, [text, externalSmartTokens]);

  console.log(`[TextModalFrame] 🛠️ RENDER: textLen=${text.length}, tokensLen=${smartTokens.length}, isDark=${isDark}`);
  const [activeTokenIndex, setActiveTokenIndex] = useState<number | null>(null);
  const [activeTokenRect, setActiveTokenRect] = useState<{ top: number; left: number } | null>(null);
  const [isTokenHovered, setIsTokenHovered] = useState(false);
  const tokenContainerRef = useRef<HTMLDivElement>(null);

  // Auto-expand height and sync scroll
  useEffect(() => {
    if (!inputRef.current) return;

    // Auto-expand logic
    const updateHeight = () => {
      const el = inputRef.current;
      if (!el) return;

      // Reset height to get true scrollHeight
      const originalHeight = el.style.height;
      el.style.height = 'auto';
      const scrollHeight = el.scrollHeight;
      el.style.height = originalHeight;

      // Convert scrollHeight back to canvas pixels
      const canvasScrollHeight = scrollHeight / scale;
      const newHeight = 400; // Keep it at max height as requested

      // Only update if it's different significantly to avoid loops
      if (Math.abs(newHeight - textareaHeight) > 1) {
        setTextareaHeight(newHeight);
      }
    };

    updateHeight();
  }, [text, scale]);

  // Robust Canvas Scroll Blocking
  useEffect(() => {
    const onWindowWheelCapture = (e: WheelEvent) => {
      if (!containerRef.current) return;

      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      const isInFrame = path.includes(containerRef.current);

      if (!isInFrame) return;

      // Block canvas/Konva wheel handlers
      e.stopPropagation();
      (e as any).stopImmediatePropagation?.();

      // If we are over a scrollable element, we might want to manually scroll it
      // but usually the browser does it if we DON'T preventDefault.
      // However, to block the CANVAS from zooming (which often uses preventDefault: false),
      // we might need to be more aggressive.

      // Let's check if we are over a scrollable child
      const target = e.target as HTMLElement;
      const dropdown = target.closest('.smart-dropdown') || target.closest('.suggestions-dropdown');

      if (dropdown) {
        dropdown.scrollTop += e.deltaY;
        e.preventDefault();
      } else if (inputRef.current) {
        inputRef.current.scrollTop += e.deltaY;
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', onWindowWheelCapture, { passive: false, capture: true });
    return () => {
      window.removeEventListener('wheel', onWindowWheelCapture as any, true);
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (tokenContainerRef.current) {
      tokenContainerRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleTextareaMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    // We use a small threshold or rely on cursor position
    const caretPos = e.currentTarget.selectionStart;
    if (caretPos === null) {
      setIsTokenHovered(false);
      return;
    }

    // Check if the character at current mouse position (roughly) is a token
    // Since we can't easily map mouse X/Y to char index without heavy logic,
    // we'll rely on the selectionStart if it's being updated or just simpler:
    // Actually, for better UX we just keep it text but make the tokens PULSE.
    // Let's stick to pointer cursor on click/focus intent? 
    // No, let's use the click handler's logic but for mouse move.

    const tokenUnderMouse = smartTokens.some(t => caretPos >= t.startIndex && caretPos <= t.endIndex);
    setIsTokenHovered(tokenUnderMouse);
  };

  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const pos = e.currentTarget.selectionStart;
    if (pos === null) return;

    const tokenIndex = smartTokens.findIndex(t => pos >= t.startIndex && pos <= t.endIndex);

    if (tokenIndex !== -1 && tokenContainerRef.current) {
      const span = tokenContainerRef.current.querySelector(`[data-token-index="${tokenIndex}"]`);
      if (span) {
        const rect = (span as HTMLElement).getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };
        setActiveTokenIndex(tokenIndex);
        setActiveTokenRect({
          top: (rect.bottom - containerRect.top) / scale,
          left: (rect.left - containerRect.left) / scale,
        });
      }
    } else {
      setActiveTokenIndex(null);
    }
  };

  const containerRef = useRef<HTMLDivElement>(null);

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
      ref={containerRef}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
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

      <div style={{
        position: 'relative',
        width: '100%',
        height: `${textareaHeight * scale}px`,
        borderRadius: (isHovered || isPinned)
          ? '0px'
          : `${16 * scale}px`,
        overflow: 'hidden'
      }}>
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
              if (!query.includes(' ')) {
                setMentionQuery(query);
                const connectedStoryboardIds = connections
                  .filter(c => c.from === id || c.to === id)
                  .map(c => c.from === id ? c.to : c.from);
                const relevantStoryboards = storyboardModalStates.filter(s => connectedStoryboardIds.includes(s.id));
                const allNames: string[] = [];
                relevantStoryboards.forEach(s => {
                  if (s.characterNamesMap) Object.values(s.characterNamesMap).forEach(name => { if (name && name.toLowerCase().includes(query.toLowerCase())) allNames.push(name); });
                  if (s.propsNamesMap) Object.values(s.propsNamesMap).forEach(name => { if (name && name.toLowerCase().includes(query.toLowerCase())) allNames.push(name); });
                  if (s.backgroundNamesMap) Object.values(s.backgroundNamesMap).forEach(name => { if (name && name.toLowerCase().includes(query.toLowerCase())) allNames.push(name); });
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
          onScroll={handleScroll}
          onBlur={() => {
            onTextBlur();
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyDown={(e) => {
            if (showSuggestions) {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestionIndex(prev => (prev + 1) % suggestions.length); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length); }
              else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const selectedName = suggestions[suggestionIndex];
                if (selectedName) {
                  const textBeforeCursor = text.slice(0, cursorPosition);
                  const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
                  const newText = text.slice(0, lastAtSymbol) + '@' + selectedName + ' ' + text.slice(cursorPosition);
                  onTextChange(newText);
                  setShowSuggestions(false);
                }
              } else if (e.key === 'Escape') setShowSuggestions(false);
            } else onKeyDown(e);
          }}
          placeholder="Enter text here..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            // Absolute transparency to let the overlay show through
            color: 'transparent !important',
            WebkitTextFillColor: 'transparent',
            caretColor: isDark ? '#ffffff' : '#111827',
            fontSize: `${16 * scale}px`,
            lineHeight: '1.5',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: 'normal',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            height: '100%',
            width: '100%',
            boxSizing: 'border-box',
            cursor: isTokenHovered ? 'pointer' : 'text',
            zIndex: 10, // Underneath the highlights
            position: 'absolute',
            top: 0,
            left: 0,
            overflowY: 'auto',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            padding: `${24 * scale}px ${16 * scale}px`,
            margin: 0,
          }}
          onWheel={(e) => e.stopPropagation()}
          onClick={handleTextareaClick}
          onMouseMove={handleTextareaMouseMove}
        />

        {/* Smart Tokens Visual Layer - Now ON TOP but transparent to clicks */}
        <div
          ref={tokenContainerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // Critical: clicks pass through to textarea
            fontSize: `${16 * scale}px`,
            lineHeight: '1.5',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            letterSpacing: 'normal',
            color: isDark ? '#ffffff' : '#111827',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            zIndex: 15, // ABOVE the textarea
            padding: `${24 * scale}px ${16 * scale}px`,
            backgroundColor: 'transparent',
            overflow: 'hidden',
            boxSizing: 'border-box',
            margin: 0,
          }}
        >
          {renderTextWithTokens(text, smartTokens, scale, isDark, activeTokenIndex)}
        </div>
      </div>
      {/* Smart Category Dropdown */}
      {activeTokenIndex !== null && activeTokenRect && (
        <div
          className="smart-dropdown"
          style={{
            position: 'absolute',
            top: `${activeTokenRect.top + 4 * scale}px`,
            left: `${activeTokenRect.left}px`,
            zIndex: 3001,
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: `${12 * scale}px`,
            boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.1)',
            padding: `${6 * scale}px`,
            minWidth: `${160 * scale}px`,
            maxHeight: `${200 * scale}px`,
            overflowY: 'auto',
            pointerEvents: 'auto',
            animation: 'fadeInUp 0.2s ease-out',
          }}
          onWheel={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div style={{ padding: `${4 * scale}px ${8 * scale}px`, fontSize: `${10 * scale}px`, color: isDark ? '#9CA3AF' : '#6B7280', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
            {smartTokens[activeTokenIndex].category}
          </div>
          {smartTokens[activeTokenIndex].options.map((option) => (
            <div
              key={option}
              onClick={() => {
                const token = smartTokens[activeTokenIndex];
                const newText = text.slice(0, token.startIndex) + option + text.slice(token.endIndex);

                // Update source tokens for persistence so this token remains editable
                if (onSmartTokensChange) {
                  onSmartTokensChange(externalSmartTokens.map(t => {
                    // Match based on category and options (heuristic for same logical smart token)
                    if (t.category === token.category && t.options.join(',') === token.options.join(',')) {
                      return { ...t, text: option };
                    }
                    return t;
                  }));
                }

                onTextChange(newText);
                setActiveTokenIndex(null);
              }}
              style={{
                padding: `${8 * scale}px ${10 * scale}px`,
                borderRadius: `${8 * scale}px`,
                fontSize: `${14 * scale}px`,
                cursor: 'pointer',
                color: isDark ? '#FFFFFF' : '#111827',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span>{option}</span>
              {text.toLowerCase().includes(option.toLowerCase()) && (
                <div style={{
                  width: `${6 * scale}px`,
                  height: `${6 * scale}px`,
                  borderRadius: '50%',
                  backgroundColor: '#60A5FA',
                  boxShadow: '0 0 5px rgba(96, 165, 250, 0.8)'
                }} />
              )}
            </div>
          ))}
        </div>
      )}

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
      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          className="suggestions-dropdown"
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
          onWheel={(e) => e.stopPropagation()}
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

/**
 * Helper to render text with interactive smart tokens
 */
function renderTextWithTokens(
  text: string,
  tokens: SmartToken[],
  scale: number,
  isDark: boolean,
  activeIndex: number | null
) {
  console.log(`[renderTextWithTokens] 🎨 Painting ${tokens.length} tokens into text...`);
  if (!tokens || tokens.length === 0) return text;

  const result: (string | React.ReactNode)[] = [];
  let lastIndex = 0;

  // Ensure they are sorted for the loop
  const sorted = [...tokens].sort((a, b) => a.startIndex - b.startIndex);

  sorted.forEach((token, index) => {
    // Add text before token
    if (token.startIndex > lastIndex) {
      result.push(text.slice(lastIndex, token.startIndex));
    }

    // Add token
    result.push(
      <span
        key={`token-${index}-${token.startIndex}`}
        data-token-index={index}
        style={{
          color: activeIndex === index ? '#3B82F6' : '#60A5FA',
          fontWeight: 900,
          transition: 'all 0.2s ease',
          display: 'inline',
          position: 'relative',
          cursor: 'pointer',
          textDecoration: 'underline',
          textDecorationColor: 'rgba(59, 130, 246, 0.4)',
          textUnderlineOffset: '4px',
        }}
      >
        {token.text}
        <span style={{
          position: 'absolute',
          bottom: `${-14 * scale}px`,
          left: '50%',
          transform: `translateX(-50%) ${activeIndex === index ? 'rotate(180deg)' : ''}`,
          fontSize: `${10 * scale}px`,
          color: '#60A5FA',
          fontWeight: 'bold',
          pointerEvents: 'none',
          opacity: 0.8,
        }}>▾</span>
      </span>
    );

    lastIndex = token.endIndex;
  });

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}


