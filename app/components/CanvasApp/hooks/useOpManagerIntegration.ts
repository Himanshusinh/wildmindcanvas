import { useRef } from 'react';
import { useOpManager } from '@/hooks/useOpManager';
import { buildProxyResourceUrl } from '@/lib/proxyUtils';
import { ImageUpload } from '@/types/canvas';
import { CanvasAppState, CanvasAppSetters } from '../types';

interface UseOpManagerIntegrationProps {
  projectId: string | null;
  currentUser: { uid: string; username: string; email: string; credits?: number } | null;
  state: CanvasAppState;
  setters: CanvasAppSetters;
  snapshotLoadedRef: React.RefObject<boolean>;
  realtimeActiveRef: React.RefObject<boolean>;
}

export function useOpManagerIntegration({
  projectId,
  currentUser,
  state,
  setters,
  snapshotLoadedRef,
  realtimeActiveRef,
}: UseOpManagerIntegrationProps) {
  const { appendOp, undo, redo, canUndo, canRedo, isInitialized: opManagerInitialized } = useOpManager({
    projectId,
    enabled: !!projectId && !!currentUser,
    onOpApplied: (op, isOptimistic) => {
      try {
        const summary = {
          type: op.type,
          elementId: (op as any).elementId,
          elementIds: (op as any).elementIds?.length,
          isOptimistic,
        };
        console.log('[Ops] apply', summary);
      } catch { }
      // Handle snapshot application (snapshot contains map of elements)
      if (!snapshotLoadedRef.current && (op.data && typeof op.data === 'object' && (op.data.snapshot === true || (!op.data.element && !op.data.delta && !op.data.updates)))) {
        // This is a snapshot - op.data is the elements map
        // Replace entire images array with snapshot (don't append, as snapshot is the source of truth)
        const elements = op.data as Record<string, any>;
        const newImages: ImageUpload[] = [];
        const newImageGenerators: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }> = [];
        const newVideoGenerators: Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null }> = [];
        const newMusicGenerators: Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null }> = [];
        const newUpscaleGenerators: Array<{ id: string; x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number }> = [];
        const newRemoveBgGenerators: Array<{ id: string; x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; model?: string; backgroundType?: string; scaleValue?: number }> = [];
        const newEraseGenerators: Array<{ id: string; x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; model?: string }> = [];
        const newReplaceGenerators: Array<{ id: string; x: number; y: number; replacedImageUrl?: string | null; sourceImageUrl?: string | null; localReplacedImageUrl?: string | null; model?: string }> = [];
        const newExpandGenerators: Array<{ id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; model?: string }> = [];
        const newVectorizeGenerators: Array<{ id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string }> = [];
        const newTextGenerators: Array<{ id: string; x: number; y: number; value?: string }> = [];
        const newStoryboardGenerators: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null }> = [];
        const newScriptFrames: Array<{ id: string; pluginId: string; x: number; y: number; frameWidth: number; frameHeight: number; text: string }> = [];
        const newSceneFrames: Array<{ id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string }> = [];

        Object.values(elements).forEach((element: any) => {
          if (element && element.type) {
            // Use proxy URL for Zata URLs to avoid CORS
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
                ...(element.id && { elementId: element.id }),
              };
              newImages.push(newImage);
            } else if (element.type === 'image-generator') {
              newImageGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedImageUrl: element.meta?.generatedImageUrl || null });
            } else if (element.type === 'video-generator') {
              newVideoGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedVideoUrl: element.meta?.generatedVideoUrl || null });
            } else if (element.type === 'music-generator') {
              newMusicGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedMusicUrl: element.meta?.generatedMusicUrl || null });
            } else if (element.type === 'text-generator') {
              newTextGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, value: element.meta?.value || '' });
            } else if (element.type === 'upscale-plugin') {
              newUpscaleGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, upscaledImageUrl: element.meta?.upscaledImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localUpscaledImageUrl: element.meta?.localUpscaledImageUrl || null, model: element.meta?.model, scale: element.meta?.scale });
            } else if (element.type === 'removebg-plugin') {
              newRemoveBgGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, removedBgImageUrl: element.meta?.removedBgImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localRemovedBgImageUrl: element.meta?.localRemovedBgImageUrl || null, model: element.meta?.model, backgroundType: element.meta?.backgroundType, scaleValue: element.meta?.scaleValue });
            } else if (element.type === 'erase-plugin') {
              newEraseGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, erasedImageUrl: element.meta?.erasedImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localErasedImageUrl: element.meta?.localErasedImageUrl || null, model: element.meta?.model });
            } else if (element.type === 'replace-plugin') {
              newReplaceGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, replacedImageUrl: element.meta?.replacedImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localReplacedImageUrl: element.meta?.localReplacedImageUrl || null, model: element.meta?.model });
            } else if (element.type === 'expand-plugin') {
              newExpandGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, expandedImageUrl: element.meta?.expandedImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localExpandedImageUrl: element.meta?.localExpandedImageUrl || null, model: element.meta?.model });
            } else if (element.type === 'vectorize-plugin') {
              newVectorizeGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, vectorizedImageUrl: element.meta?.vectorizedImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localVectorizedImageUrl: element.meta?.localVectorizedImageUrl || null, mode: element.meta?.mode || 'simple' });
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
                namedImages: element.meta?.namedImages || undefined,
              } as any); // Type assertion needed due to optional fields
            } else if (element.type === 'script-frame') {
              newScriptFrames.push({ id: element.id, pluginId: element.meta?.pluginId || '', x: element.x || 0, y: element.y || 0, frameWidth: element.meta?.frameWidth || 400, frameHeight: element.meta?.frameHeight || 300, text: element.meta?.text || '' });
            } else if (element.type === 'scene-frame') {
              newSceneFrames.push({ 
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
            }
          }
        });

        // Replace entire images array with snapshot (this ensures deleted elements don't reappear)
        setters.setImages(newImages);
        // If realtime is not active, hydrate generators from snapshot; otherwise wait for realtime init
        if (!realtimeActiveRef.current) {
          setters.setImageGenerators(newImageGenerators);
          setters.setVideoGenerators(newVideoGenerators);
          setters.setMusicGenerators(newMusicGenerators);
          setters.setTextGenerators(newTextGenerators);
        }
        // Always load plugins from snapshot (realtime doesn't handle plugins)
        setters.setUpscaleGenerators(newUpscaleGenerators);
        setters.setRemoveBgGenerators(newRemoveBgGenerators);
        setters.setEraseGenerators(newEraseGenerators);
        setters.setReplaceGenerators(newReplaceGenerators);
        setters.setExpandGenerators(newExpandGenerators);
        setters.setVectorizeGenerators(newVectorizeGenerators);
        console.log('[Snapshot] Loading storyboard generators:', newStoryboardGenerators.length, newStoryboardGenerators);
        setters.setStoryboardGenerators(newStoryboardGenerators);
        setters.setScriptFrameGenerators(newScriptFrames);
        setters.setSceneFrameGenerators(newSceneFrames);
        snapshotLoadedRef.current = true;
      } else if (op.type === 'create' && op.data.element) {
        // Add new element from create op
        const element = op.data.element as any;
        // Use proxy URL for Zata URLs to avoid CORS
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
            ...(element.id && { elementId: element.id }),
          };
          setters.setImages((prev) => {
            if ((newImage as any).elementId) {
              const exists = prev.some(img => (img as any).elementId === (newImage as any).elementId);
              if (exists) return prev;
            }
            return [...prev, newImage];
          });
        } else if (element.type === 'image-generator') {
          setters.setImageGenerators((prev) => {
            if (prev.some(m => m.id === element.id)) return prev;
            return [...prev, { id: element.id, x: element.x || 0, y: element.y || 0, generatedImageUrl: element.meta?.generatedImageUrl || null }];
          });
        } else if (element.type === 'video-generator') {
          setters.setVideoGenerators((prev) => {
            if (prev.some(m => m.id === element.id)) return prev;
            return [...prev, { id: element.id, x: element.x || 0, y: element.y || 0, generatedVideoUrl: element.meta?.generatedVideoUrl || null }];
          });
        } else if (element.type === 'music-generator') {
          setters.setMusicGenerators((prev) => {
            if (prev.some(m => m.id === element.id)) return prev;
            return [...prev, { id: element.id, x: element.x || 0, y: element.y || 0, generatedMusicUrl: element.meta?.generatedMusicUrl || null }];
          });
        } else if (element.type === 'text-generator') {
          setters.setTextGenerators((prev) => {
            if (prev.some(m => m.id === element.id)) return prev;
            return [...prev, { id: element.id, x: element.x || 0, y: element.y || 0, value: element.meta?.value || '' }];
          });
        } else if (element.type === 'removebg-plugin') {
          setters.setRemoveBgGenerators((prev) => {
            if (prev.some(m => m.id === element.id)) return prev;
            return [...prev, { id: element.id, x: element.x || 0, y: element.y || 0, removedBgImageUrl: element.meta?.removedBgImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localRemovedBgImageUrl: element.meta?.localRemovedBgImageUrl || null, model: element.meta?.model, backgroundType: element.meta?.backgroundType, scaleValue: element.meta?.scaleValue }];
          });
        } else if (element.type === 'vectorize-plugin') {
          setters.setVectorizeGenerators((prev) => {
            if (prev.some(m => m.id === element.id)) return prev;
            return [...prev, { id: element.id, x: element.x || 0, y: element.y || 0, vectorizedImageUrl: element.meta?.vectorizedImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localVectorizedImageUrl: element.meta?.localVectorizedImageUrl || null, mode: element.meta?.mode || 'simple' }];
          });
        } else if (element.type === 'storyboard-plugin') {
          setters.setStoryboardGenerators((prev) => {
            if (prev.some(m => m.id === element.id)) return prev;
            return [...prev, { id: element.id, x: element.x || 0, y: element.y || 0, frameWidth: element.meta?.frameWidth || 400, frameHeight: element.meta?.frameHeight || 500, scriptText: element.meta?.scriptText || null }];
          });
        } else if (element.type === 'script-frame') {
          setters.setScriptFrameGenerators((prev) => {
            if (prev.some(m => m.id === element.id)) return prev;
            return [...prev, { id: element.id, pluginId: element.meta?.pluginId || '', x: element.x || 0, y: element.y || 0, frameWidth: element.meta?.frameWidth || 400, frameHeight: element.meta?.frameHeight || 300, text: element.meta?.text || '' }];
          });
        } else if (element.type === 'scene-frame') {
          setters.setSceneFrameGenerators((prev) => {
            if (prev.some(m => m.id === element.id)) return prev;
            return [...prev, { 
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
            } as any]; // Type assertion needed due to optional fields
          });
        } else if (element.type === 'connector') {
          // Add connector element into connectors state
          const conn = { id: element.id, from: element.from || element.meta?.from, to: element.to || element.meta?.to, color: element.meta?.color || '#437eb5', fromAnchor: element.meta?.fromAnchor, toAnchor: element.meta?.toAnchor };
          setters.setConnectors(prev => prev.some(c => c.id === conn.id) ? prev : [...prev, conn as any]);
        }
      } else if (op.type === 'delete' && op.elementId) {
        // Delete element - directly remove from state (don't call handleImageDelete to avoid sending another delete op)
        setters.setImages((prev) => {
          const index = prev.findIndex(img => (img as any).elementId === op.elementId);
          if (index >= 0) {
            const newImages = [...prev];
            const item = newImages[index];
            // Clean up blob URL if it exists
            if (item?.url && item.url.startsWith('blob:')) {
              URL.revokeObjectURL(item.url);
            }
            newImages.splice(index, 1);
            return newImages;
          }
          return prev;
        });
        // Delete generator overlay if present (needed for undo/redo)
        setters.setImageGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setters.setVideoGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setters.setMusicGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setters.setUpscaleGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setters.setRemoveBgGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setters.setEraseGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setters.setReplaceGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setters.setExpandGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setters.setVectorizeGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setters.setStoryboardGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setters.setScriptFrameGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setters.setSceneFrameGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setters.setTextGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        // Remove connectors if connector element deleted OR remove connectors referencing a deleted node
        setters.setConnectors(prev => prev.filter(c => c.id !== op.elementId && c.from !== op.elementId && c.to !== op.elementId));
      } else if (op.type === 'delete' && op.elementIds && op.elementIds.length > 0) {
        // Delete multiple elements
        setters.setImages((prev) => {
          const elementIdsSet = new Set(op.elementIds);
          const newImages = prev.filter((img) => {
            const elementId = (img as any).elementId;
            if (elementId && elementIdsSet.has(elementId)) {
              // Clean up blob URL if it exists
              if (img?.url && img.url.startsWith('blob:')) {
                URL.revokeObjectURL(img.url);
              }
              return false; // Remove this element
            }
            return true; // Keep this element
          });
          return newImages;
        });
      } else if (op.type === 'move' && op.elementId && op.data.delta) {
        // Move element
        setters.setImages((prev) => {
          const index = prev.findIndex(img => (img as any).elementId === op.elementId);
          if (index >= 0) {
            const newImages = [...prev];
            const current = newImages[index];
            newImages[index] = {
              ...current,
              x: (current.x || 0) + op.data.delta.x,
              y: (current.y || 0) + op.data.delta.y,
            };
            return newImages;
          }
          return prev;
        });
        // Move generator overlay by delta (needed for undo/redo)
        setters.setImageGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0) {
            const cur = prev[idx];
            const next = [...prev];
            next[idx] = { ...cur, x: (cur.x || 0) + (op.data.delta?.x || 0), y: (cur.y || 0) + (op.data.delta?.y || 0) } as any;
            return next;
          }
          return prev;
        });
        setters.setVideoGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0) {
            const cur = prev[idx];
            const next = [...prev];
            next[idx] = { ...cur, x: (cur.x || 0) + (op.data.delta?.x || 0), y: (cur.y || 0) + (op.data.delta?.y || 0) } as any;
            return next;
          }
          return prev;
        });
        setters.setMusicGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0) {
            const cur = prev[idx];
            const next = [...prev];
            next[idx] = { ...cur, x: (cur.x || 0) + (op.data.delta?.x || 0), y: (cur.y || 0) + (op.data.delta?.y || 0) } as any;
            return next;
          }
          return prev;
        });
      } else if (op.type === 'update' && op.elementId && op.data.updates) {
        // Also handle regular element updates
        setters.setImages((prev) => {
          const elementId = op.elementId!;
          const index = prev.findIndex(img => (img as any).elementId === elementId);
          if (index >= 0 && op.data.updates) {
            const newImages = [...prev];
            newImages[index] = { ...newImages[index], ...op.data.updates };
            return newImages;
          }
          return prev;
        });
        // Update a generator modal if matched (needed for undo/redo)
        setters.setImageGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0 && op.data.updates) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...op.data.updates } as any;
            return next;
          }
          return prev;
        });
        setters.setVideoGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0 && op.data.updates) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...op.data.updates } as any;
            return next;
          }
          return prev;
        });
        setters.setMusicGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0 && op.data.updates) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...op.data.updates } as any;
            return next;
          }
          return prev;
        });
        setters.setUpscaleGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0 && op.data.updates) {
            const next = [...prev];
            // Handle structured updates: x/y are top-level, everything else is in meta
            const updates = op.data.updates as any;
            const metaUpdates = updates.meta || {};
            next[idx] = {
              ...next[idx],
              ...(updates.x !== undefined ? { x: updates.x } : {}),
              ...(updates.y !== undefined ? { y: updates.y } : {}),
              ...metaUpdates,
            } as any;
            return next;
          }
          return prev;
        });
        setters.setRemoveBgGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0 && op.data.updates) {
            const next = [...prev];
            // Handle structured updates: x/y are top-level, everything else is in meta
            const updates = op.data.updates as any;
            const metaUpdates = updates.meta || {};
            next[idx] = {
              ...next[idx],
              ...(updates.x !== undefined ? { x: updates.x } : {}),
              ...(updates.y !== undefined ? { y: updates.y } : {}),
              ...metaUpdates,
            } as any;
            return next;
          }
          return prev;
        });
        setters.setVectorizeGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0 && op.data.updates) {
            const next = [...prev];
            // Handle structured updates: x/y are top-level, everything else is in meta
            const updates = op.data.updates as any;
            const metaUpdates = updates.meta || {};
            next[idx] = {
              ...next[idx],
              ...(updates.x !== undefined ? { x: updates.x } : {}),
              ...(updates.y !== undefined ? { y: updates.y } : {}),
              ...metaUpdates,
            } as any;
            return next;
          }
          return prev;
        });
        // If this update modified meta.connections, update connectors state accordingly (backwards compat)
        if (op.data.updates && op.data.updates.meta && Array.isArray(op.data.updates.meta.connections)) {
          const conns = (op.data.updates.meta.connections || []).map((c: any) => ({ id: c.id, from: op.elementId, to: c.to, color: c.color || '#437eb5', fromAnchor: c.fromAnchor, toAnchor: c.toAnchor }));
          setters.setConnectors(prev => {
            // remove existing connectors from this source then append new ones
            const filtered = prev.filter(p => p.from !== op.elementId);
            return [...filtered, ...conns];
          });
        }
      }
    },
  });

  return { appendOp, undo, redo, canUndo, canRedo, opManagerInitialized };
}

