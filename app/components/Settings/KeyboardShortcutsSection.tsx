"use client";

import React, { useEffect, useState } from 'react';

export const KeyboardShortcutsSection: React.FC = () => {
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

  const containerBg = isDark ? '#121212' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#111827';
  const textSecondary = isDark ? '#cccccc' : '#374151';
  const textTertiary = isDark ? '#999999' : '#6b7280';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const kbdBg = isDark ? '#1a1a1a' : '#f3f4f6';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ 
        padding: '20px', 
        background: containerBg, 
        borderRadius: '12px',
        border: `1px solid ${borderColor}`,
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}>
        <h4 style={{ 
          margin: '0 0 20px 0', 
          fontSize: '16px', 
          fontWeight: 600, 
          color: textColor, 
          paddingBottom: '8px',
          transition: 'color 0.3s ease'
        }}>
          Keyboard Shortcuts
        </h4>

        {/* Create Elements */}
        <div style={{ marginBottom: '24px' }}>
          <h5 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '14px', 
            fontWeight: 600, 
            color: textSecondary,
            transition: 'color 0.3s ease'
          }}>Create Elements</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: textColor, transition: 'color 0.3s ease' }}>Text</span>
              <kbd
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: kbdBg,
                  border: `1px solid ${borderColor}`,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: textColor,
                  fontFamily: 'monospace',
                  transition: 'all 0.3s ease',
                }}
              >
                T
              </kbd>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: textColor, transition: 'color 0.3s ease' }}>Image</span>
              <kbd
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: kbdBg,
                  border: `1px solid ${borderColor}`,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: textColor,
                  fontFamily: 'monospace',
                  transition: 'all 0.3s ease',
                }}
              >
                I
              </kbd>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: textColor, transition: 'color 0.3s ease' }}>Video</span>
              <kbd
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: kbdBg,
                  border: `1px solid ${borderColor}`,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: textColor,
                  fontFamily: 'monospace',
                  transition: 'all 0.3s ease',
                }}
              >
                V
              </kbd>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: textColor, transition: 'color 0.3s ease' }}>Music</span>
              <kbd
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: kbdBg,
                  border: `1px solid ${borderColor}`,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: textColor,
                  fontFamily: 'monospace',
                  transition: 'all 0.3s ease',
                }}
              >
                M
              </kbd>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginBottom: '24px' }}>
          <h5 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '14px', 
            fontWeight: 600, 
            color: textSecondary,
            transition: 'color 0.3s ease'
          }}>Actions</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: textColor, transition: 'color 0.3s ease' }}>Select all</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <kbd
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: kbdBg,
                    border: `1px solid ${borderColor}`,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: textColor,
                    fontFamily: 'monospace',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
                </kbd>
                <span style={{ fontSize: '12px', color: textTertiary, transition: 'color 0.3s ease' }}>+</span>
                <kbd
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: kbdBg,
                    border: `1px solid ${borderColor}`,
                    fontSize: '12px',
                    fontWeight: 600,
                    color: textColor,
                    fontFamily: 'monospace',
                    transition: 'all 0.3s ease',
                  }}
                >
                  A
                </kbd>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: textColor, transition: 'color 0.3s ease' }}>Delete</span>
              <kbd
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: kbdBg,
                  border: `1px solid ${borderColor}`,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: textColor,
                  fontFamily: 'monospace',
                  transition: 'all 0.3s ease',
                }}
              >
                Delete
              </kbd>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: textColor, transition: 'color 0.3s ease' }}>Close modal</span>
              <kbd
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: kbdBg,
                  border: `1px solid ${borderColor}`,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: textColor,
                  fontFamily: 'monospace',
                  transition: 'all 0.3s ease',
                }}
              >
                Esc
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

