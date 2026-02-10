'use client';

import React from 'react';

interface FrameSpinnerProps {
  scale?: number;
  label?: string;
}

export const FrameSpinner: React.FC<FrameSpinnerProps> = ({ scale = 1, label = 'Generating…' }) => {
  const size = 64 * scale;
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-label="Loading"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 5,
        pointerEvents: 'none',
        borderRadius: 'inherit',
      }}
    >
      <img
        src={isDark ? '/loader-light.svg' : '/loader-dark.svg'}
        alt="Loading"
        fetchPriority="high"
        style={{
          width: size,
          height: size,
          marginBottom: 8 * scale,
        }}
      />
      {label && (
        <div
          style={{
            fontSize: 12 * scale,
            fontWeight: 600,
            color: isDark ? '#60a5fa' : '#3b82f6',
            textShadow: isDark ? '0 1px 2px rgba(0,0,0,0.8)' : '0 1px 1px rgba(255,255,255,0.6)',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

export default FrameSpinner;
