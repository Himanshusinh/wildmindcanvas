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
import { VectorizeModalOverlays } from './VectorizeModalOverlays';
import { ComponentCreationMenu } from './ComponentCreationMenu';

export const ModalOverlays: React.FC<ModalOverlaysProps> = ({
  textInputStates,
  imageModalStates,
  videoModalStates,
  musicModalStates,
  upscaleModalStates,
  removeBgModalStates,
  vectorizeModalStates,
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
  selectedVectorizeModalId,
  selectedVectorizeModalIds,
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
  setUpscaleModalStates = () => {},
  setSelectedUpscaleModalId = () => {},
  setSelectedUpscaleModalIds = () => {},
  setRemoveBgModalStates = () => {},
  setSelectedRemoveBgModalId = () => {},
  setSelectedRemoveBgModalIds = () => {},
  setVectorizeModalStates = () => {},
  setSelectedVectorizeModalId = () => {},
  setSelectedVectorizeModalIds = () => {},
  setSelectionTightRect,
  setIsDragSelection,
  images = [],
  onTextCreate,
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
  onPersistVectorizeModalCreate,
  onPersistVectorizeModalMove,
  onPersistVectorizeModalDelete,
  onVectorize,
  onPersistTextModalCreate,
  onPersistTextModalMove,
  onPersistTextModalDelete,
  connections: externalConnections,
  onConnectionsChange,
  onPersistConnectorCreate,
  onPersistConnectorDelete,
  onPluginSidebarOpen,
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
    vectorizeModalStates: vectorizeModalStates ?? [],
  });

  return (
    <>
      <ConnectionLines
        connections={externalConnections ?? []}
        activeDrag={connectionManager.activeDrag}
        selectedConnectionId={connectionManager.selectedConnectionId}
        onSelectConnection={connectionManager.setSelectedConnectionId}
        stageRef={stageRef}
        position={position}
        scale={scale}
        textInputStates={textInputStates}
        imageModalStates={imageModalStates}
        videoModalStates={videoModalStates}
        musicModalStates={musicModalStates}
        upscaleModalStates={upscaleModalStates}
        removeBgModalStates={removeBgModalStates ?? []}
        vectorizeModalStates={vectorizeModalStates ?? []}
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
        stageRef={stageRef}
        scale={scale}
        position={position}
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
      />
    </>
  );
};

