'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '../../common/canvasCaptureGuard';
import { RemoveBgLabel } from './RemoveBgLabel';
import { ModalActionIcons } from '../../common/ModalActionIcons';
import { RemoveBgControls } from './RemoveBgControls';
import { RemoveBgImageFrame } from './RemoveBgImageFrame';

interface RemoveBgPluginModalProps {
  isOpen: boolean;
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
  onUpdateModalState?: (modalId: string, updates: { removedBgImageUrl?: string | null; isRemovingBg?: boolean }) => void;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
  onUpdateImageModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
}

export const RemoveBgPluginModal: React.FC<RemoveBgPluginModalProps> = ({
  isOpen,
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
  onPersistConnectorCreate,
}) => {
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState(initialModel ?? '851-labs/background-remover');
  const [selectedBackgroundType, setSelectedBackgroundType] = useState(initialBackgroundType ?? 'rgba (transparent)');
  const [scaleValue, setScaleValue] = useState<number>(initialScaleValue ?? 0.5);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [imageResolution, setImageResolution] = useState<{ width: number; height: number } | null>(null);
  const [isDimmed, setIsDimmed] = useState(false);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(initialSourceImageUrl ?? null);
  const [localRemovedBgImageUrl, setLocalRemovedBgImageUrl] = useState<string | null>(initialLocalRemovedBgImageUrl ?? null);
  const onOptionsChangeRef = useRef(onOptionsChange);
  
  // Update ref when callback changes
  useEffect(() => {
    onOptionsChangeRef.current = onOptionsChange;
  }, [onOptionsChange]);

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected ? '#437eb5' : 'rgba(0, 0, 0, 0.3)';
  const frameBorderWidth = 2;

  // Detect if this is a removed bg image result (media-like, no controls)
  const isRemovedBgImage = false; // Always show controls for the plugin

  // Detect connected image nodes
  const connectedImageSource = useMemo(() => {
    if (!id || !imageModalStates) return null;
    const conn = connections.find(c => c.to === id && c.from);
    if (!conn) return null;
    const sourceModal = imageModalStates.find(m => m.id === conn.from);
    return sourceModal?.generatedImageUrl || null;
  }, [id, connections, imageModalStates]);

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
    if (connectedImageSource && connectedImageSource !== sourceImageUrl) {
      setSourceImageUrl(connectedImageSource);
      // Clear dimming when image is connected
      setIsDimmed(false);
      // Reset removed bg image when source changes (only if not persisted)
      if (!initialLocalRemovedBgImageUrl) {
        setLocalRemovedBgImageUrl(null);
      }
      // Persist the source image URL (only if it actually changed from initial)
      if (onOptionsChangeRef.current && connectedImageSource !== initialSourceImageUrl) {
        onOptionsChangeRef.current({ sourceImageUrl: connectedImageSource });
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
    
    console.log('[RemoveBgPluginModal] handleMouseDown', {
      timestamp: Date.now(),
      target: target.tagName,
      isInput,
      isButton,
      isImage,
      isControls: !!isControls,
      isActionIcons: !!isActionIcons,
      buttonTitle: target.closest('button')?.getAttribute('title'),
    });
    
    // Call onSelect when clicking on the modal (this will trigger context menu)
    // Don't select if clicking on buttons, controls, inputs, or action icons
    if (onSelect && !isInput && !isButton && !isControls && !isActionIcons) {
      console.log('[RemoveBgPluginModal] Calling onSelect');
      onSelect();
    }
    
    // Only allow dragging from the frame, not from controls
    if (!isInput && !isButton && !isImage && !isControls) {
      setIsDraggingContainer(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      // Initialize lastCanvasPosRef with current position
      lastCanvasPosRef.current = { x, y };
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Handle drag
  useEffect(() => {
    if (!isDraggingContainer) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !onPositionChange) return;

      // Calculate new screen position
      const newScreenX = e.clientX - dragOffset.x;
      const newScreenY = e.clientY - dragOffset.y;

      // Convert screen coordinates back to canvas coordinates
      const newCanvasX = (newScreenX - position.x) / scale;
      const newCanvasY = (newScreenY - position.y) / scale;

      onPositionChange(newCanvasX, newCanvasY);
      lastCanvasPosRef.current = { x: newCanvasX, y: newCanvasY };
    };

    const handleMouseUp = () => {
      setIsDraggingContainer(false);
      if (onPositionCommit) {
        // Use lastCanvasPosRef if available, otherwise use current x, y props
        const finalX = lastCanvasPosRef.current?.x ?? x;
        const finalY = lastCanvasPosRef.current?.y ?? y;
        onPositionCommit(finalX, finalY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingContainer, dragOffset, scale, position, onPositionChange, onPositionCommit, x, y]);


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
          color: '#437eb5',
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
    <div
      ref={containerRef}
      data-modal-component="removebg"
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
      <RemoveBgLabel
        isHovered={isHovered}
        scale={scale}
        imageResolution={imageResolution}
      />

      <ModalActionIcons
        isSelected={isSelected || false}
        scale={scale}
        onDelete={onDelete}
        onDownload={onDownload}
        onDuplicate={onDuplicate}
        generatedUrl={removedBgImageUrl}
      />

      {!isRemovedBgImage && (
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
      )}

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
  );
};

