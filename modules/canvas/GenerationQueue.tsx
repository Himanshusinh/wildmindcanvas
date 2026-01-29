'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';

export type GenerationQueueItem = {
  id: string;
  type: 'image' | 'video' | 'music' | 'upscale' | 'vectorize' | 'removebg' | 'erase' | 'expand' | 'storyboard' | 'script' | 'scene' | 'error';
  operationName: string; // Display name like "Generating Image", "Upscaling", etc.
  prompt?: string; // Optional - plugins may not have prompts
  model: string;
  total: number;
  index: number;
  startedAt: number;
  completed?: boolean; // Track if operation completed successfully
  completedAt?: number; // Timestamp when operation completed (to freeze elapsed time)
  error?: boolean; // Track if this is an error message
};

interface GenerationQueueProps {
  items: GenerationQueueItem[];
}

const formatElapsed = (startedAt: number, completedAt?: number) => {
  // Use completedAt if available (frozen time), otherwise use current time
  const endTime = completedAt || Date.now();
  const diffMs = endTime - startedAt;
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const GenerationQueue: React.FC<GenerationQueueProps> = ({ items }) => {
  const isDark = useIsDarkTheme();
  const [localItems, setLocalItems] = useState<GenerationQueueItem[]>(items.filter(item => !item.completed || item.error));
  const [, setTick] = useState(0); // Force re-render for elapsed time updates

  // Sync local items with props and filter out completed items (but keep errors)
  useEffect(() => {
    // Remove completed items immediately - don't show them in queue (but keep errors)
    const activeItems = items.filter(item => !item.completed || item.error);
    setLocalItems(activeItems);
  }, [items]);

  // Update elapsed time every second (only for non-completed items)
  useEffect(() => {
    const hasActiveItems = localItems.some(item => !item.completed);
    if (!hasActiveItems) return; // No need to update if all items are completed

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [localItems.filter(i => !i.completed).length]); // Only run when there are active items

  // Sort items by startedAt (oldest first, newest last) - latest at bottom
  const sortedItems = useMemo(() => {
    if (!localItems.length) return [];
    // Sort by startedAt ascending (oldest first, newest last)
    return [...localItems].sort((a, b) => a.startedAt - b.startedAt);
  }, [localItems]);

  if (!sortedItems.length) return null;

  // Theme colors
  const bgColor = isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(226, 232, 240, 0.8)';
  const textColor = isDark ? '#ffffff' : '#1e293b'; // Use pure white for dark theme for better visibility
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)'; // For elapsed time and indicators
  const shadowColor = isDark
    ? '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
    : '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
  const spinnerBorderColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(203, 213, 225, 0.7)';
  const spinnerTopColor = '#2563eb'; // Blue spinner color works for both themes

  // Calculate max height for 3 items (each item ~50px + gap 10px = ~170px total)
  const itemHeight = 50; // Approximate height per item
  const gap = 10;
  const maxVisibleHeight = 3 * itemHeight + 2 * gap; // 3 items + 2 gaps = 170px
  const hasMoreItems = sortedItems.length > 3;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          right: 24,
          top: 24,
          width: 320,
          maxHeight: maxVisibleHeight,
          zIndex: 6000,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none', // Allow clicks to pass through container
          overflowY: hasMoreItems ? 'auto' : 'visible',
          overflowX: 'hidden',
          // Custom scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: isDark ? 'rgba(255, 255, 255, 0.3) rgba(18, 18, 18, 0.5)' : 'rgba(0, 0, 0, 0.3) rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Show indicator if there are more items */}
        {hasMoreItems && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: secondaryTextColor,
              textAlign: 'center',
              padding: '4px 8px',
              pointerEvents: 'auto',
              flexShrink: 0,
            }}
          >
            {sortedItems.length - 3} more in queue (scroll to see)
          </div>
        )}
        {sortedItems.map((item) => {
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
                backgroundColor: bgColor,
                border: `1px solid ${borderColor}`,
                boxShadow: shadowColor,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                pointerEvents: 'auto', // Re-enable clicks on items
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isCompleted ? 'scale(0.98)' : 'scale(1)',
                opacity: isCompleted ? 0.9 : 1,
                flexShrink: 0,
              }}
            >
              {item.error ? (
                // Red warning icon for errors
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 4V6M6 8H6.01M6 11C3.24 11 1 8.76 1 6C1 3.24 3.24 1 6 1C8.76 1 11 3.24 11 6C11 8.76 8.76 11 6 11Z"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : isCompleted ? (
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
                    border: `2px solid ${spinnerBorderColor}`,
                    borderTopColor: spinnerTopColor,
                    animation: 'wm-queue-spin 0.85s linear infinite',
                    flexShrink: 0,
                  }}
                />
              )}
              <div
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: 500,
                  color: textColor,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.operationName}
              </div>
              {/* Show elapsed time */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 400,
                  color: secondaryTextColor,
                  flexShrink: 0,
                }}
              >
                {formatElapsed(item.startedAt, item.completedAt)}
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
          @keyframes wm-queue-checkmark {
            0% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
          /* Custom scrollbar for webkit browsers */
          div::-webkit-scrollbar {
            width: 6px;
          }
          div::-webkit-scrollbar-track {
            background: ${isDark ? 'rgba(18, 18, 18, 0.5)' : 'rgba(255, 255, 255, 0.5)'};
            border-radius: 3px;
          }
          div::-webkit-scrollbar-thumb {
            background: ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
            border-radius: 3px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: ${isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};
          }
        `}
      </style>
    </>
  );
};

export default GenerationQueue;

