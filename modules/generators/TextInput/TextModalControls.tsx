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
        width: `${400 * scale}px`,
        padding: `${12 * scale}px`,
        paddingTop: `${16 * scale}px`,
        paddingBottom: `${16 * scale}px`,
        backgroundColor: controlsBg,

        border: 'none',
        borderTop: 'none',
        borderRadius: `0 0 ${12 * scale}px ${12 * scale}px`,
        boxShadow: 'none',
        transform: (isHovered || isPinned) ? 'translateY(0)' : `translateY(-100%)`,
        opacity: (isHovered || isPinned) ? 1 : 0,
        maxHeight: (isHovered || isPinned) ? '400px' : '0px',
        display: 'flex',
        flexDirection: 'column',
        gap: `${12 * scale}px`,
        pointerEvents: (isHovered || isPinned) ? 'auto' : 'none',
        overflow: 'visible',
        zIndex: 1,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderBottom: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        transition: 'background-color 0.3s ease, border-color 0.3s ease, opacity 0.3s ease, transform 0.3s ease, max-height 0.3s ease',
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
              padding: `${14 * scale}px ${28 * scale}px ${14 * scale}px ${14 * scale}px`,
              minHeight: `${40 * scale}px`,
              backgroundColor: controlsBg,
              border: `1px solid ${dropdownBorderColor}`,
              borderRadius: `${9999 * scale}px`,
              fontSize: controlFontSize,
              fontWeight: '500',
              color: dropdownText,
              outline: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
              transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{selectedModel}</span>
            <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isModelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M2 4L6 8L10 4" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                borderRadius: `${12 * scale}px`,
                boxShadow: isDark ? `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.15)`,
                maxHeight: `${200 * scale}px`,
                overflowY: 'auto',
                zIndex: 3003,
                padding: `${4 * scale}px 0`,
                transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
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
                    padding: `${8 * scale}px ${16 * scale}px`,
                    fontSize: controlFontSize,
                    color: dropdownText,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: selectedModel === model ? selectedBg : 'transparent',
                    borderLeft: selectedModel === model ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
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
                  {selectedModel === model && (
                    <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  <span>{model}</span>
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
            width: `${30 * scale}px`,
            height: `${30 * scale}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isEnhancing
              ? 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(168,85,247,0.4) 100%)'
              : 'linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(168,85,247,0.6) 100%)',
            border: `${1 * scale}px solid rgba(168,85,247,0.65)`,
            borderRadius: `${12 * scale}px`,
            color: '#6d28d9',
            cursor: isEnhancing || !text.trim() ? 'not-allowed' : 'pointer',
            boxShadow: `0 ${6 * scale}px ${16 * scale}px rgba(168,85,247,0.35)`,
            padding: 0,
            transition: 'none',
            opacity: isEnhancing || !text.trim() ? 0.6 : 1,
            flexShrink: 0,
          }}
          disabled={!text.trim() || isEnhancing}
          onMouseEnter={(e) => {
            if (!isEnhancing && text.trim()) {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 ${10 * scale}px ${24 * scale}px rgba(168,85,247,0.45)`;
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(168,85,247,0.35)`;
          }}
        >
          {isEnhancing ? (
            <svg
              width={20 * scale}
              height={20 * scale}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: 'spin 1s linear infinite',
                transformOrigin: 'center',
              }}
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width={20 * scale} height={20 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v4" />
              <path d="M12 17v4" />
              <path d="M3 12h4" />
              <path d="M17 12h4" />
              <path d="M5.6 5.6l2.8 2.8" />
              <path d="M15.6 15.6l2.8 2.8" />
              <path d="M18.4 5.6l-2.8 2.8" />
              <path d="M8.4 15.6l-2.8 2.8" />
            </svg>
          )}
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

