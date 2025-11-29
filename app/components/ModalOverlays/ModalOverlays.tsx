'use client';

import React, { useState, useEffect } from 'react';
import Konva from 'konva';
import { ModalOverlaysProps } from './types';
import { useConnectionManager } from './useConnectionManager';
import { ConnectionLines } from './ConnectionLines';
import { TextInputOverlays } from './TextInputOverlays';
import { ImageModalOverlays } from './ImageModalOverlays';
import { VideoModalOverlays } from './VideoModalOverlays';
import { MusicModalOverlays } from './MusicModalOverlays';
import { UpscaleModalOverlays } from './UpscaleModalOverlays';
import { RemoveBgModalOverlays } from './RemoveBgModalOverlays';
import { EraseModalOverlays } from './EraseModalOverlays';
import { ReplaceModalOverlays } from './ReplaceModalOverlays';
import { ExpandModalOverlays } from './ExpandModalOverlays';
import { VectorizeModalOverlays } from './VectorizeModalOverlays';
import { StoryboardModalOverlays } from './StoryboardModalOverlays';
import { ScriptFrameModalOverlays } from './ScriptFrameModalOverlays';
import { SceneFrameModalOverlays } from './SceneFrameModalOverlays';
import { ComponentCreationMenu } from './ComponentCreationMenu';

export const ModalOverlays: React.FC<ModalOverlaysProps> = ({
  textInputStates,
  imageModalStates,
  videoModalStates,
  musicModalStates,
  upscaleModalStates,
  removeBgModalStates,
  eraseModalStates,
  replaceModalStates,
  expandModalStates,
  vectorizeModalStates,
  storyboardModalStates,
  scriptFrameModalStates,
  sceneFrameModalStates,
  selectedTextInputId,
  selectedTextInputIds,
  selectedImageModalId,
  selectedImageModalIds,
  selectedVideoModalId,
  selectedVideoModalIds,
  selectedMusicModalId,
  selectedMusicModalIds,
  selectedUpscaleModalId,
  selectedUpscaleModalIds,
  selectedRemoveBgModalId,
  selectedRemoveBgModalIds,
  selectedEraseModalId,
  selectedEraseModalIds,
  selectedReplaceModalId,
  selectedReplaceModalIds,
  selectedExpandModalId,
  selectedExpandModalIds,
  selectedVectorizeModalId,
  selectedVectorizeModalIds,
  selectedStoryboardModalId,
  selectedStoryboardModalIds,
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
  setReplaceModalStates = () => { },
  setSelectedReplaceModalId = () => { },
  setSelectedReplaceModalIds = () => { },
  setExpandModalStates = () => { },
  setSelectedExpandModalId = () => { },
  setSelectedExpandModalIds = () => { },
  setVectorizeModalStates = () => { },
  setSelectedVectorizeModalId = () => { },
  setSelectedVectorizeModalIds = () => { },
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
  onPersistMusicModalCreate,
  onPersistMusicModalMove,
  onPersistMusicModalDelete,
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
  onPersistReplaceModalCreate,
  onPersistReplaceModalMove,
  onPersistReplaceModalDelete,
  onReplace,
  onPersistExpandModalCreate,
  onPersistExpandModalMove,
  onPersistExpandModalDelete,
  onExpand,
  onPersistVectorizeModalCreate,
  onPersistVectorizeModalMove,
  onPersistVectorizeModalDelete,
  onVectorize,
  onPersistStoryboardModalCreate,
  onPersistStoryboardModalMove,
  onPersistStoryboardModalDelete,
  onDeleteScriptFrame,
  onScriptFramePositionChange,
  onScriptFramePositionCommit,
  onTextUpdate,
  onGenerateScenes,
  onDeleteSceneFrame,
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
    replaceModalStates: replaceModalStates ?? [],
    expandModalStates: expandModalStates ?? [],
    vectorizeModalStates: vectorizeModalStates ?? [],
    storyboardModalStates: storyboardModalStates ?? [],
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
        replaceModalStates={replaceModalStates ?? []}
        expandModalStates={expandModalStates ?? []}
        vectorizeModalStates={vectorizeModalStates ?? []}
        storyboardModalStates={storyboardModalStates ?? []}
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

      <ReplaceModalOverlays
        replaceModalStates={replaceModalStates ?? []}
        selectedReplaceModalId={selectedReplaceModalId ?? null}
        selectedReplaceModalIds={selectedReplaceModalIds ?? []}
        clearAllSelections={clearAllSelections}
        setReplaceModalStates={setReplaceModalStates}
        setSelectedReplaceModalId={setSelectedReplaceModalId}
        setSelectedReplaceModalIds={setSelectedReplaceModalIds}
        onReplace={onReplace}
        onPersistReplaceModalCreate={onPersistReplaceModalCreate}
        onPersistReplaceModalMove={onPersistReplaceModalMove}
        onPersistReplaceModalDelete={onPersistReplaceModalDelete}
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
      />
      <SceneFrameModalOverlays
        sceneFrameModalStates={sceneFrameModalStates ?? []}
        onDelete={onDeleteSceneFrame}
        onPositionChange={onSceneFramePositionChange}
        onPositionCommit={onSceneFramePositionCommit}
        stageRef={stageRef}
        scale={scale}
        position={position}
      />

      <ComponentCreationMenu
        componentMenu={connectionManager.componentMenu}
        componentMenuSearch={connectionManager.componentMenuSearch}
        setComponentMenu={connectionManager.setComponentMenu}
        setComponentMenuSearch={connectionManager.setComponentMenuSearch}
        scale={scale}
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
        onPersistReplaceModalCreate={onPersistReplaceModalCreate}
        setReplaceModalStates={setReplaceModalStates}
        onPersistExpandModalCreate={onPersistExpandModalCreate}
        setExpandModalStates={setExpandModalStates}
        onPersistStoryboardModalCreate={onPersistStoryboardModalCreate}
        setStoryboardModalStates={setStoryboardModalStates}
        onPersistConnectorCreate={onPersistConnectorCreate}
      />
    </>
  );
};

