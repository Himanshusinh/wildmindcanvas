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

export const Canvas: React.FC<CanvasProps> = (props) => {
  const {
    images = [],
    setImages,
    onImageUpdate,
    onImageDelete,
    onImageDownload,
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

  const {
    patternImage,
    imageModalStates,
    videoModalStates,
    videoEditorModalStates,
    musicModalStates,
    upscaleModalStates,
    multiangleCameraModalStates,
    removeBgModalStates,
    eraseModalStates,
    expandModalStates,
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
  const canvasItemsData = {
    images,
    imageModalStates,
    videoModalStates,
    videoEditorModalStates,
    musicModalStates,
    upscaleModalStates,
    multiangleCameraModalStates,
    removeBgModalStates,
    eraseModalStates,
    expandModalStates,
    vectorizeModalStates,
    nextSceneModalStates,
    storyboardModalStates,
    scriptFrameModalStates,
    sceneFrameModalStates,
    compareModalStates,
  };

  // --- HELPERS ---
  const isComponentDraggable = useCallback((id: string) => {
    return true; // Default to all items being draggable for now
  }, []);

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- HOOKS ---
  const canvasSelection = useCanvasSelection(props, canvasItemsData as any);

  const groupLogic = useGroupLogic(canvasState, canvasSelection, props);

  const updateViewportCenter = useCallback((pos: { x: number; y: number }, s: number) => {
    setScale(s);
    setPosition(pos);
    // Convert stage position to world center coordinates
    const worldCenter = {
      x: (viewportSize.width / 2 - pos.x) / s,
      y: (viewportSize.height / 2 - pos.y) / s
    };
    props.onViewportChange?.(worldCenter, s);
  }, [props.onViewportChange, viewportSize]);

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

  // --- EFFECTIVE DATA (Group Displacements) ---
  const effectiveImages = groupLogic.getEffectiveStates(images, 'image');
  const effectiveImageModalStates = groupLogic.getEffectiveStates(imageModalStates, 'image-modal');
  const effectiveVideoModalStates = groupLogic.getEffectiveStates(videoModalStates, 'video-modal');
  const effectiveMusicModalStates = groupLogic.getEffectiveStates(musicModalStates, 'music-modal');
  const effectiveTextInputStates = groupLogic.getEffectiveStates(textInputStates, 'text-input');
  const effectiveUpscaleModalStates = groupLogic.getEffectiveStates(upscaleModalStates, 'upscale');
  const effectiveMultiangleCameraModalStates = groupLogic.getEffectiveStates(multiangleCameraModalStates, 'multiangle-camera');
  const effectiveRemoveBgModalStates = groupLogic.getEffectiveStates(removeBgModalStates, 'removebg');
  const effectiveEraseModalStates = groupLogic.getEffectiveStates(eraseModalStates, 'erase');
  const effectiveExpandModalStates = groupLogic.getEffectiveStates(expandModalStates, 'expand');
  const effectiveVectorizeModalStates = groupLogic.getEffectiveStates(vectorizeModalStates, 'vectorize');
  const effectiveNextSceneModalStates = groupLogic.getEffectiveStates(nextSceneModalStates, 'next-scene');
  const effectiveStoryboardModalStates = groupLogic.getEffectiveStates(storyboardModalStates, 'storyboard');
  const effectiveScriptFrameModalStates = groupLogic.getEffectiveStates(scriptFrameModalStates, 'script-frame');
  const effectiveSceneFrameModalStates = groupLogic.getEffectiveStates(sceneFrameModalStates, 'scene-frame');
  const effectiveVideoEditorModalStates = groupLogic.getEffectiveStates(videoEditorModalStates, 'video-editor-modal');
  const effectiveCompareModalStates = groupLogic.getEffectiveStates(compareModalStates, 'compare-modal');
  const effectiveCanvasTextStates = groupLogic.getEffectiveStates(canvasState.effectiveCanvasTextStates, 'canvas-text');

  const effectiveCanvasState = {
    ...canvasState,
    images: effectiveImages,
    imageModalStates: effectiveImageModalStates,
    videoModalStates: effectiveVideoModalStates,
    musicModalStates: effectiveMusicModalStates,
    textInputStates: effectiveTextInputStates,
    upscaleModalStates: effectiveUpscaleModalStates,
    multiangleCameraModalStates: effectiveMultiangleCameraModalStates,
    removeBgModalStates: effectiveRemoveBgModalStates,
    eraseModalStates: effectiveEraseModalStates,
    expandModalStates: effectiveExpandModalStates,
    vectorizeModalStates: effectiveVectorizeModalStates,
    nextSceneModalStates: effectiveNextSceneModalStates,
    storyboardModalStates: effectiveStoryboardModalStates,
    scriptFrameModalStates: effectiveScriptFrameModalStates,
    sceneFrameModalStates: effectiveSceneFrameModalStates,
    videoEditorModalStates: effectiveVideoEditorModalStates,
    compareModalStates: effectiveCompareModalStates,
    effectiveCanvasTextStates,
  };

  // --- SHORTCUTS ---
  useKeyboardShortcuts({
    // Undo/Redo
    canUndo: canvasState.canUndo,
    canRedo: canvasState.canRedo,
    undo: canvasState.undo,
    redo: canvasState.redo,

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
    selectedMusicModalIds: canvasSelection.selectedMusicModalIds,
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
    setTextInputStates: canvasState.setTextInputStates,
    setImageModalStates: canvasState.setImageModalStates,
    setVideoModalStates: canvasState.setVideoModalStates,
    setMusicModalStates: canvasState.setMusicModalStates,

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
    selectedUpscaleModalIds: canvasSelection.selectedUpscaleModalIds,
    selectedUpscaleModalId: canvasSelection.selectedUpscaleModalId,
    upscaleModalStates: canvasState.upscaleModalStates,
    setUpscaleModalStates: canvasState.setUpscaleModalStates,
    setSelectedUpscaleModalId: canvasSelection.setSelectedUpscaleModalId,
    setSelectedUpscaleModalIds: canvasSelection.setSelectedUpscaleModalIds,
    onPersistUpscaleModalDelete: props.onPersistUpscaleModalDelete,

    // Multiangle Deletion
    selectedMultiangleCameraModalIds: canvasSelection.selectedMultiangleCameraModalIds,
    selectedMultiangleCameraModalId: canvasSelection.selectedMultiangleCameraModalId,
    multiangleCameraModalStates: canvasState.multiangleCameraModalStates,
    setMultiangleCameraModalStates: canvasState.setMultiangleCameraModalStates,
    setSelectedMultiangleCameraModalId: canvasSelection.setSelectedMultiangleCameraModalId,
    setSelectedMultiangleCameraModalIds: canvasSelection.setSelectedMultiangleCameraModalIds,
    onPersistMultiangleCameraModalDelete: props.onPersistMultiangleCameraModalDelete,

    // RemoveBG Deletion
    selectedRemoveBgModalIds: canvasSelection.selectedRemoveBgModalIds,
    selectedRemoveBgModalId: canvasSelection.selectedRemoveBgModalId,
    removeBgModalStates: canvasState.removeBgModalStates,
    setRemoveBgModalStates: canvasState.setRemoveBgModalStates,
    setSelectedRemoveBgModalId: canvasSelection.setSelectedRemoveBgModalId,
    setSelectedRemoveBgModalIds: canvasSelection.setSelectedRemoveBgModalIds,
    onPersistRemoveBgModalDelete: props.onPersistRemoveBgModalDelete,

    // Erase Deletion
    selectedEraseModalIds: canvasSelection.selectedEraseModalIds,
    selectedEraseModalId: canvasSelection.selectedEraseModalId,
    eraseModalStates: canvasState.eraseModalStates,
    setEraseModalStates: canvasState.setEraseModalStates,
    setSelectedEraseModalId: canvasSelection.setSelectedEraseModalId,
    setSelectedEraseModalIds: canvasSelection.setSelectedEraseModalIds,
    onPersistEraseModalDelete: props.onPersistEraseModalDelete,

    // Vectorize Deletion
    selectedVectorizeModalIds: canvasSelection.selectedVectorizeModalIds,
    selectedVectorizeModalId: canvasSelection.selectedVectorizeModalId,
    vectorizeModalStates: canvasState.vectorizeModalStates,
    setVectorizeModalStates: canvasState.setVectorizeModalStates,
    setSelectedVectorizeModalId: canvasSelection.setSelectedVectorizeModalId,
    setSelectedVectorizeModalIds: canvasSelection.setSelectedVectorizeModalIds,
    onPersistVectorizeModalDelete: props.onPersistVectorizeModalDelete,

    // Expand Deletion
    selectedExpandModalIds: canvasSelection.selectedExpandModalIds,
    selectedExpandModalId: canvasSelection.selectedExpandModalId,
    expandModalStates: canvasState.expandModalStates,
    setExpandModalStates: canvasState.setExpandModalStates,
    setSelectedExpandModalId: canvasSelection.setSelectedExpandModalId,
    setSelectedExpandModalIds: canvasSelection.setSelectedExpandModalIds,
    onPersistExpandModalDelete: props.onPersistExpandModalDelete,

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
    handleDeleteScriptFrame: (id) => {/* Impl or pass from logic */ },
    setSelectedScriptFrameModalId: canvasSelection.setSelectedScriptFrameModalId,
    setSelectedScriptFrameModalIds: canvasSelection.setSelectedScriptFrameModalIds,

    // Scene Frame Deletion
    selectedSceneFrameModalIds: canvasSelection.selectedSceneFrameModalIds,
    selectedSceneFrameModalId: canvasSelection.selectedSceneFrameModalId,
    handleDeleteSceneFrame: (id) => {/* Impl or pass from logic */ },
    setSelectedSceneFrameModalId: canvasSelection.setSelectedSceneFrameModalId,
    setSelectedSceneFrameModalIds: canvasSelection.setSelectedSceneFrameModalIds,

    // Next Scene Deletion
    selectedNextSceneModalIds: canvasSelection.selectedNextSceneModalIds,
    selectedNextSceneModalId: canvasSelection.selectedNextSceneModalId,
    nextSceneModalStates: canvasState.nextSceneModalStates,
    setNextSceneModalStates: canvasState.setNextSceneModalStates,
    setSelectedNextSceneModalId: canvasSelection.setSelectedNextSceneModalId,
    setSelectedNextSceneModalIds: canvasSelection.setSelectedNextSceneModalIds,
    onPersistNextSceneModalDelete: props.onPersistNextSceneModalDelete,

    // Compare Deletion
    selectedCompareModalIds: canvasSelection.selectedCompareModalIds,
    selectedCompareModalId: canvasSelection.selectedCompareModalId,
    compareModalStates: canvasState.compareModalStates,
    setCompareModalStates: canvasState.setCompareModalStates,
    setSelectedCompareModalId: canvasSelection.setSelectedCompareModalId,
    setSelectedCompareModalIds: canvasSelection.setSelectedCompareModalIds,
    onPersistCompareModalDelete: props.onPersistCompareModalDelete,

    // Group Deletion
    selectedGroupIds: canvasSelection.selectedGroupIds,
    groupContainerStates,
    setGroupContainerStates,
    setSelectedGroupIds: canvasSelection.setSelectedGroupIds,
    onPersistGroupDelete: props.onPersistGroupDelete,

    images,
    textInputStates: canvasState.textInputStates,
    imageModalStates,
    videoModalStates,
    musicModalStates,

    setScale,
    setPosition,
    updateViewportCenter,

    isPanning: events.isPanning,
    stageRef: stageRef,
    selectedTool
  });


  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      />

      {!isUIHidden && (
        <AvatarButton
          scale={1}
          onClick={() => setIsSettingsOpen(true)}
          isHidden={isUIHidden}
        />
      )}
    </div>
  );
};

export default Canvas;
