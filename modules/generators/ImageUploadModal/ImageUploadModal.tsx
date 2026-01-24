'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '@/modules/ui-global/common/canvasCaptureGuard';
import { ImageModalTooltip } from './ImageModalTooltip';
import { ModalActionIcons } from '@/modules/ui-global/common/ModalActionIcons';
import { ImageModalFrame } from './ImageModalFrame';
import { ImageModalNodes } from './ImageModalNodes';
import { ImageModalControls } from './ImageModalControls';
import { buildProxyResourceUrl } from '@/core/api/proxyUtils';
import { imageCache } from '@/core/api/imageCache';

interface ImageUploadModalProps {
  isOpen: boolean;
  id?: string;
  onClose: () => void;
  onGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => void;
  onImageSelect?: (file: File) => void;
  sourceImageUrl?: string | null; // Reference image URL for image-to-image generation (e.g., from scene storyboards)
  refImages?: Record<string, string>; // Global flat map of character/location names to image URLs
  generatedImageUrl?: string | null;
  generatedImageUrls?: string[]; // Array for multiple images (when imageCount > 1)
  isGenerating?: boolean; // Show loading spinner when generating
  isLocked?: boolean; // Lock generation for sequential scene generation
  lockReason?: string; // Reason why generation is locked
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
  onOptionsChange?: (opts: { model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; imageCount?: number; isGenerating?: boolean }) => void;
  initialCount?: number;
  frameWidth?: number;
  frameHeight?: number;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onImageGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, modalId?: string, imageCount?: number, sourceImageUrl?: string, width?: number, height?: number, options?: Record<string, any>) => Promise<{ url: string; images?: Array<{ url: string }> } | null>;
  onUpdateModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>;
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
  textInputStates?: Array<{ id: string; value?: string; sentValue?: string }>;
  sceneFrameModalStates?: Array<{ id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string }>;
  scriptFrameModalStates?: Array<{ id: string; pluginId: string; x: number; y: number; frameWidth: number; frameHeight: number; text: string }>;
  storyboardModalStates?: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null; characterNamesMap?: Record<number, string>; propsNamesMap?: Record<number, string>; backgroundNamesMap?: Record<number, string> }>;
  draggable?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  isAttachedToChat?: boolean;
  selectionOrder?: number;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  isAttachedToChat,
  selectionOrder,
  id,
  onClose,
  onGenerate,
  generatedImageUrl,
  generatedImageUrls,
  isGenerating: externalIsGenerating,
  isLocked = false,
  lockReason = '',
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
  onImageSelect,
  isSelected,
  initialModel,
  initialFrame,
  initialAspectRatio,
  initialPrompt,
  initialCount,
  onOptionsChange,
  onPersistImageModalCreate,
  onImageGenerate,
  onUpdateModalState,
  connections = [],
  imageModalStates = [],
  images = [],
  onPersistConnectorCreate,
  textInputStates = [],
  sceneFrameModalStates = [],
  scriptFrameModalStates = [],
  storyboardModalStates = [],
  refImages = {},  // Flat map of character/location names to image URLs
  frameWidth,
  frameHeight,
  draggable = true,
  onContextMenu,
  isPinned = false,
  onTogglePin,
}) => {
  // Fix 3: Strict Guard - Prevent rendering invalid modals
  if (!id) return null;

  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const processedImageRef = useRef<string | null>(null);
  // Removed local isPinned state to use prop
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  // Track initial mouse position to distinguish clicks from drags
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);
  // Track if resolution change was user-initiated to prevent useEffect from overriding it
  const userInitiatedResolutionChangeRef = useRef(false);
  // Debug Selection Props
  useEffect(() => {
    if (isAttachedToChat || isSelected || selectionOrder) {
      console.log('[ImageUploadModal] Selection Props Received:', {
        id,
        isAttachedToChat,
        isSelected,
        selectionOrder,
        selectionOrderType: typeof selectionOrder,
        renderBadgeCondition: !!isAttachedToChat
      });
    }
  }, [id, isAttachedToChat, isSelected, selectionOrder]);

  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [selectedModel, setSelectedModel] = useState(initialModel ?? 'Google Nano Banana');
  const [selectedFrame, setSelectedFrame] = useState(initialFrame ?? 'Frame');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState((initialAspectRatio ?? '1:1').replace(/\s+/g, ''));
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuImageIndex, setContextMenuImageIndex] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageCount, setImageCount] = useState<number>(initialCount ?? 1);
  const [selectedResolution, setSelectedResolution] = useState<string>('1024'); // Default to 1024px

  const [gptQuality, setGptQuality] = useState<'low' | 'medium' | 'high' | 'auto'>('auto');
  const [gptBackground, setGptBackground] = useState<'auto' | 'transparent' | 'opaque'>('auto');
  const [gptModeration, setGptModeration] = useState<'auto' | 'low'>('auto');

  // Check if this is a scene image and detect auto-reference
  const relatedScene = useMemo(() => {
    if (!id || !sceneFrameModalStates) return null;
    return sceneFrameModalStates.find(scene => id.includes(scene.id));
  }, [id, sceneFrameModalStates]);

  const autoReferenceInfo = useMemo(() => {
    if (!relatedScene || relatedScene.sceneNumber <= 1) return null;

    // Find previous scene
    const scriptScenes = (sceneFrameModalStates || [])
      .filter(s => s.scriptFrameId === relatedScene.scriptFrameId)
      .sort((a, b) => a.sceneNumber - b.sceneNumber);

    const previousScene = scriptScenes.find(
      s => s.sceneNumber === relatedScene.sceneNumber - 1
    );

    if (!previousScene) return null;

    // Find previous scene's image
    const previousImage = (imageModalStates || []).find(img =>
      img.id.includes(previousScene.id) && img.generatedImageUrl
    );

    if (!previousImage?.generatedImageUrl) return null;

    return {
      sceneNumber: previousScene.sceneNumber,
      imageUrl: previousImage.generatedImageUrl,
    };
  }, [relatedScene, sceneFrameModalStates, imageModalStates]);

  const [isDark, setIsDark] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isAspectRatioDropdownOpen, setIsAspectRatioDropdownOpen] = useState(false);
  const [isResolutionDropdownOpen, setIsResolutionDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null);
  const resolutionDropdownRef = useRef<HTMLDivElement>(null);
  const [imageResolution, setImageResolution] = useState<{ width: number; height: number } | null>(null);
  const [isDimmed, setIsDimmed] = useState(false);

  const setGeneratingState = (next: boolean) => {
    setIsGenerating(next);
    onOptionsChange?.({ isGenerating: next });
  };

  // Calculate aspect ratio from string (e.g., "16:9" -> 16/9)
  const getAspectRatio = (ratio: string): string => {
    const [width, height] = ratio.split(':').map(Number);
    return `${width} / ${height}`;
  };

  // Display aspect ratio: use the stored aspect ratio (initialAspectRatio) if image exists,
  // otherwise use selectedAspectRatio for the empty frame
  // selectedAspectRatio controls what aspect ratio the NEXT generation will use
  const displayAspectRatio = generatedImageUrl && initialAspectRatio
    ? initialAspectRatio
    : selectedAspectRatio;

  // Detect connected text input
  const connectedTextInput = useMemo<{ id: string; value?: string; sentValue?: string } | null>(() => {
    if (!id || !connections || connections.length === 0) return null;

    // Find connection where this modal is the target (to === id)
    const connection = connections.find(c => c.to === id);
    if (!connection) return null;

    // First try to find a matching text input state
    const textInput = (textInputStates || []).find(t => t.id === connection.from);
    if (textInput) {
      return {
        id: textInput.id,
        value: textInput.value,
        sentValue: 'sentValue' in textInput ? (textInput as any).sentValue : undefined
      };
    }

    // Next, try to find a matching scene frame and expose its content as a text input-like object
    const scene = (sceneFrameModalStates || []).find(s => s.id === connection.from);
    if (scene) {
      const sceneContent = scene.content || '';
      return {
        id: scene.id,
        value: sceneContent,
        sentValue: sceneContent
      };
    }

    return null;
  }, [id, connections, textInputStates, sceneFrameModalStates]);

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
        const opts: any = { prompt: currentTextValue };
        onOptionsChangeRef.current(opts);
      }
    }
  }, [connectedTextInput?.value, prompt]); // Watch value, not sentValue

  // Use local prompt for display - user can edit independently after receiving sentValue
  // sentValue is only used to initially populate the prompt when arrow is clicked
  const effectivePrompt = prompt;

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected ? '#4C83FF' : 'rgba(0, 0, 0, 0.3)';
  const frameBorderWidth = 2;
  const dropdownBorderColor = 'rgba(0,0,0,0.1)'; // Fixed border color for dropdowns

  // Detect if this is an uploaded image (from library, local storage, or media)
  // An image is uploaded if:
  // 1. Model is explicitly 'Library Image' or 'Uploaded Image', OR
  // 2. Model is NOT one of the generation models (meaning it's truly uploaded, not generated)
  const GENERATION_MODELS = [
    'Google Nano Banana',
    'Google nano banana pro',
    'Flux 2 pro',
    'Seedream v4',
    'Seedream 4.5',
    'Imagen 4 Ultra',
    'Imagen 4',
    'Imagen 4 Fast',
    'Flux Kontext Max',
    'Flux Kontext Pro',
    'Flux Pro 1.1 Ultra',
    'Flux Pro 1.1',
    'Upscale',
    'Remove BG'
  ];
  const isGenerationModel = initialModel && GENERATION_MODELS.includes(initialModel);
  const isSelectedModelGeneration = selectedModel && GENERATION_MODELS.includes(selectedModel);
  // An image is uploaded (Media) if:
  // 1. Model is explicitly 'Library Image' or 'Uploaded Image' (highest priority - check both initialModel and selectedModel), OR
  // 2. Model is NOT a generation model AND there's an image but no prompt (fallback for uploaded media)
  // Priority: Explicit model check first, then fallback detection
  // Priority: Explicit model check first, then fallback detection
  const PLUGIN_MODELS = ['Upscale', 'Remove BG', 'Vectorize', 'Expand', 'Erase', 'Multiangle Camera'];
  const isCompareResult = initialFrame === 'Compare' || selectedFrame === 'Compare';
  const isUploadedImage =
    initialModel === 'Library Image' ||
    initialModel === 'Uploaded Image' ||
    PLUGIN_MODELS.includes(initialModel || '') ||
    selectedModel === 'Library Image' ||
    selectedModel === 'Uploaded Image' ||
    PLUGIN_MODELS.includes(selectedModel || '') ||
    isCompareResult ||
    (!isGenerationModel && !isSelectedModelGeneration && !initialPrompt && !prompt && generatedImageUrl && !isGenerating && !externalIsGenerating);

  // Detect connected image nodes (for image-to-image generation)
  const canvasImageEntries = images
    .map((img, idx) => ({
      id: img.elementId || `canvas-image-${idx}`,
      url: img.url,
      type: img.type,
    }))
    .filter(entry => entry.url && entry.type === 'image') as Array<{ id: string; url?: string }>;

  const connectedImageConnections = connections.filter(conn => conn.to === id);
  const connectedImageSource = connectedImageConnections
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
    .find((entry): entry is { id: string; url: string } => Boolean(entry?.url));

  const hasConnectedImage = Boolean(connectedImageSource?.url);
  const sourceImageUrl = connectedImageSource?.url || null;

  // Check if an image is already generated in this modal
  const hasExistingImage = Boolean(generatedImageUrl);

  // Filter models: 
  // - If image is connected from another modal OR an image is already generated in this modal, only show image-to-image models
  // - Otherwise, show all models
  const IMAGE_TO_IMAGE_MODELS = [
    'Google Nano Banana',
    'Google nano banana pro',
    'Flux 2 pro',
    'Flux Kontext Max',
    'Flux Kontext Pro',
    'Seedream v4 4K',
    'Seedream 4.5',
    'ChatGPT 1.5',
    // 'Runway Gen4 Image',
    // 'Runway Gen4 Image Turbo'
  ];
  const ALL_MODELS = [
    'Google Nano Banana',
    'Google nano banana pro',
    'Flux 2 pro',
    'Seedream v4',
    'Seedream 4.5',
    'Imagen 4 Ultra',
    'Imagen 4',
    'Imagen 4 Fast',
    'Flux Kontext Max',
    'Flux Kontext Pro',
    'Flux Pro 1.1 Ultra',
    'Flux Pro 1.1',
    'ChatGPT 1.5',
    // 'Seedream v4 4K',
    // 'Runway Gen4 Image',
    // 'Runway Gen4 Image Turbo',
    'Z Image Turbo',
    'P-Image'
  ];
  const availableModels = (hasConnectedImage || hasExistingImage) ? IMAGE_TO_IMAGE_MODELS : ALL_MODELS;

  // Determine source image URL: 
  // Priority 1: If this frame has its own generated image, use that (for modifying this frame's image)
  // Priority 2: If this frame is empty but has a connected image source, use that (for image-to-image from external source)
  // Priority 3: No source (text-to-image)
  const finalSourceImageUrl = hasExistingImage ? generatedImageUrl : (sourceImageUrl || null);

  console.log('[ImageUploadModal] 🔍 sourceImageUrl prop check:', {
    modalId: id,
    hasSourceImageUrlProp: !!sourceImageUrl,
    sourceImageUrlProp: sourceImageUrl || 'NONE',
    sourceImageUrlPreview: sourceImageUrl ? sourceImageUrl.substring(0, 100) + '...' : 'NONE',
    hasExistingImage,
    generatedImageUrl: generatedImageUrl || 'NONE',
    finalSourceImageUrl: finalSourceImageUrl || 'NONE',
    finalSourceImageUrlPreview: finalSourceImageUrl ? finalSourceImageUrl.substring(0, 100) + '...' : 'NONE',
  });

  // Track if we've already initialized the model for image-to-image mode
  const hasInitializedImageToImageModel = useRef(false);

  // Auto-set model to Google Nano Banana when FIRST entering image-to-image mode
  // BUT NOT if this is an uploaded image (Media) - uploaded images should keep their model
  // AND NOT if the user has already selected a different model
  useEffect(() => {
    // Don't auto-set model for uploaded images (Media)
    if (isUploadedImage) return;

    // Only auto-set on FIRST entry to image-to-image mode, not on every change
    if ((hasConnectedImage || hasExistingImage) && !hasInitializedImageToImageModel.current) {
      // Check if current model is NOT in the image-to-image models list
      // If it's not, set to default. If it is, keep it.
      if (!IMAGE_TO_IMAGE_MODELS.includes(selectedModel)) {
        setSelectedModel('Google Nano Banana');
        onOptionsChange?.({
          model: 'Google Nano Banana',
          aspectRatio: selectedAspectRatio,
          frame: selectedFrame,
          prompt,
          frameWidth: 600,
          frameHeight: 400,
        });
      }
      hasInitializedImageToImageModel.current = true;
    } else if (!hasConnectedImage && !hasExistingImage) {
      // Reset the flag when exiting image-to-image mode
      hasInitializedImageToImageModel.current = false;
    }
  }, [hasConnectedImage, hasExistingImage, selectedModel, selectedAspectRatio, selectedFrame, prompt, onOptionsChange, isUploadedImage, IMAGE_TO_IMAGE_MODELS]);

  const handleGenerate = async (countOverride?: number) => {
    // Use effective prompt (connected text or local prompt)
    const promptToUse = effectivePrompt;
    if (promptToUse.trim() && !isGenerating && onPersistImageModalCreate && onImageGenerate) {
      // CRITICAL: Only set current frame to generating if we're NOT creating a new frame
      // If hasExistingImage is true, we'll create a new frame and that frame will be marked as generating
      // The current frame should remain unchanged
      const willCreateNewFrame = hasExistingImage && generatedImageUrl;
      let didSetCurrentFrameGenerating = false;
      if (!willCreateNewFrame) {
        setGeneratingState(true);
        didSetCurrentFrameGenerating = true;
      }

      console.log('[ImageUploadModal] 🎯 Generation state management:', {
        hasExistingImage,
        generatedImageUrl: generatedImageUrl ? generatedImageUrl.substring(0, 100) + '...' : 'NONE',
        willCreateNewFrame,
        didSetCurrentFrameGenerating,
      });

      try {
        // Calculate width and height based on resolution and aspect ratio
        let width: number | undefined;
        let height: number | undefined;

        const modelLower = selectedModel.toLowerCase();
        const isZTurbo = modelLower.includes('z image turbo') || modelLower.includes('z-image-turbo');
        const isPImage = modelLower.includes('p-image') && !modelLower.includes('p-image-edit');
        const isFluxUltra = modelLower.includes('flux pro 1.1 ultra');

        if (selectedResolution) {
          const [wRatio, hRatio] = selectedAspectRatio.split(':').map(Number);
          const ratio = wRatio / hRatio;
          let baseSize = 1024; // Default 1K

          // Z Image Turbo: width/height 64-1440, divisible by 16
          if (isZTurbo) {
            // For Z Image Turbo, resolution value is the base size (512, 768, 1024, 1280, 1440)
            baseSize = Number(selectedResolution) || 1024;

            // Round to nearest multiple of 16
            const roundTo16 = (val: number) => Math.round(val / 16) * 16;

            if (ratio >= 1) {
              width = roundTo16(Math.round(baseSize * ratio));
              height = roundTo16(baseSize);
            } else {
              width = roundTo16(baseSize);
              height = roundTo16(Math.round(baseSize / ratio));
            }

            // Clamp to 64-1440 (per backend implementation)
            width = Math.max(64, Math.min(1440, width));
            height = Math.max(64, Math.min(1440, height));
          }
          // P-Image: width/height 256-1440, divisible by 16
          else if (isPImage) {
            // For P-Image, resolution value is the base size (512, 768, 1024, 1280, 1440)
            baseSize = Number(selectedResolution) || 1024;

            // Round to nearest multiple of 16
            const roundTo16 = (val: number) => Math.round(val / 16) * 16;

            if (ratio >= 1) {
              width = roundTo16(Math.round(baseSize * ratio));
              height = roundTo16(baseSize);
            } else {
              width = roundTo16(baseSize);
              height = roundTo16(Math.round(baseSize / ratio));
            }

            // Clamp to 256-1440
            width = Math.max(256, Math.min(1440, width));
            height = Math.max(256, Math.min(1440, height));
          }
          // Flux Pro 1.1 Ultra, Flux 2 Pro, Google nano banana pro & Seedream models: Strict Fit Inside Logic
          else if (isFluxUltra || modelLower.includes('flux 2 pro') || modelLower.includes('nano banana pro') || modelLower.includes('seedream')) {
            if (selectedResolution === '4K') baseSize = 4096;
            else if (selectedResolution === '2K') baseSize = 2048;
            else baseSize = 1024; // Default 1K

            if (ratio >= 1) {
              // Landscape/Square: Width is max (baseSize), Height scales down
              width = baseSize;
              height = Math.round(baseSize / ratio);
            } else {
              // Portrait: Height is max (baseSize), Width scales down
              width = Math.round(baseSize * ratio);
              height = baseSize;
            }
          }
          // Other models
          else {
            if (selectedResolution === '2K') baseSize = 2048;
            if (selectedResolution === '4K') baseSize = 4096;

            if (ratio >= 1) {
              // Landscape or square
              width = Math.round(baseSize * ratio);
              height = baseSize;
            } else {
              // Portrait
              width = baseSize;
              height = Math.round(baseSize / ratio);
            }

            // Special case for Flux 2 Pro 1024x2048
            if (selectedResolution === '1024x2048') {
              width = 1024;
              height = 2048;
            }
          }
        }

        // If a stitched reference is provided via props, force using ONLY that URL
        const stitchedOnly = typeof sourceImageUrl === 'string' && sourceImageUrl.includes('reference-stitched');

        // Automatically collect images from connected Storyboard using @mentions
        const referenceImageUrls: string[] = [];

        console.log('[ImageUploadModal] Starting automatic image collection:', {
          hasConnectedTextInput: !!connectedTextInput,
          connectedTextInputId: connectedTextInput?.id,
          connectedTextInputValue: connectedTextInput?.value,
          sceneFrameCount: sceneFrameModalStates.length,
          scriptFrameCount: scriptFrameModalStates?.length,
          storyboardCount: storyboardModalStates.length,
        });

        // Try to find storyboard through different paths
        let sourceStoryboard: typeof storyboardModalStates[0] | undefined;
        let textToAnalyze: string | undefined;

        // Path 1: If we have a connected scene frame, trace back to Storyboard
        if (connectedTextInput && sceneFrameModalStates.length > 0) {
          const connectedScene = sceneFrameModalStates.find(s => s.id === connectedTextInput.id);
          if (connectedScene && scriptFrameModalStates && scriptFrameModalStates.length > 0) {
            const parentScript = scriptFrameModalStates.find(s => s.id === connectedScene.scriptFrameId);
            if (parentScript && storyboardModalStates.length > 0) {
              sourceStoryboard = storyboardModalStates.find(sb => sb.id === parentScript.pluginId);
              textToAnalyze = connectedScene.content;
            }
          }
        }

        // Path 2: If connected text input is connected directly to a storyboard
        if (!sourceStoryboard && connectedTextInput) {
          const textToStoryboardConnections = connections.filter(
            c => (c.from === connectedTextInput.id && storyboardModalStates.some(sb => sb.id === c.to)) ||
              (c.to === connectedTextInput.id && storyboardModalStates.some(sb => sb.id === c.from))
          );
          if (textToStoryboardConnections.length > 0) {
            const storyboardId = textToStoryboardConnections[0].from === connectedTextInput.id
              ? textToStoryboardConnections[0].to
              : textToStoryboardConnections[0].from;
            sourceStoryboard = storyboardModalStates.find(sb => sb.id === storyboardId);
            textToAnalyze = connectedTextInput.value;
          }
        }

        if (!stitchedOnly && sourceStoryboard) {
          console.log('[ImageUploadModal] ✅ Found source Storyboard:', sourceStoryboard.id);

          // Get connected images from storyboard by anchor type
          const storyboardConnections = connections.filter(c => c.from === sourceStoryboard!.id);
          const characterConnections = storyboardConnections.filter(c => (c as any).toAnchor === 'receive-character');
          const backgroundConnections = storyboardConnections.filter(c => (c as any).toAnchor === 'receive-background');
          const propsConnections = storyboardConnections.filter(c => (c as any).toAnchor === 'receive-props');

          // Collect images by type
          const connectedCharacterImages: string[] = [];
          const connectedBackgroundImages: string[] = [];
          const connectedPropsImages: string[] = [];

          characterConnections.forEach(conn => {
            const connectedImage = imageModalStates.find(img => img.id === conn.to && img.generatedImageUrl);
            if (connectedImage?.generatedImageUrl) {
              connectedCharacterImages.push(connectedImage.generatedImageUrl);
            } else {
              const mediaImage = images.find(img => img.elementId === conn.to);
              if (mediaImage && mediaImage.url) {
                connectedCharacterImages.push(mediaImage.url);
              }
            }
          });

          backgroundConnections.forEach(conn => {
            const connectedImage = imageModalStates.find(img => img.id === conn.to && img.generatedImageUrl);
            if (connectedImage?.generatedImageUrl) {
              connectedBackgroundImages.push(connectedImage.generatedImageUrl);
            } else {
              const mediaImage = images.find(img => img.elementId === conn.to);
              if (mediaImage && mediaImage.url) {
                connectedBackgroundImages.push(mediaImage.url);
              }
            }
          });

          propsConnections.forEach(conn => {
            const connectedImage = imageModalStates.find(img => img.id === conn.to && img.generatedImageUrl);
            if (connectedImage?.generatedImageUrl) {
              connectedPropsImages.push(connectedImage.generatedImageUrl);
            } else {
              const mediaImage = images.find(img => img.elementId === conn.to);
              if (mediaImage && mediaImage.url) {
                connectedPropsImages.push(mediaImage.url);
              }
            }
          });

          // Resolve @mentions from text if available
          if (textToAnalyze) {
            const { getReferenceImagesForText } = await import('@/modules/plugins/StoryboardPluginModal/mentionUtils');
            const mentionImages = getReferenceImagesForText({
              text: textToAnalyze,
              characterNamesMap: sourceStoryboard.characterNamesMap || {},
              backgroundNamesMap: sourceStoryboard.backgroundNamesMap || {},
              propsNamesMap: sourceStoryboard.propsNamesMap || {},
              connectedCharacterImages,
              connectedBackgroundImages,
              connectedPropsImages,
            });
            referenceImageUrls.push(...mentionImages);
            console.log('[ImageUploadModal] Resolved @mentions:', {
              text: textToAnalyze,
              mentionCount: mentionImages.length,
              imageUrls: mentionImages
            });
          }

          // If no @mentions found, include all connected images (backward compatibility)
          if (referenceImageUrls.length === 0) {
            referenceImageUrls.push(...connectedCharacterImages);
            referenceImageUrls.push(...connectedBackgroundImages);
            referenceImageUrls.push(...connectedPropsImages);
          }

          console.log('[ImageUploadModal] Collected reference images:', {
            storyboardId: sourceStoryboard.id,
            imageCount: referenceImageUrls.length,
            imageUrls: referenceImageUrls
          });
        } else if (!stitchedOnly) {
          console.log('[ImageUploadModal] ❌ No Storyboard found');
        }

        if (!stitchedOnly) {
          console.log('[ImageUploadModal] Final reference images:', referenceImageUrls);
        }

        // Calculate frame dimensions for positioning
        const [w, h] = selectedAspectRatio.split(':').map(Number);
        const frameWidth = 600;
        const ar = w && h ? (w / h) : 1;
        const rawHeight = ar ? Math.round(frameWidth / ar) : 600;
        const frameHeight = Math.max(400, rawHeight);

        // Logic for frame creation:
        // - If image is already generated in this modal (hasExistingImage), create a NEW frame next to it
        // - If media image is connected but modal is empty, generate in the CURRENT frame
        // - Otherwise, use the current frame
        const modalIds: string[] = [];
        const modalPositions = new Map<string, { x: number; y: number }>(); // Track modal positions for connection creation
        let targetModalId: string;
        let targetX = x;
        let targetY = y;

        // Only create a new frame if there's already a generated image in this modal
        // If a media image is connected but modal is empty, generate in the current modal
        if (hasExistingImage && generatedImageUrl) {
          // Create a new frame next to the current one (to the right)
          const offsetX = frameWidth + 50;
          targetX = x + offsetX;
          targetY = y;
          targetModalId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const newModal = {
            id: targetModalId,
            x: targetX,
            y: targetY,
            width: frameWidth,
            height: frameHeight,
            generatedImageUrl: null as string | null,
            isGenerating: true,
            frameWidth,
            frameHeight,
            model: selectedModel,
            frame: selectedFrame,
            aspectRatio: selectedAspectRatio,
            prompt: promptToUse,
            imageCount: 1,
          };
          await Promise.resolve(onPersistImageModalCreate(newModal));
          modalIds.push(targetModalId);
          modalPositions.set(targetModalId, { x: targetX, y: targetY });
        } else {
          // Use current frame
          targetModalId = id || `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Create current modal if it doesn't exist
          if (!id && onPersistImageModalCreate) {
            const currentModal = {
              id: targetModalId,
              x: targetX,
              y: targetY,
              width: frameWidth,
              height: frameHeight,
              generatedImageUrl: null as string | null,
              isGenerating: true,
              frameWidth,
              frameHeight,
              model: selectedModel,
              frame: selectedFrame,
              aspectRatio: selectedAspectRatio,
              prompt,
              imageCount: 1,
            };
            await Promise.resolve(onPersistImageModalCreate(currentModal));
          }
          modalIds.push(targetModalId);
          modalPositions.set(targetModalId, { x: targetX, y: targetY });
        }

        // Create additional frames if imageCount > 1
        for (let i = 1; i < imageCount; i++) {
          const offsetX = i * (frameWidth + 50);
          const newX = targetX + offsetX;
          const newY = targetY;

          const newModalId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`;
          const newModal = {
            id: newModalId,
            x: newX,
            y: newY,
            width: frameWidth,
            height: frameHeight,
            generatedImageUrl: null as string | null,
            isGenerating: true, // Mark as generating to show loading
            frameWidth,
            frameHeight,
            model: selectedModel,
            frame: selectedFrame,
            aspectRatio: selectedAspectRatio,
            prompt: promptToUse,
            imageCount: 1,
          };

          await Promise.resolve(onPersistImageModalCreate(newModal));
          modalIds.push(newModalId);
          modalPositions.set(newModalId, { x: newX, y: newY });
        }

        // Automatically create connections to new frames immediately after creation (before image generation)
        const isImageToImageMode = Boolean(finalSourceImageUrl);
        if (onPersistConnectorCreate && modalIds.length > 0) {
          // Case 1: Connect from connected image source to new frames (image-to-image from external source)
          // Only do this if we're NOT modifying an existing image in the current modal
          // (If we're modifying an existing image, Case 2 will handle connecting from current modal)
          if (isImageToImageMode && connectedImageSource?.id && !hasExistingImage) {
            // Get source modal position for calculating connection start point
            const sourceModal = imageModalStates.find(m => m.id === connectedImageSource.id);
            const sourceX = sourceModal?.x ?? x;
            const sourceY = sourceModal?.y ?? y;

            // Create connections from source image node to each new frame
            for (const targetModalId of modalIds) {
              // Get target modal position - check our tracked positions first, then imageModalStates, then fallback
              const trackedPos = modalPositions.get(targetModalId);
              const targetModal = trackedPos
                ? { x: trackedPos.x, y: trackedPos.y }
                : imageModalStates.find(m => m.id === targetModalId) ||
                (targetModalId === id ? { x, y } : null);
              const targetPosX = trackedPos?.x ?? targetModal?.x ?? x;
              const targetPosY = trackedPos?.y ?? targetModal?.y ?? y;

              // Calculate node positions (right side of source, left side of target)
              // Frame width is 600, nodes are typically at the edges
              const fromX = sourceX + 600; // Right side of source frame
              const fromY = sourceY + (frameHeight / 2); // Middle of source frame
              const toX = targetPosX; // Left side of target frame
              const toY = targetPosY + (frameHeight / 2); // Middle of target frame

              // Check if connection already exists
              const connectionExists = connections.some(
                conn => conn.from === connectedImageSource.id && conn.to === targetModalId
              );

              if (!connectionExists) {
                const newConnector = {
                  from: connectedImageSource.id,
                  to: targetModalId,
                  color: '#4C83FF',
                  fromX,
                  fromY,
                  toX,
                  toY,
                  fromAnchor: 'send',
                  toAnchor: 'receive',
                };

                try {
                  await Promise.resolve(onPersistConnectorCreate(newConnector));
                  console.log(`[Image-to-Image] Auto-created connection from ${connectedImageSource.id} to ${targetModalId}`);
                } catch (err) {
                  console.error(`[Image-to-Image] Failed to create connection from ${connectedImageSource.id} to ${targetModalId}:`, err);
                }
              }
            }
          }

          // Case 2: Connect from current frame to new frames (when generating creates a new frame next to existing one)
          if (id && generatedImageUrl && hasExistingImage) {
            // Current frame has an image and we created new frames, so connect from current to new
            for (const targetModalId of modalIds) {
              // Get target modal position - check our tracked positions first, then imageModalStates, then fallback
              const trackedPos = modalPositions.get(targetModalId);
              const targetModal = trackedPos
                ? { x: trackedPos.x, y: trackedPos.y }
                : imageModalStates.find(m => m.id === targetModalId);
              const targetPosX = trackedPos?.x ?? targetModal?.x ?? x;
              const targetPosY = trackedPos?.y ?? targetModal?.y ?? y;

              // Calculate node positions (right side of current frame, left side of target)
              const fromX = x + 600; // Right side of current frame
              const fromY = y + (frameHeight / 2); // Middle of current frame
              const toX = targetPosX; // Left side of target frame
              const toY = targetPosY + (frameHeight / 2); // Middle of target frame

              // Check if connection already exists
              const connectionExists = connections.some(
                conn => conn.from === id && conn.to === targetModalId
              );

              if (!connectionExists) {
                const newConnector = {
                  from: id,
                  to: targetModalId,
                  color: '#4C83FF',
                  fromX,
                  fromY,
                  toX,
                  toY,
                  fromAnchor: 'send',
                  toAnchor: 'receive',
                };

                try {
                  await Promise.resolve(onPersistConnectorCreate(newConnector));
                  console.log(`[Image Generation] Auto-created connection from current frame ${id} to new frame ${targetModalId}`);
                } catch (err) {
                  console.error(`[Image Generation] Failed to create connection from ${id} to ${targetModalId}:`, err);
                }
              }
            }
          }
        }

        // CRITICAL: For SCENE-based generation, look up reference images from refImages using character/location names
        // This bypasses the need to store sourceImageUrl in modal state
        if (refImages && Object.keys(refImages).length > 0) {
          // Check if this modal has scene metadata (from storyboard generation)
          const modalData = imageModalStates.find(m => m.id === id || m.id === targetModalId);
          const sceneMetadata = (modalData as any)?.storyboardMetadata;

          if (sceneMetadata) {
            console.log('[ImageUploadModal] 🎬 Scene generation detected, looking up reference images:', {
              sceneMetadata,
              availableRefImages: Object.keys(refImages),
            });

            // Look up character images
            if (sceneMetadata.character) {
              const characterNames = sceneMetadata.character.split(',').map((name: string) => name.trim().toLowerCase());
              characterNames.forEach((charName: string) => {
                if (refImages[charName]) {
                  if (!referenceImageUrls.includes(refImages[charName])) {
                    referenceImageUrls.push(refImages[charName]);
                    console.log(`[ImageUploadModal] ✅ Found reference image for character "${charName}"`);
                  }
                }
              });
            }

            // Look up background images
            if (sceneMetadata.background) {
              const bgName = sceneMetadata.background.toLowerCase().trim();
              if (refImages[bgName]) {
                if (!referenceImageUrls.includes(refImages[bgName])) {
                  referenceImageUrls.push(refImages[bgName]);
                  console.log(`[ImageUploadModal] ✅ Found reference image for background "${bgName}"`);
                }
              }
            }

            console.log(`[ImageUploadModal] 🎯 Total reference images from scene metadata: ${referenceImageUrls.length}`);
          }
        }

        // Determine final reference: prefer stitched reference exclusively when present
        let allReferenceImageUrls: string[] = [];

        console.log('[Image Generation] 🔍 STEP 1: Before building allReferenceImageUrls:', {
          stitchedOnly,
          finalSourceImageUrl: finalSourceImageUrl ? finalSourceImageUrl.substring(0, 100) + '...' : 'NULL/UNDEFINED',
          referenceImageUrls: referenceImageUrls.map(url => url.substring(0, 100) + '...'),
          referenceImageUrlsLength: referenceImageUrls.length,
        });

        if (stitchedOnly && finalSourceImageUrl) {
          allReferenceImageUrls = [finalSourceImageUrl];
          console.log('[Image Generation] 🔍 STEP 2a: Using stitched-only path');
        } else {
          allReferenceImageUrls = [...referenceImageUrls];
          console.log('[Image Generation] 🔍 STEP 2b: Copied referenceImageUrls, length:', allReferenceImageUrls.length);

          if (finalSourceImageUrl && !allReferenceImageUrls.includes(finalSourceImageUrl)) {
            console.log('[Image Generation] 🔍 STEP 3: Adding finalSourceImageUrl to allReferenceImageUrls');
            allReferenceImageUrls.push(finalSourceImageUrl);
          } else {
            console.log('[Image Generation] 🔍 STEP 3: NOT adding finalSourceImageUrl because:', {
              hasFinalSourceImageUrl: !!finalSourceImageUrl,
              alreadyInArray: allReferenceImageUrls.includes(finalSourceImageUrl || ''),
            });
          }
        }

        console.log('[Image Generation] 🔍 STEP 4: After building allReferenceImageUrls:', {
          allReferenceImageUrls: allReferenceImageUrls.map(url => url.substring(0, 100) + '...'),
          allReferenceImageUrlsLength: allReferenceImageUrls.length,
        });

        // CRITICAL: When creating a new frame for image-to-image (hasExistingImage is true),
        // we MUST pass the source image URL explicitly because the new frame doesn't have it yet
        // The finalSourceImageUrl contains the current frame's generatedImageUrl which should be used as the source
        const finalSourceImageUrlParam = stitchedOnly && finalSourceImageUrl
          ? finalSourceImageUrl
          : (allReferenceImageUrls.length > 0 ? allReferenceImageUrls.join(',') : undefined);

        console.log('[Image Generation] 🎯 Source image determination:', {
          hasExistingImage,
          generatedImageUrl: generatedImageUrl ? generatedImageUrl.substring(0, 100) + '...' : 'NONE',
          finalSourceImageUrl: finalSourceImageUrl ? finalSourceImageUrl.substring(0, 100) + '...' : 'NONE',
          allReferenceImageUrls: allReferenceImageUrls.map(url => url.substring(0, 100) + '...'),
          finalSourceImageUrlParam: finalSourceImageUrlParam ? finalSourceImageUrlParam.substring(0, 100) + '...' : 'NONE',
          willCreateNewFrame: hasExistingImage && generatedImageUrl,
        });

        // Now make ONE API call with the full imageCount
        // The backend will generate all images in parallel, ensuring they are different
        console.log(`[Image Generation] Starting generation of ${typeof countOverride === 'number' ? countOverride : imageCount} images${isImageToImageMode ? ' (image-to-image mode)' : ''}`);
        console.log(`[Image Generation] 🔍 About to call onImageGenerate with:`, {
          targetModalId,
          referenceImageUrls: allReferenceImageUrls,
          finalSourceImageUrl,
          finalSourceImageUrlParam,
          hasExistingImage,
          generatedImageUrl: generatedImageUrl ? generatedImageUrl.substring(0, 100) + '...' : 'NONE',
          willUseImageToImage: !!finalSourceImageUrlParam,
          imageCount,
          width,
          height,
        });

        // Use countOverride if provided, otherwise default to imageCount
        const effectiveImageCount = typeof countOverride === 'number' ? countOverride : imageCount;

        console.log('[Image Generation] 🚨 CRITICAL CHECK - What is being passed to API:', {
          'finalSourceImageUrlParam is': finalSourceImageUrlParam || 'UNDEFINED/NULL',
          'finalSourceImageUrlParam type': typeof finalSourceImageUrlParam,
          'finalSourceImageUrlParam truthy': !!finalSourceImageUrlParam,
          'finalSourceImageUrlParam length': finalSourceImageUrlParam?.length || 0,
          'This will be': finalSourceImageUrlParam ? 'IMAGE-TO-IMAGE' : 'TEXT-TO-IMAGE',
          'imageCount': effectiveImageCount
        });

        // Collect model-specific options
        const generationOptions: Record<string, any> = { style: undefined };

        // Add ChatGPT 1.5 specific options
        if (modelLower.includes('chatgpt 1.5') || modelLower.includes('chat-gpt-1.5')) {
          generationOptions.quality = gptQuality;
          generationOptions.background = gptBackground;
          generationOptions.moderation = gptModeration;
        }

        const permittedRatios = ['21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16', 'auto'];

        // Helper to find closest permitted aspect ratio
        const getClosestAspectRatio = (currentRatio: string): string => {
          if (permittedRatios.includes(currentRatio)) return currentRatio;

          const [w, h] = currentRatio.split(':').map(Number);
          if (!w || !h) return '1:1'; // Fallback for invalid format

          const targetVal = w / h;
          let bestRatio = '1:1';
          let minDiff = Number.MAX_VALUE;

          permittedRatios.forEach(r => {
            if (r === 'auto') return;
            const [rw, rh] = r.split(':').map(Number);
            const val = rw / rh;
            const diff = Math.abs(targetVal - val);
            if (diff < minDiff) {
              minDiff = diff;
              bestRatio = r;
            }
          });
          return bestRatio;
        };

        const finalAspectRatio = getClosestAspectRatio(selectedAspectRatio);

        const result = await onImageGenerate(
          promptToUse,
          getFinalModelName(),
          selectedFrame,
          finalAspectRatio,
          targetModalId,
          typeof countOverride === 'number' ? countOverride : imageCount,
          finalSourceImageUrlParam,
          width,
          height,
          generationOptions
        );
        console.log(`[Image Generation] Completed generation, received ${result?.images?.length || 0} images`);

        // Extract all generated image URLs
        const imageUrls: string[] = [];
        if (result) {
          console.log(`[Image Generation] Result structure:`, {
            hasImages: !!result.images,
            imagesLength: result.images?.length || 0,
            hasUrl: !!result.url,
            fullResult: result
          });

          if (result.images && Array.isArray(result.images) && result.images.length > 0) {
            // Multiple images returned
            imageUrls.push(...result.images.map(img => img.url).filter(url => url));
            console.log(`[Image Generation] Extracted ${imageUrls.length} images from images array`);
          } else if (result.url) {
            // Single image returned (fallback)
            imageUrls.push(result.url);
            console.log(`[Image Generation] Using single URL fallback`);
          }
        } else {
          console.warn(`[Image Generation] No result returned from API`);
        }

        console.log(`[Image Generation] Final extracted ${imageUrls.length} image URLs (requested ${effectiveImageCount})`);

        if (imageUrls.length < effectiveImageCount) {
          console.warn(`[Image Generation] WARNING: Requested ${effectiveImageCount} images but only got ${imageUrls.length}`);
        }

        // Update all frames with their respective images
        // Only show images when all are ready
        for (let i = 0; i < modalIds.length && i < imageUrls.length; i++) {
          if (onUpdateModalState) {
            // Recalculate frame dimensions based on selected aspect ratio to ensure correct frame size
            // This ensures the frame maintains the correct aspect ratio (e.g., 1:1 stays 1:1)
            const [w, h] = selectedAspectRatio.split(':').map(Number);
            const calculatedFrameWidth = 600;
            const ar = w && h ? (w / h) : 1;
            const rawHeight = ar ? Math.round(calculatedFrameWidth / ar) : 600;
            const calculatedFrameHeight = Math.max(400, rawHeight);

            onUpdateModalState(modalIds[i], {
              generatedImageUrl: imageUrls[i],
              isGenerating: false, // Mark as completed
              model: selectedModel,
              frame: selectedFrame,
              aspectRatio: selectedAspectRatio, // Preserve the selected aspect ratio
              prompt,
              frameWidth: calculatedFrameWidth, // Use calculated dimensions based on aspect ratio
              frameHeight: calculatedFrameHeight, // Use calculated dimensions based on aspect ratio
            } as any);
          }
        }
      } catch (error) {
        console.error('Error generating images:', error);
        alert('Failed to generate images. Please try again.');
      } finally {
        // Only reset generating state if we set it to true for the current frame
        if (didSetCurrentFrameGenerating) {
          setGeneratingState(false);
        }
      }
    }
  };

  // Auto-start generation if requested from parent (e.g. chat intent)
  useEffect(() => {
    // Only auto-start if:
    // 1. External prop says we should be generating
    // 2. We haven't generated an image yet
    // 3. We aren't currently generating (local state)
    // 4. It's not an uploaded image (safety check)
    if (externalIsGenerating && !generatedImageUrl && !isGenerating && !isUploadedImage) {
      console.log('[ImageUploadModal] 🚀 Auto-starting generation based on externalIsGenerating prop');
      // Small timeout to ensure everything is initialized
      const timer = setTimeout(() => {
        handleGenerate();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [externalIsGenerating, generatedImageUrl, isGenerating, isUploadedImage]);

  useEffect(() => {
    if (typeof initialPrompt === 'string' && initialPrompt !== prompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (typeof initialCount === 'number' && initialCount !== imageCount) setImageCount(initialCount);
  }, [initialCount]);

  // Listen for dimming events
  useEffect(() => {
    const handleDim = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.frameId === id) {
        setIsDimmed(Boolean(ce.detail?.dimmed));
      }
    };
    window.addEventListener('canvas-frame-dim', handleDim as any);
    return () => window.removeEventListener('canvas-frame-dim', handleDim as any);
  }, [id]);

  // Listen for pin toggle keyboard shortcut (P key)
  useEffect(() => {
    const handleTogglePin = (e: Event) => {
      const ce = e as CustomEvent;
      const { selectedImageModalIds, selectedImageModalId } = ce.detail || {};
      // Check if this modal is selected
      const isThisSelected = (selectedImageModalIds && Array.isArray(selectedImageModalIds) && selectedImageModalIds.includes(id)) ||
        (selectedImageModalId === id);

      if (isThisSelected) {
        // Toggle pin when custom event received for this selected modal
        onTogglePin?.();
      }
    };
    window.addEventListener('canvas-toggle-pin', handleTogglePin as any);
    return () => window.removeEventListener('canvas-toggle-pin', handleTogglePin as any);
  }, [id]);
  // Helper to parse model string into base model and resolution
  const parseModelAndResolution = (modelString: string) => {
    if (!modelString) return { model: 'Google Nano Banana', resolution: '2K' };

    const lower = modelString.toLowerCase();

    // Check for Z Image Turbo and P-Image first (they don't have resolution in model name)
    if (lower.includes('z image turbo') || lower.includes('z-image-turbo')) {
      return { model: 'Z Image Turbo', resolution: '1024' }; // Default to 1024 for Z Image Turbo
    }
    if (lower.includes('p-image') && !lower.includes('p-image-edit')) {
      return { model: 'P-Image', resolution: '1024' }; // Default to 1024 for P-Image
    }

    // Check for known resolutions at the end of the string
    const resolutions = ['1K', '2K', '4K', '1024x2048'];
    let foundResolution = '2K'; // Default
    let baseModel = modelString;

    for (const res of resolutions) {
      // Check if string ends with resolution (case insensitive)
      if (lower.endsWith(res.toLowerCase())) {
        foundResolution = res;
        // Remove resolution from end (and trim)
        baseModel = modelString.substring(0, modelString.length - res.length).trim();
        break;
      }
    }

    // Special handling for model names which might be lowercased in some contexts
    if (baseModel.toLowerCase() === 'google nano banana pro') {
      baseModel = 'Google nano banana pro';
    } else if (baseModel.toLowerCase() === 'flux 2 pro') {
      baseModel = 'Flux 2 pro';
    } else if (baseModel.toLowerCase().includes('seedream') && (baseModel.toLowerCase().includes('4.5') || baseModel.toLowerCase().includes('v4.5') || baseModel.toLowerCase().includes('v45'))) {
      baseModel = 'Seedream 4.5';
    }

    return { model: baseModel, resolution: foundResolution };
  };

  // Ensure resolution is valid for Google nano banana pro on mount
  useEffect(() => {
    const modelLower = selectedModel.toLowerCase();
    if (modelLower.includes('nano banana pro')) {
      const validResolutions = ['1K', '2K', '4K'];
      if (!validResolutions.includes(selectedResolution)) {
        setSelectedResolution('2K');
      }
    }
  }, [selectedModel, selectedResolution]);

  useEffect(() => {
    if (initialModel) {
      const { model, resolution } = parseModelAndResolution(initialModel);
      if (model !== selectedModel) {
        setSelectedModel(model);
        // When model changes, also update resolution if needed
        const modelLower = model.toLowerCase();
        const isZTurbo = modelLower.includes('z image turbo') || modelLower.includes('z-image-turbo');
        const isPImage = modelLower.includes('p-image') && !modelLower.includes('p-image-edit');
        const isNanoBananaPro = modelLower.includes('nano banana pro');

        // For Z Image Turbo and P-Image, only accept valid resolutions
        if (isZTurbo && (resolution === '1024' || resolution === '1440')) {
          if (resolution !== selectedResolution) {
            userInitiatedResolutionChangeRef.current = false;
            setSelectedResolution(resolution);
          }
        } else if (isPImage && ['512', '768', '1024', '1280', '1440'].includes(resolution)) {
          if (resolution !== selectedResolution) {
            userInitiatedResolutionChangeRef.current = false;
            setSelectedResolution(resolution);
          }
        } else if (isNanoBananaPro) {
          // For Google nano banana pro, ensure resolution is 1K, 2K, or 4K
          const validResolutions = ['1K', '2K', '4K'];
          const finalResolution = validResolutions.includes(resolution) ? resolution : '2K'; // Default to 2K if invalid
          if (finalResolution !== selectedResolution) {
            userInitiatedResolutionChangeRef.current = false;
            setSelectedResolution(finalResolution);
          }
        } else if (!isZTurbo && !isPImage) {
          // For other models, use the parsed resolution
          if (resolution !== selectedResolution) {
            userInitiatedResolutionChangeRef.current = false;
            setSelectedResolution(resolution);
          }
        }
      } else {
        // Model hasn't changed - only update resolution if it's from initialModel prop change
        // and not from a user-initiated change
        if (resolution !== selectedResolution && !userInitiatedResolutionChangeRef.current) {
          const modelLower = model.toLowerCase();
          const isZTurbo = modelLower.includes('z image turbo') || modelLower.includes('z-image-turbo');
          const isPImage = modelLower.includes('p-image') && !modelLower.includes('p-image-edit');
          const isNanoBananaPro = modelLower.includes('nano banana pro');

          // For Z Image Turbo and P-Image, only accept valid resolutions
          if (isZTurbo && (resolution === '1024' || resolution === '1440')) {
            setSelectedResolution(resolution);
          } else if (isPImage && ['512', '768', '1024', '1280', '1440'].includes(resolution)) {
            setSelectedResolution(resolution);
          } else if (isNanoBananaPro) {
            // For Google nano banana pro, ensure resolution is 1K, 2K, or 4K
            const validResolutions = ['1K', '2K', '4K'];
            const finalResolution = validResolutions.includes(resolution) ? resolution : '2K'; // Default to 2K if invalid
            setSelectedResolution(finalResolution);
          } else if (!isZTurbo && !isPImage) {
            // For other models, use the parsed resolution
            setSelectedResolution(resolution);
          }
        }
        // Reset the flag after processing
        userInitiatedResolutionChangeRef.current = false;
      }
    }
  }, [initialModel, selectedModel]);
  useEffect(() => {
    if (initialFrame && initialFrame !== selectedFrame) setSelectedFrame(initialFrame);
  }, [initialFrame]);
  useEffect(() => {
    if (initialAspectRatio && initialAspectRatio !== selectedAspectRatio) setSelectedAspectRatio(initialAspectRatio);
  }, [initialAspectRatio]);

  // Load image and get its resolution (works for both generated and uploaded images)
  useEffect(() => {
    if (generatedImageUrl) {
      const img = new Image();
      // Use the same URL handling as ImageModalFrame
      // Use AVIF format for canvas display performance
      const { buildProxyThumbnailUrl } = require('@/core/api/proxyUtils');
      const imageUrl = generatedImageUrl.includes('zata.ai') || generatedImageUrl.includes('zata')
        ? buildProxyThumbnailUrl(generatedImageUrl, 2048, 85, 'avif')
        : generatedImageUrl;
      img.crossOrigin = 'anonymous'; // Allow CORS for external images
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          setImageResolution({ width: img.naturalWidth, height: img.naturalHeight });
        }
      };
      img.onerror = () => {
        setImageResolution(null);
      };
      img.src = imageUrl;
    } else {
      setImageResolution(null);
    }
  }, [generatedImageUrl]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (aspectRatioDropdownRef.current && !aspectRatioDropdownRef.current.contains(event.target as Node)) {
        setIsAspectRatioDropdownOpen(false);
      }
      if (resolutionDropdownRef.current && !resolutionDropdownRef.current.contains(event.target as Node)) {
        setIsResolutionDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen || isAspectRatioDropdownOpen || isResolutionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen, isAspectRatioDropdownOpen, isResolutionDropdownOpen]);

  // Get available aspect ratios based on selected model
  const getAvailableAspectRatios = () => {
    const modelLower = selectedModel.toLowerCase();

    // BFL Flux models support: 1:1, 3:4, 4:3, 16:9, 9:16, 3:2, 2:3, 21:9, 9:21, 16:10, 10:16
    if (modelLower.includes('flux')) {
      return [
        { value: '1:1', label: '1:1' },
        { value: '16:9', label: '16:9' },
        { value: '9:16', label: '9:16' },
        { value: '4:3', label: '4:3' },
        { value: '3:4', label: '3:4' },
        { value: '3:2', label: '3:2' },
        { value: '2:3', label: '2:3' },
        { value: '21:9', label: '21:9' },
        { value: '9:21', label: '9:21' },
        { value: '16:10', label: '16:10' },
        { value: '10:16', label: '10:16' },
      ];
    }

    // Replicate Seedream 4K supports: 1:1, 4:3, 3:4, 16:9, 9:16, 3:2, 2:3, 21:9
    if (modelLower.includes('seedream') && (modelLower.includes('4k') || modelLower.includes('4 k'))) {
      return [
        { value: '1:1', label: '1:1' },
        { value: '16:9', label: '16:9' },
        { value: '9:16', label: '9:16' },
        { value: '4:3', label: '4:3' },
        { value: '3:4', label: '3:4' },
        { value: '3:2', label: '3:2' },
        { value: '2:3', label: '2:3' },
        { value: '21:9', label: '21:9' },
      ];
    }

    // Z Image Turbo supports: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3 (width/height must be divisible by 16, 64-2048)
    if (modelLower.includes('z image turbo') || modelLower.includes('z-image-turbo')) {
      return [
        { value: '1:1', label: '1:1' },
        { value: '16:9', label: '16:9' },
        { value: '9:16', label: '9:16' },
        { value: '4:3', label: '4:3' },
        { value: '3:4', label: '3:4' },
        { value: '3:2', label: '3:2' },
        { value: '2:3', label: '2:3' },
      ];
    }

    // P-Image supports: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3 (width/height 256-1440, divisible by 16)
    if (modelLower.includes('p-image') && !modelLower.includes('p-image-edit')) {
      return [
        { value: '1:1', label: '1:1' },
        { value: '16:9', label: '16:9' },
        { value: '9:16', label: '9:16' },
        { value: '4:3', label: '4:3' },
        { value: '3:4', label: '3:4' },
        { value: '3:2', label: '3:2' },
        { value: '2:3', label: '2:3' },
      ];
    }

    // ChatGPT 1.5 supports: 1:1, 3:2, 2:3
    if (modelLower.includes('chatgpt 1.5') || modelLower.includes('chat-gpt-1.5')) {
      return [
        { value: '1:1', label: '1:1' },
        { value: '3:2', label: '3:2' },
        { value: '2:3', label: '2:3' },
      ];
    }

    // FAL models (Google Nano Banana, Seedream v4, Imagen) support: 1:1, 16:9, 9:16, 3:4, 4:3
    return [
      { value: '1:1', label: '1:1' },
      { value: '16:9', label: '16:9' },
      { value: '9:16', label: '9:16' },
      { value: '4:3', label: '4:3' },
      { value: '3:4', label: '3:4' },
    ];
  };

  // Get available resolutions based on selected model
  const getAvailableResolutions = () => {
    const modelLower = selectedModel.toLowerCase();

    // Google Nano Banana Pro supports 1K, 2K, 4K
    if (modelLower.includes('nano banana pro')) {
      return [
        { value: '1K', label: '1K' },
        { value: '2K', label: '2K' },
        { value: '4K', label: '4K' },
      ];
    }

    // Flux 2 Pro supports 1K, 2K, 1024x2048
    if (modelLower.includes('flux 2 pro')) {
      return [
        { value: '1K', label: '1K' },
        { value: '2K', label: '2K' },
        { value: '1024x2048', label: '1024x2048' },
      ];
    }

    // Flux Pro 1.1 Ultra & Flux 2 Pro support 1K, 2K
    if (modelLower.includes('flux pro 1.1 ultra') || modelLower.includes('flux 2 pro')) {
      return [
        { value: '1K', label: '1K' },
        { value: '2K', label: '2K' },
      ];
    }

    // Flux 2 Pro supports 1K, 2K, 1024x2048
    // Seedream models (v4, v4.5) support 1K, 2K, 4K
    if (
      modelLower.includes('seedream')
    ) {
      return [
        { value: '1K', label: '1K' },
        { value: '2K', label: '2K' },
        { value: '4K', label: '4K' },
      ];
    }

    // Imagen 4 Fast - no resolution selector
    if (modelLower.includes('imagen 4 fast') && !modelLower.includes('edit')) {
      return [];
    }

    // Google Imagen 4 (Base) - supports 1K/2K/4K but default to 1K
    if (modelLower.includes('imagen 4') || modelLower.includes('imagen4')) {
      return [
        { value: '1K', label: '1K' },
        { value: '2K', label: '2K' },
      ];
    }

    // Z Image Turbo supports only 1024px and 1440px (width/height 64-1440, divisible by 16)
    if (modelLower.includes('z image turbo') || modelLower.includes('z-image-turbo')) {
      return [
        { value: '1024', label: '1024px' },
        { value: '1440', label: '1440px' },
      ];
    }

    // P-Image supports 1024 and 1440 resolution options only
    if (modelLower.includes('p-image') && !modelLower.includes('p-image-edit')) {
      return [
        { value: '1024', label: '1024px' },
        { value: '1440', label: '1440px' },
      ];
    }

    // Other models don't have resolution options
    return [];
  };

  // Build final model name with resolution for API call
  const getFinalModelName = (modelOverride?: string) => {
    const targetModel = modelOverride || selectedModel;
    const modelLower = targetModel.toLowerCase();

    // Map frontend model names to backend model names for Replicate models
    if (modelLower.includes('z image turbo') || modelLower.includes('z-image-turbo')) {
      return 'Z Image Turbo';
    }
    if (modelLower.includes('p-image') && !modelLower.includes('p-image-edit')) {
      return 'P-Image';
    }

    // For ChatGPT 1.5, use as-is but normalized
    if (modelLower.includes('chatgpt 1.5') || modelLower.includes('chat-gpt-1.5')) {
      return 'ChatGPT 1.5';
    }

    // For Google Nano Banana Pro, append resolution
    if (modelLower.includes('nano banana pro')) {
      return `Google nano banana pro ${selectedResolution}`;
    }

    // For Flux 2 Pro, append resolution
    if (modelLower.includes('flux 2 pro')) {
      return `Flux 2 Pro ${selectedResolution}`;
    }

    // For Seedream 4.5, append resolution (check before general seedream)
    if (
      modelLower.includes('seedream-4.5') ||
      modelLower.includes('seedream_v45') ||
      modelLower.includes('seedreamv45') ||
      (modelLower.includes('seedream') && (modelLower.includes('4.5') || modelLower.includes('v4.5') || modelLower.includes('v45')))
    ) {
      return `Seedream 4.5 ${selectedResolution}`;
    }

    // For Seedream v4, Imagen, and Flux Pro 1.1, append resolution
    if (
      modelLower.includes('seedream') ||
      modelLower.includes('imagen') ||
      modelLower.includes('flux pro 1.1')
    ) {
      return `${targetModel} ${selectedResolution}`;
    }

    // For other models, use as-is
    return targetModel;
  };


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
        console.log('[ImageUploadModal] handleClick triggering onSelect for shift-click', {
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
    if (isLocked) {
      return;
    }
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isImage = target.tagName === 'IMG';
    const isControls = target.closest('.controls-overlay');
    const isShiftClick = e.shiftKey || e.ctrlKey || e.metaKey;

    // Check if dragging is allowed
    if (draggable === false && !isInput && !isButton && !isControls) {
      return;
    }

    // Store initial mouse position
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };

    // For shift-clicks, we'll handle selection on click event (after mouseup)
    // So we don't call onSelect here for shift-clicks to avoid double-triggering
    if (onSelect && !isInput && !isButton && !isControls && !isShiftClick) {
      console.log('[ImageUploadModal] handleMouseDown triggering onSelect (non-shift)', {
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

    // Only allow dragging from the frame, not from controls
    if (!isInput && !isButton && !isControls) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      e.preventDefault();
      e.stopPropagation();
      // Don't set isDraggingContainer immediately - wait to see if mouse moves
    }
  };

  // Handle drag move - only start dragging if mouse actually moves
  useEffect(() => {
    if (!mouseDownPosRef.current) return;

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
      if (isDraggingContainer && containerRef.current && onPositionChange) {
      // Calculate new screen position
      const newScreenX = e.clientX - dragOffset.x;
      const newScreenY = e.clientY - dragOffset.y;

      // Convert screen coordinates back to canvas coordinates
      const newCanvasX = (newScreenX - position.x) / scale;
      const newCanvasY = (newScreenY - position.y) / scale;

      onPositionChange(newCanvasX, newCanvasY);
      lastCanvasPosRef.current = { x: newCanvasX, y: newCanvasY };
      }
    };

    const handleMouseUp = () => {
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
    };
  }, [isDraggingContainer, dragOffset, scale, position, onPositionChange]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      data-modal-component="image"
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

      {/* Auto-Reference Indicator */}
      {autoReferenceInfo && (
        <div
          style={{
            position: 'absolute',
            top: `${8 * scale}px`,
            left: `${8 * scale}px`,
            backgroundColor: 'rgba(67, 126, 181, 0.95)',
            color: 'white',
            padding: `${6 * scale}px ${10 * scale}px`,
            borderRadius: `${6 * scale}px`,
            fontSize: `${11 * scale}px`,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: `${6 * scale}px`,
            zIndex: 15,
            boxShadow: `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.2)`,
            pointerEvents: 'none',
            transition: 'opacity 0.2s ease',
          }}
        >
          <span style={{ fontSize: `${14 * scale}px` }}>🔗</span>
          <span>Auto-Reference: Scene {autoReferenceInfo.sceneNumber}</span>
        </div>
      )}

      {/* Auto-resize effect for Plugin Results (Upscale, Vectorize, etc.) */}
      {/* This ensures the frame expands/collapses to fit the generated image dimensions */}

      {(() => {
        useEffect(() => {
          let mounted = true;
          if (generatedImageUrl) {
            // STRICT SAFETY CHECK:
            // If we have already processed this exact image URL, do absolutely nothing.
            if (processedImageRef.current === generatedImageUrl) {
              return;
            }

            // Use proxy to ensure CORS success for all external images
            const { buildProxyThumbnailUrl, buildProxyResourceUrl } = require('@/core/api/proxyUtils');

            let urlToLoad = generatedImageUrl;
            if (!generatedImageUrl.startsWith('blob:') && !generatedImageUrl.startsWith('data:') && !generatedImageUrl.includes('/api/proxy/')) {
              if (generatedImageUrl.includes('zata.ai') || generatedImageUrl.includes('zata')) {
                urlToLoad = buildProxyThumbnailUrl(generatedImageUrl, 2048, 85, 'avif');
              } else {
                urlToLoad = buildProxyResourceUrl(generatedImageUrl);
              }
            }

            imageCache.load(urlToLoad)
              .then((img) => {
                if (!mounted) return;

                // Mark processed
                processedImageRef.current = generatedImageUrl;

                const naturalWidth = img.naturalWidth;
                const naturalHeight = img.naturalHeight;

                if (naturalWidth && naturalHeight) {
                  setImageResolution({ width: naturalWidth, height: naturalHeight });
                }

                if (!isUploadedImage && naturalWidth && naturalHeight) {
                  const MAX_WIDTH = 600;
                  let newWidth = Math.min(Math.max(naturalWidth, 300), MAX_WIDTH);
                  let newHeight = Math.round(newWidth * (naturalHeight / naturalWidth));
                  const newAspectRatio = `${newWidth}:${newHeight}`;

                  if (onOptionsChange) {
                    if (frameWidth !== newWidth || frameHeight !== newHeight) {
                      onOptionsChange({
                        frameWidth: newWidth,
                        frameHeight: newHeight,
                        aspectRatio: newAspectRatio,
                        model: selectedModel,
                        frame: selectedFrame,
                      } as any);
                    }
                  }
                } else if (isUploadedImage && naturalWidth && naturalHeight) {
                  // For uploaded images, automatically set aspect ratio from image dimensions
                  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
                  const divisor = gcd(naturalWidth, naturalHeight);
                  const aspectWidth = naturalWidth / divisor;
                  const aspectHeight = naturalHeight / divisor;
                  const calculatedAspectRatio = `${aspectWidth}:${aspectHeight}`;

                  // Update aspect ratio if it's different from current
                  if (calculatedAspectRatio !== selectedAspectRatio) {
                    setSelectedAspectRatio(calculatedAspectRatio);
                    if (onOptionsChange) {
                      onOptionsChange({
                        aspectRatio: calculatedAspectRatio,
                        model: selectedModel,
                        frame: selectedFrame,
                        prompt,
                      } as any);
                    }
                  }
                }
              })
              .catch(e => {
                console.warn('[ImageUploadModal] Failed to load image', e);
              });
          }
          return () => { mounted = false; };
        }, [generatedImageUrl, isUploadedImage, selectedModel, onOptionsChange, frameWidth, frameHeight, selectedAspectRatio, selectedFrame, prompt]);
        return null;
      })()}

      <ImageModalTooltip
        isHovered={isHovered}
        isUploadedImage={Boolean(isUploadedImage)}
        imageResolution={imageResolution}
        scale={scale}
        title={isCompareResult ? selectedModel : (PLUGIN_MODELS.includes(selectedModel || '') || PLUGIN_MODELS.includes(initialModel || '') ? (selectedModel || initialModel) : undefined)}
      />



      <div style={{ position: 'relative' }}>
        <ModalActionIcons
          scale={scale}
          isSelected={!!isSelected}
          isPinned={isPinned}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onDownload={generatedImageUrl ? onDownload : undefined}
          onTogglePin={onTogglePin}
          onRegenerate={!isUploadedImage ? () => handleGenerate(1) : undefined}
        />
        <ImageModalFrame
          id={id}
          scale={scale}
          displayAspectRatio={displayAspectRatio}
          isHovered={isHovered}
          isPinned={isPinned}
          isUploadedImage={Boolean(isUploadedImage)}
          isSelected={Boolean(isSelected)}
          isDraggingContainer={isDraggingContainer}
          generatedImageUrl={(!isUploadedImage && connectedImageSource?.url && generatedImageUrl === connectedImageSource.url) ? null : generatedImageUrl}
          isGenerating={isGenerating}
          externalIsGenerating={externalIsGenerating}
          onSelect={onSelect}
          getAspectRatio={getAspectRatio}
          // If an image already exists, use existing frame dimensions to prevent visual frame size change
          // If no image exists, calculate from selected aspect ratio
          // For uploaded images, don't pass width/height so aspect ratio is used
          width={(() => {
            // For uploaded images, let aspect ratio control the size
            if (isUploadedImage) {
              return undefined;
            }
            // If image exists, keep existing frame width; otherwise calculate from aspect ratio
            if (generatedImageUrl && frameWidth) {
              return frameWidth; // Keep existing frame width when image is present
            }
            return 600; // Fixed width for new frames
          })()}
          height={(() => {
            // For uploaded images, let aspect ratio control the size
            if (isUploadedImage) {
              return undefined;
            }
            // If image exists, keep existing frame height; otherwise calculate from aspect ratio
            if (generatedImageUrl && frameHeight) {
              return frameHeight; // Keep existing frame height when image is present
            }
            // Calculate from selected aspect ratio for new frames
            const [w, h] = selectedAspectRatio.split(':').map(Number);
            const ar = w && h ? (w / h) : 1;
            const rawHeight = ar ? Math.round(600 / ar) : 600;
            return Math.max(400, rawHeight); // Min 400px height
          })()}
        />
        <ImageModalNodes
          id={id}
          scale={scale}
          isHovered={isHovered}
          isSelected={Boolean(isSelected)}
        />
      </div>

      {!isUploadedImage && (
        <>
          <ImageModalControls
            scale={scale}
            isHovered={isHovered}
            isPinned={isPinned}
            isUploadedImage={Boolean(isUploadedImage)}
            isSelected={Boolean(isSelected)}
            prompt={effectivePrompt}
            isPromptDisabled={!!connectedTextInput}
            selectedModel={selectedModel}
            selectedAspectRatio={selectedAspectRatio}
            selectedFrame={selectedFrame}
            selectedResolution={selectedResolution}
            imageCount={imageCount}
            generatedImageUrl={generatedImageUrl}
            availableModels={availableModels}
            availableResolutions={getAvailableResolutions()}
            isGenerating={isGenerating}
            isLocked={isLocked}
            lockReason={lockReason}
            isModelDropdownOpen={isModelDropdownOpen}
            isAspectRatioDropdownOpen={isAspectRatioDropdownOpen}
            isResolutionDropdownOpen={isResolutionDropdownOpen}
            onPromptChange={(val) => {
              setPrompt(val);
              if (onOptionsChange) {
                const opts: any = { prompt: val, model: getFinalModelName(), frame: selectedFrame, imageCount };
                if (!generatedImageUrl) {
                  opts.aspectRatio = selectedAspectRatio;
                }
                onOptionsChange(opts);
              }
            }}
            onModelChange={(model) => {
              setSelectedModel(model);
              setIsModelDropdownOpen(false);
              
              // Ensure resolution is set correctly for Google nano banana pro
              const modelLower = model.toLowerCase();
              if (modelLower.includes('nano banana pro')) {
                // If current resolution is not valid for nano banana pro, set to default 2K
                const validResolutions = ['1K', '2K', '4K'];
                if (!validResolutions.includes(selectedResolution)) {
                  setSelectedResolution('2K');
                }
              }
              
              let availableRatios: Array<{ value: string; label: string }>;
              if (modelLower.includes('flux')) {
                availableRatios = [
                  { value: '1:1', label: '1:1' },
                  { value: '16:9', label: '16:9' },
                  { value: '9:16', label: '9:16' },
                  { value: '4:3', label: '4:3' },
                  { value: '3:4', label: '3:4' },
                  { value: '3:2', label: '3:2' },
                  { value: '2:3', label: '2:3' },
                  { value: '21:9', label: '21:9' },
                  { value: '9:21', label: '9:21' },
                  { value: '16:10', label: '16:10' },
                  { value: '10:16', label: '10:16' },
                ];
              } else {
                availableRatios = [
                  { value: '1:1', label: '1:1' },
                  { value: '16:9', label: '16:9' },
                  { value: '9:16', label: '9:16' },
                  { value: '4:3', label: '4:3' },
                  { value: '3:4', label: '3:4' },
                  { value: '3:2', label: '3:2' },
                  { value: '2:3', label: '2:3' },
                  { value: '21:9', label: '21:9' },
                  { value: '5:4', label: '5:4' },
                  { value: '4:5', label: '4:5' },
                ];
              }
              const newAspectRatio = availableRatios.length > 0 && !availableRatios.find(r => r.value === selectedAspectRatio)
                ? availableRatios[0].value
                : selectedAspectRatio;
              if (newAspectRatio !== selectedAspectRatio) {
                setSelectedAspectRatio(newAspectRatio);
              }

              // Update resolution when switching models
              // Calculate available resolutions for the new model
              const isZTurbo = modelLower.includes('z image turbo') || modelLower.includes('z-image-turbo');
              const isPImage = modelLower.includes('p-image') && !modelLower.includes('p-image-edit');
              let availableResolutionsForModel: Array<{ value: string; label: string }> = [];

              if (isZTurbo) {
                availableResolutionsForModel = [
                  { value: '1024', label: '1024px' },
                  { value: '1440', label: '1440px' },
                ];
              } else if (isPImage) {
                availableResolutionsForModel = [
                  { value: '512', label: '512px' },
                  { value: '768', label: '768px' },
                  { value: '1024', label: '1024px' },
                  { value: '1280', label: '1280px' },
                  { value: '1440', label: '1440px' },
                ];
              } else if (modelLower.includes('nano banana pro')) {
                availableResolutionsForModel = [
                  { value: '1K', label: '1K' },
                  { value: '2K', label: '2K' },
                  { value: '4K', label: '4K' },
                ];
              } else if (modelLower.includes('flux 2 pro')) {
                availableResolutionsForModel = [
                  { value: '1K', label: '1K' },
                  { value: '2K', label: '2K' },
                  { value: '1024x2048', label: '1024x2048' },
                ];
              } else if (
                modelLower.includes('seedream-4.5') ||
                modelLower.includes('seedream_v45') ||
                modelLower.includes('seedreamv45') ||
                (modelLower.includes('seedream') && (modelLower.includes('4.5') || modelLower.includes('v4.5') || modelLower.includes('v45')))
              ) {
                // Seedream 4.5 supports 1K, 2K, 4K
                availableResolutionsForModel = [
                  { value: '1K', label: '1K' },
                  { value: '2K', label: '2K' },
                  { value: '4K', label: '4K' },
                ];
              } else if (modelLower.includes('seedream') || modelLower.includes('imagen') || modelLower.includes('flux pro 1.1')) {
                availableResolutionsForModel = [
                  { value: '1K', label: '1K' },
                  { value: '2K', label: '2K' },
                  { value: '4K', label: '4K' },
                ];
              }

              // Update resolution if current is not valid for the new model
              if (availableResolutionsForModel.length > 0) {
                const isValidResolution = availableResolutionsForModel.some(r => r.value === selectedResolution);
                if (!isValidResolution) {
                  // Set to first available resolution (default to 1024 for Z Image Turbo)
                  const newResolution = isZTurbo ? '1024' : availableResolutionsForModel[0].value;
                  setSelectedResolution(newResolution);
                }
              }

              if (onOptionsChange) {
                const [w, h] = newAspectRatio.split(':').map(Number);
                const frameWidth = 600;
                const ar = w && h ? (w / h) : 1;
                const rawHeight = Math.round(frameWidth / ar);
                const frameHeight = Math.max(400, rawHeight);
                // CRITICAL FIX: Pass 'model' explicitly to getFinalModelName because selectedModel state is stale
                const opts: any = { model: getFinalModelName(model), frame: selectedFrame, prompt, frameWidth, frameHeight, imageCount };
                if (!generatedImageUrl) {
                  opts.aspectRatio = newAspectRatio;
                }
                onOptionsChange(opts);
              }
            }}
            onAspectRatioChange={(ratio) => {
              setSelectedAspectRatio(ratio);
              setIsAspectRatioDropdownOpen(false);
              if (onOptionsChange) {
                // If an image already exists, don't change frame dimensions
                // The aspect ratio change should only affect the next generation (image-to-image)
                if (generatedImageUrl) {
                  // Keep existing frame dimensions, only update aspect ratio for next generation
                  const opts: any = {
                    model: selectedModel,
                    frame: selectedFrame,
                    prompt,
                    aspectRatio: ratio, // Update aspect ratio for next generation
                    frameWidth: frameWidth, // Keep existing frame width
                    frameHeight: frameHeight, // Keep existing frame height
                    imageCount
                  };
                  onOptionsChange(opts);
                } else {
                  // No image exists yet - calculate new frame dimensions based on aspect ratio
                  const [w, h] = ratio.split(':').map(Number);
                  const calculatedFrameWidth = 600;
                  const ar = w && h ? (w / h) : 1;
                  const rawHeight = Math.round(calculatedFrameWidth / ar);
                  const calculatedFrameHeight = Math.max(400, rawHeight);
                  const opts: any = {
                    model: selectedModel,
                    frame: selectedFrame,
                    prompt,
                    aspectRatio: ratio,
                    frameWidth: calculatedFrameWidth,
                    frameHeight: calculatedFrameHeight,
                    imageCount
                  };
                  onOptionsChange(opts);
                }
              }
            }}
            onImageCountChange={(count) => {
              setImageCount(count);
              if (onOptionsChange) {
                onOptionsChange({ model: getFinalModelName(), aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, frameWidth: 600, frameHeight: 400, imageCount: count } as any);
              }
            }}
            onResolutionChange={(resolution) => {
              console.log('[ImageUploadModal] Resolution changed:', { resolution, prev: selectedResolution });
              // Mark as user-initiated to prevent useEffect from overriding
              userInitiatedResolutionChangeRef.current = true;
              // Update resolution state immediately
              setSelectedResolution(resolution);

              if (onOptionsChange) {
                // Helper to get model name with NEW resolution
                const getModelNameWithResolution = (res: string) => {
                  const modelLower = selectedModel.toLowerCase();
                  if (modelLower.includes('nano banana pro')) return `Google nano banana pro ${res}`;
                  if (modelLower.includes('flux 2 pro')) return `Flux 2 Pro ${res}`;
                  // Seedream 4.5 (check before general seedream)
                  if (
                    modelLower.includes('seedream-4.5') ||
                    modelLower.includes('seedream_v45') ||
                    modelLower.includes('seedreamv45') ||
                    (modelLower.includes('seedream') && (modelLower.includes('4.5') || modelLower.includes('v4.5') || modelLower.includes('v45')))
                  ) {
                    return `Seedream 4.5 ${res}`;
                  }
                  if (
                    modelLower.includes('seedream') ||
                    modelLower.includes('imagen') ||
                    modelLower.includes('flux pro 1.1') ||
                    modelLower.includes('z image turbo')
                  ) {
                    return `${selectedModel} ${res}`;
                  }
                  return selectedModel;
                };

                // Calculate frame dimensions based on CURRENT aspect ratio (not resolution)
                // Frame size should only change when aspect ratio changes, not resolution
                const [w, h] = selectedAspectRatio.split(':').map(Number);
                const ar = w && h ? (w / h) : 1;
                const frameWidth = 600;
                const rawHeight = Math.round(frameWidth / ar);
                const frameHeight = Math.max(400, rawHeight);

                onOptionsChange({
                  model: getModelNameWithResolution(resolution),
                  aspectRatio: selectedAspectRatio, // Preserve aspect ratio
                  frame: selectedFrame,
                  prompt,
                  frameWidth, // Keep frame size based on aspect ratio only
                  frameHeight, // Keep frame size based on aspect ratio only
                  imageCount
                } as any);
              }
            }}
            onGenerate={handleGenerate}
            getAvailableAspectRatios={getAvailableAspectRatios}
            onSetIsHovered={setIsHovered}
            onSetIsPinned={(val) => onTogglePin?.()}
            onSetIsModelDropdownOpen={setIsModelDropdownOpen}
            onSetIsAspectRatioDropdownOpen={setIsAspectRatioDropdownOpen}
            onSetIsResolutionDropdownOpen={setIsResolutionDropdownOpen}
            gptQuality={gptQuality}
            gptBackground={gptBackground}
            gptModeration={gptModeration}
            onGptQualityChange={setGptQuality}
            onGptBackgroundChange={setGptBackground}
            onGptModerationChange={setGptModeration}
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
        </>
      )}
    </div>
  );
};
