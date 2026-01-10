'use client';

import React from 'react';
import { ImageEditorTrigger } from '@/modules/plugins/ImageEditorPluginModal/ImageEditorTrigger';
import { ImageEditorModalState } from './types';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';

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
}

export const ImageEditorModalOverlays: React.FC<ImageEditorModalOverlaysProps> = ({
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
                        const modalState = imageEditorModalStates?.find(m => m.id === contextMenu.modalId);
                        if (modalState) {
                            const duplicated = {
                                ...modalState,
                                id: `imageeditor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                x: modalState.x + 50,
                                y: modalState.y + 50,
                            };
                            setImageEditorModalStates(prev => [...prev, duplicated]);
                            if (onPersistImageEditorModalCreate) {
                                Promise.resolve(onPersistImageEditorModalCreate(duplicated)).catch(console.error);
                            }
                        }
                    }}
                    onDelete={() => {
                        if (onPersistImageEditorModalDelete) {
                            const modalId = contextMenu.modalId;
                            setSelectedImageEditorModalId(null);
                            setSelectedImageEditorModalIds([]);
                            const result = onPersistImageEditorModalDelete(modalId);
                            if (result && typeof (result as any).then === 'function') {
                                Promise.resolve(result as any).catch(console.error);
                            }
                        }
                    }}
                />
            )}

            {(imageEditorModalStates || []).map((modalState) => (
                <ImageEditorTrigger
                    key={modalState.id}
                    id={modalState.id}
                    x={modalState.x}
                    y={modalState.y}
                    scale={scale}
                    position={position}
                    isSelected={selectedImageEditorModalId === modalState.id}
                    onContextMenu={(e: React.MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({ x: e.clientX, y: e.clientY, modalId: modalState.id });
                    }}
                    onSelect={() => {
                        clearAllSelections();
                        setSelectedImageEditorModalId(modalState.id);
                        setSelectedImageEditorModalIds([modalState.id]);
                    }}
                    onOpenEditor={() => {
                        if (onOpenImageEditor) {
                            onOpenImageEditor();
                        }
                    }}
                    onPositionChange={(newX, newY) => {
                        setImageEditorModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m));
                    }}
                    onPositionCommit={(finalX, finalY) => {
                        if (onPersistImageEditorModalMove) {
                            Promise.resolve(onPersistImageEditorModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
                        }
                    }}
                    onDelete={() => {
                        setSelectedImageEditorModalId(null);
                        setSelectedImageEditorModalIds([]);
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
};
