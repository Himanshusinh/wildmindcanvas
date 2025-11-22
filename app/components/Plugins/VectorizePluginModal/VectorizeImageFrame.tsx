'use client';

import React from 'react';
import { ConnectionNodes } from '../UpscalePluginModal/ConnectionNodes';

interface VectorizeImageFrameProps {
  id: string | undefined;
  scale: number;
  frameBorderColor: string;
  frameBorderWidth: number;
  isVectorizedImage: boolean;
  isDraggingContainer: boolean;
  isHovered: boolean;
  isSelected: boolean;
  sourceImageUrl: string | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onSelect?: () => void;
}

export const VectorizeImageFrame: React.FC<VectorizeImageFrameProps> = ({
  id,
  scale,
  frameBorderColor,
  frameBorderWidth,
  isVectorizedImage,
  isDraggingContainer,
  isHovered,
  isSelected,
  sourceImageUrl,
  onMouseDown,
  onSelect,
}) => {
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
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: isVectorizedImage ? `${16 * scale}px` : `0 0 ${16 * scale}px ${16 * scale}px`,
        border: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDraggingContainer ? 'grabbing' : 'grab',
        overflow: 'visible',
        position: 'relative',
        zIndex: 1,
        transition: 'border 0.18s ease',
        padding: `${16 * scale}px`,
      }}
    >
      {sourceImageUrl ? (
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
      ) : (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: `${20 * scale}px` }}>
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
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <p style={{ fontSize: `${12 * scale}px`, margin: 0, opacity: 0.6 }}>Connect an image to vectorize</p>
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

