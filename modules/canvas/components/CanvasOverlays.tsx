
import React from 'react';
import { CanvasProps, CanvasItemsData } from '../types';
import { useCanvasState } from '../hooks/useCanvasState';
import { useCanvasSelection } from '../hooks/useCanvasSelection';
import { ModalOverlays } from '@/modules/canvas-overlays';
import { CanvasImageConnectionNodes } from '../CanvasImageConnectionNodes';
import { ContextMenu } from '@/modules/ui-global/ContextMenu';
import { SettingsPopup } from '@/modules/ui-global/Settings';
// import { ComponentCreationMenu } from '../../canvas-overlays/components/ComponentCreationMenu';
// import { UnifiedCanvasOverlay } from '@/modules/canvas-overlays/UnifiedCanvasOverlay';
// import { LoadingOverlay } from '@/modules/ui-global/LoadingOverlay';
import Konva from 'konva';

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
    activeGenerationCount
}) => {
    const {
        images,
        textInputStates, setTextInputStates,
        imageModalStates, setImageModalStates,
        videoModalStates, setVideoModalStates,
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
        clearAllSelections,
        selectedImageIndices, setSelectedImageIndices,
        selectedTextInputIds, setSelectedTextInputIds, setSelectedTextInputId, selectedTextInputId,
        selectedImageModalIds, setSelectedImageModalIds, setSelectedImageModalId, selectedImageModalId,
        selectedVideoModalIds, setSelectedVideoModalIds, setSelectedVideoModalId, selectedVideoModalId,
        selectedVideoEditorModalIds, setSelectedVideoEditorModalIds, setSelectedVideoEditorModalId, selectedVideoEditorModalId,
        selectedMusicModalIds, setSelectedMusicModalIds, setSelectedMusicModalId, selectedMusicModalId,
        selectedUpscaleModalIds, setSelectedUpscaleModalIds, setSelectedUpscaleModalId, selectedUpscaleModalId,
        selectedMultiangleCameraModalIds, setSelectedMultiangleCameraModalIds, setSelectedMultiangleCameraModalId, selectedMultiangleCameraModalId,
        selectedRemoveBgModalIds, setSelectedRemoveBgModalIds, setSelectedRemoveBgModalId, selectedRemoveBgModalId,
        selectedEraseModalIds, setSelectedEraseModalIds, setSelectedEraseModalId, selectedEraseModalId,
        selectedExpandModalIds, setSelectedExpandModalIds, setSelectedExpandModalId, selectedExpandModalId,
        selectedVectorizeModalIds, setSelectedVectorizeModalIds, setSelectedVectorizeModalId, selectedVectorizeModalId,
        selectedNextSceneModalIds, setSelectedNextSceneModalIds, setSelectedNextSceneModalId, selectedNextSceneModalId,
        selectedCompareModalIds, setSelectedCompareModalIds, setSelectedCompareModalId, selectedCompareModalId,
        selectedStoryboardModalIds, setSelectedStoryboardModalIds, setSelectedStoryboardModalId, selectedStoryboardModalId,
        selectedScriptFrameModalIds, setSelectedScriptFrameModalIds,
        selectedSceneFrameModalIds, setSelectedSceneFrameModalIds,
    } = canvasSelection;

    const {
        onPersistImageModalCreate, onPersistImageModalMove, onPersistImageModalDelete,
        onPersistVideoModalCreate, onPersistVideoModalMove, onPersistVideoModalDelete,
        onPersistVideoEditorModalMove,
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

            <CanvasImageConnectionNodes
                images={images}
                stageRef={stageRef}
                position={position}
                scale={scale}
                selectedImageIndices={selectedImageIndices}
            />

            <ModalOverlays
                stageRef={stageRef as any}
                scale={scale}
                position={position}
                textInputStates={textInputStates}
                imageModalStates={imageModalStates}
                videoModalStates={videoModalStates}
                videoEditorModalStates={videoEditorModalStates}
                musicModalStates={musicModalStates}
                upscaleModalStates={upscaleModalStates}
                isComponentDraggable={isComponentDraggable}
                multiangleCameraModalStates={multiangleCameraModalStates}
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

                selectedMultiangleCameraModalId={selectedMultiangleCameraModalId}
                selectedMultiangleCameraModalIds={selectedMultiangleCameraModalIds}
                setMultiangleCameraModalStates={setMultiangleCameraModalStates}
                setSelectedMultiangleCameraModalId={setSelectedMultiangleCameraModalId}
                setSelectedMultiangleCameraModalIds={setSelectedMultiangleCameraModalIds}
                onPersistMultiangleCameraModalCreate={onPersistMultiangleCameraModalCreate}
                onPersistMultiangleCameraModalMove={onPersistMultiangleCameraModalMove}
                onPersistMultiangleCameraModalDelete={onPersistMultiangleCameraModalDelete}
                onMultiangleCamera={props.onMultiangleCamera}

                selectedTextInputId={selectedTextInputId}
                selectedTextInputIds={selectedTextInputIds}
                selectedImageModalId={selectedImageModalId}
                selectedImageModalIds={selectedImageModalIds}
                selectedVideoModalId={selectedVideoModalId}
                selectedVideoModalIds={selectedVideoModalIds}
                selectedVideoEditorModalId={selectedVideoEditorModalId}
                selectedVideoEditorModalIds={selectedVideoEditorModalIds}
                selectedMusicModalId={selectedMusicModalId}
                selectedMusicModalIds={selectedMusicModalIds}
                selectedUpscaleModalId={selectedUpscaleModalId}
                selectedUpscaleModalIds={selectedUpscaleModalIds}
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

                clearAllSelections={clearAllSelections}
                setTextInputStates={setTextInputStates}
                setSelectedTextInputId={setSelectedTextInputId}
                setSelectedTextInputIds={setSelectedTextInputIds}
                setSelectedImageIndices={setSelectedImageIndices}
                setImageModalStates={setImageModalStates}
                setSelectedImageModalId={setSelectedImageModalId}
                setSelectedImageModalIds={setSelectedImageModalIds}
                setVideoModalStates={setVideoModalStates}
                setSelectedVideoModalId={setSelectedVideoModalId}
                setSelectedVideoModalIds={setSelectedVideoModalIds}
                setVideoEditorModalStates={setVideoEditorModalStates}
                setSelectedVideoEditorModalId={setSelectedVideoEditorModalId}
                setSelectedVideoEditorModalIds={setSelectedVideoEditorModalIds}
                setMusicModalStates={setMusicModalStates}
                setSelectedMusicModalId={setSelectedMusicModalId}
                setSelectedMusicModalIds={setSelectedMusicModalIds}
                setUpscaleModalStates={setUpscaleModalStates}
                setSelectedUpscaleModalId={setSelectedUpscaleModalId}
                setSelectedUpscaleModalIds={setSelectedUpscaleModalIds}
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

            {/* <UnifiedCanvasOverlay
                imageModalStates={imageModalStates}
                setTextInputStates={setTextInputStates}
                setImageModalStates={setImageModalStates}
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

            {activeGenerationCount > 0 && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium z-50">
                    Generating ({activeGenerationCount})...
                </div>
            )}
        </>
    );
};
