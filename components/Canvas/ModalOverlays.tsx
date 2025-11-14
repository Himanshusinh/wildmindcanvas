'use client';

import React, { useState, useEffect } from 'react';
import { TextInput } from '@/components/TextInput';
import { ImageUploadModal } from '@/components/ImageUploadModal';
import { VideoUploadModal } from '@/components/VideoUploadModal';
import { getReplicateQueueStatus, getReplicateQueueResult } from '@/lib/api';
import { MusicUploadModal } from '@/components/MusicUploadModal';
import Konva from 'konva';

interface ModalOverlaysProps {
  textInputStates: Array<{ id: string; x: number; y: number; value?: string }>;
  imageModalStates: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>;
  videoModalStates: Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; duration?: number; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>;
  musicModalStates: Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null }>;
  selectedTextInputId: string | null;
  selectedTextInputIds: string[];
  selectedImageModalId: string | null;
  selectedImageModalIds: string[];
  selectedVideoModalId: string | null;
  selectedVideoModalIds: string[];
  selectedMusicModalId: string | null;
  selectedMusicModalIds: string[];
  clearAllSelections: () => void;
  setTextInputStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; value?: string }>>>;
  setSelectedTextInputId: (id: string | null) => void;
  setSelectedTextInputIds: (ids: string[]) => void;
  setImageModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>>;
  setSelectedImageModalId: (id: string | null) => void;
  setSelectedImageModalIds: (ids: string[]) => void;
  setVideoModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; duration?: number; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>>;
  setSelectedVideoModalId: (id: string | null) => void;
  setSelectedVideoModalIds: (ids: string[]) => void;
  setMusicModalStates: React.Dispatch<React.SetStateAction<Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>>;
  setSelectedMusicModalId: (id: string | null) => void;
  setSelectedMusicModalIds: (ids: string[]) => void;
  onTextCreate?: (text: string, x: number, y: number) => void;
  onImageSelect?: (file: File) => void;
  onImageGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, modalId?: string) => Promise<string | null>;
  onVideoSelect?: (file: File) => void;
  onVideoGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, duration: number, modalId?: string) => Promise<{ generationId?: string; taskId?: string } | null>;
  onMusicSelect?: (file: File) => void;
  onMusicGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string) => Promise<string | null>;
  generatedVideoUrl?: string | null;
  generatedMusicUrl?: string | null;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  groups: Map<string, { id: string; name?: string; itemIndices: number[]; textIds?: string[]; imageModalIds?: string[]; videoModalIds?: string[]; musicModalIds?: string[] }>;
  onAddImageToCanvas?: (url: string) => void;
  // Persistence callbacks for image generator modals
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  onPersistImageModalDelete?: (id: string) => void | Promise<void>;
  // Persistence callbacks for video generator modals
  onPersistVideoModalCreate?: (modal: { id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number }) => void | Promise<void>;
  onPersistVideoModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number }>) => void | Promise<void>;
  onPersistVideoModalDelete?: (id: string) => void | Promise<void>;
  // Persistence callbacks for music generator modals
  onPersistMusicModalCreate?: (modal: { id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistMusicModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>) => void | Promise<void>;
  onPersistMusicModalDelete?: (id: string) => void | Promise<void>;
  // Text generator persistence callbacks
  onPersistTextModalCreate?: (modal: { id: string; x: number; y: number; value?: string }) => void | Promise<void>;
  onPersistTextModalMove?: (id: string, updates: Partial<{ x: number; y: number; value?: string }>) => void | Promise<void>;
  onPersistTextModalDelete?: (id: string) => void | Promise<void>;
}

export const ModalOverlays: React.FC<ModalOverlaysProps> = ({
  textInputStates,
  imageModalStates,
  videoModalStates,
  musicModalStates,
  selectedTextInputId,
  selectedTextInputIds,
  selectedImageModalId,
  selectedImageModalIds,
  selectedVideoModalId,
  selectedVideoModalIds,
  selectedMusicModalId,
  selectedMusicModalIds,
  clearAllSelections,
  setTextInputStates,
  setSelectedTextInputId,
  setSelectedTextInputIds,
  setImageModalStates,
  setSelectedImageModalId,
  setSelectedImageModalIds,
  setVideoModalStates,
  setSelectedVideoModalId,
  setSelectedVideoModalIds,
  setMusicModalStates,
  setSelectedMusicModalId,
  setSelectedMusicModalIds,
  onTextCreate,
  onImageSelect,
  onImageGenerate,
  onVideoSelect,
  onVideoGenerate,
  onMusicSelect,
  onMusicGenerate,
  generatedVideoUrl,
  generatedMusicUrl,
  stageRef,
  scale,
  position,
  groups,
  onAddImageToCanvas,
  onPersistImageModalCreate,
  onPersistImageModalMove,
  onPersistImageModalDelete,
  onPersistVideoModalCreate,
  onPersistVideoModalMove,
  onPersistVideoModalDelete,
  onPersistMusicModalCreate,
  onPersistMusicModalMove,
  onPersistMusicModalDelete,
  onPersistTextModalCreate,
  onPersistTextModalMove,
  onPersistTextModalDelete,
}) => {
  // Helper function to check if a component is in a group
  const isInGroup = (textId?: string, imageModalId?: string, videoModalId?: string, musicModalId?: string): boolean => {
    for (const group of groups.values()) {
      if (textId && group.textIds?.includes(textId)) return true;
      if (imageModalId && group.imageModalIds?.includes(imageModalId)) return true;
      if (videoModalId && group.videoModalIds?.includes(videoModalId)) return true;
      if (musicModalId && group.musicModalIds?.includes(musicModalId)) return true;
    }
    return false;
  };
  // Connection state
  const [connections, setConnections] = useState<Array<{ from: string; to: string; color: string }>>([]);
  const [activeDrag, setActiveDrag] = useState<null | { from: string; color: string; startX: number; startY: number; currentX: number; currentY: number }>(null);

  // Event listeners for node drag lifecycle
  useEffect(() => {
    const handleStart = (e: Event) => {
      const ce = e as CustomEvent;
      const { id, side, color, startX, startY } = ce.detail || {};
      if (side !== 'send') return; // only start from send side
      setActiveDrag({ from: id, color, startX, startY, currentX: startX, currentY: startY });
      // Notify nodes that a drag has started so they can remain visible
      try {
        window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: true, from: id } }));
      } catch (err) {
        // ignore
      }
    };
    const handleComplete = (e: Event) => {
      const ce = e as CustomEvent;
      const { id, side } = ce.detail || {};
      if (!activeDrag) return;
      if (side !== 'receive') return;
      if (id === activeDrag.from) { // ignore self
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) {}
        return;
      }
      // Add connection if not duplicate
      setConnections(prev => {
        if (prev.find(c => c.from === activeDrag.from && c.to === id)) return prev;
        return [...prev, { from: activeDrag.from, to: id, color: activeDrag.color }];
      });
      setActiveDrag(null);
      try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) {}
    };
    const handleMove = (e: MouseEvent) => {
      if (!activeDrag) return;
      setActiveDrag(d => d ? { ...d, currentX: e.clientX, currentY: e.clientY } : d);
    };
    const handleUp = () => {
      if (activeDrag) {
        setActiveDrag(null);
        try { window.dispatchEvent(new CustomEvent('canvas-node-active', { detail: { active: false } })); } catch (err) {}
      }
    };
    window.addEventListener('canvas-node-start', handleStart as any);
    window.addEventListener('canvas-node-complete', handleComplete as any);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('canvas-node-start', handleStart as any);
      window.removeEventListener('canvas-node-complete', handleComplete as any);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [activeDrag]);

  // Compute line endpoints. Prefer anchoring to the inner frame element (if present),
  // then to the overlay container, falling back to the small node center.
  const computeNodeCenter = (id: string, side: 'send' | 'receive'): { x: number; y: number } | null => {
    if (!id) return null;
    // Prefer frame element (set via data-frame-id on inner frame)
    const frameEl = document.querySelector(`[data-frame-id="${id}-frame"]`);
    if (frameEl) {
      const rect = frameEl.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      if (side === 'send') return { x: rect.right, y: centerY };
      return { x: rect.left, y: centerY };
    }

    // Next prefer the overlay container
    const overlay = document.querySelector(`[data-overlay-id="${id}"]`);
    if (overlay) {
      const rect = overlay.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      if (side === 'send') return { x: rect.right, y: centerY };
      return { x: rect.left, y: centerY };
    }

    // Fallback: use the small node element position (circle center)
    const el = document.querySelector(`[data-node-id="${id}"][data-node-side="${side}"]`);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  const connectionLines = connections.map(conn => {
    const fromCenter = computeNodeCenter(conn.from, 'send');
    const toCenter = computeNodeCenter(conn.to, 'receive');
    if (!fromCenter || !toCenter) return null;
    return { ...conn, fromX: fromCenter.x, fromY: fromCenter.y, toX: toCenter.x, toY: toCenter.y };
  }).filter(Boolean) as Array<{ from: string; to: string; color: string; fromX: number; fromY: number; toX: number; toY: number }>;

  return (
    <>
      {/* SVG overlay for connection lines */}
      <svg
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 1999 }}
      >
        {connectionLines.map(line => (
          <g key={`${line.from}-${line.to}`}>
            <path
              d={`M ${line.fromX} ${line.fromY} C ${(line.fromX + line.toX) / 2} ${line.fromY}, ${(line.fromX + line.toX) / 2} ${line.toY}, ${line.toX} ${line.toY}`}
              stroke={line.color}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
            />
            <circle cx={line.fromX} cy={line.fromY} r={4} fill={line.color} />
            <circle cx={line.toX} cy={line.toY} r={4} fill={line.color} />
          </g>
        ))}
        {activeDrag && (
          <path
            d={`M ${activeDrag.startX} ${activeDrag.startY} C ${(activeDrag.startX + activeDrag.currentX) / 2} ${activeDrag.startY}, ${(activeDrag.startX + activeDrag.currentX) / 2} ${activeDrag.currentY}, ${activeDrag.currentX} ${activeDrag.currentY}`}
            stroke={activeDrag.color}
            strokeWidth={2}
            fill="none"
            strokeDasharray="6 4"
          />
        )}
      </svg>
      {/* Text Input Overlays */}
      {textInputStates.map((textState) => (
        <TextInput
          key={textState.id}
          id={textState.id}
          x={textState.x}
          y={textState.y}
          isSelected={selectedTextInputId === textState.id || selectedTextInputIds.includes(textState.id)}
          onConfirm={(text) => {
            if (onTextCreate) {
              onTextCreate(text, textState.x, textState.y);
            }
            if (onPersistTextModalDelete) {
              Promise.resolve(onPersistTextModalDelete(textState.id)).catch(console.error);
            }
            setTextInputStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onCancel={() => {
            if (onPersistTextModalDelete) {
              Promise.resolve(onPersistTextModalDelete(textState.id)).catch(console.error);
            }
            setTextInputStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onPositionChange={isInGroup(textState.id) ? undefined : (newX, newY) => {
            setTextInputStates(prev => prev.map(t => 
              t.id === textState.id ? { ...t, x: newX, y: newY } : t
            ));
            if (onPersistTextModalMove) {
              Promise.resolve(onPersistTextModalMove(textState.id, { x: newX, y: newY })).catch(console.error);
            }
          }}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this text input as selected
            setSelectedTextInputId(textState.id);
            setSelectedTextInputIds([textState.id]);
          }}
          onDelete={() => {
            if (onPersistTextModalDelete) {
              Promise.resolve(onPersistTextModalDelete(textState.id)).catch(console.error);
            }
            setTextInputStates(prev => prev.filter(t => t.id !== textState.id));
            setSelectedTextInputId(null);
          }}
          onDuplicate={() => {
            // Create a duplicate of the text input to the right
            const duplicated = {
              id: `text-${Date.now()}-${Math.random()}`,
              x: textState.x + 300 + 50, // 300px width + 50px spacing
              y: textState.y, // Same Y position
              value: textState.value || ''
            };
            setTextInputStates(prev => [...prev, duplicated]);
          }}
          onValueChange={(val) => {
            setTextInputStates(prev => prev.map(t => t.id === textState.id ? { ...t, value: val } : t));
            if (onPersistTextModalMove) {
              Promise.resolve(onPersistTextModalMove(textState.id, { value: val })).catch(console.error);
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
      {/* Image Upload Modal Overlays */}
      {imageModalStates.map((modalState) => (
        <ImageUploadModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          onClose={() => {
            setImageModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedImageModalId(null);
            if (onPersistImageModalDelete) {
              Promise.resolve(onPersistImageModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onGenerate={async (prompt, model, frame, aspectRatio) => {
            if (onImageGenerate) {
              try {
                const imageUrl = await onImageGenerate(prompt, model, frame, aspectRatio, modalState.id);
                if (imageUrl) {
                  // Keep the modal visible and show the generated image inside the frame
                  setImageModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, generatedImageUrl: imageUrl } : m));
                  if (onPersistImageModalMove) {
                    // Compute frame size: width fixed 600, height based on aspect ratio (min 400)
                    const [w, h] = aspectRatio.split(':').map(Number);
                    const frameWidth = 600;
                    const ar = w && h ? (w / h) : 1;
                    const rawHeight = ar ? Math.round(frameWidth / ar) : 600;
                    const frameHeight = Math.max(400, rawHeight);
                    Promise.resolve(onPersistImageModalMove(modalState.id, {
                      generatedImageUrl: imageUrl,
                      model,
                      frame,
                      aspectRatio,
                      frameWidth,
                      frameHeight,
                      prompt,
                    })).catch(console.error);
                  }
                }
              } catch (error) {
                console.error('Error generating image:', error);
                // Error is already handled in the modal component
              }
            }
          }}
          generatedImageUrl={modalState.generatedImageUrl}
          initialModel={(modalState as any).model}
          initialFrame={(modalState as any).frame}
          initialAspectRatio={(modalState as any).aspectRatio}
          initialPrompt={(modalState as any).prompt}
          onOptionsChange={(opts) => {
            // Update local state to keep UI in sync
            setImageModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts, frameWidth: opts.frameWidth ?? m.frameWidth, frameHeight: opts.frameHeight ?? m.frameHeight, model: opts.model ?? m.model, frame: opts.frame ?? m.frame, aspectRatio: opts.aspectRatio ?? m.aspectRatio, prompt: opts.prompt ?? m.prompt } : m));
            // Persist to parent (which will broadcast + snapshot)
            if (onPersistImageModalMove) {
              Promise.resolve(onPersistImageModalMove(modalState.id, opts as any)).catch(console.error);
            }
          }}
          onAddToCanvas={onAddImageToCanvas}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this modal as selected
            setSelectedImageModalId(modalState.id);
            setSelectedImageModalIds([modalState.id]);
          }}
          onDelete={() => {
            setImageModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedImageModalId(null);
            if (onPersistImageModalDelete) {
              Promise.resolve(onPersistImageModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onDownload={async () => {
            // Download the generated image if available
            if (modalState.generatedImageUrl) {
              try {
                // Fetch the image to handle CORS issues
                const response = await fetch(modalState.generatedImageUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `generated-image-${modalState.id}-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Failed to download image:', error);
                // Fallback: try direct download
                const link = document.createElement('a');
                link.href = modalState.generatedImageUrl!;
                link.download = `generated-image-${modalState.id}-${Date.now()}.png`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }
          }}
          onDuplicate={() => {
            // Create a duplicate of the image modal to the right
            const duplicated = {
              id: `image-modal-${Date.now()}`,
              x: modalState.x + 600 + 50, // 600px width + 50px spacing
              y: modalState.y, // Same Y position
              generatedImageUrl: modalState.generatedImageUrl,
            };
            setImageModalStates(prev => [...prev, duplicated]);
            if (onPersistImageModalCreate) {
              Promise.resolve(onPersistImageModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedImageModalId === modalState.id || selectedImageModalIds.includes(modalState.id)}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={isInGroup(undefined, modalState.id) ? undefined : (newX, newY) => {
            setImageModalStates(prev => prev.map(m => 
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
          }}
          onPositionCommit={isInGroup(undefined, modalState.id) ? undefined : (finalX, finalY) => {
            if (onPersistImageModalMove) {
              Promise.resolve(onPersistImageModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
      {/* Video Upload Modal Overlays */}
      {videoModalStates.map((modalState) => (
        <VideoUploadModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          onClose={() => {
            setVideoModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedVideoModalId(null);
            if (onPersistVideoModalDelete) {
              Promise.resolve(onPersistVideoModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onGenerate={async (prompt, model, frame, aspectRatio) => {
            if (!onVideoGenerate) return null;
            try {
              // Submit generation (returns taskId + generationId)
              const submitRes = await onVideoGenerate(prompt, model, frame, aspectRatio, modalState.duration || 5, modalState.id);
              const taskId = submitRes?.taskId;
              const generationId = submitRes?.generationId;
              if (onPersistVideoModalMove) {
                const [w, h] = aspectRatio.split(':').map(Number);
                const frameWidth = 600;
                const ar = w && h ? (w / h) : 16/9;
                const rawHeight = ar ? Math.round(frameWidth / ar) : 338;
                const frameHeight = Math.max(400, rawHeight);
                Promise.resolve(onPersistVideoModalMove(modalState.id, {
                  model,
                  frame,
                  aspectRatio,
                  prompt,
                  frameWidth,
                  frameHeight,
                  taskId,
                  generationId,
                  status: 'submitted',
                } as any)).catch(console.error);
              }
              // Optimistic state update with tracking fields
              setVideoModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, model, frame, aspectRatio, prompt, taskId, generationId } : m));
              if (!taskId) return null;
              // Poll for completion
              const pollIntervalMs = 3000;
              const maxAttempts = 600; // ~30 minutes max
              for (let attempt = 0; attempt < maxAttempts; attempt++) {
                try {
                  const statusData = await getReplicateQueueStatus(taskId);
                  const statusVal = String(statusData?.status || '').toLowerCase();
                  if (statusVal === 'completed' || statusVal === 'succeeded' || statusVal === 'success') {
                    // Fetch result via helper
                    const resultData = await getReplicateQueueResult(taskId);
                    // Determine URL from known shapes
                    let videoUrl: string | null = null;
                    if (Array.isArray(resultData?.videos) && resultData.videos[0]?.url) {
                      videoUrl = resultData.videos[0].url;
                    } else if (resultData?.video?.url) {
                      videoUrl = resultData.video.url;
                    } else if (typeof resultData?.output === 'string' && resultData.output.startsWith('http')) {
                      videoUrl = resultData.output;
                    } else if (Array.isArray(resultData?.output) && typeof resultData.output[0] === 'string') {
                      videoUrl = resultData.output[0];
                    }
                    if (videoUrl) {
                      setVideoModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, generatedVideoUrl: videoUrl } : m));
                      if (onPersistVideoModalMove) {
                        Promise.resolve(onPersistVideoModalMove(modalState.id, {
                          generatedVideoUrl: videoUrl,
                          status: 'completed',
                        } as any)).catch(console.error);
                      }
                      break;
                    }
                    // If result doesn't include URL yet, continue polling briefly
                  } else if (statusVal === 'failed' || statusVal === 'error') {
                    console.error('[Canvas Video Poll] generation failed', { taskId, status: statusVal });
                    if (onPersistVideoModalMove) {
                      Promise.resolve(onPersistVideoModalMove(modalState.id, { status: 'failed' } as any)).catch(console.error);
                    }
                    break;
                  }
                } catch (pollErr) {
                  console.warn('[Canvas Video Poll] status check error', pollErr);
                }
                await new Promise(r => setTimeout(r, pollIntervalMs));
              }
            } catch (e) {
              console.error('Error generating video:', e);
              if (onPersistVideoModalMove) {
                Promise.resolve(onPersistVideoModalMove(modalState.id, { status: 'error' } as any)).catch(console.error);
              }
            }
            return null;
          }}
          generatedVideoUrl={modalState.generatedVideoUrl}
          initialModel={modalState.model}
          initialFrame={modalState.frame}
          initialAspectRatio={modalState.aspectRatio}
          initialDuration={modalState.duration || 5}
          initialPrompt={modalState.prompt}
          onOptionsChange={(opts) => {
            setVideoModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts, duration: (opts as any).duration ?? m.duration, frameWidth: opts.frameWidth ?? m.frameWidth, frameHeight: opts.frameHeight ?? m.frameHeight, model: opts.model ?? m.model, frame: opts.frame ?? m.frame, aspectRatio: opts.aspectRatio ?? m.aspectRatio, prompt: opts.prompt ?? m.prompt } : m));
            if (onPersistVideoModalMove) {
              Promise.resolve(onPersistVideoModalMove(modalState.id, opts as any)).catch(console.error);
            }
          }}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this modal as selected
            setSelectedVideoModalId(modalState.id);
            setSelectedVideoModalIds([modalState.id]);
            // Context menu removed - icons are now shown at top-right corner of modal
          }}
          onDelete={() => {
            setVideoModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedVideoModalId(null);
            if (onPersistVideoModalDelete) {
              Promise.resolve(onPersistVideoModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onDownload={async () => {
            // Download the generated video if available
            if (modalState.generatedVideoUrl) {
              try {
                // Fetch the video to handle CORS issues
                const response = await fetch(modalState.generatedVideoUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `generated-video-${modalState.id}-${Date.now()}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Failed to download video:', error);
                // Fallback: try direct download
                const link = document.createElement('a');
                link.href = modalState.generatedVideoUrl!;
                link.download = `generated-video-${modalState.id}-${Date.now()}.mp4`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }
          }}
          onDuplicate={() => {
            // Create a duplicate of the video modal to the right
            const duplicated = {
              id: `video-modal-${Date.now()}`,
              x: modalState.x + 600 + 50, // 600px width + 50px spacing
              y: modalState.y, // Same Y position
              generatedVideoUrl: modalState.generatedVideoUrl,
            };
            setVideoModalStates(prev => [...prev, duplicated]);
            if (onPersistVideoModalCreate) {
              Promise.resolve(onPersistVideoModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedVideoModalId === modalState.id || selectedVideoModalIds.includes(modalState.id)}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={isInGroup(undefined, undefined, modalState.id) ? undefined : (newX, newY) => {
            setVideoModalStates(prev => prev.map(m => 
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
          }}
          onPositionCommit={isInGroup(undefined, undefined, modalState.id) ? undefined : (finalX, finalY) => {
            if (onPersistVideoModalMove) {
              Promise.resolve(onPersistVideoModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
      {/* Music Upload Modal Overlays */}
      {musicModalStates.map((modalState) => (
        <MusicUploadModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          onClose={() => {
            setMusicModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedMusicModalId(null);
            if (onPersistMusicModalDelete) {
              Promise.resolve(onPersistMusicModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onMusicSelect={onMusicSelect}
          onGenerate={async (prompt, model, frame, aspectRatio) => {
            if (onMusicGenerate) {
              try {
                const url = await onMusicGenerate(prompt, model, frame, aspectRatio);
                if (url) {
                  setMusicModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, generatedMusicUrl: url } : m));
                  if (onPersistMusicModalMove) {
                    const frameWidth = 600;
                    const frameHeight = 300;
                    Promise.resolve(onPersistMusicModalMove(modalState.id, {
                      generatedMusicUrl: url,
                      model,
                      frame,
                      aspectRatio,
                      frameWidth,
                      frameHeight,
                      prompt,
                    } as any)).catch(console.error);
                  }
                }
              } catch (e) {
                console.error('Error generating music:', e);
              }
            }
          }}
          generatedMusicUrl={modalState.generatedMusicUrl}
          initialModel={(modalState as any).model}
          initialFrame={(modalState as any).frame}
          initialAspectRatio={(modalState as any).aspectRatio}
          initialPrompt={(modalState as any).prompt}
          onOptionsChange={(opts) => {
            setMusicModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts, frameWidth: opts.frameWidth ?? m.frameWidth, frameHeight: opts.frameHeight ?? m.frameHeight, model: opts.model ?? m.model, frame: opts.frame ?? m.frame, aspectRatio: opts.aspectRatio ?? m.aspectRatio, prompt: opts.prompt ?? m.prompt } : m));
            if (onPersistMusicModalMove) {
              Promise.resolve(onPersistMusicModalMove(modalState.id, opts as any)).catch(console.error);
            }
          }}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this modal as selected
            setSelectedMusicModalId(modalState.id);
            setSelectedMusicModalIds([modalState.id]);
            // Context menu removed - icons are now shown at top-right corner of modal
          }}
          onDelete={() => {
            setMusicModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedMusicModalId(null);
            if (onPersistMusicModalDelete) {
              Promise.resolve(onPersistMusicModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onDownload={async () => {
            // Download the generated music if available
            if (modalState.generatedMusicUrl) {
              try {
                // Fetch the music to handle CORS issues
                const response = await fetch(modalState.generatedMusicUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `generated-music-${modalState.id}-${Date.now()}.mp3`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Failed to download music:', error);
                // Fallback: try direct download
                const link = document.createElement('a');
                link.href = modalState.generatedMusicUrl!;
                link.download = `generated-music-${modalState.id}-${Date.now()}.mp3`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }
          }}
          onDuplicate={() => {
            // Create a duplicate of the music modal to the right
            const duplicated = {
              id: `music-modal-${Date.now()}`,
              x: modalState.x + 600 + 50, // 600px width + 50px spacing
              y: modalState.y, // Same Y position
              generatedMusicUrl: modalState.generatedMusicUrl,
            };
            setMusicModalStates(prev => [...prev, duplicated]);
            if (onPersistMusicModalCreate) {
              Promise.resolve(onPersistMusicModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedMusicModalId === modalState.id || selectedMusicModalIds.includes(modalState.id)}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={isInGroup(undefined, undefined, undefined, modalState.id) ? undefined : (newX, newY) => {
            setMusicModalStates(prev => prev.map(m => 
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
          }}
          onPositionCommit={isInGroup(undefined, undefined, undefined, modalState.id) ? undefined : (finalX, finalY) => {
            if (onPersistMusicModalMove) {
              Promise.resolve(onPersistMusicModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
        />
      ))}
    </>
  );
};

