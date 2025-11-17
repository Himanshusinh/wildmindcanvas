"use client";

import React, { useEffect, useRef } from 'react';
import { useProfile } from '../Profile/useProfile';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scale?: number;
}

const ProfilePopup: React.FC<Props> = ({ isOpen, onClose, scale = 1 }) => {
  const s = Math.max(1, scale);
  const profile = useProfile() as any;
  const {
    userData,
    loading,
    avatarFailed,
    setAvatarFailed,
    creditBalance,
    isPublic,
    setIsPublic,
    handleLogout,
    handleUpgradePlan,
    handlePurchaseCredits,
    handleAccountSettings,
  } = profile;

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 7000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        style={{
          width: `${Math.min(900, 720 * s)}px`,
          maxWidth: '95%',
          background: 'rgba(255,255,255,0.98)',
          border: `${2 * s}px solid rgba(220,220,220,0.95)`,
          borderRadius: `${8 * s}px`,
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          padding: `${20 * s}px`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', width: '100%', gap: `${16 * s}px` }}>
          <div
            style={{
              width: `${220 * s}px`,
              borderRadius: `${8 * s}px`,
              overflow: 'hidden',
              background: '#f3f4f6',
              border: '1px solid rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: `${16 * s}px`, display: 'flex', alignItems: 'center', gap: `${12 * s}px`, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <nav style={{ display: 'flex', flexDirection: 'column', padding: `${8 * s}px`, gap: `${6 * s}px`, flex: 1 }}>
                {['General', 'Billing', 'Backups', 'Integrations', 'Notifications', 'Advanced'].map((item) => (
                  <div key={item} style={{ padding: `${10 * s}px ${12 * s}px`, borderRadius: `${8 * s}px`, cursor: 'pointer', background: item === 'General' ? 'rgba(0,0,0,0.03)' : 'transparent', color: item === 'General' ? '#111827' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{item}</span>
                  </div>
                ))}
              </nav>
            </div>

            <div style={{ padding: `${12 * s}px`, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
              <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: `${8 * s}px`, borderRadius: `${8 * s}px`, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>Sign Out</button>
            </div>
          </div>

          <div style={{ flex: 1, background: '#ffffff', borderRadius: `${8 * s}px`, border: '1px solid rgba(0,0,0,0.04)', padding: `${16 * s}px`, display: 'flex', flexDirection: 'column', gap: `${12 * s}px` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: `${16 * s}px`, color: '#111827' }}>Generation</h3>
              <button onClick={onClose} aria-label="Close profile" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <section style={{ borderRadius: `${8 * s}px`, padding: `${12 * s}px`, background: '#f8fafc', border: '1px solid rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: `${14 * s}px`, fontWeight: 600 }}>Make generations public</div>
                  <div style={{ fontSize: `${12 * s}px`, color: '#6b7280' }}>Allow others to view your generated content</div>
                </div>
                <button type="button" onClick={async () => { const next = !isPublic; setIsPublic(next); try { const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com'; await fetch(`${apiBase}/api/auth/me`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPublic: next }), }); } catch (err) { console.error(err); } try { localStorage.setItem('isPublicGenerations', String(!isPublic)); } catch {} }} style={{ width: `${48 * s}px`, height: `${28 * s}px`, borderRadius: `${9999 * s}px`, border: 'none', backgroundColor: isPublic ? '#3b82f6' : 'rgba(0,0,0,0.06)', cursor: 'pointer', position: 'relative' }}>
                  <span style={{ display: 'block', width: `${20 * s}px`, height: `${20 * s}px`, backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: `${4 * s}px`, left: isPublic ? `${26 * s}px` : `${4 * s}px`, transition: 'left 0.18s' }} />
                </button>
              </div>
              <div style={{ marginTop: `${12 * s}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: `${14 * s}px`, color: '#111827' }}>Credits</div>
                <div style={{ fontWeight: 700 }}>{creditBalance !== null ? `${creditBalance} cr` : '—'}</div>
              </div>
              <div style={{ marginTop: `${12 * s}px` }}>
                <button onClick={handlePurchaseCredits} style={{ padding: `${8 * s}px ${12 * s}px`, borderRadius: `${8 * s}px`, border: 'none', background: '#111827', color: 'white', cursor: 'pointer' }}>Purchase Additional Credits</button>
              </div>
            </section>

            <section style={{ borderRadius: `${8 * s}px`, padding: `${12 * s}px`, background: '#ffffff', border: '1px solid rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: `${12 * s}px`, alignItems: 'center' }}>
                <div style={{ color: '#6b7280' }}>Your Name</div>
                <div style={{ fontWeight: 600 }}>{userData?.username || userData?.displayName || '—'}</div>

                <div style={{ color: '#6b7280' }}>Your Email</div>
                <div style={{ fontWeight: 600 }}>{userData?.email || '—'}</div>

                <div style={{ color: '#6b7280' }}>Account Status</div>
                <div style={{ fontWeight: 600 }}>{userData?.metadata?.accountStatus || 'Active'}</div>

                <div style={{ color: '#6b7280' }}>Plan</div>
                <div style={{ fontWeight: 600 }}>{userData?.plan || 'Free'}</div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;
