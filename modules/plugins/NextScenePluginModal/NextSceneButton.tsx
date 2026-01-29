'use client';

import React from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { GenerateArrowIcon } from '@/modules/ui-global/common/GenerateArrowIcon';

interface NextSceneButtonProps {
  scale: number;
  isProcessing: boolean;
  externalIsProcessing?: boolean;
  sourceImageUrl: string | null;
  onNextScene: () => void;
}

export const NextSceneButton: React.FC<NextSceneButtonProps> = ({
  scale,
  isProcessing,
  externalIsProcessing,
  sourceImageUrl,
  onNextScene,
}) => {
  const isDark = useIsDarkTheme();

  // Combine internal and external loading states
  const isLoading = isProcessing || externalIsProcessing;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!isLoading && sourceImageUrl) {
          onNextScene();
        }
      }}
      disabled={isLoading || !sourceImageUrl}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: `${40 * scale}px`,
        padding: `0 ${16 * scale}px`,
        backgroundColor: isLoading ? (isDark ? '#333' : '#ddd') : SELECTION_COLOR,
        color: '#ffffff',
        border: 'none',
        borderRadius: `${10 * scale}px`,
        fontSize: `${13 * scale}px`,
        fontWeight: 600,
        cursor: (isLoading || !sourceImageUrl) ? 'not-allowed' : 'pointer',
        opacity: (isLoading || !sourceImageUrl) ? 0.7 : 1,
        whiteSpace: 'nowrap',
        boxShadow: isLoading || !sourceImageUrl
          ? 'none'
          : `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`,
        transition: 'all 0.3s ease',
        transform: isLoading ? 'scale(0.98)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!isLoading && sourceImageUrl) {
          e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(76, 131, 255, 0.5)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading && sourceImageUrl) {
          e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`;
        }
      }}
    >
      {isLoading ? (
        <div className="animate-spin">
          <svg width={`${16 * scale}px`} height={`${16 * scale}px`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12H19C19 15.866 15.866 19 12 19V22Z" fill="currentColor" />
            <path d="M2 12C2 6.47715 6.47715 2 12 2V5C8.13401 5 5 8.13401 5 12H2Z" fill="currentColor" />
          </svg>
        </div>
      ) : (
        <GenerateArrowIcon scale={scale} />
      )}
    </button>
  );
};
