import { ImageUpload } from '@/core/types/canvas';
import { Scene, PerspectiveCamera, WebGLRenderer, Group, Vector3 } from 'three';

export interface Model3DProps {
  modelData: ImageUpload;
  x: number;
  y: number;
  width: number;
  height: number;
  onUpdate?: (updates: Partial<ImageUpload>) => void;
}

export interface SphericalCoords {
  radius: number;
  theta: number;
  phi: number;
}

export interface Model3DRefs {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  sceneRef: React.RefObject<Scene | null>;
  cameraRef: React.RefObject<PerspectiveCamera | null>;
  rendererRef: React.RefObject<WebGLRenderer | null>;
  modelRef: React.RefObject<Group | null>;
  animationFrameRef: React.RefObject<number | null>;
  isDraggingRef: React.RefObject<boolean>;
  lastMousePosRef: React.RefObject<{ x: number; y: number }>;
  currentRotationRef: React.RefObject<{ x: number; y: number }>;
  currentZoomRef: React.RefObject<number>;
  targetRef: React.RefObject<Vector3>;
  sphericalRef: React.RefObject<SphericalCoords>;
  isPanningRef: React.RefObject<boolean>;
  panStartRef: React.RefObject<{ x: number; y: number }>;
  touchStartDistanceRef: React.RefObject<number>;
  touchStartSphericalRef: React.RefObject<SphericalCoords>;
}

