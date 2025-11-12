'use client';

import { Rect } from 'react-konva';

interface CanvasBackgroundProps {
  patternImage: HTMLImageElement | null;
  canvasSize: { width: number; height: number };
}

export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({ patternImage, canvasSize }) => {
  if (!patternImage) return null;

  return (
    <Rect
      x={0}
      y={0}
      width={canvasSize.width}
      height={canvasSize.height}
      fillPatternImage={patternImage}
      fillPatternRepeat="repeat"
    />
  );
};

