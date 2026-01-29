'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { Camera3DControl } from './Camera3DControl';
import { ChevronDown } from 'lucide-react';

interface MultiangleCameraControlsProps {
  scale: number;
  category: string; // 'view-morph' or 'multiview'
  sourceImageUrl: string | null;
  frameBorderColor: string;
  frameBorderWidth: number;
  onHoverChange: (hovered: boolean) => void;
  extraTopPadding?: number;
  onCategoryChange: (category: string) => void;
  /** When true, this component is rendered inside the full-screen popup sidebar */
  embeddedInPopup?: boolean;
  /** When true, hides the bottom "Generate" button (so parent can render a sticky footer) */
  hideGenerateButton?: boolean;
  // Parameters (MultiView - Multiangle)
  prompt: string;
  loraScale: number;
  aspectRatio: string;
  moveForward: number;
  verticalTilt: number;
  rotateDegrees: number;
  useWideAngle: boolean;
  multiangleCategory: string; // 'human' or 'product'
  multiangleModel: string;
  multiangleResolution: '1K' | '2K' | '4K';
  // Parameters (View Morph)
  horizontalAngle: number;
  verticalAngle: number;
  zoom: number;
  isGenerating: boolean;
  // Callbacks (MultiView - Multiangle)
  onPromptChange: (prompt: string) => void;
  onLoraScaleChange: (loraScale: number) => void;
  onAspectRatioChange: (aspectRatio: string) => void;
  onMoveForwardChange: (moveForward: number) => void;
  onVerticalTiltChange: (verticalTilt: number) => void;
  onRotateDegreesChange: (rotateDegrees: number) => void;
  onUseWideAngleChange: (useWideAngle: boolean) => void;
  onMultiangleCategoryChange: (category: string) => void;
  onMultiangleModelChange: (model: string) => void;
  onMultiangleResolutionChange: (resolution: '1K' | '2K' | '4K') => void;
  // Callbacks (View Morph)
  onHorizontalAngleChange: (horizontalAngle: number) => void;
  onVerticalAngleChange: (verticalAngle: number) => void;
  onZoomChange: (zoom: number) => void;
  onGenerate: () => void;
}

export const MultiangleCameraControls: React.FC<MultiangleCameraControlsProps> = ({
  scale,
  category,
  sourceImageUrl,
  frameBorderColor,
  frameBorderWidth,
  onHoverChange,
  extraTopPadding,
  onCategoryChange,
  prompt,
  loraScale,
  aspectRatio,
  moveForward,
  verticalTilt,
  rotateDegrees,
  useWideAngle,
  multiangleCategory,
  multiangleModel,
  multiangleResolution,
  horizontalAngle,
  verticalAngle,
  zoom,
  isGenerating,
  onPromptChange,
  onLoraScaleChange,
  onAspectRatioChange,
  onMoveForwardChange,
  onVerticalTiltChange,
  onRotateDegreesChange,
  onUseWideAngleChange,
  onMultiangleCategoryChange,
  onMultiangleModelChange,
  onMultiangleResolutionChange,
  onHorizontalAngleChange,
  onVerticalAngleChange,
  onZoomChange,
  onGenerate,
  embeddedInPopup = false,
  hideGenerateButton = false,
}) => {
  const isDark = useIsDarkTheme();
  // Base values for fixed-width UI elements (parent handles scaling)
  const basePadding = 16;
  const computedTopPadding = Math.max(basePadding, (extraTopPadding ? extraTopPadding / scale : basePadding));

  const [isAspectRatioDropdownOpen, setIsAspectRatioDropdownOpen] = useState(false);
  const [isVerticalTiltDropdownOpen, setIsVerticalTiltDropdownOpen] = useState(false);
  const [isMultiangleCategoryDropdownOpen, setIsMultiangleCategoryDropdownOpen] = useState(false);
  const [isMultiangleModelDropdownOpen, setIsMultiangleModelDropdownOpen] = useState(false);
  const [isMultiangleResolutionDropdownOpen, setIsMultiangleResolutionDropdownOpen] = useState(false);
  // Removed viewMorphTab state - no longer using slider controls
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null);
  const verticalTiltDropdownRef = useRef<HTMLDivElement>(null);
  const multiangleCategoryDropdownRef = useRef<HTMLDivElement>(null);
  const multiangleModelDropdownRef = useRef<HTMLDivElement>(null);
  const multiangleResolutionDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aspectRatioDropdownRef.current && !aspectRatioDropdownRef.current.contains(event.target as Node)) {
        setIsAspectRatioDropdownOpen(false);
      }
      if (verticalTiltDropdownRef.current && !verticalTiltDropdownRef.current.contains(event.target as Node)) {
        setIsVerticalTiltDropdownOpen(false);
      }
      if (multiangleCategoryDropdownRef.current && !multiangleCategoryDropdownRef.current.contains(event.target as Node)) {
        setIsMultiangleCategoryDropdownOpen(false);
      }
      if (multiangleModelDropdownRef.current && !multiangleModelDropdownRef.current.contains(event.target as Node)) {
        setIsMultiangleModelDropdownOpen(false);
      }
      if (multiangleResolutionDropdownRef.current && !multiangleResolutionDropdownRef.current.contains(event.target as Node)) {
        setIsMultiangleResolutionDropdownOpen(false);
      }
    };

    if (
      isAspectRatioDropdownOpen ||
      isVerticalTiltDropdownOpen ||
      isMultiangleCategoryDropdownOpen ||
      isMultiangleModelDropdownOpen ||
      isMultiangleResolutionDropdownOpen
    ) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [
    isAspectRatioDropdownOpen,
    isVerticalTiltDropdownOpen,
    isMultiangleCategoryDropdownOpen,
    isMultiangleModelDropdownOpen,
    isMultiangleResolutionDropdownOpen,
  ]);

  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const borderColor = isDark ? '#3a3a3a' : '#d1d5db';
  const inputBg = isDark ? '#2d2d2d' : '#ffffff';
  const buttonBg = SELECTION_COLOR;
  const buttonHoverBg = '#3d6edb';
  const buttonDisabledBg = isDark ? '#4a4a4a' : '#9ca3af';
  const inputCommonStyle: React.CSSProperties = {
    width: '100%',
    appearance: 'none',
    backgroundColor: inputBg,
    color: textColor,
    border: `1px solid ${borderColor}`,
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
    // Helps native dropdown match theme (supported in modern browsers)
    colorScheme: isDark ? ('dark' as any) : ('light' as any),
  };

  // Ensure category dropdown can stack above model dropdown
  const themedDropdownBaseZ = 3000;
  const themedDropdownCategoryZ = 3100;
  const dropdownBorderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.1)';
  const dropdownBg = isDark ? '#121212' : '#ffffff';
  const dropdownText = isDark ? '#ffffff' : '#1f2937';
  const dropdownHoverBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
  const selectedBg = isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)';
  const selectedText = isDark ? '#60a5fa' : '#3b82f6';

  const MultiangleCategoryOptions: Array<{ value: string; label: string }> = [
    { value: 'human', label: 'Human' },
    { value: 'product', label: 'Product' },
  ];

  const MultiangleModelOptions: Array<{ value: string; label: string }> = [
    { value: 'Google nano banana pro', label: 'Google nano banana pro' },
    { value: 'Google Nano Banana', label: 'Google Nano Banana' },
    { value: 'Seedream 4.5', label: 'Seedream 4.5' },
    // NOTE: P-Image removed per request
  ];

  const MultiangleResolutionOptions: Array<{ value: '1K' | '2K' | '4K'; label: string }> = [
    { value: '1K', label: '1K' },
    { value: '2K', label: '2K' },
    { value: '4K', label: '4K' },
  ];

  const aspectRatioOptions = [
    { value: 'match_input_image', label: 'Match Input' },
    { value: '1:1', label: '1:1' },
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
    { value: '4:3', label: '4:3' },
    { value: '3:4', label: '3:4' },
  ];

  const verticalTiltOptions = [
    { value: -1, label: 'Down (-1)' },
    { value: 0, label: 'Level (0)' },
    { value: 1, label: 'Up (1)' },
  ];

  return (
    <div
      className="controls-overlay"
      style={{
        position: 'relative',
        width: embeddedInPopup ? '100%' : '400px',
        maxWidth: embeddedInPopup ? '100%' : '90vw',
        backgroundColor: embeddedInPopup ? 'transparent' : (isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)'),
        backdropFilter: embeddedInPopup ? undefined : 'blur(20px)',
        WebkitBackdropFilter: embeddedInPopup ? undefined : 'blur(20px)',
        borderRadius: embeddedInPopup ? 0 : '16px 16px 0 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflow: 'visible',
        zIndex: 10,
        borderLeft: embeddedInPopup ? 'none' : `${frameBorderWidth}px solid ${frameBorderColor}`,
        borderRight: embeddedInPopup ? 'none' : `${frameBorderWidth}px solid ${frameBorderColor}`,
        borderTop: embeddedInPopup ? 'none' : `${frameBorderWidth}px solid ${frameBorderColor}`,
        padding: embeddedInPopup ? 0 : `${basePadding}px`,
        paddingTop: embeddedInPopup ? 0 : `${computedTopPadding}px`,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {/* View Morph Controls */}
        {category === 'view-morph' && (
          <>
            {/* View Morph content - controls are shown in sidebar */}
            
          </>
        )}

        {/* MultiView Controls (Multiangle) */}
        {category === 'multiview' && (
          <>
            {/* Category Selector (only for multiangle) */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: textColor, marginBottom: '4px' }}>Category</div>
              <div ref={multiangleCategoryDropdownRef} style={{ position: 'relative', zIndex: themedDropdownCategoryZ, overflow: 'visible' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsMultiangleCategoryDropdownOpen((v) => !v);
                    setIsMultiangleModelDropdownOpen(false);
                    setIsMultiangleResolutionDropdownOpen(false);
                    setIsAspectRatioDropdownOpen(false);
                    setIsVerticalTiltDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: dropdownBg,
                    border: `1px solid ${dropdownBorderColor}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: dropdownText,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease',
                  }}
                >
                  <span>
                    {(MultiangleCategoryOptions.find((o) => o.value === multiangleCategory)?.label) ?? multiangleCategory}
                  </span>
                  <ChevronDown size={16} color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'} />
                </button>
                {isMultiangleCategoryDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '6px',
                      backgroundColor: dropdownBg,
                      border: `1px solid ${dropdownBorderColor}`,
                      borderRadius: '10px',
                      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.55)' : '0 10px 30px rgba(0,0,0,0.18)',
                      zIndex: themedDropdownCategoryZ + 1,
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {MultiangleCategoryOptions.map((opt) => {
                      const selected = multiangleCategory === opt.value;
                      return (
                        <div
                          key={opt.value}
                          onClick={() => {
                            onMultiangleCategoryChange(opt.value);
                            setIsMultiangleCategoryDropdownOpen(false);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: selected ? selectedBg : 'transparent',
                            color: selected ? selectedText : dropdownText,
                            fontSize: '14px',
                            transition: 'background-color 0.15s ease, color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!selected) (e.currentTarget as HTMLDivElement).style.backgroundColor = dropdownHoverBg;
                          }}
                          onMouseLeave={(e) => {
                            if (!selected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          {opt.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Model Selector */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: textColor, marginBottom: '4px' }}>Model</div>
              <div ref={multiangleModelDropdownRef} style={{ position: 'relative', zIndex: themedDropdownBaseZ, overflow: 'visible' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsMultiangleModelDropdownOpen((v) => !v);
                    setIsMultiangleCategoryDropdownOpen(false);
                    setIsMultiangleResolutionDropdownOpen(false);
                    setIsAspectRatioDropdownOpen(false);
                    setIsVerticalTiltDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: dropdownBg,
                    border: `1px solid ${dropdownBorderColor}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: dropdownText,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(MultiangleModelOptions.find((o) => o.value === multiangleModel)?.label) ?? multiangleModel}
                  </span>
                  <ChevronDown size={16} color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'} />
                </button>
                {isMultiangleModelDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '6px',
                      backgroundColor: dropdownBg,
                      border: `1px solid ${dropdownBorderColor}`,
                      borderRadius: '10px',
                      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.55)' : '0 10px 30px rgba(0,0,0,0.18)',
                      zIndex: themedDropdownBaseZ + 1,
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {MultiangleModelOptions.map((opt) => {
                      const selected = multiangleModel === opt.value;
                      return (
                        <div
                          key={opt.value}
                          onClick={() => {
                            onMultiangleModelChange(opt.value);
                            setIsMultiangleModelDropdownOpen(false);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: selected ? selectedBg : 'transparent',
                            color: selected ? selectedText : dropdownText,
                            fontSize: '14px',
                            transition: 'background-color 0.15s ease, color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!selected) (e.currentTarget as HTMLDivElement).style.backgroundColor = dropdownHoverBg;
                          }}
                          onMouseLeave={(e) => {
                            if (!selected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          {opt.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: textColor, marginBottom: '4px' }}>Aspect Ratio</div>
              <div ref={aspectRatioDropdownRef} style={{ position: 'relative', zIndex: 3200, overflow: 'visible' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAspectRatioDropdownOpen((v) => !v);
                    setIsMultiangleCategoryDropdownOpen(false);
                    setIsMultiangleModelDropdownOpen(false);
                    setIsMultiangleResolutionDropdownOpen(false);
                    setIsVerticalTiltDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: dropdownBg,
                    border: `1px solid ${dropdownBorderColor}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: dropdownText,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease',
                  }}
                >
                  <span>
                    {(aspectRatioOptions.find((o) => o.value === aspectRatio)?.label) ?? aspectRatio}
                  </span>
                  <ChevronDown size={16} color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'} />
                </button>
                {isAspectRatioDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '6px',
                      backgroundColor: dropdownBg,
                      border: `1px solid ${dropdownBorderColor}`,
                      borderRadius: '10px',
                      boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.55)' : '0 10px 30px rgba(0,0,0,0.18)',
                      zIndex: 3201,
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {aspectRatioOptions.map((opt) => {
                      const selected = aspectRatio === opt.value;
                      return (
                        <div
                          key={opt.value}
                          onClick={() => {
                            onAspectRatioChange(opt.value);
                            setIsAspectRatioDropdownOpen(false);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: selected ? selectedBg : 'transparent',
                            color: selected ? selectedText : dropdownText,
                            fontSize: '14px',
                            transition: 'background-color 0.15s ease, color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!selected) (e.currentTarget as HTMLDivElement).style.backgroundColor = dropdownHoverBg;
                          }}
                          onMouseLeave={(e) => {
                            if (!selected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                          }}
                        >
                          {opt.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Resolution Selector - Only show for Google nano banana pro */}
            {multiangleModel === 'Google nano banana pro' && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: textColor, marginBottom: '4px' }}>Resolution</div>
                <div ref={multiangleResolutionDropdownRef} style={{ position: 'relative', zIndex: themedDropdownBaseZ, overflow: 'visible' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMultiangleResolutionDropdownOpen((v) => !v);
                      setIsMultiangleCategoryDropdownOpen(false);
                      setIsMultiangleModelDropdownOpen(false);
                      setIsAspectRatioDropdownOpen(false);
                      setIsVerticalTiltDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: dropdownBg,
                      border: `1px solid ${dropdownBorderColor}`,
                      borderRadius: '10px',
                      fontSize: '14px',
                      color: dropdownText,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      whiteSpace: 'nowrap',
                      transition: 'background-color 0.2s ease, border-color 0.2s ease',
                    }}
                  >
                    <span>{multiangleResolution}</span>
                    <ChevronDown size={16} color={isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'} />
                  </button>

                  {isMultiangleResolutionDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '6px',
                        backgroundColor: dropdownBg,
                        border: `1px solid ${dropdownBorderColor}`,
                        borderRadius: '10px',
                        boxShadow: isDark ? '0 10px 30px rgba(0,0,0,0.55)' : '0 10px 30px rgba(0,0,0,0.18)',
                        zIndex: themedDropdownBaseZ + 1,
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      {MultiangleResolutionOptions.map((opt) => {
                        const selected = multiangleResolution === opt.value;
                        return (
                          <div
                            key={opt.value}
                            onClick={() => {
                              onMultiangleResolutionChange(opt.value);
                              setIsMultiangleResolutionDropdownOpen(false);
                            }}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              backgroundColor: selected ? selectedBg : 'transparent',
                              color: selected ? selectedText : dropdownText,
                              fontSize: '14px',
                              transition: 'background-color 0.15s ease, color 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!selected) (e.currentTarget as HTMLDivElement).style.backgroundColor = dropdownHoverBg;
                            }}
                            onMouseLeave={(e) => {
                              if (!selected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                            }}
                          >
                            {opt.label}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{
              fontSize: '11px',
              color: isDark ? '#888' : '#666',
              marginTop: '8px',
              padding: '8px',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
              borderRadius: '6px'
            }}>
              Multi-angle mode will generate 9 different camera angles from the input image.
            </div>
          </>
        )}

        {/* Generate Button - Only for MultiView */}
        {category === 'multiview' && !hideGenerateButton && (
        <button
          type="button"
          onClick={onGenerate}
          disabled={!sourceImageUrl || isGenerating}
          style={{
            width: '100%',
            padding: `10px 16px`,
            fontSize: `13px`,
            fontWeight: 600,
            backgroundColor: (!sourceImageUrl || isGenerating) ? buttonDisabledBg : buttonBg,
            color: '#ffffff',
            border: 'none',
            borderRadius: `8px`,
            cursor: (!sourceImageUrl || isGenerating) ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease',
            opacity: (!sourceImageUrl || isGenerating) ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!(!sourceImageUrl || isGenerating)) {
              e.currentTarget.style.backgroundColor = buttonHoverBg;
            }
          }}
          onMouseLeave={(e) => {
            if (!(!sourceImageUrl || isGenerating)) {
              e.currentTarget.style.backgroundColor = buttonBg;
            }
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Multiangle'}
        </button>
        )}
      </div>
    </div>
  );
};
