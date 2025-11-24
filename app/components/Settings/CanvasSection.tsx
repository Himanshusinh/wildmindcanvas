"use client";

import React, { useEffect, useState } from 'react';
import { CanvasSettings, CursorType, BackgroundType } from './types';

interface CanvasSectionProps {
  canvasSettings: CanvasSettings;
  setCanvasSettings: React.Dispatch<React.SetStateAction<CanvasSettings>>;
}

export const CanvasSection: React.FC<CanvasSectionProps> = ({ canvasSettings, setCanvasSettings }) => {
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
        border: `1px solid ${borderColor}`,
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}>
        <h4 style={{ 
          margin: '0 0 20px 0', 
          fontSize: '16px', 
          fontWeight: 600, 
          color: textColor, 
          paddingBottom: '8px',
          transition: 'color 0.3s ease'
        }}>
          Canvas Settings
        </h4>

        {/* Cursor Type */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: '14px', color: textColor, fontWeight: 500, transition: 'color 0.3s ease' }}>Cursor Type</div>
          <select
            value={canvasSettings.cursorType}
            onChange={(e) => setCanvasSettings((prev) => ({ ...prev, cursorType: e.target.value as CursorType }))}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: `1px solid ${borderColor}`,
              background: inputBg,
              fontSize: '14px',
              color: textColor,
              cursor: 'pointer',
              minWidth: '150px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = hoverBorder;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = borderColor;
            }}
          >
            <option value="default">Default</option>
            <option value="crosshair">Crosshair</option>
            <option value="pointer">Pointer</option>
            <option value="grab">Grab</option>
            <option value="text">Text</option>
          </select>
        </div>

        {/* Background Type */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: '14px', color: textColor, fontWeight: 500, transition: 'color 0.3s ease' }}>Background Type</div>
          <select
            value={canvasSettings.backgroundType}
            onChange={(e) => setCanvasSettings((prev) => ({ ...prev, backgroundType: e.target.value as BackgroundType }))}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: `1px solid ${borderColor}`,
              background: inputBg,
              fontSize: '14px',
              color: textColor,
              cursor: 'pointer',
              minWidth: '150px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = hoverBorder;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = borderColor;
            }}
          >
            <option value="dots">Dots</option>
            <option value="grid">Grid</option>
            <option value="solid">Solid</option>
            <option value="none">None</option>
          </select>
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

