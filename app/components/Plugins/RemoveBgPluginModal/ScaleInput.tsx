'use client';

import React from 'react';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface ScaleInputProps {
  scaleValue: number;
  scale: number;
  onScaleChange: (newScale: number) => void;
}

export const ScaleInput: React.FC<ScaleInputProps> = ({
  scaleValue,
  scale,
  onScaleChange,
}) => {
  const isDark = useIsDarkTheme();

  const dropdownBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)';
  const buttonBg = isDark ? '#121212' : '#ffffff';
  const buttonText = isDark ? '#ffffff' : '#1f2937';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px`, flexShrink: 0 }}>
      <button
        onClick={() => {
          const newScale = Math.max(0.0, Math.round((scaleValue - 0.1) * 10) / 10);
          onScaleChange(newScale);
        }}
        style={{
          width: `${32 * scale}px`,
          height: `${32 * scale}px`,
          borderRadius: '50%',
          border: `1px solid ${dropdownBorderColor}`,
          backgroundColor: buttonBg,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${18 * scale}px`,
          color: buttonText,
          transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
        }}
      >
        −
      </button>
      <span style={{ minWidth: `${40 * scale}px`, textAlign: 'center', fontSize: `${13 * scale}px`, color: buttonText, transition: 'color 0.3s ease' }}>
        {scaleValue.toFixed(1)}
      </span>
      <button
        onClick={() => {
          const newScale = Math.min(1.0, Math.round((scaleValue + 0.1) * 10) / 10);
          onScaleChange(newScale);
        }}
        style={{
          width: `${32 * scale}px`,
          height: `${32 * scale}px`,
          borderRadius: '50%',
          border: `1px solid ${dropdownBorderColor}`,
          backgroundColor: buttonBg,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${18 * scale}px`,
          color: buttonText,
          transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
        }}
      >
        +
      </button>
    </div>
  );
};

