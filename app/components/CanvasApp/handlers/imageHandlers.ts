import { Dispatch, SetStateAction } from 'react';
import { generateImageForCanvas } from '@/lib/api';
import { GenerationQueueItem } from '@/app/components/Canvas/GenerationQueue';
import { CanvasAppState, CanvasAppSetters } from '../types';
import { ImageUpload } from '@/types/canvas';

interface ImageHandlerProps {
  ids: string[];
  appState: CanvasAppState;
  canvasState: CanvasAppState;
  setters: CanvasAppSetters;
  // Specific setters can still be typed explicitly if needed or inferred from CanvasAppSetters
  // We can treat them as part of setters object usually
  // But keeping them if they are passed distinctly in props (Legacy)
  // However, createImageHandlers receives (canvasState, setters, ...) so these might be redundant here
  // But for the Props interface itself:
  setNodeText: Dispatch<SetStateAction<string>>;
  setNodeText2: Dispatch<SetStateAction<string>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setIsLoading2: Dispatch<SetStateAction<boolean>>;
  setGeneratedImage: Dispatch<SetStateAction<string | null>>;
  setGeneratedImage2: Dispatch<SetStateAction<string | null>>;
  setImageAspectRatio: Dispatch<SetStateAction<string>>;
  setPrompt: Dispatch<SetStateAction<string>>;
  setNodeId: Dispatch<SetStateAction<string | null>>;
}

export const handleImageGenerate = async (
  prompt: string,
  model: string,
  aspectRatio: string,
  projectId: string,
  width: number | undefined,
  height: number | undefined,
  imageCount: number,
  sourceImageUrl: string | undefined, // Can be comma-separated list
  sceneNumber: number | undefined,
  previousSceneImageUrl: string | undefined,
  storyboardMetadata: Record<string, string> | undefined,
  setters: any, // Using any for now to simplify, ideally type strict 
  options?: Record<string, any>
) => {
  const { setGenerationQueue, setGeneratedImage, setGeneratedImages, setShowImageGenerationModal } = setters;

  try {
    let effectiveSourceImageUrl = sourceImageUrl;
    if (effectiveSourceImageUrl === 'none' || effectiveSourceImageUrl === '') {
      effectiveSourceImageUrl = undefined;
    }

    let parsedImageCount = typeof imageCount === 'string' ? parseInt(imageCount, 10) : imageCount;
    if (isNaN(parsedImageCount) || parsedImageCount < 1) parsedImageCount = 1;

    const queuedCount = parsedImageCount;
    // Use simple ID generation to avoid 'uuid' dependency
    const baseId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const jobEntries: GenerationQueueItem[] = [];
    for (let i = 0; i < queuedCount; i++) {
      jobEntries.push({
        id: `${baseId}-${i}`,
        type: 'image',
        operationName: 'Generating Image',
        prompt: prompt,
        model: model,
        total: queuedCount,
        index: i + 1,
        startedAt: Date.now()
      });
    }

    setGenerationQueue((prev: any) => [...prev, ...jobEntries]);
    setShowImageGenerationModal(false);

    let genWidth = width;
    let genHeight = height;

    console.log('[handleImageGenerate] 🚀 Starting generation...', {
      prompt,
      model,
      count: queuedCount,
      willUseImageToImage: !!effectiveSourceImageUrl,
    });

    const isTurboModel = model.toLowerCase().includes('turbo') || model.toLowerCase().includes('p image') || model.toLowerCase().includes('p-image');

    let result;
    if (isTurboModel && queuedCount > 1) {
      console.log(`[handleImageGenerate] 🚀 Turbo Mode: Executing ${queuedCount} sequential generation requests`);
      const results: any[] = [];

      for (let i = 0; i < queuedCount; i++) {
        let attempts = 0;
        const maxRetries = 3;
        let success = false;

        while (!success && attempts <= maxRetries) {
          try {
            const uniqueSeed = Math.floor(Math.random() * 2147483647);
            const res = await generateImageForCanvas(
              prompt, model, aspectRatio, projectId, width || genWidth, height || genHeight,
              1, effectiveSourceImageUrl, sceneNumber, previousSceneImageUrl, storyboardMetadata, uniqueSeed, options
            );
            results.push(res);
            success = true;
            if (i < queuedCount - 1) await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (err: any) {
            attempts++;
            const status = err?.status || err?.response?.status;
            const msg = err?.message || '';
            const isRateLimit = msg.includes('429') || status === 429;
            const isServerError = status >= 500 && status < 600;

            if ((isRateLimit || isServerError) && attempts <= maxRetries) {
              const waitTime = 5000 * Math.pow(1.5, attempts - 1);
              console.warn(`[handleImageGenerate] ⚠️ Error ${status}. Retrying in ${Math.round(waitTime / 1000)}s...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              console.error(`[handleImageGenerate] Request ${i + 1} failed permanently:`, err);
              break;
            }
          }
        }
      }

      if (results.length === 0) throw new Error('All generation requests failed.');

      const primaryResult = results[0];
      const allImages = results.flatMap(r => r.images && r.images.length > 0 ? r.images : [{ url: r.url }]);

      result = { ...primaryResult, images: allImages, url: allImages[0]?.url || primaryResult.url };
    } else {
      result = await generateImageForCanvas(
        prompt, model, aspectRatio, projectId, width || genWidth, height || genHeight,
        queuedCount, effectiveSourceImageUrl, sceneNumber, previousSceneImageUrl, storyboardMetadata, undefined, options
      );
    }

    const jobIdSet = new Set(jobEntries.map((entry) => entry.id));
    setters.setGenerationQueue((prev: any) => prev.filter((job: any) => !jobIdSet.has(job.id)));

    if (result.images && Array.isArray(result.images) && result.images.length > 0) {
      return { url: result.url, images: result.images, prompt: prompt };
    }
    return { url: result.url, prompt: prompt };

  } catch (error: any) {
    console.error('Generation failed:', error);
    setGenerationQueue((prev: any) => prev.filter((job: any) => !job.model.includes(model)));
    throw error;
  }
};

export const createImageHandlers = (
  canvasState: CanvasAppState,
  setters: CanvasAppSetters,
  projectId: string | null,
  opManagerInitialized: boolean,
  appendOp: any,
  realtimeActive: boolean,
  realtimeRef: any,
  viewportCenterRef: any,
  processMediaFile: any
) => {

  const handleImageUpdate = async (index: number, updates: Partial<ImageUpload>) => {
    // 1. Get previous state
    const prevImage = canvasState.images[index];
    if (!prevImage) return;

    // 2. Optimistic Update
    setters.setImages(prev => {
      const newImages = [...prev];
      if (newImages[index]) {
        newImages[index] = { ...newImages[index], ...updates };
      }
      return newImages;
    });

    const elementId = prevImage.elementId;
    if (!elementId) return; // Legacy images might not have elementId

    // 3. Realtime
    if (realtimeActive && realtimeRef.current) {
      realtimeRef.current.sendUpdate(elementId, updates);
    }

    // 4. Persistence
    if (projectId && opManagerInitialized) {
      // Build inverse updates
      const inverseUpdates: any = {};
      for (const k of Object.keys(updates)) {
        // @ts-ignore
        inverseUpdates[k] = prevImage[k];
      }

      await appendOp({
        type: 'update',
        elementId: elementId,
        data: { updates },
        inverse: { type: 'update', elementId, data: { updates: inverseUpdates }, requestId: '', clientTs: 0 }
      });
    }
  };

  const handleImageDelete = async (index: number) => {
    const prevImage = canvasState.images[index];
    if (!prevImage) return;

    // Optimistic Update
    setters.setImages(prev => prev.filter((_, i) => i !== index));

    const elementId = prevImage.elementId;
    if (!elementId) return;

    if (realtimeActive && realtimeRef.current) {
      realtimeRef.current.sendDelete(elementId);
    }

    if (projectId && opManagerInitialized) {
      await appendOp({
        type: 'delete',
        elementId: elementId,
        data: {},
        inverse: {
          type: 'create',
          elementId: elementId,
          data: {
            element: {
              id: elementId || `image-${Date.now()}`,
              type: 'image',
              x: prevImage.x || 0,
              y: prevImage.y || 0,
              width: prevImage.width || 0,
              height: prevImage.height || 0,
              meta: {
                url: prevImage.url,
                // ... other fields if needed for full restore
              }
            }
          },
          requestId: '',
          clientTs: 0
        }
      });
    }
  };

  const handleImageDuplicate = async (index: number) => {
    const sourceImage = canvasState.images[index];
    if (!sourceImage) return;

    // Create new image slightly offset
    const newId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newImage = {
      ...sourceImage,
      x: (sourceImage.x || 0) + 20,
      y: (sourceImage.y || 0) + 20,
      elementId: newId
    };

    setters.setImages(prev => [...prev, newImage]);

    if (projectId && opManagerInitialized) {
      await appendOp({
        type: 'create',
        elementId: newId,
        data: {
          element: {
            id: newId,
            type: 'image', // Adjust type if needed (e.g. 'model3d' if source was 3d)
            x: newImage.x,
            y: newImage.y,
            width: newImage.width || 0,
            height: newImage.height || 0,
            meta: {
              url: newImage.url
            }
          }
        },
        inverse: { type: 'delete', elementId: newId, data: {}, requestId: '', clientTs: 0 }
      });
    }
  };

  const handleImageDownload = (index: number | ImageUpload) => {
    const image = typeof index === 'number' ? canvasState.images[index] : index;
    if (!image || !image.url) return;

    const link = document.createElement('a');
    link.href = image.url;
    link.download = `image-${Date.now()}.png`; // Simple download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageUpload = async (event: any) => {
    const files = event.target?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (processMediaFile) await processMediaFile(files[i], i);
      }
    }
  };

  const handleImagesDrop = async (files: File[]) => {
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (processMediaFile) await processMediaFile(files[i], i);
      }
    }
  };

  const handleImageSelect = async (file: File) => {
    if (processMediaFile) {
      await processMediaFile(file, 0);
    } else {
      console.warn('[handleImageSelect] processMediaFile not available');
    }
  };

  const handleTextCreate = async (text: string, x: number, y: number) => {
    const id = `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newText = {
      id,
      x,
      y,
      value: text || 'Double click to edit',
    };

    setters.setTextGenerators((prev: any) => [...prev, newText]);

    if (projectId && opManagerInitialized) {
      await appendOp({
        type: 'create',
        elementId: id,
        data: {
          element: {
            id,
            type: 'text',
            x,
            y,
            meta: { value: text || 'Double click to edit' }
          }
        },
        inverse: { type: 'delete', elementId: id, data: {}, requestId: '', clientTs: 0 }
      });
    }
  };

  const handleAddImageToCanvas = async (url: string) => {
    const center = viewportCenterRef.current || { x: 0, y: 0 };
    const id = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create new image at center
    const newImage = {
      elementId: id,
      url,
      x: center.x,
      y: center.y,
      width: 512,
      height: 512,
      type: 'image'
    };

    setters.setImages((prev: any) => [...prev, newImage]);

    if (projectId && opManagerInitialized) {
      await appendOp({
        type: 'create',
        elementId: id,
        data: {
          element: {
            id,
            type: 'image',
            x: center.x,
            y: center.y,
            width: 512,
            height: 512,
            meta: { url }
          }
        },
        inverse: { type: 'delete', elementId: id, data: {}, requestId: '', clientTs: 0 }
      });
    }
  };

  return {
    handleImageGenerate: (
      prompt: string,
      model: string,
      frame: string,
      aspectRatio: string,
      targetFrameId: string | undefined,
      imageCount: number | undefined,
      sourceImageUrl: string | undefined,
      sceneNumber: number | undefined,
      previousSceneImageUrl: string | undefined,
      storyboardMetadata: Record<string, string> | undefined,
      width?: number,
      height?: number,
      options?: Record<string, any>
    ) => {
      return handleImageGenerate(
        prompt,
        model,
        aspectRatio,
        projectId || '',
        width,
        height,
        imageCount || 1,
        sourceImageUrl,
        sceneNumber,
        previousSceneImageUrl,
        storyboardMetadata,
        setters,
        options
      );
    },
    handleImageUpdate,
    handleImageDelete,
    handleImageDownload,
    handleImageDuplicate,
    handleImageUpload,
    handleImagesDrop,
    handleImageSelect,
    handleTextCreate,
    handleAddImageToCanvas
  };
};
