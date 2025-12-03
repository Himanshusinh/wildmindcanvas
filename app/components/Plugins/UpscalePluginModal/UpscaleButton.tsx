'use client';

import React from 'react';

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
        padding: `${8 * scale}px ${16 * scale}px`,
        fontSize: `${12 * scale}px`,
        fontWeight: 600,
        color: '#ffffff',
        backgroundColor: isDisabled ? disabledBg : '#437eb5',
        border: 'none',
        borderRadius: `${8 * scale}px`,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        whiteSpace: 'nowrap',
        opacity: isDisabled ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = '#3b6fa8';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = '#437eb5';
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <svg
        width={16 * scale}
        height={16 * scale}
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
    </button>
  );
};