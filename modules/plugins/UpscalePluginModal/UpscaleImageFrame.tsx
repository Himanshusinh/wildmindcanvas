'use client';

import React from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

interface UpscaleImageFrameProps {
  id: string | undefined;
  scale: number;
  frameBorderColor: string;
  frameBorderWidth: number;
  isUpscaledImage: boolean;
  isDraggingContainer: boolean;
  isHovered: boolean;
  isSelected: boolean;
  sourceImageUrl: string | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onSelect?: () => void;
}

export const UpscaleImageFrame: React.FC<UpscaleImageFrameProps> = ({
  id,
  scale,
  frameBorderColor,
  frameBorderWidth,
  isUpscaledImage,
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
        minHeight: `${180 * scale}px`,
        maxHeight: `${400 * scale}px`,
        height: sourceImageUrl ? `${240 * scale}px` : 'auto',
        backgroundColor: isDark ? 'rgba(23, 23, 23, 0.85)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        borderRadius: isUpscaledImage ? `${18 * scale}px` : `0 0 ${18 * scale}px ${18 * scale}px`,
        border: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 40px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDraggingContainer ? 'grabbing' : 'grab',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease',
        padding: `${12 * scale}px`,
        marginTop: `${-frameBorderWidth * scale}px`,
      }}
    >
      {sourceImageUrl ? (
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: `${8 * scale}px`,
          overflow: 'hidden',
          backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={(() => {
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
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
              transition: 'transform 0.5s ease',
            }}
            draggable={false}
          />
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: isDark ? '#888' : '#999', padding: `${20 * scale}px`, transition: 'color 0.3s ease' }}>
          <div style={{
            width: `${56 * scale}px`,
            height: `${56 * scale}px`,
            borderRadius: '50%',
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <svg
              width={24 * scale}
              height={24 * scale}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.5 }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <p style={{ fontSize: `${13 * scale}px`, fontWeight: 500, margin: 0, opacity: 0.7 }}>Connect source image</p>
          <p style={{ fontSize: `${11 * scale}px`, marginTop: `${4 * scale}px`, opacity: 0.4 }}>Drag connection to this frame</p>
        </div>
      )}

    </div>
  );
};

