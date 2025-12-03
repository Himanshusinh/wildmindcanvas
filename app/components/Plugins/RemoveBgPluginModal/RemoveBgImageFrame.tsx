'use client';

import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { ConnectionNodes } from '../UpscalePluginModal/ConnectionNodes';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface RemoveBgImageFrameProps {
  id: string | undefined;
  scale: number;
  frameBorderColor: string;
  frameBorderWidth: number;
  isRemovedBgImage: boolean;
  isDraggingContainer: boolean;
  isHovered: boolean;
  isSelected: boolean;
  sourceImageUrl: string | null;
  localRemovedBgImageUrl?: string | null;
  onPreview?: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onSelect?: () => void;
}

export const RemoveBgImageFrame: React.FC<RemoveBgImageFrameProps> = ({
  id,
  scale,
  frameBorderColor,
  frameBorderWidth,
  isRemovedBgImage,
  isDraggingContainer,
  isHovered,
  isSelected,
  sourceImageUrl,
  localRemovedBgImageUrl,
  onPreview,
  onMouseDown,
  onSelect,
}) => {
  const isDark = useIsDarkTheme();

  return (
    <div
      data-frame-id={id ? `${id}-frame` : undefined}
      onMouseDown={(e) => {
        // Allow dragging from the frame, but not from slider
        if (e.button === 0 && !e.defaultPrevented) {
          const target = e.target as HTMLElement;
          const isImage = target.tagName === 'IMG';
          const isNode = target.closest('[data-node-id]');
          const isButton = target.closest('button');
          if (!isImage && !isNode && !isButton) {
            onMouseDown(e as any);
          }
        }
      }}
      onClick={(e) => {
        // Ensure selection works when clicking on frame
        if (onSelect && !e.defaultPrevented) {
          onSelect();
        }
      }}
      style={{
        width: `${400 * scale}px`,
        maxWidth: '90vw',
        minHeight: `${150 * scale}px`,
        maxHeight: `${400 * scale}px`,
        height: sourceImageUrl ? `${220 * scale}px` : 'auto',
        backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: isRemovedBgImage ? `${16 * scale}px` : `0 0 ${16 * scale}px ${16 * scale}px`,
        border: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDraggingContainer ? 'grabbing' : 'grab',
        overflow: 'visible',
        position: 'relative',
        zIndex: 1,
        transition: 'border 0.18s ease, background-color 0.3s ease',
        padding: `${16 * scale}px`,
        marginTop: `${-frameBorderWidth * scale}px`,
      }}
    >
      {sourceImageUrl ? (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <img
            src={sourceImageUrl}
            alt="Source"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
            draggable={false}
          />

          {/* Compare Button Overlay */}
          {localRemovedBgImageUrl && onPreview && (
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                zIndex: 10,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                title="Compare with original"
                style={{
                  width: `${36 * scale}px`,
                  height: `${36 * scale}px`,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(4px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ArrowLeftRight size={18 * scale} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: isDark ? '#666666' : '#9ca3af', padding: `${20 * scale}px`, transition: 'color 0.3s ease' }}>
          <svg
            width={48 * scale}
            height={48 * scale}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto 8px', opacity: 0.3 }}
          >
            <path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m6.66 6.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m6.66-6.66l4.24-4.24" />
          </svg>
          <p style={{ fontSize: `${12 * scale}px`, margin: 0, opacity: 0.6 }}>Connect an image to remove background</p>
        </div>
      )}

      <ConnectionNodes
        id={id}
        scale={scale}
        isHovered={isHovered}
        isSelected={isSelected}
      />
    </div>
  );
};

