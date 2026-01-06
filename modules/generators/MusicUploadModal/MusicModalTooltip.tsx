'use client';

import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

import { MusicCategory } from './MusicModalTabs';

interface MusicModalTooltipProps {
  isHovered: boolean;
  scale: number;
  activeCategory?: MusicCategory;
}

export const MusicModalTooltip: React.FC<MusicModalTooltipProps> = ({
  isHovered,
  scale,
  activeCategory,
}) => {
  const isDark = useIsDarkTheme();

  if (!isHovered) return null;

  const tooltipBg = isDark ? '#1a1a1a' : '#ffffff';
  const tooltipText = isDark ? '#ffffff' : '#1f2937';

  const categoryLabels: Record<string, string> = {
    music: 'Music',
    voice: 'Voice (TTS)',
    dialogue: 'Dialogue',
    sfx: 'SFX',
    'voice-cloning': 'Voice Cloning',
  };

  const categoryLabel = activeCategory ? categoryLabels[activeCategory] : null;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${-30 * scale}px`,
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
        borderBottom: 'none',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 3000,
        boxShadow: 'none',
        transform: 'translateY(0)',
        opacity: 1,
        transition: 'background-color 0s ease, color 0s ease',
      }}
    >
      Music Generation{categoryLabel ? ` > ${categoryLabel}` : ''}
    </div>
  );
};

