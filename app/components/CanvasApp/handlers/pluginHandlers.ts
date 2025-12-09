import { CanvasAppState, CanvasAppSetters, UpscaleGenerator, RemoveBgGenerator, EraseGenerator, ExpandGenerator, VectorizeGenerator, StoryboardGenerator, ScriptFrameGenerator, SceneFrameGenerator, VideoEditorGenerator } from '../types';

export interface PluginHandlers {
  onPersistUpscaleModalCreate: (modal: UpscaleGenerator) => Promise<void>;
  onPersistUpscaleModalMove: (id: string, updates: Partial<UpscaleGenerator>) => Promise<void>;
  onPersistUpscaleModalDelete: (id: string) => Promise<void>;
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
  onUpscale: (model: string, scale: number, sourceImageUrl?: string) => Promise<string | null>;
  onRemoveBg: (model: string, backgroundType: string, scaleValue: number, sourceImageUrl?: string) => Promise<string | null>;
  onErase: (model: string, sourceImageUrl?: string, mask?: string, prompt?: string) => Promise<string | null>;
  onExpand: (model: string, sourceImageUrl?: string, prompt?: string, canvasSize?: [number, number], originalImageSize?: [number, number], originalImageLocation?: [number, number], aspectRatio?: string) => Promise<string | null>;
  onVectorize: (sourceImageUrl?: string, mode?: string) => Promise<string | null>;
}

export function createPluginHandlers(
  state: CanvasAppState,
  setters: CanvasAppSetters,
  projectId: string | null,
  opManagerInitialized: boolean,
  appendOp: (op: any) => Promise<void>,
  realtimeActive: boolean,
  realtimeRef: React.RefObject<any>,
  removeAndPersistConnectorsForElement: (elementId: string) => Promise<void>
): PluginHandlers {
  const onPersistUpscaleModalCreate = async (modal: UpscaleGenerator) => {
    // Optimistic update
    setters.setUpscaleGenerators(prev => prev.some(m => m.id === modal.id) ? prev : [...prev, modal]);
    // Broadcast via realtime
    if (realtimeActive) {
      console.log('[Realtime] broadcast create upscale', modal.id);
      realtimeRef.current?.sendCreate({
        id: modal.id,
        type: 'upscale',
        x: modal.x,
        y: modal.y,
        upscaledImageUrl: modal.upscaledImageUrl || null,
        sourceImageUrl: modal.sourceImageUrl || null,
        localUpscaledImageUrl: modal.localUpscaledImageUrl || null,
        model: modal.model,
        scale: modal.scale,
        frameWidth: modal.frameWidth,
        frameHeight: modal.frameHeight,
        isUpscaling: modal.isUpscaling,
      });
    }
    // Always append op for undo/redo and persistence
    if (projectId && opManagerInitialized) {
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
            },
          },
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, requestId: '', clientTs: 0 } as any,
      });
    }
  };

  const onPersistUpscaleModalMove = async (id: string, updates: Partial<UpscaleGenerator>) => {
    // Capture previous state before update (for inverse op)
    const prev = state.upscaleGenerators.find(m => m.id === id);

    // Optimistic update - this triggers the snapshot useEffect
    setters.setUpscaleGenerators(prevState =>
      prevState.map(m => m.id === id ? { ...m, ...updates } : m)
    );

    // Broadcast via realtime
    if (realtimeActive) {
      realtimeRef.current?.sendUpdate(id, updates as any);
    }
    // Always append op for undo/redo and persistence
    if (projectId && opManagerInitialized) {
      // Structure updates correctly: meta fields go under meta, position fields go top-level
      const structuredUpdates: any = {};

      // Get existing meta from previous state (fields are stored at top level in state)
      const existingMeta = prev ? {
        upscaledImageUrl: (prev as any).upscaledImageUrl ?? null,
        sourceImageUrl: (prev as any).sourceImageUrl ?? null,
        localUpscaledImageUrl: (prev as any).localUpscaledImageUrl ?? null,
        model: (prev as any).model ?? 'Crystal Upscaler',
        scale: (prev as any).scale ?? 2,
        frameWidth: (prev as any).frameWidth ?? 400,
        frameHeight: (prev as any).frameHeight ?? 500,
        isUpscaling: (prev as any).isUpscaling ?? false,
      } : {
        upscaledImageUrl: null,
        sourceImageUrl: null,
        localUpscaledImageUrl: null,
        model: 'Crystal Upscaler',
        scale: 2,
        frameWidth: 400,
        frameHeight: 500,
        isUpscaling: false,
      };

      // Merge updates into meta
      const metaUpdates = { ...existingMeta };
      for (const k of Object.keys(updates || {})) {
        if (k === 'x' || k === 'y' || k === 'width' || k === 'height') {
          structuredUpdates[k] = (updates as any)[k];
        } else if (k === 'model' || k === 'scale' || k === 'upscaledImageUrl' || k === 'sourceImageUrl' || k === 'localUpscaledImageUrl' || k === 'isUpscaling' || k === 'frameWidth' || k === 'frameHeight') {
          metaUpdates[k] = (updates as any)[k];
        } else {
          structuredUpdates[k] = (updates as any)[k];
        }
      }

      // Always include meta in updates (backend does shallow merge)
      structuredUpdates.meta = metaUpdates;

      // Build inverse updates
      const inverseUpdates: any = {};
      if (prev) {
        if ('x' in updates) inverseUpdates.x = prev.x;
        if ('y' in updates) inverseUpdates.y = prev.y;
        if ('width' in updates) inverseUpdates.width = (prev as any).width;
        if ('height' in updates) inverseUpdates.height = (prev as any).height;

        // Inverse meta should restore previous meta
        const inverseMeta: any = {};
        for (const k of Object.keys(updates || {})) {
          if (k === 'model' || k === 'scale' || k === 'upscaledImageUrl' || k === 'sourceImageUrl' || k === 'localUpscaledImageUrl' || k === 'isUpscaling' || k === 'frameWidth' || k === 'frameHeight') {
            inverseMeta[k] = (prev as any)[k] ?? existingMeta[k];
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
        inverse: { type: 'update', elementId: id, data: { updates: inverseUpdates }, requestId: '', clientTs: 0 } as any,
      });
    }
  };

  const onPersistUpscaleModalDelete = async (id: string) => {
    console.log('[page.tsx] onPersistUpscaleModalDelete called', id);
    const prevItem = state.upscaleGenerators.find(m => m.id === id);
    // Update state IMMEDIATELY and SYNCHRONOUSLY - don't wait for async operations
    setters.setUpscaleGenerators(prev => {
      const filtered = prev.filter(m => m.id !== id);
      console.log('[page.tsx] upscaleGenerators updated, remaining:', filtered.length);
      return filtered;
    });
    // Then do async operations
    if (realtimeActive) {
      console.log('[Realtime] broadcast delete upscale', id);
      realtimeRef.current?.sendDelete(id);
    }
    // Also remove any connectors that referenced this element
    try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }
    // Always append op for undo/redo and persistence
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
              },
            },
          },
          requestId: '',
          clientTs: 0,
        } as any : undefined as any,
      });
    }
  };

  const onUpscale = async (model: string, scale: number, sourceImageUrl?: string) => {
    if (!sourceImageUrl || !projectId) {
      console.error('[onUpscale] Missing sourceImageUrl or projectId');
      return null;
    }

    try {
      console.log('[onUpscale] Starting upscale:', { model, scale, sourceImageUrl });
      const { upscaleImageForCanvas } = await import('@/lib/api');
      const result = await upscaleImageForCanvas(
        sourceImageUrl,
        model || 'Crystal Upscaler',
        scale || 2,
        projectId
      );

      console.log('[onUpscale] Upscale completed:', result);
      // Extract URL from result - result should be the data object with url property
      const upscaledUrl = result?.url || (typeof result === 'string' ? result : null);
      console.log('[onUpscale] Extracted URL:', upscaledUrl);
      return upscaledUrl;
    } catch (error: any) {
      console.error('[onUpscale] Error:', error);
      throw error;
    }
  };

  const onPersistRemoveBgModalCreate = async (modal: RemoveBgGenerator) => {
    // Optimistic update
    setters.setRemoveBgGenerators(prev => prev.some(m => m.id === modal.id) ? prev : [...prev, modal]);
    // Broadcast via realtime
    if (realtimeActive) {
      console.log('[Realtime] broadcast create removebg', modal.id);
      realtimeRef.current?.sendCreate({
        id: modal.id,
        type: 'removebg',
        x: modal.x,
        y: modal.y,
        removedBgImageUrl: modal.removedBgImageUrl || null,
        sourceImageUrl: modal.sourceImageUrl || null,
        localRemovedBgImageUrl: modal.localRemovedBgImageUrl || null,
        model: (modal as any).model,
        backgroundType: (modal as any).backgroundType,
        scaleValue: (modal as any).scaleValue,
        frameWidth: modal.frameWidth,
        frameHeight: modal.frameHeight,
        isRemovingBg: modal.isRemovingBg,
      });
    }
    // Always append op for undo/redo and persistence
    if (projectId && opManagerInitialized) {
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
        inverse: { type: 'delete', elementId: modal.id, data: {}, requestId: '', clientTs: 0 } as any,
      });
    }
  };

  const onPersistRemoveBgModalMove = async (id: string, updates: Partial<RemoveBgGenerator>) => {
    // 1. Capture previous state (for inverse op)
    const prev = state.removeBgGenerators.find(m => m.id === id);

    // 2. Optimistic update (triggers snapshot useEffect)
    setters.setRemoveBgGenerators(prevState =>
      prevState.map(m => m.id === id ? { ...m, ...updates } : m)
    );

    // 3. Broadcast via realtime
    if (realtimeActive) {
      console.log('[Realtime] broadcast move removebg', id);
      realtimeRef.current?.sendUpdate(id, updates as any);
    }

    // 4. Append op for undo/redo
    if (projectId && opManagerInitialized) {
      // Structure updates: meta fields go under meta, position fields top-level
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
      for (const k of Object.keys(updates || {})) {
        if (k === 'x' || k === 'y') {
          structuredUpdates[k] = (updates as any)[k];
        } else {
          // All other fields go in meta
          (metaUpdates as any)[k] = (updates as any)[k];
        }
      }
      structuredUpdates.meta = metaUpdates;

      // Build inverse updates
      const inverseUpdates: any = {};
      if (prev) {
        if ('x' in updates) inverseUpdates.x = prev.x;
        if ('y' in updates) inverseUpdates.y = prev.y;
        const inverseMeta: any = {};
        if ('removedBgImageUrl' in updates) inverseMeta.removedBgImageUrl = prev.removedBgImageUrl || null;
        if ('sourceImageUrl' in updates) inverseMeta.sourceImageUrl = prev.sourceImageUrl || null;
        if ('localRemovedBgImageUrl' in updates) inverseMeta.localRemovedBgImageUrl = prev.localRemovedBgImageUrl || null;
        if ('model' in updates) inverseMeta.model = prev.model || '851-labs/background-remover';
        if ('backgroundType' in updates) inverseMeta.backgroundType = prev.backgroundType || 'rgba (transparent)';
        if ('scaleValue' in updates) inverseMeta.scaleValue = prev.scaleValue || 0.5;
        if ('frameWidth' in updates) inverseMeta.frameWidth = prev.frameWidth || 400;
        if ('frameHeight' in updates) inverseMeta.frameHeight = prev.frameHeight || 500;
        if ('isRemovingBg' in updates) inverseMeta.isRemovingBg = prev.isRemovingBg || false;
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
          requestId: '',
          clientTs: 0,
        } as any,
      });
    }
  };

  const onPersistRemoveBgModalDelete = async (id: string) => {
    console.log('[page.tsx] onPersistRemoveBgModalDelete called', id);
    const prevItem = state.removeBgGenerators.find(m => m.id === id);
    // Update state IMMEDIATELY and SYNCHRONOUSLY - don't wait for async operations
    setters.setRemoveBgGenerators(prev => {
      const filtered = prev.filter(m => m.id !== id);
      console.log('[page.tsx] removeBgGenerators updated, remaining:', filtered.length);
      return filtered;
    });
    // Then do async operations
    if (realtimeActive) {
      console.log('[Realtime] broadcast delete removebg', id);
      realtimeRef.current?.sendDelete(id);
    }
    // Also remove any connectors that referenced this element
    try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }
    // Always append op for undo/redo and persistence
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
          requestId: '',
          clientTs: 0,
        } as any : undefined as any,
      });
    }
  };

  const onRemoveBg = async (model: string, backgroundType: string, scaleValue: number, sourceImageUrl?: string) => {
    if (!sourceImageUrl || !projectId) {
      console.error('[onRemoveBg] Missing sourceImageUrl or projectId');
      return null;
    }

    try {
      console.log('[onRemoveBg] Starting remove bg:', { model, backgroundType, scaleValue, sourceImageUrl });
      const { removeBgImageForCanvas } = await import('@/lib/api');
      const result = await removeBgImageForCanvas(
        sourceImageUrl,
        projectId,
        model,
        backgroundType,
        scaleValue
      );

      console.log('[onRemoveBg] Remove bg completed:', result);
      return result.url || null;
    } catch (error: any) {
      console.error('[onRemoveBg] Error:', error);
      throw error;
    }
  };

  const onPersistEraseModalCreate = async (modal: EraseGenerator) => {
    // Optimistic update
    setters.setEraseGenerators(prev => prev.some(m => m.id === modal.id) ? prev : [...prev, modal]);
    // Broadcast via realtime
    if (realtimeActive) {
      console.log('[Realtime] broadcast create erase', modal.id);
      realtimeRef.current?.sendCreate({
        id: modal.id,
        type: 'erase',
        x: modal.x,
        y: modal.y,
        erasedImageUrl: modal.erasedImageUrl || null,
        sourceImageUrl: modal.sourceImageUrl || null,
        localErasedImageUrl: modal.localErasedImageUrl || null,
        model: modal.model,
        frameWidth: modal.frameWidth,
        frameHeight: modal.frameHeight,
        isErasing: modal.isErasing,
      });
    }
    // Always append op for undo/redo and persistence
    if (projectId && opManagerInitialized) {
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
      });
    }
  };

  const onPersistEraseModalMove = async (id: string, updates: Partial<EraseGenerator>) => {
    // 1. Capture previous state (for inverse op)
    const prev = state.eraseGenerators.find(m => m.id === id);

    // 2. Optimistic update (triggers snapshot useEffect)
    setters.setEraseGenerators(prevState =>
      prevState.map(m => m.id === id ? { ...m, ...updates } : m)
    );

    // 3. Broadcast via realtime
    if (realtimeActive) {
      console.log('[Realtime] broadcast update erase', id);
      realtimeRef.current?.sendUpdate(id, updates as any);
    }

    // 4. Append op for undo/redo and persistence
    if (projectId && opManagerInitialized && prev) {
      await appendOp({
        type: 'move',
        elementType: 'erase',
        elementId: id,
        data: updates,
        inverse: {
          type: 'move',
          elementType: 'erase',
          elementId: id,
          data: {
            x: prev.x,
            y: prev.y,
            erasedImageUrl: prev.erasedImageUrl || null,
            sourceImageUrl: prev.sourceImageUrl || null,
            localErasedImageUrl: prev.localErasedImageUrl || null,
            model: prev.model,
            frameWidth: prev.frameWidth,
            frameHeight: prev.frameHeight,
            isErasing: prev.isErasing,
          },
        },
      });
    }
  };

  const onPersistEraseModalDelete = async (id: string) => {
    // 1. Capture previous state (for inverse op)
    const prevItem = state.eraseGenerators.find(m => m.id === id);
    // Update state IMMEDIATELY and SYNCHRONOUSLY - don't wait for async operations
    setters.setEraseGenerators(prev => {
      const filtered = prev.filter(m => m.id !== id);
      console.log('[page.tsx] eraseGenerators updated, remaining:', filtered.length);
      return filtered;
    });
    // Then do async operations
    if (realtimeActive) {
      console.log('[Realtime] broadcast delete erase', id);
      realtimeRef.current?.sendDelete(id);
    }
    // Remove connectors for this element
    await removeAndPersistConnectorsForElement(id);
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
            erasedImageUrl: prevItem.erasedImageUrl || null,
            sourceImageUrl: prevItem.sourceImageUrl || null,
            localErasedImageUrl: prevItem.localErasedImageUrl || null,
            model: prevItem.model,
            frameWidth: prevItem.frameWidth,
            frameHeight: prevItem.frameHeight,
            isErasing: prevItem.isErasing,
          },
        },
      });
    }
  };

  const convertBlobUrlToDataUrl = async (blobUrl: string): Promise<string> => {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to read local image (status ${response.status}). Please reconnect the image and try again.`);
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
      const { eraseImageForCanvas } = await import('@/lib/api');
      let imagePayload = sourceImageUrl;
      if (imagePayload.startsWith('blob:')) {
        console.log('[onErase] Converting blob URL to data URI for API compatibility');
        imagePayload = await convertBlobUrlToDataUrl(imagePayload);
      }
      // Pass composited image as image parameter, mask is optional (can be undefined)
      const result = await eraseImageForCanvas(
        imagePayload, // This is the composited image (original + white mask overlay)
        projectId,
        model,
        mask, // Optional - can be undefined since mask is composited into image
        prompt
      );

      console.log('[onErase] Erase completed:', result);
      return result.url || null;
    } catch (error: any) {
      console.error('[onErase] Error:', error);
      throw error;
    }
  };

  const onPersistExpandModalCreate = async (modal: ExpandGenerator) => {
    setters.setExpandGenerators(prev => prev.some(m => m.id === modal.id) ? prev : [...prev, modal]);
    if (realtimeActive) {
      console.log('[Realtime] broadcast create expand', modal.id);
      realtimeRef.current?.sendCreate({
        id: modal.id,
        type: 'expand',
        x: modal.x,
        y: modal.y,
        expandedImageUrl: modal.expandedImageUrl || null,
        sourceImageUrl: modal.sourceImageUrl || null,
        localExpandedImageUrl: modal.localExpandedImageUrl || null,
        model: modal.model || 'expand/base',
        frameWidth: modal.frameWidth,
        frameHeight: modal.frameHeight,
        isExpanding: modal.isExpanding,
      });
    }
    if (projectId && opManagerInitialized) {
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
        inverse: { type: 'delete', elementId: modal.id, data: {}, requestId: '', clientTs: 0 } as any,
      });
    }
  };

  const onPersistExpandModalMove = async (id: string, updates: Partial<ExpandGenerator>) => {
    const prev = state.expandGenerators.find(m => m.id === id);
    setters.setExpandGenerators(prevState =>
      prevState.map(m => m.id === id ? { ...m, ...updates } : m)
    );
    if (realtimeActive) {
      console.log('[Realtime] broadcast move expand', id);
      realtimeRef.current?.sendUpdate(id, updates as any);
    }
    if (projectId && opManagerInitialized && prev) {
      const structuredUpdates: any = {};
      const existingMeta = {
        expandedImageUrl: prev.expandedImageUrl || null,
        sourceImageUrl: prev.sourceImageUrl || null,
        localExpandedImageUrl: prev.localExpandedImageUrl || null,
        model: prev.model || 'expand/base',
        frameWidth: prev.frameWidth || 400,
        frameHeight: prev.frameHeight || 500,
        isExpanding: prev.isExpanding || false,
      };
      const metaUpdates = { ...existingMeta };
      for (const k of Object.keys(updates || {})) {
        if (k === 'x' || k === 'y') {
          structuredUpdates[k] = (updates as any)[k];
        } else {
          (metaUpdates as any)[k] = (updates as any)[k];
        }
      }
      structuredUpdates.meta = metaUpdates;

      const inverseUpdates: any = {};
      if ('x' in updates) inverseUpdates.x = prev.x;
      if ('y' in updates) inverseUpdates.y = prev.y;
      const inverseMeta: any = {};
      if ('expandedImageUrl' in updates) inverseMeta.expandedImageUrl = prev.expandedImageUrl || null;
      if ('sourceImageUrl' in updates) inverseMeta.sourceImageUrl = prev.sourceImageUrl || null;
      if ('localExpandedImageUrl' in updates) inverseMeta.localExpandedImageUrl = prev.localExpandedImageUrl || null;
      if ('model' in updates) inverseMeta.model = prev.model || 'expand/base';
      if ('frameWidth' in updates) inverseMeta.frameWidth = prev.frameWidth || 400;
      if ('frameHeight' in updates) inverseMeta.frameHeight = prev.frameHeight || 500;
      if ('isExpanding' in updates) inverseMeta.isExpanding = prev.isExpanding || false;
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
          requestId: '',
          clientTs: 0,
        } as any,
      });
    }
  };

  const onPersistExpandModalDelete = async (id: string) => {
    const prevItem = state.expandGenerators.find(m => m.id === id);
    setters.setExpandGenerators(prev => prev.filter(m => m.id !== id));
    if (realtimeActive) {
      console.log('[Realtime] broadcast delete expand', id);
      realtimeRef.current?.sendDelete(id);
    }
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
        },
      });
    }
  };

  const onPersistVideoEditorModalCreate = async (modal: VideoEditorGenerator) => {
    setters.setVideoEditorGenerators(prev => prev.some(m => m.id === modal.id) ? prev : [...prev, modal]);
    if (realtimeActive) {
      console.log('[Realtime] broadcast create video-editor', modal.id);
      realtimeRef.current?.sendCreate({
        id: modal.id,
        type: 'video-editor',
        x: modal.x,
        y: modal.y,
      });
    }
    if (projectId && opManagerInitialized) {
      await appendOp({
        type: 'create',
        elementId: modal.id,
        data: {
          element: {
            id: modal.id,
            type: 'video-editor-trigger',
            x: modal.x,
            y: modal.y,
            meta: {},
          },
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, requestId: '', clientTs: 0 } as any,
      });
    }
  };

  const onPersistVideoEditorModalMove = async (id: string, updates: Partial<VideoEditorGenerator>) => {
    const prev = state.videoEditorGenerators.find(m => m.id === id);
    setters.setVideoEditorGenerators(prevState =>
      prevState.map(m => m.id === id ? { ...m, ...updates } : m)
    );
    if (realtimeActive) {
      console.log('[Realtime] broadcast move video-editor', id);
      realtimeRef.current?.sendUpdate(id, updates as any);
    }
    if (projectId && opManagerInitialized && prev) {
      const structuredUpdates: any = {};
      if ('x' in updates) structuredUpdates.x = updates.x;
      if ('y' in updates) structuredUpdates.y = updates.y;

      const inverseUpdates: any = {};
      if ('x' in updates) inverseUpdates.x = prev.x;
      if ('y' in updates) inverseUpdates.y = prev.y;

      await appendOp({
        type: 'update',
        elementId: id,
        data: { updates: structuredUpdates },
        inverse: {
          type: 'update',
          elementId: id,
          data: { updates: inverseUpdates },
          requestId: '',
          clientTs: 0,
        } as any,
      });
    }
  };

  const onPersistVideoEditorModalDelete = async (id: string) => {
    const prevItem = state.videoEditorGenerators.find(m => m.id === id);
    setters.setVideoEditorGenerators(prev => prev.filter(m => m.id !== id));
    if (realtimeActive) {
      console.log('[Realtime] broadcast delete video-editor', id);
      realtimeRef.current?.sendDelete(id);
    }
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
              type: 'video-editor-trigger',
              x: prevItem.x,
              y: prevItem.y,
              meta: {},
            },
          },
          requestId: '',
          clientTs: 0,
        } as any,
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
      const { expandImageForCanvas } = await import('@/lib/api');
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
      return result.url || null;
    } catch (error: any) {
      console.error('[onExpand] Error:', error);
      throw error;
    }
  };

  const onPersistVectorizeModalCreate = async (modal: VectorizeGenerator) => {
    // Optimistic update
    setters.setVectorizeGenerators(prev => prev.some(m => m.id === modal.id) ? prev : [...prev, modal]);
    // Broadcast via realtime
    if (realtimeActive) {
      console.log('[Realtime] broadcast create vectorize', modal.id);
      realtimeRef.current?.sendCreate({
        id: modal.id,
        type: 'vectorize',
        x: modal.x,
        y: modal.y,
        vectorizedImageUrl: modal.vectorizedImageUrl || null,
        sourceImageUrl: modal.sourceImageUrl || null,
        localVectorizedImageUrl: modal.localVectorizedImageUrl || null,
        mode: modal.mode || 'simple',
        frameWidth: modal.frameWidth,
        frameHeight: modal.frameHeight,
        isVectorizing: modal.isVectorizing,
      });
    }
    // Always append op for undo/redo and persistence
    if (projectId && opManagerInitialized) {
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
        inverse: { type: 'delete', elementId: modal.id, data: {}, requestId: '', clientTs: 0 } as any,
      });
    }
  };

  const onPersistVectorizeModalMove = async (id: string, updates: Partial<VectorizeGenerator>) => {
    // 1. Capture previous state (for inverse op)
    const prev = state.vectorizeGenerators.find(m => m.id === id);

    // 2. Optimistic update (triggers snapshot useEffect)
    setters.setVectorizeGenerators(prevState =>
      prevState.map(m => m.id === id ? { ...m, ...updates } : m)
    );

    // 3. Broadcast via realtime
    if (realtimeActive) {
      console.log('[Realtime] broadcast move vectorize', id);
      realtimeRef.current?.sendUpdate(id, updates as any);
    }

    // 4. Append op for undo/redo
    if (projectId && opManagerInitialized) {
      // Structure updates: meta fields go under meta, position fields top-level
      const structuredUpdates: any = {};
      const existingMeta = prev ? {
        vectorizedImageUrl: prev.vectorizedImageUrl || null,
        sourceImageUrl: prev.sourceImageUrl || null,
        localVectorizedImageUrl: prev.localVectorizedImageUrl || null,
        mode: prev.mode || 'simple',
        frameWidth: prev.frameWidth || 400,
        frameHeight: prev.frameHeight || 500,
        isVectorizing: prev.isVectorizing || false,
      } : {
        vectorizedImageUrl: null,
        sourceImageUrl: null,
        localVectorizedImageUrl: null,
        mode: 'simple',
        frameWidth: 400,
        frameHeight: 500,
        isVectorizing: false,
      };

      const metaUpdates = { ...existingMeta };
      for (const k of Object.keys(updates || {})) {
        if (k === 'x' || k === 'y') {
          structuredUpdates[k] = (updates as any)[k];
        } else {
          // All other fields go in meta
          (metaUpdates as any)[k] = (updates as any)[k];
        }
      }
      structuredUpdates.meta = metaUpdates;

      // Build inverse updates
      const inverseUpdates: any = {};
      if (prev) {
        if ('x' in updates) inverseUpdates.x = prev.x;
        if ('y' in updates) inverseUpdates.y = prev.y;
        const inverseMeta: any = {};
        if ('vectorizedImageUrl' in updates) inverseMeta.vectorizedImageUrl = prev.vectorizedImageUrl || null;
        if ('sourceImageUrl' in updates) inverseMeta.sourceImageUrl = prev.sourceImageUrl || null;
        if ('localVectorizedImageUrl' in updates) inverseMeta.localVectorizedImageUrl = prev.localVectorizedImageUrl || null;
        if ('mode' in updates) inverseMeta.mode = prev.mode || 'simple';
        if ('frameWidth' in updates) inverseMeta.frameWidth = prev.frameWidth || 400;
        if ('frameHeight' in updates) inverseMeta.frameHeight = prev.frameHeight || 500;
        if ('isVectorizing' in updates) inverseMeta.isVectorizing = prev.isVectorizing || false;
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
          requestId: '',
          clientTs: 0,
        } as any,
      });
    }
  };

  const onPersistVectorizeModalDelete = async (id: string) => {
    console.log('[page.tsx] onPersistVectorizeModalDelete called', id);
    const prevItem = state.vectorizeGenerators.find(m => m.id === id);
    // Update state IMMEDIATELY and SYNCHRONOUSLY - don't wait for async operations
    setters.setVectorizeGenerators(prev => {
      const filtered = prev.filter(m => m.id !== id);
      console.log('[page.tsx] vectorizeGenerators updated, remaining:', filtered.length);
      return filtered;
    });
    // Then do async operations
    if (realtimeActive) {
      console.log('[Realtime] broadcast delete vectorize', id);
      realtimeRef.current?.sendDelete(id);
    }
    // Also remove any connectors that referenced this element
    try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }
    // Always append op for undo/redo and persistence
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
          requestId: '',
          clientTs: 0,
        } as any : undefined as any,
      });
    }
  };

  const onVectorize = async (sourceImageUrl?: string, mode?: string) => {
    if (!sourceImageUrl || !projectId) {
      console.error('[onVectorize] Missing sourceImageUrl or projectId');
      return null;
    }

    try {
      console.log('[onVectorize] Starting vectorize:', { sourceImageUrl, mode });
      const { vectorizeImageForCanvas } = await import('@/lib/api');
      const result = await vectorizeImageForCanvas(
        sourceImageUrl,
        projectId,
        mode
      );

      console.log('[onVectorize] Vectorize completed:', result);
      return result.url || null;
    } catch (error: any) {
      console.error('[onVectorize] Error:', error);
      throw error;
    }
  };

  // Storyboard plugin handlers
  const onPersistStoryboardModalCreate = async (modal: { id: string; x: number; y: number; frameWidth?: number; frameHeight?: number }) => {
    // 1. Optimistic update (triggers snapshot useEffect)
    setters.setStoryboardGenerators(prev => {
      if (prev.some(m => m.id === modal.id)) return prev;
      return [...prev, modal];
    });

    // 2. Broadcast via realtime
    if (realtimeActive) {
      console.log('[Realtime] broadcast create storyboard', modal.id);
      realtimeRef.current?.sendCreate({
        id: modal.id,
        type: 'storyboard-plugin',
        x: modal.x,
        y: modal.y,
        meta: {
          frameWidth: modal.frameWidth || 400,
          frameHeight: modal.frameHeight || 500,
        },
      });
    }

    // 3. Always append op for undo/redo and persistence
    if (projectId && opManagerInitialized) {
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
        inverse: { type: 'delete', elementId: modal.id, data: {}, requestId: '', clientTs: 0 } as any,
      });
    }

    // 4. Auto-create input nodes (Character, Background, Prompt)
    // Only do this for new creations (not hydration), which is implied since this handler is called on drop
    const createInputNode = async (label: string, yOffset: number, color: string, toAnchor: string) => {
      const nodeId = `${label.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const nodeX = modal.x - 350; // Position to the left
      const nodeY = modal.y + yOffset;

      const textNode = {
        id: nodeId,
        x: nodeX,
        y: nodeY,
        value: label, // Pre-fill with label
      };

      // Optimistic update for text node
      setters.setTextGenerators(prev => [...prev, textNode]);

      // Broadcast text node
      if (realtimeActive) {
        realtimeRef.current?.sendCreate({
          id: nodeId,
          type: 'text',
          x: nodeX,
          y: nodeY,
          value: label,
        });
      }

      // Persist text node
      if (projectId && opManagerInitialized) {
        await appendOp({
          type: 'create',
          elementId: nodeId,
          data: {
            element: {
              id: nodeId,
              type: 'text-generator',
              x: nodeX,
              y: nodeY,
              meta: { value: label },
            },
          },
          inverse: { type: 'delete', elementId: nodeId, data: {}, requestId: '', clientTs: 0 } as any,
        });
      }

      // Create connector
      const connectorId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const connector = {
        id: connectorId,
        from: nodeId,
        to: modal.id,
        color: color,
        fromAnchor: 'right',
        toAnchor: toAnchor,
      };

      // Optimistic update for connector
      setters.setConnectors(prev => [...prev, connector]);

      // Persist connector (connectors are persisted as elements in this system)
      if (projectId && opManagerInitialized) {
        await appendOp({
          type: 'create',
          elementId: connectorId,
          data: {
            element: {
              id: connectorId,
              type: 'connector',
              from: nodeId,
              to: modal.id,
              meta: {
                color: color,
                fromAnchor: 'right',
                toAnchor: toAnchor,
              },
            },
          },
          inverse: { type: 'delete', elementId: connectorId, data: {}, requestId: '', clientTs: 0 } as any,
        });
      }
    };

    // DISABLED: Auto-creation of 3 text inputs (Character, Background, Props)
    // This was causing unwanted behavior when connecting text to storyboard
    // Users should manually create and connect text inputs as needed

    // Character Node (Top)
    // await createInputNode('Character', 50, '#FF5733', 'receive-character');

    // Background Node (Middle)
    // await createInputNode('Background', 200, '#33FF57', 'receive-background');

    // Prompt Node (Bottom)
    // await createInputNode('Props', 350, '#3357FF', 'receive-props');
  };

  const onPersistStoryboardModalMove = async (id: string, updates: Partial<{ x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null; characterNamesMap?: Record<number, string>; propsNamesMap?: Record<number, string>; backgroundNamesMap?: Record<number, string>; stitchedImageUrl?: string }>) => {
    // 1. Capture previous state (for inverse op)
    const prev = state.storyboardGenerators.find(m => m.id === id);

    // 2. Optimistic update (triggers snapshot useEffect)
    setters.setStoryboardGenerators(prevState =>
      prevState.map(m => m.id === id ? { ...m, ...updates } : m)
    );

    // 3. Broadcast via realtime
    if (realtimeActive) {
      console.log('[Realtime] broadcast move storyboard', id);
      realtimeRef.current?.sendUpdate(id, updates as any);
    }

    // 4. Append op for undo/redo
    if (projectId && opManagerInitialized) {
      const structuredUpdates: any = {};
      const existingMeta = prev ? {
        frameWidth: prev.frameWidth || 400,
        frameHeight: prev.frameHeight || 500,
        scriptText: (prev as StoryboardGenerator).scriptText || null,
        characterNamesMap: (prev as any).characterNamesMap || {},
        propsNamesMap: (prev as any).propsNamesMap || {},
        backgroundNamesMap: (prev as any).backgroundNamesMap || {},
      } : {
        frameWidth: 400,
        frameHeight: 500,
        scriptText: null,
        characterNamesMap: {},
        propsNamesMap: {},
        backgroundNamesMap: {},
        stitchedImageUrl: undefined,
      };

      const metaUpdates = { ...existingMeta };
      for (const k of Object.keys(updates || {})) {
        if (k === 'x' || k === 'y') {
          structuredUpdates[k] = (updates as any)[k];
        } else {
          (metaUpdates as any)[k] = (updates as any)[k];
        }
      }
      structuredUpdates.meta = metaUpdates;

      // Build inverse updates
      const inverseUpdates: any = {};
      if (prev) {
        if ('x' in updates) inverseUpdates.x = prev.x;
        if ('y' in updates) inverseUpdates.y = prev.y;
        const inverseMeta: any = {};
        if ('frameWidth' in updates) inverseMeta.frameWidth = prev.frameWidth || 400;
        if ('frameHeight' in updates) inverseMeta.frameHeight = prev.frameHeight || 500;
        if ('scriptText' in updates) inverseMeta.scriptText = (prev as StoryboardGenerator).scriptText || null;
        if ('characterNamesMap' in updates) inverseMeta.characterNamesMap = (prev as any).characterNamesMap || {};
        if ('propsNamesMap' in updates) inverseMeta.propsNamesMap = (prev as any).propsNamesMap || {};
        if ('backgroundNamesMap' in updates) inverseMeta.backgroundNamesMap = (prev as any).backgroundNamesMap || {};
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
          requestId: '',
          clientTs: 0,
        } as any,
      });
    }
  };

  const onPersistStoryboardModalDelete = async (id: string) => {
    console.log('[page.tsx] onPersistStoryboardModalDelete called', id);
    const prevItem = state.storyboardGenerators.find(m => m.id === id);
    // Update state IMMEDIATELY and SYNCHRONOUSLY - don't wait for async operations
    setters.setStoryboardGenerators(prev => {
      const filtered = prev.filter(m => m.id !== id);
      console.log('[page.tsx] storyboardGenerators updated, remaining:', filtered.length);
      return filtered;
    });
    // Then do async operations
    if (realtimeActive) {
      console.log('[Realtime] broadcast delete storyboard', id);
      realtimeRef.current?.sendDelete(id);
    }
    // Also remove any connectors that referenced this element
    try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }
    // Always append op for undo/redo and persistence
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
              type: 'storyboard-plugin',
              x: prevItem.x,
              y: prevItem.y,
              meta: {
                frameWidth: prevItem.frameWidth || 400,
                frameHeight: prevItem.frameHeight || 500,
              },
            },
          },
          requestId: '',
          clientTs: 0,
        } as any : undefined as any,
      });
    }
  };

  // ScriptFrame plugin handlers
  const onPersistScriptFrameModalCreate = async (modal: ScriptFrameGenerator) => {
    // 1. Optimistic update
    setters.setScriptFrameGenerators(prev => {
      if (prev.some(m => m.id === modal.id)) return prev;
      return [...prev, modal];
    });

    // 2. Broadcast via realtime
    if (realtimeActive) {
      console.log('[Realtime] broadcast create script-frame', modal.id);
      realtimeRef.current?.sendCreate({
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
      });
    }

    // 3. Always append op for undo/redo and persistence
    if (projectId && opManagerInitialized) {
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
        inverse: { type: 'delete', elementId: modal.id, data: {}, requestId: '', clientTs: 0 } as any,
      });
    }
  };

  const onPersistScriptFrameModalMove = async (id: string, updates: Partial<ScriptFrameGenerator>) => {
    // 1. Capture previous state
    const prev = state.scriptFrameGenerators.find(m => m.id === id);

    // 2. Optimistic update
    setters.setScriptFrameGenerators(prevState =>
      prevState.map(m => m.id === id ? { ...m, ...updates } : m)
    );

    // 3. Broadcast via realtime
    if (realtimeActive) {
      console.log('[Realtime] broadcast move script-frame', id);
      realtimeRef.current?.sendUpdate(id, updates as any);
    }

    // 4. Append op
    if (projectId && opManagerInitialized) {
      const structuredUpdates: any = {};
      const existingMeta = prev ? {
        pluginId: prev.pluginId,
        frameWidth: prev.frameWidth,
        frameHeight: prev.frameHeight,
        text: prev.text,
      } : {
        pluginId: '',
        frameWidth: 300,
        frameHeight: 200,
        text: '',
      };

      const metaUpdates = { ...existingMeta };
      for (const k of Object.keys(updates || {})) {
        if (k === 'x' || k === 'y') {
          structuredUpdates[k] = (updates as any)[k];
        } else {
          (metaUpdates as any)[k] = (updates as any)[k];
        }
      }
      structuredUpdates.meta = metaUpdates;

      const inverseUpdates: any = {};
      if (prev) {
        if ('x' in updates) inverseUpdates.x = prev.x;
        if ('y' in updates) inverseUpdates.y = prev.y;
        const inverseMeta: any = {};
        if ('pluginId' in updates) inverseMeta.pluginId = prev.pluginId;
        if ('frameWidth' in updates) inverseMeta.frameWidth = prev.frameWidth;
        if ('frameHeight' in updates) inverseMeta.frameHeight = prev.frameHeight;
        if ('text' in updates) inverseMeta.text = prev.text;
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
          requestId: '',
          clientTs: 0,
        } as any,
      });
    }
  };

  const onPersistScriptFrameModalDelete = async (id: string) => {
    console.log('[page.tsx] onPersistScriptFrameModalDelete called', id);
    const prevItem = state.scriptFrameGenerators.find(m => m.id === id);

    setters.setScriptFrameGenerators(prev => {
      const filtered = prev.filter(m => m.id !== id);
      return filtered;
    });

    if (realtimeActive) {
      console.log('[Realtime] broadcast delete script-frame', id);
      realtimeRef.current?.sendDelete(id);
    }

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
          requestId: '',
          clientTs: 0,
        } as any : undefined as any,
      });
    }
  };

  // SceneFrame plugin handlers
  const onPersistSceneFrameModalCreate = async (modal: SceneFrameGenerator) => {
    setters.setSceneFrameGenerators(prev => {
      if (prev.some(m => m.id === modal.id)) return prev;
      return [...prev, modal];
    });

    if (realtimeActive) {
      console.log('[Realtime] broadcast create scene-frame', modal.id);
      realtimeRef.current?.sendCreate({
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
      });
    }

    if (projectId && opManagerInitialized) {
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
            },
          },
        },
        inverse: { type: 'delete', elementId: modal.id, data: {}, requestId: '', clientTs: 0 } as any,
      });
    }
  };

  const onPersistSceneFrameModalMove = async (id: string, updates: Partial<SceneFrameGenerator>) => {
    const prev = state.sceneFrameGenerators.find(m => m.id === id);

    setters.setSceneFrameGenerators(prevState =>
      prevState.map(m => m.id === id ? { ...m, ...updates } : m)
    );

    if (realtimeActive) {
      console.log('[Realtime] broadcast move scene-frame', id);
      realtimeRef.current?.sendUpdate(id, updates as any);
    }

    if (projectId && opManagerInitialized) {
      const structuredUpdates: any = {};
      const existingMeta = prev ? {
        scriptFrameId: prev.scriptFrameId,
        sceneNumber: prev.sceneNumber,
        frameWidth: prev.frameWidth,
        frameHeight: prev.frameHeight,
        content: prev.content,
      } : {
        scriptFrameId: '',
        sceneNumber: 0,
        frameWidth: 300,
        frameHeight: 200,
        content: '',
      };

      const metaUpdates = { ...existingMeta };
      for (const k of Object.keys(updates || {})) {
        if (k === 'x' || k === 'y') {
          structuredUpdates[k] = (updates as any)[k];
        } else {
          (metaUpdates as any)[k] = (updates as any)[k];
        }
      }
      structuredUpdates.meta = metaUpdates;

      const inverseUpdates: any = {};
      if (prev) {
        if ('x' in updates) inverseUpdates.x = prev.x;
        if ('y' in updates) inverseUpdates.y = prev.y;
        const inverseMeta: any = {};
        if ('scriptFrameId' in updates) inverseMeta.scriptFrameId = prev.scriptFrameId;
        if ('sceneNumber' in updates) inverseMeta.sceneNumber = prev.sceneNumber;
        if ('frameWidth' in updates) inverseMeta.frameWidth = prev.frameWidth;
        if ('frameHeight' in updates) inverseMeta.frameHeight = prev.frameHeight;
        if ('content' in updates) inverseMeta.content = prev.content;
        if ('characterIds' in updates) inverseMeta.characterIds = (prev as any).characterIds;
        if ('locationId' in updates) inverseMeta.locationId = (prev as any).locationId;
        if ('mood' in updates) inverseMeta.mood = (prev as any).mood;
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
          requestId: '',
          clientTs: 0,
        } as any,
      });
    }
  };

  const onPersistSceneFrameModalDelete = async (id: string) => {
    console.log('[page.tsx] onPersistSceneFrameModalDelete called', id);
    const prevItem = state.sceneFrameGenerators.find(m => m.id === id);

    setters.setSceneFrameGenerators(prev => {
      const filtered = prev.filter(m => m.id !== id);
      return filtered;
    });

    if (realtimeActive) {
      console.log('[Realtime] broadcast delete scene-frame', id);
      realtimeRef.current?.sendDelete(id);
    }

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
          requestId: '',
          clientTs: 0,
        } as any : undefined as any,
      });
    }
  };

  return {
    onPersistUpscaleModalCreate,
    onPersistUpscaleModalMove,
    onPersistUpscaleModalDelete,
    onPersistRemoveBgModalCreate,
    onPersistRemoveBgModalMove,
    onPersistRemoveBgModalDelete,
    onPersistEraseModalCreate,
    onPersistEraseModalMove,
    onPersistEraseModalDelete,
    onPersistVectorizeModalCreate,
    onPersistVectorizeModalMove,
    onPersistVectorizeModalDelete,
    onUpscale,
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

