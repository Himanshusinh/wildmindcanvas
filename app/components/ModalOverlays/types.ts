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
}

export interface ModalOverlaysProps {
  textInputStates: TextModalState[];
  imageModalStates: ImageModalState[];
  videoModalStates: VideoModalState[];
  musicModalStates: MusicModalState[];
  upscaleModalStates?: UpscaleModalState[];
  selectedTextInputId: string | null;
  selectedTextInputIds: string[];
  selectedImageModalId: string | null;
  selectedImageModalIds: string[];
  selectedVideoModalId: string | null;
  selectedVideoModalIds: string[];
  selectedMusicModalId: string | null;
  selectedMusicModalIds: string[];
  selectedUpscaleModalId?: string | null;
  selectedUpscaleModalIds?: string[];
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
  setMusicModalStates: React.Dispatch<React.SetStateAction<MusicModalState[]>>;
  setSelectedMusicModalId: (id: string | null) => void;
  setSelectedMusicModalIds: (ids: string[]) => void;
  setUpscaleModalStates?: React.Dispatch<React.SetStateAction<UpscaleModalState[]>>;
  setSelectedUpscaleModalId?: (id: string | null) => void;
  setSelectedUpscaleModalIds?: (ids: string[]) => void;
  setSelectionTightRect?: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  setIsDragSelection?: (value: boolean) => void;
  images?: ImageUpload[];
  onTextCreate?: (text: string, x: number, y: number) => void;
  onImageSelect?: (file: File) => void;
  onImageGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, modalId?: string, imageCount?: number, sourceImageUrl?: string) => Promise<{ url: string; images?: Array<{ url: string }> } | null>;
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
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  onPersistImageModalDelete?: (id: string) => void | Promise<void>;
  onPersistVideoModalCreate?: (modal: { id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number }) => void | Promise<void>;
  onPersistVideoModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number }>) => void | Promise<void>;
  onPersistVideoModalDelete?: (id: string) => void | Promise<void>;
  onPersistMusicModalCreate?: (modal: { id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistMusicModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  onPersistMusicModalDelete?: (id: string) => void | Promise<void>;
  onPersistUpscaleModalCreate?: (modal: { id: string; x: number; y: number; upscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  onPersistUpscaleModalMove?: (id: string, updates: Partial<{ x: number; y: number; upscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number }>) => void | Promise<void>;
  onPersistUpscaleModalDelete?: (id: string) => void | Promise<void>;
  onUpscale?: (model: string, scale: number, sourceImageUrl?: string) => Promise<string | null>;
  onPersistTextModalCreate?: (modal: { id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }) => void | Promise<void>;
  onPersistTextModalMove?: (id: string, updates: Partial<{ x: number; y: number; value?: string }>) => void | Promise<void>;
  onPersistTextModalDelete?: (id: string) => void | Promise<void>;
  connections?: Connection[];
  onConnectionsChange?: (connections: Connection[]) => void;
  onPersistConnectorCreate?: (connector: Connection) => void | Promise<void>;
  onPersistConnectorDelete?: (connectorId: string) => void | Promise<void>;
  onPluginSidebarOpen?: () => void;
}

