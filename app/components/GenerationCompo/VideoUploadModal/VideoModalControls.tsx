'use client';
import { useRef, useEffect, Fragment } from 'react';
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
} from '@/lib/videoModelConfig';

interface VideoModalControlsProps {
  scale: number;
  isHovered: boolean;
  isPinned: boolean;
  isUploadedVideo: boolean;
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
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null);
  const durationDropdownRef = useRef<HTMLDivElement>(null);
  const resolutionDropdownRef = useRef<HTMLDivElement>(null);
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

  if (isUploadedVideo) return null;

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
        backgroundColor: '#ffffff',
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
        zIndex: 3,
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
          placeholder={isPromptDisabled ? "Connected to text input..." : "Enter prompt here..."}
          disabled={isPromptDisabled}
          style={{
            flex: 1,
            padding: `${10 * scale}px ${14 * scale}px`,
            backgroundColor: isPromptDisabled ? '#f3f4f6' : '#ffffff',
            border: `1px solid ${dropdownBorderColor}`,
            borderRadius: `${10 * scale}px`,
            fontSize: controlFontSize,
            color: isPromptDisabled ? '#6b7280' : '#1f2937',
            outline: 'none',
            cursor: isPromptDisabled ? 'not-allowed' : 'text',
            opacity: isPromptDisabled ? 0.7 : 1,
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
              onSetIsDurationDropdownOpen(false);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            title={isFirstLastMode ? 'Only Veo 3.1 models support connected frames' : undefined}
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
                      const ar = w && h ? (w / h) : 16/9;
                      const rawHeight = Math.round(frameWidth / ar);
                      const frameHeight = Math.max(400, rawHeight);
                      onModelChange(model);
                      onOptionsChange?.({ model, aspectRatio: newAspectRatio, frame: selectedFrame, prompt, duration: newDuration, resolution: newResolution, frameWidth, frameHeight });
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
              onSetIsDurationDropdownOpen(false);
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
              {getModelAspectRatios(selectedModel).map((ratio) => (
                <div
                  key={ratio}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetIsAspectRatioDropdownOpen(false);
                    const [w, h] = ratio.split(':').map(Number);
                    const frameWidth = 600;
                    const ar = w && h ? (w / h) : 16/9;
                    const rawHeight = Math.round(frameWidth / ar);
                    const frameHeight = Math.max(400, rawHeight);
                    onAspectRatioChange(ratio);
                    onOptionsChange?.({ model: selectedModel, aspectRatio: ratio, frame: selectedFrame, prompt, duration: selectedDuration, resolution: selectedResolution, frameWidth, frameHeight });
                  }}
                  style={{
                    padding: `${8 * scale}px ${16 * scale}px`,
                    fontSize: controlFontSize,
                    color: '#1f2937',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: selectedAspectRatio === ratio ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    borderLeft: selectedAspectRatio === ratio ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedAspectRatio !== ratio) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
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
            <span>{selectedDuration}s</span>
            <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isDurationDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M2 4L6 8L10 4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          {isDurationDropdownOpen && (
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
              {getModelDurations(selectedModel).map((dur) => (
                <div
                  key={dur}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetIsDurationDropdownOpen(false);
                    const [w, h] = selectedAspectRatio.split(':').map(Number);
                    const frameWidth = 600;
                    const ar = w && h ? (w / h) : 16/9;
                    const rawHeight = Math.round(frameWidth / ar);
                    const frameHeight = Math.max(400, rawHeight);
                    onDurationChange(dur);
                    onOptionsChange?.({ model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, duration: dur, resolution: selectedResolution, frameWidth, frameHeight });
                  }}
                  style={{
                    padding: `${8 * scale}px ${16 * scale}px`,
                    fontSize: controlFontSize,
                    color: '#1f2937',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: selectedDuration === dur ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    borderLeft: selectedDuration === dur ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDuration !== dur) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
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
              backgroundColor: '#ffffff',
              border: `1px solid ${dropdownBorderColor}`,
              borderRadius: `${9999 * scale}px`,
              fontSize: controlFontSize,
              fontWeight: '600',
              color: '#1f2937',
              minWidth: `${80 * scale}px`,
              outline: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{selectedResolution}</span>
            <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isResolutionDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              <path d="M2 4L6 8L10 4" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          {isResolutionDropdownOpen && (
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
              {getModelResolutions(selectedModel).map((res) => (
                <div
                  key={res}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetIsResolutionDropdownOpen(false);
                    const [w, h] = selectedAspectRatio.split(':').map(Number);
                    const frameWidth = 600;
                    const ar = w && h ? (w / h) : 16/9;
                    const rawHeight = Math.round(frameWidth / ar);
                    const frameHeight = Math.max(400, rawHeight);
                    onResolutionChange(res);
                    onOptionsChange?.({ model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, duration: selectedDuration, resolution: res, frameWidth, frameHeight });
                  }}
                  style={{
                    padding: `${8 * scale}px ${16 * scale}px`,
                    fontSize: controlFontSize,
                    color: '#1f2937',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: selectedResolution === res ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    borderLeft: selectedResolution === res ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedResolution !== res) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
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

        {isVeo31Model && (hasSingleFrame || isFirstLastMode) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${6 * scale}px`, marginTop: `${6 * scale}px` }}>
            <div style={{ fontSize: `${11 * scale}px`, fontWeight: 500, color: '#1f2937' }}>
              {isFirstLastMode
                ? 'First & Last Frame (auto-filled when two image nodes are connected)'
                : 'First Frame (auto-filled when an image node is connected)'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: `${10 * scale}px`, flexWrap: 'wrap' }}>
              {[
                { label: 'First Frame', url: displayFirstFrameUrl, placeholder: 'Connect an image node for the first frame.' },
                { label: 'Last Frame', url: displayLastFrameUrl, placeholder: 'Connect another image node for the last frame.' },
              ].map((slot, idx) => (
                <Fragment key={`${slot.label}-${isFrameOrderSwapped}-${slot.url || 'empty'}`}>
                  <div
                    style={{
                      flex: '0 1 auto',
                      width: `${110 * scale}px`,
                      borderRadius: `${10 * scale}px`,
                      padding: `${6 * scale}px`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: `${4 * scale}px`,
                      backgroundColor: slot.url ? 'rgba(67, 126, 181, 0.07)' : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: `${11 * scale}px`, fontWeight: 600, color: '#1f2937' }}>{slot.label}</span>
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: `${70 * scale}px`,
                        borderRadius: `${8 * scale}px`,
                        overflow: 'hidden',
                        border: slot.url ? 'none' : `1px solid ${dropdownBorderColor}`,
                        backgroundColor: slot.url ? '#f8fafc' : '#f9fafb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        fontSize: `${10.5 * scale}px`,
                        color: '#6b7280',
                      }}
                    >
                      {slot.url ? (
                        <img
                          key={`${slot.label}-img-${isFrameOrderSwapped}-${slot.url}`}
                          src={slot.url}
                          alt={slot.label}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <span style={{ padding: `${6 * scale}px` }}>{slot.placeholder}</span>
                      )}
                    </div>
                  </div>
                  {idx === 0 && isFirstLastMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onSetIsFrameOrderSwapped(!isFrameOrderSwapped);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        width: `${34 * scale}px`,
                        height: `${34 * scale}px`,
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: isFirstLastMode ? '#1f2937' : 'rgba(0,0,0,0.15)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isFirstLastMode ? 'pointer' : 'not-allowed',
                        boxShadow: isFirstLastMode ? `0 ${3 * scale}px ${9 * scale}px rgba(0,0,0,0.25)` : 'none',
                        transition: 'transform 0.15s ease',
                        alignSelf: 'center',
                      }}
                      title={isFirstLastMode ? 'Swap first and last frame images' : 'Connect two image nodes to enable swapping'}
                    >
                      <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 7H7l3-3" />
                        <path d="M7 17h10l-3 3" />
                      </svg>
                    </button>
                  )}
                </Fragment>
              ))}
            </div>
            <div style={{ fontSize: `${11 * scale}px`, color: '#4b5563' }}>
              {isFirstLastMode
                ? 'Two frames detected — Veo will run in first/last frame mode. Use the swap button to switch frame order.'
                : hasSingleFrame
                  ? 'Single frame detected — Veo will run in image-to-video mode.'
                  : 'No frames connected — Veo will run as pure text-to-video.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

