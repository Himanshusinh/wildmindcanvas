"use client";

import React from 'react';
import { CanvasSettings, CursorType, BackgroundType } from './types';

interface CanvasSectionProps {
  canvasSettings: CanvasSettings;
  setCanvasSettings: React.Dispatch<React.SetStateAction<CanvasSettings>>;
}

export const CanvasSection: React.FC<CanvasSectionProps> = ({ canvasSettings, setCanvasSettings }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '8px' }}>
          Canvas Settings
        </h4>

        {/* Cursor Type */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>Cursor Type</div>
          <select
            value={canvasSettings.cursorType}
            onChange={(e) => setCanvasSettings((prev) => ({ ...prev, cursorType: e.target.value as CursorType }))}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              background: '#ffffff',
              fontSize: '14px',
              color: '#111827',
              cursor: 'pointer',
              minWidth: '150px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
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
          <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>Background Type</div>
          <select
            value={canvasSettings.backgroundType}
            onChange={(e) => setCanvasSettings((prev) => ({ ...prev, backgroundType: e.target.value as BackgroundType }))}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              background: '#ffffff',
              fontSize: '14px',
              color: '#111827',
              cursor: 'pointer',
              minWidth: '150px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
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
          <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>Dot Color</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="color"
              value={canvasSettings.dotColor}
              onChange={(e) => setCanvasSettings((prev) => ({ ...prev, dotColor: e.target.value }))}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
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
                border: '1px solid rgba(0, 0, 0, 0.1)',
                background: '#ffffff',
                fontSize: '14px',
                color: '#111827',
                width: '100px',
              }}
            />
          </div>
        </div>

        {/* Background Color */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>Background Color</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="color"
              value={canvasSettings.backgroundColor}
              onChange={(e) => setCanvasSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: '1px solid rgba(0, 0, 0, 0.1)',
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
                border: '1px solid rgba(0, 0, 0, 0.1)',
                background: '#ffffff',
                fontSize: '14px',
                color: '#111827',
                width: '100px',
              }}
            />
          </div>
        </div>

        {/* Dot Size */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>Dot Size</div>
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
                border: '1px solid rgba(0, 0, 0, 0.1)',
                background: '#ffffff',
                fontSize: '14px',
                color: '#111827',
                width: '60px',
                textAlign: 'center',
              }}
            />
            <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '20px' }}>px</span>
          </div>
        </div>

        {/* Grid Spacing */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
          <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>Grid Spacing</div>
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
                border: '1px solid rgba(0, 0, 0, 0.1)',
                background: '#ffffff',
                fontSize: '14px',
                color: '#111827',
                width: '60px',
                textAlign: 'center',
              }}
            />
            <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '20px' }}>px</span>
          </div>
        </div>
      </div>
    </div>
  );
};

