'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CustomDimensionInput } from './CustomDimensionInput';

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
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const customButtonRef = useRef<HTMLDivElement>(null);

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
      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, flexShrink: 0 }}>
        Expand Image
      </h3>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, justifyContent: 'center', minWidth: 0 }}>
        {/* Aspect Ratio Dropdown (without Custom) */}
        <select
          value={aspectPreset === 'custom' ? '1:1' : aspectPreset}
          onChange={(e) => onAspectPresetChange(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '12px',
            outline: 'none',
            minWidth: '120px',
            maxWidth: '140px',
            boxSizing: 'border-box',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          {Object.entries(aspectPresets)
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
              const value = parseInt(e.target.value) || 1024;
              onCustomWidthChange(Math.max(1024, Math.min(5000, value)));
            }
          }}
          disabled={aspectPreset !== 'custom'}
          min={1024}
          max={5000}
          placeholder="Width"
          style={{
            padding: '6px 8px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '12px',
            outline: 'none',
            width: '80px',
            boxSizing: 'border-box',
            backgroundColor: aspectPreset === 'custom' ? 'white' : '#f3f4f6',
            color: aspectPreset === 'custom' ? '#111827' : '#9ca3af',
            cursor: aspectPreset === 'custom' ? 'text' : 'not-allowed',
          }}
        />
        
        {/* Height Input */}
        <input
          type="number"
          value={aspectPreset === 'custom' ? customHeight : aspectPresets[aspectPreset]?.height || 1500}
          onChange={(e) => {
            if (aspectPreset === 'custom') {
              const value = parseInt(e.target.value) || 1024;
              onCustomHeightChange(Math.max(1024, Math.min(5000, value)));
            }
          }}
          disabled={aspectPreset !== 'custom'}
          min={1024}
          max={5000}
          placeholder="Height"
          style={{
            padding: '6px 8px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            fontSize: '12px',
            outline: 'none',
            width: '80px',
            boxSizing: 'border-box',
            backgroundColor: aspectPreset === 'custom' ? 'white' : '#f3f4f6',
            color: aspectPreset === 'custom' ? '#111827' : '#9ca3af',
            cursor: aspectPreset === 'custom' ? 'text' : 'not-allowed',
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
              border: '1px solid #e5e7eb',
              backgroundColor: aspectPreset === 'custom' ? '#437eb5' : 'white',
              color: aspectPreset === 'custom' ? 'white' : '#374151',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
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
            border: '1px solid #e5e7eb',
            fontSize: '12px',
            outline: 'none',
            minWidth: '150px',
            maxWidth: '200px',
            flex: 1,
            boxSizing: 'border-box',
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
            color: '#666',
            padding: 0,
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

