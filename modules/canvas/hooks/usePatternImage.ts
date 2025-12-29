
import { useState, useEffect } from 'react';
import { DOT_SPACING, DOT_SIZE, DOT_OPACITY } from '@/core/canvas/canvasHelpers';

export function usePatternImage() {
  const [patternImage, setPatternImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const createPattern = () => {
      if (typeof window === 'undefined') return;

      const isDark = document.documentElement.classList.contains('dark');
      const dotColor = isDark ? 'rgba(255, 255, 255, 0.15)' : `rgba(0, 0, 0, ${DOT_OPACITY})`;

      const spacing = DOT_SPACING || 30;
      const radius = (DOT_SIZE || 4) / 2;
      const center = spacing / 2;

      // Simple transparent SVG with one dot
      const svgString = `
        <svg width="${spacing}" height="${spacing}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${center}" cy="${center}" r="${radius}" fill="${dotColor}" />
        </svg>
      `.trim();

      const img = new Image();
      img.onload = () => {
        setPatternImage(img);
      };
      img.src = `data:image/svg+xml;base64,${btoa(svgString)}`;
    };

    if (typeof window !== 'undefined') {
      createPattern();
    }

    const observer = new MutationObserver(() => {
      setTimeout(createPattern, 50);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return patternImage;
}
