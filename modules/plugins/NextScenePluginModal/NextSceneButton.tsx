'use client';

import React from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

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
        gap: `${6 * scale}px`,
        padding: `${8 * scale}px ${16 * scale}px`,
        backgroundColor: isLoading ? (isDark ? '#333' : '#ddd') : '#437eb5',
        color: '#ffffff',
        border: 'none',
        borderRadius: `${8 * scale}px`,
        fontSize: `${13 * scale}px`,
        fontWeight: 600,
        cursor: (isLoading || !sourceImageUrl) ? 'not-allowed' : 'pointer',
        opacity: (isLoading || !sourceImageUrl) ? 0.7 : 1,
        whiteSpace: 'nowrap',
        boxShadow: isLoading
          ? 'none'
          : (isDark ? `0 ${2 * scale}px ${4 * scale}px rgba(0,0,0,0.3)` : `0 ${2 * scale}px ${4 * scale}px rgba(67, 126, 181, 0.3)`),

        transform: isLoading ? 'scale(0.98)' : 'scale(1)',
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
        <svg
          width={`${16 * scale}px`}
          height={`${16 * scale}px`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
};
