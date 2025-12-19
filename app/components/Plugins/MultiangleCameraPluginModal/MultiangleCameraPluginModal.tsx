'use client';

import { useState, useRef, useEffect } from 'react';
import '../../common/canvasCaptureGuard';
import { ModalActionIcons } from '../../common/ModalActionIcons';
import { MultiangleCameraControls } from './MultiangleCameraControls';
import { MultiangleCameraImageFrame } from './MultiangleCameraImageFrame';
import { useCanvasModalDrag } from '../PluginComponents/useCanvasModalDrag';
import { useCanvasFrameDim, useConnectedSourceImage, useLatestRef, usePersistedPopupState } from '../PluginComponents';
import { PluginNodeShell } from '../PluginComponents';
import { PluginConnectionNodes } from '../PluginComponents';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';

interface MultiangleCameraPluginModalProps {
  isOpen: boolean;
  isExpanded?: boolean;
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
  initialSourceImageUrl?: string | null;
  onOptionsChange?: (opts: { sourceImageUrl?: string | null; prompt?: string; loraScale?: number; aspectRatio?: string; moveForward?: number; verticalTilt?: number; rotateDegrees?: number; useWideAngle?: boolean; isGenerating?: boolean }) => void;
  onPersistMultiangleCameraModalCreate?: (modal: { id: string; x: number; y: number; sourceImageUrl?: string | null }) => void | Promise<void>;
  onUpdateModalState?: (modalId: string, updates: { sourceImageUrl?: string | null; isExpanded?: boolean; prompt?: string; loraScale?: number; aspectRatio?: string; moveForward?: number; verticalTilt?: number; rotateDegrees?: number; useWideAngle?: boolean; isGenerating?: boolean }) => void;
  onMultiangleCamera?: (sourceImageUrl?: string, prompt?: string, loraScale?: number, aspectRatio?: string, moveForward?: number, verticalTilt?: number, rotateDegrees?: number, useWideAngle?: boolean) => Promise<string | null>;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
  onUpdateImageModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
}

export const MultiangleCameraPluginModal: React.FC<MultiangleCameraPluginModalProps> = ({
  isOpen,
  isExpanded,
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
  initialSourceImageUrl,
  onOptionsChange,
  onPersistMultiangleCameraModalCreate,
  onUpdateModalState,
  onMultiangleCamera,
  onPersistImageModalCreate,
  onUpdateImageModalState,
  connections = [],
  imageModalStates = [],
  images = [],
  onPersistConnectorCreate,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDimmed, setIsDimmed } = useCanvasFrameDim(id);
  const { isPopupOpen, setIsPopupOpen, togglePopup } = usePersistedPopupState({ isExpanded, id, onUpdateModalState, defaultOpen: false });
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(initialSourceImageUrl ?? null);
  const [prompt, setPrompt] = useState<string>('');
  const [loraScale, setLoraScale] = useState<number>(1.25);
  const [aspectRatio, setAspectRatio] = useState<string>('match_input_image');
  const [moveForward, setMoveForward] = useState<number>(0);
  const [verticalTilt, setVerticalTilt] = useState<number>(0);
  const [rotateDegrees, setRotateDegrees] = useState<number>(0);
  const [useWideAngle, setUseWideAngle] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
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

  const connectedImageSource = useConnectedSourceImage({ id, connections, imageModalStates, images });

  // Restore images from props on mount or when props change
  useEffect(() => {
    if (initialSourceImageUrl !== undefined) {
      setSourceImageUrl(initialSourceImageUrl);
    }
  }, [initialSourceImageUrl]);

  useEffect(() => {
    // Handle connection changes: update or clear source image
    if (connectedImageSource) {
      // Connection exists: update source image if different
      if (connectedImageSource !== sourceImageUrl) {
        setSourceImageUrl(connectedImageSource);
        // Clear dimming when image is connected
        setIsDimmed(false);
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
  }, [connectedImageSource, initialSourceImageUrl, sourceImageUrl]);

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

  const handleGenerate = async () => {
    if (!sourceImageUrl || !onMultiangleCamera) {
      console.error('[MultiangleCameraPluginModal] Missing sourceImageUrl or onMultiangleCamera');
      return;
    }

    setIsGenerating(true);
    if (onOptionsChange) {
      onOptionsChange({ isGenerating: true } as any);
    }
    if (onUpdateModalState && id) {
      onUpdateModalState(id, { isGenerating: true });
    }

    // Create new image generation frame immediately (before API call) to show loading state
    const frameWidth = 600;
    const frameHeight = 600;
    const offsetX = frameWidth + 50;
    const targetX = x + offsetX;
    const targetY = y;
    const newModalId = `image-multiangle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (onPersistImageModalCreate) {
      // Create image generation frame with isGenerating flag to show loading state
      const newModal = {
        id: newModalId,
        x: targetX,
        y: targetY,
        generatedImageUrl: null as string | null,
        frameWidth,
        frameHeight,
        model: 'Multiangle Camera',
        frame: 'Frame',
        aspectRatio: aspectRatio,
        prompt: prompt || '',
        isGenerating: true,
      };

      await Promise.resolve(onPersistImageModalCreate(newModal));
    }

    // Automatically create connection from multiangle camera plugin to new frame
    if (onPersistConnectorCreate && id) {
      const controlsHeight = 100;
      const imageFrameHeight = 300;
      const imageFrameCenterY = controlsHeight + (imageFrameHeight / 2);

      const fromX = x + 400;
      const fromY = y + imageFrameCenterY;
      const toX = targetX;
      const toY = targetY + (frameHeight / 2);

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
        console.log('[MultiangleCameraPluginModal] Created connection from plugin to new frame:', newConnector);
      }
    }

    try {
      const imageUrl = sourceImageUrl;
      console.log('[MultiangleCameraPluginModal] Calling onMultiangleCamera with:', {
        imageUrl,
        prompt,
        loraScale,
        aspectRatio,
        moveForward,
        verticalTilt,
        rotateDegrees,
        useWideAngle,
      });
      const result = await onMultiangleCamera(
        imageUrl || undefined,
        prompt || undefined,
        loraScale,
        aspectRatio,
        moveForward,
        verticalTilt,
        rotateDegrees,
        useWideAngle
      );
      console.log('[MultiangleCameraPluginModal] onMultiangleCamera returned:', result);

      // Extract URL from result
      const resultUrl = typeof result === 'string' ? result : ((result as any)?.url || (result as any)?.data?.url || null);

      if (!resultUrl) {
        console.error('[MultiangleCameraPluginModal] No URL in result:', result);
        throw new Error('Multiangle generation completed but no image URL was returned');
      }

      console.log('[MultiangleCameraPluginModal] Extracted result URL:', resultUrl);

      // Update the image generation frame with the result
      if (resultUrl && onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: resultUrl,
          model: 'Multiangle Camera',
          frame: 'Frame',
          aspectRatio: aspectRatio,
          prompt: prompt || '',
          frameWidth,
          frameHeight,
          isGenerating: false,
        });
        console.log('[MultiangleCameraPluginModal] Updated image modal state with URL:', resultUrl);
      }
    } catch (error) {
      console.error('[MultiangleCameraPluginModal] Multiangle generation error:', error);
      // Update frame to show error state or remove it
      if (onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          generatedImageUrl: null,
          model: 'Multiangle Camera',
          isGenerating: false,
        });
      }
    } finally {
      setIsGenerating(false);
      if (onOptionsChange) {
        onOptionsChange({ isGenerating: false } as any);
      }
      if (onUpdateModalState && id) {
        onUpdateModalState(id, { isGenerating: false });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <PluginNodeShell
      modalKey="multianglecamera"
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
          Multiangle Camera
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
          {/* Multiangle Camera Icon - using camera icon */}
          <svg
            width={40 * scale}
            height={40 * scale}
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDark ? '#ffffff' : '#1a1a1a'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              display: 'block',
              userSelect: 'none',
              pointerEvents: 'none',
              transition: 'stroke 0.3s ease',
            }}
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>

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
              <MultiangleCameraControls
                scale={scale}
                sourceImageUrl={sourceImageUrl}
                frameBorderColor={frameBorderColor}
                frameBorderWidth={frameBorderWidth}
                extraTopPadding={popupOverlap + 16 * scale}
                onHoverChange={setIsHovered}
                prompt={prompt}
                loraScale={loraScale}
                aspectRatio={aspectRatio}
                moveForward={moveForward}
                verticalTilt={verticalTilt}
                rotateDegrees={rotateDegrees}
                useWideAngle={useWideAngle}
                isGenerating={isGenerating}
                onPromptChange={setPrompt}
                onLoraScaleChange={setLoraScale}
                onAspectRatioChange={setAspectRatio}
                onMoveForwardChange={setMoveForward}
                onVerticalTiltChange={setVerticalTilt}
                onRotateDegreesChange={setRotateDegrees}
                onUseWideAngleChange={setUseWideAngle}
                onGenerate={handleGenerate}
              />
              <MultiangleCameraImageFrame
                id={id}
                scale={scale}
                frameBorderColor={frameBorderColor}
                frameBorderWidth={frameBorderWidth}
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
