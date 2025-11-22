"use client";

import React from 'react';
import { ActiveSection } from './types';

interface SettingsHeaderProps {
  activeSection: ActiveSection;
  onClose: () => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({ activeSection, onClose }) => {
  const getTitle = () => {
    switch (activeSection) {
      case 'profile':
        return 'Profile';
      case 'canvas':
        return 'Canvas';
      case 'theme':
        return 'Theme';
      case 'keyboard':
        return 'Keyboard Shortcuts';
      case 'notification':
        return 'Notification';
      default:
        return 'Settings';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '40px 40px 28px 40px',
        background: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
      }}
    >
      <h3 style={{ margin: 0, fontSize: '20px', color: '#111827', fontWeight: 600 }}>
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
          color: '#6b7280',
          padding: '6px 10px',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
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

