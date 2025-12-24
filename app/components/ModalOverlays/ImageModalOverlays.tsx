'use client';

import React, { useState, useEffect } from 'react';
import { ImageUploadModal } from '@/app/components/GenerationCompo/ImageUploadModal/ImageUploadModal';
import Konva from 'konva';
import { ImageModalState, Connection } from './types';
import { downloadImage, generateDownloadFilename } from '@/lib/downloadUtils';
import { ImageUpload } from '@/types/canvas';
import { getReferenceImagesForText } from '@/app/components/Plugins/StoryboardPluginModal/mentionUtils';

/**
 * Calculate aspect ratio string (e.g., "9:16") from width and height
 */
function calculateAspectRatioFromDimensions(width?: number, height?: number): string {
  if (!width || !height || width <= 0 || height <= 0) return '1:1';

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

interface ImageModalOverlaysProps {
  imageModalStates: ImageModalState[];
  selectedImageModalId: string | null;
  selectedImageModalIds: string[];
  clearAllSelections: () => void;
  setImageModalStates: React.Dispatch<React.SetStateAction<ImageModalState[]>>;
  setSelectedImageModalId: (id: string | null) => void;
  setSelectedImageModalIds: (ids: string[]) => void;
  onImageGenerate?: (
    prompt: string,
    model: string,
    frame: string,
    aspectRatio: string,
    modalId?: string,
    imageCount?: number,
    sourceImageUrl?: string,
    sceneNumber?: number,
    previousSceneImageUrl?: string,
    storyboardMetadata?: Record<string, string>,
    width?: number,
    height?: number
  ) => Promise<{ url: string; images?: Array<{ url: string }> } | null>;
  onAddImageToCanvas?: (url: string) => void;
  onPersistImageModalCreate?: (modal: { id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }) => void | Promise<void>;
  onPersistImageModalMove?: (id: string, updates: Partial<{ x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; isGenerating?: boolean }>) => void | Promise<void>;
  onPersistImageModalDelete?: (id: string) => void | Promise<void>;
  onPersistConnectorCreate?: (connector: Connection) => void | Promise<void>;
  connections: Connection[];
  imageModalStatesForConnections: ImageModalState[];
  images: ImageUpload[];
  textInputStates?: Array<{ id: string; value?: string }>;
  stageRef: React.RefObject<Konva.Stage | null>;
  scale: number;
  position: { x: number; y: number };
  sceneFrameModalStates?: Array<{ id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string }>;
  scriptFrameModalStates?: Array<{ id: string; pluginId: string; x: number; y: number; frameWidth: number; frameHeight: number; text: string }>;
  storyboardModalStates?: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null; characterNamesMap?: Record<number, string>; propsNamesMap?: Record<number, string>; backgroundNamesMap?: Record<number, string> }>;
  isComponentDraggable?: (id: string) => boolean;
}

export const ImageModalOverlays: React.FC<ImageModalOverlaysProps> = ({
  imageModalStates,
  selectedImageModalId,
  selectedImageModalIds,
  clearAllSelections,
  setImageModalStates,
  setSelectedImageModalId,
  setSelectedImageModalIds,
  onImageGenerate,
  onAddImageToCanvas,
  onPersistImageModalCreate,
  onPersistImageModalMove,
  onPersistImageModalDelete,
  onPersistConnectorCreate,
  connections,
  imageModalStatesForConnections,
  images,
  textInputStates = [],
  stageRef,
  scale,
  position,
  sceneFrameModalStates = [],
  scriptFrameModalStates = [],
  storyboardModalStates = [],
  isComponentDraggable,
}) => {
  return (
    <>
      {imageModalStates.map((modalState) => (
        <ImageUploadModal
          key={modalState.id}
          isOpen={true}
          id={modalState.id}
          draggable={isComponentDraggable ? isComponentDraggable(modalState.id) : true}
          onClose={() => {
            setImageModalStates(prev => prev.filter(m => m.id !== modalState.id));
            setSelectedImageModalId(null);
            if (onPersistImageModalDelete) {
              Promise.resolve(onPersistImageModalDelete(modalState.id)).catch(console.error);
            }
          }}
          refImages={(() => {
            // Build a flat refImages map from ALL storyboards' namedImages
            const refMap: Record<string, string> = {};
            storyboardModalStates.forEach(storyboard => {
              if ((storyboard as any).namedImages) {
                const namedImages = (storyboard as any).namedImages;
                // Flatten characters
                if (namedImages.characters) {
                  Object.entries(namedImages.characters).forEach(([name, url]) => {
                    refMap[name.toLowerCase().trim()] = url as string;
                  });
                }
                // Flatten backgrounds
                if (namedImages.backgrounds) {
                  Object.entries(namedImages.backgrounds).forEach(([name, url]) => {
                    refMap[name.toLowerCase().trim()] = url as string;
                  });
                }
                // Flatten props
                if (namedImages.props) {
                  Object.entries(namedImages.props).forEach(([name, url]) => {
                    refMap[name.toLowerCase().trim()] = url as string;
                  });
                }
              }
            });
            console.log('[ImageModalOverlays] 🗺️ Built refImages map:', refMap);
            return refMap;
          })()}  // Pass flat refImages map for easy lookup
          sourceImageUrl={(() => {
            const sourceUrl = modalState.sourceImageUrl;
            console.log('[ImageModalOverlays] 🚨 CRITICAL: About to render ImageUploadModal:', {
              modalId: modalState.id,
              hasSourceImageUrlInModalState: !!sourceUrl,
              sourceImageUrlValue: sourceUrl || 'UNDEFINED/NULL',
              sourceImageUrlPreview: sourceUrl ? sourceUrl.substring(0, 100) + '...' : 'UNDEFINED/NULL',
              modalStateKeys: Object.keys(modalState),
              fullModalState: modalState,
            });
            // Belt-and-suspenders: allow only stitched refs; drop legacy comma lists
            if (!sourceUrl) return undefined;
            if (sourceUrl.includes('reference-stitched')) return sourceUrl;
            if (sourceUrl.includes(',')) return undefined;
            return sourceUrl;
          })()}  // CRITICAL: Pass sanitized sourceImageUrl (stitched-only) for scene generation
          onImageGenerate={async (prompt, model, frame, aspectRatio, modalId, imageCount, sourceImageUrlFromModal, width, height) => {
            console.log('[ImageModalOverlays] onGenerate called!', {
              modalId: modalState.id,
              hasOnImageGenerate: !!onImageGenerate,
              sourceImageUrlFromModal: sourceImageUrlFromModal ? sourceImageUrlFromModal.substring(0, 100) + '...' : 'NONE',
            });
            if (onImageGenerate) {
              try {
                const imageCount = modalState.imageCount || 1;

                // CRITICAL: Prioritize sourceImageUrl passed from ImageUploadModal (for simple image-to-image)
                // Fall back to modalState.sourceImageUrl only for scene-based generation
                let sourceImageUrl: string | undefined = sourceImageUrlFromModal || modalState.sourceImageUrl || undefined;
                const sceneNumber = (modalState as any).sceneNumber;

                console.log('[ImageModalOverlays] 🎯 Source image URL priority:', {
                  fromModalProp: sourceImageUrlFromModal ? sourceImageUrlFromModal.substring(0, 100) + '...' : 'NONE',
                  fromModalState: modalState.sourceImageUrl ? modalState.sourceImageUrl.substring(0, 100) + '...' : 'NONE',
                  finalChoice: sourceImageUrl ? sourceImageUrl.substring(0, 100) + '...' : 'NONE',
                });

                console.log('[ImageModalOverlays] 🔍 Checking modalState.sourceImageUrl:', {
                  modalId: modalState.id,
                  hasSourceImageUrl: !!modalState.sourceImageUrl,
                  sourceImageUrl: modalState.sourceImageUrl || 'NONE - will try to build from connected scene',
                  sourceImageUrlPreview: modalState.sourceImageUrl ? modalState.sourceImageUrl.substring(0, 100) + '...' : 'NONE',
                  sceneNumber,
                  isStitchedImage: modalState.sourceImageUrl?.includes('reference-stitched'),
                  isCommaSeparated: modalState.sourceImageUrl?.includes(','),
                });

                // CRITICAL: If modal state already has a stitched image URL, use it and don't override!
                if (sourceImageUrl && sourceImageUrl.includes('reference-stitched')) {
                  console.log('[ImageModalOverlays] ✅ Modal state already has stitched image URL (contains both images). Using it directly.');
                  // Don't override - the stitched image already contains both images combined
                }

                // For Scene 1: Prefer stitched image URL (contains both images combined)
                // If sourceImageUrl is comma-separated (individual images), try to get stitched image from snapshot
                if (sceneNumber === 1 && sourceImageUrl && sourceImageUrl.includes(',') && !sourceImageUrl.includes('reference-stitched')) {
                  console.warn('[ImageModalOverlays] ⚠️ Scene 1 has comma-separated images. Trying to get stitched image from snapshot...');
                  // Try to get stitched image from snapshot metadata
                  try {
                    const { getCurrentSnapshot } = await import('@/lib/canvasApi');
                    // Try to get projectId from multiple sources
                    let projectId: string | null = null;

                    // 1. Try from URL params
                    const urlParams = new URLSearchParams(window.location.search);
                    projectId = urlParams.get('projectId');

                    // 2. Try from window global
                    if (!projectId) {
                      projectId = (window as any).__PROJECT_ID__ || (window as any).projectId;
                    }

                    // 3. Try from storyboard connection (if available)
                    if (!projectId) {
                      const sceneConnection = connections.find(c => c.to === modalState.id);
                      if (sceneConnection && storyboardModalStates) {
                        const connectedScene = sceneFrameModalStates?.find(s => s.id === sceneConnection.from);
                        if (connectedScene && scriptFrameModalStates) {
                          const parentScript = scriptFrameModalStates.find(s => s.id === connectedScene.scriptFrameId);
                          if (parentScript && storyboardModalStates) {
                            const sourceStoryboard = storyboardModalStates.find(sb => sb.id === parentScript.pluginId);
                            // Storyboard might have projectId in meta, but it's unlikely
                            // For now, we'll rely on URL or window global
                          }
                        }
                      }
                    }

                    if (projectId) {
                      const current = await getCurrentSnapshot(projectId);
                      const stitchedImageData = (current?.snapshot?.metadata || {})['stitched-image'] as Record<string, string> | undefined;

                      if (stitchedImageData && typeof stitchedImageData === 'object') {
                        const stitchedUrl = Object.values(stitchedImageData)[0];
                        if (stitchedUrl && typeof stitchedUrl === 'string') {
                          sourceImageUrl = stitchedUrl;
                          console.log('[ImageModalOverlays] ✅ Scene 1: Using stitched image from snapshot (contains both images):', {
                            url: stitchedUrl.substring(0, 100) + '...',
                          });
                        } else {
                          console.warn('[ImageModalOverlays] ⚠️ Stitched image found in snapshot but URL is invalid');
                        }
                      } else {
                        console.warn('[ImageModalOverlays] ⚠️ No stitched-image found in snapshot metadata');
                      }
                    } else {
                      console.warn('[ImageModalOverlays] ⚠️ No projectId available to fetch stitched image from snapshot. Will use comma-separated images as fallback.');
                    }
                  } catch (error) {
                    console.error('[ImageModalOverlays] ❌ Failed to get stitched image from snapshot:', error);
                    // Keep the comma-separated images as fallback
                  }
                }

                console.log('[ImageModalOverlays] 🔍 Final sourceImageUrl decision:', {
                  modalId: modalState.id,
                  hasSourceImageUrl: !!sourceImageUrl,
                  sourceImageUrlFromState: sourceImageUrl ? `${sourceImageUrl.substring(0, 100)}...` : 'none',
                  sourceImageUrlCount: sourceImageUrl ? sourceImageUrl.split(',').length : 0,
                  isStitchedImage: sourceImageUrl?.includes('reference-stitched'),
                  isCommaSeparated: sourceImageUrl?.includes(','),
                });

                // If sourceImageUrl is not already set, try to resolve it from scene connections using namedImages
                if (!sourceImageUrl) {
                  // Check if this image generator is connected to a Scene Frame
                  const sceneConnection = connections.find(c => c.to === modalState.id);
                  if (sceneConnection && sceneFrameModalStates) {
                    const connectedScene = sceneFrameModalStates.find(s => s.id === sceneConnection.from);

                    if (connectedScene && scriptFrameModalStates && scriptFrameModalStates.length > 0) {
                      const parentScript = scriptFrameModalStates.find(s => s.id === connectedScene.scriptFrameId);

                      if (parentScript && storyboardModalStates && storyboardModalStates.length > 0) {
                        const sourceStoryboard = storyboardModalStates.find(sb => sb.id === parentScript.pluginId);

                        if (sourceStoryboard && (sourceStoryboard as any).namedImages) {
                          console.log('[ImageModalOverlays] ✅ Found source Storyboard with namedImages:', sourceStoryboard.id);
                          const namedImages = (sourceStoryboard as any).namedImages;
                          const referenceImageUrls: string[] = [];

                          // Match character names from scene to namedImages
                          if ((connectedScene as any).characterNames && Array.isArray((connectedScene as any).characterNames)) {
                            (connectedScene as any).characterNames.forEach((charName: string) => {
                              if (charName && namedImages.characters) {
                                const normalizedName = charName.toLowerCase().trim();
                                let matchedImageUrl = namedImages.characters[normalizedName];

                                // Fuzzy matching if exact match not found
                                if (!matchedImageUrl) {
                                  const matchedKey = Object.keys(namedImages.characters).find(key => {
                                    const normalizedKey = key.toLowerCase().trim();
                                    return normalizedKey === normalizedName ||
                                      normalizedKey.includes(normalizedName) ||
                                      normalizedName.includes(normalizedKey);
                                  });
                                  if (matchedKey) {
                                    matchedImageUrl = namedImages.characters[matchedKey];
                                  }
                                }

                                if (matchedImageUrl) {
                                  referenceImageUrls.push(matchedImageUrl);
                                  console.log(`[ImageModalOverlays] ✅ Matched character "${charName}" -> image URL`);
                                }
                              }
                            });
                          }

                          // Match location name from scene to namedImages
                          if ((connectedScene as any).locationName && namedImages.backgrounds) {
                            const normalizedLocationName = (connectedScene as any).locationName.toLowerCase().trim();
                            let matchedImageUrl = namedImages.backgrounds[normalizedLocationName];

                            // Fuzzy matching
                            if (!matchedImageUrl) {
                              const matchedKey = Object.keys(namedImages.backgrounds).find(key => {
                                const normalizedKey = key.toLowerCase().trim();
                                return normalizedKey === normalizedLocationName ||
                                  normalizedKey.includes(normalizedLocationName) ||
                                  normalizedLocationName.includes(normalizedKey);
                              });
                              if (matchedKey) {
                                matchedImageUrl = namedImages.backgrounds[matchedKey];
                              }
                            }

                            if (matchedImageUrl) {
                              referenceImageUrls.push(matchedImageUrl);
                              console.log(`[ImageModalOverlays] ✅ Matched location "${(connectedScene as any).locationName}" -> image URL`);
                            }
                          }

                          // Match props mentioned in scene content
                          if (namedImages.props && Object.keys(namedImages.props).length > 0) {
                            Object.entries(namedImages.props).forEach(([propName, imageUrl]: [string, any]) => {
                              const propNameRegex = new RegExp(`\\b${propName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                              if (propNameRegex.test(connectedScene.content || '')) {
                                referenceImageUrls.push(imageUrl as string);
                                console.log(`[ImageModalOverlays] ✅ Matched prop "${propName}" mentioned in scene -> image URL`);
                              }
                            });
                          }

                          if (referenceImageUrls.length > 0) {
                            sourceImageUrl = referenceImageUrls.join(',');
                            console.log('[ImageModalOverlays] ✅ Matched reference images from namedImages:', {
                              count: referenceImageUrls.length,
                              urls: referenceImageUrls.map(url => url.substring(0, 60) + '...'),
                            });
                          } else {
                            console.warn('[ImageModalOverlays] ⚠️ No images matched from namedImages, falling back to old method');
                            // Fallback to old method if namedImages matching fails
                            const referenceImageUrls = getReferenceImagesForText({
                              text: connectedScene.content || '',
                              characterNamesMap: sourceStoryboard.characterNamesMap || {},
                              backgroundNamesMap: sourceStoryboard.backgroundNamesMap || {},
                              propsNamesMap: sourceStoryboard.propsNamesMap || {},
                              connectedCharacterImages: [],
                              connectedBackgroundImages: [],
                              connectedPropsImages: [],
                            });
                            if (referenceImageUrls.length > 0) {
                              sourceImageUrl = referenceImageUrls.join(',');
                            }
                          }
                        }
                      }
                    }
                  }
                }

                // Extract scene metadata from modal state or scene connection
                let extractedSceneNumber: number | undefined = (modalState as any).sceneNumber;
                let extractedStoryboardMetadata: Record<string, string> | undefined = (modalState as any).storyboardMetadata;
                let extractedPreviousSceneImageUrl: string | undefined = undefined;

                // If scene metadata not in modal state, try to extract from scene connection
                if (!extractedSceneNumber || !extractedStoryboardMetadata) {
                  const sceneConnection = connections.find(c => c.to === modalState.id);
                  if (sceneConnection && sceneFrameModalStates) {
                    const connectedScene = sceneFrameModalStates.find(s => s.id === sceneConnection.from);
                    if (connectedScene) {
                      extractedSceneNumber = connectedScene.sceneNumber;

                      // Build storyboard metadata from scene
                      if (!extractedStoryboardMetadata) {
                        extractedStoryboardMetadata = {};
                        if ((connectedScene as any).characterNames && Array.isArray((connectedScene as any).characterNames)) {
                          extractedStoryboardMetadata.character = (connectedScene as any).characterNames.join(', ');
                        }
                        if ((connectedScene as any).locationName) {
                          extractedStoryboardMetadata.background = (connectedScene as any).locationName;
                        }
                        if ((connectedScene as any).mood) {
                          extractedStoryboardMetadata.mood = (connectedScene as any).mood;
                        }
                      }

                      // For Scene 2+, find previous scene's generated image
                      if (extractedSceneNumber > 1) {
                        const previousSceneNumber = extractedSceneNumber - 1;
                        const previousScene = sceneFrameModalStates.find(s =>
                          s.scriptFrameId === connectedScene.scriptFrameId &&
                          s.sceneNumber === previousSceneNumber
                        );
                        if (previousScene) {
                          const prevConnection = connections.find(c => c.from === previousScene.id);
                          if (prevConnection) {
                            const prevImageModal = imageModalStatesForConnections.find(m => m.id === prevConnection.to);
                            if (prevImageModal && prevImageModal.generatedImageUrl) {
                              extractedPreviousSceneImageUrl = prevImageModal.generatedImageUrl;
                              console.log(`[ImageModalOverlays] ✅ Scene ${extractedSceneNumber}: Found previous scene image`);
                            }
                          }
                        }
                      }
                    }
                  }
                }

                // CRITICAL: For Scene 1, use ONLY reference images (no previous scene)
                // For Scene 2+, keep reference images separate from previous scene image
                // The backend will combine them correctly
                let finalSourceImageUrl = sourceImageUrl; // Reference images only

                console.log('[ImageModalOverlays] 🚀 STEP 4.5: Final payload for generation:', {
                  modalId: modalState.id,
                  hasSourceImageUrl: !!finalSourceImageUrl,
                  sourceImageUrl: finalSourceImageUrl || 'NONE',
                  sourceImageUrlFull: finalSourceImageUrl,
                  sourceImageUrlCount: finalSourceImageUrl ? finalSourceImageUrl.split(',').length : 0,
                  sceneNumber: extractedSceneNumber,
                  hasPreviousSceneImage: !!extractedPreviousSceneImageUrl,
                  previousSceneImageUrl: extractedPreviousSceneImageUrl || 'NONE',
                  previousSceneImageUrlFull: extractedPreviousSceneImageUrl,
                  hasStoryboardMetadata: !!extractedStoryboardMetadata,
                  storyboardMetadata: extractedStoryboardMetadata,
                  willUseImageToImage: !!finalSourceImageUrl || !!extractedPreviousSceneImageUrl,
                });

                // CRITICAL: Ensure sourceImageUrl is passed to onImageGenerate
                if (!finalSourceImageUrl && !extractedPreviousSceneImageUrl) {
                  console.warn('[ImageModalOverlays] ⚠️ WARNING: No sourceImageUrl or previousSceneImageUrl found! Will use text-to-image mode.');
                } else {
                  console.log('[ImageModalOverlays] ✅ Reference images will be passed to API (image-to-image mode)');
                }

                // CRITICAL: Use the modalId parameter (targetModalId) instead of modalState.id
                // When creating a new frame for image-to-image, modalId will be the NEW frame's ID
                const targetFrameId = modalId || modalState.id;

                console.log('[ImageModalOverlays] 🎯 Target frame determination:', {
                  modalIdParam: modalId || 'NONE',
                  modalStateId: modalState.id,
                  targetFrameId,
                  willUpdateNewFrame: modalId !== modalState.id,
                });

                const result = await onImageGenerate(
                  prompt,
                  model,
                  frame,
                  aspectRatio,
                  targetFrameId,
                  imageCount,
                  finalSourceImageUrl, // Reference images only (for Scene 1, this is all we need)
                  extractedSceneNumber, // Scene number
                  extractedPreviousSceneImageUrl, // Previous scene image (Scene 2+ only)
                  extractedStoryboardMetadata, // Storyboard metadata
                  width,
                  height
                );
                if (result) {
                  // Extract image URLs
                  const imageUrls = result.images && result.images.length > 0
                    ? result.images.map(img => img.url)
                    : result.url
                      ? [result.url]
                      : [];

                  // CRITICAL: Update the TARGET frame (which may be a new frame), not the current frame
                  // Compute frame size: width fixed 600, height based on aspect ratio (min 400)
                  // This ensures the frame maintains the correct aspect ratio (e.g., 1:1 stays 1:1)
                  const [w, h] = aspectRatio.split(':').map(Number);
                  const frameWidth = 600;
                  const ar = w && h ? (w / h) : 1;
                  const rawHeight = ar ? Math.round(frameWidth / ar) : 600;
                  const frameHeight = Math.max(400, rawHeight);

                  setImageModalStates(prev => prev.map(m => m.id === targetFrameId ? {
                    ...m,
                    generatedImageUrl: imageUrls[0] || null,
                    generatedImageUrls: imageUrls,
                    isGenerating: false,
                    aspectRatio, // Preserve aspect ratio
                    frameWidth, // Update frame dimensions based on aspect ratio
                    frameHeight, // Update frame dimensions based on aspect ratio
                  } : m));
                  if (onPersistImageModalMove) {
                    Promise.resolve(onPersistImageModalMove(targetFrameId, {
                      generatedImageUrl: imageUrls[0] || null,
                      generatedImageUrls: imageUrls,
                      model,
                      frame,
                      aspectRatio, // Preserve aspect ratio
                      frameWidth, // Use calculated dimensions based on aspect ratio
                      frameHeight, // Use calculated dimensions based on aspect ratio
                      prompt,
                      isGenerating: false,
                    } as any)).catch(console.error);
                  }

                  return result;
                }
                return null;
              } catch (error) {
                console.error('[ImageModalOverlays] Failed to generate image:', error);
                return null;
              }
            }
            return null;
          }}
          generatedImageUrl={modalState.generatedImageUrl}
          generatedImageUrls={modalState.generatedImageUrls}
          isGenerating={modalState.isGenerating}
          initialModel={modalState.model}
          initialFrame={modalState.frame}
          initialAspectRatio={modalState.aspectRatio || (modalState.frameWidth && modalState.frameHeight ? calculateAspectRatioFromDimensions(modalState.frameWidth, modalState.frameHeight) : undefined)}
          initialPrompt={modalState.prompt}
          frameWidth={modalState.frameWidth}
          frameHeight={modalState.frameHeight}
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
            console.log('[ImageModalOverlays] onDelete called', {
              timestamp: Date.now(),
              modalId: modalState.id,
            });
            // Clear selection immediately
            setSelectedImageModalId(null);
            // Call persist delete - it updates parent state (imageGenerators) which flows down as externalImageModals
            // Canvas will sync imageModalStates with externalImageModals via useEffect
            if (onPersistImageModalDelete) {
              console.log('[ImageModalOverlays] Calling onPersistImageModalDelete', modalState.id);
              // Call synchronously - the handler updates parent state immediately
              const result = onPersistImageModalDelete(modalState.id);
              // If it returns a promise, handle it
              if (result && typeof result.then === 'function') {
                Promise.resolve(result).catch(console.error);
              }
            }
            // DO NOT update local state here - let parent state flow down through props
            // The useEffect in Canvas will sync imageModalStates with externalImageModals
          }}
          onDownload={async () => {
            // Download the generated image if available
            if (modalState.generatedImageUrl) {
              const filename = generateDownloadFilename('generated-image', modalState.id, 'png');
              await downloadImage(modalState.generatedImageUrl, filename);
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
          onPositionChange={(newX, newY) => {
            setImageModalStates(prev => prev.map(m =>
              m.id === modalState.id ? { ...m, x: newX, y: newY } : m
            ));
          }}
          onPositionCommit={(finalX, finalY) => {
            if (onPersistImageModalMove) {
              Promise.resolve(onPersistImageModalMove(modalState.id, { x: finalX, y: finalY })).catch(console.error);
            }
          }}
          stageRef={stageRef}
          scale={scale}
          position={position}
          onPersistImageModalCreate={onPersistImageModalCreate}

          initialCount={modalState.imageCount}
          onUpdateModalState={(modalId, updates) => {
            setImageModalStates(prev => prev.map(m => m.id === modalId ? { ...m, ...updates } : m));
            if (onPersistImageModalMove) {
              Promise.resolve(onPersistImageModalMove(modalId, updates)).catch(console.error);
            }
          }}
          connections={connections}
          imageModalStates={imageModalStatesForConnections}
          images={images}
          textInputStates={textInputStates}
          sceneFrameModalStates={sceneFrameModalStates}
          scriptFrameModalStates={scriptFrameModalStates}
          storyboardModalStates={storyboardModalStates}
          onPersistConnectorCreate={onPersistConnectorCreate}
        />
      ))}
    </>
  );
};

