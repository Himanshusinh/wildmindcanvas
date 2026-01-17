'use client';

import React from 'react';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { GenerateArrowIcon } from '@/modules/ui-global/common/GenerateArrowIcon';

interface UpscaleButtonProps {
  scale: number;
  isUpscaling: boolean;
  externalIsUpscaling?: boolean;
  sourceImageUrl: string | null;
  onUpscale: () => void;
}

export const UpscaleButton: React.FC<UpscaleButtonProps> = ({
  scale,
  isUpscaling,
  externalIsUpscaling,
  sourceImageUrl,
  onUpscale,
}) => {
  const isDisabled = isUpscaling || externalIsUpscaling || !sourceImageUrl;
  const disabledBg = '#9ca3af';

  return (
    <button
      onClick={onUpscale}
      disabled={isDisabled}
      style={{
        height: `${40 * scale}px`,
        padding: `0 ${16 * scale}px`,
        fontSize: `${12 * scale}px`,
        fontWeight: 600,
        color: '#ffffff',
        backgroundColor: isDisabled ? disabledBg : SELECTION_COLOR,
        border: 'none',
        borderRadius: `${10 * scale}px`,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        whiteSpace: 'nowrap',
        opacity: isDisabled ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isDisabled ? 'none' : `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = '#3d6edb';
          e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(76, 131, 255, 0.5)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = SELECTION_COLOR;
          e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`;
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <GenerateArrowIcon scale={scale} />
    </button>
  );
};