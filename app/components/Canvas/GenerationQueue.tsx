'use client';

import React from 'react';

export type GenerationQueueItem = {
  id: string;
  type: 'image' | 'video' | 'music' | 'upscale' | 'vectorize' | 'removebg' | 'erase' | 'expand' | 'storyboard' | 'script' | 'scene';
  operationName: string; // Display name like "Generating Image", "Upscaling", etc.
  prompt?: string; // Optional - plugins may not have prompts
  model: string;
  total: number;
  index: number;
  startedAt: number;
  completed?: boolean; // Track if operation completed successfully
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
          width: 280,
          maxHeight: 400, // Increased height to allow stacking
          zIndex: 6000,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none', // Allow clicks to pass through container
        }}
      >
        {items.map((item) => {
          const isCompleted = item.completed === true;

          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly translucent white
                border: '1px solid rgba(226,232,240,0.8)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', // Stronger shadow for floating effect
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                pointerEvents: 'auto', // Re-enable clicks on items
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isCompleted ? 'scale(0.98)' : 'scale(1)',
                opacity: isCompleted ? 0.9 : 1,
              }}
            >
              {isCompleted ? (
                // Green checkmark when completed
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="12"
                    height="10"
                    viewBox="0 0 10 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : (
                // Loading spinner
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '2px solid rgba(203,213,225,0.7)',
                    borderTopColor: '#2563eb',
                    animation: 'wm-queue-spin 0.85s linear infinite',
                    flexShrink: 0,
                  }}
                />
              )}
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.operationName}
              </div>
            </div>
          );
        })}
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

