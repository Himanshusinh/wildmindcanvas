'use client';

import React from 'react';

export type GenerationQueueItem = {
  id: string;
  prompt: string;
  model: string;
  total: number;
  index: number;
  startedAt: number;
};

interface GenerationQueueProps {
  items: GenerationQueueItem[];
}

const formatElapsed = (startedAt: number) => {
  const diffMs = Date.now() - startedAt;
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
};

const GenerationQueue: React.FC<GenerationQueueProps> = ({ items }) => {
  if (!items.length) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          width: 320,
          maxHeight: 260,
          backgroundColor: 'rgba(255,255,255,0.98)',
          color: '#0f172a',
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(15,23,42,0.15)',
          padding: '16px 18px',
          zIndex: 6000,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          border: '1px solid rgba(226,232,240,0.8)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: 0.2,
            textTransform: 'uppercase',
            color: '#475569',
          }}
        >
          <span>Generating</span>
          <span>{items.length}</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxHeight: 180,
            overflowY: items.length > 3 ? 'auto' : 'hidden',
            paddingRight: items.length > 3 ? 6 : 0,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 12,
                backgroundColor: '#f8fafc',
                border: '1px solid rgba(148,163,184,0.25)',
                boxShadow: '0 6px 12px rgba(15,23,42,0.05)',
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '2px solid rgba(203,213,225,0.7)',
                  borderTopColor: '#2563eb',
                  animation: 'wm-queue-spin 0.85s linear infinite',
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0f172a',
                    marginBottom: 4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.prompt}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#64748b',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  <span>Image {item.index}/{item.total}</span>
                  <span>•</span>
                  <span>{item.model}</span>
                  <span>•</span>
                  <span>{formatElapsed(item.startedAt)} elapsed</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>
        {`
          @keyframes wm-queue-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default GenerationQueue;

