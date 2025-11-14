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
}

export const Header: React.FC<HeaderProps> = ({ 
  projectName: initialProjectName = 'Untitled',
  onProjectNameChange,
  onSwitchProject,
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = false,
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
      }}
    >
      {/* Undo Button */}
      <div
        style={{
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          backgroundColor: canUndo ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          color: canUndo ? '#111827' : '#9ca3af',
          cursor: canUndo && onUndo ? 'pointer' : 'default',
          transition: 'all 0.2s',
          opacity: canUndo ? 1 : 0.6,
        }}
        onClick={() => { if (canUndo && onUndo) onUndo(); }}
        onMouseEnter={(e) => {
          if (canUndo) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          if (canUndo) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
        title="Undo (Ctrl/Cmd+Z)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 14l-4-4 4-4" />
          <path d="M20 20a9 9 0 0 0-9-9H5" />
        </svg>
      </div>

      {/* Redo Button */}
      <div
        style={{
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          backgroundColor: canRedo ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
          color: canRedo ? '#111827' : '#9ca3af',
          cursor: canRedo && onRedo ? 'pointer' : 'default',
          transition: 'all 0.2s',
          opacity: canRedo ? 1 : 0.6,
        }}
        onClick={() => { if (canRedo && onRedo) onRedo(); }}
        onMouseEnter={(e) => {
          if (canRedo) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          if (canRedo) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
        title="Redo (Ctrl+Y / Shift+Ctrl/Cmd+Z)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 10l4 4-4 4" />
          <path d="M4 4a9 9 0 0 1 9 9h5" />
        </svg>
      </div>

      {/* Library Icon - Part 1 */}
      <div
        style={{
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          color: '#4b5563',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      </div>

      {/* Project Name - Part 2 */}
      <div
        style={{
          padding: '6px 10px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
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
              border: '1px solid rgba(59, 130, 246, 0.5)',
              borderRadius: '4px',
              padding: '2px 6px',
              color: '#1f2937',
              fontSize: '14px',
              fontWeight: '500',
              outline: 'none',
              minWidth: '120px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }}
          />
        ) : (
          <div
            onClick={handleNameClick}
            style={{
              padding: '2px 6px',
              color: '#1f2937',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'text',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              minWidth: '120px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
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
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            color: '#4b5563',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
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

