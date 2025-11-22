export type ActiveSection = 'profile' | 'canvas' | 'theme' | 'keyboard' | 'notification';
export type ThemeMode = 'dark' | 'light';
export type CursorType = 'default' | 'crosshair' | 'pointer' | 'grab' | 'text';
export type BackgroundType = 'dots' | 'grid' | 'solid' | 'none';

export interface CanvasSettings {
  cursorType: CursorType;
  backgroundType: BackgroundType;
  dotColor: string;
  backgroundColor: string;
  dotSize: number;
  gridSpacing: number;
}

export interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  scale?: number;
}

