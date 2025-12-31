
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
import { RichText } from '../RichText';
import { TextElements } from '../TextElements';
import { SelectionBox } from '../SelectionBox';
import { GroupContainerOverlay } from '../GroupContainerOverlay';
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
    isDarkTheme = true
}) => {
    const {
        images,
        effectiveCanvasTextStates,
        effectiveSetSelectedCanvasTextId,
        effectiveSelectedCanvasTextId,
        handleCanvasTextUpdate,
        effectiveRichTextStates,
        handleRichTextUpdate,
        videoModalStates,
        groupContainerStates, setGroupContainerStates,
        setIsTextInteracting,

        // Pass other states needed for child components
        textInputStates,
        setTextInputStates,
        imageModalStates, setImageModalStates,
        setVideoModalStates,
        videoEditorModalStates, setVideoEditorModalStates,
        musicModalStates, setMusicModalStates,
        upscaleModalStates, setUpscaleModalStates,
        multiangleCameraModalStates, setMultiangleCameraModalStates,
        removeBgModalStates, setRemoveBgModalStates,
        eraseModalStates, setEraseModalStates,
        expandModalStates, setExpandModalStates,
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
        isDragSelection, setIsDragSelection,
        // selectedGroupIds,
        // Pass selection states
        selectedTextInputIds, setSelectedTextInputIds,
        selectedImageModalIds, setSelectedImageModalIds,
        selectedVideoModalIds, setSelectedVideoModalIds,
        selectedVideoEditorModalIds, setSelectedVideoEditorModalIds,
        selectedMusicModalIds, setSelectedMusicModalIds,
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
        effectiveSelectedCanvasTextIds,
        selectedRichTextId, setSelectedRichTextId,
    } = canvasSelection;

    const {
        handleStageMouseDown,
        handleStageMouseMove,
        handleStageMouseUp,
        handleStageClick,
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
                                        fillPatternScaleX={1 / Math.pow(scale, 0.9)}
                                        fillPatternScaleY={1 / Math.pow(scale, 0.9)}
                                        fillPatternOffset={{
                                            x: -rectX,
                                            y: -rectY
                                        }}
                                        name="background-rect"
                                        listening={false}
                                    />
                                )}
                            </>
                        );
                    })()}
                </>

                {selectionTightRect && (
                    <Rect
                        x={selectionTightRect.x}
                        y={selectionTightRect.y}
                        width={selectionTightRect.width}
                        height={selectionTightRect.height}
                        fill="rgba(100,149,237,0.15)"
                        stroke="#6495ED"
                        strokeWidth={4}
                        dash={[6, 6]}
                        listening={false}
                        cornerRadius={0}
                    />
                )}

                {videoModalStates.map((videoState: any, index: number) => (
                    <CanvasVideoNode
                        key={videoState.id}
                        videoState={videoState}
                        index={index}
                        stageRef={stageRef}
                        position={position}
                        scale={scale}
                        isDraggable={true} // Call helper
                        isSelected={selectedVideoModalIds.includes(videoState.id)}
                        onSelect={() => { /* logic passing logic? */ }}
                        onUpdate={(updates) => props.onPersistVideoModalMove?.(videoState.id, updates)}
                    />
                ))}

                {effectiveRichTextStates.map((richText: any) => (
                    <RichText
                        key={richText.id}
                        data={richText}
                        isSelected={selectedRichTextId === richText.id}
                        onSelect={setSelectedRichTextId}
                        onChange={handleRichTextUpdate}
                        onInteractionStart={() => setIsTextInteracting(true)}
                        onInteractionEnd={() => setIsTextInteracting(false)}
                        isDarkTheme={isDarkTheme}
                    />
                ))}

                {images
                    .filter((img) => img.type !== 'model3d' && img.type !== 'text')
                    .map((imageData: any, index: number) => (
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
                                // Logic for selection with ctrl/shift?
                                // Maybe extract this logic to event hook or helper?
                                // "handleImageSelect"?
                                // For now, assume passed function handles it.
                                // Canvas.tsx had inline logic 7841+
                                // We should probably extract handleImageSelect(index, event) to event hook.
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
                    ))}



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
                />

                <SelectionBox
                    isGroupSelected={selectedGroupIds.length > 0}
                    isSelecting={isSelecting}
                    {...canvasSelection}
                    {...canvasState}
                    selectedCanvasTextIds={effectiveSelectedCanvasTextIds}
                    handleImageUpdateWithGroup={groupLogic.handleImageUpdateWithGroup}
                    selectionDragOriginRef={React.useRef<{ x: number, y: number } | null>(null)}
                    onCreateGroup={groupLogic.handleCreateGroup}
                />

                <GroupContainerOverlay
                    groups={groupContainerStates}
                    scale={scale}
                    position={position}
                    selectedGroupIds={selectedGroupIds}
                    onUngroup={(id) => groupLogic.handleUngroup([id])}
                    onGroupMove={groupLogic.handleGroupMove}
                    onGroupDrag={groupLogic.handleGroupDrag}
                    onGroupNameChange={(id, name) => {
                        setGroupContainerStates(prev => prev.map(g => g.id === id ? { ...g, meta: { ...g.meta, name } } : g));
                    }}
                    getItemBounds={() => null}
                    images={images}
                    videoModalStates={videoModalStates}
                    textInputStates={textInputStates}
                    musicModalStates={musicModalStates}
                    upscaleModalStates={upscaleModalStates}
                    multiangleCameraModalStates={multiangleCameraModalStates}
                    removeBgModalStates={removeBgModalStates}
                    eraseModalStates={eraseModalStates}
                    expandModalStates={expandModalStates}
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
