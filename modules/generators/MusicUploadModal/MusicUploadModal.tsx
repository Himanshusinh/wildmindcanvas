'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '@/modules/ui-global/common/canvasCaptureGuard';
import { MusicModalTooltip } from './MusicModalTooltip';
import { ModalActionIcons } from '@/modules/ui-global/common/ModalActionIcons';
import { MusicModalFrame } from './MusicModalFrame';
import { MusicModalNodes } from './MusicModalNodes';
import { MusicModalControls } from './MusicModalControls';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

interface MusicUploadModalProps {
  isOpen: boolean;
  id?: string;
  onClose: () => void;
  onMusicSelect?: (file: File) => void;
  onGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => void;
  generatedMusicUrl?: string | null;
  stageRef: React.RefObject<any>;
  scale: number;
  position: { x: number; y: number };
  x: number;
  y: number;
  onPositionChange?: (x: number, y: number) => void;
  onPositionCommit?: (x: number, y: number) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onDuplicate?: () => void;
  isSelected?: boolean;
  initialModel?: string;
  initialFrame?: string;
  initialAspectRatio?: string;
  initialPrompt?: string;
  onOptionsChange?: (opts: { model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  textInputStates?: Array<{ id: string; value?: string; sentValue?: string }>;
}

export const MusicUploadModal: React.FC<MusicUploadModalProps> = ({
  isOpen,
  id,
  onClose,
  onMusicSelect,
  onGenerate,
  generatedMusicUrl,
  stageRef,
  scale,
  position,
  x,
  y,
  onPositionChange,
  onPositionCommit,
  onSelect,
  onDelete,
  onDownload,
  onDuplicate,
  isSelected,
  initialModel,
  initialFrame,
  initialAspectRatio,
  initialPrompt,
  onOptionsChange,
  connections = [],
  textInputStates = [],
}) => {
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [selectedModel, setSelectedModel] = useState(initialModel ?? 'MusicGen');
  const [selectedFrame, setSelectedFrame] = useState(initialFrame ?? 'Frame');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(initialAspectRatio ?? '1:1');
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isAspectRatioDropdownOpen, setIsAspectRatioDropdownOpen] = useState(false);

  // Detect connected text input
  const connectedTextInput = useMemo(() => {
    if (!id || !connections || connections.length === 0 || !textInputStates || textInputStates.length === 0) {
      return null;
    }
    // Find connection where this modal is the target (to === id)
    const connection = connections.find(c => c.to === id);
    if (!connection) return null;

    // Find the text input state that matches the connection source
    const textInput = textInputStates.find(t => t.id === connection.from);
    return textInput || null;
  }, [id, connections, textInputStates]);

  const onOptionsChangeRef = useRef(onOptionsChange);

  // Update ref when onOptionsChange changes
  useEffect(() => {
    onOptionsChangeRef.current = onOptionsChange;
  }, [onOptionsChange]);

  // Update prompt when text input value changes (real-time sync)
  useEffect(() => {
    const currentTextValue = connectedTextInput?.value;
    if (currentTextValue !== undefined && currentTextValue !== prompt) {
      setPrompt(currentTextValue);
      if (onOptionsChangeRef.current) {
        onOptionsChangeRef.current({ prompt: currentTextValue });
      }
    }
  }, [connectedTextInput?.value, prompt]);

  // Use local prompt or connected prompt
  const effectivePrompt = prompt;

  // Calculate aspect ratio from string (e.g., "16:9" -> 16/9)
  const getAspectRatio = (ratio: string): string => {
    const [width, height] = ratio.split(':').map(Number);
    return `${width} / ${height}`;
  };

  const isDark = useIsDarkTheme();

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected
    ? '#437eb5'
    : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
  const frameBorderWidth = 2;

  const setGeneratingState = (next: boolean) => {
    setIsGenerating(next);
    onOptionsChange?.({ isGenerating: next });
  };

  const handleGenerate = async () => {
    const promptToUse = effectivePrompt;
    if (onGenerate && promptToUse.trim() && !isGenerating) {
      setGeneratingState(true);
      try {
        await onGenerate(promptToUse, selectedModel, selectedFrame, selectedAspectRatio);
      } catch (err) {
        console.error('Error generating music:', err);
        alert('Failed to generate music. Please try again.');
      } finally {
        setGeneratingState(false);
      }
    }
  };

  // Sync initial props to state on hydration
  useEffect(() => { if (typeof initialPrompt === 'string' && initialPrompt !== prompt) setPrompt(initialPrompt); }, [initialPrompt]);
  // Listen for global node-drag active state so nodes remain visible while dragging
  useEffect(() => {
    const handleActive = (e: Event) => {
      const ce = e as CustomEvent;
      setGlobalDragActive(Boolean(ce.detail?.active));
    };
    window.addEventListener('canvas-node-active', handleActive as any);
    return () => window.removeEventListener('canvas-node-active', handleActive as any);
  }, []);

  // Listen for pin toggle keyboard shortcut (P key)
  useEffect(() => {
    const handleTogglePin = (e: Event) => {
      const ce = e as CustomEvent;
      const { selectedMusicModalIds, selectedMusicModalId } = ce.detail || {};
      // Check if this modal is selected
      const isThisSelected = (selectedMusicModalIds && Array.isArray(selectedMusicModalIds) && selectedMusicModalIds.includes(id)) ||
        (selectedMusicModalId === id);

      if (isThisSelected) {
        setIsPinned(prev => !prev);
      }
    };
    window.addEventListener('canvas-toggle-pin', handleTogglePin as any);
    return () => window.removeEventListener('canvas-toggle-pin', handleTogglePin as any);
  }, [id]);
  useEffect(() => { if (initialModel && initialModel !== selectedModel) setSelectedModel(initialModel); }, [initialModel]);
  useEffect(() => { if (initialFrame && initialFrame !== selectedFrame) setSelectedFrame(initialFrame); }, [initialFrame]);

  // Listen for frame dim events (when dragging connection near disallowed frame)
  useEffect(() => {
    if (!id) return;

    const handleFrameDim = (e: Event) => {
      const ce = e as CustomEvent;
      const { frameId, dimmed } = ce.detail || {};
      if (frameId === id) {
        setIsDimmed(dimmed === true);
      }
    };

    window.addEventListener('canvas-frame-dim', handleFrameDim as any);
    return () => {
      window.removeEventListener('canvas-frame-dim', handleFrameDim as any);
    };
  }, [id]);
  useEffect(() => { if (initialAspectRatio && initialAspectRatio !== selectedAspectRatio) setSelectedAspectRatio(initialAspectRatio); }, [initialAspectRatio]);


  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isAudio = target.tagName === 'AUDIO';
    const isControls = target.closest('.controls-overlay');

    // Call onSelect when clicking on the modal (this will trigger context menu)
    if (onSelect && !isInput && !isButton && !isControls) {
      onSelect();
    }

    // Only allow dragging from the frame, not from controls
    if (!isInput && !isButton && !isAudio && !isControls) {
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
      lastCanvasPosRef.current = { x: newCanvasX, y: newCanvasY };
    };

    const handleMouseUp = () => {
      setIsDraggingContainer(false);
      if (onPositionCommit && lastCanvasPosRef.current) {
        onPositionCommit(lastCanvasPosRef.current.x, lastCanvasPosRef.current.y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    // Capture so child stopPropagation (e.g. nodes) can't block drag end
    window.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [isDraggingContainer, dragOffset, scale, position, onPositionChange]);


  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      data-modal-component="music"
      data-overlay-id={id}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        zIndex: isHovered || isSelected ? 2001 : 2000,
        userSelect: 'none',
        opacity: isDimmed ? 0.4 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <MusicModalTooltip
        isHovered={isHovered}
        scale={scale}
      />

      <ModalActionIcons
        isSelected={!!isSelected}
        scale={scale}
        generatedUrl={generatedMusicUrl}
        onDelete={onDelete}
        onDownload={onDownload}
        onDuplicate={onDuplicate}
      />

      <div style={{ position: 'relative' }}>
        <MusicModalFrame
          id={id}
          scale={scale}
          selectedAspectRatio={selectedAspectRatio}
          isHovered={isHovered}
          isPinned={isPinned}
          isSelected={!!isSelected}
          isDraggingContainer={isDraggingContainer}
          generatedMusicUrl={generatedMusicUrl}
          isGenerating={isGenerating}
          frameBorderColor={frameBorderColor}
          frameBorderWidth={frameBorderWidth}
          onSelect={onSelect}
          getAspectRatio={getAspectRatio}
          onSetIsPinned={setIsPinned}
        />

        <MusicModalNodes
          id={id}
          scale={scale}
          isHovered={isHovered}
          isSelected={!!isSelected}
          globalDragActive={globalDragActive}
        />
      </div>

      <MusicModalControls
        scale={scale}
        isHovered={isHovered}
        isPinned={isPinned}
        isSelected={Boolean(isSelected)}
        prompt={effectivePrompt}
        isPromptDisabled={!!connectedTextInput}
        selectedModel={selectedModel}
        selectedAspectRatio={selectedAspectRatio}
        selectedFrame={selectedFrame}
        generatedMusicUrl={generatedMusicUrl}
        isGenerating={isGenerating}
        isModelDropdownOpen={isModelDropdownOpen}
        isAspectRatioDropdownOpen={isAspectRatioDropdownOpen}
        frameBorderColor={frameBorderColor}
        frameBorderWidth={frameBorderWidth}
        onPromptChange={(val) => {
          if (!connectedTextInput) {
            setPrompt(val);
            onOptionsChange?.({ prompt: val, model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame });
          }
        }}
        onModelChange={(model) => {
          setSelectedModel(model);
        }}
        onAspectRatioChange={(ratio) => {
          setSelectedAspectRatio(ratio);
        }}
        onGenerate={handleGenerate}
        onSetIsHovered={setIsHovered}
        onSetIsPinned={setIsPinned}
        onSetIsModelDropdownOpen={setIsModelDropdownOpen}
        onSetIsAspectRatioDropdownOpen={setIsAspectRatioDropdownOpen}
        onOptionsChange={onOptionsChange}
      />
      {/* Close outer container */}
    </div>
  );
};

