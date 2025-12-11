'use client';
import { useRef, useEffect, useState } from 'react';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

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
  onSetIsModelDropdownOpen: (open: boolean) => void;
  onSetIsAspectRatioDropdownOpen: (open: boolean) => void;
  onSetIsResolutionDropdownOpen: (open: boolean) => void;
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
  onSetIsModelDropdownOpen,
  onSetIsAspectRatioDropdownOpen,
  onSetIsResolutionDropdownOpen,
}) => {
  const isDark = useIsDarkTheme();

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null);
  const resolutionDropdownRef = useRef<HTMLDivElement>(null);
  const frameBorderColor = isSelected ? '#437eb5' : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
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
    };

    if (isModelDropdownOpen || isAspectRatioDropdownOpen || isResolutionDropdownOpen) {
      // Use 'click' instead of 'mousedown' so it fires after dropdown item clicks
      // This ensures the item's onMouseDown handler can stop propagation first
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isModelDropdownOpen, isAspectRatioDropdownOpen, isResolutionDropdownOpen, onSetIsModelDropdownOpen, onSetIsAspectRatioDropdownOpen, onSetIsResolutionDropdownOpen]);



  return (
    <>


      {/* Controls - Behind Frame, Slides Out on Hover */}
      < div
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
          zIndex: 1,
          // Add left, right and bottom borders to match the frame border color/weight
          borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderBottom: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          transition: 'background-color 0.3s ease, border-color 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        {/* Prompt Input */}
        < div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center' }}>
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
            placeholder={isPromptDisabled ? "Connected to text input..." : "Enter prompt here..."}
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
              transition: 'background-color 0.3s ease, color 0.3s ease',
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
            disabled={!prompt.trim() || isGenerating || isLocked}
            title={isLocked ? lockReason : undefined}
            style={{
              width: `${40 * scale}px`,
              height: `${40 * scale}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: (prompt.trim() && !isGenerating && !isLocked) ? '#437eb5' : 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              borderRadius: `${10 * scale}px`,
              cursor: (prompt.trim() && !isGenerating && !isLocked) ? 'pointer' : 'not-allowed',
              color: 'white',
              boxShadow: (prompt.trim() && !isGenerating && !isLocked) ? `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)` : 'none',
              padding: 0,
              opacity: (isGenerating || isLocked) ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (prompt.trim() && !isLocked) {
                e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(67, 126, 181, 0.5)`;
              }
            }}
            onMouseLeave={(e) => {
              if (prompt.trim() && !isLocked) {
                e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)`;
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
              <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 12h9" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </div >

        {/* Settings Row */}
        < div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Model Selector - Custom Dropdown */}
          < div ref={modelDropdownRef} style={{ position: 'relative', flex: '0 0 auto', width: `${220 * scale}px`, minWidth: `${120 * scale}px`, overflow: 'visible', zIndex: 3002 }}>
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
                          e.preventDefault();
                          onModelChange(model);
                          onSetIsModelDropdownOpen(false);
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
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
          < div ref={aspectRatioDropdownRef} style={{ position: 'relative', overflow: 'visible', zIndex: 3001 }}>
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

            {
              isAspectRatioDropdownOpen && (
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
              )
            }
          </div >

          {/* Resolution Selector - Only show for models that support it */}
          {
            availableResolutions.length > 0 && (
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
                  <span>{selectedResolution}</span>
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
                          onResolutionChange(resolution.value);
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
            )
          }

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
              fontSize: `${13 * scale}px`,
              color: countText,
              transition: 'color 0.3s ease'
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
        </div >
      </div >
    </>
  );
};

