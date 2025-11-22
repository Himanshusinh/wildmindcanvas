'use client';

import React, { useState } from 'react';

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
      id: 'vectorize',
      name: 'Vectorize',
      description: 'Convert images to vector format',
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
    if (items.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No plugins available</p>
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
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '16px',
              border: '2px solid rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
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
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              ) : item.id === 'removebg' ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m6.66 6.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m6.66-6.66l4.24-4.24" />
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m6.66 6.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m6.66-6.66l4.24-4.24" />
                </svg>
              )}
            </div>
            {/* Plugin Name - centered below icon */}
            <div
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#000000',
                textAlign: 'center',
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

  return (
    <div
      style={{
        position: 'fixed',
        left: '76px',
        top: '80px',
        bottom: '20px',
        width: '400px',
        maxWidth: 'calc(90vw - 76px)',
        background: '#ffffff',
        borderRadius: '16px',
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
      <div style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827' }}>Plugins</h2>
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
            e.currentTarget.style.background = '#f3f4f6';
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

