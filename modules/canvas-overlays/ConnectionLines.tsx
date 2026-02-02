'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
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
  isInteracting?: boolean;
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
  isInteracting = false,
}) => {
  useEffect(() => {
    ensureConnectionAnimationStyles();
  }, []);

  // Track which line is being hovered for delete icon display
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  // Track mouse position along the hovered line for icon positioning
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  // Track if we're hovering over the delete icon to prevent flickering
  const hoverIconRef = useRef<string | null>(null);

  // Force recalculation during interaction using RAF loop
  const [forceUpdate, setForceUpdate] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isInteracting) {
      // During interaction, force recalculation every frame for smooth movement
      const update = () => {
        setForceUpdate(prev => prev + 1);
        rafRef.current = requestAnimationFrame(update);
      };
      rafRef.current = requestAnimationFrame(update);
      return () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    } else {
      // Stop RAF loop when not interacting
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  }, [isInteracting]);

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

  // Use useMemo for instant, synchronous recalculation - no RAF delay
  // This ensures lines update immediately when components move
  const connectionLines = useMemo(() => {
    // Filter out duplicates and compute connection lines
    const seen = new Set<string>();
    // Always use a DOM cache map for lookups within this specific calculation
    const domCache = new Map<string, Element | null>();

    const lines = connections
      .map(conn => {
        // Create a unique key for deduplication
        const uniqueKey = `${conn.from}-${conn.to}`;

        // Skip if we've already seen this connection
        if (seen.has(uniqueKey)) {
          return null;
        }
        seen.add(uniqueKey);

        // Always try DOM reads first for precise node positions
        // This ensures lines connect exactly to the circular connection nodes
        // The computeNodeCenter function will fall back to state-based if DOM not available
        const fromCenter = computeNodeCenter(conn.from, conn.fromAnchor || 'send', stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, multiangleCameraModalStates, removeBgModalStates, eraseModalStates, expandModalStates, vectorizeModalStates, nextSceneModalStates, storyboardModalStates, scriptFrameModalStates, sceneFrameModalStates, domCache, false);
        const toCenter = computeNodeCenter(conn.to, conn.toAnchor || 'receive', stageRef, position, scale, textInputStates, imageModalStates, videoModalStates, musicModalStates, upscaleModalStates, multiangleCameraModalStates, removeBgModalStates, eraseModalStates, expandModalStates, vectorizeModalStates, nextSceneModalStates, storyboardModalStates, scriptFrameModalStates, sceneFrameModalStates, domCache, false);
        if (!fromCenter || !toCenter) {
          return null;
        }
        return { ...conn, fromX: fromCenter.x, fromY: fromCenter.y, toX: toCenter.x, toY: toCenter.y };
      })
      .filter(Boolean) as Array<{ id?: string; from: string; to: string; color: string; fromX: number; fromY: number; toX: number; toY: number }>;

    return lines;
  }, [
    connections,
    position.x,
    position.y,
    scale,
    // Include all modal state arrays - useMemo will recalculate when any x/y changes
    // during drag because React will detect the array reference change
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
    viewportUpdateKey, // Force recalculation when viewport updates
    isInteracting, // Force recalculation during interaction
    forceUpdate, // Force recalculation every frame during interaction
    stageRef
  ]);

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
        const strokeColor = '#4C83FF'; // Same color as active drag
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
        const cp2x = line.toX - controlDist

        const pathData = `M ${line.fromX} ${line.fromY} C ${cp1x} ${line.fromY}, ${cp2x} ${line.toY}, ${line.toX} ${line.toY}`;

        const isHovered = hoveredConnectionId === connectionId;

        // Helper function to calculate point on bezier curve at parameter t
        const bezierPoint = (t: number) => {
          const mt = 1 - t;
          const x = mt * mt * mt * line.fromX + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * line.toX;
          const y = mt * mt * mt * line.fromY + 3 * mt * mt * t * line.fromY + 3 * mt * t * t * line.toY + t * t * t * line.toY;
          return { x, y };
        };

        // Helper function to find closest point on bezier curve to mouse position
        const findClosestPointOnCurve = (mouseX: number, mouseY: number) => {
          let closestT = 0.5;
          let minDist = Infinity;

          // Sample the curve at multiple points to find the closest
          for (let t = 0; t <= 1; t += 0.01) {
            const point = bezierPoint(t);
            const dist = Math.hypot(point.x - mouseX, point.y - mouseY);
            if (dist < minDist) {
              minDist = dist;
              closestT = t;
            }
          }

          // Refine with binary search around the closest point
          let low = Math.max(0, closestT - 0.05);
          let high = Math.min(1, closestT + 0.05);
          for (let i = 0; i < 10; i++) {
            const mid1 = (low + closestT) / 2;
            const mid2 = (closestT + high) / 2;
            const p1 = bezierPoint(mid1);
            const p2 = bezierPoint(mid2);
            const d1 = Math.hypot(p1.x - mouseX, p1.y - mouseY);
            const d2 = Math.hypot(p2.x - mouseX, p2.y - mouseY);

            if (d1 < d2) {
              high = closestT;
              closestT = mid1;
            } else {
              low = closestT;
              closestT = mid2;
            }
          }

          return bezierPoint(closestT);
        };

        // Only show icon when hovering and we have a valid hover position
        // Don't show fallback midpoint to prevent double icons
        const shouldShowIcon = isHovered && hoverPosition !== null;
        const iconX = hoverPosition?.x ?? 0;
        const iconY = hoverPosition?.y ?? 0;

        return (
          <g key={connectionId}>
            {/* Invisible wider path for easier hover detection */}
            <path
              d={pathData}
              stroke="transparent"
              strokeWidth={Math.max(40 * scale, 50)} // Much wider hit area (40-50px) for easier hover
              fill="none"
              strokeLinecap="round"
              style={{
                pointerEvents: 'auto', // Make this the hover target
                cursor: 'pointer',
                transition: 'none',
              }}
              onMouseEnter={(e) => {
                // Clear icon hover ref when entering path
                hoverIconRef.current = null;
                setHoveredConnectionId(connectionId);
                // Calculate initial hover position - get mouse position relative to SVG
                const svgElement = e.currentTarget.ownerSVGElement;
                if (svgElement) {
                  const svgPoint = svgElement.createSVGPoint();
                  svgPoint.x = e.clientX;
                  svgPoint.y = e.clientY;
                  const ctm = svgElement.getScreenCTM();
                  if (ctm) {
                    const invertedCTM = ctm.inverse();
                    const transformedPoint = svgPoint.matrixTransform(invertedCTM);
                    const closestPoint = findClosestPointOnCurve(transformedPoint.x, transformedPoint.y);
                    setHoverPosition(closestPoint);
                  }
                }
              }}
              onMouseLeave={() => {
                // Only clear if we're not moving to the delete icon
                if (hoverIconRef.current !== connectionId) {
                  setHoveredConnectionId(null);
                  setHoverPosition(null);
                }
              }}
              onMouseMove={(e) => {
                // Always update hover position as mouse moves along the line
                const svgElement = e.currentTarget.ownerSVGElement;
                if (svgElement) {
                  const svgPoint = svgElement.createSVGPoint();
                  svgPoint.x = e.clientX;
                  svgPoint.y = e.clientY;
                  const ctm = svgElement.getScreenCTM();
                  if (ctm) {
                    const invertedCTM = ctm.inverse();
                    const transformedPoint = svgPoint.matrixTransform(invertedCTM);
                    const closestPoint = findClosestPointOnCurve(transformedPoint.x, transformedPoint.y);
                    setHoverPosition(closestPoint);
                  }
                }
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
            />
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
                pointerEvents: 'none', // Disable pointer events on visible line to prevent conflicts
                cursor: 'pointer',
                transition: 'none', // Disable transitions to prevent animation
              }}
              onMouseMove={(e) => {
                // Update visual hover effect on the visible line
                if (!isSelected) {
                  e.currentTarget.style.stroke = isHovered ? '#2a4d73' : strokeColor;
                  e.currentTarget.style.strokeWidth = isHovered ? String(computeStrokeForScale(2.2, scale)) : String(strokeWidth);
                } else {
                  // Keep selected state (same as active drag)
                  e.currentTarget.style.stroke = '#4C83FF';
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
            {/* Delete icon (scissors) that appears on hover */}
            {shouldShowIcon && onDeleteConnection && hoverPosition && (
              <g
                data-delete-icon={connectionId}
                onMouseEnter={() => {
                  // Keep hover state when mouse enters the icon
                  hoverIconRef.current = connectionId;
                  setHoveredConnectionId(connectionId);
                }}
                onMouseLeave={() => {
                  // Clear icon hover ref and check if we should clear hover state
                  hoverIconRef.current = null;
                  // Small delay to allow path to detect mouse enter if moving back
                  setTimeout(() => {
                    if (hoverIconRef.current !== connectionId && hoveredConnectionId === connectionId) {
                      setHoveredConnectionId(null);
                      setHoverPosition(null);
                    }
                  }, 10);
                }}
              >
                {/* Background circle for better visibility */}
                <circle
                  cx={iconX}
                  cy={iconY}
                  r={14 * scale}
                  fill="rgba(0, 0, 0, 0.8)"
                  stroke="rgba(255, 255, 255, 0.95)"
                  strokeWidth={2 * scale}
                  style={{
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (onDeleteConnection) {
                      onDeleteConnection(connectionId);
                      setHoveredConnectionId(null);
                      setHoverPosition(null);
                    }
                  }}
                  onMouseDown={(e) => {
                    // Prevent event from bubbling to path click handler
                    e.stopPropagation();
                  }}
                />
                {/* Scissors icon (X shape) */}
                <g
                  transform={`translate(${iconX}, ${iconY})`}
                  style={{
                    pointerEvents: 'none',
                  }}
                >
                  <line
                    x1={-7 * scale}
                    y1={-7 * scale}
                    x2={7 * scale}
                    y2={7 * scale}
                    stroke="rgba(255, 255, 255, 1)"
                    strokeWidth={2.5 * scale}
                    strokeLinecap="round"
                  />
                  <line
                    x1={7 * scale}
                    y1={-7 * scale}
                    x2={-7 * scale}
                    y2={7 * scale}
                    stroke="rgba(255, 255, 255, 1)"
                    strokeWidth={2.5 * scale}
                    strokeLinecap="round"
                  />
                </g>
              </g>
            )}
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
            stroke="#4C83FF"
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

