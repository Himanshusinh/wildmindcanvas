'use client';

import React from 'react';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { GenerateArrowIcon } from '@/modules/ui-global/common/GenerateArrowIcon';

interface VectorizeButtonProps {
  scale: number;
  isVectorizing: boolean;
  externalIsVectorizing?: boolean;
  sourceImageUrl: string | null;
  onVectorize: () => void;
}

export const VectorizeButton: React.FC<VectorizeButtonProps> = ({
  scale,
  isVectorizing,
  externalIsVectorizing,
  sourceImageUrl,
  onVectorize,
}) => {
  const disabled = !sourceImageUrl || isVectorizing || externalIsVectorizing;

  return (
    <button
      onClick={onVectorize}
      disabled={disabled}
      style={{
        height: `${40 * scale}px`,
        padding: `0 ${16 * scale}px`,
        fontSize: `${12 * scale}px`,
        fontWeight: 600,
        color: '#ffffff',
        backgroundColor: disabled ? '#9ca3af' : SELECTION_COLOR,
        border: 'none',
        borderRadius: `${10 * scale}px`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: `${6 * scale}px`,
        boxShadow: disabled ? 'none' : `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#3d6edb';
          e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(76, 131, 255, 0.5)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = SELECTION_COLOR;
          e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`;
        }
      }}
    >
      {isVectorizing || externalIsVectorizing ? (
        <GenerateArrowIcon scale={scale} />
      ) : (
        <GenerateArrowIcon scale={scale} />
      )}
    </button>
  );
};

