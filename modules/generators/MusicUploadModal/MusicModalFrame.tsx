'use client';
import React, { useRef, useState, useEffect } from 'react';
import FrameSpinner from '@/modules/ui-global/common/FrameSpinner';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

interface MusicModalFrameProps {
  id?: string;
  scale: number;
  selectedAspectRatio: string;
  isHovered: boolean;
  isPinned: boolean;
  isSelected: boolean;
  isDraggingContainer: boolean;
  generatedMusicUrl?: string | null;
  isGenerating: boolean;
  frameBorderColor: string;
  frameBorderWidth: number;
  onSelect?: () => void;
  getAspectRatio: (ratio: string) => string;
  onSetIsPinned: (pinned: boolean) => void;
}

export const MusicModalFrame: React.FC<MusicModalFrameProps> = ({
  id,
  scale,
  selectedAspectRatio,
  isHovered,
  isPinned,
  isSelected,
  isDraggingContainer,
  generatedMusicUrl,
  isGenerating,
  frameBorderColor,
  frameBorderWidth,
  onSelect,
  getAspectRatio,
  onSetIsPinned,
}) => {
  const isDark = useIsDarkTheme();

  const musicAreaRef = useRef<HTMLDivElement>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);

  const frameBg = isDark ? '#121212' : '#ffffff';
  const placeholderColor = isDark ? '#666666' : '#9ca3af';
  const progressBg = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const timeColor = isDark ? (generatedMusicUrl ? '#cccccc' : '#666666') : (generatedMusicUrl ? '#6b7280' : '#9ca3af');
  const pinBg = isDark ? (isPinned ? 'rgba(67, 126, 181, 0.2)' : 'rgba(0, 0, 0, 0.9)') : (isPinned ? 'rgba(67, 126, 181, 0.2)' : 'rgba(255, 255, 255, 0.9)');
  const pinBorder = isDark ? (isPinned ? '#437eb5' : 'rgba(255, 255, 255, 0.15)') : (isPinned ? '#437eb5' : 'rgba(0, 0, 0, 0.1)');
  const pinIconColor = isDark ? (isPinned ? '#437eb5' : '#cccccc') : (isPinned ? '#437eb5' : '#4b5563');
  const handleBg = isDark ? '#121212' : '#ffffff';

  useEffect(() => {
    if (generatedMusicUrl && audioElementRef.current) {
      audioElementRef.current.load(); // Reload audio to show new source
    }
  }, [generatedMusicUrl]);

  // Update time and duration
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isDraggingProgress) {
        setCurrentTime(audio.currentTime);
      }
    };

    const updateDuration = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [generatedMusicUrl, isDraggingProgress]);

  const handlePlayPause = () => {
    if (audioElementRef.current) {
      if (audioElementRef.current.paused) {
        audioElementRef.current.play();
        setIsPlaying(true);
      } else {
        audioElementRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Format time helper
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioElementRef.current || !progressBarRef.current || !duration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = progress * duration;

    audioElementRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle progress bar drag
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingProgress(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDraggingProgress) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!audioElementRef.current || !progressBarRef.current || !duration) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const progress = Math.max(0, Math.min(1, mouseX / rect.width));
      const newTime = progress * duration;

      setCurrentTime(newTime);
    };

    const handleMouseUp = () => {
      if (audioElementRef.current && duration) {
        audioElementRef.current.currentTime = currentTime;
      }
      setIsDraggingProgress(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    // Capture so stopPropagation can't block drag end
    window.addEventListener('mouseup', handleMouseUp, true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp, true);
    };
  }, [isDraggingProgress, duration, currentTime]);

  return (
    <div
      ref={musicAreaRef}
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
        height: `${300 * scale}px`,
        minHeight: `${200 * scale}px`,
        backgroundColor: frameBg,
        borderRadius: (isHovered || isPinned) ? '0px' : `${16 * scale}px`,
        borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderBottom: (isHovered || isPinned) ? 'none' : `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${20 * scale}px`, width: '100%', padding: `${24 * scale}px ${20 * scale}px` }}>
        {generatedMusicUrl && (
          <audio
            ref={audioElementRef}
            src={generatedMusicUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            style={{ display: 'none' }}
          />
        )}

        {/* Music Icon (when no music generated) */}
        {!generatedMusicUrl && (
          <div style={{ textAlign: 'center', color: placeholderColor, marginBottom: `${8 * scale}px`, transition: 'color 0.3s ease' }}>
            <svg
              width={64 * scale}
              height={64 * scale}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto', opacity: 0.3 }}
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        )}

        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          disabled={!generatedMusicUrl}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            width: `${56 * scale}px`,
            height: `${56 * scale}px`,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: generatedMusicUrl ? '#437eb5' : 'rgba(0, 0, 0, 0.1)',
            color: generatedMusicUrl ? 'white' : '#9ca3af',
            cursor: generatedMusicUrl ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: generatedMusicUrl ? `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)` : 'none',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (generatedMusicUrl) {
              e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(67, 126, 181, 0.5)`;
            }
          }}
          onMouseLeave={(e) => {
            if (generatedMusicUrl) {
              e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)`;
            }
          }}
        >
          {isPlaying ? (
            <svg width={20 * scale} height={20 * scale} viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width={20 * scale} height={20 * scale} viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress Bar and Time Display */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: `${8 * scale}px` }}>
          {/* Progress Bar */}
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            style={{
              width: '100%',
              height: `${6 * scale}px`,
              backgroundColor: progressBg,
              borderRadius: `${3 * scale}px`,
              cursor: generatedMusicUrl ? 'pointer' : 'default',
              position: 'relative',
              overflow: 'visible',
              opacity: generatedMusicUrl ? 1 : 0.5,
              transition: 'background-color 0.3s ease',
            }}
          >
            {/* Progress Fill */}
            <div
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                height: '100%',
                backgroundColor: generatedMusicUrl ? '#437eb5' : 'rgba(67, 126, 181, 0.3)',
                borderRadius: `${3 * scale}px`,
                transition: isDraggingProgress ? 'none' : 'width 0.1s linear',
                position: 'relative',
              }}
            >
              {/* Progress Handle */}
              {generatedMusicUrl && duration > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    right: `${-6 * scale}px`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: `${12 * scale}px`,
                    height: `${12 * scale}px`,
                    borderRadius: '50%',
                    backgroundColor: handleBg,
                    border: `${2 * scale}px solid #437eb5`,
                    boxShadow: isDark ? `0 ${2 * scale}px ${4 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${2 * scale}px ${4 * scale}px rgba(0, 0, 0, 0.2)`,
                    cursor: 'grab',
                    transition: 'background-color 0.3s ease',
                  }}
                />
              )}
            </div>
          </div>

          {/* Time Display */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: `${12 * scale}px`,
            color: timeColor,
            transition: 'color 0.3s ease'
          }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        {isGenerating && (
          <FrameSpinner scale={scale} label="Generating music…" />
        )}
      </div>
      {/* Pin Icon Button - Bottom Right */}
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
    </div>
  );
};

