'use client';

import React from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

interface MultiangleCameraImageFrameProps {
  id: string | undefined;
  scale: number;
  frameBorderColor: string;
  frameBorderWidth: number;
  isDraggingContainer: boolean;
  isHovered: boolean;
  isSelected: boolean;
  sourceImageUrl: string | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onSelect?: () => void;
  /** When true, frame fills its parent container (for full-screen popup preview) */
  fillContainer?: boolean;
}

export const MultiangleCameraImageFrame: React.FC<MultiangleCameraImageFrameProps> = ({
  id,
  scale,
  frameBorderColor,
  frameBorderWidth,
  isDraggingContainer,
  isHovered,
  isSelected,
  sourceImageUrl,
  onMouseDown,
  onSelect,
  fillContainer = false,
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
        width: fillContainer ? '100%' : `400px`,
        maxWidth: fillContainer ? '100%' : '90vw',
        minHeight: fillContainer ? '100%' : `150px`,
        maxHeight: fillContainer ? '100%' : `400px`,
        height: fillContainer ? '100%' : (sourceImageUrl ? `220px` : 'auto'),
        backgroundColor: fillContainer ? 'transparent' : (isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)'),
        backdropFilter: fillContainer ? undefined : 'blur(20px)',
        WebkitBackdropFilter: fillContainer ? undefined : 'blur(20px)',
        borderRadius: fillContainer ? `12px` : `0 0 16px 16px`,
        border: fillContainer ? 'none' : `${frameBorderWidth}px solid ${frameBorderColor}`,
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDraggingContainer ? 'grabbing' : 'grab',
        overflow: 'visible',
        position: 'relative',
        zIndex: 1,
        transition: 'border 0.18s ease, background-color 0.3s ease',
        padding: fillContainer ? 0 : `16px`,
        marginTop: fillContainer ? 0 : `${-frameBorderWidth}px`,
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
        <div style={{ textAlign: 'center', color: isDark ? '#666666' : '#9ca3af', padding: `20px`, transition: 'color 0.3s ease' }}>
          <svg
            width={48}
            height={48}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto 8px', opacity: 0.3 }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p style={{ fontSize: `12px`, margin: 0, opacity: 0.6 }}>Connect an image to preview</p>
        </div>
      )}
    </div>
  );
};
