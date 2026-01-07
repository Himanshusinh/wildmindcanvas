import { useEffect, useRef } from 'react';
import { setCurrentSnapshot as apiSetCurrentSnapshot } from '@/core/api/canvasApi';
import { CanvasAppState, Connector } from '@/modules/canvas-app/types';

interface UseSnapshotManagerProps {
  projectId: string | null;
  state: CanvasAppState;
  isHydrated: boolean;
  mutationVersion: number;
}

export function useSnapshotManager({ projectId, state, isHydrated, mutationVersion }: UseSnapshotManagerProps) {
  const persistTimerRef = useRef<number | null>(null);
  const snapshotInFlight = useRef(false);
  const snapshotPendingRef = useRef(false);

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
      const metaObj: any = { generatedImageUrl: g.generatedImageUrl || null, sourceImageUrl: (g as any).sourceImageUrl || null, frameWidth: g.frameWidth, frameHeight: g.frameHeight, model: g.model, frame: g.frame, aspectRatio: g.aspectRatio, prompt: g.prompt };
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

  // Helper: Persist the current state
  const saveSnapshot = async () => {
    if (!projectId) return;

    if (snapshotInFlight.current) {
      // Mark that we have a pending save request
      snapshotPendingRef.current = true;
      return;
    }

    snapshotInFlight.current = true;
    snapshotPendingRef.current = false; // We are processing the latest

    try {
      const elements = buildSnapshotElements();
      await apiSetCurrentSnapshot(projectId, { elements, metadata: { version: '1.0' } });
      // console.debug('[Snapshot] persisted');
    } catch (e) {
      console.warn('Failed to persist snapshot', e);
    } finally {
      snapshotInFlight.current = false;
      // If a new change came in while we were saving, save again immediately
      if (snapshotPendingRef.current) {
        // Use setTimeout to yield to event loop and avoid recursion stack issues, 
        // though irrelevant for async functions, strictness helps.
        saveSnapshot();
      }
    }
  };

  // Persist full snapshot on every interaction (debounced)
  useEffect(() => {
    if (!projectId || !isHydrated) return;

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(saveSnapshot, 500) as unknown as number;

    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, [projectId, isHydrated, mutationVersion]);

  return { buildSnapshotElements };
}
