'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Circle } from 'react-konva';
import Konva from 'konva';
import { ImageUpload } from '@/types/canvas';

interface CanvasProps {
  images?: ImageUpload[];
  onViewportChange?: (center: { x: number; y: number }, scale: number) => void;
  onImageUpdate?: (index: number, updates: Partial<ImageUpload>) => void;
  onImagesDrop?: (files: File[]) => void;
}

// Truly infinite canvas - fixed massive size to support 100+ 8K images
// 8K = 7680x4320 pixels. For 100 images in a 10x10 grid with spacing:
// Width: 10 * 8000 (image + spacing) = 80,000 pixels
// Height: 10 * 4500 (image + spacing) = 45,000 pixels
// Using 1,000,000 x 1,000,000 for truly infinite feel with plenty of room
const INFINITE_CANVAS_SIZE = 1000000; // 1 million pixels - truly infinite canvas

// Canvas pattern configuration - adjust these values to change dot appearance
const DOT_SPACING = 20; // Distance between dots in pixels
const DOT_SIZE = 2; // Size of each dot in pixels
const DOT_OPACITY = 0.90; // Dot darkness (0.0 = invisible, 1.0 = fully black) - adjust this value to make dots darker/lighter

export const Canvas: React.FC<CanvasProps> = ({ images = [], onViewportChange, onImageUpdate, onImagesDrop }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const initializedRef = useRef(false);
  const [patternImage, setPatternImage] = useState<HTMLImageElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1200, height: 800 });
  const [scale, setScale] = useState(1);
  // Center the initial view on the canvas
  const [position, setPosition] = useState({ 
    x: 0, 
    y: 0 
  });
  // Truly infinite canvas - fixed massive size
  const canvasSize = { width: INFINITE_CANVAS_SIZE, height: INFINITE_CANVAS_SIZE };

  // Update viewport size on window resize and center initial view
  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        const newSize = {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        };
        setViewportSize(newSize);
        
        // Center the view on the canvas initially (only once)
        if (!initializedRef.current) {
          initializedRef.current = true;
          const initialPos = {
            x: (newSize.width - canvasSize.width) / 2,
            y: (newSize.height - canvasSize.height) / 2,
          };
          setPosition(initialPos);
          // Update viewport center after initial positioning
          setTimeout(() => updateViewportCenter(initialPos, scale), 0);
        }
      }
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Create canvas pattern
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = DOT_SPACING;
    canvas.height = DOT_SPACING;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, DOT_SPACING, DOT_SPACING);

      // Black dots - opacity controlled by DOT_OPACITY constant
      // Adjust DOT_OPACITY at the top of the file to make dots darker (higher value) or lighter (lower value)
      ctx.fillStyle = `rgba(0, 0, 0, ${DOT_OPACITY})`;
      ctx.beginPath();
      ctx.arc(DOT_SPACING / 2, DOT_SPACING / 2, DOT_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const img = new Image();
    img.onload = () => {
      setPatternImage(img);
    };
    img.src = canvas.toDataURL();

    // Enable WebGL optimization
    try {
      Konva.pixelRatio = window.devicePixelRatio || 1;
    } catch (e) {
      console.warn('WebGL optimization not available');
    }
  }, []);

  // Handle wheel zoom
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - position.x) / oldScale,
        y: (pointer.y - position.y) / oldScale,
      };

      const direction = e.deltaY > 0 ? -1 : 1;
      const scaleBy = 1.1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      setScale(clampedScale);

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      setPosition(newPos);
      // Update viewport center after zoom
      setTimeout(() => updateViewportCenter(newPos, clampedScale), 0);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [scale, position]);

  // Handle drag to pan - only when clicking on stage background
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    const isPanKey = e.evt.button === 1 || e.evt.ctrlKey || e.evt.metaKey;
    
    if (clickedOnEmpty || isPanKey) {
      const stage = e.target.getStage();
      if (stage) {
        stage.draggable(true);
        stage.container().style.cursor = 'grabbing';
      }
    } else {
      // If clicking on an image, disable stage dragging
      const stage = e.target.getStage();
      if (stage) {
        stage.draggable(false);
      }
    }
  };

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      stage.container().style.cursor = 'grab';
    }
  };

  const handleStageDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      setPosition({
        x: stage.x(),
        y: stage.y(),
      });
    }
  };

  const handleStageDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      const newPos = {
        x: stage.x(),
        y: stage.y(),
      };
      setPosition(newPos);
      updateViewportCenter(newPos, scale);
    }
  };

  // Calculate and expose viewport center
  const updateViewportCenter = (pos: { x: number; y: number }, currentScale: number) => {
    if (onViewportChange && stageRef.current) {
      // Calculate the center of the viewport in canvas coordinates
      // Formula: canvasX = (screenX - stageX) / scale
      const centerX = (viewportSize.width / 2 - pos.x) / currentScale;
      const centerY = (viewportSize.height / 2 - pos.y) / currentScale;
      onViewportChange({ x: centerX, y: centerY }, currentScale);
    }
  };

  // Update viewport center when scale or position changes
  useEffect(() => {
    // Update if we have initialized and have a callback
    if (initializedRef.current && onViewportChange) {
      updateViewportCenter(position, scale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.x, position.y, scale, viewportSize.width, viewportSize.height, onViewportChange]);

  // Canvas is truly infinite - no need to expand, it's already massive
  // Fixed at 1,000,000 x 1,000,000 pixels - can handle 100+ 8K images easily

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = '';
    }

    const files = Array.from(e.dataTransfer.files).filter((file) => {
      const fileName = file.name.toLowerCase();
      const fileType = file.type.toLowerCase();
      
      // Check by MIME type
      if (fileType.startsWith('image/')) {
        return true;
      }
      
      // Check by file extension (for TIF files that might not have proper MIME type)
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tif', '.tiff'];
      return imageExtensions.some(ext => fileName.endsWith(ext));
    });

    if (files.length > 0 && onImagesDrop) {
      onImagesDrop(files);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-100 overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={viewportSize.width}
        height={viewportSize.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={false}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
        onDragMove={handleStageDragMove}
        onDragEnd={handleStageDragEnd}
        style={{ cursor: 'grab' }}
      >
        <Layer ref={layerRef}>
          {/* Infinite canvas pattern background */}
          {patternImage && (
            <Rect
              x={0}
              y={0}
              width={canvasSize.width}
              height={canvasSize.height}
              fillPatternImage={patternImage}
              fillPatternRepeat="repeat"
            />
          )}
          {/* Images */}
          {images.map((imageData, index) => (
            <CanvasImage 
              key={`${imageData.url}-${index}`} 
              imageData={imageData}
              index={index}
              onUpdate={(updates) => onImageUpdate?.(index, updates)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

// Resize handle component
const ResizeHandle: React.FC<{
  x: number;
  y: number;
  onDragEnd: (newX: number, newY: number) => void;
}> = ({ x, y, onDragEnd }) => {
  const handleRef = useRef<Konva.Circle>(null);

  return (
    <Circle
      ref={handleRef}
      x={x}
      y={y}
      radius={10}
      fill="#3b82f6"
      stroke="#1e40af"
      strokeWidth={2}
      draggable
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        onDragEnd(node.x(), node.y());
      }}
      onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = 'nwse-resize';
        }
      }}
      onMouseLeave={(e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = 'default';
        }
      }}
    />
  );
};

// Separate component for image rendering with resize handles
const CanvasImage: React.FC<{ 
  imageData: ImageUpload;
  index: number;
  onUpdate?: (updates: Partial<ImageUpload>) => void;
}> = ({ imageData, index, onUpdate }) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const imageRef = useRef<Konva.Image>(null);
  const originalAspectRatio = useRef<number>(1);

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageData.url;
    image.onload = () => {
      setImg(image);
      originalAspectRatio.current = image.width / image.height;
    };
    return () => {
      URL.revokeObjectURL(imageData.url);
    };
  }, [imageData.url]);

  if (!img) return null;

  const x = imageData.x || 50;
  const y = imageData.y || 50;
  const width = imageData.width || img.width;
  const height = imageData.height || img.height;

  // Calculate corner positions
  const corners = {
    topLeft: { x, y },
    topRight: { x: x + width, y },
    bottomLeft: { x, y: y + height },
    bottomRight: { x: x + width, y: y + height },
  };

  const handleCornerDrag = (corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight', newX: number, newY: number) => {
    if (!onUpdate) return;

    let newXPos = x;
    let newYPos = y;
    let newWidth = width;
    let newHeight = height;

    switch (corner) {
      case 'topLeft':
        newXPos = newX;
        newYPos = newY;
        newWidth = width + (x - newX);
        newHeight = height + (y - newY);
        break;
      case 'topRight':
        newYPos = newY;
        newWidth = newX - x;
        newHeight = height + (y - newY);
        break;
      case 'bottomLeft':
        newXPos = newX;
        newWidth = width + (x - newX);
        newHeight = newY - y;
        break;
      case 'bottomRight':
        newWidth = newX - x;
        newHeight = newY - y;
        break;
    }

    // Maintain minimum size
    if (newWidth < 20) newWidth = 20;
    if (newHeight < 20) newHeight = 20;

    onUpdate({
      x: newXPos,
      y: newYPos,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleImageDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onUpdate?.({
      x: node.x(),
      y: node.y(),
    });
  };

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={img}
        x={x}
        y={y}
        width={width}
        height={height}
        draggable
        onDragEnd={handleImageDragEnd}
        onClick={(e) => {
          e.cancelBubble = true;
          setIsSelected(true);
        }}
        stroke={isSelected ? '#3b82f6' : undefined}
        strokeWidth={isSelected ? 2 : 0}
      />
      {isSelected && (
        <>
          <ResizeHandle
            x={corners.topLeft.x}
            y={corners.topLeft.y}
            onDragEnd={(newX, newY) => handleCornerDrag('topLeft', newX, newY)}
          />
          <ResizeHandle
            x={corners.topRight.x}
            y={corners.topRight.y}
            onDragEnd={(newX, newY) => handleCornerDrag('topRight', newX, newY)}
          />
          <ResizeHandle
            x={corners.bottomLeft.x}
            y={corners.bottomLeft.y}
            onDragEnd={(newX, newY) => handleCornerDrag('bottomLeft', newX, newY)}
          />
          <ResizeHandle
            x={corners.bottomRight.x}
            y={corners.bottomRight.y}
            onDragEnd={(newX, newY) => handleCornerDrag('bottomRight', newX, newY)}
          />
        </>
      )}
    </>
  );
};

