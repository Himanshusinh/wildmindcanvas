'use client';

import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

interface TextModalTooltipProps {
  isHovered: boolean;
  scale: number;
}

export const TextModalTooltip: React.FC<TextModalTooltipProps> = ({
  isHovered,
  scale,
}) => {
  const isDark = useIsDarkTheme();

  if (!isHovered) return null;

  const tooltipBg = isDark ? '#1a1a1a' : '#ffffff';
  const tooltipText = isDark ? '#ffffff' : '#1f2937';

  return (
    <div
      style={{
        position: 'absolute',
        top: `${-32 * scale}px`,
        left: 0,
        width: '100%',
        padding: `${6 * scale}px ${12 * scale}px`,
        backgroundColor: tooltipBg,
        color: tooltipText,
        fontSize: `${12 * scale}px`,
        fontWeight: '600',
        borderRadius: `${12 * scale}px ${12 * scale}px 0 0`,
        border: 'none',
        borderBottom: 'none',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 3000,
        boxShadow: 'none',
        transform: 'translateY(0)',
        opacity: 1,
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      AI Companion
    </div>
  );
};

