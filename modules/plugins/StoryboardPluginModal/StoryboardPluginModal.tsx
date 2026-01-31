'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '@/modules/ui-global/common/canvasCaptureGuard';
import { StoryboardConnectionNodes } from './StoryboardConnectionNodes';
import { StoryboardControls } from './StoryboardControls';
import { useCanvasModalDrag } from '../PluginComponents/useCanvasModalDrag';
import { PluginNodeShell } from '../PluginComponents';
import { ImageModalState } from '@/modules/canvas-overlays/types';
import { ImageUpload } from '@/core/types/canvas';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';

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
  sceneFrameModalStates?: Array<{ id: string; scriptFrameId: string; sceneNumber: number;[key: string]: any }>;
  images?: ImageUpload[];
  onGenerate?: (inputs: {
    characterInput?: string;
    characterNames?: string;
    backgroundDescription?: string;
    specialRequest?: string;
  }) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  isAttachedToChat?: boolean;
  selectionOrder?: number;
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
  sceneFrameModalStates = [],
  images = [],
  onGenerate,
  onContextMenu,
  isAttachedToChat,
  selectionOrder,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
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

  const { isDragging: isDraggingContainer, onPointerDown: handlePointerDown } = useCanvasModalDrag({
    enabled: isOpen,
    x,
    y,
    scale,
    position,
    containerRef,
    onPositionChange,
    onPositionCommit,
    onSelect,
    onTap: () => setIsPopupOpen(prev => !prev),
    shouldIgnoreTarget: isDragBlockedTarget,
  });

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

    console.log(`[StoryboardPluginModal] getConnectedImages for anchor "${anchor}":`, {
      storyboardId: id,
      totalConnections: connections.length,
      matchingConnections: matchingConnections.length,
      connections: matchingConnections.map(c => ({ from: c.from, to: c.to, toAnchor: c.toAnchor }))
    });

    const imageUrls: string[] = [];

    matchingConnections.forEach(connection => {
      const imageNode = imageModalStates.find(img => img.id === connection.from);
      if (imageNode) {
        if (imageNode.generatedImageUrl) {
          imageUrls.push(imageNode.generatedImageUrl);
          console.log(`[StoryboardPluginModal] Found image from imageModalStates (generatedImageUrl):`, imageNode.generatedImageUrl.substring(0, 50) + '...');
        } else if (imageNode.sourceImageUrl) {
          imageUrls.push(imageNode.sourceImageUrl);
          console.log(`[StoryboardPluginModal] Found image from imageModalStates (sourceImageUrl):`, imageNode.sourceImageUrl.substring(0, 50) + '...');
        }
      } else {
        const mediaImage = images.find(img => img.elementId === connection.from);
        if (mediaImage && mediaImage.url) {
          imageUrls.push(mediaImage.url);
          console.log(`[StoryboardPluginModal] Found image from media images:`, mediaImage.url.substring(0, 50) + '...');
        } else {
          console.warn(`[StoryboardPluginModal] Connection found but no image URL available:`, {
            connectionFrom: connection.from,
            hasImageNode: !!imageNode,
            hasMediaImage: !!mediaImage
          });
        }
      }
    });

    console.log(`[StoryboardPluginModal] Returning ${imageUrls.length} images for anchor "${anchor}"`);
    return imageUrls;
  };

  const connectedCharacterImages = getConnectedImages('receive-character');
  const connectedBackgroundImages = getConnectedImages('receive-background');
  const connectedPropsImages = getConnectedImages('receive-props');

  // Check if there's an active text input connection
  const hasActiveTextInputConnection = !!(id && connections.some(conn => {
    // Check if connection is TO this storyboard from a text input
    if (conn.to === id) {
      // Check if the source is a text input
      const isTextInput = textInputStates.some(t => t.id === conn.from);
      return isTextInput;
    }
    return false;
  }));

  // Check if this storyboard has any existing scene frames
  const hasExistingScenes = useMemo(() => {
    const existingScenes = sceneFrameModalStates.some(scene => {
      // Scenes are connected to storyboard via scriptFrameId
      return scene.scriptFrameId === id;
    });
    console.log('[StoryboardPluginModal] hasExistingScenes check:', {
      storyboardId: id,
      hasExistingScenes: existingScenes,
      totalScenes: sceneFrameModalStates.length,
      matchingScenes: sceneFrameModalStates.filter(s => s.scriptFrameId === id).length,
    });
    return existingScenes;
  }, [sceneFrameModalStates, id]);

  if (!isOpen) return null;


  return (
    <PluginNodeShell
      modalKey="storyboard"
      id={id}
      containerRef={containerRef}
      screenX={screenX}
      screenY={screenY}
      isHovered={isHovered}
      isSelected={Boolean(isSelected)}
      onPointerDown={handlePointerDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={onContextMenu}
      style={{ touchAction: 'none' }}
    >
      {isAttachedToChat && selectionOrder && (
        <div 
          className="absolute top-0 flex items-center justify-center bg-blue-500 text-white font-bold rounded-full shadow-lg z-[2002] border border-white/20 animate-in fade-in zoom-in duration-300"
          style={{
            left: `${-40 * scale}px`,
            top: `${-8 * scale}px`,
            width: `${32 * scale}px`,
            height: `${32 * scale}px`,
            fontSize: `${20 * scale}px`,
            minWidth: `${32 * scale}px`,
            minHeight: `${32 * scale}px`,
          }}
        >
          {selectionOrder}
        </div>
      )}
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
        </div>

        {/* Main plugin container - Circular */}
        <div
          style={{
            position: 'relative',
            width: `${100 * scale}px`,
            height: `${100 * scale}px`,
            backgroundColor: isDark ? '#2d2d2d' : '#e5e5e5',
            borderRadius: '50%',
            border: `${1.5 * scale}px solid ${isSelected ? SELECTION_COLOR : (isDark ? '#3a3a3a' : '#a0a0a0')}`,
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
              scriptText={scriptText}
              hasActiveTextInputConnection={hasActiveTextInputConnection}
              hasExistingScenes={hasExistingScenes}
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
    </PluginNodeShell>
  );
};

