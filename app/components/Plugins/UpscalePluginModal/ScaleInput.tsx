'use client';

import React from 'react';

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
  const dropdownBorderColor = 'rgba(0,0,0,0.1)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
      <button
        onClick={() => {
          const newScale = Math.max(1, scaleValue - 1);
          onScaleChange(newScale);
        }}
        style={{
          width: `${32 * scale}px`,
          height: `${32 * scale}px`,
          borderRadius: '50%',
          border: `1px solid ${dropdownBorderColor}`,
          backgroundColor: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${18 * scale}px`,
          color: '#1f2937',
        }}
      >
        −
      </button>
      <span style={{ minWidth: `${40 * scale}px`, textAlign: 'center', fontSize: `${14 * scale}px`, color: '#1f2937' }}>
        {scaleValue}x
      </span>
      <button
        onClick={() => {
          const newScale = Math.min(6, scaleValue + 1);
          onScaleChange(newScale);
        }}
        style={{
          width: `${32 * scale}px`,
          height: `${32 * scale}px`,
          borderRadius: '50%',
          border: `1px solid ${dropdownBorderColor}`,
          backgroundColor: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${18 * scale}px`,
          color: '#1f2937',
        }}
      >
        +
      </button>
    </div>
  );
};

