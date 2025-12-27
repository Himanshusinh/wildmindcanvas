import { ImageUpload } from '@/core/types/canvas';
import * as THREE from 'three';

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
  sceneRef: React.RefObject<THREE.Scene | null>;
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>;
  rendererRef: React.RefObject<THREE.WebGLRenderer | null>;
  modelRef: React.RefObject<THREE.Group | null>;
  animationFrameRef: React.RefObject<number | null>;
  isDraggingRef: React.RefObject<boolean>;
  lastMousePosRef: React.RefObject<{ x: number; y: number }>;
  currentRotationRef: React.RefObject<{ x: number; y: number }>;
  currentZoomRef: React.RefObject<number>;
  targetRef: React.RefObject<THREE.Vector3>;
  sphericalRef: React.RefObject<SphericalCoords>;
  isPanningRef: React.RefObject<boolean>;
  panStartRef: React.RefObject<{ x: number; y: number }>;
  touchStartDistanceRef: React.RefObject<number>;
  touchStartSphericalRef: React.RefObject<SphericalCoords>;
}

