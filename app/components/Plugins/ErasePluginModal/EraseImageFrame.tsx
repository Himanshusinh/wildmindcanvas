'use client';

import React from 'react';
import { PluginConnectionNodes } from '../PluginComponents';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface EraseImageFrameProps {
  id: string | undefined;
  scale: number;
  frameBorderColor: string;
  frameBorderWidth: number;
  isErasedImage: boolean;
  isDraggingContainer: boolean;
  isHovered: boolean;
  isSelected: boolean;
  sourceImageUrl: string | null;
  onMouseDown: (e: React.MouseEvent) => void;
  onSelect?: () => void;
}

export const EraseImageFrame: React.FC<EraseImageFrameProps> = ({
  id,
  scale,
  frameBorderColor,
  frameBorderWidth,
  isErasedImage,
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
        backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: isErasedImage ? `${16 * scale}px` : `0 0 ${16 * scale}px ${16 * scale}px`,
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
      }}
    >
      {sourceImageUrl && (
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
      )}

      <PluginConnectionNodes
        id={id}
        scale={scale}
        isHovered={isHovered}
        isSelected={isSelected}
      />
    </div>
  );
};

