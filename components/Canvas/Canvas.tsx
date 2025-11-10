'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Group, Path, Text, Line } from 'react-konva';
import Konva from 'konva';
import { ImageUpload } from '@/types/canvas';
import { Model3DOverlay } from './Model3DOverlay';
import { TextInput } from '@/components/TextInput';
import { ImageUploadModal } from '@/components/ImageUploadModal';
import { VideoUploadModal } from '@/components/VideoUploadModal';
import { MusicUploadModal } from '@/components/MusicUploadModal';
import { ContextMenu } from '@/components/ContextMenu';

interface CanvasProps {
  images?: ImageUpload[];
  onViewportChange?: (center: { x: number; y: number }, scale: number) => void;
  onImageUpdate?: (index: number, updates: Partial<ImageUpload>) => void;
  onImageDelete?: (index: number) => void;
  onImageDownload?: (index: number) => void;
  onImageDuplicate?: (index: number) => void;
  onImagesDrop?: (files: File[]) => void;
  selectedTool?: 'cursor' | 'text' | 'image' | 'video' | 'music';
  onTextCreate?: (text: string, x: number, y: number) => void;
  toolClickCounter?: number;
  isImageModalOpen?: boolean;
  onImageModalClose?: () => void;
  onImageSelect?: (file: File) => void;
  onImageGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => void;
  generatedImageUrl?: string | null;
  isVideoModalOpen?: boolean;
  onVideoModalClose?: () => void;
  onVideoSelect?: (file: File) => void;
  onVideoGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => void;
  generatedVideoUrl?: string | null;
  isMusicModalOpen?: boolean;
  onMusicModalClose?: () => void;
  onMusicSelect?: (file: File) => void;
  onMusicGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => void;
  generatedMusicUrl?: string | null;
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

export const Canvas: React.FC<CanvasProps> = ({ 
  images = [], 
  onViewportChange, 
  onImageUpdate,
  onImageDelete,
  onImageDownload,
  onImageDuplicate,
  onImagesDrop,
  selectedTool,
  onTextCreate,
  toolClickCounter = 0,
  isImageModalOpen = false,
  onImageModalClose,
  onImageSelect,
  onImageGenerate,
  generatedImageUrl,
  isVideoModalOpen = false,
  onVideoModalClose,
  onVideoSelect,
  onVideoGenerate,
  generatedVideoUrl,
  isMusicModalOpen = false,
  onMusicModalClose,
  onMusicSelect,
  onMusicGenerate,
  generatedMusicUrl,
}) => {
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
  const [textInputStates, setTextInputStates] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [imageModalStates, setImageModalStates] = useState<Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>>([]);
  const [videoModalStates, setVideoModalStates] = useState<Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null }>>([]);
  const [musicModalStates, setMusicModalStates] = useState<Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null }>>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedTextInputId, setSelectedTextInputId] = useState<string | null>(null);
  const [selectedImageModalId, setSelectedImageModalId] = useState<string | null>(null);
  const [selectedVideoModalId, setSelectedVideoModalId] = useState<string | null>(null);
  const [selectedMusicModalId, setSelectedMusicModalId] = useState<string | null>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuImageIndex, setContextMenuImageIndex] = useState<number | null>(null);
  const [contextMenuModalId, setContextMenuModalId] = useState<string | null>(null);
  const [contextMenuModalType, setContextMenuModalType] = useState<'image' | 'video' | 'music' | null>(null);
  const prevSelectedToolRef = useRef<'cursor' | 'text' | 'image' | 'video' | 'music' | undefined>(undefined);
  // Truly infinite canvas - fixed massive size
  const canvasSize = { width: INFINITE_CANVAS_SIZE, height: INFINITE_CANVAS_SIZE };

  // Automatically create text input at center when text tool is selected
  useEffect(() => {
    if (selectedTool === 'text') {
      // Always create a new text input at center when text tool is selected
      // Calculate center of viewport in canvas coordinates
      const centerX = (viewportSize.width / 2 - position.x) / scale;
      const centerY = (viewportSize.height / 2 - position.y) / scale;
      const newId = `text-${Date.now()}-${Math.random()}`;
      setTextInputStates(prev => [...prev, { id: newId, x: centerX, y: centerY }]);
    }
    prevSelectedToolRef.current = selectedTool;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, toolClickCounter]);

  // Automatically create image modal at center when image tool is selected
  useEffect(() => {
    if (selectedTool === 'image' && isImageModalOpen) {
      // Calculate center of viewport in canvas coordinates
      const centerX = (viewportSize.width / 2 - position.x) / scale;
      const centerY = (viewportSize.height / 2 - position.y) / scale;
      const newId = `image-${Date.now()}-${Math.random()}`;
      setImageModalStates(prev => [...prev, { id: newId, x: centerX, y: centerY, generatedImageUrl: null }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, isImageModalOpen, toolClickCounter]);

  // Automatically create video modal at center when video tool is selected
  useEffect(() => {
    if (selectedTool === 'video' && isVideoModalOpen) {
      // Calculate center of viewport in canvas coordinates
      const centerX = (viewportSize.width / 2 - position.x) / scale;
      const centerY = (viewportSize.height / 2 - position.y) / scale;
      const newId = `video-${Date.now()}-${Math.random()}`;
      setVideoModalStates(prev => [...prev, { id: newId, x: centerX, y: centerY, generatedVideoUrl: null }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, isVideoModalOpen, toolClickCounter]);

  // Automatically create music modal at center when music tool is selected
  useEffect(() => {
    if (selectedTool === 'music' && isMusicModalOpen) {
      // Calculate center of viewport in canvas coordinates
      const centerX = (viewportSize.width / 2 - position.x) / scale;
      const centerY = (viewportSize.height / 2 - position.y) / scale;
      const newId = `music-${Date.now()}-${Math.random()}`;
      setMusicModalStates(prev => [...prev, { id: newId, x: centerX, y: centerY, generatedMusicUrl: null }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, isMusicModalOpen, toolClickCounter]);

  // Sync generatedImageUrl prop to the most recently created image modal
  useEffect(() => {
    if (generatedImageUrl && imageModalStates.length > 0) {
      // Update the last image modal with the generated URL
      setImageModalStates(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            generatedImageUrl,
          };
        }
        return updated;
      });
    }
  }, [generatedImageUrl, imageModalStates.length]);

  // Sync generatedVideoUrl prop to the most recently created video modal
  useEffect(() => {
    if (generatedVideoUrl && videoModalStates.length > 0) {
      // Update the last video modal with the generated URL
      setVideoModalStates(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            generatedVideoUrl,
          };
        }
        return updated;
      });
    }
  }, [generatedVideoUrl, videoModalStates.length]);

  // Sync generatedMusicUrl prop to the most recently created music modal
  useEffect(() => {
    if (generatedMusicUrl && musicModalStates.length > 0) {
      // Update the last music modal with the generated URL
      setMusicModalStates(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            generatedMusicUrl,
          };
        }
        return updated;
      });
    }
  }, [generatedMusicUrl, musicModalStates.length]);

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

  // Track if space key is pressed for panning
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingFromElement, setIsDraggingFromElement] = useState(false);

  // Listen for space key for panning and Delete/Backspace for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
        const stage = stageRef.current;
        if (stage) {
          stage.container().style.cursor = 'grab';
        }
      }
      
      // Handle Delete/Backspace key for deletion (works on both Windows and Mac)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.repeat) {
        // Prevent default browser behavior (like going back in history)
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          // Don't delete if user is typing in an input field
          return;
        }
        
        e.preventDefault();
        
        // Delete selected image/video/text element
        if (selectedImageIndex !== null && onImageDelete) {
          onImageDelete(selectedImageIndex);
          setSelectedImageIndex(null);
        }
        
        // Delete selected text input overlay
        if (selectedTextInputId !== null) {
          setTextInputStates(prev => prev.filter(t => t.id !== selectedTextInputId));
          setSelectedTextInputId(null);
        }
        
        // Delete selected image modal
        if (selectedImageModalId !== null) {
          setImageModalStates(prev => prev.filter(m => m.id !== selectedImageModalId));
          setSelectedImageModalId(null);
        }
        
        // Delete selected video modal
        if (selectedVideoModalId !== null) {
          setVideoModalStates(prev => prev.filter(m => m.id !== selectedVideoModalId));
          setSelectedVideoModalId(null);
        }
        
        // Delete selected music modal
        if (selectedMusicModalId !== null) {
          setMusicModalStates(prev => prev.filter(m => m.id !== selectedMusicModalId));
          setSelectedMusicModalId(null);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        const stage = stageRef.current;
        if (stage && !isPanning) {
          stage.container().style.cursor = selectedTool === 'text' ? 'text' : 'grab';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedTool, isPanning, selectedImageIndex, selectedTextInputId, selectedImageModalId, selectedVideoModalId, selectedMusicModalId, onImageDelete]);

  // Handle drag to pan - enhanced for better navigation
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const target = e.target;
    const stage = target.getStage();
    const clickedOnEmpty = target === stage || target.getClassName() === 'Stage' || target.getClassName() === 'Layer' || target.getClassName() === 'Rect';
    const isPanKey = e.evt.button === 1 || e.evt.ctrlKey || e.evt.metaKey || isSpacePressed;
    const isCursorTool = selectedTool === 'cursor';
    const clickedOnElement = !clickedOnEmpty;
    
    // Check if clicking on a resize handle - if so, don't clear selection
    // Resize handles have a name attribute "resize-handle"
    const isResizeHandle = target.name() === 'resize-handle';
    
    // Clear selections when clicking on empty space (but not on resize handles or the background pattern)
    // Also exclude the background Rect pattern (which is the canvas pattern - very large Rect)
    const targetClassName = target.getClassName();
    const isBackgroundPattern = targetClassName === 'Rect' && 
      (target as Konva.Rect).width() > 100000; // Background pattern is the full canvas size
    if (clickedOnEmpty && !isResizeHandle && !isBackgroundPattern) {
      setSelectedImageIndex(null);
      setSelectedTextInputId(null);
      setSelectedImageModalId(null);
      setSelectedVideoModalId(null);
      setSelectedMusicModalId(null);
      setContextMenuOpen(false);
      setContextMenuImageIndex(null);
      setContextMenuModalId(null);
      setContextMenuModalType(null);
    }
    
    // Store mouse down position to detect drag vs click
    const pointerPos = e.target.getStage()?.getPointerPosition();
    if (pointerPos) {
      setMouseDownPos({ x: pointerPos.x, y: pointerPos.y });
    }
    
    // If text tool is selected and clicking on empty space, create text input
    if (selectedTool === 'text' && clickedOnEmpty && !isPanKey) {
      const stage = e.target.getStage();
      if (stage) {
        if (pointerPos) {
          // Convert screen coordinates to canvas coordinates
          const canvasX = (pointerPos.x - position.x) / scale;
          const canvasY = (pointerPos.y - position.y) / scale;
          const newId = `text-${Date.now()}-${Math.random()}`;
          setTextInputStates(prev => [...prev, { id: newId, x: canvasX, y: canvasY }]);
        }
      }
      return;
    }
    
    // Enable panning if:
    // 1. Clicking on empty space (always allows panning without modifier keys), OR
    // 2. Using pan keys (middle mouse button, Ctrl/Cmd, or Space key) - works anywhere
    const shouldPan = clickedOnEmpty || isPanKey;
    
    if (shouldPan) {
      const stage = e.target.getStage();
      if (stage) {
        setIsPanning(true);
        stage.draggable(true);
        stage.container().style.cursor = 'grabbing';
      }
    } else if (clickedOnElement) {
      // If clicking on an image/video element, prepare for potential drag-to-pan
      setIsDraggingFromElement(true);
      const stage = e.target.getStage();
      if (stage) {
        stage.draggable(false);
      }
    }
  };

  // Track mouse movement to detect drag vs click on elements
  useEffect(() => {
    if (!isDraggingFromElement || !mouseDownPos) return;

    const handleMouseMove = (e: MouseEvent) => {
      const moveThreshold = 5; // pixels
      const distance = Math.sqrt(
        Math.pow(e.clientX - mouseDownPos.x, 2) + 
        Math.pow(e.clientY - mouseDownPos.y, 2)
      );

      // If mouse moved significantly, enable panning
      if (distance > moveThreshold) {
        const stage = stageRef.current;
        if (stage) {
          setIsPanning(true);
          stage.draggable(true);
          stage.container().style.cursor = 'grabbing';
          // Disable element dragging when panning
          const allNodes = stage.find('Image');
          allNodes.forEach((node) => {
            node.draggable(false);
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingFromElement(false);
      setMouseDownPos(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingFromElement, mouseDownPos]);

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      setIsPanning(false);
      setIsDraggingFromElement(false);
      setMouseDownPos(null);
      if (isSpacePressed) {
        stage.container().style.cursor = 'grab';
      } else {
        stage.container().style.cursor = selectedTool === 'text' ? 'text' : 'grab';
      }
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
      if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
        return true;
      }
      
      // Check by file extension
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tif', '.tiff'];
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp'];
      const modelExtensions = ['.obj', '.gltf', '.glb'];
      return imageExtensions.some(ext => fileName.endsWith(ext)) || 
             videoExtensions.some(ext => fileName.endsWith(ext)) ||
             modelExtensions.some(ext => fileName.endsWith(ext));
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
        style={{ cursor: selectedTool === 'text' ? 'text' : 'grab' }}
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
          {/* Images and Videos */}
          {images
            .filter((img) => img.type !== 'model3d' && img.type !== 'text')
            .map((imageData, index) => {
              const actualIndex = images.findIndex(img => img === imageData);
              return (
              <CanvasImage 
                key={`${imageData.url}-${index}`} 
                imageData={imageData}
                index={actualIndex}
                onUpdate={(updates) => onImageUpdate?.(actualIndex, updates)}
                onSelect={() => setSelectedImageIndex(actualIndex)}
                isSelected={selectedImageIndex === actualIndex}
                onDelete={() => {
                  if (onImageDelete) {
                    onImageDelete(actualIndex);
                  }
                  setSelectedImageIndex(null);
                }}
                onContextMenu={() => {
                  setContextMenuImageIndex(actualIndex);
                  setContextMenuOpen(true);
                  setSelectedImageIndex(actualIndex);
                }}
              />
              );
            })}
          {/* Text Elements */}
          {images
            .filter((img) => img.type === 'text')
            .map((textData, index) => {
              const actualIndex = images.findIndex(img => img === textData);
              const isSelected = selectedImageIndex === actualIndex;
              const textX = textData.x || 0;
              const textY = textData.y || 0;
              const fontSize = textData.fontSize || 24;
              // Estimate text width (approximate)
              const textWidth = (textData.text || '').length * fontSize * 0.6;
              const textHeight = fontSize * 1.2;
              return (
                <Group key={`text-${actualIndex}`}>
                  <Text
                    x={textX}
                    y={textY}
                    text={textData.text || ''}
                    fontSize={fontSize}
                    fontFamily={textData.fontFamily || 'Arial'}
                    fill={textData.fill || '#000000'}
                    draggable
                    onDragEnd={(e) => {
                      const node = e.target;
                      onImageUpdate?.(actualIndex, {
                        x: node.x(),
                        y: node.y(),
                      });
                    }}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedImageIndex(actualIndex);
                      // Show context menu when text is clicked
                      setContextMenuImageIndex(actualIndex);
                      setContextMenuOpen(true);
                    }}
                    stroke={isSelected ? '#3b82f6' : undefined}
                    strokeWidth={isSelected ? 2 : 0}
                  />
                  {/* Delete button removed - now handled by context menu in header */}
                </Group>
              );
            })}
        </Layer>
      </Stage>
      {/* 3D Models - rendered outside Konva as overlay */}
      <Model3DOverlay
        images={images.filter((img) => img.type === 'model3d')}
        allImages={images}
        stageRef={stageRef}
        onImageUpdate={onImageUpdate}
      />
      {/* Text Input Overlays */}
      {textInputStates.map((textState) => (
        <TextInput
          key={textState.id}
          x={textState.x}
          y={textState.y}
          onConfirm={(text) => {
            if (onTextCreate) {
              onTextCreate(text, textState.x, textState.y);
            }
            setTextInputStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onCancel={() => {
            setTextInputStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onPositionChange={(newX, newY) => {
            setTextInputStates(prev => prev.map(t => 
              t.id === textState.id ? { ...t, x: newX, y: newY } : t
            ));
          }}
          onSelect={() => setSelectedTextInputId(textState.id)}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
      {/* Image Upload Modal Overlays */}
      {imageModalStates.map((modalState) => (
        <ImageUploadModal
          key={modalState.id}
          isOpen={true}
          onClose={() => {
            setImageModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedImageModalId(null);
          }}
          onImageSelect={onImageSelect}
          onGenerate={(prompt, model, frame, aspectRatio) => {
            if (onImageGenerate) {
              onImageGenerate(prompt, model, frame, aspectRatio);
              // Store generated image URL when generation completes
              // This will be updated via a callback or prop update
            }
          }}
          generatedImageUrl={modalState.generatedImageUrl}
          onSelect={() => {
            setSelectedImageModalId(modalState.id);
            // Show context menu when modal is clicked
            setContextMenuModalId(modalState.id);
            setContextMenuModalType('image');
            setContextMenuOpen(true);
          }}
          onDelete={() => {
            setImageModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedImageModalId(null);
          }}
          isSelected={selectedImageModalId === modalState.id}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setImageModalStates(prev => prev.map(m => 
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
      {/* Video Upload Modal Overlays */}
      {videoModalStates.map((modalState) => (
        <VideoUploadModal
          key={modalState.id}
          isOpen={true}
          onClose={() => {
            setVideoModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedVideoModalId(null);
          }}
          onVideoSelect={onVideoSelect}
          onGenerate={(prompt, model, frame, aspectRatio) => {
            if (onVideoGenerate) {
              onVideoGenerate(prompt, model, frame, aspectRatio);
              // Store generated video URL when generation completes
              // This will be updated via a callback or prop update
            }
          }}
          generatedVideoUrl={modalState.generatedVideoUrl || generatedVideoUrl}
          onSelect={() => {
            setSelectedVideoModalId(modalState.id);
            // Show context menu when modal is clicked
            setContextMenuModalId(modalState.id);
            setContextMenuModalType('video');
            setContextMenuOpen(true);
          }}
          onDelete={() => {
            setVideoModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedVideoModalId(null);
          }}
          isSelected={selectedVideoModalId === modalState.id}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setVideoModalStates(prev => prev.map(m => 
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
      {/* Music Upload Modal Overlays */}
      {musicModalStates.map((modalState) => (
        <MusicUploadModal
          key={modalState.id}
          isOpen={true}
          onClose={() => {
            setMusicModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedMusicModalId(null);
          }}
          onMusicSelect={onMusicSelect}
          onGenerate={(prompt, model, frame, aspectRatio) => {
            if (onMusicGenerate) {
              onMusicGenerate(prompt, model, frame, aspectRatio);
              // Store generated music URL when generation completes
              // This will be updated via a callback or prop update
            }
          }}
          generatedMusicUrl={modalState.generatedMusicUrl || generatedMusicUrl}
          onSelect={() => {
            setSelectedMusicModalId(modalState.id);
            // Show context menu when modal is clicked
            setContextMenuModalId(modalState.id);
            setContextMenuModalType('music');
            setContextMenuOpen(true);
          }}
          onDelete={() => {
            setMusicModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedMusicModalId(null);
          }}
          isSelected={selectedMusicModalId === modalState.id}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setMusicModalStates(prev => prev.map(m => 
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenuOpen && (contextMenuImageIndex !== null || contextMenuModalId !== null)}
        onClose={() => {
          setContextMenuOpen(false);
          setContextMenuImageIndex(null);
          setContextMenuModalId(null);
          setContextMenuModalType(null);
        }}
        onDelete={() => {
          // Handle deletion for images/videos
          if (contextMenuImageIndex !== null && onImageDelete) {
            onImageDelete(contextMenuImageIndex);
            setSelectedImageIndex(null);
            setContextMenuOpen(false);
            setContextMenuImageIndex(null);
          }
          // Handle deletion for modals
          else if (contextMenuModalId !== null && contextMenuModalType) {
            if (contextMenuModalType === 'image') {
              setImageModalStates(prev => prev.filter(m => m.id !== contextMenuModalId));
              setSelectedImageModalId(null);
            } else if (contextMenuModalType === 'video') {
              setVideoModalStates(prev => prev.filter(m => m.id !== contextMenuModalId));
              setSelectedVideoModalId(null);
            } else if (contextMenuModalType === 'music') {
              setMusicModalStates(prev => prev.filter(m => m.id !== contextMenuModalId));
              setSelectedMusicModalId(null);
            }
            setContextMenuOpen(false);
            setContextMenuModalId(null);
            setContextMenuModalType(null);
          }
        }}
        onDownload={() => {
          // Handle download for actual images/videos
          if (contextMenuImageIndex !== null && onImageDownload) {
            onImageDownload(contextMenuImageIndex);
          }
          // Handle download for modals
          else if (contextMenuModalId !== null && contextMenuModalType) {
            let urlToDownload: string | null = null;
            if (contextMenuModalType === 'image') {
              const modal = imageModalStates.find(m => m.id === contextMenuModalId);
              urlToDownload = modal?.generatedImageUrl || null;
            } else if (contextMenuModalType === 'video') {
              const modal = videoModalStates.find(m => m.id === contextMenuModalId);
              urlToDownload = modal?.generatedVideoUrl || null;
            } else if (contextMenuModalType === 'music') {
              const modal = musicModalStates.find(m => m.id === contextMenuModalId);
              urlToDownload = modal?.generatedMusicUrl || null;
            }
            
            if (urlToDownload) {
              // Download the file
              const link = document.createElement('a');
              link.href = urlToDownload;
              link.download = contextMenuModalType === 'image' 
                ? `image-${Date.now()}.png` 
                : contextMenuModalType === 'video'
                ? `video-${Date.now()}.mp4`
                : `music-${Date.now()}.mp3`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }
        }}
        onDuplicate={() => {
          // Handle duplicate for actual images/videos
          if (contextMenuImageIndex !== null && onImageDuplicate) {
            onImageDuplicate(contextMenuImageIndex);
          }
          // Handle duplicate for modals
          else if (contextMenuModalId !== null && contextMenuModalType) {
            if (contextMenuModalType === 'image') {
              const modal = imageModalStates.find(m => m.id === contextMenuModalId);
              if (modal) {
                // Create a duplicate modal with offset position
                const newId = `image-${Date.now()}-${Math.random()}`;
                const centerX = (viewportSize.width / 2 - position.x) / scale;
                const centerY = (viewportSize.height / 2 - position.y) / scale;
                setImageModalStates(prev => [...prev, {
                  id: newId,
                  x: modal.x + 50,
                  y: modal.y + 50,
                  generatedImageUrl: modal.generatedImageUrl,
                }]);
              }
            } else if (contextMenuModalType === 'video') {
              const modal = videoModalStates.find(m => m.id === contextMenuModalId);
              if (modal) {
                // Create a duplicate modal with offset position
                const newId = `video-${Date.now()}-${Math.random()}`;
                const centerX = (viewportSize.width / 2 - position.x) / scale;
                const centerY = (viewportSize.height / 2 - position.y) / scale;
                setVideoModalStates(prev => [...prev, {
                  id: newId,
                  x: modal.x + 50,
                  y: modal.y + 50,
                  generatedVideoUrl: modal.generatedVideoUrl,
                }]);
              }
            } else if (contextMenuModalType === 'music') {
              const modal = musicModalStates.find(m => m.id === contextMenuModalId);
              if (modal) {
                // Create a duplicate modal with offset position
                const newId = `music-${Date.now()}-${Math.random()}`;
                const centerX = (viewportSize.width / 2 - position.x) / scale;
                const centerY = (viewportSize.height / 2 - position.y) / scale;
                setMusicModalStates(prev => [...prev, {
                  id: newId,
                  x: modal.x + 50,
                  y: modal.y + 50,
                  generatedMusicUrl: modal.generatedMusicUrl,
                }]);
              }
            }
          }
        }}
        showDownload={!!(contextMenuImageIndex !== null && images[contextMenuImageIndex]?.type !== 'text' && images[contextMenuImageIndex]?.url) || !!(contextMenuModalId !== null && (
          (contextMenuModalType === 'image' && imageModalStates.find(m => m.id === contextMenuModalId)?.generatedImageUrl) ||
          (contextMenuModalType === 'video' && videoModalStates.find(m => m.id === contextMenuModalId)?.generatedVideoUrl) ||
          (contextMenuModalType === 'music' && musicModalStates.find(m => m.id === contextMenuModalId)?.generatedMusicUrl)
        ))}
        showDuplicate={!!(contextMenuImageIndex !== null && images[contextMenuImageIndex]?.type !== 'text' && images[contextMenuImageIndex]?.url) || !!(contextMenuModalId !== null && (
          (contextMenuModalType === 'image' && imageModalStates.find(m => m.id === contextMenuModalId)?.generatedImageUrl) ||
          (contextMenuModalType === 'video' && videoModalStates.find(m => m.id === contextMenuModalId)?.generatedVideoUrl) ||
          (contextMenuModalType === 'music' && musicModalStates.find(m => m.id === contextMenuModalId)?.generatedMusicUrl)
        ))}
      />
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
      name="resize-handle"
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        onDragEnd(node.x(), node.y());
      }}
      onClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
        // Stop event propagation to prevent clearing selection
        e.cancelBubble = true;
      }}
      onMouseDown={(e: Konva.KonvaEventObject<MouseEvent>) => {
        // Stop event propagation to prevent clearing selection
        e.cancelBubble = true;
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

// Separate component for image/video rendering with resize handles
const CanvasImage: React.FC<{ 
  imageData: ImageUpload;
  index: number;
  onUpdate?: (updates: Partial<ImageUpload>) => void;
  onSelect?: () => void;
  isSelected?: boolean;
  onDelete?: () => void;
  onContextMenu?: () => void;
}> = ({ imageData, index, onUpdate, onSelect, isSelected: externalIsSelected, onDelete, onContextMenu }) => {
  const [img, setImg] = useState<HTMLImageElement | HTMLVideoElement | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const isSelectedState = externalIsSelected !== undefined ? externalIsSelected : isSelected;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef<Konva.Image>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animRef = useRef<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeUpdateRef = useRef<number | null>(null);
  const wasPlayingBeforeDrag = useRef(false);
  const originalAspectRatio = useRef<number>(1);
  const isVideo = imageData.type === 'video';

  // Don't render if no URL (text elements don't have URLs)
  if (!imageData.url) return null;

  const url = imageData.url; // Type narrowing

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

  const x = imageData.x || 50;
  const y = imageData.y || 50;
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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        draggable
        x={x}
        y={y}
        onDragEnd={(e) => {
          const node = e.target;
          onUpdate?.({
            x: node.x(),
            y: node.y(),
          });
        }}
        onClick={(e) => {
          e.cancelBubble = true;
          setIsSelected(true);
          if (onSelect) {
            onSelect();
          }
          // Show context menu on click
          if (onContextMenu) {
            onContextMenu();
          }
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
              stroke={frameBorderColor}
              strokeWidth={frameBorderWidth}
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
          stroke={isSelectedState ? '#3b82f6' : frameBorderColor}
          strokeWidth={isSelectedState ? 2 : frameBorderWidth}
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
      {isSelectedState && (
        <>
          {/* Resize handles only - delete button removed, now in header navbar */}
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

