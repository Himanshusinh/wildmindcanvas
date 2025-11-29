'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '@/app/components/common/canvasCaptureGuard';
import { VideoModalTooltip } from './VideoModalTooltip';
import { ModalActionIcons } from '@/app/components/common/ModalActionIcons';
import { VideoModalFrame } from './VideoModalFrame';
import { VideoModalNodes } from './VideoModalNodes';
import { VideoModalControls } from './VideoModalControls';
import {
  getModelDurations,
  getModelDefaultDuration,
  getModelAspectRatios,
  getModelDefaultAspectRatio,
  getModelResolutions,
  getModelDefaultResolution,
  isValidDurationForModel,
  isValidAspectRatioForModel,
  isValidResolutionForModel,
} from '@/lib/videoModelConfig';
import { ImageUpload } from '@/types/canvas';

const VIDEO_MODEL_OPTIONS = [
  'Sora 2 Pro',
  'Veo 3.1',
  'Veo 3.1 Fast',
  'Kling 2.5 Turbo Pro',
  'Seedance 1.0 Pro',
  'Seedance 1.0 Lite',
  'PixVerse v5',
  'LTX V2 Pro',
  'LTX V2 Fast',
  'WAN 2.5',
  'WAN 2.5 Fast',
  'MiniMax-Hailuo-02',
  'T2V-01-Director',
];

interface VideoUploadModalProps {
  isOpen: boolean;
  id?: string;
  onClose: () => void;
  onGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, duration: number, resolution?: string, firstFrameUrl?: string, lastFrameUrl?: string) => void;
  onVideoSelect?: (file: File) => void;
  generatedVideoUrl?: string | null;
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
  onAddToCanvas?: (url: string) => void;
  isSelected?: boolean;
  initialModel?: string;
  initialFrame?: string;
  initialAspectRatio?: string;
  initialPrompt?: string;
  initialDuration?: number;
  initialResolution?: string;
  onOptionsChange?: (opts: { model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number; resolution?: string; frameWidth?: number; frameHeight?: number }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>;
  images?: ImageUpload[];
  textInputStates?: Array<{ id: string; value?: string }>;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  isOpen,
  id,
  onClose,
  onGenerate,
  generatedVideoUrl,
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
  onAddToCanvas,
  isSelected,
  initialModel,
  initialFrame,
  initialAspectRatio,
  initialPrompt,
  initialDuration,
  initialResolution,
  onOptionsChange,
  onVideoSelect,
  connections = [],
  imageModalStates = [],
  images = [],
  textInputStates = [],
}) => {
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [selectedModel, setSelectedModel] = useState(initialModel ?? 'Seedance 1.0 Pro');
  const [selectedFrame, setSelectedFrame] = useState(initialFrame ?? 'Frame');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(
    initialAspectRatio ?? getModelDefaultAspectRatio(initialModel ?? 'Seedance 1.0 Pro')
  );
  const [selectedDuration, setSelectedDuration] = useState<number>(
    initialDuration ?? getModelDefaultDuration(initialModel ?? 'Seedance 1.0 Pro')
  );
  const [selectedResolution, setSelectedResolution] = useState<string>(
    initialResolution ?? getModelDefaultResolution(initialModel ?? 'Seedance 1.0 Pro')
  );
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isAspectRatioDropdownOpen, setIsAspectRatioDropdownOpen] = useState(false);
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
  const [isResolutionDropdownOpen, setIsResolutionDropdownOpen] = useState(false);
  const [videoResolution, setVideoResolution] = useState<{ width: number; height: number } | null>(null);
  const [isDimmed, setIsDimmed] = useState(false);

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

  // Use connected text as prompt if connected, otherwise use local prompt state
  const effectivePrompt = connectedTextInput?.value || prompt;

  // Track previous connected text value to prevent unnecessary updates
  const prevConnectedTextValueRef = useRef<string | undefined>(undefined);
  const onOptionsChangeRef = useRef(onOptionsChange);
  
  // Update ref when onOptionsChange changes
  useEffect(() => {
    onOptionsChangeRef.current = onOptionsChange;
  }, [onOptionsChange]);

  // Update prompt when connected text changes (only when value actually changes)
  useEffect(() => {
    const currentValue = connectedTextInput?.value;
    // Only update if the value actually changed
    if (currentValue !== undefined && currentValue !== prevConnectedTextValueRef.current) {
      prevConnectedTextValueRef.current = currentValue;
      setPrompt(currentValue);
      // Only call onOptionsChange if the prompt value actually changed
      if (onOptionsChangeRef.current && currentValue !== prompt) {
        onOptionsChangeRef.current({ prompt: currentValue });
      }
    } else if (currentValue === undefined) {
      // Reset ref when disconnected
      prevConnectedTextValueRef.current = undefined;
    }
  }, [connectedTextInput?.value, prompt]); // Only depend on the actual value, not all the other options

  // Calculate aspect ratio from string (e.g., "16:9" -> 16/9)
  const getAspectRatio = (ratio: string): string => {
    const [width, height] = ratio.split(':').map(Number);
    return `${width} / ${height}`;
  };

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

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected 
    ? '#437eb5' 
    : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
  const frameBorderWidth = 2;
  const [isFrameOrderSwapped, setIsFrameOrderSwapped] = useState(false);
  const hasInitializedDefaultsRef = useRef(false);
  const previousFrameCountRef = useRef<number>(0);

  const canvasImageEntries = images
    .map((img, idx) => ({
      id: img.elementId || `canvas-image-${idx}`,
      url: img.url,
      type: img.type,
    }))
    .filter(entry => entry.url && entry.type === 'image') as Array<{ id: string; url?: string }>;

  // Detect if this is an uploaded video (from library, local storage, or media)
  // Check if model is 'Library Video' or 'Uploaded Video', or if there's no prompt and video exists (and not generating)
  const isUploadedVideo = 
    initialModel === 'Library Video' || 
    initialModel === 'Uploaded Video' ||
    (!initialPrompt && !prompt && generatedVideoUrl && !isGenerating);

  const connectedImageConnections = connections.filter(conn => conn.to === id);
  const connectedImageSources = connectedImageConnections
    .map(conn => {
      const modal = imageModalStates.find(img => img.id === conn.from);
      if (modal?.generatedImageUrl) {
        return { id: modal.id, url: modal.generatedImageUrl };
      }
      const canvasImage = canvasImageEntries.find(entry => entry.id === conn.from);
      if (canvasImage?.url) {
        return { id: canvasImage.id, url: canvasImage.url };
      }
      return null;
    })
    .filter((entry): entry is { id: string; url: string } => Boolean(entry?.url));

  const frameCount = connectedImageSources.length;
  const firstFrameUrl = connectedImageSources[0]?.url || null;
  const lastFrameUrl = connectedImageSources[1]?.url || null;
  const isFirstLastMode = frameCount >= 2 && Boolean(firstFrameUrl && lastFrameUrl);
  const hasSingleFrame = frameCount === 1 && Boolean(firstFrameUrl);
  const availableModelOptions = (isFirstLastMode || hasSingleFrame)
    ? ['Veo 3.1', 'Veo 3.1 Fast']
    : VIDEO_MODEL_OPTIONS;
  const isVeo31Model = selectedModel.toLowerCase().includes('veo 3.1');
  const displayFirstFrameUrl = isFrameOrderSwapped ? lastFrameUrl : firstFrameUrl;
  const displayLastFrameUrl = isFrameOrderSwapped ? firstFrameUrl : lastFrameUrl;

  // Auto-set model to Veo 3.1 when frames are connected
  // Only reset defaults when frames are first connected (0 -> 1 or 0 -> 2) or model changes, not when user changes aspect ratio/duration/resolution
  useEffect(() => {
    const currentFrameCount = frameCount;
    const wasDisconnected = previousFrameCountRef.current === 0;
    const isNowConnected = currentFrameCount > 0;
    const justConnected = wasDisconnected && isNowConnected;
    previousFrameCountRef.current = currentFrameCount;

    if (!(isFirstLastMode || hasSingleFrame)) {
      // Reset initialization flag when frames are disconnected
      hasInitializedDefaultsRef.current = false;
      return;
    }
    
    const isCurrentVeo31 = selectedModel.toLowerCase().includes('veo 3.1');
    const targetModel = isCurrentVeo31 ? selectedModel : 'Veo 3.1';
    const defaultAspectRatio = getModelDefaultAspectRatio(targetModel);
    const defaultDuration = getModelDefaultDuration(targetModel);
    const defaultResolution = getModelDefaultResolution(targetModel);

    // Only update model if it's not already a Veo 3.1 model
    if (selectedModel !== targetModel) {
      setSelectedModel(targetModel);
      // When model changes, also update aspect ratio, duration, and resolution to defaults
      setSelectedAspectRatio(defaultAspectRatio);
      setSelectedDuration(defaultDuration);
      setSelectedResolution(defaultResolution);
      hasInitializedDefaultsRef.current = true;
      onOptionsChange?.({
        model: targetModel,
        aspectRatio: defaultAspectRatio,
        duration: defaultDuration,
        frame: selectedFrame,
        prompt,
        resolution: defaultResolution,
      });
    } else if (!hasInitializedDefaultsRef.current || justConnected) {
      // Initialize defaults only when frames are first connected (0 -> 1 or 0 -> 2)
      // After that, let user change aspect ratio, duration, and resolution freely
      setSelectedAspectRatio(defaultAspectRatio);
      setSelectedDuration(defaultDuration);
      setSelectedResolution(defaultResolution);
      hasInitializedDefaultsRef.current = true;
      onOptionsChange?.({
        model: targetModel,
        aspectRatio: defaultAspectRatio,
        duration: defaultDuration,
        frame: selectedFrame,
        prompt,
        resolution: defaultResolution,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isFirstLastMode,
    hasSingleFrame,
    frameCount,
    selectedModel,
    onOptionsChange,
    selectedFrame,
    prompt,
    // Note: selectedAspectRatio, selectedDuration, and selectedResolution are intentionally NOT in deps
    // to allow users to change them freely without the effect resetting them
  ]);

  useEffect(() => {
    setIsFrameOrderSwapped(false);
  }, [firstFrameUrl, lastFrameUrl]);

  const handleGenerate = async () => {
    // Use effective prompt (connected text or local prompt)
    const promptToUse = effectivePrompt;
    if (onGenerate && promptToUse.trim() && !isGenerating) {
      setIsGenerating(true);
      try {
        // Pass first_frame_url and last_frame_url if 2 images are connected
        const generationFirstFrame = isFirstLastMode && isFrameOrderSwapped
          ? lastFrameUrl
          : firstFrameUrl;
        const generationLastFrame = isFirstLastMode && isFrameOrderSwapped
          ? firstFrameUrl
          : lastFrameUrl;

        await onGenerate(
          promptToUse, 
          selectedModel, 
          selectedFrame, 
          selectedAspectRatio, 
          selectedDuration, 
          selectedResolution,
          generationFirstFrame || undefined,
          generationLastFrame || undefined
        );
        // Polling handled by parent (ModalOverlays) after onGenerate resolves
      } catch (err) {
        console.error('Error generating video:', err);
        alert((err as any)?.message || 'Failed to generate video. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  // Sync initial props into internal state on hydration
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
  useEffect(() => { if (initialModel && initialModel !== selectedModel) setSelectedModel(initialModel); }, [initialModel]);
  useEffect(() => { if (initialFrame && initialFrame !== selectedFrame) setSelectedFrame(initialFrame); }, [initialFrame]);
  useEffect(() => { if (initialAspectRatio && initialAspectRatio !== selectedAspectRatio) setSelectedAspectRatio(initialAspectRatio); }, [initialAspectRatio]);
  useEffect(() => { if (typeof initialDuration === 'number' && initialDuration !== selectedDuration) setSelectedDuration(initialDuration); }, [initialDuration]);

  // Load video and get its resolution
  useEffect(() => {
    if (generatedVideoUrl) {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        setVideoResolution({ width: video.videoWidth, height: video.videoHeight });
      };
      video.onerror = () => {
        setVideoResolution(null);
      };
      video.src = generatedVideoUrl;
    } else {
      setVideoResolution(null);
    }
  }, [generatedVideoUrl]);

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
  useEffect(() => { if (initialResolution && initialResolution !== selectedResolution) setSelectedResolution(initialResolution); }, [initialResolution]);

  // Update duration, aspect ratio, and resolution when model changes
  useEffect(() => {
    const defaultDuration = getModelDefaultDuration(selectedModel);
    const defaultAspectRatio = getModelDefaultAspectRatio(selectedModel);
    const defaultResolution = getModelDefaultResolution(selectedModel);

    // Update duration if current is not valid for new model
    if (!isValidDurationForModel(selectedModel, selectedDuration)) {
      setSelectedDuration(defaultDuration);
    }

    // Update aspect ratio if current is not valid for new model
    if (!isValidAspectRatioForModel(selectedModel, selectedAspectRatio)) {
      setSelectedAspectRatio(defaultAspectRatio);
    }

    // Update resolution if current is not valid for new model
    if (!isValidResolutionForModel(selectedModel, selectedResolution)) {
      setSelectedResolution(defaultResolution);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]); // Only run when model changes


  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isControls = target.closest('.controls-overlay');
    // Allow drag even when clicking video/image content so user can still reposition after generation.
    if (onSelect && !isInput && !isButton && !isControls) {
      onSelect();
    }
    if (!isInput && !isButton && !isControls) {
      setIsDraggingContainer(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Handle drag move
  useEffect(() => {
    if (!isDraggingContainer) return;
    let rafId: number | null = null;
    let pendingEvent: MouseEvent | null = null;
    const flush = () => {
      if (!pendingEvent) return;
      const e = pendingEvent;
      pendingEvent = null;
      if (!containerRef.current || !onPositionChange) return;
      const newScreenX = e.clientX - dragOffset.x;
      const newScreenY = e.clientY - dragOffset.y;
      const newCanvasX = (newScreenX - position.x) / scale;
      const newCanvasY = (newScreenY - position.y) / scale;
      onPositionChange(newCanvasX, newCanvasY);
      lastCanvasPosRef.current = { x: newCanvasX, y: newCanvasY };
      rafId = null;
    };
    const handleMouseMove = (e: MouseEvent) => {
      pendingEvent = e;
      if (rafId == null) {
        rafId = requestAnimationFrame(flush);
      }
    };
    const handleMouseUp = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = null;
      setIsDraggingContainer(false);
      if (onPositionCommit && lastCanvasPosRef.current) {
        onPositionCommit(lastCanvasPosRef.current.x, lastCanvasPosRef.current.y);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [isDraggingContainer, dragOffset, scale, position, onPositionChange, onPositionCommit]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      data-modal-component="video"
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
      <VideoModalTooltip
        isHovered={isHovered}
        isUploadedVideo={!!isUploadedVideo}
        videoResolution={videoResolution}
        scale={scale}
      />

      <ModalActionIcons
        isSelected={!!isSelected}
        scale={scale}
        generatedUrl={generatedVideoUrl}
        onDelete={onDelete}
        onDownload={onDownload}
        onDuplicate={onDuplicate}
      />

      <div style={{ position: 'relative' }}>
        <VideoModalFrame
          id={id}
          scale={scale}
          selectedAspectRatio={selectedAspectRatio}
          isHovered={isHovered}
          isPinned={isPinned}
          isUploadedVideo={!!isUploadedVideo}
          isSelected={!!isSelected}
          isDraggingContainer={isDraggingContainer}
          generatedVideoUrl={generatedVideoUrl}
          isGenerating={isGenerating}
          frameBorderColor={frameBorderColor}
          frameBorderWidth={frameBorderWidth}
          onSelect={onSelect}
          getAspectRatio={getAspectRatio}
          onSetIsPinned={setIsPinned}
        />

        <VideoModalNodes
          id={id}
          scale={scale}
          isHovered={isHovered}
          isSelected={!!isSelected}
          globalDragActive={globalDragActive}
        />
      </div>

      <VideoModalControls
        scale={scale}
        isHovered={isHovered}
        isPinned={isPinned}
        isUploadedVideo={!!isUploadedVideo}
        isSelected={Boolean(isSelected)}
        prompt={effectivePrompt}
        isPromptDisabled={!!connectedTextInput}
        selectedModel={selectedModel}
        selectedAspectRatio={selectedAspectRatio}
        selectedFrame={selectedFrame}
        selectedDuration={selectedDuration}
        selectedResolution={selectedResolution}
        generatedVideoUrl={generatedVideoUrl}
        availableModelOptions={availableModelOptions}
        isGenerating={isGenerating}
        isModelDropdownOpen={isModelDropdownOpen}
        isAspectRatioDropdownOpen={isAspectRatioDropdownOpen}
        isDurationDropdownOpen={isDurationDropdownOpen}
        isResolutionDropdownOpen={isResolutionDropdownOpen}
        isVeo31Model={isVeo31Model}
        hasSingleFrame={hasSingleFrame}
        isFirstLastMode={isFirstLastMode}
        displayFirstFrameUrl={displayFirstFrameUrl}
        displayLastFrameUrl={displayLastFrameUrl}
        isFrameOrderSwapped={isFrameOrderSwapped}
        frameBorderColor={frameBorderColor}
        frameBorderWidth={frameBorderWidth}
        onPromptChange={(val) => {
          // Only allow prompt changes if not connected to text input
          if (!connectedTextInput) {
            setPrompt(val);
            onOptionsChange?.({ prompt: val, model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame, duration: selectedDuration, resolution: selectedResolution });
          }
        }}
        onModelChange={(model) => {
          setSelectedModel(model);
        }}
        onAspectRatioChange={(ratio) => {
          setSelectedAspectRatio(ratio);
        }}
        onDurationChange={(dur) => {
          setSelectedDuration(dur);
        }}
        onResolutionChange={(res) => {
          setSelectedResolution(res);
        }}
        onGenerate={handleGenerate}
        onSetIsHovered={setIsHovered}
        onSetIsPinned={setIsPinned}
        onSetIsModelDropdownOpen={setIsModelDropdownOpen}
        onSetIsAspectRatioDropdownOpen={setIsAspectRatioDropdownOpen}
        onSetIsDurationDropdownOpen={setIsDurationDropdownOpen}
        onSetIsResolutionDropdownOpen={setIsResolutionDropdownOpen}
        onSetIsFrameOrderSwapped={setIsFrameOrderSwapped}
        onOptionsChange={onOptionsChange}
      />
    </div>
  );
};
