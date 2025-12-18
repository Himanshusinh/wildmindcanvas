'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface MultiangleCameraControlsProps {
  scale: number;
  sourceImageUrl: string | null;
  frameBorderColor: string;
  frameBorderWidth: number;
  onHoverChange: (hovered: boolean) => void;
  extraTopPadding?: number;
  // Parameters
  prompt: string;
  loraScale: number;
  aspectRatio: string;
  moveForward: number;
  verticalTilt: number;
  rotateDegrees: number;
  useWideAngle: boolean;
  isGenerating: boolean;
  // Callbacks
  onPromptChange: (prompt: string) => void;
  onLoraScaleChange: (loraScale: number) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
  onMoveForwardChange: (moveForward: number) => void;
  onVerticalTiltChange: (verticalTilt: number) => void;
  onRotateDegreesChange: (rotateDegrees: number) => void;
  onUseWideAngleChange: (useWideAngle: boolean) => void;
  onGenerate: () => void;
}

export const MultiangleCameraControls: React.FC<MultiangleCameraControlsProps> = ({
  scale,
  sourceImageUrl,
  frameBorderColor,
  frameBorderWidth,
  onHoverChange,
  extraTopPadding,
  prompt,
  loraScale,
  aspectRatio,
  moveForward,
  verticalTilt,
  rotateDegrees,
  useWideAngle,
  isGenerating,
  onPromptChange,
  onLoraScaleChange,
  onAspectRatioChange,
  onMoveForwardChange,
  onVerticalTiltChange,
  onRotateDegreesChange,
  onUseWideAngleChange,
  onGenerate,
}) => {
  const isDark = useIsDarkTheme();
  const basePadding = 16 * scale;
  const computedTopPadding = Math.max(basePadding, extraTopPadding ?? basePadding);

  const [isAspectRatioDropdownOpen, setIsAspectRatioDropdownOpen] = useState(false);
  const [isVerticalTiltDropdownOpen, setIsVerticalTiltDropdownOpen] = useState(false);
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null);
  const verticalTiltDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aspectRatioDropdownRef.current && !aspectRatioDropdownRef.current.contains(event.target as Node)) {
        setIsAspectRatioDropdownOpen(false);
      }
      if (verticalTiltDropdownRef.current && !verticalTiltDropdownRef.current.contains(event.target as Node)) {
        setIsVerticalTiltDropdownOpen(false);
      }
    };

    if (isAspectRatioDropdownOpen || isVerticalTiltDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAspectRatioDropdownOpen, isVerticalTiltDropdownOpen]);

  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const borderColor = isDark ? '#3a3a3a' : '#d1d5db';
  const inputBg = isDark ? '#2d2d2d' : '#ffffff';
  const buttonBg = isDark ? '#437eb5' : '#3b82f6';
  const buttonHoverBg = isDark ? '#5a8fc5' : '#2563eb';
  const buttonDisabledBg = isDark ? '#4a4a4a' : '#9ca3af';

  const aspectRatioOptions = [
    { value: 'match_input_image', label: 'Match Input' },
    { value: '1:1', label: '1:1' },
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
    { value: '4:3', label: '4:3' },
    { value: '3:4', label: '3:4' },
  ];

  const verticalTiltOptions = [
    { value: -1, label: 'Down (-1)' },
    { value: 0, label: 'Level (0)' },
    { value: 1, label: 'Up (1)' },
  ];

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${10 * scale}px`, width: '100%' }}>
        {/* Prompt Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
          <label style={{ fontSize: `${12 * scale}px`, fontWeight: 500, color: textColor }}>
            Prompt
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Enter prompt (optional)"
            style={{
              width: '100%',
              padding: `${8 * scale}px ${12 * scale}px`,
              fontSize: `${13 * scale}px`,
              backgroundColor: inputBg,
              border: `1px solid ${borderColor}`,
              borderRadius: `${8 * scale}px`,
              color: textColor,
              outline: 'none',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => e.target.style.borderColor = isDark ? '#5a8fc5' : '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = borderColor}
          />
        </div>

        {/* Row 1: Aspect Ratio + Lora Scale */}
        <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Aspect Ratio Dropdown */}
          <div style={{ flex: 1, minWidth: `${140 * scale}px` }}>
            <label style={{ fontSize: `${11 * scale}px`, fontWeight: 500, color: textColor, marginBottom: `${4 * scale}px`, display: 'block' }}>
              Aspect Ratio
            </label>
            <div ref={aspectRatioDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsAspectRatioDropdownOpen(!isAspectRatioDropdownOpen)}
                style={{
                  width: '100%',
                  padding: `${8 * scale}px ${12 * scale}px`,
                  fontSize: `${12 * scale}px`,
                  backgroundColor: inputBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: `${8 * scale}px`,
                  color: textColor,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'border-color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = isDark ? '#5a8fc5' : '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = borderColor}
              >
                <span>{aspectRatioOptions.find(opt => opt.value === aspectRatio)?.label || aspectRatio}</span>
                <span style={{ fontSize: `${10 * scale}px` }}>▼</span>
              </button>
              {isAspectRatioDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: `${4 * scale}px`,
                    backgroundColor: inputBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: `${8 * scale}px`,
                    zIndex: 1000,
                    boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.5)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                    maxHeight: `${200 * scale}px`,
                    overflowY: 'auto',
                  }}
                >
                  {aspectRatioOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onAspectRatioChange(option.value);
                        setIsAspectRatioDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: `${8 * scale}px ${12 * scale}px`,
                        fontSize: `${12 * scale}px`,
                        backgroundColor: aspectRatio === option.value ? (isDark ? '#437eb5' : '#3b82f6') : 'transparent',
                        color: aspectRatio === option.value ? '#ffffff' : textColor,
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (aspectRatio !== option.value) {
                          e.currentTarget.style.backgroundColor = isDark ? '#3a3a3a' : '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (aspectRatio !== option.value) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lora Scale Input */}
          <div style={{ flex: 1, minWidth: `${120 * scale}px` }}>
            <label style={{ fontSize: `${11 * scale}px`, fontWeight: 500, color: textColor, marginBottom: `${4 * scale}px`, display: 'block' }}>
              Lora Scale
            </label>
            <input
              type="number"
              value={loraScale}
              onChange={(e) => onLoraScaleChange(parseFloat(e.target.value) || 1.25)}
              min="0"
              max="10"
              step="0.1"
              style={{
                width: '100%',
                padding: `${8 * scale}px ${12 * scale}px`,
                fontSize: `${12 * scale}px`,
                backgroundColor: inputBg,
                border: `1px solid ${borderColor}`,
                borderRadius: `${8 * scale}px`,
                color: textColor,
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = isDark ? '#5a8fc5' : '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = borderColor}
            />
          </div>
        </div>

        {/* Row 2: Move Forward + Vertical Tilt */}
        <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Move Forward Slider */}
          <div style={{ flex: 1, minWidth: `${140 * scale}px` }}>
            <label style={{ fontSize: `${11 * scale}px`, fontWeight: 500, color: textColor, marginBottom: `${4 * scale}px`, display: 'block' }}>
              Move Forward: {moveForward.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={moveForward}
              onChange={(e) => onMoveForwardChange(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: `${6 * scale}px`,
                cursor: 'pointer',
              }}
            />
          </div>

          {/* Vertical Tilt Dropdown */}
          <div style={{ flex: 1, minWidth: `${120 * scale}px` }}>
            <label style={{ fontSize: `${11 * scale}px`, fontWeight: 500, color: textColor, marginBottom: `${4 * scale}px`, display: 'block' }}>
              Vertical Tilt
            </label>
            <div ref={verticalTiltDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsVerticalTiltDropdownOpen(!isVerticalTiltDropdownOpen)}
                style={{
                  width: '100%',
                  padding: `${8 * scale}px ${12 * scale}px`,
                  fontSize: `${12 * scale}px`,
                  backgroundColor: inputBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: `${8 * scale}px`,
                  color: textColor,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'border-color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = isDark ? '#5a8fc5' : '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = borderColor}
              >
                <span>{verticalTiltOptions.find(opt => opt.value === verticalTilt)?.label || verticalTilt}</span>
                <span style={{ fontSize: `${10 * scale}px` }}>▼</span>
              </button>
              {isVerticalTiltDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: `${4 * scale}px`,
                    backgroundColor: inputBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: `${8 * scale}px`,
                    zIndex: 1000,
                    boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.5)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  {verticalTiltOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onVerticalTiltChange(option.value);
                        setIsVerticalTiltDropdownOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: `${8 * scale}px ${12 * scale}px`,
                        fontSize: `${12 * scale}px`,
                        backgroundColor: verticalTilt === option.value ? (isDark ? '#437eb5' : '#3b82f6') : 'transparent',
                        color: verticalTilt === option.value ? '#ffffff' : textColor,
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (verticalTilt !== option.value) {
                          e.currentTarget.style.backgroundColor = isDark ? '#3a3a3a' : '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (verticalTilt !== option.value) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Rotate Degrees Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: `${11 * scale}px`, fontWeight: 500, color: textColor }}>
              Rotate Degrees: {rotateDegrees}°
            </label>
            <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', fontSize: `${10 * scale}px`, color: textColor, opacity: 0.7 }}>
              <span style={{ color: rotateDegrees < 0 ? (isDark ? '#5a8fc5' : '#3b82f6') : textColor, opacity: rotateDegrees < 0 ? 1 : 0.5 }}>
                Right →
              </span>
              <span style={{ color: rotateDegrees === 0 ? textColor : (isDark ? '#5a8fc5' : '#3b82f6'), opacity: rotateDegrees === 0 ? 1 : 0.5 }}>
                Center
              </span>
              <span style={{ color: rotateDegrees > 0 ? (isDark ? '#5a8fc5' : '#3b82f6') : textColor, opacity: rotateDegrees > 0 ? 1 : 0.5 }}>
                ← Left
              </span>
            </div>
          </div>
          <input
            type="range"
            min="-90"
            max="90"
            step="1"
            value={rotateDegrees}
            onChange={(e) => onRotateDegreesChange(parseInt(e.target.value))}
            style={{
              width: '100%',
              height: `${6 * scale}px`,
              cursor: 'pointer',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `${9 * scale}px`, color: textColor, opacity: 0.6 }}>
            <span>-90°</span>
            <span>0°</span>
            <span>+90°</span>
          </div>
        </div>

        {/* Row 4: Wide Angle Checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
          <input
            type="checkbox"
            checked={useWideAngle}
            onChange={(e) => onUseWideAngleChange(e.target.checked)}
            style={{
              width: `${16 * scale}px`,
              height: `${16 * scale}px`,
              cursor: 'pointer',
            }}
          />
          <label style={{ fontSize: `${12 * scale}px`, color: textColor, cursor: 'pointer' }}>
            Use Wide Angle
          </label>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={onGenerate}
          disabled={!sourceImageUrl || isGenerating}
          style={{
            width: '100%',
            padding: `${10 * scale}px ${16 * scale}px`,
            fontSize: `${13 * scale}px`,
            fontWeight: 600,
            backgroundColor: (!sourceImageUrl || isGenerating) ? buttonDisabledBg : buttonBg,
            color: '#ffffff',
            border: 'none',
            borderRadius: `${8 * scale}px`,
            cursor: (!sourceImageUrl || isGenerating) ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
            opacity: (!sourceImageUrl || isGenerating) ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!(!sourceImageUrl || isGenerating)) {
              e.currentTarget.style.backgroundColor = buttonHoverBg;
            }
          }}
          onMouseLeave={(e) => {
            if (!(!sourceImageUrl || isGenerating)) {
              e.currentTarget.style.backgroundColor = buttonBg;
            }
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Multiangle'}
        </button>
      </div>
    </div>
  );
};
