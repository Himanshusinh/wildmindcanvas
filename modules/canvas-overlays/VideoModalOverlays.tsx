'use client';

import React from 'react';
import { VideoUploadModal } from '@/modules/generators/VideoUploadModal';
import { getReplicateQueueStatus, getReplicateQueueResult, getFalQueueStatus, getFalQueueResult, getMiniMaxVideoStatus, getMiniMaxVideoFile } from '@/core/api/api';
import Konva from 'konva';
import { VideoModalState, Connection, ImageModalState, TextModalState } from './types';
import { PluginContextMenu } from '@/modules/ui-global/common/PluginContextMenu';
import { ImageUpload } from '@/core/types/canvas';
// Zustand Store - Video State Management
import { useVideoStore, useVideoModalStates, useVideoSelection } from '@/modules/stores';

/**
 * Calculate aspect ratio string (e.g., "9:16") from width and height
 */
function calculateAspectRatioFromDimensions(width?: number, height?: number): string {
  if (!width || !height || width <= 0 || height <= 0) return '16:9';

  const ratio = width / height;
  const tolerance = 0.01;

  const commonRatios: Array<{ ratio: number; label: string }> = [
    { ratio: 1.0, label: '1:1' },
    { ratio: 4 / 3, label: '4:3' },
    { ratio: 3 / 4, label: '3:4' },
    { ratio: 16 / 9, label: '16:9' },
    { ratio: 9 / 16, label: '9:16' },
    { ratio: 3 / 2, label: '3:2' },
    { ratio: 2 / 3, label: '2:3' },
    { ratio: 21 / 9, label: '21:9' },
    { ratio: 9 / 21, label: '9:21' },
    { ratio: 16 / 10, label: '16:10' },
    { ratio: 10 / 16, label: '10:16' },
    { ratio: 5 / 4, label: '5:4' },
    { ratio: 4 / 5, label: '4:5' },
  ];

  for (const common of commonRatios) {
    if (Math.abs(ratio - common.ratio) < tolerance || Math.abs(ratio - 1 / common.ratio) < tolerance) {
      return common.label;
    }
  }

  // Calculate GCD for custom ratios
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  if (w <= 100 && h <= 100) return `${w}:${h}`;
  return `${Math.round(ratio * 100) / 100}:1`;
}

interface VideoModalOverlaysProps {
  // REMOVED: These props are now managed by Zustand store
  videoModalStates?: VideoModalState[];
  selectedVideoModalId?: string | null;
  selectedVideoModalIds?: string[];
  clearAllSelections: () => void;
  // setVideoModalStates: React.Dispatch<React.SetStateAction<VideoModalState[]>>;
  // setSelectedVideoModalId: (id: string | null) => void;
  // setSelectedVideoModalIds: React.Dispatch<React.SetStateAction<string[]>>;
  onVideoGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, duration: number, resolution?: string, modalId?: string, firstFrameUrl?: string, lastFrameUrl?: string) => Promise<{ generationId?: string; taskId?: string; provider?: string } | null>;
  onPersistVideoModalCreate?: (modal: { id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number }) => void | Promise<void>;
  onPersistVideoModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number; isPinned?: boolean }>) => void | Promise<void>;
  onPersistVideoModalDelete?: (id: string) => void | Promise<void>;
  connections: Connection[];
  imageModalStates: ImageModalState[];
  images: ImageUpload[];
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  textInputStates?: TextModalState[];
  isComponentDraggable?: (id: string) => boolean;

  isChatOpen?: boolean;
  selectedIds?: string[];
  setSelectionOrder?: (order: string[] | ((prev: string[]) => string[])) => void;
  // Level-of-detail flags (optional)
  showFineDetails?: boolean;
  showLabelsOnly?: boolean;
  isZoomedOut?: boolean;
}

export const VideoModalOverlays = React.memo<VideoModalOverlaysProps>(({
  // REMOVED: videoModalStates, selectedVideoModalId, selectedVideoModalIds, setVideoModalStates, setSelectedVideoModalId, setSelectedVideoModalIds (now managed by Zustand store)
  // videoModalStates,
  // selectedVideoModalId,
  // selectedVideoModalIds,
  clearAllSelections,
  // setVideoModalStates,
  // setSelectedVideoModalId,
  // setSelectedVideoModalIds,
  onVideoGenerate,
  onPersistVideoModalCreate,
  onPersistVideoModalMove,
  onPersistVideoModalDelete,
  connections,
  imageModalStates,
  images,
  stageRef,
  scale,
  position,
  textInputStates,
  isComponentDraggable,

  isChatOpen,
  selectedIds,
  setSelectionOrder,
  showFineDetails,
  showLabelsOnly,
  isZoomedOut,
  videoModalStates: propVideoModalStates,
  selectedVideoModalId: propSelectedVideoModalId,
  selectedVideoModalIds: propSelectedVideoModalIds,
}) => {
  // Zustand Store - Get video state and actions
  const storeVideoModalStates = useVideoModalStates();
  const { selectedId: storeSelectedVideoModalId, selectedIds: storeSelectedVideoModalIds } = useVideoSelection();

  const videoModalStates = propVideoModalStates || storeVideoModalStates;
  const selectedVideoModalId = propSelectedVideoModalId !== undefined ? propSelectedVideoModalId : storeSelectedVideoModalId;
  const selectedVideoModalIds = propSelectedVideoModalIds !== undefined ? propSelectedVideoModalIds : storeSelectedVideoModalIds;

  const setVideoModalStates = useVideoStore(state => state.setVideoModalStates);
  const setSelectedVideoModalId = useVideoStore(state => state.setSelectedVideoModalId);
  const setSelectedVideoModalIds = useVideoStore(state => state.setSelectedVideoModalIds);
  const updateVideoModal = useVideoStore(state => state.updateVideoModal);
  const removeVideoModal = useVideoStore(state => state.removeVideoModal);
  const addVideoModal = useVideoStore(state => state.addVideoModal);

  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; modalId: string } | null>(null);

  // Track Shift key locally for robust multi-selection
  const [isShiftPressed, setIsShiftPressed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Use ref to access latest video selection state
  const selectedVideoModalIdsRef = React.useRef(selectedVideoModalIds);
  React.useEffect(() => {
    selectedVideoModalIdsRef.current = selectedVideoModalIds;
  }, [selectedVideoModalIds]);

  return (
    <>
      {videoModalStates.map((modalState) => (
        <VideoUploadModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          draggable={isComponentDraggable ? isComponentDraggable(modalState.id) : true}
          isPinned={modalState.isPinned}
          onTogglePin={() => {
            if (onPersistVideoModalMove) {
              onPersistVideoModalMove(modalState.id, { isPinned: !modalState.isPinned });
            }
          }}
          onContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({ x: e.clientX, y: e.clientY, modalId: modalState.id });
          }}
          onClose={() => {
            // Use Zustand store for deletion
            removeVideoModal(modalState.id);
            setSelectedVideoModalId(null);
            if (onPersistVideoModalDelete) {
              Promise.resolve(onPersistVideoModalDelete(modalState.id)).catch(console.error);
            }
          }}
          onGenerate={async (prompt, model, frame, aspectRatio, duration, resolution, firstFrameUrl, lastFrameUrl) => {
            if (!onVideoGenerate) return null;
            try {
              // Submit generation (returns taskId + generationId + provider)
              const submitRes = await onVideoGenerate(prompt, model, frame, aspectRatio, duration || modalState.duration || 5, resolution || modalState.resolution, modalState.id, firstFrameUrl, lastFrameUrl);
              const taskId = submitRes?.taskId;
              const generationId = submitRes?.generationId;
              const provider = submitRes?.provider || 'replicate'; // Default to replicate for backward compatibility

              if (onPersistVideoModalMove) {
                const [w, h] = aspectRatio.split(':').map(Number);
                const frameWidth = 600;
                const ar = w && h ? (w / h) : 16 / 9;
                const rawHeight = ar ? Math.round(frameWidth / ar) : 338;
                const frameHeight = Math.max(400, rawHeight);
                Promise.resolve(onPersistVideoModalMove(modalState.id, {
                  model,
                  frame,
                  aspectRatio,
                  prompt,
                  duration: duration || modalState.duration || 5,
                  resolution: resolution || modalState.resolution,
                  frameWidth,
                  frameHeight,
                  taskId,
                  generationId,
                  provider,
                  status: 'submitted',
                } as any)).catch(console.error);
              }
              // Optimistic state update with tracking fields (using Zustand store)
              updateVideoModal(modalState.id, { model, frame, aspectRatio, prompt, duration: duration || modalState.duration || 5, resolution: resolution || modalState.resolution, taskId, generationId, provider, status: 'submitted' });
              if (!taskId) return null;

              // Determine which service to poll based on provider or model
              const isFalModel = provider === 'fal' || model?.toLowerCase().includes('sora') || model?.toLowerCase().includes('veo') || model?.toLowerCase().includes('ltx');
              const isMiniMaxModel = provider === 'minimax' || model?.toLowerCase().includes('minimax') || model?.toLowerCase().includes('hailuo');

              // Poll for completion
              const pollIntervalMs = 3000;
              const maxAttempts = 600; // ~30 minutes max
              for (let attempt = 0; attempt < maxAttempts; attempt++) {
                try {
                  let statusData: any;
                  let statusVal: string;

                  // Use appropriate polling endpoint based on provider
                  if (isFalModel) {
                    statusData = await getFalQueueStatus(taskId);
                    statusVal = String(statusData?.status || '').toLowerCase();
                  } else if (isMiniMaxModel) {
                    statusData = await getMiniMaxVideoStatus(taskId);
                    // MiniMax status structure: result.status or base_resp.status_code
                    // Check result.status_code (0 = success, 1 = processing)
                    const resultStatusCode = statusData?.result?.status_code;
                    const baseRespCode = statusData?.base_resp?.status_code;
                    const resultStatus = statusData?.result?.status || statusData?.status;

                    // MiniMax: 0 = success, 1 = processing, other = error
                    // Also check if file_id exists (indicates completion)
                    const hasFileId = !!(statusData?.result?.file_id || statusData?.file_id);

                    if (hasFileId || resultStatusCode === 0 || baseRespCode === 0 || resultStatus === 'SUCCESS' || resultStatus === 'success') {
                      statusVal = 'completed';
                    } else if (resultStatusCode === 1 || baseRespCode === 1 || resultStatus === 'PROCESSING' || resultStatus === 'processing') {
                      statusVal = 'processing';
                    } else {
                      statusVal = 'failed';
                    }
                  } else {
                    // Default to Replicate
                    statusData = await getReplicateQueueStatus(taskId);
                    statusVal = String(statusData?.status || '').toLowerCase();
                  }

                  if (statusVal === 'completed' || statusVal === 'succeeded' || statusVal === 'success') {
                    // Fetch result via appropriate helper
                    let resultData: any;
                    let videoUrl: string | null = null;

                    if (isFalModel) {
                      resultData = await getFalQueueResult(taskId);
                    } else if (isMiniMaxModel) {
                      // MiniMax: get file_id from status response and fetch file
                      const fileId = statusData?.result?.file_id || statusData?.file_id;
                      if (fileId && generationId) {
                        resultData = await getMiniMaxVideoFile(fileId, generationId);
                        // MiniMax file response structure: processVideoFile returns videos array
                        if (resultData?.videos && Array.isArray(resultData.videos) && resultData.videos[0]?.url) {
                          videoUrl = resultData.videos[0].url;
                        } else {
                          videoUrl = resultData?.download_url || resultData?.url || resultData?.result?.download_url || resultData?.file?.url;
                        }
                      }
                    } else {
                      resultData = await getReplicateQueueResult(taskId);
                    }

                    // Determine URL from known shapes (for non-MiniMax)
                    if (!videoUrl) {
                      if (Array.isArray(resultData?.videos) && resultData.videos[0]?.url) {
                        videoUrl = resultData.videos[0].url;
                      } else if (resultData?.video?.url) {
                        videoUrl = resultData.video.url;
                      } else if (typeof resultData?.output === 'string' && resultData.output.startsWith('http')) {
                        videoUrl = resultData.output;
                      } else if (Array.isArray(resultData?.output) && typeof resultData.output[0] === 'string') {
                        videoUrl = resultData.output[0];
                      } else if (resultData?.data?.video?.url) {
                        videoUrl = resultData.data.video.url;
                      }
                    }

                    if (videoUrl) {
                      // Update video modal with generated URL (using Zustand store)
                      updateVideoModal(modalState.id, { generatedVideoUrl: videoUrl, status: 'completed' });



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
                    console.error('[Canvas Video Poll] generation failed', { taskId, status: statusVal, provider });



                    if (onPersistVideoModalMove) {
                      Promise.resolve(onPersistVideoModalMove(modalState.id, { status: 'failed' } as any)).catch(console.error);
                    }
                    // Update status to failed (using Zustand store)
                    updateVideoModal(modalState.id, { status: 'failed' });
                    break;
                  }
                } catch (pollErr: any) {
                  // Handle 404 - prediction not found, stop polling
                  if (pollErr?.status === 404 || pollErr?.isNotFound) {
                    console.error('[Canvas Video Poll] Prediction not found (404)', { taskId, provider, error: pollErr?.message });



                    if (onPersistVideoModalMove) {
                      Promise.resolve(onPersistVideoModalMove(modalState.id, {
                        status: 'failed',
                        error: pollErr?.message || 'Prediction not found. The prediction may have been deleted or expired.'
                      } as any)).catch(console.error);
                    }
                    // Update status to failed (using Zustand store)
                    updateVideoModal(modalState.id, { status: 'failed' });
                    break; // Stop polling
                  }
                  console.warn('[Canvas Video Poll] status check error', pollErr, { provider, taskId });
                }
                await new Promise(r => setTimeout(r, pollIntervalMs));
              }
            } catch (e) {
              console.error('Error generating video:', e);
              if (onPersistVideoModalMove) {
                Promise.resolve(onPersistVideoModalMove(modalState.id, { status: 'error' } as any)).catch(console.error);
              }
              // Update status to error (using Zustand store)
              updateVideoModal(modalState.id, { status: 'error' });
            }
            return null;
          }}
          generatedVideoUrl={modalState.generatedVideoUrl}
          initialModel={modalState.model}
          initialFrame={modalState.frame}
          initialAspectRatio={modalState.aspectRatio || (modalState.frameWidth && modalState.frameHeight ? calculateAspectRatioFromDimensions(modalState.frameWidth, modalState.frameHeight) : undefined)}
          initialDuration={modalState.duration || 5}
          initialResolution={modalState.resolution}
          initialPrompt={modalState.prompt}
          error={modalState.error}
          onOptionsChange={(opts) => {
            // Update video modal options (using Zustand store)
            const modal = videoModalStates.find(m => m.id === modalState.id);
            if (modal) {
              updateVideoModal(modalState.id, {
                ...opts,
                duration: (opts as any).duration ?? modal.duration,
                resolution: (opts as any).resolution ?? modal.resolution,
                frameWidth: opts.frameWidth ?? modal.frameWidth,
                frameHeight: opts.frameHeight ?? modal.frameHeight,
                model: opts.model ?? modal.model,
                frame: opts.frame ?? modal.frame,
                aspectRatio: opts.aspectRatio ?? modal.aspectRatio,
                prompt: opts.prompt ?? modal.prompt,
              });
            }
            if (onPersistVideoModalMove) {
              Promise.resolve(onPersistVideoModalMove(modalState.id, opts as any)).catch(console.error);
            }
          }}
          connections={connections}

          images={images}
          isAttachedToChat={isChatOpen && (selectedVideoModalId === modalState.id || selectedVideoModalIds.includes(modalState.id))}
          selectionOrder={
            isChatOpen
              ? (selectedIds ? (selectedIds.includes(modalState.id) ? selectedIds.indexOf(modalState.id) + 1 : undefined)
                : (selectedVideoModalIds.includes(modalState.id) ? selectedVideoModalIds.indexOf(modalState.id) + 1 : (selectedVideoModalId === modalState.id ? 1 : undefined)))
              : undefined
          }
          onSelect={(e) => {
            const isShift = e?.shiftKey || isShiftPressed;
            if (isShift) {
              if (e) e.stopPropagation();
              // Multi-select toggle
              const currentSelected = selectedVideoModalIdsRef.current;
              if (currentSelected.includes(modalState.id)) {
                setSelectedVideoModalIds(currentSelected.filter(id => id !== modalState.id));
                // Remove from selection order
                if (setSelectionOrder) {
                  setSelectionOrder(prev => prev.filter(id => id !== modalState.id));
                }
              } else {
                setSelectedVideoModalIds([...currentSelected, modalState.id]);
                // Add to selection order (append to end) - but only if not already in order
                if (setSelectionOrder) {
                  setSelectionOrder(prev => {
                    // Only add if not already in the order
                    if (!prev.includes(modalState.id)) {
                      return [...prev, modalState.id];
                    }
                    return prev;
                  });
                }
              }
              if (!selectedVideoModalIds.includes(modalState.id)) {
                setSelectedVideoModalId(modalState.id);
              }
            } else {
              // Single select
              clearAllSelections();
              setSelectedVideoModalId(modalState.id);
              setSelectedVideoModalIds([modalState.id]);
              // Reset selection order to just this item
              if (setSelectionOrder) {
                setSelectionOrder([modalState.id]);
              }
            }
          }}
          onDelete={() => {
            console.log('[VideoModalOverlays] onDelete called', {
              timestamp: Date.now(),
              modalId: modalState.id,
            });
            // Clear selection immediately
            setSelectedVideoModalId(null);
            // Call persist delete - it updates parent state (videoGenerators) which flows down as externalVideoModals
            // Canvas will sync videoModalStates with externalVideoModals via useEffect
            if (onPersistVideoModalDelete) {
              console.log('[VideoModalOverlays] Calling onPersistVideoModalDelete', modalState.id);
              // Call synchronously - the handler updates parent state immediately
              const result = onPersistVideoModalDelete(modalState.id);
              // If it returns a promise, handle it
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch(console.error);
              }
            }
            // DO NOT update local state here - let parent state flow down through props
            // The useEffect in Canvas will sync videoModalStates with externalVideoModals
          }}
          onDownload={async () => {
            // Download the generated video if available
            if (modalState.generatedVideoUrl) {
              const { downloadVideo, generateDownloadFilename } = await import('@/core/api/downloadUtils');
              const filename = generateDownloadFilename('generated-video', modalState.id, 'mp4');
              await downloadVideo(modalState.generatedVideoUrl, filename);
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
            // Add duplicated video modal (using Zustand store)
            addVideoModal(duplicated);
            if (onPersistVideoModalCreate) {
              Promise.resolve(onPersistVideoModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedVideoModalId === modalState.id || selectedVideoModalIds.includes(modalState.id)}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            // Update video modal position (using Zustand store)
            updateVideoModal(modalState.id, { x: newX, y: newY });
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistVideoModalMove) {
              Promise.resolve(onPersistVideoModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
          textInputStates={textInputStates}
          onPersistVideoModalCreate={onPersistVideoModalCreate}
        />
      ))}
      {contextMenu && (
        <PluginContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          isPinned={videoModalStates.find((m) => m.id === contextMenu.modalId)?.isPinned}
          onDownload={videoModalStates.find((m) => m.id === contextMenu.modalId)?.generatedVideoUrl ? async () => {
            const modal = videoModalStates.find((m) => m.id === contextMenu.modalId);
            if (modal?.generatedVideoUrl) {
              const { downloadVideo, generateDownloadFilename } = await import('@/core/api/downloadUtils');
              const filename = generateDownloadFilename('generated-video', modal.id, 'mp4');
              await downloadVideo(modal.generatedVideoUrl, filename);
            }
          } : undefined}
          onPin={() => {
            const modal = videoModalStates.find((m) => m.id === contextMenu.modalId);
            if (modal && onPersistVideoModalMove) {
              onPersistVideoModalMove(modal.id, { isPinned: !modal.isPinned });
            }
          }}
          onDuplicate={() => {
            const modal = videoModalStates.find((m) => m.id === contextMenu.modalId);
            if (modal && onPersistVideoModalCreate) {
              const duplicated = {
                id: `video-modal-${Date.now()}`,
                x: modal.x + 600 + 50,
                y: modal.y,
                generatedVideoUrl: modal.generatedVideoUrl,
                model: modal.model,
                frame: modal.frame,
                aspectRatio: modal.aspectRatio,
                prompt: modal.prompt,
                duration: modal.duration,
                frameWidth: modal.frameWidth,
                frameHeight: modal.frameHeight,
              };
              setVideoModalStates((prev) => [...prev, duplicated]);
              Promise.resolve(onPersistVideoModalCreate(duplicated)).catch(console.error);
            }
          }}
          onDelete={() => {
            const modalId = contextMenu.modalId;
            setSelectedVideoModalId(null);
            if (onPersistVideoModalDelete) {
              Promise.resolve(onPersistVideoModalDelete(modalId)).catch(console.error);
              // Remove video modal (using Zustand store)
              removeVideoModal(modalId);
            }
          }}
        />
      )}
    </>
  );
});

VideoModalOverlays.displayName = 'VideoModalOverlays';

