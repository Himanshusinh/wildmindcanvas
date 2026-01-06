
import { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasProps } from '../types';
import { useCanvasHistory, CanvasHistoryState } from '@/core/hooks/useCanvasHistory';
import { ImageUpload } from '@/core/types/canvas';
import { CanvasTextState, CompareModalState, ScriptFrameModalState } from '@/modules/canvas-overlays/types';
import { GroupContainerState } from '@/core/types/groupContainer';
import { StoryWorld } from '@/core/types/storyWorld';
import { setCurrentSnapshot } from '@/core/api/canvasApi';
import { buildSnapshotElements } from '@/modules/utils/buildSnapshotElements';
import { CanvasAppState } from '@/modules/canvas-app/types';

export function useCanvasState(props: CanvasProps) {
    const {
        images,
        canvasTextStates,
        setCanvasTextStates,
        connections,
        onConnectionsChange,
        onImageUpdate,
        externalImageModals,
        externalVideoModals,
        externalVideoEditorModals,
        externalMusicModals,
        externalUpscaleModals,
        externalMultiangleCameraModals,
        compareModalStates: externalCompareModals, // Corrected naming
        externalRemoveBgModals,
        externalEraseModals,
        externalExpandModals,
        externalVectorizeModals,
        externalNextSceneModals,
        externalStoryboardModals,
        externalScriptFrameModals,
        externalSceneFrameModals,
        externalTextModals,
        initialGroupContainerStates,
        projectId,
    } = props;

    // Local state for canvas text (fallback if props not provided)
    const [localCanvasTextStates, setLocalCanvasTextStates] = useState<CanvasTextState[]>([]);

    // Use props if provided, otherwise use local state
    const effectiveCanvasTextStates = canvasTextStates ?? localCanvasTextStates;
    const effectiveSetCanvasTextStates = setCanvasTextStates ?? setLocalCanvasTextStates;

    const [selectedCanvasTextId, setSelectedCanvasTextId] = useState<string | null>(null);
    const [isTextInteracting, setIsTextInteracting] = useState(false);
    const effectiveSelectedCanvasTextId = selectedCanvasTextId;
    const effectiveSetSelectedCanvasTextId = setSelectedCanvasTextId;

    // Local state for rich text
    const [localRichTextStates, setLocalRichTextStates] = useState<CanvasTextState[]>([]);
    const effectiveRichTextStates = props.richTextStates ?? localRichTextStates;
    const effectiveSetRichTextStates = props.setRichTextStates ?? setLocalRichTextStates;

    const [localSelectedRichTextId, setLocalSelectedRichTextId] = useState<string | null>(null);
    const effectiveSelectedRichTextId = props.selectedRichTextId !== undefined ? props.selectedRichTextId : localSelectedRichTextId;
    const effectiveSetSelectedRichTextId = props.setSelectedRichTextId ?? setLocalSelectedRichTextId;

    const handleCanvasTextUpdate = useCallback((id: string, updates: Partial<CanvasTextState>) => {
        effectiveSetCanvasTextStates((prev: CanvasTextState[]) => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }, [effectiveSetCanvasTextStates]);

    const handleRichTextUpdate = useCallback((id: string, updates: Partial<CanvasTextState>) => {
        effectiveSetRichTextStates((prev: CanvasTextState[]) => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }, [effectiveSetRichTextStates]);

    const [patternImage, setPatternImage] = useState<HTMLImageElement | null>(null);
    const [textInputStates, setTextInputStates] = useState<Array<{ id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }>>([]);
    const [imageModalStates, setImageModalStates] = useState<Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; sourceImageUrl?: string | null; isGenerating?: boolean }>>([]);
    const [videoModalStates, setVideoModalStates] = useState<Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; duration?: number; resolution?: string; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>([]);
    const [videoEditorModalStates, setVideoEditorModalStates] = useState<Array<{ id: string; x: number; y: number }>>([]);
    const [musicModalStates, setMusicModalStates] = useState<import('../types').MusicGenerator[]>([]);
    const [upscaleModalStates, setUpscaleModalStates] = useState<Array<{ id: string; x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number; isUpscaling?: boolean; isExpanded?: boolean }>>([]);
    const [multiangleCameraModalStates, setMultiangleCameraModalStates] = useState<Array<{ id: string; x: number; y: number; sourceImageUrl?: string | null; isExpanded?: boolean }>>([]);
    const [removeBgModalStates, setRemoveBgModalStates] = useState<Array<{ id: string; x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isRemovingBg?: boolean; isExpanded?: boolean }>>([]);
    const [eraseModalStates, setEraseModalStates] = useState<Array<{ id: string; x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isErasing?: boolean; isExpanded?: boolean }>>([]);
    const [expandModalStates, setExpandModalStates] = useState<Array<{ id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isExpanding?: boolean; isExpanded?: boolean }>>([]);
    const [vectorizeModalStates, setVectorizeModalStates] = useState<Array<{ id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean; isExpanded?: boolean }>>([]);
    const [nextSceneModalStates, setNextSceneModalStates] = useState<Array<{ id: string; x: number; y: number; nextSceneImageUrl?: string | null; sourceImageUrl?: string | null; localNextSceneImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isProcessing?: boolean; isExpanded?: boolean }>>([]);

    const [storyboardModalStates, setStoryboardModalStates] = useState<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null; characterNamesMap?: Record<number, string>; propsNamesMap?: Record<number, string>; backgroundNamesMap?: Record<number, string>; namedImages?: { characters?: Record<string, string>; backgrounds?: Record<string, string>; props?: Record<string, string> }; stitchedImageUrl?: string }>>([]);
    const [scriptFrameModalStates, setScriptFrameModalStates] = useState<ScriptFrameModalState[]>([]);
    const [sceneFrameModalStates, setSceneFrameModalStates] = useState<Array<{ id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string; characterIds?: string[]; locationId?: string; mood?: string }>>([]);
    const [storyWorldStates, setStoryWorldStates] = useState<Array<{ storyboardId: string; storyWorld: StoryWorld }>>([]);

    // Group Container state - stores groups of canvas items
    const [groupContainerStates, setGroupContainerStates] = useState<GroupContainerState[]>(initialGroupContainerStates || []);

    // Compare Plugin
    const [compareModalStates, setCompareModalStates] = useState<CompareModalState[]>([]);

    // --- SYNC PROPS TO LOCAL STATE (For Controlled Flow) ---
    useEffect(() => { if (externalImageModals) setImageModalStates(externalImageModals as any); }, [externalImageModals]);
    useEffect(() => { if (externalVideoModals) setVideoModalStates(externalVideoModals as any); }, [externalVideoModals]);
    useEffect(() => { if (externalVideoEditorModals) setVideoEditorModalStates(externalVideoEditorModals); }, [externalVideoEditorModals]);
    useEffect(() => { if (externalMusicModals) setMusicModalStates(externalMusicModals as any); }, [externalMusicModals]);
    useEffect(() => { if (externalUpscaleModals) setUpscaleModalStates(externalUpscaleModals as any); }, [externalUpscaleModals]);
    useEffect(() => { if (externalMultiangleCameraModals) setMultiangleCameraModalStates(externalMultiangleCameraModals as any); }, [externalMultiangleCameraModals]);
    useEffect(() => { if (externalCompareModals) setCompareModalStates(externalCompareModals); }, [externalCompareModals]);
    useEffect(() => { if (externalRemoveBgModals) setRemoveBgModalStates(externalRemoveBgModals as any); }, [externalRemoveBgModals]);
    useEffect(() => { if (externalEraseModals) setEraseModalStates(externalEraseModals as any); }, [externalEraseModals]);
    useEffect(() => { if (externalExpandModals) setExpandModalStates(externalExpandModals as any); }, [externalExpandModals]);
    useEffect(() => { if (externalVectorizeModals) setVectorizeModalStates(externalVectorizeModals as any); }, [externalVectorizeModals]);
    useEffect(() => { if (externalNextSceneModals) setNextSceneModalStates(externalNextSceneModals as any); }, [externalNextSceneModals]);
    useEffect(() => { if (externalStoryboardModals) setStoryboardModalStates(externalStoryboardModals as any); }, [externalStoryboardModals]);
    useEffect(() => { if (externalScriptFrameModals) setScriptFrameModalStates(externalScriptFrameModals); }, [externalScriptFrameModals]);
    useEffect(() => { if (externalSceneFrameModals) setSceneFrameModalStates(externalSceneFrameModals as any); }, [externalSceneFrameModals]);
    useEffect(() => { if (externalTextModals) setTextInputStates(externalTextModals as any); }, [externalTextModals]);
    useEffect(() => { if (props.richTextStates) setLocalRichTextStates(props.richTextStates); }, [props.richTextStates]);
    useEffect(() => { if (initialGroupContainerStates) setGroupContainerStates(initialGroupContainerStates); }, [initialGroupContainerStates]);

    // --- EFFECTIVE STATES (No longer needed to mask, but we'll use local state as source of truth now) ---

    // --- HISTORY MANAGEMENT ---
    const isRestoring = useRef(false);

    const getCurrentState = useCallback((): CanvasHistoryState => ({
        images: images || [],
        canvasTextStates: effectiveCanvasTextStates,
        richTextStates: effectiveRichTextStates,
        textInputStates: textInputStates as any,
        imageModalStates: imageModalStates as any,
        videoModalStates: videoModalStates as any,
        musicModalStates: musicModalStates as any,
        storyboardModalStates,
        scriptFrameModalStates,
        sceneFrameModalStates: sceneFrameModalStates as any,
        groupContainerStates,
        connections: connections || [],
        upscaleModalStates: upscaleModalStates as any,
        multiangleCameraModalStates: multiangleCameraModalStates as any,
        removeBgModalStates: removeBgModalStates as any,
        eraseModalStates: eraseModalStates as any,
        expandModalStates: expandModalStates as any,
        vectorizeModalStates: vectorizeModalStates as any,
        nextSceneModalStates: nextSceneModalStates as any,
        videoEditorModalStates,
        storyWorldStates,
    }), [
        images, effectiveCanvasTextStates, effectiveRichTextStates, textInputStates, imageModalStates,
        videoModalStates, musicModalStates, storyboardModalStates,
        scriptFrameModalStates, sceneFrameModalStates, groupContainerStates, connections,
        upscaleModalStates, multiangleCameraModalStates, removeBgModalStates,
        eraseModalStates, expandModalStates, vectorizeModalStates,
        nextSceneModalStates, videoEditorModalStates, storyWorldStates
    ]);

    const handleRestore = useCallback((state: CanvasHistoryState) => {
        isRestoring.current = true;

        // Restore local states
        effectiveSetCanvasTextStates(state.canvasTextStates || []);
        effectiveSetRichTextStates((state as any).richTextStates || []);
        setImageModalStates(state.imageModalStates || []);
        setVideoModalStates(state.videoModalStates || []);
        setMusicModalStates(state.musicModalStates || []);
        setTextInputStates(state.textInputStates || []);
        setStoryboardModalStates(state.storyboardModalStates || []);
        setScriptFrameModalStates(state.scriptFrameModalStates || []);
        setSceneFrameModalStates(state.sceneFrameModalStates || []);
        setGroupContainerStates(state.groupContainerStates || []);
        setUpscaleModalStates(state.upscaleModalStates || []);
        setRemoveBgModalStates(state.removeBgModalStates || []);
        setEraseModalStates(state.eraseModalStates || []);
        setExpandModalStates(state.expandModalStates || []);
        setVectorizeModalStates(state.vectorizeModalStates || []);
        setNextSceneModalStates(state.nextSceneModalStates || []);
        setVideoEditorModalStates(state.videoEditorModalStates || []);
        setStoryWorldStates(state.storyWorldStates || []);

        if (onConnectionsChange && state.connections) {
            onConnectionsChange(state.connections);
        }

        // Reconcile 'images' prop - skipped for now due to type mismatch
        // (Existing logic commented out in Canvas.tsx)

        // Reset restoring flag after a tick
        setTimeout(() => {
            isRestoring.current = false;
        }, 100);

        // PERSISTENCE FIX:
        // Update the backend snapshot immediately so that if the user refreshes,
        // the undone/redone state is loaded instead of the previous state.
        if (projectId) {
            try {
                // Map History State to App State for snapshot building
                // Note: We use 'state' (history) for tracked items, and current scope variables for untracked items
                // to avoid deleting untracked items from the snapshot.
                const appState: CanvasAppState = {
                    images: state.images || [],
                    imageGenerators: state.imageModalStates || [],
                    videoGenerators: state.videoModalStates || [],
                    videoEditorGenerators: state.videoEditorModalStates || [],
                    musicGenerators: state.musicModalStates || [],
                    upscaleGenerators: state.upscaleModalStates || [],
                    multiangleCameraGenerators: state.multiangleCameraModalStates || [],
                    removeBgGenerators: state.removeBgModalStates || [],
                    eraseGenerators: state.eraseModalStates || [],
                    expandGenerators: state.expandModalStates || [],
                    vectorizeGenerators: state.vectorizeModalStates || [],
                    nextSceneGenerators: state.nextSceneModalStates || [],
                    compareGenerators: compareModalStates as any || [], // Untracked in history, use current
                    storyboardGenerators: state.storyboardModalStates || [],
                    scriptFrameGenerators: state.scriptFrameModalStates || [],
                    sceneFrameGenerators: state.sceneFrameModalStates || [],
                    textGenerators: state.textInputStates as any || [],
                    canvasTextStates: state.canvasTextStates || [],
                    richTextStates: state.richTextStates || [],
                    groupContainerStates: state.groupContainerStates || [],
                    connectors: state.connections || [],
                    generationQueue: [], // Untracked
                };

                // Generate elements map
                const elements = buildSnapshotElements(appState, state.connections);

                // Persist to backend
                setCurrentSnapshot(projectId, {
                    elements,
                    metadata: {
                        updatedBy: 'undo-redo',
                        timestamp: Date.now()
                    }
                }).catch(err => console.error('[useCanvasState] Snapshot persist failed:', err));

            } catch (err) {
                console.error('[useCanvasState] Error preparing snapshot persist:', err);
            }
        }
    }, [
        effectiveSetCanvasTextStates, onConnectionsChange, projectId,
        compareModalStates // Add dependency for untracked state
    ]);

    const { record, undo, redo, canUndo, canRedo } = useCanvasHistory(
        {
            images: images || [],
            canvasTextStates: effectiveCanvasTextStates,
            richTextStates: effectiveRichTextStates,
            textInputStates,
            imageModalStates,
            videoModalStates,
            musicModalStates,
            storyboardModalStates,
            scriptFrameModalStates,
            sceneFrameModalStates,
            groupContainerStates,
            connections: connections || [],
            upscaleModalStates,
            multiangleCameraModalStates,
            removeBgModalStates,
            eraseModalStates,
            expandModalStates,
            vectorizeModalStates,
            nextSceneModalStates,
            videoEditorModalStates,
            storyWorldStates
        },
        handleRestore
    );

    // Auto-record history on state changes
    useEffect(() => {
        if (!isRestoring.current) {
            const timer = setTimeout(() => {
                if (!isRestoring.current) {
                    record(getCurrentState());
                }
            }, 300); // 300ms debounce
            return () => clearTimeout(timer);
        }
    }, [
        images, effectiveCanvasTextStates, effectiveRichTextStates, textInputStates, imageModalStates,
        videoModalStates, musicModalStates, storyboardModalStates,
        scriptFrameModalStates, sceneFrameModalStates, connections,
        upscaleModalStates, removeBgModalStates, eraseModalStates,
        expandModalStates, vectorizeModalStates, nextSceneModalStates,
        videoEditorModalStates, storyWorldStates,
        record, getCurrentState
    ]);

    return {
        // Props Proxies
        images: images || [],
        connections: connections || [],

        // State
        patternImage, setPatternImage,
        textInputStates: textInputStates as any, setTextInputStates,
        imageModalStates: imageModalStates as any, setImageModalStates,
        videoModalStates: videoModalStates as any, setVideoModalStates,
        videoEditorModalStates, setVideoEditorModalStates,
        musicModalStates: musicModalStates as any, setMusicModalStates,
        upscaleModalStates: upscaleModalStates as any, setUpscaleModalStates,
        multiangleCameraModalStates: multiangleCameraModalStates as any, setMultiangleCameraModalStates,
        removeBgModalStates: removeBgModalStates as any, setRemoveBgModalStates,
        eraseModalStates: eraseModalStates as any, setEraseModalStates,
        expandModalStates: expandModalStates as any, setExpandModalStates,
        vectorizeModalStates: vectorizeModalStates as any, setVectorizeModalStates,
        nextSceneModalStates: nextSceneModalStates as any, setNextSceneModalStates,
        storyboardModalStates: storyboardModalStates as any, setStoryboardModalStates,
        scriptFrameModalStates, setScriptFrameModalStates,
        sceneFrameModalStates: sceneFrameModalStates as any, setSceneFrameModalStates,
        groupContainerStates, setGroupContainerStates,
        compareModalStates, setCompareModalStates,
        storyWorldStates, setStoryWorldStates,

        // Canvas Text (Effective)
        effectiveCanvasTextStates,
        effectiveSetCanvasTextStates,
        localCanvasTextStates,
        setLocalCanvasTextStates,
        effectiveSelectedCanvasTextId,
        effectiveSetSelectedCanvasTextId,
        handleCanvasTextUpdate,
        isTextInteracting,
        setIsTextInteracting,

        // Rich Text
        effectiveRichTextStates,
        effectiveSetRichTextStates,
        selectedRichTextId: effectiveSelectedRichTextId,
        setSelectedRichTextId: effectiveSetSelectedRichTextId,
        handleRichTextUpdate,

        // History
        record, undo, redo, canUndo, canRedo, getCurrentState
    };
}
