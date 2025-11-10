'use client';

import { useState, useRef } from 'react';

interface ToolbarPanelProps {
  onToolSelect?: (tool: 'cursor' | 'text' | 'image' | 'video' | 'music') => void;
  onUpload?: (files: File[]) => void;
}

export const ToolbarPanel: React.FC<ToolbarPanelProps> = ({ onToolSelect, onUpload }) => {
  const [selectedTool, setSelectedTool] = useState<'cursor' | 'text' | 'image' | 'video' | 'music'>('cursor');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolClick = (tool: 'cursor' | 'text' | 'image' | 'video' | 'music') => {
    // Always update state and call callback, even if tool is already selected
    // This allows clicking the same tool again to trigger actions (like creating new text input)
    setSelectedTool(tool);
    if (onToolSelect) {
      onToolSelect(tool);
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
      label: 'Cursor',
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
          zIndex: 1000,
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
              if (selectedTool !== tool.id) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.color = '#1f2937';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTool !== tool.id) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#4b5563';
                e.currentTarget.style.transform = 'scale(1)';
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
            e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
            e.currentTarget.style.color = '#22c55e';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
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

