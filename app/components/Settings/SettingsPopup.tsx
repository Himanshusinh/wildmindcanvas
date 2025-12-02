"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useProfile } from '../Profile/useProfile';
import { SettingsSidebar } from './SettingsSidebar';
import { SettingsHeader } from './SettingsHeader';
import { ProfileSection } from './ProfileSection';
import { CanvasSection } from './CanvasSection';
import { KeyboardShortcutsSection } from './KeyboardShortcutsSection';
import { NotificationSection } from './NotificationSection';
import { SettingsPopupProps, ActiveSection, CanvasSettings, CursorType, BackgroundType } from './types';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

export const SettingsPopup: React.FC<SettingsPopupProps> = ({ isOpen, onClose, scale = 1 }) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('profile');
  const isDark = useIsDarkTheme();

  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('canvasSettings');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch { }
      }
    }
    return {
      cursorType: 'default' as CursorType,
      backgroundType: 'dots' as BackgroundType,
      dotColor: 'gray',
      backgroundColor: '#ffffff',
      dotSize: 4,
      gridSpacing: 30,
      showPointerTool: true,
      showMoveTool: true,
      showThemeToggle: true,
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
    <>
      {/* Backdrop with glass effect blur */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 20000,
          background: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          pointerEvents: 'auto',
          transition: 'background-color 0.3s ease',
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        onWheel={(e) => {
          // Prevent canvas scrolling when backdrop is visible
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          // Prevent canvas touch scrolling
          e.preventDefault();
          e.stopPropagation();
        }}
      />
      {/* Popup Content */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 20001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          style={{
            width: '90vw',
            maxWidth: '1200px',
            height: '85vh',
            maxHeight: '800px',
            background: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '20px',
            boxShadow: isDark ? '0 20px 60px rgba(0, 0, 0, 0.5)' : '0 20px 60px rgba(0, 0, 0, 0.3)',
            padding: '0',
            display: 'flex',
            flexDirection: 'row',
            overflow: 'hidden',
            pointerEvents: 'auto',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
          }}
          onWheel={(e) => {
            // Allow scrolling within popup, but prevent it from reaching canvas
            e.stopPropagation();
            // Don't prevent default - allow normal scrolling
          }}
          onTouchMove={(e) => {
            // Prevent canvas touch scrolling when touching inside popup
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            // Prevent clicks inside popup from closing it
            e.stopPropagation();
          }}
        >
          {/* Sidebar Navigation */}
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onLogout={handleLogout}
          />

          {/* Main Content Area */}
          <div
            style={{
              flex: 1,
              height: '100%',
              padding: '0',
              background: isDark ? 'var(--bg-secondary)' : '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minHeight: 0,
              transition: 'background-color 0.3s ease',
            }}
          >
            {/* Header with close button - Sticky at top */}
            <SettingsHeader activeSection={activeSection} onClose={onClose} />

            {/* Scrollable Content Area */}
            <div
              style={{
                flex: 1,
                padding: '0 40px 40px 40px',
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
              }}
              onWheel={(e) => {
                // Prevent canvas scrolling when scrolling inside popup content
                e.stopPropagation();
                // Allow normal scrolling within the container - don't prevent default
                // The container's overflowY: 'auto' will handle the scrolling
              }}
              onTouchMove={(e) => {
                // Prevent canvas touch scrolling when touching inside popup content
                e.stopPropagation();
              }}
            >
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <ProfileSection
                  userData={userData}
                  loading={loading}
                  avatarFailed={avatarFailed}
                  setAvatarFailed={setAvatarFailed}
                  creditBalance={creditBalance}
                  handleUpgradePlan={handleUpgradePlan}
                  handleAccountSettings={handleAccountSettings}
                />
              )}

              {/* Canvas Section */}
              {activeSection === 'canvas' && (
                <CanvasSection canvasSettings={canvasSettings} setCanvasSettings={setCanvasSettings} />
              )}

              {/* Keyboard Shortcuts Section */}
              {activeSection === 'keyboard' && <KeyboardShortcutsSection />}

              {/* Notification Section */}
              {activeSection === 'notification' && <NotificationSection />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPopup;

