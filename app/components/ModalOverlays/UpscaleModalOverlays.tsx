'use client';

import React from 'react';
import { UpscalePluginModal } from '@/app/components/Plugins/UpscalePluginModal/UpscalePluginModal';
import Konva from 'konva';
import { UpscaleModalState, Connection, ImageModalState } from './types';

interface UpscaleModalOverlaysProps {
  upscaleModalStates: UpscaleModalState[] | undefined;
  selectedUpscaleModalId: string | null | undefined;
  selectedUpscaleModalIds: string[] | undefined;
  clearAllSelections: () => void;
  setUpscaleModalStates: React.Dispatch<React.SetStateAction<UpscaleModalState[]>>;
  setSelectedUpscaleModalId: (id: string | null) => void;
  setSelectedUpscaleModalIds: (ids: string[]) => void;
  onUpscale?: (model: string, scale: number, sourceImageUrl?: string) => Promise<string | null>;
  onPersistUpscaleModalCreate?: (modal: { id: string; x: number; y: number; upscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  onPersistUpscaleModalMove?: (id: string, updates: Partial<{ x: number; y: number; upscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number }>) => void | Promise<void>;
  onPersistUpscaleModalDelete?: (id: string) => void | Promise<void>;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  connections: Connection[];
  imageModalStates: ImageModalState[];
  onPersistConnectorCreate?: (connector: Connection) => void | Promise<void>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
}

export const UpscaleModalOverlays: React.FC<UpscaleModalOverlaysProps> = ({
  upscaleModalStates,
  selectedUpscaleModalId,
  selectedUpscaleModalIds,
  clearAllSelections,
  setUpscaleModalStates,
  setSelectedUpscaleModalId,
  setSelectedUpscaleModalIds,
  onUpscale,
  onPersistUpscaleModalCreate,
  onPersistUpscaleModalMove,
  onPersistUpscaleModalDelete,
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
      {(upscaleModalStates || []).map((modalState) => (
        <UpscalePluginModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          onClose={() => {
            setUpscaleModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedUpscaleModalId(null);
            if (onPersistUpscaleModalDelete) {
              Promise.resolve(onPersistUpscaleModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onUpscale={onUpscale ? async (model, scale, sourceImageUrl) => {
            try {
              return await onUpscale(model, scale, sourceImageUrl);
            } catch (err) {
              console.error('[ModalOverlays] upscale failed', err);
              throw err;
            }
          } : undefined}
          upscaledImageUrl={modalState.upscaledImageUrl}
          isUpscaling={modalState.isUpscaling || false}
          onSelect={() => {
            clearAllSelections();
            setSelectedUpscaleModalId(modalState.id);
            setSelectedUpscaleModalIds([modalState.id]);
          }}
          onDelete={() => {
            setUpscaleModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedUpscaleModalId(null);
            if (onPersistUpscaleModalDelete) {
              Promise.resolve(onPersistUpscaleModalDelete(modalState.id)).catch((err) => {
                console.error('[ModalOverlays] Error in onPersistUpscaleModalDelete', err);
              });
            }
          }}
          onDownload={() => {
            if (modalState.upscaledImageUrl) {
              const link = document.createElement('a');
              link.href = modalState.upscaledImageUrl;
              link.download = `upscaled-${modalState.id}.png`;
              link.click();
            }
          }}
          onDuplicate={() => {
            const duplicated = {
              ...modalState,
              id: `upscale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              x: modalState.x + 50,
              y: modalState.y + 50,
            };
            setUpscaleModalStates(prev => [...prev, duplicated]);
            if (onPersistUpscaleModalCreate) {
              Promise.resolve(onPersistUpscaleModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedUpscaleModalId === modalState.id}
          initialModel={modalState.model}
          initialScale={modalState.scale}
          initialSourceImageUrl={modalState.sourceImageUrl}
          initialLocalUpscaledImageUrl={modalState.localUpscaledImageUrl}
          onOptionsChange={(opts) => {
            // Only update if values actually changed
            const hasChanges = Object.keys(opts).some(key => {
              const currentValue = (modalState as any)[key];
              const newValue = (opts as any)[key];
              return currentValue !== newValue;
            });
            
            if (hasChanges) {
              setUpscaleModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m));
              if (onPersistUpscaleModalMove) {
                Promise.resolve(onPersistUpscaleModalMove(modalState.id, opts)).catch(console.error);
              }
            }
          }}
          onPersistUpscaleModalCreate={onPersistUpscaleModalCreate}
          onUpdateModalState={(modalId, updates) => {
            setUpscaleModalStates(prev => prev.map(m => m.id === modalId ? { ...m, ...updates } : m));
            if (onPersistUpscaleModalMove) {
              Promise.resolve(onPersistUpscaleModalMove(modalId, updates)).catch(console.error);
            }
          }}
          onPersistImageModalCreate={onPersistImageModalCreate}
          onUpdateImageModalState={(modalId, updates) => {
            // This will be handled by parent component
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
            setUpscaleModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m));
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistUpscaleModalMove) {
              Promise.resolve(onPersistUpscaleModalMove(modalState.id, { x: finalX, y: finalY })).catch((err) => {
                console.error('[ModalOverlays] Error in onPersistUpscaleModalMove', err);
              });
            }
          }}
        />
      ))}
    </>
  );
};

