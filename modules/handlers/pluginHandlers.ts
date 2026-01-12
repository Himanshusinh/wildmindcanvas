import { CanvasAppState, CanvasAppSetters, UpscaleGenerator, MultiangleCameraGenerator, RemoveBgGenerator, EraseGenerator, ExpandGenerator, VectorizeGenerator, NextSceneGenerator, StoryboardGenerator, ScriptFrameGenerator, SceneFrameGenerator, VideoEditorGenerator, ImageEditorGenerator } from '@/modules/canvas-app/types';
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
  onPersistImageEditorModalCreate: (modal: ImageEditorGenerator) => Promise<void>;
  onPersistImageEditorModalMove: (id: string, updates: Partial<ImageEditorGenerator>) => Promise<void>;
  onPersistImageEditorModalDelete: (id: string) => Promise<void>;
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
  setters: CanvasAppSetters,
  projectId: string | null
): PluginHandlers {

  // Helper to remove connectors
  const removeConnectorsForElement = (id: string) => {
    setters.setConnectors(prev => prev.filter(c => c.from !== id && c.to !== id));
  };

  // --- UPSCA ---
  const onPersistUpscaleModalCreate = async (modal: UpscaleGenerator) => {
    setters.setUpscaleGenerators(prev => [...prev, modal]);
  };
  const onPersistUpscaleModalMove = async (id: string, updates: Partial<UpscaleGenerator>) => {
    setters.setUpscaleGenerators(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const onPersistUpscaleModalDelete = async (id: string) => {
    setters.setUpscaleGenerators(prev => prev.filter(item => item.id !== id));
    removeConnectorsForElement(id);
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
      setters.setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));
      return result?.url || (typeof result === 'string' ? result : null);
    } catch (error: any) {
      console.error('[onUpscale] Error:', error);
      setters.setGenerationQueue((prev) => prev.filter((item) => item.id !== queueId));
      throw error;
    }
  };

  // --- MULTIANGLE ---
  const onPersistMultiangleCameraModalCreate = async (modal: MultiangleCameraGenerator) => {
    setters.setMultiangleCameraGenerators(prev => [...prev, modal]);
  };
  const onPersistMultiangleCameraModalMove = async (id: string, updates: Partial<MultiangleCameraGenerator>) => {
    setters.setMultiangleCameraGenerators(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const onPersistMultiangleCameraModalDelete = async (id: string) => {
    setters.setMultiangleCameraGenerators(prev => prev.filter(item => item.id !== id));
    removeConnectorsForElement(id);
  };

  const onMultiangleCamera = async (sourceImageUrl?: string, prompt?: string, loraScale?: number, aspectRatio?: string, moveForward?: number, verticalTilt?: number, rotateDegrees?: number, useWideAngle?: boolean) => {
    if (!sourceImageUrl || !projectId) return null;
    // logic similar to onUpscale...
    // Simplified for brevity in this rewrite, but functionality kept
    const queueId = `multiangle-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setters.setGenerationQueue(prev => [...prev, { id: queueId, type: 'image', operationName: 'Multiangle', model: 'Qwen', total: 1, index: 1, startedAt: Date.now() }]);
    try {
      const { multiangleImageForCanvas } = await import('@/core/api/api');
      const result = await multiangleImageForCanvas(sourceImageUrl, projectId, prompt, loraScale, aspectRatio, moveForward, verticalTilt, rotateDegrees, useWideAngle);
      setters.setGenerationQueue(prev => prev.filter(item => item.id !== queueId));
      // extract url
      return (result as any)?.url || result;
    } catch (e) {
      setters.setGenerationQueue(prev => prev.filter(item => item.id !== queueId));
      throw e;
    }
  };

  // --- REMOVE BG ---
  const onPersistRemoveBgModalCreate = async (modal: RemoveBgGenerator) => {
    setters.setRemoveBgGenerators(prev => [...prev, modal]);
  };
  const onPersistRemoveBgModalMove = async (id: string, updates: Partial<RemoveBgGenerator>) => {
    setters.setRemoveBgGenerators(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const onPersistRemoveBgModalDelete = async (id: string) => {
    setters.setRemoveBgGenerators(prev => prev.filter(item => item.id !== id));
    removeConnectorsForElement(id);
  };
  const onRemoveBg = async (model: string, backgroundType: string, scaleValue: number, sourceImageUrl?: string) => {
    if (!sourceImageUrl || !projectId) return null;
    const queueId = `removebg-${Date.now()}`;
    setters.setGenerationQueue(prev => [...prev, { id: queueId, type: 'removebg', operationName: 'Remove BG', model, total: 1, index: 1, startedAt: Date.now() }]);
    try {
      const { removeBgImageForCanvas } = await import('@/core/api/api');
      const result = await removeBgImageForCanvas(sourceImageUrl, projectId, model, backgroundType, scaleValue);
      setters.setGenerationQueue(prev => prev.filter(i => i.id !== queueId));
      return result.url;
    } catch (e) {
      setters.setGenerationQueue(prev => prev.filter(i => i.id !== queueId));
      throw e;
    }
  };

  // --- ERASE ---
  const onPersistEraseModalCreate = async (modal: EraseGenerator) => {
    setters.setEraseGenerators(prev => [...prev, modal]);
  };
  const onPersistEraseModalMove = async (id: string, updates: Partial<EraseGenerator>) => {
    setters.setEraseGenerators(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const onPersistEraseModalDelete = async (id: string) => {
    setters.setEraseGenerators(prev => prev.filter(item => item.id !== id));
    removeConnectorsForElement(id);
  };
  const onErase = async (model: string, sourceImageUrl?: string, mask?: string, prompt?: string) => {
    // similar logic
    if (!sourceImageUrl || !projectId) return null;
    const queueId = `erase-${Date.now()}`;
    setters.setGenerationQueue(prev => [...prev, { id: queueId, type: 'erase', operationName: 'Erasing', model, total: 1, index: 1, startedAt: Date.now() }]);
    try {
      const { eraseImageForCanvas } = await import('@/core/api/api');
      const result = await eraseImageForCanvas(sourceImageUrl, projectId, model, mask, prompt || '');
      setters.setGenerationQueue(prev => prev.filter(i => i.id !== queueId));
      return result.url;
    } catch (e) {
      setters.setGenerationQueue(prev => prev.filter(i => i.id !== queueId));
      throw e;
    }
  };

  // --- EXPAND ---
  const onPersistExpandModalCreate = async (modal: ExpandGenerator) => {
    setters.setExpandGenerators(prev => [...prev, modal]);
  };
  const onPersistExpandModalMove = async (id: string, updates: Partial<ExpandGenerator>) => {
    setters.setExpandGenerators(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const onPersistExpandModalDelete = async (id: string) => {
    setters.setExpandGenerators(prev => prev.filter(item => item.id !== id));
    removeConnectorsForElement(id);
  };
  const onExpand = async (model: string, sourceImageUrl?: string, prompt?: string, canvasSize?: [number, number], originalImageSize?: [number, number], originalImageLocation?: [number, number], aspectRatio?: string) => {
    if (!sourceImageUrl || !projectId) return null;
    const queueId = `expand-${Date.now()}`;
    setters.setGenerationQueue(prev => [...prev, { id: queueId, type: 'image', operationName: 'Expanding', model, total: 1, index: 1, startedAt: Date.now() }]);
    try {
      const { expandImageForCanvas } = await import('@/core/api/api');
      const result = await expandImageForCanvas(sourceImageUrl, projectId, canvasSize!, originalImageSize!, originalImageLocation!, prompt, aspectRatio);
      setters.setGenerationQueue(prev => prev.filter(i => i.id !== queueId));
      return result.url;
    } catch (e) {
      setters.setGenerationQueue(prev => prev.filter(i => i.id !== queueId));
      throw e;
    }
  };

  // --- VECTORIZE ---
  const onPersistVectorizeModalCreate = async (modal: VectorizeGenerator) => {
    setters.setVectorizeGenerators(prev => [...prev, modal]);
  };
  const onPersistVectorizeModalMove = async (id: string, updates: Partial<VectorizeGenerator>) => {
    setters.setVectorizeGenerators(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const onPersistVectorizeModalDelete = async (id: string) => {
    setters.setVectorizeGenerators(prev => prev.filter(item => item.id !== id));
    removeConnectorsForElement(id);
  };
  const onVectorize = async (sourceImageUrl?: string, mode?: string) => {
    if (!sourceImageUrl || !projectId) return null;
    const queueId = `vectorize-${Date.now()}`;
    setters.setGenerationQueue(prev => [...prev, { id: queueId, type: 'vectorize', operationName: 'Vectorizing', model: 'Vectorize', total: 1, index: 1, startedAt: Date.now() }]);
    try {
      const { vectorizeImageForCanvas } = await import('@/core/api/api');
      const result = await vectorizeImageForCanvas(sourceImageUrl, projectId, mode);
      setters.setGenerationQueue(prev => prev.filter(i => i.id !== queueId));
      return result.url;
    } catch (e) {
      setters.setGenerationQueue(prev => prev.filter(i => i.id !== queueId));
      throw e;
    }
  };

  // --- NEXT SCENE ---
  const onPersistNextSceneModalCreate = async (modal: NextSceneGenerator) => {
    setters.setNextSceneGenerators(prev => [...prev, modal]);
  };
  const onPersistNextSceneModalMove = async (id: string, updates: Partial<NextSceneGenerator>) => {
    setters.setNextSceneGenerators(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const onPersistNextSceneModalDelete = async (id: string) => {
    setters.setNextSceneGenerators(prev => prev.filter(item => item.id !== id));
    removeConnectorsForElement(id);
  };

  // --- STORYBOARD ---
  const onPersistStoryboardModalCreate = async (modal: StoryboardGenerator) => {
    setters.setStoryboardGenerators(prev => [...prev, modal]);
  };
  const onPersistStoryboardModalMove = async (id: string, updates: Partial<StoryboardGenerator>) => {
    setters.setStoryboardGenerators(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const onPersistStoryboardModalDelete = async (id: string) => {
    setters.setStoryboardGenerators(prev => prev.filter(item => item.id !== id));
    removeConnectorsForElement(id);
  };

  // --- SCRIPT FRAME ---
  const onPersistScriptFrameModalCreate = async (modal: ScriptFrameGenerator) => {
    setters.setScriptFrameGenerators(prev => [...prev, modal]);
  };
  const onPersistScriptFrameModalMove = async (id: string, updates: Partial<ScriptFrameGenerator>) => {
    setters.setScriptFrameGenerators(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const onPersistScriptFrameModalDelete = async (id: string) => {
    setters.setScriptFrameGenerators(prev => prev.filter(item => item.id !== id));
    removeConnectorsForElement(id);
  };

  // --- SCENE FRAME ---
  const onPersistSceneFrameModalCreate = async (modal: SceneFrameGenerator) => {
    setters.setSceneFrameGenerators(prev => [...prev, modal]);
  };
  const onPersistSceneFrameModalMove = async (id: string, updates: Partial<SceneFrameGenerator>) => {
    setters.setSceneFrameGenerators(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const onPersistSceneFrameModalDelete = async (id: string) => {
    setters.setSceneFrameGenerators(prev => prev.filter(item => item.id !== id));
    removeConnectorsForElement(id);
  };

  // --- VIDEO EDITOR ---
  const onPersistVideoEditorModalCreate = async (modal: VideoEditorGenerator) => {
    setters.setVideoEditorGenerators(prev => [...prev, modal]);
  };
  const onPersistVideoEditorModalMove = async (id: string, updates: Partial<VideoEditorGenerator>) => {
    setters.setVideoEditorGenerators(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const onPersistVideoEditorModalDelete = async (id: string) => {
    setters.setVideoEditorGenerators(prev => prev.filter(item => item.id !== id));
    removeConnectorsForElement(id);
  };

  // --- IMAGE EDITOR ---
  const onPersistImageEditorModalCreate = async (modal: ImageEditorGenerator) => {
    setters.setImageEditorGenerators(prev => [...prev, modal]);
  };
  const onPersistImageEditorModalMove = async (id: string, updates: Partial<ImageEditorGenerator>) => {
    setters.setImageEditorGenerators(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const onPersistImageEditorModalDelete = async (id: string) => {
    setters.setImageEditorGenerators(prev => prev.filter(item => item.id !== id));
    removeConnectorsForElement(id);
  };

  // --- COMPARE ---
  const onPersistCompareModalCreate = async (modal: { id: string; x: number; y: number; width?: number; height?: number; scale?: number; prompt?: string; model?: string }) => {
    setters.setCompareGenerators(prev => [...prev, modal]);
  };
  const onPersistCompareModalMove = async (id: string, updates: Partial<{ x: number; y: number; width?: number; height?: number; scale?: number; prompt?: string; model?: string }>) => {
    setters.setCompareGenerators(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };
  const onPersistCompareModalDelete = async (id: string) => {
    setters.setCompareGenerators(prev => prev.filter(item => item.id !== id));
    removeConnectorsForElement(id);
  };

  return {
    onPersistUpscaleModalCreate, onPersistUpscaleModalMove, onPersistUpscaleModalDelete,
    onPersistMultiangleCameraModalCreate, onPersistMultiangleCameraModalMove, onPersistMultiangleCameraModalDelete,
    onPersistRemoveBgModalCreate, onPersistRemoveBgModalMove, onPersistRemoveBgModalDelete,
    onPersistEraseModalCreate, onPersistEraseModalMove, onPersistEraseModalDelete,
    onPersistExpandModalCreate, onPersistExpandModalMove, onPersistExpandModalDelete,
    onPersistVectorizeModalCreate, onPersistVectorizeModalMove, onPersistVectorizeModalDelete,
    onPersistNextSceneModalCreate, onPersistNextSceneModalMove, onPersistNextSceneModalDelete,
    onPersistStoryboardModalCreate, onPersistStoryboardModalMove, onPersistStoryboardModalDelete,
    onPersistScriptFrameModalCreate, onPersistScriptFrameModalMove, onPersistScriptFrameModalDelete,
    onPersistSceneFrameModalCreate, onPersistSceneFrameModalMove, onPersistSceneFrameModalDelete,
    onPersistVideoEditorModalCreate, onPersistVideoEditorModalMove, onPersistVideoEditorModalDelete,
    onPersistImageEditorModalCreate, onPersistImageEditorModalMove, onPersistImageEditorModalDelete,
    onUpscale, onMultiangleCamera, onRemoveBg, onErase, onExpand, onVectorize,
    onPersistCompareModalCreate, onPersistCompareModalMove, onPersistCompareModalDelete
  };
}
