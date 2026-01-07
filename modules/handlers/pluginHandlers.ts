import { CanvasAppState, CanvasAppSetters, UpscaleGenerator, MultiangleCameraGenerator, RemoveBgGenerator, EraseGenerator, ExpandGenerator, VectorizeGenerator, NextSceneGenerator, StoryboardGenerator, ScriptFrameGenerator, SceneFrameGenerator, VideoEditorGenerator } from '@/modules/canvas-app/types';
import { GenerationQueueItem } from '@/modules/canvas/GenerationQueue';

export interface PluginHandlers {
  onPersistUpscaleModalCreate: (modal: UpscaleGenerator) => Promise<void>;
  onPersistUpscaleModalMove: (id: string, updates: Partial<UpscaleGenerator>) => Promise<void>;
  onPersistUpscaleModalDelete: (id: string) => Promise<void>;
  onPersistMultiangleCameraModalCreate: (modal: MultiangleCameraGenerator) => Promise<void>;
  onPersistMultiangleCameraModalMove: (id: string, updates: Partial<MultiangleCameraGenerator>) => Promise<void>;
  onPersistMultiangleCameraModalDelete: (id: string) => Promise<void>;
  onPersistRemoveBgModalCreate: (modal: RemoveBgGenerator) => Promise<void>;
  onPersistRemoveBgModalMove: (id: string, updates: Partial<RemoveBgGenerator>) => Promise<void>;
  onPersistRemoveBgModalDelete: (id: string) => Promise<void>;
  onPersistEraseModalCreate: (modal: EraseGenerator) => Promise<void>;
  onPersistEraseModalMove: (id: string, updates: Partial<EraseGenerator>) => Promise<void>;
  onPersistEraseModalDelete: (id: string) => Promise<void>;
  onPersistExpandModalCreate: (modal: ExpandGenerator) => Promise<void>;
  onPersistExpandModalMove: (id: string, updates: Partial<ExpandGenerator>) => Promise<void>;
  onPersistExpandModalDelete: (id: string) => Promise<void>;
  onPersistVectorizeModalCreate: (modal: VectorizeGenerator) => Promise<void>;
  onPersistVectorizeModalMove: (id: string, updates: Partial<VectorizeGenerator>) => Promise<void>;
  onPersistVectorizeModalDelete: (id: string) => Promise<void>;
  onPersistNextSceneModalCreate: (modal: NextSceneGenerator) => Promise<void>;
  onPersistNextSceneModalMove: (id: string, updates: Partial<NextSceneGenerator>) => Promise<void>;
  onPersistNextSceneModalDelete: (id: string) => Promise<void>;
  onPersistStoryboardModalCreate: (modal: StoryboardGenerator) => Promise<void>;
  onPersistStoryboardModalMove: (id: string, updates: Partial<StoryboardGenerator>) => Promise<void>;
  onPersistStoryboardModalDelete: (id: string) => Promise<void>;
  onPersistScriptFrameModalCreate: (modal: ScriptFrameGenerator) => Promise<void>;
  onPersistScriptFrameModalMove: (id: string, updates: Partial<ScriptFrameGenerator>) => Promise<void>;
  onPersistScriptFrameModalDelete: (id: string) => Promise<void>;
  onPersistSceneFrameModalCreate: (modal: SceneFrameGenerator) => Promise<void>;
  onPersistSceneFrameModalMove: (id: string, updates: Partial<SceneFrameGenerator>) => Promise<void>;
  onPersistSceneFrameModalDelete: (id: string) => Promise<void>;
  onPersistVideoEditorModalCreate: (modal: VideoEditorGenerator) => Promise<void>;
  onPersistVideoEditorModalMove: (id: string, updates: Partial<VideoEditorGenerator>) => Promise<void>;
  onPersistVideoEditorModalDelete: (id: string) => Promise<void>;
  onUpscale: (model: string, scale: number, sourceImageUrl?: string, faceEnhance?: boolean, faceEnhanceStrength?: number) => Promise<string | null>;
  onMultiangleCamera: (sourceImageUrl?: string, prompt?: string, loraScale?: number, aspectRatio?: string, moveForward?: number, verticalTilt?: number, rotateDegrees?: number, useWideAngle?: boolean) => Promise<string | null>;
  onRemoveBg: (model: string, backgroundType: string, scaleValue: number, sourceImageUrl?: string) => Promise<string | null>;
  onErase: (model: string, sourceImageUrl?: string, mask?: string, prompt?: string) => Promise<string | null>;
  onExpand: (model: string, sourceImageUrl?: string, prompt?: string, canvasSize?: [number, number], originalImageSize?: [number, number], originalImageLocation?: [number, number], aspectRatio?: string) => Promise<string | null>;
  onVectorize: (sourceImageUrl?: string, mode?: string) => Promise<string | null>;
  onPersistCompareModalCreate: (modal: { id: string; x: number; y: number; width?: number; height?: number; scale?: number; prompt?: string; model?: string }) => Promise<void>;
  onPersistCompareModalMove: (id: string, updates: Partial<{ x: number; y: number; width?: number; height?: number; scale?: number; prompt?: string; model?: string }>) => Promise<void>;
  onPersistCompareModalDelete: (id: string) => Promise<void>;
}

export function createPluginHandlers(
  state: CanvasAppState,
  setters: CanvasAppSetters,
  projectId: string | null,
  opManagerInitialized: boolean,
  appendOp: (op: any) => Promise<void>,
  realtimeActive: boolean,
  realtimeRef: React.RefObject<any>,
  removeAndPersistConnectorsForElement: (elementId: string) => Promise<void>,
  debounceMove: (type: string, id: string, updates: any, originalHandler: (id: string, updates: any) => Promise<void>) => void
): PluginHandlers {
  const onPersistUpscaleModalCreate = async (modal: UpscaleGenerator) => {
    if (projectId) {
      await appendOp({
        type: 'create',
        elementId: modal.id,
        data: {
          element: {
            id: modal.id,
            type: 'upscale-plugin',
            x: modal.x,
            y: modal.y,
            meta: {
              upscaledImageUrl: modal.upscaledImageUrl || null,
              sourceImageUrl: modal.sourceImageUrl || null,
              localUpscaledImageUrl: modal.localUpscaledImageUrl || null,
              model: modal.model,
              scale: modal.scale,
              frameWidth: modal.frameWidth,
              frameHeight: modal.frameHeight,
              isUpscaling: modal.isUpscaling,
              faceEnhance: modal.faceEnhance,
              faceEnhanceStrength: modal.faceEnhanceStrength,
              topazModel: modal.topazModel,
              faceEnhanceCreativity: modal.faceEnhanceCreativity,
            },
          },
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, authorId: 'user' } as any,
        authorId: 'user',
      });
    }
  };

  const onPersistUpscaleModalMove = async (id: string, updates: Partial<UpscaleGenerator>) => {
    const prev = state.upscaleGenerators.find(m => m.id === id);

    if (projectId) {
      debounceMove('upscale', id, updates, async (id: string, upds: any) => {
        // Structure updates correctly: meta fields go under meta, position fields go top-level
        const structuredUpdates: any = {};

        // Get existing meta from previous state
        const existingMeta = prev ? {
          upscaledImageUrl: (prev as any).upscaledImageUrl ?? null,
          sourceImageUrl: (prev as any).sourceImageUrl ?? null,
          localUpscaledImageUrl: (prev as any).localUpscaledImageUrl ?? null,
          model: (prev as any).model ?? 'Crystal Upscaler',
          scale: (prev as any).scale ?? 2,
          frameWidth: (prev as any).frameWidth ?? 400,
          frameHeight: (prev as any).frameHeight ?? 500,
          isUpscaling: (prev as any).isUpscaling ?? false,
          faceEnhance: (prev as any).faceEnhance ?? false,
          faceEnhanceStrength: (prev as any).faceEnhanceStrength ?? 0.8,
          topazModel: (prev as any).topazModel ?? 'Standard V2',
          faceEnhanceCreativity: (prev as any).faceEnhanceCreativity ?? 0,
        } : {
          upscaledImageUrl: null,
          sourceImageUrl: null,
          localUpscaledImageUrl: null,
          model: 'Crystal Upscaler',
          scale: 2,
          frameWidth: 400,
          frameHeight: 500,
          isUpscaling: false,
          faceEnhance: false,
          faceEnhanceStrength: 0.8,
          topazModel: 'Standard V2',
          faceEnhanceCreativity: 0,
        };

        // Merge updates into meta
        const metaUpdates = { ...existingMeta };
        for (const k of Object.keys(upds || {})) {
          if (k === 'x' || k === 'y' || k === 'width' || k === 'height') {
            structuredUpdates[k] = (upds as any)[k];
          } else if (k === 'model' || k === 'scale' || k === 'upscaledImageUrl' || k === 'sourceImageUrl' || k === 'localUpscaledImageUrl' || k === 'isUpscaling' || k === 'frameWidth' || k === 'frameHeight' || k === 'faceEnhance' || k === 'faceEnhanceStrength' || k === 'topazModel' || k === 'faceEnhanceCreativity') {
            metaUpdates[k] = (upds as any)[k];
          } else {
            structuredUpdates[k] = (upds as any)[k];
          }
        }

        // Always include meta in updates (backend does shallow merge)
        structuredUpdates.meta = metaUpdates;

        // Build inverse updates
        const inverseUpdates: any = {};
        if (prev) {
          if ('x' in upds) inverseUpdates.x = prev.x;
          if ('y' in upds) inverseUpdates.y = prev.y;
          if ('width' in upds) inverseUpdates.width = (prev as any).width;
          if ('height' in upds) inverseUpdates.height = (prev as any).height;

          // Inverse meta should restore previous meta
          const inverseMeta: any = {};
          for (const k of Object.keys(upds || {})) {
            if (k === 'model' || k === 'scale' || k === 'upscaledImageUrl' || k === 'sourceImageUrl' || k === 'localUpscaledImageUrl' || k === 'isUpscaling' || k === 'frameWidth' || k === 'frameHeight' || k === 'faceEnhance' || k === 'faceEnhanceStrength' || k === 'topazModel' || k === 'faceEnhanceCreativity') {
              inverseMeta[k] = (prev as any)[k] ?? (existingMeta as any)[k];
            }
          }
          if (Object.keys(inverseMeta).length > 0) {
            inverseUpdates.meta = inverseMeta;
          }
        }

        await appendOp({
          type: 'update',
          elementId: id,
          data: { updates: structuredUpdates },
          inverse: { type: 'update', elementId: id, data: { updates: inverseUpdates }, authorId: 'user' } as any,
          authorId: 'user',
        });
      });
    }
  };

  const onPersistUpscaleModalDelete = async (id: string) => {
    console.log('[pluginHandlers] onPersistUpscaleModalDelete called with ID:', id);
    const prevItem = state.upscaleGenerators.find(m => m.id === id);

    try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }

    if (projectId) {
      await appendOp({
        type: 'delete',
        elementId: id,
        data: {},
        inverse: prevItem ? {
          type: 'create',
          elementId: id,
          data: {
            element: {
              id,
              type: 'upscale-plugin',
              x: prevItem.x,
              y: prevItem.y,
              meta: {
                upscaledImageUrl: (prevItem as any).upscaledImageUrl || null,
                sourceImageUrl: (prevItem as any).sourceImageUrl || null,
                localUpscaledImageUrl: (prevItem as any).localUpscaledImageUrl || null,
                model: (prevItem as any).model,
                scale: (prevItem as any).scale,
                frameWidth: (prevItem as any).frameWidth,
                frameHeight: (prevItem as any).frameHeight,
                isUpscaling: (prevItem as any).isUpscaling,
                faceEnhance: (prevItem as any).faceEnhance,
                faceEnhanceStrength: (prevItem as any).faceEnhanceStrength,
                topazModel: (prevItem as any).topazModel,
                faceEnhanceCreativity: (prevItem as any).faceEnhanceCreativity,
              },
            },
          },
          authorId: 'user',
        } as any : undefined as any,
        authorId: 'user',
      });
    }
  };

  const onUpscale = async (model: string, scale: number, sourceImageUrl?: string, faceEnhance?: boolean, faceEnhanceStrength?: number, topazModel?: string, faceEnhanceCreativity?: number) => {
    if (!sourceImageUrl || !projectId) {
      console.error('[onUpscale] Missing sourceImageUrl or projectId');
      return null;
    }

    const queueId = `upscale-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const queueItem: GenerationQueueItem = {
      id: queueId,
      type: 'upscale',
      operationName: 'Upscaling',
      model: model || 'Crystal Upscaler',
      total: 1,
      index: 1,
      startedAt: Date.now(),
    };
    setters.setGenerationQueue((prev) => [...prev, queueItem]);

    try {
      console.log('[onUpscale] Starting upscale:', { model, scale, sourceImageUrl, faceEnhance, faceEnhanceStrength, topazModel, faceEnhanceCreativity });
      const { upscaleImageForCanvas } = await import('@/core/api/api');
      const result = await upscaleImageForCanvas(
        sourceImageUrl,
        model || 'Crystal Upscaler',
        scale || 2,
        projectId,
        faceEnhance,
        faceEnhanceStrength,
        topazModel,
        faceEnhanceCreativity
      );

      console.log('[onUpscale] Upscale completed:', result);
      // Remove from queue immediately after completion
      setters.setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));
      // Extract URL from result - result should be the data object with url property
      const upscaledUrl = result?.url || (typeof result === 'string' ? result : null);
      console.log('[onUpscale] Extracted URL:', upscaledUrl);
      return upscaledUrl;
    } catch (error: any) {
      console.error('[onUpscale] Error:', error);
      // Remove from queue on error
      setters.setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));
      throw error;
    }
  };

  const onPersistMultiangleCameraModalCreate = async (modal: MultiangleCameraGenerator) => {
    if (projectId) {
      await appendOp({
        type: 'create',
        elementId: modal.id,
        data: {
          element: {
            id: modal.id,
            type: 'multiangle-camera-plugin',
            x: modal.x,
            y: modal.y,
            meta: {
              sourceImageUrl: modal.sourceImageUrl || null,
            },
          },
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, authorId: 'user' } as any,
        authorId: 'user',
      });
    }
  };

  const onPersistMultiangleCameraModalMove = async (id: string, updates: Partial<MultiangleCameraGenerator>) => {
    const prevItem = state.multiangleCameraGenerators.find(m => m.id === id);
    if (!prevItem) {
      console.warn('[onPersistMultiangleCameraModalMove] Modal not found:', id);
      return;
    }

    // Always appendOp for undo/redo and persistence (Debounced)
    if (projectId && opManagerInitialized) {
      debounceMove('multiangle-camera', id, updates, async (id: string, upds: any) => {
        const inverseUpdates: any = {};
        for (const k of Object.keys(upds)) {
          (inverseUpdates as any)[k] = (prevItem as any)[k];
        }
        await appendOp({
          type: 'update',
          elementId: id,
          data: { updates: upds },
          inverse: { type: 'update', elementId: id, data: { updates: inverseUpdates }, authorId: 'user' } as any,
          authorId: 'user',
        });
      });
    }
  };

  const onPersistMultiangleCameraModalDelete = async (id: string) => {
    const prevItem = state.multiangleCameraGenerators.find(m => m.id === id);
    // Also remove any connectors that referenced this element
    try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }
    // Always append op for undo/redo and persistence
    if (projectId && opManagerInitialized && prevItem) {
      await appendOp({
        type: 'delete',
        elementId: id,
        data: {},
        inverse: {
          type: 'create',
          elementId: id,
          data: {
            element: {
              id,
              type: 'multiangle-camera-plugin',
              x: prevItem.x,
              y: prevItem.y,
              meta: {
                sourceImageUrl: prevItem.sourceImageUrl || null,
              },
            },
          },
          authorId: 'user',
        } as any,
        authorId: 'user',
      });
    }
  };

  const onMultiangleCamera = async (
    sourceImageUrl?: string,
    prompt?: string,
    loraScale?: number,
    aspectRatio?: string,
    moveForward?: number,
    verticalTilt?: number,
    rotateDegrees?: number,
    useWideAngle?: boolean
  ) => {
    if (!sourceImageUrl || !projectId) {
      console.error('[onMultiangleCamera] Missing sourceImageUrl or projectId', { sourceImageUrl: !!sourceImageUrl, projectId: !!projectId });
      return null;
    }

    const queueId = `multiangle-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const queueItem: GenerationQueueItem = {
      id: queueId,
      type: 'image', // Use 'image' type as multiangle generates images
      operationName: 'Multiangle Camera',
      model: 'Qwen Multiangle',
      total: 1,
      index: 1,
      startedAt: Date.now(),
    };
    setters.setGenerationQueue((prev) => [...prev, queueItem]);

    try {
      console.log('[onMultiangleCamera] Starting multiangle generation:', {
        sourceImageUrl: sourceImageUrl ? (sourceImageUrl.substring(0, 50) + '...') : 'MISSING',
        prompt,
        projectId
      });
      const { multiangleImageForCanvas } = await import('@/core/api/api');
      const result = await multiangleImageForCanvas(
        sourceImageUrl,
        projectId,
        prompt,
        loraScale,
        aspectRatio,
        moveForward,
        verticalTilt,
        rotateDegrees,
        useWideAngle
      );

      console.log('[onMultiangleCamera] Multiangle generation completed result:', result);
      // Remove from queue immediately after completion
      setters.setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));

      // Extract URL from result with more robustness
      let resultUrl: string | null = null;
      if (typeof result === 'string') {
        resultUrl = result;
      } else if (result) {
        const res = result as any;
        resultUrl = res.url || res.data?.url || (Array.isArray(res.images) ? res.images[0]?.url : null) || null;
      }

      console.log('[onMultiangleCamera] Final extracted URL:', resultUrl);
      return resultUrl;
    } catch (error: any) {
      console.error('[onMultiangleCamera] Error:', error);
      // Remove from queue on error
      setters.setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));
      throw error;
    }
  };

  const onPersistRemoveBgModalCreate = async (modal: RemoveBgGenerator) => {
    if (projectId) {
      await appendOp({
        type: 'create',
        elementId: modal.id,
        data: {
          element: {
            id: modal.id,
            type: 'removebg-plugin',
            x: modal.x,
            y: modal.y,
            meta: {
              removedBgImageUrl: modal.removedBgImageUrl || null,
              sourceImageUrl: modal.sourceImageUrl || null,
              localRemovedBgImageUrl: modal.localRemovedBgImageUrl || null,
              model: (modal as any).model,
              backgroundType: (modal as any).backgroundType,
              scaleValue: (modal as any).scaleValue,
              frameWidth: modal.frameWidth,
              frameHeight: modal.frameHeight,
              isRemovingBg: modal.isRemovingBg,
            },
          },
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, authorId: 'user' } as any,
        authorId: 'user',
      });
    }
  };

  const onPersistRemoveBgModalMove = async (id: string, updates: Partial<RemoveBgGenerator>) => {
    const prev = state.removeBgGenerators.find(m => m.id === id);

    if (projectId) {
      debounceMove('removebg', id, updates, async (id: string, upds: any) => {
        const structuredUpdates: any = {};
        const existingMeta = prev ? {
          removedBgImageUrl: prev.removedBgImageUrl || null,
          sourceImageUrl: prev.sourceImageUrl || null,
          localRemovedBgImageUrl: prev.localRemovedBgImageUrl || null,
          model: prev.model || '851-labs/background-remover',
          backgroundType: prev.backgroundType || 'rgba (transparent)',
          scaleValue: prev.scaleValue || 0.5,
          frameWidth: prev.frameWidth || 400,
          frameHeight: prev.frameHeight || 500,
          isRemovingBg: prev.isRemovingBg || false,
        } : {
          removedBgImageUrl: null,
          sourceImageUrl: null,
          localRemovedBgImageUrl: null,
          model: '851-labs/background-remover',
          backgroundType: 'rgba (transparent)',
          scaleValue: 0.5,
          frameWidth: 400,
          frameHeight: 500,
          isRemovingBg: false,
        };

        const metaUpdates = { ...existingMeta };
        for (const k of Object.keys(upds || {})) {
          if (k === 'x' || k === 'y') {
            structuredUpdates[k] = (upds as any)[k];
          } else {
            (metaUpdates as any)[k] = (upds as any)[k];
          }
        }
        structuredUpdates.meta = metaUpdates;

        const inverseUpdates: any = {};
        if (prev) {
          if ('x' in upds) inverseUpdates.x = prev.x;
          if ('y' in upds) inverseUpdates.y = prev.y;
          const inverseMeta: any = {};
          if ('removedBgImageUrl' in upds) inverseMeta.removedBgImageUrl = prev.removedBgImageUrl || null;
          if ('sourceImageUrl' in upds) inverseMeta.sourceImageUrl = prev.sourceImageUrl || null;
          if ('localRemovedBgImageUrl' in upds) inverseMeta.localRemovedBgImageUrl = prev.localRemovedBgImageUrl || null;
          if ('model' in upds) inverseMeta.model = prev.model || '851-labs/background-remover';
          if ('backgroundType' in upds) inverseMeta.backgroundType = prev.backgroundType || 'rgba (transparent)';
          if ('scaleValue' in upds) inverseMeta.scaleValue = prev.scaleValue || 0.5;
          if ('frameWidth' in upds) inverseMeta.frameWidth = prev.frameWidth || 400;
          if ('frameHeight' in upds) inverseMeta.frameHeight = prev.frameHeight || 500;
          if ('isRemovingBg' in upds) inverseMeta.isRemovingBg = prev.isRemovingBg || false;
          if (Object.keys(inverseMeta).length > 0) {
            inverseUpdates.meta = inverseMeta;
          }
        }

        await appendOp({
          type: 'update',
          elementId: id,
          data: { updates: structuredUpdates },
          inverse: {
            type: 'update',
            elementId: id,
            data: { updates: inverseUpdates },
            authorId: 'user',
          } as any,
          authorId: 'user',
        });
      });
    }
  };

  const onPersistRemoveBgModalDelete = async (id: string) => {
    console.log('[page.tsx] onPersistRemoveBgModalDelete called', id);
    const prevItem = state.removeBgGenerators.find(m => m.id === id);

    try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }

    if (projectId) {
      await appendOp({
        type: 'delete',
        elementId: id,
        data: {},
        inverse: prevItem ? {
          type: 'create',
          elementId: id,
          data: {
            element: {
              id,
              type: 'removebg-plugin',
              x: prevItem.x,
              y: prevItem.y,
              meta: {
                removedBgImageUrl: prevItem.removedBgImageUrl || null,
                sourceImageUrl: prevItem.sourceImageUrl || null,
                localRemovedBgImageUrl: prevItem.localRemovedBgImageUrl || null,
                frameWidth: prevItem.frameWidth,
                frameHeight: prevItem.frameHeight,
                isRemovingBg: prevItem.isRemovingBg,
              },
            },
          },
          authorId: 'user',
        } as any : undefined as any,
        authorId: 'user',
      });
    }
  };

  const onRemoveBg = async (model: string, backgroundType: string, scaleValue: number, sourceImageUrl?: string) => {
    if (!sourceImageUrl || !projectId) {
      console.error('[onRemoveBg] Missing sourceImageUrl or projectId');
      return null;
    }

    const queueId = `removebg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const queueItem: GenerationQueueItem = {
      id: queueId,
      type: 'removebg',
      operationName: 'Removing Background',
      model,
      total: 1,
      index: 1,
      startedAt: Date.now(),
    };
    setters.setGenerationQueue((prev) => [...prev, queueItem]);

    try {
      console.log('[onRemoveBg] Starting remove bg:', { model, backgroundType, scaleValue, sourceImageUrl });
      const { removeBgImageForCanvas } = await import('@/core/api/api');
      const result = await removeBgImageForCanvas(
        sourceImageUrl,
        projectId,
        model,
        backgroundType,
        scaleValue
      );

      console.log('[onRemoveBg] Remove bg completed:', result);
      // Mark as completed instead of removing immediately
      const completedAt = Date.now();
      setters.setGenerationQueue((prev) =>
        prev.map((item) => (item.id === queueId ? { ...item, completed: true, completedAt } : item))
      );
      return result.url || null;
    } catch (error: any) {
      console.error('[onRemoveBg] Error:', error);
      // Remove from queue on error
      setters.setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));
      throw error;
    }
  };

  const onPersistEraseModalCreate = async (modal: EraseGenerator) => {
    if (projectId) {
      await appendOp({
        type: 'create',
        elementType: 'erase',
        elementId: modal.id,
        data: {
          id: modal.id,
          x: modal.x,
          y: modal.y,
          erasedImageUrl: modal.erasedImageUrl || null,
          sourceImageUrl: modal.sourceImageUrl || null,
          localErasedImageUrl: modal.localErasedImageUrl || null,
          model: modal.model,
          frameWidth: modal.frameWidth,
          frameHeight: modal.frameHeight,
          isErasing: modal.isErasing,
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, authorId: 'user' } as any,
        authorId: 'user',
      });
    }
  };

  const onPersistEraseModalMove = async (id: string, updates: Partial<EraseGenerator>) => {
    // 1. Capture previous state (for inverse op)
    const prev = state.eraseGenerators.find(m => m.id === id);

    // 4. Append op for undo/redo and persistence (Debounced)
    if (projectId && opManagerInitialized && prev) {
      debounceMove('erase', id, updates, async (id: string, upds: any) => {
        await appendOp({
          type: 'update', // Changed from 'move' to consistent 'update'
          elementType: 'erase',
          elementId: id,
          data: { updates: upds },
          inverse: {
            type: 'update',
            elementType: 'erase',
            elementId: id,
            data: {
              updates: {
                x: prev.x,
                y: prev.y,
              }
            },
            authorId: 'user',
          },
          authorId: 'user',
        });
      });
    }
  };

  const onPersistEraseModalDelete = async (id: string) => {
    // 1. Capture previous state (for inverse op)
    const prevItem = state.eraseGenerators.find(m => m.id === id);

    // Remove connectors for this element
    try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }
    // Append op for undo/redo and persistence
    if (projectId && opManagerInitialized && prevItem) {
      await appendOp({
        type: 'delete',
        elementType: 'erase',
        elementId: id,
        data: null,
        inverse: {
          type: 'create',
          elementType: 'erase',
          elementId: id,
          data: {
            id: prevItem.id,
            x: prevItem.x,
            y: prevItem.y,
            erasedImageUrl: prevItem.erasedImageUrl,
            sourceImageUrl: prevItem.sourceImageUrl,
            localErasedImageUrl: prevItem.localErasedImageUrl,
            model: prevItem.model,
            frameWidth: prevItem.frameWidth,
            frameHeight: prevItem.frameHeight,
            isErasing: prevItem.isErasing,
          },
          authorId: 'user',
        },
        authorId: 'user',
      });
    }
  };

  const convertBlobUrlToDataUrl = async (blobUrl: string): Promise<string> => {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to read local image(status ${response.status}).Please reconnect the image and try again.`);
    }
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(new Error('Failed to convert local image to data URL.'));
      reader.readAsDataURL(blob);
    });
  };

  const onErase = async (model: string, sourceImageUrl?: string, mask?: string, prompt?: string) => {
    if (!sourceImageUrl || !projectId) {
      console.error('[onErase] Missing sourceImageUrl or projectId');
      return null;
    }

    const queueId = `erase-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const queueItem: GenerationQueueItem = {
      id: queueId,
      type: 'erase',
      operationName: 'Erasing',
      model,
      total: 1,
      index: 1,
      startedAt: Date.now(),
    };
    setters.setGenerationQueue((prev) => [...prev, queueItem]);

    // Mask is now optional - image is composited with white mask overlay
    // The composited image already contains the mask, so mask parameter is not required
    console.log('[onErase] Starting erase:', {
      model,
      sourceImageUrl: sourceImageUrl ? sourceImageUrl.substring(0, 100) + '...' : 'null',
      hasMask: !!mask,
      hasCompositedImage: !!sourceImageUrl,
      prompt: prompt || '(none)',
      note: 'Using composited image (mask is part of the image)'
    });

    try {
      const { eraseImageForCanvas } = await import('@/core/api/api');
      let imagePayload = sourceImageUrl;
      if (imagePayload.startsWith('blob:')) {
        console.log('[onErase] Converting blob URL to data URI for API compatibility');
        imagePayload = await convertBlobUrlToDataUrl(imagePayload);
      }
      // Use the prompt as provided by the user (or empty string)
      // The backend will determine if this is an erase (empty) or replace (custom text) operation
      const finalPrompt = prompt || '';

      // Pass composited image as image parameter, mask is optional (can be undefined)
      const result = await eraseImageForCanvas(
        imagePayload, // This is the composited image (original + white mask overlay)
        projectId,
        model,
        mask, // Optional - can be undefined since mask is composited into image
        finalPrompt
      );

      console.log('[onErase] Erase completed:', result);
      // Remove from queue immediately after completion
      setters.setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));
      return result.url || null;
    } catch (error: any) {
      console.error('[onErase] Error:', error);
      // Remove from queue on error
      setters.setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));
      throw error;
    }
  };

  const onPersistExpandModalCreate = async (modal: ExpandGenerator) => {
    if (projectId) {
      await appendOp({
        type: 'create',
        elementId: modal.id,
        data: {
          element: {
            id: modal.id,
            type: 'expand-plugin',
            x: modal.x,
            y: modal.y,
            meta: {
              expandedImageUrl: modal.expandedImageUrl || null,
              sourceImageUrl: modal.sourceImageUrl || null,
              localExpandedImageUrl: modal.localExpandedImageUrl || null,
              model: modal.model || 'expand/base',
              frameWidth: modal.frameWidth || 400,
              frameHeight: modal.frameHeight || 500,
              isExpanding: modal.isExpanding || false,
            },
          },
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, authorId: 'user' } as any,
        authorId: 'user',
      });
    }
  };

  const onPersistExpandModalMove = async (id: string, updates: Partial<ExpandGenerator>) => {
    const prev = state.expandGenerators.find(m => m.id === id);
    // 4. Append op for undo/redo and persistence (Debounced)
    if (projectId && opManagerInitialized) {
      debounceMove('expand', id, updates, async (id: string, upds: any) => {
        const structuredUpdates: any = {};
        const existingMeta = prev ? {
          expandedImageUrl: prev.expandedImageUrl || null,
          sourceImageUrl: prev.sourceImageUrl || null,
          localExpandedImageUrl: prev.localExpandedImageUrl || null,
          model: prev.model || 'expand/base',
          frameWidth: prev.frameWidth || 400,
          frameHeight: prev.frameHeight || 500,
          isExpanding: prev.isExpanding || false,
        } : {
          expandedImageUrl: null,
          sourceImageUrl: null,
          localExpandedImageUrl: null,
          model: 'expand/base',
          frameWidth: 400,
          frameHeight: 500,
          isExpanding: false,
        };
        const metaUpdates = { ...existingMeta };
        for (const k of Object.keys(upds || {})) {
          if (k === 'x' || k === 'y') {
            structuredUpdates[k] = (upds as any)[k];
          } else {
            (metaUpdates as any)[k] = (upds as any)[k];
          }
        }
        structuredUpdates.meta = metaUpdates;

        const inverseUpdates: any = {};
        if (prev) {
          if ('x' in upds) inverseUpdates.x = prev.x;
          if ('y' in upds) inverseUpdates.y = prev.y;
          const inverseMeta: any = {};
          if ('expandedImageUrl' in upds) inverseMeta.expandedImageUrl = prev.expandedImageUrl || null;
          if ('sourceImageUrl' in upds) inverseMeta.sourceImageUrl = prev.sourceImageUrl || null;
          if ('localExpandedImageUrl' in upds) inverseMeta.localExpandedImageUrl = prev.localExpandedImageUrl || null;
          if ('model' in upds) inverseMeta.model = prev.model || 'expand/base';
          if ('frameWidth' in upds) inverseMeta.frameWidth = prev.frameWidth || 400;
          if ('frameHeight' in upds) inverseMeta.frameHeight = prev.frameHeight || 500;
          if ('isExpanding' in upds) inverseMeta.isExpanding = prev.isExpanding || false;
          if (Object.keys(inverseMeta).length > 0) {
            inverseUpdates.meta = inverseMeta;
          }
        }

        await appendOp({
          type: 'update',
          elementId: id,
          data: { updates: structuredUpdates },
          inverse: {
            type: 'update',
            elementId: id,
            data: { updates: inverseUpdates },
            authorId: 'user',
          } as any,
          authorId: 'user',
        });
      });
    }
  };

  const onPersistExpandModalDelete = async (id: string) => {
    const prevItem = state.expandGenerators.find(m => m.id === id);
    await removeAndPersistConnectorsForElement(id);
    if (projectId && opManagerInitialized && prevItem) {
      await appendOp({
        type: 'delete',
        elementType: 'expand',
        elementId: id,
        data: null,
        inverse: {
          type: 'create',
          elementType: 'expand',
          elementId: id,
          data: {
            id: prevItem.id,
            x: prevItem.x,
            y: prevItem.y,
            expandedImageUrl: prevItem.expandedImageUrl || null,
            sourceImageUrl: prevItem.sourceImageUrl || null,
            localExpandedImageUrl: prevItem.localExpandedImageUrl || null,
            model: prevItem.model,
            frameWidth: prevItem.frameWidth,
            frameHeight: prevItem.frameHeight,
            isExpanding: prevItem.isExpanding,
          },
          authorId: 'user',
        },
        authorId: 'user',
      });
    }
  };

  const onPersistVideoEditorModalCreate = async (modal: VideoEditorGenerator) => {
    if (projectId) {
      await appendOp({
        type: 'create',
        elementId: modal.id,
        data: {
          element: {
            id: modal.id,
            type: 'video-editor-trigger',
            x: modal.x,
            y: modal.y,
            width: modal.width,
            height: modal.height,
            meta: {
              color: modal.color
            }
          },
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, authorId: 'user' } as any,
        authorId: 'user',
      });
    }
  };

  const onPersistVideoEditorModalMove = async (id: string, updates: Partial<VideoEditorGenerator>) => {
    const prev = state.videoEditorGenerators.find(m => m.id === id);
    if (projectId && opManagerInitialized && prev) {
      debounceMove('video-editor', id, updates, async (id: string, upds: any) => {
        const structuredUpdates: any = {};
        const existingMeta = {
          color: prev.color || '#000000'
        };
        const metaUpdates = { ...existingMeta };
        for (const k of Object.keys(upds || {})) {
          if (k === 'x' || k === 'y' || k === 'width' || k === 'height') {
            structuredUpdates[k] = (upds as any)[k];
          } else {
            (metaUpdates as any)[k] = (upds as any)[k];
          }
        }
        structuredUpdates.meta = metaUpdates;

        const inverseUpdates: any = {};
        if ('x' in upds) inverseUpdates.x = prev.x;
        if ('y' in upds) inverseUpdates.y = prev.y;
        if ('width' in upds) inverseUpdates.width = prev.width;
        if ('height' in upds) inverseUpdates.height = prev.height;

        const inverseMeta: any = {};
        if ('color' in upds) inverseMeta.color = prev.color || '#000000';
        if (Object.keys(inverseMeta).length > 0) {
          inverseUpdates.meta = inverseMeta;
        }

        await appendOp({
          type: 'update',
          elementId: id,
          data: { updates: structuredUpdates },
          inverse: { type: 'update', elementId: id, data: { updates: inverseUpdates }, authorId: 'user' } as any,
          authorId: 'user',
        });
      });
    }
  };

  const onPersistVideoEditorModalDelete = async (id: string) => {
    const prevItem = state.videoEditorGenerators.find(m => m.id === id);
    await removeAndPersistConnectorsForElement(id);
    if (projectId && opManagerInitialized && prevItem) {
      await appendOp({
        type: 'delete',
        elementId: id,
        data: null,
        inverse: {
          type: 'create',
          elementId: id,
          data: {
            element: {
              id: prevItem.id,
              type: 'video-editor-trigger',
              x: prevItem.x,
              y: prevItem.y,
              width: prevItem.width,
              height: prevItem.height,
              meta: {
                color: prevItem.color
              }
            }
          },
          authorId: 'user',
        } as any,
        authorId: 'user',
      });
    }
  };

  const onPersistCompareModalCreate = async (modal: { id: string; x: number; y: number; width?: number; height?: number; scale?: number; prompt?: string; model?: string }) => {
    if (projectId) {
      await appendOp({
        type: 'create',
        elementId: modal.id,
        data: {
          element: {
            id: modal.id,
            type: 'compare-plugin',
            x: modal.x,
            y: modal.y,
            width: modal.width,
            height: modal.height,
            meta: {
              scale: modal.scale,
              prompt: modal.prompt,
              model: modal.model
            }
          }
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, authorId: 'user' } as any,
        authorId: 'user',
      });
    }
  };

  const onPersistCompareModalMove = async (id: string, updates: Partial<{ x: number; y: number; width?: number; height?: number; scale?: number; prompt?: string; model?: string }>) => {
    const prev = state.compareGenerators?.find(m => m.id === id);

    // Persistence (Debounced)
    if (projectId && opManagerInitialized && prev) {
      debounceMove('compare', id, updates, async (id: string, upds: any) => {
        const structuredUpdates: any = {};
        const existingMeta = {
          scale: prev.scale ?? 1,
          prompt: prev.prompt ?? '',
          model: prev.model ?? 'base'
        };

        const metaUpdates = { ...existingMeta };
        for (const k of Object.keys(upds || {})) {
          if (k === 'x' || k === 'y' || k === 'width' || k === 'height') {
            structuredUpdates[k] = (upds as any)[k];
          } else {
            (metaUpdates as any)[k] = (upds as any)[k];
          }
        }
        structuredUpdates.meta = metaUpdates;

        const inverseUpdates: any = {};
        if ('x' in upds) inverseUpdates.x = prev.x;
        if ('y' in upds) inverseUpdates.y = prev.y;
        if ('width' in upds) inverseUpdates.width = (prev as any).width;
        if ('height' in upds) inverseUpdates.height = (prev as any).height;

        const inverseMeta: any = {};
        if ('scale' in upds) inverseMeta.scale = prev.scale ?? existingMeta.scale;
        if ('prompt' in upds) inverseMeta.prompt = prev.prompt ?? existingMeta.prompt;
        if ('model' in upds) inverseMeta.model = prev.model ?? existingMeta.model;

        if (Object.keys(inverseMeta).length > 0) {
          inverseUpdates.meta = inverseMeta;
        }

        await appendOp({
          type: 'update',
          elementId: id,
          data: { updates: structuredUpdates },
          inverse: { type: 'update', elementId: id, data: { updates: inverseUpdates }, authorId: 'user' } as any,
          authorId: 'user',
        });
      });
    }
  };

  const onPersistCompareModalDelete = async (id: string) => {
    const prevItem = state.compareGenerators!.find(m => m.id === id);
    await removeAndPersistConnectorsForElement(id);
    if (projectId && opManagerInitialized && prevItem) {
      await appendOp({
        type: 'delete',
        elementId: id,
        data: null,
        inverse: {
          type: 'create',
          elementId: id,
          data: {
            element: {
              id: prevItem.id,
              type: 'compare-plugin',
              x: prevItem.x,
              y: prevItem.y,
              width: prevItem.width,
              height: prevItem.height,
              meta: {
                scale: prevItem.scale,
                prompt: prevItem.prompt,
                model: prevItem.model
              }
            }
          },
          authorId: 'user',
        } as any,
        authorId: 'user',
      });
    }
  };

  const onExpand = async (
    model: string,
    sourceImageUrl?: string,
    prompt?: string,
    canvasSize?: [number, number],
    originalImageSize?: [number, number],
    originalImageLocation?: [number, number],
    aspectRatio?: string
  ) => {
    if (!sourceImageUrl || !projectId) {
      console.error('[onExpand] Missing sourceImageUrl or projectId');
      return null;
    }

    if (!canvasSize || !originalImageSize || !originalImageLocation) {
      console.error('[onExpand] Missing frame information', { canvasSize, originalImageSize, originalImageLocation });
      throw new Error('Frame information is required for expand. Please ensure the image is positioned in the frame.');
    }

    const queueId = `expand-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const queueItem: GenerationQueueItem = {
      id: queueId,
      type: 'expand',
      operationName: 'Expanding',
      model,
      total: 1,
      index: 1,
      startedAt: Date.now(),
    };
    setters.setGenerationQueue((prev) => [...prev, queueItem]);

    console.log('[onExpand] Starting expand:', {
      model,
      sourceImageUrl: sourceImageUrl ? sourceImageUrl.substring(0, 100) + '...' : 'null',
      prompt: prompt || '(optional)',
      canvasSize,
      originalImageSize,
      originalImageLocation,
      aspectRatio: aspectRatio || '(not set)',
    });

    try {
      const { expandImageForCanvas } = await import('@/core/api/api');
      const result = await expandImageForCanvas(
        sourceImageUrl,
        projectId,
        canvasSize,
        originalImageSize,
        originalImageLocation,
        prompt,
        aspectRatio
      );

      console.log('[onExpand] Expand completed:', result);
      // Remove from queue immediately after completion
      setters.setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));
      return result.url || null;
    } catch (error: any) {
      console.error('[onExpand] Error:', error);
      // Remove from queue on error
      setters.setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));
      throw error;
    }
  };

  const onPersistVectorizeModalCreate = async (modal: VectorizeGenerator) => {
    if (projectId) {
      await appendOp({
        type: 'create',
        elementId: modal.id,
        data: {
          element: {
            id: modal.id,
            type: 'vectorize-plugin',
            x: modal.x,
            y: modal.y,
            meta: {
              vectorizedImageUrl: modal.vectorizedImageUrl || null,
              sourceImageUrl: modal.sourceImageUrl || null,
              localVectorizedImageUrl: modal.localVectorizedImageUrl || null,
              mode: modal.mode || 'simple',
              frameWidth: modal.frameWidth || 400,
              frameHeight: modal.frameHeight || 500,
              isVectorizing: modal.isVectorizing || false,
            },
          },
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, authorId: 'user' } as any,
        authorId: 'user',
      });
    }
  };

  const onPersistVectorizeModalMove = async (id: string, updates: Partial<VectorizeGenerator>) => {
    const prev = state.vectorizeGenerators.find(m => m.id === id);

    if (projectId && opManagerInitialized && prev) {
      debounceMove('vectorize', id, updates, async (id: string, upds: any) => {
        // Structure updates: meta fields go under meta, position fields top-level
        const structuredUpdates: any = {};
        const existingMeta = {
          vectorizedImageUrl: prev.vectorizedImageUrl || null,
          sourceImageUrl: prev.sourceImageUrl || null,
          localVectorizedImageUrl: prev.localVectorizedImageUrl || null,
          mode: prev.mode || 'simple',
          frameWidth: prev.frameWidth || 400,
          frameHeight: prev.frameHeight || 500,
          isVectorizing: prev.isVectorizing || false,
        };

        const metaUpdates = { ...existingMeta };
        for (const k of Object.keys(upds || {})) {
          if (k === 'x' || k === 'y') {
            structuredUpdates[k] = (upds as any)[k];
          } else {
            // All other fields go in meta
            (metaUpdates as any)[k] = (upds as any)[k];
          }
        }
        structuredUpdates.meta = metaUpdates;

        // Build inverse updates
        const inverseUpdates: any = {};
        if (prev) {
          if ('x' in upds) inverseUpdates.x = prev.x;
          if ('y' in upds) inverseUpdates.y = prev.y;
          const inverseMeta: any = {};
          if ('vectorizedImageUrl' in upds) inverseMeta.vectorizedImageUrl = prev.vectorizedImageUrl || null;
          if ('sourceImageUrl' in upds) inverseMeta.sourceImageUrl = prev.sourceImageUrl || null;
          if ('localVectorizedImageUrl' in upds) inverseMeta.localVectorizedImageUrl = prev.localVectorizedImageUrl || null;
          if ('mode' in upds) inverseMeta.mode = prev.mode || 'simple';
          if ('frameWidth' in upds) inverseMeta.frameWidth = prev.frameWidth || 400;
          if ('frameHeight' in upds) inverseMeta.frameHeight = prev.frameHeight || 500;
          if ('isVectorizing' in upds) inverseMeta.isVectorizing = prev.isVectorizing || false;
          if (Object.keys(inverseMeta).length > 0) {
            inverseUpdates.meta = inverseMeta;
          }
        }

        await appendOp({
          type: 'update',
          elementId: id,
          data: { updates: structuredUpdates },
          inverse: {
            type: 'update',
            elementId: id,
            data: { updates: inverseUpdates },
            authorId: 'user',
          } as any,
          authorId: 'user',
        });
      });
    }
  };

  const onPersistVectorizeModalDelete = async (id: string) => {
    console.log('[page.tsx] onPersistVectorizeModalDelete called', id);
    const prevItem = state.vectorizeGenerators.find(m => m.id === id);

    try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }

    if (projectId && opManagerInitialized) {
      await appendOp({
        type: 'delete',
        elementId: id,
        data: {},
        inverse: prevItem ? {
          type: 'create',
          elementId: id,
          data: {
            element: {
              id,
              type: 'vectorize-plugin',
              x: prevItem.x,
              y: prevItem.y,
              meta: {
                vectorizedImageUrl: prevItem.vectorizedImageUrl || null,
                sourceImageUrl: prevItem.sourceImageUrl || null,
                localVectorizedImageUrl: prevItem.localVectorizedImageUrl || null,
                mode: prevItem.mode || 'simple',
                frameWidth: prevItem.frameWidth || 400,
                frameHeight: prevItem.frameHeight || 500,
                isVectorizing: prevItem.isVectorizing || false,
              },
            },
          },
          authorId: 'user',
        } as any : undefined as any,
        authorId: 'user',
      });
    }
  };

  const onPersistNextSceneModalCreate = async (modal: NextSceneGenerator) => {
    if (projectId) {
      await appendOp({
        type: 'create',
        elementId: modal.id,
        data: {
          element: {
            id: modal.id,
            type: 'next-scene-plugin',
            x: modal.x,
            y: modal.y,
            meta: {
              nextSceneImageUrl: modal.nextSceneImageUrl || null,
              sourceImageUrl: modal.sourceImageUrl || null,
              localNextSceneImageUrl: modal.localNextSceneImageUrl || null,
              mode: modal.mode || 'scene',
              frameWidth: modal.frameWidth || 400,
              frameHeight: modal.frameHeight || 500,
              isProcessing: modal.isProcessing || false,
            },
          },
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, authorId: 'user' } as any,
        authorId: 'user',
      });
    }
  };

  const onPersistNextSceneModalMove = async (id: string, updates: Partial<NextSceneGenerator>) => {
    const prev = state.nextSceneGenerators.find(m => m.id === id);

    // 4. Append op for undo/redo (Debounced)
    if (projectId && opManagerInitialized && prev) {
      debounceMove('next-scene', id, updates, async (id: string, upds: any) => {
        const structuredUpdates: any = {};
        const existingMeta = {
          nextSceneImageUrl: prev.nextSceneImageUrl || null,
          sourceImageUrl: prev.sourceImageUrl || null,
          localNextSceneImageUrl: prev.localNextSceneImageUrl || null,
          mode: prev.mode || 'scene',
          frameWidth: prev.frameWidth || 400,
          frameHeight: prev.frameHeight || 500,
          isProcessing: prev.isProcessing || false,
        };
        const metaUpdates = { ...existingMeta };
        for (const k of Object.keys(upds || {})) {
          if (k === 'x' || k === 'y') {
            structuredUpdates[k] = (upds as any)[k];
          } else {
            (metaUpdates as any)[k] = (upds as any)[k];
          }
        }
        structuredUpdates.meta = metaUpdates;

        const inverseUpdates: any = {};
        if ('x' in upds) inverseUpdates.x = prev.x;
        if ('y' in upds) inverseUpdates.y = prev.y;
        const inverseMeta: any = {};
        if ('nextSceneImageUrl' in upds) inverseMeta.nextSceneImageUrl = prev.nextSceneImageUrl || null;
        if ('sourceImageUrl' in upds) inverseMeta.sourceImageUrl = prev.sourceImageUrl || null;
        if ('localNextSceneImageUrl' in upds) inverseMeta.localNextSceneImageUrl = prev.localNextSceneImageUrl || null;
        if ('mode' in upds) inverseMeta.mode = prev.mode || 'scene';
        if ('frameWidth' in upds) inverseMeta.frameWidth = prev.frameWidth || 400;
        if ('frameHeight' in upds) inverseMeta.frameHeight = prev.frameHeight || 500;
        if ('isProcessing' in upds) inverseMeta.isProcessing = prev.isProcessing || false;
        if (Object.keys(inverseMeta).length > 0) {
          inverseUpdates.meta = inverseMeta;
        }

        await appendOp({
          type: 'update',
          elementId: id,
          data: { updates: structuredUpdates },
          inverse: {
            type: 'update',
            elementId: id,
            data: { updates: inverseUpdates },
            authorId: 'user',
          } as any,
          authorId: 'user',
        });
      });
    }
  };

  const onPersistNextSceneModalDelete = async (id: string) => {
    const prevItem = state.nextSceneGenerators.find(m => m.id === id);
    await removeAndPersistConnectorsForElement(id);
    if (projectId && opManagerInitialized && prevItem) {
      await appendOp({
        type: 'delete',
        elementId: id,
        data: {},
        inverse: {
          type: 'create',
          elementId: id,
          data: {
            element: {
              id: prevItem.id,
              type: 'next-scene-plugin',
              x: prevItem.x,
              y: prevItem.y,
              meta: {
                nextSceneImageUrl: prevItem.nextSceneImageUrl || null,
                sourceImageUrl: prevItem.sourceImageUrl || null,
                localNextSceneImageUrl: prevItem.localNextSceneImageUrl || null,
                mode: prevItem.mode,
                frameWidth: prevItem.frameWidth,
                frameHeight: prevItem.frameHeight,
                isProcessing: prevItem.isProcessing,
              },
            },
          },
          authorId: 'user',
        } as any,
        authorId: 'user',
      });
    }
  };

  const onVectorize = async (sourceImageUrl?: string, mode?: string) => {
    if (!sourceImageUrl || !projectId) {
      console.error('[onVectorize] Missing sourceImageUrl or projectId');
      return null;
    }

    const queueId = `vectorize-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const queueItem: GenerationQueueItem = {
      id: queueId,
      type: 'vectorize',
      operationName: 'Vectorizing',
      model: mode || 'simple',
      total: 1,
      index: 1,
      startedAt: Date.now(),
    };
    setters.setGenerationQueue((prev) => [...prev, queueItem]);

    try {
      console.log('[onVectorize] Starting vectorize:', { sourceImageUrl, mode });
      const { vectorizeImageForCanvas } = await import('@/core/api/api');
      const result = await vectorizeImageForCanvas(
        sourceImageUrl,
        projectId,
        mode
      );

      console.log('[onVectorize] Vectorize completed:', result);
      // Remove from queue immediately after completion
      setters.setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));
      return result.url || null;
    } catch (error: any) {
      console.error('[onVectorize] Error:', error);
      // Remove from queue on error
      setters.setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));
      throw error;
    }
  };



  // Storyboard plugin handlers
  const onPersistStoryboardModalCreate = async (modal: { id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }) => {
    if (projectId) {
      await appendOp({
        type: 'create',
        elementId: modal.id,
        data: {
          element: {
            id: modal.id,
            type: 'storyboard-plugin',
            x: modal.x,
            y: modal.y,
            meta: {
              frameWidth: modal.frameWidth || 400,
              frameHeight: modal.frameHeight || 500,
              scriptText: (modal as StoryboardGenerator).scriptText || null,
              characterNamesMap: (modal as any).characterNamesMap || {},
              propsNamesMap: (modal as any).propsNamesMap || {},
              backgroundNamesMap: (modal as any).backgroundNamesMap || {},
            },
          },
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, authorId: 'user' } as any,
        authorId: 'user',
      });
    }
  };

  const onPersistStoryboardModalMove = async (id: string, updates: Partial<{ x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null; characterNamesMap?: Record<number, string>; propsNamesMap?: Record<number, string>; backgroundNamesMap?: Record<number, string>; stitchedImageUrl?: string }>) => {
    // 1. Capture previous state (for inverse op)
    const prev = state.storyboardGenerators.find(m => m.id === id);

    // 4. Append op for undo/redo (Debounced)
    if (projectId && opManagerInitialized && prev) {
      debounceMove('storyboard', id, updates, async (id: string, upds: any) => {
        const structuredUpdates: any = {};
        const existingMeta = {
          frameWidth: prev.frameWidth || 400,
          frameHeight: prev.frameHeight || 500,
          scriptText: (prev as StoryboardGenerator).scriptText || null,
          characterNamesMap: (prev as any).characterNamesMap || {},
          propsNamesMap: (prev as any).propsNamesMap || {},
          backgroundNamesMap: (prev as any).backgroundNamesMap || {},
        };

        const metaUpdates = { ...existingMeta };
        for (const k of Object.keys(upds || {})) {
          if (k === 'x' || k === 'y') {
            structuredUpdates[k] = (upds as any)[k];
          } else {
            (metaUpdates as any)[k] = (upds as any)[k];
          }
        }
        structuredUpdates.meta = metaUpdates;

        // Build inverse updates
        const inverseUpdates: any = {};
        if (prev) {
          if ('x' in upds) inverseUpdates.x = prev.x;
          if ('y' in upds) inverseUpdates.y = prev.y;
          const inverseMeta: any = {};
          if ('frameWidth' in upds) inverseMeta.frameWidth = prev.frameWidth || 400;
          if ('frameHeight' in upds) inverseMeta.frameHeight = prev.frameHeight || 500;
          if ('scriptText' in upds) inverseMeta.scriptText = (prev as StoryboardGenerator).scriptText || null;
          if ('characterNamesMap' in upds) inverseMeta.characterNamesMap = (prev as any).characterNamesMap || {};
          if ('propsNamesMap' in upds) inverseMeta.propsNamesMap = (prev as any).propsNamesMap || {};
          if ('backgroundNamesMap' in upds) inverseMeta.backgroundNamesMap = (prev as any).backgroundNamesMap || {};
          if (Object.keys(inverseMeta).length > 0) {
            inverseUpdates.meta = inverseMeta;
          }
        }

        await appendOp({
          type: 'update',
          elementId: id,
          data: { updates: structuredUpdates },
          inverse: {
            type: 'update',
            elementId: id,
            data: { updates: inverseUpdates },
            authorId: 'user',
          } as any,
          authorId: 'user',
        });
      });
    }
  };

  const onPersistStoryboardModalDelete = async (id: string) => {
    console.log('[page.tsx] onPersistStoryboardModalDelete called', id);
    const prevItem = state.storyboardGenerators.find(m => m.id === id);

    // Also remove any connectors that referenced this element
    try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }
    // Always append op for undo/redo and persistence
    if (projectId && opManagerInitialized && prevItem) {
      await appendOp({
        type: 'delete',
        elementId: id,
        data: {},
        inverse: {
          type: 'create',
          elementId: id,
          data: {
            element: {
              id,
              type: 'storyboard-plugin',
              x: prevItem.x,
              y: prevItem.y,
              meta: {
                frameWidth: prevItem.frameWidth || 400,
                frameHeight: prevItem.frameHeight || 500,
              },
            },
          },
          authorId: 'user',
        } as any,
        authorId: 'user',
      });
    }
  };

  // ScriptFrame plugin handlers
  const onPersistScriptFrameModalCreate = async (modal: ScriptFrameGenerator) => {
    if (projectId) {
      await appendOp({
        type: 'create',
        elementId: modal.id,
        data: {
          element: {
            id: modal.id,
            type: 'script-frame',
            x: modal.x,
            y: modal.y,
            meta: {
              pluginId: modal.pluginId,
              frameWidth: modal.frameWidth,
              frameHeight: modal.frameHeight,
              text: modal.text,
            },
          },
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, authorId: 'user' } as any,
        authorId: 'user',
      });
    }
  };

  const onPersistScriptFrameModalMove = async (id: string, updates: Partial<ScriptFrameGenerator>) => {
    // 1. Capture previous state
    const prev = state.scriptFrameGenerators.find(m => m.id === id);

    // 4. Append op
    // 4. Append op (Debounced)
    if (projectId && opManagerInitialized && prev) {
      debounceMove('script-frame', id, updates, async (id: string, upds: any) => {
        const structuredUpdates: any = {};
        const existingMeta = {
          pluginId: prev.pluginId,
          frameWidth: prev.frameWidth,
          frameHeight: prev.frameHeight,
          text: prev.text,
        };

        const metaUpdates = { ...existingMeta };
        for (const k of Object.keys(upds || {})) {
          if (k === 'x' || k === 'y') {
            structuredUpdates[k] = (upds as any)[k];
          } else {
            (metaUpdates as any)[k] = (upds as any)[k];
          }
        }
        structuredUpdates.meta = metaUpdates;

        const inverseUpdates: any = {};
        if (prev) {
          if ('x' in upds) inverseUpdates.x = prev.x;
          if ('y' in upds) inverseUpdates.y = prev.y;
          const inverseMeta: any = {};
          if ('pluginId' in upds) inverseMeta.pluginId = prev.pluginId;
          if ('frameWidth' in upds) inverseMeta.frameWidth = prev.frameWidth;
          if ('frameHeight' in upds) inverseMeta.frameHeight = prev.frameHeight;
          if ('text' in upds) inverseMeta.text = prev.text;
          if (Object.keys(inverseMeta).length > 0) {
            inverseUpdates.meta = inverseMeta;
          }
        }

        await appendOp({
          type: 'update',
          elementId: id,
          data: { updates: structuredUpdates },
          inverse: {
            type: 'update',
            elementId: id,
            data: { updates: inverseUpdates },
            authorId: 'user',
          } as any,
          authorId: 'user',
        });
      });
    }
  };

  const onPersistScriptFrameModalDelete = async (id: string) => {
    console.log('[page.tsx] onPersistScriptFrameModalDelete called', id);
    const prevItem = state.scriptFrameGenerators.find(m => m.id === id);

    try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }

    if (projectId && opManagerInitialized && prevItem) {
      await appendOp({
        type: 'delete',
        elementId: id,
        data: {},
        inverse: {
          type: 'create',
          elementId: id,
          data: {
            element: {
              id,
              type: 'script-frame',
              x: prevItem.x,
              y: prevItem.y,
              meta: {
                pluginId: prevItem.pluginId,
                frameWidth: prevItem.frameWidth,
                frameHeight: prevItem.frameHeight,
                text: prevItem.text,
              },
            },
          },
          authorId: 'user',
        } as any,
        authorId: 'user',
      });
    }
  };

  // SceneFrame plugin handlers
  const onPersistSceneFrameModalCreate = async (modal: SceneFrameGenerator) => {
    if (projectId) {
      await appendOp({
        type: 'create',
        elementId: modal.id,
        data: {
          element: {
            id: modal.id,
            type: 'scene-frame',
            x: modal.x,
            y: modal.y,
            meta: {
              scriptFrameId: modal.scriptFrameId,
              sceneNumber: modal.sceneNumber,
              frameWidth: modal.frameWidth,
              frameHeight: modal.frameHeight,
              content: modal.content,
              characterIds: modal.characterIds,
              locationId: modal.locationId,
              mood: modal.mood,
              characterNames: (modal as any).characterNames,
              locationName: (modal as any).locationName,
            },
          },
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, authorId: 'user' } as any,
        authorId: 'user',
      });
    }
  };

  const onPersistSceneFrameModalMove = async (id: string, updates: Partial<SceneFrameGenerator>) => {
    const prev = state.sceneFrameGenerators.find(m => m.id === id);

    // Persistence (Debounced)
    if (projectId && opManagerInitialized && prev) {
      debounceMove('scene-frame', id, updates, async (id: string, upds: any) => {
        const structuredUpdates: any = {};
        const existingMeta = {
          scriptFrameId: prev.scriptFrameId,
          sceneNumber: prev.sceneNumber,
          frameWidth: prev.frameWidth,
          frameHeight: prev.frameHeight,
          content: prev.content,
        };

        const metaUpdates = { ...existingMeta };
        for (const k of Object.keys(upds || {})) {
          if (k === 'x' || k === 'y') {
            structuredUpdates[k] = (upds as any)[k];
          } else {
            (metaUpdates as any)[k] = (upds as any)[k];
          }
        }
        structuredUpdates.meta = metaUpdates;

        const inverseUpdates: any = {};
        if (prev) {
          if ('x' in upds) inverseUpdates.x = prev.x;
          if ('y' in upds) inverseUpdates.y = prev.y;
          const inverseMeta: any = {};
          if ('scriptFrameId' in upds) inverseMeta.scriptFrameId = prev.scriptFrameId;
          if ('sceneNumber' in upds) inverseMeta.sceneNumber = prev.sceneNumber;
          if ('frameWidth' in upds) inverseMeta.frameWidth = prev.frameWidth;
          if ('frameHeight' in upds) inverseMeta.frameHeight = prev.frameHeight;
          if ('content' in upds) inverseMeta.content = prev.content;
          if ('characterIds' in upds) inverseMeta.characterIds = (prev as any).characterIds;
          if ('locationId' in upds) inverseMeta.locationId = (prev as any).locationId;
          if ('mood' in upds) inverseMeta.mood = (prev as any).mood;
          if (Object.keys(inverseMeta).length > 0) {
            inverseUpdates.meta = inverseMeta;
          }
        }

        await appendOp({
          type: 'update',
          elementId: id,
          data: { updates: structuredUpdates },
          inverse: {
            type: 'update',
            elementId: id,
            data: { updates: inverseUpdates },
            authorId: 'user',
          } as any,
          authorId: 'user',
        });
      });
    }
  };

  const onPersistSceneFrameModalDelete = async (id: string) => {
    console.log('[page.tsx] onPersistSceneFrameModalDelete called', id);
    const prevItem = state.sceneFrameGenerators.find(m => m.id === id);

    try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }

    if (projectId && opManagerInitialized && prevItem) {
      await appendOp({
        type: 'delete',
        elementId: id,
        data: {},
        inverse: {
          type: 'create',
          elementId: id,
          data: {
            element: {
              id,
              type: 'scene-frame',
              x: prevItem.x,
              y: prevItem.y,
              meta: {
                scriptFrameId: prevItem.scriptFrameId,
                sceneNumber: prevItem.sceneNumber,
                frameWidth: prevItem.frameWidth,
                frameHeight: prevItem.frameHeight,
                content: prevItem.content,
              },
            },
          },
          authorId: 'user',
        } as any,
        authorId: 'user',
      });
    }
  };

  return {
    onPersistCompareModalCreate,
    onPersistCompareModalMove,
    onPersistCompareModalDelete,
    onPersistUpscaleModalCreate,
    onPersistUpscaleModalMove,
    onPersistUpscaleModalDelete,
    onPersistMultiangleCameraModalCreate,
    onPersistMultiangleCameraModalMove,
    onPersistMultiangleCameraModalDelete,
    onPersistRemoveBgModalCreate,
    onPersistRemoveBgModalMove,
    onPersistRemoveBgModalDelete,
    onPersistEraseModalCreate,
    onPersistEraseModalMove,
    onPersistEraseModalDelete,
    onPersistVectorizeModalCreate,
    onPersistVectorizeModalMove,
    onPersistVectorizeModalDelete,
    onPersistNextSceneModalCreate,
    onPersistNextSceneModalMove,
    onPersistNextSceneModalDelete,
    onUpscale,
    onMultiangleCamera,
    onRemoveBg,
    onErase,
    onPersistExpandModalCreate,
    onPersistExpandModalMove,
    onPersistExpandModalDelete,
    onExpand,
    onVectorize,
    onPersistStoryboardModalCreate,
    onPersistStoryboardModalMove,
    onPersistStoryboardModalDelete,
    onPersistScriptFrameModalCreate,
    onPersistScriptFrameModalMove,
    onPersistScriptFrameModalDelete,
    onPersistSceneFrameModalCreate,
    onPersistSceneFrameModalMove,
    onPersistSceneFrameModalDelete,
    onPersistVideoEditorModalCreate,
    onPersistVideoEditorModalMove,
    onPersistVideoEditorModalDelete,
  };
}
