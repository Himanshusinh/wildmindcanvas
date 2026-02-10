
import React, { useMemo, useRef } from 'react';
import { CanvasProps, CanvasItemsData } from '../types';
import { useCanvasState } from '../hooks/useCanvasState';
import { useCanvasSelection } from '../hooks/useCanvasSelection';
import { useCanvasCoordinates } from '../hooks/useCanvasCoordinates';


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

    isChatOpen,
    isInteracting = false,
    setIsComponentDragging
}) => {
    // Standardized coordinates
    const { screenToCanvas } = useCanvasCoordinates({ position, scale });

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
        selectedScriptFrameModalIds, setSelectedScriptFrameModalIds,
        selectedSceneFrameModalIds, setSelectedSceneFrameModalIds,
        contextMenuPosition, contextMenuModalType, contextMenuOpen, setContextMenuOpen,
        setSelectionOrder,
    } = canvasSelection;

    // --- VIEWPORT-BASED VIRTUALIZATION ---
    const { x: viewX, y: viewY } = screenToCanvas({ x: 0, y: 0 });
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
        const filtered = imageModalStates.filter((m: any) =>
            isRectInViewport(
                m.x,
                m.y,
                m.width ?? m.frameWidth ?? 600,
                m.height ?? m.frameHeight ?? 400,
            )
        );

        // Smart Memoization: Only update reference if the set of visible items actually changed.
        // During panning, the world coordinates of items don't change, only the viewport does.
        // So unless an item enters/exits the viewport, the list of visible items (by reference) remains identical.
        const prev = prevVirtualizedImageRef.current;
        if (prev.length === filtered.length) {
            let hasChanged = false;
            for (let i = 0; i < prev.length; i++) {
                if (prev[i] !== filtered[i]) {
                    hasChanged = true;
                    break;
                }
            }
            if (!hasChanged) return prev;
        }

        prevVirtualizedImageRef.current = filtered;
        return filtered;
    }, [imageModalStates, viewportBounds.minX, viewportBounds.minY, viewportBounds.maxX, viewportBounds.maxY]);

    const virtualizedVideoModalStates = useMemo(() => {
        const filtered = videoModalStates.filter((m: any) =>
            isRectInViewport(
                m.x,
                m.y,
                m.frameWidth ?? 600,
                m.frameHeight ?? 400,
            )
        );

        const prev = prevVirtualizedVideoRef.current;
        if (prev.length === filtered.length) {
            let hasChanged = false;
            for (let i = 0; i < prev.length; i++) {
                if (prev[i] !== filtered[i]) {
                    hasChanged = true;
                    break;
                }
            }
            if (!hasChanged) return prev;
        }

        prevVirtualizedVideoRef.current = filtered;
        return filtered;
    }, [videoModalStates, viewportBounds.minX, viewportBounds.minY, viewportBounds.maxX, viewportBounds.maxY]);

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
                scriptFrameModalStates={scriptFrameModalStates}
                sceneFrameModalStates={sceneFrameModalStates}
                imageModalStates={virtualizedImageModalStates}
                videoModalStates={virtualizedVideoModalStates}

                // Connections
                connections={canvasState.connections}
                onConnectionsChange={props.onConnectionsChange}
                onPersistConnectorCreate={props.onPersistConnectorCreate}
                onPersistConnectorDelete={props.onPersistConnectorDelete}
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
