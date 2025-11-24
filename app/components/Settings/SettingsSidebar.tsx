"use client";

import React, { useEffect, useState } from 'react';
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

  const sections = [
    { id: 'profile' as ActiveSection, label: 'Profile' },
    { id: 'canvas' as ActiveSection, label: 'Canvas' },
    { id: 'theme' as ActiveSection, label: 'Theme' },
    { id: 'keyboard' as ActiveSection, label: 'Keyboard Shortcuts' },
    { id: 'notification' as ActiveSection, label: 'Notification' },
  ];

  const bgColor = isDark ? 'var(--bg-secondary)' : '#ffffff';
  const textColor = isDark ? 'var(--text-primary)' : '#111827';
  const borderColor = isDark ? 'var(--border-color)' : 'rgba(0, 0, 0, 0.06)';
  const activeBg = isDark ? 'var(--accent-light)' : 'rgba(59, 130, 246, 0.12)';
  const activeColor = isDark ? 'var(--accent-color)' : '#3b82f6';
  const inactiveColor = isDark ? 'var(--text-secondary)' : '#374151';
  const hoverBg = isDark ? 'var(--bg-tertiary)' : 'rgba(0, 0, 0, 0.04)';

  return (
    <div
      style={{
        width: '280px',
        height: '100%',
        background: bgColor,
        borderRight: `1px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '32px',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          margin: '0 0 20px 0', 
          fontSize: '18px', 
          color: textColor, 
          fontWeight: 600,
          transition: 'color 0.3s ease'
        }}>Settings</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sections.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: 'none',
                background: activeSection === item.id ? activeBg : 'transparent',
                color: activeSection === item.id ? activeColor : inactiveColor,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: activeSection === item.id ? 600 : 400,
                transition: 'all 0.3s ease',
                boxShadow: activeSection === item.id ? (isDark ? '0 2px 8px rgba(96, 165, 250, 0.2)' : '0 2px 8px rgba(59, 130, 246, 0.15)') : 'none',
              }}
              onMouseEnter={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.background = hoverBg;
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

      <div style={{ 
        marginTop: 'auto', 
        paddingTop: '20px', 
        borderTop: `1px solid ${borderColor}`,
        transition: 'border-color 0.3s ease'
      }}>
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
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)';
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

