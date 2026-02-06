'use client';

import React from 'react';
import { VectorizePluginModal } from '@/modules/plugins/VectorizePluginModal/VectorizePluginModal';
import Konva from 'konva';
import { Connection, ImageModalState, VectorizeModalState } from './types';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import { downloadImage, generateDownloadFilename } from '@/core/api/downloadUtils';

import {
  useVectorizeModalStates,
  useVectorizeStore,
  useVectorizeSelection
} from '@/modules/stores';

interface VectorizeModalOverlaysProps {
  vectorizeModalStates?: VectorizeModalState[];
  selectedVectorizeModalId?: string | null;
  selectedVectorizeModalIds?: string[];
  clearAllSelections: () => void;
  setVectorizeModalStates?: React.Dispatch<React.SetStateAction<VectorizeModalState[]>> | ((states: any) => void);
  setSelectedVectorizeModalId?: (id: string | null) => void;
  setSelectedVectorizeModalIds?: (ids: string[]) => void;
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
  isChatOpen?: boolean;
  selectedIds?: string[];
}

export const VectorizeModalOverlays = React.memo<VectorizeModalOverlaysProps>(({
  vectorizeModalStates: propsVectorizeModalStates,
  selectedVectorizeModalId: propsSelectedVectorizeModalId,
  selectedVectorizeModalIds: propsSelectedVectorizeModalIds,
  clearAllSelections,
  setVectorizeModalStates: propsSetVectorizeModalStates,
  setSelectedVectorizeModalId: propsSetSelectedVectorizeModalId,
  setSelectedVectorizeModalIds: propsSetSelectedVectorizeModalIds,
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
  isChatOpen = false,
  selectedIds = [],
}) => {
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

  // Zustand Store
  const storeVectorizeModalStates = useVectorizeModalStates();
  const storeSetVectorizeModalStates = useVectorizeStore(state => state.setVectorizeModalStates);
  const {
    selectedId: storeSelectedVectorizeModalId,
    selectedIds: storeSelectedVectorizeModalIds,
    setSelectedId: storeSetSelectedVectorizeModalId,
    setSelectedIds: storeSetSelectedVectorizeModalIds
  } = useVectorizeSelection();

  // effective state
  const vectorizeModalStates = propsVectorizeModalStates || storeVectorizeModalStates;
  const setVectorizeModalStates = propsSetVectorizeModalStates || storeSetVectorizeModalStates;

  // Final selection
  const selectedVectorizeModalId = propsSelectedVectorizeModalId !== undefined ? propsSelectedVectorizeModalId : storeSelectedVectorizeModalId;
  const selectedVectorizeModalIds = propsSelectedVectorizeModalIds || storeSelectedVectorizeModalIds;

  const setSelectedVectorizeModalId = propsSetSelectedVectorizeModalId || storeSetSelectedVectorizeModalId;
  const setSelectedVectorizeModalIds = propsSetSelectedVectorizeModalIds || storeSetSelectedVectorizeModalIds;

  return (
    <>
      {contextMenu && (
        <PluginContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDuplicate={() => {
            const modalState = vectorizeModalStates?.find(m => m.id === contextMenu.modalId);
            if (modalState) {
              const duplicated = {
                ...modalState,
                id: `vectorize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                x: modalState.x + 50,
                y: modalState.y + 50,
              };
              setVectorizeModalStates((prev: VectorizeModalState[]) => [...prev, duplicated]);
              if (onPersistVectorizeModalCreate) {
                Promise.resolve(onPersistVectorizeModalCreate(duplicated)).catch(console.error);
              }
            }
          }}
          onDelete={() => {
            if (onPersistVectorizeModalDelete) {
              const modalId = contextMenu.modalId;
              setSelectedVectorizeModalId(null);
              setSelectedVectorizeModalIds([]);
              const result = onPersistVectorizeModalDelete(modalId);
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch(console.error);
              }
            }
          }}
        />
      )}
      {(vectorizeModalStates || []).map((modalState) => (
        <VectorizePluginModal
          key={modalState.id}
          isOpen={true}
          isExpanded={modalState.isExpanded}
          id={modalState.id}
          isAttachedToChat={isChatOpen && (selectedVectorizeModalId === modalState.id || (selectedVectorizeModalIds || []).includes(modalState.id))}
          selectionOrder={
            isChatOpen
              ? (() => {
                if (selectedIds && selectedIds.includes(modalState.id)) {
                  return selectedIds.indexOf(modalState.id) + 1;
                }
                if (selectedVectorizeModalIds && selectedVectorizeModalIds.includes(modalState.id)) {
                  return selectedVectorizeModalIds.indexOf(modalState.id) + 1;
                }
                return undefined;
              })()
              : undefined
          }
          onContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, modalId: modalState.id });
          }}
          onClose={() => {
            setVectorizeModalStates((prev: VectorizeModalState[]) => prev.filter(m => m.id !== modalState.id));
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
            setSelectedVectorizeModalIds([]);
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
            setVectorizeModalStates((prev: VectorizeModalState[]) => [...prev, newModal]);
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
            setVectorizeModalStates((prev: VectorizeModalState[]) =>
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
            setVectorizeModalStates((prev: VectorizeModalState[]) =>
              prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m)
            );
            if (onPersistVectorizeModalMove) {
              Promise.resolve(onPersistVectorizeModalMove(modalState.id, opts as any)).catch(console.error);
            }
          }}
          onPersistVectorizeModalCreate={onPersistVectorizeModalCreate}
          onUpdateModalState={(modalId, updates) => {
            setVectorizeModalStates((prev: VectorizeModalState[]) =>
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
});

VectorizeModalOverlays.displayName = 'VectorizeModalOverlays';

