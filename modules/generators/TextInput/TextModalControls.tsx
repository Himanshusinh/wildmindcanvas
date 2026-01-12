'use client';
import { useRef, useEffect, useState } from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

interface TextModalControlsProps {
  scale: number;
  isHovered: boolean;
  isPinned: boolean;
  selectedModel: string;
  isModelDropdownOpen: boolean;
  isModelHovered: boolean;
  frameBorderColor: string;
  frameBorderWidth: number;
  text: string;
  isEnhancing: boolean;
  enhanceStatus: string;
  onModelChange: (model: string) => void;
  onSetIsHovered: (hovered: boolean) => void;
  onSetIsPinned: (pinned: boolean) => void;
  onSetIsModelDropdownOpen: (open: boolean) => void;
  onSetIsModelHovered: (hovered: boolean) => void;
  onEnhance: () => void;
  onSendPrompt?: () => void;
  hasConnectedComponents?: boolean;
}

export const TextModalControls: React.FC<TextModalControlsProps> = ({
  scale,
  isHovered,
  isPinned,
  selectedModel,
  isModelDropdownOpen,
  isModelHovered,
  frameBorderColor,
  frameBorderWidth,
  text,
  isEnhancing,
  enhanceStatus,
  onModelChange,
  onSetIsHovered,
  onSetIsPinned,
  onSetIsModelDropdownOpen,
  onSetIsModelHovered,
  onEnhance,
  onSendPrompt,
  hasConnectedComponents = false,
}) => {
  const isDark = useIsDarkTheme();

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)';
  const controlFontSize = `${13 * scale}px`;
  const controlsBg = isDark ? '#121212' : '#ffffff';
  const dropdownText = isDark ? '#ffffff' : '#1f2937';
  const dropdownHoverBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const selectedBg = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)';
  const iconColor = isDark ? '#cccccc' : '#4b5563';

  const buttonHoverBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        onSetIsModelDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen, onSetIsModelDropdownOpen]);

  return (
    <div
      className="controls-overlay"
      style={{
        position: 'absolute',
        top: '100%',
        left: `${-frameBorderWidth * scale}px`,
        right: `${-frameBorderWidth * scale}px`, // Span full width
        padding: `${12 * scale}px`,
        paddingTop: `${8 * scale}px`,
        paddingBottom: `${12 * scale}px`,
        backgroundColor: controlsBg,
        borderBottomLeftRadius: `${16 * scale}px`,
        borderBottomRightRadius: `${16 * scale}px`,
        borderTop: 'none',
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderBottom: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        transform: (isHovered || isPinned) ? 'translateY(0)' : `translateY(-100%)`,
        opacity: (isHovered || isPinned) ? 1 : 0,
        maxHeight: (isHovered || isPinned) ? `${400 * scale}px` : '0px',
        display: 'flex',
        flexDirection: 'column',
        gap: `${10 * scale}px`,
        pointerEvents: (isHovered || isPinned) ? 'auto' : 'none',
        overflow: 'visible',
        zIndex: 1,
        transition: 'background-color, border-color, opacity, max-height',
        marginTop: `${-1 * scale}px`, // Pull up to overlap border
      }}
      onMouseEnter={() => onSetIsHovered(true)}
      onMouseLeave={() => onSetIsHovered(false)}
    >
      {/* Model Selector and Enhance Button - Side by Side */}
      <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', width: '100%' }}>
        {/* Model Selector - Custom Dropdown */}
        <div ref={modelDropdownRef} style={{ position: 'relative', flex: 1, overflow: 'visible', zIndex: 3002 }} onMouseEnter={() => onSetIsModelHovered(true)} onMouseLeave={() => onSetIsModelHovered(false)}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetIsModelDropdownOpen(!isModelDropdownOpen);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              padding: `${8 * scale}px ${12 * scale}px`,
              minHeight: `${32 * scale}px`,
              backgroundColor: 'transparent', // Cleaner look
              border: `1px solid ${dropdownBorderColor}`,
              borderRadius: `${8 * scale}px`,
              fontSize: controlFontSize,
              fontWeight: '500',
              color: dropdownText,
              outline: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
              transition: 'background-color, border-color, color',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = buttonHoverBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{selectedModel}</span>
            <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isModelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.6 }}>
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isModelDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: `${4 * scale}px`,
                backgroundColor: controlsBg,
                border: `1px solid ${dropdownBorderColor}`,
                borderRadius: `${8 * scale}px`,
                boxShadow: isDark ? `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.4)` : `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.1)`,
                maxHeight: `${200 * scale}px`,
                overflowY: 'auto',
                zIndex: 3003,
                padding: `${4 * scale}px`,
                transition: 'background-color, border-color, box-shadow',
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {['GPT-4o', 'Gemini Pro'].map((model) => (
                <div
                  key={model}
                  onClick={(e) => {
                    e.stopPropagation();
                    onModelChange(model);
                    onSetIsModelDropdownOpen(false);
                  }}
                  style={{
                    padding: `${6 * scale}px ${8 * scale}px`,
                    fontSize: controlFontSize,
                    color: dropdownText,
                    cursor: 'pointer',
                    borderRadius: `${4 * scale}px`,
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: selectedModel === model ? selectedBg : 'transparent',
                    transition: 'background-color 0.2s ease, color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedModel !== model) {
                      e.currentTarget.style.backgroundColor = buttonHoverBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedModel !== model) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {selectedModel === model && (
                    <div style={{ width: `${6 * scale}px`, height: `${6 * scale}px`, borderRadius: '50%', backgroundColor: isDark ? '#3b82f6' : '#2563eb', marginRight: `${8 * scale}px` }} />
                  )}
                  <span style={{ fontWeight: selectedModel === model ? 500 : 400 }}>{model}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhance Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!text.trim() || isEnhancing) return;
            onEnhance();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title={isEnhancing ? enhanceStatus || 'Enhancing...' : 'Enhance prompt'}
          style={{
            height: `${32 * scale}px`,
            padding: `0 ${12 * scale}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${6 * scale}px`,
            background: isEnhancing
              ? 'rgba(168,85,247,0.1)'
              : 'transparent',
            border: `1px solid ${isEnhancing ? 'rgba(168,85,247,0.5)' : dropdownBorderColor}`,
            borderRadius: `${8 * scale}px`,
            color: isEnhancing ? '#a855f7' : iconColor,
            cursor: isEnhancing || !text.trim() ? 'not-allowed' : 'pointer',
            boxShadow: 'none',
            opacity: isEnhancing || !text.trim() ? 0.6 : 1,
            flexShrink: 0,
            fontSize: controlFontSize,
            fontWeight: 500,
          }}
          disabled={!text.trim() || isEnhancing}
          onMouseEnter={(e) => {
            if (!isEnhancing && text.trim()) {
              e.currentTarget.style.backgroundColor = buttonHoverBg;
              e.currentTarget.style.color = isDark ? '#ffffff' : '#000000';
            }
          }}
          onMouseLeave={(e) => {
            if (!isEnhancing) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = iconColor;
            }
          }}
        >
          {isEnhancing ? (
            <svg
              width={16 * scale}
              height={16 * scale}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: 'spin 1s linear infinite',
              }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4" />
              <path d="M12 18v4" />
              <path d="M4.93 4.93l2.83 2.83" />
              <path d="M16.24 16.24l2.83 2.83" />
              <path d="M2 12h4" />
              <path d="M18 12h4" />
              <path d="M4.93 19.07l2.83-2.83" />
              <path d="M16.24 7.76l2.83-2.83" />
            </svg>
          )}
          <span>Enhance</span>
        </button>


        {enhanceStatus && (
          <span
            style={{
              fontSize: `${11 * scale}px`,
              color: isDark ? '#9CA3AF' : '#4B5563',
              whiteSpace: 'nowrap',
            }}
          >
            {enhanceStatus}
          </span>
        )}
      </div>
    </div>
  );
};

