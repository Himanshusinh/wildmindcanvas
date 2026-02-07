import React from 'react';
import { ComparePluginModal } from '@/modules/plugins/ComparePluginModal/ComparePluginModal';
import { CompareModalState } from './types';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import { useCompareStore, useCompareSelection, useCompareModalStates } from '@/modules/stores';

interface CompareModalOverlaysProps {
    clearAllSelections: () => void;
    onPersistCompareModalCreate?: (modal: CompareModalState) => void | Promise<void>;
    onPersistCompareModalMove?: (id: string, updates: Partial<CompareModalState>) => void | Promise<void>;
    onPersistCompareModalDelete?: (id: string) => void | Promise<void>;
    stageRef?: any;
    scale?: number;
    position?: { x: number; y: number };
    onPersistImageModalCreate?: (modal: any) => void | Promise<void>;
    onUpdateImageModalState?: (id: string, updates: any) => void;
    onPersistConnectorCreate?: (connector: any) => void | Promise<void>;
    projectId?: string | null;
    isChatOpen?: boolean;
    selectedIds?: string[];
}

export const CompareModalOverlays = React.memo<CompareModalOverlaysProps>(({
    clearAllSelections,
    onPersistCompareModalCreate,
    onPersistCompareModalMove,
    onPersistCompareModalDelete,
    stageRef,
    scale,
    position,
    projectId,
    onPersistImageModalCreate,
    onUpdateImageModalState,
    onPersistConnectorCreate,
    isChatOpen = false,
    selectedIds = [],
}) => {
    // Zustand Store
    const compareModalStates = useCompareModalStates();
    const selectedCompareModalId = useCompareStore(state => state.selectedId);
    const selectedCompareModalIds = useCompareStore(state => state.selectedIds);
    const setSelectedCompareModalId = useCompareStore(state => state.setSelectedId);
    const setSelectedCompareModalIds = useCompareStore(state => state.setSelectedIds);
    const setCompareModalStates = useCompareStore(state => state.setCompareModalStates);

    const finalCompareModalStates = compareModalStates;
    const finalSelectedCompareModalId = selectedCompareModalId;
    const finalSelectedCompareModalIds = selectedCompareModalIds;

    const finalSetCompareModalStates = setCompareModalStates;
    const finalSetSelectedCompareModalId = setSelectedCompareModalId;
    const finalSetSelectedCompareModalIds = setSelectedCompareModalIds;

    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

    // Track Shift key locally for robust multi-selection
    const [isShiftPressed, setIsShiftPressed] = React.useState(false);

    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <>
            {contextMenu && (
                <PluginContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onDuplicate={() => {
                        const modalState = finalCompareModalStates.find((m: CompareModalState) => m.id === contextMenu.modalId);
                        if (modalState) {
                            const duplicated = {
                                ...modalState,
                                id: `compare-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                x: modalState.x + 50,
                                y: modalState.y + 50,
                            };
                            finalSetCompareModalStates((prev: CompareModalState[]) => {
                                const prevArr = typeof prev === 'function' ? (prev as any)(finalCompareModalStates) : prev;
                                return [...(prevArr || []), duplicated];
                            });
                            if (onPersistCompareModalCreate) {
                                Promise.resolve(onPersistCompareModalCreate(duplicated)).catch(console.error);
                            }
                        }
                    }}
                    onDelete={() => {
                        if (onPersistCompareModalDelete) {
                            const modalId = contextMenu.modalId;
                            finalSetSelectedCompareModalId(null);
                            finalSetSelectedCompareModalIds([]);
                            const result = onPersistCompareModalDelete(modalId);
                            if (result && typeof result.then === 'function') {
                                Promise.resolve(result).catch(console.error);
                            }
                        }
                    }}
                />
            )}
            {(finalCompareModalStates || []).map((modalState) => (
                <ComparePluginModal
                    key={modalState.id}
                    id={modalState.id}
                    x={modalState.x}
                    y={modalState.y}
                    width={modalState.width}
                    height={modalState.height}
                    isOpen={true}
                    isExpanded={modalState.isExpanded}
                    isSelected={finalSelectedCompareModalId === modalState.id || (finalSelectedCompareModalIds || []).includes(modalState.id)}
                    stageRef={stageRef}
                    scale={scale}
                    position={position}
                    isAttachedToChat={isChatOpen && (finalSelectedCompareModalId === modalState.id || (finalSelectedCompareModalIds || []).includes(modalState.id))}
                    selectionOrder={
                        isChatOpen
                            ? (() => {
                                if (selectedIds && selectedIds.includes(modalState.id)) {
                                    return selectedIds.indexOf(modalState.id) + 1;
                                }
                                if (finalSelectedCompareModalIds && finalSelectedCompareModalIds.includes(modalState.id)) {
                                    return finalSelectedCompareModalIds.indexOf(modalState.id) + 1;
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
                        finalSetCompareModalStates((prev: CompareModalState[]) => {
                            const prevArr = typeof prev === 'function' ? (prev as any)(finalCompareModalStates) : prev;
                            return (prevArr || []).filter((m: CompareModalState) => m.id !== modalState.id);
                        });
                        if (onPersistCompareModalDelete) {
                            onPersistCompareModalDelete(modalState.id);
                        }
                    }}
                    onSelect={() => {
                        if (isShiftPressed) {
                            const isAlreadySelected = (finalSelectedCompareModalIds || []).includes(modalState.id);
                            if (isAlreadySelected) {
                                finalSetSelectedCompareModalIds((finalSelectedCompareModalIds || []).filter(id => id !== modalState.id));
                            } else {
                                finalSetSelectedCompareModalIds([...(finalSelectedCompareModalIds || []), modalState.id]);
                            }
                            finalSetSelectedCompareModalId(modalState.id);
                        } else {
                            clearAllSelections();
                            finalSetSelectedCompareModalId(modalState.id);
                            finalSetSelectedCompareModalIds([modalState.id]);
                        }
                    }}
                    onDelete={() => {
                        console.log('[CompareModalOverlays] onDelete called', {
                            timestamp: Date.now(),
                            modalId: modalState.id,
                        });
                        // Clear selection immediately
                        finalSetSelectedCompareModalId(null);
                        finalSetSelectedCompareModalIds([]);
                        // Call persist delete - it updates parent state (compareGenerators) which flows down as externalCompareModals
                        // Canvas will sync compareModalStates with externalCompareModals via useEffect
                        if (onPersistCompareModalDelete) {
                            console.log('[CompareModalOverlays] Calling onPersistCompareModalDelete', modalState.id);
                            // Call synchronously - the handler updates parent state immediately
                            const result = onPersistCompareModalDelete(modalState.id);
                            // If it returns a promise, handle it
                            if (result && typeof result.then === 'function') {
                                Promise.resolve(result).catch((err) => {
                                    console.error('[ModalOverlays] Error in onPersistCompareModalDelete', err);
                                });
                            }
                        }
                        // DO NOT update local state here - let parent state flow down through props
                    }}
                    initialPrompt={modalState.prompt}
                    initialModel={modalState.model}
                    onUpdateModalState={(id, updates) => {
                        finalSetCompareModalStates((prev: CompareModalState[]) => {
                            const prevArr = typeof prev === 'function' ? (prev as any)(finalCompareModalStates) : prev;
                            return (prevArr || []).map((m: CompareModalState) => m.id === id ? { ...m, ...updates } : m);
                        });
                        // TODO: Add persistence callback for updates if needed
                    }}
                    onPositionChange={(newX, newY) => {
                        finalSetCompareModalStates((prev: CompareModalState[]) => {
                            const prevArr = typeof prev === 'function' ? (prev as any)(finalCompareModalStates) : prev;
                            return (prevArr || []).map((m: CompareModalState) => m.id === modalState.id ? { ...m, x: newX, y: newY } : m);
                        });
                    }}
                    onPositionCommit={(newX, newY) => {
                        if (onPersistCompareModalMove) {
                            onPersistCompareModalMove(modalState.id, { x: newX, y: newY });
                        }
                    }}
                    projectId={projectId}
                    onPersistImageModalCreate={onPersistImageModalCreate}
                    onUpdateImageModalState={onUpdateImageModalState}
                    onPersistConnectorCreate={onPersistConnectorCreate}
                />
            ))}
        </>
    );
});

CompareModalOverlays.displayName = 'CompareModalOverlays';
