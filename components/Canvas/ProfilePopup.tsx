"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useProfile } from '../Profile/useProfile';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scale?: number;
}

type ActiveSection = 'profile' | 'canvas' | 'theme' | 'keyboard' | 'notification';
type ThemeMode = 'dark' | 'light';
type CursorType = 'default' | 'crosshair' | 'pointer' | 'grab' | 'text';
type BackgroundType = 'dots' | 'grid' | 'solid' | 'none';

const ProfilePopup: React.FC<Props> = ({ isOpen, onClose, scale = 1 }) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('profile');
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Canvas settings state
  type CanvasSettings = {
    cursorType: CursorType;
    backgroundType: BackgroundType;
    dotColor: string;
    backgroundColor: string;
    dotSize: number;
    gridSpacing: number;
  };

  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('canvasSettings');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return {
      cursorType: 'default' as CursorType,
      backgroundType: 'dots' as BackgroundType,
      dotColor: '#000000',
      backgroundColor: '#ffffff',
      dotSize: 4,
      gridSpacing: 30,
    };
  });
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

  // Apply theme on mount and when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, [selectedTheme]);

  // Save canvas settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('canvasSettings', JSON.stringify(canvasSettings));
      // Dispatch custom event to notify canvas of settings change
      window.dispatchEvent(new CustomEvent('canvasSettingsChanged', { detail: canvasSettings }));
    }
  }, [canvasSettings]);

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
          width: '800px',
          maxWidth: '95%',
          height: '650px',
          maxHeight: '90vh',
          background: '#ffffff',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          padding: '0',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
        }}
        onWheel={(e) => {
          // Prevent canvas scrolling when scrolling inside popup
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          // Prevent canvas touch scrolling when touching inside popup
          e.stopPropagation();
        }}
      >
        {/* Sidebar Navigation */}
          <div
            style={{
            width: '220px',
            height: '100%',
            background: '#ffffff',
            borderRight: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              flexDirection: 'column',
            padding: '20px',
            overflow: 'hidden',
            }}
          >
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827', fontWeight: 600 }}>Settings</h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { id: 'profile' as ActiveSection, label: 'Profile' },
                { id: 'canvas' as ActiveSection, label: 'Canvas' },
                { id: 'theme' as ActiveSection, label: 'Theme' },
                { id: 'keyboard' as ActiveSection, label: 'Keyboard Shortcuts' },
                { id: 'notification' as ActiveSection, label: 'Notification' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: activeSection === item.id ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                    color: activeSection === item.id ? '#3b82f6' : '#374151',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: activeSection === item.id ? 600 : 400,
                    transition: 'all 0.2s ease',
                    boxShadow: activeSection === item.id ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== item.id) {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== item.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {item.label}
                </button>
                ))}
              </nav>
            </div>

          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
            <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              Sign Out
            </button>
          </div>
            </div>

        {/* Main Content Area */}
        <div 
          style={{ flex: 1, height: '100%', padding: '28px', background: '#ffffff', display: 'flex', flexDirection: 'column', overflow: 'auto', minHeight: 0 }}
          onWheel={(e) => {
            // Prevent canvas scrolling when scrolling inside popup content
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            // Prevent canvas touch scrolling when touching inside popup content
            e.stopPropagation();
          }}
        >
          {/* Header with close button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', color: '#111827', fontWeight: 600 }}>
              {activeSection === 'profile' && 'Profile'}
              {activeSection === 'canvas' && 'Canvas'}
              {activeSection === 'theme' && 'Theme'}
              {activeSection === 'keyboard' && 'Keyboard Shortcuts'}
              {activeSection === 'notification' && 'Notification'}
            </h3>
            <button onClick={onClose} aria-label="Close profile" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#6b7280', padding: '6px 10px', borderRadius: '8px', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>✕</button>
          </div>

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <>
              {/* Top section: Avatar, Account Status, and Credits */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
                {/* Left: Avatar and Account Status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* Avatar */}
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
                      {(!loading && userData?.photoURL && !avatarFailed) ? (
                        <img src={userData.photoURL} alt="avatar" referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: 'white', fontWeight: '600', fontSize: '32px' }}>{loading ? '...' : ((userData?.username || userData?.email || 'U').charAt(0).toUpperCase())}</span>
                      )}
                    </div>
                    <button onClick={handleAccountSettings} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
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
                <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{creditBalance !== null ? creditBalance : '—'}</span>
                </div>
            </div>

              {/* About You Section */}
              <section style={{ marginBottom: '24px', padding: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '8px', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>About You</h4>
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
              <section style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#111827' }}>Active Plan</h4>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{userData?.plan ? `${userData.plan} Plan` : 'Free Plan'}</div>
                </div>
                <button onClick={handleUpgradePlan} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.08)', background: '#ffffff', color: '#111827', cursor: 'pointer', fontSize: '14px', fontWeight: 500, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)'; }}>
                  Purchase Plan
                </button>
              </section>
            </>
          )}

          {/* Canvas Section */}
          {activeSection === 'canvas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '8px', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>Canvas Settings</h4>
                
                {/* Cursor Type */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>Cursor Type</div>
                  <select
                    value={canvasSettings.cursorType}
                    onChange={(e) => setCanvasSettings(prev => ({ ...prev, cursorType: e.target.value as CursorType }))}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      background: '#ffffff',
                      fontSize: '14px',
                      color: '#111827',
                      cursor: 'pointer',
                      minWidth: '150px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'; }}
                  >
                    <option value="default">Default</option>
                    <option value="crosshair">Crosshair</option>
                    <option value="pointer">Pointer</option>
                    <option value="grab">Grab</option>
                    <option value="text">Text</option>
                  </select>
                </div>

                {/* Background Type */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>Background Type</div>
                  <select
                    value={canvasSettings.backgroundType}
                    onChange={(e) => setCanvasSettings(prev => ({ ...prev, backgroundType: e.target.value as BackgroundType }))}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      background: '#ffffff',
                      fontSize: '14px',
                      color: '#111827',
                      cursor: 'pointer',
                      minWidth: '150px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'; }}
                  >
                    <option value="dots">Dots</option>
                    <option value="grid">Grid</option>
                    <option value="solid">Solid</option>
                    <option value="none">None</option>
                  </select>
                </div>

                {/* Dot Color */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>Dot Color</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={canvasSettings.dotColor}
                      onChange={(e) => setCanvasSettings(prev => ({ ...prev, dotColor: e.target.value }))}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={canvasSettings.dotColor}
                      onChange={(e) => setCanvasSettings(prev => ({ ...prev, dotColor: e.target.value }))}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        background: '#ffffff',
                        fontSize: '14px',
                        color: '#111827',
                        width: '100px',
                      }}
                    />
                  </div>
                </div>

                {/* Background Color */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>Background Color</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={canvasSettings.backgroundColor}
                      onChange={(e) => setCanvasSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={canvasSettings.backgroundColor}
                      onChange={(e) => setCanvasSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        background: '#ffffff',
                        fontSize: '14px',
                        color: '#111827',
                        width: '100px',
                      }}
                    />
                  </div>
                </div>

                {/* Dot Size */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>Dot Size</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={canvasSettings.dotSize}
                      onChange={(e) => setCanvasSettings(prev => ({ ...prev, dotSize: parseInt(e.target.value) }))}
                      style={{
                        flex: 1,
                        cursor: 'pointer',
                      }}
                    />
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={canvasSettings.dotSize}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1 && val <= 10) {
                          setCanvasSettings(prev => ({ ...prev, dotSize: val }));
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        background: '#ffffff',
                        fontSize: '14px',
                        color: '#111827',
                        width: '60px',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '20px' }}>px</span>
                  </div>
                </div>

                {/* Grid Spacing */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
                  <div style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>Grid Spacing</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={canvasSettings.gridSpacing}
                      onChange={(e) => setCanvasSettings(prev => ({ ...prev, gridSpacing: parseInt(e.target.value) }))}
                      style={{
                        flex: 1,
                        cursor: 'pointer',
                      }}
                    />
                    <input
                      type="number"
                      min="10"
                      max="100"
                      step="5"
                      value={canvasSettings.gridSpacing}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 10 && val <= 100) {
                          setCanvasSettings(prev => ({ ...prev, gridSpacing: val }));
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        background: '#ffffff',
                        fontSize: '14px',
                        color: '#111827',
                        width: '60px',
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '20px' }}>px</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Theme Section */}
          {activeSection === 'theme' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '8px', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>Theme</h4>
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  {/* Dark Mode Button */}
                  <button
                    onClick={() => {
                      setSelectedTheme('dark');
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('theme', 'dark');
                        document.documentElement.classList.add('dark');
                        document.documentElement.classList.remove('light');
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '12px',
                      border: selectedTheme === 'dark' ? '2px solid #3b82f6' : '1px solid rgba(0, 0, 0, 0.1)',
                      background: selectedTheme === 'dark' ? '#f8fafc' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedTheme === 'dark' ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selectedTheme === 'dark' ? '#1f2937' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: selectedTheme === 'dark' ? '#1f2937' : '#9ca3af' }}>Dark Mode</span>
                  </button>

                  {/* Light Mode Button */}
                  <button
                    onClick={() => {
                      setSelectedTheme('light');
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('theme', 'light');
                        document.documentElement.classList.add('light');
                        document.documentElement.classList.remove('dark');
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '16px',
                      borderRadius: '12px',
                      border: selectedTheme === 'light' ? '2px solid #3b82f6' : '1px solid rgba(0, 0, 0, 0.1)',
                      background: selectedTheme === 'light' ? '#ffffff' : '#f9fafb',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedTheme === 'light' ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={selectedTheme === 'light' ? '#1f2937' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: selectedTheme === 'light' ? '#1f2937' : '#9ca3af' }}>Light Mode</span>
                  </button>
                </div>
              </div>
              </div>
          )}

          {/* Keyboard Shortcuts Section */}
          {activeSection === 'keyboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '8px', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>Keyboard Shortcuts</h4>
                
                {/* Create Elements */}
                <div style={{ marginBottom: '24px' }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Create Elements</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                      <span style={{ fontSize: '14px', color: '#111827' }}>Text</span>
                      <kbd style={{ padding: '6px 12px', borderRadius: '8px', background: '#f3f4f6', border: '1px solid rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>T</kbd>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                      <span style={{ fontSize: '14px', color: '#111827' }}>Image</span>
                      <kbd style={{ padding: '6px 12px', borderRadius: '8px', background: '#f3f4f6', border: '1px solid rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>I</kbd>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                      <span style={{ fontSize: '14px', color: '#111827' }}>Video</span>
                      <kbd style={{ padding: '6px 12px', borderRadius: '8px', background: '#f3f4f6', border: '1px solid rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>V</kbd>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                      <span style={{ fontSize: '14px', color: '#111827' }}>Music</span>
                      <kbd style={{ padding: '6px 12px', borderRadius: '8px', background: '#f3f4f6', border: '1px solid rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>M</kbd>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ marginBottom: '24px' }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Actions</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                      <span style={{ fontSize: '14px', color: '#111827' }}>Select all</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <kbd style={{ padding: '6px 10px', borderRadius: '8px', background: '#f3f4f6', border: '1px solid rgba(0, 0, 0, 0.1)', fontSize: '11px', fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>{typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}</kbd>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>+</span>
                        <kbd style={{ padding: '6px 12px', borderRadius: '8px', background: '#f3f4f6', border: '1px solid rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>A</kbd>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                      <span style={{ fontSize: '14px', color: '#111827' }}>Delete</span>
                      <kbd style={{ padding: '6px 12px', borderRadius: '8px', background: '#f3f4f6', border: '1px solid rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>Delete</kbd>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                      <span style={{ fontSize: '14px', color: '#111827' }}>Close modal</span>
                      <kbd style={{ padding: '6px 12px', borderRadius: '8px', background: '#f3f4f6', border: '1px solid rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 600, color: '#111827', fontFamily: 'monospace' }}>Esc</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Section */}
          {activeSection === 'notification' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '8px', borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>Notification Settings</h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Notification preferences will be available here.</p>
              </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;
