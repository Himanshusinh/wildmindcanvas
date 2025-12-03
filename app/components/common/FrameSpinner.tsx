'use client';

import React from 'react';

interface FrameSpinnerProps {
  scale?: number;
  label?: string;
}

export const FrameSpinner: React.FC<FrameSpinnerProps> = ({ scale = 1, label = 'Generating…' }) => {
  const size = 32 * scale;
  const thickness = 3 * scale;
  const gap = 6 * scale;
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
      <div
        style={{
          width: size,
          height: size,
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          marginBottom: 8 * scale,
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: 12 * scale,
            boxSizing: 'border-box',
            borderTop: `${thickness}px solid ${isDark ? 'rgba(96,165,250,0.9)' : 'rgba(59,130,246,0.9)'}`,
            borderRight: `${thickness}px solid ${isDark ? 'rgba(96,165,250,0.35)' : 'rgba(59,130,246,0.35)'}`,
            borderBottom: `${thickness}px solid ${isDark ? 'rgba(96,165,250,0.2)' : 'rgba(59,130,246,0.2)'}`,
            borderLeft: `${thickness}px solid ${isDark ? 'rgba(96,165,250,0.15)' : 'rgba(59,130,246,0.15)'}`,
            animation: 'wmfs-rotate 1s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: `calc(100% - ${gap * 2}px)`,
            height: `calc(100% - ${gap * 2}px)`,
            borderRadius: 10 * scale,
            boxSizing: 'border-box',
            borderTop: `${thickness}px solid ${isDark ? 'rgba(96,165,250,0.5)' : 'rgba(59,130,246,0.5)'}`,
            borderRight: `${thickness}px solid ${isDark ? 'rgba(96,165,250,0.25)' : 'rgba(59,130,246,0.25)'}`,
            borderBottom: `${thickness}px solid ${isDark ? 'rgba(96,165,250,0.15)' : 'rgba(59,130,246,0.15)'}`,
            borderLeft: `${thickness}px solid ${isDark ? 'rgba(96,165,250,0.1)' : 'rgba(59,130,246,0.1)'}`,
            animation: 'wmfs-rotate-rev 0.75s linear infinite',
          }}
        />
      </div>
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

      <style>
        {`
          @keyframes wmfs-rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes wmfs-rotate-rev {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
        `}
      </style>
    </div>
  );
};

export default FrameSpinner;
