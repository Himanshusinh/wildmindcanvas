'use client';
import { useRef, useEffect, useState } from 'react';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface MusicModalControlsProps {
  scale: number;
  isHovered: boolean;
  isPinned: boolean;

  isSelected?: boolean;
  prompt: string;
  selectedModel: string;
  selectedAspectRatio: string;
  selectedFrame: string;
  generatedMusicUrl?: string | null;
  isGenerating: boolean;
  isModelDropdownOpen: boolean;
  isAspectRatioDropdownOpen: boolean;
  frameBorderColor: string;
  frameBorderWidth: number;
  onPromptChange: (value: string) => void;
  onModelChange: (model: string) => void;
  onAspectRatioChange: (ratio: string) => void;
  onGenerate: () => void;
  onSetIsHovered: (hovered: boolean) => void;

  onSetIsModelDropdownOpen: (open: boolean) => void;
  onSetIsAspectRatioDropdownOpen: (open: boolean) => void;
  onOptionsChange?: (opts: { model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number }) => void;
}

export const MusicModalControls: React.FC<MusicModalControlsProps> = ({
  scale,
  isHovered,
  isPinned,

  isSelected = false,
  prompt,
  selectedModel,
  selectedAspectRatio,
  selectedFrame,
  generatedMusicUrl,
  isGenerating,
  isModelDropdownOpen,
  isAspectRatioDropdownOpen,
  frameBorderColor,
  frameBorderWidth,
  onPromptChange,
  onModelChange,
  onAspectRatioChange,
  onGenerate,
  onSetIsHovered,

  onSetIsModelDropdownOpen,
  onSetIsAspectRatioDropdownOpen,
  onOptionsChange,
}) => {
  const isDark = useIsDarkTheme();

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)';
  const controlFontSize = `${13 * scale}px`;
  const controlsFrameBorderColor = isSelected ? '#437eb5' : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
  const controlsBg = isDark ? '#121212' : '#ffffff';
  const inputBg = isDark ? '#121212' : '#ffffff';
  const inputText = isDark ? '#ffffff' : '#1f2937';
  const dropdownBg = isDark ? '#121212' : '#ffffff';
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
      if (aspectRatioDropdownRef.current && !aspectRatioDropdownRef.current.contains(event.target as Node)) {
        onSetIsAspectRatioDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen || isAspectRatioDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen, isAspectRatioDropdownOpen, onSetIsModelDropdownOpen, onSetIsAspectRatioDropdownOpen]);

  return (
    <div
      className="controls-overlay"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        width: `${600 * scale}px`,
        maxWidth: '90vw',
        padding: `${16 * scale}px`,
        backgroundColor: controlsBg,
        borderRadius: `0 0 ${16 * scale}px ${16 * scale}px`,
        boxShadow: 'none',
        transform: (isHovered || isPinned) ? 'translateY(0)' : `translateY(-100%)`,
        opacity: (isHovered || isPinned) ? 1 : 0,
        maxHeight: (isHovered || isPinned) ? '500px' : '0px',
        display: 'flex',
        flexDirection: 'column',
        gap: `${12 * scale}px`,
        pointerEvents: (isHovered || isPinned) ? 'auto' : 'none',
        overflow: 'visible',
        zIndex: 3,
        borderLeft: `${frameBorderWidth * scale}px solid ${controlsFrameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${controlsFrameBorderColor}`,
        borderBottom: `${frameBorderWidth * scale}px solid ${controlsFrameBorderColor}`,
        transition: 'background-color 0.3s ease, border-color 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
      }}
      onMouseEnter={() => onSetIsHovered(true)}
      onMouseLeave={() => onSetIsHovered(false)}
    >
      {/* Prompt Input */}
      <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center' }}>
        <input
          className="prompt-input"
          type="text"
          value={prompt}
          onChange={(e) => {
            const val = e.target.value;
            onPromptChange(val);
            onOptionsChange?.({ prompt: val, model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame });
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onGenerate();
            }
          }}
          placeholder="Enter music prompt here..."
          style={{
            flex: 1,
            padding: `${10 * scale}px ${14 * scale}px`,
            backgroundColor: inputBg,
            border: `1px solid ${dropdownBorderColor}`,
            borderRadius: `${10 * scale}px`,
            fontSize: controlFontSize,
            color: inputText,
            outline: 'none',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = `1px solid ${frameBorderColor}`;
            e.currentTarget.style.boxShadow = `0 0 0 ${1 * scale}px ${frameBorderColor}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = `1px solid ${dropdownBorderColor}`;
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />
        <button
          onClick={onGenerate}
          disabled={!prompt.trim() || isGenerating}
          style={{
            width: `${40 * scale}px`,
            height: `${40 * scale}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: (prompt.trim() && !isGenerating) ? '#437eb5' : 'rgba(0, 0, 0, 0.1)',
            border: 'none',
            borderRadius: `${10 * scale}px`,
            cursor: (prompt.trim() && !isGenerating) ? 'pointer' : 'not-allowed',
            color: 'white',
            boxShadow: (prompt.trim() && !isGenerating) ? `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)` : 'none',
            padding: 0,
            opacity: isGenerating ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (prompt.trim() && !isGenerating) {
              e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(67, 126, 181, 0.5)`;
            }
          }}
          onMouseLeave={(e) => {
            if (prompt.trim() && !isGenerating) {
              e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)`;
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isGenerating ? (
            <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
              </path>
            </svg>
          ) : (
            <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 12h9" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          )}
        </button>
      </div>

      {/* Settings Row */}
      <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Model Selector - Custom Dropdown */}
        <div ref={modelDropdownRef} style={{ position: 'relative', flex: 1, minWidth: `${140 * scale}px`, overflow: 'visible', zIndex: 3002 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetIsModelDropdownOpen(!isModelDropdownOpen);
              onSetIsAspectRatioDropdownOpen(false);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              padding: `${10 * scale}px ${28 * scale}px ${10 * scale}px ${14 * scale}px`,
              backgroundColor: dropdownBg,
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
                backgroundColor: dropdownBg,
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
              {['MusicGen', 'AudioCraft', 'MusicLM', 'Jukebox', 'Mubert'].map((model) => (
                <div
                  key={model}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetIsModelDropdownOpen(false);
                    const frameWidth = 600;
                    const frameHeight = 300;
                    onModelChange(model);
                    onOptionsChange?.({ model, aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, frameWidth, frameHeight });
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

        {/* Aspect Ratio Selector - Custom Dropdown */}
        <div ref={aspectRatioDropdownRef} style={{ position: 'relative', overflow: 'visible', zIndex: 3001 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetIsAspectRatioDropdownOpen(!isAspectRatioDropdownOpen);
              onSetIsModelDropdownOpen(false);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              padding: `${10 * scale}px ${28 * scale}px ${10 * scale}px ${14 * scale}px`,
              backgroundColor: dropdownBg,
              border: `1px solid ${dropdownBorderColor}`,
              borderRadius: `${9999 * scale}px`,
              fontSize: controlFontSize,
              fontWeight: '600',
              color: dropdownText,
              minWidth: `${70 * scale}px`,
              outline: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
            }}
          >
            <span>{selectedAspectRatio}</span>
            <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isAspectRatioDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M2 4L6 8L10 4" stroke={isDark ? '#60a5fa' : '#3b82f6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isAspectRatioDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: `${4 * scale}px`,
                backgroundColor: dropdownBg,
                border: `1px solid ${dropdownBorderColor}`,
                borderRadius: `${12 * scale}px`,
                boxShadow: isDark ? `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.15)`,
                maxHeight: `${200 * scale}px`,
                overflowY: 'auto',
                zIndex: 3003,
                padding: `${4 * scale}px 0`,
                minWidth: `${100 * scale}px`,
                transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'].map((ratio) => (
                <div
                  key={ratio}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetIsAspectRatioDropdownOpen(false);
                    const frameWidth = 600;
                    const frameHeight = 300;
                    onAspectRatioChange(ratio);
                    onOptionsChange?.({ model: selectedModel, aspectRatio: ratio, frame: selectedFrame, prompt, frameWidth, frameHeight });
                  }}
                  style={{
                    padding: `${8 * scale}px ${16 * scale}px`,
                    fontSize: controlFontSize,
                    color: dropdownText,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: selectedAspectRatio === ratio ? selectedBg : 'transparent',
                    borderLeft: selectedAspectRatio === ratio ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                    transition: 'background-color 0.3s ease, color 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedAspectRatio !== ratio) {
                      e.currentTarget.style.backgroundColor = dropdownHoverBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedAspectRatio !== ratio) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {selectedAspectRatio === ratio && (
                    <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  <span>{ratio}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

