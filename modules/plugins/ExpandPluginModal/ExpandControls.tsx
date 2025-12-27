'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CustomDimensionInput } from './CustomDimensionInput';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

interface ExpandControlsProps {
  aspectPreset: string;
  expandPrompt: string;
  isExpanding: boolean;
  externalIsExpanding?: boolean;
  sourceImageUrl: string | null;
  onAspectPresetChange: (preset: string) => void;
  onExpandPromptChange: (prompt: string) => void;
  onExpand: () => void;
  onClose: () => void;
  aspectPresets: Record<string, { label: string; sizeLabel?: string; width?: number; height?: number }>;
  customWidth: number;
  customHeight: number;
  onCustomWidthChange: (width: number) => void;
  onCustomHeightChange: (height: number) => void;
  imageSize?: { width: number; height: number } | null;
}

export const ExpandControls: React.FC<ExpandControlsProps> = ({
  aspectPreset,
  expandPrompt,
  isExpanding,
  externalIsExpanding,
  sourceImageUrl,
  onAspectPresetChange,
  onExpandPromptChange,
  onExpand,
  onClose,
  aspectPresets,
  customWidth,
  customHeight,
  onCustomWidthChange,
  onCustomHeightChange,
  imageSize,
}) => {
  const isDark = useIsDarkTheme();

  const [showCustomInput, setShowCustomInput] = useState(false);
  const customButtonRef = useRef<HTMLDivElement>(null);

  // Calculate minimum frame dimensions based on image size
  const minWidth = imageSize ? imageSize.width : 1024;
  const minHeight = imageSize ? imageSize.height : 1024;

  // Filter presets that are too small for the image
  const availablePresets = useMemo(() => {
    if (!imageSize) return aspectPresets;
    
    return Object.fromEntries(
      Object.entries(aspectPresets).filter(([key, preset]) => {
        if (key === 'custom') return true; // Always include custom
        const presetWidth = preset.width || 0;
        const presetHeight = preset.height || 0;
        return presetWidth >= minWidth && presetHeight >= minHeight;
      })
    );
  }, [aspectPresets, imageSize, minWidth, minHeight]);

  const inputBg = isDark ? (aspectPreset === 'custom' ? '#121212' : '#1a1a1a') : (aspectPreset === 'custom' ? 'white' : '#f3f4f6');
  const inputText = isDark ? (aspectPreset === 'custom' ? '#ffffff' : '#666666') : (aspectPreset === 'custom' ? '#111827' : '#9ca3af');
  const selectBg = isDark ? '#121212' : 'white';
  const selectText = isDark ? '#ffffff' : '#111827';
  const selectBorder = isDark ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb';
  const buttonBg = isDark ? (aspectPreset === 'custom' ? '#437eb5' : '#1a1a1a') : (aspectPreset === 'custom' ? '#437eb5' : 'white');
  const buttonText = isDark ? (aspectPreset === 'custom' ? 'white' : '#cccccc') : (aspectPreset === 'custom' ? 'white' : '#374151');
  const promptInputBg = isDark ? '#121212' : 'white';
  const promptInputText = isDark ? '#ffffff' : '#111827';
  const closeButtonColor = isDark ? '#cccccc' : '#666';
  const headingColor = isDark ? '#ffffff' : '#111827';

  // Close custom input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customButtonRef.current && !customButtonRef.current.contains(event.target as Node)) {
        setShowCustomInput(false);
      }
    };

    if (showCustomInput) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showCustomInput]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, flexShrink: 0, color: headingColor, transition: 'color 0.3s ease' }}>
        Expand Image
      </h3>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, justifyContent: 'center', minWidth: 0 }}>
        {/* Aspect Ratio Dropdown (without Custom) */}
        <select
          value={aspectPreset === 'custom' ? (Object.keys(availablePresets).find(k => k !== 'custom') || '1:1') : aspectPreset}
          onChange={(e) => {
            const selectedPreset = e.target.value;
            const preset = availablePresets[selectedPreset];
            // Validate preset is large enough
            if (preset && preset.width && preset.height) {
              if (preset.width >= minWidth && preset.height >= minHeight) {
                onAspectPresetChange(selectedPreset);
              }
            } else {
              onAspectPresetChange(selectedPreset);
            }
          }}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: `1px solid ${selectBorder}`,
            fontSize: '12px',
            outline: 'none',
            minWidth: '120px',
            maxWidth: '140px',
            boxSizing: 'border-box',
            backgroundColor: selectBg,
            color: selectText,
            cursor: 'pointer',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
          }}
        >
          {Object.entries(availablePresets)
            .filter(([key]) => key !== 'custom')
            .map(([key, config]) => (
              <option key={key} value={key}>
                {config.label} {config.sizeLabel && `(${config.sizeLabel})`}
              </option>
            ))}
        </select>
        
        {/* Width Input */}
        <input
          type="number"
          value={aspectPreset === 'custom' ? customWidth : aspectPresets[aspectPreset]?.width || 1500}
          onChange={(e) => {
            if (aspectPreset === 'custom') {
              const value = parseInt(e.target.value) || minWidth;
              onCustomWidthChange(Math.max(minWidth, Math.min(5000, value)));
            }
          }}
          disabled={aspectPreset !== 'custom'}
          min={minWidth}
          max={5000}
          placeholder="Width"
          style={{
            padding: '6px 8px',
            borderRadius: '6px',
            border: `1px solid ${selectBorder}`,
            fontSize: '12px',
            outline: 'none',
            width: '80px',
            boxSizing: 'border-box',
            backgroundColor: inputBg,
            color: inputText,
            cursor: aspectPreset === 'custom' ? 'text' : 'not-allowed',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
          }}
        />
        
        {/* Height Input */}
        <input
          type="number"
          value={aspectPreset === 'custom' ? customHeight : aspectPresets[aspectPreset]?.height || 1500}
          onChange={(e) => {
            if (aspectPreset === 'custom') {
              const value = parseInt(e.target.value) || minHeight;
              onCustomHeightChange(Math.max(minHeight, Math.min(5000, value)));
            }
          }}
          disabled={aspectPreset !== 'custom'}
          min={minHeight}
          max={5000}
          placeholder="Height"
          style={{
            padding: '6px 8px',
            borderRadius: '6px',
            border: `1px solid ${selectBorder}`,
            fontSize: '12px',
            outline: 'none',
            width: '80px',
            boxSizing: 'border-box',
            backgroundColor: inputBg,
            color: inputText,
            cursor: aspectPreset === 'custom' ? 'text' : 'not-allowed',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
          }}
        />
        
        {/* Custom Button */}
        <div ref={customButtonRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              onAspectPresetChange('custom');
              setShowCustomInput(!showCustomInput);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${selectBorder}`,
              backgroundColor: buttonBg,
              color: buttonText,
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
            }}
          >
            Custom
          </button>
          {showCustomInput && aspectPreset === 'custom' && (
            <CustomDimensionInput
              width={customWidth}
              height={customHeight}
              onWidthChange={onCustomWidthChange}
              onHeightChange={onCustomHeightChange}
              onClose={() => setShowCustomInput(false)}
              minWidth={minWidth}
              minHeight={minHeight}
            />
          )}
        </div>
        
        {/* Prompt Input */}
        <input
          type="text"
          value={expandPrompt}
          onChange={(e) => onExpandPromptChange(e.target.value)}
          placeholder="Prompt (optional)"
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: `1px solid ${selectBorder}`,
            backgroundColor: promptInputBg,
            color: promptInputText,
            fontSize: '12px',
            outline: 'none',
            minWidth: '150px',
            maxWidth: '200px',
            flex: 1,
            boxSizing: 'border-box',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={onExpand}
          disabled={isExpanding || externalIsExpanding || !sourceImageUrl}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isExpanding || externalIsExpanding || !sourceImageUrl ? '#9ca3af' : '#437eb5',
            color: 'white',
            cursor: isExpanding || externalIsExpanding || !sourceImageUrl ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {isExpanding || externalIsExpanding ? 'Expanding...' : 'Expand'}
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            color: closeButtonColor,
            padding: 0,
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.3s ease',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

