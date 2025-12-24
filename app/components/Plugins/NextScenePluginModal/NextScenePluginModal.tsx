'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import '../../common/canvasCaptureGuard';
import { NextSceneLabel } from './NextSceneLabel';
// import { ModalActionIcons } from '../../common/ModalActionIcons'; // Not used in Vectorize either
import { NextSceneControls } from './NextSceneControls';
import { NextSceneImageFrame } from './NextSceneImageFrame';
import { useCanvasModalDrag } from '../PluginComponents/useCanvasModalDrag';
import { useCanvasFrameDim, useConnectedSourceImages, useLatestRef, usePersistedPopupState } from '../PluginComponents';
import { PluginNodeShell } from '../PluginComponents';
import { PluginConnectionNodes } from '../PluginComponents';
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
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('2K'); // Multi-angle resolution
  const [multiangleModel, setMultiangleModel] = useState<string>('Google nano banana pro'); // Multi-angle model

  const onOptionsChangeRef = useLatestRef(onOptionsChange);

  // Multi-angle shot prompts
  const MULTIANGLE_SHOT_PROMPTS = [
    { shot: 1, type: 'Establishing Shot', prompt: 'Wide angle, full body shot, showing the character in the environment, cinematic scale.' },
    { shot: 2, type: 'Medium Shot', prompt: 'Waist-up framing, natural pose, eye-level camera, balanced composition.' },
    { shot: 3, type: 'Close-up', prompt: 'Head and shoulders portrait, shallow depth of field, sharp focus on facial details.' },
    { shot: 4, type: '180° Shift', prompt: 'View from behind the subject, looking away from camera, showing back of clothing and hair.' },
    { shot: 5, type: 'Low Angle', prompt: 'Worm\'s-eye view looking up at the subject, making them appear heroic and powerful.' },
    { shot: 6, type: 'High Angle', prompt: 'Bird\'s-eye view looking down from above, showing the subject and the floor/ground.' },
    { shot: 7, type: '3/4 Profile', prompt: 'Subject turned at a 45-degree angle, highlighting facial contours and side profile.' },
    { shot: 8, type: 'OTS Shot', prompt: 'Exact same character, standing in profile view from the side, clear silhouette, cinematic lighting, maintaining all clothing and facial details.' },
    { shot: 9, type: 'Extreme Close-up', prompt: 'Extreme close-up of the subject\'s face, focusing on the eyes and skin texture, maintaining identical features and lighting from the original image, bokeh background.' },
  ];

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  // #region agent log - Removed
  // #endregion
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
    // Handle connection changes: update or clear source image
    if (connectedImageSources.length > 0) {
      // Connection exists: update source image if different
      const firstSource = connectedImageSources[0];
      if (firstSource !== sourceImageUrl) {
        setSourceImageUrl(firstSource);
        setIsDimmed(false);

        if (!initialLocalNextSceneImageUrl) {
          setLocalNextSceneImageUrl(null);
        }
        // Persist the source image URL
        if (onOptionsChangeRef.current) {
          onOptionsChangeRef.current({ sourceImageUrl: firstSource });
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
      loraScale,
      mode,
      resolution
    });

    if (isProcessing || externalIsProcessing) {
      console.log('[NextScenePluginModal] Already processing, skipping');
      return;
    }

    if (!sourceImageUrl) {
      alert('Please connect an image first');
      return;
    }

    setIsProcessing(true);
    if (onOptionsChange) {
      onOptionsChange({ isProcessing: true } as any);
    }

    // Handle multi-angle mode - generate 9 different shots
    if (mode === 'multiangle') {
      try {
        const projectId = window.location.pathname.split('/project/')[1] || 'default-project';
        const { generateImageForCanvas } = await import('@/lib/api');

        // Calculate frame dimensions based on aspect ratio
        const [w, h] = aspectRatio.split(':').map(Number);
        const ar = w && h ? (w / h) : 1;
        const baseSize = 600;
        const frameWidth = Math.round(baseSize);
        const frameHeight = Math.round(baseSize / ar);

        // Create 9 image modals in a 3x3 grid
        const modalIds: string[] = [];
        const gridCols = 3;
        const gridGap = 650; // Gap between modals
        const startX = x + (400 * scale + 50) / scale; // Start to the right of plugin
        const startY = y - (gridGap * 1.5) / scale; // Center vertically

        // Create all 9 modals first (optimistic UI)
        for (let i = 0; i < 9; i++) {
          const col = i % gridCols;
          const row = Math.floor(i / gridCols);
          const modalId = `image-multiangle-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
          modalIds.push(modalId);

          const targetX = startX + (col * gridGap) / scale;
          const targetY = startY + (row * gridGap) / scale;

          if (onPersistImageModalCreate) {
            onPersistImageModalCreate({
              id: modalId,
              x: targetX,
              y: targetY,
              generatedImageUrl: null,
              frameWidth,
              frameHeight,
              model: multiangleModel === 'Google nano banana pro'
                ? `Google nano banana pro ${resolution}`
                : multiangleModel === 'Seedream 4.5'
                  ? `Seedream 4.5 ${resolution}`
                  : multiangleModel, // Use selected model (with resolution appended for Seedream 4.5)
              frame: 'Frame',
              aspectRatio: aspectRatio || '1:1',
              prompt: MULTIANGLE_SHOT_PROMPTS[i].prompt,
              isGenerating: true,
            });
          }

          // Connect plugin to each modal
          if (onPersistConnectorCreate && id) {
            onPersistConnectorCreate({
              from: id,
              to: modalId,
              color: '#437eb5',
              fromX: x + (100 * scale) + 20,
              fromY: y + (50 * scale),
              toX: targetX,
              toY: targetY + (frameHeight / 2),
              fromAnchor: 'send',
              toAnchor: 'receive',
            });
          }
        }

        // Generate all 9 images in parallel
        console.log('[NextScenePluginModal] Generating 9 multi-angle shots in parallel...');

        // Build model string based on selected model
        let modelString = multiangleModel;
        if (multiangleModel === 'Google nano banana pro') {
          modelString = `Google nano banana pro ${resolution}`;
        } else if (multiangleModel === 'Seedream 4.5') {
          modelString = `Seedream 4.5 ${resolution}`;
        }

        const generationPromises = MULTIANGLE_SHOT_PROMPTS.map(async (shot, index) => {
          const shotPrompt = shot.prompt;
          const modalId = modalIds[index];

          try {
            const result = await generateImageForCanvas(
              shotPrompt,
              modelString, // Use selected model (with resolution for nano banana pro)
              aspectRatio,
              projectId,
              undefined, // width
              undefined, // height
              1, // imageCount
              sourceImageUrl, // sourceImageUrl for image-to-image
              undefined, // sceneNumber
              undefined, // previousSceneImageUrl
              undefined // storyboardMetadata
            );

            // Update the modal with the result
            if (onUpdateImageModalState) {
              onUpdateImageModalState(modalId, {
                generatedImageUrl: result.url,
                isGenerating: false,
              });
            }

            return { index, success: true, url: result.url };
          } catch (error: any) {
            console.error(`[NextScenePluginModal] Failed to generate shot ${shot.shot}:`, error);
            // Update modal to show error
            if (onUpdateImageModalState) {
              onUpdateImageModalState(modalId, {
                isGenerating: false,
              });
            }
            return { index, success: false, error: error.message };
          }
        });

        const results = await Promise.all(generationPromises);
        const successCount = results.filter(r => r.success).length;
        console.log(`[NextScenePluginModal] Multi-angle generation completed: ${successCount}/9 successful`);

        if (successCount === 0) {
          alert('All multi-angle generations failed. Please try again.');
        } else if (successCount < 9) {
          alert(`${successCount}/9 images generated successfully. Some generations failed.`);
        }

      } catch (error: any) {
        console.error('[NextScenePluginModal] Multi-angle generation error:', error);
        alert(`Multi-angle generation failed: ${error.message}`);
      } finally {
        setIsProcessing(false);
        if (onOptionsChange) {
          onOptionsChange({ isProcessing: false } as any);
        }
      }
      return; // Exit early for multi-angle mode
    }

    // Original single scene/nextscene logic below
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
          {/* Next Scene icon */}
          <img
            src="/icons/film-editing.svg"
            alt="Next Scene"
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

          <PluginConnectionNodes
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
                resolution={resolution}
                onResolutionChange={(val) => {
                  setResolution(val);
                }}
                model={multiangleModel}
                onModelChange={(val) => {
                  setMultiangleModel(val);
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
