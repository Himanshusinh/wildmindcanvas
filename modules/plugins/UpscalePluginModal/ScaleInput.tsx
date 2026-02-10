'use client';

import React from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

interface ScaleInputProps {
  scaleValue: number;
  scale: number;
  onScaleChange: (newScale: number) => void;
  maxScale?: number;
}

export const ScaleInput: React.FC<ScaleInputProps> = ({
  scaleValue,
  scale,
  onScaleChange,
  maxScale = 6,
}) => {
  const isDark = useIsDarkTheme();

  const dropdownBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)';
  const buttonBg = isDark ? '#121212' : '#ffffff';
  const buttonText = isDark ? '#ffffff' : '#1f2937';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderRadius: `${10 * scale}px`,
      border: `1px solid ${dropdownBorderColor}`,
      overflow: 'hidden',
      padding: `${2 * scale}px`
    }}>
      <button
        type="button"
        onClick={() => {
          const newScale = Math.max(1, scaleValue - 1);
          onScaleChange(newScale);
        }}
        style={{
          width: `${30 * scale}px`,
          height: `${30 * scale}px`,
          borderRadius: `${8 * scale}px`,
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: buttonText,
          transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <span style={{
        minWidth: `${28 * scale}px`,
        textAlign: 'center',
        fontSize: `${13 * scale}px`,
        fontWeight: 600,
        color: buttonText,
        userSelect: 'none'
      }}>
        {scaleValue}x
      </span>
      <button
        type="button"
        onClick={() => {
          const newScale = Math.min(maxScale, scaleValue + 1);
          onScaleChange(newScale);
        }}
        style={{
          width: `${30 * scale}px`,
          height: `${30 * scale}px`,
          borderRadius: `${8 * scale}px`,
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: buttonText,
          transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
};

