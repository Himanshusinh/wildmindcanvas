'use client';

import React, { useState, useEffect } from 'react';

interface PluginSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlugin?: (plugin: { id: string; name: string; icon?: string }, x?: number, y?: number) => void;
  scale?: number;
  viewportCenter?: { x: number; y: number };
}

interface Plugin {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  invertInDarkMode?: boolean;
}

const PluginSidebar: React.FC<PluginSidebarProps> = ({ isOpen, onClose, onSelectPlugin, scale = 1, viewportCenter }) => {
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

  const [plugins, setPlugins] = useState<Plugin[]>([
    {
      id: 'upscale',
      name: 'Upscale',
      description: 'Enhance image resolution and quality',
      icon: '/icons/upscale.svg',
    },
    {
      id: 'removebg',
      name: 'Remove BG',
      description: 'Remove background from images',
      icon: '/icons/removebg.svg',
    },
    {
      id: 'erase',
      name: 'Erase / Replace',
      description: 'Erase or replace parts of images using AI',
      icon: '/icons/erase.svg',
    },
    {
      id: 'expand',
      name: 'Expand',
      description: 'Reserve empty frames for future edits',
      icon: '/icons/resize.svg',
    },
    {
      id: 'vectorize',
      name: 'Vectorize',
      description: 'Convert images to vector format',
      icon: '/icons/vector.svg',
    },
    {
      id: 'storyboard',
      name: 'Storyboard',
      description: 'Create storyboard frames for your project',
      icon: '/icons/film-editing.svg',
    },
    {
      id: 'video-editor',
      name: 'Video Editor',
      description: 'Edit and assemble videos',
      icon: '/icons/video-editor.svg',
    },
  ]);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pluginId: string } | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, pluginId: string) => {
    e.preventDefault();
    e.nativeEvent.preventDefault();
    e.stopPropagation();
    console.log('Context menu triggered for:', pluginId);
    setContextMenu({ x: e.clientX, y: e.clientY, pluginId });
  };

  const handleDeletePlugin = (id: string) => {
    setPlugins(prev => prev.filter(p => p.id !== id));
    setContextMenu(null);
  };

  const handleDuplicatePlugin = (id: string) => {
    const plugin = plugins.find(p => p.id === id);
    if (plugin) {
      const newPlugin = {
        ...plugin,
        id: `${plugin.id}-${Date.now()}`,
        name: `${plugin.name} (Copy)`,
      };
      setPlugins(prev => [...prev, newPlugin]);
    }
    setContextMenu(null);
  };

  const handlePluginClick = (plugin: Plugin, e?: React.MouseEvent) => {
    if (onSelectPlugin) {
      // If viewportCenter is provided, use it; otherwise use click position
      const x = viewportCenter?.x || (e ? e.clientX : 0);
      const y = viewportCenter?.y || (e ? e.clientY : 0);
      onSelectPlugin(plugin, x, y);
    }
    onClose();
  };

  const handleDragStart = (e: React.DragEvent, plugin: Plugin) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'plugin', plugin }));
    e.dataTransfer.setData('text/plain', plugin.name);
  };

  const renderPluginGrid = (items: Plugin[]) => {
    const textColor = isDark ? '#cccccc' : '#9ca3af';
    const cardBg = isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    const cardBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.3)';
    const iconColor = isDark ? '#ffffff' : '#000000';
    const nameColor = isDark ? '#ffffff' : '#000000';
    const shadowColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)';

    if (items.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <p style={{ color: textColor, fontSize: '14px', transition: 'color 0.3s ease' }}>No plugins available</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px' }}>
        {items.map((item) => (
          <div
            key={item.id}
            draggable
            onClick={(e) => handlePluginClick(item, e)}
            onDragStart={(e) => handleDragStart(e, item)}
            style={{
              aspectRatio: '1',
              overflow: 'hidden',
              cursor: 'pointer',
              background: cardBg,
              borderRadius: '12px',
              border: `2px solid ${cardBorder}`,
              transition: 'all 0.3s ease',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px',
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
            {/* Plugin Icon - centered */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
                width: '32px',
                height: '32px',
              }}
            >
              <img
                src={item.icon}
                alt={item.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)',
                  transition: 'filter 0.3s ease',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  // Fallback to generic icon if image fails
                  e.currentTarget.insertAdjacentHTML('afterend', `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    </svg>
                  `);
                }}
              />
            </div>
            {/* Plugin Name - centered below icon */}
            <div
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: nameColor,
                textAlign: 'center',
                transition: 'color 0.3s ease',
                lineHeight: '1.2',
              }}
            >
              {item.name}
            </div>
          </div>
        ))}
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
  const closeHoverBg = isDark ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6';

  return (
    <div
      style={{
        position: 'fixed',
        left: '76px',
        top: '80px',
        bottom: '20px',
        width: '400px',
        maxWidth: 'calc(90vw - 76px)',
        background: sidebarBg,
        borderRadius: '16px',
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
        paddingTop: '16px',
        paddingBottom: '16px',
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
        }}>Plugins</h2>
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
            e.currentTarget.style.borderRadius = '8px';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ✕
        </button>
      </div>

      {/* Plugin Grid */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {renderPluginGrid(plugins)}
      </div>
    </div>
  );
};

export default PluginSidebar;

