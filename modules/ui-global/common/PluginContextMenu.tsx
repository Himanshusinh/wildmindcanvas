import React, { useEffect, useRef } from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

interface PluginContextMenuProps {
    x: number;
    y: number;
    onDuplicate?: () => void;
    onDelete?: () => void;
    onDownload?: () => void;
    onPin?: () => void;
    isPinned?: boolean;
    onClose: () => void;
}

export const PluginContextMenu: React.FC<PluginContextMenuProps> = ({
    x,
    y,
    onDuplicate,
    onDelete,
    onDownload,
    onPin,
    isPinned,
    onClose,
}) => {
    const isDark = useIsDarkTheme();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const buttonStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        background: 'transparent',
        color: isDark ? '#e5e7eb' : '#374151',
        cursor: 'pointer',
        fontSize: '14px',
        textAlign: 'left',
        transition: 'background-color 0.2s',
    };

    const hoverStyle = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6';
    };

    const unhoverStyle = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.backgroundColor = 'transparent';
    };

    return (
        <div
            ref={menuRef}
            style={{
                position: 'fixed',
                top: y,
                left: x,
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '6px',
                zIndex: 9999,
                minWidth: '120px',
                padding: '4px',
            }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
        >
            {onDownload && (
                <button
                    style={buttonStyle}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={unhoverStyle}
                    onClick={() => {
                        onDownload();
                        onClose();
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginRight: '8px' }}
                    >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                </button>
            )}
            {onPin && (
                <button
                    style={buttonStyle}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={unhoverStyle}
                    onClick={() => {
                        onPin();
                        onClose();
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={isPinned ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginRight: '8px' }}
                    >
                        <line x1="12" y1="17" x2="12" y2="22" />
                        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                    </svg>
                    {isPinned ? 'Unpin' : 'Pin'}
                </button>
            )}
            {onDuplicate && (
                <button
                    style={buttonStyle}
                    onMouseEnter={hoverStyle}
                    onMouseLeave={unhoverStyle}
                    onClick={() => {
                        onDuplicate();
                        onClose();
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginRight: '8px' }}
                    >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Duplicate
                </button>
            )}
            {onDelete && (
                <button
                    style={{ ...buttonStyle, color: '#ef4444' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#fee2e2'}
                    onMouseLeave={unhoverStyle}
                    onClick={() => {
                        onDelete();
                        onClose();
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginRight: '8px' }}
                    >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete
                </button>
            )}
        </div>
    );
};
