'use client';

import React, { useState, useEffect } from 'react';
import Konva from 'konva';
import { ModalOverlaysProps } from './types';
import { useConnectionManager } from './useConnectionManager';
import { ConnectionLines } from './ConnectionLines';
import { TextInputOverlays } from './TextInputOverlays';
import { ImageModalOverlays } from './ImageModalOverlays';
import { VideoModalOverlays } from './VideoModalOverlays';
import { VideoEditorModalOverlays } from './VideoEditorModalOverlays';
import { MusicModalOverlays } from './MusicModalOverlays';
import { UpscaleModalOverlays } from './UpscaleModalOverlays';
import { RemoveBgModalOverlays } from './RemoveBgModalOverlays';
import { EraseModalOverlays } from './EraseModalOverlays';
import { ExpandModalOverlays } from './ExpandModalOverlays';
import { VectorizeModalOverlays } from './VectorizeModalOverlays';
import { NextSceneModalOverlays } from './NextSceneModalOverlays';
import { MultiangleModalOverlays } from './MultiangleModalOverlays';
import { StoryboardModalOverlays } from './StoryboardModalOverlays';
import { CanvasTextOverlays } from './CanvasTextOverlays';
import { ScriptFrameModalOverlays } from './ScriptFrameModalOverlays';
import { SceneFrameModalOverlays } from './SceneFrameModalOverlays';
import { ComponentCreationMenu } from './ComponentCreationMenu';

export const ModalOverlays: React.FC<ModalOverlaysProps> = ({
  textInputStates,
  imageModalStates,
  videoModalStates,
  videoEditorModalStates,
  musicModalStates,
  upscaleModalStates,
  removeBgModalStates,
  eraseModalStates,
  expandModalStates,
  vectorizeModalStates,
  nextSceneModalStates,
  multiangleModalStates,
  storyboardModalStates,
  scriptFrameModalStates,
  sceneFrameModalStates,
  selectedTextInputId,
  selectedTextInputIds,
  selectedImageModalId,
  selectedImageModalIds,
  selectedVideoModalId,
  selectedVideoModalIds,
  selectedVideoEditorModalId,
  selectedVideoEditorModalIds,
  selectedMusicModalId,
  selectedMusicModalIds,
  selectedUpscaleModalId,
  selectedUpscaleModalIds,
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
  selectedMultiangleModalId,
  selectedMultiangleModalIds,
  selectedStoryboardModalId,
  selectedStoryboardModalIds,

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

  clearAllSelections,
  setTextInputStates,
  setSelectedTextInputId,
  setSelectedTextInputIds,
  setSelectedImageIndices,
  setImageModalStates,
  setSelectedImageModalId,
  setSelectedImageModalIds,
  setVideoModalStates,
  setSelectedVideoModalId,
  setSelectedVideoModalIds,
  setVideoEditorModalStates = () => { },
  setSelectedVideoEditorModalId = () => { },
  setSelectedVideoEditorModalIds = () => { },
  setMusicModalStates,
  setSelectedMusicModalId,
  setSelectedMusicModalIds,
  setUpscaleModalStates = () => { },
  setSelectedUpscaleModalId = () => { },
  setSelectedUpscaleModalIds = () => { },
  setRemoveBgModalStates = () => { },
  setSelectedRemoveBgModalId = () => { },
  setSelectedRemoveBgModalIds = () => { },
  setEraseModalStates = () => { },
  setSelectedEraseModalId = () => { },
  setSelectedEraseModalIds = () => { },
  setExpandModalStates = () => { },
  setSelectedExpandModalId = () => { },
  setSelectedExpandModalIds = () => { },
  setVectorizeModalStates = () => { },
  setSelectedVectorizeModalId = () => { },
  setSelectedVectorizeModalIds = () => { },
  setNextSceneModalStates = () => { },
  setSelectedNextSceneModalId = () => { },
  setSelectedNextSceneModalIds = () => { },
  setMultiangleModalStates = () => { },
  setSelectedMultiangleModalId = () => { },
  setSelectedMultiangleModalIds = () => { },
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
  onPersistMusicModalCreate,
  onPersistMusicModalMove,
  onPersistMusicModalDelete,
  onUpdateImageModalState,
  onPersistUpscaleModalCreate,
  onPersistUpscaleModalMove,
  onPersistUpscaleModalDelete,
  onUpscale,
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
  onPersistMultiangleModalCreate,
  onPersistMultiangleModalMove,
  onPersistMultiangleModalDelete,
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
}) => {
  const [viewportUpdateKey, setViewportUpdateKey] = useState(0);

  // Force recalculation when viewport changes
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setViewportUpdateKey(prev => prev + 1);
    });
    return () => cancelAnimationFrame(rafId);
  }, [position.x, position.y, scale]);

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
    upscaleModalStates,
    removeBgModalStates: removeBgModalStates ?? [],
    eraseModalStates: eraseModalStates ?? [],
    expandModalStates: expandModalStates ?? [],
    vectorizeModalStates: vectorizeModalStates ?? [],
    nextSceneModalStates: nextSceneModalStates ?? [],
    storyboardModalStates: storyboardModalStates ?? [],
    scriptFrameModalStates: scriptFrameModalStates ?? [],
    sceneFrameModalStates: sceneFrameModalStates ?? [],
  });

  return (
    <>
      <ConnectionLines
        connections={externalConnections ?? []}
        activeDrag={connectionManager.activeDrag}
        selectedConnectionId={connectionManager.selectedConnectionId}
        onSelectConnection={connectionManager.setSelectedConnectionId}
        onDeleteConnection={connectionManager.handleDeleteConnection}
        stageRef={stageRef}
        position={position}
        scale={scale}
        textInputStates={textInputStates}
        imageModalStates={imageModalStates}
        videoModalStates={videoModalStates}
        musicModalStates={musicModalStates}
        upscaleModalStates={upscaleModalStates}
        removeBgModalStates={removeBgModalStates ?? []}
        eraseModalStates={eraseModalStates ?? []}
        expandModalStates={expandModalStates ?? []}
        vectorizeModalStates={vectorizeModalStates ?? []}
        nextSceneModalStates={nextSceneModalStates ?? []}
        storyboardModalStates={storyboardModalStates ?? []}
        scriptFrameModalStates={scriptFrameModalStates ?? []}
        sceneFrameModalStates={sceneFrameModalStates ?? []}
        viewportUpdateKey={viewportUpdateKey}
      />

      <TextInputOverlays
        textInputStates={textInputStates}
        selectedTextInputId={selectedTextInputId}
        selectedTextInputIds={selectedTextInputIds}
        clearAllSelections={clearAllSelections}
        setTextInputStates={setTextInputStates}
        setSelectedTextInputId={setSelectedTextInputId} 
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
        selectedImageModalId={selectedImageModalId}
        selectedImageModalIds={selectedImageModalIds}
        clearAllSelections={clearAllSelections}
        setImageModalStates={setImageModalStates}
        setSelectedImageModalId={setSelectedImageModalId}
        setSelectedImageModalIds={setSelectedImageModalIds}
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
      />

      <VideoModalOverlays
        videoModalStates={videoModalStates}
        selectedVideoModalId={selectedVideoModalId}
        selectedVideoModalIds={selectedVideoModalIds}
        clearAllSelections={clearAllSelections}
        setVideoModalStates={setVideoModalStates}
        setSelectedVideoModalId={setSelectedVideoModalId}
        setSelectedVideoModalIds={setSelectedVideoModalIds}
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
      />

      <MusicModalOverlays
        musicModalStates={musicModalStates}
        selectedMusicModalId={selectedMusicModalId}
        selectedMusicModalIds={selectedMusicModalIds}
        clearAllSelections={clearAllSelections}
        setMusicModalStates={setMusicModalStates}
        setSelectedMusicModalId={setSelectedMusicModalId}
        setSelectedMusicModalIds={setSelectedMusicModalIds}
        onMusicSelect={onMusicSelect}
        onMusicGenerate={onMusicGenerate}
        onPersistMusicModalCreate={onPersistMusicModalCreate}
        onPersistMusicModalMove={onPersistMusicModalMove}
        onPersistMusicModalDelete={onPersistMusicModalDelete}
        stageRef={stageRef}
        scale={scale}
        position={position}
      />

      <UpscaleModalOverlays
        upscaleModalStates={upscaleModalStates ?? []}
        selectedUpscaleModalId={selectedUpscaleModalId ?? null}
        selectedUpscaleModalIds={selectedUpscaleModalIds ?? []}
        clearAllSelections={clearAllSelections}
        setUpscaleModalStates={setUpscaleModalStates}
        setSelectedUpscaleModalId={setSelectedUpscaleModalId}
        setSelectedUpscaleModalIds={setSelectedUpscaleModalIds}
        onUpscale={onUpscale}
        onPersistUpscaleModalCreate={onPersistUpscaleModalCreate}
        onPersistUpscaleModalMove={onPersistUpscaleModalMove}
        onPersistUpscaleModalDelete={onPersistUpscaleModalDelete}
        onPersistImageModalCreate={onPersistImageModalCreate}
        onPersistImageModalMove={onPersistImageModalMove}
        connections={externalConnections ?? []}
        imageModalStates={imageModalStates}
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
        onPersistConnectorCreate={onPersistConnectorCreate}
        stageRef={stageRef}
        scale={scale}
        position={position}
      />
      <EraseModalOverlays
        eraseModalStates={eraseModalStates ?? []}
        selectedEraseModalId={selectedEraseModalId ?? null}
        selectedEraseModalIds={selectedEraseModalIds ?? []}
        clearAllSelections={clearAllSelections}
        setEraseModalStates={setEraseModalStates}
        setSelectedEraseModalId={setSelectedEraseModalId}
        setSelectedEraseModalIds={setSelectedEraseModalIds}
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
      />

      <ExpandModalOverlays
        expandModalStates={expandModalStates ?? []}
        selectedExpandModalId={selectedExpandModalId ?? null}
        selectedExpandModalIds={selectedExpandModalIds ?? []}
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
      />

      <VectorizeModalOverlays
        vectorizeModalStates={vectorizeModalStates ?? []}
        selectedVectorizeModalId={selectedVectorizeModalId ?? null}
        selectedVectorizeModalIds={selectedVectorizeModalIds ?? []}
        clearAllSelections={clearAllSelections}
        setVectorizeModalStates={setVectorizeModalStates}
        setSelectedVectorizeModalId={setSelectedVectorizeModalId}
        setSelectedVectorizeModalIds={setSelectedVectorizeModalIds}
        onVectorize={onVectorize}
        onPersistVectorizeModalCreate={onPersistVectorizeModalCreate}
        onPersistVectorizeModalMove={onPersistVectorizeModalMove}
        onPersistVectorizeModalDelete={onPersistVectorizeModalDelete}
        onPersistImageModalCreate={onPersistImageModalCreate}
        onPersistImageModalMove={onPersistImageModalMove}
        connections={externalConnections ?? []}
        imageModalStates={imageModalStates}
        images={images}
        onPersistConnectorCreate={onPersistConnectorCreate}
        stageRef={stageRef}
        scale={scale}
        position={position}
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
      />

      <MultiangleModalOverlays
        multiangleModalStates={multiangleModalStates ?? []}
        selectedMultiangleModalId={selectedMultiangleModalId ?? null}
        selectedMultiangleModalIds={selectedMultiangleModalIds ?? []}
        clearAllSelections={clearAllSelections}
        setMultiangleModalStates={setMultiangleModalStates}
        setSelectedMultiangleModalId={setSelectedMultiangleModalId}
        setSelectedMultiangleModalIds={setSelectedMultiangleModalIds}
        onPersistMultiangleModalCreate={onPersistMultiangleModalCreate}
        onPersistMultiangleModalMove={onPersistMultiangleModalMove}
        onPersistMultiangleModalDelete={onPersistMultiangleModalDelete}
        onPersistImageModalCreate={onPersistImageModalCreate}
        connections={externalConnections ?? []}
        imageModalStates={imageModalStates}
        onPersistConnectorCreate={onPersistConnectorCreate}
        stageRef={stageRef}
        scale={scale}
        position={position}
        onUpdateImageModalState={onUpdateImageModalState}
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
      />
      {/* Canvas Text Overlays */}
      <CanvasTextOverlays
        canvasTextStates={canvasTextStates || []}
        selectedCanvasTextId={selectedCanvasTextId || null}
        onSelect={setSelectedCanvasTextId || (() => { })}
        onUpdate={(id, updates) => {
          if (setCanvasTextStates) {
            setCanvasTextStates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
          }
          if (onPersistCanvasTextMove) {
            onPersistCanvasTextMove(id, updates);
          }
        }}
        onDelete={(id) => {
          if (setCanvasTextStates) {
            setCanvasTextStates(prev => prev.filter(t => t.id !== id));
          }
          if (onPersistCanvasTextDelete) {
            onPersistCanvasTextDelete(id);
          }
        }}
        scale={scale}
        position={position}
      />
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
        setUpscaleModalStates={setUpscaleModalStates}
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
        onPersistMultiangleModalCreate={onPersistMultiangleModalCreate}
        onPersistConnectorCreate={onPersistConnectorCreate}
      />
    </>
  );
};
