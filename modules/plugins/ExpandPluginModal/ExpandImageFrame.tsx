'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { buildProxyResourceUrl } from '@/core/api/proxyUtils';

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
  onImageSizeChange?: (size: { width: number; height: number } | null) => void;
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
  onImageSizeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const imageNodeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // State
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number } | null>(null);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const [isDragMode, setIsDragMode] = useState(false);

  // Refs for click vs drag detection
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const mouseDownTimeRef = useRef<number | null>(null);
  const isClickRef = useRef<boolean>(false);
  const wasDragRef = useRef<boolean>(false);
  const imageStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Load image - use AVIF for preview display (performance)
  const previewImage = sourceImageUrl || localExpandedImageUrl || expandedImageUrl;
  const imageUrl = (() => {
    if (!previewImage) return previewImage;

    // Check if it's a Zata URL (direct or proxy)
    const isZataUrl = previewImage.includes('zata.ai') ||
      previewImage.includes('zata') ||
      previewImage.includes('/api/proxy/') ||
      previewImage.includes('users%2F') ||
      previewImage.includes('canvas%2F');

    if (isZataUrl && !previewImage.includes('fmt=avif')) {
      const { buildProxyThumbnailUrl } = require('@/core/api/proxyUtils');
      return buildProxyThumbnailUrl(previewImage, 2048, 85, 'avif');
    }
    return previewImage;
  })();

  const [img] = useImage(imageUrl || '', 'anonymous');

  // Initialize image size when loaded
  useEffect(() => {
    if (img && !imageSize) {
      const newSize = { width: img.naturalWidth, height: img.naturalHeight };
      setImageSize(newSize);
      if (onImageSizeChange) {
        onImageSizeChange(newSize);
      }
    }
  }, [img, imageSize, onImageSizeChange]);

  // Report image size changes
  useEffect(() => {
    if (onImageSizeChange) {
      onImageSizeChange(imageSize);
    }
  }, [imageSize, onImageSizeChange]);

  // Calculate frame bounds
  const getFrameBounds = useCallback(() => {
    let frameWidth = 1024;
    let frameHeight = 1024;

    if (aspectPreset === 'custom') {
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
        const maxSize = 5000;
        if (preset.width > maxSize || preset.height > maxSize) {
          const scale = Math.min(maxSize / preset.width, maxSize / preset.height);
          frameWidth = preset.width * scale;
          frameHeight = preset.height * scale;
        } else {
          frameWidth = preset.width;
          frameHeight = preset.height;
        }
      }
    }

    const frameX = 2500 - frameWidth / 2;
    const frameY = 2500 - frameHeight / 2;

    return { x: frameX, y: frameY, width: frameWidth, height: frameHeight };
  }, [aspectPreset, aspectPresets, customWidth, customHeight]);

  const frameBounds = useMemo(() => getFrameBounds(), [getFrameBounds]);

  // Constrain image position to ensure it stays completely within frame boundaries
  const constrainImagePosition = useCallback((x: number, y: number, imgWidth: number, imgHeight: number) => {
    const frameX = frameBounds.x;
    const frameY = frameBounds.y;
    const frameWidth = frameBounds.width;
    const frameHeight = frameBounds.height;

    // Calculate image bounds
    const imgLeft = x;
    const imgRight = x + imgWidth;
    const imgTop = y;
    const imgBottom = y + imgHeight;

    // Constrain X: image must stay within frame horizontally
    // Left edge cannot go left of frame left edge
    // Right edge cannot go right of frame right edge
    let constrainedX = x;
    if (imgLeft < frameX) {
      // Image left edge is outside frame left edge, move it so left edge aligns with frame left edge
      constrainedX = frameX;
    } else if (imgRight > frameX + frameWidth) {
      // Image right edge is outside frame right edge, move it so right edge aligns with frame right edge
      constrainedX = frameX + frameWidth - imgWidth;
    }

    // Constrain Y: image must stay within frame vertically
    // Top edge cannot go above frame top edge
    // Bottom edge cannot go below frame bottom edge
    let constrainedY = y;
    if (imgTop < frameY) {
      // Image top edge is outside frame top edge, move it so top edge aligns with frame top edge
      constrainedY = frameY;
    } else if (imgBottom > frameY + frameHeight) {
      // Image bottom edge is outside frame bottom edge, move it so bottom edge aligns with frame bottom edge
      constrainedY = frameY + frameHeight - imgHeight;
    }

    return { x: constrainedX, y: constrainedY };
  }, [frameBounds]);

  // Initialize image position centered in frame
  useEffect(() => {
    if (img && !imagePosition) {
      let newX = frameBounds.x + (frameBounds.width - img.naturalWidth) / 2;
      let newY = frameBounds.y + (frameBounds.height - img.naturalHeight) / 2;

      // Constrain initial position to ensure image stays within frame
      const constrained = constrainImagePosition(newX, newY, img.naturalWidth, img.naturalHeight);
      newX = constrained.x;
      newY = constrained.y;

      setImagePosition({ x: newX, y: newY });
    }
  }, [img, imagePosition, frameBounds, constrainImagePosition]);

  // Reset position when aspect preset changes
  const lastAspectPresetRef = useRef<string>(aspectPreset);
  useEffect(() => {
    if (lastAspectPresetRef.current !== aspectPreset && img) {
      let newX = frameBounds.x + (frameBounds.width - img.naturalWidth) / 2;
      let newY = frameBounds.y + (frameBounds.height - img.naturalHeight) / 2;

      // Constrain position to ensure image stays within frame
      const constrained = constrainImagePosition(newX, newY, img.naturalWidth, img.naturalHeight);
      newX = constrained.x;
      newY = constrained.y;

      setImagePosition({ x: newX, y: newY });
      lastAspectPresetRef.current = aspectPreset;
    }
  }, [aspectPreset, img, frameBounds, constrainImagePosition]);

  // Update Transformer
  useEffect(() => {
    if (isSelected && transformerRef.current && imageNodeRef.current) {
      transformerRef.current.nodes([imageNodeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Container resize observer
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

    return () => resizeObserver.disconnect();
  }, []);

  // Fit frame to screen
  const fitFrameToScreen = useCallback(() => {
    if (!containerSize) return;

    const padding = 40;
    const availableWidth = containerSize.width - (padding * 2);
    const availableHeight = containerSize.height - (padding * 2);

    const zoomX = availableWidth / frameBounds.width;
    const zoomY = availableHeight / frameBounds.height;
    const newZoom = Math.min(zoomX, zoomY, 1);

    const frameCenterX = frameBounds.x + frameBounds.width / 2;
    const frameCenterY = frameBounds.y + frameBounds.height / 2;

    const containerCenterX = containerSize.width / 2;
    const containerCenterY = containerSize.height / 2;

    const newPanX = containerCenterX - (frameCenterX * newZoom);
    const newPanY = containerCenterY - (frameCenterY * newZoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [containerSize, frameBounds]);

  // Auto-zoom on change
  useEffect(() => {
    fitFrameToScreen();
  }, [fitFrameToScreen]);

  // Zoom/Pan Handlers
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    // Limit zoom
    const clampedScale = Math.max(0.05, Math.min(newScale, 5));

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setZoom(clampedScale);
    setPan(newPos);
  };

  // Report Frame Info
  // Store callback in ref to prevent infinite loops
  const onFrameInfoChangeRef = useRef(onFrameInfoChange);
  useEffect(() => {
    onFrameInfoChangeRef.current = onFrameInfoChange;
  }, [onFrameInfoChange]);

  const frameInfoRef = useRef<{
    canvasSize: [number, number];
    originalImageSize: [number, number];
    originalImageLocation: [number, number];
    aspectRatio?: string;
  } | null>(null);

  useEffect(() => {
    if (!onFrameInfoChangeRef.current) return;

    if (!img || !imagePosition || !imageSize) {
      if (frameInfoRef.current !== null) {
        frameInfoRef.current = null;
        onFrameInfoChangeRef.current(null);
      }
      return;
    }

    const canvasSize: [number, number] = [Math.round(frameBounds.width), Math.round(frameBounds.height)];
    const originalImageSize: [number, number] = [imageSize.width, imageSize.height];

    // Calculate relative position (accounting for rotation is complex for the API, 
    // usually APIs expect unrotated bounding box or top-left. 
    // For now, we pass the top-left of the image node relative to frame)
    let relativeX = Math.round(imagePosition.x - frameBounds.x);
    let relativeY = Math.round(imagePosition.y - frameBounds.y);

    // Note: If image is rotated, the "location" might need to be the top-left of the bounding box
    // or the center. The current API likely expects standard top-left.
    // We will pass the current x/y which is top-left of the image (before rotation if centered, 
    // but Konva handles x/y as the anchor point).

    const newFrameInfo = {
      canvasSize,
      originalImageSize,
      originalImageLocation: [relativeX, relativeY] as [number, number],
      aspectRatio: aspectPreset !== 'custom' ? aspectPreset : undefined,
    };

    // Simple diff check
    const prev = frameInfoRef.current;
    if (!prev || JSON.stringify(prev) !== JSON.stringify(newFrameInfo)) {
      frameInfoRef.current = newFrameInfo;
      onFrameInfoChangeRef.current(newFrameInfo);
    }
  }, [img, imagePosition, imageSize, frameBounds, aspectPreset]);


  return (
    <div
      ref={containerRef}
      data-expand-canvas-container
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#121212',
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <Stage
        ref={stageRef}
        width={containerSize?.width || 800}
        height={containerSize?.height || 600}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        onWheel={handleWheel}
        // draggable={false} // Stage is NOT draggable (static background)
        onMouseDown={(e) => {
          // Deselect if clicked on stage or background rect
          const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background-rect';
          if (clickedOnEmpty) {
            setIsSelected(false);
            // Reset drag tracking if clicking on empty space
            mouseDownPosRef.current = null;
            mouseDownTimeRef.current = null;
            imageStartPosRef.current = null;
            isClickRef.current = false;
            wasDragRef.current = false;
            setIsDragMode(false);
          }
        }}
        onMouseMove={(e) => {
          // Handle drag detection and manual dragging at stage level
          if (mouseDownPosRef.current && imageNodeRef.current) {
            const stage = e.target.getStage();
            if (!stage) return;

            const pointerPos = stage.getPointerPosition();
            if (!pointerPos) return;

            // Convert current pointer position to stage coordinates
            const currentStageX = (pointerPos.x - pan.x) / zoom;
            const currentStageY = (pointerPos.y - pan.y) / zoom;

            // If already in drag mode, manually update image position
            if (isDragMode && imageStartPosRef.current) {
              // Calculate delta from initial mouse position (in stage coordinates)
              const deltaX = currentStageX - mouseDownPosRef.current.x;
              const deltaY = currentStageY - mouseDownPosRef.current.y;

              // Calculate new position
              let newX = imageStartPosRef.current.x + deltaX;
              let newY = imageStartPosRef.current.y + deltaY;

              // Constrain position to ensure image always overlaps with frame
              const node = imageNodeRef.current;
              if (node && imageSize) {
                const constrained = constrainImagePosition(newX, newY, imageSize.width, imageSize.height);
                newX = constrained.x;
                newY = constrained.y;

                node.x(newX);
                node.y(newY);
                node.getLayer()?.batchDraw();
              }

              return;
            }

            // Detect if it's a drag (only if still in click mode)
            if (isClickRef.current) {
              // Calculate distance moved (in stage coordinates)
              const dx = currentStageX - mouseDownPosRef.current.x;
              const dy = currentStageY - mouseDownPosRef.current.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              // If moved more than 5 pixels, it's a drag
              if (distance > 5) {
                isClickRef.current = false;
                wasDragRef.current = true;
                setIsDragMode(true);
                setIsSelected(false); // Hide transformer during drag
                setIsDragging(true);

                const container = stage.container();
                if (container) container.style.cursor = 'move';
              }
            }
          }
        }}
        onMouseUp={(e) => {
          // Handle mouse up at stage level - only if we were tracking an image interaction
          if (mouseDownPosRef.current && imageNodeRef.current) {
            // If it was a click (not a drag), show transformer
            if (isClickRef.current && mouseDownTimeRef.current) {
              const clickDuration = Date.now() - mouseDownTimeRef.current;
              // Only treat as click if it was quick (< 300ms) and no significant movement
              if (clickDuration < 300) {
                setIsSelected(true);
                setIsDragMode(false);
              }
            }

            // Reset drag mode if we were dragging
            if (isDragMode) {
              setIsDragMode(false);
              setIsDragging(false);

              // Update position from node and ensure it's constrained
              const node = imageNodeRef.current;
              if (node && imageSize) {
                let finalX = node.x();
                let finalY = node.y();

                // Apply constraint to final position
                const constrained = constrainImagePosition(finalX, finalY, imageSize.width, imageSize.height);
                finalX = constrained.x;
                finalY = constrained.y;

                // Update node position if it was constrained
                if (finalX !== node.x() || finalY !== node.y()) {
                  node.x(finalX);
                  node.y(finalY);
                  node.getLayer()?.batchDraw();
                }

                setImagePosition({ x: finalX, y: finalY });
              } else if (node) {
                setImagePosition({ x: node.x(), y: node.y() });
              }
            }

            const wasDrag = wasDragRef.current;
            mouseDownPosRef.current = null;
            mouseDownTimeRef.current = null;
            imageStartPosRef.current = null;
            isClickRef.current = false;
            wasDragRef.current = false;

            const container = e.target.getStage()?.container();
            if (container) container.style.cursor = 'default';

            // Prevent click event if it was a drag
            if (wasDrag) {
              e.evt.preventDefault();
              e.evt.stopPropagation();
            }
          }
        }}
      >
        <Layer>
          {/* Background Area (5000x5000) */}
          <Rect
            name="background-rect"
            x={0}
            y={0}
            width={5000}
            height={5000}
            fill="#121212"
          />

          {/* White Frame */}
          <Rect
            x={frameBounds.x}
            y={frameBounds.y}
            width={frameBounds.width}
            height={frameBounds.height}
            fill="#ffffff"
            stroke="#1daa63"
            strokeWidth={2}
          />

          {/* Image */}
          {img && (
            <KonvaImage
              ref={imageNodeRef}
              image={img}
              x={imagePosition?.x || 0}
              y={imagePosition?.y || 0}
              width={imageSize?.width || 100}
              height={imageSize?.height || 100}
              rotation={imageRotation}
              draggable={false}
              onMouseEnter={(e) => {
                setIsHoveringImage(true);
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = isDragMode ? 'move' : 'default';
              }}
              onMouseLeave={(e) => {
                setIsHoveringImage(false);
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'default';
              }}
              onMouseDown={(e) => {
                const stage = e.target.getStage();
                if (!stage) return;

                const pointerPos = stage.getPointerPosition();
                if (pointerPos) {
                  // Store position in stage coordinates (accounting for zoom and pan)
                  mouseDownPosRef.current = {
                    x: (pointerPos.x - pan.x) / zoom,
                    y: (pointerPos.y - pan.y) / zoom,
                  };
                  mouseDownTimeRef.current = Date.now();
                  isClickRef.current = true;
                  wasDragRef.current = false;

                  // Store initial image position
                  const node = imageNodeRef.current;
                  if (node) {
                    imageStartPosRef.current = { x: node.x(), y: node.y() };
                  }
                }
                e.cancelBubble = true;
              }}
              onClick={(e) => {
                // Only handle click if it wasn't a drag
                if (!wasDragRef.current && !isDragMode) {
                  setIsSelected(true);
                  e.cancelBubble = true;
                }
              }}
              onTap={(e) => {
                setIsSelected(true);
                e.cancelBubble = true;
              }}
              onTransformEnd={(e) => {
                const node = imageNodeRef.current;
                if (!node) return;

                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                // Reset scale and update width/height
                node.scaleX(1);
                node.scaleY(1);

                const newWidth = Math.max(5, node.width() * scaleX);
                const newHeight = Math.max(5, node.height() * scaleY);

                // Constrain size to frame if image is larger than frame
                const constrainedWidth = Math.min(newWidth, frameBounds.width);
                const constrainedHeight = Math.min(newHeight, frameBounds.height);

                setImageSize({ width: constrainedWidth, height: constrainedHeight });
                setImageRotation(node.rotation());

                // Constrain position to ensure image stays within frame
                let finalX = node.x();
                let finalY = node.y();
                const constrained = constrainImagePosition(finalX, finalY, constrainedWidth, constrainedHeight);
                finalX = constrained.x;
                finalY = constrained.y;

                node.x(finalX);
                node.y(finalY);
                setImagePosition({ x: finalX, y: finalY });
              }}
            />
          )}

          {/* Transformer */}
          {isSelected && !isDragging && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit minimum size
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }

                // Constrain to frame boundaries
                const frameX = frameBounds.x;
                const frameY = frameBounds.y;
                const frameWidth = frameBounds.width;
                const frameHeight = frameBounds.height;

                // Ensure the transformed box stays within frame
                let constrainedBox = { ...newBox };

                // Constrain X position
                if (constrainedBox.x < frameX) {
                  constrainedBox.x = frameX;
                } else if (constrainedBox.x + constrainedBox.width > frameX + frameWidth) {
                  constrainedBox.x = frameX + frameWidth - constrainedBox.width;
                }

                // Constrain Y position
                if (constrainedBox.y < frameY) {
                  constrainedBox.y = frameY;
                } else if (constrainedBox.y + constrainedBox.height > frameY + frameHeight) {
                  constrainedBox.y = frameY + frameHeight - constrainedBox.height;
                }

                // Constrain width if it would exceed frame
                if (constrainedBox.x + constrainedBox.width > frameX + frameWidth) {
                  constrainedBox.width = frameX + frameWidth - constrainedBox.x;
                }

                // Constrain height if it would exceed frame
                if (constrainedBox.y + constrainedBox.height > frameY + frameHeight) {
                  constrainedBox.height = frameY + frameHeight - constrainedBox.y;
                }

                return constrainedBox;
              }}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};



