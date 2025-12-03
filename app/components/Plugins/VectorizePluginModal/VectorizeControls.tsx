'use client';

import React from 'react';
import { VectorizeButton } from './VectorizeButton';
import { ModeSwitch } from './ModeSwitch';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface VectorizeControlsProps {
  scale: number;
  mode: string;
  isVectorizing: boolean;
  externalIsVectorizing?: boolean;
  sourceImageUrl: string | null;
  frameBorderColor: string;
  frameBorderWidth: number;
  onModeChange: (mode: string) => void;
  onVectorize: () => void;
  onHoverChange: (hovered: boolean) => void;
  extraTopPadding?: number;
}

export const VectorizeControls: React.FC<VectorizeControlsProps> = ({
  scale,
  mode,
  isVectorizing,
  externalIsVectorizing,
  sourceImageUrl,
  frameBorderColor,
  frameBorderWidth,
  onModeChange,
  onVectorize,
  onHoverChange,
  extraTopPadding,
}) => {
  const isDark = useIsDarkTheme();

  const basePadding = 12 * scale;
  const computedTopPadding = Math.max(basePadding, extraTopPadding ?? basePadding);
  const topRadius = 16 * scale;

  return (
    <div
      className="controls-overlay"
      style={{
        position: 'relative',
        width: `${400 * scale}px`,
        maxWidth: '90vw',
        backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: `${topRadius}px ${topRadius}px 0 0`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${12 * scale}px`,
        overflow: 'visible',
        zIndex: 10,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        padding: `${basePadding}px`,
        paddingTop: `${computedTopPadding}px`,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <ModeSwitch
        selectedMode={mode}
        scale={scale}
        onModeChange={onModeChange}
        actionSlot={(
          <VectorizeButton
            scale={scale}
            isVectorizing={isVectorizing}
            externalIsVectorizing={externalIsVectorizing}
            sourceImageUrl={sourceImageUrl}
            onVectorize={onVectorize}
          />
        )}
      />
    </div>
  );
};

