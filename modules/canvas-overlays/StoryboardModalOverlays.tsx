'use client';

import React from 'react';
import { StoryboardPluginModal } from '@/modules/plugins/StoryboardPluginModal/StoryboardPluginModal';
import { buildNamedImagesMap } from '@/modules/plugins/StoryboardPluginModal/mentionUtils';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import Konva from 'konva';
import { ImageModalState } from './types';
import { ImageUpload } from '@/core/types/canvas';
import { useStoryboardStore, useStoryboardSelection, useStoryboardModalStates } from '@/modules/stores';

interface StoryboardModalState {
  id: string;
  x: number;
  y: number;
  frameWidth?: number;
  frameHeight?: number;
  scriptText?: string | null;
  characterNamesMap?: Record<number, string>;
  propsNamesMap?: Record<number, string>;
  backgroundNamesMap?: Record<number, string>;
  namedImages?: {
    characters?: Record<string, string>;
    backgrounds?: Record<string, string>;
    props?: Record<string, string>;
  };
}

interface StoryboardModalOverlaysProps {
  clearAllSelections: () => void;
  onPersistStoryboardModalCreate?: (modal: { id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  onPersistStoryboardModalMove?: (id: string, updates: Partial<{ x: number; y: number; frameWidth?: number; frameHeight?: number; characterNamesMap?: Record<number, string>; propsNamesMap?: Record<number, string>; backgroundNamesMap?: Record<number, string>; namedImages?: { characters?: Record<string, string>; backgrounds?: Record<string, string>; props?: Record<string, string> } }>) => void | Promise<void>;
  onPersistStoryboardModalDelete?: (id: string) => void | Promise<void>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }>;
  textInputStates?: Array<{ id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }>;
  imageModalStates?: ImageModalState[];
  sceneFrameModalStates?: Array<{ id: string; scriptFrameId: string; sceneNumber: number;[key: string]: any }>;
  images?: ImageUpload[];
  onGenerateStoryboard?: (storyboardId: string, inputs: {
    characterInput?: string;
    characterNames?: string;
    backgroundDescription?: string;
    specialRequest?: string;
    isAiMode?: boolean;
    manualScript?: string;
  }) => void;
  isChatOpen?: boolean;
  selectedIds?: string[];
}

export const StoryboardModalOverlays = React.memo<StoryboardModalOverlaysProps>(({
  clearAllSelections,
  onPersistStoryboardModalCreate,
  onPersistStoryboardModalMove,
  onPersistStoryboardModalDelete,
  stageRef,
  scale,
  position,
  connections = [],
  textInputStates = [],
  imageModalStates = [],
  sceneFrameModalStates = [],
  images = [],
  onGenerateStoryboard,
  isChatOpen = false,
  selectedIds = [],
}) => {
  const storeStoryboardModalStates = useStoryboardModalStates();
  const {
    selectedId: storeSelectedStoryboardModalId,
    selectedIds: storeSelectedStoryboardModalIds,
    setSelectedId: storeSetSelectedStoryboardModalId,
    setSelectedIds: storeSetSelectedStoryboardModalIds
  } = useStoryboardSelection();
  const storeSetStoryboardModalStates = useStoryboardStore((state) => state.setStoryboardModalStates);

  /* Removed: Prop fallback logic. State is now strictly managed by Zustand.
  const finalStoryboardModalStates = storyboardModalStates || storeStoryboardModalStates;
  const finalSelectedStoryboardModalId = selectedStoryboardModalId !== undefined ? selectedStoryboardModalId : storeSelectedStoryboardModalId;
  const finalSelectedStoryboardModalIds = selectedStoryboardModalIds !== undefined ? selectedStoryboardModalIds : storeSelectedStoryboardModalIds;

  const finalSetStoryboardModalStates = setStoryboardModalStates || storeSetStoryboardModalStates;
  const finalSetSelectedStoryboardModalId = setSelectedStoryboardModalId || storeSetSelectedStoryboardModalId;
  const finalSetSelectedStoryboardModalIds = setSelectedStoryboardModalIds || storeSetSelectedStoryboardModalIds;
  */
  // Use store directly
  const finalStoryboardModalStates = storeStoryboardModalStates;
  const finalSelectedStoryboardModalId = storeSelectedStoryboardModalId;
  const finalSelectedStoryboardModalIds = storeSelectedStoryboardModalIds;

  const finalSetStoryboardModalStates = storeSetStoryboardModalStates;
  const finalSetSelectedStoryboardModalId = storeSetSelectedStoryboardModalId;
  const finalSetSelectedStoryboardModalIds = storeSetSelectedStoryboardModalIds;

  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

  // Helper to get connected images for a storyboard
  const getConnectedImages = (storyboardId: string, anchor: string): string[] => {
    if (!storyboardId || !connections) return [];
    const matchingConnections = connections.filter(c => c.to === storyboardId && c.toAnchor === anchor);

    const imageUrls: string[] = [];

    matchingConnections.forEach(connection => {
      const imageNode = imageModalStates.find(img => img.id === connection.from);
      if (imageNode) {
        if (imageNode.generatedImageUrl) imageUrls.push(imageNode.generatedImageUrl);
        else if (imageNode.sourceImageUrl) imageUrls.push(imageNode.sourceImageUrl);
      } else {
        const mediaImage = images.find(img => img.elementId === connection.from);
        if (mediaImage && mediaImage.url) {
          imageUrls.push(mediaImage.url);
        }
      }
    });

    return imageUrls;
  };

  return (
    <>
      {contextMenu && (
        <PluginContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onDuplicate={() => {
            const modalState = finalStoryboardModalStates?.find(m => m.id === contextMenu.modalId);
            if (modalState) {
              const duplicated = {
                ...modalState,
                id: `storyboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                x: modalState.x + 50,
                y: modalState.y + 50,
              };
              finalSetStoryboardModalStates(prev => [...prev, duplicated]);
              if (onPersistStoryboardModalCreate) {
                Promise.resolve(onPersistStoryboardModalCreate(duplicated)).catch(console.error);
              }
            }
          }}
          onDelete={() => {
            if (onPersistStoryboardModalDelete) {
              const modalId = contextMenu.modalId;
              finalSetSelectedStoryboardModalId(null);
              finalSetSelectedStoryboardModalIds([]);
              const result = onPersistStoryboardModalDelete(modalId);
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch(console.error);
              }
            }
          }}
        />
      )}
      {(finalStoryboardModalStates || []).map((modalState) => {
        // Get connected images for this storyboard
        const connectedCharacterImages = getConnectedImages(modalState.id, 'receive-character');
        const connectedBackgroundImages = getConnectedImages(modalState.id, 'receive-background');
        const connectedPropsImages = getConnectedImages(modalState.id, 'receive-props');

        return (
          <StoryboardPluginModal
            key={modalState.id}
            isOpen={true}
            id={modalState.id}
            isAttachedToChat={isChatOpen && (finalSelectedStoryboardModalId === modalState.id || (finalSelectedStoryboardModalIds || []).includes(modalState.id))}
            selectionOrder={
              isChatOpen
                ? (() => {
                  if (selectedIds && selectedIds.includes(modalState.id)) {
                    return selectedIds.indexOf(modalState.id) + 1;
                  }
                  if (finalSelectedStoryboardModalIds && finalSelectedStoryboardModalIds.includes(modalState.id)) {
                    return finalSelectedStoryboardModalIds.indexOf(modalState.id) + 1;
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
              finalSetStoryboardModalStates(prev => prev.filter(m => m.id !== modalState.id));
              finalSetSelectedStoryboardModalId(null);
              if (onPersistStoryboardModalDelete) {
                Promise.resolve(onPersistStoryboardModalDelete(modalState.id)).catch(console.error);
              }
            }}
            onSelect={() => {
              clearAllSelections();
              finalSetSelectedStoryboardModalId(modalState.id);
              finalSetSelectedStoryboardModalIds([modalState.id]);
            }}
            onDelete={() => {
              finalSetSelectedStoryboardModalId(null);
              finalSetSelectedStoryboardModalIds([]);
              if (onPersistStoryboardModalDelete) {
                const result = onPersistStoryboardModalDelete(modalState.id);
                if (result && typeof result.then === 'function') {
                  Promise.resolve(result).catch(console.error);
                }
              }
            }}
            onDownload={() => {
              // Placeholder for download functionality
              console.log('[StoryboardModalOverlays] Download not implemented');
            }}
            onDuplicate={() => {
              // Placeholder for duplicate functionality
              console.log('[StoryboardModalOverlays] Duplicate not implemented');
            }}
            isSelected={finalSelectedStoryboardModalId === modalState.id || (finalSelectedStoryboardModalIds || []).includes(modalState.id)}
            frameWidth={modalState.frameWidth}
            frameHeight={modalState.frameHeight}
            scriptText={modalState.scriptText}
            initialCharacterNamesMap={modalState.characterNamesMap}
            initialPropsNamesMap={modalState.propsNamesMap}
            initialBackgroundNamesMap={modalState.backgroundNamesMap}
            onOptionsChange={(opts) => {
              // Check if any naming maps were updated
              const hasNamingUpdate = opts.characterNamesMap || opts.propsNamesMap || opts.backgroundNamesMap;

              if (hasNamingUpdate && onPersistStoryboardModalMove) {
                // Build namedImages map whenever naming maps are updated
                const { characterMap, backgroundMap, propsMap } = buildNamedImagesMap({
                  characterNamesMap: opts.characterNamesMap || modalState.characterNamesMap || {},
                  backgroundNamesMap: opts.backgroundNamesMap || modalState.backgroundNamesMap || {},
                  propsNamesMap: opts.propsNamesMap || modalState.propsNamesMap || {},
                  connectedCharacterImages,
                  connectedBackgroundImages,
                  connectedPropsImages,
                });

                // Build namedImages structure
                const namedImages = {
                  characters: characterMap,
                  backgrounds: backgroundMap,
                  props: propsMap,
                };

                console.log('[StoryboardModalOverlays] Built namedImages:', {
                  storyboardId: modalState.id,
                  characterCount: Object.keys(characterMap).length,
                  backgroundCount: Object.keys(backgroundMap).length,
                  propsCount: Object.keys(propsMap).length,
                  namedImages,
                });

                // Persist with namedImages included
                const result = onPersistStoryboardModalMove(modalState.id, {
                  ...opts,
                  namedImages,
                });

                if (result && typeof result.then === 'function') {
                  Promise.resolve(result).catch(console.error);
                }
              } else if (onPersistStoryboardModalMove) {
                // No naming update, just persist the options as-is
                const result = onPersistStoryboardModalMove(modalState.id, opts);
                if (result && typeof result.then === 'function') {
                  Promise.resolve(result).catch(console.error);
                }
              }
            }}
            onPositionChange={(newX, newY) => {
              // Update local state immediately for smooth dragging
              finalSetStoryboardModalStates((prev: any[]) =>
                prev.map(m =>
                  m.id === modalState.id ? { ...m, x: newX, y: newY } : m
                )
              );
            }}
            onPositionCommit={(newX, newY) => {
              // Persist position change
              if (onPersistStoryboardModalMove) {
                const result = onPersistStoryboardModalMove(modalState.id, { x: newX, y: newY });
                if (result && typeof result.then === 'function') {
                  Promise.resolve(result).catch(console.error);
                }
              }
            }}
            stageRef={stageRef}
            scale={scale}
            position={position}
            x={modalState.x}
            y={modalState.y}
            connections={connections}
            textInputStates={textInputStates}
            imageModalStates={imageModalStates}
            sceneFrameModalStates={sceneFrameModalStates}
            images={images}
            onGenerate={(inputs) => {
              if (onGenerateStoryboard) {
                onGenerateStoryboard(modalState.id, inputs);
              }
            }}
          />
        );
      })}
    </>
  );
});

StoryboardModalOverlays.displayName = 'StoryboardModalOverlays';

