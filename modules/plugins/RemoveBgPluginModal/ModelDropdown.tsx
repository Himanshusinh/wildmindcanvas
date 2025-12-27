'use client';

import React, { useRef, useEffect } from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

const REMOVE_BG_MODELS = [
  '851-labs/background-remover',
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
  const isDark = useIsDarkTheme();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)';
  const dropdownBg = isDark ? '#121212' : '#ffffff';
  const dropdownText = isDark ? '#ffffff' : '#1f2937';
  const dropdownHoverBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const selectedBg = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)';
  const selectedText = isDark ? '#60a5fa' : '#3b82f6';

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
        flex: '1 1 auto',
        width: '100%',
        minWidth: 0,
        maxWidth: '100%',
        zIndex: 3000,
        overflow: 'visible',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: `${10 * scale}px ${16 * scale}px`,
          backgroundColor: dropdownBg,
          border: `1px solid ${dropdownBorderColor}`,
          borderRadius: `${8 * scale}px`,
          fontSize: `${13 * scale}px`,
          color: dropdownText,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: `calc(100% - ${24 * scale}px)`, display: 'block' }}>{selectedModel}</span>
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
            backgroundColor: dropdownBg,
            border: `1px solid ${dropdownBorderColor}`,
            borderRadius: `${8 * scale}px`,
            boxShadow: isDark ? `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`,
            zIndex: 3001,
            maxHeight: `${300 * scale}px`,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: `${4 * scale}px`,
            padding: `${8 * scale}px`,
            transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
          }}
        >
          {REMOVE_BG_MODELS.map((model) => (
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
                backgroundColor: selectedModel === model ? selectedBg : 'transparent',
                color: selectedModel === model ? selectedText : dropdownText,
                fontSize: `${14 * scale}px`,
                whiteSpace: 'nowrap',
                minWidth: 'max-content',
                transition: 'background-color 0.3s ease, color 0.3s ease',
              }}
              onMouseEnter={(e) => {
                if (selectedModel !== model) {
                  e.currentTarget.style.backgroundColor = dropdownHoverBg;
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

