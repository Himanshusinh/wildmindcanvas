'use client';

import React from 'react';
import { ReplacePluginModal } from '@/app/components/Plugins/ReplacePluginModal/ReplacePluginModal';
import Konva from 'konva';
import { Connection, ImageModalState, ReplaceModalState } from './types';

interface ReplaceModalOverlaysProps {
  replaceModalStates: ReplaceModalState[] | undefined;
  selectedReplaceModalId: string | null | undefined;
  selectedReplaceModalIds: string[] | undefined;
  clearAllSelections: () => void;
  setReplaceModalStates: React.Dispatch<React.SetStateAction<ReplaceModalState[]>>;
  setSelectedReplaceModalId: (id: string | null) => void;
  setSelectedReplaceModalIds: (ids: string[]) => void;
  onReplace?: (model: string, sourceImageUrl?: string, mask?: string, prompt?: string) => Promise<string | null>;
  onPersistReplaceModalCreate?: (modal: { id: string; x: number; y: number; replacedImageUrl?: string | null; isReplacing?: boolean; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  onPersistReplaceModalMove?: (id: string, updates: Partial<{ x: number; y: number; replacedImageUrl?: string | null; sourceImageUrl?: string | null; localReplacedImageUrl?: string | null; isReplacing?: boolean; frameWidth?: number; frameHeight?: number }>) => void | Promise<void>;
  onPersistReplaceModalDelete?: (id: string) => void | Promise<void>;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  connections: Connection[];
  imageModalStates: ImageModalState[];
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: Connection) => void | Promise<void>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
}

export const ReplaceModalOverlays: React.FC<ReplaceModalOverlaysProps> = ({
  replaceModalStates,
  selectedReplaceModalId,
  selectedReplaceModalIds,
  clearAllSelections,
  setReplaceModalStates,
  setSelectedReplaceModalId,
  setSelectedReplaceModalIds,
  onReplace,
  onPersistReplaceModalCreate,
  onPersistReplaceModalMove,
  onPersistReplaceModalDelete,
  onPersistImageModalCreate,
  onPersistImageModalMove,
  connections,
  imageModalStates,
  images = [],
  onPersistConnectorCreate,
  stageRef,
  scale,
  position,
}) => {
  return (
    <>
      {(replaceModalStates || []).map((modalState) => (
        <ReplacePluginModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          onClose={() => {
            setReplaceModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedReplaceModalId(null);
            if (onPersistReplaceModalDelete) {
              Promise.resolve(onPersistReplaceModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onReplace={onReplace ? async (model, sourceImageUrl, mask, prompt) => {
            try {
              return await onReplace(model, sourceImageUrl, mask, prompt);
            } catch (err) {
              console.error('[ModalOverlays] replace failed', err);
              throw err;
            }
          } : undefined}
          replacedImageUrl={modalState.replacedImageUrl}
          isReplacing={modalState.isReplacing || false}
          onSelect={() => {
            clearAllSelections();
            setSelectedReplaceModalId(modalState.id);
            setSelectedReplaceModalIds([modalState.id]);
          }}
          onDelete={() => {
            console.log('[ReplaceModalOverlays] onDelete called', {
              timestamp: Date.now(),
              modalId: modalState.id,
            });
            // Clear selection immediately
            setSelectedReplaceModalId(null);
            // Call persist delete - it updates parent state (replaceGenerators) which flows down as externalReplaceModals
            // Canvas will sync replaceModalStates with externalReplaceModals via useEffect
            if (onPersistReplaceModalDelete) {
              console.log('[ReplaceModalOverlays] Calling onPersistReplaceModalDelete', modalState.id);
              // Call synchronously - the handler updates parent state immediately
              const result = onPersistReplaceModalDelete(modalState.id);
              // If it returns a promise, handle it
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch((err) => {
                  console.error('[ModalOverlays] Error in onPersistReplaceModalDelete', err);
                });
              }
            }
            // DO NOT update local state here - let parent state flow down through props
            // The useEffect in Canvas will sync replaceModalStates with externalReplaceModals
          }}
          onDownload={() => {
            if (modalState.replacedImageUrl) {
              const link = document.createElement('a');
              link.href = modalState.replacedImageUrl;
              link.download = `replace-${modalState.id}.png`;
              link.click();
            }
          }}
          onDuplicate={() => {
            const duplicated = {
              ...modalState,
              id: `replace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              x: modalState.x + 50,
              y: modalState.y + 50,
            };
            setReplaceModalStates(prev => [...prev, duplicated]);
            if (onPersistReplaceModalCreate) {
              Promise.resolve(onPersistReplaceModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedReplaceModalId === modalState.id}
          initialModel={modalState.model}
          initialSourceImageUrl={modalState.sourceImageUrl}
          initialLocalReplacedImageUrl={modalState.localReplacedImageUrl}
          onOptionsChange={(opts) => {
            // Only update if values actually changed
            const hasChanges = Object.keys(opts).some(key => {
              const currentValue = (modalState as any)[key];
              const newValue = (opts as any)[key];
              return currentValue !== newValue;
            });
            
            if (hasChanges) {
              setReplaceModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m));
              if (onPersistReplaceModalMove) {
                Promise.resolve(onPersistReplaceModalMove(modalState.id, opts)).catch(console.error);
              }
            }
          }}
          onPersistReplaceModalCreate={onPersistReplaceModalCreate}
          onUpdateModalState={(modalId, updates) => {
            setReplaceModalStates(prev => prev.map(m => m.id === modalId ? { ...m, ...updates } : m));
            if (onPersistReplaceModalMove) {
              Promise.resolve(onPersistReplaceModalMove(modalId, updates)).catch(console.error);
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
          stageRef={stageRef}
          scale={scale}
          position={position}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setReplaceModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m));
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistReplaceModalMove) {
              Promise.resolve(onPersistReplaceModalMove(modalState.id, { x: finalX, y: finalY })).catch((err) => {
                console.error('[ModalOverlays] Error in onPersistReplaceModalMove', err);
              });
            }
          }}
        />
      ))}
    </>
  );
};

