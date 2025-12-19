import { ImageUpload } from '@/types/canvas';
import { CanvasAppState, CanvasAppSetters } from '../types';
import { buildProxyResourceUrl } from '@/lib/proxyUtils';

export interface ImageHandlers {
  handleImageUpdate: (index: number, updates: Partial<ImageUpload>) => void;
  handleImageDelete: (index: number) => void;
  handleImageDownload: (index: number) => Promise<void>;
  handleImageDuplicate: (index: number) => void;
  handleImageUpload: (file: File) => void;
  handleImagesDrop: (files: File[]) => void;
  handleImageSelect: (file: File) => void;
  handleImageGenerate: (
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
  handleTextCreate: (text: string, x: number, y: number) => void;
  handleAddImageToCanvas: (url: string) => Promise<void>;
}

export function createImageHandlers(
  state: CanvasAppState,
  setters: CanvasAppSetters,
  projectId: string | null,
  opManagerInitialized: boolean,
  appendOp: (op: any) => Promise<void>,
  realtimeActive: boolean,
  realtimeRef: React.RefObject<any>,
  viewportCenterRef: React.RefObject<{ x: number; y: number; scale: number }>,
  processMediaFile: (file: File, offsetIndex?: number) => Promise<void>
): ImageHandlers {
  const handleImageUpdate = (index: number, updates: Partial<ImageUpload>) => {
    setters.setImages((prev) => {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], ...updates };
      return newImages;
    });

    // Send move op to server if position changed
    if (projectId && opManagerInitialized && (updates.x !== undefined || updates.y !== undefined)) {
      const image = state.images[index];
      const deltaX = updates.x !== undefined ? updates.x - (image.x || 0) : 0;
      const deltaY = updates.y !== undefined ? updates.y - (image.y || 0) : 0;

      if (deltaX !== 0 || deltaY !== 0) {
        const elementId = (image as any).elementId || `img-${index}`;
        appendOp({
          type: 'move',
          elementId,
          data: { delta: { x: deltaX, y: deltaY } },
          inverse: {
            type: 'move',
            elementId,
            data: { delta: { x: -deltaX, y: -deltaY } },
            requestId: '',
            clientTs: 0,
          } as any,
        } as any).catch(console.error);
      }
    }

    // Realtime broadcast for smooth media moves/resizes
    const current = state.images[index];
    const id = (current as any)?.elementId;
    if (realtimeActive && id) {
      const mediaUpdate: any = {};
      if (updates.x !== undefined) mediaUpdate.x = updates.x;
      if (updates.y !== undefined) mediaUpdate.y = updates.y;
      if (updates.width !== undefined) mediaUpdate.width = updates.width;
      if (updates.height !== undefined) mediaUpdate.height = updates.height;
      if (updates.rotation !== undefined) mediaUpdate.rotation = updates.rotation;
      if (Object.keys(mediaUpdate).length) {
        console.log('[Realtime] media.update', id, Object.keys(mediaUpdate));
        realtimeRef.current?.sendMediaUpdate(id, mediaUpdate);
      }
    }
  };

  const handleImageDelete = (index: number) => {
    const image = state.images[index];

    setters.setImages((prev) => {
      const newImages = [...prev];
      // Clean up blob URL if it exists
      const item = newImages[index];
      if (item?.url && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
      // Remove the item
      newImages.splice(index, 1);
      return newImages;
    });

    // Realtime broadcast for delete
    const id = (image as any)?.elementId;
    if (realtimeActive && id) {
      console.log('[Realtime] media.delete', id);
      realtimeRef.current?.sendMediaDelete(id);
    }

    // Send delete op to server (with inverse create)
    if (projectId && opManagerInitialized) {
      const elementId = (image as any).elementId || `img-${index}`;
      const elType = image.type === 'image' ? 'image' : image.type === 'video' ? 'video' : image.type === 'text' ? 'text' : image.type === 'model3d' ? 'model3d' : 'image';
      const meta: any = image.type === 'text' ? { text: image.text } : { url: image.url };
      appendOp({
        type: 'delete',
        elementId,
        data: {},
        inverse: {
          type: 'create',
          elementId,
          data: {
            element: {
              id: elementId,
              type: elType,
              x: image.x || 0,
              y: image.y || 0,
              width: image.width || 400,
              height: image.height || 400,
              meta,
            },
          },
          requestId: '',
          clientTs: 0,
        } as any,
      } as any).catch(console.error);
    }
  };

  const handleImageDownload = async (index: number) => {
    const imageData = state.images[index];
    if (!imageData?.url) return;

    try {
      const { downloadFile, generateDownloadFilename } = await import('@/lib/downloadUtils');
      
      // Determine file extension based on type
      const extension = imageData.type === 'video' ? 'mp4' : imageData.type === 'model3d' ? 'gltf' : 'png';
      const prefix = imageData.type === 'video' ? 'video' : imageData.type === 'model3d' ? 'model' : 'image';
      
      // Generate filename
      let filename: string;
      if (imageData.file?.name) {
        filename = imageData.file.name;
      } else {
        filename = generateDownloadFilename(prefix, `image-${index}`, extension);
      }

      // Use downloadFile utility which handles Zata URLs, CORS, and proper download
      await downloadFile(imageData.url, filename);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Failed to download. Please try again.');
    }
  };

  const handleImageDuplicate = (index: number) => {
    const imageData = state.images[index];
    if (!imageData) return;

    // Create a duplicate to the right
    const imageWidth = imageData.width || 400;
    const duplicated: ImageUpload = {
      ...imageData,
      x: (imageData.x || 0) + imageWidth + 50, // Image width + 50px spacing
      y: imageData.y || 0, // Same Y position
    };

    // If it's a blob URL, we need to create a new blob URL
    if (imageData.url && imageData.url.startsWith('blob:') && imageData.file) {
      duplicated.url = URL.createObjectURL(imageData.file);
      duplicated.file = imageData.file;
    }

    setters.setImages((prev) => [...prev, duplicated]);

    // Realtime broadcast for duplicate as create
    const id = (duplicated as any)?.elementId;
    if (realtimeActive && id) {
      const kind = duplicated.type === 'image' ? 'image' : duplicated.type === 'video' ? 'video' : duplicated.type === 'text' ? 'text' : 'model3d';
      console.log('[Realtime] media.create duplicate', id);
      realtimeRef.current?.sendMediaCreate({ id, kind, x: duplicated.x || 0, y: duplicated.y || 0, width: duplicated.width, height: duplicated.height, url: duplicated.url });
    }
  };

  const handleImageUpload = (file: File) => {
    processMediaFile(file, state.images.length);
  };

  const handleImagesDrop = (files: File[]) => {
    // Process multiple files with slight offsets
    files.forEach((file, index) => {
      processMediaFile(file, state.images.length + index);
    });
  };

  const handleImageSelect = (file: File) => {
    // Process the selected image file
    processMediaFile(file, state.images.length);
  };

  const handleImageGenerate = async (
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
  ): Promise<{ url: string; images?: Array<{ url: string }> } | null> => {
    console.log('Generate image:', { prompt, model, frame, aspectRatio, modalId, imageCount, width, height });

    // Ensure we have a project ID
    if (!projectId) {
      throw new Error('Project not initialized. Please refresh the page.');
    }

    const queuedCount = Math.max(1, imageCount || 1);
    const baseId = `${modalId || 'image'}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const jobEntries: any[] = Array.from({ length: queuedCount }, (_, idx) => ({
      id: `${baseId}-${idx}`,
      type: 'image' as const,
      operationName: 'Generating Image',
      prompt: (prompt || '').trim() || 'Untitled prompt',
      model,
      total: queuedCount,
      index: idx + 1,
      startedAt: Date.now(),
    }));
    setters.setGenerationQueue((prev) => [...prev, ...jobEntries]);

    try {
      // Parse aspect ratio to get width/height if needed
      const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
      const aspectRatioValue = widthRatio / heightRatio;
      const baseSize = 1024; // Base size for generation
      let genWidth: number;
      let genHeight: number;

      if (aspectRatioValue >= 1) {
        // Landscape or square
        genWidth = Math.round(baseSize * aspectRatioValue);
        genHeight = baseSize;
      } else {
        // Portrait
        genWidth = baseSize;
        genHeight = Math.round(baseSize / aspectRatioValue);
      }

      // Resolve stitched reference from snapshot metadata (belt-and-suspenders override)
      let effectiveSourceImageUrl = sourceImageUrl;
      if (projectId) {
        try {
          const { getCurrentSnapshot } = await import('@/lib/canvasApi');
          const current = await getCurrentSnapshot(projectId);
          const stitchedMeta = (current?.snapshot?.metadata as any)?.stitchedimage as any;
          let stitchedUrl: string | undefined;
          if (stitchedMeta) {
            if (typeof stitchedMeta === 'string') {
              stitchedUrl = stitchedMeta;
            } else if (typeof stitchedMeta === 'object') {
              const entries = Object.entries(stitchedMeta) as Array<[string, string]>;
              if (entries.length > 0) {
                const last = entries[entries.length - 1][1];
                stitchedUrl = last;
              }
            }
          }
          if (stitchedUrl && (!effectiveSourceImageUrl || effectiveSourceImageUrl.includes(','))) {
            effectiveSourceImageUrl = stitchedUrl;
            console.log('[handleImageGenerate] 🔄 Overriding sourceImageUrl with stitched snapshot URL (from metadata.stitchedimage)');
          }
        } catch (e) {
          console.warn('[handleImageGenerate] Failed to read snapshot metadata for stitchedimage:', e);
        }
      }

      // Call the Canvas-specific generation API
      const { generateImageForCanvas } = await import('@/lib/api');
      console.log('[handleImageGenerate] 🎨 Calling generateImageForCanvas with:', {
        prompt: prompt.substring(0, 100) + '...',
        model,
        aspectRatio,
        imageCount: queuedCount,
        sourceImageUrl: effectiveSourceImageUrl ? `${effectiveSourceImageUrl.substring(0, 100)}...` : 'none',
        sourceImageUrlCount: effectiveSourceImageUrl ? effectiveSourceImageUrl.split(',').length : 0,
        isCommaSeparated: effectiveSourceImageUrl?.includes(','),
        willUseImageToImage: !!effectiveSourceImageUrl,
      });

      if (!effectiveSourceImageUrl) {
        console.warn('[handleImageGenerate] ⚠️ WARNING: No sourceImageUrl provided! Will use text-to-image mode.');
      } else {
        console.log('[handleImageGenerate] ✅ sourceImageUrl provided - will use image-to-image mode');
      }
      const result = await generateImageForCanvas(
        prompt,
        model,
        aspectRatio,
        projectId,
        width || genWidth,
        height || genHeight,
        queuedCount,
        effectiveSourceImageUrl,
        sceneNumber,
        previousSceneImageUrl,
        storyboardMetadata
      );

      console.log('Image generated successfully:', result);
      
      // Remove queue items immediately after generation completes
      const jobIdSet = new Set(jobEntries.map((entry) => entry.id));
      setters.setGenerationQueue((prev) => prev.filter((job) => !jobIdSet.has(job.id)));

      // Return URL(s) for generator overlay
      // Always return images array if present (even for single image when imageCount > 1)
      if (result.images && Array.isArray(result.images) && result.images.length > 0) {
        return {
          url: result.url,
          images: result.images.map(img => ({ url: img.url })),
        };
      }
      // Fallback to single URL
      return { url: result.url };
    } catch (error: any) {
      console.error('Error generating image:', error);
      // Remove from queue on error
      const jobIdSet = new Set(jobEntries.map((entry) => entry.id));
      setters.setGenerationQueue((prev) => prev.filter((job) => !jobIdSet.has(job.id)));
      alert(error.message || 'Failed to generate image. Please try again.');
      throw error; // Re-throw to let the modal handle the error display
    }
  };

  const handleTextCreate = (text: string, x: number, y: number) => {
    const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newText: ImageUpload = {
      type: 'text',
      text,
      x,
      y,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
      elementId,
    };
    setters.setImages((prev) => [...prev, newText]);

    if (realtimeActive) {
      console.log('[Realtime] media.create text', elementId);
      realtimeRef.current?.sendMediaCreate({ id: elementId, kind: 'text', x: newText.x || 0, y: newText.y || 0, width: newText.width, height: newText.height, url: undefined });
    }

    // Send create op to server
    if (projectId && opManagerInitialized) {
      appendOp({
        type: 'create',
        elementId,
        data: {
          element: {
            id: elementId,
            type: 'text',
            x: newText.x,
            y: newText.y,
            width: newText.width,
            height: newText.height,
            meta: {
              text: text,
            },
          },
        },
        inverse: { type: 'delete', elementId, data: {}, requestId: '', clientTs: 0 } as any,
      }).catch(console.error);
    }
  };

  const handleAddImageToCanvas = async (url: string) => {
    try {
      // Load image to compute display dimensions
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.crossOrigin = 'anonymous';
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = url;
      });

      // Keep original image dimensions - no scaling
      const displayWidth = img.naturalWidth || img.width;
      const displayHeight = img.naturalHeight || img.height;

      // Place at current viewport center
      const center = viewportCenterRef.current;
      const imageX = center.x - displayWidth / 2;
      const imageY = center.y - displayHeight / 2;

      const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newImage: ImageUpload = {
        type: 'image',
        url,
        x: imageX,
        y: imageY,
        width: displayWidth,
        height: displayHeight,
        elementId,
      };

      setters.setImages((prev) => {
        // avoid duplicates by elementId
        if (prev.some(img => (img as any).elementId === elementId)) return prev;
        return [...prev, newImage];
      });

      if (realtimeActive) {
        console.log('[Realtime] media.create addToCanvas', elementId);
        realtimeRef.current?.sendMediaCreate({ id: elementId, kind: 'image', x: imageX, y: imageY, width: displayWidth, height: displayHeight, url });
      }

      if (projectId && opManagerInitialized) {
        await appendOp({
          type: 'create',
          elementId,
          data: {
            element: {
              id: elementId,
              type: 'image',
              x: imageX,
              y: imageY,
              width: displayWidth,
              height: displayHeight,
              meta: { url },
            },
          },
          inverse: {
            type: 'delete',
            elementId,
            data: {},
            requestId: '',
            clientTs: 0,
          } as any,
        });
      }
    } catch (e) {
      console.error('Failed to add image to canvas:', e);
      alert('Failed to add image to canvas.');
    }
  };

  return {
    handleImageUpdate,
    handleImageDelete,
    handleImageDownload,
    handleImageDuplicate,
    handleImageUpload,
    handleImagesDrop,
    handleImageSelect,
    handleImageGenerate,
    handleTextCreate,
    handleAddImageToCanvas,
  };
}

