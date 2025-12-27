export type MediaType = 'image' | 'video' | 'model3d' | 'text';

export interface ImageUpload {
  file?: File;
  url?: string;              // AVIF URL for display (optimized)
  firebaseUrl?: string;      // Legacy/Alternative URL
  originalUrl?: string;      // Original format URL (for download/processing)
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

