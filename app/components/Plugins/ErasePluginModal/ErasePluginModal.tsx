'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '../../common/canvasCaptureGuard';
import { ModalActionIcons } from '../../common/ModalActionIcons';
import { EraseButton } from './EraseButton';
import { ConnectionNodes } from '../UpscalePluginModal/ConnectionNodes';
import { buildProxyResourceUrl } from '@/lib/proxyUtils';

interface ErasePluginModalProps {
  isOpen: boolean;
  id?: string;
  onClose: () => void;
  onErase?: (model: string, sourceImageUrl?: string, mask?: string, prompt?: string) => Promise<string | null>;
  erasedImageUrl?: string | null;
  isErasing?: boolean;
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
  initialSourceImageUrl?: string | null;
  initialLocalErasedImageUrl?: string | null;
  onOptionsChange?: (opts: { model?: string; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; isErasing?: boolean }) => void;
  onPersistEraseModalCreate?: (modal: { id: string; x: number; y: number; erasedImageUrl?: string | null; isErasing?: boolean }) => void | Promise<void>;
  onUpdateModalState?: (modalId: string, updates: { erasedImageUrl?: string | null; isErasing?: boolean }) => void;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
  onUpdateImageModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
}

export const ErasePluginModal: React.FC<ErasePluginModalProps> = ({
  isOpen,
  id,
  onClose,
  onErase,
  erasedImageUrl,
  isErasing: externalIsErasing,
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
  initialSourceImageUrl,
  initialLocalErasedImageUrl,
  onOptionsChange,
  onPersistEraseModalCreate,
  onUpdateModalState,
  onPersistImageModalCreate,
  onUpdateImageModalState,
  connections = [],
  imageModalStates = [],
  images = [],
  onPersistConnectorCreate,
}) => {
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedModel] = useState(initialModel ?? 'bria/eraser');
  const [isErasing, setIsErasing] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(initialSourceImageUrl ?? null);
  const [erasePrompt, setErasePrompt] = useState<string>('');
  const [brushSize, setBrushSize] = useState<number>(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [localErasedImageUrl, setLocalErasedImageUrl] = useState<string | null>(initialLocalErasedImageUrl ?? null);
  const onOptionsChangeRef = useRef(onOptionsChange);
  
  // Update ref when callback changes
  useEffect(() => {
    onOptionsChangeRef.current = onOptionsChange;
  }, [onOptionsChange]);

  // Helper function to draw on both preview and mask canvases
  const drawBrushStroke = (
    ctx: CanvasRenderingContext2D,
    maskCtx: CanvasRenderingContext2D,
    x: number,
    y: number,
    lastX: number | null,
    lastY: number | null,
    brushSize: number,
    scaleX: number,
    scaleY: number
  ) => {
    // Draw on preview canvas (semi-transparent white for visibility)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // If there's a last point, draw a line to connect strokes smoothly
    if (lastX !== null && lastY !== null) {
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.stroke();
    }
    
    // Draw on mask canvas (pure white, scaled to natural image size)
    const naturalX = x * scaleX;
    const naturalY = y * scaleY;
    const naturalBrushSize = brushSize * Math.max(scaleX, scaleY);
    
    maskCtx.fillStyle = 'rgb(255, 255, 255)'; // Pure white
    maskCtx.beginPath();
    maskCtx.arc(naturalX, naturalY, naturalBrushSize / 2, 0, Math.PI * 2);
    maskCtx.fill();
    
    // Connect strokes on mask canvas too
    if (lastX !== null && lastY !== null) {
      const naturalLastX = lastX * scaleX;
      const naturalLastY = lastY * scaleY;
      maskCtx.beginPath();
      maskCtx.moveTo(naturalLastX, naturalLastY);
      maskCtx.lineTo(naturalX, naturalY);
      maskCtx.lineWidth = naturalBrushSize;
      maskCtx.lineCap = 'round';
      maskCtx.strokeStyle = 'rgb(255, 255, 255)'; // Pure white
      maskCtx.stroke();
    }
  };

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected ? '#437eb5' : 'rgba(0, 0, 0, 0.3)';
  const frameBorderWidth = 2;

  // Detect if this is an erased image result (media-like, no controls)
  const isErasedImage = false; // Always show controls for the plugin

  // Detect connected image nodes (from image generators or canvas images)
  const connectedImageSource = useMemo(() => {
    if (!id) return null;
    const conn = connections.find(c => c.to === id && c.from);
    if (!conn) return null;
    
    // First check if it's from an image generator modal
    const sourceModal = imageModalStates?.find(m => m.id === conn.from);
    if (sourceModal?.generatedImageUrl) {
      // Use proxy URL for Zata URLs to avoid CORS issues
      const url = sourceModal.generatedImageUrl;
      if (url && (url.includes('zata.ai') || url.includes('zata'))) {
        return buildProxyResourceUrl(url);
      }
      return url;
    }
    
    // Then check if it's from a canvas image (uploaded image)
    if (images && images.length > 0) {
      const canvasImage = images.find(img => {
        const imgId = img.elementId || (img as any).id;
        return imgId === conn.from;
      });
      if (canvasImage?.url) {
        // Use proxy URL for Zata URLs to avoid CORS issues
        const url = canvasImage.url;
        if (url && (url.includes('zata.ai') || url.includes('zata'))) {
          return buildProxyResourceUrl(url);
        }
        return url;
      }
    }
    
    return null;
  }, [id, connections, imageModalStates, images]);

  // Restore images from props on mount or when props change
  useEffect(() => {
    if (initialSourceImageUrl !== undefined) {
      setSourceImageUrl(initialSourceImageUrl);
    }
    if (initialLocalErasedImageUrl !== undefined) {
      setLocalErasedImageUrl(initialLocalErasedImageUrl);
    }
  }, [initialSourceImageUrl, initialLocalErasedImageUrl]);

  useEffect(() => {
    if (connectedImageSource && connectedImageSource !== sourceImageUrl) {
      setSourceImageUrl(connectedImageSource);
      // Clear dimming when image is connected
      setIsDimmed(false);
      // Reset erased image when source changes (only if not persisted)
      if (!initialLocalErasedImageUrl) {
        setLocalErasedImageUrl(null);
      }
      // Persist the source image URL (only if it actually changed from initial)
      if (onOptionsChangeRef.current && connectedImageSource !== initialSourceImageUrl) {
        onOptionsChangeRef.current({ sourceImageUrl: connectedImageSource });
      }
    }
  }, [connectedImageSource, initialLocalErasedImageUrl, initialSourceImageUrl, sourceImageUrl]);
  


  // Listen for dimming events
  useEffect(() => {
    const handleDim = (e: CustomEvent) => {
      if (e.detail?.frameId === id) {
        // Only dim if explicitly set to true, otherwise clear dimming
        setIsDimmed(e.detail?.dimmed === true);
      }
    };
    window.addEventListener('canvas-frame-dim' as any, handleDim);
    return () => {
      window.removeEventListener('canvas-frame-dim' as any, handleDim);
    };
  }, [id]);

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isImage = target.tagName === 'IMG';
    const isControls = target.closest('.controls-overlay');
    // Check if clicking on action icons (ModalActionIcons container or its children)
    const isActionIcons = target.closest('[data-action-icons]') || target.closest('button[title="Delete"], button[title="Download"], button[title="Duplicate"]');
    
    console.log('[ErasePluginModal] handleMouseDown', {
      timestamp: Date.now(),
      target: target.tagName,
      isInput,
      isButton,
      isImage,
      isControls: !!isControls,
      isActionIcons: !!isActionIcons,
      buttonTitle: target.closest('button')?.getAttribute('title'),
    });
    
    // Call onSelect when clicking on the modal (this will trigger context menu)
    // Don't select if clicking on buttons, controls, inputs, or action icons
    if (onSelect && !isInput && !isButton && !isControls && !isActionIcons) {
      console.log('[ErasePluginModal] Calling onSelect');
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
      // Initialize lastCanvasPosRef with current position
      lastCanvasPosRef.current = { x, y };
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Handle drag
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
      if (onPositionCommit) {
        // Use lastCanvasPosRef if available, otherwise use current x, y props
        const finalX = lastCanvasPosRef.current?.x ?? x;
        const finalY = lastCanvasPosRef.current?.y ?? y;
        onPositionCommit(finalX, finalY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingContainer, dragOffset, scale, position, onPositionChange, onPositionCommit, x, y]);


  const handleEraseClick = () => {
    if (!sourceImageUrl) {
      alert('Please connect an image first');
      return;
    }
    setIsPopupOpen(true);
  };

  const handleErase = async (): Promise<void> => {
    console.log('[ErasePluginModal] handleErase called', {
      hasOnErase: !!onErase,
      isErasing,
      externalIsErasing,
      sourceImageUrl,
      erasedImageUrl,
    });

    if (!onErase) {
      console.error('[ErasePluginModal] onErase is not defined');
      return;
    }

    if (isErasing || externalIsErasing) {
      console.log('[ErasePluginModal] Already erasing, skipping');
      return;
    }

    if (!sourceImageUrl) {
      alert('Please connect an image first');
      return;
    }
    
    // Check if mask canvas has been drawn on (white area from brush)
    if (!maskCanvasRef.current) {
      alert('Please draw on the image to mark the area to erase before clicking Erase.');
      return;
    }
    
    // Verify mask has white pixels (brush strokes)
    const maskCtx = maskCanvasRef.current.getContext('2d');
    if (!maskCtx) {
      console.error('[ErasePluginModal] ❌ Failed to get mask canvas context');
      alert('An internal error occurred: mask canvas context not found.');
      return;
    }
    
    // Sample mask to verify it has white pixels
    const imageData = maskCtx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    let whitePixelCount = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      if (r > 128 && g > 128 && b > 128) {
        whitePixelCount++;
      }
    }
    
    if (whitePixelCount === 0) {
      alert('Please draw on the image to mark the area to erase before clicking Erase.');
      return;
    }
    
    // Create composited image: original image + white mask overlay
    const maskCanvas = maskCanvasRef.current;
    const image = imageRef.current;
    
    if (!maskCanvas || !image) {
      console.error('[ErasePluginModal] ❌ Mask canvas or image ref is null');
      alert('An internal error occurred: mask canvas or image not found.');
      return;
    }
    
    // Log mask analysis
    console.log('[ErasePluginModal] 🔍 Mask analysis before capture:', {
      maskDimensions: { width: maskCanvas.width, height: maskCanvas.height },
      totalPixels: (maskCanvas.width * maskCanvas.height),
      whitePixels: whitePixelCount,
      whitePercentage: ((whitePixelCount / (maskCanvas.width * maskCanvas.height)) * 100).toFixed(2) + '%',
      hasWhitePixels: whitePixelCount > 0
    });
    
    // Get mask as data URL (pure white mask) - send separately to preserve original image quality
    // The backend will create a proper composited image using sharp without affecting the original colors
    const maskDataUrl = maskCanvas.toDataURL('image/png');
    
    console.log('[ErasePluginModal] ✅ Mask extracted:', {
      hasMask: !!maskDataUrl,
      maskLength: maskDataUrl.length,
      maskPreview: maskDataUrl.substring(0, 100) + '...',
      maskDimensions: { width: maskCanvas.width, height: maskCanvas.height },
      whiteAreaPercentage: ((whitePixelCount / (maskCanvas.width * maskCanvas.height)) * 100).toFixed(2) + '%'
    });
    
    setIsErasing(true);
    // Persist isErasing state
    if (onOptionsChange) {
      onOptionsChange({ isErasing: true } as any);
    }
    
    // Create new image generation frame immediately (before API call) to show loading state
    const frameWidth = 600;
    const frameHeight = 600;
    const offsetX = frameWidth + 50;
    const targetX = x + offsetX;
    const targetY = y;
    const newModalId = `image-erase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (onPersistImageModalCreate) {
      // Create image generation frame with isGenerating flag to show loading state
      const newModal = {
        id: newModalId,
        x: targetX,
        y: targetY,
        generatedImageUrl: null as string | null,
        frameWidth,
        frameHeight,
        model: 'Erase', // Label will show "Erase" (like "Media")
        frame: 'Frame',
        aspectRatio: '1:1',
        prompt: '',
        isGenerating: true, // Show loading state
      };
      
      await Promise.resolve(onPersistImageModalCreate(newModal));
    }
    
    // Automatically create connection from erase plugin to new frame
    if (onPersistConnectorCreate && id) {
      // Calculate node positions (right side of erase plugin, left side of new frame)
      const controlsHeight = 100; // Approximate controls section height
      const imageFrameHeight = 300; // Typical image frame height in canvas coordinates
      const imageFrameCenterY = controlsHeight + (imageFrameHeight / 2);
      
      const fromX = x + 400; // Right side of erase plugin (width is 400 in canvas coordinates)
      const fromY = y + imageFrameCenterY; // Middle of image frame area (where the send node is)
      const toX = targetX; // Left side of new frame
      const toY = targetY + (frameHeight / 2); // Middle of new frame (where the receive node is)
      
      // Check if connection already exists
      const connectionExists = connections.some(
        conn => conn.from === id && conn.to === newModalId
      );
      
      if (!connectionExists) {
        const newConnector = {
          from: id,
          to: newModalId,
          color: '#437eb5',
          fromX,
          fromY,
          toX,
          toY,
          fromAnchor: 'send',
          toAnchor: 'receive',
        };
        
        await Promise.resolve(onPersistConnectorCreate(newConnector));
        console.log('[ErasePluginModal] Created connection from plugin to new frame:', newConnector);
      }
    }
    
    try {
      const imageUrl = sourceImageUrl;
      
      // Close popup after capturing mask
      setIsPopupOpen(false);
      
      console.log('[ErasePluginModal] ========== ERASE REQUEST SUMMARY ==========');
      console.log('[ErasePluginModal] User Input Prompt:', erasePrompt || '(none)');
      console.log('[ErasePluginModal] Original Image URL:', imageUrl ? imageUrl.substring(0, 100) + '...' : 'null');
      console.log('[ErasePluginModal] Mask Data URL:', maskDataUrl ? maskDataUrl.substring(0, 100) + '...' : 'null');
      console.log('[ErasePluginModal] Model:', selectedModel);
      console.log('[ErasePluginModal] Calling onErase with original image and separate mask...');
      console.log('[ErasePluginModal] ===========================================');
      
      // Send original image URL and mask separately to preserve image quality
      // The backend will create a proper composited image using sharp without affecting the original colors
      const result = await onErase(selectedModel, imageUrl || undefined, maskDataUrl, erasePrompt || undefined);
      
      console.log('[ErasePluginModal] ✅ onErase completed:', {
        hasResult: !!result,
        resultUrl: result ? result.substring(0, 100) + '...' : 'null'
      });
      
      // Clear isErasing state now that the result is received
      setIsErasing(false);
      if (onOptionsChange) {
        onOptionsChange({ isErasing: false } as any);
      }
      // Also update the modal state to clear isErasing (this updates externalIsErasing prop)
      if (onUpdateModalState && id) {
        onUpdateModalState(id, { isErasing: false });
      }
      
      // Update the image generation frame with the result
      if (result && onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: result,
          model: 'Erase',
          frame: 'Frame',
          aspectRatio: '1:1',
          prompt: '',
          frameWidth,
          frameHeight,
          isGenerating: false, // Clear loading state
        });
      }
      
      // Also store the erased image in the plugin
      if (result) {
        setLocalErasedImageUrl(result);
        // Update the modal state with erasedImageUrl so it displays in the frame
        if (onUpdateModalState && id) {
          onUpdateModalState(id, { erasedImageUrl: result, isErasing: false });
        }
        // Persist the local erased image URL (only if it changed from initial)
        if (onOptionsChangeRef.current && result !== initialLocalErasedImageUrl) {
          onOptionsChangeRef.current({ 
            localErasedImageUrl: result,
            isErasing: false
          });
        }
      }
    } catch (error) {
      console.error('Erase error:', error);
      // Clear isErasing state on error
      setIsErasing(false);
      if (onOptionsChange) {
        onOptionsChange({ isErasing: false } as any);
      }
      // Also update the modal state to clear isErasing (this updates externalIsErasing prop)
      if (onUpdateModalState && id) {
        onUpdateModalState(id, { isErasing: false });
      }
      // Update frame to show error state or remove it
      if (onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: null,
          model: 'Erase',
          isGenerating: false, // Clear loading state
        });
      }
    }
    
    /* Removed old code - kept for reference
    console.log('[ErasePluginModal] handleErase called', {
      hasOnErase: !!onErase,
      isErasing,
      externalIsErasing,
      sourceImageUrl,
      erasedImageUrl,
    });

    if (!onErase) {
      console.error('[ErasePluginModal] onErase is not defined');
      return;
    }

    if (isErasing || externalIsErasing) {
      console.log('[ErasePluginModal] Already erasing, skipping');
      return;
    }

    if (!sourceImageUrl) {
      alert('Please connect an image first');
      return;
    }
    
    setIsErasing(true);
    // Persist isErasing state
    if (onOptionsChange) {
      onOptionsChange({ isErasing: true } as any);
    }
    
    // Create new image generation frame immediately (before API call) to show loading state
    const frameWidth = 600;
    const frameHeight = 600;
    const offsetX = frameWidth + 50;
    const targetX = x + offsetX;
    const targetY = y;
    const newModalId = `image-erase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    if (onPersistImageModalCreate) {
      // Create image generation frame with isGenerating flag to show loading state
      const newModal = {
        id: newModalId,
        x: targetX,
        y: targetY,
        generatedImageUrl: null as string | null,
        frameWidth,
        frameHeight,
        model: 'Erase', // Label will show "Erase" (like "Media")
        frame: 'Frame',
        aspectRatio: '1:1',
        prompt: '',
        isGenerating: true, // Show loading state
      };
      
      await Promise.resolve(onPersistImageModalCreate(newModal));
    }
    
    // Automatically create connection from erase plugin to new frame
    if (onPersistConnectorCreate && id) {
      // Calculate node positions (right side of erase plugin, left side of new frame)
      const controlsHeight = 100; // Approximate controls section height
      const imageFrameHeight = 300; // Typical image frame height in canvas coordinates
      const imageFrameCenterY = controlsHeight + (imageFrameHeight / 2);
      
      const fromX = x + 400; // Right side of erase plugin (width is 400 in canvas coordinates)
      const fromY = y + imageFrameCenterY; // Middle of image frame area (where the send node is)
      const toX = targetX; // Left side of new frame
      const toY = targetY + (frameHeight / 2); // Middle of new frame (where the receive node is)
      
      // Check if connection already exists
      const connectionExists = connections.some(
        conn => conn.from === id && conn.to === newModalId
      );
      
      if (!connectionExists) {
        const newConnector = {
          from: id,
          to: newModalId,
          color: '#437eb5',
          fromX,
          fromY,
          toX,
          toY,
          fromAnchor: 'send',
          toAnchor: 'receive',
        };
        
        await Promise.resolve(onPersistConnectorCreate(newConnector));
        console.log('[ErasePluginModal] Created connection from plugin to new frame:', newConnector);
      }
    }
    
    try {
      // Close popup after capturing mask
      setIsPopupOpen(false);
      
      console.log('[ErasePluginModal] ========== ERASE REQUEST SUMMARY ==========');
      console.log('[ErasePluginModal] User Input Prompt:', erasePrompt || '(none)');
      console.log('[ErasePluginModal] Image URL (original):', sourceImageUrl ? sourceImageUrl.substring(0, 100) + '...' : 'null');
      console.log('[ErasePluginModal] Composited Image (with white mask overlay):', compositedImageDataUrl ? compositedImageDataUrl.substring(0, 100) + '...' : 'null');
      console.log('[ErasePluginModal] Model: google-nano-banana-edit');
      console.log('[ErasePluginModal] Calling onErase...');
      console.log('[ErasePluginModal] ===========================================');
      
      // Clear isErasing state on erase plugin once API call starts
      // The image generation frame will show isGenerating instead
      setIsErasing(false);
      if (onOptionsChange) {
        onOptionsChange({ isErasing: false } as any);
      }
      
      // Send composited image (original + white mask overlay) instead of separate image and mask
      // Pass compositedImageDataUrl as the "image" parameter, and undefined for mask
      const result = await onErase(selectedModel, compositedImageDataUrl, undefined, erasePrompt || undefined);
      
      console.log('[ErasePluginModal] ✅ onErase completed:', {
        hasResult: !!result,
        resultUrl: result ? result.substring(0, 100) + '...' : 'null'
      });
      
      // Update the image generation frame with the result
      if (result && onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: result,
          model: 'Erase',
          frame: 'Frame',
          aspectRatio: '1:1',
          prompt: '',
          frameWidth,
          frameHeight,
          isGenerating: false, // Clear loading state
        });
      }
      
      // Also store the erased image in the plugin
      if (result) {
        setLocalErasedImageUrl(result);
        // Update the modal state with erasedImageUrl so it displays in the frame
        if (onUpdateModalState && id) {
          onUpdateModalState(id, { erasedImageUrl: result });
        }
        // Persist the local erased image URL (only if it changed from initial)
        if (onOptionsChangeRef.current && result !== initialLocalErasedImageUrl) {
          onOptionsChangeRef.current({ 
            localErasedImageUrl: result
          });
        }
      }
    } catch (error) {
      console.error('Erase error:', error);
      // Update frame to show error state or remove it
      if (onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: null,
          model: 'Erase',
          isGenerating: false, // Clear loading state
        });
      }
    } finally {
      setIsErasing(false);
      // Persist isErasing state (clear loading)
      if (onOptionsChange) {
        onOptionsChange({ isErasing: false } as any);
      }
    }
    */
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      data-modal-component="erase"
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
      <ModalActionIcons
        isSelected={isSelected || false}
        scale={scale}
        onDelete={onDelete}
        onDownload={onDownload}
        onDuplicate={onDuplicate}
        generatedUrl={erasedImageUrl}
      />

      {/* Simple erase button container with nodes */}
      <div
        data-frame-id={id ? `${id}-frame` : undefined}
        style={{
          position: 'relative',
          width: `${400 * scale}px`,
          maxWidth: '90vw',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: `${16 * scale}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${12 * scale}px`,
          border: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          zIndex: 10,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
      >
        <EraseButton
          scale={scale}
          isErasing={isErasing}
          externalIsErasing={externalIsErasing}
          sourceImageUrl={sourceImageUrl}
          onErase={handleEraseClick}
        />
        
        <ConnectionNodes
          id={id}
          scale={scale}
          isHovered={isHovered}
          isSelected={isSelected || false}
        />
      </div>

      {/* Image Preview Popup with Brush Tool */}
      {isPopupOpen && sourceImageUrl && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10003,
            backdropFilter: 'blur(4px)',
            pointerEvents: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsPopupOpen(false);
            }
          }}
          onWheel={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '90vw',
              maxWidth: '1200px',
              height: '85vh',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Header with Erase Button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Erase Image
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={handleErase}
                  disabled={isErasing || externalIsErasing}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isErasing || externalIsErasing ? '#9ca3af' : '#437eb5',
                    color: 'white',
                    cursor: isErasing || externalIsErasing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {isErasing || externalIsErasing ? 'Erasing...' : 'Erase'}
                </button>
                <button
                  onClick={() => setIsPopupOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '24px',
                    color: '#666',
                    padding: 0,
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Erase Prompt Input */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <label style={{ fontSize: '14px', fontWeight: 500 }}>
                What do you want to remove from the highlighted area? (optional)
              </label>
              <input
                type="text"
                value={erasePrompt}
                onChange={(e) => setErasePrompt(e.target.value)}
                placeholder="e.g., remove the person, erase the text, remove this object..."
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, minWidth: '80px' }}>
                    Brush Size:
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    style={{
                      flex: 1,
                      height: '6px',
                      borderRadius: '3px',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '40px', textAlign: 'right' }}>
                    {brushSize}px
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                  Draw on the image to mark the area you want to erase. Only the drawn area will be affected.
                </p>
              </div>
            </div>
            
            {/* Image with Drawing Canvas Overlay - Fixed Frame */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                flex: 1,
                minHeight: '400px',
                maxHeight: 'calc(85vh - 200px)',
                overflow: 'hidden',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {sourceImageUrl ? (
                  <img
                    ref={imageRef}
                    src={
                      // Apply proxy for Zata URLs if not already proxied
                      // connectedImageSource already applies proxy, but initialSourceImageUrl might not
                      (sourceImageUrl.includes('zata.ai') || sourceImageUrl.includes('zata')) && !sourceImageUrl.includes('/api/proxy/')
                        ? buildProxyResourceUrl(sourceImageUrl)
                        : sourceImageUrl
                    }
                    alt="Preview"
                    crossOrigin="anonymous"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      width: 'auto',
                      height: 'auto',
                      display: 'block',
                      userSelect: 'none',
                      pointerEvents: 'none',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      console.error('[ErasePluginModal] Failed to load image:', sourceImageUrl);
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('[ErasePluginModal] Image loaded successfully:', sourceImageUrl);
                      // Initialize canvas when image loads
                      if (imageRef.current && canvasRef.current && maskCanvasRef.current) {
                        const img = imageRef.current;
                        const canvas = canvasRef.current;
                        const maskCanvas = maskCanvasRef.current;
                        
                        // Wait for next frame to ensure image is fully rendered and fits
                        requestAnimationFrame(() => {
                          // Preview canvas matches displayed size (actual rendered size after objectFit: contain)
                          const displayedWidth = img.clientWidth || img.offsetWidth;
                          const displayedHeight = img.clientHeight || img.offsetHeight;
                          canvas.width = displayedWidth;
                          canvas.height = displayedHeight;
                          
                          // Update canvas style to match image size exactly
                          canvas.style.width = `${displayedWidth}px`;
                          canvas.style.height = `${displayedHeight}px`;
                          
                          // Mask canvas matches natural image size (for API)
                          maskCanvas.width = img.naturalWidth;
                          maskCanvas.height = img.naturalHeight;
                          
                          // Clear both canvases
                          const maskCtx = maskCanvas.getContext('2d');
                          const previewCtx = canvas.getContext('2d');
                          if (maskCtx) {
                            // Initialize mask canvas with black background (black = keep, white = remove)
                            maskCtx.fillStyle = 'black';
                            maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
                          }
                          if (previewCtx) {
                            previewCtx.clearRect(0, 0, canvas.width, canvas.height);
                          }
                          
                          // Reset brush drawing when image loads
                          setLastPoint(null);
                          setIsDrawing(false);
                        });
                      }
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#9ca3af',
                      fontSize: '14px',
                    }}
                  >
                    <p>No image connected</p>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>Connect an image to the erase plugin</p>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    cursor: 'crosshair',
                    touchAction: 'none',
                    pointerEvents: 'auto',
                  }}
                  onMouseDown={(e) => {
                    if (!canvasRef.current || !imageRef.current || !maskCanvasRef.current) return;
                    const img = imageRef.current;
                    const imgRectBounds = img.getBoundingClientRect();
                    
                    // Get coordinates relative to image
                    const relativeX = e.clientX - imgRectBounds.left;
                    const relativeY = e.clientY - imgRectBounds.top;
                    
                    // Check if click is within image bounds
                    if (relativeX < 0 || relativeY < 0 || relativeX > imgRectBounds.width || relativeY > imgRectBounds.height) {
                      return;
                    }
                    
                    setIsDrawing(true);
                    setLastPoint({ x: relativeX, y: relativeY });
                    
                    // Draw initial brush stroke
                    const canvas = canvasRef.current;
                    const maskCanvas = maskCanvasRef.current;
                    const ctx = canvas.getContext('2d');
                    const maskCtx = maskCanvas.getContext('2d');
                    
                    if (ctx && maskCtx) {
                      const scaleX = img.naturalWidth / img.clientWidth;
                      const scaleY = img.naturalHeight / img.clientHeight;
                      drawBrushStroke(ctx, maskCtx, relativeX, relativeY, null, null, brushSize, scaleX, scaleY);
                    }
                  }}
                  onMouseMove={(e) => {
                    if (!isDrawing || !canvasRef.current || !imageRef.current || !maskCanvasRef.current || !lastPoint) return;
                    const img = imageRef.current;
                    const imgRectBounds = img.getBoundingClientRect();
                    
                    // Get coordinates relative to image
                    const relativeX = e.clientX - imgRectBounds.left;
                    const relativeY = e.clientY - imgRectBounds.top;
                    
                    // Clamp to image bounds
                    const clampedX = Math.max(0, Math.min(relativeX, imgRectBounds.width));
                    const clampedY = Math.max(0, Math.min(relativeY, imgRectBounds.height));
                    
                    // Draw brush stroke
                    const canvas = canvasRef.current;
                    const maskCanvas = maskCanvasRef.current;
                    const ctx = canvas.getContext('2d');
                    const maskCtx = maskCanvas.getContext('2d');
                    
                    if (ctx && maskCtx) {
                      const scaleX = img.naturalWidth / img.clientWidth;
                      const scaleY = img.naturalHeight / img.clientHeight;
                      drawBrushStroke(ctx, maskCtx, clampedX, clampedY, lastPoint.x, lastPoint.y, brushSize, scaleX, scaleY);
                      setLastPoint({ x: clampedX, y: clampedY });
                    }
                  }}
                  onMouseUp={() => {
                    if (isDrawing) {
                      setIsDrawing(false);
                      setLastPoint(null);
                    }
                  }}
                  onMouseLeave={() => {
                    if (isDrawing) {
                      setIsDrawing(false);
                      setLastPoint(null);
                    }
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    if (!canvasRef.current || !imageRef.current || !maskCanvasRef.current) return;
                    const touch = e.touches[0];
                    const img = imageRef.current;
                    const imgRectBounds = img.getBoundingClientRect();
                    
                    const relativeX = touch.clientX - imgRectBounds.left;
                    const relativeY = touch.clientY - imgRectBounds.top;
                    
                    if (relativeX < 0 || relativeY < 0 || relativeX > imgRectBounds.width || relativeY > imgRectBounds.height) {
                      return;
                    }
                    
                    setIsDrawing(true);
                    setLastPoint({ x: relativeX, y: relativeY });
                    
                    const canvas = canvasRef.current;
                    const maskCanvas = maskCanvasRef.current;
                    const ctx = canvas.getContext('2d');
                    const maskCtx = maskCanvas.getContext('2d');
                    
                    if (ctx && maskCtx) {
                      const scaleX = img.naturalWidth / img.clientWidth;
                      const scaleY = img.naturalHeight / img.clientHeight;
                      drawBrushStroke(ctx, maskCtx, relativeX, relativeY, null, null, brushSize, scaleX, scaleY);
                    }
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    if (!isDrawing || !canvasRef.current || !imageRef.current || !maskCanvasRef.current || !lastPoint) return;
                    const touch = e.touches[0];
                    const img = imageRef.current;
                    const imgRectBounds = img.getBoundingClientRect();
                    
                    const relativeX = touch.clientX - imgRectBounds.left;
                    const relativeY = touch.clientY - imgRectBounds.top;
                    
                    const clampedX = Math.max(0, Math.min(relativeX, imgRectBounds.width));
                    const clampedY = Math.max(0, Math.min(relativeY, imgRectBounds.height));
                    
                    const canvas = canvasRef.current;
                    const maskCanvas = maskCanvasRef.current;
                    const ctx = canvas.getContext('2d');
                    const maskCtx = maskCanvas.getContext('2d');
                    
                    if (ctx && maskCtx) {
                      const scaleX = img.naturalWidth / img.clientWidth;
                      const scaleY = img.naturalHeight / img.clientHeight;
                      drawBrushStroke(ctx, maskCtx, clampedX, clampedY, lastPoint.x, lastPoint.y, brushSize, scaleX, scaleY);
                      setLastPoint({ x: clampedX, y: clampedY });
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    if (isDrawing) {
                      setIsDrawing(false);
                      setLastPoint(null);
                    }
                  }}
                />
              {/* Hidden mask canvas for API */}
              <canvas
                ref={maskCanvasRef}
                style={{ display: 'none' }}
              />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


