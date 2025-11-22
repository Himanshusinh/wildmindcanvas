"use client";

import React from 'react';

export const NotificationSection: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ padding: '20px', background: '#ffffff', borderRadius: '12px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#111827', paddingBottom: '8px' }}>
          Notification Settings
        </h4>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
          Notification preferences will be available here.
        </p>
      </div>
    </div>
  );
};

