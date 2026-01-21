import { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasProps } from '../types';
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
        externalImageEditorModals,
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
        richTextStates, // Added from props
        setRichTextStates, // Added from props
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

    // Local state for rich text (fallback if props not provided)
    const [localRichTextStates, setLocalRichTextStates] = useState<CanvasTextState[]>([]);
    const effectiveRichTextStates = richTextStates ?? localRichTextStates;
    const effectiveSetRichTextStates = setRichTextStates ?? setLocalRichTextStates;

    const handleCanvasTextUpdate = useCallback((id: string, updates: Partial<CanvasTextState>) => {
        effectiveSetCanvasTextStates((prev: CanvasTextState[]) => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }, [effectiveSetCanvasTextStates]);

    const handleRichTextUpdate = useCallback((id: string, updates: any) => {
        effectiveSetRichTextStates((prev: any[]) => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }, [effectiveSetRichTextStates]);



    const [patternImage, setPatternImage] = useState<HTMLImageElement | null>(null);
    const [textInputStates, setTextInputStates] = useState<Array<{ id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }>>([]);
    const [imageModalStates, setImageModalStates] = useState<Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; sourceImageUrl?: string | null; isGenerating?: boolean }>>([]);
    const [videoModalStates, setVideoModalStates] = useState<Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; duration?: number; resolution?: string; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>([]);
    const [videoEditorModalStates, setVideoEditorModalStates] = useState<Array<{ id: string; x: number; y: number }>>([]);
    const [imageEditorModalStates, setImageEditorModalStates] = useState<Array<{ id: string; x: number; y: number }>>([]);
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
    useEffect(() => { if (externalImageEditorModals) setImageEditorModalStates(externalImageEditorModals as any); }, [externalImageEditorModals]);
    useEffect(() => { if (externalMusicModals) setMusicModalStates(externalMusicModals as any); }, [externalMusicModals]);
    useEffect(() => { if (externalUpscaleModals) setUpscaleModalStates(externalUpscaleModals as any); }, [externalUpscaleModals]);
    useEffect(() => { 
      if (externalMultiangleCameraModals) {
        setMultiangleCameraModalStates(prev => {
          // Create a map of external modals by id
          const externalMap = new Map(externalMultiangleCameraModals.map((m: any) => [m.id, m]));
          
          // Update existing modals with external data (position is source of truth from store)
          const updated = prev.map(local => {
            const external = externalMap.get(local.id);
            if (external) {
              // Use external as base (has correct position from store), but preserve local-only state
              return {
                ...external,
                // Preserve isExpanded if it exists locally (UI state that might not be in store)
                ...(local.isExpanded !== undefined ? { isExpanded: local.isExpanded } : {}),
              };
            }
            return local;
          });
          
          // Add any new external modals that aren't in local state
          const newModals = externalMultiangleCameraModals.filter((ext: any) => !prev.some(local => local.id === ext.id));
          
          return [...updated, ...newModals];
        });
      }
    }, [externalMultiangleCameraModals]);
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

    useEffect(() => { if (initialGroupContainerStates) setGroupContainerStates(initialGroupContainerStates); }, [initialGroupContainerStates]);

    // --- EFFECTIVE STATES (No longer needed to mask, but we'll use local state as source of truth now) ---

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
        imageEditorModalStates, setImageEditorModalStates,
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
        richTextStates: effectiveRichTextStates,
        setRichTextStates: effectiveSetRichTextStates,
        effectiveRichTextStates,
        effectiveSetRichTextStates,

        // Canvas Text (Effective)
        effectiveCanvasTextStates,
        effectiveSetCanvasTextStates,
        localCanvasTextStates,
        setLocalCanvasTextStates,
        effectiveSelectedCanvasTextId,
        effectiveSetSelectedCanvasTextId,
        handleCanvasTextUpdate,
        handleRichTextUpdate,
        isTextInteracting,
        setIsTextInteracting,
    };
}
