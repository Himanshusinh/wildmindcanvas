'use client';

import React, { useEffect, useState } from 'react';

interface Props {
  scale?: number;
  onClick: () => void;
}

const SettingsButton: React.FC<Props> = ({ scale = 1, onClick }) => {
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

  const s = Math.max(1, scale);
  const size = 40 * s;
  const padding = 10 * s;
  const bgColor = isDark ? 'rgba(18, 18, 18, 0.98)' : 'rgba(255,255,255,0.98)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(220,220,220,0.9)';
  const shadowColor = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)';
  const iconColor = isDark ? '#cccccc' : '#374151';

  return (
    <button
      aria-label="Open settings"
      onClick={onClick}
      style={{
        position: 'fixed',
        left: `${16 * s}px`,
        bottom: `${16 * s}px`,
        zIndex: 9999,
        width: `${size}px`,
        height: `${size}px`,
        padding: `${padding}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgColor,
        border: `${2 * s}px solid ${borderColor}`,
        borderRadius: `${8 * s}px`,
        boxShadow: `0 6px 20px ${shadowColor}`,
        cursor: 'pointer',
        pointerEvents: 'auto',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* simple gear icon */}
      <svg width={20 * s} height={20 * s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" stroke={iconColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06A2 2 0 0 1 2.29 16.9l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09c.7 0 1.27-.3 1.51-1A1.65 1.65 0 0 0 4.5 6.27l-.06-.06A2 2 0 0 1 7.27 2.4l.06.06c.5.5 1.2.73 1.82.33.73-.46 1.64-.46 2.37 0 .62.4 1.32.17 1.82-.33l.06-.06A2 2 0 0 1 17.71 3.1l-.06.06c-.5.5-.73 1.2-.33 1.82.46.73.46 1.64 0 2.37-.4.62-.17 1.32.33 1.82l.06.06c.87.87.87 2.29 0 3.16z" stroke={iconColor} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
};

export default SettingsButton;
