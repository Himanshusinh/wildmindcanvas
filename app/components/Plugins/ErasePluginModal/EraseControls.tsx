'use client';

import React, { useState } from 'react';
import { EraseModelDropdown } from './EraseModelDropdown';
import { EraseButton } from './EraseButton';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface EraseControlsProps {
  scale: number;
  selectedModel: string;
  isErasing: boolean;
  externalIsErasing?: boolean;
  sourceImageUrl: string | null;
  frameBorderColor: string;
  frameBorderWidth: number;
  onModelChange: (model: string) => void;
  onErase: () => void;
  onHoverChange: (hovered: boolean) => void;
}

export const EraseControls: React.FC<EraseControlsProps> = ({
  scale,
  selectedModel,
  isErasing,
  externalIsErasing,
  sourceImageUrl,
  frameBorderColor,
  frameBorderWidth,
  onModelChange,
  onErase,
  onHoverChange,
}) => {
  const isDark = useIsDarkTheme();

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

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
        borderRadius: `${16 * scale}px ${16 * scale}px 0 0`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${10 * scale}px`,
        overflow: 'visible',
        zIndex: 10,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        padding: `${12 * scale}px`,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div style={{ display: 'flex', gap: `${4 * scale}px`, alignItems: 'center', width: '100%', minWidth: 0 }}>
        <EraseModelDropdown
          selectedModel={selectedModel}
          scale={scale}
          isOpen={isModelDropdownOpen}
          onToggle={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          onSelect={(model) => {
            onModelChange(model);
            setIsModelDropdownOpen(false);
          }}
        />
        <EraseButton
          scale={scale}
          isErasing={isErasing}
          externalIsErasing={externalIsErasing}
          sourceImageUrl={sourceImageUrl}
          onErase={onErase}
        />
      </div>
    </div>
  );
};

