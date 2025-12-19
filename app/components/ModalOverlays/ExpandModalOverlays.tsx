'use client';

import React from 'react';
import Konva from 'konva';
import { ExpandPluginModal } from '@/app/components/Plugins/ExpandPluginModal/ExpandPluginModal';
import { Connection, ImageModalState, ExpandModalState } from './types';

interface ExpandModalOverlaysProps {
  expandModalStates: ExpandModalState[] | undefined;
  selectedExpandModalId: string | null | undefined;
  selectedExpandModalIds: string[] | undefined;
  clearAllSelections: () => void;
  setExpandModalStates: React.Dispatch<React.SetStateAction<ExpandModalState[]>>;
  setSelectedExpandModalId: (id: string | null) => void;
  setSelectedExpandModalIds: (ids: string[]) => void;
  onExpand?: (model: string, sourceImageUrl?: string, prompt?: string, canvasSize?: [number, number], originalImageSize?: [number, number], originalImageLocation?: [number, number], aspectRatio?: string) => Promise<string | null>;
  onPersistExpandModalCreate?: (modal: ExpandModalState) => void | Promise<void>;
  onPersistExpandModalMove?: (id: string, updates: Partial<ExpandModalState>) => void | Promise<void>;
  onPersistExpandModalDelete?: (id: string) => void | Promise<void>;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }>) => void | Promise<void>;
  connections: Connection[];
  imageModalStates: ImageModalState[];
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: Connection) => void | Promise<void>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
}

export const ExpandModalOverlays: React.FC<ExpandModalOverlaysProps> = ({
  expandModalStates,
  selectedExpandModalId,
  selectedExpandModalIds,
  clearAllSelections,
  setExpandModalStates,
  setSelectedExpandModalId,
  setSelectedExpandModalIds,
  onExpand,
  onPersistExpandModalCreate,
  onPersistExpandModalMove,
  onPersistExpandModalDelete,
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
      {(expandModalStates || []).map((modalState) => (
        <ExpandPluginModal
          key={modalState.id}
          isOpen={true}
          isExpanded={modalState.isExpanded}
          id={modalState.id}
          onClose={() => {
            setExpandModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedExpandModalId(null);
            if (onPersistExpandModalDelete) {
              Promise.resolve(onPersistExpandModalDelete(modalState.id)).catch(console.error);
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setExpandModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m));
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistExpandModalMove) {
              Promise.resolve(onPersistExpandModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
            }
          }}
          onSelect={() => {
            clearAllSelections();
            setSelectedExpandModalId(modalState.id);
            setSelectedExpandModalIds([modalState.id]);
          }}
          onDelete={() => {
            console.log('[ExpandModalOverlays] onDelete called', {
              timestamp: Date.now(),
              modalId: modalState.id,
            });
            // Clear selection immediately
            setSelectedExpandModalId(null);
            setSelectedExpandModalIds([]);
            // Call persist delete - it updates parent state (expandGenerators) which flows down as externalExpandModals
            // Canvas will sync expandModalStates with externalExpandModals via useEffect
            if (onPersistExpandModalDelete) {
              console.log('[ExpandModalOverlays] Calling onPersistExpandModalDelete', modalState.id);
              // Call synchronously - the handler updates parent state immediately
              const result = onPersistExpandModalDelete(modalState.id);
              // If it returns a promise, handle it
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch((err) => {
                  console.error('[ModalOverlays] Error in onPersistExpandModalDelete', err);
                });
              }
            }
            // DO NOT update local state here - let parent state flow down through props
          }}
          onDuplicate={() => {
            const duplicated = {
              ...modalState,
              id: `expand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              x: modalState.x + 40,
              y: modalState.y + 40,
            };
            setExpandModalStates(prev => [...prev, duplicated]);
            if (onPersistExpandModalCreate) {
              Promise.resolve(onPersistExpandModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedExpandModalId === modalState.id}
          connections={connections}
          imageModalStates={imageModalStates}
          images={images}
          onPersistConnectorCreate={onPersistConnectorCreate}
          onExpand={onExpand}
          onUpdateModalState={(modalId, updates) => {
            setExpandModalStates(prev => prev.map(m => m.id === modalId ? { ...m, ...updates } : m));
            if (onPersistExpandModalMove) {
              Promise.resolve(onPersistExpandModalMove(modalId, updates)).catch(console.error);
            }
          }}
          onPersistImageModalCreate={onPersistImageModalCreate}
          onUpdateImageModalState={(modalId, updates) => {
            console.log('[ExpandModalOverlays] onUpdateImageModalState called:', {
              modalId,
              hasGeneratedImageUrl: !!updates.generatedImageUrl,
              updates: Object.keys(updates)
            });
            // Update the image modal state via onPersistImageModalMove
            if (onPersistImageModalMove) {
              Promise.resolve(onPersistImageModalMove(modalId, updates)).then(() => {
                console.log('[ExpandModalOverlays] ✅ Image modal state updated successfully');
              }).catch((err) => {
                console.error('[ExpandModalOverlays] ❌ Failed to update image modal state:', err);
              });
            } else {
              console.warn('[ExpandModalOverlays] ⚠️ onPersistImageModalMove is not available');
            }
          }}
        />
      ))}
    </>
  );
};


