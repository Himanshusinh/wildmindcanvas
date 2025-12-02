"use client";

import React from 'react';
import { CanvasSettings, CursorType, BackgroundType } from './types';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface CanvasSectionProps {
  canvasSettings: CanvasSettings;
  setCanvasSettings: React.Dispatch<React.SetStateAction<CanvasSettings>>;
}

export const CanvasSection: React.FC<CanvasSectionProps> = ({ canvasSettings, setCanvasSettings }) => {
  const isDark = useIsDarkTheme();

  const containerBg = isDark ? '#121212' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#111827';
  const textSecondary = isDark ? '#cccccc' : '#6b7280';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const inputBg = isDark ? '#1a1a1a' : '#ffffff';
  const hoverBorder = isDark ? 'rgba(96, 165, 250, 0.4)' : 'rgba(59, 130, 246, 0.3)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{
        padding: '20px',
        background: containerBg,
        borderRadius: '12px',
        transition: 'background-color 0.3s ease'
      }}>


        {/* Cursor Type */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: '14px', color: textColor, fontWeight: 500, transition: 'color 0.3s ease' }}>Cursor Type</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Gaming Pointer (Crosshair) */}
            <button
              onClick={() => setCanvasSettings((prev) => ({ ...prev, cursorType: 'crosshair' }))}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `2px solid ${canvasSettings.cursorType === 'crosshair' ? '#437eb5' : borderColor}`,
                background: canvasSettings.cursorType === 'crosshair' ? (isDark ? '#1a2332' : '#e8f2ff') : inputBg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              title="Gaming Pointer (Crosshair)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={canvasSettings.cursorType === 'crosshair' ? '#437eb5' : textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </button>

            {/* Normal Pointer (Arrow) */}
            <button
              onClick={() => setCanvasSettings((prev) => ({ ...prev, cursorType: 'default' }))}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `2px solid ${canvasSettings.cursorType === 'default' ? '#437eb5' : borderColor}`,
                background: canvasSettings.cursorType === 'default' ? (isDark ? '#1a2332' : '#e8f2ff') : inputBg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              title="Normal Pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={canvasSettings.cursorType === 'default' ? '#437eb5' : textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.07 20.93L3 3l17.93 7.07-8.66 2.2-2.2 8.66z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Background Type */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: '14px', color: textColor, fontWeight: 500, transition: 'color 0.3s ease' }}>Background Type</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Dots */}
            <button
              onClick={() => setCanvasSettings((prev) => ({ ...prev, backgroundType: 'dots' as BackgroundType }))}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `2px solid ${canvasSettings.backgroundType === 'dots' ? '#437eb5' : borderColor}`,
                background: canvasSettings.backgroundType === 'dots' ? (isDark ? '#1a2332' : '#e8f2ff') : inputBg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              title="Dots"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="6" cy="6" r="1.5" fill={canvasSettings.backgroundType === 'dots' ? '#437eb5' : textColor} />
                <circle cx="12" cy="6" r="1.5" fill={canvasSettings.backgroundType === 'dots' ? '#437eb5' : textColor} />
                <circle cx="18" cy="6" r="1.5" fill={canvasSettings.backgroundType === 'dots' ? '#437eb5' : textColor} />
                <circle cx="6" cy="12" r="1.5" fill={canvasSettings.backgroundType === 'dots' ? '#437eb5' : textColor} />
                <circle cx="12" cy="12" r="1.5" fill={canvasSettings.backgroundType === 'dots' ? '#437eb5' : textColor} />
                <circle cx="18" cy="12" r="1.5" fill={canvasSettings.backgroundType === 'dots' ? '#437eb5' : textColor} />
                <circle cx="6" cy="18" r="1.5" fill={canvasSettings.backgroundType === 'dots' ? '#437eb5' : textColor} />
                <circle cx="12" cy="18" r="1.5" fill={canvasSettings.backgroundType === 'dots' ? '#437eb5' : textColor} />
                <circle cx="18" cy="18" r="1.5" fill={canvasSettings.backgroundType === 'dots' ? '#437eb5' : textColor} />
              </svg>
            </button>

            {/* None */}
            <button
              onClick={() => setCanvasSettings((prev) => ({ ...prev, backgroundType: 'none' as BackgroundType }))}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `2px solid ${canvasSettings.backgroundType === 'none' ? '#437eb5' : borderColor}`,
                background: canvasSettings.backgroundType === 'none' ? (isDark ? '#1a2332' : '#e8f2ff') : inputBg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              title="None"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={canvasSettings.backgroundType === 'none' ? '#437eb5' : textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </button>

            {/* Lines Vertical */}
            <button
              onClick={() => setCanvasSettings((prev) => ({ ...prev, backgroundType: 'lines-vertical' as BackgroundType }))}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `2px solid ${canvasSettings.backgroundType === 'lines-vertical' ? '#437eb5' : borderColor}`,
                background: canvasSettings.backgroundType === 'lines-vertical' ? (isDark ? '#1a2332' : '#e8f2ff') : inputBg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              title="Lines Vertical"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={canvasSettings.backgroundType === 'lines-vertical' ? '#437eb5' : textColor} strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="4" x2="6" y2="20" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="18" y1="4" x2="18" y2="20" />
              </svg>
            </button>

            {/* Lines Horizontal */}
            <button
              onClick={() => setCanvasSettings((prev) => ({ ...prev, backgroundType: 'lines-horizontal' as BackgroundType }))}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `2px solid ${canvasSettings.backgroundType === 'lines-horizontal' ? '#437eb5' : borderColor}`,
                background: canvasSettings.backgroundType === 'lines-horizontal' ? (isDark ? '#1a2332' : '#e8f2ff') : inputBg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              title="Lines Horizontal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={canvasSettings.backgroundType === 'lines-horizontal' ? '#437eb5' : textColor} strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>

            {/* Lines Both (Grid) */}
            <button
              onClick={() => setCanvasSettings((prev) => ({ ...prev, backgroundType: 'grid' as BackgroundType }))}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `2px solid ${canvasSettings.backgroundType === 'grid' ? '#437eb5' : borderColor}`,
                background: canvasSettings.backgroundType === 'grid' ? (isDark ? '#1a2332' : '#e8f2ff') : inputBg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              title="Lines Both (Grid)"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={canvasSettings.backgroundType === 'grid' ? '#437eb5' : textColor} strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="4" x2="6" y2="20" />
                <line x1="12" y1="4" x2="12" y2="20" />
                <line x1="18" y1="4" x2="18" y2="20" />
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Secondary Options */}
        {canvasSettings.backgroundType !== 'none' && (
          <div style={{
            marginTop: '12px',
            padding: '16px',
            background: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Dot Settings */}
            {canvasSettings.backgroundType === 'dots' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '14px', color: textColor, fontWeight: 500, transition: 'color 0.3s ease' }}>Dot Color</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Blue Preset (Default) */}
                    <button
                      onClick={() => setCanvasSettings((prev) => ({ ...prev, dotColor: '#437eb5' }))}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#437eb5',
                        border: canvasSettings.dotColor === '#437eb5' ? `2px solid ${textColor}` : 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                      }}
                      title="Blue"
                    />

                    {/* Yellow Preset */}
                    <button
                      onClick={() => setCanvasSettings((prev) => ({ ...prev, dotColor: '#F59E0B' }))}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#F59E0B',
                        border: canvasSettings.dotColor === '#F59E0B' ? `2px solid ${textColor}` : 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease',
                      }}
                      title="Yellow"
                    />

                    {/* Red Preset */}
                    {/* Red */}
                    <button
                      onClick={() => setCanvasSettings((prev) => ({ ...prev, dotColor: '#EF4444' }))}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        border: canvasSettings.dotColor === '#EF4444' ? `2px solid ${textColor}` : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      title="Red"
                    />

                    {/* Light Gray (Adaptive) */}
                    <button
                      onClick={() => setCanvasSettings((prev) => ({ ...prev, dotColor: 'gray' }))}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isDark ? '#2A2A2A' : '#E5E5E5',
                        border: canvasSettings.dotColor === 'gray' ? `2px solid ${textColor}` : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      title="Light Gray"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '14px', color: textColor, fontWeight: 500, transition: 'color 0.3s ease' }}>Dot Size</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setCanvasSettings((prev) => ({ ...prev, dotSize: Math.max(3, prev.dotSize - 1) }))}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        background: inputBg,
                        color: textColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <div style={{
                      minWidth: '40px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: textColor,
                      fontWeight: 500
                    }}>
                      {canvasSettings.dotSize}
                    </div>
                    <button
                      onClick={() => setCanvasSettings((prev) => ({ ...prev, dotSize: Math.min(10, prev.dotSize + 1) }))}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: `1px solid ${borderColor}`,
                        background: inputBg,
                        color: textColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Grid Settings */}
            {['lines-vertical', 'lines-horizontal', 'grid'].includes(canvasSettings.backgroundType) && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', color: textColor, fontWeight: 500, transition: 'color 0.3s ease' }}>Grid Spacing</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setCanvasSettings((prev) => ({ ...prev, gridSpacing: Math.max(10, prev.gridSpacing - 5) }))}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: `1px solid ${borderColor}`,
                      background: inputBg,
                      color: textColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <div style={{
                    minWidth: '40px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: textColor,
                    fontWeight: 500
                  }}>
                    {canvasSettings.gridSpacing}
                  </div>
                  <button
                    onClick={() => setCanvasSettings((prev) => ({ ...prev, gridSpacing: Math.min(100, prev.gridSpacing + 5) }))}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: `1px solid ${borderColor}`,
                      background: inputBg,
                      color: textColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Toolbar Visibility */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px 0', borderTop: `1px solid ${borderColor}` }}>
          <div style={{ fontSize: '14px', color: textColor, fontWeight: 500, transition: 'color 0.3s ease' }}>Toolbar Visibility</div>

          {/* Show Pointer Tool */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: textSecondary, transition: 'color 0.3s ease' }}>Show Pointer Tool</span>
            <button
              onClick={() => setCanvasSettings((prev) => ({ ...prev, showPointerTool: !prev.showPointerTool }))}
              style={{
                width: '40px',
                height: '20px',
                borderRadius: '12px',
                background: canvasSettings.showPointerTool !== false ? '#437eb5' : (isDark ? '#374151' : '#e5e7eb'),
                position: 'relative',
                cursor: 'pointer',
                border: 'none',
                transition: 'background-color 0.2s ease',
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#ffffff',
                position: 'absolute',
                top: '2px',
                left: canvasSettings.showPointerTool !== false ? '22px' : '2px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* Show Move Tool */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: textSecondary, transition: 'color 0.3s ease' }}>Show Move Tool</span>
            <button
              onClick={() => setCanvasSettings((prev) => ({ ...prev, showMoveTool: !prev.showMoveTool }))}
              style={{
                width: '40px',
                height: '20px',
                borderRadius: '12px',
                background: canvasSettings.showMoveTool !== false ? '#437eb5' : (isDark ? '#374151' : '#e5e7eb'),
                position: 'relative',
                cursor: 'pointer',
                border: 'none',
                transition: 'background-color 0.2s ease',
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#ffffff',
                position: 'absolute',
                top: '2px',
                left: canvasSettings.showMoveTool !== false ? '22px' : '2px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* Show Theme Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: textSecondary, transition: 'color 0.3s ease' }}>Show Theme Toggle</span>
            <button
              onClick={() => setCanvasSettings((prev) => ({ ...prev, showThemeToggle: !prev.showThemeToggle }))}
              style={{
                width: '40px',
                height: '20px',
                borderRadius: '12px',
                background: canvasSettings.showThemeToggle !== false ? '#437eb5' : (isDark ? '#374151' : '#e5e7eb'),
                position: 'relative',
                cursor: 'pointer',
                border: 'none',
                transition: 'background-color 0.2s ease',
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#ffffff',
                position: 'absolute',
                top: '2px',
                left: canvasSettings.showThemeToggle !== false ? '22px' : '2px',
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

