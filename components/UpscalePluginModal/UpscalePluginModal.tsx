'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '../common/canvasCaptureGuard';
import FrameSpinner from '../common/FrameSpinner';

interface UpscalePluginModalProps {
  isOpen: boolean;
  id?: string;
  onClose: () => void;
  onUpscale?: (model: string, scale: number, sourceImageUrl?: string) => Promise<string | null>;
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
  onOptionsChange?: (opts: { model?: string; scale?: number }) => void;
  onPersistUpscaleModalCreate?: (modal: { id: string; x: number; y: number; upscaledImageUrl?: string | null; model?: string; scale?: number; isUpscaling?: boolean }) => void | Promise<void>;
  onUpdateModalState?: (modalId: string, updates: { upscaledImageUrl?: string | null; model?: string; scale?: number; isUpscaling?: boolean }) => void;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
  onUpdateImageModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
}

const UPSCALE_MODELS = [
  'Crystal Upscaler',
];

export const UpscalePluginModal: React.FC<UpscalePluginModalProps> = ({
  isOpen,
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
  onOptionsChange,
  onPersistUpscaleModalCreate,
  onUpdateModalState,
  onPersistImageModalCreate,
  onUpdateImageModalState,
  connections = [],
  imageModalStates = [],
  onPersistConnectorCreate,
}) => {
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);
  const [selectedModel, setSelectedModel] = useState(initialModel ?? 'Crystal Upscaler');
  const [scaleValue, setScaleValue] = useState<number>(initialScale ?? 2);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [imageResolution, setImageResolution] = useState<{ width: number; height: number } | null>(null);
  const [isDimmed, setIsDimmed] = useState(false);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected ? '#437eb5' : 'rgba(0, 0, 0, 0.3)';
  const frameBorderWidth = 2;
  const dropdownBorderColor = 'rgba(0,0,0,0.1)';

  // Detect if this is an upscaled image result (media-like, no controls)
  // The plugin itself should always show controls (model is 'Crystal Upscaler' or undefined)
  // Only result frames (with model 'Upscale') should be media-like
  const isUpscaledImage = selectedModel === 'Upscale' || initialModel === 'Upscale';

  // Detect connected image nodes
  const connectedImageSource = useMemo(() => {
    if (!id || !imageModalStates) return null;
    const conn = connections.find(c => c.to === id && c.from);
    if (!conn) return null;
    const sourceModal = imageModalStates.find(m => m.id === conn.from);
    return sourceModal?.generatedImageUrl || null;
  }, [id, connections, imageModalStates]);

  useEffect(() => {
    if (connectedImageSource) {
      setSourceImageUrl(connectedImageSource);
      // Clear dimming when image is connected
      setIsDimmed(false);
    }
  }, [connectedImageSource]);

  // Update image resolution when upscaled image loads
  useEffect(() => {
    if (upscaledImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImageResolution({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        setImageResolution(null);
      };
      img.src = upscaledImageUrl;
    } else {
      setImageResolution(null);
    }
  }, [upscaledImageUrl]);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isImage = target.tagName === 'IMG';
    const isControls = target.closest('.controls-overlay');
    
    // Call onSelect when clicking on the modal (this will trigger context menu)
    if (onSelect && !isInput && !isButton && !isControls) {
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
      if (onPositionCommit && lastCanvasPosRef.current) {
        onPositionCommit(lastCanvasPosRef.current.x, lastCanvasPosRef.current.y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingContainer, dragOffset, scale, position, onPositionChange, onPositionCommit]);

  // Listen for global node-drag active state so nodes remain visible while dragging
  useEffect(() => {
    const handleActive = (e: Event) => {
      const ce = e as CustomEvent;
      setGlobalDragActive(Boolean(ce.detail?.active));
    };
    window.addEventListener('canvas-node-active', handleActive as any);
    return () => window.removeEventListener('canvas-node-active', handleActive as any);
  }, []);

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
          color: '#437eb5',
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
      console.log('[UpscalePluginModal] Calling onUpscale with:', { selectedModel, scaleValue, imageUrl });
      const result = await onUpscale(selectedModel, scaleValue, imageUrl || undefined);
      console.log('[UpscalePluginModal] onUpscale returned:', result);
      
      // Update the image generation frame with the result
      if (result && onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: result,
          model: 'Upscale',
          frame: 'Frame',
          aspectRatio: '1:1',
          prompt: '',
          frameWidth,
          frameHeight,
          isGenerating: false, // Clear loading state
        });
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
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      data-modal-component="upscale"
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
      {/* Label - Top Center, Only on Hover */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            top: `${-32 * scale}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#ffffff',
            padding: `${4 * scale}px ${12 * scale}px`,
            borderRadius: `${6 * scale}px`,
            fontSize: `${12 * scale}px`,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 3000,
            pointerEvents: 'none',
          }}
        >
          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span>Upscale</span>
            {imageResolution && (
              <span style={{ marginLeft: 'auto', opacity: 0.7, fontWeight: '500' }}>
                {imageResolution.width} × {imageResolution.height}
              </span>
            )}
          </span>
        </div>
      )}
      
      {/* Controls - Always Visible at Top */}

      {/* Action Icons - Right Side Top, Outside Frame (Only when selected) */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: `${-40 * scale}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: `${6 * scale}px`,
            zIndex: 3001,
            pointerEvents: 'auto',
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Delete Icon */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDelete) onDelete();
              }}
              title="Delete"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${28 * scale}px`,
                height: `${28 * scale}px`,
                padding: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid rgba(0, 0, 0, 0.1)`,
                borderRadius: `${8 * scale}px`,
                color: '#4b5563',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.color = '#4b5563';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          )}

          {/* Download Icon */}
          {onDownload && upscaledImageUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDownload) onDownload();
              }}
              title="Download"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${28 * scale}px`,
                height: `${28 * scale}px`,
                padding: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid rgba(0, 0, 0, 0.1)`,
                borderRadius: `${8 * scale}px`,
                color: '#4b5563',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.color = '#3b82f6';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.color = '#4b5563';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          )}

          {/* Duplicate Icon */}
          {onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onDuplicate) onDuplicate();
              }}
              title="Duplicate"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: `${28 * scale}px`,
                height: `${28 * scale}px`,
                padding: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid rgba(0, 0, 0, 0.1)`,
                borderRadius: `${8 * scale}px`,
                color: '#4b5563',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                e.currentTarget.style.color = '#22c55e';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.color = '#4b5563';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Controls - Always Visible at Top (only for upscale plugin, not for upscaled images) */}
      {!isUpscaledImage && (
      <div
        className="controls-overlay"
        style={{
          position: 'relative',
          width: `${400 * scale}px`,
          maxWidth: '90vw',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: `${16 * scale}px ${16 * scale}px 0 0`,
          display: 'flex',
          flexDirection: 'column',
          gap: `${12 * scale}px`,
          overflow: 'visible',
          zIndex: 10,
          borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          padding: `${16 * scale}px`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Model Selection */}
        <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center' }}>
          <div
            ref={modelDropdownRef}
            style={{
              position: 'relative',
              flex: 1,
              minWidth: `${200 * scale}px`,
              width: 'max-content',
              zIndex: 10002,
            }}
          >
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              style={{
                width: '100%',
                padding: `${10 * scale}px ${16 * scale}px`,
                backgroundColor: '#ffffff',
                border: `1px solid ${dropdownBorderColor}`,
                borderRadius: `${8 * scale}px`,
                fontSize: `${14 * scale}px`,
                color: '#1f2937',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>{selectedModel}</span>
              <svg width={16 * scale} height={16 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: `${8 * scale}px` }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isModelDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: `${4 * scale}px`,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${dropdownBorderColor}`,
                  borderRadius: `${8 * scale}px`,
                  boxShadow: `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.15)`,
                  zIndex: 10001,
                  maxHeight: `${300 * scale}px`,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${4 * scale}px`,
                  padding: `${8 * scale}px`,
                }}
              >
                {UPSCALE_MODELS.map((model) => (
                  <div
                    key={model}
                    onClick={() => {
                      setSelectedModel(model);
                      setIsModelDropdownOpen(false);
                      if (onOptionsChange) {
                        onOptionsChange({ model, scale: scaleValue });
                      }
                    }}
                    style={{
                      padding: `${8 * scale}px ${12 * scale}px`,
                      borderRadius: `${6 * scale}px`,
                      cursor: 'pointer',
                      backgroundColor: selectedModel === model ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      color: selectedModel === model ? '#3b82f6' : '#1f2937',
                      fontSize: `${14 * scale}px`,
                      whiteSpace: 'nowrap',
                      minWidth: 'max-content',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedModel !== model) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedModel !== model) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span style={{ whiteSpace: 'nowrap' }}>{model}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scale Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: `${8 * scale}px` }}>
            <button
              onClick={() => {
                const newScale = Math.max(1, scaleValue - 1);
                setScaleValue(newScale);
                if (onOptionsChange) {
                  onOptionsChange({ model: selectedModel, scale: newScale });
                }
              }}
              style={{
                width: `${32 * scale}px`,
                height: `${32 * scale}px`,
                borderRadius: '50%',
                border: `1px solid ${dropdownBorderColor}`,
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${18 * scale}px`,
                color: '#1f2937',
              }}
            >
              −
            </button>
            <span style={{ minWidth: `${40 * scale}px`, textAlign: 'center', fontSize: `${14 * scale}px`, color: '#1f2937' }}>
              {scaleValue}x
            </span>
            <button
              onClick={() => {
                const newScale = Math.min(6, scaleValue + 1);
                setScaleValue(newScale);
                if (onOptionsChange) {
                  onOptionsChange({ model: selectedModel, scale: newScale });
                }
              }}
              style={{
                width: `${32 * scale}px`,
                height: `${32 * scale}px`,
                borderRadius: '50%',
                border: `1px solid ${dropdownBorderColor}`,
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${18 * scale}px`,
                color: '#1f2937',
              }}
            >
              +
            </button>
          </div>

          {/* Upscale Button - Arrow Icon */}
          <button
            onClick={handleUpscale}
            disabled={isUpscaling || externalIsUpscaling || !sourceImageUrl}
            style={{
              width: `${40 * scale}px`,
              height: `${40 * scale}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: (!isUpscaling && !externalIsUpscaling && sourceImageUrl) ? '#437eb5' : 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              borderRadius: `${10 * scale}px`,
              cursor: (!isUpscaling && !externalIsUpscaling && sourceImageUrl) ? 'pointer' : 'not-allowed',
              color: 'white',
              boxShadow: (!isUpscaling && !externalIsUpscaling && sourceImageUrl) ? `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)` : 'none',
              padding: 0,
              opacity: (isUpscaling || externalIsUpscaling) ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isUpscaling && !externalIsUpscaling && sourceImageUrl) {
                e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(67, 126, 181, 0.5)`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isUpscaling && !externalIsUpscaling && sourceImageUrl) {
                e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)`;
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {isUpscaling || externalIsUpscaling ? (
              <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeDasharray="31.416" strokeDashoffset="31.416">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416;0 31.416" repeatCount="indefinite" />
                  <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416;-31.416" repeatCount="indefinite" />
                </path>
              </svg>
            ) : (
              <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 12h9" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </div>
      </div>
      )}

      {/* Image Frame */}
      <div
        ref={imageAreaRef}
        data-frame-id={id ? `${id}-frame` : undefined}
        onMouseDown={(e) => {
          // Allow dragging from the frame
          if (e.button === 0 && !e.defaultPrevented) {
            const target = e.target as HTMLElement;
            const isImage = target.tagName === 'IMG';
            const isNode = target.closest('[data-node-id]');
            if (!isImage && !isNode) {
              handleMouseDown(e as any);
            }
          }
        }}
        onClick={(e) => {
          // Ensure selection works when clicking on frame
          if (onSelect && !e.defaultPrevented) {
            onSelect();
          }
        }}
        style={{
          width: `${400 * scale}px`,
          maxWidth: '90vw',
          minHeight: `${150 * scale}px`,
          maxHeight: `${400 * scale}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: isUpscaledImage ? `${16 * scale}px` : `0 0 ${16 * scale}px ${16 * scale}px`,
          border: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDraggingContainer ? 'grabbing' : 'grab',
          overflow: 'visible',
          position: 'relative',
          zIndex: 1,
          transition: 'border 0.18s ease',
          padding: `${16 * scale}px`,
        }}
      >
        {sourceImageUrl ? (
          <img
            src={sourceImageUrl}
            alt="Source"
            style={{
              maxWidth: '100%',
              maxHeight: `${350 * scale}px`,
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              pointerEvents: 'none',
              borderRadius: `${8 * scale}px`,
              opacity: 1,
            }}
            draggable={false}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: `${20 * scale}px` }}>
            <svg
              width={48 * scale}
              height={48 * scale}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto 8px', opacity: 0.3 }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ fontSize: `${12 * scale}px`, margin: 0, opacity: 0.6 }}>Connect an image to upscale</p>
          </div>
        )}

        {/* Connection Nodes */}
        <>
          {/* Receive Node (Left) */}
          <div
            data-node-id={id}
            data-node-side="receive"
            onPointerEnter={(e) => {
              if (!id) return;
              window.dispatchEvent(new CustomEvent('canvas-node-hover', { detail: { nodeId: id } }));
            }}
            onPointerLeave={(e) => {
              if (!id) return;
              window.dispatchEvent(new CustomEvent('canvas-node-leave', { detail: { nodeId: id } }));
            }}
            onPointerUp={(e) => {
              if (!id) return;
              e.stopPropagation();
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('canvas-node-complete', { detail: { id, side: 'receive' } }));
              try {
                const active: any = (window as any).__canvas_active_capture;
                if (active?.element && typeof active?.pid === 'number') {
                  try { active.element.releasePointerCapture(active.pid); } catch (err) {}
                  delete (window as any).__canvas_active_capture;
                }
              } catch (err) {}
            }}
            style={{
              position: 'absolute',
              left: `${-12 * scale}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              width: `${20 * scale}px`,
              height: `${20 * scale}px`,
              borderRadius: '50%',
              backgroundColor: '#437eb5',
              cursor: 'pointer',
              border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
              zIndex: 5000,
              opacity: (isHovered || isSelected || globalDragActive) ? 1 : 0,
              transition: 'opacity 0.18s ease, transform 0.12s ease',
              pointerEvents: 'auto',
            }}
          />
          {/* Send Node (Right) */}
          <div
            data-node-id={id}
            data-node-side="send"
            onPointerDown={(e: React.PointerEvent) => {
              const el = e.currentTarget as HTMLElement;
              const pid = e.pointerId;
              try { el.setPointerCapture?.(pid); } catch (err) {}
              // store active capture so receiver can release if needed
              try { (window as any).__canvas_active_capture = { element: el, pid }; } catch (err) {}
              if (!id) return;
              e.stopPropagation();
              e.preventDefault();
              const color = '#437eb5';

              const handlePointerUp = (pe: any) => {
                try { el.releasePointerCapture?.(pe?.pointerId ?? pid); } catch (err) {}
                try { delete (window as any).__canvas_active_capture; } catch (err) {}
                window.removeEventListener('canvas-node-complete', handleComplete as any);
                window.removeEventListener('pointerup', handlePointerUp as any);
              };

              const handleComplete = () => {
                try { el.releasePointerCapture?.(pid); } catch (err) {}
                try { delete (window as any).__canvas_active_capture; } catch (err) {}
                window.removeEventListener('canvas-node-complete', handleComplete as any);
                window.removeEventListener('pointerup', handlePointerUp as any);
              };

              window.addEventListener('canvas-node-complete', handleComplete as any);
              window.addEventListener('pointerup', handlePointerUp as any);

              window.dispatchEvent(new CustomEvent('canvas-node-start', { detail: { id, side: 'send', color, startX: e.clientX, startY: e.clientY } }));
            }}
            style={{
              position: 'absolute',
              right: `${-12 * scale}px`,
              top: '50%',
              transform: 'translateY(-50%)',
              width: `${20 * scale}px`,
              height: `${20 * scale}px`,
              borderRadius: '50%',
              backgroundColor: '#437eb5',
              boxShadow: `0 0 ${8 * scale}px rgba(0,0,0,0.25)`,
              cursor: 'grab',
              border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
              zIndex: 10,
              opacity: (isHovered || isSelected || globalDragActive) ? 1 : 0,
              transition: 'opacity 0.18s ease',
              pointerEvents: 'auto',
            }}
          />
        </>
      </div>

    </div>
  );
};

