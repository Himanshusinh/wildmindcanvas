'use client';

import React, { useEffect, useState } from 'react';

interface ModalActionIconsProps {
  isSelected: boolean;
  scale: number;
  generatedUrl?: string | null; // For download button visibility (image/video/music URL)
  onDelete?: () => void;
  onDownload?: () => void;
  onDuplicate?: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onCopy?: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
  editActive?: boolean;
  variant?: 'default' | 'text'; // 'text' variant has different styling (no backdrop blur)
}

export const ModalActionIcons: React.FC<ModalActionIconsProps> = ({
  isSelected,
  scale,
  generatedUrl,
  onDelete,
  onDownload,
  onDuplicate,
  isPinned = false,
  onTogglePin,
  onCopy,
  onEdit,
  onRegenerate,
  editActive = false,
  variant = 'default',
}) => {
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

  if (!isSelected) return null;

  const isTextVariant = variant === 'text';
  const bgColor = isDark
    ? (isTextVariant ? '#121212' : 'rgba(18, 18, 18, 0.95)')
    : (isTextVariant ? '#ffffff' : 'rgba(255, 255, 255, 0.95)');
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = isDark ? '#cccccc' : '#4b5563';
  const shadowColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)';

  const baseButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${28 * scale}px`,
    height: `${28 * scale}px`,
    padding: 0,
    backgroundColor: 'transparent',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    border: 'none',
    borderRadius: `${8 * scale}px`,
    color: textColor,
    cursor: 'pointer',
    transition: 'none',
    boxShadow: 'none',
    flexShrink: 0,
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
    const defaultBg = isDark
      ? (isTextVariant ? '#121212' : 'rgba(18, 18, 18, 0.95)')
      : (isTextVariant ? '#ffffff' : 'rgba(255, 255, 255, 0.95)');
    const defaultColor = isDark ? '#cccccc' : '#4b5563';
    const defaultShadow = isDark ? `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`;

    if (isTextVariant) {
      e.currentTarget.style.backgroundColor = defaultBg;
      e.currentTarget.style.color = defaultColor;
      e.currentTarget.style.boxShadow = defaultShadow;
    } else {
      e.currentTarget.style.backgroundColor = defaultBg;
      e.currentTarget.style.color = defaultColor;
      e.currentTarget.style.transform = 'scale(1)';
    }
  };

  const handleDownloadMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
    e.currentTarget.style.color = isDark ? '#60a5fa' : '#3b82f6';
    if (!isTextVariant) {
      e.currentTarget.style.transform = 'scale(1.1)';
    }
  };

  const handleDownloadMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const defaultBg = isDark
      ? (isTextVariant ? '#121212' : 'rgba(18, 18, 18, 0.95)')
      : (isTextVariant ? '#ffffff' : 'rgba(255, 255, 255, 0.95)');
    const defaultColor = isDark ? '#cccccc' : '#4b5563';

    e.currentTarget.style.backgroundColor = defaultBg;
    e.currentTarget.style.color = defaultColor;
    if (!isTextVariant) {
      e.currentTarget.style.transform = 'scale(1)';
    }
  };

  const handleDuplicateMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isTextVariant) {
      e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.12)';
      e.currentTarget.style.color = isDark ? '#60a5fa' : '#1e40af';
      e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${14 * scale}px rgba(59,130,246,0.12)`;
    } else {
      e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
      e.currentTarget.style.color = '#22c55e';
      e.currentTarget.style.transform = 'scale(1.1)';
    }
  };

  const handleDuplicateMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const defaultBg = isDark
      ? (isTextVariant ? '#121212' : 'rgba(18, 18, 18, 0.95)')
      : (isTextVariant ? '#ffffff' : 'rgba(255, 255, 255, 0.95)');
    const defaultColor = isDark ? '#cccccc' : '#4b5563';
    const defaultShadow = isDark ? `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`;

    if (isTextVariant) {
      e.currentTarget.style.backgroundColor = defaultBg;
      e.currentTarget.style.color = defaultColor;
      e.currentTarget.style.boxShadow = defaultShadow;
    } else {
      e.currentTarget.style.backgroundColor = defaultBg;
      e.currentTarget.style.color = defaultColor;
      e.currentTarget.style.transform = 'scale(1)';
    }
  };

  const handlePinMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'rgba(67, 126, 181, 0.2)';
    e.currentTarget.style.color = '#437eb5';
    if (!isTextVariant) {
      e.currentTarget.style.transform = 'scale(1.1)';
    }
  };

  const handlePinMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const defaultBg = isPinned
      ? 'rgba(67, 126, 181, 0.2)'
      : (isDark
        ? (isTextVariant ? '#121212' : 'rgba(18, 18, 18, 0.95)')
        : (isTextVariant ? '#ffffff' : 'rgba(255, 255, 255, 0.95)'));
    const defaultColor = isPinned ? '#437eb5' : (isDark ? '#cccccc' : '#4b5563');
    e.currentTarget.style.backgroundColor = defaultBg;
    e.currentTarget.style.color = defaultColor;
    if (!isTextVariant) {
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

  const EditIcon = (
    <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );

  const CopyIcon = (
    <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="8" width="13" height="13" rx="2" ry="2" />
      <path d="M4 16V6a2 2 0 0 1 2-2h10" />
    </svg>
  );

  const PinIcon = (
    <svg
      width={16 * scale}
      height={16 * scale}
      viewBox="0 0 24 24"
      fill={isPinned ? '#437eb5' : 'none'}
      stroke={isPinned ? '#437eb5' : 'currentColor'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 17v5M9 10V7a3 3 0 0 1 6 0v3M5 10h14l-1 7H6l-1-7z" />
    </svg>
  );

  return (
    <div
      data-action-icons="true"
      style={{
        position: 'absolute',
        top: `${-72 * scale}px`, // Moved up significantly to clear tooltip
        left: '50%',
        transform: 'translateX(-50%)', // Center horizontally
        display: 'flex',
        flexDirection: 'row',
        gap: `${4 * scale}px`, // Reduced gap for bar feel
        padding: `${4 * scale}px`, // Inner padding
        zIndex: 3001,
        pointerEvents: 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? 'rgba(18, 18, 18, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: `${100 * scale}px`, // Capsule shape
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
        boxShadow: `0 ${4 * scale}px ${12 * scale}px ${isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)'}`,
      }}
      onMouseDown={(e) => {
        console.log('[ModalActionIcons] Container onMouseDown', {
          timestamp: Date.now(),
          target: e.target,
          currentTarget: e.currentTarget,
        });
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent) {
          e.nativeEvent.stopImmediatePropagation();
        }
      }}
      onClick={(e) => {
        console.log('[ModalActionIcons] Container onClick', {
          timestamp: Date.now(),
          target: e.target,
          currentTarget: e.currentTarget,
        });
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent) {
          e.nativeEvent.stopImmediatePropagation();
        }
      }}
    >
      {/* Regenerate Icon */}
      {onRegenerate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRegenerate();
          }}
          title="Regenerate"
          style={baseButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)';
            e.currentTarget.style.color = '#a855f7';
            if (!isTextVariant) {
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            const defaultBg = isDark
              ? (isTextVariant ? '#121212' : 'rgba(18, 18, 18, 0.95)')
              : (isTextVariant ? '#ffffff' : 'rgba(255, 255, 255, 0.95)');
            const defaultColor = isDark ? '#cccccc' : '#4b5563';

            e.currentTarget.style.backgroundColor = defaultBg;
            e.currentTarget.style.color = defaultColor;
            if (!isTextVariant) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      )}

      {/* Delete Icon */}
      {onDelete && (
        <button
          onClick={(e) => {
            console.log('[ModalActionIcons] Delete button onClick triggered', {
              timestamp: Date.now(),
              target: e.target,
              currentTarget: e.currentTarget,
              eventPhase: e.eventPhase,
              bubbles: e.bubbles,
              defaultPrevented: e.defaultPrevented,
              isTrusted: e.isTrusted,
            });
            // Stop all event propagation immediately
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent) {
              e.nativeEvent.stopImmediatePropagation();
            }

            // Call delete immediately, don't defer
            console.log('[ModalActionIcons] Calling onDelete callback immediately');
            if (onDelete) {
              onDelete();
              console.log('[ModalActionIcons] onDelete callback completed');
            }
          }}
          onMouseDown={(e) => {
            console.log('[ModalActionIcons] Delete button onMouseDown triggered', {
              timestamp: Date.now(),
              target: e.target,
              currentTarget: e.currentTarget,
              button: e.button,
            });
            // Prevent default and stop propagation immediately
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent) {
              e.nativeEvent.stopImmediatePropagation();
            }
          }}
          onMouseUp={(e) => {
            console.log('[ModalActionIcons] Delete button onMouseUp triggered', {
              timestamp: Date.now(),
              target: e.target,
              currentTarget: e.currentTarget,
            });
            e.preventDefault();
            e.stopPropagation();
          }}
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

      {/* Pin Icon */}
      {onTogglePin && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent) {
              e.nativeEvent.stopImmediatePropagation();
            }
            onTogglePin();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent) {
              e.nativeEvent.stopImmediatePropagation();
            }
          }}
          title={isPinned ? 'Unpin controls' : 'Pin controls'}
          style={{
            ...baseButtonStyle,
            backgroundColor: isPinned ? 'rgba(67, 126, 181, 0.2)' : baseButtonStyle.backgroundColor,
            border: `1px solid ${isPinned ? '#437eb5' : borderColor}`,
            color: isPinned ? '#437eb5' : textColor,
          }}
          onMouseEnter={handlePinMouseEnter}
          onMouseLeave={handlePinMouseLeave}
        >
          {PinIcon}
        </button>
      )}

      {/* Copy Icon */}
      {onCopy && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent) {
              e.nativeEvent.stopImmediatePropagation();
            }
            onCopy();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(250, 204, 21, 0.15)';
            e.currentTarget.style.color = '#b45309';
            if (!isTextVariant) {
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            const defaultBg = isDark
              ? (isTextVariant ? '#121212' : 'rgba(18, 18, 18, 0.95)')
              : (isTextVariant ? '#ffffff' : 'rgba(255, 255, 255, 0.95)');
            const defaultColor = isDark ? '#cccccc' : '#4b5563';
            e.currentTarget.style.backgroundColor = defaultBg;
            e.currentTarget.style.color = defaultColor;
            if (!isTextVariant) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          style={{
            ...baseButtonStyle,
          }}
          title="Copy"
        >
          {CopyIcon}
        </button>
      )}
      {/* Edit Icon */}
      {onEdit && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent) {
              e.nativeEvent.stopImmediatePropagation();
            }
            onEdit();
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.2)';
            e.currentTarget.style.color = '#2563eb';
            if (!isTextVariant) {
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            const defaultBg = isDark
              ? (isTextVariant ? '#121212' : 'rgba(18, 18, 18, 0.95)')
              : (isTextVariant ? '#ffffff' : 'rgba(255, 255, 255, 0.95)');
            const defaultColor = isDark ? '#cccccc' : '#4b5563';
            e.currentTarget.style.backgroundColor = editActive ? 'rgba(37, 99, 235, 0.2)' : defaultBg;
            e.currentTarget.style.color = editActive ? '#2563eb' : defaultColor;
            if (!isTextVariant) {
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
          style={{
            ...baseButtonStyle,
            backgroundColor: editActive ? 'rgba(37, 99, 235, 0.2)' : (isDark ? (isTextVariant ? '#121212' : 'rgba(18, 18, 18, 0.95)') : (isTextVariant ? '#ffffff' : 'rgba(255, 255, 255, 0.95)')),
            color: editActive ? '#2563eb' : (isDark ? '#cccccc' : '#4b5563'),
            opacity: 1,
          }}
          title={editActive ? 'Close editor' : 'Edit'}
        >
          {EditIcon}
        </button>
      )}
    </div>
  );
};

