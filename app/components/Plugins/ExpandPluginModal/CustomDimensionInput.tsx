'use client';

import React, { useState, useCallback } from 'react';

interface CustomDimensionInputProps {
  width: number;
  height: number;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onClose: () => void;
}

export const CustomDimensionInput: React.FC<CustomDimensionInputProps> = ({
  width,
  height,
  onWidthChange,
  onHeightChange,
  onClose,
}) => {
  const [localWidth, setLocalWidth] = useState(width);
  const [localHeight, setLocalHeight] = useState(height);
  const minSize = 1024;
  const maxSize = 5000;

  const handleWidthChange = useCallback((newWidth: number) => {
    const clamped = Math.max(minSize, Math.min(maxSize, newWidth));
    setLocalWidth(clamped);
    onWidthChange(clamped);
  }, [onWidthChange]);

  const handleHeightChange = useCallback((newHeight: number) => {
    const clamped = Math.max(minSize, Math.min(maxSize, newHeight));
    setLocalHeight(clamped);
    onHeightChange(clamped);
  }, [onHeightChange]);

  const handleWidthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    handleWidthChange(value);
  };

  const handleHeightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    handleHeightChange(value);
  };

  const handleWidthSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    handleWidthChange(value);
  };

  const handleHeightSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    handleHeightChange(value);
  };

  const incrementWidth = () => handleWidthChange(localWidth + 10);
  const decrementWidth = () => handleWidthChange(localWidth - 10);
  const incrementHeight = () => handleHeightChange(localHeight + 10);
  const decrementHeight = () => handleHeightChange(localHeight - 10);

  const applyPreset = (presetWidth: number, presetHeight: number) => {
    handleWidthChange(presetWidth);
    handleHeightChange(presetHeight);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '4px',
        backgroundColor: 'white',
        borderRadius: '6px',
        padding: '12px',
        minWidth: '260px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        zIndex: 10004,
        border: '1px solid #e5e7eb',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Width Control */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#374151', fontSize: '12px', fontWeight: 500 }}>Width</span>
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                border: '1px solid #9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'help',
              }}
              title="Set the width of the expanded image"
            >
              <span style={{ color: '#6b7280', fontSize: '9px' }}>?</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <input
              type="number"
              value={localWidth}
              onChange={handleWidthInputChange}
              min={minSize}
              max={maxSize}
              style={{
                width: '70px',
                padding: '4px 6px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: '#111827',
                fontSize: '12px',
                outline: 'none',
                textAlign: 'center',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <button
                onClick={incrementWidth}
                style={{
                  width: '18px',
                  height: '14px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                ▲
              </button>
              <button
                onClick={decrementWidth}
                style={{
                  width: '18px',
                  height: '14px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                ▼
              </button>
            </div>
          </div>
        </div>
        <input
          type="range"
          min={minSize}
          max={maxSize}
          value={localWidth}
          onChange={handleWidthSliderChange}
          style={{
            width: '100%',
            height: '3px',
            backgroundColor: '#e5e7eb',
            outline: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none',
            appearance: 'none',
          }}
        />
      </div>

      {/* Height Control */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#374151', fontSize: '12px', fontWeight: 500 }}>Height</span>
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                border: '1px solid #9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'help',
              }}
              title="Set the height of the expanded image"
            >
              <span style={{ color: '#6b7280', fontSize: '9px' }}>?</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <input
              type="number"
              value={localHeight}
              onChange={handleHeightInputChange}
              min={minSize}
              max={maxSize}
              style={{
                width: '70px',
                padding: '4px 6px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                color: '#111827',
                fontSize: '12px',
                outline: 'none',
                textAlign: 'center',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <button
                onClick={incrementHeight}
                style={{
                  width: '18px',
                  height: '14px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                ▲
              </button>
              <button
                onClick={decrementHeight}
                style={{
                  width: '18px',
                  height: '14px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                ▼
              </button>
            </div>
          </div>
        </div>
        <input
          type="range"
          min={minSize}
          max={maxSize}
          value={localHeight}
          onChange={handleHeightSliderChange}
          style={{
            width: '100%',
            height: '3px',
            backgroundColor: '#e5e7eb',
            outline: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none',
            appearance: 'none',
          }}
        />
      </div>

      {/* Preset Buttons */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => applyPreset(localWidth, localHeight)}
          style={{
            flex: 1,
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            backgroundColor: '#f9fafb',
            color: '#374151',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Custom
        </button>
        <button
          onClick={() => applyPreset(1440, 1440)}
          style={{
            flex: 1,
            padding: '6px 12px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: '#10b981',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          1440 x 1440
        </button>
      </div>
    </div>
  );
};

