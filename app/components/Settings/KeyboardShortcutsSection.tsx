"use client";

import React from 'react';

export const KeyboardShortcutsSection: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '8px' }}>
          Keyboard Shortcuts
        </h4>

        {/* Create Elements */}
        <div style={{ marginBottom: '24px' }}>
          <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Create Elements</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: '#111827' }}>Text</span>
              <kbd
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#f3f4f6',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#111827',
                  fontFamily: 'monospace',
                }}
              >
                T
              </kbd>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: '#111827' }}>Image</span>
              <kbd
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#f3f4f6',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#111827',
                  fontFamily: 'monospace',
                }}
              >
                I
              </kbd>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: '#111827' }}>Video</span>
              <kbd
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#f3f4f6',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#111827',
                  fontFamily: 'monospace',
                }}
              >
                V
              </kbd>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: '#111827' }}>Music</span>
              <kbd
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#f3f4f6',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#111827',
                  fontFamily: 'monospace',
                }}
              >
                M
              </kbd>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginBottom: '24px' }}>
          <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Actions</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: '#111827' }}>Select all</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <kbd
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: '#f3f4f6',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#111827',
                    fontFamily: 'monospace',
                  }}
                >
                  {typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
                </kbd>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>+</span>
                <kbd
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#f3f4f6',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#111827',
                    fontFamily: 'monospace',
                  }}
                >
                  A
                </kbd>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: '#111827' }}>Delete</span>
              <kbd
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#f3f4f6',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#111827',
                  fontFamily: 'monospace',
                }}
              >
                Delete
              </kbd>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
              <span style={{ fontSize: '14px', color: '#111827' }}>Close modal</span>
              <kbd
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: '#f3f4f6',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#111827',
                  fontFamily: 'monospace',
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

