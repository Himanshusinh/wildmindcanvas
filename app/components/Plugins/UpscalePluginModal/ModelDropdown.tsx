'use client';

import React, { useRef, useEffect } from 'react';

const UPSCALE_MODELS = [
  'Crystal Upscaler',
];

interface ModelDropdownProps {
  selectedModel: string;
  scale: number;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (model: string) => void;
}

export const ModelDropdown: React.FC<ModelDropdownProps> = ({
  selectedModel,
  scale,
  isOpen,
  onToggle,
  onSelect,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownBorderColor = 'rgba(0,0,0,0.1)';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onToggle]);

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        flex: 1,
        minWidth: `${200 * scale}px`,
        width: 'max-content',
        zIndex: 10002,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: `${10 * scale}px ${16 * scale}px`,
          backgroundColor: '#ffffff',
          border: `1px solid ${dropdownBorderColor}`,
          borderRadius: `${8 * scale}px`,
          fontSize: `${14 * scale}px`,
          color: '#1f2937',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ whiteSpace: 'nowrap' }}>{selectedModel}</span>
        <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: `${8 * scale}px` }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: `${4 * scale}px`,
            backgroundColor: '#ffffff',
            border: `1px solid ${dropdownBorderColor}`,
            borderRadius: `${8 * scale}px`,
            boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`,
            zIndex: 10001,
            maxHeight: `${300 * scale}px`,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: `${4 * scale}px`,
            padding: `${8 * scale}px`,
          }}
        >
          {UPSCALE_MODELS.map((model) => (
            <div
              key={model}
              onClick={() => {
                onSelect(model);
                onToggle();
              }}
              style={{
                padding: `${8 * scale}px ${12 * scale}px`,
                borderRadius: `${6 * scale}px`,
                cursor: 'pointer',
                backgroundColor: selectedModel === model ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: selectedModel === model ? '#3b82f6' : '#1f2937',
                fontSize: `${14 * scale}px`,
                whiteSpace: 'nowrap',
                minWidth: 'max-content',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (selectedModel !== model) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedModel !== model) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>{model}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

