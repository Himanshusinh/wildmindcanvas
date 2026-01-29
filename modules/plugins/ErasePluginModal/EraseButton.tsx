'use client';

import React from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { GenerateArrowIcon } from '@/modules/ui-global/common/GenerateArrowIcon';

interface EraseButtonProps {
  scale: number;
  isErasing: boolean;
  externalIsErasing?: boolean;
  sourceImageUrl: string | null;
  onErase: () => void;
}

export const EraseButton: React.FC<EraseButtonProps> = ({
  scale,
  isErasing,
  externalIsErasing,
  sourceImageUrl,
  onErase,
}) => {
  const isDark = useIsDarkTheme();
  const isDisabled = isErasing || externalIsErasing || !sourceImageUrl;
  const isActive = !isDisabled;
  const disabledBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <button
      onClick={onErase}
      disabled={isDisabled}
      style={{
        minWidth: `${80 * scale}px`,
        height: `${40 * scale}px`,
        padding: `0 ${16 * scale}px`,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isActive ? SELECTION_COLOR : disabledBg,
        border: 'none',
        borderRadius: `${10 * scale}px`,
        cursor: isActive ? 'pointer' : 'not-allowed',
        color: 'white',
        boxShadow: isActive ? `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)` : 'none',
        opacity: (isErasing || externalIsErasing) ? 0.6 : 1,
        fontSize: `${14 * scale}px`,
        fontWeight: 500,
        transition: 'background-color 0.3s ease',
      }}
      onMouseEnter={(e) => {
        if (isActive) {
          e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(76, 131, 255, 0.5)`;
        }
      }}
      onMouseLeave={(e) => {
        if (isActive) {
          e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`;
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {isErasing || externalIsErasing ? (
        <span>Erasing...</span>
      ) : (
        <GenerateArrowIcon scale={scale} />
      )}
    </button>
  );
};

