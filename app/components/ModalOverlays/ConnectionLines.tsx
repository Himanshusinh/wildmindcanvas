'use client';

import React, { useMemo } from 'react';
import { Connection, ActiveDrag } from './types';
import { computeNodeCenter, computeStrokeForScale, computeCircleRadiusForScale } from './utils';
import Konva from 'konva';

interface ConnectionLinesProps {
  connections: Connection[];
  activeDrag: ActiveDrag | null;
  selectedConnectionId: string | null;
  onSelectConnection: (id: string) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  position: { x: number; y: number };
  scale: number;
  textInputStates: any[];
  imageModalStates: any[];
  videoModalStates: any[];
  musicModalStates: any[];
  upscaleModalStates?: any[];
  viewportUpdateKey: number;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  connections,
  activeDrag,
  selectedConnectionId,
  onSelectConnection,
  stageRef,
  position,
  scale,
  textInputStates,
  imageModalStates,
  videoModalStates,
  musicModalStates,
  upscaleModalStates,
  viewportUpdateKey,
}) => {
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
        
        const fromCenter = computeNodeCenter(conn.from, 'send', stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates);
        const toCenter = computeNodeCenter(conn.to, 'receive', stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates);
        if (!fromCenter || !toCenter) return null;
        return { ...conn, fromX: fromCenter.x, fromY: fromCenter.y, toX: toCenter.x, toY: toCenter.y };
      })
      .filter(Boolean) as Array<{ id?: string; from: string; to: string; color: string; fromX: number; fromY: number; toX: number; toY: number }>;
  }, [connections, position.x, position.y, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, viewportUpdateKey, stageRef]);

  return (
    <svg
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 1999 }}
    >
      {connectionLines.map((line, index) => {
        const connectionId = line.id || `conn-${line.from}-${line.to}-${index}`;
        const isSelected = selectedConnectionId === connectionId;
        const strokeColor = isSelected ? '#1e3a5f' : '#437eb5'; // Darker when selected
        // When selected, use exactly 1px (not scaled). Otherwise use scaled width
        const strokeWidth = isSelected ? 1 : computeStrokeForScale(2, scale);
        
        return (
          <g key={connectionId}>
            <path
              d={`M ${line.fromX} ${line.fromY} C ${(line.fromX + line.toX) / 2} ${line.fromY}, ${(line.fromX + line.toX) / 2} ${line.toY}, ${line.toX} ${line.toY}`}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ 
                filter: isSelected ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))',
                pointerEvents: 'auto', // Make path clickable
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectConnection(connectionId);
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.stroke = '#2a4d73';
                  e.currentTarget.style.strokeWidth = String(computeStrokeForScale(2.2, scale));
                } else {
                  // Keep selected state (darker, 1px)
                  e.currentTarget.style.stroke = '#1e3a5f';
                  e.currentTarget.style.strokeWidth = '1';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.stroke = '#437eb5';
                  e.currentTarget.style.strokeWidth = String(computeStrokeForScale(2, scale));
                } else {
                  // Keep selected state
                  e.currentTarget.style.stroke = '#1e3a5f';
                  e.currentTarget.style.strokeWidth = '1';
                }
              }}
            />
            <circle 
              cx={line.fromX} 
              cy={line.fromY} 
              r={computeCircleRadiusForScale(3, scale)} 
              fill={strokeColor} 
              vectorEffect="non-scaling-stroke"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectConnection(connectionId);
              }}
            />
            <circle 
              cx={line.toX} 
              cy={line.toY} 
              r={computeCircleRadiusForScale(3, scale)} 
              fill={strokeColor} 
              vectorEffect="non-scaling-stroke"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectConnection(connectionId);
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
          vectorEffect="non-scaling-stroke"
          fill="none"
          strokeDasharray="6 4"
        />
      )}
    </svg>
  );
};

