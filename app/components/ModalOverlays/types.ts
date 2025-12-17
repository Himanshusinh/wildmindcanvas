import Konva from 'konva';
import { ImageUpload } from '@/types/canvas';

export interface TextModalState {
  id: string;
  x: number;
  y: number;
  value?: string;
  autoFocusInput?: boolean;
}

export interface ImageModalState {
  id: string;
  x: number;
  y: number;
  generatedImageUrl?: string | null;
  generatedImageUrls?: string[];
  sourceImageUrl?: string | null;
  frameWidth?: number;
  frameHeight?: number;
  model?: string;
  frame?: string;
  aspectRatio?: string;
  prompt?: string;
  imageCount?: number;
  isGenerating?: boolean;
}

export interface VideoModalState {
  id: string;
  x: number;
  y: number;
  generatedVideoUrl?: string | null;
  duration?: number;
  resolution?: string;
  frameWidth?: number;
  frameHeight?: number;
  model?: string;
  frame?: string;
  aspectRatio?: string;
  prompt?: string;
  taskId?: string;
  generationId?: string;
  status?: string;
  provider?: string;
  isExpanded?: boolean;
}

export interface VideoEditorModalState {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
}

export interface MusicModalState {
  id: string;
  x: number;
  y: number;
  generatedMusicUrl?: string | null;
  frameWidth?: number;
  frameHeight?: number;
  model?: string;
  frame?: string;
  aspectRatio?: string;
  prompt?: string;
  isGenerating?: boolean;
  isExpanded?: boolean;
}

export interface UpscaleModalState {
  id: string;
  x: number;
  y: number;
  upscaledImageUrl?: string | null;
  sourceImageUrl?: string | null;
  localUpscaledImageUrl?: string | null;
  model?: string;
  scale?: number;
  frameWidth?: number;
  frameHeight?: number;
  isUpscaling?: boolean;
  isExpanded?: boolean;
}

export interface RemoveBgModalState {
  id: string;
  x: number;
  y: number;
  removedBgImageUrl?: string | null;
  sourceImageUrl?: string | null;
  localRemovedBgImageUrl?: string | null;
  model?: string;
  backgroundType?: string;
  scaleValue?: number;
  frameWidth?: number;
  frameHeight?: number;
  isRemovingBg?: boolean;
  isExpanded?: boolean;
}

export interface CompareModalState {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale?: number;
  isOpen?: boolean;
  prompt?: string;
  model?: string;
  isExpanded?: boolean;
}

export interface EraseModalState {
  id: string;
  x: number;
  y: number;
  erasedImageUrl?: string | null;
  sourceImageUrl?: string | null;
  localErasedImageUrl?: string | null;
  model?: string;
  frameWidth?: number;
  frameHeight?: number;
  isErasing?: boolean;
  isExpanded?: boolean;
}

export interface ExpandModalState {
  id: string;
  x: number;
  y: number;
  expandedImageUrl?: string | null;
  sourceImageUrl?: string | null;
  localExpandedImageUrl?: string | null;
  model?: string;
  frameWidth?: number;
  frameHeight?: number;
  isExpanding?: boolean;
  isExpanded?: boolean;
}

export interface VectorizeModalState {
  id: string;
  x: number;
  y: number;
  vectorizedImageUrl?: string | null;
  sourceImageUrl?: string | null;
  localVectorizedImageUrl?: string | null;
  mode?: string;
  frameWidth?: number;
  frameHeight?: number;
  isVectorizing?: boolean;
  isExpanded?: boolean;
}

export interface NextSceneModalState {
  id: string;
  x: number;
  y: number;
  nextSceneImageUrl?: string | null;
  sourceImageUrl?: string | null;
  localNextSceneImageUrl?: string | null;
  mode?: string;
  frameWidth?: number;
  frameHeight?: number;
  isProcessing?: boolean;
  isExpanded?: boolean;
}



export interface StoryboardModalState {
  id: string;
  x: number;
  y: number;
  frameWidth?: number;
  frameHeight?: number;
  scriptText?: string | null;
  characterNamesMap?: Record<number, string>;
  propsNamesMap?: Record<number, string>;
  backgroundNamesMap?: Record<number, string>;
}

export interface CanvasTextState {
  id: string;
  x: number;
  y: number;
  text: string;
  width?: number;
  height?: number;
  styleType: 'title' | 'heading' | 'paragraph'; // Kept for backward compatibility, but not used in UI
  fontSize: number;
  fontWeight: string;
  fontStyle?: string; // 'normal' | 'italic'
  fontFamily?: string; // Font family name
  textAlign: 'left' | 'center' | 'right';
  color: string; // Kept for backward compatibility, but text color is now theme-aware
  rotation?: number;
  textDecoration?: string; // 'none' | 'underline' | 'line-through'
  htmlContent?: string;
}

export interface ScriptFrameModalState {
  id: string;
  pluginId: string;
  x: number;
  y: number;
  frameWidth: number;
  frameHeight: number;
  text: string;
  isLoading?: boolean;
}

export interface SceneFrameModalState {
  id: string;
  scriptFrameId: string;
  sceneNumber: number;
  x: number;
  y: number;
  frameWidth: number;
  frameHeight: number;
  content: string;
  // Story World metadata for visual consistency
  characterIds?: string[];       // IDs of characters present in this scene
  locationId?: string;           // ID of the location where scene takes place
  mood?: string;                 // Emotional tone of the scene
}

export interface Connection {
  id?: string;
  from: string;
  to: string;
  color: string;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  fromAnchor?: string;
  toAnchor?: string;
}

export interface ActiveDrag {
  from: string;
  color: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface ComponentMenu {
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
  sourceNodeId?: string;
  sourceNodeType?: string;
  connectionColor?: string;
}

export interface ModalOverlaysProps {
  textInputStates: TextModalState[];
  imageModalStates: ImageModalState[];
  videoModalStates: VideoModalState[];
  videoEditorModalStates?: VideoEditorModalState[];
  musicModalStates: MusicModalState[];
  upscaleModalStates?: UpscaleModalState[];
  removeBgModalStates?: RemoveBgModalState[];
  eraseModalStates?: EraseModalState[];
  expandModalStates?: ExpandModalState[];
  vectorizeModalStates?: VectorizeModalState[];
  nextSceneModalStates?: NextSceneModalState[];
  storyboardModalStates?: StoryboardModalState[];
  scriptFrameModalStates?: ScriptFrameModalState[];
  sceneFrameModalStates?: SceneFrameModalState[];

  // Compare Plugin
  compareModalStates?: CompareModalState[];
  selectedCompareModalId?: string | null;
  selectedCompareModalIds?: string[];
  setCompareModalStates?: React.Dispatch<React.SetStateAction<CompareModalState[]>>;
  setSelectedCompareModalId?: (id: string | null) => void;
  setSelectedCompareModalIds?: (ids: string[]) => void;
  onPersistCompareModalCreate?: (modal: CompareModalState) => void | Promise<void>;
  onPersistCompareModalMove?: (id: string, updates: Partial<CompareModalState>) => void | Promise<void>;
  onPersistCompareModalDelete?: (id: string) => void | Promise<void>;

  selectedTextInputId: string | null;
  selectedTextInputIds: string[];
  selectedImageModalId: string | null;
  selectedImageModalIds: string[];
  selectedVideoModalId: string | null;
  selectedVideoModalIds: string[];
  selectedVideoEditorModalId?: string | null;
  selectedVideoEditorModalIds?: string[];
  selectedMusicModalId: string | null;
  selectedMusicModalIds: string[];
  selectedUpscaleModalId?: string | null;
  selectedUpscaleModalIds?: string[];
  selectedRemoveBgModalId?: string | null;
  selectedRemoveBgModalIds?: string[];
  selectedEraseModalId?: string | null;
  selectedEraseModalIds?: string[];
  selectedExpandModalId?: string | null;
  selectedExpandModalIds?: string[];
  selectedVectorizeModalId?: string | null;
  selectedVectorizeModalIds?: string[];
  selectedNextSceneModalId?: string | null;
  selectedNextSceneModalIds?: string[];
  selectedStoryboardModalId?: string | null;
  selectedStoryboardModalIds?: string[];
  clearAllSelections: () => void;
  setTextInputStates: React.Dispatch<React.SetStateAction<TextModalState[]>>;
  setSelectedTextInputId: (id: string | null) => void;
  setSelectedTextInputIds: (ids: string[]) => void;
  setSelectedImageIndices: React.Dispatch<React.SetStateAction<number[]>>;
  setImageModalStates: React.Dispatch<React.SetStateAction<ImageModalState[]>>;
  setSelectedImageModalId: (id: string | null) => void;
  setSelectedImageModalIds: (ids: string[]) => void;
  setVideoModalStates: React.Dispatch<React.SetStateAction<VideoModalState[]>>;
  setSelectedVideoModalId: (id: string | null) => void;
  setSelectedVideoModalIds: (ids: string[]) => void;
  setVideoEditorModalStates?: React.Dispatch<React.SetStateAction<VideoEditorModalState[]>>;
  setSelectedVideoEditorModalId?: (id: string | null) => void;
  setSelectedVideoEditorModalIds?: (ids: string[]) => void;
  setMusicModalStates: React.Dispatch<React.SetStateAction<MusicModalState[]>>;
  setSelectedMusicModalId: (id: string | null) => void;
  setSelectedMusicModalIds: (ids: string[]) => void;
  setUpscaleModalStates?: React.Dispatch<React.SetStateAction<UpscaleModalState[]>>;
  setSelectedUpscaleModalId?: (id: string | null) => void;
  setSelectedUpscaleModalIds?: (ids: string[]) => void;
  setRemoveBgModalStates?: React.Dispatch<React.SetStateAction<RemoveBgModalState[]>>;
  setSelectedRemoveBgModalId?: (id: string | null) => void;
  setSelectedRemoveBgModalIds?: (ids: string[]) => void;
  setEraseModalStates?: React.Dispatch<React.SetStateAction<EraseModalState[]>>;
  setSelectedEraseModalId?: (id: string | null) => void;
  setSelectedEraseModalIds?: (ids: string[]) => void;
  setExpandModalStates?: React.Dispatch<React.SetStateAction<ExpandModalState[]>>;
  setSelectedExpandModalId?: (id: string | null) => void;
  setSelectedExpandModalIds?: (ids: string[]) => void;
  setVectorizeModalStates?: React.Dispatch<React.SetStateAction<VectorizeModalState[]>>;
  setSelectedVectorizeModalId?: (id: string | null) => void;
  setSelectedVectorizeModalIds?: (ids: string[]) => void;
  setNextSceneModalStates?: React.Dispatch<React.SetStateAction<NextSceneModalState[]>>;
  setSelectedNextSceneModalId?: (id: string | null) => void;
  setSelectedNextSceneModalIds?: (ids: string[]) => void;
  setStoryboardModalStates?: React.Dispatch<React.SetStateAction<StoryboardModalState[]>>;
  setScriptFrameModalStates?: React.Dispatch<React.SetStateAction<ScriptFrameModalState[]>>;
  setSelectedStoryboardModalId?: (id: string | null) => void;
  setSelectedStoryboardModalIds?: (ids: string[]) => void;
  setSelectionTightRect?: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  setIsDragSelection?: (value: boolean) => void;
  images?: ImageUpload[];
  onTextCreate?: (text: string, x: number, y: number) => void;
  onScriptGenerationStart?: (textModalId: string) => void;
  onTextScriptGenerated?: (textModalId: string, script: string) => void;
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
    storyboardMetadata?: Record<string, string>
  ) => Promise<{ url: string; images?: Array<{ url: string }> } | null>;
  onVideoSelect?: (file: File) => void;
  onVideoGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, duration: number, resolution?: string, modalId?: string, firstFrameUrl?: string, lastFrameUrl?: string) => Promise<{ generationId?: string; taskId?: string; provider?: string } | null>;
  onMusicSelect?: (file: File) => void;
  onMusicGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => Promise<string | null>;
  generatedVideoUrl?: string | null;
  generatedMusicUrl?: string | null;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  onAddImageToCanvas?: (url: string) => void;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; sourceImageUrl?: string | null }) => void | Promise<void>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; sourceImageUrl?: string | null; isGenerating?: boolean }>) => void | Promise<void>;
  onPersistImageModalDelete?: (id: string) => void | Promise<void>;
  onPersistVideoModalCreate?: (modal: { id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number }) => void | Promise<void>;
  onPersistVideoModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number }>) => void | Promise<void>;
  onPersistVideoModalDelete?: (id: string) => void | Promise<void>;
  onPersistVideoEditorModalCreate?: (modal: { id: string; x: number; y: number }) => void | Promise<void>;
  onPersistVideoEditorModalMove?: (id: string, updates: Partial<{ x: number; y: number }>) => void | Promise<void>;
  onPersistVideoEditorModalDelete?: (id: string) => void | Promise<void>;
  onOpenVideoEditor?: () => void;
  onPersistMusicModalCreate?: (modal: { id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistMusicModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  onPersistMusicModalDelete?: (id: string) => void | Promise<void>;
  onPersistUpscaleModalCreate?: (modal: { id: string; x: number; y: number; upscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  onPersistUpscaleModalMove?: (id: string, updates: Partial<{ x: number; y: number; upscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number }>) => void | Promise<void>;
  onPersistUpscaleModalDelete?: (id: string) => void | Promise<void>;
  onUpscale?: (model: string, scale: number, sourceImageUrl?: string) => Promise<string | null>;
  onPersistRemoveBgModalCreate?: (modal: { id: string; x: number; y: number; removedBgImageUrl?: string | null; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  onPersistRemoveBgModalMove?: (id: string, updates: Partial<{ x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isRemovingBg?: boolean }>) => void | Promise<void>;
  onPersistRemoveBgModalDelete?: (id: string) => void | Promise<void>;
  onRemoveBg?: (model: string, backgroundType: string, scaleValue: number, sourceImageUrl?: string) => Promise<string | null>;
  onPersistEraseModalCreate?: (modal: { id: string; x: number; y: number; erasedImageUrl?: string | null; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  onPersistEraseModalMove?: (id: string, updates: Partial<{ x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; isErasing?: boolean; frameWidth?: number; frameHeight?: number }>) => void | Promise<void>;
  onPersistEraseModalDelete?: (id: string) => void | Promise<void>;
  onErase?: (model: string, sourceImageUrl?: string, mask?: string) => Promise<string | null>;
  onPersistExpandModalCreate?: (modal: { id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isExpanding?: boolean }) => void | Promise<void>;
  onPersistExpandModalMove?: (id: string, updates: Partial<{ x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isExpanding?: boolean }>) => void | Promise<void>;
  onPersistExpandModalDelete?: (id: string) => void | Promise<void>;
  onExpand?: (model: string, sourceImageUrl?: string, prompt?: string, canvasSize?: [number, number], originalImageSize?: [number, number], originalImageLocation?: [number, number], aspectRatio?: string) => Promise<string | null>;
  onPersistVectorizeModalCreate?: (modal: { id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }) => void | Promise<void>;
  onPersistVectorizeModalMove?: (id: string, updates: Partial<{ x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }>) => void | Promise<void>;
  onPersistVectorizeModalDelete?: (id: string) => void | Promise<void>;
  onVectorize?: (sourceImageUrl?: string, mode?: string) => Promise<string | null>;
  onPersistNextSceneModalCreate?: (modal: { id: string; x: number; y: number; nextSceneImageUrl?: string | null; sourceImageUrl?: string | null; localNextSceneImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isProcessing?: boolean }) => void | Promise<void>;
  onPersistNextSceneModalMove?: (id: string, updates: Partial<{ x: number; y: number; nextSceneImageUrl?: string | null; sourceImageUrl?: string | null; localNextSceneImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isProcessing?: boolean }>) => void | Promise<void>;
  onPersistNextSceneModalDelete?: (id: string) => void | Promise<void>;
  onPersistStoryboardModalCreate?: (modal: { id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  onPersistStoryboardModalMove?: (id: string, updates: Partial<{ x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null; characterNamesMap?: Record<number, string>; propsNamesMap?: Record<number, string>; backgroundNamesMap?: Record<number, string> }>) => void | Promise<void>;
  onPersistStoryboardModalDelete?: (id: string) => void | Promise<void>;
  onGenerateStoryboard?: (storyboardId: string, inputs: {
    characterInput?: string;
    characterNames?: string;
    backgroundDescription?: string;
    specialRequest?: string;
  }) => void;
  onDeleteScriptFrame?: (id: string) => void;
  onScriptFramePositionChange?: (frameId: string, x: number, y: number) => void;
  onScriptFramePositionCommit?: (frameId: string, x: number, y: number) => void;
  onTextUpdate?: (id: string, text: string) => void;
  onGenerateScenes?: (scriptFrameId: string) => void;
  onDeleteSceneFrame?: (frameId: string) => void;
  onDuplicateSceneFrame?: (frameId: string) => void;
  onSceneFrameContentUpdate?: (frameId: string, content: string) => void;
  onSceneFramePositionChange?: (frameId: string, x: number, y: number) => void;
  onSceneFramePositionCommit?: (frameId: string, x: number, y: number) => void;
  onPersistTextModalCreate?: (modal: { id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }) => void | Promise<void>;
  onPersistTextModalMove?: (id: string, updates: Partial<{ x: number; y: number; value?: string }>) => void | Promise<void>;
  onPersistTextModalDelete?: (id: string) => void | Promise<void>;
  connections?: Connection[];
  onConnectionsChange?: (connections: Connection[]) => void;
  onPersistConnectorCreate?: (connector: Connection) => void | Promise<void>;
  onPersistConnectorDelete?: (connectorId: string) => void | Promise<void>;
  onPluginSidebarOpen?: () => void;
  onUpdateImageModalState?: (modalId: string, updates: Partial<{ generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }>) => void;
  // Canvas Text (Rich Text)
  canvasTextStates?: CanvasTextState[];
  setCanvasTextStates?: React.Dispatch<React.SetStateAction<CanvasTextState[]>>;
  selectedCanvasTextId?: string | null;
  selectedCanvasTextIds?: string[];
  setSelectedCanvasTextId?: (id: string | null) => void;
  setSelectedCanvasTextIds?: (ids: string[]) => void;
  onPersistCanvasTextCreate?: (modal: CanvasTextState) => void | Promise<void>;
  onPersistCanvasTextMove?: (id: string, updates: Partial<CanvasTextState>) => void | Promise<void>;
  onPersistCanvasTextDelete?: (id: string) => void | Promise<void>;
  projectId?: string | null;
}

export interface CompareModalState {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale?: number;
  isOpen?: boolean;
}
