'use client';

import React, { ReactNode } from 'react';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

const DEFAULT_MODES = ['simple', 'Detailed'];
const DEFAULT_LABELS: Record<string, string> = { simple: 'Simple', Detailed: 'Detailed' };

interface ModeSwitchProps {
  selectedMode: string;
  scale: number;
  onModeChange: (mode: string) => void;
  actionSlot?: ReactNode;
  modes?: string[];
  labels?: Record<string, string>;
}

export const ModeSwitch: React.FC<ModeSwitchProps> = ({
  selectedMode,
  scale,
  onModeChange,
  actionSlot,
  modes = DEFAULT_MODES,
  labels = DEFAULT_LABELS,
}) => {
  const isDark = useIsDarkTheme();

  const containerBg = isDark ? '#1a1a1a' : '#f3f4f6';
  const selectedBg = isDark ? 'rgba(59, 130, 246, 0.3)' : '#3B82F64D';
  const selectedText = isDark ? '#ffffff' : '#1f2937';
  const unselectedText = isDark ? '#999999' : '#6b7280';
  const unselectedHoverText = isDark ? '#cccccc' : '#1f2937';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${8 * scale}px`,
        width: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: `${8 * scale}px`,
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            backgroundColor: containerBg,
            borderRadius: `${8 * scale}px`,
            padding: `${4 * scale}px`,
            gap: `${4 * scale}px`,
            position: 'relative',

          }}
        >
          {modes.map((mode) => {
            const isSelected = selectedMode === mode;
            const label = labels[mode] || mode;
            return (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                style={{
                  flex: 1,
                  padding: `${8 * scale}px ${12 * scale}px`,
                  borderRadius: `${6 * scale}px`,
                  fontSize: `${12 * scale}px`,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',

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
                {label}
              </button>
            );
          })}
        </div>
        {actionSlot && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {actionSlot}
          </div>
        )}
      </div>
    </div>
  );
};

