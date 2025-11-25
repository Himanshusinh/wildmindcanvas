'use client';

import { useState, useEffect } from 'react';

interface ScriptFrameProps {
  scale: number;
  text?: string;
  isDark?: boolean;
}

export const ScriptFrame: React.FC<ScriptFrameProps> = ({
  scale,
  text,
  isDark: externalIsDark,
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

  // Use external isDark if provided, otherwise use internal state
  const themeIsDark = externalIsDark !== undefined ? externalIsDark : isDark;

  // Theme colors
  const bgColor = themeIsDark ? '#121212' : '#ffffff';
  const textColor = themeIsDark ? '#ffffff' : '#1f2937';
  const borderColor = themeIsDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const placeholderColor = themeIsDark ? '#6b7280' : '#9ca3af';
  const secondaryTextColor = themeIsDark ? '#cccccc' : '#6b7280';

  return (
    <div
      style={{
        width: '100%',
        minHeight: `${200 * scale}px`,
        maxHeight: `${400 * scale}px`,
        backgroundColor: bgColor,
        border: `${1 * scale}px solid ${borderColor}`,
        borderRadius: `${8 * scale}px`,
        padding: `${16 * scale}px`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: `${12 * scale}px`,
          paddingBottom: `${8 * scale}px`,
          borderBottom: `${1 * scale}px solid ${borderColor}`,
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: `${14 * scale}px`,
            fontWeight: 600,
            color: textColor,
            letterSpacing: '0.2px',
          }}
        >
          Script
        </h4>
      </div>

      {/* Content Area */}
      <div
        className="script-frame-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: `${8 * scale}px 0`,
          // Custom scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: themeIsDark 
            ? 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05)',
        }}
      >
        {text ? (
          <div
            style={{
              fontSize: `${13 * scale}px`,
              lineHeight: `${20 * scale}px`,
              color: textColor,
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {text}
          </div>
        ) : (
          <div
            style={{
              fontSize: `${13 * scale}px`,
              lineHeight: `${20 * scale}px`,
              color: placeholderColor,
              fontStyle: 'italic',
              textAlign: 'center',
              padding: `${40 * scale}px 0`,
            }}
          >
            No script content available.
            <br />
            <span
              style={{
                fontSize: `${11 * scale}px`,
                color: secondaryTextColor,
                marginTop: `${8 * scale}px`,
                display: 'block',
              }}
            >
              Connect a text input to see the script here.
            </span>
          </div>
        )}
      </div>

    </div>
  );
};

