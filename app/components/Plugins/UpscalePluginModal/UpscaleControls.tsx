'use client';

import React, { useState } from 'react';
import { ModelDropdown } from './ModelDropdown';
import { ScaleInput } from './ScaleInput';
import { UpscaleButton } from './UpscaleButton';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

const TOPAZ_MODELS = [
  'Default',
  'Low Resolution V2',
  'Standard V2',
  'CGI',
  'High Fidelity V2',
  'Text Refine',
  'Recovery',
  'Redefine',
  'Recovery V2',
];

interface UpscaleControlsProps {
  scale: number;
  selectedModel: string;
  scaleValue: number;
  faceEnhance: boolean;
  faceEnhanceStrength: number;
  topazModel: string;
  faceEnhanceCreativity: number;
  isUpscaling: boolean;
  externalIsUpscaling?: boolean;
  sourceImageUrl: string | null;
  frameBorderColor: string;
  frameBorderWidth: number;
  onModelChange: (model: string) => void;
  onScaleChange: (newScale: number) => void;
  onFaceEnhanceChange: (val: boolean) => void;
  onFaceEnhanceStrengthChange: (val: number) => void;
  onTopazModelChange: (val: string) => void;
  onFaceEnhanceCreativityChange: (val: number) => void;
  onUpscale: () => void;
  onHoverChange: (hovered: boolean) => void;
  extraTopPadding?: number;
}

export const UpscaleControls: React.FC<UpscaleControlsProps> = ({
  scale,
  selectedModel,
  scaleValue,
  faceEnhance,
  faceEnhanceStrength,
  topazModel,
  faceEnhanceCreativity,
  isUpscaling,
  externalIsUpscaling,
  sourceImageUrl,
  frameBorderColor,
  frameBorderWidth,
  onModelChange,
  onScaleChange,
  onFaceEnhanceChange,
  onFaceEnhanceStrengthChange,
  onTopazModelChange,
  onFaceEnhanceCreativityChange,
  onUpscale,
  onHoverChange,
  extraTopPadding,
}) => {
  const isDark = useIsDarkTheme();

  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isTopazModelDropdownOpen, setIsTopazModelDropdownOpen] = useState(false);
  const basePadding = 16 * scale;
  const computedTopPadding = Math.max(basePadding, extraTopPadding ?? basePadding);

  const supportsFaceEnhance = selectedModel === 'Topaz Upscaler' || selectedModel === 'Real-ESRGAN';
  const isTopaz = selectedModel === 'Topaz Upscaler';
  const supportsFaceStrength = isTopaz;
  const supportsFaceCreativity = isTopaz;

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
          onScaleChange={(val) => {
            // Cap at 4x for Topaz
            if (isTopaz && val > 4) {
              onScaleChange(4);
            } else {
              onScaleChange(val);
            }
          }}
          maxScale={isTopaz ? 4 : 6}
        />
        <UpscaleButton
          scale={scale}
          isUpscaling={isUpscaling}
          externalIsUpscaling={externalIsUpscaling}
          sourceImageUrl={sourceImageUrl}
          onUpscale={onUpscale}
        />
      </div>

      {isTopaz && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: `${8 * scale}px`,
          padding: `${8 * scale}px`,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          borderRadius: `${8 * scale}px`,
        }}>
          <span style={{
            fontSize: `${12 * scale}px`,
            color: isDark ? '#a0a0a0' : '#666666',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}>Model</span>
          <ModelDropdown
            selectedModel={topazModel || 'Standard V2'}
            scale={scale * 0.9}
            isOpen={isTopazModelDropdownOpen}
            onToggle={() => setIsTopazModelDropdownOpen(!isTopazModelDropdownOpen)}
            onSelect={(model) => {
              onTopazModelChange(model);
              setIsTopazModelDropdownOpen(false);
            }}
            options={TOPAZ_MODELS}
          />
        </div>
      )}

      {supportsFaceEnhance && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${8 * scale}px`,
          padding: `${8 * scale}px`,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          borderRadius: `${8 * scale}px`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: `${12 * scale}px`,
              color: isDark ? '#a0a0a0' : '#666666',
              fontWeight: 500,
            }}>Face Enhancement</span>
            <div
              onClick={() => onFaceEnhanceChange(!faceEnhance)}
              style={{
                width: `${32 * scale}px`,
                height: `${18 * scale}px`,
                backgroundColor: faceEnhance ? '#437eb5' : (isDark ? '#3a3a3a' : '#cccccc'),
                borderRadius: `${9 * scale}px`,
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
            >
              <div style={{
                position: 'absolute',
                top: `${2 * scale}px`,
                left: faceEnhance ? `${16 * scale}px` : `${2 * scale}px`,
                width: `${14 * scale}px`,
                height: `${14 * scale}px`,
                backgroundColor: '#ffffff',
                borderRadius: '50%',
                transition: 'left 0.2s ease',
              }} />
            </div>
          </div>

          {supportsFaceStrength && faceEnhance && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: `${4 * scale}px`,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: `${10 * scale}px`,
                color: isDark ? '#808080' : '#888888',
              }}>
                <span>Face Strength</span>
                <span>{Math.round(faceEnhanceStrength * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={faceEnhanceStrength}
                onChange={(e) => onFaceEnhanceStrengthChange(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: `${4 * scale}px`,
                  appearance: 'none',
                  backgroundColor: isDark ? '#3a3a3a' : '#cccccc',
                  borderRadius: `${2 * scale}px`,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>
          )}

          {supportsFaceCreativity && faceEnhance && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: `${4 * scale}px`,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: `${10 * scale}px`,
                color: isDark ? '#808080' : '#888888',
              }}>
                <span>Face Creativity</span>
                <span>{Math.round(faceEnhanceCreativity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={faceEnhanceCreativity}
                onChange={(e) => onFaceEnhanceCreativityChange(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: `${4 * scale}px`,
                  appearance: 'none',
                  backgroundColor: isDark ? '#3a3a3a' : '#cccccc',
                  borderRadius: `${2 * scale}px`,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

