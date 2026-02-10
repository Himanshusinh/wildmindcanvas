'use client';
import { useRef, useEffect, useState } from 'react';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { GenerateArrowIcon } from '@/modules/ui-global/common/GenerateArrowIcon';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { ChevronDown } from 'lucide-react';

interface ImageModalControlsProps {
  scale: number;
  isHovered: boolean;
  isPinned: boolean;
  isUploadedImage: boolean;
  isSelected?: boolean;
  prompt: string;
  isPromptDisabled?: boolean;
  selectedModel: string;
  selectedAspectRatio: string;
  selectedFrame: string;
  selectedResolution: string;
  imageCount: number;
  generatedImageUrl?: string | null;
  availableModels: string[];
  availableResolutions: Array<{ value: string; label: string }>;
  isGenerating: boolean;
  isLocked: boolean;
  lockReason: string;
  isModelDropdownOpen: boolean;
  isAspectRatioDropdownOpen: boolean;
  isResolutionDropdownOpen: boolean;
  onPromptChange: (value: string) => void;
  onModelChange: (model: string) => void;
  onAspectRatioChange: (ratio: string) => void;
  onResolutionChange: (resolution: string) => void;
  onImageCountChange: (count: number) => void;
  onGenerate: () => void;
  getAvailableAspectRatios: () => Array<{ value: string; label: string }>;
  onSetIsHovered: (hovered: boolean) => void;
  onSetIsPinned: (pinned: boolean) => void;
  onSetIsModelDropdownOpen: (open: boolean) => void;
  onSetIsAspectRatioDropdownOpen: (open: boolean) => void;
  onSetIsResolutionDropdownOpen: (open: boolean) => void;
  gptQuality: 'low' | 'medium' | 'high' | 'auto';
  gptBackground: 'auto' | 'transparent' | 'opaque';
  gptModeration: 'auto' | 'low';
  onGptQualityChange: (quality: 'low' | 'medium' | 'high' | 'auto') => void;
  onGptBackgroundChange: (bg: 'auto' | 'transparent' | 'opaque') => void;
  onGptModerationChange: (mod: 'auto' | 'low') => void;
}

export const ImageModalControls: React.FC<ImageModalControlsProps> = ({
  scale,
  isHovered,
  isPinned,
  isUploadedImage,
  isSelected = false,
  prompt,
  isPromptDisabled = false,
  selectedModel,
  selectedAspectRatio,
  selectedFrame,
  selectedResolution,
  imageCount,
  generatedImageUrl,
  availableModels,
  availableResolutions,
  isGenerating,
  isLocked,
  lockReason,
  isModelDropdownOpen,
  isAspectRatioDropdownOpen,
  isResolutionDropdownOpen,
  onPromptChange,
  onModelChange,
  onAspectRatioChange,
  onResolutionChange,
  onImageCountChange,
  onGenerate,
  getAvailableAspectRatios,
  onSetIsHovered,
  onSetIsPinned,
  onSetIsModelDropdownOpen,
  onSetIsAspectRatioDropdownOpen,
  onSetIsResolutionDropdownOpen,
  gptQuality,
  gptBackground,
  gptModeration,
  onGptQualityChange,
  onGptBackgroundChange,
  onGptModerationChange,
}) => {
  const isDark = useIsDarkTheme();

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null);
  const resolutionDropdownRef = useRef<HTMLDivElement>(null);
  const frameBorderColor = isSelected ? SELECTION_COLOR : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
  const frameBorderWidth = 2;
  const dropdownBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)';
  const controlFontSize = `${13 * scale}px`;
  const controlsBg = isDark ? '#121212' : '#ffffff';
  const inputBg = isDark ? (isPromptDisabled ? '#1a1a1a' : '#121212') : (isPromptDisabled ? '#f3f4f6' : '#ffffff');
  const inputText = isDark ? (isPromptDisabled ? '#666666' : '#ffffff') : (isPromptDisabled ? '#6b7280' : '#1f2937');
  const dropdownBg = isDark ? '#121212' : '#ffffff';
  const dropdownText = isDark ? '#ffffff' : '#1f2937';
  const dropdownHoverBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const selectedBg = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)';
  const countText = isDark ? '#ffffff' : '#1f2937';
  const labelColor = isDark ? '#9ca3af' : '#6b7280';

  const [isQualityDropdownOpen, setIsQualityDropdownOpen] = useState(false);
  const [isBackgroundDropdownOpen, setIsBackgroundDropdownOpen] = useState(false);
  const [isModerationDropdownOpen, setIsModerationDropdownOpen] = useState(false);

  const qualityDropdownRef = useRef<HTMLDivElement>(null);
  const backgroundDropdownRef = useRef<HTMLDivElement>(null);
  const moderationDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(target)) {
        onSetIsModelDropdownOpen(false);
      }
      if (aspectRatioDropdownRef.current && !aspectRatioDropdownRef.current.contains(target)) {
        onSetIsAspectRatioDropdownOpen(false);
      }
      if (resolutionDropdownRef.current && !resolutionDropdownRef.current.contains(target)) {
        onSetIsResolutionDropdownOpen(false);
      }
      if (qualityDropdownRef.current && !qualityDropdownRef.current.contains(target)) {
        setIsQualityDropdownOpen(false);
      }
      if (backgroundDropdownRef.current && !backgroundDropdownRef.current.contains(target)) {
        setIsBackgroundDropdownOpen(false);
      }
      if (moderationDropdownRef.current && !moderationDropdownRef.current.contains(target)) {
        setIsModerationDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen || isAspectRatioDropdownOpen || isResolutionDropdownOpen || isQualityDropdownOpen || isBackgroundDropdownOpen || isModerationDropdownOpen) {
      // Use 'click' instead of 'mousedown' so it fires after dropdown item clicks
      // This ensures the item's onMouseDown handler can stop propagation first
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isModelDropdownOpen, isAspectRatioDropdownOpen, isResolutionDropdownOpen, onSetIsModelDropdownOpen, onSetIsAspectRatioDropdownOpen, onSetIsResolutionDropdownOpen]);



  return (
    <>
      {/* Controls - Behind Frame, Slides Out on Hover */}
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
          // Add left, right and bottom borders to match the frame border color/weight
          borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderBottom: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          marginTop: `${-frameBorderWidth * scale}px`, // Pull up to overlap border
          transition: 'background-color 0.3s ease, border-color 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        {/* Prompt Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
          <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center' }}>
            <input
              className="prompt-input"
              type="text"
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onGenerate();
                }
              }}
              placeholder="Enter prompt here..."
              disabled={isPromptDisabled}
              style={{
                flex: 1,
                padding: `${10 * scale}px ${14 * scale}px`,
                backgroundColor: inputBg,
                border: 'none',
                borderRadius: `${10 * scale}px`,
                fontSize: controlFontSize,
                color: inputText,
                outline: 'none',
                cursor: isPromptDisabled ? 'not-allowed' : 'text',
                opacity: isPromptDisabled ? 0.7 : 1,
                transition: 'background-color, color',
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = `1px solid ${frameBorderColor}`;
                e.currentTarget.style.boxShadow = `0 0 0 ${1 * scale}px ${frameBorderColor}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseDown={(e) => e.stopPropagation()}
            />
            <button
              onClick={onGenerate}
              disabled={!prompt.trim() || isGenerating || isLocked || prompt.trim().length > 5000}
              title={isLocked ? lockReason : (prompt.trim().length > 5000 ? 'Prompt is too long (max 5000 characters)' : undefined)}
              style={{
                width: `${40 * scale}px`,
                height: `${40 * scale}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: (prompt.trim() && !isGenerating && !isLocked && prompt.trim().length <= 5000) ? SELECTION_COLOR : 'rgba(0, 0, 0, 0.1)',
                border: 'none',
                borderRadius: `${10 * scale}px`,
                cursor: (prompt.trim() && !isGenerating && !isLocked && prompt.trim().length <= 5000) ? 'pointer' : 'not-allowed',
                color: 'white',
                boxShadow: (prompt.trim() && !isGenerating && !isLocked && prompt.trim().length <= 5000) ? `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)` : 'none',
                padding: 0,
                opacity: (isGenerating || isLocked) ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (prompt.trim() && !isLocked && prompt.trim().length <= 5000) {
                  e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(76, 131, 255, 0.5)`;
                }
              }}
              onMouseLeave={(e) => {
                if (prompt.trim() && !isLocked && prompt.trim().length <= 5000) {
                  e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`;
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {isLocked ? (
                <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ) : isGenerating ? (
                <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeDasharray="31.416" strokeDashoffset="31.416">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416;0 31.416" repeatCount="indefinite" />
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416;-31.416" repeatCount="indefinite" />
                  </path>
                </svg>
              ) : (
                <GenerateArrowIcon scale={scale} />
              )}
            </button>
          </div>
          {/* Character Counter */}
          {prompt.length > 0 && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              paddingRight: `${8 * scale}px`,
            }}>
              <span style={{
                fontSize: `${10 * scale}px`,
                color: prompt.trim().length > 5000 ? '#ef4444' : (prompt.trim().length > 4500 ? '#f59e0b' : labelColor),
                fontWeight: prompt.trim().length > 5000 ? 600 : 400,
                transition: 'color 0.2s ease',
              }}>
                {prompt.trim().length} / 5000
                {prompt.trim().length > 5000 && ' (too long)'}
              </span>
            </div>
          )}
        </div>

        {/* Settings Row */}
        <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Model Selector - Custom Dropdown */}
          <div ref={modelDropdownRef} style={{ position: 'relative', flex: '0 0 auto', width: `${220 * scale}px`, minWidth: `${120 * scale}px`, overflow: 'visible', zIndex: 3002 }}>
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
                <path d="M2 4L6 8L10 4" stroke={isDark ? '#cccccc' : '#4b5563'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {
              isModelDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    minWidth: `${400 * scale}px`,
                    width: 'max-content',
                    marginTop: `${4 * scale}px`,
                    backgroundColor: dropdownBg,
                    border: `1px solid ${dropdownBorderColor}`,
                    borderRadius: `${12 * scale}px`,
                    boxShadow: isDark ? `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.15)`,
                    zIndex: 3003,
                    padding: `${4 * scale}px 0`,
                    transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${4 * scale}px`, padding: `${4 * scale}px` }}>
                    {availableModels.map((model) => (
                      <div
                        key={model}
                        onClick={(e) => {
                          e.stopPropagation();
                          onModelChange(model);
                          onSetIsModelDropdownOpen(false);
                        }}

                        style={{
                          padding: `${6 * scale}px ${12 * scale}px`,
                          fontSize: controlFontSize,
                          color: dropdownText,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: selectedModel === model ? selectedBg : 'transparent',
                          borderRadius: `${6 * scale}px`,
                          whiteSpace: 'nowrap',
                          minWidth: 'max-content',
                          userSelect: 'none',
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
                        <span style={{ whiteSpace: 'nowrap' }}>{model}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          </div >

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
                {getAvailableAspectRatios().map((ratio) => (
                  <div
                    key={ratio.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAspectRatioChange(ratio.value);
                      onSetIsAspectRatioDropdownOpen(false);
                    }}
                    style={{
                      padding: `${8 * scale}px ${16 * scale}px`,
                      fontSize: controlFontSize,
                      color: dropdownText,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: selectedAspectRatio === ratio.value ? selectedBg : 'transparent',
                      borderLeft: selectedAspectRatio === ratio.value ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                      transition: 'background-color 0.3s ease, color 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedAspectRatio !== ratio.value) {
                        e.currentTarget.style.backgroundColor = dropdownHoverBg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAspectRatio !== ratio.value) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {selectedAspectRatio === ratio.value && (
                      <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span>{ratio.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolution Selector - Only show for models that support it */}
          {availableResolutions.length > 0 && (
            <div ref={resolutionDropdownRef} style={{ position: 'relative', overflow: 'visible', zIndex: 3000 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetIsResolutionDropdownOpen(!isResolutionDropdownOpen);
                  onSetIsModelDropdownOpen(false);
                  onSetIsAspectRatioDropdownOpen(false);
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
                  minWidth: `${100 * scale}px`,
                  outline: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
                }}
              >
                <span>
                  {availableResolutions.find(r => r.value === selectedResolution)?.label || selectedResolution}
                </span>
                <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isResolutionDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <path d="M2 4L6 8L10 4" stroke={isDark ? '#60a5fa' : '#3b82f6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isResolutionDropdownOpen && (
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
                    minWidth: `${120 * scale}px`,
                    transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {availableResolutions.map((resolution) => (
                    <div
                      key={resolution.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        // Change resolution immediately
                        onResolutionChange(resolution.value);
                        // Close dropdown after state update
                        onSetIsResolutionDropdownOpen(false);
                      }}
                      style={{
                        padding: `${8 * scale}px ${16 * scale}px`,
                        fontSize: controlFontSize,
                        color: dropdownText,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: selectedResolution === resolution.value ? selectedBg : 'transparent',
                        borderLeft: selectedResolution === resolution.value ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                        transition: 'background-color 0.3s ease, color 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedResolution !== resolution.value) {
                          e.currentTarget.style.backgroundColor = dropdownHoverBg;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedResolution !== resolution.value) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {selectedResolution === resolution.value && (
                        <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      <span>{resolution.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Image count +/- control (1..4) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
            <button
              onClick={(e) => { e.stopPropagation(); onImageCountChange(Math.max(1, imageCount - 1)); }}
              disabled={imageCount <= 1}
              title="Decrease images"
              style={{
                width: `${32 * scale}px`,
                height: `${32 * scale}px`,
                borderRadius: `${9999 * scale}px`,
                border: isDark ? `1px solid rgba(255, 255, 255, 0.15)` : `1px solid rgba(0,0,0,0.08)`,
                backgroundColor: dropdownBg,
                cursor: imageCount <= 1 ? 'not-allowed' : 'pointer',
                fontSize: `${13 * scale}px`,
                fontWeight: 600,
                lineHeight: 1,
                color: dropdownText,
                transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
              }}
            >
              -
            </button>
            <div style={{
              minWidth: `${28 * scale}px`,
              textAlign: 'center',
              fontWeight: 600,
              fontSize: controlFontSize,
              color: countText,
              transition: 'color 0.3s ease',
            }}>{imageCount}</div>
            <button
              onClick={(e) => { e.stopPropagation(); onImageCountChange(Math.min(4, imageCount + 1)); }}
              disabled={imageCount >= 4}
              title="Increase images"
              style={{
                width: `${32 * scale}px`,
                height: `${32 * scale}px`,
                borderRadius: `${9999 * scale}px`,
                border: isDark ? `1px solid rgba(255, 255, 255, 0.15)` : `1px solid rgba(0,0,0,0.08)`,
                backgroundColor: dropdownBg,
                cursor: imageCount >= 4 ? 'not-allowed' : 'pointer',
                fontSize: `${13 * scale}px`,
                fontWeight: 600,
                lineHeight: 1,
                color: dropdownText,
                transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* ChatGPT 1.5 Specific Controls - Simplified Redesign */}
        {(selectedModel.toLowerCase().includes('chatgpt 1.5') || selectedModel.toLowerCase().includes('chat-gpt-1.5')) && (
          <div style={{ width: '100%', marginTop: `${12 * scale}px`, display: 'flex', flexDirection: 'column', gap: `${12 * scale}px` }}>
            {/* Single horizontal divider line */}
            <div style={{
              height: '1px',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              marginInline: `${8 * scale}px`,
              width: `calc(100% - ${16 * scale}px)`
            }} />

            <div style={{
              display: 'flex',
              gap: `${16 * scale}px`,
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              padding: `0 ${16 * scale}px ${8 * scale}px ${16 * scale}px`,
              animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}>
              <style>{`
                @keyframes slideUp {
                  from { opacity: 0; transform: translateY(8px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .gpt-control-label {
                  font-size: ${8 * scale}px;
                  color: ${labelColor};
                  font-weight: 800;
                  letter-spacing: 0.1em;
                  margin-bottom: ${4 * scale}px;
                  opacity: 0.7;
                  text-transform: uppercase;
                  text-align: center;
                }
                .gpt-control-button {
                  background: ${isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'};
                  border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};
                  border-radius: 999px; /* Fully Rounded */
                  padding: ${6 * scale}px ${14 * scale}px;
                  color: ${dropdownText};
                  font-size: ${11 * scale}px;
                  font-weight: 600;
                  display: flex;
                  align-items: center;
                  gap: ${6 * scale}px;
                  cursor: pointer;
                  min-width: ${94 * scale}px;
                  justify-content: space-between;
                }
                .gpt-control-button:hover {
                  background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'};
                  border-color: ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)'};
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                }
                .gpt-dropdown-menu {
                  position: absolute;
                  bottom: calc(100% + ${8 * scale}px); 
                  left: 50%;
                  transform: translateX(-50%);
                  background: ${isDark ? 'rgba(25, 25, 25, 0.98)' : 'rgba(255, 255, 255, 0.98)'};
                  backdrop-filter: blur(20px);
                  border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
                  border-radius: ${16 * scale}px;
                  padding: ${6 * scale}px;
                  min-width: ${120 * scale}px;
                  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                  z-index: 3005;
                  animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .gpt-dropdown-item {
                  padding: ${8 * scale}px ${12 * scale}px;
                  border-radius: ${12 * scale}px;
                  font-size: ${11 * scale}px;
                  font-weight: 500;
                  color: ${dropdownText};
                  cursor: pointer;

                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  white-space: nowrap;
                }
              `}</style>

              {/* Quality Selector */}
              <div ref={qualityDropdownRef} style={{ position: 'relative' }}>
                <div className="gpt-control-label">Quality</div>
                <button
                  type="button"
                  className="gpt-control-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsQualityDropdownOpen(!isQualityDropdownOpen);
                    setIsBackgroundDropdownOpen(false);
                    setIsModerationDropdownOpen(false);
                  }}
                >
                  <span>{gptQuality === 'auto' ? 'Automatic' : gptQuality.charAt(0).toUpperCase() + gptQuality.slice(1)}</span>
                  <ChevronDown size={14 * scale} style={{ transform: isQualityDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '' }} />
                </button>

                {isQualityDropdownOpen && (
                  <div className="gpt-dropdown-menu">
                    {['auto', 'low', 'medium', 'high'].map((opt) => (
                      <div
                        key={opt}
                        className={`gpt-dropdown-item ${gptQuality === opt ? 'selected' : ''}`}
                        onClick={() => {
                          onGptQualityChange(opt as any);
                          setIsQualityDropdownOpen(false);
                        }}
                      >
                        {opt === 'auto' ? 'Automatic' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                        {gptQuality === opt && <div style={{ width: 6 * scale, height: 6 * scale, borderRadius: '50%', background: SELECTION_COLOR }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Background Selector */}
              <div ref={backgroundDropdownRef} style={{ position: 'relative' }}>
                <div className="gpt-control-label">Background</div>
                <button
                  type="button"
                  className="gpt-control-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsBackgroundDropdownOpen(!isBackgroundDropdownOpen);
                    setIsQualityDropdownOpen(false);
                    setIsModerationDropdownOpen(false);
                  }}
                >
                  <span>{gptBackground === 'auto' ? 'Automatic' : gptBackground.charAt(0).toUpperCase() + gptBackground.slice(1)}</span>
                  <ChevronDown size={14 * scale} style={{ transform: isBackgroundDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '' }} />
                </button>

                {isBackgroundDropdownOpen && (
                  <div className="gpt-dropdown-menu">
                    {['auto', 'transparent', 'opaque'].map((opt) => (
                      <div
                        key={opt}
                        className={`gpt-dropdown-item ${gptBackground === opt ? 'selected' : ''}`}
                        onClick={() => {
                          onGptBackgroundChange(opt as any);
                          setIsBackgroundDropdownOpen(false);
                        }}
                      >
                        {opt === 'auto' ? 'Automatic' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                        {gptBackground === opt && <div style={{ width: 6 * scale, height: 6 * scale, borderRadius: '50%', background: SELECTION_COLOR }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Moderation Selector */}
              <div ref={moderationDropdownRef} style={{ position: 'relative' }}>
                <div className="gpt-control-label">Moderation</div>
                <button
                  type="button"
                  className="gpt-control-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModerationDropdownOpen(!isModerationDropdownOpen);
                    setIsQualityDropdownOpen(false);
                    setIsBackgroundDropdownOpen(false);
                  }}
                >
                  <span>{gptModeration === 'auto' ? 'Automatic' : gptModeration.charAt(0).toUpperCase() + gptModeration.slice(1)}</span>
                  <ChevronDown size={14 * scale} style={{ transform: isModerationDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '' }} />
                </button>

                {isModerationDropdownOpen && (
                  <div className="gpt-dropdown-menu">
                    {['auto', 'low'].map((opt) => (
                      <div
                        key={opt}
                        className={`gpt-dropdown-item ${gptModeration === opt ? 'selected' : ''}`}
                        onClick={() => {
                          onGptModerationChange(opt as any);
                          setIsModerationDropdownOpen(false);
                        }}
                      >
                        {opt === 'auto' ? 'Automatic' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                        {gptModeration === opt && <div style={{ width: 6 * scale, height: 6 * scale, borderRadius: '50%', background: SELECTION_COLOR }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

