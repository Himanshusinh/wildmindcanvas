'use client';

import React, { useState } from 'react';
import { ModelDropdown } from './ModelDropdown';
import { ScaleInput } from './ScaleInput';
import { UpscaleButton } from './UpscaleButton';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';

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
        backgroundColor: isDark ? 'rgba(23, 23, 23, 0.85)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        borderRadius: `${18 * scale}px ${18 * scale}px 0 0`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${14 * scale}px`,
        overflow: 'visible',
        zIndex: 10,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        padding: `${18 * scale}px`,
        paddingTop: `${computedTopPadding + 4 * scale}px`,
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease',
        boxShadow: isDark
          ? `0 -10px 40px rgba(0,0,0,0.4)`
          : `0 -10px 40px rgba(0,0,0,0.05)`,
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {/* Primary Row: Model and Action */}
      <div style={{ display: 'flex', gap: `${10 * scale}px`, alignItems: 'center', width: '100%' }}>
        <ModelDropdown
          selectedModel={selectedModel}
          scale={scale}
          minWidth={170}
          isOpen={isModelDropdownOpen}
          onToggle={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          onSelect={(model) => {
            onModelChange(model);
            setIsModelDropdownOpen(false);
          }}
        />
        <UpscaleButton
          scale={scale}
          isUpscaling={isUpscaling}
          externalIsUpscaling={externalIsUpscaling}
          sourceImageUrl={sourceImageUrl}
          onUpscale={onUpscale}
        />
      </div>

      {/* Secondary Row: Parameters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${8 * scale}px ${10 * scale}px`,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        borderRadius: `${12 * scale}px`,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
          <span style={{
            fontSize: `${11 * scale}px`,
            fontWeight: 700,
            color: isDark ? '#777' : '#999',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}>Scale</span>
          <ScaleInput
            scaleValue={scaleValue}
            scale={scale}
            onScaleChange={(val) => {
              if (isTopaz && val > 4) onScaleChange(4);
              else onScaleChange(val);
            }}
            maxScale={isTopaz ? 4 : 6}
          />
        </div>

        {isTopaz && (
          <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
            <span style={{
              fontSize: `${10 * scale}px`,
              fontWeight: 700,
              color: isDark ? '#777' : '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.01em'
            }}>Output</span>
            <ModelDropdown
              selectedModel={topazModel || 'Standard V2'}
              scale={scale * 0.85}
              minWidth={150}
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
      </div>

      {supportsFaceEnhance && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${12 * scale}px`,
          padding: `${12 * scale}px`,
          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.03)' : 'rgba(59, 130, 246, 0.02)',
          borderRadius: `${14 * scale}px`,
          border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)'}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
              <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke={SELECTION_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 1 0 12 2Z" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              <span style={{
                fontSize: `${13 * scale}px`,
                color: isDark ? '#e0e0e0' : '#333333',
                fontWeight: 600,
              }}>Face Enhancement</span>
            </div>
            <div
              onClick={() => onFaceEnhanceChange(!faceEnhance)}
              style={{
                width: `${34 * scale}px`,
                height: `${20 * scale}px`,
                backgroundColor: faceEnhance ? SELECTION_COLOR : (isDark ? '#333' : '#ddd'),
                borderRadius: `${10 * scale}px`,
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
                boxShadow: faceEnhance ? `0 0 ${10 * scale}px rgba(59, 130, 246, 0.3)` : 'none',
              }}
            >
              <div style={{
                position: 'absolute',
                top: `${3 * scale}px`,
                left: faceEnhance ? `${17 * scale}px` : `${3 * scale}px`,
                width: `${14 * scale}px`,
                height: `${14 * scale}px`,
                backgroundColor: '#ffffff',
                borderRadius: '50%',
                transition: 'left 0s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>

          {faceEnhance && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: `${10 * scale}px`,
            }}>
              {supportsFaceStrength && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${6 * scale}px` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: `${11 * scale}px`, fontWeight: 500, color: isDark ? '#888' : '#777', flex: 1 }}>Enhance Strength</span>
                    <span style={{ fontSize: `${11 * scale}px`, fontWeight: 700, color: SELECTION_COLOR }}>{Math.round(faceEnhanceStrength * 100)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.01"
                    value={faceEnhanceStrength}
                    onChange={(e) => onFaceEnhanceStrengthChange(parseFloat(e.target.value))}
                    style={{
                      width: '100%', height: `${4 * scale}px`, appearance: 'none',
                      backgroundColor: isDark ? '#333' : '#eee', borderRadius: `${2 * scale}px`,
                      outline: 'none', cursor: 'pointer'
                    }}
                  />
                </div>
              )}

              {supportsFaceCreativity && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: `${6 * scale}px` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: `${11 * scale}px`, fontWeight: 500, color: isDark ? '#888' : '#777', flex: 1 }}>Creative Refinement</span>
                    <span style={{ fontSize: `${11 * scale}px`, fontWeight: 700, color: '#a855f7' }}>{Math.round(faceEnhanceCreativity * 100)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.01"
                    value={faceEnhanceCreativity}
                    onChange={(e) => onFaceEnhanceCreativityChange(parseFloat(e.target.value))}
                    style={{
                      width: '100%', height: `${4 * scale}px`, appearance: 'none',
                      backgroundColor: isDark ? '#333' : '#eee', borderRadius: `${2 * scale}px`,
                      outline: 'none', cursor: 'pointer'
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <style jsx>{`
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: ${12 * scale}px;
          height: ${12 * scale}px;
          background: ${SELECTION_COLOR};
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
};

