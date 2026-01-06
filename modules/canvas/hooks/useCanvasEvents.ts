
import { useEffect, useState, useRef, useCallback } from 'react';
import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { CanvasProps } from '../types';
import { useCanvasState } from './useCanvasState';
import { useCanvasSelection } from './useCanvasSelection';
import { getComponentDimensions } from '../utils/getComponentDimensions';
import { applyStageCursor, getClientRect, INFINITE_CANVAS_SIZE, findBlankSpace } from '@/core/canvas/canvasHelpers';
import { useGroupLogic } from './useGroupLogic';

// Module-level variable to debounce creation across Strict Mode remounts
let globalLastTextCreateTime = 0;

export function useCanvasEvents(
    canvasState: ReturnType<typeof useCanvasState>,
    canvasSelection: ReturnType<typeof useCanvasSelection>,
    groupLogic: ReturnType<typeof useGroupLogic>,
    props: CanvasProps,
    refs: {
        stageRef: React.RefObject<Konva.Stage>;
        containerRef: React.RefObject<HTMLDivElement>;
    },
    canvasLocalState: {
        scale: number;
        setScale: React.Dispatch<React.SetStateAction<number>>;
        position: { x: number; y: number };
        setPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
        updateViewportCenter: (pos: { x: number; y: number }, scale: number) => void;
        navigationMode: 'trackpad' | 'mouse';
    }
) {
    const {
        selectedTool,
        onToolSelect,
        onPersistCanvasTextCreate,
        onPersistImageModalCreate,
        onPersistVideoModalCreate,
        onPersistMusicModalCreate,
        onPersistTextModalCreate,
        isImageModalOpen,
        isVideoModalOpen,
        isMusicModalOpen,
        toolClickCounter,
    } = props;

    const {
        scale,
        setScale,
        position,
        setPosition,
        updateViewportCenter,
        navigationMode = 'trackpad'
    } = canvasLocalState;

    const {
        // setCanvasTextStates, // REMOVED: use effectiveSetCanvasTextStates
        effectiveCanvasTextStates,
        effectiveSetCanvasTextStates,
        // setSelectedCanvasTextId, // REMOVED: belongs to canvasSelection
        images,
        textInputStates,
        setTextInputStates,
        imageModalStates,
        setImageModalStates,
        videoModalStates,
        setVideoModalStates,
        musicModalStates,
        setMusicModalStates,
        upscaleModalStates,
        multiangleCameraModalStates,
        removeBgModalStates,
        eraseModalStates,
        expandModalStates,
        vectorizeModalStates,
        nextSceneModalStates,
        compareModalStates,
        storyboardModalStates,
        scriptFrameModalStates,
        sceneFrameModalStates,
        videoEditorModalStates,
    } = canvasState;

    const {
        clearAllSelections,
        selectionBox, setSelectionBox,
        selectionTightRect, setSelectionTightRect,
        isDragSelection, setIsDragSelection,
        selectedImageIndices, setSelectedImageIndices,
        selectedImageModalIds, setSelectedImageModalIds,
        selectedVideoModalIds, setSelectedVideoModalIds,
        selectedVideoEditorModalIds, setSelectedVideoEditorModalIds,
        selectedMusicModalIds, setSelectedMusicModalIds,
        selectedTextInputIds, setSelectedTextInputIds,
        selectedUpscaleModalIds, setSelectedUpscaleModalIds,
        selectedMultiangleCameraModalIds, setSelectedMultiangleCameraModalIds,
        selectedRemoveBgModalIds, setSelectedRemoveBgModalIds,
        selectedEraseModalIds, setSelectedEraseModalIds,
        selectedExpandModalIds, setSelectedExpandModalIds,
        selectedVectorizeModalIds, setSelectedVectorizeModalIds,
        selectedNextSceneModalIds, setSelectedNextSceneModalIds,
        selectedCompareModalIds, setSelectedCompareModalIds,
        selectedStoryboardModalIds, setSelectedStoryboardModalIds,
        selectedScriptFrameModalIds, setSelectedScriptFrameModalIds,
        selectedSceneFrameModalIds, setSelectedSceneFrameModalIds,
        selectedGroupIds, setSelectedGroupIds,
        effectiveSelectedCanvasTextIds: selectedCanvasTextIds, // Alias
        effectiveSetSelectedCanvasTextIds: setSelectedCanvasTextIds, // Alias
        effectiveSetSelectedCanvasTextId: setSelectedCanvasTextId, // Alias
    } = canvasSelection;

    const { stageRef, containerRef } = refs;

    // Local interaction state
    const [isPanning, setIsPanning] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const [isMiddleButtonPressed, setIsMiddleButtonPressed] = useState(false);
    const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);
    const [isDraggingFromElement, setIsDraggingFromElement] = useState(false);
    const [selectionRectCoords, setSelectionRectCoords] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

    // Pending selection start logic
    const [pendingSelectionStartScreen, setPendingSelectionStartScreen] = useState<{ x: number; y: number } | null>(null);
    const [pendingSelectionStartCanvas, setPendingSelectionStartCanvas] = useState<{ x: number; y: number } | null>(null);
    const [selectionStartPoint, setSelectionStartPoint] = useState<{ x: number; y: number } | null>(null); // Screen coords

    const lastCreateTimesRef = useRef<{ text?: number; image?: number; video?: number; music?: number; canvasText?: number }>({});
    const prevSelectedToolRef = useRef(selectedTool);
    const prevToolClickCounterRef = useRef(toolClickCounter);
    const hasCreatedTextRef = useRef(false);

    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const positionRef = useRef(position);
    const scaleRef = useRef(scale);
    const isPanningRef = useRef(isPanning);

    useEffect(() => { positionRef.current = position; }, [position]);
    useEffect(() => { scaleRef.current = scale; }, [scale]);
    useEffect(() => { isPanningRef.current = isPanning; }, [isPanning]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
                setIsSpacePressed(true);
            }
            if (e.key === 'Shift') setIsShiftPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
            }
            if (e.key === 'Shift') setIsShiftPressed(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // --- TOOL CREATION EFFECT ---
    useEffect(() => {
        if (!selectedTool || selectedTool === 'cursor' || selectedTool === 'move') {
            prevSelectedToolRef.current = selectedTool;
            // Reset text creation flag when switching away from text tool
            hasCreatedTextRef.current = false;
            return;
        }

        const isSameTool = prevSelectedToolRef.current === selectedTool;
        const clickCountChanged = toolClickCounter !== undefined && toolClickCounter !== prevToolClickCounterRef.current;

        // Reset text creation flag when switching to a different tool
        if (prevSelectedToolRef.current !== selectedTool) {
            hasCreatedTextRef.current = false;
        }

        prevSelectedToolRef.current = selectedTool;
        prevToolClickCounterRef.current = toolClickCounter;

        if (isSameTool && !clickCountChanged) {
            return;
        }

        const stage = stageRef.current;
        if (!stage) return;

        const findSmartPosition = (width: number, height: number) => {
            const occupied: { x: number; y: number; width: number; height: number }[] = [];

            const addItems = (items: any[], type: string) => {
                items.forEach((item, idx) => {
                    const idOrIndex = type === 'image' ? idx : item.id;
                    // Construct data object that matches CanvasItemsData
                    const dataForDims = {
                        ...canvasState,
                        canvasTextStates: effectiveCanvasTextStates,
                        richTextStates: (canvasState as any).richTextStates || []
                    };
                    const dims = getComponentDimensions(type, idOrIndex, dataForDims as any);
                    if (dims.width > 0 && dims.height > 0) {
                        occupied.push({
                            x: item.x,
                            y: item.y,
                            width: dims.width,
                            height: dims.height
                        });
                    }
                });
            };

            addItems(images, 'image');
            addItems(effectiveCanvasTextStates, 'text'); // Plain Canvas Text
            addItems(textInputStates, 'input'); // AI Text
            addItems(imageModalStates, 'imageModal');
            addItems(videoModalStates, 'videoModal');
            addItems(musicModalStates, 'musicModal');
            addItems(upscaleModalStates, 'upscaleModal');
            addItems(multiangleCameraModalStates, 'multiangleCameraModal');
            addItems(removeBgModalStates, 'removeBgModal');
            addItems(eraseModalStates, 'eraseModal');
            addItems(expandModalStates, 'expandModal');
            addItems(vectorizeModalStates, 'vectorizeModal');
            addItems(nextSceneModalStates, 'nextSceneModal');
            addItems(compareModalStates, 'compareModal');
            addItems(storyboardModalStates, 'storyboardModal');
            addItems(scriptFrameModalStates, 'scriptFrameModal');
            addItems(sceneFrameModalStates, 'sceneFrameModal');
            addItems(videoEditorModalStates, 'videoEditorModal');

            return findBlankSpace(
                width,
                height,
                occupied,
                { width: stage.width(), height: stage.height() },
                position,
                scale
            );
        };

        const id = `${selectedTool}-${Date.now()}`;

        if (selectedTool === 'image') {
            const { x, y } = findSmartPosition(600, 400); // Default image modal size
            const newState = { id, x, y, frameWidth: 512, frameHeight: 512 };
            setImageModalStates(prev => [...prev, newState]);
            onPersistImageModalCreate?.(newState);
        } else if (selectedTool === 'video') {
            const { x, y } = findSmartPosition(600, 400); // Default video modal size
            const newState = { id, x, y, frameWidth: 512, frameHeight: 512 };
            setVideoModalStates(prev => [...prev, newState]);
            onPersistVideoModalCreate?.(newState);
        } else if (selectedTool === 'music') {
            const { x, y } = findSmartPosition(600, 300); // Default music modal size
            const newState = { id, x, y, frameWidth: 512, frameHeight: 512 };
            setMusicModalStates(prev => [...prev, newState]);
            onPersistMusicModalCreate?.(newState);
        } else if (selectedTool === 'canvas-text') {
            // "AI Text" Tool
            const now = Date.now();
            const lastTime = (window as any).__lastTextCreateTime || 0;

            console.log('[useCanvasEvents] AI Text Tool Selected', { now, lastTime, diff: now - lastTime });

            if (now - lastTime > 500) {
                (window as any).__lastTextCreateTime = now;
                hasCreatedTextRef.current = true;

                console.log('[useCanvasEvents] Creating AI Text (TextInput)');
                // Estimated size of new text input
                const { x, y } = findSmartPosition(400, 140);
                const newState = { id, x, y, value: '', autoFocusInput: false };
                setTextInputStates(prev => [...prev, newState]);
                onPersistTextModalCreate?.(newState);
            } else {
                console.warn('[useCanvasEvents] AI Text creation debounced/blocked');
            }
        }

        prevSelectedToolRef.current = selectedTool;
        // Optionally switch back to cursor after spawning one? 
        // Original code usually kept tool selected until manually changed or auto-switched.
        // onToolSelect?.('cursor'); 
    }, [selectedTool, toolClickCounter, stageRef, scale, position,
        setImageModalStates, setVideoModalStates, setMusicModalStates, setTextInputStates,
        effectiveSetCanvasTextStates, setSelectedCanvasTextId,
        onPersistImageModalCreate, onPersistVideoModalCreate, onPersistMusicModalCreate, onPersistCanvasTextCreate, onPersistTextModalCreate,
        // Add dependencies for all modal states to ensure we have latest positions
        images, effectiveCanvasTextStates, textInputStates, imageModalStates, videoModalStates, musicModalStates,
        upscaleModalStates, multiangleCameraModalStates, removeBgModalStates, eraseModalStates,
        expandModalStates, vectorizeModalStates, nextSceneModalStates, compareModalStates,
        storyboardModalStates, scriptFrameModalStates, sceneFrameModalStates, videoEditorModalStates
    ]);

    // Update selectionRectCoords when selectionBox changes
    useEffect(() => {
        if (selectionBox && selectionRectCoords) {
            setSelectionRectCoords({
                x1: selectionRectCoords.x1,
                y1: selectionRectCoords.y1,
                x2: selectionBox.currentX,
                y2: selectionBox.currentY,
            });
        }
    }, [selectionBox?.currentX, selectionBox?.currentY]);


    const applyStageCursorWrapper = (style: string, force = false) => {
        if (stageRef.current) {
            applyStageCursor(stageRef.current, style, selectedTool, force);
        }
    };

    const handleStageMouseDown = (e: KonvaEventObject<MouseEvent>) => {
        const target = e.target;
        const stage = target.getStage();
        const clickedOnEmpty = target === stage ||
            target.getClassName() === 'Stage' ||
            target.getClassName() === 'Layer' ||
            target.name() === 'background-rect' ||
            (target.getClassName() === 'Rect' && (target as Konva.Rect).width() >= INFINITE_CANVAS_SIZE);

        const isMoveTool = selectedTool === 'move';
        const isCursorTool = selectedTool === 'cursor';
        const isPanKey = isMoveTool || e.evt.ctrlKey || e.evt.metaKey || isSpacePressed;
        const isShiftSelection = e.evt.shiftKey && e.evt.button === 0;
        const clickedOnElement = !clickedOnEmpty;
        const isResizeHandle = target.name() === 'resize-handle';
        const isStartingSelection = (isCursorTool || isShiftSelection) && !isPanKey && e.evt.button === 0;

        let isInsideSelection = false;
        if (stage) {
            const pointerPos = stage.getPointerPosition();
            if (pointerPos) {
                const canvasPos = {
                    x: (pointerPos.x - position.x) / scale,
                    y: (pointerPos.y - position.y) / scale,
                };

                if (selectionTightRect) {
                    const rect = selectionTightRect;
                    if (
                        canvasPos.x >= rect.x &&
                        canvasPos.x <= rect.x + rect.width &&
                        canvasPos.y >= rect.y &&
                        canvasPos.y <= rect.y + rect.height
                    ) {
                        isInsideSelection = true;
                    }
                }

                if (!isInsideSelection && selectionBox) {
                    const boxX = Math.min(selectionBox.startX, selectionBox.currentX);
                    const boxY = Math.min(selectionBox.startY, selectionBox.currentY);
                    const boxWidth = Math.abs(selectionBox.currentX - selectionBox.startX);
                    const boxHeight = Math.abs(selectionBox.currentY - selectionBox.startY);
                    if (
                        canvasPos.x >= boxX &&
                        canvasPos.x <= boxX + boxWidth &&
                        canvasPos.y >= boxY &&
                        canvasPos.y <= boxY + boxHeight
                    ) {
                        isInsideSelection = true;
                    }
                }
            }
        }

        const isEditingGroup = document.querySelector('input[data-editing-group="true"]') !== null;
        // Modified: only clear on LEFT CLICK (button 0)
        if (clickedOnEmpty && e.evt.button === 0 && !isResizeHandle && !isInsideSelection && !isEditingGroup && !isPanKey && !isShiftSelection && !isStartingSelection) {
            clearAllSelections(true);
            props.onBackgroundClick?.();
            try {
                applyStageCursorWrapper('pointer');
            } catch (err) { }
        }

        const pointerPos = e.target.getStage()?.getPointerPosition();
        if (pointerPos) {
            setMouseDownPos({ x: pointerPos.x, y: pointerPos.y });
        }

        if (selectedTool === 'text' && clickedOnEmpty && !isPanKey) {
            // Text is already created automatically when tool is selected
            // Just switch back to cursor tool after clicking
            onToolSelect?.('cursor');
            return;
        }

        if (isShiftSelection && clickedOnEmpty) {
            if (pointerPos) {
                setPendingSelectionStartScreen({ x: pointerPos.x, y: pointerPos.y });
                setPendingSelectionStartCanvas({ x: (pointerPos.x - position.x) / scale, y: (pointerPos.y - position.y) / scale });
                setSelectionStartPoint({ x: pointerPos.x, y: pointerPos.y });
                setSelectionBox(null);
                setSelectionTightRect(null);
                setIsDragSelection(false);
            }
            return;
        }

        if (isMoveTool && clickedOnEmpty && e.evt.button === 0) {
            const stage = e.target.getStage();
            if (stage) {
                setIsPanning(true);
                stage.draggable(true);
                applyStageCursorWrapper('grabbing', true);
            }
            return;
        }

        if (isCursorTool && e.evt.button === 0) {
            if (!clickedOnEmpty) return;
            if (pointerPos) {
                const canvasX = (pointerPos.x - position.x) / scale;
                const canvasY = (pointerPos.y - position.y) / scale;
                setSelectionRectCoords({
                    x1: canvasX, y1: canvasY, x2: canvasX, y2: canvasY
                });
                setPendingSelectionStartScreen({ x: pointerPos.x, y: pointerPos.y });
                setPendingSelectionStartCanvas({ x: canvasX, y: canvasY });
                setSelectionStartPoint({ x: pointerPos.x, y: pointerPos.y });
                setSelectionBox(null);
                setSelectionTightRect(null);
                setIsDragSelection(false);
            }
            return;
        }

        const shouldPan = isPanKey && !isShiftSelection;
        if (clickedOnEmpty && e.evt.button === 0 && !isShiftSelection && (isMoveTool || isPanKey)) {
            const stage = e.target.getStage();
            if (stage) {
                setIsPanning(true);
                stage.draggable(true);
                applyStageCursorWrapper('grabbing', true);
            }
            return;
        }

        if (shouldPan) {
            const stage = e.target.getStage();
            if (stage) {
                if (e.evt.button === 1) {
                    e.evt.preventDefault();
                    e.evt.stopPropagation();
                    setIsMiddleButtonPressed(true);
                    return;
                }
                setIsPanning(true);
                stage.draggable(true);
                applyStageCursorWrapper('grabbing', true);
            }
        } else if (clickedOnElement && isMoveTool) {
            const stage = e.target.getStage();
            if (stage) {
                setIsPanning(true);
                stage.draggable(true);
                applyStageCursorWrapper('grabbing', true);
            }
        } else if (clickedOnElement) {
            setIsDraggingFromElement(true);
            const stage = e.target.getStage();
            if (stage) {
                stage.draggable(false);
            }
        }
    };

    const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
        // Handle drag selection box update
        if (isSelecting && selectionBox) {
            const stage = e.target.getStage();
            if (!stage) return;

            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const currentX = (pointer.x - position.x) / scale;
            const currentY = (pointer.y - position.y) / scale;

            setSelectionBox({
                ...selectionBox,
                currentX,
                currentY
            });
        }
    };

    const handleStageMouseUp = (e: KonvaEventObject<MouseEvent>) => {
        if (e.evt.button === 1) {
            setIsMiddleButtonPressed(false);
            setIsPanning(false);
            const stage = e.target.getStage();
            if (stage) stage.draggable(false);
            e.evt.preventDefault();
            e.evt.stopPropagation();
            return;
        }

        // Selection Rect Logic
        if (selectionRectCoords) {
            const rectWidth = Math.abs(selectionRectCoords.x2 - selectionRectCoords.x1);
            const rectHeight = Math.abs(selectionRectCoords.y2 - selectionRectCoords.y1);

            if (rectWidth >= 5 && rectHeight >= 5) {
                const selectionRect = {
                    x: Math.min(selectionRectCoords.x1, selectionRectCoords.x2),
                    y: Math.min(selectionRectCoords.y1, selectionRectCoords.y2),
                    width: rectWidth,
                    height: rectHeight,
                };

                const isMultiSelect = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;

                const newSelectedIndices: number[] = isMultiSelect ? [...selectedImageIndices] : [];
                // ... initialize all other arrays
                const newSelectedImageModalIds = isMultiSelect ? [...selectedImageModalIds] : [];
                const newSelectedTextInputIds = isMultiSelect ? [...selectedTextInputIds] : [];
                // (Shortened for brevity, implement logic similarly for all)

                // Helper to check intersection
                const checkIntersection = (itemRect: { x: number; y: number; width: number; height: number; rotation?: number }) => {
                    const componentRect = getClientRect(itemRect);
                    return Konva.Util.haveIntersection(selectionRect, componentRect);
                };

                // Check intersection for all types
                // Images
                images.forEach((img, idx) => {
                    if (img.type === 'image' || img.type === 'video') {
                        const dims = getComponentDimensions('image', idx, canvasState as any);
                        if (checkIntersection({ x: img.x || 0, y: img.y || 0, width: dims.width, height: dims.height, rotation: img.rotation || 0 })) {
                            if (!newSelectedIndices.includes(idx)) newSelectedIndices.push(idx);
                        }
                    }
                });

                // Image Modals
                imageModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('imageModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedImageModalIds.includes(modal.id)) newSelectedImageModalIds.push(modal.id);
                    }
                });

                const newSelectedVideoModalIds = isMultiSelect ? [...selectedVideoModalIds] : [];
                videoModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('videoModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedVideoModalIds.includes(modal.id)) newSelectedVideoModalIds.push(modal.id);
                    }
                });

                const newSelectedVideoEditorModalIds = isMultiSelect ? [...selectedVideoEditorModalIds] : [];
                videoEditorModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('videoEditorModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedVideoEditorModalIds.includes(modal.id)) newSelectedVideoEditorModalIds.push(modal.id);
                    }
                });

                const newSelectedMusicModalIds = isMultiSelect ? [...selectedMusicModalIds] : [];
                musicModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('musicModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedMusicModalIds.includes(modal.id)) newSelectedMusicModalIds.push(modal.id);
                    }
                });

                textInputStates.forEach((input: any) => {
                    const dims = getComponentDimensions('input', input.id, canvasState as any);
                    if (checkIntersection({ x: input.x, y: input.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedTextInputIds.includes(input.id)) newSelectedTextInputIds.push(input.id);
                    }
                });

                const newSelectedNextSceneModalIds = isMultiSelect ? [...selectedNextSceneModalIds] : [];
                nextSceneModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('nextSceneModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedNextSceneModalIds.includes(modal.id)) newSelectedNextSceneModalIds.push(modal.id);
                    }
                });

                const newSelectedMultiangleCameraModalIds = isMultiSelect ? [...selectedMultiangleCameraModalIds] : [];
                multiangleCameraModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('multiangleCameraModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedMultiangleCameraModalIds.includes(modal.id)) newSelectedMultiangleCameraModalIds.push(modal.id);
                    }
                });

                const newSelectedVectorizeModalIds = isMultiSelect ? [...selectedVectorizeModalIds] : [];
                vectorizeModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('vectorizeModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedVectorizeModalIds.includes(modal.id)) newSelectedVectorizeModalIds.push(modal.id);
                    }
                });

                const newSelectedRemoveBgModalIds = isMultiSelect ? [...selectedRemoveBgModalIds] : [];
                removeBgModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('removeBgModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedRemoveBgModalIds.includes(modal.id)) newSelectedRemoveBgModalIds.push(modal.id);
                    }
                });

                const newSelectedUpscaleModalIds = isMultiSelect ? [...selectedUpscaleModalIds] : [];
                upscaleModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('upscaleModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedUpscaleModalIds.includes(modal.id)) newSelectedUpscaleModalIds.push(modal.id);
                    }
                });

                const newSelectedEraseModalIds = isMultiSelect ? [...selectedEraseModalIds] : [];
                eraseModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('eraseModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedEraseModalIds.includes(modal.id)) newSelectedEraseModalIds.push(modal.id);
                    }
                });

                const newSelectedExpandModalIds = isMultiSelect ? [...selectedExpandModalIds] : [];
                expandModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('expandModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedExpandModalIds.includes(modal.id)) newSelectedExpandModalIds.push(modal.id);
                    }
                });

                const newSelectedCompareModalIds = isMultiSelect ? [...selectedCompareModalIds] : [];
                compareModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('compareModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedCompareModalIds.includes(modal.id)) newSelectedCompareModalIds.push(modal.id);
                    }
                });

                const newSelectedStoryboardModalIds = isMultiSelect ? [...selectedStoryboardModalIds] : [];
                storyboardModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('storyboardModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedStoryboardModalIds.includes(modal.id)) newSelectedStoryboardModalIds.push(modal.id);
                    }
                });

                const newSelectedScriptFrameModalIds = isMultiSelect ? [...selectedScriptFrameModalIds] : [];
                scriptFrameModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('scriptFrameModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedScriptFrameModalIds.includes(modal.id)) newSelectedScriptFrameModalIds.push(modal.id);
                    }
                });

                const newSelectedSceneFrameModalIds = isMultiSelect ? [...selectedSceneFrameModalIds] : [];
                sceneFrameModalStates.forEach((modal: any) => {
                    const dims = getComponentDimensions('sceneFrameModal', modal.id, canvasState as any);
                    if (checkIntersection({ x: modal.x, y: modal.y, width: dims.width, height: dims.height })) {
                        if (!newSelectedSceneFrameModalIds.includes(modal.id)) newSelectedSceneFrameModalIds.push(modal.id);
                    }
                });

                const newSelectedGroupIds = isMultiSelect ? [...selectedGroupIds] : [];
                canvasState.groupContainerStates.forEach((group: any) => {
                    if (checkIntersection({ x: group.x, y: group.y, width: group.width, height: group.height })) {
                        if (!newSelectedGroupIds.includes(group.id)) newSelectedGroupIds.push(group.id);
                    }
                });

                // Update selections
                setSelectedImageIndices(newSelectedIndices);
                setSelectedImageModalIds(newSelectedImageModalIds);
                setSelectedTextInputIds(newSelectedTextInputIds);
                setSelectedVideoModalIds(newSelectedVideoModalIds);
                setSelectedMusicModalIds(newSelectedMusicModalIds);
                setSelectedNextSceneModalIds(newSelectedNextSceneModalIds);
                setSelectedMultiangleCameraModalIds(newSelectedMultiangleCameraModalIds);
                setSelectedVectorizeModalIds(newSelectedVectorizeModalIds);
                setSelectedRemoveBgModalIds(newSelectedRemoveBgModalIds);
                setSelectedUpscaleModalIds(newSelectedUpscaleModalIds);
                setSelectedEraseModalIds(newSelectedEraseModalIds);
                setSelectedExpandModalIds(newSelectedExpandModalIds);
                setSelectedCompareModalIds(newSelectedCompareModalIds);
                setSelectedStoryboardModalIds(newSelectedStoryboardModalIds);
                setSelectedScriptFrameModalIds(newSelectedScriptFrameModalIds);
                setSelectedSceneFrameModalIds(newSelectedSceneFrameModalIds);
                setSelectedGroupIds(newSelectedGroupIds);

                // Calculate tight bounding box for all selected items
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                let hasSelection = false;

                const updateBounds = (rect: { x: number; y: number; width: number; height: number; rotation?: number }) => {
                    // Use getClientRect to account for rotation/transform/shadows
                    hasSelection = true;
                    const client = getClientRect(rect);
                    minX = Math.min(minX, client.x);
                    minY = Math.min(minY, client.y);
                    maxX = Math.max(maxX, client.x + client.width);
                    maxY = Math.max(maxY, client.y + client.height);
                };

                // Check bounds for selected items
                newSelectedIndices.forEach(idx => {
                    const img = images[idx];
                    const dims = getComponentDimensions('image', idx, canvasState as any);
                    updateBounds({ x: img.x || 0, y: img.y || 0, width: dims.width, height: dims.height });
                });

                newSelectedImageModalIds.forEach(id => {
                    const modal = imageModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('imageModal', id, canvasState as any);
                        updateBounds({ x: modal.x, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedVideoModalIds.forEach(id => {
                    const modal = videoModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('videoModal', id, canvasState as any);
                        updateBounds({ x: modal.x, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedMusicModalIds.forEach(id => {
                    const modal = musicModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('musicModal', id, canvasState as any);
                        updateBounds({ x: modal.x, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedTextInputIds.forEach(id => {
                    const input = textInputStates.find((t: any) => t.id === id);
                    if (input) {
                        const dims = getComponentDimensions('input', id, canvasState as any);
                        updateBounds({ x: input.x, y: input.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedNextSceneModalIds.forEach(id => {
                    const modal = nextSceneModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('nextSceneModal', id, canvasState as any);
                        const offsetX = (dims.width - 100) / 2;
                        updateBounds({ x: modal.x - offsetX, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedMultiangleCameraModalIds.forEach(id => {
                    const modal = multiangleCameraModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('multiangleCameraModal', id, canvasState as any);
                        const offsetX = (dims.width - 100) / 2;
                        updateBounds({ x: modal.x - offsetX, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedVideoEditorModalIds.forEach(id => {
                    const modal = videoEditorModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('videoEditorModal', id, canvasState as any);
                        const offsetX = (dims.width - 100) / 2;
                        updateBounds({ x: modal.x - offsetX, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedVectorizeModalIds.forEach(id => {
                    const modal = vectorizeModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('vectorizeModal', id, canvasState as any);
                        const offsetX = (dims.width - 100) / 2;
                        updateBounds({ x: modal.x - offsetX, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedRemoveBgModalIds.forEach(id => {
                    const modal = removeBgModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('removeBgModal', id, canvasState as any);
                        const offsetX = (dims.width - 100) / 2;
                        updateBounds({ x: modal.x - offsetX, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedUpscaleModalIds.forEach(id => {
                    const modal = upscaleModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('upscaleModal', id, canvasState as any);
                        const offsetX = (dims.width - 100) / 2;
                        updateBounds({ x: modal.x - offsetX, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedEraseModalIds.forEach(id => {
                    const modal = eraseModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('eraseModal', id, canvasState as any);
                        const offsetX = (dims.width - 100) / 2;
                        updateBounds({ x: modal.x - offsetX, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedExpandModalIds.forEach(id => {
                    const modal = expandModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('expandModal', id, canvasState as any);
                        const offsetX = (dims.width - 100) / 2;
                        updateBounds({ x: modal.x - offsetX, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedCompareModalIds.forEach(id => {
                    const modal = compareModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('compareModal', id, canvasState as any);
                        const offsetX = (dims.width - 100) / 2;
                        updateBounds({ x: modal.x - offsetX, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedStoryboardModalIds.forEach(id => {
                    const modal = storyboardModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('storyboardModal', id, canvasState as any);
                        updateBounds({ x: modal.x, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedScriptFrameModalIds.forEach(id => {
                    const modal = scriptFrameModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('scriptFrameModal', id, canvasState as any);
                        updateBounds({ x: modal.x, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedSceneFrameModalIds.forEach(id => {
                    const modal = sceneFrameModalStates.find((m: any) => m.id === id);
                    if (modal) {
                        const dims = getComponentDimensions('sceneFrameModal', id, canvasState as any);
                        updateBounds({ x: modal.x, y: modal.y, width: dims.width, height: dims.height });
                    }
                });

                newSelectedGroupIds.forEach(id => {
                    const group = canvasState.groupContainerStates.find((g: any) => g.id === id);
                    if (group) {
                        updateBounds({ x: group.x, y: group.y, width: group.width, height: group.height });
                    }
                });

                setSelectionBox(null);
                setSelectionRectCoords(null);
                setIsDragSelection(false);
                setIsSelecting(false);

                if (hasSelection) {
                    const padding = 20; // Add padding to avoid cutting off borders
                    setSelectionTightRect({
                        x: minX - padding,
                        y: minY - padding,
                        width: (maxX - minX) + (padding * 2),
                        height: (maxY - minY) + (padding * 2)
                    });
                } else {
                    setSelectionTightRect(null);
                }
            } else {
                // Cleared because too small
                setSelectionBox(null);
                setSelectionRectCoords(null);
                setIsSelecting(false);
            }
            setSelectionRectCoords(null);
        }
    };

    const handleStageDragMove = (e: KonvaEventObject<DragEvent>) => {
        if (!isPanning) return;
        const stage = e.target.getStage();
        if (!stage) return;

        const newPos = { x: stage.x(), y: stage.y() };
        setPosition(newPos);
        // Throttle viewport center update if needed, or do it on end?
        // updateViewportCenter?.(newPos, scale);
    };

    const handleStageDragEnd = (e: KonvaEventObject<DragEvent>) => {
        setIsPanning(false);
        const stage = e.target.getStage();
        if (stage) {
            stage.draggable(false);
            const newPos = { x: stage.x(), y: stage.y() };
            setPosition(newPos);
            updateViewportCenter?.(newPos, scale);
            applyStageCursorWrapper('grab');
        }
    };

    const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
        if (selectionRectCoords) {
            const w = Math.abs(selectionRectCoords.x2 - selectionRectCoords.x1);
            const h = Math.abs(selectionRectCoords.y2 - selectionRectCoords.y1);
            if (w > 0 && h > 0) return;
        }
        const target = e.target;
        const stage = target.getStage();
        const clickedOnEmpty = target === stage || target.getClassName() === 'Stage' || target.getClassName() === 'Layer' || target.name() === 'background-rect';

        // Modified: only clear on LEFT CLICK (button 0)
        if (clickedOnEmpty && e.evt.button === 0) {
            clearAllSelections();
        }
    };

    const handleStageContextMenu = (e: KonvaEventObject<PointerEvent>) => {
        const target = e.target;
        const stage = target.getStage();
        const clickedOnEmpty = target === stage || target.getClassName() === 'Stage' || target.getClassName() === 'Layer' || target.name() === 'background-rect';

        if (clickedOnEmpty) {
            e.evt.preventDefault();
            clearAllSelections();
            canvasSelection.setContextMenuOpen(true);
            canvasSelection.setContextMenuModalType('canvas');
            canvasSelection.setContextMenuPosition({ x: e.evt.clientX, y: e.evt.clientY });
        }
    };

    // Wheel Zoom/Pan
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        const handleWheel = (e: WheelEvent) => {
            if (isMiddleButtonPressed) {
                e.preventDefault(); e.stopPropagation(); return;
            }
            if ((e.target as HTMLElement).closest('[data-component-menu]')) return;

            e.preventDefault();
            const isModifier = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;

            let isZoomAction = isModifier;
            if (navigationMode === 'mouse') isZoomAction = !isModifier;

            if (!isZoomAction) {
                // Pan
                if (stage) {
                    stage.draggable(false);
                    if (isPanningRef.current) setIsPanning(false);
                }
                requestAnimationFrame(() => {
                    setPosition(prev => {
                        const newPos = { x: prev.x - e.deltaX, y: prev.y - e.deltaY };
                        setTimeout(() => updateViewportCenter?.(newPos, scaleRef.current), 0);
                        return newPos;
                    });
                });
                return;
            }

            // Zoom
            const oldScale = scaleRef.current;
            const pointer = stage.getPointerPosition();
            if (!pointer) return;
            const mousePointTo = { x: (pointer.x - positionRef.current.x) / oldScale, y: (pointer.y - positionRef.current.y) / oldScale };
            const direction = e.deltaY > 0 ? -1 : 1;
            const scaleBy = 1.1;
            const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
            const clampedScale = Math.max(0.1, Math.min(5, newScale));

            setScale(clampedScale);
            const newPos = { x: pointer.x - mousePointTo.x * clampedScale, y: pointer.y - mousePointTo.y * clampedScale };
            setPosition(newPos);
            setTimeout(() => updateViewportCenter?.(newPos, clampedScale), 0);
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }
    }, [stageRef, containerRef, isMiddleButtonPressed, navigationMode, setPosition, setScale, updateViewportCenter]);


    // Mouse Move tracking for drag vs click
    useEffect(() => {
        if (!isDraggingFromElement || !mouseDownPos || selectedTool === 'cursor' || selectedTool === 'move') return;
        const handleMouseMove = (e: MouseEvent) => {
            const dist = Math.sqrt(Math.pow(e.clientX - mouseDownPos.x, 2) + Math.pow(e.clientY - mouseDownPos.y, 2));
            if (dist > 5) {
                const stage = stageRef.current;
                if (stage) {
                    setIsPanning(true);
                    stage.draggable(true);
                    applyStageCursorWrapper('grabbing', true);
                    stage.find('Image').forEach(node => node.draggable(false));
                }
            }
        };
        const handleMouseUp = () => { setIsDraggingFromElement(false); setMouseDownPos(null); };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp, true);
        return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp, true); };
    }, [isDraggingFromElement, mouseDownPos, selectedTool]);

    // Pending Selection logic
    useEffect(() => {
        if (!pendingSelectionStartScreen || !pendingSelectionStartCanvas) return;
        const handleMove = (e: MouseEvent) => {
            const dx = e.clientX - pendingSelectionStartScreen.x;
            const dy = e.clientY - pendingSelectionStartScreen.y;
            if (Math.sqrt(dx * dx + dy * dy) > 6) {
                const stage = stageRef.current;
                if (stage) {
                    stage.draggable(false);
                    applyStageCursorWrapper('crosshair', true);
                }
                setSelectionBox({
                    startX: pendingSelectionStartCanvas.x,
                    startY: pendingSelectionStartCanvas.y,
                    currentX: pendingSelectionStartCanvas.x,
                    currentY: pendingSelectionStartCanvas.y
                });
                setIsSelecting(true);
                setSelectionRectCoords({
                    x1: pendingSelectionStartCanvas.x, y1: pendingSelectionStartCanvas.y,
                    x2: pendingSelectionStartCanvas.x, y2: pendingSelectionStartCanvas.y
                });
                setPendingSelectionStartScreen(null);
                setPendingSelectionStartCanvas(null);
            }
        };
        const handleUp = () => { setPendingSelectionStartScreen(null); setPendingSelectionStartCanvas(null); };
        window.addEventListener('mousemove', handleMove, { passive: true });
        window.addEventListener('mouseup', handleUp, true);
        return () => { window.removeEventListener('mousemove', handleMove as any); window.removeEventListener('mouseup', handleUp as any, true); };
    }, [pendingSelectionStartScreen, pendingSelectionStartCanvas]);

    return {
        handleStageMouseDown,
        handleStageMouseMove,
        handleStageMouseUp,
        handleStageClick,
        handleStageContextMenu,
        handleStageDragMove,
        handleStageDragEnd,
        isPanning,
        isSelecting,
        selectionRectCoords,
        setIsPanning,
        setIsSelecting,
        isShiftPressed,
        setIsShiftPressed
    };
}
