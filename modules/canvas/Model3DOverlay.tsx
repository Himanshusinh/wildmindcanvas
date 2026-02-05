'use client';

import React, { useEffect, useState, Suspense, lazy } from 'react';
import Konva from 'konva';
import { ImageUpload } from '@/core/types/canvas';
const Model3D = lazy(() => import('@/modules/generators/Model3D').then(m => ({ default: m.Model3D })));

interface Model3DOverlayProps {
  images: ImageUpload[];
  allImages: ImageUpload[];
  stageRef: React.RefObject<Konva.Stage | null>;
  onImageUpdate?: (index: number, updates: Partial<ImageUpload>) => void;
}

export const Model3DOverlay: React.FC<Model3DOverlayProps> = ({
  images,
  allImages,
  stageRef,
  onImageUpdate,
}) => {
  const [stageState, setStageState] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });

  // Update stage state when stage moves or zooms
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateState = () => {
      setStageState({
        x: stage.x(),
        y: stage.y(),
        scale: stage.scaleX(),
      });
    };

    // Initial state
    updateState();

    // Listen for stage changes
    const interval = setInterval(updateState, 16); // ~60fps

    return () => clearInterval(interval);
  }, [stageRef]);

  return (
    <Suspense fallback={null}>
      {images.map((imageData, index) => {
        // Convert canvas coordinates to screen coordinates
        const canvasX = imageData.x || 0;
        const canvasY = imageData.y || 0;
        const canvasWidth = imageData.width || 400;
        const canvasHeight = imageData.height || 400;

        const screenX = canvasX * stageState.scale + stageState.x;
        const screenY = canvasY * stageState.scale + stageState.y;
        const screenWidth = canvasWidth * stageState.scale;
        const screenHeight = canvasHeight * stageState.scale;

        return (
          <Model3D
            key={`${imageData.url}-${index}`}
            modelData={imageData}
            x={screenX}
            y={screenY}
            width={screenWidth}
            height={screenHeight}
            onUpdate={(updates) => {
              if (onImageUpdate) {
                // Find the actual index in the full images array
                const actualIndex = allImages.findIndex(img => img.url === imageData.url);
                if (actualIndex !== -1) {
                  onImageUpdate(actualIndex, updates);
                }
              }
            }}
          />
        );
      })}
    </Suspense>
  );
};

