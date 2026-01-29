'use client';

import { useState, useRef, useEffect } from 'react';
import '@/modules/ui-global/common/canvasCaptureGuard';
import { ModalActionIcons } from '@/modules/ui-global/common/ModalActionIcons';
import { MultiangleCameraControls } from './MultiangleCameraControls';
import { MultiangleCameraImageFrame } from './MultiangleCameraImageFrame';
import { CategorySwitch } from './CategorySwitch';
import { Camera3DControl } from './Camera3DControl';
import { useCanvasModalDrag } from '../PluginComponents/useCanvasModalDrag';
import { useCanvasFrameDim, useConnectedSourceImage, useLatestRef, usePersistedPopupState } from '../PluginComponents';
import { PluginNodeShell } from '../PluginComponents';
import { PluginConnectionNodes } from '../PluginComponents';
import { useIsDarkTheme } from '@/core/hooks/useIsDarkTheme';
import { SELECTION_COLOR } from '@/core/canvas/canvasHelpers';

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
  onOptionsChange?: (opts: { category?: string; sourceImageUrl?: string | null; prompt?: string; loraScale?: number; aspectRatio?: string; moveForward?: number; verticalTilt?: number; rotateDegrees?: number; useWideAngle?: boolean; horizontalAngle?: number; verticalAngle?: number; zoom?: number; isGenerating?: boolean }) => void;
  onPersistMultiangleCameraModalCreate?: (modal: { id: string; x: number; y: number; sourceImageUrl?: string | null }) => void | Promise<void>;
  onUpdateModalState?: (modalId: string, updates: { category?: string; sourceImageUrl?: string | null; isExpanded?: boolean; prompt?: string; loraScale?: number; aspectRatio?: string; moveForward?: number; verticalTilt?: number; rotateDegrees?: number; useWideAngle?: boolean; horizontalAngle?: number; verticalAngle?: number; zoom?: number; isGenerating?: boolean }) => void;
  onMultiangleCamera?: (sourceImageUrl?: string, prompt?: string, loraScale?: number, aspectRatio?: string, moveForward?: number, verticalTilt?: number, rotateDegrees?: number, useWideAngle?: boolean) => Promise<string | null>;
  onQwenMultipleAngles?: (imageUrls: string[], horizontalAngle?: number, verticalAngle?: number, zoom?: number, additionalPrompt?: string, loraScale?: number) => Promise<string | null>;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }) => void | Promise<void>;
  onUpdateImageModalState?: (modalId: string, updates: { generatedImageUrl?: string | null; model?: string; frame?: string; aspectRatio?: string; prompt?: string; frameWidth?: number; frameHeight?: number; isGenerating?: boolean }) => void;
  connections?: Array<{ id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number }>;
  imageModalStates?: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }>;
  images?: Array<{ elementId?: string; url?: string; type?: string }>;
  onPersistConnectorCreate?: (connector: { id?: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }) => void | Promise<void>;
  onContextMenu?: (e: React.MouseEvent) => void;
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
  onQwenMultipleAngles,
  onPersistImageModalCreate,
  onUpdateImageModalState,
  connections = [],
  imageModalStates = [],
  images = [],
  onPersistConnectorCreate,
  onContextMenu,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDimmed, setIsDimmed } = useCanvasFrameDim(id);
  const { isPopupOpen, setIsPopupOpen, togglePopup } = usePersistedPopupState({ isExpanded, id, onUpdateModalState, defaultOpen: false });
  const [category, setCategory] = useState<string>('view-morph'); // 'view-morph' or 'multiview'
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(initialSourceImageUrl ?? null);
  const [prompt, setPrompt] = useState<string>('');
  const [loraScale, setLoraScale] = useState<number>(1.25);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [moveForward, setMoveForward] = useState<number>(0);
  const [verticalTilt, setVerticalTilt] = useState<number>(0);
  const [rotateDegrees, setRotateDegrees] = useState<number>(0);
  const [useWideAngle, setUseWideAngle] = useState<boolean>(false);
  // View Morph specific parameters
  const [horizontalAngle, setHorizontalAngle] = useState<number>(0); // 0 to 360 degrees
  const [verticalAngle, setVerticalAngle] = useState<number>(0); // -30 to +90 degrees
  const [zoom, setZoom] = useState<number>(0); // 0 to 10 (zoom level)
  // Multiangle (multiview) specific parameters
  const [multiangleCategory, setMultiangleCategory] = useState<string>('human'); // 'human' or 'product'
  const [multiangleModel, setMultiangleModel] = useState<string>('Google nano banana pro');
  const [multiangleResolution, setMultiangleResolution] = useState<'1K' | '2K' | '4K'>('2K');
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

  // Block canvas interactions when popup is open
  useEffect(() => {
    if (!isPopupOpen) return;

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const popup = document.querySelector('[data-multiangle-popup]');
      if (popup && (popup === target || popup.contains(target))) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const popup = document.querySelector('[data-multiangle-popup]');
      if (popup && (popup === target || popup.contains(target))) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const popup = document.querySelector('[data-multiangle-popup]');
      if (!popup || !(popup === target || popup.contains(target))) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const popup = document.querySelector('[data-multiangle-popup]');
      if (!popup || !(popup === target || popup.contains(target))) {
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    window.addEventListener('wheel', handleWheel, { capture: true, passive: false });
    window.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });
    window.addEventListener('mousemove', handleMouseMove, { capture: true });
    window.addEventListener('mousedown', handleMouseDown, { capture: true });

    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
      window.removeEventListener('touchmove', handleTouchMove, { capture: true });
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('mousedown', handleMouseDown, { capture: true });
    };
  }, [isPopupOpen]);

  // Hide global UI (toolbar/header/project title/etc.) when this popup is open
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const evt = new CustomEvent('wildmind:ui-hidden', { detail: { hidden: !!isPopupOpen, source: 'multiangle' } });
    window.dispatchEvent(evt);

    // Safety: when unmounting while open, restore UI
    return () => {
      const restore = new CustomEvent('wildmind:ui-hidden', { detail: { hidden: false, source: 'multiangle' } });
      window.dispatchEvent(restore);
    };
  }, [isPopupOpen]);

  // Multi-angle prompt templates for human and product
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

  const handleGenerate = async () => {
    if (!sourceImageUrl) {
      console.error('[MultiangleCameraPluginModal] Missing sourceImageUrl');
      return;
    }

    setIsGenerating(true);
    if (onOptionsChange) {
      onOptionsChange({ isGenerating: true } as any);
    }
    if (onUpdateModalState && id) {
      onUpdateModalState(id, { isGenerating: true });
    }

    // Handle multiangle mode (multiview category) - generate 9 different shots
    if (category === 'multiview') {
      try {
        const projectId = window.location.pathname.split('/project/')[1] || 'default-project';
        const { generateImageForCanvas } = await import('@/core/api/api');

        // Determine prompts based on category
        const isHuman = multiangleCategory === 'human';
        const basePrompt = isHuman ? HUMAN_BASE : PRODUCT_BASE;
        const angles = isHuman ? HUMAN_ANGLES : PRODUCT_ANGLES;

        const MULTIANGLE_SHOT_PROMPTS = angles.map((angleText, index) => ({
          shot: `Angle ${index + 1}`,
          prompt: `${basePrompt}\n\n${angleText}\n\nReference image attached.`
        }));

        // Calculate frame dimensions based on aspect ratio
        const [w, h] = aspectRatio.split(':').map(Number);
        const ar = w && h ? (w / h) : 1;
        const baseSize = 600;
        const frameWidth = Math.round(baseSize);
        const frameHeight = Math.round(baseSize / ar);

        // Create 9 image modals in a 3x3 grid
        const modalIds: string[] = [];
        const gridCols = 3;
        const gap = 12; // Small equal gap (12px)
        const horizontalGap = frameWidth + gap;
        const verticalGap = frameHeight + gap;

        // Start to the right of the plugin node
        const startX = x + (150 * scale) / scale;

        // Center the 3x3 grid vertically relative to the center of the plugin node (y + 50)
        // Grid height is 3 frames + 2 gaps
        const gridHeight = (3 * frameHeight + 2 * gap);
        const startY = y + 50 - (gridHeight / 2);

        // Create all 9 modals first (optimistic UI)
        for (let i = 0; i < 9; i++) {
          const col = i % gridCols;
          const row = Math.floor(i / gridCols);
          const modalId = `image-multiangle-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
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
              model: multiangleModel === 'Google nano banana pro'
                ? `Google nano banana pro ${multiangleResolution}`
                : multiangleModel === 'Seedream 4.5'
                  ? `Seedream 4.5 ${multiangleResolution}`
                  : multiangleModel,
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

        // Generate all 9 images in parallel
        console.log('[MultiangleCameraPluginModal] Generating 9 multi-angle shots in parallel...');

        // Build model string based on selected model
        let modelString = multiangleModel;
        if (multiangleModel === 'Google nano banana pro') {
          modelString = `Google nano banana pro ${multiangleResolution}`;
        } else if (multiangleModel === 'Seedream 4.5') {
          modelString = `Seedream 4.5 ${multiangleResolution}`;
        }

        const generationPromises = MULTIANGLE_SHOT_PROMPTS.map(async (shot, index) => {
          const shotPrompt = shot.prompt;
          const modalId = modalIds[index];

          try {
            const result = await generateImageForCanvas(
              shotPrompt,
              modelString,
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
            console.error(`[MultiangleCameraPluginModal] Failed to generate shot ${shot.shot}:`, error);
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
        console.log(`[MultiangleCameraPluginModal] Multi-angle generation completed: ${successCount}/9 successful`);

        if (successCount === 0) {
          alert('All multi-angle generations failed. Please try again.');
        } else if (successCount < 9) {
          alert(`${successCount}/9 images generated successfully. Some generations failed.`);
        }

      } catch (error: any) {
        console.error('[MultiangleCameraPluginModal] Multi-angle generation error:', error);
        alert(`Multi-angle generation failed: ${error.message}`);
      } finally {
        setIsGenerating(false);
        if (onOptionsChange) {
          onOptionsChange({ isGenerating: false } as any);
        }
        if (onUpdateModalState && id) {
          onUpdateModalState(id, { isGenerating: false });
        }
      }
      return; // Exit early for multiangle mode
    }

    // Original single generation logic for view-morph
    if (category === 'view-morph' && !onQwenMultipleAngles) {
      console.error('[MultiangleCameraPluginModal] Missing onQwenMultipleAngles for view-morph');
      return;
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
        model: category === 'view-morph' ? 'Qwen Multiple Angles' : 'Multiangle Camera',
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
          color: SELECTION_COLOR,
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
      let result: string | null = null;
      
      if (category === 'view-morph' && onQwenMultipleAngles) {
        // Use Qwen Multiple Angles API for View Morph
      const imageUrl = sourceImageUrl;
        if (!imageUrl) {
          throw new Error('Source image is required');
        }
        // Invert zoom value for API: UI zoom 0-10 where 0=far, 10=close
        // API expects: 0=close, 10=far (opposite interpretation)
        // So we invert: apiZoom = 10 - uiZoom
        const apiZoom = 10 - zoom;
        
        console.log('[MultiangleCameraPluginModal] Calling onQwenMultipleAngles with:', {
          imageUrls: [imageUrl],
          horizontalAngle,
          verticalAngle,
          uiZoom: zoom,
          apiZoom,
          additionalPrompt: prompt,
        loraScale,
        });
        result = await onQwenMultipleAngles(
          [imageUrl],
          horizontalAngle,
          verticalAngle,
          apiZoom, // Use inverted zoom for API
        prompt || undefined,
          loraScale
        );
      } else {
        throw new Error(`Invalid category or missing handler: ${category}`);
      }
      console.log('[MultiangleCameraPluginModal] onQwenMultipleAngles returned:', result);

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
          model: 'Qwen Multiple Angles',
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
          model: category === 'view-morph' ? 'Qwen Multiple Angles' : 'Multiangle Camera',
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
      onContextMenu={onContextMenu}
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
            border: `${1.5 * scale}px solid ${isSelected ? SELECTION_COLOR : (isDark ? '#3a3a3a' : '#a0a0a0')}`,
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

      </div>

      {/* Full-screen popup overlay - like expand plugin */}
        {isPopupOpen && (
        <div
          data-multiangle-popup
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
            // Ensure it sits above every global UI layer (Settings=20001, some modals go to 50000).
            zIndex: 50000,
            backdropFilter: 'blur(4px)',
            pointerEvents: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsPopupOpen(false);
            }
          }}
          onWheel={(e) => {
            const target = e.target as HTMLElement;
            const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-multiangle-canvas-container]');
            if (!isCanvas) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onTouchMove={(e) => {
            const target = e.target as HTMLElement;
            const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-multiangle-canvas-container]');
            if (!isCanvas) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onMouseDown={(e) => {
            const target = e.target as HTMLElement;
            const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-multiangle-canvas-container]');
            if (!isCanvas) {
              e.stopPropagation();
            }
          }}
          onMouseMove={(e) => {
            const target = e.target as HTMLElement;
            const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-multiangle-canvas-container]');
            if (!isCanvas) {
              e.stopPropagation();
            }
          }}
        >
          <div
            style={{
              backgroundColor: isDark ? '#121212' : '#ffffff',
              borderRadius: '16px',
              padding: 0,
              width: '95vw',
              maxWidth: '1400px',
              height: '90vh',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              boxShadow: isDark ? '0 20px 60px rgba(0, 0, 0, 0.8)' : '0 20px 60px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              pointerEvents: 'auto',
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
            }}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              const target = e.target as HTMLElement;
              const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-multiangle-canvas-container]');
              if (!isCanvas) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onTouchMove={(e) => {
              const target = e.target as HTMLElement;
              const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-multiangle-canvas-container]');
              if (!isCanvas) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            onMouseDown={(e) => {
              const target = e.target as HTMLElement;
              const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-multiangle-canvas-container]');
              if (!isCanvas) {
                e.stopPropagation();
              }
            }}
            onMouseMove={(e) => {
              const target = e.target as HTMLElement;
              const isCanvas = target.tagName === 'CANVAS' || target.closest('canvas') || target.closest('[data-multiangle-canvas-container]');
              if (!isCanvas) {
                e.stopPropagation();
              }
            }}
          >
            {/* Top Header with Category Switch and Close - Compact for View Morph */}
            <div
              style={{
                padding: category === 'view-morph' ? '12px 20px' : '20px 24px',
                borderBottom: category === 'view-morph' ? 'none' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                backgroundColor: category === 'view-morph' ? 'transparent' : (isDark ? '#1a1a1a' : '#f8f9fa'),
              }}
            >
              {/* Left spacer */}
              <div style={{ width: '120px' }} />
              
              {/* Center - Category Switch */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <CategorySwitch
                  selectedCategory={category}
                  scale={1}
                  onCategoryChange={(newCategory) => {
                    setCategory(newCategory);
                    if (onOptionsChange) {
                      onOptionsChange({ category: newCategory } as any);
                    }
                  }}
                />
              </div>

              {/* Right - Close Button */}
              <div style={{ width: '120px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsPopupOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    color: isDark ? '#ffffff' : '#6b7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s ease, color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>

            {/* Prompt Input - Compact and Minimal for View Morph */}
            {category === 'view-morph' && (
              <div
                style={{
                  padding: '12px 20px',
                  flexShrink: 0,
                  backgroundColor: 'transparent',
                }}
              >
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    if (onOptionsChange) {
                      onOptionsChange({ prompt: e.target.value } as any);
                    }
                  }}
                  placeholder="Enter prompt (optional)"
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    margin: '0 auto',
                    display: 'block',
                    padding: '8px 12px',
                    fontSize: '13px',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    borderRadius: '6px',
                    color: isDark ? '#ffffff' : '#1a1a1a',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, background-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = SELECTION_COLOR;
                    e.target.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                    e.target.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
                  }}
                />
              </div>
            )}

            {/* Main Content Area */}
            {category === 'view-morph' ? (
              /* View Morph: Full-width 3D Camera Control - Maximized */
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  backgroundColor: isDark ? '#0a0a0a' : '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '0',
                }}
              >
                  <Camera3DControl
                    horizontalAngle={horizontalAngle}
                    verticalAngle={verticalAngle}
                    zoom={zoom}
                    onHorizontalAngleChange={setHorizontalAngle}
                    onVerticalAngleChange={setVerticalAngle}
                    onZoomChange={setZoom}
                    scale={1}
                    sourceImageUrl={sourceImageUrl}
                    showButtons={false}
                  />
              </div>
            ) : (
              /* MultiView: Left Sidebar + Image Preview */
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'row',
                  overflow: 'hidden',
                  minHeight: 0,
                }}
              >
                {/* Left Sidebar - Controls */}
                <div
                  style={{
                    width: '400px',
                    minWidth: '350px',
                    maxWidth: '450px',
                    height: '100%',
                    backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
                    borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                  }}
                >
                  {/* Controls Content - Scrollable */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      overflowX: 'hidden',
                      padding: '24px',
                    paddingBottom: '96px', // leave room for sticky footer
              }}
            >
              <MultiangleCameraControls
                      scale={1}
                      category={category}
                sourceImageUrl={sourceImageUrl}
                frameBorderColor={frameBorderColor}
                frameBorderWidth={frameBorderWidth}
                      extraTopPadding={0}
                onHoverChange={setIsHovered}
                      onCategoryChange={(newCategory) => {
                        setCategory(newCategory);
                        if (onOptionsChange) {
                          onOptionsChange({ category: newCategory } as any);
                        }
                      }}
                prompt={prompt}
                loraScale={loraScale}
                aspectRatio={aspectRatio}
                moveForward={moveForward}
                verticalTilt={verticalTilt}
                rotateDegrees={rotateDegrees}
                useWideAngle={useWideAngle}
                      horizontalAngle={horizontalAngle}
                      verticalAngle={verticalAngle}
                      zoom={zoom}
                isGenerating={isGenerating}
                      multiangleCategory={multiangleCategory}
                      multiangleModel={multiangleModel}
                      multiangleResolution={multiangleResolution}
                onPromptChange={setPrompt}
                onLoraScaleChange={setLoraScale}
                onAspectRatioChange={setAspectRatio}
                onMoveForwardChange={setMoveForward}
                onVerticalTiltChange={setVerticalTilt}
                onRotateDegreesChange={setRotateDegrees}
                onUseWideAngleChange={setUseWideAngle}
                      onHorizontalAngleChange={setHorizontalAngle}
                      onVerticalAngleChange={setVerticalAngle}
                      onZoomChange={setZoom}
                      onMultiangleCategoryChange={setMultiangleCategory}
                      onMultiangleModelChange={setMultiangleModel}
                      onMultiangleResolutionChange={setMultiangleResolution}
                onGenerate={handleGenerate}
                embeddedInPopup={true}
                hideGenerateButton={true}
              />
                  </div>

                {/* Sticky footer (MultiView) */}
                <div
                  style={{
                    position: 'sticky',
                    bottom: 0,
                    padding: '16px 24px',
                    borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e5e7eb',
                    background: isDark ? 'rgba(26, 26, 26, 0.92)' : 'rgba(248, 249, 250, 0.92)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={!sourceImageUrl || isGenerating}
                    style={{
                      width: '100%',
                      padding: `12px 16px`,
                      fontSize: `13px`,
                      fontWeight: 700,
                      backgroundColor: (!sourceImageUrl || isGenerating) ? (isDark ? '#4a4a4a' : '#9ca3af') : SELECTION_COLOR,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: `10px`,
                      cursor: (!sourceImageUrl || isGenerating) ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.2s ease, transform 0.08s ease',
                      opacity: (!sourceImageUrl || isGenerating) ? 0.65 : 1,
                    }}
                    onMouseDown={(e) => {
                      if (!(!sourceImageUrl || isGenerating)) {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.99)';
                      }
                    }}
                    onMouseUp={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    }}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Multiangle'}
                  </button>
                </div>
                </div>

                {/* Right Side - Image Preview */}
                <div
                  style={{
                    flex: 1,
                    position: 'relative',
                    minWidth: 0,
                    height: '100%',
                    backgroundColor: isDark ? '#0a0a0a' : '#f9fafb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    padding: '24px',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      borderRadius: '12px',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e5e7eb',
                      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
                      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    }}
                  >
              <MultiangleCameraImageFrame
                id={id}
                      scale={1}
                      frameBorderColor="transparent"
                      frameBorderWidth={0}
                isDraggingContainer={isDraggingContainer}
                isHovered={isHovered}
                isSelected={isSelected || false}
                sourceImageUrl={sourceImageUrl}
                onMouseDown={handleMouseDown}
                onSelect={onSelect}
                fillContainer={true}
              />
                  </div>
            </div>
          </div>
        )}

        {/* Bottom Action Buttons - Only for View Morph */}
        {category === 'view-morph' && (
          <div
            style={{
              padding: '16px 20px',
              flexShrink: 0,
              backgroundColor: 'transparent',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', maxWidth: '500px', width: '100%' }}>
              {/* Reset Button */}
              <button
                onClick={() => {
                  setHorizontalAngle(0);
                  setVerticalAngle(0);
                  setZoom(0);
                  if (onOptionsChange) {
                    onOptionsChange({ horizontalAngle: 0, verticalAngle: 0, zoom: 0 } as any);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: isDark ? '#e5e5e5' : '#4b5563',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M3 21v-5h5"></path>
                </svg>
                <span>Reset</span>
              </button>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: SELECTION_COLOR,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  opacity: isGenerating ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isGenerating) {
                    e.currentTarget.style.backgroundColor = '#3d6edb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isGenerating) {
                    e.currentTarget.style.backgroundColor = SELECTION_COLOR;
                  }
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5"></path>
                  <path d="M2 12l10 5 10-5"></path>
                </svg>
                <span>Generate</span>
              </button>
            </div>
          </div>
        )}
      </div>
        </div>
      )}
    </PluginNodeShell>
  );
};
