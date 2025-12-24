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
            {/* Simple Pointer */}
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
              title="Simple Pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={canvasSettings.cursorType === 'default' ? '#437eb5' : textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
              </svg>
            </button>

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
          </div>
        </div>

        {/* Mouse Type (Navigation Mode) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: '14px', color: textColor, fontWeight: 500, transition: 'color 0.3s ease' }}>input Type</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Pad (Trackpad) */}
            <button
              onClick={() => setCanvasSettings((prev) => ({ ...prev, navigationMode: 'trackpad' }))}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `2px solid ${canvasSettings.navigationMode === 'trackpad' ? '#437eb5' : borderColor}`,
                background: canvasSettings.navigationMode === 'trackpad' ? (isDark ? '#1a2332' : '#e8f2ff') : inputBg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                gap: '8px'
              }}
              title="Pad (Trackpad behavior)"
            >
              <span style={{ fontSize: '13px', color: canvasSettings.navigationMode === 'trackpad' ? '#437eb5' : textColor, fontWeight: 500 }}>Pad</span>
            </button>

            {/* Standard (Mouse) */}
            <button
              onClick={() => setCanvasSettings((prev) => ({ ...prev, navigationMode: 'mouse' }))}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `2px solid ${canvasSettings.navigationMode === 'mouse' ? '#437eb5' : borderColor}`,
                background: canvasSettings.navigationMode === 'mouse' ? (isDark ? '#1a2332' : '#e8f2ff') : inputBg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                gap: '8px'
              }}
              title="Standard (Mouse behavior)"
            >
              <span style={{ fontSize: '13px', color: canvasSettings.navigationMode === 'mouse' ? '#437eb5' : textColor, fontWeight: 500 }}>Standard</span>
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

        {/* Dot Color */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: '14px', color: textColor, fontWeight: 500, transition: 'color 0.3s ease' }}>Dot Color</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="color"
              value={canvasSettings.dotColor}
              onChange={(e) => setCanvasSettings((prev) => ({ ...prev, dotColor: e.target.value }))}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: `1px solid ${borderColor}`,
                cursor: 'pointer',
                padding: 0,
              }}
            />
            <input
              type="text"
              value={canvasSettings.dotColor}
              onChange={(e) => setCanvasSettings((prev) => ({ ...prev, dotColor: e.target.value }))}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `1px solid ${borderColor}`,
                background: inputBg,
                fontSize: '14px',
                color: textColor,
                width: '100px',
                transition: 'all 0.2s ease',
              }}
            />
          </div>
        </div>

        {/* Background Color */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: '14px', color: textColor, fontWeight: 500, transition: 'color 0.3s ease' }}>Background Color</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="color"
              value={canvasSettings.backgroundColor}
              onChange={(e) => setCanvasSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: `1px solid ${borderColor}`,
                cursor: 'pointer',
                padding: 0,
              }}
            />
            <input
              type="text"
              value={canvasSettings.backgroundColor}
              onChange={(e) => setCanvasSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: `1px solid ${borderColor}`,
                background: inputBg,
                fontSize: '14px',
                color: textColor,
                width: '100px',
                transition: 'all 0.2s ease',
              }}
            />
          </div>
        </div>

        {/* Dot Size */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: '14px', color: textColor, fontWeight: 500, transition: 'color 0.3s ease' }}>Dot Size</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={canvasSettings.dotSize}
              onChange={(e) => setCanvasSettings((prev) => ({ ...prev, dotSize: parseInt(e.target.value) }))}
              style={{
                flex: 1,
                cursor: 'pointer',
              }}
            />
            <input
              type="number"
              min="1"
              max="10"
              value={canvasSettings.dotSize}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1 && val <= 10) {
                  setCanvasSettings((prev) => ({ ...prev, dotSize: val }));
                }
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: `1px solid ${borderColor}`,
                background: inputBg,
                fontSize: '14px',
                color: textColor,
                width: '60px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            />
            <span style={{ fontSize: '12px', color: textSecondary, minWidth: '20px', transition: 'color 0.3s ease' }}>px</span>
          </div>
        </div>

        {/* Grid Spacing */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: '14px', color: textColor, fontWeight: 500, transition: 'color 0.3s ease' }}>Grid Spacing</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={canvasSettings.gridSpacing}
              onChange={(e) => setCanvasSettings((prev) => ({ ...prev, gridSpacing: parseInt(e.target.value) }))}
              style={{
                flex: 1,
                cursor: 'pointer',
              }}
            />
            <input
              type="number"
              min="10"
              max="100"
              step="5"
              value={canvasSettings.gridSpacing}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 10 && val <= 100) {
                  setCanvasSettings((prev) => ({ ...prev, gridSpacing: val }));
                }
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: `1px solid ${borderColor}`,
                background: inputBg,
                fontSize: '14px',
                color: textColor,
                width: '60px',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            />
            <span style={{ fontSize: '12px', color: textSecondary, minWidth: '20px', transition: 'color 0.3s ease' }}>px</span>
          </div>
        </div>
      </div>
    </div>
  );
};

