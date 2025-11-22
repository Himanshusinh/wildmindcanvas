'use client';

interface MusicModalTooltipProps {
  isHovered: boolean;
  scale: number;
}

export const MusicModalTooltip: React.FC<MusicModalTooltipProps> = ({
  isHovered,
  scale,
}) => {
  if (!isHovered) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${-32 * scale}px`,
        left: 0,
        width: `${600 * scale}px`,
        maxWidth: '90vw',
        padding: `${6 * scale}px ${12 * scale}px`,
        backgroundColor: '#f0f2f5',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: '#1f2937',
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
      }}
    >
      Music Generator
    </div>
  );
};

