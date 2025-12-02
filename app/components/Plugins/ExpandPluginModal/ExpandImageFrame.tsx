'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { buildProxyResourceUrl } from '@/lib/proxyUtils';

interface ExpandImageFrameProps {
  sourceImageUrl: string | null;
  localExpandedImageUrl: string | null;
  expandedImageUrl?: string | null;
  aspectPreset?: string;
  aspectPresets?: Record<string, { width: number; height: number; aspectRatio: number }>;
  customWidth?: number;
  customHeight?: number;
  onFrameInfoChange?: (info: {
    canvasSize: [number, number];
    originalImageSize: [number, number];
    originalImageLocation: [number, number];
    aspectRatio?: string;
  } | null) => void;
}

export const ExpandImageFrame: React.FC<ExpandImageFrameProps> = ({
  sourceImageUrl,
  localExpandedImageUrl,
  expandedImageUrl,
  aspectPreset = 'custom',
  aspectPresets = {},
  customWidth = 1024,
  customHeight = 1024,
  onFrameInfoChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [touchStart, setTouchStart] = useState<{ center: { x: number; y: number }; pan: { x: number; y: number } } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const panNeedsCenterRef = useRef(true);

  // Calculate minimum zoom to fit 6000x6000 canvas in viewport
  const getMinZoom = useCallback(() => {
    if (!containerSize) return 0.1;
    const canvasSize = 6000;
    const minZoomX = containerSize.width / canvasSize;
    const minZoomY = containerSize.height / canvasSize;
    return Math.min(minZoomX, minZoomY, 1); // Don't allow zooming out more than 1x if container is larger
  }, [containerSize]);

  // Constrain pan to keep canvas within bounds
  const constrainPan = useCallback((newPan: { x: number; y: number }, currentZoom: number) => {
    if (!containerSize) return newPan;
    
    const canvasSize = 6000;
    const scaledCanvasWidth = canvasSize * currentZoom;
    const scaledCanvasHeight = canvasSize * currentZoom;
    
    // Calculate max pan to prevent showing areas beyond 6000x6000
    const maxPanX = 0;
    const maxPanY = 0;
    const minPanX = containerSize.width - scaledCanvasWidth;
    const minPanY = containerSize.height - scaledCanvasHeight;
    
    return {
      x: Math.max(minPanX, Math.min(maxPanX, newPan.x)),
      y: Math.max(minPanY, Math.min(maxPanY, newPan.y)),
    };
  }, [containerSize]);

  const previewImage = sourceImageUrl || localExpandedImageUrl || expandedImageUrl;

  // Calculate frame bounds
  const getFrameBounds = useCallback(() => {
    let frameWidth = 1024;
    let frameHeight = 1024;

    if (aspectPreset === 'custom') {
      // Use custom dimensions
      const maxSize = 5000;
      if (customWidth > maxSize || customHeight > maxSize) {
        // Scale down proportionally if dimensions exceed max
        const scale = Math.min(maxSize / customWidth, maxSize / customHeight);
        frameWidth = customWidth * scale;
        frameHeight = customHeight * scale;
      } else {
        frameWidth = customWidth;
        frameHeight = customHeight;
      }
    } else {
      const preset = aspectPresets[aspectPreset];
      if (preset) {
        // Use preset dimensions directly, but scale down if they exceed 5000x5000
        const maxSize = 5000;
        if (preset.width > maxSize || preset.height > maxSize) {
          // Scale down proportionally if dimensions exceed max
          const scale = Math.min(maxSize / preset.width, maxSize / preset.height);
          frameWidth = preset.width * scale;
          frameHeight = preset.height * scale;
        } else {
          // Use preset dimensions as-is
          frameWidth = preset.width;
          frameHeight = preset.height;
        }
      }
    }

    const frameX = 3000 - frameWidth / 2; // Center in 6000x6000 canvas
    const frameY = 3000 - frameHeight / 2;

    return { x: frameX, y: frameY, width: frameWidth, height: frameHeight };
  }, [aspectPreset, aspectPresets, customWidth, customHeight]);

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate frame dimensions based on aspect preset (max 5000x5000)
    let frameWidth = 1024;
    let frameHeight = 1024;

    if (aspectPreset === 'custom') {
      // Use custom dimensions
      const maxSize = 5000;
      if (customWidth > maxSize || customHeight > maxSize) {
        const scale = Math.min(maxSize / customWidth, maxSize / customHeight);
        frameWidth = customWidth * scale;
        frameHeight = customHeight * scale;
      } else {
        frameWidth = customWidth;
        frameHeight = customHeight;
      }
    } else {
      const preset = aspectPresets[aspectPreset];
      if (preset) {
        // Use preset dimensions directly, but scale down if they exceed 5000x5000
        const maxSize = 5000;
        if (preset.width > maxSize || preset.height > maxSize) {
          // Scale down proportionally if dimensions exceed max
          const scale = Math.min(maxSize / preset.width, maxSize / preset.height);
          frameWidth = preset.width * scale;
          frameHeight = preset.height * scale;
        } else {
          // Use preset dimensions as-is
          frameWidth = preset.width;
          frameHeight = preset.height;
        }
      }
    }

    // Center frame in 6000x6000 canvas
    const frameX = (canvas.width - frameWidth) / 2;
    const frameY = (canvas.height - frameHeight) / 2;

    // Draw blue background outside frame (#3B82F642)
    ctx.fillStyle = '#3B82F642';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw white inside frame
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(frameX, frameY, frameWidth, frameHeight);

    // Draw frame border
    ctx.strokeStyle = '#1daa63';
    ctx.lineWidth = 2;
    ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);

    if (!img || !img.complete || img.naturalWidth === 0) {
      return;
    }

    // Use natural image size (no scaling)
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    // Store image size for calculations
    if (!imageSize || imageSize.width !== imgWidth || imageSize.height !== imgHeight) {
      setImageSize({ width: imgWidth, height: imgHeight });
    }

    // Use tracked position or center the image initially within the frame
    // If aspect preset changed, reset position to center of frame
    let x = imagePosition?.x ?? frameX + (frameWidth - imgWidth) / 2;
    let y = imagePosition?.y ?? frameY + (frameHeight - imgHeight) / 2;

    // Ensure image stays within frame bounds
    const minX = frameX;
    const minY = frameY;
    const maxX = frameX + frameWidth - imgWidth;
    const maxY = frameY + frameHeight - imgHeight;
    x = Math.max(minX, Math.min(maxX, x));
    y = Math.max(minY, Math.min(maxY, y));

    // Initialize position if not set
    if (!imagePosition) {
      setImagePosition({ x, y });
      return; // Will redraw on next render with position set
    }

    // Draw image at natural size at current position (zoom/pan handled by CSS transform)
    ctx.drawImage(img, x, y, imgWidth, imgHeight);
  }, [imagePosition, imageSize, aspectPreset, aspectPresets, customWidth, customHeight]);

  // Calculate frame bounds memoized to prevent recalculation
  const frameBounds = useMemo(() => getFrameBounds(), [aspectPreset, aspectPresets, customWidth, customHeight]);

  // Reset image position when aspect preset changes (only once per preset change)
  const lastAspectPresetRef = useRef<string>(aspectPreset);
  useEffect(() => {
    if (!previewImage || !imageRef.current?.complete) return;
    
    // Only reset position if aspect preset actually changed
    if (lastAspectPresetRef.current === aspectPreset && imagePosition) {
      return;
    }
    
    lastAspectPresetRef.current = aspectPreset;
    const img = imageRef.current;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    
    // Center image in new frame
    const newX = frameBounds.x + (frameBounds.width - imgWidth) / 2;
    const newY = frameBounds.y + (frameBounds.height - imgHeight) / 2;
    
    setImagePosition({ x: newX, y: newY });
  }, [aspectPreset, previewImage, frameBounds]); // Use memoized frameBounds

  // Store callback in ref to prevent infinite loops
  const onFrameInfoChangeRef = useRef(onFrameInfoChange);
  useEffect(() => {
    onFrameInfoChangeRef.current = onFrameInfoChange;
  }, [onFrameInfoChange]);

  // Expose frame information to parent component (memoized to prevent infinite loops)
  const frameInfoRef = useRef<{
    canvasSize: [number, number];
    originalImageSize: [number, number];
    originalImageLocation: [number, number];
    aspectRatio?: string;
  } | null>(null);

  useEffect(() => {
    if (!onFrameInfoChangeRef.current) return;
    
    if (!previewImage || !imageRef.current?.complete || !imagePosition || !imageSize) {
      if (frameInfoRef.current !== null) {
        frameInfoRef.current = null;
        onFrameInfoChangeRef.current(null);
      }
      return;
    }

    // canvas_size should be the frame size (the white area), not the outer 6000x6000 canvas
    const canvasSize: [number, number] = [Math.round(frameBounds.width), Math.round(frameBounds.height)];
    const originalImageSize: [number, number] = [imageSize.width, imageSize.height];
    // original_image_location should be relative to the frame, not the outer canvas
    // Since the frame is centered in the 6000x6000 canvas, we need to adjust the position
    let relativeX = Math.round(imagePosition.x - frameBounds.x);
    let relativeY = Math.round(imagePosition.y - frameBounds.y);
    
    // Ensure image position is within canvas bounds (0 to canvasSize - imageSize)
    relativeX = Math.max(0, Math.min(canvasSize[0] - originalImageSize[0], relativeX));
    relativeY = Math.max(0, Math.min(canvasSize[1] - originalImageSize[1], relativeY));
    
    const originalImageLocation: [number, number] = [relativeX, relativeY];
    
    // Validate that image fits within canvas
    if (relativeX + originalImageSize[0] > canvasSize[0] || relativeY + originalImageSize[1] > canvasSize[1]) {
      console.warn('[ExpandImageFrame] Image extends beyond canvas, adjusting position', {
        canvasSize,
        originalImageSize,
        originalImageLocation: [relativeX, relativeY],
        imagePosition,
        frameBounds,
      });
      // Clamp to ensure it fits
      relativeX = Math.max(0, Math.min(canvasSize[0] - originalImageSize[0], relativeX));
      relativeY = Math.max(0, Math.min(canvasSize[1] - originalImageSize[1], relativeY));
    }
    
    // Get aspect ratio from preset
    // Note: For custom sizes, we don't set aspect_ratio as it might not match a standard preset
    // The FAL API can infer the aspect ratio from canvas_size if aspect_ratio is not provided
    let aspectRatio: string | undefined;
    if (aspectPreset !== 'custom') {
      aspectRatio = aspectPreset;
    }
    // For custom, don't set aspect_ratio - let FAL API use canvas_size to determine it

    const newFrameInfo = {
      canvasSize,
      originalImageSize,
      originalImageLocation,
      aspectRatio,
    };

    // Only call onFrameInfoChange if the values actually changed
    const prevInfo = frameInfoRef.current;
    if (!prevInfo ||
        prevInfo.canvasSize[0] !== newFrameInfo.canvasSize[0] ||
        prevInfo.canvasSize[1] !== newFrameInfo.canvasSize[1] ||
        prevInfo.originalImageSize[0] !== newFrameInfo.originalImageSize[0] ||
        prevInfo.originalImageSize[1] !== newFrameInfo.originalImageSize[1] ||
        prevInfo.originalImageLocation[0] !== newFrameInfo.originalImageLocation[0] ||
        prevInfo.originalImageLocation[1] !== newFrameInfo.originalImageLocation[1] ||
        prevInfo.aspectRatio !== newFrameInfo.aspectRatio) {
      frameInfoRef.current = newFrameInfo;
      onFrameInfoChangeRef.current(newFrameInfo);
    }
  }, [previewImage, imagePosition?.x, imagePosition?.y, imageSize?.width, imageSize?.height, aspectPreset, frameBounds]);

  useEffect(() => {
    panNeedsCenterRef.current = true;
  }, [aspectPreset, customWidth, customHeight, previewImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Always set canvas size to exactly 6000x6000 - never more, never less
    canvas.width = 6000;
    canvas.height = 6000;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate frame dimensions based on aspect preset (max 5000x5000)
    let frameWidth = 1024;
    let frameHeight = 1024;

    if (aspectPreset === 'custom') {
      // Use custom dimensions
      const maxSize = 5000;
      if (customWidth > maxSize || customHeight > maxSize) {
        const scale = Math.min(maxSize / customWidth, maxSize / customHeight);
        frameWidth = customWidth * scale;
        frameHeight = customHeight * scale;
      } else {
        frameWidth = customWidth;
        frameHeight = customHeight;
      }
    } else {
      const preset = aspectPresets[aspectPreset];
      if (preset) {
        // Use preset dimensions directly, but scale down if they exceed 5000x5000
        const maxSize = 5000;
        if (preset.width > maxSize || preset.height > maxSize) {
          // Scale down proportionally if dimensions exceed max
          const scale = Math.min(maxSize / preset.width, maxSize / preset.height);
          frameWidth = preset.width * scale;
          frameHeight = preset.height * scale;
        } else {
          // Use preset dimensions as-is
          frameWidth = preset.width;
          frameHeight = preset.height;
        }
      }
    }

    // Center frame in 6000x6000 canvas
    const frameX = (canvas.width - frameWidth) / 2;
    const frameY = (canvas.height - frameHeight) / 2;

    // Draw blue background outside frame (#3B82F642)
    ctx.fillStyle = '#3B82F642';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw white inside frame
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(frameX, frameY, frameWidth, frameHeight);

    // Draw frame border
    ctx.strokeStyle = '#1daa63';
    ctx.lineWidth = 2;
    ctx.strokeRect(frameX, frameY, frameWidth, frameHeight);

    if (!previewImage) {
      return;
    }

    drawImage();
  }, [previewImage, imagePosition, drawImage, aspectPreset, aspectPresets, customWidth, customHeight]);

  const handleImageLoad = () => {
    // Calculate initial centered position at natural size
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;
    const x = (canvas.width - imgWidth) / 2;
    const y = (canvas.height - imgHeight) / 2;

    if (!imagePosition) {
      setImagePosition({ x, y });
    }
    if (!imageSize) {
      setImageSize({ width: imgWidth, height: imgHeight });
    }
    drawImage();
  };

  // Get canvas coordinates from mouse event accounting for zoom and pan (CSS transform)
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    // Convert screen coordinates to canvas coordinates accounting for CSS transform
    // CSS transform: translate(pan.x, pan.y) scale(zoom)
    // To reverse: (screenX - pan.x) / zoom
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    return { x, y };
  };

  // Track container size for zoom calculations
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Set initial zoom to fit canvas when container size is first known
  useEffect(() => {
    if (containerSize && zoom === 1) {
      const minZoom = getMinZoom();
      if (minZoom < 1) {
        setZoom(minZoom);
      }
    }
  }, [containerSize, getMinZoom, zoom]);

  // Constrain pan when zoom or container size changes, centering when needed
  useEffect(() => {
    if (!containerSize) return;
    const scaledCanvas = 6000 * zoom;
    if (panNeedsCenterRef.current) {
      const centeredPan = {
        x: (containerSize.width - scaledCanvas) / 2,
        y: (containerSize.height - scaledCanvas) / 2,
      };
      setPan(constrainPan(centeredPan, zoom));
      panNeedsCenterRef.current = false;
    } else {
      setPan(prev => constrainPan(prev, zoom));
    }
  }, [zoom, containerSize, constrainPan]);

  // Handle wheel for zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate minimum zoom to fit 6000x6000 canvas
    const minZoom = getMinZoom();

    // Zoom towards mouse position
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(minZoom, Math.min(5, zoom * zoomFactor));

    // Calculate the point under mouse in canvas coordinates before zoom
    const canvasX = (mouseX - pan.x) / zoom;
    const canvasY = (mouseY - pan.y) / zoom;

    // Adjust pan so the same canvas point stays under the mouse after zoom
    const newPanX = mouseX - canvasX * newZoom;
    const newPanY = mouseY - canvasY * newZoom;

    const constrainedPan = constrainPan({ x: newPanX, y: newPanY }, newZoom);

    setZoom(newZoom);
    setPan(constrainedPan);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Right mouse button, middle button, or shift key for panning
    if (e.button === 2 || e.button === 1 || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      return;
    }

    // Left mouse button for dragging image
    if (e.button === 0) {
      // Get canvas coordinates accounting for zoom and pan
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasX = (screenX - pan.x) / zoom;
      const canvasY = (screenY - pan.y) / zoom;
      
      setIsDragging(true);
      setDragStart({ x: canvasX, y: canvasY });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Stop propagation to prevent main canvas from receiving these events
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Handle panning
    if (isPanning && panStart) {
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const deltaX = currentX - panStart.x;
      const deltaY = currentY - panStart.y;
      
      setPan(prev => {
        const newPan = {
          x: prev.x + deltaX,
          y: prev.y + deltaY
        };
        return constrainPan(newPan, zoom);
      });
      setPanStart({ x: currentX, y: currentY });
      return;
    }

    // Handle image dragging
    if (isDragging && dragStart && imagePosition && imageSize) {
      // Get canvas coordinates accounting for zoom and pan
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const canvasX = (screenX - pan.x) / zoom;
      const canvasY = (screenY - pan.y) / zoom;
      
      const deltaX = canvasX - dragStart.x;
      const deltaY = canvasY - dragStart.y;

      // Calculate new position
      let newX = imagePosition.x + deltaX;
      let newY = imagePosition.y + deltaY;

      // Constrain image within frame bounds
      const frameBounds = getFrameBounds();
      const minX = frameBounds.x;
      const minY = frameBounds.y;
      const maxX = frameBounds.x + frameBounds.width - imageSize.width;
      const maxY = frameBounds.y + frameBounds.height - imageSize.height;

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      setImagePosition({ x: newX, y: newY });
      setDragStart({ x: canvasX, y: canvasY });
    }
  }, [isDragging, isPanning, dragStart, panStart, imagePosition, imageSize, zoom, pan, getFrameBounds, constrainPan]);

  const handleMouseUp = useCallback((e?: MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
    setIsDragging(false);
    setIsPanning(false);
    setDragStart(null);
    setPanStart(null);
  }, []);

  useEffect(() => {
    if (isDragging || isPanning) {
      const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e);
      const mouseUpHandler = (e: MouseEvent) => handleMouseUp(e);
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
      return () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };
    }
  }, [isDragging, isPanning, handleMouseMove, handleMouseUp]);

  // Calculate center point between two touches
  const getTouchCenter = (touches: React.TouchList): { x: number; y: number } => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // Handle touch start for two-finger panning
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length === 2) {
      // Two fingers - start panning
      const center = getTouchCenter(e.touches);
      
      setIsPanning(true);
      setTouchStart({
        center,
        pan: { ...pan },
      });
    } else if (e.touches.length === 1) {
      // Single finger - could be image dragging (optional)
      // For now, we'll just prevent default
    }
  };

  // Handle touch move for two-finger panning
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length === 2 && touchStart) {
      const currentCenter = getTouchCenter(e.touches);

      // Calculate pan delta
      const deltaX = currentCenter.x - touchStart.center.x;
      const deltaY = currentCenter.y - touchStart.center.y;

      // Update pan position with constraints
      const newPan = {
        x: touchStart.pan.x + deltaX,
        y: touchStart.pan.y + deltaY,
      };
      setPan(constrainPan(newPan, zoom));
    }
  };

  // Handle touch end
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.touches.length < 2) {
      setIsPanning(false);
      setTouchStart(null);
    }
  };

  return (
    <div
      ref={containerRef}
      data-expand-canvas-container
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden', // Prevent scrolling beyond canvas bounds
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
      }}
    >
      {previewImage ? (
        <>
          {/* Hidden image for loading */}
          <img
            ref={imageRef}
            src={
              (previewImage.includes('zata.ai') || previewImage.includes('zata')) && !previewImage.includes('/api/proxy/')
                ? buildProxyResourceUrl(previewImage)
                : previewImage
            }
            alt="Expand preview"
            crossOrigin="anonymous"
            onLoad={handleImageLoad}
            onError={(e) => {
              console.error('[ExpandImageFrame] Failed to load image:', previewImage);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
            style={{ display: 'none' }}
          />
          {/* Canvas for displaying the image - always 6000x6000 */}
          <canvas
            ref={canvasRef}
            width={6000}
            height={6000}
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
            style={{
              width: '6000px',
              height: '6000px',
              display: 'block',
              userSelect: 'none',
              touchAction: 'none', // Prevent default touch behaviors
              cursor: isPanning ? 'grabbing' : isDragging ? 'grabbing' : 'grab',
              flexShrink: 0,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              boxSizing: 'border-box',
            }}
          />
        </>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: '#9ca3af',
            fontSize: '14px',
          }}
        >
          <p>No image connected</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>Connect an image to the expand plugin</p>
        </div>
      )}
    </div>
  );
};

