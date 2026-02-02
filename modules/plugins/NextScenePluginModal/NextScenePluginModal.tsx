'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import '@/modules/ui-global/common/canvasCaptureGuard';
import { NextSceneLabel } from './NextSceneLabel';
// import { ModalActionIcons } from '../../common/ModalActionIcons'; // Not used in Vectorize either
import { NextSceneControls } from './NextSceneControls';
import { NextSceneImageFrame } from './NextSceneImageFrame';
import { useCanvasModalDrag } from '../PluginComponents/useCanvasModalDrag';
import { useCanvasFrameDim, useConnectedSourceImages, useLatestRef, usePersistedPopupState } from '../PluginComponents';
import { PluginNodeShell } from '../PluginComponents';
import { PluginConnectionNodes } from '../PluginComponents';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';
import { API_BASE_URL } from '@/core/api/api';

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
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean; isProcessing?: boolean }) => void | Promise<void>;
  onUpdateImageModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean; isProcessing?: boolean }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
  onContextMenu?: (e: React.MouseEvent) => void;
  isAttachedToChat?: boolean;
  selectionOrder?: number;
}

export const NextScenePluginModal = React.memo<NextScenePluginModalProps>(({
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
  onContextMenu,
  isAttachedToChat,
  selectionOrder,
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
  const [multiangleModel, setMultiangleModel] = useState<string>('google/nano-banana-pro');
  const [trueGuidanceScale, setTrueGuidanceScale] = useState<number>(0);

  const onOptionsChangeRef = useLatestRef(onOptionsChange);

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


  const [multiangleCategory, setMultiangleCategory] = useState<string>('human');

  // Multi-angle prompt templates (matching MultiangleCameraPlugin)
  const HUMAN_BASE = `Maintain perfect consistency with the person in the input image — same face identity, hairstyle, clothing, skin tone, accessories, and body proportions. Do NOT modify or beautify the person. The only change should be camera angle. High-resolution photorealistic output.`;
  const HUMAN_ANGLES = [
    'Generate a straight front-facing portrait of the person, eye-level camera, full clarity of facial features.',
    'Show the person from a 45° front-left angle, revealing face + left side slightly rotated.',
    'Generate the person from a 45° front-right perspective, natural rotation with visibility of front and right side.',
    'Produce a clean left-side profile (pure side angle), only left silhouette and features visible.',
    'Generate a pure right-side profile view, showing full right body/face outline.',
    'Show the person from 45° back-left angle, back visible with slight left side exposure.',
    'Generate a 45° back-right perspective, showing back and partial right view.',
    'Produce a direct back-facing view of the person, full back detail visible.',
    'Generate a slightly top-down camera angle of the person, head/upper body visible, perspective from above.'
  ];
  const PRODUCT_BASE = `Maintain perfect consistency with the product in the input image — same shape, geometry, material, texture, branding, labels, colors, proportions, and design. Do NOT redesign or add new elements. Only the camera angle should change. High-quality product photography style.`;
  const PRODUCT_ANGLES = [
    'Generate a front-facing view of the product, centered, eye-level camera.',
    'Show the product from a 45° front-left angle, revealing front and left surfaces.',
    'Generate the product from a 45° front-right angle, showing both front and right sides naturally.',
    'Produce a pure left-side view of the product with no front surface visible.',
    'Generate a pure right-side profile of the product with only right surface visible.',
    'Generate a 45° back-left angle view, rear surface visible along with a bit of left side.',
    'Show a 45° back-right perspective, displaying back area and partial right surface.',
    'Produce a direct rear-facing view, full backside of the product visible.',
    'Generate a top-down camera angle, product visible from above with dimensional depth.'
  ];

  const handleNextScene = async () => {
    console.log('[NextScenePluginModal] handleNextScene called', {
      isProcessing,
      externalIsProcessing,
      sourceImageUrl,
      prompt,
      aspectRatio,
      loraScale,
      mode,
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

    // --- MULTI-SCENE LOGIC (9 Angles) ---
    if (mode === 'nextscene') {
      try {
        const projectId = window.location.pathname.split('/project/')[1] || 'default-project';

        // Determine prompts based on category
        const isHuman = multiangleCategory === 'human';
        const basePrompt = isHuman ? HUMAN_BASE : PRODUCT_BASE;
        const angles = isHuman ? HUMAN_ANGLES : PRODUCT_ANGLES;

        const MULTIANGLE_SHOT_PROMPTS = angles.map((angleText, index) => ({
          shot: `Angle ${index + 1}`,
          // Cleaner prompt construction: Base + Angle + User Instruction
          prompt: `${basePrompt} ${angleText}${prompt ? ` Style: ${prompt}` : ''}`
        }));

        // Calculate frame dimensions
        const [w, h] = aspectRatio.split(':').map(Number);
        const ar = w && h ? (w / h) : 1;
        const baseSize = 600;
        const frameWidth = Math.round(baseSize);
        const frameHeight = Math.round(baseSize / ar);

        // Grid Layout
        const modalIds: string[] = [];
        const gridCols = 3;
        const gap = 12;
        const horizontalGap = frameWidth + gap;
        const verticalGap = frameHeight + gap;

        // Start to the right of plugin
        const startX = x + (150 * scale) / scale;
        // Center vertically relative to plugin center (y+50)
        const gridHeight = (3 * frameHeight + 2 * gap);
        const startY = y + 50 - (gridHeight / 2);

        // CREATE 9 MODALS (Optimistic)
        for (let i = 0; i < 9; i++) {
          const col = i % gridCols;
          const row = Math.floor(i / gridCols);
          const modalId = `image-nextscene-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
          modalIds.push(modalId);

          const targetX = startX + (col * horizontalGap) / scale;
          const targetY = startY + (row * verticalGap) / scale;

          if (onPersistImageModalCreate) {
            onPersistImageModalCreate({
              id: modalId,
              x: targetX,
              y: targetY,
              generatedImageUrl: null,
              frameWidth,
              frameHeight,
              model: 'NextScene Multi', // Identifier
              frame: 'Frame',
              aspectRatio: aspectRatio || '1:1',
              prompt: MULTIANGLE_SHOT_PROMPTS[i].prompt,
              isProcessing: true,
            });
          }

          // Connect plugin to each modal
          if (onPersistConnectorCreate && id) {
            onPersistConnectorCreate({
              from: id,
              to: modalId,
              color: SELECTION_COLOR,
              fromX: x + (100 * scale) + 20,
              fromY: y + (50 * scale),
              toX: targetX,
              toY: targetY + (frameHeight / 2),
              fromAnchor: 'send',
              toAnchor: 'receive',
            });
          }
        }

        // GENERATE 9 IMAGES PARALLEL
        console.log('[NextScenePluginModal] Generating 9 multi-scene shots in parallel...');

        const generationPromises = MULTIANGLE_SHOT_PROMPTS.map(async (shot, index) => {
          const shotPrompt = shot.prompt;
          const modalId = modalIds[index];

          try {
            // Re-using next-scene API structure but per image
            // Note: We use the fetch directly here to match the single-scene structure or use the helper
            // The single scene uses: /api/canvas/next-scene
            // We should use the same endpoint but per image, or use generateImageForCanvas if compatible.
            // Given the plan said "Use standard 9-angle prompts... via generateImageForCanvas(parallel requests)", I will try generateImageForCanvas.
            // However, NextScene usually hits a specific endpoint. Let's stick to the consistent NextScene payload structure for best results, OR use the helper if it wraps correctly.
            // The single scene logic uses manual fetch to /api/canvas/next-scene. I will duplicate that for now to be safe and consistent with NextScene requirements (e.g. meta tags).

            const payload = {
              image: sourceImageUrl,
              prompt: shotPrompt, // Specific prompt for this angle
              aspectRatio: aspectRatio,
              lora_scale: loraScale,
              model: multiangleModel,
              mode: mode, // 'nextscene'
              images: connectedImageSources,
              true_guidance_scale: trueGuidanceScale,
              guidance_scale: trueGuidanceScale,
              output_format: "webp",
              output_quality: 95,
              meta: {
                source: 'canvas',
                projectId: projectId,
                elementId: id,
                modalId: modalId, // Pass the specific modal ID 
                subTask: `angle-${index}`
              }
            };

            const response = await fetch(`${API_BASE_URL}/api/canvas/next-scene`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });

            if (!response.ok) {
              const err = await response.json();
              throw new Error(err.message || 'Generation failed');
            }
            const data = await response.json();
            const resultUrl = data.data?.url;

            if (resultUrl) {
              if (onUpdateImageModalState) {
                onUpdateImageModalState(modalId, {
                  generatedImageUrl: resultUrl,
                  isProcessing: false,
                });
              }
              return { index, success: true, url: resultUrl };
            } else {
              throw new Error('No URL returned');
            }

          } catch (error: any) {
            console.error(`[NextScene] Failed to generate shot ${index}:`, error);
            if (onUpdateImageModalState) {
              onUpdateImageModalState(modalId, { isProcessing: false });
            }
            return { index, success: false, error: error.message };
          }
        });

        const results = await Promise.all(generationPromises);
        const successCount = results.filter(r => r.success).length;

        if (successCount === 0) alert('All multi-scene generations failed.');
        else if (successCount < 9) alert(`${successCount}/9 images generated successfully.`);

      } catch (error: any) {
        console.error('[NextScenePluginModal] Multi-scene error:', error);
        alert(`Generation failed: ${error.message}`);
      } finally {
        setIsProcessing(false);
        if (onOptionsChange) onOptionsChange({ isProcessing: false } as any);
      }
      return;
    }

    // --- SINGLE SCENE LOGIC (Existing) ---
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
        isProcessing: true, // Show loading spinner
      });
    }

    // 2. Connect the plugin to the new frame
    if (onPersistConnectorCreate && id) {
      onPersistConnectorCreate({
        from: id,
        to: newModalId,
        color: SELECTION_COLOR,
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
        model: multiangleModel,
        mode: mode,
        images: connectedImageSources,
        true_guidance_scale: trueGuidanceScale,
        guidance_scale: trueGuidanceScale,
        output_format: "webp",
        output_quality: 95,
        meta: {
          source: 'canvas',
          projectId: projectId,
          elementId: id,
          modalId: newModalId // Pass the specific modal ID
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
            isProcessing: false,
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
          isProcessing: false,
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
                }}
                multiangleCategory={multiangleCategory}
                onMultiangleCategoryChange={(val) => {
                  setMultiangleCategory(val);
                }}
                multiangleModel={multiangleModel}
                onMultiangleModelChange={(val) => {
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
});

NextScenePluginModal.displayName = 'NextScenePluginModal';
