'use client';
import { useRef, useEffect, useState } from 'react';

interface TextModalControlsProps {
  scale: number;
  isHovered: boolean;
  isPinned: boolean;
  selectedModel: string;
  isModelDropdownOpen: boolean;
  isModelHovered: boolean;
  frameBorderColor: string;
  frameBorderWidth: number;
  onModelChange: (model: string) => void;
  onSetIsHovered: (hovered: boolean) => void;
  onSetIsPinned: (pinned: boolean) => void;
  onSetIsModelDropdownOpen: (open: boolean) => void;
  onSetIsModelHovered: (hovered: boolean) => void;
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
  onModelChange,
  onSetIsHovered,
  onSetIsPinned,
  onSetIsModelDropdownOpen,
  onSetIsModelHovered,
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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
        left: `${-2 * scale}px`,
        width: `calc(100% + ${2 * scale}px)`,
        padding: `${12 * scale}px`,
        backgroundColor: controlsBg,
        border: 'none',
        borderTop: 'none',
        borderRadius: `0 0 ${12 * scale}px ${12 * scale}px`,
        boxShadow: 'none',
        transform: (isHovered || isPinned) ? 'translateY(0)' : `translateY(-100%)`,
        opacity: isHovered ? 1 : 0,
        maxHeight: (isHovered || isPinned) ? '200px' : '0px',
        display: 'flex',
        flexDirection: 'column',
        gap: `${12 * scale}px`,
        pointerEvents: (isHovered || isPinned) ? 'auto' : 'none',
        overflow: 'visible',
        zIndex: 1,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderBottom: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
      onMouseEnter={() => onSetIsHovered(true)}
      onMouseLeave={() => onSetIsHovered(false)}
    >
      {/* Model Selector - Custom Dropdown */}
      <div ref={modelDropdownRef} style={{ position: 'relative', width: '100%', overflow: 'visible', zIndex: 3002 }} onMouseEnter={() => onSetIsModelHovered(true)} onMouseLeave={() => onSetIsModelHovered(false)}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetIsModelDropdownOpen(!isModelDropdownOpen);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            padding: `${10 * scale}px ${28 * scale}px ${10 * scale}px ${14 * scale}px`,
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
            {['GPT-4', 'GPT-3.5', 'Claude 3', 'Gemini Pro', 'Llama 2'].map((model) => (
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
    </div>
  );
};

