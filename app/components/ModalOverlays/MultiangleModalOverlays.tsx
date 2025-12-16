'use client';

import React from 'react';
import { MultianglePluginModal } from '@/app/components/Plugins/MultianglePluginModal/MultianglePluginModal';
import Konva from 'konva';
import { MultiangleModalState, Connection, ImageModalState } from './types';
import { downloadImage, generateDownloadFilename } from '@/lib/downloadUtils';

interface MultiangleModalOverlaysProps {
    multiangleModalStates: MultiangleModalState[] | undefined;
    selectedMultiangleModalId: string | null | undefined;
    selectedMultiangleModalIds: string[] | undefined;
    clearAllSelections: () => void;
    setMultiangleModalStates: React.Dispatch<React.SetStateAction<MultiangleModalState[]>>;
    setSelectedMultiangleModalId: (id: string | null) => void;
    setSelectedMultiangleModalIds: (ids: string[]) => void;
    onPersistMultiangleModalCreate?: (modal: { id: string; x: number; y: number; multiangleImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isProcessing?: boolean }) => void | Promise<void>;
    onPersistMultiangleModalMove?: (id: string, updates: Partial<{ x: number; y: number; multiangleImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isProcessing?: boolean }>) => void | Promise<void>;
    onPersistMultiangleModalDelete?: (id: string) => void | Promise<void>;
    connections: Connection[];
    imageModalStates: ImageModalState[];
    images?: Array<{ elementId?: string; url?: string; type?: string }>;
    onPersistConnectorCreate?: (connector: Connection) => void | Promise<void>;
    stageRef: React.RefObject<Konva.Stage | null>;
    scale: number;
    position: { x: number; y: number };
    onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
    onUpdateImageModalState?: (modalId: string, updates: Partial<{ generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }>) => void;
}

export const MultiangleModalOverlays: React.FC<MultiangleModalOverlaysProps> = ({
    multiangleModalStates,
    selectedMultiangleModalId,
    selectedMultiangleModalIds,
    clearAllSelections,
    setMultiangleModalStates,
    setSelectedMultiangleModalId,
    setSelectedMultiangleModalIds,
    onPersistMultiangleModalCreate,
    onPersistMultiangleModalMove,
    onPersistMultiangleModalDelete,
    connections,
    imageModalStates,
    images = [],
    onPersistConnectorCreate,
    stageRef,
    scale,
    position,
    onPersistImageModalCreate,
    onUpdateImageModalState,
}) => {
    return (
        <>
            {(multiangleModalStates || []).map((modalState) => (
                <MultianglePluginModal
                    key={modalState.id}
                    isOpen={true}
                    isExpanded={modalState.isExpanded}
                    id={modalState.id}
                    onClose={() => {
                        setMultiangleModalStates(prev => prev.filter(m => m.id !== modalState.id));
                        setSelectedMultiangleModalId(null);
                        if (onPersistMultiangleModalDelete) {
                            Promise.resolve(onPersistMultiangleModalDelete(modalState.id)).catch(console.error);
                        }
                    }}
                    multiangleImageUrl={modalState.multiangleImageUrl}
                    isProcessing={modalState.isProcessing || false}
                    onSelect={() => {
                        clearAllSelections();
                        setSelectedMultiangleModalId(modalState.id);
                        setSelectedMultiangleModalIds([modalState.id]);
                    }}
                    onDelete={() => {
                        console.log('[MultiangleModalOverlays] onDelete called', {
                            timestamp: Date.now(),
                            modalId: modalState.id,
                        });
                        setSelectedMultiangleModalId(null);
                        setSelectedMultiangleModalIds([]);
                        if (onPersistMultiangleModalDelete) {
                            console.log('[MultiangleModalOverlays] Calling onPersistMultiangleModalDelete', modalState.id);
                            const result = onPersistMultiangleModalDelete(modalState.id);
                            if (result && typeof result.then === 'function') {
                                Promise.resolve(result).catch((err) => {
                                    console.error('[ModalOverlays] Error in onPersistMultiangleModalDelete', err);
                                });
                            }
                        }
                    }}
                    onDownload={async () => {
                        if (modalState.multiangleImageUrl) {
                            const filename = generateDownloadFilename('multiangle', modalState.id, 'png');
                            await downloadImage(modalState.multiangleImageUrl, filename);
                        }
                    }}
                    onDuplicate={() => {
                        const duplicated = {
                            ...modalState,
                            id: `multiangle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            x: modalState.x + 50,
                            y: modalState.y + 50,
                        };
                        setMultiangleModalStates(prev => [...prev, duplicated]);
                        if (onPersistMultiangleModalCreate) {
                            Promise.resolve(onPersistMultiangleModalCreate(duplicated)).catch(console.error);
                        }
                    }}
                    isSelected={selectedMultiangleModalId === modalState.id || (selectedMultiangleModalIds || []).includes(modalState.id)}
                    initialSourceImageUrl={modalState.sourceImageUrl}
                    initialLocalMultiangleImageUrl={modalState.localMultiangleImageUrl}
                    onOptionsChange={(opts) => {
                        const hasChanges = Object.keys(opts).some(key => {
                            const currentValue = (modalState as any)[key];
                            const newValue = (opts as any)[key];
                            return currentValue !== newValue;
                        });

                        if (hasChanges) {
                            setMultiangleModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m));
                            if (onPersistMultiangleModalMove) {
                                Promise.resolve(onPersistMultiangleModalMove(modalState.id, opts)).catch(console.error);
                            }
                        }
                    }}
                    onUpdateModalState={(modalId, updates) => {
                        setMultiangleModalStates(prev => prev.map(m => m.id === modalId ? { ...m, ...updates } : m));
                        if (onPersistMultiangleModalMove) {
                            Promise.resolve(onPersistMultiangleModalMove(modalId, updates)).catch(console.error);
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
                        setMultiangleModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m));
                    }}
                    onPositionCommit={(finalX, finalY) => {
                        if (onPersistMultiangleModalMove) {
                            Promise.resolve(onPersistMultiangleModalMove(modalState.id, { x: finalX, y: finalY })).catch((err) => {
                                console.error('[ModalOverlays] Error in onPersistMultiangleModalMove', err);
                            });
                        }
                    }}
                    onPersistImageModalCreate={onPersistImageModalCreate}
                    onUpdateImageModalState={onUpdateImageModalState}
                />
            ))}
        </>
    );
};
