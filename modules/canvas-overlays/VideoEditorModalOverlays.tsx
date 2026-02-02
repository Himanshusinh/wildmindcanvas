import React from 'react';
import { VideoEditorTrigger } from '@/modules/plugins/VideoEditorPluginModal/VideoEditorTrigger';
import { VideoEditorModalState } from './types';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import Konva from 'konva';
import { useVideoEditorStore, useVideoEditorSelection, useVideoEditorModalStates } from '@/modules/stores';

interface VideoEditorModalOverlaysProps {
    videoEditorModalStates: VideoEditorModalState[] | undefined;
    selectedVideoEditorModalId: string | null | undefined;
    selectedVideoEditorModalIds: string[] | undefined;
    clearAllSelections: () => void;
    setVideoEditorModalStates: React.Dispatch<React.SetStateAction<VideoEditorModalState[]>>;
    setSelectedVideoEditorModalId: (id: string | null) => void;
    setSelectedVideoEditorModalIds: (ids: string[]) => void;
    onPersistVideoEditorModalCreate?: (modal: { id: string; x: number; y: number }) => void | Promise<void>;
    onPersistVideoEditorModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
    onPersistVideoEditorModalDelete?: (id: string) => void | Promise<void>;
    onOpenVideoEditor?: () => void;
    scale: number;
    position: { x: number; y: number };
    isChatOpen?: boolean;
    selectedIds?: string[];
}

export const VideoEditorModalOverlays = React.memo<VideoEditorModalOverlaysProps>(({
    videoEditorModalStates,
    selectedVideoEditorModalId,
    selectedVideoEditorModalIds,
    clearAllSelections,
    setVideoEditorModalStates,
    setSelectedVideoEditorModalId,
    setSelectedVideoEditorModalIds,
    onPersistVideoEditorModalCreate,
    onPersistVideoEditorModalMove,
    onPersistVideoEditorModalDelete,
    onOpenVideoEditor,
    scale,
    position,
    isChatOpen = false,
    selectedIds = [],
}) => {
    const storeVideoEditorModalStates = useVideoEditorModalStates();
    const {
        selectedId: storeSelectedVideoEditorModalId,
        selectedIds: storeSelectedVideoEditorModalIds,
        setSelectedId: storeSetSelectedVideoEditorModalId,
        setSelectedIds: storeSetSelectedVideoEditorModalIds
    } = useVideoEditorSelection();
    const storeSetVideoEditorModalStates = useVideoEditorStore(state => state.setVideoEditorModalStates);

    const finalVideoEditorModalStates = videoEditorModalStates || storeVideoEditorModalStates;
    const finalSelectedVideoEditorModalId = selectedVideoEditorModalId !== undefined ? selectedVideoEditorModalId : storeSelectedVideoEditorModalId;
    const finalSelectedVideoEditorModalIds = selectedVideoEditorModalIds !== undefined ? selectedVideoEditorModalIds : storeSelectedVideoEditorModalIds;

    const finalSetVideoEditorModalStates = setVideoEditorModalStates || storeSetVideoEditorModalStates;
    const finalSetSelectedVideoEditorModalId = setSelectedVideoEditorModalId || storeSetSelectedVideoEditorModalId;
    const finalSetSelectedVideoEditorModalIds = setSelectedVideoEditorModalIds || storeSetSelectedVideoEditorModalIds;

    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

    return (
        <>
            {contextMenu && (
                <PluginContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onDuplicate={() => {
                        const modalState = finalVideoEditorModalStates?.find((m: VideoEditorModalState) => m.id === contextMenu.modalId);
                        if (modalState) {
                            const duplicated = {
                                ...modalState,
                                id: `videoeditor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                x: modalState.x + 50,
                                y: modalState.y + 50,
                            };
                            finalSetVideoEditorModalStates(prev => {
                                const prevArr = typeof prev === 'function' ? (prev as any)(finalVideoEditorModalStates) : prev;
                                return [...(prevArr || []), duplicated];
                            });
                            if (onPersistVideoEditorModalCreate) {
                                Promise.resolve(onPersistVideoEditorModalCreate(duplicated)).catch(console.error);
                            }
                        }
                    }}
                    onDelete={() => {
                        if (onPersistVideoEditorModalDelete) {
                            const modalId = contextMenu.modalId;
                            finalSetSelectedVideoEditorModalId(null);
                            finalSetSelectedVideoEditorModalIds([]);
                            const result = onPersistVideoEditorModalDelete(modalId);
                            if (result && typeof result.then === 'function') {
                                Promise.resolve(result).catch(console.error);
                            }
                        }
                    }}
                />
            )}
            {(finalVideoEditorModalStates || []).map((modalState) => (
                <VideoEditorTrigger
                    key={modalState.id}
                    id={modalState.id}
                    x={modalState.x}
                    y={modalState.y}
                    scale={scale}
                    position={position}
                    isSelected={finalSelectedVideoEditorModalId === modalState.id || (finalSelectedVideoEditorModalIds || []).includes(modalState.id)}
                    isAttachedToChat={isChatOpen && (finalSelectedVideoEditorModalId === modalState.id || (finalSelectedVideoEditorModalIds || []).includes(modalState.id))}
                    selectionOrder={
                        isChatOpen
                            ? (() => {
                                if (selectedIds && selectedIds.includes(modalState.id)) {
                                    return selectedIds.indexOf(modalState.id) + 1;
                                }
                                if (finalSelectedVideoEditorModalIds && finalSelectedVideoEditorModalIds.includes(modalState.id)) {
                                    return finalSelectedVideoEditorModalIds.indexOf(modalState.id) + 1;
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
                    onSelect={() => {
                        clearAllSelections();
                        finalSetSelectedVideoEditorModalId(modalState.id);
                        finalSetSelectedVideoEditorModalIds([modalState.id]);
                    }}
                    onOpenEditor={() => {
                        if (onOpenVideoEditor) {
                            onOpenVideoEditor();
                        }
                    }}
                    onPositionChange={(newX, newY) => {
                        finalSetVideoEditorModalStates(prev => {
                            const prevArr = typeof prev === 'function' ? (prev as any)(finalVideoEditorModalStates) : prev;
                            return (prevArr || []).map((m: VideoEditorModalState) => m.id === modalState.id ? { ...m, x: newX, y: newY } : m);
                        });
                    }}
                    onPositionCommit={(finalX, finalY) => {
                        if (onPersistVideoEditorModalMove) {
                            Promise.resolve(onPersistVideoEditorModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
                        }
                    }}
                    onDelete={() => {
                        console.log('[VideoEditorModalOverlays] onDelete called', {
                            timestamp: Date.now(),
                            modalId: modalState.id,
                        });
                        // Clear selection immediately
                        finalSetSelectedVideoEditorModalId(null);
                        finalSetSelectedVideoEditorModalIds([]);
                        // Call persist delete - it updates parent state (videoEditorGenerators) which flows down as externalVideoEditorModals
                        // Canvas will sync videoEditorModalStates with externalVideoEditorModals via useEffect
                        if (onPersistVideoEditorModalDelete) {
                            console.log('[VideoEditorModalOverlays] Calling onPersistVideoEditorModalDelete', modalState.id);
                            // Call synchronously - the handler updates parent state immediately
                            const result = onPersistVideoEditorModalDelete(modalState.id);
                            // If it returns a promise, handle it
                            if (result && typeof result.then === 'function') {
                                Promise.resolve(result).catch((err) => {
                                    console.error('[ModalOverlays] Error in onPersistVideoEditorModalDelete', err);
                                });
                            }
                        }
                        // DO NOT update local state here - let parent state flow down through props
                    }}
                />
            ))}
        </>
    );
});

VideoEditorModalOverlays.displayName = 'VideoEditorModalOverlays';
