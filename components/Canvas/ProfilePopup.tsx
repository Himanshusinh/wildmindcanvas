"use client";

import React, { useEffect, useRef } from 'react';
import { useProfile } from '../Profile/useProfile';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scale?: number;
}

const ProfilePopup: React.FC<Props> = ({ isOpen, onClose, scale = 1 }) => {
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
          width: '720px',
          maxWidth: '95%',
          background: 'rgba(255,255,255,0.98)',
          border: '2px solid rgba(220,220,220,0.95)',
          borderRadius: '8px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', width: '100%', gap: '16px' }}>
          <div
            style={{
              width: '220px',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#f3f4f6',
              border: '1px solid rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <nav style={{ display: 'flex', flexDirection: 'column', padding: '8px', gap: '6px', flex: 1 }}>
                {['General', 'Billing', 'Backups', 'Integrations', 'Notifications', 'Advanced'].map((item) => (
                  <div key={item} style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: item === 'General' ? 'rgba(0,0,0,0.03)' : 'transparent', color: item === 'General' ? '#111827' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{item}</span>
                  </div>
                ))}
              </nav>
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
              <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '8px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>Sign Out</button>
            </div>
          </div>

          <div style={{ flex: 1, background: '#ffffff', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.04)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#111827' }}>Generation</h3>
              <button onClick={onClose} aria-label="Close profile" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>

            <section style={{ borderRadius: '8px', padding: '12px', background: '#f8fafc', border: '1px solid rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Make generations public</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Allow others to view your generated content</div>
                </div>
                <button type="button" onClick={async () => { const next = !isPublic; setIsPublic(next); try { const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com'; await fetch(`${apiBase}/api/auth/me`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isPublic: next }), }); } catch (err) { console.error(err); } try { localStorage.setItem('isPublicGenerations', String(!isPublic)); } catch {} }} style={{ width: '48px', height: '28px', borderRadius: '9999px', border: 'none', backgroundColor: isPublic ? '#3b82f6' : 'rgba(0,0,0,0.06)', cursor: 'pointer', position: 'relative' }}>
                  <span style={{ display: 'block', width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '4px', left: isPublic ? '26px' : '4px', transition: 'left 0.18s' }} />
                </button>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', color: '#111827' }}>Credits</div>
                <div style={{ fontWeight: 700 }}>{creditBalance !== null ? `${creditBalance} cr` : '—'}</div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <button onClick={handlePurchaseCredits} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#111827', color: 'white', cursor: 'pointer' }}>Purchase Additional Credits</button>
              </div>
            </section>

            <section style={{ borderRadius: '8px', padding: '12px', background: '#ffffff', border: '1px solid rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', alignItems: 'center' }}>
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
