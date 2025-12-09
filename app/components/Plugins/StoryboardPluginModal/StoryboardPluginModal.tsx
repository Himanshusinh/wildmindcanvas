'use client';

import { useState, useRef, useEffect } from 'react';
import '../../common/canvasCaptureGuard';
import { StoryboardConnectionNodes } from './StoryboardConnectionNodes';
import { StoryboardControls } from './StoryboardControls';
import { ImageModalState } from '../../ModalOverlays/types';
import { ImageUpload } from '@/types/canvas';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface StoryboardPluginModalProps {
  isOpen: boolean;
  id?: string;
  onClose: () => void;
  stageRef: React.RefObject<any>;
  scale: number;
  position: { x: number; y: number };
  x: number;
  y: number;
  onPositionChange?: (x: number, y: number) => void;
  onPositionCommit?: (x: number, y: number) => void;
  onSelect?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onDuplicate?: () => void;
  isSelected?: boolean;
  frameWidth?: number;
  frameHeight?: number;
  onOptionsChange?: (opts: { frameWidth?: number; frameHeight?: number; characterInput?: string; characterNames?: string; backgroundDescription?: string; specialRequest?: string; characterNamesMap?: Record<number, string>; propsNamesMap?: Record<number, string>; backgroundNamesMap?: Record<number, string> }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }>;
  textInputStates?: Array<{ id: string; x: number; y: number; value?: string; autoFocusInput?: boolean }>;
  scriptText?: string | null;
  initialCharacterInput?: string;
  initialCharacterNames?: string;
  initialBackgroundDescription?: string;
  initialSpecialRequest?: string;
  initialCharacterNamesMap?: Record<number, string>;
  initialPropsNamesMap?: Record<number, string>;
  initialBackgroundNamesMap?: Record<number, string>;
  imageModalStates?: ImageModalState[];
  images?: ImageUpload[];
  onGenerate?: (inputs: {
    characterInput?: string;
    characterNames?: string;
    backgroundDescription?: string;
    specialRequest?: string;
  }) => void;
}

export const StoryboardPluginModal: React.FC<StoryboardPluginModalProps> = ({
  isOpen,
  id,
  onClose,
  stageRef,
  scale,
  position,
  x,
  y,
  onPositionChange,
  onPositionCommit,
  onSelect,
  onDelete,
  onDownload,
  onDuplicate,
  isSelected,
  frameWidth = 400,
  frameHeight = 500,
  onOptionsChange,
  connections = [],
  textInputStates = [],
  scriptText,
  initialCharacterInput = '',
  initialCharacterNames = '',
  initialBackgroundDescription = '',
  initialSpecialRequest = '',
  initialCharacterNamesMap = {},
  initialPropsNamesMap = {},
  initialBackgroundNamesMap = {},
  imageModalStates = [],
  images = [],
  onGenerate,
}) => {
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const dragOriginRef = useRef<{ x: number; y: number }>({ x, y });
  const activePointerIdRef = useRef<number | null>(null);
  const pointerTypeRef = useRef<string | null>(null);
  const isDark = useIsDarkTheme();

  // New state for controls
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [characterInput, setCharacterInput] = useState(initialCharacterInput);
  const [characterNames, setCharacterNames] = useState(initialCharacterNames);
  const [backgroundDescription, setBackgroundDescription] = useState(initialBackgroundDescription);
  const [specialRequest, setSpecialRequest] = useState(initialSpecialRequest);
  const [characterNamesMap, setCharacterNamesMap] = useState<Record<number, string>>(initialCharacterNamesMap);
  const [propsNamesMap, setPropsNamesMap] = useState<Record<number, string>>(initialPropsNamesMap);
  const [backgroundNamesMap, setBackgroundNamesMap] = useState<Record<number, string>>(initialBackgroundNamesMap);

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const circleDiameter = 100 * scale;
  const controlsWidthPx = `${400 * scale}px`;
  const overlapRatio = 0.3;
  const popupOverlap = Math.max(0, (circleDiameter * overlapRatio) - (8 * scale));

  const frameBorderColor = isDark ? '#3a3a3a' : '#a0a0a0';
  const frameBorderWidth = 2;

  const isDragBlockedTarget = (target: Element | null) => {
    if (!target) return true;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || Boolean(target.closest('button'));
    const isImage = target.tagName === 'IMG';
    const isControls = Boolean(target.closest('.controls-overlay'));
    const isActionIcons =
      Boolean(target.closest('[data-action-icons]')) ||
      Boolean(target.closest('button[title="Delete"], button[title="Download"], button[title="Duplicate"], button[title="Copy"], button[title="Edit"]'));
    const isConnectionNode =
      Boolean(target.closest('[data-node-id]')) || target.hasAttribute('data-node-id') || target.hasAttribute('data-node-side');

    return isInput || isButton || isImage || isControls || isActionIcons || isConnectionNode;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as Element;
    const isBlocked = isDragBlockedTarget(target);

    if (onSelect && !isBlocked) {
      onSelect();
    }

    if (!isBlocked) {
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      dragOriginRef.current = { x, y };
      hasDraggedRef.current = false;
      lastCanvasPosRef.current = null;
      pointerTypeRef.current = e.pointerType;
      activePointerIdRef.current = e.pointerId;
      setIsDraggingContainer(true);

      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch (err) {
        // ignore
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }

      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Handle drag
  useEffect(() => {
    if (!isDraggingContainer) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current || !onPositionChange) return;
      const activeId = activePointerIdRef.current;
      if (activeId !== null && e.pointerId !== activeId) return;

      if (dragStartPosRef.current) {
        const dx = Math.abs(e.clientX - dragStartPosRef.current.x);
        const dy = Math.abs(e.clientY - dragStartPosRef.current.y);
        if (dx > 5 || dy > 5) {
          hasDraggedRef.current = true;
        }
      }

      const newScreenX = e.clientX - dragOffset.x;
      const newScreenY = e.clientY - dragOffset.y;
      const newCanvasX = (newScreenX - position.x) / scale;
      const newCanvasY = (newScreenY - position.y) / scale;

      onPositionChange(newCanvasX, newCanvasY);
      lastCanvasPosRef.current = { x: newCanvasX, y: newCanvasY };
      e.preventDefault();
    };

    const finishDrag = () => {
      const wasDragging = hasDraggedRef.current;
      setIsDraggingContainer(false);
      dragStartPosRef.current = null;
      pointerTypeRef.current = null;

      if (!wasDragging) {
        setIsPopupOpen(prev => !prev);
      }

      if (wasDragging && onPositionCommit) {
        const fallback = dragOriginRef.current;
        const finalX = lastCanvasPosRef.current?.x ?? fallback.x;
        const finalY = lastCanvasPosRef.current?.y ?? fallback.y;
        onPositionCommit(finalX, finalY);
      }

      hasDraggedRef.current = false;
      lastCanvasPosRef.current = null;
      activePointerIdRef.current = null;
    };

    const handlePointerUp = (e: PointerEvent) => {
      const activeId = activePointerIdRef.current;
      if (activeId !== null && e.pointerId !== activeId) return;
      try {
        containerRef.current?.releasePointerCapture?.(e.pointerId);
      } catch (err) {
        // ignore
      }
      finishDrag();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDraggingContainer, dragOffset, scale, position, onPositionChange, onPositionCommit]);

  const handleGenerate = () => {
    console.log('Generate Storyboard', {
      characterInput,
      characterNames,
      backgroundDescription,
      specialRequest,
    });
    if (onGenerate) {
      onGenerate({
        characterInput,
        characterNames,
        backgroundDescription,
        specialRequest,
      });
    }
  };

  const updateOptions = (updates: Partial<{ characterInput: string; characterNames: string; backgroundDescription: string; specialRequest: string; characterNamesMap: Record<number, string>; propsNamesMap: Record<number, string>; backgroundNamesMap: Record<number, string> }>) => {
    if (onOptionsChange) {
      onOptionsChange(updates);
    }
  };

  // Resolve connected images
  const getConnectedImages = (anchor: string): string[] => {
    if (!id || !connections) return [];
    const matchingConnections = connections.filter(c => c.to === id && c.toAnchor === anchor);

    const imageUrls: string[] = [];

    matchingConnections.forEach(connection => {
      const imageNode = imageModalStates.find(img => img.id === connection.from);
      if (imageNode) {
        if (imageNode.generatedImageUrl) imageUrls.push(imageNode.generatedImageUrl);
        else if (imageNode.sourceImageUrl) imageUrls.push(imageNode.sourceImageUrl);
      } else {
        const mediaImage = images.find(img => img.elementId === connection.from);
        if (mediaImage && mediaImage.url) {
          imageUrls.push(mediaImage.url);
        }
      }
    });

    return imageUrls;
  };

  const connectedCharacterImages = getConnectedImages('receive-character');
  const connectedBackgroundImages = getConnectedImages('receive-background');
  const connectedPropsImages = getConnectedImages('receive-props');

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      data-modal-component="storyboard"
      data-overlay-id={id}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        zIndex: isHovered || isSelected ? 2001 : 2000,
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Plugin node design with icon and label */}
      <div
        data-frame-id={id ? `${id}-frame` : undefined}
        style={{
          position: 'relative',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 10,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPointerDown={handlePointerDown}
      >
        {/* Label above */}
        <div
          style={{
            position: 'relative',
            marginBottom: `${8 * scale}px`,
            fontSize: `${12 * scale}px`,
            fontWeight: 500,
            color: isDark ? '#ffffff' : '#1a1a1a',
            textAlign: 'center',
            userSelect: 'none',
            transition: 'color 0.3s ease',
            letterSpacing: '0.2px',
          }}
        >
          Storyboard

          {/* Delete button - always visible */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onDelete) {
                onDelete();
              }
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              const defaultBg = isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)';
              const defaultColor = isDark ? '#cccccc' : '#4b5563';
              e.currentTarget.style.backgroundColor = defaultBg;
              e.currentTarget.style.color = defaultColor;
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            }}
            style={{
              position: 'absolute',
              top: `${-36 * scale}px`,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: `${28 * scale}px`,
              height: `${28 * scale}px`,
              padding: 0,
              backgroundColor: isDark ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderRadius: `${8 * scale}px`,
              color: isDark ? '#cccccc' : '#4b5563',
              cursor: 'pointer',
              boxShadow: `0 ${4 * scale}px ${12 * scale}px ${isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)'}`,
              zIndex: 3001,
              pointerEvents: 'auto',
            }}
            title="Delete plugin"
          >
            <svg
              width={`${16 * scale}px`}
              height={`${16 * scale}px`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>

        {/* Main plugin container - Circular */}
        <div
          style={{
            position: 'relative',
            width: `${100 * scale}px`,
            height: `${100 * scale}px`,
            backgroundColor: isDark ? '#2d2d2d' : '#e5e5e5',
            borderRadius: '50%',
            border: `${1.5 * scale}px solid ${isSelected ? '#437eb5' : (isDark ? '#3a3a3a' : '#a0a0a0')}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s ease, box-shadow 0.2s ease',
            boxShadow: isDark
              ? (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.3)`)
              : (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.2)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.1)`),
            transform: (isHovered || isSelected) ? `scale(1.03)` : 'scale(1)',
            overflow: 'visible',
            zIndex: 20,
          }}
        >
          {/* Storyboard Icon - Using SVG */}
          {/* Storyboard Icon */}
          <img
            src="/icons/film-editing.svg"
            alt="Storyboard"
            style={{
              width: `${40 * scale}px`,
              height: `${40 * scale}px`,
              objectFit: 'contain',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
              filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)',

            }}
            onError={(e) => {
              console.error('[StoryboardPluginModal] Failed to load film-editing.svg icon');
              // Fallback to inline SVG if image fails
              e.currentTarget.style.display = 'none';
              e.currentTarget.insertAdjacentHTML('afterend', `
                <svg
                  width="${40 * scale}px"
                  height="${40 * scale}px"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="${isDark ? '#ffffff' : '#1a1a1a'}"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  style="display: block; user-select: none; pointer-events: none;"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                  <line x1="2" y1="9" x2="22" y2="9" />
                  <line x1="12" y1="3" x2="12" y2="9" />
                </svg>
              `);
            }}
          />

          <StoryboardConnectionNodes
            id={id}
            scale={scale}
            isHovered={isHovered}
            isSelected={isSelected || false}
          />
        </div>

        {/* Controls shown/hidden on click - overlap beneath circle */}
        {isPopupOpen && isSelected && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: `${-popupOverlap}px`,
              zIndex: 15,
              width: controlsWidthPx,
              maxWidth: '90vw',
            }}
          >
            <StoryboardControls
              id={id}
              scale={scale}
              characterInput={characterInput}
              characterNames={characterNames}
              backgroundDescription={backgroundDescription}
              specialRequest={specialRequest}
              connectedCharacterImages={connectedCharacterImages}
              connectedBackgroundImages={connectedBackgroundImages}
              connectedPropsImages={connectedPropsImages}
              frameBorderColor={frameBorderColor}
              frameBorderWidth={frameBorderWidth}
              extraTopPadding={popupOverlap + 16 * scale}
              onCharacterInputChange={(val) => {
                setCharacterInput(val);
                updateOptions({ characterInput: val });
              }}
              onCharacterNamesChange={(val) => {
                setCharacterNames(val);
                updateOptions({ characterNames: val });
              }}
              onBackgroundDescriptionChange={(val) => {
                setBackgroundDescription(val);
                updateOptions({ backgroundDescription: val });
              }}
              onSpecialRequestChange={(val) => {
                setSpecialRequest(val);
                updateOptions({ specialRequest: val });
              }}
              onGenerate={handleGenerate}
              onHoverChange={setIsHovered}
              characterNamesMap={characterNamesMap}
              propsNamesMap={propsNamesMap}
              backgroundNamesMap={backgroundNamesMap}
              onCharacterNamesMapChange={(map) => {
                setCharacterNamesMap(map);
                updateOptions({ characterNamesMap: map });
              }}
              onPropsNamesMapChange={(map) => {
                setPropsNamesMap(map);
                updateOptions({ propsNamesMap: map });
              }}
              onBackgroundNamesMapChange={(map) => {
                setBackgroundNamesMap(map);
                updateOptions({ backgroundNamesMap: map });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

