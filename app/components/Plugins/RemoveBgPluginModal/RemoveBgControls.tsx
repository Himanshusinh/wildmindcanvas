'use client';

import React, { useState, useEffect } from 'react';
import { ModelDropdown } from './ModelDropdown';
import { BackgroundTypeDropdown } from './BackgroundTypeDropdown';
import { ScaleInput } from './ScaleInput';
import { RemoveBgButton } from './RemoveBgButton';

interface RemoveBgControlsProps {
  scale: number;
  selectedModel: string;
  selectedBackgroundType: string;
  scaleValue: number;
  isRemovingBg: boolean;
  externalIsRemovingBg?: boolean;
  sourceImageUrl: string | null;
  frameBorderColor: string;
  frameBorderWidth: number;
  onModelChange: (model: string) => void;
  onBackgroundTypeChange: (backgroundType: string) => void;
  onScaleChange: (newScale: number) => void;
  onRemoveBg: () => void;
  onHoverChange: (hovered: boolean) => void;
}

export const RemoveBgControls: React.FC<RemoveBgControlsProps> = ({
  scale,
  selectedModel,
  selectedBackgroundType,
  scaleValue,
  isRemovingBg,
  externalIsRemovingBg,
  sourceImageUrl,
  frameBorderColor,
  frameBorderWidth,
  onModelChange,
  onBackgroundTypeChange,
  onScaleChange,
  onRemoveBg,
  onHoverChange,
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

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isBackgroundTypeDropdownOpen, setIsBackgroundTypeDropdownOpen] = useState(false);

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
        <ModelDropdown
          selectedModel={selectedModel}
          scale={scale}
          isOpen={isModelDropdownOpen}
          onToggle={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          onSelect={(model) => {
            onModelChange(model);
            setIsModelDropdownOpen(false);
          }}
        />
        <BackgroundTypeDropdown
          selectedBackgroundType={selectedBackgroundType}
          scale={scale}
          isOpen={isBackgroundTypeDropdownOpen}
          onToggle={() => setIsBackgroundTypeDropdownOpen(!isBackgroundTypeDropdownOpen)}
          onSelect={(backgroundType) => {
            onBackgroundTypeChange(backgroundType);
            setIsBackgroundTypeDropdownOpen(false);
          }}
        />
        <ScaleInput
          scaleValue={scaleValue}
          scale={scale}
          onScaleChange={onScaleChange}
        />
        <RemoveBgButton
          scale={scale}
          isRemovingBg={isRemovingBg}
          externalIsRemovingBg={externalIsRemovingBg}
          sourceImageUrl={sourceImageUrl}
          onRemoveBg={onRemoveBg}
        />
      </div>
    </div>
  );
};

