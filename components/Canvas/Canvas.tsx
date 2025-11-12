'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import Konva from 'konva';
import { ImageUpload } from '@/types/canvas';
import { Model3DOverlay } from './Model3DOverlay';
import { ContextMenu } from '@/components/ContextMenu';
import { GroupNameModal } from '@/components/GroupNameModal';
import { CanvasImage } from './CanvasImage';
import { TextElements } from './TextElements';
import { ModalOverlays } from './ModalOverlays';
import { SelectionBox } from './SelectionBox';
import { MediaActionIcons } from './MediaActionIcons';
import { GroupLabel } from './GroupLabel';

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
  onImageGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, modalId?: string) => Promise<string | null>;
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

  // Helper function to check if current selection is a group
  const isCurrentSelectionAGroup = (): boolean => {
    if (selectedImageIndices.length === 0 && selectedTextInputIds.length === 0 && 
        selectedImageModalIds.length === 0 && selectedVideoModalIds.length === 0 && 
        selectedMusicModalIds.length === 0) {
      return false;
    }
    
    // Check all groups to see if any group matches the current selection
    for (const group of groups.values()) {
      const selectedImagesSet = new Set(selectedImageIndices);
      const groupImagesSet = new Set(group.itemIndices || []);
      const imagesMatch = selectedImagesSet.size === groupImagesSet.size &&
                         Array.from(selectedImagesSet).every(idx => groupImagesSet.has(idx));
      
      const selectedTextsSet = new Set(selectedTextInputIds);
      const groupTextsSet = new Set(group.textIds || []);
      const textsMatch = selectedTextsSet.size === groupTextsSet.size &&
                        Array.from(selectedTextsSet).every(id => groupTextsSet.has(id));
      
      const selectedImageModalsSet = new Set(selectedImageModalIds);
      const groupImageModalsSet = new Set(group.imageModalIds || []);
      const imageModalsMatch = selectedImageModalsSet.size === groupImageModalsSet.size &&
                              Array.from(selectedImageModalsSet).every(id => groupImageModalsSet.has(id));
      
      const selectedVideoModalsSet = new Set(selectedVideoModalIds);
      const groupVideoModalsSet = new Set(group.videoModalIds || []);
      const videoModalsMatch = selectedVideoModalsSet.size === groupVideoModalsSet.size &&
                              Array.from(selectedVideoModalsSet).every(id => groupVideoModalsSet.has(id));
      
      const selectedMusicModalsSet = new Set(selectedMusicModalIds);
      const groupMusicModalsSet = new Set(group.musicModalIds || []);
      const musicModalsMatch = selectedMusicModalsSet.size === groupMusicModalsSet.size &&
                              Array.from(selectedMusicModalsSet).every(id => groupMusicModalsSet.has(id));
      
      if (imagesMatch && textsMatch && imageModalsMatch && videoModalsMatch && musicModalsMatch &&
          (selectedImagesSet.size > 0 || selectedTextsSet.size > 0 || selectedImageModalsSet.size > 0 || 
           selectedVideoModalsSet.size > 0 || selectedMusicModalsSet.size > 0)) {
        return true;
      }
    }
    return false;
  };

  // Helper function to clear all selections
  // clearSelectionBoxes: if true, also clears selection boxes (for empty canvas clicks)
  // if false, keeps selection boxes (for component switching)
  const clearAllSelections = (clearSelectionBoxes: boolean = false) => {
    // Don't clear if current selection is a group - groups persist when clicking outside
    if (isCurrentSelectionAGroup()) {
      return;
    }
    
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
    if (clearSelectionBoxes) {
      setSelectionBox(null);
      setSelectionTightRect(null);
      setIsDragSelection(false);
    }
  };
  // Truly infinite canvas - fixed massive size
  const canvasSize = { width: INFINITE_CANVAS_SIZE, height: INFINITE_CANVAS_SIZE };

  // Helper function to check if a position overlaps with existing components
  const checkOverlap = (x: number, y: number, width: number = 600, height: number = 400, padding: number = 100): boolean => {
    // Expand check rect with padding
    const checkRect = { 
      x: x - padding, 
      y: y - padding, 
      width: width + padding * 2, 
      height: height + padding * 2 
    };
    
    // Check against uploaded images/videos
    for (const img of images) {
      if (img.type === 'text' || img.type === 'model3d') continue;
      const imgWidth = img.width || 400;
      const imgHeight = img.height || 400;
      const imgRect = {
        x: (img.x || 0) - padding,
        y: (img.y || 0) - padding,
        width: imgWidth + padding * 2,
        height: imgHeight + padding * 2,
      };
      if (
        checkRect.x < imgRect.x + imgRect.width &&
        checkRect.x + checkRect.width > imgRect.x &&
        checkRect.y < imgRect.y + imgRect.height &&
        checkRect.y + checkRect.height > imgRect.y
      ) {
        return true;
      }
    }
    
    // Check against text inputs (estimated size: 300x100)
    for (const textState of textInputStates) {
      const textRect = { 
        x: textState.x - padding, 
        y: textState.y - padding, 
        width: 300 + padding * 2, 
        height: 100 + padding * 2 
      };
      if (
        checkRect.x < textRect.x + textRect.width &&
        checkRect.x + checkRect.width > textRect.x &&
        checkRect.y < textRect.y + textRect.height &&
        checkRect.y + checkRect.height > textRect.y
      ) {
        return true;
      }
    }
    
    // Check against image modals (600px wide, ~400px tall for 1:1 aspect ratio)
    for (const modalState of imageModalStates) {
      const modalRect = { 
        x: modalState.x - padding, 
        y: modalState.y - padding, 
        width: 600 + padding * 2, 
        height: 400 + padding * 2 
      };
      if (
        checkRect.x < modalRect.x + modalRect.width &&
        checkRect.x + checkRect.width > modalRect.x &&
        checkRect.y < modalRect.y + modalRect.height &&
        checkRect.y + checkRect.height > modalRect.y
      ) {
        return true;
      }
    }
    
    // Check against video modals (600px wide, ~400px tall for 16:9 aspect ratio)
    for (const modalState of videoModalStates) {
      const modalRect = { 
        x: modalState.x - padding, 
        y: modalState.y - padding, 
        width: 600 + padding * 2, 
        height: 400 + padding * 2 
      };
      if (
        checkRect.x < modalRect.x + modalRect.width &&
        checkRect.x + checkRect.width > modalRect.x &&
        checkRect.y < modalRect.y + modalRect.height &&
        checkRect.y + checkRect.height > modalRect.y
      ) {
        return true;
      }
    }
    
    // Check against music modals (600px wide, ~300px tall)
    for (const modalState of musicModalStates) {
      const modalRect = { 
        x: modalState.x - padding, 
        y: modalState.y - padding, 
        width: 600 + padding * 2, 
        height: 300 + padding * 2 
      };
      if (
        checkRect.x < modalRect.x + modalRect.width &&
        checkRect.x + checkRect.width > modalRect.x &&
        checkRect.y < modalRect.y + modalRect.height &&
        checkRect.y + checkRect.height > modalRect.y
      ) {
        return true;
      }
    }
    
    return false;
  };

  // Helper function to find blank space for new component
  const findBlankSpace = (componentWidth: number = 600, componentHeight: number = 400): { x: number; y: number } => {
    // Check if canvas is empty
    const isEmpty = images.length === 0 && 
                    textInputStates.length === 0 && 
                    imageModalStates.length === 0 && 
                    videoModalStates.length === 0 && 
                    musicModalStates.length === 0;
    
    if (isEmpty) {
      // Center on screen when canvas is empty
      const centerX = (viewportSize.width / 2 - position.x) / scale;
      const centerY = (viewportSize.height / 2 - position.y) / scale;
      return { x: centerX - componentWidth / 2, y: centerY - componentHeight / 2 };
    }
    
    // Find blank space starting from viewport center
    const centerX = (viewportSize.width / 2 - position.x) / scale;
    const centerY = (viewportSize.height / 2 - position.y) / scale;
    
    // Try positions in a spiral pattern from center with larger spacing
    const spacing = Math.max(componentWidth, componentHeight) + 200; // Space between attempts (component size + padding)
    const maxAttempts = 100; // Search further
    
    // First try center position
    if (!checkOverlap(centerX - componentWidth / 2, centerY - componentHeight / 2, componentWidth, componentHeight)) {
      return { x: centerX - componentWidth / 2, y: centerY - componentHeight / 2 };
    }
    
    // Spiral search pattern
    for (let radius = 1; radius < maxAttempts; radius++) {
      // Try 8 directions at each radius
      for (let angle = 0; angle < 360; angle += 45) {
        const rad = (angle * Math.PI) / 180;
        const x = centerX - componentWidth / 2 + Math.cos(rad) * radius * spacing;
        const y = centerY - componentHeight / 2 + Math.sin(rad) * radius * spacing;
        
        if (!checkOverlap(x, y, componentWidth, componentHeight)) {
          return { x, y };
        }
      }
    }
    
    // Fallback: try positions further away in a grid pattern
    const gridSpacing = spacing;
    for (let row = -10; row <= 10; row++) {
      for (let col = -10; col <= 10; col++) {
        if (row === 0 && col === 0) continue; // Skip center (already checked)
        const x = centerX - componentWidth / 2 + col * gridSpacing;
        const y = centerY - componentHeight / 2 + row * gridSpacing;
        
        if (!checkOverlap(x, y, componentWidth, componentHeight)) {
          return { x, y };
        }
      }
    }
    
    // Last resort: return a position far to the right
    return { x: centerX + 1000, y: centerY - componentHeight / 2 };
  };

  // Helper function to pan viewport to focus on a component
  const focusOnComponent = (canvasX: number, canvasY: number, componentWidth: number = 600, componentHeight: number = 400) => {
    // Calculate the position to center the component on screen
    const targetScreenX = viewportSize.width / 2;
    const targetScreenY = viewportSize.height / 2;
    
    // Convert canvas coordinates to screen coordinates
    const componentCenterX = canvasX + componentWidth / 2;
    const componentCenterY = canvasY + componentHeight / 2;
    
    // Calculate new position to center the component
    const newPosX = targetScreenX - componentCenterX * scale;
    const newPosY = targetScreenY - componentCenterY * scale;
    
    setPosition({ x: newPosX, y: newPosY });
    setTimeout(() => updateViewportCenter({ x: newPosX, y: newPosY }, scale), 0);
  };

  // Automatically create text input at center when text tool is selected
  useEffect(() => {
    if (selectedTool === 'text') {
      const blankPos = findBlankSpace(300, 100);
      const newId = `text-${Date.now()}-${Math.random()}`;
      setTextInputStates(prev => [...prev, { id: newId, x: blankPos.x, y: blankPos.y }]);
      // Auto-focus on new component
      setTimeout(() => focusOnComponent(blankPos.x, blankPos.y, 300, 100), 100);
    }
    prevSelectedToolRef.current = selectedTool;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, toolClickCounter]);

  // Automatically create image modal at center when image tool is selected
  useEffect(() => {
    if (selectedTool === 'image' && isImageModalOpen) {
      const blankPos = findBlankSpace(600, 400);
      const newId = `image-${Date.now()}-${Math.random()}`;
      setImageModalStates(prev => [...prev, { id: newId, x: blankPos.x, y: blankPos.y, generatedImageUrl: null }]);
      // Auto-focus on new component
      setTimeout(() => focusOnComponent(blankPos.x, blankPos.y, 600, 400), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, isImageModalOpen, toolClickCounter]);

  // Automatically create video modal at center when video tool is selected
  useEffect(() => {
    if (selectedTool === 'video' && isVideoModalOpen) {
      const blankPos = findBlankSpace(600, 400);
      const newId = `video-${Date.now()}-${Math.random()}`;
      setVideoModalStates(prev => [...prev, { id: newId, x: blankPos.x, y: blankPos.y, generatedVideoUrl: null }]);
      // Auto-focus on new component
      setTimeout(() => focusOnComponent(blankPos.x, blankPos.y, 600, 400), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTool, isVideoModalOpen, toolClickCounter]);

  // Automatically create music modal at center when music tool is selected
  useEffect(() => {
    if (selectedTool === 'music' && isMusicModalOpen) {
      const blankPos = findBlankSpace(600, 300);
      const newId = `music-${Date.now()}-${Math.random()}`;
      setMusicModalStates(prev => [...prev, { id: newId, x: blankPos.x, y: blankPos.y, generatedMusicUrl: null }]);
      // Auto-focus on new component
      setTimeout(() => focusOnComponent(blankPos.x, blankPos.y, 600, 300), 100);
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
        if (stage) {
          // Show crosshair cursor when Shift is pressed (enables selection with Shift + Left Click)
          stage.container().style.cursor = 'crosshair';
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
        
        // Check if there's a selected region (multiple components)
        const hasMultipleSelections = selectedImageIndices.length > 0 || 
                                     selectedTextInputIds.length > 0 || 
                                     selectedImageModalIds.length > 0 || 
                                     selectedVideoModalIds.length > 0 || 
                                     selectedMusicModalIds.length > 0;
        
        if (hasMultipleSelections) {
          // Delete all selected components in the region
          
          // Check if the selected items form a group and delete the group
          let groupToDelete: string | null = null;
          for (const group of groups.values()) {
            const selectedImagesSet = new Set(selectedImageIndices);
            const groupImagesSet = new Set(group.itemIndices || []);
            const imagesMatch = selectedImagesSet.size === groupImagesSet.size &&
                             Array.from(selectedImagesSet).every(idx => groupImagesSet.has(idx));
            
            const selectedTextsSet = new Set(selectedTextInputIds);
            const groupTextsSet = new Set(group.textIds || []);
            const textsMatch = selectedTextsSet.size === groupTextsSet.size &&
                            Array.from(selectedTextsSet).every(id => groupTextsSet.has(id));
            
            const selectedImageModalsSet = new Set(selectedImageModalIds);
            const groupImageModalsSet = new Set(group.imageModalIds || []);
            const imageModalsMatch = selectedImageModalsSet.size === groupImageModalsSet.size &&
                                   Array.from(selectedImageModalsSet).every(id => groupImageModalsSet.has(id));
            
            const selectedVideoModalsSet = new Set(selectedVideoModalIds);
            const groupVideoModalsSet = new Set(group.videoModalIds || []);
            const videoModalsMatch = selectedVideoModalsSet.size === groupVideoModalsSet.size &&
                                   Array.from(selectedVideoModalsSet).every(id => groupVideoModalsSet.has(id));
            
            const selectedMusicModalsSet = new Set(selectedMusicModalIds);
            const groupMusicModalsSet = new Set(group.musicModalIds || []);
            const musicModalsMatch = selectedMusicModalsSet.size === groupMusicModalsSet.size &&
                                   Array.from(selectedMusicModalsSet).every(id => groupMusicModalsSet.has(id));
            
            if (imagesMatch && textsMatch && imageModalsMatch && videoModalsMatch && musicModalsMatch &&
                (selectedImagesSet.size > 0 || selectedTextsSet.size > 0 || selectedImageModalsSet.size > 0 || 
                 selectedVideoModalsSet.size > 0 || selectedMusicModalsSet.size > 0)) {
              groupToDelete = group.id;
              break;
            }
          }
          
          // Delete the group if it exists
          if (groupToDelete) {
            setGroups(prev => {
              const newGroups = new Map(prev);
              newGroups.delete(groupToDelete!);
              return newGroups;
            });
          }
          
          // Delete all selected images
          if (selectedImageIndices.length > 0 && onImageDelete) {
            // Delete in reverse order to maintain correct indices
            const sortedIndices = [...selectedImageIndices].sort((a, b) => b - a);
            sortedIndices.forEach(index => {
              onImageDelete(index);
            });
          }
          
          // Delete all selected text inputs
          if (selectedTextInputIds.length > 0) {
            setTextInputStates(prev => prev.filter(t => !selectedTextInputIds.includes(t.id)));
          }
          
          // Delete all selected image modals
          if (selectedImageModalIds.length > 0) {
            setImageModalStates(prev => prev.filter(m => !selectedImageModalIds.includes(m.id)));
          }
          
          // Delete all selected video modals
          if (selectedVideoModalIds.length > 0) {
            setVideoModalStates(prev => prev.filter(m => !selectedVideoModalIds.includes(m.id)));
          }
          
          // Delete all selected music modals
          if (selectedMusicModalIds.length > 0) {
            setMusicModalStates(prev => prev.filter(m => !selectedMusicModalIds.includes(m.id)));
          }
          
          // Clear all selections
          setSelectedImageIndices([]);
          setSelectedImageIndex(null);
          setSelectedTextInputIds([]);
          setSelectedTextInputId(null);
          setSelectedImageModalIds([]);
          setSelectedImageModalId(null);
          setSelectedVideoModalIds([]);
          setSelectedVideoModalId(null);
          setSelectedMusicModalIds([]);
          setSelectedMusicModalId(null);
        } else {
          // Single selection deletion (backward compatibility)
          
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
        
        // Clear selection box and tight rect when Delete is pressed
        setSelectionBox(null);
        setSelectionTightRect(null);
        setIsDragSelection(false);
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
          } else if (selectedTool === 'text') {
            stage.container().style.cursor = 'text';
          } else {
            stage.container().style.cursor = 'default';
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
          // Click is inside container but outside modals and not on canvas - clear selections including boxes
          clearAllSelections(true);
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
      
      // Reset cursor to default for cursor tool or after Shift selection
      if (selectedTool === 'cursor') {
        stage.container().style.cursor = 'default';
      } else if (!isShiftPressed) {
        // Reset cursor when Shift is released
        if (selectedTool === 'move') {
          stage.container().style.cursor = 'grab';
        } else if (selectedTool === 'text') {
          stage.container().style.cursor = 'text';
        } else {
          stage.container().style.cursor = 'default';
        }
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
            
            // Check if component overlaps with selection box (even partially)
            // Select if ANY part of the component is inside the selection box
            const componentRight = itemRect.x + itemRect.width;
            const componentBottom = itemRect.y + itemRect.height;
            const marqueeRight = marqueeRect.x + marqueeRect.width;
            const marqueeBottom = marqueeRect.y + marqueeRect.height;
            
            // Check if rectangles overlap (any intersection)
            const overlaps = !(
              componentRight < marqueeRect.x ||
              itemRect.x > marqueeRight ||
              componentBottom < marqueeRect.y ||
              itemRect.y > marqueeBottom
            );
            
            if (overlaps) {
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
            // Check if modal overlaps with selection box (even partially)
            const modalRight = modalRect.x + modalRect.width;
            const modalBottom = modalRect.y + modalRect.height;
            const marqueeRight = marqueeRect.x + marqueeRect.width;
            const marqueeBottom = marqueeRect.y + marqueeRect.height;
            
            const overlaps = !(
              modalRight < marqueeRect.x ||
              modalRect.x > marqueeRight ||
              modalBottom < marqueeRect.y ||
              modalRect.y > marqueeBottom
            );
            
            if (overlaps) {
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
            // Check if modal overlaps with selection box (even partially)
            const modalRight = modalRect.x + modalRect.width;
            const modalBottom = modalRect.y + modalRect.height;
            const marqueeRight = marqueeRect.x + marqueeRect.width;
            const marqueeBottom = marqueeRect.y + marqueeRect.height;
            
            const overlaps = !(
              modalRight < marqueeRect.x ||
              modalRect.x > marqueeRight ||
              modalBottom < marqueeRect.y ||
              modalRect.y > marqueeBottom
            );
            
            if (overlaps) {
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
            // Check if modal overlaps with selection box (even partially)
            const modalRight = modalRect.x + modalRect.width;
            const modalBottom = modalRect.y + modalRect.height;
            const marqueeRight = marqueeRect.x + marqueeRect.width;
            const marqueeBottom = marqueeRect.y + marqueeRect.height;
            
            const overlaps = !(
              modalRight < marqueeRect.x ||
              modalRect.x > marqueeRight ||
              modalBottom < marqueeRect.y ||
              modalRect.y > marqueeBottom
            );
            
            if (overlaps) {
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
            // Check if text input overlaps with selection box (even partially)
            const textRight = textRect.x + textRect.width;
            const textBottom = textRect.y + textRect.height;
            const marqueeRight = marqueeRect.x + marqueeRect.width;
            const marqueeBottom = marqueeRect.y + marqueeRect.height;
            
            const overlaps = !(
              textRight < marqueeRect.x ||
              textRect.x > marqueeRight ||
              textBottom < marqueeRect.y ||
              textRect.y > marqueeBottom
            );
            
            if (overlaps) {
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
            // Image modals: 600px wide
            // Frame: min 400px height (varies by aspect ratio)
            // Controls overlay: up to 500px when visible (positioned below frame at top: 100%)
            // Total height: frame (400px+) + controls (500px) = 900px minimum
            selectedImageModalIdsList.forEach((id) => {
              const modal = imageModalStates.find(m => m.id === id);
              if (modal) {
                const modalWidth = 600;
                // Include frame height (min 400px) + controls area (500px max)
                // This ensures the selection box covers the entire modal including controls
                const modalHeight = 400 + 500; // 900px total
                minX = Math.min(minX, modal.x);
                minY = Math.min(minY, modal.y);
                maxX = Math.max(maxX, modal.x + modalWidth);
                maxY = Math.max(maxY, modal.y + modalHeight);
              }
            });
            
            // Include video modals
            // Video modals: 600px wide
            // Frame: min 400px height (varies by aspect ratio)
            // Controls overlay: up to 500px when visible (positioned below frame at top: 100%)
            // Total height: frame (400px+) + controls (500px) = 900px minimum
            selectedVideoModalIdsList.forEach((id) => {
              const modal = videoModalStates.find(m => m.id === id);
              if (modal) {
                const modalWidth = 600;
                // Include frame height (min 400px) + controls area (500px max)
                const modalHeight = 400 + 500; // 900px total
                minX = Math.min(minX, modal.x);
                minY = Math.min(minY, modal.y);
                maxX = Math.max(maxX, modal.x + modalWidth);
                maxY = Math.max(maxY, modal.y + modalHeight);
              }
            });
            
            // Include music modals
            // Music modals: 600px wide
            // Frame: 300px height (fixed)
            // Controls overlay: up to 500px when visible (positioned below frame at top: 100%)
            // Total height: frame (300px) + controls (500px) = 800px
            selectedMusicModalIdsList.forEach((id) => {
              const modal = musicModalStates.find(m => m.id === id);
              if (modal) {
                const modalWidth = 600;
                // Include frame height (300px) + controls area (500px max)
                const modalHeight = 300 + 500; // 800px total
                minX = Math.min(minX, modal.x);
                minY = Math.min(minY, modal.y);
                maxX = Math.max(maxX, modal.x + modalWidth);
                maxY = Math.max(maxY, modal.y + modalHeight);
              }
            });
            
            // Include text input modals
            // Text inputs: variable width (min 400px), includes header + input area + controls
            // Total height: header (~40px) + input area (~150px) + controls (~100px) = ~300-400px
            selectedTextInputIdsList.forEach((id) => {
              const textState = textInputStates.find(t => t.id === id);
              if (textState) {
                const textWidth = 400;
                const textHeight = 400; // Total height including all sections
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
    // More comprehensive check for empty clicks - includes Stage, Layer, and background Rect
    const clickedOnEmpty = target === stage || 
      target.getClassName() === 'Stage' || 
      target.getClassName() === 'Layer' || 
      (target.getClassName() === 'Rect' && (target as Konva.Rect).width() > 100000);
    // Panning: only with move tool, or with middle mouse, Ctrl/Cmd, or Space key (NOT with cursor tool or Shift)
    const isMoveTool = selectedTool === 'move';
    const isCursorTool = selectedTool === 'cursor';
    // Cursor tool and Shift + Left Click should NEVER pan - only selection
    const isPanKey = isMoveTool || e.evt.button === 1 || e.evt.ctrlKey || e.evt.metaKey || isSpacePressed;
    // Shift + Left Click is for selection, not panning
    const isShiftSelection = e.evt.shiftKey && e.evt.button === 0;
    const clickedOnElement = !clickedOnEmpty;
    
    // Check if clicking on a resize handle - if so, don't clear selection
    // Resize handles have a name attribute "resize-handle"
    const isResizeHandle = target.name() === 'resize-handle';
    
    // Clear selections when clicking on empty space (but not on resize handles)
    // Don't clear if we're starting a selection box with cursor tool or Shift + Left Click
    // NOTE: Selection box is NOT cleared here - it only clears on Delete key or when starting a new selection
    const isStartingSelection = (isCursorTool || isShiftSelection) && !isPanKey && e.evt.button === 0;
    
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
    
    // Clear selections when clicking on empty canvas space
    // Only skip clearing if:
    // 1. We're clicking on a resize handle
    // 2. We're starting a selection box (cursor tool drag)
    // 3. We're clicking inside an existing selection area
    if (clickedOnEmpty && !isResizeHandle && !isStartingSelection && !isInsideSelection) {
      // Click is on empty canvas - clear everything including selection boxes
      clearAllSelections(true);
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
    
    // If Shift + Left Click, start marquee selection (NEVER pan)
    if (isShiftSelection && clickedOnEmpty) {
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
    
    // If cursor tool is selected with Shift + Left Click, start marquee selection
    // If cursor tool is selected with normal Left Click, pan the canvas
    if (isCursorTool && e.evt.button === 0) {
      if (isShiftSelection && clickedOnEmpty) {
        // Shift + Left Click = selection
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
      } else if (clickedOnEmpty) {
        // Normal Left Click + Drag = pan canvas
        const stage = e.target.getStage();
        if (stage) {
          setIsPanning(true);
          stage.draggable(true);
          stage.container().style.cursor = 'grabbing';
        }
        return;
      }
    }
    
    // Enable panning with move tool or pan keys (middle mouse, Ctrl/Cmd, Space key)
    // Shift should NEVER pan - only selection
    const shouldPan = isPanKey && !isShiftSelection;
    
    // Default behavior: normal left click + drag on empty space should pan (unless it's Shift)
    if (clickedOnEmpty && e.evt.button === 0 && !isShiftSelection && !isPanKey && !isCursorTool) {
      // Normal left click + drag on empty space = pan (cursor tool is handled above)
      const stage = e.target.getStage();
      if (stage) {
        setIsPanning(true);
        stage.draggable(true);
        stage.container().style.cursor = 'grabbing';
      }
      return;
    }
    
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
    const target = e.target;
    
    // Check if this was a click on empty canvas (not a drag)
    const clickedOnEmpty = target === stage || 
      target.getClassName() === 'Stage' || 
      target.getClassName() === 'Layer' || 
      (target.getClassName() === 'Rect' && (target as Konva.Rect).width() > 100000);
    
    // If it was a click (not a drag) on empty space and no selection box was created, clear selections
    // This handles the case where user clicks on empty canvas to deselect
    if (clickedOnEmpty && !isSelecting && !selectionBox) {
      // Only clear if we have selections and this was just a click (not part of a drag operation)
      const hasSelections = selectedImageIndex !== null || 
        selectedImageModalId !== null || 
        selectedVideoModalId !== null || 
        selectedMusicModalId !== null || 
        selectedTextInputId !== null ||
        selectedImageIndices.length > 0 ||
        selectedImageModalIds.length > 0 ||
        selectedVideoModalIds.length > 0 ||
        selectedMusicModalIds.length > 0 ||
        selectedTextInputIds.length > 0;
      
      if (hasSelections) {
        clearAllSelections(true);
      }
    }
    
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

  // Helper function to calculate group bounds
  const calculateGroupBounds = (group: { itemIndices: number[]; textIds?: string[]; imageModalIds?: string[]; videoModalIds?: string[]; musicModalIds?: string[] }): { x: number; y: number; width: number; height: number } | null => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Check images
    group.itemIndices.forEach(idx => {
      const img = images[idx];
      if (img) {
        const imgX = img.x || 0;
        const imgY = img.y || 0;
        const imgWidth = img.width || 0;
        const imgHeight = img.height || 0;
        minX = Math.min(minX, imgX);
        minY = Math.min(minY, imgY);
        maxX = Math.max(maxX, imgX + imgWidth);
        maxY = Math.max(maxY, imgY + imgHeight);
      }
    });
    
    // Check text inputs
    if (group.textIds) {
      group.textIds.forEach(textId => {
        const textState = textInputStates.find(t => t.id === textId);
        if (textState) {
          minX = Math.min(minX, textState.x);
          minY = Math.min(minY, textState.y);
          maxX = Math.max(maxX, textState.x + 300); // Approximate width
          maxY = Math.max(maxY, textState.y + 100); // Approximate height
        }
      });
    }
    
    // Check image modals
    if (group.imageModalIds) {
      group.imageModalIds.forEach(modalId => {
        const modalState = imageModalStates.find(m => m.id === modalId);
        if (modalState) {
          minX = Math.min(minX, modalState.x);
          minY = Math.min(minY, modalState.y);
          maxX = Math.max(maxX, modalState.x + 600); // Approximate width
          maxY = Math.max(maxY, modalState.y + 400); // Approximate height
        }
      });
    }
    
    // Check video modals
    if (group.videoModalIds) {
      group.videoModalIds.forEach(modalId => {
        const modalState = videoModalStates.find(m => m.id === modalId);
        if (modalState) {
          minX = Math.min(minX, modalState.x);
          minY = Math.min(minY, modalState.y);
          maxX = Math.max(maxX, modalState.x + 600); // Approximate width
          maxY = Math.max(maxY, modalState.y + 400); // Approximate height
        }
      });
    }
    
    // Check music modals
    if (group.musicModalIds) {
      group.musicModalIds.forEach(modalId => {
        const modalState = musicModalStates.find(m => m.id === modalId);
        if (modalState) {
          minX = Math.min(minX, modalState.x);
          minY = Math.min(minY, modalState.y);
          maxX = Math.max(maxX, modalState.x + 600); // Approximate width
          maxY = Math.max(maxY, modalState.y + 300); // Approximate height
        }
      });
    }
    
    if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
      return null;
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  // Helper function to check if a component is inside group bounds
  const isComponentInsideGroupBounds = (x: number, y: number, width: number, height: number, groupBounds: { x: number; y: number; width: number; height: number }): boolean => {
    const componentRight = x + width;
    const componentBottom = y + height;
    const boundsRight = groupBounds.x + groupBounds.width;
    const boundsBottom = groupBounds.y + groupBounds.height;
    
    // Component is inside if it overlaps with the bounds (with some tolerance)
    return (
      x < boundsRight &&
      componentRight > groupBounds.x &&
      y < boundsBottom &&
      componentBottom > groupBounds.y
    );
  };

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

        // If position changed, check if component will be outside group bounds
        if (deltaX !== 0 || deltaY !== 0) {
          // Calculate current group bounds BEFORE moving
          const currentGroupBounds = calculateGroupBounds(group);
          if (currentGroupBounds) {
            const finalWidth = updates.width !== undefined ? updates.width : (image.width || 0);
            const finalHeight = updates.height !== undefined ? updates.height : (image.height || 0);
            
            // Check if this component will be outside the group bounds after the move
            const willBeOutside = !isComponentInsideGroupBounds(newX, newY, finalWidth, finalHeight, currentGroupBounds);
            
            if (willBeOutside) {
              // Component is moving outside - don't move the group, just remove it from the group
              setGroups(prev => {
                const newGroups = new Map(prev);
                const updatedGroup = newGroups.get(image.groupId!);
                if (updatedGroup) {
                  newGroups.set(image.groupId!, {
                    ...updatedGroup,
                    itemIndices: updatedGroup.itemIndices.filter(idx => idx !== index),
                  });
                }
                return newGroups;
              });
              
              // Remove groupId from the image and update position
              if (onImageUpdate) {
                onImageUpdate(index, { ...updates, groupId: undefined });
              }
              
              // Remove from selection if it was selected
              if (selectedImageIndices.includes(index)) {
                setSelectedImageIndices(prev => prev.filter(idx => idx !== index));
              }
              
              // Don't move the group, just return (component has already been updated above)
              return;
            }
          }
          
          // Component is staying inside - move all items in the group by the same delta
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
                    // Single select - clear all other selections first
                    clearAllSelections();
                    // Then set this image as selected
                    setSelectedImageIndices([actualIndex]);
                    setSelectedImageIndex(actualIndex);
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
              />
              );
            })}
          {/* Text Elements */}
          <TextElements
            images={images}
            selectedImageIndex={selectedImageIndex}
            clearAllSelections={clearAllSelections}
            setSelectedImageIndex={setSelectedImageIndex}
            setSelectedImageIndices={setSelectedImageIndices}
            setContextMenuImageIndex={setContextMenuImageIndex}
            setContextMenuOpen={setContextMenuOpen}
            handleImageUpdateWithGroup={handleImageUpdateWithGroup}
          />
          {/* Group labels overlay */}
          {Array.from(groups.values()).map((grp) => (
            <GroupLabel
              key={grp.id}
              group={grp}
              images={images}
              handleImageUpdateWithGroup={handleImageUpdateWithGroup}
            />
          ))}
          {/* Selection Rect & Toolbar */}
          <SelectionBox
            selectionBox={selectionBox}
            selectionTightRect={selectionTightRect}
            isSelecting={isSelecting}
            isDragSelection={isDragSelection}
            selectedImageIndices={selectedImageIndices}
            selectedImageModalIds={selectedImageModalIds}
            selectedVideoModalIds={selectedVideoModalIds}
            selectedMusicModalIds={selectedMusicModalIds}
            selectedTextInputIds={selectedTextInputIds}
            images={images}
            selectionDragOriginRef={selectionDragOriginRef}
            setPendingGroupItems={setPendingGroupItems}
            setIsGroupNameModalOpen={setIsGroupNameModalOpen}
            setSelectionTightRect={setSelectionTightRect}
            handleImageUpdateWithGroup={handleImageUpdateWithGroup}
            setTextInputStates={setTextInputStates}
            setImageModalStates={setImageModalStates}
            setVideoModalStates={setVideoModalStates}
            setMusicModalStates={setMusicModalStates}
            textInputStates={textInputStates}
            imageModalStates={imageModalStates}
            videoModalStates={videoModalStates}
            musicModalStates={musicModalStates}
            groups={groups}
            setGroups={setGroups}
            setSelectedImageIndices={setSelectedImageIndices}
            setSelectedTextInputIds={setSelectedTextInputIds}
            setSelectedImageModalIds={setSelectedImageModalIds}
            setSelectedVideoModalIds={setSelectedVideoModalIds}
            setSelectedMusicModalIds={setSelectedMusicModalIds}
          />
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
      {/* Modal Overlays */}
      <ModalOverlays
        textInputStates={textInputStates}
        imageModalStates={imageModalStates}
        videoModalStates={videoModalStates}
        musicModalStates={musicModalStates}
        selectedTextInputId={selectedTextInputId}
        selectedTextInputIds={selectedTextInputIds}
        selectedImageModalId={selectedImageModalId}
        selectedImageModalIds={selectedImageModalIds}
        selectedVideoModalId={selectedVideoModalId}
        selectedVideoModalIds={selectedVideoModalIds}
        selectedMusicModalId={selectedMusicModalId}
        selectedMusicModalIds={selectedMusicModalIds}
        clearAllSelections={clearAllSelections}
        setTextInputStates={setTextInputStates}
        setSelectedTextInputId={setSelectedTextInputId}
        setSelectedTextInputIds={setSelectedTextInputIds}
        setImageModalStates={setImageModalStates}
        setSelectedImageModalId={setSelectedImageModalId}
        setSelectedImageModalIds={setSelectedImageModalIds}
        setVideoModalStates={setVideoModalStates}
        setSelectedVideoModalId={setSelectedVideoModalId}
        setSelectedVideoModalIds={setSelectedVideoModalIds}
        setMusicModalStates={setMusicModalStates}
        setSelectedMusicModalId={setSelectedMusicModalId}
        setSelectedMusicModalIds={setSelectedMusicModalIds}
        onTextCreate={onTextCreate}
        onImageSelect={onImageSelect}
        onImageGenerate={onImageGenerate}
        onVideoSelect={onVideoSelect}
        onVideoGenerate={onVideoGenerate}
        onMusicSelect={onMusicSelect}
        onMusicGenerate={onMusicGenerate}
        generatedVideoUrl={generatedVideoUrl}
        generatedMusicUrl={generatedMusicUrl}
        stageRef={stageRef}
        scale={scale}
        position={position}
        groups={groups}
      />
      {/* Action Icons for Uploaded Media */}
      {selectedImageIndex !== null && images[selectedImageIndex] && (
        <MediaActionIcons
          selectedImage={images[selectedImageIndex]}
          selectedImageIndex={selectedImageIndex}
          scale={scale}
          position={position}
          onImageDelete={onImageDelete}
          onImageDuplicate={onImageDuplicate}
          setSelectedImageIndex={setSelectedImageIndex}
          setSelectedImageIndices={setSelectedImageIndices}
        />
      )}
      {/* Context Menu - Only for text elements, not for uploaded images/videos */}
      <ContextMenu
        isOpen={contextMenuOpen && contextMenuImageIndex !== null && images[contextMenuImageIndex]?.type === 'text'}
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
                // Create a duplicate modal to the right
                const newId = `image-${Date.now()}-${Math.random()}`;
                setImageModalStates(prev => [...prev, {
                  id: newId,
                  x: modal.x + 600 + 50, // 600px width + 50px spacing
                  y: modal.y, // Same Y position
                  generatedImageUrl: modal.generatedImageUrl,
                }]);
              }
            } else if (contextMenuModalType === 'video') {
              const modal = videoModalStates.find(m => m.id === contextMenuModalId);
              if (modal) {
                // Create a duplicate modal to the right
                const newId = `video-${Date.now()}-${Math.random()}`;
                setVideoModalStates(prev => [...prev, {
                  id: newId,
                  x: modal.x + 600 + 50, // 600px width + 50px spacing
                  y: modal.y, // Same Y position
                  generatedVideoUrl: modal.generatedVideoUrl,
                }]);
              }
            } else if (contextMenuModalType === 'music') {
              const modal = musicModalStates.find(m => m.id === contextMenuModalId);
              if (modal) {
                // Create a duplicate modal to the right
                const newId = `music-${Date.now()}-${Math.random()}`;
                setMusicModalStates(prev => [...prev, {
                  id: newId,
                  x: modal.x + 600 + 50, // 600px width + 50px spacing
                  y: modal.y, // Same Y position
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
