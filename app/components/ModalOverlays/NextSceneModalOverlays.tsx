'use client';

import React from 'react';
import { NextScenePluginModal } from '@/app/components/Plugins/NextScenePluginModal/NextScenePluginModal';
import Konva from 'konva';
import { Connection, ImageModalState, NextSceneModalState } from './types';
import { downloadImage, generateDownloadFilename } from '@/lib/downloadUtils';

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
}) => {
    return (
        <>
            {(nextSceneModalStates || []).map((modalState) => (
                <NextScenePluginModal
                    key={modalState.id}
                    isOpen={true}
                    id={modalState.id}
                    onClose={() => {
                        setNextSceneModalStates(prev => prev.filter(m => m.id !== modalState.id));
                        setSelectedNextSceneModalId(null);
                        if (onPersistNextSceneModalDelete) {
                            Promise.resolve(onPersistNextSceneModalDelete(modalState.id)).catch(console.error);
                        }
                    }}
                    nextSceneImageUrl={modalState.nextSceneImageUrl}
                    isProcessing={modalState.isProcessing || false}
                    onSelect={() => {
                        clearAllSelections();
                        setSelectedNextSceneModalId(modalState.id);
                        setSelectedNextSceneModalIds([modalState.id]);
                    }}
                    onDelete={() => {
                        console.log('[NextSceneModalOverlays] onDelete called', {
                            timestamp: Date.now(),
                            modalId: modalState.id,
                        });
                        // Clear selection immediately
                        setSelectedNextSceneModalId(null);
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
                        };
                        setNextSceneModalStates(prev => [...prev, newModal]);
                        if (onPersistNextSceneModalCreate) {
                            Promise.resolve(onPersistNextSceneModalCreate(newModal)).catch(console.error);
                        }
                    }}
                    isSelected={selectedNextSceneModalId === modalState.id || (selectedNextSceneModalIds || []).includes(modalState.id)}
                    stageRef={stageRef}
                    scale={scale}
                    position={position}
                    x={modalState.x}
                    y={modalState.y}
                    onPositionChange={(newX, newY) => {
                        setNextSceneModalStates(prev =>
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
                        setNextSceneModalStates(prev =>
                            prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m)
                        );
                        if (onPersistNextSceneModalMove) {
                            Promise.resolve(onPersistNextSceneModalMove(modalState.id, opts as any)).catch(console.error);
                        }
                    }}
                    onPersistNextSceneModalCreate={onPersistNextSceneModalCreate}
                    onUpdateModalState={(modalId, updates) => {
                        setNextSceneModalStates(prev =>
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
