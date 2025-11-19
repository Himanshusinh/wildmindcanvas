'use client';

import { useEffect, useRef, useState } from 'react';
import { Group, Rect, Text, Image as KonvaImage, Circle, Path } from 'react-konva';
import Konva from 'konva';
import { ImageUpload } from '@/types/canvas';
import { buildProxyResourceUrl } from '@/lib/proxyUtils';

interface CanvasImageProps {
  imageData: ImageUpload;
  index: number;
  onUpdate?: (updates: Partial<ImageUpload>) => void;
  onSelect?: (e?: { ctrlKey?: boolean; metaKey?: boolean }) => void;
  isSelected?: boolean;
  onDelete?: () => void;
}

export const CanvasImage: React.FC<CanvasImageProps> = ({ 
  imageData, 
  index, 
  onUpdate, 
  onSelect, 
  isSelected: externalIsSelected, 
  onDelete
}) => {
  const [img, setImg] = useState<HTMLImageElement | HTMLVideoElement | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const isSelectedState = externalIsSelected !== undefined ? externalIsSelected : isSelected;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const imageRef = useRef<Konva.Image>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animRef = useRef<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpdateRef = useRef<number | null>(null);
  const wasPlayingBeforeDrag = useRef(false);
  const originalAspectRatio = useRef<number>(1);
  const dragRafRef = useRef<number | null>(null);
  const transformRafRef = useRef<number | null>(null);
  const groupRef = useRef<Konva.Group>(null);
  const dragPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isVideo = imageData.type === 'video';

  // Don't render if no URL (text elements don't have URLs)
  if (!imageData.url) return null;

  // Use proxy URL for Zata URLs to avoid CORS issues
  const getImageUrl = (originalUrl: string): string => {
    // For blob URLs, use directly
    if (originalUrl.startsWith('blob:')) {
      return originalUrl;
    }
    // For Zata URLs, use proxy route
    if (originalUrl.includes('zata.ai') || originalUrl.includes('zata')) {
      return buildProxyResourceUrl(originalUrl);
    }
    // For other URLs, use directly
    return originalUrl;
  };

  const url = getImageUrl(imageData.url); // Type narrowing

  useEffect(() => {
    
    if (isVideo) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = url;
      video.muted = false;
      video.loop = false;
      video.playsInline = true;
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Ensure video is paused and at first frame
        video.pause();
        video.currentTime = 0;
        setImg(video);
        originalAspectRatio.current = video.videoWidth / video.videoHeight;
        setDuration(video.duration || 0);
        videoRef.current = video;
        
        // Force initial frame display after a small delay to ensure video is ready
        setTimeout(() => {
          if (videoRef.current && imageRef.current) {
            videoRef.current.currentTime = 0;
            imageRef.current.getLayer()?.batchDraw();
          }
        }, 100);
      };
      
      // Ensure first frame is loaded and displayed
      video.onloadeddata = () => {
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA
          video.currentTime = 0;
          // Force a frame update
          if (imageRef.current) {
            imageRef.current.getLayer()?.batchDraw();
          }
        }
      };
      
      // When video seeks to first frame, update the display
      video.onseeked = () => {
        if (video.currentTime === 0 && imageRef.current) {
          // Force update to show first frame
          imageRef.current.getLayer()?.batchDraw();
        }
      };
      
      video.onplay = () => setIsPlaying(true);
      video.onpause = () => setIsPlaying(false);
      video.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      video.ontimeupdate = () => {
        if (!isDragging && videoRef.current) {
          // Throttle time updates to prevent excessive re-renders
          if (timeUpdateRef.current) {
            cancelAnimationFrame(timeUpdateRef.current);
          }
          timeUpdateRef.current = requestAnimationFrame(() => {
            if (videoRef.current && !isDragging) {
              setCurrentTime(videoRef.current.currentTime);
            }
          });
        }
      };
      
      return () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.src = '';
        }
        if (timeUpdateRef.current) {
          cancelAnimationFrame(timeUpdateRef.current);
        }
        URL.revokeObjectURL(url);
      };
    } else {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = url;
      image.onload = () => {
        setImg(image);
        originalAspectRatio.current = image.width / image.height;
      };
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [url, isVideo]);

  // Animation loop for video - updates both video frame and progress bar
  useEffect(() => {
    if (isVideo && videoRef.current && imageRef.current) {
      const video = videoRef.current;
      const layer = imageRef.current.getLayer();
      const anim = () => {
        if (video && !video.paused && !video.ended) {
          layer?.batchDraw();
          animRef.current = requestAnimationFrame(anim);
        }
      };
      
      if (isPlaying) {
        anim();
      }
      
      return () => {
        if (animRef.current) {
          cancelAnimationFrame(animRef.current);
        }
      };
    }
  }, [isVideo, isPlaying]);

  // Smooth hover state management to prevent flickering
  const [isMediaHovered, setIsMediaHovered] = useState(false);
  
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
    setIsMediaHovered(true);
  };

  const handleMouseLeave = () => {
    // Small delay to prevent flickering when moving between controls
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setIsMediaHovered(false);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!img) return null;

  // Use drag position if dragging, otherwise use imageData position
  // This prevents the image from snapping back to old position during drag
  const [currentX, setCurrentX] = useState(imageData.x || 50);
  const [currentY, setCurrentY] = useState(imageData.y || 50);
  
  // Sync with imageData when not dragging
  useEffect(() => {
    if (!isDraggingImage) {
      setCurrentX(imageData.x || 50);
      setCurrentY(imageData.y || 50);
    }
  }, [imageData.x, imageData.y, isDraggingImage]);
  
  const x = currentX;
  const y = currentY;
  const getDefaultWidth = () => {
    if (isVideo && img instanceof HTMLVideoElement) {
      return img.videoWidth || 640;
    }
    return (img as HTMLImageElement).width || 640;
  };
  const getDefaultHeight = () => {
    if (isVideo && img instanceof HTMLVideoElement) {
      return img.videoHeight || 360;
    }
    return (img as HTMLImageElement).height || 360;
  };
  const width = imageData.width || getDefaultWidth();
  const height = imageData.height || getDefaultHeight();
  const rotation = imageData.rotation || 0;

  const handlePlayPause = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    if (isVideo && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleProgressClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isVideo || !videoRef.current || !duration) return;
    e.cancelBubble = true;
    
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    
    // Get the absolute position of the progress bar
    const progressBarStartX = x + 40; // Left edge of progress bar (accounting for play button)
    const progressBarWidth = width - 100; // Width of progress bar
    const progressBarEndX = progressBarStartX + progressBarWidth;
    
    // Calculate progress based on click position
    const clickX = pointerPos.x;
    const relativeX = clickX - progressBarStartX;
    const progress = Math.max(0, Math.min(1, relativeX / progressBarWidth));
    
    if (videoRef.current) {
      videoRef.current.currentTime = progress * duration;
      setCurrentTime(progress * duration);
    }
  };

  const handleProgressDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isVideo || !videoRef.current || !duration) return;
    
    const node = e.target;
    const progressBarWidth = width - 100;
    
    // Get the handle's x position relative to the progress bar group
    // Since the handle is now a Group, get its x position
    const handleX = node.x();
    const progress = Math.max(0, Math.min(1, handleX / progressBarWidth));
    const newTime = progress * duration;
    
    if (videoRef.current) {
      // Update video position smoothly during drag
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      // Force layer update for smooth visual feedback
      imageRef.current?.getLayer()?.batchDraw();
    }
  };

  const handleProgressDragStart = () => {
    setIsDragging(true);
    if (videoRef.current) {
      // Remember if video was playing before drag
      wasPlayingBeforeDrag.current = !videoRef.current.paused;
      // Pause video during drag for smoother seeking
      if (wasPlayingBeforeDrag.current) {
        videoRef.current.pause();
      }
    }
  };

  const handleProgressDragEnd = () => {
    setIsDragging(false);
    // Resume playback if it was playing before drag
    if (videoRef.current && wasPlayingBeforeDrag.current) {
      videoRef.current.play();
    }
  };

  // Frame styling constants (matching ImageUploadModal)
  const frameBorderRadius = 16;
  const frameBorderWidth = 2;
  const framePadding = 0; // No padding, image fills the frame
  const frameBackgroundColor = 'rgba(255, 255, 255, 0.95)';
  const frameBorderColor = 'rgba(0, 0, 0, 0.1)';
  const frameShadowBlur = 32;
  const frameShadowOpacity = 0.15;

  return (
    <>
      <Group
        ref={groupRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        draggable={true}
        x={x}
        y={y}
        rotation={rotation}
        onDragStart={(e) => {
          setIsDraggingImage(true);
          // Store initial drag position to prevent snap-back
          const node = e.target as Konva.Group;
          const startX = node.x();
          const startY = node.y();
          dragPositionRef.current = { x: startX, y: startY };
          // Update position immediately to prevent snap-back
          setCurrentX(startX);
          setCurrentY(startY);
        }}
        onDragMove={(e) => {
          // Update drag position ref and state during move
          const node = e.target as Konva.Group;
          const newX = node.x();
          const newY = node.y();
          dragPositionRef.current = { x: newX, y: newY };
          // Update state to prevent snap-back (throttled via RAF)
          if (!dragRafRef.current) {
            dragRafRef.current = requestAnimationFrame(() => {
              dragRafRef.current = null;
              if (isDraggingImage && dragPositionRef.current) {
                setCurrentX(dragPositionRef.current.x);
                setCurrentY(dragPositionRef.current.y);
              }
            });
          }
          // Let Konva handle visual movement
          const layer = (e.target as Konva.Node).getLayer();
          layer?.batchDraw();
        }}
        onDragEnd={(e) => {
          const node = e.target as Konva.Group;
          // Get the final position from the node
          const finalX = node.x();
          const finalY = node.y();
          // Clean up RAF
          if (dragRafRef.current) {
            cancelAnimationFrame(dragRafRef.current);
            dragRafRef.current = null;
          }
          // Clear drag state
          setIsDraggingImage(false);
          dragPositionRef.current = null;
          // Update position immediately to prevent snap-back
          setCurrentX(finalX);
          setCurrentY(finalY);
          // Notify parent of position change
          onUpdate?.({
            x: finalX,
            y: finalY,
          });
        }}
        onTransform={(e) => {
          // Only redraw for smooth feedback; commit sizes on end
          const layer = (e.target as Konva.Node).getLayer();
          layer?.batchDraw();
        }}
        onTransformEnd={(e) => {
          const node = e.target as Konva.Group;
          if (!node) return;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const newWidth = Math.max(5, width * scaleX);
          const newHeight = Math.max(5, height * scaleY);
          const newRotation = node.rotation();
          // Reset scales to keep width/height canonical
          node.scaleX(1);
          node.scaleY(1);
          onUpdate?.({ width: newWidth, height: newHeight, rotation: newRotation });
        }}
        onClick={(e) => {
          e.cancelBubble = true;
          setIsSelected(true);
          if (onSelect) {
            // Pass event info for multi-select support
            onSelect({
              ctrlKey: e.evt.ctrlKey,
              metaKey: e.evt.metaKey,
            });
          }
          // Context menu removed - icons are now shown at top-right corner of image
          // Don't play/pause when showing context menu
          // Video play/pause is handled by the center button on hover
        }}
      >
        {/* Tooltip - Attached to Top, Full Width (for uploaded media) */}
        {isMediaHovered && (
          <Group x={0} y={-28} listening={false}>
            <Rect
              x={0}
              y={0}
              width={width}
              height={28}
              fill="#f0f2f5"
              cornerRadius={[frameBorderRadius, frameBorderRadius, 0, 0]}
              stroke={isSelectedState ? '#60A5FA' : frameBorderColor}
              strokeWidth={isSelectedState ? 4 : frameBorderWidth}
              strokeBottom={false}
            />
            <Text
              x={12}
              y={8}
              text="Media"
              fontSize={12}
              fontFamily="Arial"
              fill="#1f2937"
              fontWeight="600"
              listening={false}
            />
            {/* Resolution display - right aligned */}
            {imageData.originalWidth && imageData.originalHeight && (
              <Text
                x={width -80}
                y={8}
                text={`${imageData.originalWidth} x ${imageData.originalHeight}`}
                fontSize={12}
                fontFamily="Arial"
                fill="#1f2937"
                fontWeight="600"
                align="right"
                listening={false}
              />
            )}
          </Group>
        )}
        {/* Frame Background */}
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={frameBackgroundColor}
          cornerRadius={isMediaHovered ? 0 : frameBorderRadius}
          stroke={isSelectedState ? '#60A5FA' : frameBorderColor}
          strokeWidth={isSelectedState ? 4 : frameBorderWidth}
          shadowBlur={frameShadowBlur}
          shadowOpacity={frameShadowOpacity}
          shadowColor="rgba(0, 0, 0, 1)"
          shadowOffsetY={8}
        />
        
        {/* Image/Video clipped to frame with rounded corners - fills entire frame */}
        <Group
          clipFunc={(ctx) => {
            ctx.beginPath();
            // Create rounded rectangle path matching the frame exactly
            const x = 0;
            const y = 0;
            const w = width;
            const h = height;
            const r = isMediaHovered ? 0 : frameBorderRadius;
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
          }}
        >
          <KonvaImage
            ref={imageRef}
            image={img}
            x={0}
            y={0}
            width={width}
            height={height}
          />
        </Group>
      </Group>
      {/* Video controls overlay - appears on hover */}
      {isVideo && isHovered && (
        <Group 
          x={x} 
          y={y + height - 50}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Controls background */}
          <Rect
            x={0}
            y={0}
            width={width}
            height={50}
            fill="rgba(0, 0, 0, 0.75)"
            cornerRadius={[0, 0, frameBorderRadius, frameBorderRadius]}
            stroke={isSelectedState ? '#60A5FA' : 'transparent'}
            strokeWidth={isSelectedState ? 4 : 0}
            listening={false}
          />
          
          {/* Play/Pause button */}
          <Group
            x={15}
            y={15}
            onClick={handlePlayPause}
            onTap={handlePlayPause}
          >
            <Circle
              radius={12}
              fill="rgba(255, 255, 255, 0.9)"
            />
            {isPlaying ? (
              // Pause icon
              <>
                <Rect x={-5} y={-6} width={3} height={12} fill="rgba(0, 0, 0, 0.9)" cornerRadius={1} />
                <Rect x={2} y={-6} width={3} height={12} fill="rgba(0, 0, 0, 0.9)" cornerRadius={1} />
              </>
            ) : (
              // Play icon
              <Path
                data="M -4 -6 L -4 6 L 6 0 Z"
                fill="rgba(0, 0, 0, 0.9)"
              />
            )}
          </Group>

          {/* Progress bar container */}
          <Group x={40} y={18}>
            {/* Progress bar background - larger clickable area for easier interaction */}
            <Rect
              x={0}
              y={-12}
              width={width - 100}
              height={24}
              fill="transparent"
              onClick={handleProgressClick}
            />
            
            {/* Progress bar background track - larger and more visible */}
            <Rect
              x={0}
              y={-2}
              width={width - 100}
              height={8}
              fill="rgba(255, 255, 255, 0.25)"
              cornerRadius={4}
              listening={false}
            />
            
            {/* Progress bar filled - shows progress */}
            <Rect
              x={0}
              y={-2}
              width={(width - 100) * (duration > 0 ? currentTime / duration : 0)}
              height={8}
              fill="#3b82f6"
              cornerRadius={4}
              listening={false}
            />
            
            {/* Progress bar handle - larger and more visible */}
            <Group
              x={(width - 100) * (duration > 0 ? currentTime / duration : 0)}
              y={2}
              draggable
              dragBoundFunc={(pos) => {
                return {
                  x: Math.max(0, Math.min(width - 100, pos.x)),
                  y: 2,
                };
              }}
              onDragMove={handleProgressDrag}
              onDragEnd={handleProgressDragEnd}
              onDragStart={handleProgressDragStart}
              onClick={(e) => {
                e.cancelBubble = true;
              }}
            >
              {/* Outer circle with shadow for better visibility */}
              <Circle
                radius={10}
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth={3}
                shadowBlur={8}
                shadowColor="rgba(0, 0, 0, 0.5)"
                shadowOffsetX={0}
                shadowOffsetY={2}
              />
              {/* Inner circle for depth */}
              <Circle
                radius={6}
                fill="#3b82f6"
              />
            </Group>
          </Group>

          {/* Time display */}
          <Text
            x={width - 55}
            y={15}
            text={`${formatTime(currentTime)} / ${formatTime(duration)}`}
            fontSize={12}
            fontFamily="Arial"
            fill="rgba(255, 255, 255, 0.9)"
            align="right"
            listening={false}
          />
        </Group>
      )}
      
      {/* Center play/pause button - only show on hover */}
      {isVideo && isHovered && (
        <Group
          x={x + width / 2}
          y={y + height / 2}
          onClick={handlePlayPause}
          onTap={handlePlayPause}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Circle
            radius={30}
            fill="rgba(0, 0, 0, 0.7)"
            shadowBlur={10}
            shadowOpacity={0.5}
          />
          {isPlaying ? (
            // Pause icon
            <>
              <Rect x={-10} y={-10} width={5} height={20} fill="white" cornerRadius={1} />
              <Rect x={5} y={-10} width={5} height={20} fill="white" cornerRadius={1} />
            </>
          ) : (
            // Play icon
            <Path
              data="M -8 -12 L -8 12 L 14 0 Z"
              fill="white"
            />
          )}
        </Group>
      )}
      {/* Resize handles removed - user requested to remove 4 corner dots */}
    </>
  );
};

