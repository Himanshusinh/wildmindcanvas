
import React from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { CanvasProps } from '../types';
import { INFINITE_CANVAS_SIZE } from '@/core/canvas/canvasHelpers';
import { useCanvasState } from '../hooks/useCanvasState';
import { useCanvasSelection } from '../hooks/useCanvasSelection';
import { useCanvasEvents } from '../hooks/useCanvasEvents';
import { usePatternImage } from '../hooks/usePatternImage';
import { CanvasImage } from '../CanvasImage';
import { CanvasVideoNode } from '../CanvasVideoNode';
import { CanvasTextNode } from '../CanvasTextNode';
import { RichTextNode } from '../RichText/RichTextNode';

import { TextElements } from '../TextElements';
import { SelectionBox } from '../SelectionBox';
import { GroupContainerOverlay } from '../GroupContainerOverlay';
// Zustand Store - Video State Management
import { useVideoModalStates, useVideoSelection, useVideoStore, useImageModalStates, useMultiangleCameraModalStates, useMusicModalStates, useUpscaleModalStates, useRemoveBgModalStates, useEraseModalStates, useExpandModalStates, useImageStore, useMusicStore, useUpscaleStore, useMultiangleCameraStore, useRemoveBgStore, useEraseStore, useExpandStore, useExpandSelection } from '@/modules/stores';
// import { isComponentDraggable } from '@/core/canvas/canvasHelpers'; // Or pass as prop if logic is complex

interface CanvasStageProps {
    canvasState: ReturnType<typeof useCanvasState>;
    canvasSelection: ReturnType<typeof useCanvasSelection>;
    canvasEvents: ReturnType<typeof useCanvasEvents>;
    groupLogic: any; // Use proper type if possible, or ReturnType<typeof useGroupLogic>
    props: CanvasProps;
    refs: {
        stageRef: React.RefObject<Konva.Stage>;
        layerRef: React.RefObject<Konva.Layer>;
    };
    viewportSize: { width: number; height: number };
    position: { x: number; y: number };
    scale: number;
    selectedGroupIds?: string[];
    isDarkTheme?: boolean;
    handleRichTextUpdate?: (id: string, updates: any) => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
    canvasState,
    canvasSelection,
    canvasEvents,
    groupLogic,
    props,
    refs,
    viewportSize,
    position,
    scale,
    selectedGroupIds = [],
    isDarkTheme = true,
    handleRichTextUpdate,
}) => {
    const videoModalStates = useVideoModalStates() || [];
    const imageModalStates = useImageModalStates() || [];
    const multiangleCameraModalStates = useMultiangleCameraModalStates() || [];
    const musicModalStates = useMusicModalStates() || [];
    const upscaleModalStates = useUpscaleModalStates() || [];
    const { selectedIds: selectedVideoModalIds } = useVideoSelection();
    const { setSelectedVideoModalIds, setVideoModalStates } = useVideoStore();
    const { setImageModalStates } = useImageStore();
    const { setMusicModalStates } = useMusicStore();
    const { setUpscaleModalStates } = useUpscaleStore();
    const { setMultiangleCameraModalStates } = useMultiangleCameraStore();
    const removeBgModalStates = useRemoveBgModalStates() || [];
    const { setRemoveBgModalStates } = useRemoveBgStore();
    const expandModalStates = useExpandModalStates() || [];
    const { setExpandModalStates } = useExpandStore();
    const { selectedId: selectedExpandModalId, selectedIds: selectedExpandModalIds, setSelectedId: setSelectedExpandModalId, setSelectedIds: setSelectedExpandModalIds } = useExpandSelection();

    const {
        images,
        effectiveCanvasTextStates,
        effectiveSetSelectedCanvasTextId,
        effectiveSelectedCanvasTextId,
        handleCanvasTextUpdate,
        effectiveRichTextStates,
        // handleRichTextUpdate, // Removed duplicate
        // REMOVED: videoModalStates (now using Zustand store)
        // videoModalStates,
        groupContainerStates, setGroupContainerStates,
        setIsTextInteracting,

        // Pass other states needed for child components
        textInputStates,
        setTextInputStates,
        // REMOVED: imageModalStates, setImageModalStates (now using Zustand store)
        // imageModalStates, setImageModalStates,
        // REMOVED: setVideoModalStates (now using Zustand store)
        // setVideoModalStates,
        videoEditorModalStates, setVideoEditorModalStates,
        // REMOVED: musicModalStates, setMusicModalStates (now using Zustand store)
        // musicModalStates, setMusicModalStates,
        // REMOVED: upscaleModalStates, setUpscaleModalStates (now using Zustand store)
        // upscaleModalStates, setUpscaleModalStates,
        // REMOVED: multiangleCameraModalStates, setMultiangleCameraModalStates (now using Zustand store)
        // multiangleCameraModalStates, setMultiangleCameraModalStates,
        // REMOVED: removeBgModalStates, setRemoveBgModalStates (now using Zustand store)
        // removeBgModalStates, setRemoveBgModalStates,
        // REMOVED: eraseModalStates, setEraseModalStates (via store)
        // eraseModalStates, setEraseModalStates,
        // REMOVED: expandModalStates, setExpandModalStates (via store)
        // expandModalStates, setExpandModalStates,
        vectorizeModalStates, setVectorizeModalStates,
        nextSceneModalStates, setNextSceneModalStates,
        compareModalStates, setCompareModalStates,
        storyboardModalStates, setStoryboardModalStates,
        scriptFrameModalStates, setScriptFrameModalStates,
        sceneFrameModalStates, setSceneFrameModalStates,
    } = canvasState;

    const {
        selectedImageIndices, setSelectedImageIndices, setSelectedImageIndex, selectedImageIndex,
        clearAllSelections,
        selectionBox, setSelectionBox,
        selectionTightRect, setSelectionTightRect,
        selectionTransformerRect, setSelectionTransformerRect,
        isDragSelection, setIsDragSelection,
        setSelectedGroupIds,
        // Pass selection states
        selectedTextInputIds, setSelectedTextInputIds,
        selectedImageModalIds, setSelectedImageModalIds,
        // REMOVED: selectedVideoModalIds, setSelectedVideoModalIds (now using Zustand store)
        // selectedVideoModalIds, setSelectedVideoModalIds,
        selectedVideoEditorModalIds, setSelectedVideoEditorModalIds,
        selectedMusicModalIds, setSelectedMusicModalIds,
        selectedUpscaleModalIds, setSelectedUpscaleModalIds,
        // REMOVED: selectedMultiangleCameraModalIds, setSelectedMultiangleCameraModalIds (now using Zustand store)
        // selectedMultiangleCameraModalIds, setSelectedMultiangleCameraModalIds,
        selectedRemoveBgModalIds, setSelectedRemoveBgModalIds,
        selectedEraseModalIds, setSelectedEraseModalIds,
        // REMOVED: selectedExpandModalId, selectedExpandModalIds (via store)
        // selectedExpandModalId, selectedExpandModalIds,
        // selectedExpandModalIds, setSelectedExpandModalIds,
        selectedVectorizeModalIds, setSelectedVectorizeModalIds,
        selectedNextSceneModalIds, setSelectedNextSceneModalIds,
        selectedCompareModalIds, setSelectedCompareModalIds,
        selectedStoryboardModalIds, setSelectedStoryboardModalIds,
        selectedScriptFrameModalIds, setSelectedScriptFrameModalIds,
        selectedSceneFrameModalIds, setSelectedSceneFrameModalIds,
        effectiveSelectedCanvasTextIds,
        selectedRichTextId, setSelectedRichTextId,
        selectedRichTextIds, setSelectedRichTextIds,
    } = canvasSelection;

    const {
        handleStageMouseDown,
        handleStageMouseMove,
        handleStageMouseUp,
        handleStageClick,
        handleStageContextMenu,
        handleStageDragMove,
        handleStageDragEnd,
        isPanning,
        isSelecting
    } = canvasEvents;

    const { stageRef, layerRef } = refs;
    const patternImage = usePatternImage();

    // Helper or prop? Usually imported helper
    const isDraggable = (id: string) => {
        // Basic check, or pass logical function
        return true;
    };


    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent) => {
        // This logic was on the DIV container in Canvas.tsx.
        // If CanvasStage includes the DIV, then yes.
        // But Canvas.tsx render has DIV wrapping Stage.
        // So handleDrop can stay on DIV in Canvas.tsx or here if we wrap Stage in Div.
        // I'll leave it to Canvas.tsx to wrap CanvasStage in a div with drop handlers?
        // Yes, Canvas.tsx is the container.
    };

    return (
        <Stage
            ref={stageRef}
            width={viewportSize.width}
            height={viewportSize.height}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            draggable={isPanning}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onDragMove={handleStageDragMove}
            onDragEnd={handleStageDragEnd}
            onClick={handleStageClick}
            onTap={handleStageClick}
            onContextMenu={handleStageContextMenu}
            // onDragMove/onDragEnd handled in event hook or passed here?
            // Canvas.tsx had handleStageDragMove.
            // I should add them if they are in event hook.
            style={{
                cursor: props.selectedTool === 'text'
                    ? 'text'
                    : props.selectedTool === 'move'
                        ? (isPanning ? 'grabbing' : 'grab')
                        : (isSelecting ? 'crosshair' : 'default')
            }}
        >
            <Layer ref={layerRef}>
                <>
                    {/* Dynamic Viewport Background */}
                    {(() => {
                        const padding = 2000 / scale;
                        const viewX = -position.x / scale;
                        const viewY = -position.y / scale;
                        const viewW = viewportSize.width / scale;
                        const viewH = viewportSize.height / scale;

                        const rectX = viewX - padding;
                        const rectY = viewY - padding;
                        const rectW = viewW + padding * 2;
                        const rectH = viewH + padding * 2;

                        // Adaptive Grid Scale Logic
                        // As we zoom out (scale < 1), we want the dots to effectively "get larger" in world space
                        // so they stay visible on screen, but "further apart" (reduced density).
                        // We scale by powers of 2: 1x, 2x, 4x...
                        const zoomLevel = scale;
                        const exponent = Math.floor(Math.log2(1 / zoomLevel));
                        const gridScale = Math.pow(2, Math.max(0, exponent));

                        return (
                            <>
                                {/* Solid background color */}
                                <Rect
                                    x={rectX}
                                    y={rectY}
                                    width={rectW}
                                    height={rectH}
                                    fill={document.documentElement.classList.contains('dark') ? '#121212' : '#ffffff'}
                                    listening={true}
                                    name="background-rect"
                                />
                                {/* SVG Dot Pattern */}
                                {patternImage && (
                                    <Rect
                                        x={rectX}
                                        y={rectY}
                                        width={rectW}
                                        height={rectH}
                                        fillPatternImage={patternImage}
                                        fillPatternRepeat="repeat"
                                        fillPatternScaleX={gridScale}
                                        fillPatternScaleY={gridScale}
                                        fillPatternOffset={{
                                            // Keep the dot pattern anchored in world space
                                            // Must divide by gridScale because offset is in unscaled pattern space
                                            x: rectX / gridScale,
                                            y: rectY / gridScale
                                        }}
                                        name="background-rect"
                                        listening={false}
                                    />
                                )}
                            </>
                        );
                    })()}
                </>


                {(videoModalStates || []).map((videoState: any, index: number) => (
                    <CanvasVideoNode
                        key={videoState.id}
                        videoState={videoState}
                        index={index}
                        stageRef={stageRef}
                        position={position}
                        scale={scale}
                        isDraggable={true} // Call helper
                        isSelected={selectedVideoModalIds.includes(videoState.id)}
                        onSelect={(e) => {
                            const isMulti = e?.ctrlKey || e?.metaKey || e?.shiftKey;
                            if (isMulti) {
                                if (selectedVideoModalIds.includes(videoState.id)) {
                                    setSelectedVideoModalIds(prev => prev.filter(id => id !== videoState.id));
                                } else {
                                    setSelectedVideoModalIds(prev => [...prev, videoState.id]);
                                }
                            } else {
                                clearAllSelections(false);
                                setSelectedVideoModalIds([videoState.id]);
                            }
                        }}
                        onUpdate={(updates) => props.onPersistVideoModalMove?.(videoState.id, updates)}
                    />
                ))}



                {images.map((imageData: any, index: number) => {
                    if (imageData.type === 'model3d' || imageData.type === 'text') return null;
                    return (
                        <CanvasImage
                            key={`${imageData.url}-${index}`}
                            imageData={imageData}
                            index={index} // Needs actual index from original array?
                            stageRef={stageRef}
                            position={position}
                            scale={scale}
                            isDraggable={true} // helper
                            isSelected={selectedImageIndices.includes(index)}
                            onSelect={(e) => {
                                const isMulti = e?.ctrlKey || e?.metaKey || e?.shiftKey;
                                if (isMulti) {
                                    if (selectedImageIndices.includes(index)) {
                                        setSelectedImageIndices(prev => prev.filter(i => i !== index));
                                        if (selectedImageIndex === index) setSelectedImageIndex(null);
                                    } else {
                                        setSelectedImageIndices(prev => [...prev, index]);
                                        setSelectedImageIndex(index);
                                    }
                                } else {
                                    // Exclusive select
                                    clearAllSelections(false); // don't clear boxes yet if needed, but here we want to clear other selections
                                    setSelectedImageIndices([index]);
                                    setSelectedImageIndex(index);
                                }
                            }}
                            onUpdate={(updates) => {
                                groupLogic.handleImageUpdateWithGroup(index, updates)
                            }}
                            onDelete={() => {
                                props.onImageDelete?.(index);
                                setSelectedImageIndex(null);
                                setSelectedImageIndices([]);
                            }}
                        />
                    );
                })}

                {effectiveRichTextStates?.map((textState: any) => {
                    const isMultiSelect = (selectedRichTextIds?.length || 0) +
                        (selectedImageIndices?.length || 0) +
                        (selectedTextInputIds?.length || 0) +
                        (selectedImageModalIds?.length || 0) +
                        (selectedVideoModalIds?.length || 0) +
                        (selectedGroupIds?.length || 0) > 1;
                    return (
                        <RichTextNode
                            key={textState.id}
                            {...textState}
                            scale={scale}
                            suppressTransformer={isMultiSelect}
                            isSelected={selectedRichTextId === textState.id || (selectedRichTextIds && selectedRichTextIds.includes(textState.id))}
                            onSelect={(e: any) => {
                                const isMulti = e?.evt?.ctrlKey || e?.evt?.metaKey || e?.evt?.shiftKey;
                                if (isMulti) {
                                    if (selectedRichTextIds.includes(textState.id)) {
                                        setSelectedRichTextIds(prev => prev.filter(id => id !== textState.id));
                                        if (selectedRichTextId === textState.id) setSelectedRichTextId(null);
                                    } else {
                                        setSelectedRichTextIds(prev => [...prev, textState.id]);
                                        setSelectedRichTextId(textState.id);
                                    }
                                } else {
                                    clearAllSelections(false);
                                    setSelectedRichTextId(textState.id);
                                    setSelectedRichTextIds([textState.id]);
                                }
                            }}
                            onChange={(newAttrs: any) => {
                                handleRichTextUpdate?.(textState.id, newAttrs);
                            }}
                        />
                    );
                })}



                <TextElements
                    images={images}
                    selectedImageIndex={selectedImageIndex}
                    clearAllSelections={clearAllSelections}
                    setSelectedImageIndex={setSelectedImageIndex}
                    setSelectedImageIndices={setSelectedImageIndices}
                    setContextMenuImageIndex={(idx) => { /* TODO */ }}
                    setContextMenuOpen={(open) => { /* TODO */ }}
                    // pass context menu setters if needed
                    handleImageUpdateWithGroup={groupLogic.handleImageUpdateWithGroup}
                    onSelectText={(idOrIndex, e) => {
                        const isMulti = e?.ctrlKey || e?.metaKey || e?.shiftKey;
                        if (typeof idOrIndex === 'number') {
                            const index = idOrIndex;
                            if (isMulti) {
                                if (selectedImageIndices.includes(index)) {
                                    setSelectedImageIndices(prev => prev.filter(i => i !== index));
                                    if (selectedImageIndex === index) setSelectedImageIndex(null);
                                } else {
                                    setSelectedImageIndices(prev => [...prev, index]);
                                    setSelectedImageIndex(index);
                                }
                            } else {
                                clearAllSelections(false);
                                setSelectedImageIndices([index]);
                                setSelectedImageIndex(index);
                            }
                        }
                    }}
                />

                {effectiveCanvasTextStates.map((textState: any) => (
                    <CanvasTextNode
                        key={textState.id}
                        data={textState}
                        isSelected={effectiveSelectedCanvasTextIds.includes(textState.id)}
                        onSelect={(id, e) => {
                            const isMulti = e?.ctrlKey || e?.metaKey || e?.shiftKey;
                            if (isMulti) {
                                if (effectiveSelectedCanvasTextIds.includes(id)) {
                                    canvasSelection.effectiveSetSelectedCanvasTextIds(prev => prev.filter(tid => tid !== id));
                                } else {
                                    canvasSelection.effectiveSetSelectedCanvasTextIds(prev => [...prev, id]);
                                }
                            } else {
                                clearAllSelections(false);
                                canvasState.effectiveSetSelectedCanvasTextId(id);
                                canvasSelection.effectiveSetSelectedCanvasTextIds([id]);
                            }
                        }}
                        onChange={handleCanvasTextUpdate}
                        stageScale={scale}
                        onInteractionStart={() => setIsTextInteracting(true)}
                        onInteractionEnd={() => setIsTextInteracting(false)}
                    />
                ))}

                <SelectionBox
                    isGroupSelected={selectedGroupIds.length === 1}
                    onUngroup={() => {
                        if (selectedGroupIds.length === 1) {
                            groupLogic.handleUngroup(selectedGroupIds);
                        }
                    }}
                    scale={scale}
                    isSelecting={isSelecting}
                    {...canvasSelection}
                    {...canvasState}
                    imageModalStates={imageModalStates}
                    setImageModalStates={setImageModalStates}
                    videoModalStates={videoModalStates}
                    setVideoModalStates={setVideoModalStates}
                    musicModalStates={musicModalStates}
                    setMusicModalStates={setMusicModalStates}
                    upscaleModalStates={upscaleModalStates}
                    setUpscaleModalStates={setUpscaleModalStates}
                    multiangleCameraModalStates={multiangleCameraModalStates}
                    setMultiangleCameraModalStates={setMultiangleCameraModalStates}
                    // REMOVED: expandModalStates (via store)
                    // expandModalStates={expandModalStates}
                    selectedCanvasTextIds={effectiveSelectedCanvasTextIds}
                    handleImageUpdateWithGroup={groupLogic.handleImageUpdateWithGroup}
                    selectionDragOriginRef={React.useRef<{ x: number, y: number } | null>(null)}
                    onCreateGroup={groupLogic.handleCreateGroup}
                    setCanvasTextStates={canvasState.effectiveSetCanvasTextStates}
                    layerRef={layerRef}
                />

                <GroupContainerOverlay
                    groups={groupContainerStates}
                    scale={scale}
                    position={position}
                    selectedGroupIds={selectedGroupIds}
                    onUngroup={(id) => groupLogic.handleUngroup([id])}
                    onGroupMove={groupLogic.handleGroupMove}
                    onGroupDrag={groupLogic.handleGroupDrag}
                    onGroupUpdate={groupLogic.handleGroupUpdate}
                    onGroupSelect={(id) => {
                        clearAllSelections(false);
                        setSelectedGroupIds([id]);
                    }}
                    getItemBounds={() => null}
                    images={images}
                    videoModalStates={videoModalStates}
                    textInputStates={textInputStates}
                    musicModalStates={musicModalStates}
                    upscaleModalStates={upscaleModalStates}
                    multiangleCameraModalStates={multiangleCameraModalStates}
                    // REMOVED: removeBgModalStates (via store)
                    // removeBgModalStates={removeBgModalStates}
                    // REMOVED: eraseModalStates={eraseModalStates}
                    // REMOVED: expandModalStates={expandModalStates}
                    vectorizeModalStates={vectorizeModalStates}
                    nextSceneModalStates={nextSceneModalStates}
                    compareModalStates={compareModalStates}
                    storyboardModalStates={storyboardModalStates}
                    scriptFrameModalStates={scriptFrameModalStates}
                    sceneFrameModalStates={sceneFrameModalStates}
                    canvasTextStates={effectiveCanvasTextStates}
                    stageRef={stageRef}
                />
            </Layer>
        </Stage>
    );
};
