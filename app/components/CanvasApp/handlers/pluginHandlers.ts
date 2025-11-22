import { CanvasAppState, CanvasAppSetters, UpscaleGenerator, RemoveBgGenerator, VectorizeGenerator } from '../types';

export interface PluginHandlers {
  onPersistUpscaleModalCreate: (modal: UpscaleGenerator) => Promise<void>;
  onPersistUpscaleModalMove: (id: string, updates: Partial<UpscaleGenerator>) => Promise<void>;
  onPersistUpscaleModalDelete: (id: string) => Promise<void>;
  onPersistRemoveBgModalCreate: (modal: RemoveBgGenerator) => Promise<void>;
  onPersistRemoveBgModalMove: (id: string, updates: Partial<RemoveBgGenerator>) => Promise<void>;
  onPersistRemoveBgModalDelete: (id: string) => Promise<void>;
  onPersistVectorizeModalCreate: (modal: VectorizeGenerator) => Promise<void>;
  onPersistVectorizeModalMove: (id: string, updates: Partial<VectorizeGenerator>) => Promise<void>;
  onPersistVectorizeModalDelete: (id: string) => Promise<void>;
  onUpscale: (model: string, scale: number, sourceImageUrl?: string) => Promise<string | null>;
  onRemoveBg: (model: string, backgroundType: string, scaleValue: number, sourceImageUrl?: string) => Promise<string | null>;
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
      return result.url || null;
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

  return {
    onPersistUpscaleModalCreate,
    onPersistUpscaleModalMove,
    onPersistUpscaleModalDelete,
    onPersistRemoveBgModalCreate,
    onPersistRemoveBgModalMove,
    onPersistRemoveBgModalDelete,
    onPersistVectorizeModalCreate,
    onPersistVectorizeModalMove,
    onPersistVectorizeModalDelete,
    onUpscale,
    onRemoveBg,
    onVectorize,
  };
}

