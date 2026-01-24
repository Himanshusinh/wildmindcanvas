
import { useState, useCallback, useEffect } from 'react';
import { CanvasItemsData, CanvasProps } from '../types';
import { getComponentDimensions } from '../utils/getComponentDimensions';

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

    const [selectedImageModalId, setSelectedImageModalId] = useState<string | null>(null);
    const [selectedImageModalIds, setSelectedImageModalIds] = useState<string[]>([]);

    const [selectedVideoModalId, setSelectedVideoModalId] = useState<string | null>(null);
    const [selectedVideoModalIds, setSelectedVideoModalIds] = useState<string[]>([]);

    const [selectedVideoEditorModalId, setSelectedVideoEditorModalId] = useState<string | null>(null);
    const [selectedVideoEditorModalIds, setSelectedVideoEditorModalIds] = useState<string[]>([]);

    const [selectedImageEditorModalId, setSelectedImageEditorModalId] = useState<string | null>(null);
    const [selectedImageEditorModalIds, setSelectedImageEditorModalIds] = useState<string[]>([]);

    const [selectedMusicModalId, setSelectedMusicModalId] = useState<string | null>(null);
    const [selectedMusicModalIds, setSelectedMusicModalIds] = useState<string[]>([]);

    const [selectedUpscaleModalId, setSelectedUpscaleModalId] = useState<string | null>(null);
    const [selectedUpscaleModalIds, setSelectedUpscaleModalIds] = useState<string[]>([]);

    const [selectedMultiangleCameraModalId, setSelectedMultiangleCameraModalId] = useState<string | null>(null);
    const [selectedMultiangleCameraModalIds, setSelectedMultiangleCameraModalIds] = useState<string[]>([]);

    const [selectedRemoveBgModalId, setSelectedRemoveBgModalId] = useState<string | null>(null);
    const [selectedRemoveBgModalIds, setSelectedRemoveBgModalIds] = useState<string[]>([]);

    const [selectedEraseModalId, setSelectedEraseModalId] = useState<string | null>(null);
    const [selectedEraseModalIds, setSelectedEraseModalIds] = useState<string[]>([]);

    const [selectedExpandModalId, setSelectedExpandModalId] = useState<string | null>(null);
    const [selectedExpandModalIds, setSelectedExpandModalIds] = useState<string[]>([]);

    const [selectedVectorizeModalId, setSelectedVectorizeModalId] = useState<string | null>(null);
    const [selectedVectorizeModalIds, setSelectedVectorizeModalIds] = useState<string[]>([]);

    const [selectedNextSceneModalId, setSelectedNextSceneModalId] = useState<string | null>(null);
    const [selectedNextSceneModalIds, setSelectedNextSceneModalIds] = useState<string[]>([]);

    const [selectedCompareModalId, setSelectedCompareModalId] = useState<string | null>(null);
    const [selectedCompareModalIds, setSelectedCompareModalIds] = useState<string[]>([]);

    const [selectedStoryboardModalId, setSelectedStoryboardModalId] = useState<string | null>(null);
    const [selectedStoryboardModalIds, setSelectedStoryboardModalIds] = useState<string[]>([]);

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
        setSelectedTextInputId(null);
        setSelectedTextInputIds([]);
        setSelectedImageModalId(null);
        setSelectedImageModalIds([]);
        setSelectedVideoModalId(null);
        setSelectedVideoModalIds([]);
        setSelectedVideoEditorModalId(null);
        setSelectedVideoEditorModalIds([]);
        setSelectedImageEditorModalId(null);
        setSelectedImageEditorModalIds([]);
        setSelectedMusicModalId(null);
        setSelectedMusicModalIds([]);
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

        // Clear canvas text selection
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
    }, [effectiveSetSelectedCanvasTextId, effectiveSetSelectedCanvasTextIds, effectiveSetSelectedRichTextId, effectiveSetSelectedRichTextIds]);

    const getDimensions = useCallback((type: string, id: string | number) => {
        return getComponentDimensions(type, id, canvasItemsData);
    }, [canvasItemsData]);

    return {
        // States & Setters
        selectedImageIndex, setSelectedImageIndex,
        selectedImageIndices, setSelectedImageIndices,
        selectedTextInputId, setSelectedTextInputId,
        selectedTextInputIds, setSelectedTextInputIds,
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
            ...effectiveSelectedCanvasTextIds,
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
