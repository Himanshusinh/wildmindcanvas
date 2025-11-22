"use client";

import React from 'react';

interface ProfileSectionProps {
  userData: any;
  loading: boolean;
  avatarFailed: boolean;
  setAvatarFailed: (failed: boolean) => void;
  creditBalance: number | null;
  handleUpgradePlan: () => void;
  handleAccountSettings: () => void;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  userData,
  loading,
  avatarFailed,
  setAvatarFailed,
  creditBalance,
  handleUpgradePlan,
  handleAccountSettings,
}) => {
  return (
    <>
      {/* Top section: Avatar, Account Status, and Credits */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        {/* Left: Avatar and Account Status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          {/* Avatar */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '2px solid #e5e7eb',
              }}
            >
              {!loading && userData?.photoURL && !avatarFailed ? (
                <img
                  src={userData.photoURL}
                  alt="avatar"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ color: 'white', fontWeight: '600', fontSize: '32px' }}>
                  {loading ? '...' : ((userData?.username || userData?.email || 'U').charAt(0).toUpperCase())}
                </span>
              )}
            </div>
            <button
              onClick={handleAccountSettings}
              style={{
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '12px',
                padding: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Edit</span>
            </button>
          </div>

          {/* Account Status */}
          <div style={{ paddingTop: '8px' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Account Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Active</span>
            </div>
          </div>
        </div>

        {/* Right: Credits */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
            {creditBalance !== null ? creditBalance : '—'}
          </span>
        </div>
      </div>

      {/* About You Section */}
      <section style={{ marginBottom: '24px', padding: '20px', background: '#ffffff', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '8px' }}>
          About You
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Username</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{userData?.username || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Email</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{userData?.email || '—'}</div>
          </div>
        </div>
      </section>

      {/* Active Plan Section */}
      <section
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '20px',
          background: '#ffffff',
          borderRadius: '12px',
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#111827' }}>Active Plan</h4>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
            {userData?.plan ? `${userData.plan} Plan` : 'Free Plan'}
          </div>
        </div>
        <button
          onClick={handleUpgradePlan}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            background: '#ffffff',
            color: '#111827',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
          }}
        >
          Purchase Plan
        </button>
      </section>
    </>
  );
};

