'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '../../common/canvasCaptureGuard';
import { VectorizeLabel } from './VectorizeLabel';
import { ModalActionIcons } from '../../common/ModalActionIcons';
import { VectorizeControls } from './VectorizeControls';
import { VectorizeImageFrame } from './VectorizeImageFrame';
import { ConnectionNodes } from '../UpscalePluginModal/ConnectionNodes';

interface VectorizePluginModalProps {
  isOpen: boolean;
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
  onUpdateModalState?: (modalId: string, updates: { vectorizedImageUrl?: string | null; isVectorizing?: boolean }) => void;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
  onUpdateImageModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
}

export const VectorizePluginModal: React.FC<VectorizePluginModalProps> = ({
  isOpen,
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
}) => {
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [imageResolution, setImageResolution] = useState<{ width: number; height: number } | null>(null);
  const [isDimmed, setIsDimmed] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [mode, setMode] = useState<string>(initialMode ?? 'simple');
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(initialSourceImageUrl ?? null);
  const [localVectorizedImageUrl, setLocalVectorizedImageUrl] = useState<string | null>(initialLocalVectorizedImageUrl ?? null);
  const onOptionsChangeRef = useRef(onOptionsChange);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  // Update ref when callback changes
  useEffect(() => {
    onOptionsChangeRef.current = onOptionsChange;
  }, [onOptionsChange]);

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const frameBorderColor = isSelected
    ? '#437eb5'
    : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
  const frameBorderWidth = 2;

  // Detect if this is a vectorized image result (media-like, no controls)
  const isVectorizedImage = false; // Always show controls for the plugin

  // Detect connected image nodes (from image generators or canvas images)
  const connectedImageSource = useMemo(() => {
    if (!id) return null;
    const conn = connections.find(c => c.to === id && c.from);
    if (!conn) return null;

    // First check if it's from an image generator modal
    const sourceModal = imageModalStates?.find(m => m.id === conn.from);
    if (sourceModal?.generatedImageUrl) {
      return sourceModal.generatedImageUrl;
    }

    // Then check if it's from a canvas image (uploaded image)
    if (images && images.length > 0) {
      const canvasImage = images.find(img => {
        const imgId = img.elementId || (img as any).id;
        return imgId === conn.from;
      });
      if (canvasImage?.url) {
        return canvasImage.url;
      }
    }

    return null;
  }, [id, connections, imageModalStates, images]);

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
    if (connectedImageSource && connectedImageSource !== sourceImageUrl) {
      setSourceImageUrl(connectedImageSource);
      // Clear dimming when image is connected
      setIsDimmed(false);
      // Reset vectorized image when source changes (only if not persisted)
      if (!initialLocalVectorizedImageUrl) {
        setLocalVectorizedImageUrl(null);
      }
      // Persist the source image URL (only if it actually changed from initial)
      if (onOptionsChangeRef.current && connectedImageSource !== initialSourceImageUrl) {
        onOptionsChangeRef.current({ sourceImageUrl: connectedImageSource });
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

  // Listen for dimming events
  useEffect(() => {
    const handleDim = (e: CustomEvent) => {
      if (e.detail?.frameId === id) {
        // Only dim if explicitly set to true, otherwise clear dimming
        setIsDimmed(e.detail?.dimmed === true);
      }
    };
    window.addEventListener('canvas-frame-dim' as any, handleDim);
    return () => {
      window.removeEventListener('canvas-frame-dim' as any, handleDim);
    };
  }, [id]);

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isImage = target.tagName === 'IMG';
    const isControls = target.closest('.controls-overlay');
    // Check if clicking on action icons (ModalActionIcons container or its children)
    const isActionIcons = target.closest('[data-action-icons]') || target.closest('button[title="Delete"], button[title="Download"], button[title="Duplicate"]');

    console.log('[VectorizePluginModal] handleMouseDown', {
      timestamp: Date.now(),
      target: target.tagName,
      isInput,
      isButton,
      isImage,
      isControls: !!isControls,
      isActionIcons: !!isActionIcons,
    });

    if (isInput || isButton || isImage || isControls || isActionIcons) {
      return;
    }

    if (onSelect) {
      onSelect();
    }

    // Track initial mouse position to detect drag vs click
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;

    setIsDraggingContainer(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    lastCanvasPosRef.current = { x, y };
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle drag
  useEffect(() => {
    if (!isDraggingContainer) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !onPositionChange) return;

      // Check if mouse moved significantly (more than 5px) to detect drag
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
    };

    const handleMouseUp = () => {
      const wasDragging = hasDraggedRef.current;
      setIsDraggingContainer(false);
      dragStartPosRef.current = null;

      // Only toggle popup if it was a click (not a drag)
      if (!wasDragging) {
        setIsPopupOpen(prev => !prev);
      }

      if (onPositionCommit && lastCanvasPosRef.current) {
        onPositionCommit(lastCanvasPosRef.current.x, lastCanvasPosRef.current.y);
      }

      // Reset drag flag
      hasDraggedRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingContainer, dragOffset, scale, position, onPositionChange, onPositionCommit, x, y]);


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
          color: '#437eb5',
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
    <div
      ref={containerRef}
      data-modal-component="vectorize"
      data-overlay-id={id}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        zIndex: isHovered || isSelected ? 2001 : 2000,
        userSelect: 'none',
        opacity: isDimmed ? 0.4 : 1,
        transition: 'opacity 0.2s ease',
      }}
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
        {/* Main plugin container - Circular */}
        <div
          style={{
            position: 'relative',
            width: `${100 * scale}px`,
            height: `${100 * scale}px`,
            backgroundColor: isDark ? '#2d2d2d' : '#e5e5e5',
            borderRadius: '50%',
            border: `${1.5 * scale}px solid ${isDark ? '#3a3a3a' : '#a0a0a0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'opacity 0.2s ease, box-shadow 0.2s ease',
            boxShadow: isDark
              ? (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.3)`)
              : (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.2)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.1)`),
            transform: (isHovered || isSelected) ? `scale(1.03)` : 'scale(1)',
            overflow: 'visible', // Allow nodes to extend beyond container
          }}
        >
          {/* Vectorize Icon */}
          <img
            src="/icons/layer.png"
            alt="Vectorize"
            style={{
              width: `${40 * scale}px`,
              height: `${40 * scale}px`,
              objectFit: 'contain',
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
            onError={(e) => {
              console.error('[VectorizePluginModal] Failed to load layer.png icon');
              // Fallback: hide broken image
              e.currentTarget.style.display = 'none';
            }}
          />

          <ConnectionNodes
            id={id}
            scale={scale}
            isHovered={isHovered}
            isSelected={isSelected || false}
          />
        </div>

        {/* Label below */}
        <div
          style={{
            marginTop: `${8 * scale}px`,
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

        {/* Controls shown/hidden on click - positioned absolutely below */}
        {isPopupOpen && !isVectorizedImage && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: `${12 * scale}px`,
              zIndex: 1000,
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
              onModeChange={(newMode) => {
                setMode(newMode);
                if (onOptionsChange) {
                  onOptionsChange({ mode: newMode } as any);
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
              isSelected={isSelected || false}
              sourceImageUrl={sourceImageUrl}
              onMouseDown={handleMouseDown}
              onSelect={onSelect}
            />
          </div>
        )}
      </div>

    </div>
  );
};

