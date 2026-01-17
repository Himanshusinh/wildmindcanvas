'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '@/modules/ui-global/common/canvasCaptureGuard';
import { UpscaleLabel } from './UpscaleLabel';
import { ModalActionIcons } from '@/modules/ui-global/common/ModalActionIcons';
import { UpscaleControls } from './UpscaleControls';
import { UpscaleImageFrame } from './UpscaleImageFrame';
import { useCanvasModalDrag } from '../PluginComponents/useCanvasModalDrag';
import { useCanvasFrameDim, useConnectedSourceImage, useLatestRef, usePersistedPopupState } from '../PluginComponents';
import { PluginNodeShell } from '../PluginComponents';
import { PluginConnectionNodes } from '../PluginComponents';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';

interface UpscalePluginModalProps {
  isOpen: boolean;
  isExpanded?: boolean;
  id?: string;
  onClose: () => void;
  onUpscale?: (model: string, scale: number, sourceImageUrl?: string, faceEnhance?: boolean, faceEnhanceStrength?: number, topazModel?: string, faceEnhanceCreativity?: number) => Promise<string | null>;
  upscaledImageUrl?: string | null;
  isUpscaling?: boolean;
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
  initialScale?: number;
  initialSourceImageUrl?: string | null;
  initialLocalUpscaledImageUrl?: string | null;
  initialFaceEnhance?: boolean;
  initialFaceEnhanceStrength?: number;
  initialTopazModel?: string;
  initialFaceEnhanceCreativity?: number;
  onOptionsChange?: (opts: { model?: string; scale?: number; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; isUpscaling?: boolean; faceEnhance?: boolean; faceEnhanceStrength?: number; topazModel?: string; faceEnhanceCreativity?: number }) => void;
  onPersistUpscaleModalCreate?: (modal: { id: string; x: number; y: number; upscaledImageUrl?: string | null; model?: string; scale?: number; isUpscaling?: boolean; faceEnhance?: boolean; faceEnhanceStrength?: number; topazModel?: string; faceEnhanceCreativity?: number }) => void | Promise<void>;
  onUpdateModalState?: (modalId: string, updates: { upscaledImageUrl?: string | null; model?: string; scale?: number; isUpscaling?: boolean; isExpanded?: boolean; faceEnhance?: boolean; faceEnhanceStrength?: number; topazModel?: string; faceEnhanceCreativity?: number }) => void;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
  onUpdateImageModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const UpscalePluginModal: React.FC<UpscalePluginModalProps> = ({
  isOpen,
  isExpanded,
  id,
  onClose,
  onUpscale,
  upscaledImageUrl,
  isUpscaling: externalIsUpscaling,
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
  initialScale,
  initialSourceImageUrl,
  initialLocalUpscaledImageUrl,
  initialFaceEnhance,
  initialFaceEnhanceStrength,
  onOptionsChange,
  onPersistUpscaleModalCreate,
  onUpdateModalState,
  onPersistImageModalCreate,
  onUpdateImageModalState,
  connections = [],
  imageModalStates = [],
  images = [],
  onPersistConnectorCreate,
  initialTopazModel,
  initialFaceEnhanceCreativity,
  onContextMenu,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState(initialModel ?? 'Crystal Upscaler');
  const [scaleValue, setScaleValue] = useState<number>(initialScale ?? 2);
  const [faceEnhance, setFaceEnhance] = useState<boolean>(initialFaceEnhance ?? true);
  const [faceEnhanceStrength, setFaceEnhanceStrength] = useState<number>(initialFaceEnhanceStrength ?? 0.8);
  const [topazModel, setTopazModel] = useState<string>(initialTopazModel ?? 'Standard V2');
  const [faceEnhanceCreativity, setFaceEnhanceCreativity] = useState<number>(initialFaceEnhanceCreativity ?? 0);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [imageResolution, setImageResolution] = useState<{ width: number; height: number } | null>(null);
  const { isDimmed, setIsDimmed } = useCanvasFrameDim(id);
  const { isPopupOpen, setIsPopupOpen, togglePopup } = usePersistedPopupState({ isExpanded, id, onUpdateModalState, defaultOpen: false });
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(initialSourceImageUrl ?? null);

  const [localUpscaledImageUrl, setLocalUpscaledImageUrl] = useState<string | null>(initialLocalUpscaledImageUrl ?? null);
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

  // Detect if this is an upscaled image result (media-like, no controls)
  // The plugin itself should always show controls (model is 'Crystal Upscaler' or undefined)
  // Only result frames (with model 'Upscale') should be media-like
  const isUpscaledImage = selectedModel === 'Upscale' || initialModel === 'Upscale';

  const connectedImageSource = useConnectedSourceImage({ id, connections, imageModalStates, images });

  // Restore images from props on mount or when props change
  useEffect(() => {
    if (initialSourceImageUrl !== undefined) {
      setSourceImageUrl(initialSourceImageUrl);
    }
    if (initialLocalUpscaledImageUrl !== undefined) {
      setLocalUpscaledImageUrl(initialLocalUpscaledImageUrl);
    }
  }, [initialSourceImageUrl, initialLocalUpscaledImageUrl]);

  useEffect(() => {
    // Handle connection changes: update or clear source image
    if (connectedImageSource) {
      // Connection exists: update source image if different
      if (connectedImageSource !== sourceImageUrl) {
        setSourceImageUrl(connectedImageSource);
        // Clear dimming when image is connected
        setIsDimmed(false);
        // Reset upscaled image when source changes (only if not persisted)
        if (!initialLocalUpscaledImageUrl) {
          setLocalUpscaledImageUrl(null);
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
  }, [connectedImageSource, initialLocalUpscaledImageUrl, initialSourceImageUrl, sourceImageUrl]);


  // Update image resolution when upscaled image loads
  useEffect(() => {
    if (localUpscaledImageUrl || upscaledImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImageResolution({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        setImageResolution(null);
      };
      img.src = localUpscaledImageUrl || upscaledImageUrl || '';
    } else {
      setImageResolution(null);
    }
  }, [localUpscaledImageUrl, upscaledImageUrl]);

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


  const handleUpscale = async () => {
    console.log('[UpscalePluginModal] handleUpscale called', {
      hasOnUpscale: !!onUpscale,
      isUpscaling,
      externalIsUpscaling,
      sourceImageUrl,
      upscaledImageUrl,
      selectedModel,
      scaleValue,
    });

    if (!onUpscale) {
      console.error('[UpscalePluginModal] onUpscale is not defined');
      return;
    }

    if (isUpscaling || externalIsUpscaling) {
      console.log('[UpscalePluginModal] Already upscaling, skipping');
      return;
    }

    if (!sourceImageUrl) {
      alert('Please connect an image first');
      return;
    }

    setIsUpscaling(true);
    // Persist isUpscaling state
    if (onOptionsChange) {
      onOptionsChange({ isUpscaling: true } as any);
    }

    // Create new image generation frame immediately (before API call) to show loading state
    const frameWidth = 600;
    const frameHeight = 600;
    const offsetX = frameWidth + 50;
    const targetX = x + offsetX;
    const targetY = y;
    const newModalId = `image-upscale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (onPersistImageModalCreate) {
      // Create image generation frame with isGenerating flag to show loading state
      const newModal = {
        id: newModalId,
        x: targetX,
        y: targetY,
        generatedImageUrl: null as string | null,
        frameWidth,
        frameHeight,
        model: 'Upscale', // Label will show "Upscale" (like "Media")
        frame: 'Frame',
        aspectRatio: '1:1',
        prompt: '',
        isGenerating: true, // Show loading state
      };

      await Promise.resolve(onPersistImageModalCreate(newModal));
    }

    // Automatically create connection from upscale plugin to new frame
    if (onPersistConnectorCreate && id) {
      // Calculate node positions (right side of upscale plugin, left side of new frame)
      // Upscale plugin structure:
      // - Controls section: ~100px height (with padding)
      // - Image frame section: min 150px, max 400px, typically ~300px
      // Nodes are positioned at 50% of the image frame (not the entire modal)
      // The image frame starts after the controls, so node Y = controlsHeight + (imageFrameHeight / 2)
      const controlsHeight = 100; // Approximate controls section height (not scaled, as it's in canvas coordinates)
      const imageFrameHeight = 300; // Typical image frame height in canvas coordinates
      const imageFrameCenterY = controlsHeight + (imageFrameHeight / 2);

      const fromX = x + 400; // Right side of upscale plugin (width is 400 in canvas coordinates)
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
        console.log('[UpscalePluginModal] Created connection from plugin to new frame:', newConnector);
      }
    }

    try {
      const imageUrl = sourceImageUrl;
      console.log('[UpscalePluginModal] Calling onUpscale with:', { selectedModel, scaleValue, imageUrl, faceEnhance, faceEnhanceStrength, topazModel, faceEnhanceCreativity });
      const result = await onUpscale(selectedModel, scaleValue, imageUrl || undefined, faceEnhance, faceEnhanceStrength, topazModel, faceEnhanceCreativity);
      console.log('[UpscalePluginModal] onUpscale returned:', result);

      // Extract URL from result (result should be a string URL, but handle both string and object)
      const upscaledUrl = typeof result === 'string' ? result : ((result as any)?.url || (result as any)?.data?.url || null);

      if (!upscaledUrl) {
        console.error('[UpscalePluginModal] No URL in result:', result);
        throw new Error('Upscale completed but no image URL was returned');
      }

      console.log('[UpscalePluginModal] Extracted upscaled URL:', upscaledUrl);

      // Update the image generation frame with the result
      if (upscaledUrl && onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: upscaledUrl,
          model: 'Upscale',
          frame: 'Frame',
          aspectRatio: '1:1',
          prompt: '',
          frameWidth,
          frameHeight,
          isGenerating: false, // Clear loading state
        });
        console.log('[UpscalePluginModal] Updated image modal state with URL:', upscaledUrl);
      }

      // Also store the upscaled image in the plugin
      if (upscaledUrl && upscaledUrl !== localUpscaledImageUrl) {
        setLocalUpscaledImageUrl(upscaledUrl);
        // Persist the local upscaled image URL (only if it changed from initial)
        if (onOptionsChangeRef.current && upscaledUrl !== initialLocalUpscaledImageUrl) {
          onOptionsChangeRef.current({ localUpscaledImageUrl: upscaledUrl });
        }
      }
    } catch (error) {
      console.error('Upscale error:', error);
      // Update frame to show error state or remove it
      if (onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: null,
          model: 'Upscale',
          isGenerating: false, // Clear loading state
        });
      }
    } finally {
      setIsUpscaling(false);
      // Persist isUpscaling state (clear loading)
      if (onOptionsChange) {
        onOptionsChange({ isUpscaling: false } as any);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <PluginNodeShell
      modalKey="upscale"
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
          Upscale
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
          {/* Upscale Icon */}
          <img
            src="/icons/upscale.svg"
            alt="Upscale"
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
              console.error('[UpscalePluginModal] Failed to load upscale.svg icon');
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
        {isPopupOpen && !isUpscaledImage && (
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
              <UpscaleControls
                scale={scale}
                selectedModel={selectedModel}
                scaleValue={scaleValue}
                faceEnhance={faceEnhance}
                faceEnhanceStrength={faceEnhanceStrength}
                topazModel={topazModel}
                faceEnhanceCreativity={faceEnhanceCreativity}
                isUpscaling={isUpscaling}
                externalIsUpscaling={externalIsUpscaling}
                sourceImageUrl={sourceImageUrl}
                frameBorderColor={frameBorderColor}
                frameBorderWidth={frameBorderWidth}
                onModelChange={(model) => {
                  setSelectedModel(model);
                  if (onUpdateModalState && id) {
                    onUpdateModalState(id, { model });
                  }
                }}
                onScaleChange={(val) => {
                  setScaleValue(val);
                  if (onUpdateModalState && id) {
                    onUpdateModalState(id, { scale: val });
                  }
                }}
                onFaceEnhanceChange={(val) => {
                  setFaceEnhance(val);
                  if (onUpdateModalState && id) {
                    onUpdateModalState(id, { faceEnhance: val });
                  }
                }}
                onFaceEnhanceStrengthChange={(val) => {
                  setFaceEnhanceStrength(val);
                  if (onUpdateModalState && id) {
                    onUpdateModalState(id, { faceEnhanceStrength: val });
                  }
                }}
                onTopazModelChange={(val) => {
                  setTopazModel(val);
                  if (onUpdateModalState && id) {
                    onUpdateModalState(id, { topazModel: val });
                  }
                }}
                onFaceEnhanceCreativityChange={(val) => {
                  setFaceEnhanceCreativity(val);
                  if (onUpdateModalState && id) {
                    onUpdateModalState(id, { faceEnhanceCreativity: val });
                  }
                }}
                onUpscale={handleUpscale}
                onHoverChange={setIsHovered}
              />
              <UpscaleImageFrame
                id={id}
                scale={scale}
                frameBorderColor={frameBorderColor}
                frameBorderWidth={frameBorderWidth}
                isUpscaledImage={isUpscaledImage}
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

