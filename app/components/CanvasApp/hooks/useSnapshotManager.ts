import { useEffect, useRef } from 'react';
import { getCurrentSnapshot as apiGetCurrentSnapshot, setCurrentSnapshot as apiSetCurrentSnapshot } from '@/lib/canvasApi';
import { buildProxyResourceUrl } from '@/lib/proxyUtils';
import { ImageUpload } from '@/types/canvas';
import { CanvasAppState, CanvasAppSetters, Connector } from '../types';

interface UseSnapshotManagerProps {
  projectId: string | null;
  state: CanvasAppState;
  setters: CanvasAppSetters;
}

export function useSnapshotManager({ projectId, state, setters }: UseSnapshotManagerProps) {
  const persistTimerRef = useRef<number | null>(null);

  // Helper: build elements map snapshot from current state
  const buildSnapshotElements = (connectorsOverride?: Connector[]): Record<string, any> => {
    const elements: Record<string, any> = {};
    
    // Build connection map keyed by source element id
    const connectionsBySource: Record<string, Array<any>> = {};
    const connectorsToUse = connectorsOverride ?? state.connectors;
    connectorsToUse.forEach((c) => {
      if (!c || !c.id) return;
      const src = c.from;
      if (!src) return;
      connectionsBySource[src] = connectionsBySource[src] || [];
      connectionsBySource[src].push({ id: c.id, to: c.to, color: c.color, fromAnchor: c.fromAnchor, toAnchor: c.toAnchor });
    });
    // Uploaded media and text/models
    state.images.forEach((img, idx) => {
      const id = (img as any).elementId || `element-${idx}`;
      if (!(img as any).elementId) {
        // Skip persisting items without stable id to avoid churn
        return;
      }
      const type = img.type === 'image' ? 'image' : img.type === 'video' ? 'video' : img.type === 'text' ? 'text' : img.type === 'model3d' ? 'model3d' : 'image';
      const meta: any = {};
      if (type === 'text') {
        if (img.text) meta.text = img.text;
        if (img.fontSize) meta.fontSize = img.fontSize;
        if (img.fontFamily) meta.fontFamily = img.fontFamily;
        if (img.fill) meta.fill = img.fill;
      } else if (img.url) {
        meta.url = img.url;
      }
      // Attach any connections originating from this element into its meta
      if (connectionsBySource[id] && connectionsBySource[id].length) {
        meta.connections = connectionsBySource[id];
      }
      elements[id] = { id, type, x: img.x || 0, y: img.y || 0, width: img.width, height: img.height, rotation: img.rotation || 0, meta };
    });
    // Generators (image/video/music)
    state.imageGenerators.forEach((g) => {
      const metaObj: any = { generatedImageUrl: g.generatedImageUrl || null, frameWidth: g.frameWidth, frameHeight: g.frameHeight, model: g.model, frame: g.frame, aspectRatio: g.aspectRatio, prompt: g.prompt };
      if (connectionsBySource[g.id] && connectionsBySource[g.id].length) metaObj.connections = connectionsBySource[g.id];
      elements[g.id] = { id: g.id, type: 'image-generator', x: g.x, y: g.y, meta: metaObj };
    });
    state.videoGenerators.forEach((g) => {
      const metaObj: any = { generatedVideoUrl: g.generatedVideoUrl || null, frameWidth: g.frameWidth, frameHeight: g.frameHeight, model: g.model, frame: g.frame, aspectRatio: g.aspectRatio, prompt: g.prompt, taskId: (g as any).taskId, generationId: (g as any).generationId, status: (g as any).status };
      if (connectionsBySource[g.id] && connectionsBySource[g.id].length) metaObj.connections = connectionsBySource[g.id];
      elements[g.id] = { id: g.id, type: 'video-generator', x: g.x, y: g.y, meta: metaObj };
    });
    state.musicGenerators.forEach((g) => {
      const metaObj: any = { generatedMusicUrl: g.generatedMusicUrl || null, frameWidth: g.frameWidth, frameHeight: g.frameHeight, model: g.model, frame: g.frame, aspectRatio: g.aspectRatio, prompt: g.prompt };
      if (connectionsBySource[g.id] && connectionsBySource[g.id].length) metaObj.connections = connectionsBySource[g.id];
      elements[g.id] = { id: g.id, type: 'music-generator', x: g.x, y: g.y, meta: metaObj };
    });
    // Upscale generators
    state.upscaleGenerators.forEach((modal) => {
      if (!modal || !modal.id) return;
      const metaObj: any = {
        upscaledImageUrl: modal.upscaledImageUrl || null,
        sourceImageUrl: modal.sourceImageUrl || null,
        localUpscaledImageUrl: modal.localUpscaledImageUrl || null,
        model: modal.model || 'Crystal Upscaler',
        scale: modal.scale || 2,
        frameWidth: modal.frameWidth || 400,
        frameHeight: modal.frameHeight || 500,
        isUpscaling: modal.isUpscaling || false,
      };
      // Attach any connections originating from this element into its meta
      if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
        metaObj.connections = connectionsBySource[modal.id];
      }
      elements[modal.id] = {
        id: modal.id,
        type: 'upscale-plugin',
        x: modal.x,
        y: modal.y,
        meta: metaObj,
      };
    });
    // Text input overlays (generators) - persist current value
    state.textGenerators.forEach((t) => {
      elements[t.id] = { id: t.id, type: 'text-generator', x: t.x, y: t.y, meta: { value: t.value || '' } };
    });
    // Note: connectors are stored inside the source element's meta.connections (see connectionsBySource)
    // Also include connector elements as top-level elements so snapshots contain explicit connector records
    const connectorsToUseFinal = connectorsOverride ?? state.connectors;
    connectorsToUseFinal.forEach(c => {
      if (!c || !c.id) return;
      elements[c.id] = { id: c.id, type: 'connector', from: c.from, to: c.to, meta: { color: c.color || '#437eb5', fromAnchor: c.fromAnchor, toAnchor: c.toAnchor } };
    });
    return elements;
  };

  // Persist full snapshot on every interaction (debounced)
  useEffect(() => {
    if (!projectId) return;
    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = window.setTimeout(async () => {
      try {
        const elements = buildSnapshotElements();
        await apiSetCurrentSnapshot(projectId, { elements, metadata: { version: '1.0' } });
        // console.debug('[Snapshot] persisted', Object.keys(elements).length);
      } catch (e) {
        console.warn('Failed to persist snapshot', e);
      }
    }, 300) as unknown as number;
    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, [projectId, state.images, state.imageGenerators, state.videoGenerators, state.musicGenerators, state.textGenerators, state.upscaleGenerators, state.connectors]);

  // Hydrate from current snapshot on project load
  useEffect(() => {
    const hydrate = async () => {
      if (!projectId) return;
      try {
        const { snapshot } = await apiGetCurrentSnapshot(projectId);
        if (snapshot && snapshot.elements) {
          const elements = snapshot.elements as Record<string, any>;
          const newImages: ImageUpload[] = [];
          const newImageGenerators: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }> = [];
          const newVideoGenerators: Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number; taskId?: string; generationId?: string; status?: string }> = [];
          const newMusicGenerators: Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }> = [];
          const newUpscaleGenerators: Array<{ id: string; x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number }> = [];
          const newTextGenerators: Array<{ id: string; x: number; y: number; value?: string }> = [];
          const newConnectors: Array<{ id: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }> = [];

          Object.values(elements).forEach((element: any) => {
            if (element && element.type) {
              let imageUrl = element.meta?.url || element.meta?.mediaId || '';
              if (imageUrl && (imageUrl.includes('zata.ai') || imageUrl.includes('zata'))) {
                imageUrl = buildProxyResourceUrl(imageUrl);
              }
              if (element.type === 'image' || element.type === 'video' || element.type === 'text' || element.type === 'model3d') {
                const newImage: ImageUpload = {
                  type: element.type === 'image' ? 'image' : element.type === 'video' ? 'video' : element.type === 'text' ? 'text' : element.type === 'model3d' ? 'model3d' : 'image',
                  url: imageUrl,
                  x: element.x || 0,
                  y: element.y || 0,
                  width: element.width || 400,
                  height: element.height || 400,
                  rotation: element.rotation || 0,
                  ...(element.id && { elementId: element.id }),
                };
                newImages.push(newImage);
                // If this element had connections in meta, collect them
                if (element.meta?.connections && Array.isArray(element.meta.connections)) {
                  element.meta.connections.forEach((c: any) => {
                    newConnectors.push({ id: c.id || `connector-${Date.now()}-${Math.random().toString(36).substr(2,6)}`, from: element.id, to: c.to, color: c.color || '#437eb5', fromAnchor: c.fromAnchor, toAnchor: c.toAnchor });
                  });
                }
              } else if (element.type === 'image-generator') {
                newImageGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedImageUrl: element.meta?.generatedImageUrl || null, frameWidth: element.meta?.frameWidth, frameHeight: element.meta?.frameHeight, model: element.meta?.model, frame: element.meta?.frame, aspectRatio: element.meta?.aspectRatio, prompt: element.meta?.prompt });
                if (element.meta?.connections && Array.isArray(element.meta.connections)) {
                  element.meta.connections.forEach((c: any) => {
                    newConnectors.push({ id: c.id || `connector-${Date.now()}-${Math.random().toString(36).substr(2,6)}`, from: element.id, to: c.to, color: c.color || '#437eb5', fromAnchor: c.fromAnchor, toAnchor: c.toAnchor });
                  });
                }
              } else if (element.type === 'connector') {
                // Top-level connector element
                newConnectors.push({ id: element.id, from: element.from || element.meta?.from, to: element.to || element.meta?.to, color: element.meta?.color || '#437eb5', fromAnchor: element.meta?.fromAnchor, toAnchor: element.meta?.toAnchor });
              } else if (element.type === 'video-generator') {
                newVideoGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedVideoUrl: element.meta?.generatedVideoUrl || null, frameWidth: element.meta?.frameWidth, frameHeight: element.meta?.frameHeight, model: element.meta?.model, frame: element.meta?.frame, aspectRatio: element.meta?.aspectRatio, prompt: element.meta?.prompt, duration: element.meta?.duration, taskId: element.meta?.taskId, generationId: element.meta?.generationId, status: element.meta?.status });
                if (element.meta?.connections && Array.isArray(element.meta.connections)) {
                  element.meta.connections.forEach((c: any) => {
                    newConnectors.push({ id: c.id || `connector-${Date.now()}-${Math.random().toString(36).substr(2,6)}`, from: element.id, to: c.to, color: c.color || '#437eb5', fromAnchor: c.fromAnchor, toAnchor: c.toAnchor });
                  });
                }
              } else if (element.type === 'music-generator') {
                newMusicGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedMusicUrl: element.meta?.generatedMusicUrl || null, frameWidth: element.meta?.frameWidth, frameHeight: element.meta?.frameHeight, model: element.meta?.model, frame: element.meta?.frame, aspectRatio: element.meta?.aspectRatio, prompt: element.meta?.prompt });
                if (element.meta?.connections && Array.isArray(element.meta.connections)) {
                  element.meta.connections.forEach((c: any) => {
                    newConnectors.push({ id: c.id || `connector-${Date.now()}-${Math.random().toString(36).substr(2,6)}`, from: element.id, to: c.to, color: c.color || '#437eb5', fromAnchor: c.fromAnchor, toAnchor: c.toAnchor });
                  });
                }
              } else if (element.type === 'text-generator') {
                newTextGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, value: element.meta?.value });
                if (element.meta?.connections && Array.isArray(element.meta.connections)) {
                  element.meta.connections.forEach((c: any) => {
                    newConnectors.push({ id: c.id || `connector-${Date.now()}-${Math.random().toString(36).substr(2,6)}`, from: element.id, to: c.to, color: c.color || '#437eb5', fromAnchor: c.fromAnchor, toAnchor: c.toAnchor });
                  });
                }
              } else if (element.type === 'upscale-plugin') {
                newUpscaleGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, upscaledImageUrl: element.meta?.upscaledImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localUpscaledImageUrl: element.meta?.localUpscaledImageUrl || null, model: element.meta?.model, scale: element.meta?.scale });
                if (element.meta?.connections && Array.isArray(element.meta.connections)) {
                  element.meta.connections.forEach((c: any) => {
                    newConnectors.push({ id: c.id || `connector-${Date.now()}-${Math.random().toString(36).substr(2,6)}`, from: element.id, to: c.to, color: c.color || '#437eb5', fromAnchor: c.fromAnchor, toAnchor: c.toAnchor });
                  });
                }
              }
            }
          });
          setters.setImages(newImages);
          setters.setImageGenerators(newImageGenerators);
          setters.setVideoGenerators(newVideoGenerators);
          setters.setMusicGenerators(newMusicGenerators);
          setters.setUpscaleGenerators(newUpscaleGenerators);
          setters.setTextGenerators(newTextGenerators);
          setters.setConnectors(newConnectors);
          
        }
      } catch (e) {
        console.warn('No current snapshot to hydrate or failed to fetch', e);
      }
    };
    hydrate();
  }, [projectId, setters]);

  return { buildSnapshotElements };
}

