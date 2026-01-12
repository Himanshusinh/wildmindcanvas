'use client';
import React, { useRef, useState, useEffect } from 'react';
import FrameSpinner from '@/modules/ui-global/common/FrameSpinner';
import { buildProxyMediaUrl } from '@/core/api/proxyUtils';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { MusicModalTabs, MusicCategory } from './MusicModalTabs';

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
  activeCategory: MusicCategory;
  onCategoryChange: (category: MusicCategory) => void;
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
  activeCategory,
  onCategoryChange,
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
  const handleBg = isDark ? '#121212' : '#ffffff';

  // Fallback: If we have a URL but no category (e.g. legacy data), default to 'music' so player shows
  const effectiveCategory = activeCategory || (generatedMusicUrl ? 'music' : null);

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

    // If metadata is already loaded, update duration immediately
    if (audio.readyState >= 1) {
      updateDuration();
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [generatedMusicUrl, isDraggingProgress]);

  const handlePlayPause = async () => {
    if (audioElementRef.current) {
      if (audioElementRef.current.paused) {
        try {
          await audioElementRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.error('[MusicModalFrame] Playback failed:', err);
          setIsPlaying(false);
        }
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
        height: `${240 * scale}px`,
        minHeight: `${200 * scale}px`,
        backgroundColor: frameBg,
        borderRadius: (isHovered || isPinned) ? '0px' : `${16 * scale}px`,
        borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
        borderBottom: ((isHovered || isPinned) && effectiveCategory)
          ? 'none'
          : `${frameBorderWidth * scale}px solid ${frameBorderColor}`,

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${8 * scale}px`, width: '100%', height: '100%', padding: `${16 * scale}px` }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${8 * scale}px`, width: '100%' }}>
          {generatedMusicUrl && effectiveCategory && (
            <audio
              ref={audioElementRef}
              src={buildProxyMediaUrl(generatedMusicUrl)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                console.error('[MusicModalFrame] Audio element error:', e.currentTarget.error);
                setIsPlaying(false);
              }}
              onEnded={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
              style={{ display: 'none' }}
            />
          )}

          {/* Landing State: No category selected */}
          {!effectiveCategory && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${8 * scale}px` }}>
              <div style={{ color: placeholderColor, }}>
                <svg
                  width={40 * scale}
                  height={40 * scale}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: 0.2 }}
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <div style={{
                fontSize: `${14 * scale}px`,
                color: placeholderColor,
                fontWeight: '500',
                opacity: 0.5,

              }}>
                Select a track type to begin
              </div>

              {/* Internal Category Tabs - Transient */}
              <div style={{ marginTop: `${8 * scale}px`, width: '100%' }}>
                <MusicModalTabs
                  activeCategory={activeCategory}
                  onCategoryChange={onCategoryChange}
                  scale={scale}
                />
              </div>
            </div>
          )}

          {/* Icon (when category selected but no music generated) */}
          {effectiveCategory && !generatedMusicUrl && (
            <div style={{ textAlign: 'center', color: placeholderColor, marginBottom: `${4 * scale}px`, }}>
              <svg
                width={32 * scale}
                height={32 * scale}
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
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPause();
            }}
            disabled={!generatedMusicUrl}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: `${32 * scale}px`,
              height: `${32 * scale}px`,
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
              opacity: effectiveCategory ? 1 : 0,
              visibility: effectiveCategory ? 'visible' : 'hidden',

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
              <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Progress Bar and Time Display */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: `${4 * scale}px` }}>
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
                opacity: effectiveCategory ? (generatedMusicUrl ? 1 : 0.5) : 0,
                visibility: effectiveCategory ? 'visible' : 'hidden',

              }}
            >
              {/* Progress Fill */}
              <div
                style={{
                  width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                  height: '100%',
                  backgroundColor: generatedMusicUrl ? '#437eb5' : 'rgba(67, 126, 181, 0.3)',
                  borderRadius: `${3 * scale}px`,
                  transition: isDraggingProgress ? 'none' : 'width 0s linear',
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
              opacity: effectiveCategory ? 1 : 0,
              visibility: effectiveCategory ? 'visible' : 'hidden',

            }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          {isGenerating && (
            <FrameSpinner scale={scale} label={`Generating ${effectiveCategory === 'music' ? 'music' : 'audio'}…`} />
          )}
        </div>
      </div>
    </div>
  );
};

