"use client";

import React from 'react';
import { ActiveSection } from './types';

interface SettingsSidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
  onLogout: () => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  activeSection,
  onSectionChange,
  onLogout,
}) => {
  const sections = [
    { id: 'profile' as ActiveSection, label: 'Profile' },
    { id: 'canvas' as ActiveSection, label: 'Canvas' },
    { id: 'theme' as ActiveSection, label: 'Theme' },
    { id: 'keyboard' as ActiveSection, label: 'Keyboard Shortcuts' },
    { id: 'notification' as ActiveSection, label: 'Notification' },
  ];

  return (
    <div
      style={{
        width: '280px',
        height: '100%',
        background: '#ffffff',
        borderRight: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px',
        overflow: 'hidden',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827', fontWeight: 600 }}>Settings</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sections.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: activeSection === item.id ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                color: activeSection === item.id ? '#3b82f6' : '#374151',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: activeSection === item.id ? 600 : 400,
                transition: 'all 0.2s ease',
                boxShadow: activeSection === item.id ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

