'use client';

import { useRef } from 'react';
import { Circle } from 'react-konva';
import Konva from 'konva';

interface ResizeHandleProps {
  x: number;
  y: number;
  onDragEnd: (newX: number, newY: number) => void;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ x, y, onDragEnd }) => {
  const handleRef = useRef<Konva.Circle>(null);

  return (
    <Circle
      ref={handleRef}
      x={x}
      y={y}
      radius={10}
      fill="#3b82f6"
      stroke="#1e40af"
      strokeWidth={2}
      draggable
      name="resize-handle"
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        onDragEnd(node.x(), node.y());
      }}
      onClick={(e: Konva.KonvaEventObject<MouseEvent>) => {
        // Stop event propagation to prevent clearing selection
        e.cancelBubble = true;
      }}
      onMouseDown={(e: Konva.KonvaEventObject<MouseEvent>) => {
        // Stop event propagation to prevent clearing selection
        e.cancelBubble = true;
      }}
      onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = 'nwse-resize';
        }
      }}
      onMouseLeave={(e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage();
        if (stage) {
          stage.container().style.cursor = 'default';
        }
      }}
    />
  );
};

