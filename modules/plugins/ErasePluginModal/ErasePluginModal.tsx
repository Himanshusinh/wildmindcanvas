'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '@/modules/ui-global/common/canvasCaptureGuard';
import { ModalActionIcons } from '@/modules/ui-global/common/ModalActionIcons';
import { defaultShouldIgnoreCanvasDragTarget, useCanvasModalDrag } from '../PluginComponents/useCanvasModalDrag';
import { normalizeCanvasMediaUrl, useCanvasFrameDim, useConnectedSourceImage, useLatestRef, usePersistedPopupState } from '../PluginComponents';
import { PluginNodeShell } from '../PluginComponents';
import { PluginConnectionNodes } from '../PluginComponents';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

interface ErasePluginModalProps {
  isOpen: boolean;
  isExpanded?: boolean;
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
  onUpdateModalState?: (modalId: string, updates: { erasedImageUrl?: string | null; isErasing?: boolean; isExpanded?: boolean }) => void;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
  onUpdateImageModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const ErasePluginModal: React.FC<ErasePluginModalProps> = ({
  isOpen,
  isExpanded,
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
  onContextMenu,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedModel] = useState(initialModel ?? 'bria/eraser');
  const [isErasing, setIsErasing] = useState(false);
  const { isDimmed, setIsDimmed } = useCanvasFrameDim(id);
  const { isPopupOpen, setIsPopupOpen, togglePopup } = usePersistedPopupState({ isExpanded, id, onUpdateModalState, defaultOpen: false });
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(initialSourceImageUrl ?? null);
  const [erasePrompt, setErasePrompt] = useState<string>('');
  const [brushSize, setBrushSize] = useState<number>(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [brushPreview, setBrushPreview] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false });
  const lastBrushPointRef = useRef<{ x: number; y: number } | null>(null);
  const [localErasedImageUrl, setLocalErasedImageUrl] = useState<string | null>(initialLocalErasedImageUrl ?? null);
  const [isAdjustingBrush, setIsAdjustingBrush] = useState(false);
  const [isBrushHovering, setIsBrushHovering] = useState(false);
  const onOptionsChangeRef = useLatestRef(onOptionsChange);
  const hasSourceImage = Boolean(sourceImageUrl);

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
    ctx.fillStyle = '#f7f7f7';
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
      ctx.strokeStyle = '#f7f7f7';
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

  const showBrushPreviewFromStoredPoint = () => {
    if (lastBrushPointRef.current) {
      setBrushPreview({ ...lastBrushPointRef.current, visible: true });
      return true;
    }
    if (imageRef.current) {
      const imageRect = imageRef.current.getBoundingClientRect();
      const centerX = imageRect.left + imageRect.width / 2;
      const centerY = imageRect.top + imageRect.height / 2;
      lastBrushPointRef.current = { x: centerX, y: centerY };
      setBrushPreview({ x: centerX, y: centerY, visible: true });
      return true;
    }
    return false;
  };

  const updateBrushPreviewPosition = (clientX: number, clientY: number) => {
    if (!sourceImageUrl) return;
    lastBrushPointRef.current = { x: clientX, y: clientY };
    setBrushPreview({ x: clientX, y: clientY, visible: true });
  };

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const isDark = useIsDarkTheme();

  const frameBorderColor = isSelected
    ? '#437eb5'
    : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
  const frameBorderWidth = 2;

  // Detect if this is an erased image result (media-like, no controls)
  const isErasedImage = false; // Always show controls for the plugin

  const connectedImageSource = useConnectedSourceImage({ id, connections, imageModalStates, images });

  // Restore images from props on mount or when props change
  const hideBrushPreviewIfIdle = () => {
    if (!isAdjustingBrush && !isBrushHovering && !isDrawing) {
      setBrushPreview(prev => ({ ...prev, visible: false }));
    }
  };

  useEffect(() => {
    if (initialSourceImageUrl !== undefined) {
      setSourceImageUrl(initialSourceImageUrl);
    }
    if (initialLocalErasedImageUrl !== undefined) {
      setLocalErasedImageUrl(initialLocalErasedImageUrl);
    }
  }, [initialSourceImageUrl, initialLocalErasedImageUrl]);

  useEffect(() => {
    if (!sourceImageUrl && brushPreview.visible && !isAdjustingBrush && !isBrushHovering && !isDrawing) {
      setBrushPreview(prev => ({ ...prev, visible: false }));
    }
  }, [sourceImageUrl, brushPreview.visible, isAdjustingBrush, isBrushHovering, isDrawing]);

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setIsAdjustingBrush(false);
      if (lastBrushPointRef.current) {
        setBrushPreview({ ...lastBrushPointRef.current, visible: true });
      } else if (!isBrushHovering) {
        setBrushPreview(prev => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('mouseup', handleGlobalPointerUp);
    window.addEventListener('touchend', handleGlobalPointerUp);
    window.addEventListener('touchcancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalPointerUp);
      window.removeEventListener('touchend', handleGlobalPointerUp);
      window.removeEventListener('touchcancel', handleGlobalPointerUp);
    };
  }, [isBrushHovering]);

  useEffect(() => {
    // Handle connection changes: update or clear source image
    if (connectedImageSource) {
      // Connection exists: update source image if different
      if (connectedImageSource !== sourceImageUrl) {
        setSourceImageUrl(connectedImageSource);
        // Clear dimming when image is connected
        setIsDimmed(false);
        // Reset erased image when source changes (only if not persisted)
        if (!initialLocalErasedImageUrl) {
          setLocalErasedImageUrl(null);
        }
        // Persist the source image URL
        if (onOptionsChangeRef.current) {
          onOptionsChangeRef.current({ sourceImageUrl: connectedImageSource });
        }
      }
    } else {
      // Connection deleted: clear source image if it was from a connection
      // Only clear if current sourceImageUrl matches what was connected (or if no initialSourceImageUrl was set)
      if (sourceImageUrl && (!initialSourceImageUrl || sourceImageUrl === initialSourceImageUrl)) {
        setSourceImageUrl(null);
        // Clear dimming
        setIsDimmed(false);
        // Clear persisted source image URL
        if (onOptionsChangeRef.current) {
          onOptionsChangeRef.current({ sourceImageUrl: null });
        }
      }
    }
  }, [connectedImageSource, initialLocalErasedImageUrl, initialSourceImageUrl, sourceImageUrl]);
  const { onMouseDown: handleMouseDown } = useCanvasModalDrag({
    enabled: isOpen,
    x,
    y,
    scale,
    position,
    containerRef,
    onPositionChange,
    onPositionCommit,
    onSelect,
    onTap: () => togglePopup(),
    shouldIgnoreTarget: (target) => {
      // Don't start dragging when user is interacting with the eraser drawing canvas
      const el = target as HTMLElement | null;
      if (el?.tagName === 'CANVAS') return true;
      return defaultShouldIgnoreCanvasDragTarget(target);
    },
  });


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
    <PluginNodeShell
      modalKey="erase"
      id={id}
      containerRef={containerRef}
      screenX={screenX}
      screenY={screenY}
      isHovered={isHovered}
      isSelected={Boolean(isSelected)}
      isDimmed={isDimmed}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={onContextMenu}
    >
      {/* Action icons removed - functionality still available via onDelete, onDuplicate handlers */}
      {/* ModalActionIcons removed per user request - delete/duplicate functionality preserved */}

      {/* Plugin node design with icon and label */}
      <div
        data-frame-id={id ? `${id}-frame` : undefined}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 10,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
      >
        {/* Label above */}
        <div
          style={{
            marginBottom: `${8 * scale}px`,
            fontSize: `${12 * scale}px`,
            fontWeight: 500,
            color: isDark ? '#ffffff' : '#1a1a1a',
            textAlign: 'center',
            userSelect: 'none',
            transition: 'color 0.3s ease',
            letterSpacing: '0.2px',
          }}
        >
          Erase / Replace
        </div>

        {/* Main plugin container - Circular */}
        <div
          style={{
            position: 'relative',
            width: `${100 * scale}px`,
            height: `${100 * scale}px`,
            backgroundColor: isDark ? '#2d2d2d' : '#e5e5e5',
            borderRadius: '50%',
            border: `${1.5 * scale}px solid ${isDark ? '#3a3a3a' : '#a0a0a0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s ease, box-shadow 0.2s ease',
            boxShadow: isDark
              ? (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.3)`)
              : (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.2)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.1)`),
            transform: (isHovered || isSelected) ? `scale(1.03)` : 'scale(1)',
            overflow: 'visible', // Allow nodes to extend beyond container
          }}
        >
          {/* Erase Icon */}
          <img
            src="/icons/erase.svg"
            alt="Erase"
            style={{
              width: `${40 * scale}px`,
              height: `${40 * scale}px`,
              objectFit: 'contain',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
              filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)',

            }}
            onError={(e) => {
              console.error('[ErasePluginModal] Failed to load erase.svg icon');
              // Fallback: hide broken image
              e.currentTarget.style.display = 'none';
            }}
          />

          <PluginConnectionNodes
            id={id}
            scale={scale}
            isHovered={isHovered}
            isSelected={isSelected || false}
          />
        </div>

      </div>

      {/* Image Preview Popup with Brush Tool */}
      {isPopupOpen && (
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
          {hasSourceImage ? (
            <div
              style={{
                backgroundColor: isDark ? '#121212' : 'white',
                borderRadius: '16px',
                border: `2px solid ${isDark ? '#3a3a3a' : '#a0a0a0'}`,
                padding: '24px',
                width: '90vw',
                maxWidth: '1200px',
                height: '85vh',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
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
                  flexWrap: 'nowrap',
                  gap: '10px',
                  marginBottom: '8px',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 600,
                    color: isDark ? '#ffffff' : '#111827',
                    transition: 'color 0.3s ease',
                    flex: '0 0 12%',
                    minWidth: '90px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Erase / Replace
                </h3>
                <div
                  onMouseEnter={() => {
                    setIsBrushHovering(true);
                    showBrushPreviewFromStoredPoint();
                  }}
                  onMouseLeave={() => {
                    setIsBrushHovering(false);
                    hideBrushPreviewIfIdle();
                  }}
                  onTouchStart={() => {
                    setIsBrushHovering(true);
                    showBrushPreviewFromStoredPoint();
                  }}
                  onTouchEnd={() => {
                    setIsBrushHovering(false);
                    hideBrushPreviewIfIdle();
                  }}
                  onMouseMove={(e) => {
                    if (isBrushHovering || isAdjustingBrush) {
                      updateBrushPreviewPosition(e.clientX, e.clientY);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (isBrushHovering || isAdjustingBrush) {
                      const touch = e.touches[0];
                      updateBrushPreviewPosition(touch.clientX, touch.clientY);
                    }
                  }}
                  style={{
                    flex: '0 0 33%',
                    minWidth: '150px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e5e7eb',
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  }}
                >

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <button
                      onClick={() => {
                        const newSize = Math.max(5, brushSize - 5);
                        setBrushSize(newSize);
                        showBrushPreviewFromStoredPoint();
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: isDark ? '1px solid rgba(255,255,255,0.3)' : '1px solid #d1d5db',
                        backgroundColor: 'transparent',
                        color: isDark ? '#ffffff' : '#111827',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      −
                    </button>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="1"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === '+' || e.key === '=') {
                          e.preventDefault();
                          const newSize = Math.min(100, brushSize + 5);
                          setBrushSize(newSize);
                          showBrushPreviewFromStoredPoint();
                        } else if (e.key === '-' || e.key === '_') {
                          e.preventDefault();
                          const newSize = Math.max(5, brushSize - 5);
                          setBrushSize(newSize);
                          showBrushPreviewFromStoredPoint();
                        }
                      }}
                      onMouseDown={() => {
                        setIsAdjustingBrush(true);
                        showBrushPreviewFromStoredPoint();
                      }}
                      onMouseUp={() => {
                        setIsAdjustingBrush(false);
                        hideBrushPreviewIfIdle();
                      }}
                      onTouchStart={() => {
                        setIsAdjustingBrush(true);
                        showBrushPreviewFromStoredPoint();
                      }}
                      onTouchEnd={() => {
                        setIsAdjustingBrush(false);
                        hideBrushPreviewIfIdle();
                      }}
                      style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '2px',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => {
                        const newSize = Math.min(100, brushSize + 5);
                        setBrushSize(newSize);
                        showBrushPreviewFromStoredPoint();
                      }}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: isDark ? '1px solid rgba(255,255,255,0.3)' : '1px solid #d1d5db',
                        backgroundColor: 'transparent',
                        color: isDark ? '#ffffff' : '#111827',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      +
                    </button>
                    <span style={{ fontSize: '12px', color: isDark ? '#cccccc' : '#6b7280', minWidth: '32px', textAlign: 'right', transition: 'color 0.3s ease' }}>
                      {brushSize}px
                    </span>
                  </div>
                </div>
                <div style={{ flex: '1 1 auto', minWidth: '240px', marginRight: '12px' }}>
                  <input
                    type="text"
                    value={erasePrompt}
                    onChange={(e) => setErasePrompt(e.target.value)}
                    placeholder="Prompt for Replace"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #e5e7eb',
                      backgroundColor: isDark ? '#121212' : '#ffffff',
                      color: isDark ? '#ffffff' : '#111827',
                      fontSize: '13px',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box',
                      transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
                      height: '40px',
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    flex: '0 0 auto',
                    minWidth: '120px',
                    justifyContent: 'flex-start',
                    marginLeft: 'auto',
                    paddingRight: '8px',
                  }}
                >
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '56px',
                    }}
                  >
                    {isErasing || externalIsErasing ? (
                      'Erasing...'
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setIsPopupOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '24px',
                      color: isDark ? '#cccccc' : '#666',
                      padding: 0,
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Image with Drawing Canvas Overlay - Fixed Frame */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  flex: 1,
                  minHeight: 0,
                  height: '100%',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  border: isDark ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid #e5e7eb',
                  backgroundColor: isDark ? '#000000' : '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.3s ease, border-color 0.3s ease',
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
                      src={normalizeCanvasMediaUrl(sourceImageUrl) ?? sourceImageUrl}
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
                        opacity: 1,
                        filter: 'none',
                        position: 'relative',
                        zIndex: 0,
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
                      <p style={{ color: isDark ? '#ffffff' : '#111827', transition: 'color 0.3s ease' }}>No image connected</p>
                      <p style={{ fontSize: '12px', marginTop: '8px', color: isDark ? '#cccccc' : '#6b7280', transition: 'color 0.3s ease' }}>Connect an image to the erase plugin</p>
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
                      backgroundColor: 'transparent !important' as any,
                      zIndex: 1,
                    }}
                    className="erase-preview-canvas"
                    onMouseDown={(e) => {
                      updateBrushPreviewPosition(e.clientX, e.clientY);
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
                      updateBrushPreviewPosition(e.clientX, e.clientY);
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
                      hideBrushPreviewIfIdle();
                    }}
                    onMouseLeave={() => {
                      if (isDrawing) {
                        setIsDrawing(false);
                        setLastPoint(null);
                      }
                      hideBrushPreviewIfIdle();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      const touch = e.touches[0];
                      updateBrushPreviewPosition(touch.clientX, touch.clientY);
                      if (!canvasRef.current || !imageRef.current || !maskCanvasRef.current) return;
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
                      const touch = e.touches[0];
                      updateBrushPreviewPosition(touch.clientX, touch.clientY);
                      if (!isDrawing || !canvasRef.current || !imageRef.current || !maskCanvasRef.current || !lastPoint) return;
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
                      hideBrushPreviewIfIdle();
                    }}
                  />
                  {/* Hidden mask canvas for API */}
                  <canvas
                    ref={maskCanvasRef}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              {sourceImageUrl && brushPreview.visible && (
                <div
                  style={{
                    position: 'fixed',
                    top: `${brushPreview.y}px`,
                    left: `${brushPreview.x}px`,
                    width: `${brushSize}px`,
                    height: `${brushSize}px`,
                    borderRadius: '50%',
                    border: isDark ? '1px solid rgba(247,247,247,0.5)' : '1px solid rgba(247,247,247,0.9)',
                    backgroundColor: 'rgba(247,247,247,0.2)',
                    pointerEvents: 'none',
                    zIndex: 10006,
                    transform: 'translate(-50%, -50%)',
                    transition: 'width 0.15s ease, height 0.15s ease',
                  }}
                />
              )}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: isDark ? '#121212' : 'white',
                borderRadius: '16px',
                padding: '32px',
                width: 'min(420px, 90vw)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                alignItems: 'center',
                textAlign: 'center',
                boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
                transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: isDark ? '#ffffff' : '#111827' }}>
                Connect an image to erase
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: isDark ? '#cccccc' : '#4b5563' }}>
                Use the connection nodes to attach an image or generated frame. Once connected, the erase workspace will appear here.
              </p>
              <button
                onClick={() => setIsPopupOpen(false)}
                style={{
                  marginTop: '8px',
                  padding: '10px 20px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: '#437eb5',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

    </PluginNodeShell>
  );
};


