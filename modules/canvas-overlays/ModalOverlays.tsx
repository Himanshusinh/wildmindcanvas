'use client';

import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';

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
  useMultiangleCameraSelection,
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
  useCompareStore,
  useNextSceneStore,
  useStoryboardModalStates,
  useSelectedStoryboardModalId,
  useSelectedStoryboardModalIds,
} from '@/modules/stores';
import { useConnectionManager } from './useConnectionManager';
import { ConnectionLines } from './ConnectionLines';

// Lazy load modal overlays
const TextInputOverlays = lazy(() => import('./TextInputOverlays').then(m => ({ default: m.TextInputOverlays })));
const ImageModalOverlays = lazy(() => import('./ImageModalOverlays').then(m => ({ default: m.ImageModalOverlays })));
const VideoModalOverlays = lazy(() => import('./VideoModalOverlays').then(m => ({ default: m.VideoModalOverlays })));
const VideoEditorModalOverlays = lazy(() => import('./VideoEditorModalOverlays').then(m => ({ default: m.VideoEditorModalOverlays })));
const ImageEditorModalOverlays = lazy(() => import('./ImageEditorModalOverlays').then(m => ({ default: m.ImageEditorModalOverlays })));
const MusicModalOverlays = lazy(() => import('./MusicModalOverlays').then(m => ({ default: m.MusicModalOverlays })));
const UpscaleModalOverlays = lazy(() => import('./UpscaleModalOverlays').then(m => ({ default: m.UpscaleModalOverlays })));
const RemoveBgModalOverlays = lazy(() => import('./RemoveBgModalOverlays').then(m => ({ default: m.RemoveBgModalOverlays })));
const EraseModalOverlays = lazy(() => import('./EraseModalOverlays').then(m => ({ default: m.EraseModalOverlays })));
const ExpandModalOverlays = lazy(() => import('./ExpandModalOverlays').then(m => ({ default: m.ExpandModalOverlays })));
const VectorizeModalOverlays = lazy(() => import('./VectorizeModalOverlays').then(m => ({ default: m.VectorizeModalOverlays })));
const NextSceneModalOverlays = lazy(() => import('./NextSceneModalOverlays').then(m => ({ default: m.NextSceneModalOverlays })));
const StoryboardModalOverlays = lazy(() => import('./StoryboardModalOverlays').then(m => ({ default: m.StoryboardModalOverlays })));
const CompareModalOverlays = lazy(() => import('./CompareModalOverlays').then(m => ({ default: m.CompareModalOverlays })));
const MultiangleCameraModalOverlays = lazy(() => import('./MultiangleCameraModalOverlays').then(m => ({ default: m.MultiangleCameraModalOverlays })));
const ScriptFrameModalOverlays = lazy(() => import('./ScriptFrameModalOverlays').then(m => ({ default: m.ScriptFrameModalOverlays })));
const SceneFrameModalOverlays = lazy(() => import('./SceneFrameModalOverlays').then(m => ({ default: m.SceneFrameModalOverlays })));
const CanvasTextOverlays = lazy(() => import('./CanvasTextOverlays').then(m => ({ default: m.CanvasTextOverlays })));

import { CompareModalState } from './types';
import { ComponentCreationMenu } from './ComponentCreationMenu';

export const ModalOverlays: React.FC<ModalOverlaysProps> = ({
  // textInputStates, // REMOVED: Managed by Zustand store locally
  imageModalStates: propImageModalStates,
  videoModalStates: propVideoModalStates,
  videoEditorModalStates,
  imageEditorModalStates,
  // REMOVED: musicModalStates (now managed by store)
  // REMOVED: upscaleModalStates (now managed by Zustand store)
  // REMOVED: removeBgModalStates (now managed by store)
  // removeBgModalStates,
  // REMOVED: eraseModalStates (now managed by store)
  // eraseModalStates,
  // REMOVED: expandModalStates (now managed by store)
  // expandModalStates,
  // REMOVED: vectorizeModalStates (now managed by store)
  // vectorizeModalStates,
  // REMOVED: nextSceneModalStates (now managed by store)
  // nextSceneModalStates,
  // REMOVED: storyboardModalStates (now managed by store)
  // storyboardModalStates,
  scriptFrameModalStates,
  // scriptFrameModalStates, // Duplicate removed
  sceneFrameModalStates,
  // REMOVED: compareModalStates (now managed by store)
  // compareModalStates,  // New
  // selectedCompareModalId, // New
  // selectedCompareModalIds, // New
  // setCompareModalStates = () => { }, // New
  // setSelectedCompareModalId = () => { }, // New
  // setSelectedCompareModalIds = () => { }, // New
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
  // REMOVED: selectedRemoveBgModalId (now managed by store)
  // selectedRemoveBgModalId,
  // selectedRemoveBgModalIds,
  // selectedEraseModalId,
  // selectedEraseModalIds,
  // selectedExpandModalId,
  // selectedExpandModalIds,
  // selectedVectorizeModalId,
  // selectedVectorizeModalIds,
  // selectedNextSceneModalId,
  // selectedNextSceneModalIds,
  // selectedStoryboardModalId,
  // selectedStoryboardModalIds,
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
  // REMOVED: setRemoveBgModalStates (now managed by store)
  // setRemoveBgModalStates = () => { },
  // setSelectedRemoveBgModalId = () => { },
  // setSelectedRemoveBgModalIds = () => { },
  // setEraseModalStates = () => { },
  // setSelectedEraseModalId = () => { },
  // setSelectedEraseModalIds = () => { },
  // REMOVED: setExpandModalStates, setSelectedExpandModalId, setSelectedExpandModalIds (now managed by store)
  // setExpandModalStates,
  // setSelectedExpandModalId,
  // setSelectedExpandModalIds,
  // setVectorizeModalStates = () => { },
  // setSelectedVectorizeModalId = () => { },
  // setSelectedVectorizeModalIds = () => { },
  // setNextSceneModalStates = () => { },
  // setSelectedNextSceneModalId = () => { },
  // setSelectedNextSceneModalIds = () => { },
  // setStoryboardModalStates = () => { },
  // setScriptFrameModalStates = () => { },
  // setSelectedStoryboardModalId = () => { },
  // setSelectedStoryboardModalIds = () => { },
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

  isChatOpen,
  viewportSize,
  showFineDetails,
  showLabelsOnly,
  isZoomedOut,
  isInteracting = false,
  setIsComponentDragging,
}) => {

  // Zustand Store - Get explicit states
  const imageModalStates = useImageModalStates();
  const videoModalStates = useVideoModalStates();
  const textInputStates = useTextModalStates();

  const removeBgModalStates = useRemoveBgModalStates();
  const { selectedId: selectedRemoveBgModalId, selectedIds: selectedRemoveBgModalIds } = useRemoveBgSelection();

  const eraseModalStates = useEraseModalStates();
  const { selectedId: selectedEraseModalId, selectedIds: selectedEraseModalIds } = useEraseSelection();

  const expandModalStates = useExpandModalStates();
  const { selectedId: selectedExpandModalId, selectedIds: selectedExpandModalIds } = useExpandSelection();

  const vectorizeModalStates = useVectorizeModalStates();
  const { selectedId: selectedVectorizeModalId, selectedIds: selectedVectorizeModalIds } = useVectorizeSelection();

  const nextSceneModalStates = useNextSceneStore(state => state.nextSceneModalStates);
  const selectedNextSceneModalId = useNextSceneStore(state => state.selectedNextSceneModalId);
  const selectedNextSceneModalIds = useNextSceneStore(state => state.selectedNextSceneModalIds);

  const storyboardModalStates = useStoryboardModalStates();
  const selectedStoryboardModalId = useSelectedStoryboardModalId();
  const selectedStoryboardModalIds = useSelectedStoryboardModalIds();

  const compareModalStates = useCompareStore(state => state.compareModalStates);
  const selectedCompareModalId = useCompareStore(state => state.selectedId);
  const selectedCompareModalIds = useCompareStore(state => state.selectedIds);

  // Removed: Prop fallback logic. We now strictly use store state to avoid "hybrid state" race conditions.
  // const imageModalStates = propImageModalStates || storeImageModalStates;
  // const videoModalStates = propVideoModalStates || storeVideoModalStates;

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
  const { selectedIds: selectedMultiangleCameraModalIds } = useMultiangleCameraSelection();

  // Falling back to hooks if props are not provided (e.g. for components that don't pass them)
  // No fallback logic needed. We strictly use store state.

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

  // Optimize ConnectionLines props to prevent re-renders
  const connectionLinesProps = React.useMemo(() => ({
    connections: externalConnections ?? [],
    activeDrag: connectionManager.activeDrag,
    selectedConnectionId: connectionManager.selectedConnectionId,
    onSelectConnection: connectionManager.setSelectedConnectionId,
    onDeleteConnection: connectionManager.handleDeleteConnection,
    onPersistConnectorCreate: onPersistConnectorCreate,
    onPersistConnectorDelete: onPersistConnectorDelete,
    stageRef: stageRef,
    position: position,
    scale: scale,
    isInteracting: isInteracting,
    viewportUpdateKey: viewportUpdateKey,
    scriptFrameModalStates: scriptFrameModalStates,
    sceneFrameModalStates: sceneFrameModalStates,
  }), [
    externalConnections,
    connectionManager.activeDrag,
    connectionManager.selectedConnectionId,
    connectionManager.handleDeleteConnection,
    onPersistConnectorCreate,
    onPersistConnectorDelete,
    stageRef,
    position,
    scale,
    isInteracting,
    viewportUpdateKey,
    scriptFrameModalStates,
    sceneFrameModalStates
  ]);

  return (
    <>
      <ConnectionLines {...connectionLinesProps} />


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
        imageModalStates={imageModalStates}
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
        videoModalStates={videoModalStates}
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

        isChatOpen={isChatOpen}
        selectedIds={selectedIds}
        setSelectionOrder={setSelectionOrder}
        showFineDetails={showFineDetails}
        showLabelsOnly={showLabelsOnly}
        isZoomedOut={isZoomedOut}
      />

      {((videoEditorModalStates && videoEditorModalStates.length > 0) || (selectedVideoEditorModalIds && selectedVideoEditorModalIds.length > 0)) && (
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
      )}

      {((imageEditorModalStates && imageEditorModalStates.length > 0) || (selectedImageEditorModalIds && selectedImageEditorModalIds.length > 0)) && (
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
      )}

      <MusicModalOverlays
        // REMOVED: props now managed by store
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

      {(upscaleModalStates && upscaleModalStates.length > 0) && (
        <UpscaleModalOverlays
          // REMOVED: props now managed by store
          clearAllSelections={clearAllSelections}
          onUpscale={onUpscale}
          onPersistUpscaleModalCreate={onPersistUpscaleModalCreate}
          onPersistUpscaleModalMove={onPersistUpscaleModalMove}
          onPersistUpscaleModalDelete={onPersistUpscaleModalDelete}
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
      )}

      {(removeBgModalStates && removeBgModalStates.length > 0) && (
        <RemoveBgModalOverlays
          // REMOVED: props now managed by store
          clearAllSelections={clearAllSelections}
          onRemoveBg={onRemoveBg}
          onPersistRemoveBgModalCreate={onPersistRemoveBgModalCreate}
          onPersistRemoveBgModalMove={onPersistRemoveBgModalMove}
          onPersistRemoveBgModalDelete={onPersistRemoveBgModalDelete}
          connections={externalConnections ?? []}
          imageModalStates={imageModalStates}
          stageRef={stageRef}
          scale={scale}
          position={position}
          isChatOpen={isChatOpen}
          selectedIds={selectedIds}
        />
      )}
      {((eraseModalStates && eraseModalStates.length > 0) || (selectedEraseModalIds && selectedEraseModalIds.length > 0)) && (
        <EraseModalOverlays
          // REMOVED: props now managed by store
          clearAllSelections={clearAllSelections}
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
      )}

      {((expandModalStates && expandModalStates.length > 0) || (selectedExpandModalIds && selectedExpandModalIds.length > 0)) && (
        <ExpandModalOverlays
          // REMOVED: props now managed by store
          clearAllSelections={clearAllSelections}
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
      )}

      {((vectorizeModalStates && vectorizeModalStates.length > 0) || (selectedVectorizeModalIds && selectedVectorizeModalIds.length > 0)) && (
        <VectorizeModalOverlays
          // REMOVED: props now managed by store
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
      )}

      {((multiangleCameraModalStates && multiangleCameraModalStates.length > 0) || (selectedMultiangleCameraModalIds && selectedMultiangleCameraModalIds.length > 0)) && (
        <MultiangleCameraModalOverlays
          // REMOVED: props now managed by store
          clearAllSelections={clearAllSelections}
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
      )}

      <NextSceneModalOverlays
        // REMOVED: props now managed by store
        clearAllSelections={clearAllSelections}
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
        // REMOVED: props now managed by store
        clearAllSelections={clearAllSelections}
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
        onPersistEraseModalCreate={onPersistEraseModalCreate}
        onPersistExpandModalCreate={onPersistExpandModalCreate}
        onPersistStoryboardModalCreate={onPersistStoryboardModalCreate}
        onPersistVectorizeModalCreate={onPersistVectorizeModalCreate}
        onPersistNextSceneModalCreate={onPersistNextSceneModalCreate}
        onPersistConnectorCreate={onPersistConnectorCreate}
      />

      <CompareModalOverlays
        // REMOVED: props now managed by store
        clearAllSelections={clearAllSelections}
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
