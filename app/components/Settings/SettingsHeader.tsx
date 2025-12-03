"use client";

import React from 'react';
import { ActiveSection } from './types';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface SettingsHeaderProps {
  activeSection: ActiveSection;
  onClose: () => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({ activeSection, onClose }) => {
  const isDark = useIsDarkTheme();

  const getTitle = () => {
    switch (activeSection) {
      case 'profile':
        return 'Profile';
      case 'canvas':
        return 'Canvas';
      case 'keyboard':
        return 'Keyboard Shortcuts';
      case 'notification':
        return 'Notification';
      default:
        return 'Settings';
    }
  };

  const bgColor = isDark ? 'var(--bg-secondary)' : '#ffffff';
  const textColor = isDark ? 'var(--text-primary)' : '#111827';
  const borderColor = isDark ? 'var(--border-color)' : 'rgba(0, 0, 0, 0.05)';
  const iconColor = isDark ? 'var(--text-secondary)' : '#6b7280';
  const hoverBg = isDark ? 'var(--bg-tertiary)' : 'rgba(0, 0, 0, 0.05)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '40px 40px 28px 40px',
        background: bgColor,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: `1px solid ${borderColor}`,
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <h3 style={{ 
        margin: 0, 
        fontSize: '20px', 
        color: textColor, 
        fontWeight: 600,
        transition: 'color 0.3s ease'
      }}>
        {getTitle()}
      </h3>
      <button
        onClick={onClose}
        aria-label="Close settings"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '20px',
          color: iconColor,
          padding: '6px 10px',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = hoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        ✕
      </button>
    </div>
  );
};

