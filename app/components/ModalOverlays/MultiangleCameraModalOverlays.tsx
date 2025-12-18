'use client';

import React from 'react';
import { MultiangleCameraPluginModal } from '@/app/components/Plugins/MultiangleCameraPluginModal/MultiangleCameraPluginModal';
import Konva from 'konva';
import { Connection, ImageModalState } from './types';

interface MultiangleCameraModalState {
  id: string;
  x: number;
  y: number;
  sourceImageUrl?: string | null;
  isExpanded?: boolean;
}

interface MultiangleCameraModalOverlaysProps {
  multiangleCameraModalStates: MultiangleCameraModalState[] | undefined;
  selectedMultiangleCameraModalId: string | null | undefined;
  selectedMultiangleCameraModalIds: string[] | undefined;
  clearAllSelections: () => void;
  setMultiangleCameraModalStates: React.Dispatch<React.SetStateAction<MultiangleCameraModalState[]>>;
  setSelectedMultiangleCameraModalId: (id: string | null) => void;
  setSelectedMultiangleCameraModalIds: (ids: string[]) => void;
  onPersistMultiangleCameraModalCreate?: (modal: { id: string; x: number; y: number; sourceImageUrl?: string | null }) => void | Promise<void>;
  onPersistMultiangleCameraModalMove?: (id: string, updates: Partial<{ x: number; y: number; sourceImageUrl?: string | null }>) => void | Promise<void>;
  onPersistMultiangleCameraModalDelete?: (id: string) => void | Promise<void>;
  onMultiangleCamera?: (sourceImageUrl?: string, prompt?: string, loraScale?: number, aspectRatio?: string, moveForward?: number, verticalTilt?: number, rotateDegrees?: number, useWideAngle?: boolean) => Promise<string | null>;
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

export const MultiangleCameraModalOverlays: React.FC<MultiangleCameraModalOverlaysProps> = ({
  multiangleCameraModalStates,
  selectedMultiangleCameraModalId,
  selectedMultiangleCameraModalIds,
  clearAllSelections,
  setMultiangleCameraModalStates,
  setSelectedMultiangleCameraModalId,
  setSelectedMultiangleCameraModalIds,
  onPersistMultiangleCameraModalCreate,
  onPersistMultiangleCameraModalMove,
  onPersistMultiangleCameraModalDelete,
  onMultiangleCamera,
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
      {(multiangleCameraModalStates || []).map((modalState) => (
        <MultiangleCameraPluginModal
          key={modalState.id}
          isOpen={true}
          isExpanded={modalState.isExpanded}
          id={modalState.id}
          onClose={() => {
            setMultiangleCameraModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedMultiangleCameraModalId(null);
            if (onPersistMultiangleCameraModalDelete) {
              Promise.resolve(onPersistMultiangleCameraModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onSelect={() => {
            clearAllSelections();
            setSelectedMultiangleCameraModalId(modalState.id);
            setSelectedMultiangleCameraModalIds([modalState.id]);
          }}
          onDelete={() => {
            console.log('[MultiangleCameraModalOverlays] onDelete called', {
              timestamp: Date.now(),
              modalId: modalState.id,
            });
            setSelectedMultiangleCameraModalId(null);
            if (onPersistMultiangleCameraModalDelete) {
              const result = onPersistMultiangleCameraModalDelete(modalState.id);
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch((err) => {
                  console.error('[ModalOverlays] Error in onPersistMultiangleCameraModalDelete', err);
                });
              }
            }
          }}
          onDownload={async () => {
            // Download functionality can be added later
            console.log('Download not implemented yet');
          }}
          onDuplicate={() => {
            const duplicated = {
              ...modalState,
              id: `multiangle-camera-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              x: modalState.x + 50,
              y: modalState.y + 50,
            };
            setMultiangleCameraModalStates(prev => [...prev, duplicated]);
            if (onPersistMultiangleCameraModalCreate) {
              Promise.resolve(onPersistMultiangleCameraModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedMultiangleCameraModalId === modalState.id}
          initialSourceImageUrl={modalState.sourceImageUrl}
          onOptionsChange={(opts) => {
            const hasChanges = Object.keys(opts).some(key => {
              const currentValue = (modalState as any)[key];
              const newValue = (opts as any)[key];
              return currentValue !== newValue;
            });

            if (hasChanges) {
              setMultiangleCameraModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m));
              if (onPersistMultiangleCameraModalMove) {
                Promise.resolve(onPersistMultiangleCameraModalMove(modalState.id, opts)).catch(console.error);
              }
            }
          }}
          onPersistMultiangleCameraModalCreate={onPersistMultiangleCameraModalCreate}
          onUpdateModalState={(modalId, updates) => {
            setMultiangleCameraModalStates(prev => prev.map(m => m.id === modalId ? { ...m, ...updates } : m));
            if (onPersistMultiangleCameraModalMove) {
              Promise.resolve(onPersistMultiangleCameraModalMove(modalId, updates)).catch(console.error);
            }
          }}
          onMultiangleCamera={onMultiangleCamera ? async (sourceImageUrl, prompt, loraScale, aspectRatio, moveForward, verticalTilt, rotateDegrees, useWideAngle) => {
            try {
              return await onMultiangleCamera(sourceImageUrl, prompt, loraScale, aspectRatio, moveForward, verticalTilt, rotateDegrees, useWideAngle);
            } catch (err) {
              console.error('[ModalOverlays] multiangle camera failed', err);
              throw err;
            }
          } : undefined}
          onPersistImageModalCreate={onPersistImageModalCreate}
          onUpdateImageModalState={(modalId, updates) => {
            if (onPersistImageModalMove) {
              console.log('[MultiangleCameraModalOverlays] Updating image modal state:', { modalId, updates });
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
            setMultiangleCameraModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m));
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistMultiangleCameraModalMove) {
              Promise.resolve(onPersistMultiangleCameraModalMove(modalState.id, { x: finalX, y: finalY })).catch((err) => {
                console.error('[ModalOverlays] Error in onPersistMultiangleCameraModalMove', err);
              });
            }
          }}
        />
      ))}
    </>
  );
};
