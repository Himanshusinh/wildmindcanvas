'use client';

import React, { useEffect, useState } from 'react';

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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const containerBg = isDark ? '#1a1a1a' : '#f3f4f6';
  const labelText = isDark ? '#cccccc' : '#6b7280';
  const selectedBg = isDark ? 'rgba(59, 130, 246, 0.3)' : '#3B82F64D';
  const selectedText = isDark ? '#ffffff' : '#1f2937';
  const unselectedText = isDark ? '#999999' : '#6b7280';
  const unselectedHoverText = isDark ? '#cccccc' : '#1f2937';
  const helperText = isDark ? '#999999' : '#9ca3af';

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
          color: labelText,
          marginBottom: `${4 * scale}px`,
          transition: 'color 0.3s ease',
        }}
      >
        Mode
      </label>
      <div
        style={{
          display: 'flex',
          backgroundColor: containerBg,
          borderRadius: `${8 * scale}px`,
          padding: `${4 * scale}px`,
          gap: `${4 * scale}px`,
          position: 'relative',
          transition: 'background-color 0.3s ease',
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
                transition: 'all 0.3s ease',
                backgroundColor: isSelected ? selectedBg : 'transparent',
                color: isSelected ? selectedText : unselectedText,
                boxShadow: isSelected ? (isDark ? `0 ${2 * scale}px ${4 * scale}px rgba(0, 0, 0, 0.3)` : `0 ${2 * scale}px ${4 * scale}px rgba(0, 0, 0, 0.1)`) : 'none',
                whiteSpace: 'nowrap',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.color = unselectedHoverText;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.color = unselectedText;
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
            color: helperText,
            margin: 0,
            lineHeight: 1.4,
            transition: 'color 0.3s ease',
          }}
        >
          First converts image to 2D vector using Seedream, then vectorizes the result
        </p>
      )}
      {selectedMode === 'Detailed' && (
        <p
          style={{
            fontSize: `${11 * scale}px`,
            color: helperText,
            margin: 0,
            lineHeight: 1.4,
            transition: 'color 0.3s ease',
          }}
        >
          Uses an advanced algorithm for highly detailed vectorization, suitable for production.
        </p>
      )}
    </div>
  );
};

