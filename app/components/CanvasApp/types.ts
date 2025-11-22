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
  musicGenerators: MusicGenerator[];
  upscaleGenerators: UpscaleGenerator[];
  removeBgGenerators: RemoveBgGenerator[];
  vectorizeGenerators: VectorizeGenerator[];
  textGenerators: TextGenerator[];
  connectors: Connector[];
  generationQueue: GenerationQueueItem[];
}

export interface CanvasAppSetters {
  setImages: React.Dispatch<React.SetStateAction<ImageUpload[]>>;
  setImageGenerators: React.Dispatch<React.SetStateAction<ImageGenerator[]>>;
  setVideoGenerators: React.Dispatch<React.SetStateAction<VideoGenerator[]>>;
  setMusicGenerators: React.Dispatch<React.SetStateAction<MusicGenerator[]>>;
  setUpscaleGenerators: React.Dispatch<React.SetStateAction<UpscaleGenerator[]>>;
  setRemoveBgGenerators: React.Dispatch<React.SetStateAction<RemoveBgGenerator[]>>;
  setVectorizeGenerators: React.Dispatch<React.SetStateAction<VectorizeGenerator[]>>;
  setTextGenerators: React.Dispatch<React.SetStateAction<TextGenerator[]>>;
  setConnectors: React.Dispatch<React.SetStateAction<Connector[]>>;
  setGenerationQueue: React.Dispatch<React.SetStateAction<GenerationQueueItem[]>>;
}

export interface ViewportCenter {
  x: number;
  y: number;
  scale: number;
}

