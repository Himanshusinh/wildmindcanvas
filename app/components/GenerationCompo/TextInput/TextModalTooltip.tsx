'use client';

interface TextModalTooltipProps {
  isHovered: boolean;
  scale: number;
}

export const TextModalTooltip: React.FC<TextModalTooltipProps> = ({
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
        width: '100%',
        padding: `${6 * scale}px ${12 * scale}px`,
        backgroundColor: '#ffffff',
        color: '#1f2937',
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
      }}
    >
      AI Companion
    </div>
  );
};

