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
    const connectorsToUse = (connectorsOverride ?? state.connectors).filter(
      (c) => !(c?.from && c.from.startsWith('replace-')) && !(c?.to && c.to.startsWith('replace-'))
    );
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
    // Remove BG generators
    state.removeBgGenerators.forEach((modal) => {
      if (!modal || !modal.id) return;
      const metaObj: any = {
        removedBgImageUrl: modal.removedBgImageUrl || null,
        sourceImageUrl: modal.sourceImageUrl || null,
        localRemovedBgImageUrl: modal.localRemovedBgImageUrl || null,
        model: modal.model || '851-labs/background-remover',
        backgroundType: modal.backgroundType || 'rgba (transparent)',
        scaleValue: modal.scaleValue || 0.5,
        frameWidth: modal.frameWidth || 400,
        frameHeight: modal.frameHeight || 500,
        isRemovingBg: modal.isRemovingBg || false,
      };
      if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
        metaObj.connections = connectionsBySource[modal.id];
      }
      elements[modal.id] = {
        id: modal.id,
        type: 'removebg-plugin',
        x: modal.x,
        y: modal.y,
        meta: metaObj,
      };
    });
    // Erase generators
    state.eraseGenerators.forEach((modal) => {
      if (!modal || !modal.id) return;
      const metaObj: any = {
        erasedImageUrl: modal.erasedImageUrl || null,
        sourceImageUrl: modal.sourceImageUrl || null,
        localErasedImageUrl: modal.localErasedImageUrl || null,
        model: modal.model || 'bria/eraser',
        frameWidth: modal.frameWidth || 400,
        frameHeight: modal.frameHeight || 500,
        isErasing: modal.isErasing || false,
      };
      if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
        metaObj.connections = connectionsBySource[modal.id];
      }
      elements[modal.id] = {
        id: modal.id,
        type: 'erase-plugin',
        x: modal.x,
        y: modal.y,
        meta: metaObj,
      };
    });
    // Expand generators
    state.expandGenerators.forEach((modal) => {
      if (!modal || !modal.id) return;
      const metaObj: any = {
        expandedImageUrl: modal.expandedImageUrl || null,
        sourceImageUrl: modal.sourceImageUrl || null,
        localExpandedImageUrl: modal.localExpandedImageUrl || null,
        model: modal.model || 'expand/base',
        frameWidth: modal.frameWidth || 400,
        frameHeight: modal.frameHeight || 500,
        isExpanding: modal.isExpanding || false,
      };
      if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
        metaObj.connections = connectionsBySource[modal.id];
      }
      elements[modal.id] = {
        id: modal.id,
        type: 'expand-plugin',
        x: modal.x,
        y: modal.y,
        meta: metaObj,
      };
    });
    // Vectorize generators
    state.vectorizeGenerators.forEach((modal) => {
      if (!modal || !modal.id) return;
      const metaObj: any = {
        vectorizedImageUrl: modal.vectorizedImageUrl || null,
        sourceImageUrl: modal.sourceImageUrl || null,
        localVectorizedImageUrl: modal.localVectorizedImageUrl || null,
        mode: modal.mode || 'simple',
        frameWidth: modal.frameWidth || 400,
        frameHeight: modal.frameHeight || 500,
        isVectorizing: modal.isVectorizing || false,
      };
      if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
        metaObj.connections = connectionsBySource[modal.id];
      }
      elements[modal.id] = {
        id: modal.id,
        type: 'vectorize-plugin',
        x: modal.x,
        y: modal.y,
        meta: metaObj,
      };
    });
    // Storyboard generators
    state.storyboardGenerators.forEach((modal) => {
      if (!modal || !modal.id) return;
      const metaObj: any = {
        frameWidth: modal.frameWidth || 400,
        frameHeight: modal.frameHeight || 500,
        scriptText: modal.scriptText || null,
        characterNamesMap: (modal as any).characterNamesMap || {},
        propsNamesMap: (modal as any).propsNamesMap || {},
        backgroundNamesMap: (modal as any).backgroundNamesMap || {},
        stitchedImageUrl: (modal as any).stitchedImageUrl || undefined,
      };

      // Build namedImages object: name -> imageUrl mapping (auto-updated)
      const namedImages: {
        characters?: Record<string, string>;
        backgrounds?: Record<string, string>;
        props?: Record<string, string>;
      } = {};

      // Get connections for this storyboard
      // Images connect TO the storyboard, so we filter by c.to === modal.id
      const storyboardConnections = connectorsToUse.filter(c => c.to === modal.id);
      const characterConnections = storyboardConnections.filter(c => c.toAnchor === 'receive-character');
      const backgroundConnections = storyboardConnections.filter(c => c.toAnchor === 'receive-background');
      const propsConnections = storyboardConnections.filter(c => c.toAnchor === 'receive-props');
      
      console.log(`[useSnapshotManager] Storyboard ${modal.id} connections:`, {
        totalConnections: storyboardConnections.length,
        characterConnections: characterConnections.length,
        characterConnectionsDetails: characterConnections.map(c => ({ from: c.from, to: c.to, toAnchor: c.toAnchor })),
      });

      // Build character name -> imageUrl map
      if ((modal as any).characterNamesMap) {
        const characterMap: Record<string, string> = {};
        Object.entries((modal as any).characterNamesMap).forEach(([indexStr, name]) => {
          const index = parseInt(indexStr, 10);
          if (name && characterConnections[index]) {
            // Connection is FROM image TO storyboard, so imageId is c.from
            const imageId = characterConnections[index].from;
            const imageGen = state.imageGenerators.find(img => img.id === imageId);
            let imageUrl: string | undefined = undefined;
            
            if (imageGen) {
              imageUrl = imageGen.generatedImageUrl || 
                        (imageGen as any)?.sourceImageUrl || 
                        (imageGen as any)?.generatedImageUrls?.[0] ||
                        (imageGen as any)?.url;
            }
            
            if (!imageUrl) {
              const image = state.images.find(img => (img as any).elementId === imageId);
              imageUrl = image?.url || (image as any)?.firebaseUrl;
            }
            
            if (imageUrl) {
              characterMap[name as string] = imageUrl;
            }
          }
        });
        if (Object.keys(characterMap).length > 0) {
          namedImages.characters = characterMap;
        }
      }

      // Build background name -> imageUrl map
      if ((modal as any).backgroundNamesMap) {
        const backgroundMap: Record<string, string> = {};
        Object.entries((modal as any).backgroundNamesMap).forEach(([indexStr, name]) => {
          const index = parseInt(indexStr, 10);
          if (name && backgroundConnections[index]) {
            // Connection is FROM image TO storyboard, so imageId is c.from
            const imageId = backgroundConnections[index].from;
            const imageGen = state.imageGenerators.find(img => img.id === imageId);
            let imageUrl: string | undefined = undefined;
            
            if (imageGen) {
              imageUrl = imageGen.generatedImageUrl || 
                        (imageGen as any)?.sourceImageUrl || 
                        (imageGen as any)?.generatedImageUrls?.[0] ||
                        (imageGen as any)?.url;
            }
            
            if (!imageUrl) {
              const image = state.images.find(img => (img as any).elementId === imageId);
              imageUrl = image?.url || (image as any)?.firebaseUrl;
            }
            
            if (imageUrl) {
              backgroundMap[name as string] = imageUrl;
            }
          }
        });
        if (Object.keys(backgroundMap).length > 0) {
          namedImages.backgrounds = backgroundMap;
        }
      }

      // Build props name -> imageUrl map
      if ((modal as any).propsNamesMap) {
        const propsMap: Record<string, string> = {};
        Object.entries((modal as any).propsNamesMap).forEach(([indexStr, name]) => {
          const index = parseInt(indexStr, 10);
          if (name && propsConnections[index]) {
            // Connection is FROM image TO storyboard, so imageId is c.from
            const imageId = propsConnections[index].from;
            const imageGen = state.imageGenerators.find(img => img.id === imageId);
            let imageUrl: string | undefined = undefined;
            
            if (imageGen) {
              imageUrl = imageGen.generatedImageUrl || 
                        (imageGen as any)?.sourceImageUrl || 
                        (imageGen as any)?.generatedImageUrls?.[0] ||
                        (imageGen as any)?.url;
            }
            
            if (!imageUrl) {
              const image = state.images.find(img => (img as any).elementId === imageId);
              imageUrl = image?.url || (image as any)?.firebaseUrl;
            }
            
            if (imageUrl) {
              propsMap[name as string] = imageUrl;
            }
          }
        });
        if (Object.keys(propsMap).length > 0) {
          namedImages.props = propsMap;
        }
      }

      // Add namedImages to meta if it has any data
      if (Object.keys(namedImages).length > 0) {
        metaObj.namedImages = namedImages;
        console.log(`[useSnapshotManager] ✅ Added namedImages to storyboard ${modal.id}:`, namedImages);
      } else {
        console.warn(`[useSnapshotManager] ⚠️ No namedImages built for storyboard ${modal.id}`, {
          hasCharacterNamesMap: !!(modal as any).characterNamesMap,
          characterConnectionsCount: characterConnections.length,
        });
      }

      if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
        metaObj.connections = connectionsBySource[modal.id];
      }
      elements[modal.id] = {
        id: modal.id,
        type: 'storyboard-plugin',
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
    const connectorsToUseFinal = (connectorsOverride ?? state.connectors).filter(
      (c) => !(c?.from && c.from.startsWith('replace-')) && !(c?.to && c.to.startsWith('replace-'))
    );
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
  }, [projectId, state.images, state.imageGenerators, state.videoGenerators, state.musicGenerators, state.textGenerators, state.upscaleGenerators, state.removeBgGenerators, state.eraseGenerators, state.expandGenerators, state.vectorizeGenerators, state.storyboardGenerators, state.scriptFrameGenerators, state.sceneFrameGenerators, state.connectors]);

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
          const newRemoveBgGenerators: Array<{ id: string; x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; model?: string; backgroundType?: string; scaleValue?: number }> = [];
          const newEraseGenerators: Array<{ id: string; x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; model?: string }> = [];
          const newExpandGenerators: Array<{ id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; model?: string }> = [];
          const newVectorizeGenerators: Array<{ id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string }> = [];
          const newStoryboardGenerators: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null }> = [];
          const newScriptFrameGenerators: Array<{ id: string; pluginId: string; x: number; y: number; frameWidth: number; frameHeight: number; text: string }> = [];
          const newSceneFrameGenerators: Array<{ id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string }> = [];
          const newTextGenerators: Array<{ id: string; x: number; y: number; value?: string }> = [];
          const newConnectors: Array<{ id: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }> = [];
          // Track connector signatures to prevent duplicates: "from|to|toAnchor"
          const connectorSignatures = new Set<string>();

          // FIRST PASS: Process connector elements first (they are the source of truth)
          // This ensures we get the correct IDs and properties before processing meta.connections
          Object.values(elements).forEach((element: any) => {
            if (element && element.type === 'connector') {
              const connector = { 
                id: element.id, 
                from: element.from || element.meta?.from, 
                to: element.to || element.meta?.to, 
                color: element.meta?.color || '#437eb5', 
                fromAnchor: element.meta?.fromAnchor, 
                toAnchor: element.meta?.toAnchor 
              };
              const signature = `${connector.from}|${connector.to}|${connector.toAnchor || ''}`;
              if (!connectorSignatures.has(signature)) {
                connectorSignatures.add(signature);
                newConnectors.push(connector);
              }
            }
          });

          // SECOND PASS: Process all other elements and restore from meta.connections only if not already restored
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
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'image-generator') {
                newImageGenerators.push({ 
                  id: element.id, 
                  x: element.x || 0, 
                  y: element.y || 0, 
                  generatedImageUrl: element.meta?.generatedImageUrl || null, 
                  sourceImageUrl: element.meta?.sourceImageUrl || null, // CRITICAL: Load sourceImageUrl from snapshot
                  frameWidth: element.meta?.frameWidth, 
                  frameHeight: element.meta?.frameHeight, 
                  model: element.meta?.model, 
                  frame: element.meta?.frame, 
                  aspectRatio: element.meta?.aspectRatio, 
                  prompt: element.meta?.prompt 
                } as any);
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'connector') {
                // Skip - already processed in first pass
              } else if (element.type === 'video-generator') {
                newVideoGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedVideoUrl: element.meta?.generatedVideoUrl || null, frameWidth: element.meta?.frameWidth, frameHeight: element.meta?.frameHeight, model: element.meta?.model, frame: element.meta?.frame, aspectRatio: element.meta?.aspectRatio, prompt: element.meta?.prompt, duration: element.meta?.duration, taskId: element.meta?.taskId, generationId: element.meta?.generationId, status: element.meta?.status });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'music-generator') {
                newMusicGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedMusicUrl: element.meta?.generatedMusicUrl || null, frameWidth: element.meta?.frameWidth, frameHeight: element.meta?.frameHeight, model: element.meta?.model, frame: element.meta?.frame, aspectRatio: element.meta?.aspectRatio, prompt: element.meta?.prompt });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'text-generator') {
                newTextGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, value: element.meta?.value });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'upscale-plugin') {
                newUpscaleGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, upscaledImageUrl: element.meta?.upscaledImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localUpscaledImageUrl: element.meta?.localUpscaledImageUrl || null, model: element.meta?.model, scale: element.meta?.scale });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'removebg-plugin') {
                newRemoveBgGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, removedBgImageUrl: element.meta?.removedBgImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localRemovedBgImageUrl: element.meta?.localRemovedBgImageUrl || null, model: element.meta?.model, backgroundType: element.meta?.backgroundType, scaleValue: element.meta?.scaleValue });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'erase-plugin') {
                newEraseGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, erasedImageUrl: element.meta?.erasedImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localErasedImageUrl: element.meta?.localErasedImageUrl || null, model: element.meta?.model });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'expand-plugin') {
                newExpandGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, expandedImageUrl: element.meta?.expandedImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localExpandedImageUrl: element.meta?.localExpandedImageUrl || null, model: element.meta?.model });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'vectorize-plugin') {
                newVectorizeGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, vectorizedImageUrl: element.meta?.vectorizedImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localVectorizedImageUrl: element.meta?.localVectorizedImageUrl || null, mode: element.meta?.mode || 'simple' });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'storyboard-plugin') {
                newStoryboardGenerators.push({ 
                  id: element.id, 
                  x: element.x || 0, 
                  y: element.y || 0, 
                  frameWidth: element.meta?.frameWidth || 400, 
                  frameHeight: element.meta?.frameHeight || 500, 
                  scriptText: element.meta?.scriptText || null,
                  characterNamesMap: element.meta?.characterNamesMap || {},
                  propsNamesMap: element.meta?.propsNamesMap || {},
                  backgroundNamesMap: element.meta?.backgroundNamesMap || {},
                  stitchedImageUrl: element.meta?.stitchedImageUrl || undefined,
                  namedImages: element.meta?.namedImages || undefined,
                } as any); // Type assertion needed due to optional fields
                // NOTE: Storyboard connections are NOT stored in storyboard.meta.connections
                // They are stored in the image elements' meta.connections (as outgoing connections)
                // OR as top-level connector elements. We'll restore them from connector elements below.
                // Do NOT restore connections from storyboard.meta.connections as that would create duplicates.
              } else if (element.type === 'script-frame') {
                newScriptFrameGenerators.push({ id: element.id, pluginId: element.meta?.pluginId || '', x: element.x || 0, y: element.y || 0, frameWidth: element.meta?.frameWidth || 400, frameHeight: element.meta?.frameHeight || 300, text: element.meta?.text || '' });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'scene-frame') {
                newSceneFrameGenerators.push({ 
                  id: element.id, 
                  scriptFrameId: element.meta?.scriptFrameId || '', 
                  sceneNumber: element.meta?.sceneNumber || 0, 
                  x: element.x || 0, 
                  y: element.y || 0, 
                  frameWidth: element.meta?.frameWidth || 350, 
                  frameHeight: element.meta?.frameHeight || 300, 
                  content: element.meta?.content || '',
                  characterIds: element.meta?.characterIds || undefined,
                  locationId: element.meta?.locationId || undefined,
                  mood: element.meta?.mood || undefined,
                  characterNames: element.meta?.characterNames || undefined,
                  locationName: element.meta?.locationName || undefined,
                } as any); // Type assertion needed due to optional fields
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              }
            }
          });
          setters.setImages(newImages);
          setters.setImageGenerators(newImageGenerators);
          setters.setVideoGenerators(newVideoGenerators);
          setters.setMusicGenerators(newMusicGenerators);
          setters.setUpscaleGenerators(newUpscaleGenerators);
          setters.setRemoveBgGenerators(newRemoveBgGenerators);
        setters.setEraseGenerators(newEraseGenerators);
          setters.setExpandGenerators(newExpandGenerators);
          setters.setVectorizeGenerators(newVectorizeGenerators);
          setters.setStoryboardGenerators(newStoryboardGenerators);
          setters.setScriptFrameGenerators(newScriptFrameGenerators);
          setters.setSceneFrameGenerators(newSceneFrameGenerators);
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

