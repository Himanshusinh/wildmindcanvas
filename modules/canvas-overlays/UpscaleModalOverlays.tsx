'use client';

import React from 'react';
import { UpscalePluginModal } from '@/modules/plugins/UpscalePluginModal/UpscalePluginModal';
import Konva from 'konva';
import { UpscaleModalState, Connection, ImageModalState } from './types';
import { downloadImage, generateDownloadFilename } from '@/core/api/downloadUtils';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';

interface UpscaleModalOverlaysProps {
  upscaleModalStates: UpscaleModalState[] | undefined;
  selectedUpscaleModalId: string | null | undefined;
  selectedUpscaleModalIds: string[] | undefined;
  clearAllSelections: () => void;
  setUpscaleModalStates: React.Dispatch<React.SetStateAction<UpscaleModalState[]>>;
  setSelectedUpscaleModalId: (id: string | null) => void;
  setSelectedUpscaleModalIds: (ids: string[]) => void;
  onUpscale?: (model: string, scale: number, sourceImageUrl?: string, faceEnhance?: boolean, faceEnhanceStrength?: number, topazModel?: string, faceEnhanceCreativity?: number) => Promise<string | null>;
  onPersistUpscaleModalCreate?: (modal: { id: string; x: number; y: number; upscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number; faceEnhance?: boolean; faceEnhanceStrength?: number; topazModel?: string; faceEnhanceCreativity?: number }) => void | Promise<void>;
  onPersistUpscaleModalMove?: (id: string, updates: Partial<{ x: number; y: number; upscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number; faceEnhance?: boolean; faceEnhanceStrength?: number; topazModel?: string; faceEnhanceCreativity?: number }>) => void | Promise<void>;
  onPersistUpscaleModalDelete?: (id: string) => void | Promise<void>;
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
  images = [],
  onPersistConnectorCreate,
  stageRef,
  scale,
  position,
  isChatOpen = false,
  selectedIds = [],
}) => {
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

  return (
    <>
      {contextMenu && (
        <PluginContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDuplicate={() => {
            const modalState = upscaleModalStates?.find(m => m.id === contextMenu.modalId);
            if (modalState) {
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
            }
          }}
          onDelete={() => {
            if (onPersistUpscaleModalDelete) {
              const modalId = contextMenu.modalId;
              setSelectedUpscaleModalId(null);
              setSelectedUpscaleModalIds([]);
              const result = onPersistUpscaleModalDelete(modalId);
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch(console.error);
              }
            }
          }}
        />
      )}
      {(upscaleModalStates || []).map((modalState) => (
        <UpscalePluginModal
          key={modalState.id}
          isOpen={true}
          isExpanded={modalState.isExpanded}
          id={modalState.id}
          isAttachedToChat={isChatOpen && (selectedUpscaleModalId === modalState.id || (selectedUpscaleModalIds || []).includes(modalState.id))}
          selectionOrder={
            isChatOpen
              ? (() => {
                  if (selectedIds && selectedIds.includes(modalState.id)) {
                    return selectedIds.indexOf(modalState.id) + 1;
                  }
                  if (selectedUpscaleModalIds && selectedUpscaleModalIds.includes(modalState.id)) {
                    return selectedUpscaleModalIds.indexOf(modalState.id) + 1;
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
            setUpscaleModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedUpscaleModalId(null);
            if (onPersistUpscaleModalDelete) {
              Promise.resolve(onPersistUpscaleModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onUpscale={onUpscale ? async (model, scale, sourceImageUrl, faceEnhance, faceEnhanceStrength, topazModel, faceEnhanceCreativity) => {
            try {
              return await onUpscale(model, scale, sourceImageUrl, faceEnhance, faceEnhanceStrength, topazModel, faceEnhanceCreativity);
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
            console.log('[UpscaleModalOverlays] onDelete called', {
              timestamp: Date.now(),
              modalId: modalState.id,
            });
            // Clear selection immediately
            setSelectedUpscaleModalId(null);
            setSelectedUpscaleModalIds([]);
            // Call persist delete - it updates parent state (upscaleGenerators) which flows down as externalUpscaleModals
            // Canvas will sync upscaleModalStates with externalUpscaleModals via useEffect
            if (onPersistUpscaleModalDelete) {
              console.log('[UpscaleModalOverlays] Calling onPersistUpscaleModalDelete', modalState.id);
              // Call synchronously - the handler updates parent state immediately
              const result = onPersistUpscaleModalDelete(modalState.id);
              // If it returns a promise, handle it
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch((err) => {
                  console.error('[ModalOverlays] Error in onPersistUpscaleModalDelete', err);
                });
              }
            }
            // DO NOT update local state here - let parent state flow down through props
            // The useEffect in Canvas will sync upscaleModalStates with externalUpscaleModals
          }}
          onDownload={async () => {
            if (modalState.upscaledImageUrl) {
              const filename = generateDownloadFilename('upscaled', modalState.id, 'png');
              await downloadImage(modalState.upscaledImageUrl, filename);
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
          isSelected={selectedUpscaleModalId === modalState.id || (selectedUpscaleModalIds || []).includes(modalState.id)}
          initialModel={modalState.model}
          initialScale={modalState.scale}
          initialSourceImageUrl={modalState.sourceImageUrl}
          initialLocalUpscaledImageUrl={modalState.localUpscaledImageUrl}
          initialFaceEnhance={modalState.faceEnhance}
          initialFaceEnhanceStrength={modalState.faceEnhanceStrength}
          initialTopazModel={modalState.topazModel}
          initialFaceEnhanceCreativity={modalState.faceEnhanceCreativity}
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
            // Update the image modal state via onPersistImageModalMove
            if (onPersistImageModalMove) {
              console.log('[UpscaleModalOverlays] Updating image modal state:', { modalId, updates });
              Promise.resolve(onPersistImageModalMove(modalId, updates)).catch(console.error);
            } else {
              console.warn('[UpscaleModalOverlays] onPersistImageModalMove is not defined');
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

