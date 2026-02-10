"use client";

import React, { useEffect, useState } from 'react';
import { useProfile } from '@/modules/ui-global/Profile/useProfile';

interface Props {
  scale?: number;
  onClick: () => void;
  isHidden?: boolean;
}

const AvatarButton: React.FC<Props> = ({ scale = 1, onClick, isHidden = false }) => {
  const { userData, loading, avatarFailed, setAvatarFailed } = useProfile() as any;
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

  const avatarUrl = !loading && userData?.photoURL && !avatarFailed ? userData.photoURL : null;

  const s = Math.max(1, scale);
  const size = 40 * s;
  const bgColor = isDark ? 'rgba(18, 18, 18, 0.98)' : 'rgba(255,255,255,0.98)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(220,220,220,0.9)';
  const shadowColor = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)';
  const textColor = isDark ? '#e5e7eb' : '#374151';

  return (
    <div style={{ position: 'fixed', left: `${16 * s}px`, bottom: `${16 * s}px`, zIndex: 9999 }}>
      {/* Optimization: Use opacity transition for hover state instead of expensive properties */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .avatar-btn { position: relative; overflow: hidden; }
        .avatar-btn .hover-overlay { opacity: 0; transition: opacity 0.2s; pointer-events: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .avatar-btn:hover .hover-overlay { opacity: 1; }
      `}} />
      <button
        onClick={onClick}
        aria-label="Open profile"
        className="avatar-btn"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          border: `${2 * s}px solid ${borderColor}`,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: avatarUrl ? 'transparent' : bgColor,
          cursor: 'pointer',
          pointerEvents: isHidden ? 'none' : 'auto',
          opacity: isHidden ? 0 : 1,
          transform: isHidden ? 'translateY(100%)' : 'translateY(0)',
          transition: 'opacity 0.3s ease, transform 0.3s ease', // Removed expensive properties
          boxShadow: `0 6px 20px ${shadowColor}`,
        }}
      >
        {/* Overlay for hover effect */}
        <div className="hover-overlay" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />

        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="profile"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setAvatarFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 1 }}
          />
        ) : (
          <span style={{ color: textColor, fontWeight: 700, fontSize: `${16 * s}px`, position: 'relative', zIndex: 1 }}>
            {loading ? '…' : ((userData?.username || userData?.email || 'U').charAt(0).toUpperCase())}
          </span>
        )}
      </button>
    </div>
  );
};

export default AvatarButton;
