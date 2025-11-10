'use client';

import React from 'react';

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onDuplicate: () => void;
  showDownload?: boolean;
  showDuplicate?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  onClose,
  onDelete,
  onDownload,
  onDuplicate,
  showDownload = true,
  showDuplicate = true,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - closes menu when clicking outside */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 2999,
          backgroundColor: 'transparent',
        }}
      />
      {/* Navigation Bar - Top Center, aligned with Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1001,
          display: 'flex',
          gap: '8px',
          padding: '6px 8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}
      >
        {/* Delete Icon Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
            onClose();
          }}
          title="Delete"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            padding: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: '#4b5563',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#4b5563';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>

        {/* Download Icon Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
            onClose();
          }}
          title="Download"
          disabled={!showDownload}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            padding: 0,
            backgroundColor: showDownload ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: showDownload ? '#4b5563' : '#9ca3af',
            cursor: showDownload ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            opacity: showDownload ? 1 : 0.5,
          }}
          onMouseEnter={(e) => {
            if (showDownload) {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.color = '#3b82f6';
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (showDownload) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#4b5563';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>

        {/* Duplicate Icon Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
            onClose();
          }}
          title="Duplicate"
          disabled={!showDuplicate}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            padding: 0,
            backgroundColor: showDuplicate ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: showDuplicate ? '#4b5563' : '#9ca3af',
            cursor: showDuplicate ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            opacity: showDuplicate ? 1 : 0.5,
          }}
          onMouseEnter={(e) => {
            if (showDuplicate) {
              e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
              e.currentTarget.style.color = '#22c55e';
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (showDuplicate) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#4b5563';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
      </div>
    </>
  );
};

