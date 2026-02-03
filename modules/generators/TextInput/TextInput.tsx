'use client';

import { useState, useRef, useEffect } from 'react';
import '@/modules/ui-global/common/canvasCaptureGuard';
import { ModalActionIcons } from '@/modules/ui-global/common/ModalActionIcons';
import { TextModalTooltip } from './TextModalTooltip';
import { TextModalFrame } from './TextModalFrame';
import { TextModalNodes } from './TextModalNodes';
import { TextModalControls } from './TextModalControls';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SmartToken } from './smartTerms';

import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';

interface TextInputProps {
  id: string;
  x: number;
  y: number;
  autoFocusInput?: boolean;
  onConfirm: (text: string, model?: string) => void;
  onCancel: () => void;
  onPositionChange?: (x: number, y: number) => void;
  onPositionCommit?: (x: number, y: number) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onValueChange?: (value: string) => void;
  onSendPrompt?: (text: string) => void;
  stageRef: React.RefObject<any>;
  scale: number;
  position: { x: number; y: number };
  isSelected?: boolean;
  onScriptGenerated?: (textModalId: string, script: string) => void;
  onScriptGenerationStart?: (textModalId: string) => void;
  connections?: Array<{ from: string; to: string }>;
  storyboardModalStates?: Array<{ id: string; characterNamesMap?: Record<number, string>; propsNamesMap?: Record<number, string>; backgroundNamesMap?: Record<number, string> }>;
  onContextMenu?: (e: React.MouseEvent) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onDownload?: () => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  id,
  x,
  y,
  autoFocusInput,
  onConfirm,
  onCancel,
  onPositionChange,
  onPositionCommit,
  onSelect,
  onDelete,
  onDuplicate,
  onValueChange,
  onSendPrompt,
  stageRef,
  scale,
  position,
  isSelected,
  onScriptGenerated,
  onScriptGenerationStart,
  connections = [],
  storyboardModalStates = [],
  onContextMenu,
  isPinned = false,
  onTogglePin,
  onDownload,
}) => {
  const [text, setText] = useState('');
  const [selectedModel, setSelectedModel] = useState('GPT-4');
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  // Removed local isPinned state
  const [isModelHovered, setIsModelHovered] = useState(false);
  const [isTextFocused, setIsTextFocused] = useState(false);
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceStatus, setEnhanceStatus] = useState('');
  const [smartTokens, setSmartTokens] = useState<SmartToken[]>([]);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


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

  // Listen for pin toggle keyboard shortcut (P key)
  useEffect(() => {
    const handleTogglePin = (e: Event) => {
      const ce = e as CustomEvent;
      const { selectedTextInputIds, selectedTextInputId } = ce.detail || {};
      // Check if this text input is selected
      const isThisSelected = (selectedTextInputIds && Array.isArray(selectedTextInputIds) && selectedTextInputIds.includes(id)) ||
        (selectedTextInputId === id);

      if (isThisSelected) {
        onTogglePin?.();
      }
    };
    window.addEventListener('canvas-toggle-pin', handleTogglePin as any);
    return () => window.removeEventListener('canvas-toggle-pin', handleTogglePin as any);
  }, [id]);

  // Detect if this TextInput has a connected Storyboard
  const connectedStoryboardId = connections.find(conn => conn.from === id)?.to;

  const isDark = useIsDarkTheme();

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected
    ? SELECTION_COLOR
    : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
  const frameBorderWidth = 2;

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag if clicking on the header or container background, not on input/buttons
    const target = e.target as HTMLElement;
    const isHeader = target.closest('.text-input-header');
    const isInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isControls = target.closest('.controls-overlay');
    // Check if clicking on action icons (ModalActionIcons container or its children)
    const isActionIcons = target.closest('[data-action-icons]') || target.closest('button[title="Delete"], button[title="Download"], button[title="Duplicate"]');

    console.log('[TextInput] handleMouseDown', {
      timestamp: Date.now(),
      target: target.tagName,
      isInput,
      isButton,
      isControls: !!isControls,
      isActionIcons: !!isActionIcons,
      buttonTitle: target.closest('button')?.getAttribute('title'),
    });

    // Call onSelect when clicking on the text input container
    // Don't select if clicking on buttons, controls, inputs, or action icons
    // Call onSelect when clicking anywhere on the component to select it (and deselect others)
    if (onSelect) {
      console.log('[TextInput] Calling onSelect');
      onSelect();
    }

    // Only allow dragging from the header or container background, not from controls, inputs, buttons, or action icons
    if (isHeader || (!isInput && !isButton && !isControls && !isActionIcons && target === containerRef.current)) {
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

  const lastPositionRef = useRef({ x, y });

  // Update ref when props change (in case unmounting/remounting affects it, though usually drag drives it)
  useEffect(() => {
    lastPositionRef.current = { x, y };
  }, [x, y]);


  // Ref to hold latest props/state for drag handlers without triggering re-binds
  const dragStateRef = useRef({
    scale,
    position,
    onPositionChange,
    onPositionCommit,
    dragOffset
  });

  // Update ref on every render
  useEffect(() => {
    dragStateRef.current = {
      scale,
      position,
      onPositionChange,
      onPositionCommit,
      dragOffset
    };
  }, [scale, position, onPositionChange, onPositionCommit, dragOffset]);

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const state = dragStateRef.current;
      if (!containerRef.current || !state.onPositionChange) return;

      // Calculate new screen position
      const newScreenX = e.clientX - state.dragOffset.x;
      const newScreenY = e.clientY - state.dragOffset.y;

      // Convert screen coordinates back to canvas coordinates
      const newCanvasX = (newScreenX - state.position.x) / state.scale;
      const newCanvasY = (newScreenY - state.position.y) / state.scale;

      state.onPositionChange(newCanvasX, newCanvasY);
      lastPositionRef.current = { x: newCanvasX, y: newCanvasY };
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const state = dragStateRef.current;
      if (state.onPositionCommit) {
        state.onPositionCommit(lastPositionRef.current.x, lastPositionRef.current.y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    // Capture so child stopPropagation can't block drag end
    window.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [isDragging]);

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

  const handleEnhance = async () => {
    if (!text.trim() || isEnhancing) return;

    // Trigger loading state immediately
    if (onScriptGenerationStart) {
      onScriptGenerationStart(id);
    }

    setIsEnhancing(true);

    // If connected to storyboard, generate story/script text instead of enhancing prompt
    if (connectedStoryboardId) {
      setEnhanceStatus('Generating story...');
      try {
        const { queryCanvasPrompt } = await import('@/core/api/api');
        const result = await queryCanvasPrompt(text, undefined, {
          onAttempt: (attempt, maxAttempts) => {
            if (attempt === 1) {
              setEnhanceStatus('Generating story...');
            } else {
              setEnhanceStatus(`Generating (${attempt}/${maxAttempts})...`);
            }
          },
        });
        const generatedStory =
          (typeof result?.enhanced_prompt === 'string' && result.enhanced_prompt.trim()) ||
          (typeof result?.response === 'string' && result.response.trim());

        if (generatedStory) {
          // Update the text in the same input box
          setText(generatedStory);
          if (onValueChange) {
            onValueChange(generatedStory);
          }
          if (result.smart_tokens) {
            setSmartTokens(result.smart_tokens);
          }

          // Send the generated story to connected storyboard (as scriptText)
          window.dispatchEvent(new CustomEvent('text-script-generated', {
            detail: {
              componentId: connectedStoryboardId,
              scriptText: generatedStory,
              textInputId: id, // Include text input ID for queue removal
            }
          }));

          console.log('[TextInput] ✅ Story generated and sent to storyboard');
        } else {
          console.warn('[TextInput] No story text returned from generation');
          alert('Failed to generate story. Please try again.');
        }
      } catch (error: any) {
        console.error('[TextInput] Error generating story:', error);
        alert(`Failed to generate story: ${error.message || 'Unknown error'}`);
      } finally {
        setIsEnhancing(false);
        setEnhanceStatus('');
      }
      return;
    }

    // Otherwise, enhance the prompt normally (not connected to storyboard)
    setEnhanceStatus('Enhancing prompt...');
    try {
      const { queryCanvasPrompt } = await import('@/core/api/api');
      const result = await queryCanvasPrompt(text, undefined, {
        onAttempt: (attempt, maxAttempts) => {
          if (attempt === 1) {
            setEnhanceStatus('Enhancing prompt...');
          } else {
            setEnhanceStatus(`Enhancing (${attempt}/${maxAttempts})...`);
          }
        },
      });
      const enhancedText =
        (typeof result?.enhanced_prompt === 'string' && result.enhanced_prompt.trim()) ||
        (typeof result?.response === 'string' && result.response.trim());

      if (enhancedText) {
        // Update the text in the same input box
        setText(enhancedText);
        if (onValueChange) {
          onValueChange(enhancedText);
        }
        if (result.smart_tokens) {
          setSmartTokens(result.smart_tokens);
        }
        // Also call onScriptGenerated for backwards compatibility
        if (onScriptGenerated) {
          onScriptGenerated(id, enhancedText);
        }
      } else {
        console.warn('[TextInput] No enhanced text returned from queryCanvasPrompt response:', result);
        alert('Gemini did not return any text. Please try again with a different prompt.');
      }
    } catch (error: any) {
      console.error('[TextInput] Error enhancing prompt:', error);
      alert(`Failed to enhance prompt: ${error.message || 'Unknown error'}`);
    } finally {
      setIsEnhancing(false);
      setEnhanceStatus('');
    }
  };

  // Find connected components (image/video modals)
  const connectedComponents = connections.filter(c => c.from === id);
  const hasConnectedComponents = connectedComponents.length > 0;

  const handleSendPrompt = () => {
    if (!text.trim()) return;

    // If connected to storyboard, transfer text as script
    if (connectedStoryboardId) {
      window.dispatchEvent(new CustomEvent('text-script-generated', {
        detail: {
          componentId: connectedStoryboardId,
          scriptText: text,
          textInputId: id, // Include text input ID for queue removal
        }
      }));
    }

    // Also call onSendPrompt for other connected components
    if (hasConnectedComponents && onSendPrompt) {
      onSendPrompt(text);
    }
  };

  const requestHoverState = (next: boolean, force = false) => {
    if (next) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setIsHovered(true);
      return;
    }

    if (isPinned && !force) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      hoverTimeoutRef.current = null;
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-modal-component="text"
      data-overlay-id={id}
      onContextMenu={onContextMenu}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => requestHoverState(true, true)}
      onMouseLeave={() => requestHoverState(false)}
      onWheel={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        zIndex: isHovered || isSelected ? 2001 : 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: `${0 * scale}px`, // Removed gap as header is merging
        padding: 0, // Remove padding, let internal components handle spacing
        backgroundColor: isDark ? '#121212' : '#ffffff',
        borderRadius: (isHovered || isPinned)
          ? '0px'
          : `${16 * scale}px`,
        borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderBottom: (isHovered || isPinned) ? 'none' : `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        transition: 'border-radius 0.3s ease, border-bottom 0.3s ease, background-color 0.3s ease',
        boxShadow: 'none',
        width: `${400 * scale}px`,
        minWidth: `${400 * scale}px`,
        maxWidth: `${400 * scale}px`,
        cursor: isDragging ? 'grabbing' : (isHovered || isSelected ? 'grab' : 'pointer'),
        userSelect: 'none',
        overflow: 'visible',
        boxSizing: 'border-box',
      }}
    >
      <TextModalTooltip
        isHovered={isHovered}
        scale={scale}
      />

      <div style={{ position: 'relative' }}>
        <ModalActionIcons
          scale={scale}
          isSelected={Boolean(isSelected)}
          isPinned={isPinned}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          // Text Input doesn't usually produce downloadable content in the same way, but props exist.
          // If onDownload is passed, use it.
          onDownload={onDownload}
          onTogglePin={onTogglePin}
          onRegenerate={handleEnhance}
        />
        <TextModalFrame
          id={id}
          scale={scale}
          isHovered={isHovered}
          isPinned={isPinned}
          isSelected={!!isSelected}
          isDragging={isDragging}
          frameBorderColor={frameBorderColor}
          frameBorderWidth={frameBorderWidth}
          text={text}
          isTextFocused={isTextFocused}
          autoFocusInput={autoFocusInput}
          onTextChange={(v) => {
            setText(v);
            if (onValueChange) onValueChange(v);
          }}
          onTextFocus={() => setIsTextFocused(true)}
          onTextBlur={() => setIsTextFocused(false)}
          onKeyDown={handleKeyDown}
          onConfirm={handleConfirm}
          selectedModel={selectedModel}
          onSetIsPinned={(val) => onTogglePin?.()}
          onMouseDown={handleMouseDown}
          onScriptGenerated={(script) => {
            if (onScriptGenerated) {
              onScriptGenerated(id, script);
            }
          }}
          connections={connections}
          storyboardModalStates={storyboardModalStates}
          onHoverChange={requestHoverState}
          onSendPrompt={handleSendPrompt}
          hasConnectedComponents={hasConnectedComponents}
          smartTokens={smartTokens}
          onSmartTokensChange={(tokens) => setSmartTokens(tokens)}
        />

        <TextModalNodes
          id={id}
          scale={scale}
          isHovered={isHovered}
          isSelected={!!isSelected}
          globalDragActive={globalDragActive}
        />
      </div>

      <TextModalControls
        scale={scale}
        isHovered={isHovered}
        isPinned={isPinned}
        selectedModel={selectedModel}
        isModelDropdownOpen={isModelDropdownOpen}
        isModelHovered={isModelHovered}
        frameBorderColor={frameBorderColor}
        frameBorderWidth={frameBorderWidth}
        text={text}
        isEnhancing={isEnhancing}
        enhanceStatus={enhanceStatus}
        onModelChange={(model) => {
          setSelectedModel(model);
        }}
        onSetIsHovered={requestHoverState}
        onSetIsPinned={(val) => onTogglePin?.()}
        onSetIsModelDropdownOpen={setIsModelDropdownOpen}
        onSetIsModelHovered={setIsModelHovered}
        onEnhance={handleEnhance}
        onSendPrompt={handleSendPrompt}
        hasConnectedComponents={hasConnectedComponents}
      />
    </div>
  );
};

