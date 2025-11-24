"use client";

import React, { useEffect, useState } from 'react';

export const NotificationSection: React.FC = () => {
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

  const containerBg = isDark ? '#121212' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#111827';
  const textSecondary = isDark ? '#cccccc' : '#6b7280';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ 
        padding: '20px', 
        background: containerBg, 
        borderRadius: '12px',
        border: `1px solid ${borderColor}`,
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}>
        <h4 style={{ 
          margin: '0 0 12px 0', 
          fontSize: '16px', 
          fontWeight: 600, 
          color: textColor, 
          paddingBottom: '8px',
          transition: 'color 0.3s ease'
        }}>
          Notification Settings
        </h4>
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          color: textSecondary,
          transition: 'color 0.3s ease'
        }}>
          Notification preferences will be available here.
        </p>
      </div>
    </div>
  );
};

