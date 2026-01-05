'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Connection, ActiveDrag } from './types';
import { computeNodeCenter, computeStrokeForScale, computeCircleRadiusForScale } from './utils';
import Konva from 'konva';

let connectionAnimationStylesInjected = false;
const ensureConnectionAnimationStyles = () => {
  if (connectionAnimationStylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'connection-line-animations';
  style.innerHTML = `
    @keyframes connection-line-dash {
      0% {
        stroke-dashoffset: var(--sweepStart, 0);
        opacity: 0.15;
      }
      30% {
        opacity: 0.8;
      }
      70% {
        opacity: 0.95;
      }
      100% {
        stroke-dashoffset: 0;
        opacity: 0.15;
      }
    }
  `;
  document.head.appendChild(style);
  connectionAnimationStylesInjected = true;
};

const GLOW_GRADIENT_ID = 'connection-line-glow-gradient';

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
  multiangleCameraModalStates?: any[];
  removeBgModalStates?: any[];
  eraseModalStates?: any[];
  expandModalStates?: any[];
  vectorizeModalStates?: any[];
  nextSceneModalStates?: any[];
  storyboardModalStates?: any[];
  scriptFrameModalStates?: any[];
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
  multiangleCameraModalStates,
  removeBgModalStates,
  eraseModalStates,
  expandModalStates,
  vectorizeModalStates,
  nextSceneModalStates,
  storyboardModalStates,
  scriptFrameModalStates,
  sceneFrameModalStates,
  viewportUpdateKey,
}) => {
  // Force recalculation key that updates immediately (no animation delay)
  const [recalcKey, setRecalcKey] = useState(0);

  useEffect(() => {
    ensureConnectionAnimationStyles();
  }, []);

  // Force immediate recalculation when scale or position changes (no animation)
  useEffect(() => {
    // Update immediately without delay to prevent animation
    setRecalcKey(prev => prev + 1);
  }, [scale, position.x, position.y, viewportUpdateKey]);

  const generatingNodeIds = useMemo(() => {
    const ids = new Set<string>();
    imageModalStates?.forEach(modal => {
      if (modal?.id && modal.isGenerating) ids.add(modal.id);
    });
    videoModalStates?.forEach(modal => {
      if (!modal?.id) return;
      const status = typeof modal.status === 'string' ? modal.status.toLowerCase() : undefined;
      if (status && ['completed', 'succeeded', 'success', 'failed', 'error', 'cancelled', 'canceled'].includes(status)) {
        return;
      }
      if (status && status.length > 0) {
        ids.add(modal.id);
      }
    });
    musicModalStates?.forEach(modal => {
      if (modal?.id && (modal as any).isGenerating) ids.add(modal.id);
    });
    upscaleModalStates?.forEach(modal => {
      if (modal?.id && modal.isUpscaling) ids.add(modal.id);
    });
    removeBgModalStates?.forEach(modal => {
      if (modal?.id && modal.isRemovingBg) ids.add(modal.id);
    });
    eraseModalStates?.forEach(modal => {
      if (modal?.id && modal.isErasing) ids.add(modal.id);
    });
    expandModalStates?.forEach(modal => {
      if (modal?.id && modal.isExpanding) ids.add(modal.id);
    });
    vectorizeModalStates?.forEach(modal => {
      if (modal?.id && modal.isVectorizing) ids.add(modal.id);
    });
    scriptFrameModalStates?.forEach(modal => {
      if (modal?.id && modal.isLoading) ids.add(modal.id);
    });
    nextSceneModalStates?.forEach(modal => {
      if (modal?.id && modal.isProcessing) ids.add(modal.id);
    });
    return ids;
  }, [imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, removeBgModalStates, eraseModalStates, expandModalStates, vectorizeModalStates, nextSceneModalStates, scriptFrameModalStates]);

  // Memoize connection lines to recalculate when viewport changes
  const connectionLines = useMemo(() => {
    // Filter out duplicates and compute connection lines
    const seen = new Set<string>();
    const domCache = new Map<string, Element | null>();

    return connections
      .map(conn => {
        // Create a unique key for deduplication
        const uniqueKey = `${conn.from}-${conn.to}`;

        // Skip if we've already seen this connection
        if (seen.has(uniqueKey)) {
          return null;
        }
        seen.add(uniqueKey);

        const fromCenter = computeNodeCenter(conn.from, conn.fromAnchor || 'send', stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, multiangleCameraModalStates, removeBgModalStates, eraseModalStates, expandModalStates, vectorizeModalStates, nextSceneModalStates, storyboardModalStates, scriptFrameModalStates, sceneFrameModalStates, domCache);
        const toCenter = computeNodeCenter(conn.to, conn.toAnchor || 'receive', stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, multiangleCameraModalStates, removeBgModalStates, eraseModalStates, expandModalStates, vectorizeModalStates, nextSceneModalStates, storyboardModalStates, scriptFrameModalStates, sceneFrameModalStates, domCache);
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
  }, [connections, position.x, position.y, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, multiangleCameraModalStates, removeBgModalStates, eraseModalStates, expandModalStates, vectorizeModalStates, nextSceneModalStates, storyboardModalStates, scriptFrameModalStates, sceneFrameModalStates, viewportUpdateKey, recalcKey, stageRef]);

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
        transform: 'none', // Ensure no transforms affect the SVG
        // No viewBox - use pixel coordinates directly to ensure circles maintain fixed size
      }}
    >
      <defs>
        <linearGradient id={GLOW_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1b3a68" stopOpacity="0" />
          <stop offset="35%" stopColor="#60a5fa" stopOpacity="0.9" />
          <stop offset="65%" stopColor="#60a5fa" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#1b3a68" stopOpacity="0" />
        </linearGradient>
      </defs>
      {connectionLines.map((line, index) => {
        const connectionId = line.id || `conn-${line.from}-${line.to}-${index}`;
        const isSelected = selectedConnectionId === connectionId;
        const isLineGenerating = generatingNodeIds.has(line.to);
        // When selected, match the active drag line style exactly
        const strokeColor = '#437eb5'; // Same color as active drag
        // When selected, use same width calculation as active drag (1.6 scaled)
        const strokeWidth = isSelected ? computeStrokeForScale(1.6, scale) : computeStrokeForScale(2, scale);
        const glowWidth = Math.max(5, 7 * scale);
        const sweepWidth = Math.max(6, 9 * scale);
        const dx = line.toX - line.fromX;
        const dy = line.toY - line.fromY;
        const approxLength = Math.max(48, Math.hypot(dx, dy) + Math.abs(dy) * 0.55);
        const sweepSegmentLength = Math.max(Math.min(approxLength * 0.8, 220 * scale), 70);
        const sweepStartOffset = approxLength + sweepSegmentLength + Math.max(30, 40 * scale);
        const dashAnimationDuration = Math.max(1.6, (approxLength + sweepSegmentLength) / (100 * Math.max(scale, 0.4)));

        // Bezier Control Point Logic
        // Enforce a minimum straight segment ("2cm" approx 65px) coming out of the nodes
        const minStraight = 65 * scale;

        // Calculate control distance
        // For standard flow (Left->Right), we allow some scaling but cap it to prevent huge loops.
        // For reverse flow (Right->Left), we strictly cap it to ensure consistent loop size.
        const absDx = Math.abs(dx);
        // Base control distance is usually half distance or minStraight
        let controlDist = Math.max(absDx * 0.5, minStraight);

        // Cap the control distance to ensure curvature consistency ("don't increase curve when far")
        // approx 250px max loop size
        const maxLoop = 250 * scale;
        controlDist = Math.min(controlDist, maxLoop);

        // CP1 extends Right from source. CP2 extends Left from target.
        const cp1x = line.fromX + controlDist;
        const cp2x = line.toX - controlDist;

        const pathData = `M ${line.fromX} ${line.fromY} C ${cp1x} ${line.fromY}, ${cp2x} ${line.toY}, ${line.toX} ${line.toY}`;

        return (
          <g key={connectionId}>
            {/* Dashed helper line showing connection path (like in demo) */}
            <path
              d={pathData}
              stroke="#666"
              strokeWidth={computeStrokeForScale(3, scale)}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${10 * scale} ${10 * scale} 0 ${10 * scale}`}
              opacity={0.3}
              style={{
                pointerEvents: 'none',
                transition: 'none',
              }}
            />
            {/* Main connection line */}
            <path
              d={pathData}
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
            {isLineGenerating && (
              <>
                {[-dashAnimationDuration / 2, 0].map((delay, idx) => (
                  <path
                    key={`${connectionId}-glow-${idx}`}
                    d={pathData}
                    stroke={`url(#${GLOW_GRADIENT_ID})`}
                    strokeWidth={idx === 0 ? glowWidth : sweepWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.max(sweepSegmentLength, 1)} ${approxLength}`}
                    style={{
                      pointerEvents: 'none',
                      filter: idx === 0 ? 'blur(7px)' : 'drop-shadow(0 0 18px rgba(201,236,255,0.9))',
                      '--sweepStart': sweepStartOffset, // Pass as CSS variable
                      animationName: 'connection-line-dash',
                      animationDuration: `${dashAnimationDuration}s`,
                      animationTimingFunction: 'linear',
                      animationIterationCount: 'infinite',
                      animationDelay: `${delay}s`,
                    } as React.CSSProperties}
                  />
                ))}
              </>
            )}
            <circle
              cx={line.fromX}
              cy={line.fromY}
              r={computeCircleRadiusForScale(3, scale)}
              fill={strokeColor}
              style={{
                pointerEvents: 'auto',
                cursor: 'pointer',
                transition: 'none', // Disable transitions to prevent animation
                transform: 'none', // Ensure no transforms affect circle size
                // Circle radius is fixed at 2px via computeCircleRadiusForScale to match background dots
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
                transform: 'none', // Ensure no transforms affect circle size
                // Circle radius is fixed at 2px via computeCircleRadiusForScale to match background dots
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
        <>
          {/* Dashed helper line for active drag */}
          <path
            d={`M ${activeDrag.startX} ${activeDrag.startY} C ${activeDrag.startX + 100 * scale} ${activeDrag.startY}, ${activeDrag.currentX - 100 * scale} ${activeDrag.currentY}, ${activeDrag.currentX} ${activeDrag.currentY}`}
            stroke="#666"
            strokeWidth={computeStrokeForScale(3, scale)}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${10 * scale} ${10 * scale} 0 ${10 * scale}`}
            opacity={0.3}
            style={{
              pointerEvents: 'none',
            }}
          />
          {/* Main active drag line */}
          <path
            d={`M ${activeDrag.startX} ${activeDrag.startY} C ${activeDrag.startX + 100 * scale} ${activeDrag.startY}, ${activeDrag.currentX - 100 * scale} ${activeDrag.currentY}, ${activeDrag.currentX} ${activeDrag.currentY}`}
            stroke="#437eb5"
            strokeWidth={computeStrokeForScale(1.6, scale)}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${6 * scale} ${4 * scale}`}
          />
        </>
      )}
    </svg>
  );
};

