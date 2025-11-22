'use client';

import React from 'react';

interface ModalActionIconsProps {
  isSelected: boolean;
  scale: number;
  generatedUrl?: string | null; // For download button visibility (image/video/music URL)
  onDelete?: () => void;
  onDownload?: () => void;
  onDuplicate?: () => void;
  variant?: 'default' | 'text'; // 'text' variant has different styling (no backdrop blur)
}

export const ModalActionIcons: React.FC<ModalActionIconsProps> = ({
  isSelected,
  scale,
  generatedUrl,
  onDelete,
  onDownload,
  onDuplicate,
  variant = 'default',
}) => {
  if (!isSelected) return null;

  const isTextVariant = variant === 'text';
  const baseButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${28 * scale}px`,
    height: `${28 * scale}px`,
    padding: 0,
    backgroundColor: isTextVariant ? '#ffffff' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: isTextVariant ? 'none' : 'blur(20px)',
    WebkitBackdropFilter: isTextVariant ? 'none' : 'blur(20px)',
    border: `1px solid rgba(0, 0, 0, 0.1)`,
    borderRadius: `${8 * scale}px`,
    color: '#4b5563',
    cursor: 'pointer',
    transition: isTextVariant ? 'box-shadow 0.12s, background-color 0.12s' : 'all 0.2s',
    boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`,
  };

  const handleDeleteMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isTextVariant) {
      e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.12)';
      e.currentTarget.style.color = '#15803d';
      e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${14 * scale}px rgba(16, 185, 129, 0.12)`;
    } else {
      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
      e.currentTarget.style.color = '#ef4444';
      e.currentTarget.style.transform = 'scale(1.1)';
    }
  };

  const handleDeleteMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isTextVariant) {
      e.currentTarget.style.backgroundColor = '#ffffff';
      e.currentTarget.style.color = '#4b5563';
      e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`;
    } else {
      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      e.currentTarget.style.color = '#4b5563';
      e.currentTarget.style.transform = 'scale(1)';
    }
  };

  const handleDownloadMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
    e.currentTarget.style.color = '#3b82f6';
    if (!isTextVariant) {
      e.currentTarget.style.transform = 'scale(1.1)';
    }
  };

  const handleDownloadMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = isTextVariant ? '#ffffff' : 'rgba(255, 255, 255, 0.95)';
    e.currentTarget.style.color = '#4b5563';
    if (!isTextVariant) {
      e.currentTarget.style.transform = 'scale(1)';
    }
  };

  const handleDuplicateMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isTextVariant) {
      e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.12)';
      e.currentTarget.style.color = '#1e40af';
      e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${14 * scale}px rgba(59,130,246,0.12)`;
    } else {
      e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
      e.currentTarget.style.color = '#22c55e';
      e.currentTarget.style.transform = 'scale(1.1)';
    }
  };

  const handleDuplicateMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isTextVariant) {
      e.currentTarget.style.backgroundColor = '#ffffff';
      e.currentTarget.style.color = '#4b5563';
      e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`;
    } else {
      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      e.currentTarget.style.color = '#4b5563';
      e.currentTarget.style.transform = 'scale(1)';
    }
  };

  // Delete icon SVG - different for text variant
  const DeleteIcon = isTextVariant ? (
    <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
      <path d="M10 6V4h4v2" />
    </svg>
  ) : (
    <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );

  // Duplicate icon SVG - different for text variant
  const DuplicateIcon = isTextVariant ? (
    <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <rect x="3" y="3" width="13" height="13" rx="2" ry="2" />
    </svg>
  ) : (
    <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: `${-40 * scale}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${6 * scale}px`,
        zIndex: 3001,
        pointerEvents: 'auto',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Delete Icon */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Delete"
          style={baseButtonStyle}
          onMouseEnter={handleDeleteMouseEnter}
          onMouseLeave={handleDeleteMouseLeave}
        >
          {DeleteIcon}
        </button>
      )}

      {/* Download Icon */}
      {onDownload && generatedUrl && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          title="Download"
          style={baseButtonStyle}
          onMouseEnter={handleDownloadMouseEnter}
          onMouseLeave={handleDownloadMouseLeave}
        >
          <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      )}

      {/* Duplicate Icon */}
      {onDuplicate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Duplicate"
          style={baseButtonStyle}
          onMouseEnter={handleDuplicateMouseEnter}
          onMouseLeave={handleDuplicateMouseLeave}
        >
          {DuplicateIcon}
        </button>
      )}
    </div>
  );
};

