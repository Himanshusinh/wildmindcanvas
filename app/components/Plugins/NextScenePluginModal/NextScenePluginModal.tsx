'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '../../common/canvasCaptureGuard';
import { NextSceneLabel } from './NextSceneLabel';
// import { ModalActionIcons } from '../../common/ModalActionIcons'; // Not used in Vectorize either
import { NextSceneControls } from './NextSceneControls';
import { NextSceneImageFrame } from './NextSceneImageFrame';
import { ConnectionNodes } from '../UpscalePluginModal/ConnectionNodes';
import { useCanvasModalDrag } from '../PluginComponents/useCanvasModalDrag';
import { useCanvasFrameDim, useConnectedSourceImages, useLatestRef, usePersistedPopupState } from '../PluginComponents';
import { PluginNodeShell } from '../PluginComponents';
import { useIsDarkTheme } from '@/app/hooks/useIsDarkTheme';
import { API_BASE_URL } from '@/lib/api';

interface NextScenePluginModalProps {
  isOpen: boolean;
  isExpanded?: boolean;
  id?: string;
  onClose: () => void;
  // onVectorize removed - specific handler not needed for UI-only
  // vectorizedImageUrl -> nextSceneImageUrl
  nextSceneImageUrl?: string | null;
  isProcessing?: boolean; // Generic processing state
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
  initialLocalNextSceneImageUrl?: string | null;
  initialPrompt?: string;
  initialAspectRatio?: string;
  initialLoraScale?: number;
  onOptionsChange?: (opts: {
    mode?: string;
    sourceImageUrl?: string | null;
    localNextSceneImageUrl?: string | null;
    isProcessing?: boolean;
    prompt?: string;
    aspectRatio?: string;
    loraScale?: number;
  }) => void;
  onPersistNextSceneModalCreate?: (modal: {
    id: string;
    x: number;
    y: number;
    nextSceneImageUrl?: string | null;
    sourceImageUrl?: string | null;
    localNextSceneImageUrl?: string | null;
    mode?: string;
    frameWidth?: number;
    frameHeight?: number;
    isProcessing?: boolean;
    prompt?: string;
    aspectRatio?: string;
    loraScale?: number;
  }) => void | Promise<void>;
  onUpdateModalState?: (modalId: string, updates: { nextSceneImageUrl?: string | null; isProcessing?: boolean; isExpanded?: boolean }) => void;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
  onUpdateImageModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
}

export const NextScenePluginModal: React.FC<NextScenePluginModalProps> = ({
  isOpen,
  isExpanded,
  id,
  onClose,
  nextSceneImageUrl,
  isProcessing: externalIsProcessing,
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
  initialLocalNextSceneImageUrl,
  initialPrompt,
  initialAspectRatio,
  initialLoraScale,
  onOptionsChange,
  onPersistNextSceneModalCreate,
  onUpdateModalState,
  onPersistImageModalCreate,
  onUpdateImageModalState,
  connections = [],
  imageModalStates = [],
  images = [],
  onPersistConnectorCreate,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageResolution, setImageResolution] = useState<{ width: number; height: number } | null>(null);
  const { isDimmed, setIsDimmed } = useCanvasFrameDim(id);
  const { isPopupOpen, setIsPopupOpen, togglePopup } = usePersistedPopupState({ isExpanded, id, onUpdateModalState, defaultOpen: false });
  const [mode, setMode] = useState<string>(initialMode ?? 'scene'); // Default mode 'scene'
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(initialSourceImageUrl ?? null);
  const [localNextSceneImageUrl, setLocalNextSceneImageUrl] = useState<string | null>(initialLocalNextSceneImageUrl ?? null);

  // New State
  const [prompt, setPrompt] = useState<string>(initialPrompt || '');
  const [aspectRatio, setAspectRatio] = useState<string>(initialAspectRatio || '1:1');
  const [loraScale, setLoraScale] = useState<number>(initialLoraScale !== undefined ? initialLoraScale : 1.15);
  const [trueGuidanceScale, setTrueGuidanceScale] = useState<number>(0);

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

  // Detect if this is a result image (media-like, no controls) - simplified to false like Vectorize
  const isResultImage = false;

  const connectedImageSources = useConnectedSourceImages({ id, connections, imageModalStates, images });

  // Restore images and mode from props on mount or when props change
  useEffect(() => {
    if (initialMode !== undefined) {
      setMode(initialMode);
    }
    if (initialSourceImageUrl !== undefined) {
      setSourceImageUrl(initialSourceImageUrl);
    }
    if (initialLocalNextSceneImageUrl !== undefined) {
      setLocalNextSceneImageUrl(initialLocalNextSceneImageUrl);
    }
  }, [initialMode, initialSourceImageUrl, initialLocalNextSceneImageUrl]);

  useEffect(() => {
    // If we have connected images, update local state
    if (connectedImageSources.length > 0) {
      // Always use the first one as primary source for single scene mode
      const firstSource = connectedImageSources[0];
      if (firstSource !== sourceImageUrl) {
        setSourceImageUrl(firstSource);
        setIsDimmed(false);

        if (!initialLocalNextSceneImageUrl) {
          setLocalNextSceneImageUrl(null);
        }
        if (onOptionsChangeRef.current && firstSource !== initialSourceImageUrl) {
          onOptionsChangeRef.current({ sourceImageUrl: firstSource });
        }
      }
    }
  }, [connectedImageSources, initialLocalNextSceneImageUrl, initialSourceImageUrl, sourceImageUrl]);

  // Update image resolution when result image loads
  useEffect(() => {
    if (localNextSceneImageUrl || nextSceneImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImageResolution({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        setImageResolution(null);
      };
      img.src = localNextSceneImageUrl || nextSceneImageUrl || '';
    } else {
      setImageResolution(null);
    }
  }, [localNextSceneImageUrl, nextSceneImageUrl]);

  // Dimming handled by shared hook

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


  const handleNextScene = async () => {
    console.log('[NextScenePluginModal] handleNextScene called', {
      isProcessing,
      externalIsProcessing,
      sourceImageUrl,
      prompt,
      aspectRatio,
      loraScale
    });

    if (isProcessing || externalIsProcessing) {
      console.log('[NextScenePluginModal] Already processing, skipping');
      return;
    }

    if (!sourceImageUrl) {
      alert('Please connect an image first');
      return;
    }

    // Prompt is optional
    /*
    if (mode === 'scene' && !prompt) {
      alert('Please enter a prompt');
      return;
    }
    */

    setIsProcessing(true);
    if (onOptionsChange) {
      onOptionsChange({ isProcessing: true } as any);
    }

    // 1. Create a new image modal placeholder immediately (Optimistic UI)
    const newModalId = `image-nextscene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const frameWidth = 600;
    const frameHeight = 600;
    const offsetX = 400 * scale + 50; // Place it to the right
    const targetX = x + (offsetX / scale); // Convert back to canvas coords
    const targetY = y;

    if (onPersistImageModalCreate) {
      onPersistImageModalCreate({
        id: newModalId,
        x: targetX,
        y: targetY,
        generatedImageUrl: null,
        frameWidth,
        frameHeight,
        model: 'NextScene',
        frame: 'Frame', // Media frame style
        aspectRatio: aspectRatio || '1:1',
        prompt: prompt,
        isGenerating: true, // Show loading spinner
      });
    }

    // 2. Connect the plugin to the new frame
    if (onPersistConnectorCreate && id) {
      onPersistConnectorCreate({
        from: id,
        to: newModalId,
        color: '#437eb5',
        fromX: x + (100 * scale) + 20, // Approx exit point
        fromY: y + (50 * scale),
        toX: targetX,
        toY: targetY + (frameHeight / 2),
        fromAnchor: 'send',
        toAnchor: 'receive',
      });
    }

    try {
      // Extract ID project from URL or assume context (simple way for now)
      const projectId = window.location.pathname.split('/project/')[1] || 'default-project';

      const payload = {
        image: sourceImageUrl,
        prompt: prompt,
        aspectRatio: aspectRatio,
        lora_scale: loraScale,
        mode: mode,
        images: connectedImageSources,
        true_guidance_scale: trueGuidanceScale,
        output_format: "webp",
        output_quality: 95,
        meta: {
          source: 'canvas',
          projectId: projectId,
          elementId: id
        }
      };

      const response = await fetch(`${API_BASE_URL}/api/canvas/next-scene`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Generation failed');
      }

      const data = await response.json();
      const resultUrl = data.data?.url;

      if (resultUrl) {
        // Update the optimistic frame with the result
        if (onUpdateImageModalState) {
          onUpdateImageModalState(newModalId, {
            generatedImageUrl: resultUrl,
            isGenerating: false,
          });
        }

        setLocalNextSceneImageUrl(resultUrl);
        if (onOptionsChange) {
          onOptionsChange({
            localNextSceneImageUrl: resultUrl,
            isProcessing: false
          } as any);
        }
        if (onUpdateModalState && id) {
          onUpdateModalState(id, { nextSceneImageUrl: resultUrl });
        }
      } else {
        throw new Error('No image URL in response');
      }

    } catch (error: any) {
      console.error('[NextScenePluginModal] Generation error:', error);
      alert(`Generation failed: ${error.message}`);

      // Update loading state on error
      if (onUpdateImageModalState) {
        onUpdateImageModalState(newModalId, {
          isGenerating: false,
        });
      }
    } finally {
      setIsProcessing(false);
      if (onOptionsChange) {
        onOptionsChange({ isProcessing: false } as any);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <PluginNodeShell
      modalKey="nextscene"
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
            position: 'relative',
            marginBottom: `${8 * scale}px`,
            fontSize: `${12 * scale}px`,
            fontWeight: 500,
            color: isDark ? '#ffffff' : '#1a1a1a',
            textAlign: 'center',
            userSelect: 'none',

            letterSpacing: '0.2px',
          }}
        >
          Next Scene

          {/* Delete button - always visible */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onDelete) {
                onDelete();
              }
            }}
            onMouseDown={(e) => {
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

            boxShadow: isDark
              ? (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.5)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.3)`)
              : (isHovered || isSelected ? `0 ${2 * scale}px ${8 * scale}px rgba(0, 0, 0, 0.2)` : `0 ${1 * scale}px ${3 * scale}px rgba(0, 0, 0, 0.1)`),
            transform: (isHovered || isSelected) ? `scale(1.03)` : 'scale(1)',
            overflow: 'visible',
            zIndex: 20,
          }}
        >
          {/* Use Vector icon for now or placeholder */}
          <img
            src="/icons/vector.svg"
            alt="NextScene"
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

        {/* Controls shown/hidden on click - overlap beneath circle */}
        {isPopupOpen && !isResultImage && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: `translateX(-50%) scale(${scale})`,
              transformOrigin: 'top center',
              marginTop: `${-popupOverlap}px`,
              zIndex: 15,
              width: '400px', // Fixed base width
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
              <NextSceneControls
                scale={1} // Base scale as parent handles scaling
                mode={mode}
                isProcessing={isProcessing}
                externalIsProcessing={externalIsProcessing}
                sourceImageUrl={sourceImageUrl}
                frameBorderColor={frameBorderColor}
                frameBorderWidth={frameBorderWidth}
                extraTopPadding={(popupOverlap / scale) + 12} // Convert to base pixels
                onModeChange={(newMode) => {
                  setMode(newMode);
                  if (onOptionsChange) {
                    onOptionsChange({ mode: newMode } as any);
                  }
                }}
                onNextScene={handleNextScene}
                onHoverChange={setIsHovered}
                prompt={prompt}
                aspectRatio={aspectRatio}
                loraScale={loraScale}
                onPromptChange={(val) => {
                  setPrompt(val);
                  if (onOptionsChange) onOptionsChange({ prompt: val } as any);
                }}
                onAspectRatioChange={(val) => {
                  setAspectRatio(val);
                  if (onOptionsChange) onOptionsChange({ aspectRatio: val } as any);
                }}
                onLoraScaleChange={(val) => {
                  setLoraScale(val);
                  if (onOptionsChange) onOptionsChange({ loraScale: val } as any);
                }}
                trueGuidanceScale={trueGuidanceScale}
                onTrueGuidanceScaleChange={(val) => {
                  setTrueGuidanceScale(val);
                  // if (onOptionsChange) onOptionsChange({ trueGuidanceScale: val } as any); // If we add it to interface later
                }}
              />
              <NextSceneImageFrame
                id={id}
                scale={1} // Base scale
                frameBorderColor={frameBorderColor}
                frameBorderWidth={frameBorderWidth}
                isResultImage={isResultImage}
                isDraggingContainer={isDraggingContainer}
                isHovered={isHovered}
                isSelected={isSelected || false}
                nextSceneImageUrl={localNextSceneImageUrl || nextSceneImageUrl || null}
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
