'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import { ImageUpload } from '@/core/types/canvas';
import { useCanvasState } from './hooks/useCanvasState';
import { useCanvasSelection } from './hooks/useCanvasSelection';
import { useCanvasEvents } from './hooks/useCanvasEvents';
import { useGroupLogic } from './hooks/useGroupLogic';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { applyStageCursor, findAvailablePositionNear } from '@/core/canvas/canvasHelpers';
import { CanvasStage } from './components/CanvasStage';
import { CanvasOverlays } from './components/CanvasOverlays';
import { CanvasProps } from './types';
import AvatarButton from './AvatarButton';
import { ChatPanel } from '../chat/ChatPanel';
// Zustand Store - Image & Video State Management
import {
  useImageModalStates, useVideoModalStates,
  useMusicModalStates, useUpscaleModalStates, useUpscaleSelection, useUpscaleStore,
  useMultiangleCameraModalStates, useMultiangleCameraSelection, useMultiangleCameraStore,
  useRemoveBgModalStates, useRemoveBgSelection, useRemoveBgStore,
  useEraseModalStates, useEraseSelection, useEraseStore,
  useExpandModalStates, useExpandSelection, useExpandStore,
  useVectorizeModalStates, useVectorizeSelection, useVectorizeStore,
} from '@/modules/stores';

export const Canvas: React.FC<CanvasProps> = (props) => {
  const {
    images = [],
    setImages,
    onImageUpdate,
    onImageDelete,
    onImageDuplicate,
    onImagesDrop,
    onLibraryMediaDrop,
    selectedTool = 'cursor',
    onToolSelect = () => { },
    onTextCreate,
    toolClickCounter = 0,
    projectId,
    externalImageModals,
    externalVideoModals,
    externalVideoEditorModals,
    externalImageEditorModals,
    externalMusicModals,
    externalUpscaleModals,
    externalMultiangleCameraModals,
    externalCompareModals,
    externalRemoveBgModals,
    externalEraseModals,
    externalExpandModals,
    externalVectorizeModals,
    externalNextSceneModals,
    externalStoryboardModals,
    externalScriptFrameModals,
    externalSceneFrameModals,
    externalTextModals,
    onPersistImageModalMove,
    onPersistTextModalMove,
    onPersistVideoModalMove,
    onPersistVideoEditorModalMove,
    onPersistMusicModalMove,
    onPersistUpscaleModalMove,
    onPersistMultiangleCameraModalMove,
    onPersistRemoveBgModalMove,
    onPersistEraseModalMove,
    onPersistExpandModalMove,
    onPersistVectorizeModalMove,
    onPersistNextSceneModalMove,
    onPersistStoryboardModalMove,
    setGenerationQueue,
    onPersistScriptFrameModalMove,
    onPersistSceneFrameModalMove,
    onPersistCompareModalMove,
    onPersistGroupCreate,
    onPersistGroupUpdate,
    onPersistGroupDelete,
    initialGroupContainerStates,
    canvasTextStates,
    setCanvasTextStates,
    selectedCanvasTextId,
    selectedCanvasTextIds,
    setSelectedCanvasTextId,
    setSelectedCanvasTextIds,
    connections = [],
    onConnectionsChange,
    isUIHidden = false,
    richTextStates,
    setRichTextStates,
    selectedRichTextId,
    selectedRichTextIds,
    setSelectedRichTextId,
    setSelectedRichTextIds,
    onPersistRichTextCreate,
    onPersistRichTextMove,
    onPersistRichTextDelete,
    onBackgroundClick,
    onBulkDelete,
    undo = () => { },
    redo = () => { },
    canUndo = false,
    canRedo = false,
  } = props;

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const selectionDragOriginRef = useRef<{ x: number; y: number } | null>(null);

  // --- STATE MANAGEMENT ---
  const canvasState = useCanvasState({
    images,
    setImages,
    onImageUpdate,
    onConnectionsChange,
    initialGroupContainerStates,
    canvasTextStates,
    setCanvasTextStates,
    selectedCanvasTextId,
    setSelectedCanvasTextId,
    compareModalStates: externalCompareModals,
    externalImageModals,
    externalVideoModals,
    externalVideoEditorModals,
    externalImageEditorModals,
    externalMusicModals,
    externalUpscaleModals,
    externalMultiangleCameraModals,
    externalRemoveBgModals,
    externalEraseModals,
    externalExpandModals,
    externalVectorizeModals,
    externalNextSceneModals,
    externalStoryboardModals,
    externalScriptFrameModals,
    externalSceneFrameModals,
    externalTextModals,
    onPersistGroupCreate,
    onPersistGroupUpdate,
    onPersistGroupDelete,
    connections,
    richTextStates,
    setRichTextStates,
    selectedRichTextId,
    setSelectedRichTextId,
  });

  // --- INITIAL CENTERING (Effect for async/late props) ---
  useEffect(() => {
    if (props.initialCenter) {
      const targetCenter = props.initialCenter;
      const s = props.initialScale ?? 1;
      const newPos = {
        x: (viewportSize.width / 2) - (targetCenter.x * s),
        y: (viewportSize.height / 2) - (targetCenter.y * s)
      };
      setPosition(newPos);
      setScale(s);
      console.log('[Canvas] Viewport updated from initialCenter prop:', targetCenter);
    }
  }, [props.initialCenter, props.initialScale]);

  // Zustand Store - Get image modal states (replaces imageModalStates from canvasState)
  const imageModalStates = useImageModalStates();
  const removeBgModalStatesFromStore = useRemoveBgModalStates();
  const eraseModalStatesFromStore = useEraseModalStates();
  const { setEraseModalStates } = useEraseStore();
  const { selectedId: selectedEraseModalId, selectedIds: selectedEraseModalIds, setSelectedId: setSelectedEraseModalId, setSelectedIds: setSelectedEraseModalIds } = useEraseSelection();
  const expandModalStatesFromStore = useExpandModalStates();
  const vectorizeModalStatesFromStore = useVectorizeModalStates();
  const { setExpandModalStates } = useExpandStore();
  const { selectedId: selectedExpandModalId, selectedIds: selectedExpandModalIds, setSelectedId: setSelectedExpandModalId, setSelectedIds: setSelectedExpandModalIds } = useExpandSelection();
  // Zustand Store - Get video modal states (replaces videoModalStates from canvasState)
  const videoModalStates = useVideoModalStates();
  // Zustand Store - Get music modal states
  const musicModalStates = useMusicModalStates();
  // Zustand Store - Get upscale modal states
  const upscaleModalStates = useUpscaleModalStates();
  // Zustand Store - Get multiangle camera modal states
  const multiangleCameraModalStates = useMultiangleCameraModalStates();

  const {
    patternImage,
    // REMOVED: imageModalStates (now managed by Zustand store)
    // imageModalStates,
    // REMOVED: videoModalStates (now managed by Zustand store)
    // videoModalStates,
    videoEditorModalStates,
    imageEditorModalStates,
    // REMOVED: musicModalStates (now managed by store)
    // musicModalStates,
    // REMOVED: upscaleModalStates (now managed by Zustand store)
    // upscaleModalStates,
    // REMOVED: multiangleCameraModalStates (now managed by Zustand store)
    // multiangleCameraModalStates,
    // REMOVED: removeBgModalStates (via store)
    // removeBgModalStates,
    // REMOVED: eraseModalStates (now managed by Zustand store)
    // eraseModalStates,
    // REMOVED: expandModalStates (now managed by store)
    // expandModalStates,
    vectorizeModalStates,
    nextSceneModalStates,
    storyboardModalStates,
    scriptFrameModalStates,
    sceneFrameModalStates,
    groupContainerStates,
    setGroupContainerStates,
    compareModalStates,
    textInputStates,
  } = canvasState;

  // --- VIEW STATE ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });
  const [scale, setScale] = useState(props.initialScale ?? 1);
  const [position, setPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      const targetCenter = props.initialCenter ?? { x: 25000, y: 25000 };
      const s = props.initialScale ?? 1;
      return {
        x: (window.innerWidth / 2) - (targetCenter.x * s),
        y: (window.innerHeight / 2) - (targetCenter.y * s)
      };
    }
    return { x: 0, y: 0 };
  });
  // No local state for selectedGroupIds, it's in useCanvasSelection
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkTheme = () => setIsDarkTheme(document.documentElement.classList.contains('dark'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // --- DATA AGGREGATION ---
  // Placeholder for canvasItemsData - will be defined after effective states

  // --- HELPERS ---
  const isComponentDraggable = useCallback((id: string) => {
    return true; // Default to all items being draggable for now
  }, []);

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- VIEWPORT-BASED VIRTUALIZATION & LOD ---
  // Compute world-space viewport bounds (same math as CanvasStage)
  const viewX = (-position.x) / scale;
  const viewY = (-position.y) / scale;
  const viewW = viewportSize.width / scale;
  const viewH = viewportSize.height / scale;

  const VIRTUALIZATION_PADDING = 1200; // world units of padding around viewport

  const viewportBounds = {
    minX: viewX - VIRTUALIZATION_PADDING,
    minY: viewY - VIRTUALIZATION_PADDING,
    maxX: viewX + viewW + VIRTUALIZATION_PADDING,
    maxY: viewY + viewH + VIRTUALIZATION_PADDING,
  };

  const isRectInViewport = (
    x: number,
    y: number,
    w: number = 600,
    h: number = 400,
  ) => {
    const { minX, minY, maxX, maxY } = viewportBounds;
    const rX2 = x + w;
    const rY2 = y + h;
    return !(rX2 < minX || x > maxX || rY2 < minY || y > maxY);
  };

  // Level-of-detail flags based on zoom level
  const showFineDetails = scale >= 0.8;
  const showLabelsOnly = scale >= 0.4 && scale < 0.8;
  const isZoomedOut = scale < 0.4;

  const updateViewportCenter = useCallback((pos: { x: number; y: number }, s: number) => {
    // Don't set state here - it's already set by the wheel handler
    // Just call the callback to notify parent components
    const worldCenter = {
      x: (viewportSize.width / 2 - pos.x) / s,
      y: (viewportSize.height / 2 - pos.y) / s
    };
    props.onViewportChange?.(worldCenter, s);
  }, [props.onViewportChange, viewportSize]);

  // Placeholder for events - will be moved down

  // Track component dragging state
  // Placeholder for interaction state - moved after events

  // Detect component dragging via global mouse events
  const [isComponentDragging, setIsComponentDragging] = React.useState(false);

  React.useEffect(() => {
    let isDragging = false;
    let dragStartTime = 0;
    let isDraggingValueSet = false;

    const handleMouseDown = (e: MouseEvent) => {
      // Check if clicking on a modal component
      const target = e.target as HTMLElement;
      const modalElement = target.closest('[data-overlay-id], [data-frame-id]');
      if (modalElement) {
        isDragging = true;
        dragStartTime = Date.now();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isDraggingValueSet && (Date.now() - dragStartTime > 50)) {
        // Only set dragging if mouse moved after initial click (prevents false positives)
        setIsComponentDragging(true);
        isDraggingValueSet = true;
      }
    };

    const endDrag = (e: MouseEvent) => {
      isDragging = false;
      isDraggingValueSet = false;
      setIsComponentDragging(false);
    };

    window.addEventListener('mousedown', handleMouseDown, true);
    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('mouseup', endDrag, true);
    // Safety: if pointer is cancelled or window loses focus, ensure we end drag
    window.addEventListener('pointercancel', endDrag as any, true);
    window.addEventListener('blur', endDrag as any);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown, true);
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('mouseup', endDrag as any, true);
      window.removeEventListener('pointercancel', endDrag as any, true);
      window.removeEventListener('blur', endDrag as any);
    };
  }, [setIsComponentDragging]);

  // --- EFFECTIVE DATA (Group Displacements) ---
  const getEffectiveStatesForCanvas = (states: any[], type: string) => {
    const overrides = new Map<string, { x: number, y: number }>();
    groupContainerStates.forEach(group => {
      if (group.children) {
        group.children.forEach((child: any) => {
          if (child.type === type) {
            overrides.set(child.id, {
              x: group.x + child.relativeTransform.x,
              y: group.y + child.relativeTransform.y
            });
          }
        });
      }
    });
    if (overrides.size === 0) return states;
    return states.map(state => {
      const id = state.id || state.elementId;
      if (!id) return state;
      const override = overrides.get(id);
      if (override) return { ...state, x: override.x, y: override.y };
      return state;
    });
  };

  const effectiveImages = getEffectiveStatesForCanvas(images, 'image');
  const effectiveImageModalStates = getEffectiveStatesForCanvas(imageModalStates, 'image-modal');
  const effectiveVideoModalStates = getEffectiveStatesForCanvas(videoModalStates, 'video-modal');
  const effectiveMusicModalStates = getEffectiveStatesForCanvas(musicModalStates, 'music-modal');
  const effectiveTextInputStates = getEffectiveStatesForCanvas(textInputStates, 'text-input');
  const effectiveUpscaleModalStates = getEffectiveStatesForCanvas(upscaleModalStates, 'upscale');
  const effectiveMultiangleCameraModalStates = getEffectiveStatesForCanvas(multiangleCameraModalStates, 'multiangle-camera');
  const effectiveRemoveBgModalStates = getEffectiveStatesForCanvas(removeBgModalStatesFromStore, 'removebg');
  const effectiveEraseModalStates = getEffectiveStatesForCanvas(eraseModalStatesFromStore, 'erase');
  const effectiveExpandModalStates = getEffectiveStatesForCanvas(expandModalStatesFromStore, 'expand');
  const effectiveVectorizeModalStates = getEffectiveStatesForCanvas(vectorizeModalStatesFromStore, 'vectorize');
  const effectiveNextSceneModalStates = getEffectiveStatesForCanvas(nextSceneModalStates, 'next-scene');
  const effectiveStoryboardModalStates = getEffectiveStatesForCanvas(storyboardModalStates, 'storyboard');
  const effectiveScriptFrameModalStates = getEffectiveStatesForCanvas(scriptFrameModalStates, 'script-frame');
  const effectiveSceneFrameModalStates = getEffectiveStatesForCanvas(sceneFrameModalStates, 'scene-frame');
  const effectiveVideoEditorModalStates = getEffectiveStatesForCanvas(videoEditorModalStates, 'video-editor-modal');
  const effectiveImageEditorModalStates = getEffectiveStatesForCanvas(imageEditorModalStates, 'image-editor-modal');
  const effectiveCompareModalStates = getEffectiveStatesForCanvas(compareModalStates, 'compare-modal');
  const effectiveCanvasTextStates = getEffectiveStatesForCanvas(canvasState.effectiveCanvasTextStates, 'canvas-text');
  const effectiveRichTextStates = getEffectiveStatesForCanvas(richTextStates || [], 'rich-text');

  const effectiveCanvasState = {
    ...canvasState,
    images: effectiveImages,
    imageModalStates: effectiveImageModalStates,
    // REMOVED: videoModalStates (now managed by Zustand store)
    // videoModalStates: effectiveVideoModalStates,
    musicModalStates: effectiveMusicModalStates,
    textInputStates: effectiveTextInputStates,
    upscaleModalStates: effectiveUpscaleModalStates,
    // REMOVED: multiangleCameraModalStates (now managed by store)
    // multiangleCameraModalStates,
    // setMultiangleCameraModalStates,
    removeBgModalStates: effectiveRemoveBgModalStates,
    eraseModalStates: effectiveEraseModalStates,
    expandModalStates: effectiveExpandModalStates,
    vectorizeModalStates: effectiveVectorizeModalStates,
    nextSceneModalStates: effectiveNextSceneModalStates,
    storyboardModalStates: effectiveStoryboardModalStates,
    scriptFrameModalStates: effectiveScriptFrameModalStates,
    sceneFrameModalStates: effectiveSceneFrameModalStates,
    videoEditorModalStates: effectiveVideoEditorModalStates,
    imageEditorModalStates: effectiveImageEditorModalStates,
    compareModalStates: effectiveCompareModalStates,
    effectiveCanvasTextStates,
    effectiveRichTextStates,
  };

  const canvasItemsData = {
    images,
    imageModalStates,
    videoModalStates,
    videoEditorModalStates,
    imageEditorModalStates,
    musicModalStates,
    multiangleCameraModalStates,
    removeBgModalStates: effectiveRemoveBgModalStates,
    eraseModalStates: effectiveEraseModalStates,
    expandModalStates: effectiveExpandModalStates,
    vectorizeModalStates: effectiveVectorizeModalStates,
    nextSceneModalStates,
    storyboardModalStates,
    scriptFrameModalStates,
    sceneFrameModalStates,
    compareModalStates,
  };

  // --- HOOKS RE-INIT WITH EFFECTIVE DATA ---
  const canvasSelection = useCanvasSelection(props, canvasItemsData as any);
  const groupLogic = useGroupLogic(canvasState, canvasSelection, props);
  const events = useCanvasEvents(
    canvasState,
    canvasSelection,
    groupLogic,
    props,
    {
      stageRef: stageRef as any,
      containerRef: containerRef as any,
    },
    {
      scale,
      setScale,
      position,
      setPosition,
      updateViewportCenter,
      navigationMode: 'trackpad'
    }
  );

  // Combined interaction state: panning OR component dragging
  const isInteracting = events.isPanning || isComponentDragging;

  const handleFitView = useCallback(() => {
    // Helper: compute bounding rect from selection or all components
    const computeSelectionBounds = (): { x: number; y: number; width: number; height: number } | null => {
      // If explicit selected ids exist, compute bounds across selected items
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let found = false;

      // Check selections first
      // Selected canvas images
      if (canvasSelection.selectedImageIndices.length > 0) {
        canvasSelection.selectedImageIndices.forEach(idx => {
          const img = images[idx];
          if (!img) return;
          const ix = img.x || 0;
          const iy = img.y || 0;
          const iw = img.width || 0;
          const ih = img.height || 0;
          minX = Math.min(minX, ix);
          minY = Math.min(minY, iy);
          maxX = Math.max(maxX, ix + iw);
          maxY = Math.max(maxY, iy + ih);
          found = true;
        });
      }

      // Selected text inputs
      if (canvasSelection.selectedTextInputIds.length > 0) {
        canvasSelection.selectedTextInputIds.forEach(id => {
          const t = textInputStates.find((tt: any) => tt.id === id);
          if (!t) return;
          minX = Math.min(minX, t.x);
          minY = Math.min(minY, t.y);
          maxX = Math.max(maxX, t.x + 300);
          maxY = Math.max(maxY, t.y + 100);
          found = true;
        });
      }

      // Check Modals
      const checkSelectionModals = (selectedIds: string[], modals: any[], width: number = 600, height: number = 400) => {
        if (selectedIds.length > 0) {
          selectedIds.forEach(id => {
            const m = modals.find(mm => mm.id === id);
            if (!m) return;
            minX = Math.min(minX, m.x);
            minY = Math.min(minY, m.y);
            maxX = Math.max(maxX, m.x + (m.frameWidth ?? width));
            maxY = Math.max(maxY, m.y + (m.frameHeight ?? height));
            found = true;
          });
        }
      };

      checkSelectionModals(canvasSelection.selectedImageModalIds, imageModalStates);
      checkSelectionModals(canvasSelection.selectedVideoModalIds, videoModalStates);
      checkSelectionModals(canvasSelection.selectedMusicModalIds, musicModalStates, 600, 300);
      checkSelectionModals(canvasSelection.selectedUpscaleModalIds, effectiveUpscaleModalStates, 600, 400);
      checkSelectionModals(canvasSelection.selectedMultiangleCameraModalIds, effectiveMultiangleCameraModalStates);
      checkSelectionModals(canvasSelection.selectedRemoveBgModalIds, effectiveRemoveBgModalStates, 600, 400);
      checkSelectionModals(canvasSelection.selectedEraseModalIds, effectiveEraseModalStates);
      checkSelectionModals(canvasSelection.selectedExpandModalIds, effectiveExpandModalStates);
      checkSelectionModals(canvasSelection.selectedVectorizeModalIds, effectiveVectorizeModalStates);
      checkSelectionModals(canvasSelection.selectedNextSceneModalIds, effectiveNextSceneModalStates);
      checkSelectionModals(canvasSelection.selectedStoryboardModalIds, effectiveStoryboardModalStates);
      checkSelectionModals(canvasSelection.selectedScriptFrameModalIds, effectiveScriptFrameModalStates);
      checkSelectionModals(canvasSelection.selectedSceneFrameModalIds, effectiveSceneFrameModalStates);
      checkSelectionModals(canvasSelection.selectedVideoEditorModalIds, effectiveVideoEditorModalStates);
      checkSelectionModals(canvasSelection.selectedCompareModalIds, effectiveCompareModalStates);

      // If selection found, return logic
      if (found) {
        return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
      }

      // If no selection, check ALL components
      // Images
      images.forEach(img => {
        if (!img) return;
        const ix = img.x || 0;
        const iy = img.y || 0;
        const iw = img.width || 0;
        const ih = img.height || 0;
        minX = Math.min(minX, ix);
        minY = Math.min(minY, iy);
        maxX = Math.max(maxX, ix + iw);
        maxY = Math.max(maxY, iy + ih);
        found = true;
      });

      // Text Inputs
      textInputStates.forEach((t: any) => {
        minX = Math.min(minX, t.x);
        minY = Math.min(minY, t.y);
        maxX = Math.max(maxX, t.x + 300);
        maxY = Math.max(maxY, t.y + 100);
        found = true;
      });

      // Modals
      const checkModals = (modals: any[], width: number = 600, height: number = 400) => {
        modals.forEach(m => {
          minX = Math.min(minX, m.x);
          minY = Math.min(minY, m.y);
          maxX = Math.max(maxX, m.x + (m.frameWidth ?? width));
          maxY = Math.max(maxY, m.y + (m.frameHeight ?? height));
          found = true;
        });
      };

      checkModals(effectiveImageModalStates);
      checkModals(effectiveVideoModalStates);
      checkModals(effectiveMusicModalStates, 600, 300);
      checkModals(effectiveUpscaleModalStates);
      checkModals(effectiveRemoveBgModalStates);
      checkModals(effectiveMultiangleCameraModalStates);
      checkModals(effectiveEraseModalStates);
      checkModals(effectiveExpandModalStates);
      checkModals(effectiveVectorizeModalStates);
      checkModals(effectiveNextSceneModalStates);
      checkModals(effectiveStoryboardModalStates);
      checkModals(effectiveScriptFrameModalStates);
      checkModals(effectiveSceneFrameModalStates);
      checkModals(effectiveVideoEditorModalStates);
      checkModals(effectiveCompareModalStates);

      // Canvas Text
      effectiveCanvasTextStates.forEach((t: any) => {
        minX = Math.min(minX, t.x);
        minY = Math.min(minY, t.y);
        maxX = Math.max(maxX, t.x + (t.width || 300));
        maxY = Math.max(maxY, t.y + (t.height || 100));
        found = true;
      });

      // Rich Text
      effectiveRichTextStates.forEach((t: any) => {
        minX = Math.min(minX, t.x);
        minY = Math.min(minY, t.y);
        maxX = Math.max(maxX, t.x + (t.width || 400));
        maxY = Math.max(maxY, t.y + (t.height || 200));
        found = true;
      });

      if (found) {
        return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
      }
      return null;
    };

    const rect = computeSelectionBounds();
    if (!rect) return;

    // Add padding around rect (percentage based for better framing)
    const paddingX = rect.width * 0.1;
    const paddingY = rect.height * 0.1;
    const targetWidth = rect.width + paddingX * 2;
    const targetHeight = rect.height + paddingY * 2;

    // Compute scale to fit target into viewport
    const scaleX = viewportSize.width / targetWidth;
    const scaleY = viewportSize.height / targetHeight;
    // Use a tiny margin multiplier
    const newScale = Math.max(0.1, Math.min(5, Math.min(scaleX, scaleY) * 0.95));

    // Center rect in viewport
    const rectCenterX = rect.x + rect.width / 2;
    const rectCenterY = rect.y + rect.height / 2;
    const newPos = {
      x: viewportSize.width / 2 - rectCenterX * newScale,
      y: viewportSize.height / 2 - rectCenterY * newScale,
    };

    setPosition(newPos);
    setScale(newScale);
    updateViewportCenter(newPos, newScale);
  }, [
    images, canvasSelection, updateViewportCenter, viewportSize,
    textInputStates, imageModalStates, videoModalStates, musicModalStates,
    multiangleCameraModalStates,
    effectiveEraseModalStates, setEraseModalStates, vectorizeModalStates, nextSceneModalStates,
    storyboardModalStates, scriptFrameModalStates, sceneFrameModalStates,
    videoEditorModalStates, compareModalStates,
    effectiveImageModalStates, effectiveVideoModalStates, effectiveMusicModalStates,
    effectiveUpscaleModalStates, effectiveMultiangleCameraModalStates, effectiveRemoveBgModalStates,
    effectiveEraseModalStates, effectiveExpandModalStates, effectiveVectorizeModalStates,
    effectiveNextSceneModalStates, effectiveStoryboardModalStates, effectiveScriptFrameModalStates,
    effectiveSceneFrameModalStates, effectiveVideoEditorModalStates, effectiveCompareModalStates,
    effectiveCanvasTextStates, effectiveRichTextStates
  ]);

  // --- SHORTCUTS ---
  useKeyboardShortcuts({
    onFitView: handleFitView,
    // Undo/Redo
    // Undo/Redo
    canUndo: canUndo,
    canRedo: canRedo,
    undo: undo,
    redo: redo,

    // Keys
    setIsSpacePressed: events.setIsShiftPressed, // Note: events returns setIsShiftPressed, need to verify isSpacePressed is exposed
    applyStageCursorWrapper: (style, force) => {
      if (stageRef.current) applyStageCursor(stageRef.current, style, selectedTool, force);
    },
    setIsShiftPressed: events.setIsShiftPressed,

    // Selection
    selectedImageIndices: canvasSelection.selectedImageIndices,
    selectedImageModalIds: canvasSelection.selectedImageModalIds,
    selectedVideoModalIds: canvasSelection.selectedVideoModalIds,

    selectedTextInputIds: canvasSelection.selectedTextInputIds,
    selectedCanvasTextIds: canvasSelection.effectiveSelectedCanvasTextIds,

    // Canvas Text
    selectedCanvasTextId: canvasState.effectiveSelectedCanvasTextId,
    effectiveSetCanvasTextStates: canvasState.effectiveSetCanvasTextStates,
    effectiveSetSelectedCanvasTextId: canvasState.effectiveSetSelectedCanvasTextId,
    setSelectedCanvasTextIds: canvasSelection.effectiveSetSelectedCanvasTextIds,
    onPersistCanvasTextDelete: props.onPersistCanvasTextDelete,

    // Creation
    lastCreateTimesRef: useRef({}), // We create a ref for this
    viewportSize,
    position,
    scale,
    findAvailablePositionNearWrapper: (x, y) => findAvailablePositionNear(x, y, [
      ...images.map(i => ({ x: i.x || 0, y: i.y || 0, width: i.width || 400, height: i.height || 400 })),
      ...imageModalStates.map((m: any) => ({ x: m.x, y: m.y, width: m.frameWidth || 512, height: m.frameHeight || 512 })),
      // Add others as needed
    ]),

    // State setters
    // REMOVED: setTextInputStates (now managed by store directly in shortcuts where possible, or kept if canvasState provides it for other reasons)
    // setTextInputStates: canvasState.setTextInputStates, 


    // Persist Create
    onPersistTextModalCreate: props.onPersistTextModalCreate,
    onPersistImageModalCreate: props.onPersistImageModalCreate,
    onPersistVideoModalCreate: props.onPersistVideoModalCreate,
    onPersistMusicModalCreate: props.onPersistMusicModalCreate,

    // Deletion Handlers
    selectionRectCoords: events.selectionRectCoords,
    setSelectionRectCoords: (c) => { /* Only setter needed if strict */ }, // events manages this internally usually
    selectionBox: canvasSelection.selectionBox,
    setSelectionBox: canvasSelection.setSelectionBox,
    setIsSelecting: events.setIsSelecting,
    selectionTightRect: canvasSelection.selectionTightRect,
    setSelectionTightRect: canvasSelection.setSelectionTightRect,
    selectionTransformerRect: canvasSelection.selectionTransformerRect,
    setSelectionTransformerRect: canvasSelection.setSelectionTransformerRect,
    setIsDragSelection: canvasSelection.setIsDragSelection,

    // Image Deletion
    selectedImageIndex: canvasSelection.selectedImageIndex,
    onImageDelete: onImageDelete,
    setSelectedImageIndex: canvasSelection.setSelectedImageIndex,
    setSelectedImageIndices: canvasSelection.setSelectedImageIndices,
    selectedImageModalId: canvasSelection.selectedImageModalId,
    setSelectedImageModalId: canvasSelection.setSelectedImageModalId,
    setSelectedImageModalIds: canvasSelection.setSelectedImageModalIds,
    onPersistImageModalDelete: props.onPersistImageModalDelete,

    // Video Deletion
    selectedVideoModalId: canvasSelection.selectedVideoModalId,
    setSelectedVideoModalId: canvasSelection.setSelectedVideoModalId,
    setSelectedVideoModalIds: canvasSelection.setSelectedVideoModalIds,
    onPersistVideoModalDelete: props.onPersistVideoModalDelete,

    // Video Editor Deletion
    selectedVideoEditorModalIds: canvasSelection.selectedVideoEditorModalIds,
    selectedVideoEditorModalId: canvasSelection.selectedVideoEditorModalId,
    videoEditorModalStates: canvasState.videoEditorModalStates,
    setVideoEditorModalStates: canvasState.setVideoEditorModalStates,
    setSelectedVideoEditorModalId: canvasSelection.setSelectedVideoEditorModalId,
    setSelectedVideoEditorModalIds: canvasSelection.setSelectedVideoEditorModalIds,
    onPersistVideoEditorModalDelete: props.onPersistVideoEditorModalDelete,

    // Image Editor Deletion
    selectedImageEditorModalIds: canvasSelection.selectedImageEditorModalIds,
    selectedImageEditorModalId: canvasSelection.selectedImageEditorModalId,
    imageEditorModalStates: canvasState.imageEditorModalStates,
    setImageEditorModalStates: canvasState.setImageEditorModalStates,
    setSelectedImageEditorModalId: canvasSelection.setSelectedImageEditorModalId,
    setSelectedImageEditorModalIds: canvasSelection.setSelectedImageEditorModalIds,
    onPersistImageEditorModalDelete: props.onPersistImageEditorModalDelete,

    // Music Deletion
    selectedMusicModalId: canvasSelection.selectedMusicModalId,
    setSelectedMusicModalId: canvasSelection.setSelectedMusicModalId,
    setSelectedMusicModalIds: canvasSelection.setSelectedMusicModalIds,
    onPersistMusicModalDelete: props.onPersistMusicModalDelete,

    // Text Input Deletion
    selectedTextInputId: canvasSelection.selectedTextInputId,
    setSelectedTextInputId: canvasSelection.setSelectedTextInputId,
    setSelectedTextInputIds: canvasSelection.setSelectedTextInputIds,
    onPersistTextModalDelete: props.onPersistTextModalDelete,

    // Upscale Deletion

    onPersistUpscaleModalDelete: props.onPersistUpscaleModalDelete,

    // Multiangle Deletion
    // Multiangle Deletion
    onPersistMultiangleCameraModalDelete: props.onPersistMultiangleCameraModalDelete,

    // Rich Text Deletion
    selectedRichTextId: canvasSelection.selectedRichTextId,
    selectedRichTextIds: canvasSelection.selectedRichTextIds,
    richTextStates: canvasState.richTextStates,
    setSelectedRichTextId: canvasSelection.setSelectedRichTextId,
    setSelectedRichTextIds: canvasSelection.setSelectedRichTextIds,
    onPersistRichTextDelete: props.onPersistRichTextDelete,

    // RemoveBG Deletion
    // REMOVED: passed props (now hooks)
    // selectedRemoveBgModalIds: canvasSelection.selectedRemoveBgModalIds,
    // selectedRemoveBgModalId: canvasSelection.selectedRemoveBgModalId,
    // setRemoveBgModalStates: canvasState.setRemoveBgModalStates,
    // setSelectedRemoveBgModalId: canvasSelection.setSelectedRemoveBgModalId,
    // setSelectedRemoveBgModalIds: canvasSelection.setSelectedRemoveBgModalIds,
    onPersistRemoveBgModalDelete: props.onPersistRemoveBgModalDelete,

    // Erase Deletion
    // Erase Deletion
    // REMOVED: eraseModalStates props (now managed by store)
    // selectedEraseModalIds: canvasSelection.selectedEraseModalIds,
    // selectedEraseModalId: canvasSelection.selectedEraseModalId,
    // eraseModalStates: canvasState.eraseModalStates,
    // setEraseModalStates: canvasState.setEraseModalStates,
    // setSelectedEraseModalId: canvasSelection.setSelectedEraseModalId,
    // setSelectedEraseModalIds: canvasSelection.setSelectedEraseModalIds,
    onPersistEraseModalDelete: props.onPersistEraseModalDelete,

    // Expand deletion
    // REMOVED: expandModalStates props (now managed by store)
    // selectedExpandModalIds: canvasSelection.selectedExpandModalIds,
    // selectedExpandModalId: canvasSelection.selectedExpandModalId,
    // expandModalStates: canvasState.expandModalStates,
    // setExpandModalStates: canvasState.setExpandModalStates,
    // setSelectedExpandModalId: canvasSelection.setSelectedExpandModalId,
    // setSelectedExpandModalIds: canvasSelection.setSelectedExpandModalIds,
    onPersistExpandModalDelete: props.onPersistExpandModalDelete,

    // Vectorize Deletion
    selectedVectorizeModalIds: canvasSelection.selectedVectorizeModalIds,
    selectedVectorizeModalId: canvasSelection.selectedVectorizeModalId,
    vectorizeModalStates: canvasState.vectorizeModalStates,
    setVectorizeModalStates: canvasState.setVectorizeModalStates,
    setSelectedVectorizeModalId: canvasSelection.setSelectedVectorizeModalId,
    setSelectedVectorizeModalIds: canvasSelection.setSelectedVectorizeModalIds,
    onPersistVectorizeModalDelete: props.onPersistVectorizeModalDelete,

    // Next Scene Deletion
    selectedNextSceneModalIds: canvasSelection.selectedNextSceneModalIds,
    selectedNextSceneModalId: canvasSelection.selectedNextSceneModalId,
    nextSceneModalStates: canvasState.nextSceneModalStates,
    setNextSceneModalStates: canvasState.setNextSceneModalStates,
    setSelectedNextSceneModalId: canvasSelection.setSelectedNextSceneModalId,
    setSelectedNextSceneModalIds: canvasSelection.setSelectedNextSceneModalIds,
    onPersistNextSceneModalDelete: props.onPersistNextSceneModalDelete,

    // Storyboard Deletion
    selectedStoryboardModalIds: canvasSelection.selectedStoryboardModalIds,
    selectedStoryboardModalId: canvasSelection.selectedStoryboardModalId,
    storyboardModalStates: canvasState.storyboardModalStates,
    setStoryboardModalStates: canvasState.setStoryboardModalStates,
    setSelectedStoryboardModalId: canvasSelection.setSelectedStoryboardModalId,
    setSelectedStoryboardModalIds: canvasSelection.setSelectedStoryboardModalIds,
    onPersistStoryboardModalDelete: props.onPersistStoryboardModalDelete,

    // Script Frame Deletion
    selectedScriptFrameModalIds: canvasSelection.selectedScriptFrameModalIds,
    selectedScriptFrameModalId: canvasSelection.selectedScriptFrameModalId,
    scriptFrameModalStates: canvasState.scriptFrameModalStates,
    setScriptFrameModalStates: canvasState.setScriptFrameModalStates,
    setSelectedScriptFrameModalId: canvasSelection.setSelectedScriptFrameModalId,
    setSelectedScriptFrameModalIds: canvasSelection.setSelectedScriptFrameModalIds,
    onPersistScriptFrameModalDelete: props.onPersistScriptFrameModalDelete,

    // Scene Frame Deletion
    selectedSceneFrameModalIds: canvasSelection.selectedSceneFrameModalIds,
    selectedSceneFrameModalId: canvasSelection.selectedSceneFrameModalId,
    sceneFrameModalStates: canvasState.sceneFrameModalStates,
    setSceneFrameModalStates: canvasState.setSceneFrameModalStates,
    setSelectedSceneFrameModalId: canvasSelection.setSelectedSceneFrameModalId,
    setSelectedSceneFrameModalIds: canvasSelection.setSelectedSceneFrameModalIds,
    onPersistSceneFrameModalDelete: props.onPersistSceneFrameModalDelete,

    // Compare Deletion
    selectedCompareModalIds: canvasSelection.selectedCompareModalIds,
    selectedCompareModalId: canvasSelection.selectedCompareModalId,
    compareModalStates: canvasState.compareModalStates,
    setCompareModalStates: canvasState.setCompareModalStates,
    setSelectedCompareModalId: canvasSelection.setSelectedCompareModalId,
    setSelectedCompareModalIds: canvasSelection.setSelectedCompareModalIds,
    onPersistCompareModalDelete: props.onPersistCompareModalDelete,

    // Bulk Delete
    onBulkDelete: onBulkDelete,


    // Group Deletion
    selectedGroupIds: canvasSelection.selectedGroupIds,
    groupContainerStates,
    setGroupContainerStates,
    setSelectedGroupIds: canvasSelection.setSelectedGroupIds,
    onPersistGroupDelete: props.onPersistGroupDelete,


    images,
    // textInputStates: canvasState.textInputStates, // REMOVED: Managed by store
    // REMOVED: imageModalStates (now using Zustand store)
    // imageModalStates,
    // REMOVED: videoModalStates (now using Zustand store)
    // videoModalStates,
    musicModalStates,

    setScale,
    setPosition,
    updateViewportCenter,

    isPanning: events.isPanning,
    stageRef: stageRef,
    selectedTool
  });


  // Handle window resize
  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Ensure we don't set zero or invalid sizes which can happen during initial layout
        if (width > 0 && height > 0) {
          setViewportSize({ width, height });
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    // Initial check (fallback)
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current;
      if (offsetWidth > 0 && offsetHeight > 0) {
        setViewportSize({ width: offsetWidth, height: offsetHeight });
      }
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const layerRef = useRef<Konva.Layer | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };


  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const json = e.dataTransfer.getData('application/json');
    const text = e.dataTransfer.getData('text/plain');

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - position.x) / scale;
    const y = (e.clientY - rect.top - position.y) / scale;

    if (json) {
      try {
        const media = JSON.parse(json);
        console.log('[Canvas] Dropped library media (JSON):', media);
        onLibraryMediaDrop?.(media, x, y);
      } catch (err) {
        console.error('[Canvas] Failed to parse dropped media JSON:', err);
        if (text && text.startsWith('http')) {
          onLibraryMediaDrop?.({ id: `drop-${Date.now()}`, url: text, type: 'uploaded' } as any, x, y);
        }
      }
    } else if (text && text.startsWith('http')) {
      console.log('[Canvas] Dropped library media (URL):', text);
      onLibraryMediaDrop?.({ id: `drop-${Date.now()}`, url: text, type: 'uploaded' } as any, x, y);
    } else if (e.dataTransfer.files.length > 0) {
      onImagesDrop?.(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-screen overflow-hidden ${isDarkTheme ? 'bg-[#1a1b26]' : 'bg-[#f0f0f3]'}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CanvasStage
        canvasState={effectiveCanvasState as any}
        canvasSelection={canvasSelection}
        canvasEvents={events}
        groupLogic={groupLogic}
        props={props}
        refs={{
          stageRef: stageRef as any,
          layerRef: layerRef as any
        }}
        viewportSize={viewportSize}
        position={position}
        scale={scale}
        selectedGroupIds={canvasSelection.selectedGroupIds}
        isDarkTheme={isDarkTheme}
        handleRichTextUpdate={canvasState.handleRichTextUpdate}
      />

      <CanvasOverlays
        canvasState={effectiveCanvasState as any}
        canvasSelection={canvasSelection}
        props={props}
        stageRef={stageRef as any}
        position={position}
        scale={scale}
        viewportSize={viewportSize}
        isComponentDraggable={isComponentDraggable}
        onImageUpdate={onImageUpdate || (() => { })}
        isLoading={false}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        activeGenerationCount={0}
        onFitView={handleFitView}
        setGenerationQueue={setGenerationQueue}
        isChatOpen={isChatOpen}
        isInteracting={isInteracting}
        setIsComponentDragging={setIsComponentDragging}
      />

      {!isUIHidden && (
        <>
          <AvatarButton
            scale={1}
            onClick={() => setIsSettingsOpen(true)}
            isHidden={isUIHidden}
          />
          <ChatPanel
            canvasState={effectiveCanvasState as any}
            canvasSelection={canvasSelection}
            props={props}
            viewportSize={viewportSize}
            position={position}
            scale={scale}
            isOpen={isChatOpen}
            setIsOpen={setIsChatOpen}
          />
        </>
      )}
    </div>
  );
};

export default Canvas;
