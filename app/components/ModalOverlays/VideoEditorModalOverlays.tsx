'use client';

import React from 'react';
import { VideoEditorTrigger } from '@/app/components/Plugins/VideoEditorPluginModal/VideoEditorTrigger';
import Konva from 'konva';
import { VideoEditorModalState } from './types';

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
}) => {
    return (
        <>
            {(videoEditorModalStates || []).map((modalState) => (
                <VideoEditorTrigger
                    key={modalState.id}
                    id={modalState.id}
                    x={modalState.x}
                    y={modalState.y}
                    scale={scale}
                    position={position}
                    isSelected={selectedVideoEditorModalId === modalState.id}
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
