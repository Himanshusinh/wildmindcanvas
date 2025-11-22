'use client';

import { useState, useRef, useEffect } from 'react';
import '@/app/components/common/canvasCaptureGuard';
import { ImageModalTooltip } from './ImageModalTooltip';
import { ModalActionIcons } from '@/app/components/common/ModalActionIcons';
import { ImageModalFrame } from './ImageModalFrame';
import { ImageModalNodes } from './ImageModalNodes';
import { ImageModalControls } from './ImageModalControls';

interface ImageUploadModalProps {
  isOpen: boolean;
  id?: string;
  onClose: () => void;
  onGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => void;
  onImageSelect?: (file: File) => void;
  generatedImageUrl?: string | null;
  generatedImageUrls?: string[]; // Array for multiple images (when imageCount > 1)
  isGenerating?: boolean; // Show loading spinner when generating
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
  onOptionsChange?: (opts: { model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; imageCount?: number }) => void;
  initialCount?: number;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onImageGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, modalId?: string, imageCount?: number, sourceImageUrl?: string) => Promise<{ url: string; images?: Array<{ url: string }> } | null>;
  onUpdateModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>;
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  id,
  onClose,
  onGenerate,
  generatedImageUrl,
  generatedImageUrls,
  isGenerating: externalIsGenerating,
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
}) => {
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [selectedModel, setSelectedModel] = useState(initialModel ?? 'Google Nano Banana');
  const [selectedFrame, setSelectedFrame] = useState(initialFrame ?? 'Frame');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(initialAspectRatio ?? '1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageCount, setImageCount] = useState<number>(initialCount ?? 1);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isAspectRatioDropdownOpen, setIsAspectRatioDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null);
  const [imageResolution, setImageResolution] = useState<{ width: number; height: number } | null>(null);
  const [isDimmed, setIsDimmed] = useState(false);

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

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected ? '#437eb5' : 'rgba(0, 0, 0, 0.3)';
  const frameBorderWidth = 2;
  const dropdownBorderColor = 'rgba(0,0,0,0.1)'; // Fixed border color for dropdowns

  // Detect if this is an uploaded image (from library, local storage, or media)
  // An image is uploaded if:
  // 1. Model is explicitly 'Library Image' or 'Uploaded Image', OR
  // 2. Model is NOT one of the generation models (meaning it's truly uploaded, not generated)
  const GENERATION_MODELS = [
    'Google Nano Banana', 
    'Seedream v4', 
    'Imagen 4 Ultra', 
    'Imagen 4', 
    'Imagen 4 Fast', 
    'Flux Kontext Max', 
    'Flux Kontext Pro', 
    'Flux Pro 1.1 Ultra', 
    'Flux Pro 1.1', 
    'Seedream v4 4K',
    'Upscale', // Upscale is treated as media (no controls)
    'Remove BG' // Remove BG is treated as media (no controls)
  ];
  const isGenerationModel = initialModel && GENERATION_MODELS.includes(initialModel);
  const isSelectedModelGeneration = selectedModel && GENERATION_MODELS.includes(selectedModel);
  // An image is uploaded (Media) if:
  // 1. Model is explicitly 'Library Image' or 'Uploaded Image' (highest priority - check both initialModel and selectedModel), OR
  // 2. Model is NOT a generation model AND there's an image but no prompt (fallback for uploaded media)
  // Priority: Explicit model check first, then fallback detection
  const isUploadedImage = 
    initialModel === 'Library Image' || 
    initialModel === 'Uploaded Image' ||
    initialModel === 'Upscale' ||
    initialModel === 'Remove BG' ||
    selectedModel === 'Library Image' ||
    selectedModel === 'Uploaded Image' ||
    selectedModel === 'Upscale' ||
    selectedModel === 'Remove BG' ||
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
  const hasExistingImage = Boolean(generatedImageUrl && !isGenerating && !externalIsGenerating);
  
  // Filter models: 
  // - If image is connected from another modal OR an image is already generated in this modal, only show image-to-image models
  // - Otherwise, show all models
  const IMAGE_TO_IMAGE_MODELS = ['Google Nano Banana'];
  const ALL_MODELS = [
    'Google Nano Banana', 
    'Seedream v4', 
    'Imagen 4 Ultra', 
    'Imagen 4', 
    'Imagen 4 Fast',
    'Flux Kontext Max', 
    'Flux Kontext Pro', 
    'Flux Pro 1.1 Ultra', 
    'Flux Pro 1.1',
    'Seedream v4 4K'
  ];
  const availableModels = (hasConnectedImage || hasExistingImage) ? IMAGE_TO_IMAGE_MODELS : ALL_MODELS;
  
  // Determine source image URL: use connected image if available, otherwise use existing generated image
  const finalSourceImageUrl = sourceImageUrl || (hasExistingImage ? generatedImageUrl : null);

  // Auto-set model to Google Nano Banana when image is connected or already generated
  // BUT NOT if this is an uploaded image (Media) - uploaded images should keep their model
  useEffect(() => {
    // Don't auto-set model for uploaded images (Media)
    if (isUploadedImage) return;
    
    if ((hasConnectedImage || hasExistingImage) && selectedModel !== 'Google Nano Banana') {
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
  }, [hasConnectedImage, hasExistingImage, selectedModel, selectedAspectRatio, selectedFrame, prompt, onOptionsChange, isUploadedImage]);

  const handleGenerate = async () => {
    if (prompt.trim() && !isGenerating && onPersistImageModalCreate && onImageGenerate) {
      setIsGenerating(true);
      try {
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
            generatedImageUrl: null as string | null,
            isGenerating: true, // Mark as generating to show loading
            frameWidth,
            frameHeight,
            model: selectedModel,
            frame: selectedFrame,
            aspectRatio: selectedAspectRatio,
            prompt,
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
          if (isImageToImageMode && connectedImageSource?.id) {
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
                  color: '#437eb5',
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
                  color: '#437eb5',
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
        
        // Now make ONE API call with the full imageCount
        // The backend will generate all images in parallel, ensuring they are different
        console.log(`[Image Generation] Starting generation of ${imageCount} images${isImageToImageMode ? ' (image-to-image mode)' : ''}`);
        const result = await onImageGenerate(prompt, selectedModel, selectedFrame, selectedAspectRatio, targetModalId, imageCount, finalSourceImageUrl || undefined);
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
        
        console.log(`[Image Generation] Final extracted ${imageUrls.length} image URLs (requested ${imageCount})`);
        
        if (imageUrls.length < imageCount) {
          console.warn(`[Image Generation] WARNING: Requested ${imageCount} images but only got ${imageUrls.length}`);
        }
        
        // Update all frames with their respective images
        // Only show images when all are ready
        for (let i = 0; i < modalIds.length && i < imageUrls.length; i++) {
          if (onUpdateModalState) {
            onUpdateModalState(modalIds[i], {
              generatedImageUrl: imageUrls[i],
              isGenerating: false, // Mark as completed
              model: selectedModel,
              frame: selectedFrame,
              aspectRatio: selectedAspectRatio,
              prompt,
              frameWidth,
              frameHeight,
            } as any);
          }
        }
      } catch (error) {
        console.error('Error generating images:', error);
        alert('Failed to generate images. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  // Sync internal state from initial props (hydration)
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
  useEffect(() => {
    if (initialModel && initialModel !== selectedModel) setSelectedModel(initialModel);
  }, [initialModel]);
  useEffect(() => {
    if (initialFrame && initialFrame !== selectedFrame) setSelectedFrame(initialFrame);
  }, [initialFrame]);
  useEffect(() => {
    if (initialAspectRatio && initialAspectRatio !== selectedAspectRatio) setSelectedAspectRatio(initialAspectRatio);
  }, [initialAspectRatio]);

  // Load image and get its resolution
  useEffect(() => {
    if (generatedImageUrl) {
      const img = new Image();
      img.onload = () => {
        setImageResolution({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        setImageResolution(null);
      };
      img.src = generatedImageUrl;
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
    };

    if (isModelDropdownOpen || isAspectRatioDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen, isAspectRatioDropdownOpen]);

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
    
    // FAL models (Google Nano Banana, Seedream v4, Imagen) support: 1:1, 16:9, 9:16, 3:4, 4:3
    return [
      { value: '1:1', label: '1:1' },
      { value: '16:9', label: '16:9' },
      { value: '9:16', label: '9:16' },
      { value: '4:3', label: '4:3' },
      { value: '3:4', label: '3:4' },
    ];
  };


  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isImage = target.tagName === 'IMG';
    const isControls = target.closest('.controls-overlay');
    
    // Call onSelect when clicking on the modal (this will trigger context menu)
    if (onSelect && !isInput && !isButton && !isControls) {
      onSelect();
    }
    
    // Only allow dragging from the frame, not from controls
    if (!isInput && !isButton && !isImage && !isControls) {
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
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingContainer, dragOffset, scale, position, onPositionChange]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      data-modal-component="image"
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

      <ImageModalTooltip
        isHovered={isHovered}
        isUploadedImage={Boolean(isUploadedImage)}
        imageResolution={imageResolution}
        scale={scale}
      />

      <ModalActionIcons
        isSelected={Boolean(isSelected)}
        scale={scale}
        generatedUrl={generatedImageUrl}
        onDelete={onDelete}
        onDownload={onDownload}
        onDuplicate={onDuplicate}
      />

      <div style={{ position: 'relative' }}>
        <ImageModalFrame
          id={id}
          scale={scale}
          displayAspectRatio={displayAspectRatio}
          isHovered={isHovered}
          isPinned={isPinned}
          isUploadedImage={Boolean(isUploadedImage)}
          isSelected={Boolean(isSelected)}
          isDraggingContainer={isDraggingContainer}
          generatedImageUrl={generatedImageUrl}
          isGenerating={isGenerating}
          externalIsGenerating={externalIsGenerating}
          onSelect={onSelect}
          getAspectRatio={getAspectRatio}
        />
        <ImageModalNodes
          id={id}
          scale={scale}
          isHovered={isHovered}
          isSelected={Boolean(isSelected)}
        />
      </div>

      <ImageModalControls
        scale={scale}
        isHovered={isHovered}
        isPinned={isPinned}
        isUploadedImage={Boolean(isUploadedImage)}
        prompt={prompt}
        selectedModel={selectedModel}
        selectedAspectRatio={selectedAspectRatio}
        selectedFrame={selectedFrame}
        imageCount={imageCount}
        generatedImageUrl={generatedImageUrl}
        availableModels={availableModels}
        isGenerating={isGenerating}
        isModelDropdownOpen={isModelDropdownOpen}
        isAspectRatioDropdownOpen={isAspectRatioDropdownOpen}
        onPromptChange={(val) => {
          setPrompt(val);
          if (onOptionsChange) {
            const opts: any = { prompt: val, model: selectedModel, frame: selectedFrame, imageCount };
            if (!generatedImageUrl) {
              opts.aspectRatio = selectedAspectRatio;
            }
            onOptionsChange(opts);
          }
        }}
        onModelChange={(model) => {
          setSelectedModel(model);
          setIsModelDropdownOpen(false);
          const modelLower = model.toLowerCase();
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
          if (onOptionsChange) {
            const [w, h] = newAspectRatio.split(':').map(Number);
            const frameWidth = 600;
            const ar = w && h ? (w / h) : 1;
            const rawHeight = Math.round(frameWidth / ar);
            const frameHeight = Math.max(400, rawHeight);
            const opts: any = { model, frame: selectedFrame, prompt, frameWidth, frameHeight, imageCount };
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
            const [w, h] = ratio.split(':').map(Number);
            const frameWidth = 600;
            const ar = w && h ? (w / h) : 1;
            const rawHeight = Math.round(frameWidth / ar);
            const frameHeight = Math.max(400, rawHeight);
            const opts: any = { model: selectedModel, frame: selectedFrame, prompt, frameWidth, frameHeight, imageCount };
            if (!generatedImageUrl) {
              opts.aspectRatio = ratio;
            }
            onOptionsChange(opts);
          }
        }}
        onImageCountChange={(count) => {
          setImageCount(count);
          if (onOptionsChange) {
            onOptionsChange({ model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, frameWidth: 600, frameHeight: 400, imageCount: count } as any);
          }
        }}
        onGenerate={handleGenerate}
        getAvailableAspectRatios={getAvailableAspectRatios}
        onSetIsHovered={setIsHovered}
        onSetIsPinned={setIsPinned}
        onSetIsModelDropdownOpen={setIsModelDropdownOpen}
        onSetIsAspectRatioDropdownOpen={setIsAspectRatioDropdownOpen}
      />
    </div>
  );
};
