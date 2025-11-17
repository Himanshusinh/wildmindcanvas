'use client';

import { useState, useRef } from 'react';

interface ToolbarPanelProps {
  onToolSelect?: (tool: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music') => void;
  onUpload?: (files: File[]) => void;
}

export const ToolbarPanel: React.FC<ToolbarPanelProps> = ({ onToolSelect, onUpload }) => {
  const [selectedTool, setSelectedTool] = useState<'cursor' | 'move' | 'text' | 'image' | 'video' | 'music'>('cursor');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastToolClick = useRef<{ tool?: string; time: number }>({ time: 0 });

  const handleToolClick = (tool: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music') => {
    // Debounce guard: ignore repeated clicks on same tool within 400ms
    const now = Date.now();
    if (lastToolClick.current.tool === tool && now - lastToolClick.current.time < 400) {
      return;
    }
    lastToolClick.current = { tool, time: now };

    // Only 'cursor' and 'move' are persistent selected tools. Other tools (text/image/video/music)
    // act on single-click and should not remain visually selected.
    const persistent = tool === 'cursor' || tool === 'move';
    if (persistent) {
      // Update selected state so the button shows as active
      setSelectedTool(tool);
    }
    // Always invoke the callback so parent can open modals or handle the action
    if (onToolSelect) {
      onToolSelect(tool);
      // If this is a non-persistent tool, immediately revert selection back to cursor
      // so the UI (and stage cursor/drag behavior) continues behaving like the select tool.
      if (!persistent) {
        // Use a microtask so parent can handle the initial tool action (open modal, etc.)
        setTimeout(() => onToolSelect('cursor'), 0);
      }
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onUpload) {
      onUpload(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const tools = [
    {
      id: 'cursor' as const,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
        </svg>
      ),
      label: 'Select',
    },
    {
      id: 'move' as const,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="5 9 2 12 5 15" />
          <polyline points="9 5 12 2 15 5" />
          <polyline points="15 19 12 22 9 19" />
          <polyline points="19 9 22 12 19 15" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="12" y1="2" x2="12" y2="22" />
        </svg>
      ),
      label: 'Move',
    },
    {
      id: 'text' as const,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      ),
      label: 'Text',
    },
    {
      id: 'image' as const,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
      label: 'Image',
    },
    {
      id: 'video' as const,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
      label: 'Video',
    },
    {
      id: 'music' as const,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      ),
      label: 'Music',
    },
  ];

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.tif,.tiff,.obj,.gltf,.glb,.fbx,.mb,.ma,.bin"
        onChange={handleFileChange}
        multiple
        style={{ display: 'none' }}
      />
      <div
        style={{
          position: 'fixed',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px 8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        }}
      >
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            title={tool.label}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedTool === tool.id
                ? 'rgba(59, 130, 246, 0.3)'
                : 'rgba(255, 255, 255, 0.1)',
              color: selectedTool === tool.id ? '#3b82f6' : '#4b5563',
              transition: 'all 0.2s ease',
              boxShadow: selectedTool === tool.id
                ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                : 'none',
            }}
            onMouseEnter={(e) => {
              // Force pointer cursor when hovering toolbar icons to avoid
              // global stage cursors (grab) leaking through.
              try { document.body.style.cursor = 'pointer'; } catch (err) {}
              if (selectedTool !== tool.id) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
                e.currentTarget.style.color = '#1f2937';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
              }
            }}
            onMouseLeave={(e) => {
              try { document.body.style.cursor = ''; } catch (err) {}
              if (selectedTool !== tool.id) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#4b5563';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {tool.icon}
          </button>
        ))}
        
        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            margin: '4px 0',
          }}
        />
        
        {/* Upload Button */}
        <button
          onClick={handleUploadClick}
          title="Upload"
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#4b5563',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            try { document.body.style.cursor = 'pointer'; } catch (err) {}
            e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
            e.currentTarget.style.color = '#22c55e';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            try { document.body.style.cursor = ''; } catch (err) {}
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#4b5563';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
      </div>
    </>
  );
};

