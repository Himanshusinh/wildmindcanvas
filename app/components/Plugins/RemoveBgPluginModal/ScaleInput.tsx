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
      <span style={{ minWidth: `${40 * scale}px`, textAlign: 'center', fontSize: `${13 * scale}px`, color: '#1f2937' }}>
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

