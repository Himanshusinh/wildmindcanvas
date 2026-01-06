
import React from 'react';
import { ImageUpload } from '@/core/types/canvas';
import { CanvasTextState, CompareModalState, ScriptFrameModalState } from '@/modules/canvas-overlays/types';
import { GroupContainerState } from '@/core/types/groupContainer';
import { GenerationQueueItem } from '@/modules/canvas/GenerationQueue';
import { StoryWorld } from '@/core/types/storyWorld';
import { MusicGenerator } from '@/modules/canvas-app/types';
export type { MusicGenerator };

export interface CanvasProps {
    images?: ImageUpload[];
    setImages?: React.Dispatch<React.SetStateAction<ImageUpload[]>>;
    onViewportChange?: (center: { x: number; y: number }, scale: number) => void;
    onImageUpdate?: (index: number, updates: Partial<ImageUpload>) => void;
    onImageDelete?: (index: number) => void;
    onImageDownload?: (index: number) => void;
    onImageDuplicate?: (index: number) => void;
    onBackgroundClick?: () => void;
    initialCenter?: { x: number; y: number };
    initialScale?: number;
    onImagesDrop?: (files: File[]) => void;
    onLibraryMediaDrop?: (media: { id: string; url: string; type: 'image' | 'video' | 'music' | 'uploaded'; thumbnail?: string; prompt?: string; model?: string; createdAt?: string; storagePath?: string; mediaId?: string }, x: number, y: number) => void;
    selectedTool?: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | 'library' | 'plugin' | 'canvas-text' | 'rich-text';
    onToolSelect?: (tool: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | 'library' | 'plugin' | 'canvas-text' | 'rich-text') => void;
    onTextCreate?: (text: string, x: number, y: number) => void;
    toolClickCounter?: number;
    isImageModalOpen?: boolean;
    onImageModalClose?: () => void;
    onImageSelect?: (file: File) => void;
    onImageGenerate?: (
        prompt: string,
        model: string,
        frame: string,
        aspectRatio: string,
        modalId?: string,
        imageCount?: number,
        sourceImageUrl?: string,
        sceneNumber?: number,
        previousSceneImageUrl?: string,
        storyboardMetadata?: Record<string, string>,
        width?: number,
        height?: number,
        options?: Record<string, any>
    ) => Promise<{ url: string; images?: Array<{ url: string }> } | null>;
    generatedImageUrl?: string | null;
    isVideoModalOpen?: boolean;
    onVideoModalClose?: () => void;
    onVideoSelect?: (file: File) => void;
    onVideoGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, duration: number, resolution?: string, modalId?: string, firstFrameUrl?: string, lastFrameUrl?: string) => Promise<{ generationId?: string; taskId?: string; provider?: string } | null>;
    generatedVideoUrl?: string | null;
    isMusicModalOpen?: boolean;
    onMusicModalClose?: () => void;
    onMusicSelect?: (file: File) => void;
    onMusicGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => Promise<string | null>;
    generatedMusicUrl?: string | null;
    onAddImageToCanvas?: (url: string) => void;
    projectId?: string | null;
    externalImageModals?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; sourceImageUrl?: string | null }>;
    externalVideoModals?: Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>;
    externalVideoEditorModals?: Array<{ id: string; x: number; y: number }>;
    externalMusicModals?: MusicGenerator[];
    externalUpscaleModals?: Array<{ id: string; x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number; isUpscaling?: boolean }>;
    externalMultiangleCameraModals?: Array<{ id: string; x: number; y: number; sourceImageUrl?: string | null }>;
    externalCompareModals?: Array<{ id: string; x: number; y: number; width?: number; height?: number; scale?: number }>;
    externalRemoveBgModals?: Array<{ id: string; x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isRemovingBg?: boolean }>;
    externalEraseModals?: Array<{ id: string; x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isErasing?: boolean }>;
    externalExpandModals?: Array<{ id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isExpanding?: boolean }>;
    externalVectorizeModals?: Array<{ id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }>;
    externalNextSceneModals?: Array<{ id: string; x: number; y: number; nextSceneImageUrl?: string | null; sourceImageUrl?: string | null; localNextSceneImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isProcessing?: boolean }>;
    externalStoryboardModals?: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null }>;
    externalScriptFrameModals?: Array<{ id: string; pluginId: string; x: number; y: number; frameWidth: number; frameHeight: number; text: string }>;
    externalSceneFrameModals?: Array<{ id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string }>;
    externalTextModals?: Array<{ id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }>;
    onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; sourceImageUrl?: string | null }) => void | Promise<void>;
    onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; sourceImageUrl?: string | null; isGenerating?: boolean }>) => void | Promise<void>;
    onPersistImageModalDelete?: (id: string) => void | Promise<void>;
    onPersistVideoModalCreate?: (modal: { id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
    onPersistVideoModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
    onPersistVideoModalDelete?: (id: string) => void | Promise<void>;
    onPersistVideoEditorModalCreate?: (modal: { id: string; x: number; y: number }) => void | Promise<void>;
    onPersistVideoEditorModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
    onPersistVideoEditorModalDelete?: (id: string) => void | Promise<void>;
    onOpenVideoEditor?: () => void;
    onPersistMusicModalCreate?: (modal: MusicGenerator) => void | Promise<void>;
    onPersistMusicModalMove?: (id: string, updates: Partial<MusicGenerator>) => void | Promise<void>;
    onPersistMusicModalDelete?: (id: string) => void | Promise<void>;
    // Upscale plugin persistence callbacks
    onPersistUpscaleModalCreate?: (modal: { id: string; x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number; isUpscaling?: boolean }) => void | Promise<void>;
    onPersistUpscaleModalMove?: (id: string, updates: Partial<{ x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number; isUpscaling?: boolean }>) => void | Promise<void>;
    onPersistUpscaleModalDelete?: (id: string) => void | Promise<void>;
    onUpscale?: (model: string, scale: number, sourceImageUrl?: string) => Promise<string | null>;
    // Multiangle Camera plugin persistence callbacks
    onPersistMultiangleCameraModalCreate?: (modal: { id: string; x: number; y: number; sourceImageUrl?: string | null }) => void | Promise<void>;
    onPersistMultiangleCameraModalMove?: (id: string, updates: Partial<{ x: number; y: number; sourceImageUrl?: string | null }>) => void | Promise<void>;
    onPersistMultiangleCameraModalDelete?: (id: string) => void | Promise<void>;
    onMultiangleCamera?: (sourceImageUrl?: string, prompt?: string, loraScale?: number, aspectRatio?: string, moveForward?: number, verticalTilt?: number, rotateDegrees?: number, useWideAngle?: boolean) => Promise<string | null>;
    onPersistRemoveBgModalCreate?: (modal: { id: string; x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isRemovingBg?: boolean }) => void | Promise<void>;
    onPersistRemoveBgModalMove?: (id: string, updates: Partial<{ x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isRemovingBg?: boolean }>) => void | Promise<void>;
    onPersistRemoveBgModalDelete?: (id: string) => void | Promise<void>;
    onRemoveBg?: (model: string, backgroundType: string, scaleValue: number, sourceImageUrl?: string) => Promise<string | null>;
    // Erase plugin persistence callbacks
    onPersistEraseModalCreate?: (modal: { id: string; x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isErasing?: boolean }) => void | Promise<void>;
    onPersistEraseModalMove?: (id: string, updates: Partial<{ x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isErasing?: boolean }>) => void | Promise<void>;
    onPersistEraseModalDelete?: (id: string) => void | Promise<void>;
    onErase?: (model: string, sourceImageUrl?: string, mask?: string) => Promise<string | null>;
    // Replace plugin persistence callbacks
    onPersistExpandModalCreate?: (modal: { id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isExpanding?: boolean }) => void | Promise<void>;
    onPersistExpandModalMove?: (id: string, updates: Partial<{ x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isExpanding?: boolean }>) => void | Promise<void>;
    onPersistExpandModalDelete?: (id: string) => void | Promise<void>;
    onExpand?: (model: string, sourceImageUrl?: string, prompt?: string, canvasSize?: [number, number], originalImageSize?: [number, number], originalImageLocation?: [number, number], aspectRatio?: string) => Promise<string | null>;
    // Vectorize plugin persistence callbacks
    onPersistVectorizeModalCreate?: (modal: { id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }) => void | Promise<void>;
    onPersistVectorizeModalMove?: (id: string, updates: Partial<{ x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }>) => void | Promise<void>;
    onPersistVectorizeModalDelete?: (id: string) => void | Promise<void>;
    // NextScene plugin persistence callbacks
    onPersistNextSceneModalCreate?: (modal: { id: string; x: number; y: number; nextSceneImageUrl?: string | null; sourceImageUrl?: string | null; localNextSceneImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isProcessing?: boolean }) => void | Promise<void>;
    onPersistNextSceneModalMove?: (id: string, updates: Partial<{ x: number; y: number; nextSceneImageUrl?: string | null; sourceImageUrl?: string | null; localNextSceneImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isProcessing?: boolean }>) => void | Promise<void>;
    onPersistNextSceneModalDelete?: (id: string) => void | Promise<void>;
    // Compare plugin persistence callbacks
    onPersistCompareModalCreate?: (modal: { id: string; x: number; y: number; width?: number; height?: number; scale?: number; prompt?: string; model?: string }) => void | Promise<void>;
    onPersistCompareModalMove?: (id: string, updates: Partial<{ x: number; y: number; width?: number; height?: number; scale?: number; prompt?: string; model?: string }>) => void | Promise<void>;
    onPersistCompareModalDelete?: (id: string) => void | Promise<void>;
    onPersistStoryboardModalCreate?: (modal: { id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
    onPersistStoryboardModalMove?: (id: string, updates: Partial<{ x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null; characterNamesMap?: Record<number, string>; propsNamesMap?: Record<number, string>; backgroundNamesMap?: Record<number, string> }>) => void | Promise<void>;
    onPersistStoryboardModalDelete?: (id: string) => void | Promise<void>;
    onPersistScriptFrameModalCreate?: (modal: { id: string; pluginId: string; x: number; y: number; frameWidth: number; frameHeight: number; text: string }) => void | Promise<void>;
    onPersistScriptFrameModalMove?: (id: string, updates: Partial<{ x: number; y: number; frameWidth: number; frameHeight: number; text: string }>) => void | Promise<void>;
    onPersistScriptFrameModalDelete?: (id: string) => void | Promise<void>;
    onPersistSceneFrameModalCreate?: (modal: { id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string }) => void | Promise<void>;
    onPersistSceneFrameModalMove?: (id: string, updates: Partial<{ x: number; y: number; frameWidth: number; frameHeight: number; content: string }>) => void | Promise<void>;
    onPersistSceneFrameModalDelete?: (id: string) => void | Promise<void>;
    onVectorize?: (sourceImageUrl?: string, mode?: string) => Promise<string | null>;
    // Text generator (input overlay) persistence callbacks
    onPersistTextModalCreate?: (modal: { id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }) => void | Promise<void>;
    onPersistTextModalMove?: (id: string, updates: Partial<{ x: number; y: number; value?: string }>) => void | Promise<void>;
    onPersistTextModalDelete?: (id: string) => void | Promise<void>;
    // Group persistence callbacks
    onPersistGroupCreate?: (group: GroupContainerState) => void | Promise<void>;
    onPersistGroupDelete?: (groupId: string) => void | Promise<void>;
    onPersistGroupUpdate?: (groupId: string, updates: Partial<GroupContainerState> | { meta: Record<string, any> }, group?: GroupContainerState) => void | Promise<void>;
    onBulkDelete?: (elementIds: string[]) => void | Promise<void>;
    // Allow initial groups to be provided from parent snapshot hydration
    initialGroupContainerStates?: GroupContainerState[];
    // Compare plugin persistence callbacks
    compareModalStates?: CompareModalState[];
    setCompareModalStates?: React.Dispatch<React.SetStateAction<CompareModalState[]>>;
    selectedCompareModalId?: string | null;
    selectedCompareModalIds?: string[];
    setSelectedCompareModalId?: (id: string | null) => void;
    setSelectedCompareModalIds?: (ids: string[]) => void;

    canvasTextStates?: CanvasTextState[];
    setCanvasTextStates?: React.Dispatch<React.SetStateAction<CanvasTextState[]>>;
    selectedCanvasTextId?: string | null;
    selectedCanvasTextIds?: string[];
    setSelectedCanvasTextId?: (id: string | null) => void;
    setSelectedCanvasTextIds?: (ids: string[]) => void;
    effectiveSelectedCanvasTextIds?: string[];
    onPersistCanvasTextCreate?: (modal: CanvasTextState) => void | Promise<void>;
    onPersistCanvasTextMove?: (id: string, updates: Partial<CanvasTextState>) => void | Promise<void>;
    onPersistCanvasTextDelete?: (id: string) => void | Promise<void>;

    richTextStates?: CanvasTextState[];
    setRichTextStates?: React.Dispatch<React.SetStateAction<CanvasTextState[]>>;
    selectedRichTextId?: string | null;
    selectedRichTextIds?: string[];
    setSelectedRichTextId?: (id: string | null) => void;
    setSelectedRichTextIds?: (ids: string[]) => void;
    onPersistRichTextCreate?: (modal: CanvasTextState) => void | Promise<void>;
    onPersistRichTextMove?: (id: string, updates: Partial<CanvasTextState>) => void | Promise<void>;
    onPersistRichTextDelete?: (id: string) => void | Promise<void>;

    connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }>;
    onConnectionsChange?: (connections: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }>) => void;
    onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
    onPersistConnectorDelete?: (connectorId: string) => void | Promise<void>;
    onPluginSidebarOpen?: () => void;
    isUIHidden?: boolean;
    setGenerationQueue?: React.Dispatch<React.SetStateAction<GenerationQueueItem[]>>;
    stageRef?: React.RefObject<any>;
    onGenerateStoryboard?: (storyboardId: string, inputs: {
        characterInput?: string;
        characterNames?: string;
        backgroundDescription?: string;
        specialRequest?: string;
    }) => void;

    // Clear Studio
    onClearStudio?: () => void;
}

export interface CanvasItemsData {
    images: ImageUpload[];
    canvasTextStates: CanvasTextState[];
    richTextStates: CanvasTextState[];
    textInputStates: Array<{ id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }>;
    imageModalStates: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; sourceImageUrl?: string | null; isGenerating?: boolean }>;
    videoModalStates: Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; duration?: number; resolution?: string; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>;
    videoEditorModalStates: Array<{ id: string; x: number; y: number }>;
    musicModalStates: MusicGenerator[];
    upscaleModalStates: Array<{ id: string; x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number; isUpscaling?: boolean; isExpanded?: boolean }>;
    multiangleCameraModalStates: Array<{ id: string; x: number; y: number; sourceImageUrl?: string | null; isExpanded?: boolean }>;
    removeBgModalStates: Array<{ id: string; x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isRemovingBg?: boolean; isExpanded?: boolean }>;
    eraseModalStates: Array<{ id: string; x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isErasing?: boolean; isExpanded?: boolean }>;
    expandModalStates: Array<{ id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isExpanding?: boolean; isExpanded?: boolean }>;
    vectorizeModalStates: Array<{ id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean; isExpanded?: boolean }>;
    nextSceneModalStates: Array<{ id: string; x: number; y: number; nextSceneImageUrl?: string | null; sourceImageUrl?: string | null; localNextSceneImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isProcessing?: boolean; isExpanded?: boolean }>;
    compareModalStates: CompareModalState[];
    storyboardModalStates: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null; characterNamesMap?: Record<number, string>; propsNamesMap?: Record<number, string>; backgroundNamesMap?: Record<number, string>; namedImages?: { characters?: Record<string, string>; backgrounds?: Record<string, string>; props?: Record<string, string> }; stitchedImageUrl?: string }>;
    scriptFrameModalStates: ScriptFrameModalState[];
    sceneFrameModalStates: Array<{ id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string; characterIds?: string[]; locationId?: string; mood?: string }>;
    storyWorldStates: Array<{ storyboardId: string; storyWorld: StoryWorld }>;
}
