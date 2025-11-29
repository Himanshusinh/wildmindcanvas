'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Connection, ActiveDrag } from './types';
import { computeNodeCenter, computeStrokeForScale, computeCircleRadiusForScale } from './utils';
import Konva from 'konva';

interface ConnectionLinesProps {
  connections: Connection[];
  activeDrag: ActiveDrag | null;
  selectedConnectionId: string | null;
  onSelectConnection: (id: string | null) => void;
  onDeleteConnection?: (id: string) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  position: { x: number; y: number };
  scale: number;
  textInputStates: any[];
  imageModalStates: any[];
  videoModalStates: any[];
  musicModalStates: any[];
  upscaleModalStates?: any[];
  removeBgModalStates?: any[];
  eraseModalStates?: any[];
  replaceModalStates?: any[];
  expandModalStates?: any[];
  vectorizeModalStates?: any[];
  storyboardModalStates?: any[];
  sceneFrameModalStates?: any[];
  viewportUpdateKey: number;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  connections,
  activeDrag,
  selectedConnectionId,
  onSelectConnection,
  onDeleteConnection,
  stageRef,
  position,
  scale,
  textInputStates,
  imageModalStates,
  videoModalStates,
  musicModalStates,
  upscaleModalStates,
  removeBgModalStates,
  eraseModalStates,
  replaceModalStates,
  expandModalStates,
  vectorizeModalStates,
  storyboardModalStates,
  sceneFrameModalStates,
  viewportUpdateKey,
}) => {
  // Force recalculation key that updates immediately (no animation delay)
  const [recalcKey, setRecalcKey] = useState(0);

  // Force immediate recalculation when scale or position changes (no animation)
  useEffect(() => {
    // Update immediately without delay to prevent animation
    setRecalcKey(prev => prev + 1);
  }, [scale, position.x, position.y, viewportUpdateKey]);

  // Memoize connection lines to recalculate when viewport changes
  const connectionLines = useMemo(() => {
    // Filter out duplicates and compute connection lines
    const seen = new Set<string>();
    return connections
      .map(conn => {
        // Create a unique key for deduplication
        const uniqueKey = `${conn.from}-${conn.to}`;

        // Skip if we've already seen this connection
        if (seen.has(uniqueKey)) {
          return null;
        }
        seen.add(uniqueKey);

        const fromCenter = computeNodeCenter(conn.from, conn.fromAnchor || 'send', stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, removeBgModalStates, eraseModalStates, replaceModalStates, expandModalStates, vectorizeModalStates, storyboardModalStates, sceneFrameModalStates);
        const toCenter = computeNodeCenter(conn.to, conn.toAnchor || 'receive', stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, removeBgModalStates, eraseModalStates, replaceModalStates, expandModalStates, vectorizeModalStates, storyboardModalStates, sceneFrameModalStates);
        if (!fromCenter || !toCenter) {
          // Debug: log when nodes can't be found
          if (process.env.NODE_ENV === 'development') {
            console.warn('[ConnectionLines] Could not compute node centers:', {
              from: conn.from,
              to: conn.to,
              fromCenter,
              toCenter,
              fromNode: document.querySelector(`[data-node-id="${conn.from}"][data-node-side="send"]`),
              toNode: document.querySelector(`[data-node-id="${conn.to}"][data-node-side="receive"]`),
            });
          }
          return null;
        }
        return { ...conn, fromX: fromCenter.x, fromY: fromCenter.y, toX: toCenter.x, toY: toCenter.y };
      })
      .filter(Boolean) as Array<{ id?: string; from: string; to: string; color: string; fromX: number; fromY: number; toX: number; toY: number }>;
  }, [connections, position.x, position.y, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, removeBgModalStates, eraseModalStates, replaceModalStates, expandModalStates, vectorizeModalStates, storyboardModalStates, sceneFrameModalStates, viewportUpdateKey, recalcKey, stageRef]);

  return (
    <svg
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        pointerEvents: 'none', 
        zIndex: 1000, // Lower than all components (2000+) so lines appear behind
        transition: 'none', // Disable all transitions
      }}
    >
      {connectionLines.map((line, index) => {
        const connectionId = line.id || `conn-${line.from}-${line.to}-${index}`;
        const isSelected = selectedConnectionId === connectionId;
        // When selected, match the active drag line style exactly
        const strokeColor = '#437eb5'; // Same color as active drag
        // When selected, use same width calculation as active drag (1.6 scaled)
        const strokeWidth = isSelected ? computeStrokeForScale(1.6, scale) : computeStrokeForScale(2, scale);

        return (
          <g key={connectionId}>
            <path
              d={`M ${line.fromX} ${line.fromY} C ${(line.fromX + line.toX) / 2} ${line.fromY}, ${(line.fromX + line.toX) / 2} ${line.toY}, ${line.toX} ${line.toY}`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={isSelected ? `${6 * scale} ${4 * scale}` : 'none'}
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))',
                pointerEvents: 'auto', // Make path clickable
                cursor: 'pointer',
                transition: 'none', // Disable transitions to prevent animation
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Toggle selection: if already selected, deselect; otherwise select
                if (isSelected) {
                  onSelectConnection(null);
                } else {
                  onSelectConnection(connectionId);
                }
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.stroke = '#2a4d73';
                  e.currentTarget.style.strokeWidth = String(computeStrokeForScale(2.2, scale));
                } else {
                  // Keep selected state (same as active drag)
                  e.currentTarget.style.stroke = '#437eb5';
                  e.currentTarget.style.strokeWidth = String(computeStrokeForScale(1.6, scale));
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.stroke = '#437eb5';
                  e.currentTarget.style.strokeWidth = String(computeStrokeForScale(2, scale));
                } else {
                  // Keep selected state (same as active drag)
                  e.currentTarget.style.stroke = '#437eb5';
                  e.currentTarget.style.strokeWidth = String(computeStrokeForScale(1.6, scale));
                }
              }}
            />
            <circle
              cx={line.fromX}
              cy={line.fromY}
              r={computeCircleRadiusForScale(3, scale)}
              fill={strokeColor}
              style={{ 
                pointerEvents: 'auto', 
                cursor: 'pointer',
                transition: 'none', // Disable transitions to prevent animation
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // Delete the connection when clicking on the node circle
                if (onDeleteConnection) {
                  onDeleteConnection(connectionId);
                }
              }}
            />
            <circle
              cx={line.toX}
              cy={line.toY}
              r={computeCircleRadiusForScale(3, scale)}
              fill={strokeColor}
              style={{ 
                pointerEvents: 'auto', 
                cursor: 'pointer',
                transition: 'none', // Disable transitions to prevent animation
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // Delete the connection when clicking on the node circle
                if (onDeleteConnection) {
                  onDeleteConnection(connectionId);
                }
              }}
            />
          </g>
        );
      })}
      {activeDrag && (
        <path
          d={`M ${activeDrag.startX} ${activeDrag.startY} C ${(activeDrag.startX + activeDrag.currentX) / 2} ${activeDrag.startY}, ${(activeDrag.startX + activeDrag.currentX) / 2} ${activeDrag.currentY}, ${activeDrag.currentX} ${activeDrag.currentY}`}
          stroke="#437eb5"
          strokeWidth={computeStrokeForScale(1.6, scale)}
          fill="none"
          strokeDasharray={`${6 * scale} ${4 * scale}`}
        />
      )}
    </svg>
  );
};

