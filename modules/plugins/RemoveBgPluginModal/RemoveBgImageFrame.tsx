'use client';

import React from 'react';

import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

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
          if (!isImage && !isNode) {
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
        <img
          src={(() => {
            // Use AVIF format for preview display (performance)
            // Original URL is still used for processing via useConnectedSourceImage hook

            // Check if it's a Zata URL (direct or proxy)
            const isZataUrl = sourceImageUrl.includes('zata.ai') ||
              sourceImageUrl.includes('zata') ||
              sourceImageUrl.includes('/api/proxy/') ||
              sourceImageUrl.includes('users%2F') ||
              sourceImageUrl.includes('canvas%2F');

            if (isZataUrl && !sourceImageUrl.includes('fmt=avif')) {
              const { buildProxyThumbnailUrl } = require('@/core/api/proxyUtils');
              return buildProxyThumbnailUrl(sourceImageUrl, 2048, 85, 'avif');
            }
            return sourceImageUrl;
          })()}
          alt="Source"
          onDragStart={(e) => {
            if (sourceImageUrl) {
              e.dataTransfer.setData('text/plain', sourceImageUrl);
              e.dataTransfer.setData('application/json', JSON.stringify({
                url: sourceImageUrl,
                type: 'uploaded',
                id: `drop-${Date.now()}`
              }));
              e.dataTransfer.dropEffect = 'copy';
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'auto',
            cursor: 'grab',
          }}
          draggable={true}
        />
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


    </div>
  );
};

