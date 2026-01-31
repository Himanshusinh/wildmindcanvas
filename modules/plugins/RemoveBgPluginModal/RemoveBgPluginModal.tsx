'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '@/modules/ui-global/common/canvasCaptureGuard';
import { RemoveBgLabel } from './RemoveBgLabel';
import { ModalActionIcons } from '@/modules/ui-global/common/ModalActionIcons';
import { RemoveBgControls } from './RemoveBgControls';
import { RemoveBgImageFrame } from './RemoveBgImageFrame';
import { useCanvasModalDrag } from '../PluginComponents/useCanvasModalDrag';
import { useCanvasFrameDim, useConnectedSourceImage, useLatestRef, usePersistedPopupState } from '../PluginComponents';
import { PluginNodeShell } from '../PluginComponents';
import { PluginConnectionNodes } from '../PluginComponents';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';

interface RemoveBgPluginModalProps {
  isOpen: boolean;
  isExpanded?: boolean;
  id?: string;
  onClose: () => void;
  onRemoveBg?: (model: string, backgroundType: string, scaleValue: number, sourceImageUrl?: string) => Promise<string | null>;
  removedBgImageUrl?: string | null;
  isRemovingBg?: boolean;
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
  initialModel?: string;
  initialBackgroundType?: string;
  initialScaleValue?: number;
  initialSourceImageUrl?: string | null;
  initialLocalRemovedBgImageUrl?: string | null;
  onOptionsChange?: (opts: { model?: string; backgroundType?: string; scaleValue?: number; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; isRemovingBg?: boolean }) => void;
  onPersistRemoveBgModalCreate?: (modal: { id: string; x: number; y: number; removedBgImageUrl?: string | null; isRemovingBg?: boolean }) => void | Promise<void>;
  onUpdateModalState?: (modalId: string, updates: { removedBgImageUrl?: string | null; isRemovingBg?: boolean; isExpanded?: boolean }) => void;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
  onUpdateImageModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
  onContextMenu?: (e: React.MouseEvent) => void;
  isAttachedToChat?: boolean;
  selectionOrder?: number;
}

export const RemoveBgPluginModal: React.FC<RemoveBgPluginModalProps> = ({
  isOpen,
  isExpanded,
  id,
  onClose,
  onRemoveBg,
  removedBgImageUrl,
  isRemovingBg: externalIsRemovingBg,
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
  initialModel,
  initialBackgroundType,
  initialScaleValue,
  initialSourceImageUrl,
  initialLocalRemovedBgImageUrl,
  onOptionsChange,
  onPersistRemoveBgModalCreate,
  onUpdateModalState,
  onPersistImageModalCreate,
  onUpdateImageModalState,
  connections = [],
  imageModalStates = [],
  images = [],
  onPersistConnectorCreate,
  onContextMenu,
  isAttachedToChat,
  selectionOrder,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState(initialModel ?? '851-labs/background-remover');
  const [selectedBackgroundType, setSelectedBackgroundType] = useState(initialBackgroundType ?? 'rgba (transparent)');
  const [scaleValue, setScaleValue] = useState<number>(initialScaleValue ?? 0.5);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [imageResolution, setImageResolution] = useState<{ width: number; height: number } | null>(null);
  const { isDimmed, setIsDimmed } = useCanvasFrameDim(id);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(initialSourceImageUrl ?? null);
  const [localRemovedBgImageUrl, setLocalRemovedBgImageUrl] = useState<string | null>(initialLocalRemovedBgImageUrl ?? null);
  const { isPopupOpen, togglePopup } = usePersistedPopupState({ isExpanded, id, onUpdateModalState, defaultOpen: false });
  const onOptionsChangeRef = useLatestRef(onOptionsChange);

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const isDark = useIsDarkTheme();
  const circleDiameter = 100 * scale;
  const controlsWidthPx = `${400 * scale}px`;
  const overlapRatio = 0.3;
  const popupOverlap = Math.max(0, (circleDiameter * overlapRatio) - (8 * scale));

  const frameBorderColor = isDark ? '#3a3a3a' : '#a0a0a0';
  const frameBorderWidth = 2;

  // Detect if this is a removed bg image result (media-like, no controls)
  const isRemovedBgImage = false; // Always show controls for the plugin

  const connectedImageSource = useConnectedSourceImage({ id, connections, imageModalStates, images });

  // Restore images from props on mount or when props change
  useEffect(() => {
    if (initialSourceImageUrl !== undefined) {
      setSourceImageUrl(initialSourceImageUrl);
    }
    if (initialLocalRemovedBgImageUrl !== undefined) {
      setLocalRemovedBgImageUrl(initialLocalRemovedBgImageUrl);
    }
  }, [initialSourceImageUrl, initialLocalRemovedBgImageUrl]);

  useEffect(() => {
    // Handle connection changes: update or clear source image
    if (connectedImageSource) {
      // Connection exists: update source image if different
      if (connectedImageSource !== sourceImageUrl) {
        setSourceImageUrl(connectedImageSource);
        // Clear dimming when image is connected
        setIsDimmed(false);
        // Reset removed bg image when source changes (only if not persisted)
        if (!initialLocalRemovedBgImageUrl) {
          setLocalRemovedBgImageUrl(null);
        }
        // Persist the source image URL
        if (onOptionsChangeRef.current) {
          onOptionsChangeRef.current({ sourceImageUrl: connectedImageSource });
        }
      }
    } else {
      // Connection deleted: clear source image if it was from a connection
      // Only clear if current sourceImageUrl matches what was connected (or if no initialSourceImageUrl was set)
      if (sourceImageUrl && (!initialSourceImageUrl || sourceImageUrl === initialSourceImageUrl)) {
        setSourceImageUrl(null);
        // Clear dimming
        setIsDimmed(false);
        // Clear persisted source image URL
        if (onOptionsChangeRef.current) {
          onOptionsChangeRef.current({ sourceImageUrl: null });
        }
      }
    }
  }, [connectedImageSource, initialLocalRemovedBgImageUrl, initialSourceImageUrl, sourceImageUrl]);


  // Update image resolution when removed bg image loads
  useEffect(() => {
    if (localRemovedBgImageUrl || removedBgImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImageResolution({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        setImageResolution(null);
      };
      img.src = localRemovedBgImageUrl || removedBgImageUrl || '';
    } else {
      setImageResolution(null);
    }
  }, [localRemovedBgImageUrl, removedBgImageUrl]);

  const { isDragging: isDraggingContainer, onMouseDown: handleMouseDown } = useCanvasModalDrag({
    enabled: isOpen,
    x,
    y,
    scale,
    position,
    containerRef,
    onPositionChange,
    onPositionCommit,
    onSelect,
    onTap: () => togglePopup(),
  });


  const handleRemoveBg = async () => {
    console.log('[RemoveBgPluginModal] handleRemoveBg called', {
      hasOnRemoveBg: !!onRemoveBg,
      isRemovingBg,
      externalIsRemovingBg,
      sourceImageUrl,
      removedBgImageUrl,
    });

    if (!onRemoveBg) {
      console.error('[RemoveBgPluginModal] onRemoveBg is not defined');
      return;
    }

    if (isRemovingBg || externalIsRemovingBg) {
      console.log('[RemoveBgPluginModal] Already removing bg, skipping');
      return;
    }

    if (!sourceImageUrl) {
      alert('Please connect an image first');
      return;
    }

    setIsRemovingBg(true);
    // Persist isRemovingBg state
    if (onOptionsChange) {
      onOptionsChange({ isRemovingBg: true } as any);
    }

    // Create new image generation frame immediately (before API call) to show loading state
    const frameWidth = 600;
    const frameHeight = 600;
    const offsetX = frameWidth + 50;
    const targetX = x + offsetX;
    const targetY = y;
    const newModalId = `image-removebg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (onPersistImageModalCreate) {
      // Create image generation frame with isGenerating flag to show loading state
      const newModal = {
        id: newModalId,
        x: targetX,
        y: targetY,
        generatedImageUrl: null as string | null,
        frameWidth,
        frameHeight,
        model: 'Remove BG', // Label will show "Remove BG" (like "Media")
        frame: 'Frame',
        aspectRatio: '1:1',
        prompt: '',
        isGenerating: true, // Show loading state
      };

      await Promise.resolve(onPersistImageModalCreate(newModal));
    }

    // Automatically create connection from remove bg plugin to new frame
    if (onPersistConnectorCreate && id) {
      // Calculate node positions (right side of remove bg plugin, left side of new frame)
      const controlsHeight = 100; // Approximate controls section height
      const imageFrameHeight = 300; // Typical image frame height in canvas coordinates
      const imageFrameCenterY = controlsHeight + (imageFrameHeight / 2);

      const fromX = x + 400; // Right side of remove bg plugin (width is 400 in canvas coordinates)
      const fromY = y + imageFrameCenterY; // Middle of image frame area (where the send node is)
      const toX = targetX; // Left side of new frame
      const toY = targetY + (frameHeight / 2); // Middle of new frame (where the receive node is)

      // Check if connection already exists
      const connectionExists = connections.some(
        conn => conn.from === id && conn.to === newModalId
      );

      if (!connectionExists) {
        const newConnector = {
          from: id,
          to: newModalId,
          color: SELECTION_COLOR,
          fromX,
          fromY,
          toX,
          toY,
          fromAnchor: 'send',
          toAnchor: 'receive',
        };

        await Promise.resolve(onPersistConnectorCreate(newConnector));
        console.log('[RemoveBgPluginModal] Created connection from plugin to new frame:', newConnector);
      }
    }

    try {
      const imageUrl = sourceImageUrl;
      console.log('[RemoveBgPluginModal] Calling onRemoveBg with:', { selectedModel, selectedBackgroundType, scaleValue, imageUrl });
      const result = await onRemoveBg(selectedModel, selectedBackgroundType, scaleValue, imageUrl || undefined);
      console.log('[RemoveBgPluginModal] onRemoveBg returned:', result);

      // Update the image generation frame with the result
      if (result && onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: result,
          model: 'Remove BG',
          frame: 'Frame',
          aspectRatio: '1:1',
          prompt: '',
          frameWidth,
          frameHeight,
          isGenerating: false, // Clear loading state
        });
      }

      // Also store the removed bg image in the plugin
      if (result) {
        setLocalRemovedBgImageUrl(result);
        // Update the modal state with removedBgImageUrl so it displays in the frame
        if (onUpdateModalState && id) {
          onUpdateModalState(id, { removedBgImageUrl: result });
        }
        // Persist the local removed bg image URL (only if it changed from initial)
        if (onOptionsChangeRef.current && result !== initialLocalRemovedBgImageUrl) {
          onOptionsChangeRef.current({
            localRemovedBgImageUrl: result
          });
        }
      }
    } catch (error) {
      console.error('Remove BG error:', error);
      // Update frame to show error state or remove it
      if (onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: null,
          model: 'Remove BG',
          isGenerating: false, // Clear loading state
        });
      }
    } finally {
      setIsRemovingBg(false);
      // Persist isRemovingBg state (clear loading)
      if (onOptionsChange) {
        onOptionsChange({ isRemovingBg: false } as any);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <PluginNodeShell
      modalKey="removebg"
      id={id}
      containerRef={containerRef}
      screenX={screenX}
      screenY={screenY}
      isHovered={isHovered}
      isSelected={Boolean(isSelected)}
      isDimmed={isDimmed}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={onContextMenu}
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
      {/* Action icons removed - functionality still available via onDelete, onDuplicate handlers */}
      {/* ModalActionIcons removed per user request - delete/duplicate functionality preserved */}

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
        onMouseDown={handleMouseDown}
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
          Remove BG
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
            overflow: 'visible', // Allow nodes to extend beyond container
            zIndex: 20,
          }}
        >
          {/* Layer Icon */}
          <img
            src="/icons/removebg.svg"
            alt="Remove Background"
            style={{
              width: `${40 * scale}px`,
              height: `${40 * scale}px`,
              objectFit: 'contain',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
              filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)',
              transition: 'filter 0.3s ease',
            }}
            onError={(e) => {
              console.error('[RemoveBgPluginModal] Failed to load removebg.svg icon');
              // Fallback: hide broken image
              e.currentTarget.style.display = 'none';
            }}
          />

          <PluginConnectionNodes
            id={id}
            scale={scale}
            isHovered={isHovered}
            isSelected={isSelected || false}
          />
        </div>

        {/* Controls shown/hidden on click - overlap beneath circle */}
        {isPopupOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: `${-popupOverlap}px`,
              zIndex: 2002,
              width: controlsWidthPx,
              maxWidth: '90vw',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 0,
              }}
            >
              <RemoveBgControls
                scale={scale}
                selectedModel={selectedModel}
                selectedBackgroundType={selectedBackgroundType}
                scaleValue={scaleValue}
                isRemovingBg={isRemovingBg}
                externalIsRemovingBg={externalIsRemovingBg}
                sourceImageUrl={sourceImageUrl}
                frameBorderColor={frameBorderColor}
                frameBorderWidth={frameBorderWidth}
                extraTopPadding={popupOverlap + 12 * scale}
                onModelChange={(model) => {
                  setSelectedModel(model);
                  if (onOptionsChange) {
                    onOptionsChange({ model, backgroundType: selectedBackgroundType, scaleValue });
                  }
                }}
                onBackgroundTypeChange={(backgroundType) => {
                  setSelectedBackgroundType(backgroundType);
                  if (onOptionsChange) {
                    onOptionsChange({ model: selectedModel, backgroundType, scaleValue });
                  }
                }}
                onScaleChange={(newScale) => {
                  setScaleValue(newScale);
                  if (onOptionsChange) {
                    onOptionsChange({ model: selectedModel, backgroundType: selectedBackgroundType, scaleValue: newScale });
                  }
                }}
                onRemoveBg={handleRemoveBg}
                onHoverChange={setIsHovered}
              />
              <RemoveBgImageFrame
                id={id}
                scale={scale}
                frameBorderColor={frameBorderColor}
                frameBorderWidth={frameBorderWidth}
                isRemovedBgImage={isRemovedBgImage}
                isDraggingContainer={isDraggingContainer}
                isHovered={isHovered}
                isSelected={isSelected || false}
                sourceImageUrl={sourceImageUrl}
                onMouseDown={handleMouseDown}
                onSelect={onSelect}
              />
            </div>
          </div>
        )}
      </div>

    </PluginNodeShell>
  );
};

