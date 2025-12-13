'use client';

import React from 'react';
import { VectorizePluginModal } from '@/app/components/Plugins/VectorizePluginModal/VectorizePluginModal';
import Konva from 'konva';
import { Connection, ImageModalState, VectorizeModalState } from './types';
import { downloadImage, generateDownloadFilename } from '@/lib/downloadUtils';

interface VectorizeModalOverlaysProps {
  vectorizeModalStates: VectorizeModalState[] | undefined;
  selectedVectorizeModalId: string | null | undefined;
  selectedVectorizeModalIds: string[] | undefined;
  clearAllSelections: () => void;
  setVectorizeModalStates: React.Dispatch<React.SetStateAction<VectorizeModalState[]>>;
  setSelectedVectorizeModalId: (id: string | null) => void;
  setSelectedVectorizeModalIds: (ids: string[]) => void;
  onVectorize?: (sourceImageUrl?: string, mode?: string) => Promise<string | null>;
  onPersistVectorizeModalCreate?: (modal: { id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }) => void | Promise<void>;
  onPersistVectorizeModalMove?: (id: string, updates: Partial<{ x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }>) => void | Promise<void>;
  onPersistVectorizeModalDelete?: (id: string) => void | Promise<void>;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }>) => void | Promise<void>;
  connections: Connection[];
  imageModalStates: ImageModalState[];
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: Connection) => void | Promise<void>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
}

export const VectorizeModalOverlays: React.FC<VectorizeModalOverlaysProps> = ({
  vectorizeModalStates,
  selectedVectorizeModalId,
  selectedVectorizeModalIds,
  clearAllSelections,
  setVectorizeModalStates,
  setSelectedVectorizeModalId,
  setSelectedVectorizeModalIds,
  onVectorize,
  onPersistVectorizeModalCreate,
  onPersistVectorizeModalMove,
  onPersistVectorizeModalDelete,
  onPersistImageModalCreate,
  onPersistImageModalMove,
  connections,
  imageModalStates,
  images,
  onPersistConnectorCreate,
  stageRef,
  scale,
  position,
}) => {
  return (
    <>
      {(vectorizeModalStates || []).map((modalState) => (
        <VectorizePluginModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          onClose={() => {
            setVectorizeModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedVectorizeModalId(null);
            if (onPersistVectorizeModalDelete) {
              Promise.resolve(onPersistVectorizeModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onVectorize={onVectorize ? async (sourceImageUrl, mode) => {
            try {
              return await onVectorize(sourceImageUrl, mode);
            } catch (err) {
              console.error('[ModalOverlays] vectorize failed', err);
              throw err;
            }
          } : undefined}
          vectorizedImageUrl={modalState.vectorizedImageUrl}
          isVectorizing={modalState.isVectorizing || false}
          onSelect={() => {
            clearAllSelections();
            setSelectedVectorizeModalId(modalState.id);
            setSelectedVectorizeModalIds([modalState.id]);
          }}
          onDelete={() => {
            console.log('[VectorizeModalOverlays] onDelete called', {
              timestamp: Date.now(),
              modalId: modalState.id,
            });
            // Clear selection immediately
            setSelectedVectorizeModalId(null);
            // Call persist delete - it updates parent state (vectorizeGenerators) which flows down as externalVectorizeModals
            // Canvas will sync vectorizeModalStates with externalVectorizeModals via useEffect
            if (onPersistVectorizeModalDelete) {
              console.log('[VectorizeModalOverlays] Calling onPersistVectorizeModalDelete', modalState.id);
              // Call synchronously - the handler updates parent state immediately
              const result = onPersistVectorizeModalDelete(modalState.id);
              // If it returns a promise, handle it
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch((err) => {
                  console.error('[ModalOverlays] Error in onPersistVectorizeModalDelete', err);
                });
              }
            }
            // DO NOT update local state here - let parent state flow down through props
          }}
          onDownload={async () => {
            if (modalState.vectorizedImageUrl) {
              const filename = generateDownloadFilename('vectorize', modalState.id, 'svg');
              await downloadImage(modalState.vectorizedImageUrl, filename);
            }
          }}
          onDuplicate={() => {
            const newId = `vectorize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newModal = {
              id: newId,
              x: modalState.x + 450,
              y: modalState.y,
              vectorizedImageUrl: modalState.vectorizedImageUrl,
              sourceImageUrl: modalState.sourceImageUrl,
              localVectorizedImageUrl: modalState.localVectorizedImageUrl,
              mode: modalState.mode || 'simple',
              frameWidth: modalState.frameWidth || 400,
              frameHeight: modalState.frameHeight || 500,
              isVectorizing: false,
            };
            setVectorizeModalStates(prev => [...prev, newModal]);
            if (onPersistVectorizeModalCreate) {
              Promise.resolve(onPersistVectorizeModalCreate(newModal)).catch(console.error);
            }
          }}
          isSelected={selectedVectorizeModalId === modalState.id || (selectedVectorizeModalIds || []).includes(modalState.id)}
          stageRef={stageRef}
          scale={scale}
          position={position}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setVectorizeModalStates(prev =>
              prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m)
            );
          }}
          onPositionCommit={(newX, newY) => {
            if (onPersistVectorizeModalMove) {
              Promise.resolve(onPersistVectorizeModalMove(modalState.id, { x: newX, y: newY })).catch(console.error);
            }
          }}
          initialMode={modalState.mode}
          initialSourceImageUrl={modalState.sourceImageUrl}
          initialLocalVectorizedImageUrl={modalState.localVectorizedImageUrl}
          onOptionsChange={(opts) => {
            setVectorizeModalStates(prev =>
              prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m)
            );
            if (onPersistVectorizeModalMove) {
              Promise.resolve(onPersistVectorizeModalMove(modalState.id, opts as any)).catch(console.error);
            }
          }}
          onPersistVectorizeModalCreate={onPersistVectorizeModalCreate}
          onUpdateModalState={(modalId, updates) => {
            setVectorizeModalStates(prev =>
              prev.map(m => m.id === modalId ? { ...m, ...updates } : m)
            );
            if (onPersistVectorizeModalMove) {
              Promise.resolve(onPersistVectorizeModalMove(modalId, updates as any)).catch(console.error);
            }
          }}
          onPersistImageModalCreate={onPersistImageModalCreate}
          onUpdateImageModalState={(modalId, updates) => {
            // Update the image modal state via onPersistImageModalMove
            if (onPersistImageModalMove) {
              Promise.resolve(onPersistImageModalMove(modalId, updates)).catch(console.error);
            }
          }}
          connections={connections}
          imageModalStates={imageModalStates}
          images={images}
          onPersistConnectorCreate={onPersistConnectorCreate}
        />
      ))}
    </>
  );
};

