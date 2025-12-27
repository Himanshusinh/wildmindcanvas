'use client';

import React from 'react';

interface UpscaleLabelProps {
  isHovered: boolean;
  scale: number;
  imageResolution: { width: number; height: number } | null;
}

export const UpscaleLabel: React.FC<UpscaleLabelProps> = ({
  isHovered,
  scale,
  imageResolution,
}) => {
  if (!isHovered) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${-32 * scale}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#ffffff',
        padding: `${4 * scale}px ${12 * scale}px`,
        borderRadius: `${6 * scale}px`,
        fontSize: `${12 * scale}px`,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        zIndex: 3000,
        pointerEvents: 'none',
      }}
    >
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span>Upscale</span>
        {imageResolution && (
          <span style={{ marginLeft: 'auto', opacity: 0.7, fontWeight: '500' }}>
            {imageResolution.width} × {imageResolution.height}
          </span>
        )}
      </span>
    </div>
  );
};

