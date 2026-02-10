'use client';

import React, { useRef, useEffect } from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

const UPSCALE_MODELS = [
  'Crystal Upscaler',
  'Topaz Upscaler',
  'Real-ESRGAN',
];

interface ModelDropdownProps {
  selectedModel: string;
  scale: number;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (model: string) => void;
  options?: string[];
  minWidth?: number;
}

export const ModelDropdown: React.FC<ModelDropdownProps> = ({
  selectedModel,
  scale,
  isOpen,
  onToggle,
  onSelect,
  options = UPSCALE_MODELS,
  minWidth = 180,
}) => {
  const isDark = useIsDarkTheme();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)';
  const dropdownBg = isDark ? '#121212' : '#ffffff';
  const dropdownText = isDark ? '#ffffff' : '#1f2937';
  const dropdownHoverBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const selectedBg = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)';
  const selectedText = isDark ? '#60a5fa' : '#3b82f6';

  const listRef = useRef<HTMLDivElement>(null);

  // Robust Canvas Scroll Blocking
  useEffect(() => {
    if (!isOpen) return;

    const onWindowWheelCapture = (e: WheelEvent) => {
      if (!listRef.current) return;

      const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
      const isInList = path.includes(listRef.current);

      if (!isInList) return;

      // Block canvas/Konva wheel handlers
      e.stopPropagation();
      (e as any).stopImmediatePropagation?.();

      // Manually scroll the local list
      if (listRef.current) {
        listRef.current.scrollTop += e.deltaY;
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', onWindowWheelCapture, { passive: false, capture: true });
    return () => {
      window.removeEventListener('wheel', onWindowWheelCapture as any, true);
    };
  }, [isOpen]);

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
        minWidth: `${minWidth * scale}px`,
        width: '100%',
        zIndex: 10002,
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: `${10 * scale}px ${16 * scale}px`,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
          border: `1px solid ${dropdownBorderColor}`,
          borderRadius: `${10 * scale}px`,
          fontSize: `${13 * scale}px`,
          fontWeight: 500,
          color: dropdownText,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          whiteSpace: 'nowrap',
          transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}
      >
        <span style={{ whiteSpace: 'nowrap' }}>{selectedModel}</span>
        <svg
          width={14 * scale}
          height={14 * scale}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            marginLeft: `${8 * scale}px`,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            opacity: 0.6
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div
          ref={listRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: `${6 * scale}px`,
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            border: `1px solid ${dropdownBorderColor}`,
            borderRadius: `${12 * scale}px`,
            boxShadow: isDark
              ? `0 ${10 * scale}px ${30 * scale}px rgba(0, 0, 0, 0.6)`
              : `0 ${10 * scale}px ${30 * scale}px rgba(0, 0, 0, 0.1)`,
            zIndex: 10001,
            maxHeight: `${300 * scale}px`,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: `${2 * scale}px`,
            padding: `${6 * scale}px`,
            minWidth: '100%',
            width: 'max-content',
          }}
        >
          {options.map((model) => (
            <div
              key={model}
              onClick={() => {
                onSelect(model);
                onToggle();
              }}
              style={{
                padding: `${8 * scale}px ${12 * scale}px`,
                borderRadius: `${8 * scale}px`,
                cursor: 'pointer',
                backgroundColor: selectedModel === model ? selectedBg : 'transparent',
                color: selectedModel === model ? selectedText : dropdownText,
                fontSize: `${13 * scale}px`,
                fontWeight: selectedModel === model ? 600 : 400,
                whiteSpace: 'nowrap',
                minWidth: 'max-content',
                transition: 'background-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
              {selectedModel === model && (
                <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
      <style jsx>{`
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

