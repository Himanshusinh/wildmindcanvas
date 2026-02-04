'use client';

import React, { useState, useEffect, useRef } from 'react';
import Konva from 'konva';
import { ModalOverlaysProps } from './types';
// Zustand Store - Image & Video State Management
import {
  useImageModalStates,
  useVideoModalStates,
  useVideoSelection,
  useUpscaleModalStates,
  useMusicModalStates,
  useMultiangleCameraModalStates,
  useExpandModalStates,
  useExpandStore,
  useExpandSelection,
  useEraseModalStates,
  useEraseStore,
  useEraseSelection,
  useVectorizeModalStates,
  useVectorizeStore,
  useVectorizeSelection,
  useRemoveBgModalStates,
  useRemoveBgStore,
  useRemoveBgSelection,
  useTextModalStates,
} from '@/modules/stores';
import { useConnectionManager } from './useConnectionManager';
import { ConnectionLines } from './ConnectionLines';
import { TextInputOverlays } from './TextInputOverlays';
import { ImageModalOverlays } from './ImageModalOverlays';
import { VideoModalOverlays } from './VideoModalOverlays';
import { VideoEditorModalOverlays } from './VideoEditorModalOverlays';
import { ImageEditorModalOverlays } from './ImageEditorModalOverlays';
import { MusicModalOverlays } from './MusicModalOverlays';
import { UpscaleModalOverlays } from './UpscaleModalOverlays';
import { RemoveBgModalOverlays } from './RemoveBgModalOverlays';
import { EraseModalOverlays } from './EraseModalOverlays';
import { ExpandModalOverlays } from './ExpandModalOverlays';
import { VectorizeModalOverlays } from './VectorizeModalOverlays';
import { NextSceneModalOverlays } from './NextSceneModalOverlays';
import { StoryboardModalOverlays } from './StoryboardModalOverlays';
import { CompareModalOverlays } from './CompareModalOverlays';
import { MultiangleCameraModalOverlays } from './MultiangleCameraModalOverlays';
import { CompareModalState } from './types';

import { ScriptFrameModalOverlays } from './ScriptFrameModalOverlays';
import { SceneFrameModalOverlays } from './SceneFrameModalOverlays';
import { ComponentCreationMenu } from './ComponentCreationMenu';
import { CanvasTextOverlays } from './CanvasTextOverlays';

export const ModalOverlays: React.FC<ModalOverlaysProps> = ({
  // textInputStates, // REMOVED: Managed by Zustand store locally
  // REMOVED: imageModalStates, videoModalStates (now managed by Zustand store)
  // imageModalStates,
  // videoModalStates,
  videoEditorModalStates,
  imageEditorModalStates,
  // REMOVED: musicModalStates (now managed by store)
  // REMOVED: upscaleModalStates (now managed by Zustand store)
  removeBgModalStates,
  eraseModalStates,
  expandModalStates,
  vectorizeModalStates,
  nextSceneModalStates,
  storyboardModalStates,
  scriptFrameModalStates,
  // scriptFrameModalStates, // Duplicate removed
  sceneFrameModalStates,
  compareModalStates,  // New
  selectedCompareModalId, // New
  selectedCompareModalIds, // New
  setCompareModalStates = () => { }, // New
  setSelectedCompareModalId = () => { }, // New
  setSelectedCompareModalIds = () => { }, // New
  onPersistCompareModalCreate, // New
  onPersistCompareModalMove, // New
  onPersistCompareModalDelete, // New
  // REMOVED: multiangleCameraModalStates (now managed by store)
  // multiangleCameraModalStates,
  // selectedMultiangleCameraModalId,
  // selectedMultiangleCameraModalIds,
  // setMultiangleCameraModalStates,
  // setSelectedMultiangleCameraModalId,
  // setSelectedMultiangleCameraModalIds,
  onPersistMultiangleCameraModalCreate, // Multiangle Camera Plugin
  onPersistMultiangleCameraModalMove, // Multiangle Camera Plugin
  onPersistMultiangleCameraModalDelete, // Multiangle Camera Plugin

  // selectedTextInputId, // REMOVED: Managed by Zustand store
  // selectedTextInputIds, // REMOVED: Managed by Zustand store
  // REMOVED: selectedImageModalId, selectedImageModalIds (now managed by Zustand store)
  // selectedImageModalId,
  // selectedImageModalIds,
  // REMOVED: selectedVideoModalId, selectedVideoModalIds (now managed by Zustand store)
  // selectedVideoModalId,
  // selectedVideoModalIds,
  selectedVideoEditorModalId,
  selectedVideoEditorModalIds,
  selectedImageEditorModalId,
  selectedImageEditorModalIds,
  // REMOVED: selectedMusicModalId, selectedMusicModalIds (now managed by store)
  // REMOVED: selectedUpscaleModalId, selectedUpscaleModalIds (now managed by store)
  selectedRemoveBgModalId,
  selectedRemoveBgModalIds,
  selectedEraseModalId,
  selectedEraseModalIds,
  selectedExpandModalId,
  selectedExpandModalIds,
  selectedVectorizeModalId,
  selectedVectorizeModalIds,
  selectedNextSceneModalId,
  selectedNextSceneModalIds,
  selectedStoryboardModalId,
  selectedStoryboardModalIds,
  selectedIds,
  setSelectionOrder,

  // Canvas Text
  canvasTextStates,
  setCanvasTextStates,
  selectedCanvasTextId,
  selectedCanvasTextIds,
  setSelectedCanvasTextId,
  setSelectedCanvasTextIds,
  onPersistCanvasTextCreate,
  onPersistCanvasTextMove,
  onPersistCanvasTextDelete,

  // Rich Text
  richTextStates,
  setRichTextStates,
  selectedRichTextId,
  selectedRichTextIds,
  setSelectedRichTextId,
  setSelectedRichTextIds,
  onPersistRichTextCreate,
  onPersistRichTextMove,
  onPersistRichTextDelete,

  isComponentDraggable, // New prop

  clearAllSelections,

  // setTextInputStates, // REMOVED: Managed by Zustand store
  // setSelectedTextInputId, // REMOVED: Managed by Zustand store
  // setSelectedTextInputIds, // REMOVED: Managed by Zustand store
  setSelectedImageIndices,
  // REMOVED: setImageModalStates, setSelectedImageModalId, setSelectedImageModalIds (now managed by Zustand store)
  // setImageModalStates,
  // setSelectedImageModalId,
  // setSelectedImageModalIds,
  // REMOVED: setVideoModalStates, setSelectedVideoModalId, setSelectedVideoModalIds (now managed by Zustand store)
  // setVideoModalStates,
  // setSelectedVideoModalId,
  // setSelectedVideoModalIds,
  setVideoEditorModalStates = () => { },
  setSelectedVideoEditorModalId = () => { },
  setSelectedVideoEditorModalIds = () => { },
  setImageEditorModalStates = () => { },
  setSelectedImageEditorModalId = () => { },
  setSelectedImageEditorModalIds = () => { },
  // REMOVED: setMusicModalStates, setSelectedMusicModalId, setSelectedMusicModalIds (now managed by store)
  // REMOVED: setUpscaleModalStates, setSelectedUpscaleModalId, setSelectedUpscaleModalIds (now managed by Zustand store)
  setRemoveBgModalStates = () => { },
  setSelectedRemoveBgModalId = () => { },
  setSelectedRemoveBgModalIds = () => { },
  setEraseModalStates = () => { },
  setSelectedEraseModalId = () => { },
  setSelectedEraseModalIds = () => { },
  // REMOVED: setExpandModalStates, setSelectedExpandModalId, setSelectedExpandModalIds (now managed by store)
  // setExpandModalStates,
  // setSelectedExpandModalId,
  // setSelectedExpandModalIds,
  setVectorizeModalStates = () => { },
  setSelectedVectorizeModalId = () => { },
  setSelectedVectorizeModalIds = () => { },
  setNextSceneModalStates = () => { },
  setSelectedNextSceneModalId = () => { },
  setSelectedNextSceneModalIds = () => { },
  setStoryboardModalStates = () => { },
  setScriptFrameModalStates = () => { },
  setSelectedStoryboardModalId = () => { },
  setSelectedStoryboardModalIds = () => { },
  setSelectionTightRect,
  setIsDragSelection,
  images = [],
  onTextCreate,
  onTextScriptGenerated,
  onImageSelect,
  onImageGenerate,
  onVideoSelect,
  onVideoGenerate,
  onMusicSelect,
  onMusicGenerate,
  generatedVideoUrl,
  generatedMusicUrl,
  stageRef,
  scale,
  position,
  onAddImageToCanvas,
  onPersistImageModalCreate,
  onPersistImageModalMove,
  onPersistImageModalDelete,
  onPersistVideoModalCreate,
  onPersistVideoModalMove,
  onPersistVideoModalDelete,
  onPersistVideoEditorModalCreate,
  onPersistVideoEditorModalMove,
  onPersistVideoEditorModalDelete,
  onOpenVideoEditor,
  onPersistImageEditorModalCreate,
  onPersistImageEditorModalMove,
  onPersistImageEditorModalDelete,
  onOpenImageEditor,
  onPersistMusicModalCreate,
  onPersistMusicModalMove,
  onPersistMusicModalDelete,
  onUpdateImageModalState,
  onPersistUpscaleModalCreate,
  onPersistUpscaleModalMove,
  onPersistUpscaleModalDelete,
  onUpscale,
  onMultiangleCamera,
  onQwenMultipleAngles,
  onPersistRemoveBgModalCreate,
  onPersistRemoveBgModalMove,
  onPersistRemoveBgModalDelete,
  onRemoveBg,
  onPersistEraseModalCreate,
  onPersistEraseModalMove,
  onPersistEraseModalDelete,
  onErase,
  onPersistExpandModalCreate,
  onPersistExpandModalMove,
  onPersistExpandModalDelete,
  onExpand,
  onPersistVectorizeModalCreate,
  onPersistVectorizeModalMove,
  onPersistVectorizeModalDelete,
  onVectorize,
  onPersistNextSceneModalCreate,
  onPersistNextSceneModalMove,
  onPersistNextSceneModalDelete,
  onPersistStoryboardModalCreate,
  onPersistStoryboardModalMove,
  onPersistStoryboardModalDelete,
  onDeleteScriptFrame,
  onScriptFramePositionChange,
  onScriptFramePositionCommit,
  onTextUpdate,
  onGenerateScenes,
  onDeleteSceneFrame,
  onDuplicateSceneFrame,
  onSceneFrameContentUpdate,
  onSceneFramePositionChange,
  onSceneFramePositionCommit,
  onPersistTextModalCreate,
  onPersistTextModalMove,
  onPersistTextModalDelete,
  connections: externalConnections,
  onConnectionsChange,
  onPersistConnectorCreate,
  onPersistConnectorDelete,
  onPluginSidebarOpen,
  onScriptGenerationStart,
  onGenerateStoryboard,
  projectId,
  setGenerationQueue,
  isChatOpen,
  viewportSize,
  showFineDetails,
  showLabelsOnly,
  isZoomedOut,
  isInteracting = false,
  setIsComponentDragging,
}) => {

  // Zustand Store - Get image and video modal states (replaces props)
  const imageModalStates = useImageModalStates();
  const textInputStates = useTextModalStates(); // Added: Get text states from store for ConnectionLines
  const videoModalStates = useVideoModalStates();
  const { selectedId: selectedVideoModalId, selectedIds: selectedVideoModalIds } = useVideoSelection();
  const [viewportUpdateKey, setViewportUpdateKey] = useState(0);
  const lastUpdateRef = useRef({ x: 0, y: 0, scale: 1 });
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Throttle viewport updates during interaction to prevent lag
  useEffect(() => {
    if (isInteracting) {
      // During interaction, skip updates to prevent lag
      return;
    }

    // Only update if position or scale actually changed
    const hasChanged =
      lastUpdateRef.current.x !== position.x ||
      lastUpdateRef.current.y !== position.y ||
      lastUpdateRef.current.scale !== scale;

    if (!hasChanged) {
      return;
    }

    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Update ref immediately to prevent duplicate updates
    lastUpdateRef.current = { x: position.x, y: position.y, scale };

    // Debounce the update to prevent rapid-fire updates
    updateTimeoutRef.current = setTimeout(() => {
      setViewportUpdateKey(prev => prev + 1);
    }, 16); // ~60fps

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [position.x, position.y, scale, isInteracting]);

  // Zustand Store
  const upscaleModalStates = useUpscaleModalStates();
  const musicModalStates = useMusicModalStates();
  const multiangleCameraModalStates = useMultiangleCameraModalStates();

  // Falling back to hooks if props are not provided (e.g. for components that don't pass them)
  const storeExpandModalStates = useExpandModalStates();
  const storeEraseModalStates = useEraseModalStates();
  const effectiveExpandModalStates = expandModalStates || storeExpandModalStates;
  const effectiveEraseModalStates = eraseModalStates || storeEraseModalStates;

  const { setExpandModalStates } = useExpandStore();
  const { selectedId: hookSelectedExpandModalId, selectedIds: hookSelectedExpandModalIds, setSelectedId: setSelectedExpandModalId, setSelectedIds: setSelectedExpandModalIds } = useExpandSelection();
  const { setEraseModalStates: hookSetEraseModalStates } = useEraseStore();
  const { selectedId: hookSelectedEraseModalId, selectedIds: hookSelectedEraseModalIds, setSelectedId: hookSetSelectedEraseModalId, setSelectedIds: hookSetSelectedEraseModalIds } = useEraseSelection();

  // Prefer props if available, otherwise use hooks
  const finalSelectedExpandModalId = selectedExpandModalId || hookSelectedExpandModalId;
  const finalSelectedExpandModalIds = selectedExpandModalIds || hookSelectedExpandModalIds;
  const finalSelectedEraseModalId = selectedEraseModalId || hookSelectedEraseModalId;
  const finalSelectedEraseModalIds = selectedEraseModalIds || hookSelectedEraseModalIds;
  const finalSetEraseModalStates = setEraseModalStates || hookSetEraseModalStates;
  const finalSetSelectedEraseModalId = setSelectedEraseModalId || hookSetSelectedEraseModalId;
  const finalSetSelectedEraseModalIds = setSelectedEraseModalIds || hookSetSelectedEraseModalIds;

  const connectionManager = useConnectionManager({
    connections: externalConnections ?? [],
    onConnectionsChange,
    onPersistConnectorCreate,
    onPersistConnectorDelete,
    imageModalStates,
    stageRef,
    position,
    scale,
    textInputStates,
    videoModalStates,
    musicModalStates,
    upscaleModalStates: upscaleModalStates ?? [],
    multiangleCameraModalStates: multiangleCameraModalStates ?? [],
    removeBgModalStates: removeBgModalStates ?? [],
    eraseModalStates: eraseModalStates ?? [],
    expandModalStates: expandModalStates ?? [],
    vectorizeModalStates: vectorizeModalStates ?? [],
    nextSceneModalStates: nextSceneModalStates ?? [],
    storyboardModalStates: storyboardModalStates ?? [],
    scriptFrameModalStates: scriptFrameModalStates ?? [],
    sceneFrameModalStates: sceneFrameModalStates ?? [],
  });

  // --- VECTORIZE SELECTION ---
  const storeVectorizeModalStates = useVectorizeModalStates();
  const finalVectorizeModalStates = vectorizeModalStates || storeVectorizeModalStates;

  const {
    selectedId: storeSelectedVectorizeModalId,
    selectedIds: storeSelectedVectorizeModalIds,
    setSelectedId: storeSetSelectedVectorizeModalId,
    setSelectedIds: storeSetSelectedVectorizeModalIds,
  } = useVectorizeSelection();

  const finalSelectedVectorizeModalId = selectedVectorizeModalId !== undefined ? selectedVectorizeModalId : storeSelectedVectorizeModalId;
  const finalSelectedVectorizeModalIds = selectedVectorizeModalIds !== undefined ? selectedVectorizeModalIds : storeSelectedVectorizeModalIds;

  const finalSetSelectedVectorizeModalId = setSelectedVectorizeModalId || storeSetSelectedVectorizeModalId;
  const finalSetSelectedVectorizeModalIds = setSelectedVectorizeModalIds || storeSetSelectedVectorizeModalIds;

  return (
    <>
      <ConnectionLines
        connections={externalConnections ?? []}
        activeDrag={connectionManager.activeDrag}
        selectedConnectionId={connectionManager.selectedConnectionId}
        onSelectConnection={connectionManager.setSelectedConnectionId}
        onDeleteConnection={connectionManager.handleDeleteConnection}
        onPersistConnectorCreate={onPersistConnectorCreate}
        onPersistConnectorDelete={onPersistConnectorDelete}
        stageRef={stageRef}
        position={position}
        scale={scale}
        isInteracting={isInteracting}
        viewportUpdateKey={viewportUpdateKey}
        scriptFrameModalStates={scriptFrameModalStates}
      />

      {/* TextInputOverlays restored for AI Text functionality */}
      {/* TextInputOverlays restored for AI Text functionality */}
      <TextInputOverlays
        // textInputStates={textInputStates} // Removed: managed by store
        // selectedTextInputId={selectedTextInputId} // Removed: managed by store
        // selectedTextInputIds={selectedTextInputIds} // Removed: managed by store
        clearAllSelections={clearAllSelections}
        // setTextInputStates={setTextInputStates} // Removed: managed by store
        // setSelectedTextInputId={setSelectedTextInputId} // Removed: managed by store
        onTextCreate={onTextCreate}
        onPersistTextModalDelete={onPersistTextModalDelete}
        onPersistTextModalMove={onPersistTextModalMove}
        stageRef={stageRef}
        scale={scale}
        position={position}
        onScriptGenerated={onTextScriptGenerated}
        onScriptGenerationStart={onScriptGenerationStart}
        connections={externalConnections ?? []}
        storyboardModalStates={storyboardModalStates}
      />

      <ImageModalOverlays
        // REMOVED: imageModalStates, selectedImageModalId, selectedImageModalIds, setImageModalStates, setSelectedImageModalId, setSelectedImageModalIds
        // These are now managed by Zustand store (useImageStore)
        clearAllSelections={clearAllSelections}
        onImageGenerate={onImageGenerate}
        onAddImageToCanvas={onAddImageToCanvas}
        onPersistImageModalCreate={onPersistImageModalCreate}
        onPersistImageModalMove={onPersistImageModalMove}
        onPersistImageModalDelete={onPersistImageModalDelete}
        onPersistConnectorCreate={onPersistConnectorCreate}
        connections={externalConnections ?? []}
        imageModalStatesForConnections={imageModalStates}
        images={images}
        textInputStates={textInputStates}
        stageRef={stageRef}
        scale={scale}
        position={position}
        sceneFrameModalStates={sceneFrameModalStates ?? []}
        scriptFrameModalStates={scriptFrameModalStates ?? []}
        storyboardModalStates={storyboardModalStates ?? []}
        isComponentDraggable={isComponentDraggable}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
        setSelectionOrder={setSelectionOrder}
        showFineDetails={showFineDetails}
        showLabelsOnly={showLabelsOnly}
        isZoomedOut={isZoomedOut}
      />

      <VideoModalOverlays
        // REMOVED: videoModalStates, selectedVideoModalId, selectedVideoModalIds, setVideoModalStates, setSelectedVideoModalId, setSelectedVideoModalIds
        // These are now managed by Zustand store (useVideoStore)
        clearAllSelections={clearAllSelections}
        onVideoGenerate={onVideoGenerate}
        onPersistVideoModalCreate={onPersistVideoModalCreate}
        onPersistVideoModalMove={onPersistVideoModalMove}
        onPersistVideoModalDelete={onPersistVideoModalDelete}
        connections={externalConnections ?? []}
        imageModalStates={imageModalStates}
        images={images}
        stageRef={stageRef}
        scale={scale}
        position={position}
        textInputStates={textInputStates}
        isComponentDraggable={isComponentDraggable}
        setGenerationQueue={setGenerationQueue}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
        setSelectionOrder={setSelectionOrder}
        showFineDetails={showFineDetails}
        showLabelsOnly={showLabelsOnly}
        isZoomedOut={isZoomedOut}
      />

      <VideoEditorModalOverlays
        videoEditorModalStates={videoEditorModalStates}
        selectedVideoEditorModalId={selectedVideoEditorModalId}
        selectedVideoEditorModalIds={selectedVideoEditorModalIds}
        clearAllSelections={clearAllSelections}
        setVideoEditorModalStates={setVideoEditorModalStates}
        setSelectedVideoEditorModalId={setSelectedVideoEditorModalId}
        setSelectedVideoEditorModalIds={setSelectedVideoEditorModalIds}
        onPersistVideoEditorModalCreate={onPersistVideoEditorModalCreate}
        onPersistVideoEditorModalMove={onPersistVideoEditorModalMove}
        onPersistVideoEditorModalDelete={onPersistVideoEditorModalDelete}
        onOpenVideoEditor={onOpenVideoEditor}
        scale={scale}
        position={position}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
      />

      <ImageEditorModalOverlays
        imageEditorModalStates={imageEditorModalStates}
        selectedImageEditorModalId={selectedImageEditorModalId}
        selectedImageEditorModalIds={selectedImageEditorModalIds}
        clearAllSelections={clearAllSelections}
        setImageEditorModalStates={setImageEditorModalStates}
        setSelectedImageEditorModalId={setSelectedImageEditorModalId}
        setSelectedImageEditorModalIds={setSelectedImageEditorModalIds}
        onPersistImageEditorModalCreate={onPersistImageEditorModalCreate}
        onPersistImageEditorModalMove={onPersistImageEditorModalMove}
        onPersistImageEditorModalDelete={onPersistImageEditorModalDelete}
        onOpenImageEditor={onOpenImageEditor}
        scale={scale}
        position={position}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
      />

      <MusicModalOverlays
        // REMOVED: props now managed by store
        // musicModalStates={musicModalStates}
        // selectedMusicModalId={selectedMusicModalId}
        // selectedMusicModalIds={selectedMusicModalIds}
        // clearAllSelections={clearAllSelections}
        // setMusicModalStates={setMusicModalStates}
        // setSelectedMusicModalId={setSelectedMusicModalId}
        // setSelectedMusicModalIds={setSelectedMusicModalIds}
        onMusicSelect={onMusicSelect}
        onMusicGenerate={onMusicGenerate}
        onPersistMusicModalCreate={onPersistMusicModalCreate}
        onPersistMusicModalMove={onPersistMusicModalMove}
        onPersistMusicModalDelete={onPersistMusicModalDelete}
        stageRef={stageRef}
        scale={scale}
        position={position}
        connections={externalConnections ?? []}
        textInputStates={textInputStates}
        projectId={projectId ?? undefined}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
      />

      <UpscaleModalOverlays
        // REMOVED: upscaleModalStates, selectedUpscaleModalId, selectedUpscaleModalIds, setUpscaleModalStates, setSelectedUpscaleModalId, setSelectedUpscaleModalIds (now managed by Zustand store)
        // upscaleModalStates={upscaleModalStates ?? []}
        // selectedUpscaleModalId={selectedUpscaleModalId ?? null}
        // selectedUpscaleModalIds={selectedUpscaleModalIds ?? []}
        clearAllSelections={clearAllSelections}
        // setUpscaleModalStates={setUpscaleModalStates}
        // setSelectedUpscaleModalId={setSelectedUpscaleModalId}
        // setSelectedUpscaleModalIds={setSelectedUpscaleModalIds}
        onUpscale={onUpscale}
        onPersistUpscaleModalCreate={onPersistUpscaleModalCreate}
        onPersistUpscaleModalMove={onPersistUpscaleModalMove}
        onPersistUpscaleModalDelete={onPersistUpscaleModalDelete}
        onPersistImageModalCreate={onPersistImageModalCreate}
        onPersistImageModalMove={onPersistImageModalMove}
        connections={externalConnections ?? []}
        imageModalStates={imageModalStates}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
        images={images}
        onPersistConnectorCreate={onPersistConnectorCreate}
        stageRef={stageRef}
        scale={scale}
        position={position}
      />
      <RemoveBgModalOverlays
        removeBgModalStates={removeBgModalStates ?? []}
        selectedRemoveBgModalId={selectedRemoveBgModalId ?? null}
        selectedRemoveBgModalIds={selectedRemoveBgModalIds ?? []}
        clearAllSelections={clearAllSelections}
        setRemoveBgModalStates={setRemoveBgModalStates}
        setSelectedRemoveBgModalId={setSelectedRemoveBgModalId}
        setSelectedRemoveBgModalIds={setSelectedRemoveBgModalIds}
        onRemoveBg={onRemoveBg}
        onPersistRemoveBgModalCreate={onPersistRemoveBgModalCreate}
        onPersistRemoveBgModalMove={onPersistRemoveBgModalMove}
        onPersistRemoveBgModalDelete={onPersistRemoveBgModalDelete}
        onPersistImageModalCreate={onPersistImageModalCreate}
        onPersistImageModalMove={onPersistImageModalMove}
        connections={externalConnections ?? []}
        imageModalStates={imageModalStates}
        images={images}
        onPersistConnectorCreate={onPersistConnectorCreate}
        stageRef={stageRef}
        scale={scale}
        position={position}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
      />
      <EraseModalOverlays
        eraseModalStates={effectiveEraseModalStates ?? []}
        selectedEraseModalId={finalSelectedEraseModalId ?? null}
        selectedEraseModalIds={finalSelectedEraseModalIds ?? []}
        clearAllSelections={clearAllSelections}
        setEraseModalStates={finalSetEraseModalStates}
        setSelectedEraseModalId={finalSetSelectedEraseModalId}
        setSelectedEraseModalIds={finalSetSelectedEraseModalIds}
        onErase={onErase}
        onPersistEraseModalCreate={onPersistEraseModalCreate}
        onPersistEraseModalMove={onPersistEraseModalMove}
        onPersistEraseModalDelete={onPersistEraseModalDelete}
        onPersistImageModalCreate={onPersistImageModalCreate}
        onPersistImageModalMove={onPersistImageModalMove}
        connections={externalConnections ?? []}
        imageModalStates={imageModalStates}
        images={images}
        onPersistConnectorCreate={onPersistConnectorCreate}
        stageRef={stageRef}
        scale={scale}
        position={position}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
      />

      <ExpandModalOverlays
        expandModalStates={effectiveExpandModalStates ?? []}
        selectedExpandModalId={finalSelectedExpandModalId ?? null}
        selectedExpandModalIds={finalSelectedExpandModalIds ?? []}
        clearAllSelections={clearAllSelections}
        setExpandModalStates={setExpandModalStates}
        setSelectedExpandModalId={setSelectedExpandModalId}
        setSelectedExpandModalIds={setSelectedExpandModalIds}
        onExpand={onExpand}
        onPersistExpandModalCreate={onPersistExpandModalCreate}
        onPersistExpandModalMove={onPersistExpandModalMove}
        onPersistExpandModalDelete={onPersistExpandModalDelete}
        onPersistImageModalCreate={onPersistImageModalCreate}
        onPersistImageModalMove={onPersistImageModalMove}
        connections={externalConnections ?? []}
        imageModalStates={imageModalStates}
        images={images}
        onPersistConnectorCreate={onPersistConnectorCreate}
        stageRef={stageRef}
        scale={scale}
        position={position}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
      />

      <VectorizeModalOverlays
        vectorizeModalStates={finalVectorizeModalStates}
        selectedVectorizeModalId={finalSelectedVectorizeModalId}
        selectedVectorizeModalIds={finalSelectedVectorizeModalIds}
        setVectorizeModalStates={setVectorizeModalStates || (() => { })}
        setSelectedVectorizeModalId={finalSetSelectedVectorizeModalId}
        setSelectedVectorizeModalIds={finalSetSelectedVectorizeModalIds}
        clearAllSelections={clearAllSelections}
        onVectorize={onVectorize}
        onPersistVectorizeModalCreate={onPersistVectorizeModalCreate}
        onPersistVectorizeModalMove={onPersistVectorizeModalMove}
        onPersistVectorizeModalDelete={onPersistVectorizeModalDelete}
        onPersistImageModalCreate={onPersistImageModalCreate}
        onPersistImageModalMove={onPersistImageModalMove}
        connections={externalConnections ?? []}
        imageModalStates={imageModalStates}
        images={images as any}
        onPersistConnectorCreate={onPersistConnectorCreate}
        stageRef={stageRef}
        scale={scale}
        position={position}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
      />

      <MultiangleCameraModalOverlays
        // REMOVED: multiangleCameraModalStates (now managed by store)
        // multiangleCameraModalStates={multiangleCameraModalStates}
        // selectedMultiangleCameraModalId={selectedMultiangleCameraModalId}
        // selectedMultiangleCameraModalIds={selectedMultiangleCameraModalIds}
        clearAllSelections={clearAllSelections}
        // setMultiangleCameraModalStates={setMultiangleCameraModalStates}
        // setSelectedMultiangleCameraModalId={setSelectedMultiangleCameraModalId}
        // setSelectedMultiangleCameraModalIds={setSelectedMultiangleCameraModalIds}
        onPersistMultiangleCameraModalCreate={onPersistMultiangleCameraModalCreate}
        onPersistMultiangleCameraModalMove={onPersistMultiangleCameraModalMove}
        onPersistMultiangleCameraModalDelete={onPersistMultiangleCameraModalDelete}
        onMultiangleCamera={onMultiangleCamera}
        onQwenMultipleAngles={onQwenMultipleAngles}
        onPersistImageModalCreate={onPersistImageModalCreate}
        onPersistImageModalMove={onPersistImageModalMove}
        connections={externalConnections ?? []}
        imageModalStates={imageModalStates}
        images={images}
        onPersistConnectorCreate={onPersistConnectorCreate}
        stageRef={stageRef}
        scale={scale}
        position={position}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
      />

      <NextSceneModalOverlays
        nextSceneModalStates={nextSceneModalStates ?? []}
        selectedNextSceneModalId={selectedNextSceneModalId ?? null}
        selectedNextSceneModalIds={selectedNextSceneModalIds ?? []}
        clearAllSelections={clearAllSelections}
        setNextSceneModalStates={setNextSceneModalStates}
        setSelectedNextSceneModalId={setSelectedNextSceneModalId}
        setSelectedNextSceneModalIds={setSelectedNextSceneModalIds}
        onPersistNextSceneModalCreate={onPersistNextSceneModalCreate}
        onPersistNextSceneModalMove={onPersistNextSceneModalMove}
        onPersistNextSceneModalDelete={onPersistNextSceneModalDelete}
        onPersistImageModalCreate={onPersistImageModalCreate}
        onPersistImageModalMove={onPersistImageModalMove}
        connections={externalConnections ?? []}
        imageModalStates={imageModalStates}
        images={images}
        onPersistConnectorCreate={onPersistConnectorCreate}
        stageRef={stageRef}
        scale={scale}
        position={position}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
      />

      <StoryboardModalOverlays
        storyboardModalStates={storyboardModalStates ?? []}
        selectedStoryboardModalId={selectedStoryboardModalId ?? null}
        selectedStoryboardModalIds={selectedStoryboardModalIds ?? []}
        clearAllSelections={clearAllSelections}
        setStoryboardModalStates={setStoryboardModalStates}
        setSelectedStoryboardModalId={setSelectedStoryboardModalId}
        setSelectedStoryboardModalIds={setSelectedStoryboardModalIds}
        onPersistStoryboardModalCreate={onPersistStoryboardModalCreate}
        onPersistStoryboardModalMove={onPersistStoryboardModalMove}
        onPersistStoryboardModalDelete={onPersistStoryboardModalDelete}
        stageRef={stageRef}
        scale={scale}
        position={position}
        connections={externalConnections ?? []}
        textInputStates={textInputStates}
        imageModalStates={imageModalStates}
        images={images}
        onGenerateStoryboard={onGenerateStoryboard}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
      />
      {/* Canvas Text Overlays */}

      <ScriptFrameModalOverlays
        scriptFrameModalStates={scriptFrameModalStates ?? []}
        onDelete={onDeleteScriptFrame}
        onPositionChange={onScriptFramePositionChange}
        onPositionCommit={onScriptFramePositionCommit}
        onTextUpdate={onTextUpdate}
        onGenerateScenes={onGenerateScenes}
        stageRef={stageRef}
        scale={scale}
        position={position}
        clearAllSelections={clearAllSelections}
      />
      <SceneFrameModalOverlays
        sceneFrameModalStates={sceneFrameModalStates ?? []}
        onDelete={onDeleteSceneFrame}
        onDuplicate={onDuplicateSceneFrame}
        onContentUpdate={onSceneFrameContentUpdate}
        onPositionChange={onSceneFramePositionChange}
        onPositionCommit={onSceneFramePositionCommit}
        stageRef={stageRef}
        scale={scale}
        position={position}
        clearAllSelections={clearAllSelections}
      />

      <CanvasTextOverlays
        canvasTextStates={canvasTextStates ?? []}
        selectedCanvasTextId={selectedCanvasTextId ?? null}
        onSelect={(id) => {
          clearAllSelections();
          if (setSelectedCanvasTextId) setSelectedCanvasTextId(id);
          if (setSelectedCanvasTextIds) setSelectedCanvasTextIds([id]);
        }}
        onUpdate={(id, updates) => {
          if (onPersistCanvasTextMove) onPersistCanvasTextMove(id, updates);
        }}
        onDelete={(id) => {
          if (onPersistCanvasTextDelete) onPersistCanvasTextDelete(id);
        }}
        scale={scale}
        position={position}
      />


      <ComponentCreationMenu
        componentMenu={connectionManager.componentMenu}
        componentMenuSearch={connectionManager.componentMenuSearch}
        setComponentMenu={connectionManager.setComponentMenu}
        setComponentMenuSearch={connectionManager.setComponentMenuSearch}
        scale={scale}
        position={position}
        onPersistTextModalCreate={onPersistTextModalCreate}
        onPersistImageModalCreate={onPersistImageModalCreate}
        onPersistVideoModalCreate={onPersistVideoModalCreate}
        onPersistMusicModalCreate={onPersistMusicModalCreate}
        onPersistUpscaleModalCreate={onPersistUpscaleModalCreate}
        // setUpscaleModalStates={setUpscaleModalStates}
        onPersistMultiangleCameraModalCreate={onPersistMultiangleCameraModalCreate}

        onPersistRemoveBgModalCreate={onPersistRemoveBgModalCreate}
        setRemoveBgModalStates={setRemoveBgModalStates}
        onPersistEraseModalCreate={onPersistEraseModalCreate}
        setEraseModalStates={setEraseModalStates}
        onPersistExpandModalCreate={onPersistExpandModalCreate}
        setExpandModalStates={setExpandModalStates}
        onPersistStoryboardModalCreate={onPersistStoryboardModalCreate}
        setStoryboardModalStates={setStoryboardModalStates}
        onPersistVectorizeModalCreate={onPersistVectorizeModalCreate}
        setVectorizeModalStates={setVectorizeModalStates}
        onPersistNextSceneModalCreate={onPersistNextSceneModalCreate}
        setNextSceneModalStates={setNextSceneModalStates}
        onPersistConnectorCreate={onPersistConnectorCreate}
      />

      <CompareModalOverlays
        compareModalStates={compareModalStates ?? []}
        selectedCompareModalId={selectedCompareModalId ?? null}
        selectedCompareModalIds={selectedCompareModalIds ?? []}
        clearAllSelections={clearAllSelections}
        setCompareModalStates={setCompareModalStates}
        setSelectedCompareModalId={setSelectedCompareModalId}
        setSelectedCompareModalIds={setSelectedCompareModalIds}
        onPersistCompareModalCreate={onPersistCompareModalCreate}
        onPersistCompareModalMove={onPersistCompareModalMove}
        onPersistCompareModalDelete={onPersistCompareModalDelete}
        stageRef={stageRef}
        scale={scale}
        position={position}
        projectId={projectId}
        onPersistImageModalCreate={onPersistImageModalCreate}
        onUpdateImageModalState={onUpdateImageModalState}
        onPersistConnectorCreate={onPersistConnectorCreate}
        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
      />
    </>
  );
};
