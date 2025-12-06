'use client';

import { useState, useRef, useEffect } from 'react';

interface ToolbarPanelProps {
  onToolSelect?: (tool: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | 'library' | 'plugin') => void;
  onUpload?: (files: File[]) => void;
  isHidden?: boolean;
}

let themeTransitionStyleInjected = false;

const ensureThemeTransitionStyles = () => {
  if (themeTransitionStyleInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'theme-transition-style';
  style.innerHTML = `
    .theme-transition *, 
    .theme-transition *::before, 
    .theme-transition *::after {
      transition: background-color 1s ease, 
                  color 1s ease, 
                  border-color 1s ease, 
                  box-shadow 1s ease, 
                  fill 1s ease, 
                  stroke 1s ease;
    }
  `;
  document.head.appendChild(style);
  themeTransitionStyleInjected = true;
};

export const ToolbarPanel: React.FC<ToolbarPanelProps> = ({ onToolSelect, onUpload, isHidden = false }) => {
  const [selectedTool, setSelectedTool] = useState<'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | 'library' | 'plugin'>('cursor');
  const [isDark, setIsDark] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastToolClick = useRef<{ tool?: string; time: number }>({ time: 0 });

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const handleToolClick = (tool: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | 'library' | 'plugin') => {
    // Debounce guard: ignore repeated clicks on same tool within 400ms
    const now = Date.now();
    if (lastToolClick.current.tool === tool && now - lastToolClick.current.time < 400) {
      return;
    }
    lastToolClick.current = { tool, time: now };

    // Only 'cursor' and 'move' are persistent selected tools. Other tools (text/image/video/music/library)
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

  const handleThemeToggle = () => {
    if (typeof document === 'undefined') return;
    ensureThemeTransitionStyles();
    const currentlyDark = document.documentElement.classList.contains('dark');
    const nextTheme = currentlyDark ? 'light' : 'dark';
    document.documentElement.classList.add('theme-transition');
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.classList.toggle('light', nextTheme === 'light');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', nextTheme);
    }
    window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 500);
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
    {
      id: 'library' as const,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      ),
      label: 'Library',
    },
    {
      id: 'plugin' as const,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15,20 C15.5523,20 16,20.4477 16,21 C16,21.51285 15.613973,21.9355092 15.1166239,21.9932725 L15,22 L9,22 C8.44772,22 8,21.5523 8,21 C8,20.48715 8.38604429,20.0644908 8.88337975,20.0067275 L9,20 L15,20 Z M15,2 C15.51285,2 15.9355092,2.38604429 15.9932725,2.88337975 L16,3 L16,6 L18,6 C19.0543909,6 19.9181678,6.81587733 19.9945144,7.85073759 L20,8 L20,13 C20,16.2383886 17.434417,18.8775714 14.2249377,18.9958615 L14,19 L10,19 C6.76160159,19 4.12242817,16.434417 4.00413847,13.2249377 L4,13 L4,8 C4,6.94563773 4.81587733,6.08183483 5.85073759,6.00548573 L6,6 L8,6 L8,3 C8,2.44772 8.44772,2 9,2 C9.51283143,2 9.93550653,2.38604429 9.9932722,2.88337975 L10,3 L10,6 L14,6 L14,3 C14,2.44772 14.4477,2 15,2 Z M18,8 L6,8 L6,13 C6,15.1421576 7.68396753,16.8910766 9.80035957,16.9951046 L10,17 L14,17 C16.1421576,17 17.8910766,15.3159949 17.9951046,13.199637 L18,13 L18,8 Z" fill="currentColor" fillRule="evenodd" />
        </svg>
      ),
      label: 'Plugin',
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
          transform: isHidden ? 'translate(-100%, -50%)' : 'translateY(-50%)',
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px 8px',
          backgroundColor: isDark ? '#121212' : '#ffffff',
          borderRadius: '16px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.5)' : '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
          opacity: isHidden ? 0 : 1,
          pointerEvents: isHidden ? 'none' : 'auto',
          transition: 'opacity 0.3s ease, transform 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
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
                ? (isDark ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.3)')
                : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)'),
              color: selectedTool === tool.id
                ? (isDark ? '#60a5fa' : '#3b82f6')
                : (isDark ? '#cccccc' : '#4b5563'),
              transition: 'all 0.3s ease',
              boxShadow: selectedTool === tool.id
                ? (isDark ? '0 4px 12px rgba(96, 165, 250, 0.3)' : '0 4px 12px rgba(59, 130, 246, 0.3)')
                : 'none',
            }}
            onMouseEnter={(e) => {
              // Force pointer cursor when hovering toolbar icons to avoid
              // global stage cursors (grab) leaking through.
              try { document.body.style.cursor = 'pointer'; } catch (err) { }
              if (selectedTool !== tool.id) {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.18)';
                e.currentTarget.style.color = isDark ? '#ffffff' : '#1f2937';
                e.currentTarget.style.boxShadow = isDark ? '0 6px 16px rgba(255, 255, 255, 0.1)' : '0 6px 16px rgba(0,0,0,0.08)';
              }
            }}
            onMouseLeave={(e) => {
              try { document.body.style.cursor = ''; } catch (err) { }
              if (selectedTool !== tool.id) {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = isDark ? '#cccccc' : '#4b5563';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {tool.icon}
          </button>
        ))}

        <button
          onClick={handleThemeToggle}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)',
            color: isDark ? '#f5f5f5' : '#374151',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            try { document.body.style.cursor = 'pointer'; } catch (err) { }
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)';
          }}
          onMouseLeave={(e) => {
            try { document.body.style.cursor = ''; } catch (err) { }
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)';
          }}
        >
          {isDark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: '1px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
            margin: '4px 0',
            transition: 'background-color 0.3s ease',
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
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)',
            color: isDark ? '#cccccc' : '#4b5563',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            try { document.body.style.cursor = 'pointer'; } catch (err) { }
            e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
            e.currentTarget.style.color = '#22c55e';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            try { document.body.style.cursor = ''; } catch (err) { }
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = isDark ? '#cccccc' : '#4b5563';
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

