'use client';

import React, { useMemo } from 'react';
import { ComponentMenu } from './types';

interface ComponentCreationMenuProps {
  componentMenu: ComponentMenu | null;
  componentMenuSearch: string;
  setComponentMenu: (menu: ComponentMenu | null) => void;
  setComponentMenuSearch: (search: string) => void;
  scale: number;
  onPersistTextModalCreate?: (modal: { id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }) => void | Promise<void>;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistVideoModalCreate?: (modal: { id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number }) => void | Promise<void>;
  onPersistMusicModalCreate?: (modal: { id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistUpscaleModalCreate?: (modal: { id: string; x: number; y: number; upscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  setUpscaleModalStates?: React.Dispatch<React.SetStateAction<any[]>>;
  onPersistRemoveBgModalCreate?: (modal: { id: string; x: number; y: number; removedBgImageUrl?: string | null; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  setRemoveBgModalStates?: React.Dispatch<React.SetStateAction<any[]>>;
  onPersistEraseModalCreate?: (modal: { id: string; x: number; y: number; erasedImageUrl?: string | null; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  setEraseModalStates?: React.Dispatch<React.SetStateAction<any[]>>;
  onPersistExpandModalCreate?: (modal: { id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; isExpanding?: boolean }) => void | Promise<void>;
  setExpandModalStates?: React.Dispatch<React.SetStateAction<any[]>>;
  onPersistStoryboardModalCreate?: (modal: { id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }) => void | Promise<void>;
  setStoryboardModalStates?: React.Dispatch<React.SetStateAction<any[]>>;
  onPersistConnectorCreate?: (connector: any) => void | Promise<void>;
}

export const ComponentCreationMenu: React.FC<ComponentCreationMenuProps> = ({
  componentMenu,
  componentMenuSearch,
  setComponentMenu,
  setComponentMenuSearch,
  scale,
  onPersistTextModalCreate,
  onPersistImageModalCreate,
  onPersistVideoModalCreate,
  onPersistMusicModalCreate,
  onPersistUpscaleModalCreate,
  setUpscaleModalStates,
  onPersistRemoveBgModalCreate,
  setRemoveBgModalStates,
  onPersistEraseModalCreate,
  setEraseModalStates,
  onPersistExpandModalCreate,
  setExpandModalStates,
  onPersistStoryboardModalCreate,
  setStoryboardModalStates,
  onPersistConnectorCreate,
}) => {
  // Close component menu when clicking outside
  React.useEffect(() => {
    if (!componentMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-component-menu]')) {
        setComponentMenu(null);
        setComponentMenuSearch('');
      }
    };

    // Use setTimeout to avoid immediate closure
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [componentMenu, setComponentMenu, setComponentMenuSearch]);

  // Define components list (always, to avoid conditional hook calls)
  const components = [
    { id: 'text', label: 'Text Generation', type: 'text' },
    { id: 'image', label: 'Image Generation', type: 'image' },
    { id: 'video', label: 'Video Generation', type: 'video' },
    { id: 'music', label: 'Music Generation', type: 'music' },
    { id: 'upscale-plugin', label: 'Upscale Plugin', type: 'plugin' },
    { id: 'removebg-plugin', label: 'Remove BG Plugin', type: 'plugin' },
    { id: 'erase-plugin', label: 'Erase Plugin', type: 'plugin' },
    { id: 'expand-plugin', label: 'Expand Plugin', type: 'plugin' },
    { id: 'storyboard-plugin', label: 'Storyboard Plugin', type: 'plugin' },
  ];

  // Always call useMemo (before early return) to comply with Rules of Hooks
  const allowedComponentsFromSource = useMemo(() => {
    if (!componentMenu) return null;

    const sourceType = componentMenu.sourceNodeType;
    if (!sourceType) return null;

    switch (sourceType) {
      case 'storyboard':
      case 'script':
        return ['image', 'video'];

      case 'text':
        return ['image', 'video', 'music', 'storyboard-plugin'];

      case 'image':
        return ['image', 'video', 'upscale-plugin', 'removebg-plugin', 'erase-plugin', 'expand-plugin', 'storyboard-plugin'];

      case 'video':
      case 'music':
        return ['video'];

      case 'upscale':
      case 'removebg':
      case 'erase':
      case 'expand':
      case 'vectorize':
        return ['image', 'video', 'upscale-plugin', 'removebg-plugin', 'erase-plugin', 'expand-plugin'];

      default:
        return null;
    }
  }, [componentMenu]);

  // Early return after all hooks
  if (!componentMenu) return null;

  const filtered = components.filter(comp => {
    // Search filter
    if (!comp.label.toLowerCase().includes(componentMenuSearch.toLowerCase())) {
      return false;
    }

    // Context filter
    if (allowedComponentsFromSource) {
      return allowedComponentsFromSource.includes(comp.id);
    }

    return true;
  });

  const handleCreateConnection = (targetId: string) => {
    if (componentMenu.sourceNodeId && onPersistConnectorCreate) {
      const newConnection = {
        id: `connector-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        from: componentMenu.sourceNodeId,
        to: targetId,
        color: componentMenu.connectionColor || '#437eb5', // Use drag color or default
        fromAnchor: 'send',
        toAnchor: 'receive',
      };
      Promise.resolve(onPersistConnectorCreate(newConnection)).catch(console.error);
    }
  };

  return (
    <div
      data-component-menu
      style={{
        position: 'fixed',
        left: `${componentMenu.x}px`,
        top: `${componentMenu.y}px`,
        width: `${280 * scale}px`,
        maxHeight: `${400 * scale}px`,
        backgroundColor: '#ffffff',
        borderRadius: `${12 * scale}px`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(0, 0, 0, 0.1)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Search Input - Top */}
      <div style={{ padding: `${12 * scale}px`, borderBottom: '1px solid rgba(0, 0, 0, 0.1)' }}>
        <input
          type="text"
          placeholder="Search features..."
          value={componentMenuSearch}
          onChange={(e) => setComponentMenuSearch(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: `${8 * scale}px ${12 * scale}px`,
            fontSize: `${14 * scale}px`,
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: `${8 * scale}px`,
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setComponentMenu(null);
              setComponentMenuSearch('');
            }
          }}
        />
      </div>

      {/* Component List */}
      <div
        style={{
          overflowY: 'auto',
          maxHeight: `${320 * scale}px`,
          overscrollBehavior: 'contain', // Prevent scroll chaining
        }}
        onWheel={(e) => e.stopPropagation()}
      >
        {filtered.map((comp) => (
          <div
            key={comp.id}
            onClick={() => {
              // Create component at canvas position
              const { canvasX, canvasY } = componentMenu;
              let newComponentId: string | null = null;

              if (comp.type === 'text' && onPersistTextModalCreate) {
                newComponentId = `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newText = {
                  id: newComponentId,
                  x: canvasX,
                  y: canvasY,
                  value: '',
                  autoFocusInput: true,
                };
                Promise.resolve(onPersistTextModalCreate(newText)).catch(console.error);
              } else if (comp.type === 'image' && onPersistImageModalCreate) {
                newComponentId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newImage = {
                  id: newComponentId,
                  x: canvasX,
                  y: canvasY,
                  generatedImageUrl: null,
                  frameWidth: 600,
                  frameHeight: 400,
                  model: 'Google Nano Banana',
                  frame: 'Frame',
                  aspectRatio: '1:1',
                  prompt: '',
                };
                Promise.resolve(onPersistImageModalCreate(newImage)).catch(console.error);
              } else if (comp.type === 'video' && onPersistVideoModalCreate) {
                newComponentId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newVideo = {
                  id: newComponentId,
                  x: canvasX,
                  y: canvasY,
                  generatedVideoUrl: null,
                  frameWidth: 600,
                  frameHeight: 400,
                  model: 'Seedance 1.0 Pro',
                  frame: 'Frame',
                  aspectRatio: '16:9',
                  prompt: '',
                  duration: 4,
                };
                Promise.resolve(onPersistVideoModalCreate(newVideo)).catch(console.error);
              } else if (comp.type === 'music' && onPersistMusicModalCreate) {
                newComponentId = `music-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newMusic = {
                  id: newComponentId,
                  x: canvasX,
                  y: canvasY,
                  generatedMusicUrl: null,
                  frameWidth: 600,
                  frameHeight: 300,
                  model: 'MusicGen',
                  frame: 'Frame',
                  aspectRatio: '1:1',
                  prompt: '',
                };
                Promise.resolve(onPersistMusicModalCreate(newMusic)).catch(console.error);
              } else if (comp.id === 'upscale-plugin' && comp.type === 'plugin' && onPersistUpscaleModalCreate && setUpscaleModalStates) {
                // Create upscale plugin modal
                newComponentId = `upscale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newUpscale = {
                  id: newComponentId,
                  x: canvasX,
                  y: canvasY,
                  upscaledImageUrl: null,
                  sourceImageUrl: null,
                  localUpscaledImageUrl: null,
                  model: 'Crystal Upscaler',
                  scale: 2,
                  frameWidth: 400,
                  frameHeight: 500,
                  isUpscaling: false,
                };
                setUpscaleModalStates(prev => [...prev, newUpscale]);
                Promise.resolve(onPersistUpscaleModalCreate(newUpscale)).catch(console.error);
              } else if (comp.id === 'removebg-plugin' && comp.type === 'plugin' && onPersistRemoveBgModalCreate && setRemoveBgModalStates) {
                // Create remove bg plugin modal
                newComponentId = `removebg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newRemoveBg = {
                  id: newComponentId,
                  x: canvasX,
                  y: canvasY,
                  removedBgImageUrl: null,
                  sourceImageUrl: null,
                  localRemovedBgImageUrl: null,
                  model: '851-labs/background-remover',
                  backgroundType: 'rgba (transparent)',
                  scaleValue: 0.5,
                  frameWidth: 400,
                  frameHeight: 500,
                  isRemovingBg: false,
                };
                setRemoveBgModalStates(prev => [...prev, newRemoveBg]);
                Promise.resolve(onPersistRemoveBgModalCreate(newRemoveBg)).catch(console.error);
              } else if (comp.id === 'erase-plugin' && comp.type === 'plugin' && onPersistEraseModalCreate && setEraseModalStates) {
                // Create erase plugin modal
                newComponentId = `erase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newErase = {
                  id: newComponentId,
                  x: canvasX,
                  y: canvasY,
                  erasedImageUrl: null,
                  sourceImageUrl: null,
                  localErasedImageUrl: null,
                  model: 'bria/eraser',
                  frameWidth: 400,
                  frameHeight: 500,
                  isErasing: false,
                };
                setEraseModalStates(prev => [...prev, newErase]);
                Promise.resolve(onPersistEraseModalCreate(newErase)).catch(console.error);
              } else if (comp.id === 'expand-plugin' && comp.type === 'plugin' && onPersistExpandModalCreate && setExpandModalStates) {
                newComponentId = `expand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newExpand = {
                  id: newComponentId,
                  x: canvasX,
                  y: canvasY,
                  expandedImageUrl: null,
                  sourceImageUrl: null,
                  localExpandedImageUrl: null,
                  model: 'expand/base',
                  frameWidth: 400,
                  frameHeight: 500,
                  isExpanding: false,
                };
                setExpandModalStates(prev => [...prev, newExpand]);
                Promise.resolve(onPersistExpandModalCreate(newExpand)).catch(console.error);
              } else if (comp.id === 'storyboard-plugin' && comp.type === 'plugin' && onPersistStoryboardModalCreate && setStoryboardModalStates) {
                newComponentId = `storyboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newStoryboard = {
                  id: newComponentId,
                  x: canvasX,
                  y: canvasY,
                  frameWidth: 400,
                  frameHeight: 500,
                };
                setStoryboardModalStates(prev => [...prev, newStoryboard]);
                Promise.resolve(onPersistStoryboardModalCreate(newStoryboard)).catch(console.error);
              }

              if (newComponentId) {
                handleCreateConnection(newComponentId);
              }

              setComponentMenu(null);
              setComponentMenuSearch('');
            }}
            style={{
              padding: `${12 * scale}px ${16 * scale}px`,
              cursor: 'pointer',
              fontSize: `${14 * scale}px`,
              color: '#1f2937',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {comp.label}
          </div>
        ))}
      </div>
    </div>
  );
};
