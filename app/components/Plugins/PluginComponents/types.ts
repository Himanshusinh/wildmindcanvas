export type CanvasPoint = { x: number; y: number };

export interface BaseCanvasPluginModalProps {
  isOpen: boolean;
  isExpanded?: boolean;
  id?: string;
  onClose: () => void;

  stageRef: React.RefObject<any>;
  scale: number;
  position: CanvasPoint;
  x: number;
  y: number;

  onPositionChange?: (x: number, y: number) => void;
  onPositionCommit?: (x: number, y: number) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onDuplicate?: () => void;
  isSelected?: boolean;
}

