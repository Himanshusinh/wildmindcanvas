
import React, { useMemo, useRef } from 'react';
import { CanvasProps, CanvasItemsData } from '../types';
import { useCanvasState } from '../hooks/useCanvasState';
import { useCanvasSelection } from '../hooks/useCanvasSelection';


import { ContextMenu } from '@/modules/ui-global/ContextMenu';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import { SettingsPopup } from '@/modules/ui-global/Settings';
import Konva from 'konva';
// Zustand Store - Image & Video State Management
import {
    useImageModalStates, useVideoModalStates, useRemoveBgModalStates, useRemoveBgSelection, useRemoveBgStore,
    useEraseModalStates, useEraseSelection, useEraseStore,
    useExpandModalStates, useExpandSelection, useExpandStore,
} from '@/modules/stores';
import { ModalOverlays } from '../../canvas-overlays';
interface CanvasOverlaysProps {
    canvasState: ReturnType<typeof useCanvasState>;
    canvasSelection: ReturnType<typeof useCanvasSelection>;
    props: CanvasProps;
    stageRef: React.RefObject<Konva.Stage>;
    position: { x: number; y: number };
    scale: number;
    viewportSize: { width: number; height: number };
    isComponentDraggable: (id: string) => boolean;
    onImageUpdate: (index: number, updates: any) => void;
    isLoading: boolean;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isOpen: boolean) => void;
    activeGenerationCount: number;
    onFitView: () => void;
    setGenerationQueue?: React.Dispatch<React.SetStateAction<import('@/modules/canvas/GenerationQueue').GenerationQueueItem[]>>;
    isChatOpen?: boolean;
    isInteracting?: boolean;
    setIsComponentDragging?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CanvasOverlays: React.FC<CanvasOverlaysProps> = ({
    canvasState,
    canvasSelection,
    props,
    stageRef,
    position,
    scale,
    viewportSize,
    isComponentDraggable,
    onImageUpdate,
    isLoading,
    isSettingsOpen,
    setIsSettingsOpen,
    activeGenerationCount,
    onFitView,
    setGenerationQueue,
    isChatOpen,
    isInteracting = false,
    setIsComponentDragging
}) => {
    // Zustand Store - Get image and video modal states (replaces from canvasState)
    const imageModalStates = useImageModalStates();
    const videoModalStates = useVideoModalStates();

    const {
        images,
        textInputStates, setTextInputStates,
        // REMOVED: imageModalStates, setImageModalStates (now managed by Zustand)
        // REMOVED: videoModalStates, setVideoModalStates (now managed by Zustand store)
        videoEditorModalStates, setVideoEditorModalStates,
        imageEditorModalStates, setImageEditorModalStates,
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
        clearAllSelections,
        selectedIds,
        selectedImageIndices, setSelectedImageIndices,
        selectedTextInputIds, setSelectedTextInputIds, setSelectedTextInputId, selectedTextInputId,
        selectedImageModalIds, setSelectedImageModalIds, setSelectedImageModalId, selectedImageModalId,
        // REMOVED: selectedVideoModalIds, setSelectedVideoModalIds, setSelectedVideoModalId, selectedVideoModalId (now managed by Zustand store)
        selectedVideoModalIds, setSelectedVideoModalIds, setSelectedVideoModalId, selectedVideoModalId,
        selectedVideoEditorModalIds, setSelectedVideoEditorModalIds, setSelectedVideoEditorModalId, selectedVideoEditorModalId,
        selectedImageEditorModalIds, setSelectedImageEditorModalIds, setSelectedImageEditorModalId, selectedImageEditorModalId,
        selectedRemoveBgModalId, selectedRemoveBgModalIds, setSelectedRemoveBgModalId, setSelectedRemoveBgModalIds,
        selectedEraseModalId, selectedEraseModalIds, setSelectedEraseModalId, setSelectedEraseModalIds,
        selectedExpandModalId, selectedExpandModalIds, setSelectedExpandModalId, setSelectedExpandModalIds,
        selectedVectorizeModalIds, setSelectedVectorizeModalIds, setSelectedVectorizeModalId, selectedVectorizeModalId,
        selectedNextSceneModalIds, setSelectedNextSceneModalIds, setSelectedNextSceneModalId, selectedNextSceneModalId,
        selectedCompareModalIds, setSelectedCompareModalIds, setSelectedCompareModalId, selectedCompareModalId,
        selectedStoryboardModalIds, setSelectedStoryboardModalIds, setSelectedStoryboardModalId, selectedStoryboardModalId,
        selectedScriptFrameModalIds, setSelectedScriptFrameModalIds,
        selectedSceneFrameModalIds, setSelectedSceneFrameModalIds,
        contextMenuPosition, contextMenuModalType, contextMenuOpen, setContextMenuOpen,
        setSelectionOrder,
    } = canvasSelection;

    // --- VIEWPORT-BASED VIRTUALIZATION ---
    const viewX = (-position.x) / scale;
    const viewY = (-position.y) / scale;
    const viewW = viewportSize.width / scale;
    const viewH = viewportSize.height / scale;
    const PADDING = 1200; // world units around viewport

    const viewportBounds = {
        minX: viewX - PADDING,
        minY: viewY - PADDING,
        maxX: viewX + viewW + PADDING,
        maxY: viewY + viewH + PADDING,
    };

    const isRectInViewport = (
        x: number,
        y: number,
        w: number = 600,
        h: number = 400,
    ) => {
        const { minX, minY, maxX, maxY } = viewportBounds;
        const rX2 = x + w;
        const rY2 = y + h;
        return !(rX2 < minX || x > maxX || rY2 < minY || y > maxY);
    };

    // Virtualize image and video modals based on viewport
    // Skip recalculation during interaction to prevent lag
    const prevVirtualizedImageRef = useRef<typeof imageModalStates>([]);
    const prevVirtualizedVideoRef = useRef<typeof videoModalStates>([]);

    const virtualizedImageModalStates = useMemo(() => {
        if (isInteracting) {
            // During interaction, use previous state to avoid lag
            return prevVirtualizedImageRef.current;
        }
        const filtered = imageModalStates.filter((m: { x: number; y: number; frameWidth?: number; frameHeight?: number }) =>
            isRectInViewport(
                m.x,
                m.y,
                m.frameWidth ?? 600,
                m.frameHeight ?? 400,
            )
        );
        prevVirtualizedImageRef.current = filtered;
        return filtered;
    }, [imageModalStates, viewportBounds.minX, viewportBounds.minY, viewportBounds.maxX, viewportBounds.maxY, isInteracting]);

    const virtualizedVideoModalStates = useMemo(() => {
        if (isInteracting) {
            // During interaction, use previous state to avoid lag
            return prevVirtualizedVideoRef.current;
        }
        const filtered = videoModalStates.filter((m: { x: number; y: number; frameWidth?: number; frameHeight?: number }) =>
            isRectInViewport(
                m.x,
                m.y,
                m.frameWidth ?? 600,
                m.frameHeight ?? 400,
            )
        );
        prevVirtualizedVideoRef.current = filtered;
        return filtered;
    }, [videoModalStates, viewportBounds.minX, viewportBounds.minY, viewportBounds.maxX, viewportBounds.maxY, isInteracting]);

    const {
        onPersistImageModalCreate, onPersistImageModalMove, onPersistImageModalDelete,
        onPersistVideoModalCreate, onPersistVideoModalMove, onPersistVideoModalDelete,
        onPersistVideoEditorModalMove,
        onPersistImageEditorModalMove,
        onPersistMusicModalCreate, onPersistMusicModalMove, onPersistMusicModalDelete,
        onPersistCompareModalCreate, onPersistCompareModalMove, onPersistCompareModalDelete,
        onPersistMultiangleCameraModalCreate, onPersistMultiangleCameraModalMove, onPersistMultiangleCameraModalDelete,
        onPersistUpscaleModalMove,
        onPersistRemoveBgModalMove,
        onPersistEraseModalMove,
        onPersistExpandModalMove,
        onPersistVectorizeModalMove,
        onPersistNextSceneModalMove,
        onPersistStoryboardModalMove,
        onPersistScriptFrameModalMove,
        onPersistSceneFrameModalMove
    } = props;

    // Helper to filter states if needed (though ModalOverlays likely checks existence, 
    // Canvas.tsx used a helper 'getEffectiveStates'. We might need it if overrides are applied in Canvas.tsx.
    // For now, pass direct states. If 'getEffectiveStates' was crucial for overrides (like real-time dragging), 
    // we need to access those overrides. 
    // Canvas.tsx had 'useComponentOverrides'. 
    // If we move that logic to 'useCanvasState' or here, we can support it.
    // For now assume direct state or we need to pass overrides too.)

    return (
        <>
            {/* {isLoading && <LoadingOverlay message="Loading canvas..." />} */}




            <ModalOverlays
                isChatOpen={isChatOpen}
                stageRef={stageRef as any}
                scale={scale}
                position={position}
                viewportSize={viewportSize}
                showFineDetails={scale >= 0.8}
                showLabelsOnly={scale >= 0.4 && scale < 0.8}
                isZoomedOut={scale < 0.4}
                isInteracting={isInteracting}
                videoEditorModalStates={videoEditorModalStates}
                imageEditorModalStates={imageEditorModalStates}
                isComponentDraggable={isComponentDraggable}
                removeBgModalStates={removeBgModalStates}
                eraseModalStates={eraseModalStates}
                expandModalStates={expandModalStates}
                vectorizeModalStates={vectorizeModalStates}
                nextSceneModalStates={nextSceneModalStates}
                storyboardModalStates={storyboardModalStates}
                scriptFrameModalStates={scriptFrameModalStates}
                sceneFrameModalStates={sceneFrameModalStates}

                // Connections
                connections={canvasState.connections}
                onConnectionsChange={props.onConnectionsChange}
                onPersistConnectorCreate={props.onPersistConnectorCreate}
                onPersistConnectorDelete={props.onPersistConnectorDelete}



                compareModalStates={compareModalStates}
                selectedCompareModalId={selectedCompareModalId}
                selectedCompareModalIds={selectedCompareModalIds}
                setCompareModalStates={setCompareModalStates}
                setSelectedCompareModalId={setSelectedCompareModalId}
                setSelectedCompareModalIds={setSelectedCompareModalIds}
                onPersistCompareModalCreate={onPersistCompareModalCreate}
                onPersistCompareModalMove={onPersistCompareModalMove}
                onPersistCompareModalDelete={onPersistCompareModalDelete}

                onPersistMultiangleCameraModalCreate={onPersistMultiangleCameraModalCreate}
                onPersistMultiangleCameraModalMove={onPersistMultiangleCameraModalMove}
                onPersistMultiangleCameraModalDelete={onPersistMultiangleCameraModalDelete}
                onMultiangleCamera={props.onMultiangleCamera}
                onQwenMultipleAngles={props.onQwenMultipleAngles}
                selectedVideoEditorModalId={selectedVideoEditorModalId}
                selectedVideoEditorModalIds={selectedVideoEditorModalIds}
                selectedImageEditorModalId={selectedImageEditorModalId}
                selectedImageEditorModalIds={selectedImageEditorModalIds}

                selectedRemoveBgModalId={selectedRemoveBgModalId}
                selectedRemoveBgModalIds={selectedRemoveBgModalIds}
                selectedEraseModalId={selectedEraseModalId}
                selectedEraseModalIds={selectedEraseModalIds}
                selectedExpandModalId={selectedExpandModalId}
                selectedExpandModalIds={selectedExpandModalIds}
                selectedVectorizeModalId={selectedVectorizeModalId}
                selectedVectorizeModalIds={selectedVectorizeModalIds}
                selectedNextSceneModalId={selectedNextSceneModalId}
                selectedNextSceneModalIds={selectedNextSceneModalIds}
                selectedStoryboardModalId={selectedStoryboardModalId}
                selectedStoryboardModalIds={selectedStoryboardModalIds}
                selectedIds={selectedIds}
                setSelectionOrder={setSelectionOrder}
                clearAllSelections={clearAllSelections}
                setSelectedImageIndices={setSelectedImageIndices}
                setVideoEditorModalStates={setVideoEditorModalStates}
                setSelectedVideoEditorModalId={setSelectedVideoEditorModalId}
                setSelectedVideoEditorModalIds={setSelectedVideoEditorModalIds}
                setImageEditorModalStates={setImageEditorModalStates}
                setSelectedImageEditorModalId={setSelectedImageEditorModalId}
                setSelectedImageEditorModalIds={setSelectedImageEditorModalIds}

                setRemoveBgModalStates={setRemoveBgModalStates}
                setSelectedRemoveBgModalId={setSelectedRemoveBgModalId}
                setSelectedRemoveBgModalIds={setSelectedRemoveBgModalIds}
                setEraseModalStates={setEraseModalStates}
                setSelectedEraseModalId={setSelectedEraseModalId}
                setSelectedEraseModalIds={setSelectedEraseModalIds}
                setExpandModalStates={setExpandModalStates}
                setSelectedExpandModalId={setSelectedExpandModalId}
                setSelectedExpandModalIds={setSelectedExpandModalIds}
                setVectorizeModalStates={setVectorizeModalStates}
                setSelectedVectorizeModalId={setSelectedVectorizeModalId}
                setSelectedVectorizeModalIds={setSelectedVectorizeModalIds}
                setNextSceneModalStates={setNextSceneModalStates}
                setSelectedNextSceneModalId={setSelectedNextSceneModalId}
                setSelectedNextSceneModalIds={setSelectedNextSceneModalIds}
                setStoryboardModalStates={setStoryboardModalStates}
                setSelectedStoryboardModalId={setSelectedStoryboardModalId}
                setSelectedStoryboardModalIds={setSelectedStoryboardModalIds}
                setScriptFrameModalStates={setScriptFrameModalStates as any}
                // setSelectedScriptFrameModalIds={selectedScriptFrameModalIds as any}
                // setSceneFrameModalStates={setSceneFrameModalStates as any}
                // setSelectedSceneFrameModalIds={selectedSceneFrameModalIds as any}

                onPersistImageModalCreate={props.onPersistImageModalCreate}
                onPersistImageModalMove={props.onPersistImageModalMove}
                onPersistImageModalDelete={props.onPersistImageModalDelete}
                onPersistVideoModalCreate={props.onPersistVideoModalCreate}
                onPersistVideoModalMove={props.onPersistVideoModalMove}
                onPersistVideoModalDelete={props.onPersistVideoModalDelete}
                onPersistVideoEditorModalCreate={props.onPersistVideoEditorModalCreate}
                onPersistVideoEditorModalMove={props.onPersistVideoEditorModalMove}
                onPersistVideoEditorModalDelete={props.onPersistVideoEditorModalDelete}
                onPersistImageEditorModalCreate={props.onPersistImageEditorModalCreate}
                onPersistImageEditorModalMove={props.onPersistImageEditorModalMove}
                onPersistImageEditorModalDelete={props.onPersistImageEditorModalDelete}
                onOpenVideoEditor={props.onOpenVideoEditor}
                onOpenImageEditor={props.onOpenImageEditor}
                onPersistMusicModalCreate={props.onPersistMusicModalCreate}
                onPersistMusicModalMove={props.onPersistMusicModalMove}
                onPersistMusicModalDelete={props.onPersistMusicModalDelete}
                onPersistUpscaleModalCreate={props.onPersistUpscaleModalCreate}
                onPersistUpscaleModalMove={props.onPersistUpscaleModalMove}
                onPersistUpscaleModalDelete={props.onPersistUpscaleModalDelete}
                onPersistRemoveBgModalCreate={props.onPersistRemoveBgModalCreate}
                onPersistRemoveBgModalMove={props.onPersistRemoveBgModalMove}
                onPersistRemoveBgModalDelete={props.onPersistRemoveBgModalDelete}
                onPersistEraseModalCreate={props.onPersistEraseModalCreate}
                onPersistEraseModalMove={props.onPersistEraseModalMove}
                onPersistEraseModalDelete={props.onPersistEraseModalDelete}
                onPersistExpandModalCreate={props.onPersistExpandModalCreate}
                onPersistExpandModalMove={props.onPersistExpandModalMove}
                onPersistExpandModalDelete={props.onPersistExpandModalDelete}
                onPersistVectorizeModalCreate={props.onPersistVectorizeModalCreate}
                onPersistVectorizeModalMove={props.onPersistVectorizeModalMove}
                onPersistVectorizeModalDelete={props.onPersistVectorizeModalDelete}
                onPersistNextSceneModalCreate={props.onPersistNextSceneModalCreate}
                onPersistNextSceneModalMove={props.onPersistNextSceneModalMove}
                onPersistNextSceneModalDelete={props.onPersistNextSceneModalDelete}
                onPersistStoryboardModalCreate={props.onPersistStoryboardModalCreate}
                onPersistStoryboardModalMove={props.onPersistStoryboardModalMove}
                onPersistStoryboardModalDelete={props.onPersistStoryboardModalDelete}
                onPersistTextModalCreate={props.onPersistTextModalCreate}
                onPersistTextModalMove={props.onPersistTextModalMove}
                onPersistTextModalDelete={props.onPersistTextModalDelete}
                richTextStates={props.richTextStates}
                selectedRichTextId={props.selectedRichTextId}
                selectedRichTextIds={props.selectedRichTextIds}
                setSelectedRichTextId={props.setSelectedRichTextId}
                setSelectedRichTextIds={props.setSelectedRichTextIds}
                onPersistRichTextCreate={props.onPersistRichTextCreate}
                onPersistRichTextMove={props.onPersistRichTextMove}
                onPersistRichTextDelete={props.onPersistRichTextDelete}
                onPersistScriptFrameModalCreate={props.onPersistScriptFrameModalCreate}
                onPersistScriptFrameModalMove={props.onPersistScriptFrameModalMove}
                onPersistScriptFrameModalDelete={props.onPersistScriptFrameModalDelete}
                onPersistSceneFrameModalCreate={props.onPersistSceneFrameModalCreate}
                onPersistSceneFrameModalMove={props.onPersistSceneFrameModalMove}
                onPersistSceneFrameModalDelete={props.onPersistSceneFrameModalDelete}

                onImageGenerate={props.onImageGenerate}
                onVideoGenerate={props.onVideoGenerate}
                onMusicGenerate={props.onMusicGenerate}
                onImageSelect={props.onImageSelect}
                onVideoSelect={props.onVideoSelect}
                onMusicSelect={props.onMusicSelect}
                onUpscale={props.onUpscale}

                onRemoveBg={props.onRemoveBg}
                onErase={props.onErase}
                onExpand={props.onExpand}
                onVectorize={props.onVectorize}
                onTextCreate={props.onTextCreate}
                onGenerateStoryboard={props.onGenerateStoryboard}

                projectId={props.projectId}
                isUIHidden={props.isUIHidden}
                setGenerationQueue={setGenerationQueue}
            />

            {isSettingsOpen && (
                <SettingsPopup
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}

            <ContextMenu
                isOpen={canvasSelection.selectedImageIndex !== null && canvasSelection.selectedImageIndex !== undefined}
                onClose={clearAllSelections}
                onDelete={() => {
                    if (canvasSelection.selectedImageIndex !== null && props.onImageDelete) {
                        props.onImageDelete(canvasSelection.selectedImageIndex);
                    }
                }}
                onDuplicate={() => {
                    if (canvasSelection.selectedImageIndex !== null && props.onImageDuplicate) {
                        props.onImageDuplicate(canvasSelection.selectedImageIndex);
                    }
                }}
                onDownload={() => {
                    if (canvasSelection.selectedImageIndex !== null && props.onImageDownload) {
                        props.onImageDownload(canvasSelection.selectedImageIndex);
                    }
                }}
                showDownload={true}
                showDuplicate={true}
            />

            {contextMenuOpen && contextMenuModalType === 'canvas' && (
                <PluginContextMenu
                    x={contextMenuPosition.x}
                    y={contextMenuPosition.y}
                    onClose={() => setContextMenuOpen(false)}
                    onClearStudio={() => {
                        if (props.onClearStudio) {
                            props.onClearStudio();
                        }
                    }}
                    onFitView={onFitView}
                />
            )}

            {/* <UnifiedCanvasOverlay
                // REMOVED: imageModalStates, setImageModalStates (now managed by Zustand)
                // imageModalStates={imageModalStates}
                setTextInputStates={setTextInputStates}
                // setImageModalStates={setImageModalStates}
                setVideoModalStates={setVideoModalStates}
                setMusicModalStates={setMusicModalStates}
                onPersistTextModalCreate={props.onPersistTextModalCreate}
                onPersistImageModalCreate={props.onPersistImageModalCreate}
                onPersistVideoModalCreate={props.onPersistVideoModalCreate}
                onPersistMusicModalCreate={props.onPersistMusicModalCreate}
                position={position}
                scale={scale}
                viewportSize={viewportSize}
            /> */}

            {/* <ComponentCreationMenu
                position={position}
                scale={scale}
                viewportSize={viewportSize}
                onTextCreate={(x, y) => { }}
                onImageCreate={(x, y) => { }}
                onVideoCreate={(x, y) => { }}
                onMusicCreate={(x, y) => { }}
            /> */}


        </>
    );
};
