'use client';
import { useRef, useEffect, Fragment, useState } from 'react';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { GenerateArrowIcon } from '@/modules/ui-global/common/GenerateArrowIcon';
import { buildProxyResourceUrl } from '@/core/api/proxyUtils';
import {
  getModelDurations,
  getModelDefaultDuration,
  getModelAspectRatios,
  getModelDefaultAspectRatio,
  getModelResolutions,
  getModelDefaultResolution,
  isValidDurationForModel,
  isValidAspectRatioForModel,
  isValidResolutionForModel,
} from '@/core/api/videoModelConfig';

const toPreviewImageUrl = (url: string): string => {
  // Already proxied (local API) - keep as-is
  if (url.includes('/api/proxy/resource/')) return url;
  // Zata URLs often need proxying (CORS / cert issues)
  if (url.includes('zata.ai') || url.includes('zata')) return buildProxyResourceUrl(url);
  return url;
};

interface VideoModalControlsProps {
  scale: number;
  isHovered: boolean;
  isPinned: boolean;
  isUploadedVideo: boolean;
  isSelected?: boolean;
  prompt: string;
  isPromptDisabled?: boolean;
  selectedModel: string;
  selectedAspectRatio: string;
  selectedFrame: string;
  selectedDuration: number;
  selectedResolution: string;
  generatedVideoUrl?: string | null;
  availableModelOptions: string[];
  isGenerating: boolean;
  isModelDropdownOpen: boolean;
  isAspectRatioDropdownOpen: boolean;
  isDurationDropdownOpen: boolean;
  isResolutionDropdownOpen: boolean;
  isVeo31Model: boolean;
  hasSingleFrame: boolean;
  isFirstLastMode: boolean;
  displayFirstFrameUrl: string | null;
  displayLastFrameUrl: string | null;
  isFrameOrderSwapped: boolean;
  frameBorderColor: string;
  frameBorderWidth: number;
  onPromptChange: (value: string) => void;
  onModelChange: (model: string) => void;
  onAspectRatioChange: (ratio: string) => void;
  onDurationChange: (duration: number) => void;
  onResolutionChange: (resolution: string) => void;
  onGenerate: () => void;
  onSetIsHovered: (hovered: boolean) => void;
  onSetIsPinned: (pinned: boolean) => void;
  onSetIsModelDropdownOpen: (open: boolean) => void;
  onSetIsAspectRatioDropdownOpen: (open: boolean) => void;
  onSetIsDurationDropdownOpen: (open: boolean) => void;
  onSetIsResolutionDropdownOpen: (open: boolean) => void;
  onSetIsFrameOrderSwapped: (swapped: boolean) => void;
  onOptionsChange?: (opts: { model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number; resolution?: string; frameWidth?: number; frameHeight?: number }) => void;
}

export const VideoModalControls: React.FC<VideoModalControlsProps> = ({
  scale,
  isHovered,
  isPinned,
  isUploadedVideo,
  isSelected = false,
  prompt,
  isPromptDisabled = false,
  selectedModel,
  selectedAspectRatio,
  selectedFrame,
  selectedDuration,
  selectedResolution,
  generatedVideoUrl,
  availableModelOptions,
  isGenerating,
  isModelDropdownOpen,
  isAspectRatioDropdownOpen,
  isDurationDropdownOpen,
  isResolutionDropdownOpen,
  isVeo31Model,
  hasSingleFrame,
  isFirstLastMode,
  displayFirstFrameUrl,
  displayLastFrameUrl,
  isFrameOrderSwapped,
  frameBorderColor,
  frameBorderWidth,
  onPromptChange,
  onModelChange,
  onAspectRatioChange,
  onDurationChange,
  onResolutionChange,
  onGenerate,
  onSetIsHovered,
  onSetIsPinned,
  onSetIsModelDropdownOpen,
  onSetIsAspectRatioDropdownOpen,
  onSetIsDurationDropdownOpen,
  onSetIsResolutionDropdownOpen,
  onSetIsFrameOrderSwapped,
  onOptionsChange,
}) => {
  const isDark = useIsDarkTheme();

  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)';
  const controlsFrameBorderColor = isSelected ? SELECTION_COLOR : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
  const controlsBg = isDark ? '#121212' : '#ffffff';
  const inputBg = isDark ? (isPromptDisabled ? '#1a1a1a' : '#121212') : (isPromptDisabled ? '#f3f4f6' : '#ffffff');
  const inputText = isDark ? (isPromptDisabled ? '#666666' : '#ffffff') : (isPromptDisabled ? '#6b7280' : '#1f2937');
  const dropdownBg = isDark ? '#121212' : '#ffffff';
  const dropdownText = isDark ? '#ffffff' : '#1f2937';
  const dropdownHoverBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const selectedBg = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)';
  const iconColor = isDark ? '#cccccc' : '#4b5563';
  const labelText = isDark ? '#ffffff' : '#1f2937';
  const firstLastBg = isDark ? '#1a1a1a' : '#1f2937';
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null);
  const durationDropdownRef = useRef<HTMLDivElement>(null);
  const resolutionDropdownRef = useRef<HTMLDivElement>(null);
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
      if (durationDropdownRef.current && !durationDropdownRef.current.contains(event.target as Node)) {
        onSetIsDurationDropdownOpen(false);
      }
      if (resolutionDropdownRef.current && !resolutionDropdownRef.current.contains(event.target as Node)) {
        onSetIsResolutionDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen || isAspectRatioDropdownOpen || isDurationDropdownOpen || isResolutionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen, isAspectRatioDropdownOpen, isDurationDropdownOpen, isResolutionDropdownOpen, onSetIsModelDropdownOpen, onSetIsAspectRatioDropdownOpen, onSetIsDurationDropdownOpen, onSetIsResolutionDropdownOpen]);



  // Don't render controls at all for uploaded/library videos
  if (isUploadedVideo) {
    return null;
  }

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
        marginTop: `${-frameBorderWidth * scale}px`, // Pull up to overlap border
        transition: 'background-color 0.3s ease, border-color 0.3s ease, opacity 0.3s ease, transform 0.3s ease',
      }}
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
            onOptionsChange?.({ prompt: val, model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame, duration: selectedDuration, resolution: selectedResolution });
          }}
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
            border: `1px solid ${dropdownBorderColor}`,
            borderRadius: `${10 * scale}px`,
            fontSize: controlFontSize,
            color: inputText,
            outline: 'none',
            cursor: isPromptDisabled ? 'not-allowed' : 'text',
            opacity: isPromptDisabled ? 0.7 : 1,
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
            backgroundColor: (prompt.trim() && !isGenerating) ? SELECTION_COLOR : 'rgba(0, 0, 0, 0.1)',
            border: 'none',
            borderRadius: `${10 * scale}px`,
            cursor: (prompt.trim() && !isGenerating) ? 'pointer' : 'not-allowed',
            color: 'white',
            boxShadow: (prompt.trim() && !isGenerating) ? `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)` : 'none',
            padding: 0,
            opacity: isGenerating ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (prompt.trim() && !isGenerating) {
              e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(76, 131, 255, 0.5)`;
            }
          }}
          onMouseLeave={(e) => {
            if (prompt.trim() && !isGenerating) {
              e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(76, 131, 255, 0.4)`;
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
            <GenerateArrowIcon scale={scale} />
          )}
        </button>
      </div>


      {/* Settings Row - Only show for generated videos, not uploaded/library videos */}
      {!isUploadedVideo && (
        <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Model Selector - Custom Dropdown */}
          <div ref={modelDropdownRef} style={{ position: 'relative', flex: 1, minWidth: `${140 * scale}px`, overflow: 'visible', zIndex: 3002 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetIsModelDropdownOpen(!isModelDropdownOpen);
                onSetIsAspectRatioDropdownOpen(false);
                onSetIsDurationDropdownOpen(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title={(isFirstLastMode || hasSingleFrame) ? 'Only Veo 3.1 and Seedance models support connected frames' : undefined}
              style={{
                width: '100%',
                padding: `${10 * scale}px ${28 * scale}px ${10 * scale}px ${14 * scale}px`,
                backgroundColor: dropdownBg,
                border: `1px solid ${dropdownBorderColor}`,
                borderRadius: `${9999 * scale}px`,
                fontSize: controlFontSize,
                fontWeight: '500',
                color: dropdownText,
                transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
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
                <path d="M2 4L6 8L10 4" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {isModelDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  minWidth: `${150 * scale}px`,
                  width: 'max-content',
                  marginTop: `${4 * scale}px`,
                  backgroundColor: dropdownBg,
                  border: `1px solid ${dropdownBorderColor}`,
                  borderRadius: `${12 * scale}px`,
                  boxShadow: isDark ? `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.15)`,
                  transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  zIndex: 3003,
                  padding: `${4 * scale}px 0`,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: `${4 * scale}px`, padding: `${4 * scale}px` }}>
                  {availableModelOptions.map((model) => (
                    <div
                      key={model}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetIsModelDropdownOpen(false);

                        // Get valid options for the new model
                        const defaultDuration = getModelDefaultDuration(model);
                        const defaultAspectRatio = getModelDefaultAspectRatio(model);
                        const defaultResolution = getModelDefaultResolution(model);

                        // Update duration if current is not valid
                        const newDuration = isValidDurationForModel(model, selectedDuration)
                          ? selectedDuration
                          : defaultDuration;

                        // Update aspect ratio if current is not valid
                        const newAspectRatio = isValidAspectRatioForModel(model, selectedAspectRatio)
                          ? selectedAspectRatio
                          : defaultAspectRatio;

                        // Update resolution if current is not valid
                        const newResolution = isValidResolutionForModel(model, selectedResolution)
                          ? selectedResolution
                          : defaultResolution;

                        // Update state
                        if (newDuration !== selectedDuration) {
                          onDurationChange(newDuration);
                        }
                        if (newAspectRatio !== selectedAspectRatio) {
                          onAspectRatioChange(newAspectRatio);
                        }
                        if (newResolution !== selectedResolution) {
                          onResolutionChange(newResolution);
                        }

                        const [w, h] = newAspectRatio.split(':').map(Number);
                        const frameWidth = 600;
                        const ar = w && h ? (w / h) : 16 / 9;
                        const rawHeight = Math.round(frameWidth / ar);
                        const frameHeight = Math.max(400, rawHeight);
                        onModelChange(model);
                        onOptionsChange?.({ model, aspectRatio: newAspectRatio, frame: selectedFrame, prompt, duration: newDuration, resolution: newResolution, frameWidth, frameHeight });
                      }}
                      style={{
                        padding: `${6 * scale}px ${12 * scale}px`,
                        fontSize: controlFontSize,
                        color: dropdownText,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: selectedModel === model ? selectedBg : 'transparent',
                        transition: 'background-color 0.3s ease, color 0.3s ease',
                        borderRadius: `${6 * scale}px`,
                        whiteSpace: 'nowrap',
                        minWidth: 'max-content',
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
                onSetIsDurationDropdownOpen(false);
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
                  transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  maxHeight: `${200 * scale}px`,
                  overflowY: 'auto',
                  zIndex: 3003,
                  padding: `${4 * scale}px 0`,
                  minWidth: `${100 * scale}px`,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {getModelAspectRatios(selectedModel).map((ratio) => (
                  <div
                    key={ratio}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetIsAspectRatioDropdownOpen(false);
                      const [w, h] = ratio.split(':').map(Number);
                      const frameWidth = 600;
                      const ar = w && h ? (w / h) : 16 / 9;
                      const rawHeight = Math.round(frameWidth / ar);
                      const frameHeight = Math.max(400, rawHeight);
                      onAspectRatioChange(ratio);
                      onOptionsChange?.({ model: selectedModel, aspectRatio: ratio, frame: selectedFrame, prompt, duration: selectedDuration, resolution: selectedResolution, frameWidth, frameHeight });
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

          {/* Duration Selector - Custom Dropdown */}
          <div ref={durationDropdownRef} style={{ position: 'relative', overflow: 'visible', zIndex: 3001 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetIsDurationDropdownOpen(!isDurationDropdownOpen);
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
                minWidth: `${70 * scale}px`,
                outline: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
              }}
            >
              <span>{selectedDuration}s</span>
              <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isDurationDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M2 4L6 8L10 4" stroke={isDark ? '#34d399' : '#10b981'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {isDurationDropdownOpen && (
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
                  transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  maxHeight: `${200 * scale}px`,
                  overflowY: 'auto',
                  zIndex: 3003,
                  padding: `${4 * scale}px 0`,
                  minWidth: `${100 * scale}px`,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {getModelDurations(selectedModel).map((dur) => (
                  <div
                    key={dur}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetIsDurationDropdownOpen(false);
                      const [w, h] = selectedAspectRatio.split(':').map(Number);
                      const frameWidth = 600;
                      const ar = w && h ? (w / h) : 16 / 9;
                      const rawHeight = Math.round(frameWidth / ar);
                      const frameHeight = Math.max(400, rawHeight);
                      onDurationChange(dur);
                      onOptionsChange?.({ model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, duration: dur, resolution: selectedResolution, frameWidth, frameHeight });
                    }}
                    style={{
                      padding: `${8 * scale}px ${16 * scale}px`,
                      fontSize: controlFontSize,
                      color: dropdownText,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: selectedDuration === dur ? selectedBg : 'transparent',
                      borderLeft: selectedDuration === dur ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                      transition: 'background-color 0.3s ease, color 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedDuration !== dur) {
                        e.currentTarget.style.backgroundColor = dropdownHoverBg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedDuration !== dur) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {selectedDuration === dur && (
                      <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span>{dur}s</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Resolution Selector - Custom Dropdown */}
          <div ref={resolutionDropdownRef} style={{ position: 'relative', overflow: 'visible', zIndex: 3001 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetIsResolutionDropdownOpen(!isResolutionDropdownOpen);
                onSetIsModelDropdownOpen(false);
                onSetIsAspectRatioDropdownOpen(false);
                onSetIsDurationDropdownOpen(false);
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
                minWidth: `${80 * scale}px`,
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
                <path d="M2 4L6 8L10 4" stroke={isDark ? '#a78bfa' : '#8b5cf6'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                  transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
                  maxHeight: `${200 * scale}px`,
                  overflowY: 'auto',
                  zIndex: 3003,
                  padding: `${4 * scale}px 0`,
                  minWidth: `${100 * scale}px`,
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {getModelResolutions(selectedModel).map((res) => (
                  <div
                    key={res}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetIsResolutionDropdownOpen(false);
                      const [w, h] = selectedAspectRatio.split(':').map(Number);
                      const frameWidth = 600;
                      const ar = w && h ? (w / h) : 16 / 9;
                      const rawHeight = Math.round(frameWidth / ar);
                      const frameHeight = Math.max(400, rawHeight);
                      onResolutionChange(res);
                      onOptionsChange?.({ model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, duration: selectedDuration, resolution: res, frameWidth, frameHeight });
                    }}
                    style={{
                      padding: `${8 * scale}px ${16 * scale}px`,
                      fontSize: controlFontSize,
                      color: dropdownText,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: selectedResolution === res ? selectedBg : 'transparent',
                      borderLeft: selectedResolution === res ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                      transition: 'background-color 0.3s ease, color 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedResolution !== res) {
                        e.currentTarget.style.backgroundColor = dropdownHoverBg;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedResolution !== res) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {selectedResolution === res && (
                      <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span>{res}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(isVeo31Model || selectedModel.toLowerCase().includes('seedance')) && (hasSingleFrame || isFirstLastMode) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px` }}>
              {[
                { label: 'First Frame', url: displayFirstFrameUrl, placeholder: '1st' },
                { label: 'Last Frame', url: displayLastFrameUrl, placeholder: 'Last' },
              ].map((slot, idx) => (
                <Fragment key={`${slot.label}-${isFrameOrderSwapped}-${slot.url || 'empty'}`}>
                  {/* Slot */}
                  <div
                    title={slot.label}
                    style={{
                      position: 'relative',
                      width: `${42 * scale}px`,
                      height: `${42 * scale}px`,
                      borderRadius: `${10 * scale}px`,
                      overflow: 'hidden',
                      border: slot.url ? 'none' : `1px solid ${dropdownBorderColor}`,
                      backgroundColor: slot.url ? '#f8fafc' : dropdownBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {slot.url ? (
                      <img
                        src={toPreviewImageUrl(slot.url)}
                        alt={slot.label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: `${10 * scale}px`, color: iconColor }}>{slot.placeholder}</span>
                    )}
                  </div>

                  {/* Swap Button (only between slots) */}
                  {idx === 0 && isFirstLastMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetIsFrameOrderSwapped(!isFrameOrderSwapped);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        width: `${24 * scale}px`,
                        height: `${24 * scale}px`,
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: isFirstLastMode ? firstLastBg : 'transparent',
                        color: isDark ? '#fff' : '#4b5563',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        opacity: 0.8,
                      }}
                      title="Swap Frames"
                    >
                      <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 16V4M7 4L3 8M7 4L11 8" />
                        <path d="M17 8v12M17 20l4-4M17 20l-4-4" transform="rotate(90 12 12)" />
                      </svg>
                    </button>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

