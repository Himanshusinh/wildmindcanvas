'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import '@/modules/ui-global/common/canvasCaptureGuard';
import { VideoModalTooltip } from './VideoModalTooltip';
import { ModalActionIcons } from '@/modules/ui-global/common/ModalActionIcons';
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
} from '@/core/api/videoModelConfig';
import { ImageUpload } from '@/core/types/canvas';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { buildProxyMediaUrl } from '@/core/api/proxyUtils';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';

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
  onSelect?: (e?: React.MouseEvent) => void;
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
  textInputStates?: Array<{ id: string; value?: string; sentValue?: string }>;
  draggable?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onPersistVideoModalCreate?: (modal: any) => void | Promise<void>;
  isAttachedToChat?: boolean;
  selectionOrder?: number;
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
  isAttachedToChat,
  selectionOrder,
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
  draggable = true,
  onContextMenu,
  isPinned = false,
  onTogglePin,
  onPersistVideoModalCreate,
}) => {
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  // Removed local isPinned state
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  // Track initial mouse position to distinguish clicks from drags
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [selectedModel, setSelectedModel] = useState(initialModel ?? 'Seedance 1.0 Pro');
  const [selectedFrame, setSelectedFrame] = useState(initialFrame ?? 'Frame');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(
    initialAspectRatio ?? getModelDefaultAspectRatio(initialModel ?? 'Seedance 1.0 Pro')
  );
  // Prioritize initialDuration if provided (from chat instructions), otherwise use model default
  const [selectedDuration, setSelectedDuration] = useState<number>(() => {
    const modelForDefault = initialModel ?? 'Seedance 1.0 Pro';
    const defaultDuration = getModelDefaultDuration(modelForDefault);
    // If initialDuration is provided, validate it against the model (if model is known)
    if (typeof initialDuration === 'number') {
      if (initialModel && isValidDurationForModel(initialModel, initialDuration)) {
        return initialDuration;
      }
      // If model is not known yet, still use initialDuration (it will be validated later)
      if (!initialModel) {
        return initialDuration;
      }
      // If invalid for the model, use default
      return defaultDuration;
    }
    // Otherwise use default
    return defaultDuration;
  });
  // Prioritize initialResolution if provided (from chat instructions), otherwise use model default
  const [selectedResolution, setSelectedResolution] = useState<string>(() => {
    const modelForDefault = initialModel ?? 'Seedance 1.0 Pro';
    const defaultResolution = getModelDefaultResolution(modelForDefault);
    // If initialResolution is provided, validate it against the model (if model is known)
    if (initialResolution) {
      if (initialModel && isValidResolutionForModel(initialModel, initialResolution)) {
        return initialResolution;
      }
      // If model is not known yet, still use initialResolution (it will be validated later)
      if (!initialModel) {
        return initialResolution;
      }
      // If invalid for the model, use default
      return defaultResolution;
    }
    // Otherwise use default
    return defaultResolution;
  });
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

  // Track previous connected text value to prevent unnecessary updates
  const prevConnectedTextValueRef = useRef<string | undefined>(undefined);
  const lastReceivedSentValueRef = useRef<string | undefined>(undefined);
  const onOptionsChangeRef = useRef(onOptionsChange);

  // Update ref when onOptionsChange changes
  useEffect(() => {
    onOptionsChangeRef.current = onOptionsChange;
  }, [onOptionsChange]);

  // Update prompt when value changes (real-time sync)
  useEffect(() => {
    const currentTextValue = connectedTextInput?.value;
    // Only update if the value actually changed
    if (currentTextValue !== undefined && currentTextValue !== prompt) {
      setPrompt(currentTextValue);
      // Always call onOptionsChange to persist the change
      if (onOptionsChangeRef.current) {
        onOptionsChangeRef.current({ prompt: currentTextValue });
      }
    }
  }, [connectedTextInput?.value, prompt]); // Watch value, not sentValue

  // Use local prompt for display - user can edit independently after receiving sentValue
  // sentValue is only used to initially populate the prompt when arrow is clicked
  const effectivePrompt = prompt;

  // Calculate aspect ratio from string (e.g., "16:9" -> 16/9)
  const getAspectRatio = (ratio: string): string => {
    const [width, height] = ratio.split(':').map(Number);
    return `${width} / ${height}`;
  };

  // Proxy the video URL for display and metadata checks
  const proxiedVideoUrl = useMemo(() => {
    if (!generatedVideoUrl) return null;
    return buildProxyMediaUrl(generatedVideoUrl);
  }, [generatedVideoUrl]);



  const isDark = useIsDarkTheme();

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected
    ? SELECTION_COLOR
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
    ? ['Veo 3.1', 'Veo 3.1 Fast', 'Seedance 1.0 Pro', 'Seedance 1.0 Lite']
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

    const isCurrentValid = selectedModel.toLowerCase().includes('veo 3.1') ||
      selectedModel.toLowerCase().includes('seedance');
    const targetModel = isCurrentValid ? selectedModel : 'Veo 3.1';
    const defaultAspectRatio = getModelDefaultAspectRatio(targetModel);
    const defaultDuration = getModelDefaultDuration(targetModel);
    const defaultResolution = getModelDefaultResolution(targetModel);

    // Respect initialDuration if provided (from chat instructions)
    const durationToUse = (initialDuration && isValidDurationForModel(targetModel, initialDuration)) 
      ? initialDuration 
      : defaultDuration;

    // Respect initialResolution if provided (from chat instructions)
    const resolutionToUse = (initialResolution && isValidResolutionForModel(targetModel, initialResolution))
      ? initialResolution
      : defaultResolution;

    // Respect initialAspectRatio if provided (from chat instructions)
    const aspectRatioToUse = (initialAspectRatio && isValidAspectRatioForModel(targetModel, initialAspectRatio))
      ? initialAspectRatio
      : defaultAspectRatio;

    // Only update model if it's not already a Veo 3.1 model
    if (selectedModel !== targetModel) {
      setSelectedModel(targetModel);
      // When model changes, also update aspect ratio, duration, and resolution to defaults
      // BUT respect initialDuration, initialResolution, and initialAspectRatio if they were provided
      setSelectedAspectRatio(aspectRatioToUse);
      setSelectedDuration(durationToUse);
      setSelectedResolution(resolutionToUse);
      hasInitializedDefaultsRef.current = true;
      onOptionsChange?.({
        model: targetModel,
        aspectRatio: aspectRatioToUse,
        duration: durationToUse,
        frame: selectedFrame,
        prompt,
        resolution: resolutionToUse,
      });
    } else if (!hasInitializedDefaultsRef.current || justConnected) {
      // Initialize defaults only when frames are first connected (0 -> 1 or 0 -> 2)
      // After that, let user change aspect ratio, duration, and resolution freely
      // BUT respect initialDuration, initialResolution, and initialAspectRatio if they were provided
      setSelectedAspectRatio(aspectRatioToUse);
      setSelectedDuration(durationToUse);
      setSelectedResolution(resolutionToUse);
      hasInitializedDefaultsRef.current = true;
      onOptionsChange?.({
        model: targetModel,
        aspectRatio: aspectRatioToUse,
        duration: durationToUse,
        frame: selectedFrame,
        prompt,
        resolution: resolutionToUse,
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

      if (onPersistVideoModalCreate) {
        const defaultDim = 512;
        const persistData = {
          id: id,
          x: x,
          y: y,
          width: defaultDim,
          height: defaultDim,
          frameWidth: defaultDim,
          frameHeight: defaultDim,
          generatedVideoUrl: generatedVideoUrl || null,
          model: selectedModel,
          aspectRatio: selectedAspectRatio,
          prompt: promptToUse,
          duration: typeof selectedDuration === 'string' ? parseFloat(selectedDuration) : selectedDuration,
          resolution: selectedResolution
        };
        await Promise.resolve(onPersistVideoModalCreate(persistData));
      }

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

  // Listen for pin toggle keyboard shortcut (P key)
  useEffect(() => {
    const handleTogglePin = (e: Event) => {
      const ce = e as CustomEvent;
      const { selectedVideoModalIds, selectedVideoModalId } = ce.detail || {};
      // Check if this modal is selected
      const isThisSelected = (selectedVideoModalIds && Array.isArray(selectedVideoModalIds) && selectedVideoModalIds.includes(id)) ||
        (selectedVideoModalId === id);

      if (isThisSelected) {
        onTogglePin?.();
      }
    };
    window.addEventListener('canvas-toggle-pin', handleTogglePin as any);
    return () => window.removeEventListener('canvas-toggle-pin', handleTogglePin as any);
  }, [id]);
  useEffect(() => { if (initialModel && initialModel !== selectedModel) setSelectedModel(initialModel); }, [initialModel]);
  useEffect(() => { if (initialFrame && initialFrame !== selectedFrame) setSelectedFrame(initialFrame); }, [initialFrame]);
  useEffect(() => { if (initialAspectRatio && initialAspectRatio !== selectedAspectRatio) setSelectedAspectRatio(initialAspectRatio); }, [initialAspectRatio]);
  useEffect(() => { if (typeof initialDuration === 'number' && initialDuration !== selectedDuration) setSelectedDuration(initialDuration); }, [initialDuration]);

  // Load video and get its resolution (works for both generated and uploaded videos)
  useEffect(() => {
    if (proxiedVideoUrl) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous'; // Allow CORS for external videos
      video.preload = 'metadata'; // Only load metadata, not the full video
      video.onloadedmetadata = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setVideoResolution({ width: video.videoWidth, height: video.videoHeight });

          // For uploaded videos, automatically set aspect ratio from video dimensions
          if (isUploadedVideo) {
            const width = video.videoWidth;
            const height = video.videoHeight;
            const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
            const divisor = gcd(width, height);
            const aspectWidth = width / divisor;
            const aspectHeight = height / divisor;
            const calculatedAspectRatio = `${aspectWidth}:${aspectHeight}`;

            // Update aspect ratio if it's different from current
            if (calculatedAspectRatio !== selectedAspectRatio) {
              setSelectedAspectRatio(calculatedAspectRatio);
              onOptionsChange?.({
                model: selectedModel,
                aspectRatio: calculatedAspectRatio,
                frame: selectedFrame,
                prompt,
                duration: selectedDuration,
                resolution: selectedResolution
              });
            }
          }
        }
      };
      video.onerror = () => {
        setVideoResolution(null);
      };
      video.src = proxiedVideoUrl;
    } else {
      setVideoResolution(null);
    }
  }, [proxiedVideoUrl, isUploadedVideo, selectedAspectRatio, selectedModel, selectedFrame, prompt, selectedDuration, selectedResolution, onOptionsChange]);


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

    // ALWAYS prioritize initialDuration if it was provided and is valid for the model
    // This ensures chat instructions (e.g., "8 seconds") are respected
    if (initialDuration && isValidDurationForModel(selectedModel, initialDuration)) {
      // Only update if current duration doesn't match initialDuration
      if (selectedDuration !== initialDuration) {
        setSelectedDuration(initialDuration);
      }
    } else if (!isValidDurationForModel(selectedModel, selectedDuration)) {
      // If initialDuration is not provided or invalid, and current duration is invalid, use default
      setSelectedDuration(defaultDuration);
    }
    // If current duration is valid and no initialDuration was provided, keep it as is

    // ALWAYS prioritize initialAspectRatio if it was provided and is valid for the model
    // This ensures chat instructions (e.g., "16:9") are respected
    if (initialAspectRatio && isValidAspectRatioForModel(selectedModel, initialAspectRatio)) {
      // Only update if current aspect ratio doesn't match initialAspectRatio
      if (selectedAspectRatio !== initialAspectRatio) {
        setSelectedAspectRatio(initialAspectRatio);
      }
    } else if (!isValidAspectRatioForModel(selectedModel, selectedAspectRatio)) {
      // If initialAspectRatio is not provided or invalid, and current aspect ratio is invalid, use default
      setSelectedAspectRatio(defaultAspectRatio);
    }
    // If current aspect ratio is valid and no initialAspectRatio was provided, keep it as is

    // ALWAYS prioritize initialResolution if it was provided and is valid for the model
    // This ensures chat instructions (e.g., "1080p") are respected
    if (initialResolution && isValidResolutionForModel(selectedModel, initialResolution)) {
      // Only update if current resolution doesn't match initialResolution
      if (selectedResolution !== initialResolution) {
        setSelectedResolution(initialResolution);
      }
    } else if (!isValidResolutionForModel(selectedModel, selectedResolution)) {
      // If initialResolution is not provided or invalid, and current resolution is invalid, use default
      setSelectedResolution(defaultResolution);
    }
    // If current resolution is valid and no initialResolution was provided, keep it as is
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel, initialDuration, initialResolution, initialAspectRatio]); // Run when model, initialDuration, initialResolution, OR initialAspectRatio changes


  // Handle click for shift-selection (fires after mousedown + mouseup)
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isControls = target.closest('.controls-overlay');
    const isShiftClick = e.shiftKey || e.ctrlKey || e.metaKey;

    // Always stop propagation to prevent canvas from handling the click
    // This is especially important for shift-clicks to preserve selection
    e.stopPropagation();

    // For shift/ctrl/cmd clicks, ensure selection is handled on click event
    // This ensures single click (not hold) works properly
    if (onSelect && !isInput && !isButton && !isControls && isShiftClick) {
      // Check if mouse actually moved (was it a drag or a click?)
      let wasClick = true;
      if (mouseDownPosRef.current) {
        const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
        const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
        // Only handle as click if mouse didn't move much (was a click, not a drag)
        wasClick = dx <= 5 && dy <= 5;
      }
      
      if (wasClick) {
        console.log('[VideoUploadModal] handleClick triggering onSelect for shift-click', {
          id,
          shiftKey: e.shiftKey,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
        });
        onSelect(e);
        e.preventDefault();
      }
    }
    
    // Clear the mouseDownPosRef after click event has been processed
    mouseDownPosRef.current = null;
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isControls = target.closest('.controls-overlay');
    const isShiftClick = e.shiftKey || e.ctrlKey || e.metaKey;
    
    // Allow drag even when clicking video/image content so user can still reposition after generation.
    if (draggable === false && !isInput && !isButton && !isControls) {
      return;
    }

    // Store initial mouse position
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };

    // For shift-clicks, we'll handle selection on click event (after mouseup)
    // So we don't call onSelect here for shift-clicks to avoid double-triggering
    if (onSelect && !isInput && !isButton && !isControls && !isShiftClick) {
      console.log('[VideoUploadModal] handleMouseDown triggering onSelect (non-shift)', {
        id,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
      });
      onSelect(e);
    }

    // For shift/ctrl/cmd clicks, stop propagation and don't start dragging
    // But don't prevent default - we want the click event to fire
    if (isShiftClick && !isInput && !isButton && !isControls) {
      e.stopPropagation();
      // Don't prevent default - we need the click event to fire for proper selection
      return; // Don't start dragging for multi-select clicks
    }

    if (!isInput && !isButton && !isControls) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      e.preventDefault();
      e.stopPropagation();
      // Don't set isDraggingContainer immediately - wait to see if mouse moves
    }
  };

  // Handle drag move - only start dragging if mouse actually moves
  useEffect(() => {
    if (!mouseDownPosRef.current) return;
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
      if (!mouseDownPosRef.current) return;
      
      // Check if mouse has moved enough to consider it a drag (not just a click)
      const dx = Math.abs(e.clientX - mouseDownPosRef.current.x);
      const dy = Math.abs(e.clientY - mouseDownPosRef.current.y);
      
      // Only start dragging if mouse moved more than 5 pixels
      if ((dx > 5 || dy > 5) && !isDraggingContainer) {
        setIsDraggingContainer(true);
      }

      // If dragging, update position
      if (isDraggingContainer) {
      pendingEvent = e;
      if (rafId == null) {
        rafId = requestAnimationFrame(flush);
        }
      }
    };
    const handleMouseUp = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = null;
      if (isDraggingContainer && onPositionCommit && lastCanvasPosRef.current) {
        onPositionCommit(lastCanvasPosRef.current.x, lastCanvasPosRef.current.y);
      }
      setIsDraggingContainer(false);
      // Don't clear mouseDownPosRef here - we need it for the click event
      // It will be cleared in the click handler after we check it
    };
    window.addEventListener('mousemove', handleMouseMove);
    // Capture so child stopPropagation (e.g. connection nodes) can't block drag end
    window.addEventListener('mouseup', handleMouseUp, true);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp, true);
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
      onClick={handleClick}
      onContextMenu={onContextMenu}
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
      {isAttachedToChat && selectionOrder && (
        <div 
          className="absolute top-0 flex items-center justify-center bg-blue-500 text-white font-bold rounded-full shadow-lg z-[2002] border border-white/20 animate-in fade-in zoom-in duration-300"
          style={{
            left: `${-40 * scale}px`,
            top: `${-8 * scale}px`,
            width: `${32 * scale}px`,
            height: `${32 * scale}px`,
            fontSize: `${20 * scale}px`,
            minWidth: `${32 * scale}px`,
            minHeight: `${32 * scale}px`,
          }}
        >
          {selectionOrder}
        </div>
      )}
      <VideoModalTooltip
        isHovered={isHovered}
        isUploadedVideo={!!isUploadedVideo}
        videoResolution={videoResolution}
        scale={scale}
      />

      <div style={{ position: 'relative' }}>
        <ModalActionIcons
          scale={scale}
          isSelected={!!isSelected}
          isPinned={isPinned}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onDownload={generatedVideoUrl ? onDownload : undefined}
          onTogglePin={onTogglePin}
          onRegenerate={!isUploadedVideo ? handleGenerate : undefined}
        />
        <VideoModalFrame
          id={id}
          scale={scale}
          selectedAspectRatio={selectedAspectRatio}
          isHovered={isHovered}
          isPinned={isPinned}
          isUploadedVideo={!!isUploadedVideo}
          isSelected={!!isSelected}
          isDraggingContainer={isDraggingContainer}
          generatedVideoUrl={proxiedVideoUrl}
          isGenerating={isGenerating}
          frameBorderColor={frameBorderColor}
          frameBorderWidth={frameBorderWidth}
          onSelect={onSelect}
          getAspectRatio={getAspectRatio}
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
        onSetIsPinned={(val) => onTogglePin?.()}
        onSetIsModelDropdownOpen={setIsModelDropdownOpen}
        onSetIsAspectRatioDropdownOpen={setIsAspectRatioDropdownOpen}
        onSetIsDurationDropdownOpen={setIsDurationDropdownOpen}
        onSetIsResolutionDropdownOpen={setIsResolutionDropdownOpen}
        onSetIsFrameOrderSwapped={setIsFrameOrderSwapped}
        onOptionsChange={onOptionsChange}
      />

      {/* Invisible Hover Trigger Zone for Bottom Approach */}
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          width: '100%',
          height: `${60 * scale}px`,
          background: 'transparent',
          zIndex: 0,
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
};
