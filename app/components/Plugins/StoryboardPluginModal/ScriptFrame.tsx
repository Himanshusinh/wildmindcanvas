'use client';

import { useState, useEffect } from 'react';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

import { FrameSpinner } from '@/app/components/common/FrameSpinner';

interface ScriptFrameProps {
  scale: number;
  text?: string;
  isDark?: boolean;
  isLoading?: boolean;
  onTextChange?: (newText: string) => void;
  isEditing?: boolean;
  onEditToggle?: (isEditing: boolean) => void;
}

export const ScriptFrame: React.FC<ScriptFrameProps> = ({
  scale,
  text,
  isDark: externalIsDark,
  isLoading = false,
  onTextChange,
  isEditing: externalIsEditing,
  onEditToggle,
}) => {
  const internalIsDark = useIsDarkTheme();
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const [editText, setEditText] = useState(text || '');
  const [cachedScript, setCachedScript] = useState(text || '');

  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;
  const setIsEditing = (value: boolean) => {
    if (onEditToggle) {
      onEditToggle(value);
    } else {
      setInternalIsEditing(value);
    }
  };

  // Sync edit state + cache the last non-empty script we received
  useEffect(() => {
    if (!isEditing && text !== undefined) {
      setEditText(text);
    }

    if (typeof text === 'string' && text.trim().length > 0) {
      setCachedScript(text);
    }
  }, [text, isEditing]);

  // Use external isDark if provided, otherwise use internal state
  const themeIsDark = externalIsDark !== undefined ? externalIsDark : internalIsDark;

  // Theme colors
  const textColor = themeIsDark ? '#ffffff' : '#1f2937';
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

  const resolvedScript = (() => {
    if (isEditing) return editText;
    if (typeof text === 'string' && text.trim().length > 0) return text;
    if (cachedScript.trim().length > 0) return cachedScript;
    return text ?? '';
  })();

  const hasScriptContent = Boolean(resolvedScript && resolvedScript.trim().length > 0);
  const awaitingScript = (!hasScriptContent && !isEditing) || Boolean(isLoading);
  const shouldShowGeneratingState = awaitingScript && !isEditing;
  const spinnerLabel = 'Generating script…';
  const overlayMessage = isLoading ? 'Generating your script…' : 'Generating script…';

  return (
    <div
      style={{
        width: '100%',
        minHeight: `${200 * scale}px`,
        maxHeight: `${400 * scale}px`,
        backgroundColor: 'transparent',
        border: 'none',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
        position: 'relative',
      }}
    >
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
          position: 'relative',
          minHeight: `${150 * scale}px`, // Maintain minimum height
        }}
      >
        {shouldShowGeneratingState ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              minHeight: `${150 * scale}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${14 * scale}px`,
              color: secondaryTextColor,
              fontWeight: 600,
            }}
          >
            {overlayMessage}
          </div>
        ) : (
          isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${10 * scale}px` }}>
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
              <div style={{ display: 'flex', gap: `${8 * scale}px` }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  style={{
                    padding: `${6 * scale}px ${12 * scale}px`,
                    borderRadius: `${6 * scale}px`,
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    fontSize: `${12 * scale}px`,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                  style={{
                    padding: `${6 * scale}px ${12 * scale}px`,
                    borderRadius: `${6 * scale}px`,
                    border: 'none',
                    backgroundColor: themeIsDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)',
                    color: textColor,
                    fontSize: `${12 * scale}px`,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
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
              {resolvedScript || ''}
            </div>
          )
        )}
      </div>

      {shouldShowGeneratingState && (
        <FrameSpinner scale={Math.max(scale * 0.85, 0.75)} label={spinnerLabel} />
      )}

    </div>
  );
};

