'use client';
import React, { useRef, useState, useEffect } from 'react';
import FrameSpinner from '@/app/components/common/FrameSpinner';

interface VideoModalFrameProps {
  id?: string;
  scale: number;
  selectedAspectRatio: string;
  isHovered: boolean;
  isPinned: boolean;
  isUploadedVideo: boolean;
  isSelected: boolean;
  isDraggingContainer: boolean;
  generatedVideoUrl?: string | null;
  isGenerating: boolean;
  frameBorderColor: string;
  frameBorderWidth: number;
  onSelect?: () => void;
  getAspectRatio: (ratio: string) => string;
  onSetIsPinned: (pinned: boolean) => void;
}

export const VideoModalFrame: React.FC<VideoModalFrameProps> = ({
  id,
  scale,
  selectedAspectRatio,
  isHovered,
  isPinned,
  isUploadedVideo,
  isSelected,
  isDraggingContainer,
  generatedVideoUrl,
  isGenerating,
  frameBorderColor,
  frameBorderWidth,
  onSelect,
  getAspectRatio,
  onSetIsPinned,
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

  const imageAreaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wasJustPlayed, setWasJustPlayed] = useState(false);

  const frameBg = isDark ? '#121212' : '#ffffff';
  const placeholderColor = isDark ? '#666666' : '#9ca3af';
  const pinBg = isDark ? (isPinned ? 'rgba(67, 126, 181, 0.2)' : 'rgba(0, 0, 0, 0.9)') : (isPinned ? 'rgba(67, 126, 181, 0.2)' : 'rgba(255, 255, 255, 0.9)');
  const pinBorder = isDark ? (isPinned ? '#437eb5' : 'rgba(255, 255, 255, 0.15)') : (isPinned ? '#437eb5' : 'rgba(0, 0, 0, 0.1)');
  const pinIconColor = isDark ? (isPinned ? '#437eb5' : '#cccccc') : (isPinned ? '#437eb5' : '#4b5563');

  useEffect(() => {
    if (wasJustPlayed) {
      const t = setTimeout(() => setWasJustPlayed(false), 400);
      return () => clearTimeout(t);
    }
  }, [wasJustPlayed]);

  return (
    <div
      ref={imageAreaRef}
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
        aspectRatio: getAspectRatio(selectedAspectRatio),
        minHeight: `${400 * scale}px`,
        backgroundColor: frameBg,
        borderRadius: (isHovered || isPinned) && !isUploadedVideo ? '0px' : `${16 * scale}px`,
        borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderBottom: (isHovered || isPinned) && !isUploadedVideo ? 'none' : `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        transition: 'border 0.18s ease, background-color 0.3s ease',
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDraggingContainer ? 'grabbing' : 'grab',
        overflow: 'visible',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {generatedVideoUrl ? (
        <>
          <video
            ref={videoRef}
            src={generatedVideoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: (isHovered || isPinned) && !isUploadedVideo ? '0px' : `${16 * scale}px`,
            }}
            onEnded={() => {
              setIsPlaying(false);
            }}
          />
          {/* Center Play/Pause Button with fade logic */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!videoRef.current) return;
              if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
              } else {
                videoRef.current.play().catch(() => {});
                setIsPlaying(true);
                setWasJustPlayed(true);
              }
            }}
            title={isPlaying ? 'Pause' : 'Play'}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: isPlaying ? '60px' : '72px',
              height: isPlaying ? '60px' : '72px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.55)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              transition: 'opacity 0.35s ease, background-color 0.25s, transform 0.25s',
              zIndex: 5,
              opacity: !isPlaying || (isPlaying && !wasJustPlayed && isHovered) ? 1 : 0,
              pointerEvents: !isPlaying || (isPlaying && !wasJustPlayed && isHovered) ? 'auto' : 'none'
            }}
            onMouseEnter={(e) => {
              if (isPlaying) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.75)';
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.55)';
              e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
            }}
          >
            {isPlaying ? (
              <svg width={28 * scale} height={28 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width={32 * scale} height={32 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>
        </>
      ) : (
        <div style={{ textAlign: 'center', color: placeholderColor, transition: 'color 0.3s ease' }}>
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
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </div>
      )}
      {isGenerating && (
        <FrameSpinner scale={scale} label="Generating video…" />
      )}
      {/* Pin Icon Button - Bottom Right (only for generated videos, not uploaded) */}
      {!isUploadedVideo && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetIsPinned(!isPinned);
          }}
          style={{
            position: 'absolute',
            bottom: `${8 * scale}px`,
            right: `${8 * scale}px`,
            width: `${28 * scale}px`,
            height: `${28 * scale}px`,
            borderRadius: `${6 * scale}px`,
            backgroundColor: pinBg,
            border: `1px solid ${pinBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.18s ease, background-color 0.3s ease, border-color 0.3s ease',
            pointerEvents: 'auto',
            boxShadow: isPinned ? `0 ${2 * scale}px ${8 * scale}px rgba(67, 126, 181, 0.3)` : 'none',
          }}
          onMouseEnter={(e) => {
            if (!isPinned) {
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPinned) {
              e.currentTarget.style.backgroundColor = pinBg;
            }
          }}
          title={isPinned ? 'Unpin controls' : 'Pin controls'}
        >
          <svg
            width={16 * scale}
            height={16 * scale}
            viewBox="0 0 24 24"
            fill={isPinned ? '#437eb5' : 'none'}
            stroke={pinIconColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 17v5M9 10V7a3 3 0 0 1 6 0v3M5 10h14l-1 7H6l-1-7z" />
          </svg>
        </button>
      )}
    </div>
  );
};

