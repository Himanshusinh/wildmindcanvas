'use client';

interface VideoModalTooltipProps {
  isHovered: boolean;
  isUploadedVideo: boolean;
  videoResolution: { width: number; height: number } | null;
  scale: number;
}

export const VideoModalTooltip: React.FC<VideoModalTooltipProps> = ({
  isHovered,
  isUploadedVideo,
  videoResolution,
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
        pointerEvents: 'none',
        zIndex: 3000,
        boxShadow: 'none',
        transform: 'translateY(0)',
        opacity: 1,
      }}
    >
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span>{isUploadedVideo ? 'Media' : 'Video Generator'}</span>
        {videoResolution && (
          <span style={{ marginLeft: 'auto', opacity: 0.7, fontWeight: '500' }}>
            {videoResolution.width} × {videoResolution.height}
          </span>
        )}
      </span>
    </div>
  );
};

