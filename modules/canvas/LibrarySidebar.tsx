'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getMediaLibrary, MediaItem } from '@/core/api/api';
import { buildProxyResourceUrl, buildProxyThumbnailUrl } from '@/core/api/proxyUtils';

interface LibrarySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia?: (media: MediaItem) => void;
  scale?: number;
}

type MediaCategory = 'images' | 'videos' | 'music' | 'uploaded';

const LibrarySidebar: React.FC<LibrarySidebarProps> = ({ isOpen, onClose, onSelectMedia, scale = 1 }) => {
  const [isDark, setIsDark] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MediaCategory>('images');

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [mediaLibrary, setMediaLibrary] = useState<{
    images: MediaItem[];
    videos: MediaItem[];
    music: MediaItem[];
    uploaded: MediaItem[];
  }>({
    images: [],
    videos: [],
    music: [],
    uploaded: [],
  });

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState<{
    images: boolean;
    videos: boolean;
    music: boolean;
    uploaded: boolean;
  }>({
    images: true,
    videos: true,
    music: true,
    uploaded: true
  });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchMediaLibrary = useCallback(async (pageNum: number, isRefresh = false) => {
    if (loading && !isRefresh) return;

    setLoading(true);
    try {
      const limit = 20;
      const response = await getMediaLibrary(pageNum, limit);

      if (response.responseStatus === 'success' && response.data) {
        setMediaLibrary(prev => {
          if (pageNum === 1) {
            return {
              images: response.data?.images || [],
              videos: response.data?.videos || [],
              music: response.data?.music || [],
              uploaded: response.data?.uploaded || [],
            };
          } else {
            return {
              images: [...prev.images, ...(response.data?.images || [])],
              videos: [...prev.videos, ...(response.data?.videos || [])],
              music: [...prev.music, ...(response.data?.music || [])],
              uploaded: [...prev.uploaded, ...(response.data?.uploaded || [])],
            };
          }
        });

        // Update hasMore based on the active category
        if (response.data.pagination) {
          const p = response.data.pagination;
          setHasMore({
            images: p.hasMoreImages,
            videos: p.hasMoreVideos,
            music: false, // API doesn't seem to return hasMoreMusic based on types? Assuming false or need to check types.
            uploaded: p.hasMoreUploaded
          });
        } else {
          // Fallback: if we got less than limit items in the active category, we probably reached the end
          // We check the length of the *new* items only
          const newImages = response.data?.images || [];
          const newVideos = response.data?.videos || [];
          const newMusic = response.data?.music || [];
          const newUploaded = response.data?.uploaded || [];

          setHasMore({
            images: newImages.length >= 20,
            videos: newVideos.length >= 20,
            music: newMusic.length >= 20,
            uploaded: newUploaded.length >= 20
          });
        }
      }
    } catch (error) {
      console.error('Error fetching media library:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setHasMore({ images: true, videos: true, music: true, uploaded: true });
      fetchMediaLibrary(1, true);
    }
  }, [isOpen, fetchMediaLibrary]);

  // Listen for library refresh events
  useEffect(() => {
    const handleRefresh = () => {
      if (isOpen) {
        setPage(1);
        setHasMore({ images: true, videos: true, music: true, uploaded: true });
        fetchMediaLibrary(1, true);
      }
    };

    window.addEventListener('library-refresh', handleRefresh);
    return () => {
      window.removeEventListener('library-refresh', handleRefresh);
    };
  }, [isOpen, fetchMediaLibrary]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Use a small timeout to avoid closing immediately if the click that opened the sidebar
    // is also caught by this listener (in case of event bubbling)
    const timeoutId = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      // Load more when user is 300px from bottom (earlier fetch)
      if (scrollTop + clientHeight >= scrollHeight - 300 && !loading && hasMore[activeCategory]) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchMediaLibrary(nextPage);
      }
    }
  };

  const handleMediaClick = (media: MediaItem) => {
    // Don't trigger click if we just finished dragging
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    if (onSelectMedia) {
      onSelectMedia(media);
    }
    onClose();
  };

  const handleDragStart = (e: React.DragEvent, media: MediaItem) => {
    isDraggingRef.current = true;
    // Store media data in drag event
    e.dataTransfer.effectAllowed = 'copy';

    // Add AVIF preview URL for the drag process if it's an image
    const dragData = {
      ...media,
      avifUrl: (media.url && (media.url.includes('zata.ai') || media.url.includes('zata')))
        ? buildProxyThumbnailUrl(media.url, 512, 80, 'avif')
        : undefined
    };

    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', media.url || '');
    // Add a visual indicator
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Restore opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    // Reset dragging flag after a short delay to allow drop to complete
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  const getMediaUrl = (media: MediaItem, useThumbnail = true) => {
    let url = media.url || media.thumbnail || '';
    if (url && (url.includes('zata.ai') || url.includes('zata'))) {
      if (useThumbnail) {
        // Use optimized AVIF thumbnail for grid previews (512px width is plenty for sidebar)
        return buildProxyThumbnailUrl(url, 512, 80, 'avif');
      }
      return buildProxyResourceUrl(url);
    }
    return url;
  };

  const renderMediaGrid = (items: MediaItem[]) => {
    const loadingTextColor = isDark ? '#cccccc' : '#6b7280';
    const emptyTextColor = isDark ? '#999999' : '#9ca3af';
    const cardBg = isDark ? '#1a1a1a' : '#f3f4f6';
    const shadowColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)';

    if (items.length === 0 && !loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <p style={{ color: emptyTextColor, fontSize: '14px', transition: 'color 0.3s ease' }}>No {activeCategory} found</p>
        </div>
      );
    }

    return (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
          {items.map((item, idx) => {
            const mediaUrl = getMediaUrl(item, false); // Use original URL for grid display as requested
            const isVideo = item.type === 'video' || mediaUrl.match(/\.(mp4|webm|mov)$/i);
            const isMusic = item.type === 'music' || mediaUrl.match(/\.(mp3|wav|ogg)$/i);

            return (
              <div
                key={`${item.id}-${idx}`}
                draggable
                onClick={() => handleMediaClick(item)}
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
                style={{
                  aspectRatio: '1',
                  overflow: 'hidden',
                  cursor: 'grab',
                  background: cardBg,
                  borderRadius: '16px', // Match canvas image generation frame border radius
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${shadowColor}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {isVideo ? (
                  <video
                    src={getMediaUrl(item, false)} // Use full resource for playback on hover
                    poster={getMediaUrl(item, true)} // Use optimized thumbnail as poster
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    muted
                    onMouseEnter={(e) => {
                      e.currentTarget.play().catch(() => { });
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                ) : isMusic ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13" />
                      <circle cx="6" cy="18" r="3" />
                      <circle cx="18" cy="16" r="3" />
                    </svg>
                  </div>
                ) : (
                  <img
                    src={mediaUrl}
                    alt={item.prompt || 'Media'}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0,
                      animation: 'fadeIn 0.3s ease forwards'
                    }}
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).style.opacity = '1';
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const sidebarBg = isDark ? '#121212' : '#ffffff';
  const sidebarBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const sidebarShadow = isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.5)' : '0 8px 32px 0 rgba(0, 0, 0, 0.1)';
  const headerBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const headerText = isDark ? '#ffffff' : '#111827';
  const closeIconColor = isDark ? '#cccccc' : '#6b7280';
  const closeHoverBg = isDark ? 'rgba(255, 255, 255, 0.1)' : '#ffffff';
  const tabBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
  const activeTabColor = isDark ? '#60a5fa' : '#3b82f6';
  const inactiveTabColor = isDark ? '#999999' : '#6b7280';
  const inactiveCountColor = isDark ? '#666666' : '#9ca3af';

  return (
    <div
      ref={sidebarRef}
      style={{
        position: 'fixed',
        left: '76px', // Position next to toolbar (20px left + 36px toolbar width + 20px gap)
        top: '80px', // Start below project name (16px top + ~50px header height + 14px gap)
        bottom: '20px', // 20px margin from bottom
        width: '400px',
        maxWidth: 'calc(90vw - 76px)',
        background: sidebarBg,
        borderRadius: '16px', // Curved borders on all corners
        border: `1px solid ${sidebarBorder}`,
        boxShadow: sidebarShadow,
        zIndex: 10002,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        transition: 'opacity 0.3s ease, visibility 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
      }}
      onWheel={(e) => {
        e.stopPropagation();
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Header */}
      <div style={{
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingTop: '-16px',
        borderBottom: `1px solid ${headerBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'border-color 0.3s ease'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 600,
          color: headerText,
          transition: 'color 0.3s ease'
        }}>Library</h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            color: closeIconColor,
            padding: '6px 10px',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = closeHoverBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ✕
        </button>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${tabBorder}`,
        padding: '0 16px',
        transition: 'border-color 0.3s ease'
      }}>
        {[
          { id: 'images' as MediaCategory, label: 'Images', count: mediaLibrary.images.length },
          { id: 'videos' as MediaCategory, label: 'Videos', count: mediaLibrary.videos.length },
          { id: 'music' as MediaCategory, label: 'Music', count: mediaLibrary.music.length },
          { id: 'uploaded' as MediaCategory, label: 'My Uploads', count: mediaLibrary.uploaded.length },
        ].map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeCategory === category.id ? `2px solid ${activeTabColor}` : '2px solid transparent',
              color: activeCategory === category.id ? activeTabColor : inactiveTabColor,
              fontSize: '12px',
              fontWeight: activeCategory === category.id ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
            }}
          >
            {category.label}
            {category.count > 0 && (
              <span
                style={{
                  marginLeft: '6px',
                  fontSize: '12px',
                  color: activeCategory === category.id ? activeTabColor : inactiveCountColor,
                  transition: 'color 0.3s ease',
                }}
              >
                ({category.count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
      >
        {activeCategory === 'images' && renderMediaGrid(mediaLibrary.images)}
        {activeCategory === 'videos' && renderMediaGrid(mediaLibrary.videos)}
        {activeCategory === 'music' && renderMediaGrid(mediaLibrary.music)}
        {activeCategory === 'uploaded' && renderMediaGrid(mediaLibrary.uploaded)}
      </div>
    </div>
  );
};

export default LibrarySidebar;

// Add global style for fade in animation
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

