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
        padding: `0 ${20 * scale}px`,
        fontSize: `${13 * scale}px`,
        fontWeight: 600,
        color: '#ffffff',
        background: isDisabled
          ? disabledBg
          : `linear-gradient(135deg, ${SELECTION_COLOR} 0%, #3b82f6 100%)`,
        border: 'none',
        borderRadius: `${12 * scale}px`,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.3s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, filter 0.3s ease',
        whiteSpace: 'nowrap',
        opacity: isDisabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${8 * scale}px`,
        boxShadow: isDisabled
          ? 'none'
          : `0 ${4 * scale}px ${14 * scale}px rgba(59, 130, 246, 0.4)`,
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${20 * scale}px rgba(59, 130, 246, 0.5)`;
          e.currentTarget.style.filter = 'brightness(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${14 * scale}px rgba(59, 130, 246, 0.4)`;
          e.currentTarget.style.filter = 'brightness(1)';
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span style={{ letterSpacing: '0.01em' }}>Upscale</span>
      <GenerateArrowIcon scale={scale} />
    </button>
  );
};