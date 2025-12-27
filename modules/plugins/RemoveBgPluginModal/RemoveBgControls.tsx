'use client';

import React, { useState } from 'react';
import { ModelDropdown } from './ModelDropdown';
import { BackgroundTypeDropdown } from './BackgroundTypeDropdown';
import { ScaleInput } from './ScaleInput';
import { RemoveBgButton } from './RemoveBgButton';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

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
  extraTopPadding?: number;
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
  extraTopPadding,
}) => {
  const isDark = useIsDarkTheme();

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isBackgroundTypeDropdownOpen, setIsBackgroundTypeDropdownOpen] = useState(false);
  const basePadding = 12 * scale;
  const computedTopPadding = Math.max(basePadding, extraTopPadding ?? basePadding);

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
        zIndex: 2002,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * scale}px`, width: '100%' }}>
        {/* Row 1: model + action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${8 * scale}px`,
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: `${180 * scale}px` }}>
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
          </div>
          <div style={{ flexShrink: 0 }}>
            <RemoveBgButton
              scale={scale}
              isRemovingBg={isRemovingBg}
              externalIsRemovingBg={externalIsRemovingBg}
              sourceImageUrl={sourceImageUrl}
              onRemoveBg={onRemoveBg}
            />
          </div>
        </div>

        {/* Row 2: background dropdown + scale */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${8 * scale}px`,
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: `${180 * scale}px` }}>
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
          </div>
          <div style={{ flexShrink: 0 }}>
            <ScaleInput
              scaleValue={scaleValue}
              scale={scale}
              onScaleChange={onScaleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

