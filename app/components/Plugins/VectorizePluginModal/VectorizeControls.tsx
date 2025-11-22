'use client';

import React from 'react';
import { VectorizeButton } from './VectorizeButton';
import { ModeSwitch } from './ModeSwitch';

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
}) => {
  return (
    <div
      className="controls-overlay"
      style={{
        position: 'relative',
        width: `${400 * scale}px`,
        maxWidth: '90vw',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: `${16 * scale}px ${16 * scale}px 0 0`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${12 * scale}px`,
        overflow: 'visible',
        zIndex: 10,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        padding: `${12 * scale}px`,
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <ModeSwitch
        selectedMode={mode}
        scale={scale}
        onModeChange={onModeChange}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <VectorizeButton
          scale={scale}
          isVectorizing={isVectorizing}
          externalIsVectorizing={externalIsVectorizing}
          sourceImageUrl={sourceImageUrl}
          onVectorize={onVectorize}
        />
      </div>
    </div>
  );
};

