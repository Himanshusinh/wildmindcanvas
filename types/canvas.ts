export interface CanvasConfig {
  width: number;
  height: number;
  scale?: number;
}

export type MediaType = 'image' | 'video';

export interface ImageUpload {
  file: File;
  url: string;
  type: MediaType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

