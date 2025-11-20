'use client';

import { useState, useRef, useEffect } from 'react';
import '../common/canvasCaptureGuard';
import FrameSpinner from '../common/FrameSpinner';
import {
  getModelDurations,
  getModelDefaultDuration,
  getModelAspectRatios,
  getModelDefaultAspectRatio,
  getModelResolutions,
  getModelDefaultResolution,
  isValidDurationForModel,
  isValidAspectRatioForModel,
  isValidResolutionForModel,
} from '@/lib/videoModelConfig';

interface VideoUploadModalProps {
  isOpen: boolean;
  id?: string;
  onClose: () => void;
  onGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, duration: number, resolution?: string) => void;
  onVideoSelect?: (file: File) => void;
  generatedVideoUrl?: string | null;
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
  onAddToCanvas?: (url: string) => void;
  isSelected?: boolean;
  initialModel?: string;
  initialFrame?: string;
  initialAspectRatio?: string;
  initialPrompt?: string;
  initialDuration?: number;
  initialResolution?: string;
  onOptionsChange?: (opts: { model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number; resolution?: string; frameWidth?: number; frameHeight?: number }) => void;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  isOpen,
  id,
  onClose,
  onGenerate,
  generatedVideoUrl,
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
  onAddToCanvas,
  isSelected,
  initialModel,
  initialFrame,
  initialAspectRatio,
  initialPrompt,
  initialDuration,
  initialResolution,
  onOptionsChange,
  onVideoSelect,
}) => {
  const [isDraggingContainer, setIsDraggingContainer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [globalDragActive, setGlobalDragActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wasJustPlayed, setWasJustPlayed] = useState(false);
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [selectedModel, setSelectedModel] = useState(initialModel ?? 'Seedance 1.0 Pro');
  const [selectedFrame, setSelectedFrame] = useState(initialFrame ?? 'Frame');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(
    initialAspectRatio ?? getModelDefaultAspectRatio(initialModel ?? 'Seedance 1.0 Pro')
  );
  const [selectedDuration, setSelectedDuration] = useState<number>(
    initialDuration ?? getModelDefaultDuration(initialModel ?? 'Seedance 1.0 Pro')
  );
  const [selectedResolution, setSelectedResolution] = useState<string>(
    initialResolution ?? getModelDefaultResolution(initialModel ?? 'Seedance 1.0 Pro')
  );
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isAspectRatioDropdownOpen, setIsAspectRatioDropdownOpen] = useState(false);
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
  const [isResolutionDropdownOpen, setIsResolutionDropdownOpen] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null);
  const durationDropdownRef = useRef<HTMLDivElement>(null);
  const resolutionDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (wasJustPlayed) {
      const t = setTimeout(() => setWasJustPlayed(false), 400);
      return () => clearTimeout(t);
    }
  }, [wasJustPlayed]);

  // Calculate aspect ratio from string (e.g., "16:9" -> 16/9)
  const getAspectRatio = (ratio: string): string => {
    const [width, height] = ratio.split(':').map(Number);
    return `${width} / ${height}`;
  };

  // Convert canvas coordinates to screen coordinates
  const screenX = x * scale + position.x;
  const screenY = y * scale + position.y;
  const frameBorderColor = isSelected ? '#437eb5' : 'rgba(0, 0, 0, 0.3)';
  const frameBorderWidth = 2;
  const dropdownBorderColor = 'rgba(0,0,0,0.1)'; // Fixed border color for dropdowns
  const controlFontSize = `${13 * scale}px`;
  
  // Detect if this is an uploaded video (from library, local storage, or media)
  // Check if model is 'Library Video' or 'Uploaded Video', or if there's no prompt and video exists (and not generating)
  const isUploadedVideo = 
    initialModel === 'Library Video' || 
    initialModel === 'Uploaded Video' ||
    (!initialPrompt && !prompt && generatedVideoUrl && !isGenerating);

  const handleGenerate = async () => {
    if (onGenerate && prompt.trim() && !isGenerating) {
      setIsGenerating(true);
      try {
        await onGenerate(prompt, selectedModel, selectedFrame, selectedAspectRatio, selectedDuration, selectedResolution);
        // Polling handled by parent (ModalOverlays) after onGenerate resolves
      } catch (err) {
        console.error('Error generating video:', err);
        alert((err as any)?.message || 'Failed to generate video. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  // Sync initial props into internal state on hydration
  useEffect(() => { if (typeof initialPrompt === 'string' && initialPrompt !== prompt) setPrompt(initialPrompt); }, [initialPrompt]);
  // Listen for global node-drag active state so nodes remain visible while dragging
  useEffect(() => {
    const handleActive = (e: Event) => {
      const ce = e as CustomEvent;
      setGlobalDragActive(Boolean(ce.detail?.active));
    };
    window.addEventListener('canvas-node-active', handleActive as any);
    return () => window.removeEventListener('canvas-node-active', handleActive as any);
  }, []);
  useEffect(() => { if (initialModel && initialModel !== selectedModel) setSelectedModel(initialModel); }, [initialModel]);
  useEffect(() => { if (initialFrame && initialFrame !== selectedFrame) setSelectedFrame(initialFrame); }, [initialFrame]);
  useEffect(() => { if (initialAspectRatio && initialAspectRatio !== selectedAspectRatio) setSelectedAspectRatio(initialAspectRatio); }, [initialAspectRatio]);
  useEffect(() => { if (typeof initialDuration === 'number' && initialDuration !== selectedDuration) setSelectedDuration(initialDuration); }, [initialDuration]);
  useEffect(() => { if (initialResolution && initialResolution !== selectedResolution) setSelectedResolution(initialResolution); }, [initialResolution]);

  // Update duration, aspect ratio, and resolution when model changes
  useEffect(() => {
    const defaultDuration = getModelDefaultDuration(selectedModel);
    const defaultAspectRatio = getModelDefaultAspectRatio(selectedModel);
    const defaultResolution = getModelDefaultResolution(selectedModel);

    // Update duration if current is not valid for new model
    if (!isValidDurationForModel(selectedModel, selectedDuration)) {
      setSelectedDuration(defaultDuration);
    }

    // Update aspect ratio if current is not valid for new model
    if (!isValidAspectRatioForModel(selectedModel, selectedAspectRatio)) {
      setSelectedAspectRatio(defaultAspectRatio);
    }

    // Update resolution if current is not valid for new model
    if (!isValidResolutionForModel(selectedModel, selectedResolution)) {
      setSelectedResolution(defaultResolution);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel]); // Only run when model changes

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (aspectRatioDropdownRef.current && !aspectRatioDropdownRef.current.contains(event.target as Node)) {
        setIsAspectRatioDropdownOpen(false);
      }
      if (durationDropdownRef.current && !durationDropdownRef.current.contains(event.target as Node)) {
        setIsDurationDropdownOpen(false);
      }
      if (resolutionDropdownRef.current && !resolutionDropdownRef.current.contains(event.target as Node)) {
        setIsResolutionDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen || isAspectRatioDropdownOpen || isDurationDropdownOpen || isResolutionDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen, isAspectRatioDropdownOpen, isDurationDropdownOpen, isResolutionDropdownOpen]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isControls = target.closest('.controls-overlay');
    // Allow drag even when clicking video/image content so user can still reposition after generation.
    if (onSelect && !isInput && !isButton && !isControls) {
      onSelect();
    }
    if (!isInput && !isButton && !isControls) {
      setIsDraggingContainer(true);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Handle drag move
  useEffect(() => {
    if (!isDraggingContainer) return;
    let rafId: number | null = null;
    let pendingEvent: MouseEvent | null = null;
    const flush = () => {
      if (!pendingEvent) return;
      const e = pendingEvent;
      pendingEvent = null;
      if (!containerRef.current || !onPositionChange) return;
      const newScreenX = e.clientX - dragOffset.x;
      const newScreenY = e.clientY - dragOffset.y;
      const newCanvasX = (newScreenX - position.x) / scale;
      const newCanvasY = (newScreenY - position.y) / scale;
      onPositionChange(newCanvasX, newCanvasY);
      lastCanvasPosRef.current = { x: newCanvasX, y: newCanvasY };
      rafId = null;
    };
    const handleMouseMove = (e: MouseEvent) => {
      pendingEvent = e;
      if (rafId == null) {
        rafId = requestAnimationFrame(flush);
      }
    };
    const handleMouseUp = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = null;
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
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [isDraggingContainer, dragOffset, scale, position, onPositionChange, onPositionCommit]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      data-modal-component="video"
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
      }}
    >
      {/* Tooltip - Attached to Top, Full Width */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            top: `${-32 * scale}px`,
            left: 0,
            width: `${600 * scale}px`,
            maxWidth: '90vw',
            padding: `${6 * scale}px ${12 * scale}px`,
            backgroundColor: '#f0f2f5',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            color: '#1f2937',
            fontSize: `${12 * scale}px`,
            fontWeight: '600',
            borderRadius: `${16 * scale}px ${16 * scale}px 0 0`,
            border: 'none',
            borderBottom: 'none',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 3000,
            boxShadow: 'none',
            transform: 'translateY(0)',
            opacity: 1,
          }}
        >
          {isUploadedVideo ? 'Media' : 'Video Generator'}
        </div>
      )}

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
          {onDownload && generatedVideoUrl && (
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
      {/* Video Frame */}
      <div
        ref={imageAreaRef}
        data-frame-id={id ? `${id}-frame` : undefined}
        onClick={(e) => {
          // Ensure selection works when clicking on frame
          if (onSelect && !e.defaultPrevented) {
            onSelect();
          }
        }}
        style={{
          width: `${600 * scale}px`,
          maxWidth: '90vw',
          aspectRatio: getAspectRatio(selectedAspectRatio),
          minHeight: `${400 * scale}px`,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: (isHovered || isPinned) && !isUploadedVideo ? '0px' : `${16 * scale}px`,
          borderTop: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          borderBottom: (isHovered || isPinned) && !isUploadedVideo ? 'none' : `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          transition: 'border 0.18s ease',
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDraggingContainer ? 'grabbing' : 'grab',
          overflow: 'visible',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {generatedVideoUrl ? (
          <>
            <video
              ref={videoRef}
              src={generatedVideoUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: (isHovered || isPinned) && !isUploadedVideo ? '0px' : `${16 * scale}px`,
              }}
              onEnded={() => {
                setIsPlaying(false);
              }}
            />
            {/* Center Play/Pause Button with fade logic */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!videoRef.current) return;
                if (isPlaying) {
                  videoRef.current.pause();
                  setIsPlaying(false);
                } else {
                  videoRef.current.play().catch(() => {});
                  setIsPlaying(true);
                  setWasJustPlayed(true);
                }
              }}
              title={isPlaying ? 'Pause' : 'Play'}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: isPlaying ? '60px' : '72px',
                height: isPlaying ? '60px' : '72px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.55)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'opacity 0.35s ease, background-color 0.25s, transform 0.25s',
                zIndex: 5,
                opacity: !isPlaying || (isPlaying && !wasJustPlayed && isHovered) ? 1 : 0,
                pointerEvents: !isPlaying || (isPlaying && !wasJustPlayed && isHovered) ? 'auto' : 'none'
              }}
              onMouseEnter={(e) => {
                if (isPlaying) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.75)';
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.55)';
                e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
              }}
            >
              {isPlaying ? (
                <svg width={28 * scale} height={28 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width={32 * scale} height={32 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <svg
              width={64 * scale}
              height={64 * scale}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto 16px', opacity: 0.3 }}
            >
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
        )}
        {isGenerating && (
          <FrameSpinner scale={scale} label="Generating video…" />
        )}
        {/* Connection Nodes - always rendered but subtle until hovered or during drag
            NOTE: right-side is the start/send node, left-side is the receive node */}
        <>
          {/* Receive Node (Left) */}
          <div
            data-node-id={id}
            data-node-side="receive"
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
              transition: 'opacity 0.18s ease',
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
              if (!id) return;
              e.stopPropagation();
              e.preventDefault();
              const color = '#437eb5';

              const handlePointerUp = (pe: any) => {
                try { el.releasePointerCapture?.(pe?.pointerId ?? pid); } catch (err) {}
                window.removeEventListener('canvas-node-complete', handleComplete as any);
                window.removeEventListener('pointerup', handlePointerUp as any);
              };

              const handleComplete = () => {
                try { el.releasePointerCapture?.(pid); } catch (err) {}
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
              width: `${18 * scale}px`,
              height: `${18 * scale}px`,
              borderRadius: '50%',
              backgroundColor: '#437eb5',
              cursor: 'grab',
              border: `${2 * scale}px solid rgba(255,255,255,0.95)`,
              zIndex: 5000,
              opacity: (isHovered || isSelected || globalDragActive) ? 1 : 0,
              transition: 'opacity 0.18s ease, transform 0.12s ease',
              pointerEvents: 'auto',
            }}
          />
        </>
        {/* Pin Icon Button - Bottom Right (only for generated videos, not uploaded) */}
        {!isUploadedVideo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPinned(!isPinned);
            }}
            style={{
              position: 'absolute',
              bottom: `${8 * scale}px`,
              right: `${8 * scale}px`,
              width: `${28 * scale}px`,
              height: `${28 * scale}px`,
              borderRadius: `${6 * scale}px`,
              backgroundColor: isPinned ? 'rgba(67, 126, 181, 0.2)' : 'rgba(255, 255, 255, 0.9)',
              border: `1px solid ${isPinned ? '#437eb5' : 'rgba(0, 0, 0, 0.1)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 20,
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.18s ease, background-color 0.2s ease, border-color 0.2s ease',
              pointerEvents: 'auto',
              boxShadow: isPinned ? `0 ${2 * scale}px ${8 * scale}px rgba(67, 126, 181, 0.3)` : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isPinned) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isPinned) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              }
            }}
            title={isPinned ? 'Unpin controls' : 'Pin controls'}
          >
            <svg
              width={16 * scale}
              height={16 * scale}
              viewBox="0 0 24 24"
              fill={isPinned ? '#437eb5' : 'none'}
              stroke={isPinned ? '#437eb5' : '#4b5563'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 17v5M9 10V7a3 3 0 0 1 6 0v3M5 10h14l-1 7H6l-1-7z" />
            </svg>
          </button>
        )}
        {/* Delete button removed - now handled by context menu in header */}
      </div>

      {/* Controls - Behind Frame, Slides Out on Hover (only for generated videos, not uploaded) */}
      {!isUploadedVideo && (
        <div
          className="controls-overlay"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: `${600 * scale}px`,
            maxWidth: '90vw',
            padding: `${16 * scale}px`,
            backgroundColor: '#ffffff',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: `0 0 ${16 * scale}px ${16 * scale}px`,
            boxShadow: 'none',
            transform: (isHovered || isPinned) ? 'translateY(0)' : `translateY(-100%)`,
            opacity: (isHovered || isPinned) ? 1 : 0,
            maxHeight: (isHovered || isPinned) ? '500px' : '0px',
            display: 'flex',
            flexDirection: 'column',
            gap: `${12 * scale}px`,
            pointerEvents: (isHovered || isPinned) ? 'auto' : 'none',
            overflow: 'visible',
            zIndex: 3,
            borderLeft: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
            borderRight: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
            borderBottom: `${frameBorderWidth * scale}px solid ${frameBorderColor}`,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
        {/* Prompt Input */}
        <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center' }}>
          <input
            className="prompt-input"
            type="text"
            value={prompt}
              onChange={(e) => {
                const val = e.target.value;
                setPrompt(val);
                onOptionsChange?.({ prompt: val, model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame, duration: selectedDuration, resolution: selectedResolution });
              }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="Enter prompt here..."
            style={{
              flex: 1,
              padding: `${10 * scale}px ${14 * scale}px`,
              backgroundColor: '#ffffff',
              border: `1px solid ${dropdownBorderColor}`,
              borderRadius: `${10 * scale}px`,
              fontSize: controlFontSize,
              color: '#1f2937',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = `1px solid ${frameBorderColor}`;
              e.currentTarget.style.boxShadow = `0 0 0 ${1 * scale}px ${frameBorderColor}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = `1px solid ${dropdownBorderColor}`;
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            style={{
              width: `${40 * scale}px`,
              height: `${40 * scale}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: (prompt.trim() && !isGenerating) ? '#437eb5' : 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              borderRadius: `${10 * scale}px`,
              cursor: (prompt.trim() && !isGenerating) ? 'pointer' : 'not-allowed',
              color: 'white',
              boxShadow: (prompt.trim() && !isGenerating) ? `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)` : 'none',
              padding: 0,
              opacity: isGenerating ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (prompt.trim() && !isGenerating) {
                e.currentTarget.style.boxShadow = `0 ${6 * scale}px ${16 * scale}px rgba(67, 126, 181, 0.5)`;
              }
            }}
            onMouseLeave={(e) => {
              if (prompt.trim() && !isGenerating) {
                e.currentTarget.style.boxShadow = `0 ${4 * scale}px ${12 * scale}px rgba(67, 126, 181, 0.4)`;
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {isGenerating ? (
              <svg width={18 * scale} height={18 * scale} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
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

        {/* Settings Row */}
        <div style={{ display: 'flex', gap: `${8 * scale}px`, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Model Selector - Custom Dropdown */}
          <div ref={modelDropdownRef} style={{ position: 'relative', flex: 1, minWidth: `${140 * scale}px`, overflow: 'visible', zIndex: 3002 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModelDropdownOpen(!isModelDropdownOpen);
                setIsAspectRatioDropdownOpen(false);
                setIsDurationDropdownOpen(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                  width: '100%',
                  padding: `${10 * scale}px ${28 * scale}px ${10 * scale}px ${14 * scale}px`,
                  backgroundColor: '#ffffff',
                border: `1px solid ${dropdownBorderColor}`,
                borderRadius: `${9999 * scale}px`,
                fontSize: controlFontSize,
                fontWeight: '500',
                color: '#1f2937',
                outline: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{selectedModel}</span>
              <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isModelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M2 4L6 8L10 4" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                  borderRadius: `${12 * scale}px`,
                  boxShadow: `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.15)`,
                  zIndex: 3003,
                  padding: `${4 * scale}px 0`,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${4 * scale}px`, padding: `${4 * scale}px` }}>
                {['Sora 2 Pro', 'Veo 3.1 Pro', 'Veo 3.1 Fast Pro', 'Kling 2.5 Turbo Pro', 'Seedance 1.0 Pro', 'Seedance 1.0 Lite', 'PixVerse v5', 'LTX V2 Pro', 'LTX V2 Fast', 'WAN 2.5', 'WAN 2.5 Fast', 'MiniMax-Hailuo-02', 'T2V-01-Director'].map((model) => (
                  <div
                    key={model}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedModel(model);
                      setIsModelDropdownOpen(false);
                      
                      // Get valid options for the new model
                      const defaultDuration = getModelDefaultDuration(model);
                      const defaultAspectRatio = getModelDefaultAspectRatio(model);
                      const defaultResolution = getModelDefaultResolution(model);
                      
                      // Update duration if current is not valid
                      const newDuration = isValidDurationForModel(model, selectedDuration) 
                        ? selectedDuration 
                        : defaultDuration;
                      
                      // Update aspect ratio if current is not valid
                      const newAspectRatio = isValidAspectRatioForModel(model, selectedAspectRatio)
                        ? selectedAspectRatio
                        : defaultAspectRatio;
                      
                      // Update resolution if current is not valid
                      const newResolution = isValidResolutionForModel(model, selectedResolution)
                        ? selectedResolution
                        : defaultResolution;
                      
                      // Update state
                      if (newDuration !== selectedDuration) {
                        setSelectedDuration(newDuration);
                      }
                      if (newAspectRatio !== selectedAspectRatio) {
                        setSelectedAspectRatio(newAspectRatio);
                      }
                      if (newResolution !== selectedResolution) {
                        setSelectedResolution(newResolution);
                      }
                      
                      const [w, h] = newAspectRatio.split(':').map(Number);
                const frameWidth = 600;
                const ar = w && h ? (w / h) : 16/9;
                const rawHeight = Math.round(frameWidth / ar);
                const frameHeight = Math.max(400, rawHeight);
                      onOptionsChange?.({ model, aspectRatio: newAspectRatio, frame: selectedFrame, prompt, duration: newDuration, resolution: newResolution, frameWidth, frameHeight });
                    }}
              style={{
                      padding: `${6 * scale}px ${12 * scale}px`,
                      fontSize: controlFontSize,
                      color: '#1f2937',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: selectedModel === model ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderRadius: `${6 * scale}px`,
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
                    {selectedModel === model && (
                      <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span>{model}</span>
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>

          {/* Aspect Ratio Selector - Custom Dropdown */}
          <div ref={aspectRatioDropdownRef} style={{ position: 'relative', overflow: 'visible', zIndex: 3001 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAspectRatioDropdownOpen(!isAspectRatioDropdownOpen);
                setIsModelDropdownOpen(false);
                setIsDurationDropdownOpen(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: `${10 * scale}px ${28 * scale}px ${10 * scale}px ${14 * scale}px`,
                  backgroundColor: '#ffffff',
                border: `1px solid ${dropdownBorderColor}`,
                borderRadius: `${9999 * scale}px`,
                fontSize: controlFontSize,
                fontWeight: '600',
                color: '#1f2937',
                minWidth: `${70 * scale}px`,
                outline: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{selectedAspectRatio}</span>
              <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isAspectRatioDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M2 4L6 8L10 4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            
            {isAspectRatioDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: `${4 * scale}px`,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${dropdownBorderColor}`,
                  borderRadius: `${12 * scale}px`,
                  boxShadow: `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.15)`,
                  maxHeight: `${200 * scale}px`,
                  overflowY: 'auto',
                  zIndex: 3003,
                  padding: `${4 * scale}px 0`,
                  minWidth: `${100 * scale}px`,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
                {getModelAspectRatios(selectedModel).map((ratio) => (
                  <div
                    key={ratio}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAspectRatio(ratio);
                      setIsAspectRatioDropdownOpen(false);
                      const [w, h] = ratio.split(':').map(Number);
                const frameWidth = 600;
                const ar = w && h ? (w / h) : 16/9;
                const rawHeight = Math.round(frameWidth / ar);
                const frameHeight = Math.max(400, rawHeight);
                      onOptionsChange?.({ model: selectedModel, aspectRatio: ratio, frame: selectedFrame, prompt, duration: selectedDuration, resolution: selectedResolution, frameWidth, frameHeight });
                    }}
                    style={{
                      padding: `${8 * scale}px ${16 * scale}px`,
                      fontSize: controlFontSize,
                      color: '#1f2937',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: selectedAspectRatio === ratio ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderLeft: selectedAspectRatio === ratio ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedAspectRatio !== ratio) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAspectRatio !== ratio) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {selectedAspectRatio === ratio && (
                      <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span>{ratio}</span>
          </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Duration Selector - Custom Dropdown */}
          <div ref={durationDropdownRef} style={{ position: 'relative', overflow: 'visible', zIndex: 3001 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDurationDropdownOpen(!isDurationDropdownOpen);
                setIsModelDropdownOpen(false);
                setIsAspectRatioDropdownOpen(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: `${10 * scale}px ${28 * scale}px ${10 * scale}px ${14 * scale}px`,
                backgroundColor: '#ffffff',
                border: `1px solid ${dropdownBorderColor}`,
                borderRadius: `${9999 * scale}px`,
                fontSize: controlFontSize,
                fontWeight: '600',
                color: '#1f2937',
                minWidth: `${70 * scale}px`,
                outline: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{selectedDuration}s</span>
              <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isDurationDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M2 4L6 8L10 4" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            
            {isDurationDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: `${4 * scale}px`,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${dropdownBorderColor}`,
                  borderRadius: `${12 * scale}px`,
                  boxShadow: `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.15)`,
                  maxHeight: `${200 * scale}px`,
                  overflowY: 'auto',
                  zIndex: 3003,
                  padding: `${4 * scale}px 0`,
                  minWidth: `${100 * scale}px`,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
                {getModelDurations(selectedModel).map((dur) => (
                  <div
                    key={dur}
                    onClick={(e) => {
                      e.stopPropagation();
                setSelectedDuration(dur);
                      setIsDurationDropdownOpen(false);
                const [w, h] = selectedAspectRatio.split(':').map(Number);
                const frameWidth = 600;
                const ar = w && h ? (w / h) : 16/9;
                const rawHeight = Math.round(frameWidth / ar);
                const frameHeight = Math.max(400, rawHeight);
                onOptionsChange?.({ model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, duration: dur, resolution: selectedResolution, frameWidth, frameHeight });
              }}
              style={{
                      padding: `${8 * scale}px ${16 * scale}px`,
                      fontSize: controlFontSize,
                      color: '#1f2937',
                cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: selectedDuration === dur ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderLeft: selectedDuration === dur ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedDuration !== dur) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedDuration !== dur) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {selectedDuration === dur && (
                      <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span>{dur}s</span>
          </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Resolution Selector - Custom Dropdown */}
          <div ref={resolutionDropdownRef} style={{ position: 'relative', overflow: 'visible', zIndex: 3001 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsResolutionDropdownOpen(!isResolutionDropdownOpen);
                setIsModelDropdownOpen(false);
                setIsAspectRatioDropdownOpen(false);
                setIsDurationDropdownOpen(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: `${10 * scale}px ${28 * scale}px ${10 * scale}px ${14 * scale}px`,
                backgroundColor: '#ffffff',
                border: `1px solid ${dropdownBorderColor}`,
                borderRadius: `${9999 * scale}px`,
                fontSize: controlFontSize,
                fontWeight: '600',
                color: '#1f2937',
                minWidth: `${80 * scale}px`,
                outline: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{selectedResolution}</span>
              <svg width={10 * scale} height={10 * scale} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginLeft: `${8 * scale}px`, transform: isResolutionDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M2 4L6 8L10 4" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            
            {isResolutionDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: `${4 * scale}px`,
                  backgroundColor: '#ffffff',
                  border: `1px solid ${dropdownBorderColor}`,
                  borderRadius: `${12 * scale}px`,
                  boxShadow: `0 ${8 * scale}px ${24 * scale}px rgba(0, 0, 0, 0.15)`,
                  maxHeight: `${200 * scale}px`,
                  overflowY: 'auto',
                  zIndex: 3003,
                  padding: `${4 * scale}px 0`,
                  minWidth: `${100 * scale}px`,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
                {getModelResolutions(selectedModel).map((res) => (
                  <div
                    key={res}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedResolution(res);
                      setIsResolutionDropdownOpen(false);
                      const [w, h] = selectedAspectRatio.split(':').map(Number);
                      const frameWidth = 600;
                      const ar = w && h ? (w / h) : 16/9;
                      const rawHeight = Math.round(frameWidth / ar);
                      const frameHeight = Math.max(400, rawHeight);
                      onOptionsChange?.({ model: selectedModel, aspectRatio: selectedAspectRatio, frame: selectedFrame, prompt, duration: selectedDuration, resolution: res, frameWidth, frameHeight });
                    }}
                    style={{
                      padding: `${8 * scale}px ${16 * scale}px`,
                      fontSize: controlFontSize,
                      color: '#1f2937',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: selectedResolution === res ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderLeft: selectedResolution === res ? `3px solid ${dropdownBorderColor}` : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedResolution !== res) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedResolution !== res) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {selectedResolution === res && (
                      <svg width={14 * scale} height={14 * scale} viewBox="0 0 24 24" fill="none" stroke={dropdownBorderColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: `${8 * scale}px`, flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    <span>{res}</span>
          </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

