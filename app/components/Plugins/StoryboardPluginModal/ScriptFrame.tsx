'use client';

import { useState, useEffect } from 'react';

interface ScriptFrameProps {
  scale: number;
  text?: string;
  isDark?: boolean;
  onTextChange?: (newText: string) => void;
}

export const ScriptFrame: React.FC<ScriptFrameProps> = ({
  scale,
  text,
  isDark: externalIsDark,
  onTextChange,
}) => {
  const [isDark, setIsDark] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text || '');

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Sync editText with incoming text prop
  useEffect(() => {
    if (!isEditing && text !== undefined) {
      setEditText(text);
    }
  }, [text, isEditing]);

  // Use external isDark if provided, otherwise use internal state
  const themeIsDark = externalIsDark !== undefined ? externalIsDark : isDark;

  // Theme colors
  const bgColor = themeIsDark ? '#121212' : '#ffffff';
  const textColor = themeIsDark ? '#ffffff' : '#1f2937';
  const borderColor = themeIsDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const placeholderColor = themeIsDark ? '#6b7280' : '#9ca3af';
  const secondaryTextColor = themeIsDark ? '#cccccc' : '#6b7280';
  const buttonBgColor = themeIsDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)';
  const buttonHoverBgColor = themeIsDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)';

  const handleSave = () => {
    if (onTextChange) {
      onTextChange(editText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(text || '');
    setIsEditing(false);
  };

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
      {/* Header with Edit button */}
      <div
        style={{
          marginBottom: `${12 * scale}px`,
          paddingBottom: `${8 * scale}px`,
          borderBottom: `${1 * scale}px solid ${borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: `${4 * scale}px ${8 * scale}px`,
              fontSize: `${11 * scale}px`,
              fontWeight: 500,
              color: '#3b82f6',
              backgroundColor: buttonBgColor,
              border: 'none',
              borderRadius: `${4 * scale}px`,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = buttonHoverBgColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = buttonBgColor}
          >
            ✏️ Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: `${8 * scale}px` }}>
            <button
              onClick={handleSave}
              style={{
                padding: `${4 * scale}px ${8 * scale}px`,
                fontSize: `${11 * scale}px`,
                fontWeight: 500,
                color: '#ffffff',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: `${4 * scale}px`,
                cursor: 'pointer',
              }}
            >
              ✓ Save
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: `${4 * scale}px ${8 * scale}px`,
                fontSize: `${11 * scale}px`,
                fontWeight: 500,
                color: textColor,
                backgroundColor: themeIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                border: 'none',
                borderRadius: `${4 * scale}px`,
                cursor: 'pointer',
              }}
            >
              ✕ Cancel
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div
        className="script-frame-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: `${8 * scale}px 0`,
          scrollbarWidth: 'thin',
          scrollbarColor: themeIsDark
            ? 'rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05)',
        }}
      >
        {isEditing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Type your script here with @mentions (e.g., @Aryan, @restaurant)..."
            style={{
              width: '100%',
              minHeight: `${150 * scale}px`,
              fontSize: `${13 * scale}px`,
              lineHeight: `${20 * scale}px`,
              color: textColor,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
            autoFocus
          />
        ) : text ? (
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
              Click "Edit" to manually type a script with @mentions, or connect a text input.
            </span>
          </div>
        )}
      </div>

    </div>
  );
};

