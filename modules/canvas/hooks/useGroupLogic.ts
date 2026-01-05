
import { useCallback } from 'react';
import { CanvasProps, CanvasItemsData } from '../types';
import { useCanvasState } from './useCanvasState';
import { useCanvasSelection } from './useCanvasSelection';
import { calculateGroupBounds } from '../utils/groupUtils';
import { GroupContainerState } from '@/core/types/groupContainer';

export function useGroupLogic(
    canvasState: ReturnType<typeof useCanvasState>,
    canvasSelection: ReturnType<typeof useCanvasSelection>,
    props: CanvasProps
) {
    const {
        images,
        imageModalStates,
        videoModalStates,
        textInputStates,
        storyboardModalStates,
        scriptFrameModalStates,
        sceneFrameModalStates,
        musicModalStates,
        upscaleModalStates,
        removeBgModalStates,
        eraseModalStates,
        expandModalStates,
        vectorizeModalStates,
        groupContainerStates = [],
        setGroupContainerStates,
        setImageModalStates,
        setVideoModalStates,
        setTextInputStates,
        setStoryboardModalStates,
        setScriptFrameModalStates,
        setSceneFrameModalStates,
        setMusicModalStates,
        setUpscaleModalStates,
        setRemoveBgModalStates,
        setEraseModalStates,
        setExpandModalStates,
        setVectorizeModalStates,
        setMultiangleCameraModalStates,
        setNextSceneModalStates,
        setVideoEditorModalStates,
        setCompareModalStates,
        multiangleCameraModalStates,
        compareModalStates,
        nextSceneModalStates,
        videoEditorModalStates,
        effectiveCanvasTextStates,
    } = canvasState;

    const {
        selectedImageIndices,
        selectedImageModalIds,
        selectedVideoModalIds,
        selectedTextInputIds,
        selectedStoryboardModalIds,
        selectedScriptFrameModalIds,
        selectedSceneFrameModalIds,
        selectedMusicModalIds,
        selectedUpscaleModalIds,
        selectedRemoveBgModalIds,
        selectedEraseModalIds,
        selectedExpandModalIds,
        selectedVectorizeModalIds,
        selectionTightRect,
        clearAllSelections,
        effectiveSelectedCanvasTextIds: selectedCanvasTextIds,
        selectedMultiangleCameraModalIds,
        selectedCompareModalIds,
        selectedNextSceneModalIds,
        selectedVideoEditorModalIds,
        setSelectedGroupIds,
        setSelectionTightRect,
    } = canvasSelection;

    const {
        onPersistGroupCreate,
        onPersistGroupDelete,
        onPersistGroupUpdate,
        onImageUpdate,
        onPersistImageModalMove,
        onPersistVideoModalMove,
        onPersistTextModalMove,
        onPersistMusicModalMove,
        onPersistUpscaleModalMove,
        onPersistMultiangleCameraModalMove,
        onPersistRemoveBgModalMove,
        onPersistEraseModalMove,
        onPersistExpandModalMove,
        onPersistVectorizeModalMove,
        onPersistNextSceneModalMove,
        onPersistStoryboardModalMove,
        onPersistScriptFrameModalMove,
        onPersistSceneFrameModalMove,
        onPersistVideoEditorModalMove,
        onPersistCompareModalMove
    } = props;

    // We need current canvas data for bounds calculation
    const currentCanvasData: CanvasItemsData = {
        ...canvasState
    } as any;

    const handleCreateGroup = useCallback(() => {
        console.log('[Canvas] Creating group from selected items');
        // Collect all selected item IDs
        const allSelectedIds = [
            ...selectedImageIndices.map(idx => images?.[idx]?.elementId).filter(Boolean),
            ...selectedImageModalIds,
            ...selectedVideoModalIds,
            ...selectedTextInputIds,
            ...selectedStoryboardModalIds,
            ...selectedScriptFrameModalIds,
            ...selectedSceneFrameModalIds,
            ...selectedMusicModalIds,
            ...selectedUpscaleModalIds,
            ...selectedRemoveBgModalIds,
            ...selectedEraseModalIds,
            ...selectedExpandModalIds,
            ...selectedVectorizeModalIds,
            ...selectedVideoEditorModalIds,
            ...selectedMultiangleCameraModalIds,
            ...selectedCompareModalIds,
            ...selectedNextSceneModalIds,
            ...(selectedCanvasTextIds || []),
        ] as string[];

        console.log('[Canvas] Creating group with', allSelectedIds.length, 'items:', allSelectedIds);

        if (allSelectedIds.length < 2) {
            alert('Please select at least 2 items to create a group');
            return;
        }

        // Calculate bounds
        let bounds = null as null | { x: number; y: number; width: number; height: number };
        if (selectionTightRect) {
            const pad = 20;
            bounds = {
                x: selectionTightRect.x - pad,
                y: selectionTightRect.y - pad,
                width: selectionTightRect.width + pad * 2,
                height: selectionTightRect.height + pad * 2,
            };
        } else {
            bounds = calculateGroupBounds(allSelectedIds, currentCanvasData);
        }

        if (!bounds) {
            alert('Could not calculate bounds for selected items');
            return;
        }

        // Create group container
        const newGroup: GroupContainerState = {
            id: `group-${Date.now()}`,
            type: 'group',
            children: [],
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            padding: 20,
            meta: {
                name: 'New Group',
                createdAt: Date.now(),
            }
        };

        // Populate children with relative coordinates
        // Images
        selectedImageIndices.forEach(idx => {
            const img = images?.[idx];
            if (img && img.elementId) {
                newGroup.children.push({
                    id: img.elementId,
                    type: 'image',
                    relativeTransform: {
                        x: (img.x || 0) - bounds!.x,
                        y: (img.y || 0) - bounds!.y,
                        scaleX: 1,
                        scaleY: 1,
                        rotation: 0
                    }
                });
            }
        });

        // Helper to add modal children
        const addModalChildren = (ids: string[], states: any[], type: string) => {
            ids.forEach(id => {
                const state = states.find(s => s.id === id);
                if (state) {
                    newGroup.children.push({
                        id: state.id,
                        type: type,
                        relativeTransform: {
                            x: state.x - bounds!.x,
                            y: state.y - bounds!.y,
                            scaleX: 1,
                            scaleY: 1,
                            rotation: 0
                        }
                    });
                }
            });
        };

        addModalChildren(selectedImageModalIds, imageModalStates, 'image-modal');
        addModalChildren(selectedVideoModalIds, videoModalStates, 'video-modal');
        addModalChildren(selectedTextInputIds, textInputStates, 'text-input');
        addModalChildren(selectedStoryboardModalIds, storyboardModalStates, 'storyboard');
        addModalChildren(selectedScriptFrameModalIds, scriptFrameModalStates, 'script-frame');
        addModalChildren(selectedSceneFrameModalIds, sceneFrameModalStates, 'scene-frame');
        addModalChildren(selectedMusicModalIds, musicModalStates, 'music-modal');
        addModalChildren(selectedUpscaleModalIds, upscaleModalStates, 'upscale');
        addModalChildren(selectedRemoveBgModalIds, removeBgModalStates, 'removebg');
        addModalChildren(selectedEraseModalIds, eraseModalStates, 'erase');
        addModalChildren(selectedExpandModalIds, expandModalStates, 'expand');
        addModalChildren(selectedVectorizeModalIds, vectorizeModalStates, 'vectorize');
        addModalChildren(selectedVideoEditorModalIds, videoEditorModalStates, 'video-editor-modal');
        addModalChildren(selectedMultiangleCameraModalIds, multiangleCameraModalStates, 'multiangle-camera');
        addModalChildren(selectedCompareModalIds, compareModalStates, 'compare-modal');
        addModalChildren(selectedNextSceneModalIds, nextSceneModalStates, 'next-scene');

        // Canvas Text
        if (selectedCanvasTextIds) {
            selectedCanvasTextIds.forEach(id => {
                const state = effectiveCanvasTextStates.find(s => s.id === id);
                if (state) {
                    newGroup.children.push({
                        id: state.id,
                        type: 'canvas-text',
                        relativeTransform: {
                            x: state.x - bounds!.x,
                            y: state.y - bounds!.y,
                            scaleX: 1,
                            scaleY: 1,
                            rotation: 0
                        }
                    });
                }
            });
        }

        console.log('[Canvas] ✅ Group created:', newGroup);

        setGroupContainerStates(prev => [...prev, newGroup]);
        clearAllSelections(true);

        // Select the new group (but don't set selectionTightRect - the group itself shows the boundary)
        setSelectedGroupIds([newGroup.id]);

        if (onPersistGroupCreate) {
            Promise.resolve(onPersistGroupCreate(newGroup)).catch((e) => console.warn('[Canvas] Failed to persist group create', e));
        }
    }, [
        images, imageModalStates, videoModalStates, textInputStates, storyboardModalStates, scriptFrameModalStates,
        sceneFrameModalStates, musicModalStates, upscaleModalStates, removeBgModalStates, eraseModalStates,
        expandModalStates, vectorizeModalStates, videoEditorModalStates, multiangleCameraModalStates,
        compareModalStates, nextSceneModalStates, effectiveCanvasTextStates,
        selectedImageIndices, selectedImageModalIds, selectedVideoModalIds,
        selectedTextInputIds, selectedStoryboardModalIds, selectedScriptFrameModalIds, selectedSceneFrameModalIds,
        selectedMusicModalIds, selectedUpscaleModalIds, selectedRemoveBgModalIds, selectedEraseModalIds,
        selectedExpandModalIds, selectedVectorizeModalIds, selectedVideoEditorModalIds,
        selectedMultiangleCameraModalIds, selectedCompareModalIds, selectedNextSceneModalIds, selectedCanvasTextIds,
        selectionTightRect, currentCanvasData,
        setGroupContainerStates, clearAllSelections, onPersistGroupCreate,
        setSelectedGroupIds, setSelectionTightRect
    ]);

    const handleUngroup = useCallback((selectedGroupIds: string[]) => {
        console.log('[Canvas] Ungrouping selected groups');
        if (selectedGroupIds.length === 0) return;

        // Capture groups to delete for persistence
        const groupsToDelete = groupContainerStates.filter(g => selectedGroupIds.includes(g.id));

        // Update all children positions to their current absolute location
        groupsToDelete.forEach(group => {
            group.children.forEach(child => {
                const absX = group.x + child.relativeTransform.x;
                const absY = group.y + child.relativeTransform.y;

                switch (child.type) {
                    case 'image':
                        if (onImageUpdate) {
                            const idx = images?.findIndex(img => (img as any).elementId === child.id) ?? -1;
                            if (idx !== -1) {
                                onImageUpdate(idx, { x: absX, y: absY });
                            }
                        } else if (onPersistImageModalMove) {
                            // Fallback if onImageUpdate is not available, though images are usually regular ImageUpload
                            onPersistImageModalMove(child.id, { x: absX, y: absY });
                        }
                        break;
                    case 'image-modal':
                        setImageModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistImageModalMove) onPersistImageModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'video-modal':
                        setVideoModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistVideoModalMove) onPersistVideoModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'text-input':
                        setTextInputStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistTextModalMove) onPersistTextModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'music-modal':
                        setMusicModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistMusicModalMove) onPersistMusicModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'upscale':
                        setUpscaleModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistUpscaleModalMove) onPersistUpscaleModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'multiangle-camera':
                        setMultiangleCameraModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistMultiangleCameraModalMove) onPersistMultiangleCameraModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'removebg':
                        setRemoveBgModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistRemoveBgModalMove) onPersistRemoveBgModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'erase':
                        setEraseModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistEraseModalMove) onPersistEraseModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'expand':
                        setExpandModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistExpandModalMove) onPersistExpandModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'vectorize':
                        setVectorizeModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistVectorizeModalMove) onPersistVectorizeModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'next-scene':
                        setNextSceneModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistNextSceneModalMove) onPersistNextSceneModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'storyboard':
                        setStoryboardModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistStoryboardModalMove) onPersistStoryboardModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'script-frame':
                        setScriptFrameModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistScriptFrameModalMove) onPersistScriptFrameModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'scene-frame':
                        setSceneFrameModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistSceneFrameModalMove) onPersistSceneFrameModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'video-editor-modal':
                        setVideoEditorModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistVideoEditorModalMove) onPersistVideoEditorModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'compare-modal':
                        setCompareModalStates(prev => prev.map(s => s.id === child.id ? { ...s, x: absX, y: absY } : s));
                        if (onPersistCompareModalMove) onPersistCompareModalMove(child.id, { x: absX, y: absY });
                        break;
                    case 'canvas-text':
                        if ((props as any).onPersistCanvasTextMove) {
                            (props as any).onPersistCanvasTextMove(child.id, { x: absX, y: absY });
                        }
                        break;
                }
            });

            if (onPersistGroupDelete) {
                onPersistGroupDelete(group);
            }
        });

        setGroupContainerStates(prev => prev.filter(g => !selectedGroupIds.includes(g.id)));
        clearAllSelections(true);

    }, [
        groupContainerStates, images, setGroupContainerStates, clearAllSelections,
        setImageModalStates, setVideoModalStates, setTextInputStates, setMusicModalStates,
        setUpscaleModalStates, setMultiangleCameraModalStates, setRemoveBgModalStates,
        setEraseModalStates, setExpandModalStates, setVectorizeModalStates, setNextSceneModalStates,
        setStoryboardModalStates, setScriptFrameModalStates, setSceneFrameModalStates,
        setVideoEditorModalStates, setCompareModalStates,
        onImageUpdate, onPersistImageModalMove, onPersistVideoModalMove, onPersistTextModalMove,
        onPersistMusicModalMove, onPersistUpscaleModalMove, onPersistMultiangleCameraModalMove,
        onPersistRemoveBgModalMove, onPersistEraseModalMove, onPersistExpandModalMove,
        onPersistVectorizeModalMove, onPersistNextSceneModalMove, onPersistStoryboardModalMove,
        onPersistScriptFrameModalMove, onPersistSceneFrameModalMove, onPersistVideoEditorModalMove,
        onPersistCompareModalMove, onPersistGroupDelete
    ]);


    // Movement Logic
    const moveSelectedItems = (dx: number, dy: number, excludeType?: string, excludeId?: string | number) => {
        // 1. Move Images
        selectedImageIndices.forEach(idx => {
            if (excludeType === 'image' && excludeId === idx) return;
            const img = images?.[idx];
            if (img && props.onImageUpdate) {
                props.onImageUpdate(idx, {
                    x: (img.x || 0) + dx,
                    y: (img.y || 0) + dy
                });
            }
        });

        // 2. Move Canvas Text
        if (selectedCanvasTextIds && selectedCanvasTextIds.length > 0) {
            selectedCanvasTextIds.forEach(id => {
                if (excludeType === 'canvas-text' && excludeId === id) return;
                const m = effectiveCanvasTextStates.find(m => m.id === id);
                if (m && (props as any).onPersistCanvasTextMove) (props as any).onPersistCanvasTextMove(id, { x: m.x + dx, y: m.y + dy });
            });
        }
        // Simplified Logic: The implementation in Canvas.tsx used specific props.
        // We should just expose 'moveSelectedItems' and let it use props provided.
        // But implementing full moveSelectedItems here is huge.

        // Let's implement helper for modals
        const moveModalGroup = (
            selectedIds: string[],
            states: any[],
            moveFn: ((id: string, updates: any) => void) | undefined,
            type: string
        ) => {
            selectedIds.forEach(id => {
                if (excludeType === type && excludeId === id) return;
                const m = states.find(s => s.id === id);
                if (m && moveFn) {
                    moveFn(id, { x: m.x + dx, y: m.y + dy });
                }
            });
        };

        moveModalGroup(selectedImageModalIds, imageModalStates, props.onPersistImageModalMove, 'image-modal');
        moveModalGroup(selectedVideoModalIds, videoModalStates, props.onPersistVideoModalMove, 'video-modal');
        moveModalGroup(selectedMusicModalIds, musicModalStates, props.onPersistMusicModalMove, 'music-modal');
        moveModalGroup(selectedTextInputIds, textInputStates, props.onPersistTextModalMove, 'text-input');
        moveModalGroup(selectedUpscaleModalIds, upscaleModalStates, props.onPersistUpscaleModalMove, 'upscale');
        moveModalGroup(selectedMultiangleCameraModalIds, multiangleCameraModalStates, props.onPersistMultiangleCameraModalMove, 'multiangle-camera');
        moveModalGroup(selectedRemoveBgModalIds, removeBgModalStates, props.onPersistRemoveBgModalMove, 'removebg');
        moveModalGroup(selectedEraseModalIds, eraseModalStates, props.onPersistEraseModalMove, 'erase');
        moveModalGroup(selectedExpandModalIds, expandModalStates, props.onPersistExpandModalMove, 'expand');
        moveModalGroup(selectedVectorizeModalIds, vectorizeModalStates, props.onPersistVectorizeModalMove, 'vectorize');
        moveModalGroup(selectedStoryboardModalIds, storyboardModalStates, props.onPersistStoryboardModalMove, 'storyboard');
        moveModalGroup(selectedScriptFrameModalIds, scriptFrameModalStates, props.onPersistScriptFrameModalMove, 'script-frame');
        moveModalGroup(selectedSceneFrameModalIds, sceneFrameModalStates, props.onPersistSceneFrameModalMove, 'scene-frame');
        moveModalGroup(selectedCompareModalIds, compareModalStates, props.onPersistCompareModalMove, 'compare');
        moveModalGroup(selectedNextSceneModalIds, nextSceneModalStates, props.onPersistNextSceneModalMove, 'next-scene');
        moveModalGroup(selectedVideoEditorModalIds, videoEditorModalStates, props.onPersistVideoEditorModalMove, 'video-editor');
    };

    const createMoveWrapper = (
        type: string,
        selectionIds: string[],
        states: any[],
        originalHandler?: (id: string, updates: any) => void | Promise<void>
    ) => {
        return (id: string, updates: any) => {
            if (originalHandler) originalHandler(id, updates);

            if ((updates.x !== undefined || updates.y !== undefined) && selectionIds.includes(id)) {
                const current = states.find(s => s.id === id);
                if (current) {
                    const newX = updates.x !== undefined ? updates.x : current.x;
                    const newY = updates.y !== undefined ? updates.y : current.y;
                    const dx = newX - current.x;
                    const dy = newY - current.y;

                    if (dx !== 0 || dy !== 0) {
                        moveSelectedItems(dx, dy, type, id);
                    }
                }
            }
        };
    };

    // Wrappers
    const handleImageModalMove = createMoveWrapper('image-modal', selectedImageModalIds, imageModalStates, props.onPersistImageModalMove);
    const handleVideoModalMove = createMoveWrapper('video-modal', selectedVideoModalIds, videoModalStates, props.onPersistVideoModalMove);
    const handleMusicModalMove = createMoveWrapper('music-modal', selectedMusicModalIds, musicModalStates, props.onPersistMusicModalMove);
    const handleTextModalMove = createMoveWrapper('text-input', selectedTextInputIds, textInputStates, props.onPersistTextModalMove);
    const handleUpscaleModalMove = createMoveWrapper('upscale', selectedUpscaleModalIds, upscaleModalStates, props.onPersistUpscaleModalMove);
    const handleMultiangleCameraModalMove = createMoveWrapper('multiangle-camera', selectedMultiangleCameraModalIds, multiangleCameraModalStates, props.onPersistMultiangleCameraModalMove);
    const handleRemoveBgModalMove = createMoveWrapper('removebg', selectedRemoveBgModalIds, removeBgModalStates, props.onPersistRemoveBgModalMove);
    const handleEraseModalMove = createMoveWrapper('erase', selectedEraseModalIds, eraseModalStates, props.onPersistEraseModalMove);
    const handleExpandModalMove = createMoveWrapper('expand', selectedExpandModalIds, expandModalStates, props.onPersistExpandModalMove);
    const handleVectorizeModalMove = createMoveWrapper('vectorize', selectedVectorizeModalIds, vectorizeModalStates, props.onPersistVectorizeModalMove);
    const handleStoryboardModalMove = createMoveWrapper('storyboard', selectedStoryboardModalIds, storyboardModalStates, props.onPersistStoryboardModalMove);
    const handleScriptFrameModalMove = createMoveWrapper('script-frame', selectedScriptFrameModalIds, scriptFrameModalStates, props.onPersistScriptFrameModalMove);
    const handleSceneFrameModalMove = createMoveWrapper('scene-frame', selectedSceneFrameModalIds, sceneFrameModalStates, props.onPersistSceneFrameModalMove);
    const handleCompareModalMove = createMoveWrapper('compare', selectedCompareModalIds, compareModalStates, props.onPersistCompareModalMove);
    const handleNextSceneModalMove = createMoveWrapper('next-scene', selectedNextSceneModalIds, nextSceneModalStates, props.onPersistNextSceneModalMove);
    const handleVideoEditorModalMove = createMoveWrapper('video-editor', selectedVideoEditorModalIds, videoEditorModalStates, props.onPersistVideoEditorModalMove);

    const handleGroupMove = useCallback((id: string, x: number, y: number) => {
        setGroupContainerStates(prev => {
            const group = prev.find(g => g.id === id);
            if (!group) return prev;
            const updates = { x, y };
            // Defer persistence to avoid setState during render
            if (onPersistGroupUpdate) {
                setTimeout(() => {
                    onPersistGroupUpdate(id, updates, group);
                }, 0);
            }
            return prev.map(g => g.id === id ? { ...g, ...updates } : g);
        });
    }, [setGroupContainerStates, onPersistGroupUpdate]);

    const handleGroupDrag = useCallback((id: string, x: number, y: number) => {
        setGroupContainerStates(prev => prev.map(g => g.id === id ? { ...g, x, y } : g));
    }, [setGroupContainerStates]);

    const handleImageUpdateWithGroup = useCallback((index: number, updates: any) => {
        const isMoving = updates.x !== undefined || updates.y !== undefined;
        const isSelected = selectedImageIndices.includes(index);

        if (isMoving && isSelected && images?.[index]) {
            const currentImage = images[index];
            const newX = updates.x !== undefined ? updates.x : currentImage.x || 0;
            const newY = updates.y !== undefined ? updates.y : currentImage.y || 0;
            const dx = newX - (currentImage.x || 0);
            const dy = newY - (currentImage.y || 0);

            if (dx !== 0 || dy !== 0) {
                moveSelectedItems(dx, dy, 'image', index);
            }
        }

        if (props.onImageUpdate) {
            props.onImageUpdate(index, updates);
        }
    }, [selectedImageIndices, images, moveSelectedItems, props.onImageUpdate]);

    // Helper to calculate effective positions for grouped items
    const getEffectiveStates = useCallback(<T extends { id?: string, elementId?: string, x?: number, y?: number }>(states: T[], type: string): T[] => {
        // Create a map of localized overrides
        const overrides = new Map<string, { x: number, y: number }>();
        groupContainerStates.forEach(group => {
            if (group.children) {
                group.children.forEach(child => {
                    if (child.type === type) {
                        overrides.set(child.id, {
                            x: group.x + child.relativeTransform.x,
                            y: group.y + child.relativeTransform.y
                        });
                    }
                });
            }
        });

        if (overrides.size === 0) return states;

        return states.map(state => {
            const id = state.id || state.elementId;
            if (!id) return state;

            const override = overrides.get(id);
            if (override) {
                return { ...state, x: override.x, y: override.y };
            }
            return state;
        });
    }, [groupContainerStates]);

    return {
        handleCreateGroup,
        handleUngroup,
        moveSelectedItems,
        handleImageUpdateWithGroup,
        handleImageModalMove,
        handleVideoModalMove,
        handleMusicModalMove,
        handleTextModalMove,
        handleUpscaleModalMove,
        handleMultiangleCameraModalMove,
        handleRemoveBgModalMove,
        handleEraseModalMove,
        handleExpandModalMove,
        handleVectorizeModalMove,
        handleStoryboardModalMove,
        handleScriptFrameModalMove,
        handleSceneFrameModalMove,
        handleCompareModalMove,
        handleNextSceneModalMove,
        handleVideoEditorModalMove,
        getEffectiveStates,
        handleGroupMove,
        handleGroupDrag
    };
}
