'use client';

import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@/app/components/Canvas';
import GenerationQueue, { GenerationQueueItem } from '@/app/components/Canvas/GenerationQueue';
import { ToolbarPanel } from '@/app/components/ToolbarPanel';
import { Header } from '@/app/components/Header';
import { AuthGuard } from '@/app/components/AuthGuard';
import { Profile } from '@/app/components/Profile/Profile';
import LibrarySidebar from '@/app/components/Canvas/LibrarySidebar';
import PluginSidebar from '@/app/components/Canvas/PluginSidebar';
import { ImageUpload } from '@/types/canvas';
import { generateImageForCanvas, generateVideoForCanvas, upscaleImageForCanvas, removeBgImageForCanvas, vectorizeImageForCanvas, getCurrentUser, MediaItem } from '@/lib/api';
import { createProject, getProject, listProjects, getCurrentSnapshot as apiGetCurrentSnapshot, setCurrentSnapshot as apiSetCurrentSnapshot, updateProject } from '@/lib/canvasApi';
import { ProjectSelector } from '@/app/components/ProjectSelector/ProjectSelector';
import { CanvasProject, CanvasOp } from '@/lib/canvasApi';
import { useOpManager } from '@/hooks/useOpManager';
import { useProject } from '@/hooks/useProject';
import { useUIVisibility } from '@/hooks/useUIVisibility';
import { buildProxyDownloadUrl, buildProxyResourceUrl } from '@/lib/proxyUtils';
import { RealtimeClient, GeneratorOverlay } from '@/lib/realtime';
import { buildSnapshotElements } from '@/app/components/CanvasApp/utils/buildSnapshotElements';
import { createImageHandlers } from '@/app/components/CanvasApp/handlers/imageHandlers';
import { createPluginHandlers } from '@/app/components/CanvasApp/handlers/pluginHandlers';
import { CanvasAppState, CanvasAppSetters, ScriptFrameGenerator, SceneFrameGenerator } from '@/app/components/CanvasApp/types';
import VideoEditorPluginModal from '@/app/components/Plugins/VideoEditorPluginModal';

interface CanvasAppProps {
  user: { uid: string; username: string; email: string; credits?: number } | null;
}

export function CanvasApp({ user }: CanvasAppProps) {
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [imageGenerators, setImageGenerators] = useState<Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>([]);
  const [videoGenerators, setVideoGenerators] = useState<Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number; taskId?: string; generationId?: string; status?: string }>>([]);
  const [musicGenerators, setMusicGenerators] = useState<Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>([]);
  const [upscaleGenerators, setUpscaleGenerators] = useState<Array<{ id: string; x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number; frameWidth?: number; frameHeight?: number; isUpscaling?: boolean }>>([]);
  const [removeBgGenerators, setRemoveBgGenerators] = useState<Array<{ id: string; x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; model?: string; backgroundType?: string; scaleValue?: number; frameWidth?: number; frameHeight?: number; isRemovingBg?: boolean }>>([]);
  const [eraseGenerators, setEraseGenerators] = useState<Array<{ id: string; x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; model?: string; frameWidth?: number; frameHeight?: number; isErasing?: boolean }>>([]);
  const [replaceGenerators, setReplaceGenerators] = useState<Array<{ id: string; x: number; y: number; replacedImageUrl?: string | null; sourceImageUrl?: string | null; localReplacedImageUrl?: string | null; model?: string; frameWidth?: number; frameHeight?: number; isReplacing?: boolean }>>([]);
  const [expandGenerators, setExpandGenerators] = useState<Array<{ id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; model?: string; frameWidth?: number; frameHeight?: number; isExpanding?: boolean }>>([]);
  const [vectorizeGenerators, setVectorizeGenerators] = useState<Array<{ id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }>>([]);
  const [storyboardGenerators, setStoryboardGenerators] = useState<Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null }>>([]);
  const [scriptFrameGenerators, setScriptFrameGenerators] = useState<ScriptFrameGenerator[]>([]);
  const [sceneFrameGenerators, setSceneFrameGenerators] = useState<SceneFrameGenerator[]>([]);
  const [generationQueue, setGenerationQueue] = useState<GenerationQueueItem[]>([]);
  // Text generator (input overlay) persistence state
  const [textGenerators, setTextGenerators] = useState<Array<{ id: string; x: number; y: number; value?: string }>>([]);
  // Global reference images map - stores character/background/prop names to image URLs
  // This is simpler and more reliable than storing sourceImageUrl in each scene modal
  const [refImages, setRefImages] = useState<Record<string, string>>({});
  // Connectors (node-to-node links)
  const [connectors, setConnectors] = useState<Array<{ id: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }>>([]);
  const snapshotLoadedRef = useRef(false);
  const realtimeRef = useRef<RealtimeClient | null>(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const realtimeActiveRef = useRef(false);
  const persistTimerRef = useRef<number | null>(null);
  const currentUser = user;
  const viewportCenterRef = useRef<{ x: number; y: number; scale: number }>({
    x: 500000, // Center of 1,000,000 x 1,000,000 infinite canvas (where dots are visible)
    y: 500000,
    scale: 1,
  });

  // Use project management hook
  const {
    projectId,
    projectName,
    showProjectSelector,
    isInitializing,
    setProjectId,
    setProjectName,
    setShowProjectSelector,
    handleProjectSelect,
  } = useProject({ currentUser });

  // Use UI visibility hook
  const { isUIHidden, setIsUIHidden } = useUIVisibility();
  const [isVideoEditorOpen, setIsVideoEditorOpen] = useState(false);


  const handleViewportChange = (center: { x: number; y: number }, scale: number) => {
    viewportCenterRef.current = { x: center.x, y: center.y, scale };
  };

  // Initialize OpManager
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
              newImageGenerators.push({
                id: element.id,
                x: element.x || 0,
                y: element.y || 0,
                generatedImageUrl: element.meta?.generatedImageUrl || null,
                sourceImageUrl: element.meta?.sourceImageUrl || null, // CRITICAL: Load sourceImageUrl
              } as any);
            } else if (element.type === 'video-generator') {
              newVideoGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedVideoUrl: element.meta?.generatedVideoUrl || null });
            } else if (element.type === 'music-generator') {
              newMusicGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedMusicUrl: element.meta?.generatedMusicUrl || null });
            } else if (element.type === 'upscale-plugin') {
              newUpscaleGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, upscaledImageUrl: element.meta?.upscaledImageUrl || null, sourceImageUrl: element.meta?.sourceImageUrl || null, localUpscaledImageUrl: element.meta?.localUpscaledImageUrl || null, model: element.meta?.model, scale: element.meta?.scale });
            }
          }
        });

        // Replace entire images array with snapshot (this ensures deleted elements don't reappear)
        setImages(newImages);
        // If realtime is not active, hydrate generators from snapshot; otherwise wait for realtime init
        if (!realtimeActiveRef.current) {
          setImageGenerators(newImageGenerators);
          setVideoGenerators(newVideoGenerators);
          setMusicGenerators(newMusicGenerators);
          setUpscaleGenerators(newUpscaleGenerators);
        }
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
          setImages((prev) => {
            if ((newImage as any).elementId) {
              const exists = prev.some(img => (img as any).elementId === (newImage as any).elementId);
              if (exists) return prev;
            }
            return [...prev, newImage];
          });
        } else if (element.type === 'image-generator') {
          setImageGenerators((prev) => {
            if (prev.some(m => m.id === element.id)) return prev;
            return [...prev, {
              id: element.id,
              x: element.x || 0,
              y: element.y || 0,
              generatedImageUrl: element.meta?.generatedImageUrl || null,
              sourceImageUrl: element.meta?.sourceImageUrl || null, // CRITICAL: Load sourceImageUrl
            } as any];
          });
        } else if (element.type === 'video-generator') {
          setVideoGenerators((prev) => {
            if (prev.some(m => m.id === element.id)) return prev;
            return [...prev, { id: element.id, x: element.x || 0, y: element.y || 0, generatedVideoUrl: element.meta?.generatedVideoUrl || null }];
          });
        } else if (element.type === 'music-generator') {
          setMusicGenerators((prev) => {
            if (prev.some(m => m.id === element.id)) return prev;
            return [...prev, { id: element.id, x: element.x || 0, y: element.y || 0, generatedMusicUrl: element.meta?.generatedMusicUrl || null }];
          });
        } else if (element.type === 'connector') {
          // Add connector element into connectors state
          const conn = { id: element.id, from: element.from || element.meta?.from, to: element.to || element.meta?.to, color: element.meta?.color || '#437eb5', fromAnchor: element.meta?.fromAnchor, toAnchor: element.meta?.toAnchor };
          setConnectors(prev => prev.some(c => c.id === conn.id) ? prev : [...prev, conn as any]);
        }
      } else if (op.type === 'delete' && op.elementId) {
        // Delete element - directly remove from state (don't call handleImageDelete to avoid sending another delete op)
        setImages((prev) => {
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
        setImageGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setVideoGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setMusicGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        setUpscaleGenerators((prev) => prev.filter(m => m.id !== op.elementId));
        // Remove connectors if connector element deleted OR remove connectors referencing a deleted node
        setConnectors(prev => prev.filter(c => c.id !== op.elementId && c.from !== op.elementId && c.to !== op.elementId));
      } else if (op.type === 'delete' && op.elementIds && op.elementIds.length > 0) {
        // Delete multiple elements
        setImages((prev) => {
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
        setImages((prev) => {
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
        setImageGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0) {
            const cur = prev[idx];
            const next = [...prev];
            next[idx] = { ...cur, x: (cur.x || 0) + (op.data.delta?.x || 0), y: (cur.y || 0) + (op.data.delta?.y || 0) } as any;
            return next;
          }
          return prev;
        });
        setVideoGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0) {
            const cur = prev[idx];
            const next = [...prev];
            next[idx] = { ...cur, x: (cur.x || 0) + (op.data.delta?.x || 0), y: (cur.y || 0) + (op.data.delta?.y || 0) } as any;
            return next;
          }
          return prev;
        });
        setMusicGenerators((prev) => {
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
        setImages((prev) => {
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
        setImageGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0 && op.data.updates) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...op.data.updates } as any;
            return next;
          }
          return prev;
        });
        setVideoGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0 && op.data.updates) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...op.data.updates } as any;
            return next;
          }
          return prev;
        });
        setMusicGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0 && op.data.updates) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...op.data.updates } as any;
            return next;
          }
          return prev;
        });
        // If this update modified meta.connections, update connectors state accordingly (backwards compat)
        if (op.data.updates && op.data.updates.meta && Array.isArray(op.data.updates.meta.connections)) {
          const conns = (op.data.updates.meta.connections || []).map((c: any) => ({ id: c.id, from: op.elementId, to: c.to, color: c.color || '#437eb5', fromAnchor: c.fromAnchor, toAnchor: c.toAnchor }));
          setConnectors(prev => {
            // remove existing connectors from this source then append new ones
            const filtered = prev.filter(p => p.from !== op.elementId);
            return [...filtered, ...conns];
          });
        }
      }
    },
  });

  // Helper: remove any connectors that reference a given element id and persist their deletion
  const removeAndPersistConnectorsForElement = async (elementId: string) => {
    if (!elementId) return;
    const toRemove = connectors.filter(c => c.from === elementId || c.to === elementId).map(c => c.id);
    if (!toRemove || toRemove.length === 0) return;

    // Optimistic update
    setConnectors(prev => prev.filter(c => !toRemove.includes(c.id)));

    // Broadcast via realtime (if available)
    if (realtimeActive) {
      try {
        toRemove.forEach(id => {
          try { realtimeRef.current?.sendDelete(id); } catch (e) { /* best-effort */ }
        });
      } catch (e) { console.warn('realtime send connector.delete failed', e); }
    }

    // Persist deletes as individual delete ops so server removes connector elements
    if (projectId && opManagerInitialized) {
      for (const connId of toRemove) {
        try {
          // Capture inverse by finding connector details
          const conn = connectors.find(c => c.id === connId);
          const inverse = conn ? { type: 'create', elementId: connId, data: { element: { id: connId, type: 'connector', from: conn.from, to: conn.to, meta: { color: conn.color, fromAnchor: conn.fromAnchor, toAnchor: conn.toAnchor } } }, requestId: '', clientTs: 0 } : undefined;
          await appendOp({ type: 'delete', elementId: connId, data: {}, inverse: inverse as any } as any);
        } catch (e) {
          console.error('Failed to persist connector delete op', e);
        }
      }
      // Force-persist snapshot to reflect removals immediately
      try {
        const filteredConnectors = connectors.filter(c => !toRemove.includes(c.id));
        const elements = buildSnapshotElements({
          images,
          imageGenerators,
          videoGenerators,
          musicGenerators,
          upscaleGenerators,
          removeBgGenerators,
          eraseGenerators,
          replaceGenerators,
          expandGenerators,
          vectorizeGenerators,
          storyboardGenerators,
          scriptFrameGenerators,
          sceneFrameGenerators,
          textGenerators,
          connectors: filteredConnectors,
          generationQueue,
        });
        await apiSetCurrentSnapshot(projectId, { elements, metadata: { version: '1.0' } });
      } catch (e) {
        console.warn('Failed to persist snapshot after connector removals', e);
      }
    }
  };

  // Auto-persist any newly created media nodes that don't yet have a stable elementId.
  // This ensures nodes created locally are assigned a stable ID and persisted via an appendOp,
  // so they survive refresh and appear in snapshots.
  useEffect(() => {
    if (!projectId || !opManagerInitialized) return;

    images.forEach((img, idx) => {
      if (!img) return;
      // Only persist uploaded media (image/video/text/model3d) and skip generator overlays
      if ((img as any).elementId) return; // already has stable id

      // Only persist items that have a URL or file content (skip purely transient placeholders)
      if (!img.url && !img.file && img.type !== 'text') return;

      // Assign a stable element id and persist
      const newElementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // Update local state with the new elementId
      setImages((prev) => {
        const next = [...prev];
        if (next[idx]) {
          next[idx] = { ...next[idx], elementId: newElementId };
        }
        return next;
      });

      // Build element payload for server
      const elType = img.type === 'image' ? 'image' : img.type === 'video' ? 'video' : img.type === 'text' ? 'text' : img.type === 'model3d' ? 'model3d' : 'image';
      const meta: any = {};
      if (elType === 'text') {
        if ((img as any).text) meta.text = (img as any).text;
      } else if (img.url) {
        meta.url = img.url;
      }

      // Append create op to persist element
      appendOp({
        type: 'create',
        elementId: newElementId,
        data: {
          element: {
            id: newElementId,
            type: elType,
            x: img.x || 0,
            y: img.y || 0,
            width: img.width || 400,
            height: img.height || 400,
            meta,
          },
        },
        inverse: { type: 'delete', elementId: newElementId, data: {}, requestId: '', clientTs: 0 } as any,
      } as any).catch((err) => {
        console.error('Failed to persist new node', err);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, projectId, opManagerInitialized]);

  // Keep realtimeActiveRef in sync with state
  useEffect(() => {
    realtimeActiveRef.current = realtimeActive;
  }, [realtimeActive]);

  // Setup realtime connection for generator overlays
  useEffect(() => {
    if (!projectId) {
      // disconnect if exists
      try { realtimeRef.current?.disconnect(); } catch { }
      setRealtimeActive(false);
      return;
    }

    if (!realtimeRef.current) {
      realtimeRef.current = new RealtimeClient();
    }

    const client = realtimeRef.current;
    const handleEvent = (evt: any) => {
      if (evt.type === 'connected') {
        console.log('[Realtime] connected');
        setRealtimeActive(true);
      } else if (evt.type === 'disconnected') {
        console.log('[Realtime] disconnected');
        setRealtimeActive(false);
      } else if (evt.type === 'init') {
        console.log('[Realtime] init overlays:', Array.isArray(evt.overlays) ? evt.overlays.length : 0);
        const overlays = (evt.overlays || []) as GeneratorOverlay[];
        const media = Array.isArray((evt as any).media) ? (evt as any).media as Array<any> : [];
        const imgs = overlays
          .filter(o => o.type === 'image')
          .map(o => ({ id: o.id, x: o.x, y: o.y, generatedImageUrl: o.generatedImageUrl || null, frameWidth: (o as any).frameWidth, frameHeight: (o as any).frameHeight, model: (o as any).model, frame: (o as any).frame, aspectRatio: (o as any).aspectRatio, prompt: (o as any).prompt }));
        const vids = overlays
          .filter(o => o.type === 'video')
          .map(o => ({ id: o.id, x: o.x, y: o.y, generatedVideoUrl: o.generatedVideoUrl || null, frameWidth: (o as any).frameWidth, frameHeight: (o as any).frameHeight, model: (o as any).model, frame: (o as any).frame, aspectRatio: (o as any).aspectRatio, prompt: (o as any).prompt }));
        const mus = overlays
          .filter(o => o.type === 'music')
          .map(o => ({ id: o.id, x: o.x, y: o.y, generatedMusicUrl: o.generatedMusicUrl || null, frameWidth: (o as any).frameWidth, frameHeight: (o as any).frameHeight, model: (o as any).model, frame: (o as any).frame, aspectRatio: (o as any).aspectRatio, prompt: (o as any).prompt }));
        setImageGenerators(imgs);
        setVideoGenerators(vids);
        setMusicGenerators(mus);
        // If server sends media state, hydrate uploaded media too
        if (media.length) {
          const uploaded = media
            .filter(m => m && m.kind)
            .map((m) => {
              const mapped: ImageUpload = {
                type: m.kind === 'image' ? 'image' : m.kind === 'video' ? 'video' : m.kind === 'text' ? 'text' : m.kind === 'model3d' ? 'model3d' : 'image',
                url: m.url,
                x: m.x || 0,
                y: m.y || 0,
                width: m.width || 400,
                height: m.height || 400,
                elementId: m.id,
              };
              return mapped;
            });
          setImages(uploaded);
        }
      } else if (evt.type === 'generator.create') {
        console.log('[Realtime] create', evt.overlay?.id, evt.overlay?.type);
        const o = evt.overlay as GeneratorOverlay;
        if (o.type === 'image') {
          setImageGenerators(prev => prev.some(m => m.id === o.id) ? prev : [...prev, { id: o.id, x: o.x, y: o.y, generatedImageUrl: o.generatedImageUrl || null, frameWidth: (o as any).frameWidth, frameHeight: (o as any).frameHeight, model: (o as any).model, frame: (o as any).frame, aspectRatio: (o as any).aspectRatio, prompt: (o as any).prompt }]);
        } else if (o.type === 'video') {
          setVideoGenerators(prev => prev.some(m => m.id === o.id) ? prev : [...prev, { id: o.id, x: o.x, y: o.y, generatedVideoUrl: o.generatedVideoUrl || null, frameWidth: (o as any).frameWidth, frameHeight: (o as any).frameHeight, model: (o as any).model, frame: (o as any).frame, aspectRatio: (o as any).aspectRatio, prompt: (o as any).prompt }]);
        } else if (o.type === 'music') {
          setMusicGenerators(prev => prev.some(m => m.id === o.id) ? prev : [...prev, { id: o.id, x: o.x, y: o.y, generatedMusicUrl: o.generatedMusicUrl || null, frameWidth: (o as any).frameWidth, frameHeight: (o as any).frameHeight, model: (o as any).model, frame: (o as any).frame, aspectRatio: (o as any).aspectRatio, prompt: (o as any).prompt }]);
        } else if (o.type === 'text') {
          setTextGenerators(prev => prev.some(t => t.id === o.id) ? prev : [...prev, { id: o.id, x: o.x, y: o.y, value: (o as any).value }]);
        }
      } else if (evt.type === 'generator.update') {
        console.log('[Realtime] update', evt.id, Object.keys(evt.updates || {}));
        setImageGenerators(prev => prev.map(m => m.id === evt.id ? { ...m, ...evt.updates } : m));
        setVideoGenerators(prev => prev.map(m => m.id === evt.id ? { ...m, ...evt.updates } : m));
        setMusicGenerators(prev => prev.map(m => m.id === evt.id ? { ...m, ...evt.updates } : m));
        setTextGenerators(prev => prev.map(t => t.id === evt.id ? { ...t, ...evt.updates } : t));
      } else if (evt.type === 'generator.delete') {
        console.log('[Realtime] delete', evt.id);
        setImageGenerators(prev => prev.filter(m => m.id !== evt.id));
        setVideoGenerators(prev => prev.filter(m => m.id !== evt.id));
        setMusicGenerators(prev => prev.filter(m => m.id !== evt.id));
        setTextGenerators(prev => prev.filter(t => t.id !== evt.id));
        // Remove any connectors referencing this overlay id
        setConnectors(prev => prev.filter(c => c.from !== evt.id && c.to !== evt.id));
      } else if (evt.type === 'media.create') {
        const m = (evt as any).media;
        if (!m?.id) return;
        console.log('[Realtime] media.create', m.id, m.kind);
        const newItem: ImageUpload = {
          type: m.kind === 'image' ? 'image' : m.kind === 'video' ? 'video' : m.kind === 'text' ? 'text' : m.kind === 'model3d' ? 'model3d' : 'image',
          url: m.url,
          x: m.x || 0,
          y: m.y || 0,
          width: m.width || 400,
          height: m.height || 400,
          elementId: m.id,
        };
        setImages(prev => prev.some(img => (img as any).elementId === m.id) ? prev : [...prev, newItem]);
      } else if (evt.type === 'media.update') {
        const id = (evt as any).id;
        const updates = (evt as any).updates || {};
        console.log('[Realtime] media.update <-', id, Object.keys(updates));
        if (!id) return;
        setImages(prev => prev.map(img => ((img as any).elementId === id) ? { ...img, ...updates } : img));
      } else if (evt.type === 'media.delete') {
        const id = (evt as any).id;
        console.log('[Realtime] media.delete <-', id);
        if (!id) return;
        setImages(prev => prev.filter(img => (img as any).elementId !== id));
        // Remove any connectors referencing this media element
        setConnectors(prev => prev.filter(c => c.from !== id && c.to !== id));
      }
    };

    client.on(handleEvent);
    client.connect(projectId);

    return () => {
      client.off(handleEvent);
      client.disconnect();
    };
  }, [projectId]);

  // Helper: build elements map snapshot from current state
  // buildSnapshotElements is now imported from utils

  // Persist full snapshot on every interaction (debounced)
  useEffect(() => {
    if (!projectId) return;
    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = window.setTimeout(async () => {
      try {
        const elements = buildSnapshotElements({
          images,
          imageGenerators,
          videoGenerators,
          musicGenerators,
          upscaleGenerators,
          removeBgGenerators,
          eraseGenerators,
          replaceGenerators,
          expandGenerators,
          vectorizeGenerators,
          storyboardGenerators,
          scriptFrameGenerators,
          sceneFrameGenerators,
          textGenerators,
          connectors,
          generationQueue,
        });
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
  }, [projectId, images, imageGenerators, videoGenerators, musicGenerators, textGenerators, upscaleGenerators, removeBgGenerators, eraseGenerators, replaceGenerators, expandGenerators, vectorizeGenerators, storyboardGenerators, scriptFrameGenerators, sceneFrameGenerators, connectors]);

  // Hydrate from current snapshot on project load
  useEffect(() => {
    const hydrate = async () => {
      if (!projectId) return;
      try {
        const { snapshot } = await apiGetCurrentSnapshot(projectId);
        if (snapshot && snapshot.elements) {
          const elements = snapshot.elements as Record<string, any>;
          const newImages: ImageUpload[] = [];
          const newImageGenerators: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; sourceImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }> = [];
          const newVideoGenerators: Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number; taskId?: string; generationId?: string; status?: string }> = [];
          const newMusicGenerators: Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }> = [];
          const newUpscaleGenerators: Array<{ id: string; x: number; y: number; upscaledImageUrl?: string | null; sourceImageUrl?: string | null; localUpscaledImageUrl?: string | null; model?: string; scale?: number }> = [];
          const newRemoveBgGenerators: Array<{ id: string; x: number; y: number; removedBgImageUrl?: string | null; sourceImageUrl?: string | null; localRemovedBgImageUrl?: string | null; model?: string; backgroundType?: string; scaleValue?: number; frameWidth?: number; frameHeight?: number; isRemovingBg?: boolean }> = [];
          const newEraseGenerators: Array<{ id: string; x: number; y: number; erasedImageUrl?: string | null; sourceImageUrl?: string | null; localErasedImageUrl?: string | null; model?: string; frameWidth?: number; frameHeight?: number; isErasing?: boolean }> = [];
          const newReplaceGenerators: Array<{ id: string; x: number; y: number; replacedImageUrl?: string | null; sourceImageUrl?: string | null; localReplacedImageUrl?: string | null; model?: string; frameWidth?: number; frameHeight?: number; isReplacing?: boolean }> = [];
          const newExpandGenerators: Array<{ id: string; x: number; y: number; expandedImageUrl?: string | null; sourceImageUrl?: string | null; localExpandedImageUrl?: string | null; model?: string; frameWidth?: number; frameHeight?: number; isExpanding?: boolean }> = [];
          const newVectorizeGenerators: Array<{ id: string; x: number; y: number; vectorizedImageUrl?: string | null; sourceImageUrl?: string | null; localVectorizedImageUrl?: string | null; mode?: string; frameWidth?: number; frameHeight?: number; isVectorizing?: boolean }> = [];
          const newStoryboardGenerators: Array<{ id: string; x: number; y: number; frameWidth?: number; frameHeight?: number; scriptText?: string | null }> = [];
          const newScriptFrameGenerators: ScriptFrameGenerator[] = [];
          const newSceneFrameGenerators: SceneFrameGenerator[] = [];
          const newTextGenerators: Array<{ id: string; x: number; y: number; value?: string }> = [];
          const newConnectors: Array<{ id: string; from: string; to: string; color: string; fromX?: number; fromY?: number; toX?: number; toY?: number; fromAnchor?: string; toAnchor?: string }> = [];
          // Track connector signatures to prevent duplicates: "from|to|toAnchor"
          const connectorSignatures = new Set<string>();

          // FIRST PASS: Process connector elements first (they are the source of truth)
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

          // SECOND PASS: Process all other elements (skip restoring from meta.connections to prevent duplicates)
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
                newRemoveBgGenerators.push({
                  id: element.id,
                  x: element.x || 0,
                  y: element.y || 0,
                  removedBgImageUrl: element.meta?.removedBgImageUrl || null,
                  sourceImageUrl: element.meta?.sourceImageUrl || null,
                  localRemovedBgImageUrl: element.meta?.localRemovedBgImageUrl || null,
                  model: element.meta?.model || '851-labs/background-remover',
                  backgroundType: element.meta?.backgroundType || 'rgba (transparent)',
                  scaleValue: element.meta?.scaleValue || 0.5,
                  frameWidth: element.meta?.frameWidth || 400,
                  frameHeight: element.meta?.frameHeight || 500,
                  isRemovingBg: element.meta?.isRemovingBg || false,
                });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'erase-plugin') {
                newEraseGenerators.push({
                  id: element.id,
                  x: element.x || 0,
                  y: element.y || 0,
                  erasedImageUrl: element.meta?.erasedImageUrl || null,
                  sourceImageUrl: element.meta?.sourceImageUrl || null,
                  localErasedImageUrl: element.meta?.localErasedImageUrl || null,
                  model: element.meta?.model || 'bria/eraser',
                  frameWidth: element.meta?.frameWidth || 400,
                  frameHeight: element.meta?.frameHeight || 500,
                  isErasing: element.meta?.isErasing || false,
                });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'replace-plugin') {
                newReplaceGenerators.push({
                  id: element.id,
                  x: element.x || 0,
                  y: element.y || 0,
                  replacedImageUrl: element.meta?.replacedImageUrl || null,
                  sourceImageUrl: element.meta?.sourceImageUrl || null,
                  localReplacedImageUrl: element.meta?.localReplacedImageUrl || null,
                  model: element.meta?.model || 'bria/eraser',
                  frameWidth: element.meta?.frameWidth || 400,
                  frameHeight: element.meta?.frameHeight || 500,
                  isReplacing: element.meta?.isReplacing || false,
                });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'expand-plugin') {
                newExpandGenerators.push({
                  id: element.id,
                  x: element.x || 0,
                  y: element.y || 0,
                  expandedImageUrl: element.meta?.expandedImageUrl || null,
                  sourceImageUrl: element.meta?.sourceImageUrl || null,
                  localExpandedImageUrl: element.meta?.localExpandedImageUrl || null,
                  model: element.meta?.model || 'expand/base',
                  frameWidth: element.meta?.frameWidth || 400,
                  frameHeight: element.meta?.frameHeight || 500,
                  isExpanding: element.meta?.isExpanding || false,
                });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'vectorize-plugin') {
                newVectorizeGenerators.push({
                  id: element.id,
                  x: element.x || 0,
                  y: element.y || 0,
                  vectorizedImageUrl: element.meta?.vectorizedImageUrl || null,
                  sourceImageUrl: element.meta?.sourceImageUrl || null,
                  localVectorizedImageUrl: element.meta?.localVectorizedImageUrl || null,
                  mode: element.meta?.mode || 'simple',
                  frameWidth: element.meta?.frameWidth || 400,
                  frameHeight: element.meta?.frameHeight || 500,
                  isVectorizing: element.meta?.isVectorizing || false,
                });
                // Skip restoring connections from element.meta.connections
                // Top-level connector elements are the source of truth and are already processed in the first pass.
                // Restoring from meta.connections would create duplicates.
              } else if (element.type === 'storyboard-plugin') {
                newStoryboardGenerators.push({
                  id: element.id,
                  x: element.x || 0,
                  y: element.y || 0,
                  characterNamesMap: element.meta?.characterNamesMap || {},
                  propsNamesMap: element.meta?.propsNamesMap || {},
                  backgroundNamesMap: element.meta?.backgroundNamesMap || {},
                  namedImages: element.meta?.namedImages || undefined,
                  frameWidth: element.meta?.frameWidth,
                  frameHeight: element.meta?.frameHeight,
                  scriptText: element.meta?.scriptText,
                } as any); // Type assertion needed due to optional fields
                // NOTE: Storyboard connections are NOT stored in storyboard.meta.connections
                // They are stored in the image elements' meta.connections (as outgoing connections)
                // OR as top-level connector elements. We'll restore them from connector elements below.
                // Do NOT restore connections from storyboard.meta.connections as that would create duplicates.
              } else if (element.type === 'script-frame') {
                newScriptFrameGenerators.push({
                  id: element.id,
                  pluginId: element.meta?.pluginId || '',
                  x: element.x || 0,
                  y: element.y || 0,
                  frameWidth: element.meta?.frameWidth || 300,
                  frameHeight: element.meta?.frameHeight || 200,
                  text: element.meta?.text || '',
                });
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
                  frameWidth: element.meta?.frameWidth || 300,
                  frameHeight: element.meta?.frameHeight || 200,
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
          setImages(newImages);
          setImageGenerators(newImageGenerators);
          setVideoGenerators(newVideoGenerators);
          setMusicGenerators(newMusicGenerators);
          setUpscaleGenerators(newUpscaleGenerators);
          setRemoveBgGenerators(newRemoveBgGenerators);
          setEraseGenerators(newEraseGenerators);
          setReplaceGenerators(newReplaceGenerators);
          setExpandGenerators(newExpandGenerators);
          setVectorizeGenerators(newVectorizeGenerators);
          setStoryboardGenerators(newStoryboardGenerators);
          setScriptFrameGenerators(newScriptFrameGenerators);
          setSceneFrameGenerators(newSceneFrameGenerators);
          setTextGenerators(newTextGenerators);
          setConnectors(newConnectors);

        }
      } catch (e) {
        console.warn('No current snapshot to hydrate or failed to fetch', e);
      }
    };
    hydrate();
  }, [projectId]);

  // Undo/Redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as any).isContentEditable === true
      );
      if (isTyping) return; // let native undo/redo work inside inputs

      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        console.log('[Ops] keydown undo', { canUndo });
        if (canUndo) {
          undo();
        }
      }
      // Ctrl/Cmd + Shift + Z or Ctrl+Y for redo
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
        (e.ctrlKey && e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        console.log('[Ops] keydown redo', { canRedo });
        if (canRedo) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
  }, [canUndo, canRedo, undo, redo]);

  // Create state and setters objects for handlers (after all dependencies are defined, including processMediaFile)
  // Note: handlers are created here but processMediaFile is defined later - we'll use a wrapper
  const canvasState: CanvasAppState = {
    images,
    imageGenerators,
    videoGenerators,
    musicGenerators,
    upscaleGenerators,
    removeBgGenerators,
    eraseGenerators,
    replaceGenerators,
    expandGenerators,
    vectorizeGenerators,
    storyboardGenerators,
    scriptFrameGenerators,
    sceneFrameGenerators,
    textGenerators,
    connectors,
    generationQueue,
  };

  const canvasSetters: CanvasAppSetters = {
    setImages,
    setImageGenerators,
    setVideoGenerators,
    setMusicGenerators,
    setUpscaleGenerators,
    setRemoveBgGenerators,
    setEraseGenerators,
    setReplaceGenerators,
    setExpandGenerators,
    setVectorizeGenerators,
    setStoryboardGenerators,
    setScriptFrameGenerators,
    setSceneFrameGenerators,
    setTextGenerators,
    setConnectors,
    setGenerationQueue,
  };

  // Create handlers using factory functions
  // Handlers will be created after processMediaFile is defined
  // For now, declare them as let so they can be assigned later
  let imageHandlers: ReturnType<typeof createImageHandlers>;
  let pluginHandlers: ReturnType<typeof createPluginHandlers>;

  // Handler assignments will be done after handlers are created (after processMediaFile)

  const handleMultipleFilesUpload = (files: File[]) => {
    // Find the main GLTF file
    const gltfFile = files.find(f => f.name.toLowerCase().endsWith('.gltf'));
    if (!gltfFile) {
      // If no GLTF file, process files individually
      files.forEach((file, index) => {
        processMediaFile(file, images.length + index);
      });
      return;
    }

    // Create a map of related files (bin, textures, etc.)
    const relatedFiles = new Map<string, { file: File; url: string }>();
    files.forEach(file => {
      if (file !== gltfFile) {
        const fileName = file.name;
        const url = URL.createObjectURL(file);
        const fileInfo = { file, url };

        // Store with multiple keys for flexible lookup
        // 1. Full filename
        relatedFiles.set(fileName, fileInfo);

        // 2. Just the filename (without path)
        const pathParts = fileName.split(/[/\\]/);
        const justFileName = pathParts[pathParts.length - 1];
        if (justFileName !== fileName) {
          relatedFiles.set(justFileName, fileInfo);
        }

        // 3. Filename with common texture paths
        // GLTF files often reference textures like "textures/image.png"
        const normalizedPath = fileName.replace(/\\/g, '/');
        relatedFiles.set(normalizedPath, fileInfo);

        // 4. Just the base name (without extension) for partial matching
        const baseName = justFileName.split('.').slice(0, -1).join('.');
        if (baseName) {
          relatedFiles.set(baseName, fileInfo);
        }
      }
    });

    // Process the GLTF file with related files
    const url = URL.createObjectURL(gltfFile);
    const center = viewportCenterRef.current;
    const offsetX = (images.length % 3) * 50;
    const offsetY = Math.floor(images.length / 3) * 50;
    const modelX = center.x - 400 / 2 + offsetX;
    const modelY = center.y - 400 / 2 + offsetY;

    const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newImage: ImageUpload = {
      file: gltfFile,
      url,
      type: 'model3d',
      x: modelX,
      y: modelY,
      width: 400,
      height: 400,
      rotationX: 0,
      rotationY: 0,
      zoom: 1,
      elementId,
      relatedFiles,
    };

    setImages((prev) => {
      const updated = [...prev, newImage];
      // Send create op to server
      if (projectId && opManagerInitialized) {
        appendOp({
          type: 'create',
          elementId,
          data: {
            element: {
              id: elementId,
              type: 'model3d',
              x: newImage.x,
              y: newImage.y,
              width: newImage.width,
              height: newImage.height,
              meta: {
                url: newImage.url,
              },
            },
          },
          inverse: { type: 'delete', elementId, data: {}, requestId: '', clientTs: 0 } as any,
        }).catch(console.error);
      }
      return updated;
    });
  };

  const processMediaFile = async (file: File, offsetIndex: number = 0) => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    // Convert File to data URI for uploading to Zata
    const convertFileToDataUri = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    // Upload to Zata first (for images and videos only)
    let zataUrl: string | null = null;
    const isImage = fileType.startsWith('image/');
    const isVideoFile = fileType.startsWith('video/') ||
      ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp']
        .some(ext => fileName.endsWith(ext));

    if ((isImage || isVideoFile) && projectId) {
      try {
        const dataUri = await convertFileToDataUri(file);
        const { saveUploadedMedia } = await import('../lib/api');
        const result = await saveUploadedMedia(dataUri, isImage ? 'image' : 'video', projectId);
        if (result.success && result.url) {
          zataUrl = result.url;
          // Trigger library refresh after successful upload
          // Use a delay to ensure the backend has processed and saved the entry
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('library-refresh'));
          }, 1500);
        } else {
          console.warn('[processMediaFile] Failed to upload to Zata, using blob URL:', result.error);
        }
      } catch (err) {
        console.warn('[processMediaFile] Error uploading to Zata, using blob URL:', err);
      }
    }

    // Use Zata URL if available, otherwise fall back to blob URL
    const url = zataUrl || URL.createObjectURL(file);

    // Check for 3D model files
    const isModel3D = ['.obj', '.gltf', '.glb', '.fbx', '.mb', '.ma']
      .some(ext => fileName.endsWith(ext));

    // Check for video files (reuse isVideoFile)
    const isVideo = isVideoFile;

    if (isModel3D) {
      // Get current viewport center
      const center = viewportCenterRef.current;

      // Place 3D model at the center of current viewport with slight offset
      const offsetX = (offsetIndex % 3) * 50;
      const offsetY = Math.floor(offsetIndex / 3) * 50;
      const modelX = center.x - 400 / 2 + offsetX; // Default width 400
      const modelY = center.y - 400 / 2 + offsetY; // Default height 400

      const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newImage: ImageUpload = {
        file,
        url,
        type: 'model3d',
        x: modelX,
        y: modelY,
        width: 400,
        height: 400,
        rotationX: 0,
        rotationY: 0,
        zoom: 1,
        elementId,
      };
      setImages((prev) => [...prev, newImage]);
      if (realtimeActive) {
        console.log('[Realtime] media.create model3d', elementId);
        realtimeRef.current?.sendMediaCreate({ id: elementId, kind: 'model3d', x: newImage.x || 0, y: newImage.y || 0, width: newImage.width, height: newImage.height, url: newImage.url });
      }
      if (projectId && opManagerInitialized) {
        appendOp({
          type: 'create',
          elementId,
          data: {
            element: {
              id: elementId,
              type: 'model3d',
              x: newImage.x,
              y: newImage.y,
              width: newImage.width,
              height: newImage.height,
              meta: { url: newImage.url },
            },
          },
          inverse: { type: 'delete', elementId, data: {}, requestId: '', clientTs: 0 } as any,
        }).catch(console.error);
      }
    } else if (isVideo) {
      // For videos, create a VideoUploadModal frame instead of directly adding to canvas
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        // Get current viewport center
        const center = viewportCenterRef.current;

        // Keep original video dimensions - no scaling
        const naturalWidth = video.videoWidth;
        const naturalHeight = video.videoHeight;

        // Calculate frame dimensions (similar to VideoUploadModal)
        const maxFrameWidth = 600;
        const aspectRatio = naturalWidth / naturalHeight;
        let frameWidth = maxFrameWidth;
        let frameHeight = Math.max(400, Math.round(maxFrameWidth / aspectRatio));

        // If video is taller, adjust frame height
        if (naturalHeight > naturalWidth) {
          frameHeight = Math.max(400, Math.round(maxFrameWidth * aspectRatio));
        }

        // Place modal at the center of current viewport with slight offset for multiple files
        const offsetX = (offsetIndex % 3) * 50; // Stagger horizontally
        const offsetY = Math.floor(offsetIndex / 3) * 50; // Stagger vertically
        const modalX = center.x - frameWidth / 2 + offsetX;
        const modalY = center.y - frameHeight / 2 + offsetY;

        // Create video modal with uploaded video
        const modalId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newModal = {
          id: modalId,
          x: modalX,
          y: modalY,
          generatedVideoUrl: url, // Set the uploaded video URL
          frameWidth,
          frameHeight,
          model: 'Uploaded Video', // Mark as uploaded
          frame: 'Frame',
          aspectRatio: `${Math.round(aspectRatio * 10) / 10}:1`, // Approximate aspect ratio
          prompt: '', // No prompt for uploaded videos
          duration: 5, // Default duration
          resolution: '720p', // Default resolution
        };

        // Add to video generators (modals)
        setVideoGenerators((prev) => {
          const updated = [...prev, newModal];
          return updated;
        });

        // File already uploaded to Zata and saved to history above
      };
    } else {
      // For images, create an ImageUploadModal frame instead of directly adding to canvas
      const img = new Image();

      img.onload = () => {
        // Get current viewport center
        const center = viewportCenterRef.current;

        // Keep original image dimensions - no scaling (use naturalWidth/naturalHeight for actual dimensions)
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

        // Calculate frame dimensions (similar to ImageUploadModal)
        // Use a reasonable frame size, maintaining aspect ratio
        const maxFrameWidth = 600;
        const aspectRatio = naturalWidth / naturalHeight;
        let frameWidth = maxFrameWidth;
        let frameHeight = Math.max(400, Math.round(maxFrameWidth / aspectRatio));

        // If image is taller, adjust frame height
        if (naturalHeight > naturalWidth) {
          frameHeight = Math.max(400, Math.round(maxFrameWidth * aspectRatio));
        }

        // Place modal at the center of current viewport with slight offset for multiple images
        const offsetX = (offsetIndex % 3) * 50; // Stagger horizontally
        const offsetY = Math.floor(offsetIndex / 3) * 50; // Stagger vertically
        const modalX = center.x - frameWidth / 2 + offsetX;
        const modalY = center.y - frameHeight / 2 + offsetY;

        // Create image modal with uploaded image
        const modalId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newModal = {
          id: modalId,
          x: modalX,
          y: modalY,
          generatedImageUrl: url, // Set the uploaded image URL
          frameWidth,
          frameHeight,
          model: 'Uploaded Image', // Optional: mark as uploaded
          frame: 'Frame',
          aspectRatio: `${Math.round(aspectRatio * 10) / 10}:1`, // Approximate aspect ratio
          prompt: '', // No prompt for uploaded images
        };

        // Add to image generators (modals) - this will be persisted via the Canvas component's onPersistImageModalCreate
        setImageGenerators((prev) => {
          const updated = [...prev, newModal];
          return updated;
        });

        // File already uploaded to Zata and saved to history above
      };

      img.src = url;
    }
  };

  // Now that processMediaFile is defined, create the actual handlers
  imageHandlers = createImageHandlers(
    canvasState,
    canvasSetters,
    projectId,
    opManagerInitialized,
    appendOp,
    realtimeActive,
    realtimeRef,
    viewportCenterRef,
    processMediaFile
  );

  pluginHandlers = createPluginHandlers(
    canvasState,
    canvasSetters,
    projectId,
    opManagerInitialized,
    appendOp,
    realtimeActive,
    realtimeRef,
    removeAndPersistConnectorsForElement
  );

  // Now assign all handler functions (after handlers are created)
  const handleImageUpdate = imageHandlers.handleImageUpdate;
  const handleImageDelete = imageHandlers.handleImageDelete;
  const handleImageDownload = imageHandlers.handleImageDownload;
  const handleImageDuplicate = imageHandlers.handleImageDuplicate;
  const handleImageUpload = imageHandlers.handleImageUpload;
  const handleImagesDrop = imageHandlers.handleImagesDrop;
  const handleImageSelect = imageHandlers.handleImageSelect;
  const handleImageGenerate = imageHandlers.handleImageGenerate;
  const handleTextCreate = imageHandlers.handleTextCreate;
  const handleAddImageToCanvas = imageHandlers.handleAddImageToCanvas;

  const [selectedTool, setSelectedTool] = useState<'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | 'library' | 'plugin'>('cursor');
  const [toolClickCounter, setToolClickCounter] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isPluginSidebarOpen, setIsPluginSidebarOpen] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);

  const handleToolSelect = (tool: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | 'library' | 'plugin') => {
    // Always update to trigger effect, even if tool is the same
    // Use counter to force re-render when clicking same tool again
    if (tool === selectedTool) {
      setToolClickCounter(prev => prev + 1);
    }
    setSelectedTool(tool);
    console.log('Selected tool:', tool);

    // Open image modal when image tool is selected
    if (tool === 'image') {
      setIsImageModalOpen(true);
    }

    // Open video modal when video tool is selected
    if (tool === 'video') {
      setIsVideoModalOpen(true);
    }

    // Open music modal when music tool is selected
    if (tool === 'music') {
      setIsMusicModalOpen(true);
    }

    // Open library sidebar when library tool is selected
    if (tool === 'library') {
      setIsLibraryOpen(true);
    }

    // Open plugin sidebar when plugin tool is selected
    if (tool === 'plugin') {
      setIsPluginSidebarOpen(true);
    }
  };


  const handleToolbarUpload = (files: File[]) => {
    // Check if any file is a GLTF file (which might need dependencies)
    const hasGLTF = files.some(f => f.name.toLowerCase().endsWith('.gltf'));

    if (hasGLTF && files.length > 1) {
      // Use multiple files handler for GLTF with dependencies
      handleMultipleFilesUpload(files);
    } else {
      // Process files individually
      files.forEach((file, index) => {
        processMediaFile(file, images.length + index);
      });
    }
  };

  const addMediaToCanvas = (media: MediaItem, x?: number, y?: number) => {
    const mediaUrl = media.url || media.thumbnail || '';

    // Determine media type
    let mediaType: 'image' | 'video' | 'text' = 'image';
    if (media.type === 'video' || mediaUrl.match(/\.(mp4|webm|mov)$/i)) {
      mediaType = 'video';
    } else if (media.type === 'music' || mediaUrl.match(/\.(mp3|wav|ogg)$/i)) {
      mediaType = 'video'; // Treat music as video for canvas display
    }

    // For images, create an ImageUploadModal frame instead of directly adding to canvas
    if (mediaType === 'image') {
      // Use proxy URL if needed (for Zata URLs) - buildProxyResourceUrl is already imported
      const imageUrl = (mediaUrl.includes('zata.ai') || mediaUrl.includes('zata'))
        ? buildProxyResourceUrl(mediaUrl)
        : mediaUrl;

      const img = new Image();
      img.crossOrigin = 'anonymous';

      const createModal = (width: number = 600, height: number = 400, aspectRatio: string = '1:1') => {
        const viewportCenter = viewportCenterRef.current;
        const modalX = x !== undefined ? x - width / 2 : viewportCenter.x - width / 2;
        const modalY = y !== undefined ? y - height / 2 : viewportCenter.y - height / 2;

        const modalId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newModal = {
          id: modalId,
          x: modalX,
          y: modalY,
          generatedImageUrl: mediaUrl, // Use original URL, ImageUploadModal will handle proxy if needed
          frameWidth: width,
          frameHeight: height,
          model: 'Library Image',
          frame: 'Frame',
          aspectRatio,
          prompt: '',
        };

        // Add to image generators (modals) - this will trigger persistence via Canvas component
        setImageGenerators((prev) => {
          // Check if modal already exists to avoid duplicates
          if (prev.some(m => m.id === modalId)) return prev;
          return [...prev, newModal];
        });

        console.log('[Library] Created image modal:', modalId, newModal);
      };

      img.onload = () => {
        // Get current viewport center or use provided coordinates
        const viewportCenter = viewportCenterRef.current;
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;

        // Calculate frame dimensions
        const maxFrameWidth = 600;
        const aspectRatio = naturalWidth / naturalHeight;
        let frameWidth = maxFrameWidth;
        let frameHeight = Math.max(400, Math.round(maxFrameWidth / aspectRatio));

        if (naturalHeight > naturalWidth) {
          frameHeight = Math.max(400, Math.round(maxFrameWidth * aspectRatio));
        }

        createModal(frameWidth, frameHeight, `${Math.round(aspectRatio * 10) / 10}:1`);
      };

      img.onerror = () => {
        // If image fails to load, still create the modal with the URL
        // The modal will handle displaying the image or error state
        console.warn('[Library] Failed to load image for modal creation, creating modal anyway:', mediaUrl);
        createModal(600, 400, '1:1');
      };

      // Try loading the image
      img.src = imageUrl;
    } else if (mediaType === 'video') {
      // For videos, create a VideoUploadModal frame instead of directly adding to canvas
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const viewportCenter = viewportCenterRef.current;
        const naturalWidth = video.videoWidth;
        const naturalHeight = video.videoHeight;

        // Calculate frame dimensions
        const maxFrameWidth = 600;
        const aspectRatio = naturalWidth / naturalHeight;
        let frameWidth = maxFrameWidth;
        let frameHeight = Math.max(400, Math.round(maxFrameWidth / aspectRatio));

        if (naturalHeight > naturalWidth) {
          frameHeight = Math.max(400, Math.round(maxFrameWidth * aspectRatio));
        }

        // Use provided coordinates or viewport center as fallback
        const modalX = x !== undefined ? x - frameWidth / 2 : viewportCenter.x - frameWidth / 2;
        const modalY = y !== undefined ? y - frameHeight / 2 : viewportCenter.y - frameHeight / 2;

        // Create video modal with library video
        const modalId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newModal = {
          id: modalId,
          x: modalX,
          y: modalY,
          generatedVideoUrl: mediaUrl,
          frameWidth,
          frameHeight,
          model: 'Library Video',
          frame: 'Frame',
          aspectRatio: `${Math.round(aspectRatio * 10) / 10}:1`,
          prompt: '',
          duration: 5,
          resolution: '720p',
        };

        // Add to video generators (modals)
        setVideoGenerators((prev) => [...prev, newModal]);
      };

      video.onerror = () => {
        // If video fails to load, still create the modal with the URL
        console.warn('[Library] Failed to load video for modal creation, creating modal anyway:', mediaUrl);
        const viewportCenter = viewportCenterRef.current;
        const modalX = x !== undefined ? x - 300 : viewportCenter.x - 300;
        const modalY = y !== undefined ? y - 200 : viewportCenter.y - 200;

        const modalId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newModal = {
          id: modalId,
          x: modalX,
          y: modalY,
          generatedVideoUrl: mediaUrl,
          frameWidth: 600,
          frameHeight: 400,
          model: 'Library Video',
          frame: 'Frame',
          aspectRatio: '16:9',
          prompt: '',
          duration: 5,
          resolution: '720p',
        };

        setVideoGenerators((prev) => [...prev, newModal]);
      };

      video.src = mediaUrl;
    } else {
      // For other media types (music, etc.), add directly to canvas (existing behavior)
      const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const viewportCenter = viewportCenterRef.current;
      const canvasX = x !== undefined ? x : viewportCenter.x - 200;
      const canvasY = y !== undefined ? y : viewportCenter.y - 200;

      const newMedia: ImageUpload = {
        type: mediaType,
        url: mediaUrl,
        x: canvasX,
        y: canvasY,
        width: 400,
        height: 400,
        elementId,
      };

      setImages((prev) => [...prev, newMedia]);

      // Persist to backend if project exists
      if (projectId && opManagerInitialized) {
        appendOp({
          type: 'create',
          elementId,
          data: {
            element: {
              id: elementId,
              type: mediaType,
              x: newMedia.x,
              y: newMedia.y,
              width: newMedia.width,
              height: newMedia.height,
              meta: {
                url: mediaUrl,
                mediaId: media.mediaId,
                storagePath: media.storagePath,
              },
            },
          },
          inverse: { type: 'delete', elementId, data: {}, requestId: '', clientTs: 0 } as any,
        }).catch(console.error);
      }
    }
  };

  const handleLibraryMediaSelect = (media: MediaItem) => {
    addMediaToCanvas(media);
    setIsLibraryOpen(false);
  };

  const handleLibraryMediaDrop = (media: MediaItem, x: number, y: number) => {
    addMediaToCanvas(media, x, y);
  };

  const handleProjectNameChange = async (name: string) => {
    setProjectName(name);
    localStorage.setItem('canvas-project-name', name);

    // Update project name in backend if we have a project ID
    if (projectId) {
      try {
        await updateProject(projectId, { name });
      } catch (error) {
        console.error('Failed to update project name:', error);
      }
    }
  };


  // handleImageSelect and handleImageGenerate are now assigned after handlers are created (above)

  const handleVideoSelect = (file: File) => {
    // Process the selected video file
    processMediaFile(file, images.length);
  };

  const handleVideoGenerate = async (prompt: string, model: string, frame: string, aspectRatio: string, duration: number, resolution?: string, modalId?: string, firstFrameUrl?: string, lastFrameUrl?: string): Promise<{ generationId?: string; taskId?: string; provider?: string } | null> => {
    if (!projectId || !prompt.trim()) {
      console.error('Missing projectId or prompt');
      return { generationId: undefined, taskId: undefined };
    }

    try {
      console.log('Generate video:', { prompt, model, frame, aspectRatio, duration, resolution, firstFrameUrl, lastFrameUrl });

      // Call video generation API
      const result = await generateVideoForCanvas(
        prompt,
        model,
        aspectRatio,
        projectId,
        duration,
        resolution || '1080p',
        firstFrameUrl,
        lastFrameUrl
      );

      console.log('Video generation started:', result);

      // Return provider info so frontend knows which service to poll
      return {
        generationId: result.generationId,
        taskId: result.taskId,
        provider: result.provider, // 'fal', 'replicate', 'minimax', or 'runway'
      };
    } catch (error: any) {
      console.error('Error generating video:', error);
      alert(error.message || 'Failed to generate video. Please try again.');
      return { generationId: undefined, taskId: undefined };
    }
  };

  const handleMusicSelect = (file: File) => {
    // Process the selected music file
    processMediaFile(file, images.length);
  };

  const handleMusicGenerate = async (prompt: string, model: string, frame: string, aspectRatio: string): Promise<string | null> => {
    console.log('Generate music:', { prompt, model, frame, aspectRatio });
    // TODO: Implement music generation API call here
    // For now, just close the modal
    // When music is generated, set the generatedMusicUrl
    // setGeneratedMusicUrl(generatedMusicUrl);
    return null;
  };

  if (isInitializing) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-screen h-screen overflow-hidden bg-gray-100">
      {showProjectSelector && (
        <ProjectSelector
          onProjectSelect={handleProjectSelect}
          currentProjectId={projectId}
        />
      )}
      <div className="w-full h-full relative">
        {projectId && (
          <Header
            projectName={projectName}
            onProjectNameChange={handleProjectNameChange}
            onSwitchProject={() => setShowProjectSelector(true)}
            onUndo={() => { console.log('[Ops] click undo', { canUndo }); if (canUndo) undo(); }}
            onRedo={() => { console.log('[Ops] click redo', { canRedo }); if (canRedo) redo(); }}
            canUndo={canUndo}
            canRedo={canRedo}
            isHidden={isUIHidden}
          />
        )}
        {projectId ? (
          <>
            <Canvas
              key={projectId}
              isUIHidden={isUIHidden}
              images={images}
              onViewportChange={handleViewportChange}
              onImageUpdate={handleImageUpdate}
              onImageDelete={handleImageDelete}
              onImageDownload={handleImageDownload}
              onImageDuplicate={handleImageDuplicate}
              onImagesDrop={handleImagesDrop}
              onLibraryMediaDrop={handleLibraryMediaDrop}
              selectedTool={selectedTool}
              onTextCreate={handleTextCreate}
              toolClickCounter={toolClickCounter}
              isImageModalOpen={isImageModalOpen}
              onImageModalClose={() => setIsImageModalOpen(false)}
              onImageSelect={handleImageSelect}
              onImageGenerate={handleImageGenerate}
              generatedImageUrl={generatedImageUrl}
              isVideoModalOpen={isVideoModalOpen}
              onVideoModalClose={() => setIsVideoModalOpen(false)}
              onVideoSelect={handleVideoSelect}
              onVideoGenerate={handleVideoGenerate}
              generatedVideoUrl={generatedVideoUrl}
              isMusicModalOpen={isMusicModalOpen}
              onMusicModalClose={() => setIsMusicModalOpen(false)}
              onMusicSelect={handleMusicSelect}
              onMusicGenerate={handleMusicGenerate}
              generatedMusicUrl={generatedMusicUrl}
              onAddImageToCanvas={imageHandlers.handleAddImageToCanvas}
              projectId={projectId}
              externalImageModals={imageGenerators}
              externalVideoModals={videoGenerators}
              externalMusicModals={musicGenerators}
              externalUpscaleModals={upscaleGenerators}
              externalRemoveBgModals={removeBgGenerators}
              externalEraseModals={eraseGenerators}
              externalReplaceModals={replaceGenerators}
              externalExpandModals={expandGenerators}
              externalVectorizeModals={vectorizeGenerators}
              externalStoryboardModals={storyboardGenerators}
              externalScriptFrameModals={scriptFrameGenerators}
              externalSceneFrameModals={sceneFrameGenerators}
              externalTextModals={textGenerators}
              connections={connectors}
              onConnectionsChange={(connections) => {
                setConnectors(connections.map((conn) => ({
                  id: conn.id ?? `${conn.from}-${conn.to}-${Date.now()}`,
                  from: conn.from,
                  to: conn.to,
                  color: conn.color,
                  fromX: conn.fromX,
                  fromY: conn.fromY,
                  toX: conn.toX,
                  toY: conn.toY,
                  fromAnchor: conn.fromAnchor,
                  toAnchor: conn.toAnchor,
                })));
              }}
              onPersistConnectorCreate={async (connector) => {
                // Ensure a stable id for connector
                const cid = connector.id || `connector-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
                const connToAdd = { id: cid, from: connector.from, to: connector.to, color: connector.color || '#437eb5', fromAnchor: connector.fromAnchor, toAnchor: connector.toAnchor };

                // Optimistic update
                setConnectors(prev => prev.some(c => c.id === cid) ? prev : [...prev, connToAdd]);

                // Persist as a top-level connector element via create op
                if (projectId && opManagerInitialized) {
                  try {
                    const elementPayload = {
                      id: cid,
                      type: 'connector',
                      from: connector.from,
                      to: connector.to,
                      meta: { color: connector.color || '#437eb5', fromAnchor: connector.fromAnchor, toAnchor: connector.toAnchor },
                    } as any;
                    const inverse = { type: 'delete', elementId: cid, data: {}, requestId: '', clientTs: 0 } as any;
                    console.log('[Connector] appending create op for connector', cid, elementPayload);
                    await appendOp({ type: 'create', elementId: cid, data: { element: elementPayload }, inverse } as any);
                    // Force-persist snapshot so connector element is immediately present in saved snapshot
                    try {
                      const elements = buildSnapshotElements({
                        images,
                        imageGenerators,
                        videoGenerators,
                        musicGenerators,
                        upscaleGenerators,
                        removeBgGenerators,
                        eraseGenerators,
                        replaceGenerators,
                        expandGenerators,
                        vectorizeGenerators,
                        storyboardGenerators,
                        scriptFrameGenerators,
                        sceneFrameGenerators,
                        textGenerators,
                        connectors: [...connectors, connToAdd],
                        generationQueue,
                      });
                      const ssRes = await apiSetCurrentSnapshot(projectId, { elements, metadata: { version: '1.0' } });
                      console.log('[Connector] apiSetCurrentSnapshot success', { projectId, ssRes });
                    } catch (e) {
                      console.warn('[Connector] Failed to persist snapshot after connector create', e);
                    }
                  } catch (e) {
                    console.error('Failed to persist connector create', e);
                  }
                }
              }}
              onPersistConnectorDelete={async (connectorId) => {
                // Find connector
                const conn = connectors.find(c => c.id === connectorId);
                if (!conn) return;
                // Optimistic remove
                setConnectors(prev => prev.filter(c => c.id !== connectorId));

                // Persist by deleting the top-level connector element
                if (projectId && opManagerInitialized) {
                  try {
                    const inverse = { type: 'create', elementId: connectorId, data: { element: { id: connectorId, type: 'connector', from: conn.from, to: conn.to, meta: { color: conn.color, fromAnchor: conn.fromAnchor, toAnchor: conn.toAnchor } } }, requestId: '', clientTs: 0 } as any;
                    console.log('[Connector] appending delete op for connector', connectorId);
                    await appendOp({ type: 'delete', elementId: connectorId, data: {}, inverse } as any);
                    // Force snapshot persist so connector deletion is immediately reflected
                    try {
                      const elements = buildSnapshotElements({
                        images,
                        imageGenerators,
                        videoGenerators,
                        musicGenerators,
                        upscaleGenerators,
                        removeBgGenerators,
                        eraseGenerators,
                        replaceGenerators,
                        expandGenerators,
                        vectorizeGenerators,
                        storyboardGenerators,
                        scriptFrameGenerators,
                        sceneFrameGenerators,
                        textGenerators,
                        connectors: connectors.filter(c => c.id !== connectorId),
                        generationQueue,
                      });
                      const ssRes = await apiSetCurrentSnapshot(projectId, { elements, metadata: { version: '1.0' } });
                      console.log('[Connector] apiSetCurrentSnapshot success after delete', { projectId, ssRes });
                    } catch (e) { console.warn('[Connector] Failed to persist snapshot after connector delete', e); }
                  } catch (e) {
                    console.error('Failed to persist connector delete', e);
                  }
                }
              }}
              onPersistImageModalCreate={async (modal) => {
                // Optimistic update
                setImageGenerators(prev => prev.some(m => m.id === modal.id) ? prev : [...prev, modal]);
                // Broadcast via realtime
                if (realtimeActive) {
                  console.log('[Realtime] broadcast create image', modal.id);
                  realtimeRef.current?.sendCreate({ id: modal.id, type: 'image', x: modal.x, y: modal.y, generatedImageUrl: modal.generatedImageUrl || null });
                }
                // Always append op for undo/redo and persistence
                if (projectId && opManagerInitialized) {
                  await appendOp({
                    type: 'create',
                    elementId: modal.id,
                    data: {
                      element: {
                        id: modal.id,
                        type: 'image-generator',
                        x: modal.x,
                        y: modal.y,
                        meta: {
                          generatedImageUrl: modal.generatedImageUrl || null,
                          sourceImageUrl: (modal as any).sourceImageUrl || null, // CRITICAL: Persist sourceImageUrl
                          prompt: (modal as any).prompt || null,
                          model: (modal as any).model || null,
                          frame: (modal as any).frame || null,
                          aspectRatio: (modal as any).aspectRatio || null,
                          frameWidth: (modal as any).frameWidth || null,
                          frameHeight: (modal as any).frameHeight || null,
                        }
                      },
                    },
                    inverse: { type: 'delete', elementId: modal.id, data: {}, requestId: '', clientTs: 0 } as any,
                  });
                }
              }}
              onPersistImageModalMove={async (id, updates) => {
                // Optimistic update
                setImageGenerators(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
                // Broadcast via realtime
                if (realtimeActive) {
                  console.log('[Realtime] broadcast update image', id, Object.keys(updates || {}));
                  realtimeRef.current?.sendUpdate(id, updates as any);
                }
                // Append op for undo/redo step
                if (projectId && opManagerInitialized) {
                  const prev = imageGenerators.find(m => m.id === id);
                  const inverseUpdates: any = {};
                  if (prev) {
                    for (const k of Object.keys(updates || {})) {
                      (inverseUpdates as any)[k] = (prev as any)[k];
                    }
                  }
                  await appendOp({ type: 'update', elementId: id, data: { updates }, inverse: { type: 'update', elementId: id, data: { updates: inverseUpdates }, requestId: '', clientTs: 0 } as any });
                }
              }}
              onPersistImageModalDelete={async (id) => {
                console.log('[page.tsx] onPersistImageModalDelete called', id);
                const prevItem = imageGenerators.find(m => m.id === id);
                // Update state IMMEDIATELY and SYNCHRONOUSLY - don't wait for async operations
                setImageGenerators(prev => {
                  const filtered = prev.filter(m => m.id !== id);
                  console.log('[page.tsx] imageGenerators updated, remaining:', filtered.length);
                  return filtered;
                });
                // Then do async operations
                if (realtimeActive) {
                  console.log('[Realtime] broadcast delete image', id);
                  realtimeRef.current?.sendDelete(id);
                }
                // Also remove any connectors that referenced this element
                try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }
                // Always append op for undo/redo and persistence
                if (projectId && opManagerInitialized) {
                  await appendOp({ type: 'delete', elementId: id, data: {}, inverse: prevItem ? { type: 'create', elementId: id, data: { element: { id, type: 'image-generator', x: prevItem.x, y: prevItem.y, meta: { generatedImageUrl: (prevItem as any).generatedImageUrl || null } } }, requestId: '', clientTs: 0 } as any : undefined as any });
                }
              }}
              onPersistVideoModalCreate={async (modal) => {
                setVideoGenerators(prev => prev.some(m => m.id === modal.id) ? prev : [...prev, modal]);
                if (realtimeActive) {
                  console.log('[Realtime] broadcast create video', modal.id);
                  realtimeRef.current?.sendCreate({ id: modal.id, type: 'video', x: modal.x, y: modal.y, generatedVideoUrl: modal.generatedVideoUrl || null });
                }
                if (projectId && opManagerInitialized) {
                  await appendOp({ type: 'create', elementId: modal.id, data: { element: { id: modal.id, type: 'video-generator', x: modal.x, y: modal.y, meta: { generatedVideoUrl: modal.generatedVideoUrl || null } } }, inverse: { type: 'delete', elementId: modal.id, data: {}, requestId: '', clientTs: 0 } as any });
                }
              }}
              onPersistVideoModalMove={async (id, updates) => {
                setVideoGenerators(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
                if (realtimeActive) {
                  console.log('[Realtime] broadcast update video', id, Object.keys(updates || {}));
                  realtimeRef.current?.sendUpdate(id, updates as any);
                }
                if (projectId && opManagerInitialized) {
                  const prev = videoGenerators.find(m => m.id === id);
                  const inverseUpdates: any = {};
                  if (prev) {
                    for (const k of Object.keys(updates || {})) {
                      (inverseUpdates as any)[k] = (prev as any)[k];
                    }
                  }
                  await appendOp({ type: 'update', elementId: id, data: { updates }, inverse: { type: 'update', elementId: id, data: { updates: inverseUpdates }, requestId: '', clientTs: 0 } as any });
                }
              }}
              onPersistVideoModalDelete={async (id) => {
                console.log('[page.tsx] onPersistVideoModalDelete called', id);
                const prevItem = videoGenerators.find(m => m.id === id);
                // Update state IMMEDIATELY and SYNCHRONOUSLY - don't wait for async operations
                setVideoGenerators(prev => {
                  const filtered = prev.filter(m => m.id !== id);
                  console.log('[page.tsx] videoGenerators updated, remaining:', filtered.length);
                  return filtered;
                });
                // Then do async operations
                if (realtimeActive) {
                  console.log('[Realtime] broadcast delete video', id);
                  realtimeRef.current?.sendDelete(id);
                }
                // Also remove any connectors that referenced this element
                try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }
                if (projectId && opManagerInitialized) {
                  await appendOp({ type: 'delete', elementId: id, data: {}, inverse: prevItem ? { type: 'create', elementId: id, data: { element: { id, type: 'video-generator', x: prevItem.x, y: prevItem.y, meta: { generatedVideoUrl: (prevItem as any).generatedVideoUrl || null } } }, requestId: '', clientTs: 0 } as any : undefined as any });
                }
              }}
              onPersistMusicModalCreate={async (modal) => {
                setMusicGenerators(prev => prev.some(m => m.id === modal.id) ? prev : [...prev, modal]);
                if (realtimeActive) {
                  console.log('[Realtime] broadcast create music', modal.id);
                  realtimeRef.current?.sendCreate({ id: modal.id, type: 'music', x: modal.x, y: modal.y, generatedMusicUrl: modal.generatedMusicUrl || null });
                }
                if (projectId && opManagerInitialized) {
                  await appendOp({ type: 'create', elementId: modal.id, data: { element: { id: modal.id, type: 'music-generator', x: modal.x, y: modal.y, meta: { generatedMusicUrl: modal.generatedMusicUrl || null } } }, inverse: { type: 'delete', elementId: modal.id, data: {}, requestId: '', clientTs: 0 } as any });
                }
              }}
              onPersistMusicModalMove={async (id, updates) => {
                setMusicGenerators(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
                if (realtimeActive) {
                  console.log('[Realtime] broadcast update music', id, Object.keys(updates || {}));
                  realtimeRef.current?.sendUpdate(id, updates as any);
                }
                if (projectId && opManagerInitialized) {
                  const prev = musicGenerators.find(m => m.id === id);
                  const inverseUpdates: any = {};
                  if (prev) {
                    for (const k of Object.keys(updates || {})) {
                      (inverseUpdates as any)[k] = (prev as any)[k];
                    }
                  }
                  await appendOp({ type: 'update', elementId: id, data: { updates }, inverse: { type: 'update', elementId: id, data: { updates: inverseUpdates }, requestId: '', clientTs: 0 } as any });
                }
              }}
              onPersistMusicModalDelete={async (id) => {
                console.log('[page.tsx] onPersistMusicModalDelete called', id);
                const prevItem = musicGenerators.find(m => m.id === id);
                // Update state IMMEDIATELY and SYNCHRONOUSLY - don't wait for async operations
                setMusicGenerators(prev => {
                  const filtered = prev.filter(m => m.id !== id);
                  console.log('[page.tsx] musicGenerators updated, remaining:', filtered.length);
                  return filtered;
                });
                // Then do async operations
                if (realtimeActive) {
                  console.log('[Realtime] broadcast delete music', id);
                  realtimeRef.current?.sendDelete(id);
                }
                // Also remove any connectors that referenced this element
                try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }
                if (projectId && opManagerInitialized) {
                  await appendOp({ type: 'delete', elementId: id, data: {}, inverse: prevItem ? { type: 'create', elementId: id, data: { element: { id, type: 'music-generator', x: prevItem.x, y: prevItem.y, meta: { generatedMusicUrl: (prevItem as any).generatedMusicUrl || null } } }, requestId: '', clientTs: 0 } as any : undefined as any });
                }
              }}
              onPersistUpscaleModalCreate={pluginHandlers.onPersistUpscaleModalCreate}
              onPersistUpscaleModalMove={pluginHandlers.onPersistUpscaleModalMove}
              onPersistUpscaleModalDelete={pluginHandlers.onPersistUpscaleModalDelete}
              onUpscale={pluginHandlers.onUpscale}
              onPersistRemoveBgModalCreate={pluginHandlers.onPersistRemoveBgModalCreate}
              onPersistRemoveBgModalMove={pluginHandlers.onPersistRemoveBgModalMove}
              onPersistRemoveBgModalDelete={pluginHandlers.onPersistRemoveBgModalDelete}
              onRemoveBg={pluginHandlers.onRemoveBg}
              onPersistEraseModalCreate={pluginHandlers.onPersistEraseModalCreate}
              onPersistEraseModalMove={pluginHandlers.onPersistEraseModalMove}
              onPersistEraseModalDelete={pluginHandlers.onPersistEraseModalDelete}
              onErase={pluginHandlers.onErase}
              onPersistReplaceModalCreate={pluginHandlers.onPersistReplaceModalCreate}
              onPersistReplaceModalMove={pluginHandlers.onPersistReplaceModalMove}
              onPersistReplaceModalDelete={pluginHandlers.onPersistReplaceModalDelete}
              onReplace={pluginHandlers.onReplace}
              onPersistExpandModalCreate={pluginHandlers.onPersistExpandModalCreate}
              onPersistExpandModalMove={pluginHandlers.onPersistExpandModalMove}
              onPersistExpandModalDelete={pluginHandlers.onPersistExpandModalDelete}
              onExpand={pluginHandlers.onExpand}
              onPersistVectorizeModalCreate={pluginHandlers.onPersistVectorizeModalCreate}
              onPersistVectorizeModalMove={pluginHandlers.onPersistVectorizeModalMove}
              onPersistVectorizeModalDelete={pluginHandlers.onPersistVectorizeModalDelete}
              onVectorize={pluginHandlers.onVectorize}
              onPersistStoryboardModalCreate={pluginHandlers.onPersistStoryboardModalCreate}
              onPersistStoryboardModalMove={pluginHandlers.onPersistStoryboardModalMove}
              onPersistStoryboardModalDelete={pluginHandlers.onPersistStoryboardModalDelete}
              onPersistScriptFrameModalCreate={pluginHandlers.onPersistScriptFrameModalCreate}
              onPersistScriptFrameModalMove={pluginHandlers.onPersistScriptFrameModalMove}
              onPersistScriptFrameModalDelete={pluginHandlers.onPersistScriptFrameModalDelete}
              onPersistSceneFrameModalCreate={pluginHandlers.onPersistSceneFrameModalCreate}
              onPersistSceneFrameModalMove={pluginHandlers.onPersistSceneFrameModalMove}
              onPersistSceneFrameModalDelete={pluginHandlers.onPersistSceneFrameModalDelete}
              onPersistTextModalCreate={async (modal) => {
                setTextGenerators(prev => prev.some(t => t.id === modal.id) ? prev : [...prev, modal]);
                if (realtimeActive) {
                  console.log('[Realtime] broadcast create text', modal.id);
                  realtimeRef.current?.sendCreate({ id: modal.id, type: 'text', x: modal.x, y: modal.y, value: modal.value || '' });
                }
                if (projectId && opManagerInitialized) {
                  await appendOp({ type: 'create', elementId: modal.id, data: { element: { id: modal.id, type: 'text-generator', x: modal.x, y: modal.y, meta: { value: modal.value || '' } } }, inverse: { type: 'delete', elementId: modal.id, data: {}, requestId: '', clientTs: 0 } as any });
                }
              }}
              onPersistTextModalMove={async (id, updates) => {
                // Optimistic update with capture of previous state for correct inverse
                let capturedPrev: { id: string; x: number; y: number; value?: string } | undefined = undefined;
                setTextGenerators((prev) => {
                  const found = prev.find(t => t.id === id);
                  capturedPrev = found ? { ...found } : undefined;
                  return prev.map(t => t.id === id ? { ...t, ...updates } : t);
                });
                if (realtimeActive) {
                  console.log('[Realtime] broadcast update text', id, Object.keys(updates || {}));
                  realtimeRef.current?.sendUpdate(id, updates as any);
                }
                if (projectId && opManagerInitialized) {
                  const inverseUpdates: any = {};
                  if (capturedPrev) {
                    for (const k of Object.keys(updates || {})) {
                      (inverseUpdates as any)[k] = (capturedPrev as any)[k];
                    }
                  }
                  await appendOp({ type: 'update', elementId: id, data: { updates }, inverse: { type: 'update', elementId: id, data: { updates: inverseUpdates }, requestId: '', clientTs: 0 } as any });
                }
              }}
              onPersistTextModalDelete={async (id) => {
                console.log('[page.tsx] onPersistTextModalDelete called', id);
                const prevItem = textGenerators.find(t => t.id === id);
                // Update state IMMEDIATELY and SYNCHRONOUSLY - don't wait for async operations
                setTextGenerators(prev => {
                  const filtered = prev.filter(t => t.id !== id);
                  console.log('[page.tsx] textGenerators updated, remaining:', filtered.length);
                  return filtered;
                });
                // Then do async operations
                if (realtimeActive) {
                  console.log('[Realtime] broadcast delete text', id);
                  realtimeRef.current?.sendDelete(id);
                }
                // Also remove any connectors that referenced this element
                try { await removeAndPersistConnectorsForElement(id); } catch (e) { console.error(e); }
                // Always append op for undo/redo and persistence
                if (projectId && opManagerInitialized) {
                  await appendOp({ type: 'delete', elementId: id, data: {}, inverse: prevItem ? { type: 'create', elementId: id, data: { element: { id, type: 'text-generator', x: prevItem.x, y: prevItem.y, meta: { value: (prevItem as any).value || '' } } }, requestId: '', clientTs: 0 } as any : undefined as any });
                }
              }}
              onPluginSidebarOpen={() => setIsPluginSidebarOpen(true)}
            />
            <ToolbarPanel onToolSelect={handleToolSelect} onUpload={handleToolbarUpload} isHidden={isUIHidden} />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-600">Please select or create a project to continue</p>
          </div>
        )}
      </div>
      <GenerationQueue items={generationQueue} />
      <LibrarySidebar
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectMedia={handleLibraryMediaSelect}
        scale={1}
      />
      <PluginSidebar
        isOpen={isPluginSidebarOpen}
        onClose={() => setIsPluginSidebarOpen(false)}
        onSelectPlugin={(plugin, x, y) => {
          if (plugin.id === 'video-editor') {
            setIsVideoEditorOpen(true);
            return;
          }
          if (plugin.id === 'upscale') {
            const viewportCenter = viewportCenterRef.current;
            // If x/y are provided (from click), convert screen coordinates to canvas coordinates
            // Otherwise use viewport center
            let modalX: number;
            let modalY: number;

            if (x !== undefined && y !== undefined && x !== 0 && y !== 0) {
              // Convert screen coordinates to canvas coordinates
              // We need to get the canvas container position to do this properly
              // For now, use viewport center as fallback
              modalX = viewportCenter.x;
              modalY = viewportCenter.y;
            } else {
              // Use viewport center
              modalX = viewportCenter.x;
              modalY = viewportCenter.y;
            }

            const modalId = `upscale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newUpscale = {
              id: modalId,
              x: modalX,
              y: modalY,
              upscaledImageUrl: null,
              sourceImageUrl: null,
              localUpscaledImageUrl: null,
              model: 'Crystal Upscaler',
              scale: 2,
              frameWidth: 400,
              frameHeight: 500,
              isUpscaling: false,
            };
            console.log('[Plugin] Creating upscale modal at viewport center:', newUpscale, 'viewportCenter:', viewportCenter);
            // Persist via callback (this will trigger realtime + ops)
            // Use the same callback pattern as Canvas component
            (async () => {
              // Optimistic update
              setUpscaleGenerators(prev => {
                // Check if modal already exists to avoid duplicates
                if (prev.some(m => m.id === modalId)) {
                  console.log('[Plugin] Modal already exists, skipping');
                  return prev;
                }
                const updated = [...prev, newUpscale];
                console.log('[Plugin] Updated upscaleGenerators, count:', updated.length);
                return updated;
              });
              // Broadcast via realtime
              if (realtimeActive) {
                console.log('[Realtime] broadcast create upscale', modalId);
                realtimeRef.current?.sendCreate({
                  id: modalId,
                  type: 'upscale',
                  x: modalX,
                  y: modalY,
                  upscaledImageUrl: null,
                  sourceImageUrl: null,
                  localUpscaledImageUrl: null,
                  model: 'Crystal Upscaler',
                  scale: 2,
                  frameWidth: 400,
                  frameHeight: 500,
                  isUpscaling: false,
                });
              }
              // Always append op for undo/redo and persistence
              if (projectId && opManagerInitialized) {
                await appendOp({
                  type: 'create',
                  elementId: modalId,
                  data: {
                    element: {
                      id: modalId,
                      type: 'upscale-plugin',
                      x: modalX,
                      y: modalY,
                      meta: {
                        upscaledImageUrl: null,
                        sourceImageUrl: null,
                        localUpscaledImageUrl: null,
                        model: 'Crystal Upscaler',
                        scale: 2,
                        frameWidth: 400,
                        frameHeight: 500,
                        isUpscaling: false,
                      },
                    },
                  },
                  inverse: { type: 'delete', elementId: modalId, data: {}, requestId: '', clientTs: 0 } as any,
                });
              }
            })().catch(console.error);
          } else if (plugin.id === 'vectorize') {
            const viewportCenter = viewportCenterRef.current;
            let modalX: number;
            let modalY: number;

            if (x !== undefined && y !== undefined && x !== 0 && y !== 0) {
              modalX = viewportCenter.x;
              modalY = viewportCenter.y;
            } else {
              modalX = viewportCenter.x;
              modalY = viewportCenter.y;
            }

            const modalId = `vectorize-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newVectorize = {
              id: modalId,
              x: modalX,
              y: modalY,
              vectorizedImageUrl: null,
              sourceImageUrl: null,
              localVectorizedImageUrl: null,
              mode: 'Detailed',
              frameWidth: 400,
              frameHeight: 500,
              isVectorizing: false,
            };
            console.log('[Plugin] Creating vectorize modal at viewport center:', newVectorize, 'viewportCenter:', viewportCenter);
            // Persist via callback (this will trigger realtime + ops)
            (async () => {
              // Optimistic update
              setVectorizeGenerators(prev => {
                if (prev.some(m => m.id === modalId)) {
                  console.log('[Plugin] Vectorize modal already exists, skipping');
                  return prev;
                }
                const updated = [...prev, newVectorize];
                console.log('[Plugin] Updated vectorizeGenerators, count:', updated.length);
                return updated;
              });
              // Broadcast via realtime
              if (realtimeActive) {
                console.log('[Realtime] broadcast create vectorize', modalId);
                realtimeRef.current?.sendCreate({
                  id: modalId,
                  type: 'vectorize',
                  x: modalX,
                  y: modalY,
                  vectorizedImageUrl: null,
                  sourceImageUrl: null,
                  localVectorizedImageUrl: null,
                  mode: 'simple',
                  frameWidth: 400,
                  frameHeight: 500,
                  isVectorizing: false,
                });
              }
              // Always append op for undo/redo and persistence
              if (projectId && opManagerInitialized) {
                await appendOp({
                  type: 'create',
                  elementId: modalId,
                  data: {
                    element: {
                      id: modalId,
                      type: 'vectorize-plugin',
                      x: modalX,
                      y: modalY,
                      meta: {
                        vectorizedImageUrl: null,
                        sourceImageUrl: null,
                        localVectorizedImageUrl: null,
                        mode: 'simple',
                        frameWidth: 400,
                        frameHeight: 500,
                        isVectorizing: false,
                      },
                    },
                  },
                  inverse: { type: 'delete', elementId: modalId, data: {}, requestId: '', clientTs: 0 } as any,
                });
              }
            })().catch(console.error);
          } else if (plugin.id === 'storyboard') {
            const viewportCenter = viewportCenterRef.current;
            let modalX: number;
            let modalY: number;

            if (x !== undefined && y !== undefined && x !== 0 && y !== 0) {
              modalX = viewportCenter.x;
              modalY = viewportCenter.y;
            } else {
              modalX = viewportCenter.x;
              modalY = viewportCenter.y;
            }

            const modalId = `storyboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newStoryboard = {
              id: modalId,
              x: modalX,
              y: modalY,
              frameWidth: 400,
              frameHeight: 500,
              scriptText: null,
            };
            console.log('[Plugin] Creating storyboard modal at viewport center:', newStoryboard, 'viewportCenter:', viewportCenter);
            (async () => {
              // Optimistic update
              setStoryboardGenerators(prev => {
                if (prev.some(m => m.id === modalId)) {
                  console.log('[Plugin] Storyboard modal already exists, skipping');
                  return prev;
                }
                const updated = [...prev, newStoryboard];
                console.log('[Plugin] Updated storyboardGenerators, count:', updated.length);
                return updated;
              });
              // Broadcast via realtime
              if (realtimeActive) {
                console.log('[Realtime] broadcast create storyboard', modalId);
                realtimeRef.current?.sendCreate({
                  id: modalId,
                  type: 'storyboard',
                  x: modalX,
                  y: modalY,
                  frameWidth: 400,
                  frameHeight: 500,
                });
              }
              // Always append op for undo/redo and persistence
              if (projectId && opManagerInitialized) {
                await appendOp({
                  type: 'create',
                  elementId: modalId,
                  data: {
                    element: {
                      id: modalId,
                      type: 'storyboard-plugin',
                      x: modalX,
                      y: modalY,
                      meta: {
                        frameWidth: 400,
                        frameHeight: 500,
                        scriptText: null,
                      },
                    },
                  },
                  inverse: { type: 'delete', elementId: modalId, data: {}, requestId: '', clientTs: 0 } as any,
                });
              }
            })().catch(console.error);
          } else if (plugin.id === 'removebg') {
            const viewportCenter = viewportCenterRef.current;
            // If x/y are provided (from click), convert screen coordinates to canvas coordinates
            // Otherwise use viewport center
            let modalX: number;
            let modalY: number;

            if (x !== undefined && y !== undefined && x !== 0 && y !== 0) {
              // Convert screen coordinates to canvas coordinates
              // We need to get the canvas container position to do this properly
              // For now, use viewport center as fallback
              modalX = viewportCenter.x;
              modalY = viewportCenter.y;
            } else {
              // Use viewport center
              modalX = viewportCenter.x;
              modalY = viewportCenter.y;
            }

            const modalId = `removebg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newRemoveBg = {
              id: modalId,
              x: modalX,
              y: modalY,
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
            console.log('[Plugin] Creating removebg modal at viewport center:', newRemoveBg, 'viewportCenter:', viewportCenter);
            // Persist via callback (this will trigger realtime + ops)
            // Use the same callback pattern as Canvas component
            (async () => {
              // Optimistic update
              setRemoveBgGenerators(prev => {
                // Check if modal already exists to avoid duplicates
                if (prev.some(m => m.id === modalId)) {
                  console.log('[Plugin] Modal already exists, skipping');
                  return prev;
                }
                const updated = [...prev, newRemoveBg];
                console.log('[Plugin] Updated removeBgGenerators, count:', updated.length);
                return updated;
              });
              // Broadcast via realtime
              if (realtimeActive) {
                console.log('[Realtime] broadcast create removebg', modalId);
                realtimeRef.current?.sendCreate({
                  id: modalId,
                  type: 'removebg',
                  x: modalX,
                  y: modalY,
                  removedBgImageUrl: null,
                  sourceImageUrl: null,
                  localRemovedBgImageUrl: null,
                  model: '851-labs/background-remover',
                  backgroundType: 'rgba (transparent)',
                  scaleValue: 0.5,
                  frameWidth: 400,
                  frameHeight: 500,
                  isRemovingBg: false,
                });
              }
              // Always append op for undo/redo and persistence
              if (projectId && opManagerInitialized) {
                await appendOp({
                  type: 'create',
                  elementId: modalId,
                  data: {
                    element: {
                      id: modalId,
                      type: 'removebg-plugin',
                      x: modalX,
                      y: modalY,
                      meta: {
                        removedBgImageUrl: null,
                        sourceImageUrl: null,
                        localRemovedBgImageUrl: null,
                        model: '851-labs/background-remover',
                        backgroundType: 'rgba (transparent)',
                        scaleValue: 0.5,
                        frameWidth: 400,
                        frameHeight: 500,
                        isRemovingBg: false,
                      },
                    },
                  },
                  inverse: { type: 'delete', elementId: modalId, data: {}, requestId: '', clientTs: 0 } as any,
                });
              }
            })().catch(console.error);
          } else if (plugin.id === 'erase') {
            const viewportCenter = viewportCenterRef.current;
            // If x/y are provided (from click), convert screen coordinates to canvas coordinates
            // Otherwise use viewport center
            let modalX: number;
            let modalY: number;

            if (x !== undefined && y !== undefined && x !== 0 && y !== 0) {
              // Convert screen coordinates to canvas coordinates
              // We need to get the canvas container position to do this properly
              // For now, use viewport center as fallback
              modalX = viewportCenter.x;
              modalY = viewportCenter.y;
            } else {
              // Use viewport center
              modalX = viewportCenter.x;
              modalY = viewportCenter.y;
            }

            const modalId = `erase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newErase = {
              id: modalId,
              x: modalX,
              y: modalY,
              erasedImageUrl: null,
              sourceImageUrl: null,
              localErasedImageUrl: null,
              model: 'bria/eraser',
              frameWidth: 400,
              frameHeight: 500,
              isErasing: false,
            };
            console.log('[Plugin] Creating erase modal at viewport center:', newErase, 'viewportCenter:', viewportCenter);
            // Persist via callback (this will trigger realtime + ops)
            // Use the same callback pattern as Canvas component
            (async () => {
              // Optimistic update
              setEraseGenerators(prev => {
                // Check if modal already exists to avoid duplicates
                if (prev.some(m => m.id === modalId)) {
                  console.log('[Plugin] Modal already exists, skipping');
                  return prev;
                }
                const updated = [...prev, newErase];
                console.log('[Plugin] Updated eraseGenerators, count:', updated.length);
                return updated;
              });
              // Broadcast via realtime
              if (realtimeActive) {
                console.log('[Realtime] broadcast create erase', modalId);
                realtimeRef.current?.sendCreate({
                  id: modalId,
                  type: 'erase',
                  x: modalX,
                  y: modalY,
                  erasedImageUrl: null,
                  sourceImageUrl: null,
                  localErasedImageUrl: null,
                  model: 'bria/eraser',
                  frameWidth: 400,
                  frameHeight: 500,
                  isErasing: false,
                });
              }
              // Always append op for undo/redo and persistence
              if (projectId && opManagerInitialized) {
                await appendOp({
                  type: 'create',
                  elementId: modalId,
                  data: {
                    element: {
                      id: modalId,
                      type: 'erase-plugin',
                      x: modalX,
                      y: modalY,
                      meta: {
                        erasedImageUrl: null,
                        sourceImageUrl: null,
                        localErasedImageUrl: null,
                        model: 'bria/eraser',
                        frameWidth: 400,
                        frameHeight: 500,
                        isErasing: false,
                      },
                    },
                  },
                  inverse: { type: 'delete', elementId: modalId, data: {}, requestId: '', clientTs: 0 } as any,
                });
              }
            })().catch(console.error);
          } else if (plugin.id === 'replace') {
            const viewportCenter = viewportCenterRef.current;
            // If x/y are provided (from click), convert screen coordinates to canvas coordinates
            // Otherwise use viewport center
            let modalX: number;
            let modalY: number;

            if (x !== undefined && y !== undefined && x !== 0 && y !== 0) {
              // Convert screen coordinates to canvas coordinates
              // We need to get the canvas container position to do this properly
              // For now, use viewport center as fallback
              modalX = viewportCenter.x;
              modalY = viewportCenter.y;
            } else {
              // Use viewport center
              modalX = viewportCenter.x;
              modalY = viewportCenter.y;
            }

            const modalId = `replace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newReplace = {
              id: modalId,
              x: modalX,
              y: modalY,
              replacedImageUrl: null,
              sourceImageUrl: null,
              localReplacedImageUrl: null,
              model: 'bria/eraser',
              frameWidth: 400,
              frameHeight: 500,
              isReplacing: false,
            };
            console.log('[Plugin] Creating replace modal at viewport center:', newReplace, 'viewportCenter:', viewportCenter);
            // Persist via callback (this will trigger realtime + ops)
            // Use the same callback pattern as Canvas component
            (async () => {
              // Optimistic update
              setReplaceGenerators(prev => {
                // Check if modal already exists to avoid duplicates
                if (prev.some(m => m.id === modalId)) {
                  console.log('[Plugin] Modal already exists, skipping');
                  return prev;
                }
                const updated = [...prev, newReplace];
                console.log('[Plugin] Updated replaceGenerators, count:', updated.length);
                return updated;
              });
              // Broadcast via realtime
              if (realtimeActive) {
                console.log('[Realtime] broadcast create replace', modalId);
                realtimeRef.current?.sendCreate({
                  id: modalId,
                  type: 'replace',
                  x: modalX,
                  y: modalY,
                  replacedImageUrl: null,
                  sourceImageUrl: null,
                  localReplacedImageUrl: null,
                  model: 'bria/replacer',
                  frameWidth: 400,
                  frameHeight: 500,
                  isReplacing: false,
                });
              }
              // Always append op for undo/redo and persistence
              if (projectId && opManagerInitialized) {
                await appendOp({
                  type: 'create',
                  elementId: modalId,
                  data: {
                    element: {
                      id: modalId,
                      type: 'replace-plugin',
                      x: modalX,
                      y: modalY,
                      meta: {
                        replacedImageUrl: null,
                        sourceImageUrl: null,
                        localReplacedImageUrl: null,
                        model: 'bria/replacer',
                        frameWidth: 400,
                        frameHeight: 500,
                        isReplacing: false,
                      },
                    },
                  },
                  inverse: { type: 'delete', elementId: modalId, data: {}, requestId: '', clientTs: 0 } as any,
                });
              }
            })().catch(console.error);
          } else if (plugin.id === 'expand') {
            const viewportCenter = viewportCenterRef.current;
            const modalX = viewportCenter.x;
            const modalY = viewportCenter.y;
            const modalId = `expand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newExpand = {
              id: modalId,
              x: modalX,
              y: modalY,
              expandedImageUrl: null,
              sourceImageUrl: null,
              localExpandedImageUrl: null,
              model: 'expand/base',
              frameWidth: 400,
              frameHeight: 500,
              isExpanding: false,
            };
            console.log('[Plugin] Creating expand modal at viewport center:', newExpand);
            (async () => {
              setExpandGenerators(prev => {
                if (prev.some(m => m.id === modalId)) {
                  console.log('[Plugin] Expand modal already exists, skipping');
                  return prev;
                }
                const updated = [...prev, newExpand];
                console.log('[Plugin] Updated expandGenerators, count:', updated.length);
                return updated;
              });
              if (realtimeActive) {
                realtimeRef.current?.sendCreate({
                  id: modalId,
                  type: 'expand',
                  x: modalX,
                  y: modalY,
                  expandedImageUrl: null,
                  sourceImageUrl: null,
                  localExpandedImageUrl: null,
                  model: 'expand/base',
                  frameWidth: 400,
                  frameHeight: 500,
                  isExpanding: false,
                });
              }
              if (projectId && opManagerInitialized) {
                await appendOp({
                  type: 'create',
                  elementId: modalId,
                  data: {
                    element: {
                      id: modalId,
                      type: 'expand-plugin',
                      x: modalX,
                      y: modalY,
                      meta: {
                        expandedImageUrl: null,
                        sourceImageUrl: null,
                        localExpandedImageUrl: null,
                        model: 'expand/base',
                        frameWidth: 400,
                        frameHeight: 500,
                        isExpanding: false,
                      },
                    },
                  },
                  inverse: { type: 'delete', elementId: modalId, data: {}, requestId: '', clientTs: 0 } as any,
                });
              }
            })().catch(console.error);
          }
          setIsPluginSidebarOpen(false);
        }}
        scale={1}
        viewportCenter={viewportCenterRef.current}
      />
      {/* Video Editor Modal */}
      <VideoEditorPluginModal
        isOpen={isVideoEditorOpen}
        onClose={() => setIsVideoEditorOpen(false)}
      />
    </main>
  );
}

export default function Home() {
  const [user, setUser] = useState<{ uid: string; username: string; email: string; credits?: number } | null>(null);

  return (
    <AuthGuard onUserLoaded={(loadedUser) => {
      setUser(loadedUser);
    }}>
      <CanvasApp user={user} />
    </AuthGuard>
  );
}
