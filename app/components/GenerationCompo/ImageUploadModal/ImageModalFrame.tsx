'use client';
import { useRef } from 'react';
import FrameSpinner from '@/app/components/common/FrameSpinner';

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
}) => {
  const frameBorderColor = isSelected ? '#437eb5' : 'rgba(0, 0, 0, 0.3)';
  const frameBorderWidth = 2;

  return (
    <div
      data-frame-id={id ? `${id}-frame` : undefined}
      onClick={(e) => {
        // Ensure selection works when clicking on frame
        if (onSelect && !e.defaultPrevented) {
          onSelect();
        }
      }}
      style={{
        width: `${600 * scale}px`,
        maxWidth: '90vw',
        aspectRatio: getAspectRatio(displayAspectRatio),
        minHeight: `${400 * scale}px`,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: (isHovered || isPinned) && !isUploadedImage ? '0px' : `${16 * scale}px`,
        // keep top/left/right borders, but remove bottom border when controls are hovered (only for generated images)
        borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderBottom: (isHovered || isPinned) && !isUploadedImage ? 'none' : `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDraggingContainer ? 'grabbing' : 'grab',
        overflow: 'visible',
        position: 'relative',
        zIndex: 1,
        transition: 'border 0.18s ease',
      }}
    >
      {generatedImageUrl ? (
        <img
          src={generatedImageUrl}
          alt="Generated"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            borderRadius: (isHovered || isPinned) && !isUploadedImage ? '0px' : `${16 * scale}px`,
          }}
          draggable={false}
        />
      ) : (
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
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

