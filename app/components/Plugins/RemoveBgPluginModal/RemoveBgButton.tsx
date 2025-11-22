'use client';

import React from 'react';

interface RemoveBgButtonProps {
  scale: number;
  isRemovingBg: boolean;
  externalIsRemovingBg?: boolean;
  sourceImageUrl: string | null;
  onRemoveBg: () => void;
}

export const RemoveBgButton: React.FC<RemoveBgButtonProps> = ({
  scale,
  isRemovingBg,
  externalIsRemovingBg,
  sourceImageUrl,
  onRemoveBg,
}) => {
  const isDisabled = isRemovingBg || externalIsRemovingBg || !sourceImageUrl;
  const isActive = !isDisabled;

  return (
    <button
      onClick={onRemoveBg}
      disabled={isDisabled}
      style={{
        width: `${40 * scale}px`,
        height: `${40 * scale}px`,
        minWidth: `${40 * scale}px`,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isActive ? '#437eb5' : 'rgba(0, 0, 0, 0.1)',
        border: 'none',
        borderRadius: `${10 * scale}px`,
        cursor: isActive ? 'pointer' : 'not-allowed',
        color: 'white',
        boxShadow: isActive ? `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)` : 'none',
        padding: `0 ${16 * scale}px`,
        opacity: (isRemovingBg || externalIsRemovingBg) ? 0.6 : 1,
        fontSize: `${14 * scale}px`,
        fontWeight: 500,
      }}
      onMouseEnter={(e) => {
        if (isActive) {
          e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(67, 126, 181, 0.5)`;
        }
      }}
      onMouseLeave={(e) => {
        if (isActive) {
          e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)`;
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {isRemovingBg || externalIsRemovingBg ? (
        <>
          <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeDasharray="31.416" strokeDashoffset="31.416">
              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416;0 31.416" repeatCount="indefinite" />
              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416;-31.416" repeatCount="indefinite" />
            </path>
          </svg>
          <span>Removing...</span>
        </>
      ) : (
        <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
};

