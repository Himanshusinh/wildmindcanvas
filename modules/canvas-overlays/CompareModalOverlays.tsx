import React from 'react';
import { ComparePluginModal } from '@/modules/plugins/ComparePluginModal/ComparePluginModal';
import { CompareModalState } from './types';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';

interface CompareModalOverlaysProps {
    compareModalStates: CompareModalState[];
    selectedCompareModalId: string | null;
    selectedCompareModalIds: string[];
    clearAllSelections: () => void;
    setCompareModalStates: React.Dispatch<React.SetStateAction<CompareModalState[]>>;
    setSelectedCompareModalId: (id: string | null) => void;
    setSelectedCompareModalIds: (ids: string[]) => void;
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

export const CompareModalOverlays: React.FC<CompareModalOverlaysProps> = ({
    compareModalStates,
    selectedCompareModalId,
    selectedCompareModalIds,
    clearAllSelections,
    setCompareModalStates,
    setSelectedCompareModalId,
    setSelectedCompareModalIds,
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
    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

    return (
        <>
            {contextMenu && (
                <PluginContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onDuplicate={() => {
                        const modalState = compareModalStates.find(m => m.id === contextMenu.modalId);
                        if (modalState) {
                            const duplicated = {
                                ...modalState,
                                id: `compare-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                x: modalState.x + 50,
                                y: modalState.y + 50,
                            };
                            setCompareModalStates(prev => [...prev, duplicated]);
                            if (onPersistCompareModalCreate) {
                                Promise.resolve(onPersistCompareModalCreate(duplicated)).catch(console.error);
                            }
                        }
                    }}
                    onDelete={() => {
                        if (onPersistCompareModalDelete) {
                            const modalId = contextMenu.modalId;
                            setSelectedCompareModalId(null);
                            setSelectedCompareModalIds([]);
                            const result = onPersistCompareModalDelete(modalId);
                            if (result && typeof result.then === 'function') {
                                Promise.resolve(result).catch(console.error);
                            }
                        }
                    }}
                />
            )}
            {compareModalStates.map((modalState) => (
                <ComparePluginModal
                    key={modalState.id}
                    id={modalState.id}
                    x={modalState.x}
                    y={modalState.y}
                    width={modalState.width}
                    height={modalState.height}
                    isOpen={true}
                    isExpanded={modalState.isExpanded}
                    isSelected={selectedCompareModalId === modalState.id || selectedCompareModalIds.includes(modalState.id)}
                    stageRef={stageRef}
                    scale={scale}
                    position={position}
                    isAttachedToChat={isChatOpen && (selectedCompareModalId === modalState.id || selectedCompareModalIds.includes(modalState.id))}
                    selectionOrder={
                      isChatOpen
                        ? (() => {
                            if (selectedIds && selectedIds.includes(modalState.id)) {
                              return selectedIds.indexOf(modalState.id) + 1;
                            }
                            if (selectedCompareModalIds && selectedCompareModalIds.includes(modalState.id)) {
                              return selectedCompareModalIds.indexOf(modalState.id) + 1;
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
                        setCompareModalStates(prev => prev.filter(m => m.id !== modalState.id));
                        if (onPersistCompareModalDelete) {
                            onPersistCompareModalDelete(modalState.id);
                        }
                    }}
                    onSelect={() => {
                        clearAllSelections();
                        setSelectedCompareModalId(modalState.id);
                        setSelectedCompareModalIds([modalState.id]);
                    }}
                    onDelete={() => {
                        console.log('[CompareModalOverlays] onDelete called', {
                            timestamp: Date.now(),
                            modalId: modalState.id,
                        });
                        // Clear selection immediately
                        setSelectedCompareModalId(null);
                        setSelectedCompareModalIds([]);
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
                        setCompareModalStates(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
                        // TODO: Add persistence callback for updates if needed
                    }}
                    onPositionChange={(newX, newY) => {
                        setCompareModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m));
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
};
