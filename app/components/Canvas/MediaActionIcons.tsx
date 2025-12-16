'use client';

import { useEffect, useState } from 'react';
import { ImageUpload } from '@/types/canvas';

interface MediaActionIconsProps {
  selectedImage: ImageUpload;
  selectedImageIndex: number;
  scale: number;
  position: { x: number; y: number };
  onImageDelete?: (index: number) => void;
  onImageDuplicate?: (index: number) => void;
  setSelectedImageIndex: (index: number | null) => void;
  setSelectedImageIndices: (indices: number[]) => void;
}

export const MediaActionIcons: React.FC<MediaActionIconsProps> = ({
  selectedImage,
  selectedImageIndex,
  scale,
  position,
  onImageDelete,
  onImageDuplicate,
  setSelectedImageIndex,
  setSelectedImageIndices,
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

  const imgX = selectedImage.x || 0;
  const imgY = selectedImage.y || 0;
  const imgWidth = selectedImage.width || 100;
  const screenX = imgX * scale + position.x;
  const screenY = imgY * scale + position.y;
  const screenWidth = imgWidth * scale;

  const bgColor = isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = isDark ? '#cccccc' : '#4b5563';
  const shadowColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)';

  return (
    <div
      key={`media-icons-${selectedImageIndex}`}
      style={{
        position: 'absolute',
        left: `${screenX + screenWidth}px`,
        top: `${screenY}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${6 * scale}px`,
        zIndex: 3001,
        pointerEvents: 'auto',
        marginLeft: `${6 * scale}px`,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Delete Icon */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onImageDelete) {
            onImageDelete(selectedImageIndex);
          }
          setSelectedImageIndex(null);
          setSelectedImageIndices([]);
        }}
        title="Delete"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: `${28 * scale}px`,
          height: `${28 * scale}px`,
          padding: 0,
          backgroundColor: bgColor,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${borderColor}`,
          borderRadius: `${8 * scale}px`,
          color: textColor,
          cursor: 'pointer',
          transition: 'none',
          boxShadow: `0 ${4 * scale}px ${12 * scale}px ${shadowColor}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
          e.currentTarget.style.color = '#ef4444';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = bgColor;
          e.currentTarget.style.color = textColor;
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>

      {/* Download Icon */}
      {selectedImage.url && (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const response = await fetch(selectedImage.url!);
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              const extension = selectedImage.type === 'video' ? 'mp4' : 'png';
              link.download = `media-${selectedImageIndex}-${Date.now()}.${extension}`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            } catch (error) {
              console.error('Failed to download media:', error);
              const link = document.createElement('a');
              link.href = selectedImage.url!;
              const extension = selectedImage.type === 'video' ? 'mp4' : 'png';
              link.download = `media-${selectedImageIndex}-${Date.now()}.${extension}`;
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }}
          title="Download"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: `${28 * scale}px`,
            height: `${28 * scale}px`,
            padding: 0,
            backgroundColor: bgColor,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${borderColor}`,
            borderRadius: `${8 * scale}px`,
            color: textColor,
            cursor: 'pointer',
            transition: 'none',
            boxShadow: `0 ${4 * scale}px ${12 * scale}px ${shadowColor}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
            e.currentTarget.style.color = isDark ? '#60a5fa' : '#3b82f6';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = bgColor;
            e.currentTarget.style.color = textColor;
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      )}

      {/* Duplicate Icon */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onImageDuplicate) {
            onImageDuplicate(selectedImageIndex);
          }
        }}
        title="Duplicate"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: `${28 * scale}px`,
          height: `${28 * scale}px`,
          padding: 0,
          backgroundColor: bgColor,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${borderColor}`,
          borderRadius: `${8 * scale}px`,
          color: textColor,
          cursor: 'pointer',
          transition: 'none',
          boxShadow: `0 ${4 * scale}px ${12 * scale}px ${shadowColor}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
          e.currentTarget.style.color = '#22c55e';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = bgColor;
          e.currentTarget.style.color = textColor;
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>
    </div>
  );
};

