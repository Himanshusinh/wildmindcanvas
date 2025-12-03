'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getMediaLibrary, MediaItem } from '@/lib/api';
import { buildProxyResourceUrl } from '@/lib/proxyUtils';

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
  const [hasMore, setHasMore] = useState(true);
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
        // Note: Ideally backend should return hasMore per category, but for now we check if we got a full page
        // Or use the pagination metadata if available
        if (response.data.pagination) {
          // We need to check hasMore based on the active category, but the API returns all categories paginated together
          // This is a limitation of the current API design where all categories are fetched at once
          // For now, we'll assume if any category has more, we can load more
          const p = response.data.pagination;
          setHasMore(p.hasMoreImages || p.hasMoreVideos || p.hasMoreUploaded);
        } else {
          // Fallback: if we got less than limit items in the active category, we probably reached the end
          // This is imperfect because we fetch all categories at once
          setHasMore(true);
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
      setHasMore(true);
      fetchMediaLibrary(1, true);
    }
  }, [isOpen, fetchMediaLibrary]);

  // Listen for library refresh events
  useEffect(() => {
    const handleRefresh = () => {
      if (isOpen) {
        setPage(1);
        setHasMore(true);
        fetchMediaLibrary(1, true);
      }
    };

    window.addEventListener('library-refresh', handleRefresh);
    return () => {
      window.removeEventListener('library-refresh', handleRefresh);
    };
  }, [isOpen, fetchMediaLibrary]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      // Load more when user is 50px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 50 && !loading && hasMore) {
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
    e.dataTransfer.setData('application/json', JSON.stringify(media));
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

  const getMediaUrl = (media: MediaItem) => {
    let url = media.url || media.thumbnail || '';
    if (url && (url.includes('zata.ai') || url.includes('zata'))) {
      url = buildProxyResourceUrl(url);
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
          {items.map((item) => {
            const mediaUrl = getMediaUrl(item);
            const isVideo = item.type === 'video' || mediaUrl.match(/\.(mp4|webm|mov)$/i);
            const isMusic = item.type === 'music' || mediaUrl.match(/\.(mp3|wav|ogg)$/i);

            return (
              <div
                key={item.id}
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
                    src={mediaUrl}
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
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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

