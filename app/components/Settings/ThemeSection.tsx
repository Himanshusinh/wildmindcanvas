"use client";

import React from 'react';
import { ThemeMode } from './types';

interface ThemeSectionProps {
  selectedTheme: ThemeMode;
  setSelectedTheme: (theme: ThemeMode) => void;
}

export const ThemeSection: React.FC<ThemeSectionProps> = ({ selectedTheme, setSelectedTheme }) => {
  const handleThemeChange = (theme: ThemeMode) => {
    setSelectedTheme(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '8px' }}>
          Theme
        </h4>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          {/* Dark Mode Button */}
          <button
            onClick={() => handleThemeChange('dark')}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: selectedTheme === 'dark' ? '2px solid #3b82f6' : '1px solid rgba(0, 0, 0, 0.1)',
              background: selectedTheme === 'dark' ? '#f8fafc' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s ease',
              boxShadow: selectedTheme === 'dark' ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={selectedTheme === 'dark' ? '#1f2937' : '#9ca3af'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 500, color: selectedTheme === 'dark' ? '#1f2937' : '#9ca3af' }}>
              Dark Mode
            </span>
          </button>

          {/* Light Mode Button */}
          <button
            onClick={() => handleThemeChange('light')}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: selectedTheme === 'light' ? '2px solid #3b82f6' : '1px solid rgba(0, 0, 0, 0.1)',
              background: selectedTheme === 'light' ? '#ffffff' : '#f9fafb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s ease',
              boxShadow: selectedTheme === 'light' ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={selectedTheme === 'light' ? '#1f2937' : '#9ca3af'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: 500, color: selectedTheme === 'light' ? '#1f2937' : '#9ca3af' }}>
              Light Mode
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

