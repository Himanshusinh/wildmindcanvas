export type ActiveSection = 'profile' | 'canvas' | 'keyboard' | 'notification';
export type CursorType = 'default' | 'crosshair' | 'pointer' | 'grab' | 'text';
export type BackgroundType = 'dots' | 'dots-vertical' | 'dots-horizontal' | 'lines-vertical' | 'lines-horizontal' | 'grid' | 'solid' | 'none';
export type NavigationMode = 'trackpad' | 'mouse';

export interface CanvasSettings {
  cursorType: CursorType;
  backgroundType: BackgroundType;
  dotColor: string;
  backgroundColor: string;
  dotSize: number;
  gridSpacing: number;
  navigationMode: NavigationMode;
}

export interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  scale?: number;
}

