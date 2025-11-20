'use client';

import { useState, useRef, useEffect } from 'react';
import '../common/canvasCaptureGuard';
import FrameSpinner from '../common/FrameSpinner';

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
  onImageGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, modalId?: string, imageCount?: number) => Promise<{ url: string; images?: Array<{ url: string }> } | null>;
  onUpdateModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number }) => void;
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

  // Calculate aspect ratio from string (e.g., "16:9" -> 16/9)
  const getAspectRatio = (ratio: string): string => {
    const [width, height] = ratio.split(':').map(Number);
    return `${width} / ${height}`;
  };

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected ? '#437eb5' : 'rgba(0, 0, 0, 0.3)';
  const frameBorderWidth = 2;
  const dropdownBorderColor = 'rgba(0,0,0,0.1)'; // Fixed border color for dropdowns
  
  // Detect if this is an uploaded image (from library, local storage, or media)
  // Check if model is 'Library Image' or 'Uploaded Image', or if there's no prompt and image exists (and not generating)
  const isUploadedImage = 
    initialModel === 'Library Image' || 
    initialModel === 'Uploaded Image' ||
    (!initialPrompt && !prompt && generatedImageUrl && !isGenerating && !externalIsGenerating);

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
        
        // Create ALL frames immediately (before generation starts)
        // This ensures both frames show loading animation
        const modalIds: string[] = [];
        const currentModalId = id || `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create current modal if it doesn't exist
        if (!id && onPersistImageModalCreate) {
          const currentModal = {
            id: currentModalId,
            x: x,
            y: y,
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
          await Promise.resolve(onPersistImageModalCreate(currentModal));
        }
        modalIds.push(currentModalId);
        
        // Create additional frames if imageCount > 1
        for (let i = 1; i < imageCount; i++) {
          const offsetX = i * (frameWidth + 50);
          const newX = x + offsetX;
          const newY = y;
          
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
        }
        
        // Now make ONE API call with the full imageCount
        // The backend will generate all images in parallel, ensuring they are different
        console.log(`[Image Generation] Starting generation of ${imageCount} images`);
        const result = await onImageGenerate(prompt, selectedModel, selectedFrame, selectedAspectRatio, currentModalId, imageCount);
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

  // Listen for global node-drag active state so nodes remain visible while dragging
  useEffect(() => {
    const handleActive = (e: Event) => {
      const ce = e as CustomEvent;
      setGlobalDragActive(Boolean(ce.detail?.active));
    };
    window.addEventListener('canvas-node-active', handleActive as any);
    return () => window.removeEventListener('canvas-node-active', handleActive as any);
  }, []);
  useEffect(() => {
    if (initialModel && initialModel !== selectedModel) setSelectedModel(initialModel);
  }, [initialModel]);
  useEffect(() => {
    if (initialFrame && initialFrame !== selectedFrame) setSelectedFrame(initialFrame);
  }, [initialFrame]);
  useEffect(() => {
    if (initialAspectRatio && initialAspectRatio !== selectedAspectRatio) setSelectedAspectRatio(initialAspectRatio);
  }, [initialAspectRatio]);

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

  const controlFontSize = `${13 * scale}px`;

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
      }}
    >

      {/* Tooltip - Attached to Top, Full Width */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            top: `${-32 * scale}px`,
            left: 0,
            width: `${600 * scale}px`,
            maxWidth: '90vw',
            padding: `${6 * scale}px ${12 * scale}px`,
            backgroundColor: '#f0f2f5',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            color: '#1f2937',
            fontSize: `${12 * scale}px`,
            fontWeight: '600',
            borderRadius: `${16 * scale}px ${16 * scale}px 0 0`,
            border: 'none',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 3000,
            boxShadow: 'none',
            transform: 'translateY(0)',
            opacity: 1,
          }}
        >
          {isUploadedImage ? 'Media' : 'Image Generator'}
        </div>
      )}

      {/* Action Icons - Right Side Top, Outside Frame (Only when selected) */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: `${-40 * scale}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: `${6 * scale}px`,
            zIndex: 3001,
            pointerEvents: 'auto',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Delete Icon */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete();
              }}
              title="Delete"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${28 * scale}px`,
                height: `${28 * scale}px`,
                padding: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid rgba(0, 0, 0, 0.1)`,
                borderRadius: `${8 * scale}px`,
                color: '#4b5563',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.color = '#4b5563';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          )}

          {/* Download Icon */}
          {onDownload && generatedImageUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDownload) onDownload();
              }}
              title="Download"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${28 * scale}px`,
                height: `${28 * scale}px`,
                padding: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid rgba(0, 0, 0, 0.1)`,
                borderRadius: `${8 * scale}px`,
                color: '#4b5563',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.color = '#4b5563';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          )}

          {/* Duplicate Icon */}
          {onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDuplicate) onDuplicate();
              }}
              title="Duplicate"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${28 * scale}px`,
                height: `${28 * scale}px`,
                padding: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid rgba(0, 0, 0, 0.1)`,
                borderRadius: `${8 * scale}px`,
                color: '#4b5563',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                e.currentTarget.style.color = '#22c55e';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.color = '#4b5563';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          )}
        </div>
      )}
      {/* Image Frame */}
      <div
        ref={imageAreaRef}
        data-frame-id={id ? `${id}-frame` : undefined}
        onClick={(e) => {
          // Ensure selection works when clicking on frame
          if (onSelect && !e.defaultPrevented) {
            onSelect();
          }
        }}
        style={{
          width: `${600 * scale}px`,
          maxWidth: '90vw',
          aspectRatio: getAspectRatio(selectedAspectRatio),
          minHeight: `${400 * scale}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: (isHovered || isPinned) && !isUploadedImage ? '0px' : `${16 * scale}px`,
          // keep top/left/right borders, but remove bottom border when controls are hovered (only for generated images)
          borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderBottom: (isHovered || isPinned) && !isUploadedImage ? 'none' : `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDraggingContainer ? 'grabbing' : 'grab',
          overflow: 'visible',
          position: 'relative',
          zIndex: 1,
          transition: 'border 0.18s ease',
        }}
      >
        {generatedImageUrl ? (
          <img
            src={generatedImageUrl}
            alt="Generated"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
              borderRadius: (isHovered || isPinned) && !isUploadedImage ? '0px' : `${16 * scale}px`,
            }}
            draggable={false}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <svg
              width={64 * scale}
              height={64 * scale}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto 16px', opacity: 0.3 }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        {(isGenerating || externalIsGenerating) && !generatedImageUrl && (
          <FrameSpinner scale={scale} label="Generating image…" />
        )}
        {/* Connection Nodes - always rendered but subtle until hovered or during drag
            NOTE: right-side is the send/start node, left-side is the receive node */}
        <>
          {/* Receive Node (Left) */}
          <div
            data-node-id={id}
            data-node-side="receive"
            onPointerUp={(e) => {
              if (!id) return;
              e.stopPropagation();
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('canvas-node-complete', { detail: { id, side: 'receive' } }));
              try {
                const active: any = (window as any).__canvas_active_capture;
                if (active?.element && typeof active?.pid === 'number') {
                  try { active.element.releasePointerCapture(active.pid); } catch (err) {}
                  delete (window as any).__canvas_active_capture;
                }
              } catch (err) {}
            }}
            style={{
              position: 'absolute',
              left: `${-12 * scale}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              width: `${20 * scale}px`,
              height: `${20 * scale}px`,
              borderRadius: '50%',
              backgroundColor: '#437eb5',
              cursor: 'pointer',
              border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
              zIndex: 5000,
              opacity: (isHovered || isSelected || globalDragActive) ? 1 : 0,
              transition: 'opacity 0.18s ease, transform 0.12s ease',
              pointerEvents: 'auto',
            }}
          />
          {/* Send Node (Right) */}
          <div
            data-node-id={id}
            data-node-side="send"
            onPointerDown={(e: React.PointerEvent) => {
              const el = e.currentTarget as HTMLElement;
              const pid = e.pointerId;
              try { el.setPointerCapture?.(pid); } catch (err) {}
              // store active capture so receiver can release if needed
              try { (window as any).__canvas_active_capture = { element: el, pid }; } catch (err) {}
              if (!id) return;
              e.stopPropagation();
              e.preventDefault();
              const color = '#437eb5';

              const handlePointerUp = (pe: any) => {
                try { el.releasePointerCapture?.(pe?.pointerId ?? pid); } catch (err) {}
                try { delete (window as any).__canvas_active_capture; } catch (err) {}
                window.removeEventListener('canvas-node-complete', handleComplete as any);
                window.removeEventListener('pointerup', handlePointerUp as any);
              };

              const handleComplete = () => {
                try { el.releasePointerCapture?.(pid); } catch (err) {}
                try { delete (window as any).__canvas_active_capture; } catch (err) {}
                window.removeEventListener('canvas-node-complete', handleComplete as any);
                window.removeEventListener('pointerup', handlePointerUp as any);
              };

              window.addEventListener('canvas-node-complete', handleComplete as any);
              window.addEventListener('pointerup', handlePointerUp as any);

              window.dispatchEvent(new CustomEvent('canvas-node-start', { detail: { id, side: 'send', color, startX: e.clientX, startY: e.clientY } }));
            }}
            style={{
              position: 'absolute',
              right: `${-12 * scale}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              width: `${20 * scale}px`,
              height: `${20 * scale}px`,
              borderRadius: '50%',
              backgroundColor: '#437eb5',
              boxShadow: `0 0 ${8 * scale}px rgba(0,0,0,0.25)`,
              cursor: 'grab',
              border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
              zIndex: 10,
              opacity: (isHovered || isSelected || globalDragActive) ? 1 : 0,
              transition: 'opacity 0.18s ease',
              pointerEvents: 'auto',
            }}
          />
        </>
        {/* Pin Icon Button - Bottom Right (only for generated images, not uploaded) */}
        {!isUploadedImage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPinned(!isPinned);
            }}
            style={{
              position: 'absolute',
              bottom: `${8 * scale}px`,
              right: `${8 * scale}px`,
              width: `${28 * scale}px`,
              height: `${28 * scale}px`,
              borderRadius: `${6 * scale}px`,
              backgroundColor: isPinned ? 'rgba(67, 126, 181, 0.2)' : 'rgba(255, 255, 255, 0.9)',
              border: `1px solid ${isPinned ? '#437eb5' : 'rgba(0, 0, 0, 0.1)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.18s ease, background-color 0.2s ease, border-color 0.2s ease',
              pointerEvents: 'auto',
              boxShadow: isPinned ? `0 ${2 * scale}px ${8 * scale}px rgba(67, 126, 181, 0.3)` : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isPinned) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isPinned) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              }
            }}
            title={isPinned ? 'Unpin controls' : 'Pin controls'}
          >
            <svg
              width={16 * scale}
              height={16 * scale}
              viewBox="0 0 24 24"
              fill={isPinned ? '#437eb5' : 'none'}
              stroke={isPinned ? '#437eb5' : '#4b5563'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 17v5M9 10V7a3 3 0 0 1 6 0v3M5 10h14l-1 7H6l-1-7z" />
            </svg>
          </button>
        )}
        {/* Delete button removed - now handled by context menu in header */}
      </div>

      {/* Controls - Behind Frame, Slides Out on Hover (only for generated images, not uploaded) */}
      {!isUploadedImage && (
        <div
          className="controls-overlay"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: `${600 * scale}px`,
            maxWidth: '90vw',
            padding: `${16 * scale}px`,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: `0 0 ${16 * scale}px ${16 * scale}px`,
            boxShadow: 'none',
            transform: (isHovered || isPinned) ? 'translateY(0)' : `translateY(-100%)`,
            opacity: (isHovered || isPinned) ? 1 : 0,
            maxHeight: (isHovered || isPinned) ? '500px' : '0px',
            display: 'flex',
            flexDirection: 'column',
            gap: `${12 * scale}px`,
            pointerEvents: (isHovered || isPinned) ? 'auto' : 'none',
            overflow: 'visible',
            zIndex: 1,
            // Add left, right and bottom borders to match the frame border color/weight
            borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
            borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
            borderBottom: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Prompt Input */}
          <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center' }}>
            <input
              className="prompt-input"
              type="text"
              value={prompt}
              onChange={(e) => {
                const val = e.target.value;
                setPrompt(val);
                if (onOptionsChange) {
                  onOptionsChange({ prompt: val, model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame, imageCount } as any);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="Enter prompt here..."
              style={{
                flex: 1,
                padding: `${10 * scale}px ${14 * scale}px`,
                backgroundColor: '#ffffff',
                border: 'none',
                borderRadius: `${10 * scale}px`,
                fontSize: `${13 * scale}px`,
                color: '#1f2937',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = `1px solid ${frameBorderColor}`;
                e.currentTarget.style.boxShadow = `0 0 0 ${1 * scale}px ${frameBorderColor}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseDown={(e) => e.stopPropagation()}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              style={{
                width: `${40 * scale}px`,
                height: `${40 * scale}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: (prompt.trim() && !isGenerating) ? '#437eb5' : 'rgba(0, 0, 0, 0.1)',
                border: 'none',
                borderRadius: `${10 * scale}px`,
                cursor: (prompt.trim() && !isGenerating) ? 'pointer' : 'not-allowed',
                color: 'white',
                boxShadow: (prompt.trim() && !isGenerating) ? `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)` : 'none',
                padding: 0,
                opacity: isGenerating ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (prompt.trim()) {
                  e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(67, 126, 181, 0.5)`;
                }
              }}
              onMouseLeave={(e) => {
                if (prompt.trim()) {
                  e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)`;
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {isGenerating ? (
                <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeDasharray="31.416" strokeDashoffset="31.416">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416;0 31.416" repeatCount="indefinite" />
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416;-31.416" repeatCount="indefinite" />
                  </path>
                </svg>
              ) : (
                <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 12h9" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </div>

          {/* Settings Row */}
          <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Model Selector - Custom Dropdown */}
            <div ref={modelDropdownRef} style={{ position: 'relative', flex: '0 0 auto', width: `${220 * scale}px`, minWidth: `${120 * scale}px`, overflow: 'visible', zIndex: 3002 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModelDropdownOpen(!isModelDropdownOpen);
                  setIsAspectRatioDropdownOpen(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    padding: `${10 * scale}px ${28 * scale}px ${10 * scale}px ${14 * scale}px`,
                    backgroundColor: '#ffffff',
                  border: `1px solid ${dropdownBorderColor}`,
                  borderRadius: `${9999 * scale}px`,
                  fontSize: controlFontSize,
                  fontWeight: '500',
                  color: '#1f2937',
                  outline: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{selectedModel}</span>
                <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isModelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <path d="M2 4L6 8L10 4" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              
              {isModelDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: `${4 * scale}px`,
                    backgroundColor: '#ffffff',
                    border: `1px solid ${dropdownBorderColor}`,
                    borderRadius: `${12 * scale}px`,
                    boxShadow: `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.15)`,
                    maxHeight: `${300 * scale}px`,
                    overflowY: 'auto',
                    zIndex: 3003,
                    padding: `${4 * scale}px 0`,
                }}
                onMouseDown={(e) => e.stopPropagation()}
                >
                  {/* FAL Models */}
                  <div style={{ padding: `${6 * scale}px ${12 * scale}px`, fontSize: controlFontSize, fontWeight: '600', color: '#6b7280', borderBottom: `1px solid ${dropdownBorderColor}`, marginBottom: `${4 * scale}px` }}>
                    FAL Models
                  </div>
                  {['Google Nano Banana', 'Seedream v4', 'Imagen 4 Ultra', 'Imagen 4', 'Imagen 4 Fast'].map((model) => (
                    <div
                      key={model}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModel(model);
                        setIsModelDropdownOpen(false);
                        // Reset aspect ratio if needed
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
                  if (availableRatios.length > 0 && !availableRatios.find(r => r.value === selectedAspectRatio)) {
                    setSelectedAspectRatio(availableRatios[0].value);
                  }
                  if (onOptionsChange) {
                    const [w, h] = (availableRatios[0]?.value || '1:1').split(':').map(Number);
                    const frameWidth = 600;
                    const ar = w && h ? (w / h) : 1;
                    const rawHeight = Math.round(frameWidth / ar);
                    const frameHeight = Math.max(400, rawHeight);
                          onOptionsChange({ model, aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, frameWidth, frameHeight, imageCount } as any);
                        }
                      }}
                      style={{
                        padding: `${8 * scale}px ${16 * scale}px`,
                        fontSize: controlFontSize,
                        color: '#1f2937',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: selectedModel === model ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        borderLeft: selectedModel === model ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedModel !== model) {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedModel !== model) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {selectedModel === model && (
                        <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      <span>{model}</span>
                    </div>
                  ))}
                  
                  {/* Flux Models */}
                  <div style={{ padding: `${6 * scale}px ${12 * scale}px`, fontSize: controlFontSize, fontWeight: '600', color: '#6b7280', borderTop: `1px solid ${dropdownBorderColor}`, borderBottom: `1px solid ${dropdownBorderColor}`, marginTop: `${4 * scale}px`, marginBottom: `${4 * scale}px` }}>
                    Flux Models
                  </div>
                  {['Flux Kontext Max', 'Flux Kontext Pro', 'Flux Pro 1.1 Ultra', 'Flux Pro 1.1',].map((model) => (
                    <div
                      key={model}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModel(model);
                        setIsModelDropdownOpen(false);
                        // Reset aspect ratio if needed
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
                        if (availableRatios.length > 0 && !availableRatios.find(r => r.value === selectedAspectRatio)) {
                          setSelectedAspectRatio(availableRatios[0].value);
                        }
                        if (onOptionsChange) {
                          const [w, h] = (availableRatios[0]?.value || '1:1').split(':').map(Number);
                          const frameWidth = 600;
                          const ar = w && h ? (w / h) : 1;
                          const rawHeight = Math.round(frameWidth / ar);
                          const frameHeight = Math.max(400, rawHeight);
                          onOptionsChange({ model, aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, frameWidth, frameHeight, imageCount } as any);
                        }
                      }}
                      style={{
                        padding: `${8 * scale}px ${16 * scale}px`,
                        fontSize: controlFontSize,
                        color: '#1f2937',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: selectedModel === model ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        borderLeft: selectedModel === model ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedModel !== model) {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedModel !== model) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {selectedModel === model && (
                        <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      <span>{model}</span>
                    </div>
                  ))}
                
                {/* Replicate Models */}
                  <div style={{ padding: `${6 * scale}px ${12 * scale}px`, fontSize: controlFontSize, fontWeight: '600', color: '#6b7280', borderTop: `1px solid ${dropdownBorderColor}`, marginTop: `${4 * scale}px` }}>
                    Replicate Models
            </div>
                  {['Seedream v4 4K'].map((model) => (
                    <div
                      key={model}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModel(model);
                        setIsModelDropdownOpen(false);
                        // Reset aspect ratio if needed
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
                        if (availableRatios.length > 0 && !availableRatios.find(r => r.value === selectedAspectRatio)) {
                          setSelectedAspectRatio(availableRatios[0].value);
                        }
                  if (onOptionsChange) {
                          const [w, h] = (availableRatios[0]?.value || '1:1').split(':').map(Number);
                    const frameWidth = 600;
                    const ar = w && h ? (w / h) : 1;
                    const rawHeight = Math.round(frameWidth / ar);
                    const frameHeight = Math.max(400, rawHeight);
                          onOptionsChange({ model, aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, frameWidth, frameHeight, imageCount } as any);
                        }
                      }}
                      style={{
                        padding: `${8 * scale}px ${16 * scale}px`,
                        fontSize: controlFontSize,
                        color: '#1f2937',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: selectedModel === model ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        borderLeft: selectedModel === model ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedModel !== model) {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedModel !== model) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {selectedModel === model && (
                        <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      <span>{model}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            

            {/* Aspect Ratio Selector - Custom Dropdown */}
            <div ref={aspectRatioDropdownRef} style={{ position: 'relative', overflow: 'visible', zIndex: 3001 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAspectRatioDropdownOpen(!isAspectRatioDropdownOpen);
                  setIsModelDropdownOpen(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  padding: `${10 * scale}px ${28 * scale}px ${10 * scale}px ${14 * scale}px`,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${dropdownBorderColor}`,
                  borderRadius: `${9999 * scale}px`,
                  fontSize: controlFontSize,
                  fontWeight: '600',
                  color: '#1f2937',
                  minWidth: `${70 * scale}px`,
                  outline: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{selectedAspectRatio}</span>
                <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isAspectRatioDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <path d="M2 4L6 8L10 4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              
              {isAspectRatioDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: `${4 * scale}px`,
                    backgroundColor: '#ffffff',
                    border: `1px solid ${dropdownBorderColor}`,
                    borderRadius: `${12 * scale}px`,
                    boxShadow: `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.15)`,
                    maxHeight: `${200 * scale}px`,
                    overflowY: 'auto',
                    zIndex: 3003,
                    padding: `${4 * scale}px 0`,
                    minWidth: `${100 * scale}px`,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {getAvailableAspectRatios().map((ratio) => (
                    <div
                      key={ratio.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAspectRatio(ratio.value);
                        setIsAspectRatioDropdownOpen(false);
                        if (onOptionsChange) {
                          const [w, h] = ratio.value.split(':').map(Number);
                          const frameWidth = 600;
                          const ar = w && h ? (w / h) : 1;
                          const rawHeight = Math.round(frameWidth / ar);
                          const frameHeight = Math.max(400, rawHeight);
                          onOptionsChange({ model: selectedModel, aspectRatio: ratio.value, frame: selectedFrame, prompt, frameWidth, frameHeight, imageCount } as any);
                        }
                      }}
                      style={{
                        padding: `${8 * scale}px ${16 * scale}px`,
                        fontSize: controlFontSize,
                        color: '#1f2937',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: selectedAspectRatio === ratio.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        borderLeft: selectedAspectRatio === ratio.value ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedAspectRatio !== ratio.value) {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedAspectRatio !== ratio.value) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {selectedAspectRatio === ratio.value && (
                        <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      <span>{ratio.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
              {/* Image count +/- control (1..4) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
                <button
                  onClick={(e) => { e.stopPropagation(); const next = Math.max(1, imageCount - 1); setImageCount(next); if (onOptionsChange) onOptionsChange({ model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, frameWidth: 600, frameHeight: 400, imageCount: next } as any); }}
                  disabled={imageCount <= 1}
                  title="Decrease images"
                  style={{
                    width: `${32 * scale}px`,
                    height: `${32 * scale}px`,
                    borderRadius: `${9999 * scale}px`,
                    border: `1px solid rgba(0,0,0,0.08)`,
                    backgroundColor: '#ffffff',
                    cursor: imageCount <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: `${13 * scale}px`,
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  -
                </button>
                <div style={{ minWidth: `${28 * scale}px`, textAlign: 'center', fontWeight: 600, fontSize: `${13 * scale}px`, color: '#1f2937' }}>{imageCount}</div>
                <button
                  onClick={(e) => { e.stopPropagation(); const next = Math.min(4, imageCount + 1); setImageCount(next); if (onOptionsChange) onOptionsChange({ model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, frameWidth: 600, frameHeight: 400, imageCount: next } as any); }}
                  disabled={imageCount >= 4}
                  title="Increase images"
                  style={{
                    width: `${32 * scale}px`,
                    height: `${32 * scale}px`,
                    borderRadius: `${9999 * scale}px`,
                    border: `1px solid rgba(0,0,0,0.08)`,
                    backgroundColor: '#ffffff',
                    cursor: imageCount >= 4 ? 'not-allowed' : 'pointer',
                    fontSize: `${13 * scale}px`,
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  +
                </button>
              </div>
          </div>
          {/* Commit Row (shows after generation) */}
          {generatedImageUrl && onAddToCanvas && (
            <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', justifyContent: 'flex-end' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCanvas(generatedImageUrl);
                  // Close/remove this modal after adding to canvas to avoid duplicate view
                  if (onDelete) onDelete();
                }}
                style={{
                  padding: `${10 * scale}px ${14 * scale}px`,
                  backgroundColor: 'rgba(34,197,94,0.9)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: `${10 * scale}px`,
                  fontSize: `${12 * scale}px`,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(34, 197, 94, 0.35)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(34, 197, 94, 0.5)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(34, 197, 94, 0.35)`;
                }}
              >
                Add to Canvas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
