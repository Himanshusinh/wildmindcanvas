'use client';

import React from 'react';
import Konva from 'konva';
import { ExpandPluginModal } from '@/modules/plugins/ExpandPluginModal/ExpandPluginModal';
import { Connection, ImageModalState, ExpandModalState } from './types';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import { useExpandModalStates, useExpandStore, useExpandSelection } from '@/modules/stores';

interface ExpandModalOverlaysProps {
  clearAllSelections: () => void;
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
  isChatOpen?: boolean;
  selectedIds?: string[];
}

export const ExpandModalOverlays = React.memo<ExpandModalOverlaysProps>(({
  clearAllSelections,
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
  isChatOpen = false,
  selectedIds = [],
}) => {
  const storeExpandModalStates = useExpandModalStates();
  const storeSetExpandModalStates = useExpandStore(state => state.setExpandModalStates);
  const { selectedId: storeSelectedExpandModalId, selectedIds: storeSelectedExpandModalIds, setSelectedId: storeSetSelectedExpandModalId, setSelectedIds: storeSetSelectedExpandModalIds } = useExpandSelection();

  /* Removed: Prop fallback logic. State is now strictly managed by Zustand.
  const expandModalStates = propExpandModalStates || storeExpandModalStates;
  const setExpandModalStates = propSetExpandModalStates || storeSetExpandModalStates;
  const selectedExpandModalId = propSelectedExpandModalId || storeSelectedExpandModalId;
  const selectedExpandModalIds = propSelectedExpandModalIds || storeSelectedExpandModalIds;
  const setSelectedExpandModalId = propSetSelectedExpandModalId || storeSetSelectedExpandModalId;
  const setSelectedExpandModalIds = propSetSelectedExpandModalIds || storeSetSelectedExpandModalIds;
  */
  // Use store directly
  const expandModalStates = storeExpandModalStates;
  const setExpandModalStates = storeSetExpandModalStates;
  const selectedExpandModalId = storeSelectedExpandModalId;
  const selectedExpandModalIds = storeSelectedExpandModalIds;
  const setSelectedExpandModalId = storeSetSelectedExpandModalId;
  const setSelectedExpandModalIds = storeSetSelectedExpandModalIds;

  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

  return (
    <>
      {contextMenu && (
        <PluginContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDuplicate={() => {
            const modalState = (expandModalStates || []).find(m => m.id === contextMenu.modalId);
            if (modalState) {
              const duplicated = {
                ...modalState,
                id: `expand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                x: modalState.x + 50,
                y: modalState.y + 50,
              };
              setExpandModalStates(prev => [...prev, duplicated]);
              if (onPersistExpandModalCreate) {
                Promise.resolve(onPersistExpandModalCreate(duplicated)).catch(console.error);
              }
            }
          }}
          onDelete={() => {
            if (onPersistExpandModalDelete) {
              const modalId = contextMenu.modalId;
              setSelectedExpandModalId(null);
              setSelectedExpandModalIds([]);
              const result = onPersistExpandModalDelete(modalId);
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch(console.error);
              }
            }
          }}
        />
      )}
      {(expandModalStates || []).map((modalState) => (
        <ExpandPluginModal
          key={modalState.id}
          isOpen={true}
          isExpanded={modalState.isExpanded}
          id={modalState.id}
          isAttachedToChat={isChatOpen && (selectedExpandModalId === modalState.id || (selectedExpandModalIds || []).includes(modalState.id))}
          selectionOrder={
            isChatOpen
              ? (() => {
                if (selectedIds && selectedIds.includes(modalState.id)) {
                  return selectedIds.indexOf(modalState.id) + 1;
                }
                if (selectedExpandModalIds && selectedExpandModalIds.includes(modalState.id)) {
                  return selectedExpandModalIds.indexOf(modalState.id) + 1;
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
          isSelected={selectedExpandModalId === modalState.id || (selectedExpandModalIds || []).includes(modalState.id)}
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
});

ExpandModalOverlays.displayName = 'ExpandModalOverlays';


