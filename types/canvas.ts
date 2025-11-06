export interface CanvasConfig {
  width: number;
  height: number;
  scale?: number;
}

export interface ImageUpload {
  file: File;
  url: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

