'use client';

import React from 'react';
import { VideoUploadModal } from '@/app/components/GenerationCompo/VideoUploadModal';
import { getReplicateQueueStatus, getReplicateQueueResult, getFalQueueStatus, getFalQueueResult, getMiniMaxVideoStatus, getMiniMaxVideoFile } from '@/lib/api';
import Konva from 'konva';
import { VideoModalState, Connection, ImageModalState, TextModalState } from './types';
import { ImageUpload } from '@/types/canvas';

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
  videoModalStates: VideoModalState[];
  selectedVideoModalId: string | null;
  selectedVideoModalIds: string[];
  clearAllSelections: () => void;
  setVideoModalStates: React.Dispatch<React.SetStateAction<VideoModalState[]>>;
  setSelectedVideoModalId: (id: string | null) => void;
  setSelectedVideoModalIds: (ids: string[]) => void;
  onVideoGenerate?: (prompt: string, model: string, frame: string, aspectRatio: string, duration: number, resolution?: string, modalId?: string, firstFrameUrl?: string, lastFrameUrl?: string) => Promise<{ generationId?: string; taskId?: string; provider?: string } | null>;
  onPersistVideoModalCreate?: (modal: { id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number }) => void | Promise<void>;
  onPersistVideoModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number }>) => void | Promise<void>;
  onPersistVideoModalDelete?: (id: string) => void | Promise<void>;
  connections: Connection[];
  imageModalStates: ImageModalState[];
  images: ImageUpload[];
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  textInputStates?: TextModalState[];
}

export const VideoModalOverlays: React.FC<VideoModalOverlaysProps> = ({
  videoModalStates,
  selectedVideoModalId,
  selectedVideoModalIds,
  clearAllSelections,
  setVideoModalStates,
  setSelectedVideoModalId,
  setSelectedVideoModalIds,
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
}) => {
  return (
    <>
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
              // Optimistic state update with tracking fields
              setVideoModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, model, frame, aspectRatio, prompt, duration: duration || modalState.duration || 5, resolution: resolution || modalState.resolution, taskId, generationId, provider, status: 'submitted' } : m));
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
                      setVideoModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, generatedVideoUrl: videoUrl, status: 'completed' } : m));
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
                    setVideoModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, status: 'failed' } : m));
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
                    setVideoModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, status: 'failed' } : m));
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
              setVideoModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, status: 'error' } : m));
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
          onOptionsChange={(opts) => {
            setVideoModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, ...opts, duration: (opts as any).duration ?? m.duration, resolution: (opts as any).resolution ?? m.resolution, frameWidth: opts.frameWidth ?? m.frameWidth, frameHeight: opts.frameHeight ?? m.frameHeight, model: opts.model ?? m.model, frame: opts.frame ?? m.frame, aspectRatio: opts.aspectRatio ?? m.aspectRatio, prompt: opts.prompt ?? m.prompt } : m));
            if (onPersistVideoModalMove) {
              Promise.resolve(onPersistVideoModalMove(modalState.id, opts as any)).catch(console.error);
            }
          }}
          connections={connections}
          imageModalStates={imageModalStates}
          images={images}
          onSelect={() => {
            // Clear all other selections first
            clearAllSelections();
            // Then set this modal as selected
            setSelectedVideoModalId(modalState.id);
            setSelectedVideoModalIds([modalState.id]);
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
              const { downloadVideo, generateDownloadFilename } = await import('@/lib/downloadUtils');
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
            setVideoModalStates(prev => [...prev, duplicated]);
            if (onPersistVideoModalCreate) {
              Promise.resolve(onPersistVideoModalCreate(duplicated)).catch(console.error);
            }
          }}
          isSelected={selectedVideoModalId === modalState.id || selectedVideoModalIds.includes(modalState.id)}
          x={modalState.x}
          y={modalState.y}
          onPositionChange={(newX, newY) => {
            setVideoModalStates(prev => prev.map(m =>
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
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
        />
      ))}
    </>
  );
};

