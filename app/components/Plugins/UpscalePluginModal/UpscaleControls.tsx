'use client';

import React, { useState } from 'react';
import { ModelDropdown } from './ModelDropdown';
import { ScaleInput } from './ScaleInput';
import { UpscaleButton } from './UpscaleButton';
import { Layers } from 'lucide-react';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface UpscaleControlsProps {
  scale: number;
  selectedModel: string;
  scaleValue: number;
  isUpscaling: boolean;
  externalIsUpscaling?: boolean;
  sourceImageUrl: string | null;
  frameBorderColor: string;
  frameBorderWidth: number;
  onModelChange: (model: string) => void;
  onScaleChange: (newScale: number) => void;
  onUpscale: () => void;
  onHoverChange: (hovered: boolean) => void;
  extraTopPadding?: number;
  localUpscaledImageUrl?: string | null;
  onPreview?: () => void;
}

export const UpscaleControls: React.FC<UpscaleControlsProps> = ({
  scale,
  selectedModel,
  scaleValue,
  isUpscaling,
  externalIsUpscaling,
  sourceImageUrl,
  frameBorderColor,
  frameBorderWidth,
  onModelChange,
  onScaleChange,
  onUpscale,
  onHoverChange,
  extraTopPadding,
  localUpscaledImageUrl,
  onPreview,
}) => {
  const isDark = useIsDarkTheme();

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const basePadding = 16 * scale;
  const computedTopPadding = Math.max(basePadding, extraTopPadding ?? basePadding);

  console.log('[UpscaleControls] Render', {
    localUpscaledImageUrl,
    hasOnPreview: !!onPreview,
    isDark
  });

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
      <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center' }}>
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
        <ScaleInput
          scaleValue={scaleValue}
          scale={scale}
          onScaleChange={onScaleChange}
        />
        <UpscaleButton
          scale={scale}
          isUpscaling={isUpscaling}
          externalIsUpscaling={externalIsUpscaling}
          sourceImageUrl={sourceImageUrl}
          onUpscale={onUpscale}
        />

      </div>
    </div>
  );
};

