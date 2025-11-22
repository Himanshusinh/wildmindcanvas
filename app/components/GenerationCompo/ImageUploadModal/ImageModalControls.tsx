'use client';
import { useRef, useEffect } from 'react';

interface ImageModalControlsProps {
  scale: number;
  isHovered: boolean;
  isPinned: boolean;
  isUploadedImage: boolean;
  prompt: string;
  selectedModel: string;
  selectedAspectRatio: string;
  selectedFrame: string;
  imageCount: number;
  generatedImageUrl?: string | null;
  availableModels: string[];
  isGenerating: boolean;
  isModelDropdownOpen: boolean;
  isAspectRatioDropdownOpen: boolean;
  onPromptChange: (value: string) => void;
  onModelChange: (model: string) => void;
  onAspectRatioChange: (ratio: string) => void;
  onImageCountChange: (count: number) => void;
  onGenerate: () => void;
  getAvailableAspectRatios: () => Array<{ value: string; label: string }>;
  onSetIsHovered: (hovered: boolean) => void;
  onSetIsPinned: (pinned: boolean) => void;
  onSetIsModelDropdownOpen: (open: boolean) => void;
  onSetIsAspectRatioDropdownOpen: (open: boolean) => void;
}

export const ImageModalControls: React.FC<ImageModalControlsProps> = ({
  scale,
  isHovered,
  isPinned,
  isUploadedImage,
  prompt,
  selectedModel,
  selectedAspectRatio,
  selectedFrame,
  imageCount,
  generatedImageUrl,
  availableModels,
  isGenerating,
  isModelDropdownOpen,
  isAspectRatioDropdownOpen,
  onPromptChange,
  onModelChange,
  onAspectRatioChange,
  onImageCountChange,
  onGenerate,
  getAvailableAspectRatios,
  onSetIsHovered,
  onSetIsPinned,
  onSetIsModelDropdownOpen,
  onSetIsAspectRatioDropdownOpen,
}) => {
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null);
  const frameBorderColor = 'rgba(0, 0, 0, 0.3)';
  const frameBorderWidth = 2;
  const dropdownBorderColor = 'rgba(0,0,0,0.1)';
  const controlFontSize = `${13 * scale}px`;

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

  if (isUploadedImage) return null;

  return (
    <>
      {/* Pin Icon Button - Bottom Right (only for generated images, not uploaded) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSetIsPinned(!isPinned);
        }}
        style={{
          position: 'absolute',
          bottom: `${8 * scale}px`,
          right: `${8 * scale}px`,
          width: `${28 * scale}px`,
          height: `${28 * scale}px`,
          borderRadius: `${6 * scale}px`,
          backgroundColor: isPinned ? 'rgba(67, 126, 181, 0.2)' : 'rgba(255, 255, 255, 0.9)',
          border: `1px solid ${isPinned ? '#437eb5' : 'rgba(0, 0, 0, 0.1)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 20,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.18s ease, background-color 0.2s ease, border-color 0.2s ease',
          pointerEvents: 'auto',
          boxShadow: isPinned ? `0 ${2 * scale}px ${8 * scale}px rgba(67, 126, 181, 0.3)` : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isPinned) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isPinned) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          }
        }}
        title={isPinned ? 'Unpin controls' : 'Pin controls'}
      >
        <svg
          width={16 * scale}
          height={16 * scale}
          viewBox="0 0 24 24"
          fill={isPinned ? '#437eb5' : 'none'}
          stroke={isPinned ? '#437eb5' : '#4b5563'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 17v5M9 10V7a3 3 0 0 1 6 0v3M5 10h14l-1 7H6l-1-7z" />
        </svg>
      </button>

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
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
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
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onGenerate();
              }
            }}
            placeholder="Enter prompt here..."
            style={{
              flex: 1,
              padding: `${10 * scale}px ${14 * scale}px`,
              backgroundColor: '#ffffff',
              border: 'none',
              borderRadius: `${10 * scale}px`,
              fontSize: controlFontSize,
              color: '#1f2937',
              outline: 'none',
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
              if (prompt.trim()) {
                e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(67, 126, 181, 0.5)`;
              }
            }}
            onMouseLeave={(e) => {
              if (prompt.trim()) {
                e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)`;
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {isGenerating ? (
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
                backgroundColor: '#ffffff',
                border: `1px solid ${dropdownBorderColor}`,
                borderRadius: `${9999 * scale}px`,
                fontSize: controlFontSize,
                fontWeight: '500',
                color: '#1f2937',
                outline: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{selectedModel}</span>
              <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isModelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M2 4L6 8L10 4" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            
            {isModelDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  minWidth: `${400 * scale}px`,
                  width: 'max-content',
                  marginTop: `${4 * scale}px`,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${dropdownBorderColor}`,
                  borderRadius: `${12 * scale}px`,
                  boxShadow: `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.15)`,
                  zIndex: 3003,
                  padding: `${4 * scale}px 0`,
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
                        color: '#1f2937',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: selectedModel === model ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        borderRadius: `${6 * scale}px`,
                        whiteSpace: 'nowrap',
                        minWidth: 'max-content',
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
                backgroundColor: '#ffffff',
                border: `1px solid ${dropdownBorderColor}`,
                borderRadius: `${9999 * scale}px`,
                fontSize: controlFontSize,
                fontWeight: '600',
                color: '#1f2937',
                minWidth: `${70 * scale}px`,
                outline: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{selectedAspectRatio}</span>
              <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isAspectRatioDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M2 4L6 8L10 4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            
            {isAspectRatioDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: `${4 * scale}px`,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${dropdownBorderColor}`,
                  borderRadius: `${12 * scale}px`,
                  boxShadow: `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.15)`,
                  maxHeight: `${200 * scale}px`,
                  overflowY: 'auto',
                  zIndex: 3003,
                  padding: `${4 * scale}px 0`,
                  minWidth: `${100 * scale}px`,
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
                      color: '#1f2937',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: selectedAspectRatio === ratio.value ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderLeft: selectedAspectRatio === ratio.value ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedAspectRatio !== ratio.value) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
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
                border: `1px solid rgba(0,0,0,0.08)`,
                backgroundColor: '#ffffff',
                cursor: imageCount <= 1 ? 'not-allowed' : 'pointer',
                fontSize: `${13 * scale}px`,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              -
            </button>
            <div style={{ minWidth: `${28 * scale}px`, textAlign: 'center', fontWeight: 600, fontSize: `${13 * scale}px`, color: '#1f2937' }}>{imageCount}</div>
            <button
              onClick={(e) => { e.stopPropagation(); onImageCountChange(Math.min(4, imageCount + 1)); }}
              disabled={imageCount >= 4}
              title="Increase images"
              style={{
                width: `${32 * scale}px`,
                height: `${32 * scale}px`,
                borderRadius: `${9999 * scale}px`,
                border: `1px solid rgba(0,0,0,0.08)`,
                backgroundColor: '#ffffff',
                cursor: imageCount >= 4 ? 'not-allowed' : 'pointer',
                fontSize: `${13 * scale}px`,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

