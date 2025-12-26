'use client';
import React, { useRef, useState, useEffect } from 'react';
import FrameSpinner from '@/app/components/common/FrameSpinner';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

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
}) => {
  const isDark = useIsDarkTheme();

  const imageAreaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wasJustPlayed, setWasJustPlayed] = useState(false);

  const frameBg = isDark ? '#121212' : '#ffffff';
  const placeholderColor = isDark ? '#666666' : '#9ca3af';

  useEffect(() => {
    if (wasJustPlayed) {
      const t = setTimeout(() => setWasJustPlayed(false), 400);
      return () => clearTimeout(t);
    }
  }, [wasJustPlayed]);

  // Pause video when dragging to improve performance
  // (Still useful to keep local state in sync)
  useEffect(() => {
    if (isDraggingContainer && isPlaying) {
      const videoEl = id ? (window as any).__CANVAS_VIDEOS_MAP?.[id] : null;
      if (videoEl) {
        videoEl.pause();
      }
      setIsPlaying(false);
    }
  }, [isDraggingContainer, isPlaying, id]);

  // Sync play state with the actual video element (since it lives in CanvasVideoNode now)
  useEffect(() => {
    const checkState = () => {
      const videoEl = id ? (window as any).__CANVAS_VIDEOS_MAP?.[id] : null;
      if (videoEl) {
        // If video state differs from our local state, update local state
        if (!videoEl.paused !== isPlaying) {
          setIsPlaying(!videoEl.paused);
        }
      }
    };

    // Check every 200ms
    const interval = setInterval(checkState, 200);
    return () => clearInterval(interval);
  }, [id, isPlaying]);

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
        backgroundColor: generatedVideoUrl ? 'transparent' : frameBg,
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
        willChange: isDraggingContainer ? 'transform' : 'auto', // Optimize for movement
        transform: 'translateZ(0)', // Force hardware acceleration
      }}
    >
      {generatedVideoUrl ? (
        <>
          {/* Video is now rendered by CanvasVideoNode in Konva Layer */}
          {/* We only render the play button here */}

          {/* Center Play/Pause Button with fade logic */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const videoEl = id ? (window as any).__CANVAS_VIDEOS_MAP?.[id] : null;

              if (isPlaying) {
                if (videoEl) videoEl.pause();
                setIsPlaying(false);
              } else {
                if (videoEl) {
                  videoEl.play().catch(() => { });
                  setIsPlaying(true);
                  setWasJustPlayed(true);
                }
              }
            }}
            title={isPlaying ? 'Pause' : 'Play'}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: `${(isPlaying ? 60 : 72) * scale}px`,
              height: `${(isPlaying ? 60 : 72) * scale}px`,
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
              pointerEvents: !isPlaying || (isPlaying && !wasJustPlayed && isHovered) ? 'auto' : 'none',
              willChange: 'opacity, transform',
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
    </div>
  );
};

