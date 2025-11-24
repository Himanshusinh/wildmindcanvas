'use client';

import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  onSwitchProject?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isHidden?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  projectName: initialProjectName = 'Untitled',
  onProjectNameChange,
  onSwitchProject,
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = false,
  isHidden = false,
}) => {
  // Use prop directly to avoid hydration mismatches - only use state when editing
  const [editingValue, setEditingValue] = useState(initialProjectName);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync editing value with prop changes
  useEffect(() => { 
    if (initialProjectName !== undefined && !isEditing) {
      setEditingValue(initialProjectName);
    }
  }, [initialProjectName, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameClick = () => {
    setIsEditing(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
    if (onProjectNameChange) {
      onProjectNameChange(editingValue);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setEditingValue(initialProjectName);
      setIsEditing(false);
    }
  };

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

  const bgColor = isDark ? 'var(--bg-secondary)' : '#ffffff';
  const textColor = isDark ? 'var(--text-primary)' : '#1f2937';
  const borderColor = isDark ? 'var(--border-color)' : 'rgba(0, 0, 0, 0.1)';
  const hoverBg = isDark ? 'var(--bg-tertiary)' : '#f9fafb';
  const inputBg = isDark ? 'var(--bg-tertiary)' : '#f9fafb';
  const iconColor = isDark ? 'var(--text-secondary)' : '#4b5563';

  return (
    <div
      style={{
        position: 'fixed',
        top: '16px',
        left: '16px',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        opacity: isHidden ? 0 : 1,
        transform: isHidden ? 'translateY(-100%)' : 'translateY(0)',
        pointerEvents: isHidden ? 'none' : 'auto',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {/* Undo Button - Hidden but functionality preserved via keyboard shortcuts (Ctrl/Cmd+Z) */}
      <div
        style={{
          display: 'none',
        }}
        onClick={() => { if (canUndo && onUndo) onUndo(); }}
        title="Undo (Ctrl/Cmd+Z)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 14l-4-4 4-4" />
          <path d="M20 20a9 9 0 0 0-9-9H5" />
        </svg>
      </div>

      {/* Redo Button - Hidden but functionality preserved via keyboard shortcuts (Ctrl+Y / Shift+Ctrl/Cmd+Z) */}
      <div
        style={{
          display: 'none',
        }}
        onClick={() => { if (canRedo && onRedo) onRedo(); }}
        title="Redo (Ctrl+Y / Shift+Ctrl/Cmd+Z)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 10l4 4-4 4" />
          <path d="M4 4a9 9 0 0 1 9 9h5" />
        </svg>
      </div>

      {/* Project Name */}
      <div
        style={{
          padding: '6px 10px',
          backgroundColor: bgColor,
          borderRadius: '8px',
          border: `1px solid ${borderColor}`,
          boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)' : '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
          transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editingValue}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            style={{
              background: 'transparent',
              border: `1px solid ${isDark ? 'var(--accent-color)' : 'rgba(59, 130, 246, 0.5)'}`,
              borderRadius: '4px',
              padding: '2px 6px',
              color: textColor,
              fontSize: '14px',
              fontWeight: '500',
              outline: 'none',
              minWidth: '120px',
              backgroundColor: inputBg,
              transition: 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease',
            }}
          />
        ) : (
          <div
            onClick={handleNameClick}
            style={{
              padding: '2px 6px',
              color: textColor,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'text',
              borderRadius: '4px',
              transition: 'background-color 0.3s ease, color 0.3s ease',
              minWidth: '120px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = hoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {initialProjectName || 'Untitled'}
          </div>
        )}
      </div>

      {/* Switch Project Button */}
      {onSwitchProject && (
        <div
          onClick={onSwitchProject}
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
            boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.3)' : '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
            color: iconColor,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = hoverBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = bgColor;
          }}
          title="Switch Project"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h18v18H3zM7 12h10M7 12l3-3M7 12l3 3" />
          </svg>
        </div>
      )}
    </div>
  );
};

