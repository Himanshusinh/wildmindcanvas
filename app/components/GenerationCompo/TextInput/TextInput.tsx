'use client';

import { useState, useRef, useEffect } from 'react';
import '@/app/components/common/canvasCaptureGuard';
import { TextModalTooltip } from './TextModalTooltip';
import { ModalActionIcons } from '@/app/components/common/ModalActionIcons';
import { TextModalFrame } from './TextModalFrame';
import { TextModalNodes } from './TextModalNodes';
import { TextModalControls } from './TextModalControls';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface TextInputProps {
  id: string;
  x: number;
  y: number;
  autoFocusInput?: boolean;
  onConfirm: (text: string, model?: string) => void;
  onCancel: () => void;
  onPositionChange?: (x: number, y: number) => void;
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
}

export const TextInput: React.FC<TextInputProps> = ({
  id,
  x,
  y,
  autoFocusInput,
  onConfirm,
  onCancel,
  onPositionChange,
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
}) => {
  const [text, setText] = useState('');
  const [selectedModel, setSelectedModel] = useState('GPT-4');
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isModelHovered, setIsModelHovered] = useState(false);
  const [isTextFocused, setIsTextFocused] = useState(false);
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceStatus, setEnhanceStatus] = useState('');
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
      const { selectedTextInputIds } = ce.detail || {};
      // Check if this text input is selected
      if (selectedTextInputIds && Array.isArray(selectedTextInputIds) && selectedTextInputIds.includes(id)) {
        setIsPinned(prev => !prev);
      }
    };
    window.addEventListener('canvas-toggle-pin', handleTogglePin as any);
    return () => window.removeEventListener('canvas-toggle-pin', handleTogglePin as any);
  }, [id]);


  const isDark = useIsDarkTheme();

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected
    ? '#437eb5'
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
    if (onSelect && !isInput && !isButton && !isControls && !isActionIcons) {
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
    // Capture so child stopPropagation can't block drag end
    window.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp, true);
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
    setEnhanceStatus('Enhancing prompt...');
    try {
      const { queryCanvasPrompt } = await import('@/lib/api');
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
    if (!text.trim() || !hasConnectedComponents) return;
    
    // Call onSendPrompt to update sentValue in the parent state
    // This will trigger the useEffect in connected components to sync the prompt
    if (onSendPrompt) {
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
      onMouseDown={handleMouseDown}
      onMouseEnter={() => requestHoverState(true, true)}
      onMouseLeave={() => requestHoverState(false)}
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        zIndex: isHovered || isSelected ? 2001 : 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: `${1 * scale}px`,
        padding: `${20 * scale}px ${12 * scale}px`,
        paddingTop: `${24 * scale}px`,
        paddingBottom: `${24 * scale}px`,
        backgroundColor: isDark ? '#121212' : '#ffffff',
        borderRadius: (isHovered || isPinned) ? '0px' : `${12 * scale}px`,
        borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderBottom: (isHovered || isPinned) ? 'none' : `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        transition: 'border 0.3s ease, background-color 0.3s ease',
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

      <ModalActionIcons
        isSelected={!!isSelected}
        scale={scale}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        variant="default"
        isPinned={isPinned}
        onTogglePin={() => setIsPinned(!isPinned)}
      />

      <div style={{ position: 'relative' }}>
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
          onSetIsPinned={setIsPinned}
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
        onSetIsPinned={setIsPinned}
        onSetIsModelDropdownOpen={setIsModelDropdownOpen}
        onSetIsModelHovered={setIsModelHovered}
        onEnhance={handleEnhance}
        onSendPrompt={handleSendPrompt}
        hasConnectedComponents={hasConnectedComponents}
      />
    </div>
  );
};

