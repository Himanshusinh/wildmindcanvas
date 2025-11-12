'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Group, Path, Text, Line, Transformer } from 'react-konva';
import Konva from 'konva';
import { ImageUpload } from '@/types/canvas';
import { Model3DOverlay } from './Model3DOverlay';
import { TextInput } from '@/components/TextInput';
import { ImageUploadModal } from '@/components/ImageUploadModal';
import { VideoUploadModal } from '@/components/VideoUploadModal';
import { MusicUploadModal } from '@/components/MusicUploadModal';
import { ContextMenu } from '@/components/ContextMenu';
import { GroupNameModal } from '@/components/GroupNameModal';

interface CanvasProps {
  images?: ImageUpload[];
  onViewportChange?: (center: { x: number; y: number }, scale: number) => void;
  onImageUpdate?: (index: number, updates: Partial<ImageUpload>) => void;
  onImageDelete?: (index: number) => void;
  onImageDownload?: (index: number) => void;
  onImageDuplicate?: (index: number) => void;
  onImagesDrop?: (files: File[]) => void;
  selectedTool?: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music';
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
  const [selectedImageIndices, setSelectedImageIndices] = useState<number[]>([]); // Multiple selection
  const [selectedTextInputId, setSelectedTextInputId] = useState<string | null>(null);
  const [selectedTextInputIds, setSelectedTextInputIds] = useState<string[]>([]); // Multiple text input selection
  const [selectedImageModalId, setSelectedImageModalId] = useState<string | null>(null);
  const [selectedImageModalIds, setSelectedImageModalIds] = useState<string[]>([]); // Multiple image modal selection
  const [selectedVideoModalId, setSelectedVideoModalId] = useState<string | null>(null);
  const [selectedVideoModalIds, setSelectedVideoModalIds] = useState<string[]>([]); // Multiple video modal selection
  const [selectedMusicModalId, setSelectedMusicModalId] = useState<string | null>(null);
  const [selectedMusicModalIds, setSelectedMusicModalIds] = useState<string[]>([]); // Multiple music modal selection
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuImageIndex, setContextMenuImageIndex] = useState<number | null>(null);
  const [contextMenuModalId, setContextMenuModalId] = useState<string | null>(null);
  const [contextMenuModalType, setContextMenuModalType] = useState<'image' | 'video' | 'music' | null>(null);
  const [groups, setGroups] = useState<Map<string, { id: string; name?: string; itemIndices: number[]; textIds?: string[]; imageModalIds?: string[]; videoModalIds?: string[]; musicModalIds?: string[] }>>(new Map());
  // Tight selection rect calculated from selected items (canvas coords)
  const [selectionTightRect, setSelectionTightRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  // Track if selection came from drag (marquee selection) - only show icons for drag selections
  const [isDragSelection, setIsDragSelection] = useState(false);
  // Track last rect top-left for drag delta computation
  const selectionDragOriginRef = useRef<{ x: number; y: number } | null>(null);
  const [isGroupNameModalOpen, setIsGroupNameModalOpen] = useState(false);
  const [pendingGroupItems, setPendingGroupItems] = useState<{ imageIndices: number[]; textIds: string[]; imageModalIds: string[]; videoModalIds: string[]; musicModalIds: string[] } | null>(null);
  const prevSelectedToolRef = useRef<'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | undefined>(undefined);
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
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingFromElement, setIsDraggingFromElement] = useState(false);
  // Selection box state (marquee)
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartPoint, setSelectionStartPoint] = useState<{ x: number; y: number } | null>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedNodesRef = useRef<Konva.Node[]>([]);
  const rafRef = useRef<number | null>(null);

  // Listen for space key for panning, Shift key for panning, and Delete/Backspace for deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
        const stage = stageRef.current;
        if (stage) {
          stage.container().style.cursor = 'grab';
        }
      }
      
      if (e.shiftKey) {
        setIsShiftPressed(true);
        const stage = stageRef.current;
        if (stage && selectedTool === 'move') {
          stage.container().style.cursor = 'grab';
        }
        // Cursor tool with Shift should still show default cursor (no panning)
      }
      
      // Handle Delete/Backspace key for deletion (works on both Windows and Mac)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.repeat) {
        // Prevent default browser behavior (like going back in history)
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          // Don't delete if user is typing in an input field
          return;
        }
        
        e.preventDefault();
        
        // Clear selection box and tight rect when Delete is pressed
        setSelectionBox(null);
        setSelectionTightRect(null);
        setIsDragSelection(false);
        
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
      
      // Handle Ctrl+G / Cmd+G for creating groups
      if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.repeat) {
        e.preventDefault();
        // Check if we have enough items to group (at least 2)
        // For now, we'll focus on images - can be extended later for other types
        if (selectedImageIndices.length > 1) {
          // Store pending group items and show naming modal
          setPendingGroupItems({
            imageIndices: [...selectedImageIndices],
            textIds: [],
            imageModalIds: [],
            videoModalIds: [],
            musicModalIds: [],
          });
          setIsGroupNameModalOpen(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        const stage = stageRef.current;
        if (stage && !isPanning) {
          if (selectedTool === 'text') {
            stage.container().style.cursor = 'text';
          } else if (selectedTool === 'cursor') {
            stage.container().style.cursor = 'default';
          } else if (selectedTool === 'move') {
            stage.container().style.cursor = 'grab';
          } else {
            stage.container().style.cursor = 'grab';
          }
        }
      }
      
      if (!e.shiftKey) {
        setIsShiftPressed(false);
        const stage = stageRef.current;
        if (stage && !isPanning) {
          if (selectedTool === 'cursor') {
            stage.container().style.cursor = 'default';
          } else if (selectedTool === 'move') {
            stage.container().style.cursor = 'grab';
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedTool, isPanning, selectedImageIndex, selectedImageIndices, selectedTextInputId, selectedImageModalId, selectedVideoModalId, selectedMusicModalId, onImageDelete, onImageUpdate]);
  
  // Handle clicks outside modal components to clear selections
  useEffect(() => {
    let mouseDownTarget: HTMLElement | null = null;
    let mouseDownTime = 0;
    let mouseDownPos: { x: number; y: number } | null = null;
    
    const handleMouseDown = (e: MouseEvent) => {
      mouseDownTarget = e.target as HTMLElement;
      mouseDownTime = Date.now();
      mouseDownPos = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const timeDiff = Date.now() - mouseDownTime;
      const mouseUpPos = { x: e.clientX, y: e.clientY };
      
      // Calculate if it was a drag (moved more than 5 pixels)
      const wasDrag = mouseDownPos && (
        Math.abs(mouseUpPos.x - mouseDownPos.x) > 5 ||
        Math.abs(mouseUpPos.y - mouseDownPos.y) > 5
      );
      
      // Only clear if it was a click (not a drag) - check if target is same and time is short and no movement
      const wasClick = mouseDownTarget === target && timeDiff < 200 && !wasDrag;
      
      // Don't clear if we're in the middle of a selection drag or if it was a drag
      if (isSelecting || wasDrag) {
        mouseDownTarget = null;
        mouseDownPos = null;
        return;
      }
      
      // Check if click is inside any modal component
      const isInsideModal = 
        target.closest('[data-modal-component]') !== null ||
        target.closest('.controls-overlay') !== null ||
        target.closest('.text-input-header') !== null ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON' ||
        target.closest('button') !== null;
      
      // Check if click is on Konva canvas (canvas element) - let Konva handle it completely
      const isOnKonvaCanvas = target.tagName === 'CANVAS' || target.closest('canvas') !== null;
      
      // If click is outside all modals and NOT on Konva canvas, clear selections
      // Note: Konva stage clicks are handled by handleStageMouseDown - we should not interfere
      if (wasClick && !isInsideModal && !isOnKonvaCanvas && containerRef.current) {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const clickX = e.clientX;
        const clickY = e.clientY;
        
        // Check if click is inside the container
        if (
          clickX >= rect.left &&
          clickX <= rect.right &&
          clickY >= rect.top &&
          clickY <= rect.bottom
        ) {
          // Click is inside container but outside modals and not on canvas - clear selections
          setSelectedImageIndex(null);
          setSelectedImageIndices([]);
          setSelectedTextInputId(null);
          setSelectedTextInputIds([]);
          setSelectedImageModalId(null);
          setSelectedImageModalIds([]);
          setSelectedVideoModalId(null);
          setSelectedVideoModalIds([]);
          setSelectedMusicModalId(null);
          setSelectedMusicModalIds([]);
          // Don't clear selectionBox here - let the Konva handler manage it
        }
      }
      
      mouseDownTarget = null;
      mouseDownPos = null;
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isSelecting]);
  
  // Handle selection box mouse move
  useEffect(() => {
    if (!isSelecting || !selectionBox) return;

    const handleMouseMove = (e: MouseEvent) => {
      const stage = stageRef.current;
      if (!stage) return;

      // Prevent text selection during drag
      e.preventDefault();

      // Ensure stage is not draggable during selection
      stage.draggable(false);

      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        // Store selection box in canvas coordinates so it stays consistent across zoom/pan
        const canvasX = (pointerPos.x - position.x) / scale;
        const canvasY = (pointerPos.y - position.y) / scale;
        setSelectionBox(prev => prev ? {
          ...prev,
          currentX: canvasX,
          currentY: canvasY,
        } : null);
      }
    };

    const handleMouseUp = () => {
      const stage = stageRef.current;
      if (!stage) return;

      // Ensure stage is not draggable
      stage.draggable(false);
      
      // Reset cursor to default for cursor tool
      if (selectedTool === 'cursor') {
        stage.container().style.cursor = 'default';
      }

      if (selectionBox) {
        // Selection box is already in canvas coordinates
        const marqueeRect = {
          x: Math.min(selectionBox.startX, selectionBox.currentX),
          y: Math.min(selectionBox.startY, selectionBox.currentY),
          width: Math.abs(selectionBox.currentX - selectionBox.startX),
          height: Math.abs(selectionBox.currentY - selectionBox.startY),
        };
        
        // Check if selection box was actually dragged (not just clicked)
        const boxWidth = marqueeRect.width;
        const boxHeight = marqueeRect.height;
        const wasDragged = boxWidth > 5 || boxHeight > 5;
        
        if (wasDragged) {
          // Find all items that intersect with the marquee using Konva's intersection utility
          const selectedIndices: number[] = [];
          const selectedImageModalIdsList: string[] = [];
          const selectedVideoModalIdsList: string[] = [];
          const selectedMusicModalIdsList: string[] = [];
          const selectedTextInputIdsList: string[] = [];
          
          // Check images and videos (skip 3D models)
          images.forEach((img, index) => {
            if (img.type === 'model3d') return;
            
            const imgX = img.x || 0;
            const imgY = img.y || 0;
            const imgWidth = img.width || 0;
            const imgHeight = img.height || 0;
            
            // For text, estimate dimensions
            let width = imgWidth;
            let height = imgHeight;
            if (img.type === 'text') {
              const fontSize = img.fontSize || 24;
              width = (img.text || '').length * fontSize * 0.6;
              height = fontSize * 1.2;
            }
            
            // Create bounding box for the item
            const itemRect = {
              x: imgX,
              y: imgY,
              width: width,
              height: height,
            };
            
            // Use Konva's intersection check
            if (Konva.Util.haveIntersection(marqueeRect, itemRect)) {
              selectedIndices.push(index);
            }
          });
          
          // Check image modals (600px wide, aspect ratio height, typically 400px+ min height)
          imageModalStates.forEach((modal) => {
            const modalX = modal.x;
            const modalY = modal.y;
            const modalWidth = 600; // Fixed width
            const modalHeight = 400; // Minimum height (aspect ratio can make it taller)
            const modalRect = {
              x: modalX,
              y: modalY,
              width: modalWidth,
              height: modalHeight,
            };
            if (Konva.Util.haveIntersection(marqueeRect, modalRect)) {
              selectedImageModalIdsList.push(modal.id);
            }
          });
          
          // Check video modals (600px wide, aspect ratio height, typically 400px+ min height)
          videoModalStates.forEach((modal) => {
            const modalX = modal.x;
            const modalY = modal.y;
            const modalWidth = 600; // Fixed width
            const modalHeight = 400; // Minimum height (aspect ratio can make it taller)
            const modalRect = {
              x: modalX,
              y: modalY,
              width: modalWidth,
              height: modalHeight,
            };
            if (Konva.Util.haveIntersection(marqueeRect, modalRect)) {
              selectedVideoModalIdsList.push(modal.id);
            }
          });
          
          // Check music modals (600px wide, 300px high)
          musicModalStates.forEach((modal) => {
            const modalX = modal.x;
            const modalY = modal.y;
            const modalWidth = 600; // Fixed width
            const modalHeight = 300; // Fixed height
            const modalRect = {
              x: modalX,
              y: modalY,
              width: modalWidth,
              height: modalHeight,
            };
            if (Konva.Util.haveIntersection(marqueeRect, modalRect)) {
              selectedMusicModalIdsList.push(modal.id);
            }
          });
          
          // Check text input modals (400px+ wide, variable height, typically 200px+ with controls)
          textInputStates.forEach((textState) => {
            const textX = textState.x;
            const textY = textState.y;
            const textWidth = 400; // Minimum width
            const textHeight = 200; // Approximate height with controls
            const textRect = {
              x: textX,
              y: textY,
              width: textWidth,
              height: textHeight,
            };
            if (Konva.Util.haveIntersection(marqueeRect, textRect)) {
              selectedTextInputIdsList.push(textState.id);
            }
          });
          
          // Handle selection with modifier keys (Shift/Ctrl/Cmd)
          const isModifierPressed = (window.event as MouseEvent)?.shiftKey || 
                                    (window.event as MouseEvent)?.ctrlKey || 
                                    (window.event as MouseEvent)?.metaKey;
          
          if (isModifierPressed) {
            // Union: add to existing selection
            setSelectedImageIndices(prev => {
              const combined = [...new Set([...prev, ...selectedIndices])];
              return combined;
            });
            setSelectedImageModalIds(prev => [...new Set([...prev, ...selectedImageModalIdsList])]);
            setSelectedVideoModalIds(prev => [...new Set([...prev, ...selectedVideoModalIdsList])]);
            setSelectedMusicModalIds(prev => [...new Set([...prev, ...selectedMusicModalIdsList])]);
            setSelectedTextInputIds(prev => [...new Set([...prev, ...selectedTextInputIdsList])]);
          } else {
            // Replace selection
            setSelectedImageIndices(selectedIndices);
            setSelectedImageModalIds(selectedImageModalIdsList);
            setSelectedVideoModalIds(selectedVideoModalIdsList);
            setSelectedMusicModalIds(selectedMusicModalIdsList);
            setSelectedTextInputIds(selectedTextInputIdsList);
            if (selectedIndices.length > 0) {
              setSelectedImageIndex(selectedIndices[0]);
            } else {
              setSelectedImageIndex(null);
            }
            // Set single selection IDs for backward compatibility
            if (selectedImageModalIdsList.length > 0) {
              setSelectedImageModalId(selectedImageModalIdsList[0]);
            } else {
              setSelectedImageModalId(null);
            }
            if (selectedVideoModalIdsList.length > 0) {
              setSelectedVideoModalId(selectedVideoModalIdsList[0]);
            } else {
              setSelectedVideoModalId(null);
            }
            if (selectedMusicModalIdsList.length > 0) {
              setSelectedMusicModalId(selectedMusicModalIdsList[0]);
            } else {
              setSelectedMusicModalId(null);
            }
            if (selectedTextInputIdsList.length > 0) {
              setSelectedTextInputId(selectedTextInputIdsList[0]);
            } else {
              setSelectedTextInputId(null);
            }
          }
          
          // Compute tight bounding rect around selected items (remove extra area)
          // Include both canvas images and modals
          const totalSelected = selectedIndices.length + selectedImageModalIdsList.length + 
                               selectedVideoModalIdsList.length + selectedMusicModalIdsList.length + 
                               selectedTextInputIdsList.length;
          
          if (totalSelected > 0) {
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            
            // Include canvas images
            selectedIndices.forEach((idx) => {
              const it = images[idx];
              if (!it) return;
              const ix = it.x || 0;
              const iy = it.y || 0;
              let iw = it.width || 0;
              let ih = it.height || 0;
              if (it.type === 'text') {
                const fontSize = it.fontSize || 24;
                iw = (it.text || '').length * fontSize * 0.6;
                ih = fontSize * 1.2;
              }
              minX = Math.min(minX, ix);
              minY = Math.min(minY, iy);
              maxX = Math.max(maxX, ix + iw);
              maxY = Math.max(maxY, iy + ih);
            });
            
            // Include image modals
            // Image modals: 600px wide, height varies by aspect ratio (min 400px)
            // The actual height is: max(400, 600 / aspectRatio)
            // Default aspect ratio is typically 1:1, so height would be 600px
            // But to get a tighter fit, we'll use the minimum height (400px) for calculation
            // This will create a tighter selection box
            selectedImageModalIdsList.forEach((id) => {
              const modal = imageModalStates.find(m => m.id === id);
              if (modal) {
                const modalWidth = 600;
                // Use minimum height for tighter fit - the actual modal may be taller
                // but this ensures the selection box fits tightly around the minimum size
                const modalHeight = 400;
                minX = Math.min(minX, modal.x);
                minY = Math.min(minY, modal.y);
                maxX = Math.max(maxX, modal.x + modalWidth);
                maxY = Math.max(maxY, modal.y + modalHeight);
              }
            });
            
            // Include video modals
            // Video modals: 600px wide, height varies by aspect ratio (min 400px)
            // Similar to image modals, use minimum height for tighter fit
            selectedVideoModalIdsList.forEach((id) => {
              const modal = videoModalStates.find(m => m.id === id);
              if (modal) {
                const modalWidth = 600;
                const modalHeight = 400; // Minimum height for tighter fit
                minX = Math.min(minX, modal.x);
                minY = Math.min(minY, modal.y);
                maxX = Math.max(maxX, modal.x + modalWidth);
                maxY = Math.max(maxY, modal.y + modalHeight);
              }
            });
            
            // Include music modals
            // Music modals: 600px wide, 300px high (fixed)
            selectedMusicModalIdsList.forEach((id) => {
              const modal = musicModalStates.find(m => m.id === id);
              if (modal) {
                const modalWidth = 600;
                const modalHeight = 300;
                minX = Math.min(minX, modal.x);
                minY = Math.min(minY, modal.y);
                maxX = Math.max(maxX, modal.x + modalWidth);
                maxY = Math.max(maxY, modal.y + modalHeight);
              }
            });
            
            // Include text input modals
            // Text inputs: variable width (min 400px), variable height based on content
            // Use approximate dimensions
            selectedTextInputIdsList.forEach((id) => {
              const textState = textInputStates.find(t => t.id === id);
              if (textState) {
                // Text inputs have minWidth of 400px and variable height
                // Approximate height: ~150-200px for typical content
                const textWidth = 400;
                const textHeight = 180; // More accurate estimate
                minX = Math.min(minX, textState.x);
                minY = Math.min(minY, textState.y);
                maxX = Math.max(maxX, textState.x + textWidth);
                maxY = Math.max(maxY, textState.y + textHeight);
              }
            });
            
            if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
              // Calculate tight rect - ensure we're using the actual bounds
              // The calculation should already be tight, but we ensure no extra padding
              const calculatedWidth = Math.max(1, maxX - minX);
              const calculatedHeight = Math.max(1, maxY - minY);
              
              setSelectionTightRect({
                x: minX,
                y: minY,
                width: calculatedWidth,
                height: calculatedHeight,
              });
              selectionDragOriginRef.current = { x: minX, y: minY };
              // Clear selectionBox once tight rect is calculated - this makes the selection shrink to fit
              setSelectionBox(null);
              // Mark this as a drag selection so icons will show
              setIsDragSelection(true);
            } else {
              setSelectionTightRect(null);
              selectionDragOriginRef.current = null;
              setIsDragSelection(false);
            }
          } else {
            setSelectionTightRect(null);
            selectionDragOriginRef.current = null;
            setIsDragSelection(false);
          }
        } else {
          // Just a click, clear selection if not clicking on an element and no modifier
          const isModifierPressed = (window.event as MouseEvent)?.shiftKey || 
                                    (window.event as MouseEvent)?.ctrlKey || 
                                    (window.event as MouseEvent)?.metaKey;
          if (!isModifierPressed) {
            setSelectedImageIndices([]);
            setSelectedImageIndex(null);
            setSelectedImageModalIds([]);
            setSelectedVideoModalIds([]);
            setSelectedMusicModalIds([]);
            setSelectedTextInputIds([]);
            setSelectionTightRect(null);
            selectionDragOriginRef.current = null;
            setIsDragSelection(false);
          }
        }
      }
      
      setIsSelecting(false);
      // Keep selection box visible after mouse up - it will be cleared when Delete is pressed or when starting a new selection
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isSelecting, selectionBox, position, scale, images, selectedTool, imageModalStates, videoModalStates, musicModalStates, textInputStates]);

  // Attach Transformer to selected nodes
  useEffect(() => {
    if (transformerRef.current && selectedImageIndices.length > 0) {
      const stage = stageRef.current;
      if (!stage) return;
      
      const layer = layerRef.current;
      if (!layer) return;
      
      // Find all selected nodes by matching image indices
      const nodes: Konva.Node[] = [];
      selectedImageIndices.forEach((index) => {
        const imageData = images[index];
        if (!imageData || imageData.type === 'model3d') return;
        
        // Find the node by looking for Groups that match the image position
        const allNodes = layer.getChildren();
        allNodes.forEach((node: Konva.Node) => {
          if (node instanceof Konva.Group) {
            const nodeX = node.x();
            const nodeY = node.y();
            const imgX = imageData.x || 0;
            const imgY = imageData.y || 0;
            
            // Match by position (with small tolerance)
            if (Math.abs(nodeX - imgX) < 1 && Math.abs(nodeY - imgY) < 1) {
              if (!nodes.includes(node)) {
                nodes.push(node);
              }
            }
          }
        });
      });
      
      if (nodes.length > 0) {
        transformerRef.current.nodes(nodes);
        transformerRef.current.getLayer()?.batchDraw();
        selectedNodesRef.current = nodes;
      }
    } else if (transformerRef.current && selectedImageIndices.length === 0) {
      transformerRef.current.nodes([]);
      selectedNodesRef.current = [];
    }
  }, [selectedImageIndices, images]);

  // Handle drag to pan - enhanced for better navigation
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const target = e.target;
    const stage = target.getStage();
    const clickedOnEmpty = target === stage || target.getClassName() === 'Stage' || target.getClassName() === 'Layer' || target.getClassName() === 'Rect';
    // Panning: only with move tool, or with middle mouse, Ctrl/Cmd, or Space key (NOT with cursor tool)
    const isMoveTool = selectedTool === 'move';
    const isCursorTool = selectedTool === 'cursor';
    // Cursor tool should NEVER pan - only selection
    const isPanKey = isMoveTool || e.evt.button === 1 || e.evt.ctrlKey || e.evt.metaKey || isSpacePressed;
    const clickedOnElement = !clickedOnEmpty;
    
    // Check if clicking on a resize handle - if so, don't clear selection
    // Resize handles have a name attribute "resize-handle"
    const isResizeHandle = target.name() === 'resize-handle';
    
    // Clear selections when clicking on empty space (but not on resize handles or the background pattern)
    // Also exclude the background Rect pattern (which is the canvas pattern - very large Rect)
    // Don't clear if we're starting a selection box with cursor tool
    // NOTE: Selection box is NOT cleared here - it only clears on Delete key or when starting a new selection
    const targetClassName = target.getClassName();
    const isBackgroundPattern = targetClassName === 'Rect' && 
      (target as Konva.Rect).width() > 100000; // Background pattern is the full canvas size
    const isStartingSelection = isCursorTool && !isPanKey && e.evt.button === 0;
    
    // Check if click is inside the selection area (selectionTightRect or selectionBox)
    let isInsideSelection = false;
    if (stage) {
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        // Convert screen coordinates to canvas coordinates
        const canvasPos = {
          x: (pointerPos.x - position.x) / scale,
          y: (pointerPos.y - position.y) / scale,
        };
        
        // Check if click is inside selectionTightRect
        if (selectionTightRect) {
          const rect = selectionTightRect;
          if (
            canvasPos.x >= rect.x &&
            canvasPos.x <= rect.x + rect.width &&
            canvasPos.y >= rect.y &&
            canvasPos.y <= rect.y + rect.height
          ) {
            isInsideSelection = true;
          }
        }
        
        // Check if click is inside selectionBox (if no tightRect yet)
        if (!isInsideSelection && selectionBox) {
          const boxX = Math.min(selectionBox.startX, selectionBox.currentX);
          const boxY = Math.min(selectionBox.startY, selectionBox.currentY);
          const boxWidth = Math.abs(selectionBox.currentX - selectionBox.startX);
          const boxHeight = Math.abs(selectionBox.currentY - selectionBox.startY);
          if (
            canvasPos.x >= boxX &&
            canvasPos.x <= boxX + boxWidth &&
            canvasPos.y >= boxY &&
            canvasPos.y <= boxY + boxHeight
          ) {
            isInsideSelection = true;
          }
        }
      }
    }
    
    if (clickedOnEmpty && !isResizeHandle && !isBackgroundPattern && !isStartingSelection && !isInsideSelection) {
      // Click is outside selection area - clear everything
      setSelectedImageIndex(null);
      setSelectedImageIndices([]);
      setSelectedTextInputId(null);
      setSelectedTextInputIds([]);
      setSelectedImageModalId(null);
      setSelectedImageModalIds([]);
      setSelectedVideoModalId(null);
      setSelectedVideoModalIds([]);
      setSelectedMusicModalId(null);
      setSelectedMusicModalIds([]);
      setContextMenuOpen(false);
      setContextMenuImageIndex(null);
      setContextMenuModalId(null);
      setContextMenuModalType(null);
      // Clear selection rectangle and tight rect when clicking outside selection area
      setSelectionBox(null);
      setSelectionTightRect(null);
      setIsDragSelection(false);
    }
    // If click is inside selection area, do nothing - keep selections
    
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
    
    // If move tool is selected, always enable panning
    if (isMoveTool && clickedOnEmpty && e.evt.button === 0) {
      const stage = e.target.getStage();
      if (stage) {
        setIsPanning(true);
        stage.draggable(true);
        stage.container().style.cursor = 'grabbing';
      }
      return;
    }
    
    // If cursor tool is selected, start marquee selection on left click (NEVER pan)
    if (isCursorTool && e.evt.button === 0) {
      if (pointerPos) {
        const stage = e.target.getStage();
        if (stage) {
          // Explicitly disable stage dragging during selection
          stage.draggable(false);
          // Set cursor to crosshair during selection
          stage.container().style.cursor = 'crosshair';
        }
        // Clear previous selection box and tight rect when starting a new one
        setSelectionBox(null);
        setSelectionTightRect(null);
        setIsDragSelection(false);
        setIsSelecting(true);
        // Start new selection box in canvas coordinates
        const canvasX = (pointerPos.x - position.x) / scale;
        const canvasY = (pointerPos.y - position.y) / scale;
        setSelectionBox({
          startX: canvasX,
          startY: canvasY,
          currentX: canvasX,
          currentY: canvasY,
        });
        setSelectionStartPoint({ x: pointerPos.x, y: pointerPos.y });
      }
      return;
    }
    
    // Enable panning only with move tool or pan keys (middle mouse, Ctrl/Cmd, or Space key)
    // Cursor tool should NEVER pan
    const shouldPan = isPanKey && !isCursorTool;
    
    if (shouldPan) {
      const stage = e.target.getStage();
      if (stage) {
        setIsPanning(true);
        stage.draggable(true);
        stage.container().style.cursor = 'grabbing';
      }
    } else if (clickedOnElement && isMoveTool) {
      // If move tool is selected, allow panning even when clicking on elements
      const stage = e.target.getStage();
      if (stage) {
        setIsPanning(true);
        stage.draggable(true);
        stage.container().style.cursor = 'grabbing';
      }
    } else if (clickedOnElement) {
      // For other tools, prepare for potential drag-to-pan
      setIsDraggingFromElement(true);
      const stage = e.target.getStage();
      if (stage) {
        stage.draggable(false);
      }
    }
  };

  // Track mouse movement to detect drag vs click on elements
  useEffect(() => {
    if (!isDraggingFromElement || !mouseDownPos || selectedTool === 'cursor' || selectedTool === 'move') return;

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
  }, [isDraggingFromElement, mouseDownPos, selectedTool]);

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (stage) {
      setIsPanning(false);
      setIsDraggingFromElement(false);
      setMouseDownPos(null);
      if (selectedTool === 'text') {
        stage.container().style.cursor = 'text';
      } else if (selectedTool === 'move') {
        stage.container().style.cursor = 'grab';
      } else if (selectedTool === 'cursor') {
        stage.container().style.cursor = 'default'; // Cursor tool always shows default cursor
      } else {
        stage.container().style.cursor = 'grab';
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

  // Wrapper for onImageUpdate that handles group movement
  const handleImageUpdateWithGroup = (index: number, updates: Partial<ImageUpload>) => {
    const image = images[index];
    if (!image) return;

    // Check if this image is in a group
    if (image.groupId) {
      const group = groups.get(image.groupId);
      if (group) {
        // Calculate delta if position changed
        const oldX = image.x || 0;
        const oldY = image.y || 0;
        const newX = updates.x !== undefined ? updates.x : oldX;
        const newY = updates.y !== undefined ? updates.y : oldY;
        const deltaX = newX - oldX;
        const deltaY = newY - oldY;

        // Move all items in the group by the same delta
        if (deltaX !== 0 || deltaY !== 0) {
          // Move all images in the group
          group.itemIndices.forEach((groupIndex) => {
            if (groupIndex !== index && images[groupIndex]) {
              const groupImage = images[groupIndex];
              const currentX = groupImage.x || 0;
              const currentY = groupImage.y || 0;
              if (onImageUpdate) {
                onImageUpdate(groupIndex, {
                  x: currentX + deltaX,
                  y: currentY + deltaY,
                });
              }
            }
          });

          // Move text elements in the group
          if (group.textIds) {
            group.textIds.forEach((textId) => {
              setTextInputStates((prev) =>
                prev.map((textState) =>
                  textState.id === textId
                    ? { ...textState, x: textState.x + deltaX, y: textState.y + deltaY }
                    : textState
                )
              );
            });
          }

          // Move image modals in the group
          if (group.imageModalIds) {
            group.imageModalIds.forEach((modalId) => {
              setImageModalStates((prev) =>
                prev.map((modalState) =>
                  modalState.id === modalId
                    ? { ...modalState, x: modalState.x + deltaX, y: modalState.y + deltaY }
                    : modalState
                )
              );
            });
          }

          // Move video modals in the group
          if (group.videoModalIds) {
            group.videoModalIds.forEach((modalId) => {
              setVideoModalStates((prev) =>
                prev.map((modalState) =>
                  modalState.id === modalId
                    ? { ...modalState, x: modalState.x + deltaX, y: modalState.y + deltaY }
                    : modalState
                )
              );
            });
          }

          // Move music modals in the group
          if (group.musicModalIds) {
            group.musicModalIds.forEach((modalId) => {
              setMusicModalStates((prev) =>
                prev.map((modalState) =>
                  modalState.id === modalId
                    ? { ...modalState, x: modalState.x + deltaX, y: modalState.y + deltaY }
                    : modalState
                )
              );
            });
          }
        }
      }
    }

    // Always update the dragged item
    if (onImageUpdate) {
      onImageUpdate(index, updates);
    }
  };

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
        style={{ 
          cursor: selectedTool === 'text' 
            ? 'text' 
            : selectedTool === 'move'
              ? (isPanning ? 'grabbing' : 'grab')
              : selectedTool === 'cursor' 
                ? (isSelecting ? 'crosshair' : 'crosshair')
                : 'grab' 
        }}
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
                onUpdate={(updates) => handleImageUpdateWithGroup(actualIndex, updates)}
                onSelect={(e?: { ctrlKey?: boolean; metaKey?: boolean }) => {
                  const isMultiSelect = e?.ctrlKey || e?.metaKey;
                  if (isMultiSelect) {
                    // Add to selection if not already selected, remove if selected
                    setSelectedImageIndices(prev => {
                      if (prev.includes(actualIndex)) {
                        const newIndices = prev.filter(i => i !== actualIndex);
                        setSelectedImageIndex(newIndices.length > 0 ? newIndices[0] : null);
                        return newIndices;
                      } else {
                        const newIndices = [...prev, actualIndex];
                        setSelectedImageIndex(actualIndex);
                        return newIndices;
                      }
                    });
                  } else {
                    // Single select - clear all modal selections
                    setSelectedImageIndices([actualIndex]);
                    setSelectedImageIndex(actualIndex);
                    setSelectedImageModalId(null);
                    setSelectedImageModalIds([]);
                    setSelectedVideoModalId(null);
                    setSelectedVideoModalIds([]);
                    setSelectedMusicModalId(null);
                    setSelectedMusicModalIds([]);
                    setSelectedTextInputId(null);
                    setSelectedTextInputIds([]);
                    // Clear drag selection flag - this is a single click, not a drag
                    setIsDragSelection(false);
                    setSelectionTightRect(null);
                  }
                }}
                isSelected={selectedImageIndices.includes(actualIndex)}
                onDelete={() => {
                  if (onImageDelete) {
                    onImageDelete(actualIndex);
                  }
                  setSelectedImageIndex(null);
                  setSelectedImageIndices([]);
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
                      handleImageUpdateWithGroup(actualIndex, {
                        x: node.x(),
                        y: node.y(),
                      });
                    }}
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedImageIndex(actualIndex);
                      setSelectedImageIndices([actualIndex]);
                      // Clear all modal selections
                      setSelectedImageModalId(null);
                      setSelectedImageModalIds([]);
                      setSelectedVideoModalId(null);
                      setSelectedVideoModalIds([]);
                      setSelectedMusicModalId(null);
                      setSelectedMusicModalIds([]);
                      setSelectedTextInputId(null);
                      setSelectedTextInputIds([]);
                      // Clear drag selection flag - this is a single click, not a drag
                      setIsDragSelection(false);
                      setSelectionTightRect(null);
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
          {/* Group labels overlay */}
          {Array.from(groups.values()).map((grp) => {
            // Compute group bounding box from image indices
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            grp.itemIndices.forEach(idx => {
              const it = images[idx];
              if (!it) return;
              const ix = it.x || 0;
              const iy = it.y || 0;
              const iw = it.width || 0;
              const ih = it.height || 0;
              minX = Math.min(minX, ix);
              minY = Math.min(minY, iy);
              maxX = Math.max(maxX, ix + iw);
              maxY = Math.max(maxY, iy + ih);
            });
            if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
              return null;
            }
            const labelX = minX - 6;
            const labelY = Math.min(minY - 28, minY - 6);
            const name = grp.name || 'Group';
            const labelWidth = Math.max(60, name.length * 8 + 20);
            return (
              <Group
                key={grp.id}
                x={labelX}
                y={labelY}
                draggable
                onDragEnd={(e) => {
                  const node = e.target as Konva.Group;
                  const newX = node.x();
                  const newY = node.y();
                  const deltaX = newX - labelX;
                  const deltaY = newY - labelY;
                  // Move all items in the group
                  grp.itemIndices.forEach(idx => {
                    const it = images[idx];
                    if (!it) return;
                    const ox = it.x || 0;
                    const oy = it.y || 0;
                    handleImageUpdateWithGroup(idx, { x: ox + deltaX, y: oy + deltaY });
                  });
                  // Reset visual position back (items have moved)
                  node.position({ x: labelX, y: labelY });
                }}
              >
                <Rect
                  x={0}
                  y={0}
                  width={labelWidth}
                  height={22}
                  fill="#111827"
                  stroke="#374151"
                  strokeWidth={1}
                  cornerRadius={6}
                />
                <Text
                  x={10}
                  y={4}
                  text={name}
                  fontSize={12}
                  fontFamily="Arial"
                  fill="#ffffff"
                />
              </Group>
            );
          })}
          {/* Selection Rect & Toolbar */}
          {(() => {
            // Calculate total number of selected items
            const totalSelected = selectedImageIndices.length + 
                                 selectedImageModalIds.length + 
                                 selectedVideoModalIds.length + 
                                 selectedMusicModalIds.length + 
                                 selectedTextInputIds.length;
            // Only show icons if there are 2 or more components selected
            return selectionTightRect && isDragSelection && totalSelected >= 2;
          })() && selectionTightRect ? (
            // After selection completes, show tight rect with toolbar and allow dragging to move all
            <Group
              x={selectionTightRect.x}
              y={selectionTightRect.y}
              draggable
              onDragStart={(e) => {
                selectionDragOriginRef.current = { x: selectionTightRect.x, y: selectionTightRect.y };
              }}
              onDragEnd={(e) => {
                const origin = selectionDragOriginRef.current;
                const node = e.target as Konva.Group;
                if (!origin || !node) return;
                const newX = node.x();
                const newY = node.y();
                const deltaX = newX - origin.x;
                const deltaY = newY - origin.y;
                // Move all selected images by delta
                selectedImageIndices.forEach(idx => {
                  const it = images[idx];
                  if (!it) return;
                  const ox = it.x || 0;
                  const oy = it.y || 0;
                  handleImageUpdateWithGroup(idx, { x: ox + deltaX, y: oy + deltaY });
                });
                // Update tight rect to new position and reset node back to (0,0) under new rect
                setSelectionTightRect(prev => prev ? { ...prev, x: prev.x + deltaX, y: prev.y + deltaY } : prev);
                node.position({ x: (selectionTightRect?.x || 0) + deltaX, y: (selectionTightRect?.y || 0) + deltaY });
                selectionDragOriginRef.current = { x: (selectionTightRect?.x || 0) + deltaX, y: (selectionTightRect?.y || 0) + deltaY };
              }}
            >
              <Rect
                x={0}
                y={0}
                width={selectionTightRect.width}
                height={selectionTightRect.height}
                fill="rgba(147, 197, 253, 0.18)"
                stroke="#3b82f6"
                strokeWidth={2}
                dash={[5, 5]}
                listening={true}
                cornerRadius={0}
              />
              {/* Toolbar buttons at top center, outside selection area */}
              <Group
                x={selectionTightRect.width / 2 - 42} // Center the buttons (total width is 84px: 36 + 12 + 36)
                y={-40}
              >
                {/* Group button */}
                <Group
                  onClick={(e) => {
                    e.cancelBubble = true;
                    // Use the selected items from selection arrays
                    setPendingGroupItems({
                      imageIndices: [...selectedImageIndices],
                      textIds: [...selectedTextInputIds],
                      imageModalIds: [...selectedImageModalIds],
                      videoModalIds: [...selectedVideoModalIds],
                      musicModalIds: [...selectedMusicModalIds],
                    });
                    setIsGroupNameModalOpen(true);
                  }}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'pointer';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'default';
                    }
                  }}
                >
                  <Rect
                    x={0}
                    y={0}
                    width={36}
                    height={36}
                    fill="#111827"
                    stroke="#374151"
                    strokeWidth={1}
                    cornerRadius={8}
                    shadowColor="rgba(0, 0, 0, 0.3)"
                    shadowBlur={4}
                    shadowOffset={{ x: 0, y: 2 }}
                  />
                  {/* Group icon - layers/stack icon */}
                  <Group x={8} y={8}>
                    <Rect x={0} y={0} width={20} height={4} fill="#60a5fa" cornerRadius={1} />
                    <Rect x={2} y={6} width={20} height={4} fill="#60a5fa" cornerRadius={1} />
                    <Rect x={4} y={12} width={20} height={4} fill="#60a5fa" cornerRadius={1} />
                  </Group>
                </Group>
                {/* Arrange button */}
                <Group
                  x={48}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    const rect = selectionTightRect;
                    if (!rect) return;
                    const sel = [...selectedImageIndices];
                    if (sel.length === 0) return;
                    // Simple grid layout inside rect preserving item sizes; top-left flow
                    const padding = 12;
                    const cols = Math.max(1, Math.round(Math.sqrt(sel.length)));
                    let col = 0;
                    let row = 0;
                    let currentY = rect.y + padding;
                    let maxRowHeight = 0;
                    let currentX = rect.x + padding;
                    sel.forEach((idx, i) => {
                      const it = images[idx];
                      if (!it) return;
                      const iw = it.width || 100;
                      const ih = it.height || 100;
                      if (col >= cols || (currentX + iw + padding) > (rect.x + rect.width)) {
                        // next row
                        row += 1;
                        col = 0;
                        currentX = rect.x + padding;
                        currentY += maxRowHeight + padding;
                        maxRowHeight = 0;
                      }
                      handleImageUpdateWithGroup(idx, { x: currentX, y: currentY });
                      currentX += iw + padding;
                      maxRowHeight = Math.max(maxRowHeight, ih);
                      col += 1;
                    });
                    // Update tight rect after arrange
                    // Recompute bounds of selected items
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    sel.forEach(idx => {
                      const it = images[idx];
                      if (!it) return;
                      const ix = it.x || 0;
                      const iy = it.y || 0;
                      const iw = it.width || 0;
                      const ih = it.height || 0;
                      minX = Math.min(minX, ix);
                      minY = Math.min(minY, iy);
                      maxX = Math.max(maxX, ix + iw);
                      maxY = Math.max(maxY, iy + ih);
                    });
                    if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
                      setSelectionTightRect({
                        x: minX,
                        y: minY,
                        width: Math.max(1, maxX - minX),
                        height: Math.max(1, maxY - minY),
                      });
                    }
                  }}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'pointer';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'default';
                    }
                  }}
                >
                  <Rect
                    x={0}
                    y={0}
                    width={36}
                    height={36}
                    fill="#111827"
                    stroke="#374151"
                    strokeWidth={1}
                    cornerRadius={8}
                    shadowColor="rgba(0, 0, 0, 0.3)"
                    shadowBlur={4}
                    shadowOffset={{ x: 0, y: 2 }}
                  />
                  {/* Arrange icon - grid/layout icon */}
                  <Group x={8} y={8}>
                    <Rect x={0} y={0} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
                    <Rect x={12} y={0} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
                    <Rect x={0} y={12} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
                    <Rect x={12} y={12} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
                  </Group>
                </Group>
              </Group>
            </Group>
          ) : (isSelecting && selectionBox) ? (
            // While dragging, show live marquee box
            <Rect
              x={Math.min(selectionBox.startX, selectionBox.currentX)}
              y={Math.min(selectionBox.startY, selectionBox.currentY)}
              width={Math.max(1, Math.abs(selectionBox.currentX - selectionBox.startX))}
              height={Math.max(1, Math.abs(selectionBox.currentY - selectionBox.startY))}
              fill="rgba(147, 197, 253, 0.3)"
              stroke="#3b82f6"
              strokeWidth={2}
              dash={[5, 5]}
              listening={false}
              globalCompositeOperation="source-over"
              cornerRadius={0}
            />
          ) : (selectionBox && !isSelecting) ? (
            // After drag completes but before tight rect is calculated, show the selection box with buttons
            <Group
              x={Math.min(selectionBox.startX, selectionBox.currentX)}
              y={Math.min(selectionBox.startY, selectionBox.currentY)}
            >
              <Rect
                x={0}
                y={0}
                width={Math.max(1, Math.abs(selectionBox.currentX - selectionBox.startX))}
                height={Math.max(1, Math.abs(selectionBox.currentY - selectionBox.startY))}
                fill="rgba(147, 197, 253, 0.3)"
                stroke="#3b82f6"
                strokeWidth={2}
                dash={[5, 5]}
                listening={false}
                globalCompositeOperation="source-over"
                cornerRadius={0}
              />
              {/* Toolbar buttons at top center, outside selection area - only show if 2+ items selected */}
              {(() => {
                const totalSelected = selectedImageIndices.length + 
                                     selectedImageModalIds.length + 
                                     selectedVideoModalIds.length + 
                                     selectedMusicModalIds.length + 
                                     selectedTextInputIds.length;
                return totalSelected >= 2;
              })() && (
              <Group
                x={Math.max(1, Math.abs(selectionBox.currentX - selectionBox.startX)) / 2 - 42}
                y={-40}
              >
                {/* Group button */}
                <Group
                  onClick={(e) => {
                    e.cancelBubble = true;
                    setPendingGroupItems({
                      imageIndices: [...selectedImageIndices],
                      textIds: [...selectedTextInputIds],
                      imageModalIds: [...selectedImageModalIds],
                      videoModalIds: [...selectedVideoModalIds],
                      musicModalIds: [...selectedMusicModalIds],
                    });
                    setIsGroupNameModalOpen(true);
                  }}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'pointer';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'default';
                    }
                  }}
                >
                  <Rect
                    x={0}
                    y={0}
                    width={36}
                    height={36}
                    fill="#111827"
                    stroke="#374151"
                    strokeWidth={1}
                    cornerRadius={8}
                    shadowColor="rgba(0, 0, 0, 0.3)"
                    shadowBlur={4}
                    shadowOffset={{ x: 0, y: 2 }}
                  />
                  <Group x={8} y={8}>
                    <Rect x={0} y={0} width={20} height={4} fill="#60a5fa" cornerRadius={1} />
                    <Rect x={2} y={6} width={20} height={4} fill="#60a5fa" cornerRadius={1} />
                    <Rect x={4} y={12} width={20} height={4} fill="#60a5fa" cornerRadius={1} />
                  </Group>
                </Group>
                {/* Arrange button */}
                <Group
                  x={48}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    const sel = [...selectedImageIndices];
                    if (sel.length === 0) return;
                    const boxWidth = Math.abs(selectionBox.currentX - selectionBox.startX);
                    const boxHeight = Math.abs(selectionBox.currentY - selectionBox.startY);
                    const boxX = Math.min(selectionBox.startX, selectionBox.currentX);
                    const boxY = Math.min(selectionBox.startY, selectionBox.currentY);
                    const padding = 12;
                    const cols = Math.max(1, Math.round(Math.sqrt(sel.length)));
                    let col = 0;
                    let currentY = boxY + padding;
                    let maxRowHeight = 0;
                    let currentX = boxX + padding;
                    sel.forEach((idx) => {
                      const it = images[idx];
                      if (!it) return;
                      const iw = it.width || 100;
                      const ih = it.height || 100;
                      if (col >= cols || (currentX + iw + padding) > (boxX + boxWidth)) {
                        col = 0;
                        currentX = boxX + padding;
                        currentY += maxRowHeight + padding;
                        maxRowHeight = 0;
                      }
                      handleImageUpdateWithGroup(idx, { x: currentX, y: currentY });
                      currentX += iw + padding;
                      maxRowHeight = Math.max(maxRowHeight, ih);
                      col += 1;
                    });
                  }}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'pointer';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.container().style.cursor = 'default';
                    }
                  }}
                >
                  <Rect
                    x={0}
                    y={0}
                    width={36}
                    height={36}
                    fill="#111827"
                    stroke="#374151"
                    strokeWidth={1}
                    cornerRadius={8}
                    shadowColor="rgba(0, 0, 0, 0.3)"
                    shadowBlur={4}
                    shadowOffset={{ x: 0, y: 2 }}
                  />
                  <Group x={8} y={8}>
                    <Rect x={0} y={0} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
                    <Rect x={12} y={0} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
                    <Rect x={0} y={12} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
                    <Rect x={12} y={12} width={8} height={8} fill="#60a5fa" cornerRadius={1} />
                  </Group>
                </Group>
              </Group>
              )}
            </Group>
          ) : null}
          {/* Transformer for selected nodes */}
          {selectedImageIndices.length > 0 && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limit resize to prevent negative dimensions
                if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
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
          isSelected={selectedTextInputId === textState.id || selectedTextInputIds.includes(textState.id)}
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
          onSelect={() => {
            setSelectedTextInputId(textState.id);
            setSelectedTextInputIds([textState.id]);
            // Clear other selections so only this shows blue border
            setSelectedImageIndex(null);
            setSelectedImageIndices([]);
            setSelectedImageModalId(null);
            setSelectedImageModalIds([]);
            setSelectedVideoModalId(null);
            setSelectedVideoModalIds([]);
            setSelectedMusicModalId(null);
            setSelectedMusicModalIds([]);
            // Clear drag selection flag - this is a single click, not a drag
            setIsDragSelection(false);
            setSelectionTightRect(null);
          }}
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
            setSelectedImageModalIds([modalState.id]);
            // Clear other selections
            setSelectedVideoModalId(null);
            setSelectedVideoModalIds([]);
            setSelectedMusicModalId(null);
            setSelectedMusicModalIds([]);
            setSelectedTextInputId(null);
            setSelectedTextInputIds([]);
            setSelectedImageIndex(null);
            setSelectedImageIndices([]);
            // Clear drag selection flag - this is a single click, not a drag
            setIsDragSelection(false);
            setSelectionTightRect(null);
            // Show context menu when modal is clicked
            setContextMenuModalId(modalState.id);
            setContextMenuModalType('image');
            setContextMenuOpen(true);
          }}
          onDelete={() => {
            setImageModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedImageModalId(null);
          }}
          isSelected={selectedImageModalId === modalState.id || selectedImageModalIds.includes(modalState.id)}
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
            setSelectedVideoModalIds([modalState.id]);
            // Clear other selections
            setSelectedImageModalId(null);
            setSelectedImageModalIds([]);
            setSelectedMusicModalId(null);
            setSelectedMusicModalIds([]);
            setSelectedTextInputId(null);
            setSelectedTextInputIds([]);
            setSelectedImageIndex(null);
            setSelectedImageIndices([]);
            // Clear drag selection flag - this is a single click, not a drag
            setIsDragSelection(false);
            setSelectionTightRect(null);
            // Show context menu when modal is clicked
            setContextMenuModalId(modalState.id);
            setContextMenuModalType('video');
            setContextMenuOpen(true);
          }}
          onDelete={() => {
            setVideoModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedVideoModalId(null);
          }}
          isSelected={selectedVideoModalId === modalState.id || selectedVideoModalIds.includes(modalState.id)}
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
            setSelectedMusicModalIds([modalState.id]);
            // Clear other selections
            setSelectedImageModalId(null);
            setSelectedImageModalIds([]);
            setSelectedVideoModalId(null);
            setSelectedVideoModalIds([]);
            setSelectedTextInputId(null);
            setSelectedTextInputIds([]);
            setSelectedImageIndex(null);
            setSelectedImageIndices([]);
            // Clear drag selection flag - this is a single click, not a drag
            setIsDragSelection(false);
            setSelectionTightRect(null);
            // Show context menu when modal is clicked
            setContextMenuModalId(modalState.id);
            setContextMenuModalType('music');
            setContextMenuOpen(true);
          }}
          onDelete={() => {
            setMusicModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedMusicModalId(null);
          }}
          isSelected={selectedMusicModalId === modalState.id || selectedMusicModalIds.includes(modalState.id)}
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
      {/* Group Name Modal */}
      <GroupNameModal
        isOpen={isGroupNameModalOpen}
        onClose={() => {
          setIsGroupNameModalOpen(false);
          setPendingGroupItems(null);
        }}
        onConfirm={(name) => {
          if (pendingGroupItems) {
            const groupId = `group-${Date.now()}-${Math.random()}`;
            setGroups(prev => {
              const newGroups = new Map(prev);
              newGroups.set(groupId, {
                id: groupId,
                name,
                itemIndices: pendingGroupItems.imageIndices,
                textIds: pendingGroupItems.textIds,
                imageModalIds: pendingGroupItems.imageModalIds,
                videoModalIds: pendingGroupItems.videoModalIds,
                musicModalIds: pendingGroupItems.musicModalIds,
              });
              return newGroups;
            });
            // Update images to have groupId
            pendingGroupItems.imageIndices.forEach(index => {
              if (onImageUpdate) {
                onImageUpdate(index, { groupId });
              }
            });
            setIsGroupNameModalOpen(false);
            setPendingGroupItems(null);
          }
        }}
        defaultName={`Group ${groups.size + 1}`}
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
  onSelect?: (e?: { ctrlKey?: boolean; metaKey?: boolean }) => void;
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
            // Pass event info for multi-select support
            onSelect({
              ctrlKey: e.evt.ctrlKey,
              metaKey: e.evt.metaKey,
            });
          }
          // Show context menu on click (only if not Ctrl/Cmd+click for multi-select)
          if (onContextMenu && !e.evt.ctrlKey && !e.evt.metaKey) {
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
              stroke={isSelectedState ? '#3b82f6' : frameBorderColor}
              strokeWidth={isSelectedState ? 2 : frameBorderWidth}
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
            stroke={isSelectedState ? '#3b82f6' : 'transparent'}
            strokeWidth={isSelectedState ? 2 : 0}
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

