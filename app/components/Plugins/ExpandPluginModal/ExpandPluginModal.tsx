'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '../../common/canvasCaptureGuard';
import { ModalActionIcons } from '../../common/ModalActionIcons';
import { ExpandButton } from './ExpandButton';
import { ExpandImageFrame } from './ExpandImageFrame';
import { ExpandControls } from './ExpandControls';
import { ConnectionNodes } from '../UpscalePluginModal/ConnectionNodes';
import { buildProxyResourceUrl } from '@/lib/proxyUtils';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface ExpandPluginModalProps {
  isOpen: boolean;
  id?: string;
  onClose: () => void;
  onExpand?: (model: string, sourceImageUrl?: string, prompt?: string, canvasSize?: [number, number], originalImageSize?: [number, number], originalImageLocation?: [number, number], aspectRatio?: string) => Promise<string | null>;
  expandedImageUrl?: string | null;
  isExpanding?: boolean;
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
  initialSourceImageUrl?: string | null;
  initialLocalExpandedImageUrl?: string | null;
  onOptionsChange?: (opts: { model?: string; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; isExpanding?: boolean }) => void;
  onPersistExpandModalCreate?: (modal: { id: string; x: number; y: number; expandedImageUrl?: string | null; isExpanding?: boolean }) => void | Promise<void>;
  onUpdateModalState?: (modalId: string, updates: { expandedImageUrl?: string | null; isExpanding?: boolean }) => void;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
  onUpdateImageModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
}

export const ExpandPluginModal: React.FC<ExpandPluginModalProps> = ({
  isOpen,
  id,
  onClose,
  onExpand,
  expandedImageUrl,
  isExpanding: externalIsExpanding,
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
  initialSourceImageUrl,
  initialLocalExpandedImageUrl,
  onOptionsChange,
  onPersistExpandModalCreate,
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
  const [selectedModel] = useState(initialModel ?? 'bria/expander');
  const [isExpanding, setIsExpanding] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(initialSourceImageUrl ?? null);
  const [localExpandedImageUrl, setLocalExpandedImageUrl] = useState<string | null>(initialLocalExpandedImageUrl ?? null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [expandPrompt, setExpandPrompt] = useState('');
  const aspectPresets = {
    custom: { label: 'Custom', sizeLabel: 'Custom', width: 1024, height: 1024, aspectRatio: 1 },
    '1:1': { label: '1:1', sizeLabel: '1500 × 1500', width: 1500, height: 1500, aspectRatio: 1 },
    '2:3': { label: '2:3', sizeLabel: '1334 × 2000', width: 1334, height: 2000, aspectRatio: 2 / 3 },
    '3:2': { label: '3:2', sizeLabel: '1800 × 1200', width: 1800, height: 1200, aspectRatio: 3 / 2 },
    '3:4': { label: '3:4', sizeLabel: '1350 × 1800', width: 1350, height: 1800, aspectRatio: 3 / 4 },
    '4:3': { label: '4:3', sizeLabel: '1600 × 1200', width: 1600, height: 1200, aspectRatio: 4 / 3 },
    '4:5': { label: '4:5', sizeLabel: '1200 × 1500', width: 1200, height: 1500, aspectRatio: 4 / 5 },
    '5:4': { label: '5:4', sizeLabel: '1500 × 1200', width: 1500, height: 1200, aspectRatio: 5 / 4 },
    '9:16': { label: '9:16', sizeLabel: '1080 × 1920', width: 1080, height: 1920, aspectRatio: 9 / 16 },
    '16:9': { label: '16:9', sizeLabel: '1920 × 1080', width: 1920, height: 1080, aspectRatio: 16 / 9 },
  };
  type AspectPreset = keyof typeof aspectPresets;
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>('1:1');

  // Handle aspect preset change with validation
  const handleAspectPresetChange = (preset: AspectPreset) => {
    if (preset === 'custom') {
      setAspectPreset(preset);
      return;
    }

    const presetConfig = aspectPresets[preset];
    if (!presetConfig || !presetConfig.width || !presetConfig.height) {
      setAspectPreset(preset);
      return;
    }

    // If image is loaded and preset is smaller, switch to custom with image dimensions
    if (imageSize) {
      if (presetConfig.width < imageSize.width || presetConfig.height < imageSize.height) {
        // Switch to custom with image dimensions (or larger)
        setAspectPreset('custom');
        setCustomWidth(Math.max(presetConfig.width, imageSize.width));
        setCustomHeight(Math.max(presetConfig.height, imageSize.height));
        return;
      }
    }

    setAspectPreset(preset);
  };
  const [customWidth, setCustomWidth] = useState(1024);
  const [customHeight, setCustomHeight] = useState(1024);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [frameInfo, setFrameInfo] = useState<{
    canvasSize: [number, number];
    originalImageSize: [number, number];
    originalImageLocation: [number, number];
    aspectRatio?: string;
  } | null>(null);

  // Adjust custom dimensions when image size is loaded if they're too small
  useEffect(() => {
    if (imageSize && aspectPreset === 'custom') {
      if (customWidth < imageSize.width) {
        setCustomWidth(imageSize.width);
      }
      if (customHeight < imageSize.height) {
        setCustomHeight(imageSize.height);
      }
    }
  }, [imageSize, aspectPreset]);
  const onOptionsChangeRef = useRef(onOptionsChange);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

  // Update ref when callback changes
  useEffect(() => {
    onOptionsChangeRef.current = onOptionsChange;
  }, [onOptionsChange]);

  // Block wheel events from reaching canvas when popup is open
  useEffect(() => {
    if (!isPopupOpen) return;

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const popup = document.querySelector('[data-expand-popup]');
      // Allow wheel events that originate inside the popup (canvas needs them)
      if (popup && (popup === target || popup.contains(target))) {
        return;
      }
      // Otherwise block wheel events to prevent canvas zooming behind the popup
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const popup = document.querySelector('[data-expand-popup]');
      if (popup && (popup === target || popup.contains(target))) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const popup = document.querySelector('[data-expand-popup]');
      // Block mouse move events outside the popup to prevent main canvas interaction
      if (!popup || !(popup === target || popup.contains(target))) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const popup = document.querySelector('[data-expand-popup]');
      // Block mouse down events outside the popup to prevent main canvas interaction
      if (!popup || !(popup === target || popup.contains(target))) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    // Use capture phase to catch events before they reach canvas
    window.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    window.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });
    window.addEventListener('mousemove', handleMouseMove, { capture: true });
    window.addEventListener('mousedown', handleMouseDown, { capture: true });

    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true } as any);
      window.removeEventListener('touchmove', handleTouchMove, { capture: true } as any);
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mousedown', handleMouseDown, { capture: true });
    };
  }, [isPopupOpen]);

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const isDark = useIsDarkTheme();

  const frameBorderColor = isSelected
    ? '#437eb5'
    : (isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)');
  const frameBorderWidth = 2;

  // Detect connected image nodes (from image generators or canvas images)
  const connectedImageSource = useMemo(() => {
    if (!id) return null;
    const conn = connections.find(c => c.to === id && c.from);
    if (!conn) return null;

    // First check if it's from an image generator modal
    const sourceModal = imageModalStates?.find(m => m.id === conn.from);
    if (sourceModal?.generatedImageUrl) {
      // Use proxy URL for Zata URLs to avoid CORS issues
      const url = sourceModal.generatedImageUrl;
      if (url && (url.includes('zata.ai') || url.includes('zata'))) {
        return buildProxyResourceUrl(url);
      }
      return url;
    }

    // Then check if it's from a canvas image (uploaded image)
    if (images && images.length > 0) {
      const canvasImage = images.find(img => {
        const imgId = img.elementId || (img as any).id;
        return imgId === conn.from;
      });
      if (canvasImage?.url) {
        // Use proxy URL for Zata URLs to avoid CORS issues
        const url = canvasImage.url;
        if (url && (url.includes('zata.ai') || url.includes('zata'))) {
          return buildProxyResourceUrl(url);
        }
        return url;
      }
    }

    return null;
  }, [id, connections, imageModalStates, images]);

  // Check if we have a source image (either from state or connected)
  const hasSourceImage = useMemo(() => {
    return Boolean(sourceImageUrl || connectedImageSource);
  }, [sourceImageUrl, connectedImageSource]);

  // Restore images from props on mount or when props change
  useEffect(() => {
    if (initialSourceImageUrl !== undefined) {
      setSourceImageUrl(initialSourceImageUrl);
    }
    if (initialLocalExpandedImageUrl !== undefined) {
      setLocalExpandedImageUrl(initialLocalExpandedImageUrl);
    }
  }, [initialSourceImageUrl, initialLocalExpandedImageUrl]);

  useEffect(() => {
    if (connectedImageSource && connectedImageSource !== sourceImageUrl) {
      setSourceImageUrl(connectedImageSource);
      // Clear dimming when image is connected
      setIsDimmed(false);
      // Reset expanded image when source changes (only if not persisted)
      if (!initialLocalExpandedImageUrl) {
        setLocalExpandedImageUrl(null);
      }
      // Persist the source image URL (only if it actually changed from initial)
      if (onOptionsChangeRef.current && connectedImageSource !== initialSourceImageUrl) {
        onOptionsChangeRef.current({ sourceImageUrl: connectedImageSource });
      }
    }
  }, [connectedImageSource, initialLocalExpandedImageUrl, initialSourceImageUrl, sourceImageUrl]);

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

    // Call onSelect when clicking on the modal (this will trigger context menu)
    // Don't select if clicking on buttons, controls, inputs, or action icons
    if (onSelect && !isInput && !isButton && !isControls && !isActionIcons) {
      onSelect();
    }

    // Only allow dragging from the frame, not from controls
    if (isButton || isInput || isControls || isActionIcons) {
      return;
    }

    // Track initial mouse position to detect drag vs click
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;

    e.preventDefault();
    e.stopPropagation();

    setIsDraggingContainer(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startCanvasX = x;
    const startCanvasY = y;

    setDragOffset({ x: 0, y: 0 });
    lastCanvasPosRef.current = { x: startCanvasX, y: startCanvasY };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Check if mouse moved significantly (more than 5px) to detect drag
      if (dragStartPosRef.current) {
        const dx = Math.abs(moveEvent.clientX - dragStartPosRef.current.x);
        const dy = Math.abs(moveEvent.clientY - dragStartPosRef.current.y);
        if (dx > 5 || dy > 5) {
          hasDraggedRef.current = true;
        }
      }

      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;
      const newX = startCanvasX + deltaX;
      const newY = startCanvasY + deltaY;

      setDragOffset({ x: deltaX, y: deltaY });
      lastCanvasPosRef.current = { x: newX, y: newY };

      if (onPositionChange) {
        onPositionChange(newX, newY);
      }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      const wasDragging = hasDraggedRef.current;
      setIsDraggingContainer(false);
      setDragOffset({ x: 0, y: 0 });
      dragStartPosRef.current = null;

      // Only toggle popup if it was a click (not a drag)
      if (!wasDragging) {
        setIsPopupOpen(prev => !prev);
      }

      if (lastCanvasPosRef.current && onPositionCommit) {
        onPositionCommit(lastCanvasPosRef.current.x, lastCanvasPosRef.current.y);
      }

      // Reset drag flag
      hasDraggedRef.current = false;

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };


  const handleExpand = async () => {
    const effectiveSourceImageUrl = sourceImageUrl || connectedImageSource;
    if (!onExpand || !effectiveSourceImageUrl) {
      setIsPopupOpen(false);
      return;
    }

    if (isExpanding || externalIsExpanding) {
      return;
    }

    setIsExpanding(true);
    if (onOptionsChangeRef.current) {
      onOptionsChangeRef.current({ isExpanding: true });
    }

    // Close popup after starting expand
    setIsPopupOpen(false);

    // Calculate frame dimensions (same as erase/replace)
    const frameWidth = 600;
    const frameHeight = 600;
    const offsetX = frameWidth + 50;
    const targetX = x + offsetX;
    const targetY = y;
    const newModalId = `image-expand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create image generation frame with isGenerating flag to show loading state
    if (onPersistImageModalCreate) {
      const newModal = {
        id: newModalId,
        x: targetX,
        y: targetY,
        generatedImageUrl: null as string | null,
        frameWidth,
        frameHeight,
        model: 'Expand', // Label will show "Expand" (like "Media")
        frame: 'Frame',
        aspectRatio: '1:1',
        prompt: '',
        isGenerating: true, // Show loading state
      };

      await Promise.resolve(onPersistImageModalCreate(newModal));
    }

    // Automatically create connection from expand plugin to new frame
    if (onPersistConnectorCreate && id) {
      // Calculate node positions (right side of expand plugin, left side of new frame)
      const controlsHeight = 100; // Approximate controls section height
      const imageFrameHeight = 300; // Typical image frame height in canvas coordinates
      const imageFrameCenterY = controlsHeight + (imageFrameHeight / 2);

      const fromX = x + 400; // Right side of expand plugin (width is 400 in canvas coordinates)
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
        console.log('[ExpandPluginModal] Created connection from plugin to new frame:', newConnector);
      }
    }

    try {
      if (!frameInfo) {
        throw new Error('Frame information is not available. Please ensure the image is loaded and positioned in the frame.');
      }

      // Validate frame info before calling API
      if (!frameInfo.canvasSize || frameInfo.canvasSize.length !== 2 ||
        frameInfo.canvasSize[0] <= 0 || frameInfo.canvasSize[1] <= 0) {
        throw new Error('Invalid canvas size. Please ensure the frame is properly configured.');
      }

      if (!frameInfo.originalImageSize || frameInfo.originalImageSize.length !== 2 ||
        frameInfo.originalImageSize[0] <= 0 || frameInfo.originalImageSize[1] <= 0) {
        throw new Error('Invalid image size. Please ensure the image is loaded.');
      }

      if (!frameInfo.originalImageLocation || frameInfo.originalImageLocation.length !== 2) {
        throw new Error('Invalid image position. Please ensure the image is positioned in the frame.');
      }

      console.log('[ExpandPluginModal] Calling expand with frame info:', {
        canvasSize: frameInfo.canvasSize,
        originalImageSize: frameInfo.originalImageSize,
        originalImageLocation: frameInfo.originalImageLocation,
        aspectRatio: frameInfo.aspectRatio,
      });

      const result = await onExpand(
        selectedModel,
        effectiveSourceImageUrl,
        expandPrompt || undefined,
        frameInfo.canvasSize,
        frameInfo.originalImageSize,
        frameInfo.originalImageLocation,
        frameInfo.aspectRatio
      );

      console.log('[ExpandPluginModal] ✅ onExpand completed:', {
        hasResult: !!result,
        resultUrl: result ? result.substring(0, 100) + '...' : 'null',
        newModalId,
        hasOnUpdateImageModalState: !!onUpdateImageModalState
      });

      // Clear isExpanding state now that the result is received
      setIsExpanding(false);
      if (onOptionsChangeRef.current) {
        onOptionsChangeRef.current({ isExpanding: false });
      }
      // Also update the modal state to clear isExpanding (this updates externalIsExpanding prop)
      if (onUpdateModalState && id) {
        onUpdateModalState(id, { isExpanding: false });
      }

      // Update the image generation frame with the result
      if (result && onUpdateImageModalState) {
        console.log('[ExpandPluginModal] Updating image modal state:', {
          modalId: newModalId,
          imageUrl: result.substring(0, 100) + '...',
          frameWidth,
          frameHeight
        });
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: result,
          model: 'Expand',
          frame: 'Frame',
          aspectRatio: '1:1',
          prompt: '',
          frameWidth,
          frameHeight,
          isGenerating: false, // Clear loading state
        });
        console.log('[ExpandPluginModal] ✅ Image modal state updated');
      } else {
        console.warn('[ExpandPluginModal] ⚠️ Cannot update image modal:', {
          hasResult: !!result,
          hasOnUpdateImageModalState: !!onUpdateImageModalState,
          newModalId
        });
      }

      // Also store the expanded image in the plugin
      if (result) {
        setLocalExpandedImageUrl(result);
        // Update the modal state with expandedImageUrl so it displays in the frame
        if (onUpdateModalState && id) {
          onUpdateModalState(id, { expandedImageUrl: result, isExpanding: false });
        }
        // Persist the local expanded image URL
        if (onOptionsChangeRef.current) {
          onOptionsChangeRef.current({
            localExpandedImageUrl: result,
            isExpanding: false
          });
        }
        setExpandPrompt('');
      }
    } catch (err) {
      console.error('[ExpandPluginModal] Expand error', err);
      // Clear isExpanding state on error
      setIsExpanding(false);
      if (onOptionsChangeRef.current) {
        onOptionsChangeRef.current({ isExpanding: false });
      }
      // Also update the modal state to clear isExpanding (this updates externalIsExpanding prop)
      if (onUpdateModalState && id) {
        onUpdateModalState(id, { isExpanding: false });
      }
      // Update frame to show error state or remove it
      if (onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: null,
          model: 'Expand',
          isGenerating: false, // Clear loading state
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      data-modal-component="expand"
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
          display: 'flex',
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
          Expand
        </div>

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
          {/* Expand Icon */}
          <img
            src="/icons/resize.svg"
            alt="Expand"
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
              console.error('[ExpandPluginModal] Failed to load resize.svg icon');
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

      </div>

      {isPopupOpen && (
        <div
          data-expand-popup
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10003,
            backdropFilter: 'blur(4px)',
            pointerEvents: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsPopupOpen(false);
            }
          }}
          onWheel={(e) => {
            // Only prevent default if the event is NOT on the canvas or its container
            const target = e.target as HTMLElement;
            const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-expand-canvas-container]');
            if (!isCanvas) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onTouchMove={(e) => {
            // Only prevent default if the event is NOT on the canvas or its container
            const target = e.target as HTMLElement;
            const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-expand-canvas-container]');
            if (!isCanvas) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onMouseDown={(e) => {
            // Only prevent propagation if the event is NOT on the canvas or its container
            const target = e.target as HTMLElement;
            const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-expand-canvas-container]');
            if (!isCanvas) {
              e.stopPropagation();
            }
          }}
          onMouseMove={(e) => {
            // Prevent mouse move events from reaching main canvas
            const target = e.target as HTMLElement;
            const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-expand-canvas-container]');
            if (!isCanvas) {
              e.stopPropagation();
            }
          }}
        >
        {hasSourceImage ? (
              <div
                style={{
                  backgroundColor: isDark ? '#121212' : 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  width: '90vw',
                  maxWidth: '1200px',
                  height: '85vh',
                  maxHeight: '90vh',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.6)' : '0 8px 32px rgba(0, 0, 0, 0.3)',
                  overflow: 'hidden',
                  pointerEvents: 'auto',
                  transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                }}
                onClick={(e) => e.stopPropagation()}
                onWheel={(e) => {
                  // Only prevent default if the event is NOT on the canvas or its container
                  const target = e.target as HTMLElement;
                  const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-expand-canvas-container]');
                  if (!isCanvas) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                onTouchMove={(e) => {
                  // Only prevent default if the event is NOT on the canvas or its container
                  const target = e.target as HTMLElement;
                  const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-expand-canvas-container]');
                  if (!isCanvas) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                onMouseDown={(e) => {
                  // Only prevent propagation if the event is NOT on the canvas or its container
                  const target = e.target as HTMLElement;
                  const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-expand-canvas-container]');
                  if (!isCanvas) {
                    e.stopPropagation();
                  }
                }}
                onMouseMove={(e) => {
                  // Prevent mouse move events from reaching main canvas
                  const target = e.target as HTMLElement;
                  const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-expand-canvas-container]');
                  if (!isCanvas) {
                    e.stopPropagation();
                  }
                }}
              >
                {/* Header with Controls */}
                <ExpandControls
                  aspectPreset={aspectPreset}
                  expandPrompt={expandPrompt}
                  isExpanding={isExpanding}
                  externalIsExpanding={externalIsExpanding}
                  sourceImageUrl={sourceImageUrl || connectedImageSource}
                  onAspectPresetChange={(preset) => handleAspectPresetChange(preset as AspectPreset)}
                  onExpandPromptChange={setExpandPrompt}
                  onExpand={handleExpand}
                  onClose={() => setIsPopupOpen(false)}
                  aspectPresets={aspectPresets}
                  customWidth={customWidth}
                  customHeight={customHeight}
                  onCustomWidthChange={setCustomWidth}
                  onCustomHeightChange={setCustomHeight}
                  imageSize={imageSize}
                />

                {/* Image Preview with Canvas */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    borderRadius: '8px',
                    border: isDark ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid #e5e7eb',
                    backgroundColor: isDark ? '#1a1a1a' : '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.3s ease, border-color 0.3s ease',
                  }}
                >
                  <ExpandImageFrame
                    sourceImageUrl={sourceImageUrl || connectedImageSource}
                    localExpandedImageUrl={localExpandedImageUrl}
                    expandedImageUrl={expandedImageUrl}
                    aspectPreset={aspectPreset}
                    aspectPresets={aspectPresets}
                    customWidth={customWidth}
                    customHeight={customHeight}
                    onFrameInfoChange={setFrameInfo}
                    onImageSizeChange={setImageSize}
                  />
                </div>
              </div>
        ) : (
          <div
            style={{
              backgroundColor: isDark ? '#121212' : 'white',
              borderRadius: '16px',
              padding: '32px',
              width: 'min(420px, 90vw)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.3)',
              pointerEvents: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: isDark ? '#ffffff' : '#111827' }}>
              Connect an image to expand
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: isDark ? '#cccccc' : '#4b5563' }}>
              Use the connection nodes to attach an image or generated frame. Once connected, the expand workspace will appear here.
            </p>
            <button
              onClick={() => setIsPopupOpen(false)}
              style={{
                marginTop: '8px',
                padding: '10px 20px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: '#437eb5',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Close
            </button>
          </div>
        )}
        </div>
      )}
    </div>
  );
};
