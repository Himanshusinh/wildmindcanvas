'use client';

import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@/components/Canvas';
import { ToolbarPanel } from '@/components/ToolbarPanel';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/AuthGuard';
import { Profile } from '@/components/Profile/Profile';
import { ImageUpload } from '@/types/canvas';
import { generateImageForCanvas, generateVideoForCanvas, getCurrentUser } from '@/lib/api';
import { createProject, getProject, listProjects, getCurrentSnapshot as apiGetCurrentSnapshot, setCurrentSnapshot as apiSetCurrentSnapshot } from '@/lib/canvasApi';
import { ProjectSelector } from '@/components/ProjectSelector/ProjectSelector';
import { CanvasProject, CanvasOp } from '@/lib/canvasApi';
import { useOpManager } from '@/hooks/useOpManager';
import { buildProxyDownloadUrl, buildProxyResourceUrl } from '@/lib/proxyUtils';
import { RealtimeClient, GeneratorOverlay } from '@/lib/realtime';

interface CanvasAppProps {
  user: { uid: string; username: string; email: string; credits?: number } | null;
}

function CanvasApp({ user }: CanvasAppProps) {
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [imageGenerators, setImageGenerators] = useState<Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>([]);
  const [videoGenerators, setVideoGenerators] = useState<Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string; duration?: number; taskId?: string; generationId?: string; status?: string }>>([]);
  const [musicGenerators, setMusicGenerators] = useState<Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null; frameWidth?: number; frameHeight?: number; model?: string; frame?: string; aspectRatio?: string; prompt?: string }>>([]);
  // Text generator (input overlay) persistence state
  const [textGenerators, setTextGenerators] = useState<Array<{ id: string; x: number; y: number; value?: string }>>([]);
  const snapshotLoadedRef = useRef(false);
  const realtimeRef = useRef<RealtimeClient | null>(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const realtimeActiveRef = useRef(false);
  const persistTimerRef = useRef<number | null>(null);
  const [projectName, setProjectName] = useState(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      return localStorage.getItem('canvas-project-name') || 'Untitled';
    }
    return 'Untitled';
  });
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const initRef = useRef(false); // Prevent multiple initializations
  const currentUser = user;
  const viewportCenterRef = useRef<{ x: number; y: number; scale: number }>({
    x: 5000000, // Center of 1,000,000 x 1,000,000 infinite canvas
    y: 5000000,
    scale: 1,
  });

  // Initialize project when user is loaded
  useEffect(() => {
    const initProject = async () => {
      if (!currentUser) {
        setIsInitializing(false);
        return;
      }
      
      if (initRef.current) return; // Already initializing
      if (projectId) {
        setIsInitializing(false);
        return; // Already initialized
      }

      initRef.current = true;

      // Check if we have a project ID in localStorage
      const savedProjectId = localStorage.getItem('canvas-project-id');
      if (savedProjectId) {
        // Try to load existing project
        try {
          const project = await getProject(savedProjectId);
          if (project) {
            setProjectId(savedProjectId);
            setProjectName(project.name);
            setIsInitializing(false);
            initRef.current = false; // Reset for future use
            return;
          }
        } catch (error) {
          console.error('Failed to load project:', error);
          // Project doesn't exist, show project selector
        }
      }

      // Show project selector to let user choose or create
      setIsInitializing(false);
      setShowProjectSelector(true);
      initRef.current = false; // Reset after showing selector
    };

    initProject();
  }, [currentUser]); // Only depend on currentUser, not projectId

  const handleProjectSelect = (project: CanvasProject) => {
    setProjectId(project.id);
    setProjectName(project.name);
    setShowProjectSelector(false);
    localStorage.setItem('canvas-project-id', project.id);
    localStorage.setItem('canvas-project-name', project.name);
  };

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
      } catch {}
      // Handle snapshot application (snapshot contains map of elements)
      if (!snapshotLoadedRef.current && (op.data && typeof op.data === 'object' && (op.data.snapshot === true || (!op.data.element && !op.data.delta && !op.data.updates)))) {
        // This is a snapshot - op.data is the elements map
        // Replace entire images array with snapshot (don't append, as snapshot is the source of truth)
        const elements = op.data as Record<string, any>;
        const newImages: ImageUpload[] = [];
        const newImageGenerators: Array<{ id: string; x: number; y: number; generatedImageUrl?: string | null }> = [];
        const newVideoGenerators: Array<{ id: string; x: number; y: number; generatedVideoUrl?: string | null }> = [];
        const newMusicGenerators: Array<{ id: string; x: number; y: number; generatedMusicUrl?: string | null }> = [];
        
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
                groupId: element.meta?.groupId,
                ...(element.id && { elementId: element.id }),
              };
              newImages.push(newImage);
            } else if (element.type === 'image-generator') {
              newImageGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedImageUrl: element.meta?.generatedImageUrl || null });
            } else if (element.type === 'video-generator') {
              newVideoGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedVideoUrl: element.meta?.generatedVideoUrl || null });
            } else if (element.type === 'music-generator') {
              newMusicGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedMusicUrl: element.meta?.generatedMusicUrl || null });
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
            groupId: element.meta?.groupId,
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
            return [...prev, { id: element.id, x: element.x || 0, y: element.y || 0, generatedImageUrl: element.meta?.generatedImageUrl || null }];
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
        }
      } else if (op.type === 'update' && op.elementId) {
        // Update existing element
        const updates = op.data.updates || {};
        // Try update a persisted media element first
        setImages((prev) => {
          const index = prev.findIndex(img => (img as any).elementId === op.elementId);
          if (index >= 0 && updates) {
            const newImages = [...prev];
            newImages[index] = { ...newImages[index], ...updates };
            return newImages;
          }
          return prev;
        });
        // Update a generator modal if matched (needed for undo/redo)
        setImageGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...updates } as any;
            return next;
          }
          return prev;
        });
        setVideoGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...updates } as any;
            return next;
          }
          return prev;
        });
        setMusicGenerators((prev) => {
          const idx = prev.findIndex(m => m.id === op.elementId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...updates } as any;
            return next;
          }
          return prev;
        });
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
      }
    },
  });

  // Keep realtimeActiveRef in sync with state
  useEffect(() => {
    realtimeActiveRef.current = realtimeActive;
  }, [realtimeActive]);

  // Setup realtime connection for generator overlays
  useEffect(() => {
    if (!projectId) {
      // disconnect if exists
      try { realtimeRef.current?.disconnect(); } catch {}
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
  const buildSnapshotElements = (): Record<string, any> => {
    const elements: Record<string, any> = {};
    // Uploaded media and text/models
    images.forEach((img, idx) => {
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
      elements[id] = {
        id,
        type,
        x: img.x || 0,
        y: img.y || 0,
        width: img.width,
        height: img.height,
        rotation: img.rotation || 0,
        meta,
      };
    });
    // Generators (image/video/music)
    imageGenerators.forEach((g) => {
      elements[g.id] = { id: g.id, type: 'image-generator', x: g.x, y: g.y, meta: { generatedImageUrl: g.generatedImageUrl || null, frameWidth: g.frameWidth, frameHeight: g.frameHeight, model: g.model, frame: g.frame, aspectRatio: g.aspectRatio, prompt: g.prompt } };
    });
    videoGenerators.forEach((g) => {
      elements[g.id] = { id: g.id, type: 'video-generator', x: g.x, y: g.y, meta: { generatedVideoUrl: g.generatedVideoUrl || null, frameWidth: g.frameWidth, frameHeight: g.frameHeight, model: g.model, frame: g.frame, aspectRatio: g.aspectRatio, prompt: g.prompt, taskId: (g as any).taskId, generationId: (g as any).generationId, status: (g as any).status } };
    });
    musicGenerators.forEach((g) => {
      elements[g.id] = { id: g.id, type: 'music-generator', x: g.x, y: g.y, meta: { generatedMusicUrl: g.generatedMusicUrl || null, frameWidth: g.frameWidth, frameHeight: g.frameHeight, model: g.model, frame: g.frame, aspectRatio: g.aspectRatio, prompt: g.prompt } };
    });
    // Text input overlays (generators) - persist current value
    textGenerators.forEach((t) => {
      elements[t.id] = { id: t.id, type: 'text-generator', x: t.x, y: t.y, meta: { value: t.value || '' } };
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
  }, [projectId, images, imageGenerators, videoGenerators, musicGenerators, textGenerators]);

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
          const newTextGenerators: Array<{ id: string; x: number; y: number; value?: string }> = [];

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
                  groupId: element.meta?.groupId,
                  ...(element.id && { elementId: element.id }),
                };
                newImages.push(newImage);
              } else if (element.type === 'image-generator') {
                newImageGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedImageUrl: element.meta?.generatedImageUrl || null, frameWidth: element.meta?.frameWidth, frameHeight: element.meta?.frameHeight, model: element.meta?.model, frame: element.meta?.frame, aspectRatio: element.meta?.aspectRatio, prompt: element.meta?.prompt });
              } else if (element.type === 'video-generator') {
                newVideoGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedVideoUrl: element.meta?.generatedVideoUrl || null, frameWidth: element.meta?.frameWidth, frameHeight: element.meta?.frameHeight, model: element.meta?.model, frame: element.meta?.frame, aspectRatio: element.meta?.aspectRatio, prompt: element.meta?.prompt, duration: element.meta?.duration, taskId: element.meta?.taskId, generationId: element.meta?.generationId, status: element.meta?.status });
              } else if (element.type === 'music-generator') {
                newMusicGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, generatedMusicUrl: element.meta?.generatedMusicUrl || null, frameWidth: element.meta?.frameWidth, frameHeight: element.meta?.frameHeight, model: element.meta?.model, frame: element.meta?.frame, aspectRatio: element.meta?.aspectRatio, prompt: element.meta?.prompt });
              } else if (element.type === 'text-generator') {
                newTextGenerators.push({ id: element.id, x: element.x || 0, y: element.y || 0, value: element.meta?.value });
              }
            }
          });
          setImages(newImages);
          setImageGenerators(newImageGenerators);
          setVideoGenerators(newVideoGenerators);
          setMusicGenerators(newMusicGenerators);
          setTextGenerators(newTextGenerators);
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

  const handleImageUpdate = (index: number, updates: Partial<ImageUpload>) => {
    setImages((prev) => {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], ...updates };
      return newImages;
    });

    // Send move op to server if position changed
    if (projectId && opManagerInitialized && (updates.x !== undefined || updates.y !== undefined)) {
      const image = images[index];
      const deltaX = updates.x !== undefined ? updates.x - (image.x || 0) : 0;
      const deltaY = updates.y !== undefined ? updates.y - (image.y || 0) : 0;
      
      if (deltaX !== 0 || deltaY !== 0) {
        const elementId = (image as any).elementId || `img-${index}`;
        appendOp({
          type: 'move',
          elementId,
          data: { delta: { x: deltaX, y: deltaY } },
          inverse: {
            type: 'move',
            elementId,
            data: { delta: { x: -deltaX, y: -deltaY } },
            requestId: '',
            clientTs: 0,
          } as any,
        } as any).catch(console.error);
      }
    }

    // Realtime broadcast for smooth media moves/resizes
    const current = images[index];
    const id = (current as any)?.elementId;
    if (realtimeActive && id) {
      const mediaUpdate: any = {};
      if (updates.x !== undefined) mediaUpdate.x = updates.x;
      if (updates.y !== undefined) mediaUpdate.y = updates.y;
      if (updates.width !== undefined) mediaUpdate.width = updates.width;
      if (updates.height !== undefined) mediaUpdate.height = updates.height;
      if (updates.rotation !== undefined) mediaUpdate.rotation = updates.rotation;
      if (Object.keys(mediaUpdate).length) {
        console.log('[Realtime] media.update', id, Object.keys(mediaUpdate));
        realtimeRef.current?.sendMediaUpdate(id, mediaUpdate);
      }
    }
  };

  const handleImageDelete = (index: number) => {
    const image = images[index];
    
    setImages((prev) => {
      const newImages = [...prev];
      // Clean up blob URL if it exists
      const item = newImages[index];
      if (item?.url && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
      // Remove the item
      newImages.splice(index, 1);
      return newImages;
    });

    // Realtime broadcast for delete
    const id = (image as any)?.elementId;
    if (realtimeActive && id) {
      console.log('[Realtime] media.delete', id);
      realtimeRef.current?.sendMediaDelete(id);
    }

    // Send delete op to server (with inverse create)
    if (projectId && opManagerInitialized) {
      const elementId = (image as any).elementId || `img-${index}`;
      const elType = image.type === 'image' ? 'image' : image.type === 'video' ? 'video' : image.type === 'text' ? 'text' : image.type === 'model3d' ? 'model3d' : 'image';
      const meta: any = image.type === 'text' ? { text: image.text } : { url: image.url };
      appendOp({
        type: 'delete',
        elementId,
        data: {},
        inverse: {
          type: 'create',
          elementId,
          data: {
            element: {
              id: elementId,
              type: elType,
              x: image.x || 0,
              y: image.y || 0,
              width: image.width || 400,
              height: image.height || 400,
              meta,
            },
          },
          requestId: '',
          clientTs: 0,
        } as any,
      } as any).catch(console.error);
    }
  };

  const handleImageDownload = async (index: number) => {
    const imageData = images[index];
    if (!imageData?.url) return;

    try {
      let downloadUrl: string;
      let filename: string;

      if (imageData.url.startsWith('blob:')) {
        // For blob URLs, download directly (local files)
        const response = await fetch(imageData.url);
        const blob = await response.blob();
        filename = imageData.file?.name || `image-${Date.now()}.${imageData.type === 'video' ? 'mp4' : imageData.type === 'model3d' ? 'gltf' : 'png'}`;
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      } else {
        // Use proxy download endpoint for Zata URLs and external URLs
        downloadUrl = buildProxyDownloadUrl(imageData.url);
        
        // Extract filename from URL or use default
        try {
          const urlObj = new URL(imageData.url);
          filename = urlObj.pathname.split('/').pop() || `image-${Date.now()}.${imageData.type === 'video' ? 'mp4' : 'png'}`;
        } catch {
          filename = imageData.file?.name || `image-${Date.now()}.${imageData.type === 'video' ? 'mp4' : 'png'}`;
        }
      }

      // Create download link using proxy
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.target = '_blank'; // Open in new tab as fallback
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download:', error);
      alert('Failed to download. Please try again.');
    }
  };

  const handleImageDuplicate = (index: number) => {
    const imageData = images[index];
    if (!imageData) return;

    // Create a duplicate to the right
    const imageWidth = imageData.width || 400;
    const duplicated: ImageUpload = {
      ...imageData,
      x: (imageData.x || 0) + imageWidth + 50, // Image width + 50px spacing
      y: imageData.y || 0, // Same Y position
    };

    // If it's a blob URL, we need to create a new blob URL
    if (imageData.url && imageData.url.startsWith('blob:') && imageData.file) {
      duplicated.url = URL.createObjectURL(imageData.file);
      duplicated.file = imageData.file;
    }

    setImages((prev) => [...prev, duplicated]);

    // Realtime broadcast for duplicate as create
    const id = (duplicated as any)?.elementId;
    if (realtimeActive && id) {
      const kind = duplicated.type === 'image' ? 'image' : duplicated.type === 'video' ? 'video' : duplicated.type === 'text' ? 'text' : 'model3d';
      console.log('[Realtime] media.create duplicate', id);
      realtimeRef.current?.sendMediaCreate({ id, kind, x: duplicated.x || 0, y: duplicated.y || 0, width: duplicated.width, height: duplicated.height, url: duplicated.url });
    }
  };

  const handleImageUpload = (file: File) => {
    processMediaFile(file, images.length);
  };

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

  const processMediaFile = (file: File, offsetIndex: number = 0) => {
    const url = URL.createObjectURL(file);
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    // Check for 3D model files
    const isModel3D = ['.obj', '.gltf', '.glb', '.fbx', '.mb', '.ma']
      .some(ext => fileName.endsWith(ext));
    
    // Check for video files
    const isVideo = fileType.startsWith('video/') || 
                    ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp']
                      .some(ext => fileName.endsWith(ext));
    
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
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Get current viewport center
        const center = viewportCenterRef.current;
        
        // Scale down video to reasonable size (max 600px for largest dimension)
        const maxDimension = 600;
        const originalWidth = video.videoWidth;
        const originalHeight = video.videoHeight;
        let displayWidth = originalWidth;
        let displayHeight = originalHeight;
        
        if (originalWidth > maxDimension || originalHeight > maxDimension) {
          const aspectRatio = originalWidth / originalHeight;
          if (originalWidth > originalHeight) {
            displayWidth = maxDimension;
            displayHeight = maxDimension / aspectRatio;
          } else {
            displayHeight = maxDimension;
            displayWidth = maxDimension * aspectRatio;
          }
        }
        
        // Place video at the center of current viewport with slight offset for multiple files
        const offsetX = (offsetIndex % 3) * 50; // Stagger horizontally
        const offsetY = Math.floor(offsetIndex / 3) * 50; // Stagger vertically
        const videoX = center.x - displayWidth / 2 + offsetX;
        const videoY = center.y - displayHeight / 2 + offsetY;

        const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newImage: ImageUpload = {
          file,
          url,
          type: 'video',
          x: videoX,
          y: videoY,
          width: displayWidth,
          height: displayHeight,
          // Store original resolution for display in tooltip
          originalWidth: originalWidth,
          originalHeight: originalHeight,
          elementId,
        };

      setImages((prev) => {
        const updated = [...prev, newImage];
        if (realtimeActive) {
          console.log('[Realtime] media.create video', elementId);
          realtimeRef.current?.sendMediaCreate({ id: elementId, kind: 'video', x: newImage.x || 0, y: newImage.y || 0, width: newImage.width, height: newImage.height, url: newImage.url });
        }
        // Send create op to server
        if (projectId && opManagerInitialized) {
          appendOp({
            type: 'create',
            elementId,
            data: {
              element: {
                id: elementId,
                type: 'video',
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
    } else {
      const img = new Image();
      
      img.onload = () => {
        // Get current viewport center
        const center = viewportCenterRef.current;
        
        // Scale down image to reasonable size (max 600px for largest dimension)
        const maxDimension = 600;
        const originalWidth = img.width;
        const originalHeight = img.height;
        let displayWidth = originalWidth;
        let displayHeight = originalHeight;
        
        if (originalWidth > maxDimension || originalHeight > maxDimension) {
          const aspectRatio = originalWidth / originalHeight;
          if (originalWidth > originalHeight) {
            displayWidth = maxDimension;
            displayHeight = maxDimension / aspectRatio;
          } else {
            displayHeight = maxDimension;
            displayWidth = maxDimension * aspectRatio;
          }
        }
        
        // Place image at the center of current viewport with slight offset for multiple images
        const offsetX = (offsetIndex % 3) * 50; // Stagger horizontally
        const offsetY = Math.floor(offsetIndex / 3) * 50; // Stagger vertically
        const imageX = center.x - displayWidth / 2 + offsetX;
        const imageY = center.y - displayHeight / 2 + offsetY;

        const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newImage: ImageUpload = {
          file,
          url,
          type: 'image',
          x: imageX,
          y: imageY,
          width: displayWidth,
          height: displayHeight,
          // Store original resolution for display in tooltip
          originalWidth: img.naturalWidth || originalWidth,
          originalHeight: img.naturalHeight || originalHeight,
          elementId,
        };

        setImages((prev) => {
          const updated = [...prev, newImage];
          if (realtimeActive) {
            console.log('[Realtime] media.create image', elementId);
            realtimeRef.current?.sendMediaCreate({ id: elementId, kind: 'image', x: newImage.x || 0, y: newImage.y || 0, width: newImage.width, height: newImage.height, url: newImage.url });
          }
          // Send create op to server
          if (projectId && opManagerInitialized) {
            appendOp({
              type: 'create',
              elementId,
              data: {
                element: {
                  id: elementId,
                  type: 'image',
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

      img.src = url;
    }
  };

  const handleImagesDrop = (files: File[]) => {
    // Process multiple files with slight offsets
    files.forEach((file, index) => {
      processMediaFile(file, images.length + index);
    });
  };

  const [selectedTool, setSelectedTool] = useState<'cursor' | 'move' | 'text' | 'image' | 'video' | 'music'>('cursor');
  const [toolClickCounter, setToolClickCounter] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedMusicUrl, setGeneratedMusicUrl] = useState<string | null>(null);

  const handleToolSelect = (tool: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music') => {
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
  };

  const handleTextCreate = (text: string, x: number, y: number) => {
    const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newText: ImageUpload = {
      type: 'text',
      text,
      x,
      y,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
      elementId,
    };
    setImages((prev) => [...prev, newText]);

    if (realtimeActive) {
      console.log('[Realtime] media.create text', elementId);
      realtimeRef.current?.sendMediaCreate({ id: elementId, kind: 'text', x: newText.x || 0, y: newText.y || 0, width: newText.width, height: newText.height, url: undefined });
    }

    // Send create op to server
    if (projectId && opManagerInitialized) {
      appendOp({
        type: 'create',
        elementId,
        data: {
          element: {
            id: elementId,
            type: 'text',
            x: newText.x,
            y: newText.y,
            width: newText.width,
            height: newText.height,
            meta: {
              text: text,
            },
          },
        },
        inverse: { type: 'delete', elementId, data: {}, requestId: '', clientTs: 0 } as any,
      }).catch(console.error);
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

  const handleProjectNameChange = async (name: string) => {
    setProjectName(name);
    localStorage.setItem('canvas-project-name', name);
    
    // Update project name in backend if we have a project ID
    if (projectId) {
      try {
        // TODO: Implement project update API call when available
        // await updateProject(projectId, { name });
      } catch (error) {
        console.error('Failed to update project name:', error);
      }
    }
  };


  const handleImageSelect = (file: File) => {
    // Process the selected image file
    processMediaFile(file, images.length);
  };

  const handleImageGenerate = async (
    prompt: string, 
    model: string, 
    frame: string, 
    aspectRatio: string,
    modalId?: string
  ): Promise<string | null> => {
    try {
      console.log('Generate image:', { prompt, model, frame, aspectRatio, modalId });
      
      // Ensure we have a project ID
      if (!projectId) {
        throw new Error('Project not initialized. Please refresh the page.');
      }

      // Parse aspect ratio to get width/height if needed
      const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
      const aspectRatioValue = widthRatio / heightRatio;
      const baseSize = 1024; // Base size for generation
      let genWidth: number;
      let genHeight: number;
      
      if (aspectRatioValue >= 1) {
        // Landscape or square
        genWidth = Math.round(baseSize * aspectRatioValue);
        genHeight = baseSize;
      } else {
        // Portrait
        genWidth = baseSize;
        genHeight = Math.round(baseSize / aspectRatioValue);
      }

      // Call the Canvas-specific generation API
      const result = await generateImageForCanvas(
        prompt,
        model,
        aspectRatio,
        projectId,
        genWidth,
        genHeight
      );
      
      console.log('Image generated successfully:', result);
      // Do NOT create a canvas image here. Only return URL for generator overlay.
      // ModalOverlays will persist the generatedImageUrl to the generator element.
      return result.url;
    } catch (error: any) {
      console.error('Error generating image:', error);
      alert(error.message || 'Failed to generate image. Please try again.');
      throw error; // Re-throw to let the modal handle the error display
    }
  };

  const handleVideoSelect = (file: File) => {
    // Process the selected video file
    processMediaFile(file, images.length);
  };

  const handleVideoGenerate = async (prompt: string, model: string, frame: string, aspectRatio: string, duration: number, modalId?: string): Promise<{ generationId?: string; taskId?: string } | null> => {
    if (!projectId || !prompt.trim()) {
      console.error('Missing projectId or prompt');
      return { generationId: undefined, taskId: undefined };
    }

    try {
      console.log('Generate video:', { prompt, model, frame, aspectRatio, duration });
      
      // Call video generation API
      const result = await generateVideoForCanvas(
        prompt,
        model,
        aspectRatio,
        projectId,
        duration,
        '1080p'
      );

      console.log('Video generation started:', result);

      // For now, video generation is async and uses a queue system
      // The taskId is returned, and we need to poll for the result
      // TODO: Implement polling for video result
      // For now, return null so the modal stays open; once URL is available via polling, we can update.
      return { generationId: result.generationId, taskId: result.taskId };
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
          />
        )}
        {projectId ? (
          <>
            <Canvas 
              images={images} 
              onViewportChange={handleViewportChange}
              onImageUpdate={handleImageUpdate}
              onImageDelete={handleImageDelete}
              onImageDownload={handleImageDownload}
              onImageDuplicate={handleImageDuplicate}
              onImagesDrop={handleImagesDrop}
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
              onAddImageToCanvas={async (url: string) => {
                try {
                  // Load image to compute display dimensions
                  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const i = new Image();
                    i.crossOrigin = 'anonymous';
                    i.onload = () => resolve(i);
                    i.onerror = reject;
                    i.src = url;
                  });

                  const maxDimension = 600;
                  const originalWidth = img.naturalWidth || img.width;
                  const originalHeight = img.naturalHeight || img.height;
                  let displayWidth = originalWidth;
                  let displayHeight = originalHeight;
                  if (originalWidth > maxDimension || originalHeight > maxDimension) {
                    const ar = originalWidth / originalHeight;
                    if (originalWidth > originalHeight) {
                      displayWidth = maxDimension;
                      displayHeight = Math.round(maxDimension / ar);
                    } else {
                      displayHeight = maxDimension;
                      displayWidth = Math.round(maxDimension * ar);
                    }
                  }

                  // Place at current viewport center
                  const center = viewportCenterRef.current;
                  const imageX = center.x - displayWidth / 2;
                  const imageY = center.y - displayHeight / 2;

                  const elementId = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                  const newImage: ImageUpload = {
                    type: 'image',
                    url,
                    x: imageX,
                    y: imageY,
                    width: displayWidth,
                    height: displayHeight,
                    elementId,
                  };

                  setImages((prev) => {
                    // avoid duplicates by elementId
                    if (prev.some(img => (img as any).elementId === elementId)) return prev;
                    return [...prev, newImage];
                  });

                  if (realtimeActive) {
                    console.log('[Realtime] media.create addToCanvas', elementId);
                    realtimeRef.current?.sendMediaCreate({ id: elementId, kind: 'image', x: imageX, y: imageY, width: displayWidth, height: displayHeight, url });
                  }

                  if (projectId && opManagerInitialized) {
                    await appendOp({
                      type: 'create',
                      elementId,
                      data: {
                        element: {
                          id: elementId,
                          type: 'image',
                          x: imageX,
                          y: imageY,
                          width: displayWidth,
                          height: displayHeight,
                          meta: { url },
                        },
                      },
                      inverse: {
                        type: 'delete',
                        elementId,
                        data: {},
                        requestId: '',
                        clientTs: 0,
                      } as any,
                    });
                  }
                } catch (e) {
                  console.error('Failed to add image to canvas:', e);
                  alert('Failed to add image to canvas.');
                }
              }}
              projectId={projectId}
              externalImageModals={imageGenerators}
              externalVideoModals={videoGenerators}
              externalMusicModals={musicGenerators}
              externalTextModals={textGenerators}
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
                      element: { id: modal.id, type: 'image-generator', x: modal.x, y: modal.y, meta: { generatedImageUrl: modal.generatedImageUrl || null } },
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
                // Optimistic delete
                const prevItem = imageGenerators.find(m => m.id === id);
                setImageGenerators(prev => prev.filter(m => m.id !== id));
                // Broadcast via realtime
                if (realtimeActive) {
                  console.log('[Realtime] broadcast delete image', id);
                  realtimeRef.current?.sendDelete(id);
                }
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
                const prevItem = videoGenerators.find(m => m.id === id);
                setVideoGenerators(prev => prev.filter(m => m.id !== id));
                if (realtimeActive) {
                  console.log('[Realtime] broadcast delete video', id);
                  realtimeRef.current?.sendDelete(id);
                }
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
                const prevItem = musicGenerators.find(m => m.id === id);
                setMusicGenerators(prev => prev.filter(m => m.id !== id));
                if (realtimeActive) {
                  console.log('[Realtime] broadcast delete music', id);
                  realtimeRef.current?.sendDelete(id);
                }
                if (projectId && opManagerInitialized) {
                  await appendOp({ type: 'delete', elementId: id, data: {}, inverse: prevItem ? { type: 'create', elementId: id, data: { element: { id, type: 'music-generator', x: prevItem.x, y: prevItem.y, meta: { generatedMusicUrl: (prevItem as any).generatedMusicUrl || null } } }, requestId: '', clientTs: 0 } as any : undefined as any });
                }
              }}
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
                const prevItem = textGenerators.find(t => t.id === id);
                setTextGenerators(prev => prev.filter(t => t.id !== id));
                if (realtimeActive) {
                  console.log('[Realtime] broadcast delete text', id);
                  realtimeRef.current?.sendDelete(id);
                }
                if (projectId && opManagerInitialized) {
                  await appendOp({ type: 'delete', elementId: id, data: {}, inverse: prevItem ? { type: 'create', elementId: id, data: { element: { id, type: 'text-generator', x: prevItem.x, y: prevItem.y, meta: { value: (prevItem as any).value || '' } } }, requestId: '', clientTs: 0 } as any : undefined as any });
                }
              }}
            />
            <ToolbarPanel onToolSelect={handleToolSelect} onUpload={handleToolbarUpload} />
            <Profile />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-600">Please select or create a project to continue</p>
          </div>
        )}
      </div>
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
