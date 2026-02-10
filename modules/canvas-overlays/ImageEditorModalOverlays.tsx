'use client';

import React from 'react';
import { ImageEditorTrigger } from '@/modules/plugins/ImageEditorPluginModal/ImageEditorTrigger';
import { ImageEditorModalState } from './types';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import { useImageEditorStore, useImageEditorSelection, useImageEditorModalStates } from '@/modules/stores';

interface ImageEditorModalOverlaysProps {
    imageEditorModalStates: ImageEditorModalState[] | undefined;
    selectedImageEditorModalId: string | null | undefined;
    selectedImageEditorModalIds: string[] | undefined;
    clearAllSelections: () => void;
    setImageEditorModalStates: React.Dispatch<React.SetStateAction<ImageEditorModalState[]>>;
    setSelectedImageEditorModalId: (id: string | null) => void;
    setSelectedImageEditorModalIds: (ids: string[]) => void;
    onPersistImageEditorModalCreate?: (modal: { id: string; x: number; y: number }) => void | Promise<void>;
    onPersistImageEditorModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
    onPersistImageEditorModalDelete?: (id: string) => void | Promise<void>;
    onOpenImageEditor?: () => void;
    scale: number;
    position: { x: number; y: number };
    isChatOpen?: boolean;
    selectedIds?: string[];
}

export const ImageEditorModalOverlays = React.memo<ImageEditorModalOverlaysProps>(({
    imageEditorModalStates,
    selectedImageEditorModalId,
    selectedImageEditorModalIds,
    clearAllSelections,
    setImageEditorModalStates,
    setSelectedImageEditorModalId,
    setSelectedImageEditorModalIds,
    onPersistImageEditorModalCreate,
    onPersistImageEditorModalMove,
    onPersistImageEditorModalDelete,
    onOpenImageEditor,
    scale,
    position,
    isChatOpen = false,
    selectedIds = [],
}) => {
    const storeImageEditorModalStates = useImageEditorModalStates();
    const {
        selectedId: storeSelectedImageEditorModalId,
        selectedIds: storeSelectedImageEditorModalIds,
        setSelectedId: storeSetSelectedImageEditorModalId,
        setSelectedIds: storeSetSelectedImageEditorModalIds
    } = useImageEditorSelection();
    const storeSetImageEditorModalStates = useImageEditorStore(state => state.setImageEditorModalStates);

    const finalImageEditorModalStates = imageEditorModalStates || storeImageEditorModalStates;
    const finalSelectedImageEditorModalId = selectedImageEditorModalId !== undefined ? selectedImageEditorModalId : storeSelectedImageEditorModalId;
    const finalSelectedImageEditorModalIds = selectedImageEditorModalIds !== undefined ? selectedImageEditorModalIds : storeSelectedImageEditorModalIds;

    const finalSetImageEditorModalStates = setImageEditorModalStates || storeSetImageEditorModalStates;
    const finalSetSelectedImageEditorModalId = setSelectedImageEditorModalId || storeSetSelectedImageEditorModalId;
    const finalSetSelectedImageEditorModalIds = setSelectedImageEditorModalIds || storeSetSelectedImageEditorModalIds;

    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

    return (
        <>
            {contextMenu && (
                <PluginContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onDuplicate={() => {
                        const modalState = finalImageEditorModalStates?.find((m: ImageEditorModalState) => m.id === contextMenu.modalId);
                        if (modalState) {
                            const duplicated = {
                                ...modalState,
                                id: `imageeditor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                x: modalState.x + 50,
                                y: modalState.y + 50,
                            };
                            finalSetImageEditorModalStates((prev: ImageEditorModalState[]) => {
                                const prevArr = typeof prev === 'function' ? (prev as any)(finalImageEditorModalStates) : prev;
                                return [...(prevArr || []), duplicated];
                            });
                            if (onPersistImageEditorModalCreate) {
                                Promise.resolve(onPersistImageEditorModalCreate(duplicated)).catch(console.error);
                            }
                        }
                    }}
                    onDelete={() => {
                        if (onPersistImageEditorModalDelete) {
                            const modalId = contextMenu.modalId;
                            finalSetSelectedImageEditorModalId(null);
                            finalSetSelectedImageEditorModalIds([]);
                            const result = onPersistImageEditorModalDelete(modalId);
                            if (result && typeof (result as any).then === 'function') {
                                Promise.resolve(result as any).catch(console.error);
                            }
                        }
                    }}
                />
            )}

            {(finalImageEditorModalStates || []).map((modalState) => (
                <ImageEditorTrigger
                    key={modalState.id}
                    id={modalState.id}
                    x={modalState.x}
                    y={modalState.y}
                    scale={scale}
                    position={position}
                    isSelected={finalSelectedImageEditorModalId === modalState.id || (finalSelectedImageEditorModalIds || []).includes(modalState.id)}
                    isAttachedToChat={isChatOpen && (finalSelectedImageEditorModalId === modalState.id || (finalSelectedImageEditorModalIds || []).includes(modalState.id))}
                    selectionOrder={
                        isChatOpen
                            ? (() => {
                                if (selectedIds && selectedIds.includes(modalState.id)) {
                                    return selectedIds.indexOf(modalState.id) + 1;
                                }
                                if (finalSelectedImageEditorModalIds && finalSelectedImageEditorModalIds.includes(modalState.id)) {
                                    return finalSelectedImageEditorModalIds.indexOf(modalState.id) + 1;
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
                        finalSetSelectedImageEditorModalId(modalState.id);
                        finalSetSelectedImageEditorModalIds([modalState.id]);
                    }}
                    onOpenEditor={() => {
                        if (onOpenImageEditor) {
                            onOpenImageEditor();
                        }
                    }}
                    onPositionChange={(newX, newY) => {
                        finalSetImageEditorModalStates((prev: ImageEditorModalState[]) => {
                            const prevArr = typeof prev === 'function' ? (prev as any)(finalImageEditorModalStates) : prev;
                            return (prevArr || []).map((m: ImageEditorModalState) => m.id === modalState.id ? { ...m, x: newX, y: newY } : m);
                        });
                    }}
                    onPositionCommit={(finalX, finalY) => {
                        if (onPersistImageEditorModalMove) {
                            Promise.resolve(onPersistImageEditorModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
                        }
                    }}
                    onDelete={() => {
                        finalSetSelectedImageEditorModalId(null);
                        finalSetSelectedImageEditorModalIds([]);
                        if (onPersistImageEditorModalDelete) {
                            const result = onPersistImageEditorModalDelete(modalState.id);
                            if (result && typeof (result as any).then === 'function') {
                                Promise.resolve(result as any).catch((err) => {
                                    console.error('[ImageEditorModalOverlays] Error in onPersistImageEditorModalDelete', err);
                                });
                            }
                        }
                    }}
                />
            ))}
        </>
    );
});

ImageEditorModalOverlays.displayName = 'ImageEditorModalOverlays';
