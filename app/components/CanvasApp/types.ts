import { ImageUpload } from '@/types/canvas';
import { GenerationQueueItem } from '@/app/components/Canvas/GenerationQueue';
import { MediaItem } from '@/lib/api';

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
  isGenerating?: boolean;
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

export interface MultiangleGenerator {
  id: string;
  x: number;
  y: number;
  multiangleImageUrl?: string | null;
  sourceImageUrl?: string | null;
  localMultiangleImageUrl?: string | null;
  frameWidth?: number;
  frameHeight?: number;
  isProcessing?: boolean;
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
    characters?: Record<string, string>; // "Aryan" -> imageUrl
    backgrounds?: Record<string, string>; // "Restaurant" -> imageUrl
    props?: Record<string, string>; // "Rose" -> imageUrl
  };
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
  musicGenerators: MusicGenerator[];
  upscaleGenerators: UpscaleGenerator[];
  removeBgGenerators: RemoveBgGenerator[];
  eraseGenerators: EraseGenerator[];
  expandGenerators: ExpandGenerator[];
  vectorizeGenerators: VectorizeGenerator[];
  compareGenerators: CompareGenerator[];
  nextSceneGenerators: NextSceneGenerator[];
  multiangleGenerators: MultiangleGenerator[];
  storyboardGenerators: StoryboardGenerator[];
  scriptFrameGenerators: ScriptFrameGenerator[];
  sceneFrameGenerators: SceneFrameGenerator[];
  textGenerators: TextGenerator[];
  canvasTextStates?: import('@/app/components/ModalOverlays/types').CanvasTextState[];
  connectors: Connector[];
  generationQueue: GenerationQueueItem[];
}

export interface CanvasAppSetters {
  setImages: React.Dispatch<React.SetStateAction<ImageUpload[]>>;
  setImageGenerators: React.Dispatch<React.SetStateAction<ImageGenerator[]>>;
  setVideoGenerators: React.Dispatch<React.SetStateAction<VideoGenerator[]>>;
  setVideoEditorGenerators: React.Dispatch<React.SetStateAction<VideoEditorGenerator[]>>;
  setMusicGenerators: React.Dispatch<React.SetStateAction<MusicGenerator[]>>;
  setUpscaleGenerators: React.Dispatch<React.SetStateAction<UpscaleGenerator[]>>;
  setRemoveBgGenerators: React.Dispatch<React.SetStateAction<RemoveBgGenerator[]>>;
  setEraseGenerators: React.Dispatch<React.SetStateAction<EraseGenerator[]>>;
  setExpandGenerators: React.Dispatch<React.SetStateAction<ExpandGenerator[]>>;
  setVectorizeGenerators: React.Dispatch<React.SetStateAction<VectorizeGenerator[]>>;
  setCompareGenerators: React.Dispatch<React.SetStateAction<CompareGenerator[]>>;
  setNextSceneGenerators: React.Dispatch<React.SetStateAction<NextSceneGenerator[]>>;
  setMultiangleGenerators: React.Dispatch<React.SetStateAction<MultiangleGenerator[]>>;
  setStoryboardGenerators: React.Dispatch<React.SetStateAction<StoryboardGenerator[]>>;
  setScriptFrameGenerators: React.Dispatch<React.SetStateAction<ScriptFrameGenerator[]>>;
  setSceneFrameGenerators: React.Dispatch<React.SetStateAction<SceneFrameGenerator[]>>;
  setTextGenerators: React.Dispatch<React.SetStateAction<TextGenerator[]>>;
  setConnectors: React.Dispatch<React.SetStateAction<Connector[]>>;
  setGenerationQueue: React.Dispatch<React.SetStateAction<GenerationQueueItem[]>>;
}

export interface ViewportCenter {
  x: number;
  y: number;
  scale: number;
}

