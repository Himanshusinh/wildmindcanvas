'use client';

import React from 'react';

const MODES = [
  { value: 'simple', label: 'simple' },
  { value: 'Detailed', label: 'Detailed' },
];

interface ModeSwitchProps {
  selectedMode: string;
  scale: number;
  onModeChange: (mode: string) => void;
}

export const ModeSwitch: React.FC<ModeSwitchProps> = ({
  selectedMode,
  scale,
  onModeChange,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${8 * scale}px`,
        width: '100%',
      }}
    >
      <label
        style={{
          fontSize: `${12 * scale}px`,
          fontWeight: 500,
          color: '#6b7280',
          marginBottom: `${4 * scale}px`,
        }}
      >
        Mode
      </label>
      <div
        style={{
          display: 'flex',
          backgroundColor: '#f3f4f6',
          borderRadius: `${8 * scale}px`,
          padding: `${4 * scale}px`,
          gap: `${4 * scale}px`,
          position: 'relative',
        }}
      >
        {MODES.map((mode) => {
          const isSelected = selectedMode === mode.value;
          return (
            <button
              key={mode.value}
              onClick={() => onModeChange(mode.value)}
              style={{
                flex: 1,
                padding: `${8 * scale}px ${12 * scale}px`,
                borderRadius: `${6 * scale}px`,
                fontSize: `${12 * scale}px`,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: isSelected ? '#3B82F64D' : 'transparent',
                color: isSelected ? '#1f2937' : '#6b7280',
                boxShadow: isSelected ? `0 ${2 * scale}px ${4 * scale}px rgba(0, 0, 0, 0.1)` : 'none',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.color = '#1f2937';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
      {selectedMode === 'simple' && (
        <p
          style={{
            fontSize: `${11 * scale}px`,
            color: '#9ca3af',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          First converts image to 2D vector using Seedream, then vectorizes the result
        </p>
      )}
      {selectedMode === 'Detailed' && (
        <p
          style={{
            fontSize: `${11 * scale}px`,
            color: '#9ca3af',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          Uses an advanced algorithm for highly detailed vectorization, suitable for production.
        </p>
      )}
    </div>
  );
};

