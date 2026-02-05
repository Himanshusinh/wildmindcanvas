"use client";

import { useState, useEffect, useRef } from 'react';
import { useProfile } from './useProfile';
import { buildProxyThumbnailUrl } from '@/core/api/proxyUtils';

export const Profile: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { userData, loading, avatarFailed, setAvatarFailed, isPublic, setIsPublic, handleLogout, handleUpgradePlan, handlePurchaseCredits, handleAccountSettings } = useProfile() as any;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 10001, // Same as Header and ToolbarPanel
      }}
    >
      {/* Profile Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Hover Overlay - Animate Opacity only */}
        <div
          className="hover-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            opacity: 0,
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
          button:hover .hover-overlay { opacity: 1 !important; }
        `}} />

        {(!loading && userData?.photoURL && !avatarFailed) ? (
          <img
            src={buildProxyThumbnailUrl(userData.photoURL, 96, 85, 'avif')}
            alt="profile"
            referrerPolicy="no-referrer"
            fetchPriority="high"
            onError={() => setAvatarFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#4b5563' }}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" />
          </svg>
        )}
      </button>

      {/* Profile Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '320px',
            borderRadius: '16px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px' }}>
            {/* User Info Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {(!loading && userData?.photoURL && !avatarFailed) ? (
                  <img src={buildProxyThumbnailUrl(userData.photoURL, 96, 85, 'avif')} alt="avatar" referrerPolicy="no-referrer" fetchPriority="high" onError={() => setAvatarFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: 'white', fontWeight: '600', fontSize: '18px' }}>{loading ? '...' : ((userData?.username || userData?.email || 'U').charAt(0).toUpperCase())}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#1f2937', fontWeight: '600', fontSize: '16px' }}>{loading ? 'Loading...' : (userData?.username || 'User')}</div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>{loading ? 'Loading...' : (userData?.email || 'user@example.com')}</div>
              </div>
            </div>

            {/* Menu Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#1f2937', fontSize: '14px' }}>Status</span>
                  <span style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>{userData?.metadata?.accountStatus || 'Active'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <span style={{ color: '#1f2937', fontSize: '14px' }}>Active Plan</span>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>{userData?.plan || 'Free'}</span>
              </div>

              <button onClick={() => { handleUpgradePlan(); setShowDropdown(false); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#1f2937', fontSize: '14px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>Upgrade Plan</button>

              <button onClick={() => { handlePurchaseCredits(); setShowDropdown(false); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#1f2937', fontSize: '14px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>Purchase Additional Credits</button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                <span style={{ color: '#1f2937', fontSize: '14px' }}>Make generations public</span>
                <button type="button" onClick={async () => { const next = !isPublic; setIsPublic(next); try { const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com'; await fetch(`${apiBase}/api/auth/me`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPublic: next }), }); } catch (err) { console.error(err); } try { localStorage.setItem('isPublicGenerations', String(next)); } catch { } }} style={{ width: '40px', height: '20px', borderRadius: '9999px', border: 'none', backgroundColor: isPublic ? '#3b82f6' : 'rgba(0, 0, 0, 0.2)', cursor: 'pointer', position: 'relative', transition: 'background-color 0.2s' }}>
                  <span style={{ display: 'block', width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px', transform: isPublic ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }} />
                </button>
              </div>

              <button onClick={() => { handleAccountSettings(); setShowDropdown(false); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#1f2937', fontSize: '14px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>Account Settings</button>

              <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.1)', margin: '8px 0' }} />

              <button onClick={() => { handleLogout(); setShowDropdown(false); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#ef4444', fontSize: '14px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
