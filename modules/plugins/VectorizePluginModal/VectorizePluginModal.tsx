'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '@/modules/ui-global/common/canvasCaptureGuard';
import { VectorizeLabel } from './VectorizeLabel';
import { ModalActionIcons } from '@/modules/ui-global/common/ModalActionIcons';
import { VectorizeControls } from './VectorizeControls';
import { VectorizeImageFrame } from './VectorizeImageFrame';
import { useCanvasModalDrag } from '../PluginComponents/useCanvasModalDrag';
import { useCanvasFrameDim, useConnectedSourceImage, useLatestRef, usePersistedPopupState, PluginNodeShell } from '../PluginComponents';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';

interface VectorizePluginModalProps {
  isOpen: boolean;
  isExpanded?: boolean;
  id?: string;
  onClose: () => void;
  onVectorize?: (sourceImageUrl?: string, mode?: string) => Promise<string | null>;
  vectorizedImageUrl?: string | null;
  isVectorizing?: boolean;
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
  initialMode?: string;
  initialSourceImageUrl?: string | null;
  initialLocalVectorizedImageUrl?: string | null;
  onOptionsChange?: (opts: { mode?: string; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; isVectorizing?: boolean }) => void;
  onPersistVectorizeModalCreate?: (modal: { id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }) => void | Promise<void>;
  onUpdateModalState?: (modalId: string, updates: { vectorizedImageUrl?: string | null; isVectorizing?: boolean; isExpanded?: boolean }) => void;
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

import { memo } from 'react';

export const VectorizePluginModal = memo<VectorizePluginModalProps>(({
  isOpen,
  isExpanded,
  id,
  onClose,
  onVectorize,
  vectorizedImageUrl,
  isVectorizing: externalIsVectorizing,
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
  initialMode,
  initialSourceImageUrl,
  initialLocalVectorizedImageUrl,
  onOptionsChange,
  onPersistVectorizeModalCreate,
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
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [imageResolution, setImageResolution] = useState<{ width: number; height: number } | null>(null);
  const { isDimmed, setIsDimmed } = useCanvasFrameDim(id);
  const { isPopupOpen, togglePopup } = usePersistedPopupState({ isExpanded, id, onUpdateModalState, defaultOpen: false });
  const [mode, setMode] = useState<string>(initialMode ?? 'simple');
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(initialSourceImageUrl ?? null);
  const [localVectorizedImageUrl, setLocalVectorizedImageUrl] = useState<string | null>(initialLocalVectorizedImageUrl ?? null);
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

  // Detect if this is a vectorized image result (media-like, no controls)
  const isVectorizedImage = false; // Always show controls for the plugin

  const connectedImageSource = useConnectedSourceImage({ id, connections, imageModalStates, images });

  // Restore images and mode from props on mount or when props change
  useEffect(() => {
    if (initialMode !== undefined) {
      setMode(initialMode);
    }
    if (initialSourceImageUrl !== undefined) {
      setSourceImageUrl(initialSourceImageUrl);
    }
    if (initialLocalVectorizedImageUrl !== undefined) {
      setLocalVectorizedImageUrl(initialLocalVectorizedImageUrl);
    }
  }, [initialMode, initialSourceImageUrl, initialLocalVectorizedImageUrl]);

  useEffect(() => {
    // Handle connection changes: update or clear source image
    if (connectedImageSource) {
      // Connection exists: update source image if different
      if (connectedImageSource !== sourceImageUrl) {
        setSourceImageUrl(connectedImageSource);
        // Clear dimming when image is connected
        setIsDimmed(false);
        // Reset vectorized image when source changes (only if not persisted)
        if (!initialLocalVectorizedImageUrl) {
          setLocalVectorizedImageUrl(null);
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
  }, [connectedImageSource, initialLocalVectorizedImageUrl, initialSourceImageUrl, sourceImageUrl]);

  // Update image resolution when vectorized image loads
  useEffect(() => {
    if (localVectorizedImageUrl || vectorizedImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImageResolution({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        setImageResolution(null);
      };
      img.src = localVectorizedImageUrl || vectorizedImageUrl || '';
    } else {
      setImageResolution(null);
    }
  }, [localVectorizedImageUrl, vectorizedImageUrl]);

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


  const handleVectorize = async () => {
    console.log('[VectorizePluginModal] handleVectorize called', {
      hasOnVectorize: !!onVectorize,
      isVectorizing,
      externalIsVectorizing,
      sourceImageUrl,
      vectorizedImageUrl,
    });

    if (!onVectorize) {
      console.error('[VectorizePluginModal] onVectorize is not defined');
      return;
    }

    if (isVectorizing || externalIsVectorizing) {
      console.log('[VectorizePluginModal] Already vectorizing, skipping');
      return;
    }

    if (!sourceImageUrl) {
      alert('Please connect an image first');
      return;
    }

    setIsVectorizing(true);
    // Persist isVectorizing state
    if (onOptionsChange) {
      onOptionsChange({ isVectorizing: true } as any);
    }

    // Create new image generation frame immediately (before API call) to show loading state
    const frameWidth = 600;
    const frameHeight = 600;
    const offsetX = frameWidth + 50;
    const targetX = x + offsetX;
    const targetY = y;
    const newModalId = `image-vectorize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (onPersistImageModalCreate) {
      // Create image generation frame with isGenerating flag to show loading state
      const newModal = {
        id: newModalId,
        x: targetX,
        y: targetY,
        generatedImageUrl: null as string | null,
        frameWidth,
        frameHeight,
        model: 'Vectorize', // Label will show "Vectorize" (like "Media")
        frame: 'Frame',
        aspectRatio: '1:1',
        prompt: '',
        isGenerating: true, // Show loading state
      };

      await Promise.resolve(onPersistImageModalCreate(newModal));
    }

    // Automatically create connection from vectorize plugin to new frame
    if (onPersistConnectorCreate && id) {
      // Calculate node positions (right side of vectorize plugin, left side of new frame)
      const controlsHeight = 100; // Approximate controls section height
      const imageFrameHeight = 300; // Typical image frame height in canvas coordinates
      const imageFrameCenterY = controlsHeight + (imageFrameHeight / 2);

      const fromX = x + 400; // Right side of vectorize plugin (width is 400 in canvas coordinates)
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
        console.log('[VectorizePluginModal] Created connection from plugin to new frame:', newConnector);
      }
    }

    try {
      const imageUrl = sourceImageUrl;
      console.log('[VectorizePluginModal] Calling onVectorize with:', { imageUrl, mode });
      const result = await onVectorize(imageUrl || undefined, mode);
      console.log('[VectorizePluginModal] onVectorize returned:', result);

      // Update the image generation frame with the result
      if (result && onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: result,
          model: 'Vectorize',
          frame: 'Frame',
          aspectRatio: '1:1',
          prompt: '',
          frameWidth,
          frameHeight,
          isGenerating: false, // Clear loading state
        });
      }

      // Also store the vectorized image in the plugin
      if (result) {
        setLocalVectorizedImageUrl(result);
        // Update the modal state with vectorizedImageUrl so it displays in the frame
        if (onUpdateModalState && id) {
          onUpdateModalState(id, { vectorizedImageUrl: result });
        }
        // Persist the local vectorized image URL (only if it changed from initial)
        if (onOptionsChangeRef.current && result !== initialLocalVectorizedImageUrl) {
          onOptionsChangeRef.current({
            localVectorizedImageUrl: result
          });
          // Also update vectorizedImageUrl in modal state via onUpdateModalState
          if (onUpdateModalState && id) {
            onUpdateModalState(id, { vectorizedImageUrl: result });
          }
        }
      }
    } catch (error) {
      console.error('Vectorize error:', error);
      // Update frame to show error state or remove it
      if (onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: null,
          model: 'Vectorize',
          isGenerating: false, // Clear loading state
        });
      }
    } finally {
      setIsVectorizing(false);
      // Persist isVectorizing state (clear loading)
      if (onOptionsChange) {
        onOptionsChange({ isVectorizing: false } as any);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <PluginNodeShell
      modalKey="vectorize"
      id={id}
      containerRef={containerRef}
      screenX={screenX}
      screenY={screenY}
      scale={scale}
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
          Vectorize
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
          {/* Vectorize Icon */}
          <img
            src="/icons/vector.svg"
            alt="Vectorize"
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
              console.error('[VectorizePluginModal] Failed to load vector.svg icon');
              // Fallback: hide broken image
              e.currentTarget.style.display = 'none';
            }}
          />


        </div>

        {/* Controls shown/hidden on click - overlap beneath circle */}
        {isPopupOpen && !isVectorizedImage && (
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
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 0,
              }}
            >
              <VectorizeControls
                scale={scale}
                mode={mode}
                isVectorizing={isVectorizing}
                externalIsVectorizing={externalIsVectorizing}
                sourceImageUrl={sourceImageUrl}
                frameBorderColor={frameBorderColor}
                frameBorderWidth={frameBorderWidth}
                extraTopPadding={popupOverlap + 12 * scale}
                onModeChange={(newMode) => {
                  setMode(newMode);
                  if (onOptionsChange) {
                    onOptionsChange({ mode: newMode });
                  }
                }}
                onVectorize={handleVectorize}
                onHoverChange={setIsHovered}
              />
              <VectorizeImageFrame
                id={id}
                scale={scale}
                frameBorderColor={frameBorderColor}
                frameBorderWidth={frameBorderWidth}
                isVectorizedImage={isVectorizedImage}
                isDraggingContainer={isDraggingContainer}
                isHovered={isHovered}
                isSelected={Boolean(isSelected)}
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
});

VectorizePluginModal.displayName = 'VectorizePluginModal';
