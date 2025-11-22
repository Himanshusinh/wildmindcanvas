"use client";

import React from 'react';
import { useProfile } from '../Profile/useProfile';

interface Props {
  scale?: number;
  onClick: () => void;
  isHidden?: boolean;
}

const AvatarButton: React.FC<Props> = ({ scale = 1, onClick, isHidden = false }) => {
  const { userData, loading, avatarFailed, setAvatarFailed, handleAccountSettings } = useProfile() as any;

  const avatarUrl = !loading && userData?.photoURL && !avatarFailed ? userData.photoURL : null;

  return (
    <button
      onClick={onClick}
      aria-label="Open profile"
      style={{
        position: 'fixed',
        left: '16px',
        bottom: '16px',
        zIndex: 9999,
        width: '40px',
        height: '40px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: 'none',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          cursor: 'pointer',
        pointerEvents: isHidden ? 'none' : 'auto',
        opacity: isHidden ? 0 : 1,
        transform: isHidden ? 'translateY(100%)' : 'translateY(0)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
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
        <span style={{ color: '#e5e7eb', fontWeight: 700, fontSize: '16px' }}>{loading ? '…' : ((userData?.username || userData?.email || 'U').charAt(0).toUpperCase())}</span>
        )}
      </button>
  );
};

export default AvatarButton;
