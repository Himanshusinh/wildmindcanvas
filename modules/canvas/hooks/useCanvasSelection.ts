
import { useState, useCallback, useEffect } from 'react';
import { CanvasItemsData, CanvasProps } from '../types';
import { getComponentDimensions } from '../utils/getComponentDimensions';
// Zustand Store - Image & Video State Management
import { useImageStore, useImageSelection, useVideoStore, useVideoSelection, useMusicStore, useMusicSelection, useUpscaleStore, useUpscaleSelection, useMultiangleCameraStore, useMultiangleCameraSelection, useRemoveBgStore, useRemoveBgSelection, useEraseStore, useEraseSelection, useRemoveBgModalStates, useEraseModalStates, useExpandStore, useExpandSelection, useExpandModalStates, useVectorizeStore, useVectorizeSelection, useVectorizeModalStates, useImageEditorStore, useImageEditorSelection, useImageEditorModalStates, useNextSceneStore, useNextSceneSelection, useNextSceneModalStates, useStoryboardStore, useStoryboardSelection, useStoryboardModalStates, useVideoEditorStore, useVideoEditorSelection, useVideoEditorModalStates, useCompareStore, useCompareSelection, useCompareModalStates, useTextStore } from '@/modules/stores';

export function useCanvasSelection(props: CanvasProps, canvasItemsData: CanvasItemsData) {
    const {
        selectedCanvasTextId,
        setSelectedCanvasTextId,
        selectedCanvasTextIds,
        setSelectedCanvasTextIds
    } = props;

    // Local state for canvas text selection (fallback)
    const [localSelectedCanvasTextId, setLocalSelectedCanvasTextId] = useState<string | null>(null);
    const [localSelectedCanvasTextIds, setLocalSelectedCanvasTextIds] = useState<string[]>([]);

    const effectiveSelectedCanvasTextId = selectedCanvasTextId ?? localSelectedCanvasTextId;
    const effectiveSetSelectedCanvasTextId = setSelectedCanvasTextId ?? setLocalSelectedCanvasTextId;
    const effectiveSelectedCanvasTextIds = selectedCanvasTextIds ?? localSelectedCanvasTextIds;
    const effectiveSetSelectedCanvasTextIds = setSelectedCanvasTextIds ?? setLocalSelectedCanvasTextIds;

    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [selectedImageIndices, setSelectedImageIndices] = useState<number[]>([]);

    const [selectedTextInputId, setSelectedTextInputId] = useState<string | null>(null);
    const [selectedTextInputIds, setSelectedTextInputIds] = useState<string[]>([]);

    // Zustand Store - Get image selection state
    const selectedImageModalId = useImageStore(state => state.selectedImageModalId);
    const selectedImageModalIds = useImageStore(state => state.selectedImageModalIds);
    const setSelectedImageModalId = useImageStore(state => state.setSelectedImageModalId);
    const setSelectedImageModalIds = useImageStore(state => state.setSelectedImageModalIds);

    // Zustand Store - Get video selection state
    const selectedVideoModalId = useVideoStore(state => state.selectedVideoModalId);
    const selectedVideoModalIds = useVideoStore(state => state.selectedVideoModalIds);
    const setSelectedVideoModalId = useVideoStore(state => state.setSelectedVideoModalId);
    const setSelectedVideoModalIds = useVideoStore(state => state.setSelectedVideoModalIds);

    // Zustand Store - Get video editor selection state
    const clearVideoEditorSelection = useVideoEditorStore(state => state.clearVideoEditorSelection);
    const selectedVideoEditorModalId = useVideoEditorStore(state => state.selectedId);
    const selectedVideoEditorModalIds = useVideoEditorStore(state => state.selectedIds);
    const setSelectedVideoEditorModalId = useVideoEditorStore(state => state.setSelectedId);
    const setSelectedVideoEditorModalIds = useVideoEditorStore(state => state.setSelectedIds);

    // Zustand Store - Get image editor selection state
    const clearImageEditorSelection = useImageEditorStore(state => state.clearImageEditorSelection);
    const selectedImageEditorModalId = useImageEditorStore(state => state.selectedImageEditorModalId);
    const selectedImageEditorModalIds = useImageEditorStore(state => state.selectedImageEditorModalIds);
    const setSelectedImageEditorModalId = useImageEditorStore(state => state.setSelectedImageEditorModalId);
    const setSelectedImageEditorModalIds = useImageEditorStore(state => state.setSelectedImageEditorModalIds);



    // Zustand Store - Get music selection state
    const selectedMusicModalId = useMusicStore(state => state.selectedMusicModalId);
    const selectedMusicModalIds = useMusicStore(state => state.selectedMusicModalIds);
    const setSelectedMusicModalId = useMusicStore(state => state.setSelectedMusicModalId);
    const setSelectedMusicModalIds = useMusicStore(state => state.setSelectedMusicModalIds);

    // Zustand Store - Get upscale selection state
    const clearUpscaleSelection = useUpscaleStore(state => state.clearUpscaleSelection);
    const selectedUpscaleModalId = useUpscaleStore(state => state.selectedUpscaleModalId);
    const selectedUpscaleModalIds = useUpscaleStore(state => state.selectedUpscaleModalIds);
    const setSelectedUpscaleModalId = useUpscaleStore(state => state.setSelectedUpscaleModalId);
    const setSelectedUpscaleModalIds = useUpscaleStore(state => state.setSelectedUpscaleModalIds);

    // Zustand Store - Get multiangle camera selection state
    const clearMultiangleCameraSelection = useMultiangleCameraStore(state => state.clearMultiangleCameraSelection);
    const selectedMultiangleCameraModalId = useMultiangleCameraStore(state => state.selectedMultiangleCameraModalId);
    const selectedMultiangleCameraModalIds = useMultiangleCameraStore(state => state.selectedMultiangleCameraModalIds);
    const setSelectedMultiangleCameraModalId = useMultiangleCameraStore(state => state.setSelectedMultiangleCameraModalId);
    const setSelectedMultiangleCameraModalIds = useMultiangleCameraStore(state => state.setSelectedMultiangleCameraModalIds);



    // Zustand Store - Get remove bg selection state
    const clearRemoveBgSelection = useRemoveBgStore(state => state.clearRemoveBgSelection);
    const selectedRemoveBgModalId = useRemoveBgStore(state => state.selectedRemoveBgModalId);
    const selectedRemoveBgModalIds = useRemoveBgStore(state => state.selectedRemoveBgModalIds);
    const setSelectedRemoveBgModalId = useRemoveBgStore(state => state.setSelectedRemoveBgModalId);
    const setSelectedRemoveBgModalIds = useRemoveBgStore(state => state.setSelectedRemoveBgModalIds);

    // Zustand Store - Get erase selection state
    const clearEraseSelection = useEraseStore(state => state.clearEraseSelection);
    const selectedEraseModalId = useEraseStore(state => state.selectedEraseModalId);
    const selectedEraseModalIds = useEraseStore(state => state.selectedEraseModalIds);
    const setSelectedEraseModalId = useEraseStore(state => state.setSelectedEraseModalId);
    const setSelectedEraseModalIds = useEraseStore(state => state.setSelectedEraseModalIds);

    // Zustand Store - Get expand selection state
    const clearExpandSelection = useExpandStore(state => state.clearExpandSelection);
    const selectedExpandModalId = useExpandStore(state => state.selectedExpandModalId);
    const selectedExpandModalIds = useExpandStore(state => state.selectedExpandModalIds);
    const setSelectedExpandModalId = useExpandStore(state => state.setSelectedExpandModalId);
    const setSelectedExpandModalIds = useExpandStore(state => state.setSelectedExpandModalIds);

    // Zustand Store - Get vectorize selection state
    const clearVectorizeSelection = useVectorizeStore(state => state.clearVectorizeSelection);
    const selectedVectorizeModalId = useVectorizeStore(state => state.selectedVectorizeModalId);
    const selectedVectorizeModalIds = useVectorizeStore(state => state.selectedVectorizeModalIds);
    const setSelectedVectorizeModalId = useVectorizeStore(state => state.setSelectedVectorizeModalId);
    const setSelectedVectorizeModalIds = useVectorizeStore(state => state.setSelectedVectorizeModalIds);

    // REMOVED: legacy local state
    // const [selectedRemoveBgModalId, setSelectedRemoveBgModalId] = useState<string | null>(null);
    // const [selectedRemoveBgModalIds, setSelectedRemoveBgModalIds] = useState<string[]>([]);
    // REMOVED: legacy local state for Erase
    // const [selectedEraseModalId, setSelectedEraseModalId] = useState<string | null>(null);
    // const [selectedEraseModalIds, setSelectedEraseModalIds] = useState<string[]>([]);

    // REMOVED: legacy local state
    // const [selectedExpandModalId, setSelectedExpandModalId] = useState<string | null>(null);
    // const [selectedExpandModalIds, setSelectedExpandModalIds] = useState<string[]>([]);

    // REMOVED: legacy local state
    // const [selectedVectorizeModalId, setSelectedVectorizeModalId] = useState<string | null>(null);
    // const [selectedVectorizeModalIds, setSelectedVectorizeModalIds] = useState<string[]>([]);

    // Zustand Store - Get next scene selection state
    const clearNextSceneSelection = useNextSceneStore(state => state.clearNextSceneSelection);
    const selectedNextSceneModalId = useNextSceneStore(state => state.selectedNextSceneModalId);
    const selectedNextSceneModalIds = useNextSceneStore(state => state.selectedNextSceneModalIds);
    const setSelectedNextSceneModalId = useNextSceneStore(state => state.setSelectedNextSceneModalId);
    const setSelectedNextSceneModalIds = useNextSceneStore(state => state.setSelectedNextSceneModalIds);

    // Zustand Store - Get compare selection state
    const clearCompareSelection = useCompareStore(state => state.clearCompareSelection);
    const selectedCompareModalId = useCompareStore(state => state.selectedId);
    const selectedCompareModalIds = useCompareStore(state => state.selectedIds);
    const setSelectedCompareModalId = useCompareStore(state => state.setSelectedId);
    const setSelectedCompareModalIds = useCompareStore(state => state.setSelectedIds);

    // Zustand Store - Get storyboard selection state
    const clearStoryboardSelection = useStoryboardStore(state => state.clearStoryboardSelection);
    const selectedStoryboardModalId = useStoryboardStore(state => state.selectedStoryboardModalId);
    const selectedStoryboardModalIds = useStoryboardStore(state => state.selectedStoryboardModalIds);
    const setSelectedStoryboardModalId = useStoryboardStore(state => state.setSelectedStoryboardModalId);
    const setSelectedStoryboardModalIds = useStoryboardStore(state => state.setSelectedStoryboardModalIds);

    // Zustand Store - Get text selection state
    const clearTextSelection = useTextStore(state => state.clearTextSelection);
    const selectedTextModalId = useTextStore(state => state.selectedTextModalId);
    const selectedTextModalIds = useTextStore(state => state.selectedTextModalIds);
    const setSelectedTextModalId = useTextStore(state => state.setSelectedTextModalId);
    const setSelectedTextModalIds = useTextStore(state => state.setSelectedTextModalIds);


    const [selectedScriptFrameModalId, setSelectedScriptFrameModalId] = useState<string | null>(null);
    const [selectedScriptFrameModalIds, setSelectedScriptFrameModalIds] = useState<string[]>([]);

    const [selectedSceneFrameModalId, setSelectedSceneFrameModalId] = useState<string | null>(null);
    const [selectedSceneFrameModalIds, setSelectedSceneFrameModalIds] = useState<string[]>([]);

    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

    // Selection order tracking - maintains the order items were actually selected
    const [selectionOrder, setSelectionOrder] = useState<string[]>([]);

    // Rich Text Selection (with fallback)
    const [localSelectedRichTextId, setLocalSelectedRichTextId] = useState<string | null>(null);
    const [localSelectedRichTextIds, setLocalSelectedRichTextIds] = useState<string[]>([]);

    const effectiveSelectedRichTextId = props.selectedRichTextId !== undefined ? props.selectedRichTextId : localSelectedRichTextId;
    const effectiveSetSelectedRichTextId = props.setSelectedRichTextId ?? setLocalSelectedRichTextId;
    const effectiveSelectedRichTextIds = props.selectedRichTextIds !== undefined ? props.selectedRichTextIds : localSelectedRichTextIds;
    const effectiveSetSelectedRichTextIds = props.setSelectedRichTextIds ?? setLocalSelectedRichTextIds;

    // Sync and deduplicate selectionOrder when selections change
    useEffect(() => {
        // Collect all currently selected IDs
        const allSelectedIds = new Set([
            ...selectedImageModalIds,
            ...selectedVideoModalIds,
            ...selectedVideoEditorModalIds,
            ...selectedImageEditorModalIds,
            ...selectedMusicModalIds,
            ...selectedUpscaleModalIds,
            ...selectedMultiangleCameraModalIds,
            ...selectedRemoveBgModalIds,
            ...selectedEraseModalIds,
            ...selectedExpandModalIds,
            ...selectedVectorizeModalIds,
            ...selectedNextSceneModalIds,
            ...selectedStoryboardModalIds,
            ...selectedScriptFrameModalIds,
            ...selectedSceneFrameModalIds,
            ...selectedGroupIds,
            ...effectiveSelectedCanvasTextIds,
            ...effectiveSelectedRichTextIds
        ]);

        // Clean up selectionOrder: remove items that are no longer selected, and remove duplicates
        setSelectionOrder(prev => {
            const seen = new Set<string>();
            const cleaned = prev
                .filter(id => allSelectedIds.has(id)) // Remove deselected items
                .filter(id => {
                    if (seen.has(id)) return false; // Remove duplicates
                    seen.add(id);
                    return true;
                });

            // Only update if cleaned order is different
            if (cleaned.length !== prev.length || cleaned.some((id, idx) => id !== prev[idx])) {
                return cleaned;
            }
            return prev;
        });
    }, [
        selectedImageModalIds,
        selectedVideoModalIds,
        selectedVideoEditorModalIds,
        selectedImageEditorModalIds,
        selectedMusicModalIds,
        selectedUpscaleModalIds,
        selectedMultiangleCameraModalIds,
        selectedRemoveBgModalIds,
        selectedEraseModalIds,
        selectedExpandModalIds,
        selectedVectorizeModalIds,
        selectedNextSceneModalIds,
        selectedStoryboardModalIds,
        selectedScriptFrameModalIds,
        selectedSceneFrameModalIds,
        selectedGroupIds,
        effectiveSelectedCanvasTextIds,
        effectiveSelectedRichTextIds
    ]);

    // Selection Box State
    const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
    const [selectionTightRect, setSelectionTightRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [selectionTransformerRect, setSelectionTransformerRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [isDragSelection, setIsDragSelection] = useState(false);

    // Context Menu State (often tied to selection)
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [contextMenuImageIndex, setContextMenuImageIndex] = useState<number | null>(null);
    const [contextMenuModalId, setContextMenuModalId] = useState<string | null>(null);
    const [contextMenuModalType, setContextMenuModalType] = useState<string | null>(null);


    const clearAllSelections = useCallback((clearSelectionBoxes: boolean = false) => {
        setSelectedImageIndex(null);
        setSelectedImageIndices([]);
        setSelectedImageIndex(null);
        setSelectedImageIndices([]);
        // Clear text selection (using Zustand store)
        setSelectedTextModalId(null);
        setSelectedTextModalIds([]);
        // Use Zustand store for image selection
        setSelectedImageModalId(null);
        setSelectedImageModalIds([]);
        // Clear video selection (using Zustand store)
        setSelectedVideoModalId(null);
        setSelectedVideoModalIds([]);
        setSelectedVideoEditorModalId(null);
        setSelectedVideoEditorModalIds([]);
        setSelectedImageEditorModalId(null);
        setSelectedImageEditorModalIds([]);
        setSelectedMusicModalId(null);
        setSelectedMusicModalIds([]);
        // Clear upscale selection (using Zustand store)
        setSelectedUpscaleModalId(null);
        setSelectedUpscaleModalIds([]);
        setSelectedMultiangleCameraModalId(null);
        setSelectedMultiangleCameraModalIds([]);
        setSelectedRemoveBgModalId(null);
        setSelectedRemoveBgModalIds([]);
        setSelectedEraseModalId(null);
        setSelectedEraseModalIds([]);
        setSelectedExpandModalId(null);
        setSelectedExpandModalIds([]);
        setSelectedVectorizeModalId(null);
        setSelectedVectorizeModalIds([]);
        setSelectedNextSceneModalId(null);
        setSelectedNextSceneModalIds([]);
        setSelectedCompareModalId(null);
        setSelectedCompareModalIds([]);
        setSelectedStoryboardModalId(null);
        setSelectedStoryboardModalIds([]);
        setSelectedScriptFrameModalId(null);
        setSelectedScriptFrameModalIds([]);
        setSelectedSceneFrameModalId(null);
        setSelectedSceneFrameModalIds([]);
        setSelectedGroupIds([]);
        effectiveSetSelectedRichTextId(null);
        effectiveSetSelectedRichTextIds([]);

        clearStoryboardSelection();
        clearTextSelection();
        setLocalSelectedRichTextId(null);
        setLocalSelectedRichTextIds([]);

        // Clear canvas text selection (legacy - verify if still needed or replaced by textStore)
        effectiveSetSelectedCanvasTextId(null);
        effectiveSetSelectedCanvasTextIds([]);

        // Clear selection order
        setSelectionOrder([]);

        setContextMenuOpen(false);
        setContextMenuImageIndex(null);
        setContextMenuModalId(null);
        setContextMenuModalType(null);

        if (clearSelectionBoxes) {
            setSelectionBox(null);
            setSelectionTightRect(null);
            setSelectionTransformerRect(null);
            setIsDragSelection(false);
        }

        try {
            window.dispatchEvent(new CustomEvent('canvas-clear-selection'));
        } catch (err) {
            // ignore
        }
        clearRemoveBgSelection();
        clearEraseSelection();
        clearExpandSelection();
        clearVectorizeSelection();
        clearImageEditorSelection();
        clearVideoEditorSelection();
        clearCompareSelection();
        clearNextSceneSelection();
        clearStoryboardSelection();
    }, [clearRemoveBgSelection, clearEraseSelection, clearExpandSelection, clearVectorizeSelection, clearImageEditorSelection, clearVideoEditorSelection, clearCompareSelection, clearNextSceneSelection, clearStoryboardSelection, clearTextSelection, effectiveSetSelectedCanvasTextId, effectiveSetSelectedCanvasTextIds, setLocalSelectedRichTextId, setLocalSelectedRichTextIds, setSelectedImageIndex, setSelectedImageIndices, setSelectedTextModalId, setSelectedTextModalIds, setSelectedImageModalId, setSelectedImageModalIds, setSelectedVideoModalId, setSelectedVideoModalIds, setSelectedVideoEditorModalId, setSelectedVideoEditorModalIds, setSelectedImageEditorModalId, setSelectedImageEditorModalIds, setSelectedMusicModalId, setSelectedMusicModalIds, setSelectedUpscaleModalId, setSelectedUpscaleModalIds, setSelectedMultiangleCameraModalId, setSelectedMultiangleCameraModalIds, setSelectedRemoveBgModalId, setSelectedRemoveBgModalIds, setSelectedEraseModalId, setSelectedEraseModalIds, setSelectedExpandModalId, setSelectedExpandModalIds, setSelectedVectorizeModalId, setSelectedVectorizeModalIds, setSelectedNextSceneModalId, setSelectedNextSceneModalIds, setSelectedCompareModalId, setSelectedCompareModalIds, setSelectedStoryboardModalId, setSelectedStoryboardModalIds, setSelectedScriptFrameModalId, setSelectedScriptFrameModalIds, setSelectedSceneFrameModalId, setSelectedSceneFrameModalIds, setSelectedGroupIds, effectiveSetSelectedRichTextId, effectiveSetSelectedRichTextIds]);

    const removeBgModalStates = useRemoveBgModalStates();
    const eraseModalStates = useEraseModalStates();
    const expandModalStates = useExpandModalStates();
    const vectorizeModalStates = useVectorizeModalStates();
    const imageEditorModalStates = useImageEditorModalStates();
    const videoEditorModalStates = useVideoEditorModalStates();
    const compareModalStates = useCompareModalStates();
    const nextSceneModalStates = useNextSceneModalStates();
    const storyboardModalStates = useStoryboardModalStates();

    const getDimensions = useCallback((type: string, id: string | number) => {
        return getComponentDimensions(type, id, canvasItemsData, { removeBgModalStates, eraseModalStates, expandModalStates, vectorizeModalStates, imageEditorModalStates, videoEditorModalStates, compareModalStates, nextSceneModalStates, storyboardModalStates });
    }, [canvasItemsData, removeBgModalStates, eraseModalStates, expandModalStates, vectorizeModalStates, imageEditorModalStates, videoEditorModalStates, compareModalStates, nextSceneModalStates, storyboardModalStates]);

    return {
        // States & Setters
        selectedImageIndex, setSelectedImageIndex,
        selectedImageIndices, setSelectedImageIndices,
        selectedTextInputId: selectedTextModalId, // Alias for compatibility if needed, or remove if safe
        setSelectedTextInputId: setSelectedTextModalId,
        selectedTextInputIds: selectedTextModalIds,
        setSelectedTextInputIds: setSelectedTextModalIds,
        selectedImageModalId, setSelectedImageModalId,
        selectedImageModalIds, setSelectedImageModalIds,
        selectedVideoModalId, setSelectedVideoModalId,
        selectedVideoModalIds, setSelectedVideoModalIds,
        selectedVideoEditorModalId, setSelectedVideoEditorModalId,
        selectedVideoEditorModalIds, setSelectedVideoEditorModalIds,
        selectedImageEditorModalId, setSelectedImageEditorModalId,
        selectedImageEditorModalIds, setSelectedImageEditorModalIds,
        selectedMusicModalId, setSelectedMusicModalId,
        selectedMusicModalIds, setSelectedMusicModalIds,
        selectedUpscaleModalId, setSelectedUpscaleModalId,
        selectedUpscaleModalIds, setSelectedUpscaleModalIds,
        selectedMultiangleCameraModalId, setSelectedMultiangleCameraModalId,
        selectedMultiangleCameraModalIds, setSelectedMultiangleCameraModalIds,
        selectedRemoveBgModalId, setSelectedRemoveBgModalId,
        selectedRemoveBgModalIds, setSelectedRemoveBgModalIds,
        selectedEraseModalId, setSelectedEraseModalId,
        selectedEraseModalIds, setSelectedEraseModalIds,
        selectedExpandModalId, setSelectedExpandModalId,
        selectedExpandModalIds, setSelectedExpandModalIds,
        selectedVectorizeModalId, setSelectedVectorizeModalId,
        selectedVectorizeModalIds, setSelectedVectorizeModalIds,
        selectedNextSceneModalId, setSelectedNextSceneModalId,
        selectedNextSceneModalIds, setSelectedNextSceneModalIds,
        selectedCompareModalId, setSelectedCompareModalId,
        selectedCompareModalIds, setSelectedCompareModalIds,
        selectedStoryboardModalId, setSelectedStoryboardModalId,
        selectedStoryboardModalIds, setSelectedStoryboardModalIds,
        selectedScriptFrameModalId, setSelectedScriptFrameModalId,
        selectedScriptFrameModalIds, setSelectedScriptFrameModalIds,
        selectedSceneFrameModalId, setSelectedSceneFrameModalId,
        selectedSceneFrameModalIds, setSelectedSceneFrameModalIds,
        selectedGroupIds, setSelectedGroupIds,

        // Build selectedIds in the order items were actually selected
        // Use selectionOrder if available, otherwise fall back to array concatenation
        selectedIds: (() => {
            // Collect all selected IDs
            const allSelectedIds = new Set([
                ...selectedImageModalIds,
                ...selectedVideoModalIds,
                ...selectedVideoEditorModalIds,
                ...selectedImageEditorModalIds,
                ...selectedMusicModalIds,
                ...selectedUpscaleModalIds,
                ...selectedMultiangleCameraModalIds,
                ...selectedRemoveBgModalIds,
                ...selectedEraseModalIds,
                ...selectedExpandModalIds,
                ...selectedVectorizeModalIds,
                ...selectedNextSceneModalIds,
                ...selectedStoryboardModalIds,
                ...selectedScriptFrameModalIds,
                ...selectedSceneFrameModalIds,
                ...selectedGroupIds,
                ...selectedGroupIds,
                ...effectiveSelectedCanvasTextIds,
                ...selectedTextModalIds, // Add text store IDs
                ...effectiveSelectedRichTextIds
            ]);

            // If we have selection order, use it to maintain the order items were selected
            if (selectionOrder.length > 0) {
                // Remove duplicates from selectionOrder while preserving order
                const seen = new Set<string>();
                const deduplicatedOrder = selectionOrder.filter(id => {
                    if (seen.has(id)) return false;
                    seen.add(id);
                    return true;
                });

                // Filter to only include currently selected items
                const ordered = deduplicatedOrder.filter(id => allSelectedIds.has(id));
                // Add any newly selected items that aren't in the order yet (shouldn't happen, but safety)
                const unordered = Array.from(allSelectedIds).filter(id => !ordered.includes(id));
                return [...ordered, ...unordered];
            }

            // Fallback to array concatenation order if no selection order tracked
            return Array.from(allSelectedIds);
        })(),

        // Effective Canvas Text Selection
        effectiveSelectedCanvasTextId,
        effectiveSetSelectedCanvasTextId,
        effectiveSelectedCanvasTextIds,
        effectiveSetSelectedCanvasTextIds,

        // Rich Text Selection
        selectedRichTextId: effectiveSelectedRichTextId,
        setSelectedRichTextId: effectiveSetSelectedRichTextId,
        selectedRichTextIds: effectiveSelectedRichTextIds,
        setSelectedRichTextIds: effectiveSetSelectedRichTextIds,

        // Selection Box
        selectionBox, setSelectionBox,
        selectionTightRect, setSelectionTightRect,
        selectionTransformerRect, setSelectionTransformerRect,
        isDragSelection, setIsDragSelection,

        // Context Menu
        contextMenuOpen, setContextMenuOpen,
        contextMenuPosition, setContextMenuPosition,
        contextMenuImageIndex, setContextMenuImageIndex,
        contextMenuModalId, setContextMenuModalId,
        contextMenuModalType, setContextMenuModalType,

        // Selection Order
        selectionOrder,
        setSelectionOrder,

        // Actions
        clearAllSelections,
        getDimensions
    };
}
