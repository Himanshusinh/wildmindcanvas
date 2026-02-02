'use client';
import { useRef, useEffect, useState } from 'react';
import FrameSpinner from '@/modules/ui-global/common/FrameSpinner';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';

interface ImageModalFrameProps {
  id?: string;
  scale: number;
  displayAspectRatio: string;
  isHovered: boolean;
  isPinned: boolean;
  isUploadedImage: boolean;
  isSelected: boolean;
  isDraggingContainer: boolean;
  generatedImageUrl?: string | null;
  isGenerating: boolean;
  externalIsGenerating?: boolean;
  onSelect?: () => void;
  getAspectRatio: (ratio: string) => string;
  width?: number;
  height?: number;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const ImageModalFrame: React.FC<ImageModalFrameProps> = ({
  id,
  scale,
  displayAspectRatio,
  isHovered,
  isPinned,
  isUploadedImage,
  isSelected,
  isDraggingContainer,
  generatedImageUrl,
  isGenerating,
  externalIsGenerating,
  onSelect,
  getAspectRatio,
  width,
  height,
  onContextMenu,
}) => {
  const isDark = useIsDarkTheme();

  const frameBorderColor = isSelected
    ? SELECTION_COLOR
    : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
  const frameBorderWidth = 2;
  const frameBg = isDark ? '#121212' : '#ffffff';
  const placeholderColor = isDark ? '#666666' : '#9ca3af';

  // Use props width/height if available, otherwise fallback to default behavior
  // Note: if width/height are provided, we use them directly.
  // Otherwise we default to 600 width and use aspect ratio for height.
  const finalWidth = width || 600;

  return (
    <div
      data-frame-id={id ? `${id}-frame` : undefined}
      onContextMenu={onContextMenu}
      onClick={(e) => {
        // Ensure selection works when clicking on frame
        if (onSelect && !e.defaultPrevented) {
          onSelect();
        }
      }}
      style={{
        width: `${finalWidth * scale}px`,
        maxWidth: '90vw',
        aspectRatio: width && height ? undefined : getAspectRatio(displayAspectRatio),
        height: height ? `${height * scale}px` : undefined,
        minHeight: `${(height || 400) * scale}px`,
        backgroundColor: frameBg,
        borderRadius: ((isHovered || isPinned) && !isUploadedImage) ? '0px' : `${20 * scale}px`,
        // keep top/left/right borders, but remove bottom border when controls are hovered (only for generated images)
        borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderBottom: ((isHovered || isPinned) && !isUploadedImage) ? 'none' : `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDraggingContainer ? 'grabbing' : 'grab',
        overflow: 'visible',
        position: 'relative',
        zIndex: 1,
        transition: 'border 0.18s ease, background-color 0.3s ease',
        willChange: isDraggingContainer ? 'transform' : 'auto', // Optimize for movement
        transform: 'translateZ(0)', // Force hardware acceleration
      }}
    >
      {generatedImageUrl ? (
        <img
          src={(() => {
            // Use proxy to ensure CORS success for all external images
            const { buildProxyThumbnailUrl, buildProxyResourceUrl } = require('@/core/api/proxyUtils');
            if (generatedImageUrl.startsWith('blob:') || generatedImageUrl.startsWith('data:') || generatedImageUrl.includes('/api/proxy/')) {
              return generatedImageUrl;
            }
            // For Zata URLs, use thumbnail proxy with AVIF format for optimized display
            if (generatedImageUrl.includes('zata.ai') || generatedImageUrl.includes('zata')) {
              return buildProxyThumbnailUrl(generatedImageUrl, 2048, 85, 'avif');
            }
            // For other external URLs, use resource proxy to ensure CORS headers
            return buildProxyResourceUrl(generatedImageUrl);
          })()}
          alt="Generated"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'auto',
            borderRadius: ((isHovered || isPinned) && !isUploadedImage) ? '0px' : `${17 * scale}px`,
            cursor: 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          draggable={false}
        />
      ) : (
        <div style={{ textAlign: 'center', color: placeholderColor, transition: 'color 0.3s ease' }}>
          <svg
            width={64 * scale}
            height={64 * scale}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ margin: '0 auto 16px', opacity: 0.3 }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      )}
      {(isGenerating || externalIsGenerating) && !generatedImageUrl && (
        <FrameSpinner scale={scale} label="Generating image…" />
      )}
    </div>
  );
};

