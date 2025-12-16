'use client';

import React from 'react';
import { ErasePluginModal } from '@/app/components/Plugins/ErasePluginModal/ErasePluginModal';
import Konva from 'konva';
import { EraseModalState, Connection, ImageModalState } from './types';
import { downloadImage, generateDownloadFilename } from '@/lib/downloadUtils';

interface EraseModalOverlaysProps {
  eraseModalStates: EraseModalState[] | undefined;
  selectedEraseModalId: string | null | undefined;
  selectedEraseModalIds: string[] | undefined;
  clearAllSelections: () => void;
  setEraseModalStates: React.Dispatch<React.SetStateAction<EraseModalState[]>>;
  setSelectedEraseModalId: (id: string | null) => void;
  setSelectedEraseModalIds: (ids: string[]) => void;
  onErase?: (model: string, sourceImageUrl?: string, mask?: string, prompt?: string) => Promise<string | null>;
  onPersistEraseModalCreate?: (modal: { id: string; x: number; y: number; erasedImageUrl?: string | null; isErasing?: boolean; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  onPersistEraseModalMove?: (id: string, updates: Partial<{ x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; isErasing?: boolean; frameWidth?: number; frameHeight?: number }>) => void | Promise<void>;
  onPersistEraseModalDelete?: (id: string) => void | Promise<void>;
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

export const EraseModalOverlays: React.FC<EraseModalOverlaysProps> = ({
  eraseModalStates,
  selectedEraseModalId,
  selectedEraseModalIds,
  clearAllSelections,
  setEraseModalStates,
  setSelectedEraseModalId,
  setSelectedEraseModalIds,
  onErase,
  onPersistEraseModalCreate,
  onPersistEraseModalMove,
  onPersistEraseModalDelete,
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
      {(eraseModalStates || []).map((modalState) => (
        <ErasePluginModal
          key={modalState.id}
          isOpen={true}
          isExpanded={modalState.isExpanded}
          id={modalState.id}
          onClose={() => {
            setEraseModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedEraseModalId(null);
            if (onPersistEraseModalDelete) {
              Promise.resolve(onPersistEraseModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onErase={onErase ? async (model, sourceImageUrl, mask, prompt) => {
            try {
              return await onErase(model, sourceImageUrl, mask, prompt);
            } catch (err) {
              console.error('[ModalOverlays] erase failed', err);
              throw err;
            }
          } : undefined}
          erasedImageUrl={modalState.erasedImageUrl}
          isErasing={modalState.isErasing || false}
          onSelect={() => {
            clearAllSelections();
            setSelectedEraseModalId(modalState.id);
            setSelectedEraseModalIds([modalState.id]);
          }}
          onDelete={() => {
            console.log('[EraseModalOverlays] onDelete called', {
              timestamp: Date.now(),
              modalId: modalState.id,
            });
            // Clear selection immediately
            setSelectedEraseModalId(null);
            // Call persist delete - it updates parent state (eraseGenerators) which flows down as externalEraseModals
            // Canvas will sync eraseModalStates with externalEraseModals via useEffect
            if (onPersistEraseModalDelete) {
              console.log('[EraseModalOverlays] Calling onPersistEraseModalDelete', modalState.id);
              // Call synchronously - the handler updates parent state immediately
              const result = onPersistEraseModalDelete(modalState.id);
              // If it returns a promise, handle it
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch((err) => {
                  console.error('[ModalOverlays] Error in onPersistEraseModalDelete', err);
                });
              }
            }
            // DO NOT update local state here - let parent state flow down through props
            // The useEffect in Canvas will sync eraseModalStates with externalEraseModals
          }}
          onDownload={async () => {
            if (modalState.erasedImageUrl) {
              const filename = generateDownloadFilename('erase', modalState.id, 'png');
              await downloadImage(modalState.erasedImageUrl, filename);
            }
          }}
          onDuplicate={() => {
            const duplicated = {
              ...modalState,
              id: `erase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              x: modalState.x + 50,
              y: modalState.y + 50,
            };
            setEraseModalStates(prev => [...prev, duplicated]);
            if (onPersistEraseModalCreate) {
              Promise.resolve(onPersistEraseModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedEraseModalId === modalState.id}
          initialModel={modalState.model}
          initialSourceImageUrl={modalState.sourceImageUrl}
          initialLocalErasedImageUrl={modalState.localErasedImageUrl}
          onOptionsChange={(opts) => {
            // Only update if values actually changed
            const hasChanges = Object.keys(opts).some(key => {
              const currentValue = (modalState as any)[key];
              const newValue = (opts as any)[key];
              return currentValue !== newValue;
            });

            if (hasChanges) {
              setEraseModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m));
              if (onPersistEraseModalMove) {
                Promise.resolve(onPersistEraseModalMove(modalState.id, opts)).catch(console.error);
              }
            }
          }}
          onPersistEraseModalCreate={onPersistEraseModalCreate}
          onUpdateModalState={(modalId, updates) => {
            setEraseModalStates(prev => prev.map(m => m.id === modalId ? { ...m, ...updates } : m));
            if (onPersistEraseModalMove) {
              Promise.resolve(onPersistEraseModalMove(modalId, updates)).catch(console.error);
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
            setEraseModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m));
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistEraseModalMove) {
              Promise.resolve(onPersistEraseModalMove(modalState.id, { x: finalX, y: finalY })).catch((err) => {
                console.error('[ModalOverlays] Error in onPersistEraseModalMove', err);
              });
            }
          }}
        />
      ))}
    </>
  );
};

