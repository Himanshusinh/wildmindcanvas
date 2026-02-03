import { ImageUpload } from '@/core/types/canvas';
import { GenerationQueueItem } from '@/modules/canvas/GenerationQueue';
import { MediaItem } from '@/core/api/api';

export interface ImageGenerator {
  id: string;
  x: number;
  y: number;
  generatedImageUrl?: string | null;
  generatedImageUrls?: string[];
  frameWidth?: number;
  frameHeight?: number;
  model?: string;
  frame?: string;
  aspectRatio?: string;
  prompt?: string;
  imageCount?: number;
  isGenerating?: boolean;
  sourceImageUrl?: string | null;
  url?: string;
}

export interface VideoGenerator {
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
}

export interface VideoEditorGenerator {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
}

export interface ImageEditorGenerator {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
}

export interface MusicGenerator {
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
  activeCategory?: string | null;
  lyrics?: string;
  sampleRate?: string;
  bitrate?: string;
  audioFormat?: string;
  isGenerating?: boolean;

  // Voice (TTS) specific fields
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speed?: number;
  exaggeration?: number;
  temperature?: number;
  cfgScale?: number;
  voicePrompt?: string;
  topP?: number;
  maxTokens?: number;
  repetitionPenalty?: number;

  // Dialogue specific fields
  dialogueInputs?: import('@/modules/canvas-overlays/types').DialogueInput[];
  useSpeakerBoost?: boolean;
}

export interface UpscaleGenerator {
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
  faceEnhance?: boolean;
  faceEnhanceStrength?: number;
  topazModel?: string;
  faceEnhanceCreativity?: number;
}

export interface MultiangleCameraGenerator {
  id: string;
  x: number;
  y: number;
  sourceImageUrl?: string | null;
}

export interface RemoveBgGenerator {
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
}

export interface EraseGenerator {
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
}

export interface ExpandGenerator {
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
}

export interface VectorizeGenerator {
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
}

export interface NextSceneGenerator {
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
}

export interface CompareGenerator {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale?: number;
  prompt?: string;
  model?: string;
}


export interface StoryboardGenerator {
  id: string;
  x: number;
  y: number;
  frameWidth?: number;
  frameHeight?: number;
  scriptText?: string | null;
  characterNamesMap?: Record<number, string>;
  propsNamesMap?: Record<number, string>;
  backgroundNamesMap?: Record<number, string>;
  // Direct name -> image URL mappings (auto-updated from names maps + connections)
  namedImages?: {
    characters?: Record<string, string>;
    backgrounds?: Record<string, string>;
    props?: Record<string, string>;
  };
  stitchedImageUrl?: string;
}

export interface ScriptFrameGenerator {
  id: string;
  pluginId: string;
  x: number;
  y: number;
  frameWidth: number;
  frameHeight: number;
  text: string;
}

export interface SceneFrameGenerator {
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
  // Human-readable names (for display and prompts)
  characterNames?: string[];     // Actual character names (e.g., ["Aryan", "Diya"])
  locationName?: string;         // Actual location name (e.g., "Restaurant")
}

export interface TextGenerator {
  id: string;
  x: number;
  y: number;
  value?: string;
  smartTokens?: import('@/modules/generators/TextInput/smartTerms').SmartToken[];
}

export interface Connector {
  id: string;
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

export interface CanvasAppState {
  images: ImageUpload[];
  imageGenerators: ImageGenerator[];
  videoGenerators: VideoGenerator[];
  videoEditorGenerators: VideoEditorGenerator[];
  imageEditorGenerators: ImageEditorGenerator[];
  musicGenerators: MusicGenerator[];
  upscaleGenerators: UpscaleGenerator[];
  multiangleCameraGenerators: MultiangleCameraGenerator[];
  removeBgGenerators: RemoveBgGenerator[];
  eraseGenerators: EraseGenerator[];
  expandGenerators: ExpandGenerator[];
  vectorizeGenerators: VectorizeGenerator[];
  compareGenerators: CompareGenerator[];
  nextSceneGenerators: NextSceneGenerator[];
  storyboardGenerators: StoryboardGenerator[];
  scriptFrameGenerators: ScriptFrameGenerator[];
  sceneFrameGenerators: SceneFrameGenerator[];
  textGenerators: TextGenerator[];
  canvasTextStates?: import('@/modules/canvas-overlays/types').CanvasTextState[];
  richTextStates?: import('@/modules/canvas-overlays/types').CanvasTextState[];
  groupContainerStates?: import('@/core/types/groupContainer').GroupContainerState[];
  connectors: Connector[];
  generationQueue: GenerationQueueItem[];
  showImageGenerationModal?: boolean;
}

export interface CanvasAppSetters {
  setImages: React.Dispatch<React.SetStateAction<ImageUpload[]>>;
  setImageGenerators: React.Dispatch<React.SetStateAction<ImageGenerator[]>>;
  setVideoGenerators: React.Dispatch<React.SetStateAction<VideoGenerator[]>>;
  setVideoEditorGenerators: React.Dispatch<React.SetStateAction<VideoEditorGenerator[]>>;
  setImageEditorGenerators: React.Dispatch<React.SetStateAction<ImageEditorGenerator[]>>;
  setMusicGenerators: React.Dispatch<React.SetStateAction<MusicGenerator[]>>;
  setUpscaleGenerators: React.Dispatch<React.SetStateAction<UpscaleGenerator[]>>;
  setMultiangleCameraGenerators: React.Dispatch<React.SetStateAction<MultiangleCameraGenerator[]>>;
  setRemoveBgGenerators: React.Dispatch<React.SetStateAction<RemoveBgGenerator[]>>;
  setEraseGenerators: React.Dispatch<React.SetStateAction<EraseGenerator[]>>;
  setExpandGenerators: React.Dispatch<React.SetStateAction<ExpandGenerator[]>>;
  setVectorizeGenerators: React.Dispatch<React.SetStateAction<VectorizeGenerator[]>>;
  setCompareGenerators: React.Dispatch<React.SetStateAction<CompareGenerator[]>>;
  setNextSceneGenerators: React.Dispatch<React.SetStateAction<NextSceneGenerator[]>>;
  setStoryboardGenerators: React.Dispatch<React.SetStateAction<StoryboardGenerator[]>>;
  setScriptFrameGenerators: React.Dispatch<React.SetStateAction<ScriptFrameGenerator[]>>;
  setSceneFrameGenerators: React.Dispatch<React.SetStateAction<SceneFrameGenerator[]>>;
  setTextGenerators: React.Dispatch<React.SetStateAction<TextGenerator[]>>;
  setCanvasTextStates: React.Dispatch<React.SetStateAction<import('@/modules/canvas-overlays/types').CanvasTextState[]>>;
  setRichTextStates: React.Dispatch<React.SetStateAction<import('@/modules/canvas-overlays/types').CanvasTextState[]>>;
  setGroupContainerStates: React.Dispatch<React.SetStateAction<import('@/core/types/groupContainer').GroupContainerState[]>>;
  setConnectors: React.Dispatch<React.SetStateAction<Connector[]>>;
  setGenerationQueue: React.Dispatch<React.SetStateAction<GenerationQueueItem[]>>;
  setShowImageGenerationModal: React.Dispatch<React.SetStateAction<boolean>>;
  setGeneratedImage?: React.Dispatch<React.SetStateAction<string | null>>;
  setGeneratedImages?: Function;
}

export interface ViewportCenter {
  x: number;
  y: number;
  scale: number;
}

export interface SnapshotActions {
  createElement: (element: import('@/lib/snapshot/currentSnapshot').CanvasElement) => void;
  updateElement: (id: string, updates: Partial<import('@/lib/snapshot/currentSnapshot').CanvasElement>) => void;
  deleteElement: (id: string) => void;
}

