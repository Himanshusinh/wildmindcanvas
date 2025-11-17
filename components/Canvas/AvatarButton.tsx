"use client";

import React from 'react';
import { useProfile } from '../Profile/useProfile';

interface Props {
  scale?: number;
  onClick: () => void;
}

const AvatarButton: React.FC<Props> = ({ scale = 1, onClick }) => {
  const s = Math.max(1, scale);
  const size = 40 * s;
  const { userData, loading, avatarFailed, setAvatarFailed, handleAccountSettings } = useProfile() as any;

  const avatarUrl = !loading && userData?.photoURL && !avatarFailed ? userData.photoURL : null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${16 * s}px`,
        bottom: `${16 * s}px`,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: `0px`,
        padding: `${4 * s}px`,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: `${12 * s}px`,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
        pointerEvents: 'auto',
      }}
    >
      {/* Circular avatar */}
      <button
        onClick={onClick}
        aria-label="Open profile"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          border: 'none',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          cursor: 'pointer',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="profile"
            referrerPolicy="no-referrer"
            onError={() => setAvatarFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ color: '#e5e7eb', fontWeight: 700, fontSize: `${16 * s}px` }}>{loading ? '…' : ((userData?.username || userData?.email || 'U').charAt(0).toUpperCase())}</span>
        )}
      </button>

      {/* Only avatar is shown per user request */}
    </div>
  );
};

export default AvatarButton;
