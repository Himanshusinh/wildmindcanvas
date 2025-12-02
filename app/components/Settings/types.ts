export type ActiveSection = 'profile' | 'canvas' | 'keyboard' | 'notification';
export type CursorType = 'default' | 'crosshair' | 'pointer' | 'grab' | 'text';
export type BackgroundType = 'dots' | 'dots-vertical' | 'dots-horizontal' | 'lines-vertical' | 'lines-horizontal' | 'grid' | 'solid' | 'none';

export interface CanvasSettings {
  cursorType: CursorType;
  backgroundType: BackgroundType;
  dotColor: string;
  backgroundColor: string;
  dotSize: number;
  gridSpacing: number;
  showPointerTool?: boolean;
  showMoveTool?: boolean;
  showThemeToggle?: boolean;
}

export interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  scale?: number;
}

