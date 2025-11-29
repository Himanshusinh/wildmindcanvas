'use client';

import { useEffect, useState } from 'react';

interface ImageModalTooltipProps {
  isHovered: boolean;
  isUploadedImage: boolean;
  imageResolution: { width: number; height: number } | null;
  scale: number;
}

export const ImageModalTooltip: React.FC<ImageModalTooltipProps> = ({
  isHovered,
  isUploadedImage,
  imageResolution,
  scale,
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

  if (!isHovered) return null;

  const tooltipBg = isDark ? '#1a1a1a' : '#ffffff';
  const tooltipText = isDark ? '#ffffff' : '#1f2937';

  return (
    <div
      style={{
        position: 'absolute',
        top: `${-32 * scale}px`,
        left: 0,
        width: `${600 * scale}px`,
        maxWidth: '90vw',
        padding: `${6 * scale}px ${12 * scale}px`,
        backgroundColor: tooltipBg,
        color: tooltipText,
        fontSize: `${12 * scale}px`,
        fontWeight: '600',
        borderRadius: `${16 * scale}px ${16 * scale}px 0 0`,
        border: 'none',
        pointerEvents: 'none',
        zIndex: 3000,
        boxShadow: 'none',
        transform: 'translateY(0)',
        opacity: 1,
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span>{isUploadedImage ? 'Media' : 'Image Generator'}</span>
        {imageResolution && (
          <span style={{ marginLeft: 'auto', opacity: 0.7, fontWeight: '500' }}>
            {imageResolution.width} × {imageResolution.height}
          </span>
        )}
      </span>
    </div>
  );
};

