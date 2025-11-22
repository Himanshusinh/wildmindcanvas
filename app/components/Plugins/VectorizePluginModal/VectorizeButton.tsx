'use client';

import React from 'react';

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
        padding: `${8 * scale}px ${16 * scale}px`,
        fontSize: `${12 * scale}px`,
        fontWeight: 600,
        color: '#ffffff',
        backgroundColor: disabled ? '#9ca3af' : '#437eb5',
        border: 'none',
        borderRadius: `${8 * scale}px`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.6 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: `${6 * scale}px`,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#3b6fa8';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = '#437eb5';
        }
      }}
    >
      {isVectorizing || externalIsVectorizing ? (
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
      ) : (
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
      )}
    </button>
  );
};

