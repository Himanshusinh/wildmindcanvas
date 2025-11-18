export interface CanvasConfig {
  width: number;
  height: number;
  scale?: number;
}

export type MediaType = 'image' | 'video' | 'model3d' | 'text';

export interface ImageUpload {
  file?: File;
  url?: string;
  type: MediaType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // 2D rotation in degrees for images/videos/text
  rotation?: number;
  // Original resolution for display in tooltip
  originalWidth?: number;
  originalHeight?: number;
  // For 3D models
  rotationX?: number;
  rotationY?: number;
  zoom?: number;
  // For GLTF files with dependencies
  relatedFiles?: Map<string, { file: File; url: string }>;
  // For text elements
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  // For op tracking and persistence
  elementId?: string;
}

export interface Group {
  id: string;
  name?: string;
  itemIndices: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

