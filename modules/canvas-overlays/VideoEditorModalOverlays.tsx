'use client';

import React from 'react';
import { VideoEditorTrigger } from '@/modules/plugins/VideoEditorPluginModal/VideoEditorTrigger';
import { VideoEditorModalState } from './types';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import Konva from 'konva';

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

export const VideoEditorModalOverlays: React.FC<VideoEditorModalOverlaysProps> = ({
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
    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

    return (
        <>
            {contextMenu && (
                <PluginContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onDuplicate={() => {
                        const modalState = videoEditorModalStates?.find(m => m.id === contextMenu.modalId);
                        if (modalState) {
                            const duplicated = {
                                ...modalState,
                                id: `videoeditor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                x: modalState.x + 50,
                                y: modalState.y + 50,
                            };
                            setVideoEditorModalStates(prev => [...prev, duplicated]);
                            if (onPersistVideoEditorModalCreate) {
                                Promise.resolve(onPersistVideoEditorModalCreate(duplicated)).catch(console.error);
                            }
                        }
                    }}
                    onDelete={() => {
                        if (onPersistVideoEditorModalDelete) {
                            const modalId = contextMenu.modalId;
                            setSelectedVideoEditorModalId(null);
                            setSelectedVideoEditorModalIds([]);
                            const result = onPersistVideoEditorModalDelete(modalId);
                            if (result && typeof result.then === 'function') {
                                Promise.resolve(result).catch(console.error);
                            }
                        }
                    }}
                />
            )}
            {(videoEditorModalStates || []).map((modalState) => (
                <VideoEditorTrigger
                    key={modalState.id}
                    id={modalState.id}
                    x={modalState.x}
                    y={modalState.y}
                    scale={scale}
                    position={position}
                    isSelected={selectedVideoEditorModalId === modalState.id || (selectedVideoEditorModalIds || []).includes(modalState.id)}
                    isAttachedToChat={isChatOpen && (selectedVideoEditorModalId === modalState.id || (selectedVideoEditorModalIds || []).includes(modalState.id))}
                    selectionOrder={
                      isChatOpen
                        ? (() => {
                            if (selectedIds && selectedIds.includes(modalState.id)) {
                              return selectedIds.indexOf(modalState.id) + 1;
                            }
                            if (selectedVideoEditorModalIds && selectedVideoEditorModalIds.includes(modalState.id)) {
                              return selectedVideoEditorModalIds.indexOf(modalState.id) + 1;
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
                        setSelectedVideoEditorModalId(modalState.id);
                        setSelectedVideoEditorModalIds([modalState.id]);
                    }}
                    onOpenEditor={() => {
                        if (onOpenVideoEditor) {
                            onOpenVideoEditor();
                        }
                    }}
                    onPositionChange={(newX, newY) => {
                        setVideoEditorModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m));
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
                        setSelectedVideoEditorModalId(null);
                        setSelectedVideoEditorModalIds([]);
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
};
