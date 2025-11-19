'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  const [activeCategory, setActiveCategory] = useState<MediaCategory>('images');
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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      fetchMediaLibrary();
    }
  }, [isOpen]);

  const fetchMediaLibrary = async () => {
    setLoading(true);
    try {
      const response = await getMediaLibrary();
      if (response.responseStatus === 'success' && response.data) {
        setMediaLibrary({
          images: response.data.images || [],
          videos: response.data.videos || [],
          music: response.data.music || [],
          uploaded: response.data.uploaded || [],
        });
      }
    } catch (error) {
      console.error('Error fetching media library:', error);
    } finally {
      setLoading(false);
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
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading media...</p>
          </div>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No {activeCategory} found</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', padding: '16px' }}>
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
                background: '#f3f4f6',
                borderRadius: '16px', // Match canvas image generation frame border radius
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
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
                    e.currentTarget.play().catch(() => {});
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
    );
  };

  if (!isOpen) return null;

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
        background: '#ffffff',
        borderRadius: '16px', // Curved borders on all corners
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        zIndex: 10002,
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        transition: 'opacity 0.3s ease, visibility 0.3s ease',
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
        <div style={{ paddingLeft: '20px',paddingRight: '20px', paddingTop: '-16px', borderBottom: '1px solid rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827' }}>Library</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              color: '#6b7280',
              padding: '6px 10px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(0, 0, 0, 0.1)', padding: '0 16px' }}>
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
                borderBottom: activeCategory === category.id ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeCategory === category.id ? '#3b82f6' : '#6b7280',
                fontSize: '12px',
                fontWeight: activeCategory === category.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {category.label}
              {category.count > 0 && (
                <span
                  style={{
                    marginLeft: '6px',
                    fontSize: '12px',
                    color: activeCategory === category.id ? '#3b82f6' : '#9ca3af',
                  }}
                >
                  ({category.count})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Media Grid */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {activeCategory === 'images' && renderMediaGrid(mediaLibrary.images)}
          {activeCategory === 'videos' && renderMediaGrid(mediaLibrary.videos)}
          {activeCategory === 'music' && renderMediaGrid(mediaLibrary.music)}
          {activeCategory === 'uploaded' && renderMediaGrid(mediaLibrary.uploaded)}
        </div>
    </div>
  );
};

export default LibrarySidebar;

