'use client';

import React from 'react';
import { RemoveBgPluginModal } from '@/app/components/Plugins/RemoveBgPluginModal/RemoveBgPluginModal';
import Konva from 'konva';
import { Connection, ImageModalState, RemoveBgModalState } from './types';

interface RemoveBgModalOverlaysProps {
  removeBgModalStates: RemoveBgModalState[] | undefined;
  selectedRemoveBgModalId: string | null | undefined;
  selectedRemoveBgModalIds: string[] | undefined;
  clearAllSelections: () => void;
  setRemoveBgModalStates: React.Dispatch<React.SetStateAction<RemoveBgModalState[]>>;
  setSelectedRemoveBgModalId: (id: string | null) => void;
  setSelectedRemoveBgModalIds: (ids: string[]) => void;
  onRemoveBg?: (model: string, backgroundType: string, scaleValue: number, sourceImageUrl?: string) => Promise<string | null>;
  onPersistRemoveBgModalCreate?: (modal: { id: string; x: number; y: number; removedBgImageUrl?: string | null; isRemovingBg?: boolean; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  onPersistRemoveBgModalMove?: (id: string, updates: Partial<{ x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; isRemovingBg?: boolean; frameWidth?: number; frameHeight?: number }>) => void | Promise<void>;
  onPersistRemoveBgModalDelete?: (id: string) => void | Promise<void>;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  connections: Connection[];
  imageModalStates: ImageModalState[];
  onPersistConnectorCreate?: (connector: Connection) => void | Promise<void>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
}

export const RemoveBgModalOverlays: React.FC<RemoveBgModalOverlaysProps> = ({
  removeBgModalStates,
  selectedRemoveBgModalId,
  selectedRemoveBgModalIds,
  clearAllSelections,
  setRemoveBgModalStates,
  setSelectedRemoveBgModalId,
  setSelectedRemoveBgModalIds,
  onRemoveBg,
  onPersistRemoveBgModalCreate,
  onPersistRemoveBgModalMove,
  onPersistRemoveBgModalDelete,
  onPersistImageModalCreate,
  onPersistImageModalMove,
  connections,
  imageModalStates,
  onPersistConnectorCreate,
  stageRef,
  scale,
  position,
}) => {
  return (
    <>
      {(removeBgModalStates || []).map((modalState) => (
        <RemoveBgPluginModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          onClose={() => {
            setRemoveBgModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedRemoveBgModalId(null);
            if (onPersistRemoveBgModalDelete) {
              Promise.resolve(onPersistRemoveBgModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onRemoveBg={onRemoveBg ? async (model, backgroundType, scaleValue, sourceImageUrl) => {
            try {
              return await onRemoveBg(model, backgroundType, scaleValue, sourceImageUrl);
            } catch (err) {
              console.error('[ModalOverlays] remove bg failed', err);
              throw err;
            }
          } : undefined}
          removedBgImageUrl={modalState.removedBgImageUrl}
          isRemovingBg={modalState.isRemovingBg || false}
          onSelect={() => {
            clearAllSelections();
            setSelectedRemoveBgModalId(modalState.id);
            setSelectedRemoveBgModalIds([modalState.id]);
          }}
          onDelete={() => {
            console.log('[RemoveBgModalOverlays] onDelete called', {
              timestamp: Date.now(),
              modalId: modalState.id,
            });
            // Clear selection immediately
            setSelectedRemoveBgModalId(null);
            // Call persist delete - it updates parent state (removeBgGenerators) which flows down as externalRemoveBgModals
            // Canvas will sync removeBgModalStates with externalRemoveBgModals via useEffect
            if (onPersistRemoveBgModalDelete) {
              console.log('[RemoveBgModalOverlays] Calling onPersistRemoveBgModalDelete', modalState.id);
              // Call synchronously - the handler updates parent state immediately
              const result = onPersistRemoveBgModalDelete(modalState.id);
              // If it returns a promise, handle it
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch((err) => {
                  console.error('[ModalOverlays] Error in onPersistRemoveBgModalDelete', err);
                });
              }
            }
            // DO NOT update local state here - let parent state flow down through props
            // The useEffect in Canvas will sync removeBgModalStates with externalRemoveBgModals
          }}
          onDownload={() => {
            if (modalState.removedBgImageUrl) {
              const link = document.createElement('a');
              link.href = modalState.removedBgImageUrl;
              link.download = `removebg-${modalState.id}.png`;
              link.click();
            }
          }}
          onDuplicate={() => {
            const duplicated = {
              ...modalState,
              id: `removebg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              x: modalState.x + 50,
              y: modalState.y + 50,
            };
            setRemoveBgModalStates(prev => [...prev, duplicated]);
            if (onPersistRemoveBgModalCreate) {
              Promise.resolve(onPersistRemoveBgModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedRemoveBgModalId === modalState.id}
          initialModel={modalState.model}
          initialBackgroundType={modalState.backgroundType}
          initialScaleValue={modalState.scaleValue}
          initialSourceImageUrl={modalState.sourceImageUrl}
          initialLocalRemovedBgImageUrl={modalState.localRemovedBgImageUrl}
          onOptionsChange={(opts) => {
            // Only update if values actually changed
            const hasChanges = Object.keys(opts).some(key => {
              const currentValue = (modalState as any)[key];
              const newValue = (opts as any)[key];
              return currentValue !== newValue;
            });
            
            if (hasChanges) {
              setRemoveBgModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m));
              if (onPersistRemoveBgModalMove) {
                Promise.resolve(onPersistRemoveBgModalMove(modalState.id, opts)).catch(console.error);
              }
            }
          }}
          onPersistRemoveBgModalCreate={onPersistRemoveBgModalCreate}
          onUpdateModalState={(modalId, updates) => {
            setRemoveBgModalStates(prev => prev.map(m => m.id === modalId ? { ...m, ...updates } : m));
            if (onPersistRemoveBgModalMove) {
              Promise.resolve(onPersistRemoveBgModalMove(modalId, updates)).catch(console.error);
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
          onPersistConnectorCreate={onPersistConnectorCreate}
          stageRef={stageRef}
          scale={scale}
          position={position}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setRemoveBgModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m));
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistRemoveBgModalMove) {
              Promise.resolve(onPersistRemoveBgModalMove(modalState.id, { x: finalX, y: finalY })).catch((err) => {
                console.error('[ModalOverlays] Error in onPersistRemoveBgModalMove', err);
              });
            }
          }}
        />
      ))}
    </>
  );
};

