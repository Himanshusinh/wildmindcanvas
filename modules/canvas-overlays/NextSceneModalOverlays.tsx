'use client';

import React from 'react';
import { NextScenePluginModal } from '@/modules/plugins/NextScenePluginModal/NextScenePluginModal';
import Konva from 'konva';
import { Connection, ImageModalState, NextSceneModalState } from './types';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import { downloadImage, generateDownloadFilename } from '@/core/api/downloadUtils';
import { useNextSceneStore, useNextSceneSelection, useNextSceneModalStates } from '@/modules/stores';

interface NextSceneModalOverlaysProps {
    nextSceneModalStates: NextSceneModalState[] | undefined;
    selectedNextSceneModalId: string | null | undefined;
    selectedNextSceneModalIds: string[] | undefined;
    clearAllSelections: () => void;
    setNextSceneModalStates: React.Dispatch<React.SetStateAction<NextSceneModalState[]>>;
    setSelectedNextSceneModalId: (id: string | null) => void;
    setSelectedNextSceneModalIds: (ids: string[]) => void;
    onPersistNextSceneModalCreate?: (modal: { id: string; x: number; y: number; nextSceneImageUrl?: string | null; sourceImageUrl?: string | null; localNextSceneImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isProcessing?: boolean }) => void | Promise<void>;
    onPersistNextSceneModalMove?: (id: string, updates: Partial<{ x: number; y: number; nextSceneImageUrl?: string | null; sourceImageUrl?: string | null; localNextSceneImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isProcessing?: boolean }>) => void | Promise<void>;
    onPersistNextSceneModalDelete?: (id: string) => void | Promise<void>;
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

export const NextSceneModalOverlays: React.FC<NextSceneModalOverlaysProps> = ({
    nextSceneModalStates,
    selectedNextSceneModalId,
    selectedNextSceneModalIds,
    clearAllSelections,
    setNextSceneModalStates,
    setSelectedNextSceneModalId,
    setSelectedNextSceneModalIds,
    onPersistNextSceneModalCreate,
    onPersistNextSceneModalMove,
    onPersistNextSceneModalDelete,
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
    const storeNextSceneModalStates = useNextSceneModalStates();
    const {
        selectedId: storeSelectedNextSceneModalId,
        selectedIds: storeSelectedNextSceneModalIds,
        setSelectedId: storeSetSelectedNextSceneModalId,
        setSelectedIds: storeSetSelectedNextSceneModalIds
    } = useNextSceneSelection();
    const { setNextSceneModalStates: storeSetNextSceneModalStates } = useNextSceneStore();

    const finalNextSceneModalStates = nextSceneModalStates || storeNextSceneModalStates;
    const finalSelectedNextSceneModalId = selectedNextSceneModalId !== undefined ? selectedNextSceneModalId : storeSelectedNextSceneModalId;
    const finalSelectedNextSceneModalIds = selectedNextSceneModalIds !== undefined ? selectedNextSceneModalIds : storeSelectedNextSceneModalIds;

    const finalSetNextSceneModalStates = setNextSceneModalStates || storeSetNextSceneModalStates;
    const finalSetSelectedNextSceneModalId = setSelectedNextSceneModalId || storeSetSelectedNextSceneModalId;
    const finalSetSelectedNextSceneModalIds = setSelectedNextSceneModalIds || storeSetSelectedNextSceneModalIds;

    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

    return (
        <>
            {contextMenu && (
                <PluginContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onDuplicate={() => {
                        const modalState = finalNextSceneModalStates?.find(m => m.id === contextMenu.modalId);
                        if (modalState) {
                            const duplicated = {
                                ...modalState,
                                id: `nextscene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                x: modalState.x + 50,
                                y: modalState.y + 50,
                            };
                            finalSetNextSceneModalStates(prev => [...prev, duplicated]);
                            if (onPersistNextSceneModalCreate) {
                                Promise.resolve(onPersistNextSceneModalCreate(duplicated)).catch(console.error);
                            }
                        }
                    }}
                    onDelete={() => {
                        if (onPersistNextSceneModalDelete) {
                            const modalId = contextMenu.modalId;
                            finalSetSelectedNextSceneModalId(null);
                            finalSetSelectedNextSceneModalIds([]);
                            const result = onPersistNextSceneModalDelete(modalId);
                            if (result && typeof result.then === 'function') {
                                Promise.resolve(result).catch(console.error);
                            }
                        }
                    }}
                />
            )}
            {(finalNextSceneModalStates || []).map((modalState) => (
                <NextScenePluginModal
                    key={modalState.id}
                    isOpen={true}
                    isExpanded={modalState.isExpanded}
                    id={modalState.id}
                    isAttachedToChat={isChatOpen && (finalSelectedNextSceneModalId === modalState.id || (finalSelectedNextSceneModalIds || []).includes(modalState.id))}
                    selectionOrder={
                        isChatOpen
                            ? (() => {
                                if (selectedIds && selectedIds.includes(modalState.id)) {
                                    return selectedIds.indexOf(modalState.id) + 1;
                                }
                                if (finalSelectedNextSceneModalIds && finalSelectedNextSceneModalIds.includes(modalState.id)) {
                                    return finalSelectedNextSceneModalIds.indexOf(modalState.id) + 1;
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
                        finalSetNextSceneModalStates(prev => prev.filter(m => m.id !== modalState.id));
                        finalSetSelectedNextSceneModalId(null);
                        if (onPersistNextSceneModalDelete) {
                            Promise.resolve(onPersistNextSceneModalDelete(modalState.id)).catch(console.error);
                        }
                    }}
                    nextSceneImageUrl={modalState.nextSceneImageUrl}
                    isProcessing={modalState.isProcessing || false}
                    onSelect={() => {
                        clearAllSelections();
                        finalSetSelectedNextSceneModalId(modalState.id);
                        finalSetSelectedNextSceneModalIds([modalState.id]);
                    }}
                    onDelete={() => {
                        console.log('[NextSceneModalOverlays] onDelete called', {
                            timestamp: Date.now(),
                            modalId: modalState.id,
                        });
                        // Clear selection immediately
                        finalSetSelectedNextSceneModalId(null);
                        finalSetSelectedNextSceneModalIds([]);
                        // Call persist delete - it updates parent state (nextSceneGenerators) which flows down as externalNextSceneModals
                        // Canvas will sync nextSceneModalStates with externalNextSceneModals via useEffect
                        if (onPersistNextSceneModalDelete) {
                            console.log('[NextSceneModalOverlays] Calling onPersistNextSceneModalDelete', modalState.id);
                            // Call synchronously - the handler updates parent state immediately
                            const result = onPersistNextSceneModalDelete(modalState.id);
                            // If it returns a promise, handle it
                            if (result && typeof result.then === 'function') {
                                Promise.resolve(result).catch((err) => {
                                    console.error('[ModalOverlays] Error in onPersistNextSceneModalDelete', err);
                                });
                            }
                        }
                        // DO NOT update local state here - let parent state flow down through props
                    }}
                    onDownload={async () => {
                        if (modalState.nextSceneImageUrl) {
                            const filename = generateDownloadFilename('nextscene', modalState.id, 'png');
                            await downloadImage(modalState.nextSceneImageUrl, filename);
                        }
                    }}
                    onDuplicate={() => {
                        const newId = `nextscene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        const newModal = {
                            id: newId,
                            x: modalState.x + 450,
                            y: modalState.y,
                            nextSceneImageUrl: modalState.nextSceneImageUrl,
                            sourceImageUrl: modalState.sourceImageUrl,
                            localNextSceneImageUrl: modalState.localNextSceneImageUrl,
                            mode: modalState.mode || 'scene',
                            frameWidth: modalState.frameWidth || 400,
                            frameHeight: modalState.frameHeight || 500,
                            isProcessing: false,
                        } as any;
                        finalSetNextSceneModalStates(prev => [...prev, newModal]);
                        if (onPersistNextSceneModalCreate) {
                            Promise.resolve(onPersistNextSceneModalCreate(newModal)).catch(console.error);
                        }
                    }}
                    isSelected={finalSelectedNextSceneModalId === modalState.id || (finalSelectedNextSceneModalIds || []).includes(modalState.id)}
                    stageRef={stageRef}
                    scale={scale}
                    position={position}
                    x={modalState.x}
                    y={modalState.y}
                    // #region agent log
                    // Log position props to verify they're updating
                    // #endregion
                    onPositionChange={(newX, newY) => {
                        finalSetNextSceneModalStates(prev =>
                            prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m)
                        );
                    }}
                    onPositionCommit={(newX, newY) => {
                        if (onPersistNextSceneModalMove) {
                            Promise.resolve(onPersistNextSceneModalMove(modalState.id, { x: newX, y: newY })).catch(console.error);
                        }
                    }}
                    initialMode={modalState.mode}
                    initialSourceImageUrl={modalState.sourceImageUrl}
                    initialLocalNextSceneImageUrl={modalState.localNextSceneImageUrl}
                    onOptionsChange={(opts) => {
                        finalSetNextSceneModalStates(prev =>
                            prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m)
                        );
                        if (onPersistNextSceneModalMove) {
                            Promise.resolve(onPersistNextSceneModalMove(modalState.id, opts as any)).catch(console.error);
                        }
                    }}
                    onPersistNextSceneModalCreate={onPersistNextSceneModalCreate}
                    onUpdateModalState={(modalId, updates) => {
                        finalSetNextSceneModalStates(prev =>
                            prev.map(m => m.id === modalId ? { ...m, ...updates } : m)
                        );
                        if (onPersistNextSceneModalMove) {
                            Promise.resolve(onPersistNextSceneModalMove(modalId, updates as any)).catch(console.error);
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
};
