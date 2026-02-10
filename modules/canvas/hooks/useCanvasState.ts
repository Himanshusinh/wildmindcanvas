import { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasProps } from '../types';
import { ImageUpload } from '@/core/types/canvas';
import { CanvasTextState, CompareModalState, ScriptFrameModalState } from '@/modules/canvas-overlays/types';
import { GroupContainerState } from '@/core/types/groupContainer';
import { StoryWorld } from '@/core/types/storyWorld';
import { setCurrentSnapshot } from '@/core/api/canvasApi';
import { buildSnapshotElements } from '@/modules/utils/buildSnapshotElements';
import { CanvasAppState } from '@/modules/canvas-app/types';
// Zustand Store - Image & Video State Management
import {
  useImageStore,
  useVideoStore,
  useMusicStore,
  useUpscaleStore,
  useMultiangleCameraStore,
  useRemoveBgStore,
  useEraseStore,
  useExpandStore,
  useVectorizeStore,
  useImageEditorStore,
  useNextSceneStore,
  useStoryboardStore,
  useVideoEditorStore,
  useCompareStore,
  useTextStore
} from '@/modules/stores';

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
  // const [videoModalStates, setVideoModalStates] = useState<Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; duration?: number; resolution?: string; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>([]);
  // REMOVED: local state migrated to store
  // const [videoEditorModalStates, setVideoEditorModalStates] = useState<Array<{ id: string; x: number; y: number }>>([]);
  // REMOVED: local state migrated to useImageEditorStore
  // const [imageEditorModalStates, setImageEditorModalStates] = useState<Array<{ id: string; x: number; y: number }>>([]);

  // REMOVED: upscaleModalStates (now managed by useUpscaleStore)
  // const [upscaleModalStates, setUpscaleModalStates] = useState<Array<{ id: string; x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number; isUpscaling?: boolean; isExpanded?: boolean }>>([]);
  // REMOVED: multiangleCameraModalStates (now managed by useMultiangleCameraStore)
  // const [multiangleCameraModalStates, setMultiangleCameraModalStates] = useState<Array<{ id: string; x: number; y: number; sourceImageUrl?: string | null; isExpanded?: boolean }>>([]);
  // REMOVED: removeBgModalStates (now managed by store)
  // const [removeBgModalStates, setRemoveBgModalStates] = useState<Array<{ id: string; x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isRemovingBg?: boolean; isExpanded?: boolean }>>([]);
  // REMOVED: eraseModalStates, setEraseModalStates (via store)
  // REMOVED: expandModalStates, setExpandModalStates (via store)
  // const [expandModalStates, setExpandModalStates] = useState<Array<{ id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isExpanding?: boolean; isExpanded?: boolean }>>([]);
  // REMOVED: local state migrated to store
  // const [vectorizeModalStates, setVectorizeModalStates] = useState<Array<{ id: string; x: number; y: number; vectorizeImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizeImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean; isExpanded?: boolean }>>([]);
  // REMOVED: local state migrated to store
  // const [nextSceneModalStates, setNextSceneModalStates] = useState<Array<{ id: string; x: number; y: number; nextSceneImageUrl?: string | null; sourceImageUrl?: string | null; localNextSceneImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isProcessing?: boolean; isExpanded?: boolean }>>([]);

  // REMOVED: local state migrated to store
  // const [storyboardModalStates, setStoryboardModalStates] = useState<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null; characterNamesMap?: Record<number, string>; propsNamesMap?: Record<number, string>; backgroundNamesMap?: Record<number, string>; namedImages?: { characters?: Record<string, string>; backgrounds?: Record<string, string>; props?: Record<string, string> }; stitchedImageUrl?: string }>>([]);
  const [scriptFrameModalStates, setScriptFrameModalStates] = useState<ScriptFrameModalState[]>([]);
  const [sceneFrameModalStates, setSceneFrameModalStates] = useState<Array<{ id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string; characterIds?: string[]; locationId?: string; mood?: string }>>([]);
  const [storyWorldStates, setStoryWorldStates] = useState<Array<{ storyboardId: string; storyWorld: StoryWorld }>>([]);

  // Group Container state - stores groups of canvas items
  const [groupContainerStates, setGroupContainerStates] = useState<GroupContainerState[]>(initialGroupContainerStates || []);

  // Compare Plugin
  // REMOVED: local state migrated to store
  // const [compareModalStates, setCompareModalStates] = useState<CompareModalState[]>([]);

  // --- SYNC PROPS TO ZUSTAND STORE (For Controlled Flow) ---
  // Sync externalImageModals to Zustand store instead of local state
  // Sync image modals
  const setImageModalStatesInStore = useImageStore(state => state.setImageModalStates);
  useEffect(() => { if (externalImageModals) setImageModalStatesInStore(externalImageModals as any); }, [externalImageModals, setImageModalStatesInStore]);

  // Sync video modals
  const setVideoModalStatesInStore = useVideoStore(state => state.setVideoModalStates);
  useEffect(() => { if (externalVideoModals) setVideoModalStatesInStore(externalVideoModals as any); }, [externalVideoModals, setVideoModalStatesInStore]);

  // Sync video editor modals
  const setVideoEditorModalStatesInStore = useVideoEditorStore(state => state.setVideoEditorModalStates);
  useEffect(() => { if (externalVideoEditorModals) setVideoEditorModalStatesInStore(externalVideoEditorModals as any); }, [externalVideoEditorModals, setVideoEditorModalStatesInStore]);

  // Sync music modals
  const setMusicModalStatesInStore = useMusicStore(state => state.setMusicModalStates);
  useEffect(() => { if (externalMusicModals) setMusicModalStatesInStore(externalMusicModals as any); }, [externalMusicModals, setMusicModalStatesInStore]);

  // Sync upscale modals
  const setUpscaleModalStatesInStore = useUpscaleStore(state => state.setUpscaleModalStates);
  useEffect(() => { if (externalUpscaleModals) setUpscaleModalStatesInStore(externalUpscaleModals as any); }, [externalUpscaleModals, setUpscaleModalStatesInStore]);

  // Sync multiangle camera modals
  const setMultiangleCameraModalStatesInStore = useMultiangleCameraStore(state => state.setMultiangleCameraModalStates);
  useEffect(() => { if (externalMultiangleCameraModals) setMultiangleCameraModalStatesInStore(externalMultiangleCameraModals); }, [externalMultiangleCameraModals, setMultiangleCameraModalStatesInStore]);

  // Sync erase modals
  const setEraseModalStatesInStore = useEraseStore(state => state.setEraseModalStates);
  useEffect(() => { if (externalEraseModals) setEraseModalStatesInStore(externalEraseModals as any); }, [externalEraseModals, setEraseModalStatesInStore]);

  // Sync expand modals
  const setExpandModalStatesInStore = useExpandStore(state => state.setExpandModalStates);
  useEffect(() => { if (externalExpandModals) setExpandModalStatesInStore(externalExpandModals as any); }, [externalExpandModals, setExpandModalStatesInStore]);

  // Sync remove bg modals
  const setRemoveBgModalStatesInStore = useRemoveBgStore(state => state.setRemoveBgModalStates);
  useEffect(() => { if (externalRemoveBgModals) setRemoveBgModalStatesInStore(externalRemoveBgModals as any); }, [externalRemoveBgModals, setRemoveBgModalStatesInStore]);

  // Sync vectorize modals
  const setVectorizeModalStatesInStore = useVectorizeStore(state => state.setVectorizeModalStates);
  useEffect(() => { if (externalVectorizeModals) setVectorizeModalStatesInStore(externalVectorizeModals as any); }, [externalVectorizeModals, setVectorizeModalStatesInStore]);

  // Sync next scene modals
  const setNextSceneModalStatesInStore = useNextSceneStore(state => state.setNextSceneModalStates);
  useEffect(() => { if (externalNextSceneModals) setNextSceneModalStatesInStore(externalNextSceneModals as any); }, [externalNextSceneModals, setNextSceneModalStatesInStore]);

  // Sync storyboard modals
  const setStoryboardModalStatesInStore = useStoryboardStore(state => state.setStoryboardModalStates);
  useEffect(() => { if (externalStoryboardModals) setStoryboardModalStatesInStore(externalStoryboardModals as any); }, [externalStoryboardModals, setStoryboardModalStatesInStore]);

  // Sync image editor modals
  const setImageEditorModalStatesInStore = useImageEditorStore(state => state.setImageEditorModalStates);
  useEffect(() => { if (externalImageEditorModals) setImageEditorModalStatesInStore(externalImageEditorModals as any); }, [externalImageEditorModals, setImageEditorModalStatesInStore]);

  // Sync compare modals
  const setCompareModalStatesInStore = useCompareStore(state => state.setCompareModalStates);
  useEffect(() => { if (externalCompareModals) setCompareModalStatesInStore(externalCompareModals as any); }, [externalCompareModals, setCompareModalStatesInStore]);

  // Sync text modals
  const setTextModalStatesInStore = useTextStore(state => state.setTextModalStates);
  useEffect(() => {
    if (externalTextModals) {
      console.log('[useCanvasState] Syncing externalTextModals to store:', externalTextModals.map(m => ({ id: m.id, hasTokens: !!m.smartTokens && m.smartTokens.length > 0, tokensCount: m.smartTokens?.length, textLen: m.value?.length })));
      setTextModalStatesInStore(externalTextModals);
    }
  }, [externalTextModals, setTextModalStatesInStore]);

  // Get current states from stores for return
  const imageModalStatesInStore = useImageStore(state => state.imageModalStates);
  const videoModalStatesInStore = useVideoStore(state => state.videoModalStates);
  const videoEditorModalStatesInStore = useVideoEditorStore(state => state.videoEditorModalStates);
  const musicModalStatesInStore = useMusicStore(state => state.musicModalStates);
  const upscaleModalStatesInStore = useUpscaleStore(state => state.upscaleModalStates);
  const multiangleCameraModalStatesInStore = useMultiangleCameraStore(state => state.multiangleCameraModalStates);
  const eraseModalStatesInStore = useEraseStore(state => state.eraseModalStates);
  const expandModalStatesInStore = useExpandStore(state => state.expandModalStates);
  const removeBgModalStatesInStore = useRemoveBgStore(state => state.removeBgModalStates);
  const vectorizeModalStatesInStore = useVectorizeStore(state => state.vectorizeModalStates);
  const nextSceneModalStatesInStore = useNextSceneStore(state => state.nextSceneModalStates);
  const storyboardModalStatesInStore = useStoryboardStore(state => state.storyboardModalStates);
  const imageEditorModalStatesInStore = useImageEditorStore(state => state.imageEditorModalStates);
  const compareModalStatesInStore = useCompareStore(state => state.compareModalStates);
  const textModalStatesInStore = useTextStore(state => state.textModalStates);

  // REMOVED: useEffect(() => { if (externalTextModals) setTextInputStates(externalTextModals as any); }, [externalTextModals]);

  useEffect(() => { if (initialGroupContainerStates) setGroupContainerStates(initialGroupContainerStates); }, [initialGroupContainerStates]);

  // --- EFFECTIVE STATES (No longer needed to mask, but we'll use local state as source of truth now) ---

  return {
    // Props Proxies
    images: images || [],
    connections: connections || [],

    // State
    patternImage, setPatternImage,
    textInputStates: textModalStatesInStore,
    setTextInputStates: setTextModalStatesInStore,

    videoEditorModalStates: videoEditorModalStatesInStore,
    setVideoEditorModalStates: setVideoEditorModalStatesInStore,
    imageEditorModalStates: imageEditorModalStatesInStore,
    setImageEditorModalStates: setImageEditorModalStatesInStore,

    // REMOVED: upscaleModalStates, setUpscaleModalStates (now managed by Zustand store)
    // upscaleModalStates: upscaleModalStates as any, setUpscaleModalStates,
    // REMOVED: multiangleCameraModalStates, setMultiangleCameraModalStates (now managed by store)
    // multiangleCameraModalStates,
    // setMultiangleCameraModalStates,
    // REMOVED: removeBgModalStates (now managed by store)
    // removeBgModalStates: removeBgModalStates as any, setRemoveBgModalStates,
    // REMOVED: eraseModalStates: eraseModalStates as any, setEraseModalStates,
    // REMOVED: expandModalStates: expandModalStates as any, setExpandModalStates,
    // REMOVED: vectorizeModalStates: vectorizeModalStates as any, setVectorizeModalStates,
    nextSceneModalStates: nextSceneModalStatesInStore,
    setNextSceneModalStates: setNextSceneModalStatesInStore,
    storyboardModalStates: storyboardModalStatesInStore,
    setStoryboardModalStates: setStoryboardModalStatesInStore,
    scriptFrameModalStates, setScriptFrameModalStates,
    sceneFrameModalStates: sceneFrameModalStates as any, setSceneFrameModalStates,
    groupContainerStates, setGroupContainerStates,
    compareModalStates: compareModalStatesInStore,
    setCompareModalStates: setCompareModalStatesInStore,
    removeBgModalStates: removeBgModalStatesInStore,
    setRemoveBgModalStates: setRemoveBgModalStatesInStore,
    eraseModalStates: eraseModalStatesInStore,
    setEraseModalStates: setEraseModalStatesInStore,
    expandModalStates: expandModalStatesInStore,
    setExpandModalStates: setExpandModalStatesInStore,
    vectorizeModalStates: vectorizeModalStatesInStore,
    setVectorizeModalStates: setVectorizeModalStatesInStore,
    multiangleCameraModalStates: multiangleCameraModalStatesInStore,
    setMultiangleCameraModalStates: setMultiangleCameraModalStatesInStore,
    upscaleModalStates: upscaleModalStatesInStore,
    setUpscaleModalStates: setUpscaleModalStatesInStore,
    musicModalStates: musicModalStatesInStore,
    setMusicModalStates: setMusicModalStatesInStore,
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
