'use client';

import React from 'react';
import { NextSceneButton } from './NextSceneButton';
import { ModeSwitch } from './ModeSwitch';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { ChevronDown } from 'lucide-react';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';

interface NextSceneControlsProps {
  scale: number;
  mode: string;
  isProcessing: boolean;
  externalIsProcessing?: boolean;
  sourceImageUrl: string | null;
  frameBorderColor: string;
  frameBorderWidth: number;
  onModeChange: (mode: string) => void;
  onNextScene: () => void;
  onHoverChange: (hovered: boolean) => void;
  onPromptChange?: (prompt: string) => void;
  onAspectRatioChange?: (ratio: string) => void;
  onLoraScaleChange?: (scale: number) => void;
  onTrueGuidanceScaleChange?: (scale: number) => void;
  prompt: string;
  aspectRatio: string;
  loraScale: number;
  trueGuidanceScale?: number;
  extraTopPadding?: number;
  multiangleCategory?: string;
  onMultiangleCategoryChange?: (category: string) => void;
  multiangleModel?: string;
  onMultiangleModelChange?: (model: string) => void;
}

export const NextSceneControls: React.FC<NextSceneControlsProps> = ({
  scale,
  mode,
  isProcessing,
  externalIsProcessing,
  sourceImageUrl,
  frameBorderColor,
  frameBorderWidth,
  onModeChange,
  onNextScene,
  onHoverChange,
  extraTopPadding,
  onPromptChange,
  onAspectRatioChange,
  onLoraScaleChange,
  prompt,
  aspectRatio,
  loraScale,
  trueGuidanceScale,
  onTrueGuidanceScaleChange,
  multiangleCategory,
  onMultiangleCategoryChange,
  multiangleModel,
  onMultiangleModelChange,
}) => {
  const isDark = useIsDarkTheme();

  // Base values for fixed-width UI elements
  const basePadding = 16;
  const computedTopPadding = Math.max(basePadding, (extraTopPadding ? extraTopPadding / scale : basePadding));
  const topRadius = 16; // Fixed radius

  const labelStyle = {
    fontSize: '12px',
    color: isDark ? '#aaaaaa' : '#666666',
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px'
  };

  const inputContainerStyle = {
    marginBottom: '12px'
  };

  return (
    <>
      <div
        className="controls-overlay"
        style={{
          position: 'relative',
          width: '400px', // Fixed width
          maxWidth: '90vw',
          backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: `${topRadius}px ${topRadius}px 0 0`,
          display: 'flex',
          flexDirection: 'column',
          // gap: '12px', // Removed gap in favor of marginBottom on containers
          overflow: 'visible',
          zIndex: 10,
          borderLeft: `${frameBorderWidth}px solid ${frameBorderColor}`,
          borderRight: `${frameBorderWidth}px solid ${frameBorderColor}`,
          borderTop: `${frameBorderWidth}px solid ${frameBorderColor}`,
          padding: `${basePadding}px`,
          paddingTop: `${computedTopPadding}px`,
        }}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
      >
        <div style={{ marginBottom: '12px' }}>
          <ModeSwitch
            selectedMode={mode}
            scale={scale} // ModeSwitch might strictly need scale if it processes it internally, keeping as is
            onModeChange={onModeChange}
            modes={['scene', 'nextscene']}
            labels={{ scene: 'Single scene', nextscene: 'MultiScene' }}
            actionSlot={(
              <NextSceneButton
                scale={scale} // NextSceneButton uses scale internally, we might want to fix it too, but kept as is for now
                isProcessing={isProcessing}
                externalIsProcessing={externalIsProcessing}
                sourceImageUrl={sourceImageUrl}
                onNextScene={onNextScene}
              />
            )}
          />
        </div>

        {mode === 'nextscene' && (
          <div style={{ marginBottom: '12px' }}>
            {/* Simple Category Switch for MultiScene */}
            <div style={{
              display: 'flex',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              borderRadius: '8px',
              padding: '2px',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            }}>
              {[
                { id: 'human', label: 'Human' },
                { id: 'product', label: 'Product' }
              ].map((opt) => {
                const isSelected = multiangleCategory === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onMultiangleCategoryChange?.(opt.id)}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? (isDark ? '#333' : '#fff') : 'transparent',
                      color: isSelected
                        ? (isDark ? '#fff' : '#000')
                        : (isDark ? '#aaa' : '#666'),
                      boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Model Selection Dropdown */}
            <div style={{
              marginTop: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>
                Model
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={multiangleModel}
                  onChange={(e) => onMultiangleModelChange && onMultiangleModelChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDark ? '#ffffff' : '#000000',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    outline: 'none',
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  <option value="google/nano-banana-pro">Google Nano Banana Pro</option>
                  <option value="google/nano-banana">Google Nana Banana</option>
                  <option value="seedream-4.5">SeeDream 4.5</option>
                </select>
                <ChevronDown
                  size={16}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <>
          {mode === 'scene' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* ...scene content... */}
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
            {/* Aspect Ratio Selector */}
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>Aspect Ratio</div>
              <div style={{ position: 'relative' }}>
                <select
                  value={aspectRatio}
                  onChange={(e) => onAspectRatioChange?.(e.target.value)}
                  style={{
                    width: '100%',
                    appearance: 'none',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDark ? '#ffffff' : '#000000',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'].map(ratio => (
                    <option key={ratio} value={ratio}>{ratio}</option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
                  }}
                />
              </div>
            </div>

            {/* LoRA Scale Input */}
            <div style={{ flex: 1 }}>
              <div style={labelStyle}>
                <span>LoRA Scale</span>
                <span>{loraScale.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="0.05"
                  value={loraScale}
                  onChange={(e) => onLoraScaleChange?.(parseFloat(e.target.value))}
                  style={{
                    flex: 1,
                    accentColor: SELECTION_COLOR,
                  }}
                />
                <input
                  type="number"
                  min="0"
                  max="4"
                  step="0.1"
                  value={loraScale}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value);
                    if (isNaN(val)) val = 0;
                    if (val > 4) val = 4;
                    if (val < 0) val = 0;
                    onLoraScaleChange?.(val);
                  }}
                  style={{
                    width: '50px',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDark ? '#ffffff' : '#000000',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    borderRadius: '4px',
                    padding: '4px',
                    fontSize: '12px',
                    textAlign: 'center',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* True Guidance Scale Input */}
          <div style={inputContainerStyle}>
            <div style={labelStyle}>
              <span>True Guidance Scale</span>
              <span>{trueGuidanceScale?.toFixed(1) || '0.0'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={trueGuidanceScale || 0}
                onChange={(e) => onTrueGuidanceScaleChange?.(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: '#4C83FF',
                }}
              />
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={trueGuidanceScale || 0}
                onChange={(e) => {
                  let val = parseFloat(e.target.value);
                  if (isNaN(val)) val = 0;
                  if (val > 10) val = 10;
                  if (val < 0) val = 0;
                  onTrueGuidanceScaleChange?.(val);
                }}
                style={{
                  width: '50px',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  color: isDark ? '#ffffff' : '#000000',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  borderRadius: '4px',
                  padding: '4px',
                  fontSize: '12px',
                  textAlign: 'center',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </>
      </div>
    </>
  );
};

