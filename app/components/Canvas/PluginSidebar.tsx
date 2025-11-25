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

  const [plugins] = useState<Plugin[]>([
    {
      id: 'upscale',
      name: 'Upscale',
      description: 'Enhance image resolution and quality',
    },
    {
      id: 'removebg',
      name: 'Remove BG',
      description: 'Remove background from images',
    },
    {
      id: 'erase',
      name: 'Erase',
      description: 'Erase parts of images using AI',
    },
    {
      id: 'replace',
      name: 'Replace',
      description: 'Replace parts of images using AI',
    },
    {
      id: 'expand',
      name: 'Expand',
      description: 'Reserve empty frames for future edits',
    },
    {
      id: 'vectorize',
      name: 'Vectorize',
      description: 'Convert images to vector format',
    },
    {
      id: 'storyboard',
      name: 'Storyboard',
      description: 'Create storyboard frames for your project',
    },
  ]);

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', padding: '16px' }}>
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
              borderRadius: '16px',
              border: `2px solid ${cardBorder}`,
              transition: 'all 0.3s ease',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
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
              }}
            >
              {item.id === 'upscale' ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              ) : item.id === 'removebg' ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m6.66 6.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m6.66-6.66l4.24-4.24" />
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m6.66 6.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m6.66-6.66l4.24-4.24" />
                </svg>
              )}
            </div>
            {/* Plugin Name - centered below icon */}
            <div
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: nameColor,
                textAlign: 'center',
                transition: 'color 0.3s ease',
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

