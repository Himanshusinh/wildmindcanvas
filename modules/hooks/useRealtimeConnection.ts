import { useEffect, useRef, useState } from 'react';
import { RealtimeClient, GeneratorOverlay } from '@/core/api/realtime';
import { ImageUpload } from '@/core/types/canvas';
import { CanvasAppSetters } from '@/modules/canvas-app/types';

interface UseRealtimeConnectionProps {
  projectId: string | null;
  setters: CanvasAppSetters;
}

export function useRealtimeConnection({ projectId, setters }: UseRealtimeConnectionProps) {
  const realtimeRef = useRef<RealtimeClient | null>(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const realtimeActiveRef = useRef(false);

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
        setters.setImageGenerators(imgs);
        setters.setVideoGenerators(vids);
        setters.setMusicGenerators(mus);
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
          setters.setImages(uploaded);
        }
      } else if (evt.type === 'generator.create') {
        console.log('[Realtime] create', evt.overlay?.id, evt.overlay?.type);
        const o = evt.overlay as GeneratorOverlay;
        if (o.type === 'image') {
          setters.setImageGenerators(prev => prev.some(m => m.id === o.id) ? prev : [...prev, { id: o.id, x: o.x, y: o.y, generatedImageUrl: o.generatedImageUrl || null, frameWidth: (o as any).frameWidth, frameHeight: (o as any).frameHeight, model: (o as any).model, frame: (o as any).frame, aspectRatio: (o as any).aspectRatio, prompt: (o as any).prompt }]);
        } else if (o.type === 'video') {
          setters.setVideoGenerators(prev => prev.some(m => m.id === o.id) ? prev : [...prev, { id: o.id, x: o.x, y: o.y, generatedVideoUrl: o.generatedVideoUrl || null, frameWidth: (o as any).frameWidth, frameHeight: (o as any).frameHeight, model: (o as any).model, frame: (o as any).frame, aspectRatio: (o as any).aspectRatio, prompt: (o as any).prompt }]);
        } else if (o.type === 'music') {
          setters.setMusicGenerators(prev => prev.some(m => m.id === o.id) ? prev : [...prev, { id: o.id, x: o.x, y: o.y, generatedMusicUrl: o.generatedMusicUrl || null, frameWidth: (o as any).frameWidth, frameHeight: (o as any).frameHeight, model: (o as any).model, frame: (o as any).frame, aspectRatio: (o as any).aspectRatio, prompt: (o as any).prompt }]);
        } else if (o.type === 'text') {
          setters.setTextGenerators(prev => prev.some(t => t.id === o.id) ? prev : [...prev, { id: o.id, x: o.x, y: o.y, value: (o as any).value }]);
        }
      } else if (evt.type === 'generator.update') {
        console.log('[Realtime] update', evt.id, Object.keys(evt.updates || {}));
        setters.setImageGenerators(prev => prev.map(m => m.id === evt.id ? { ...m, ...evt.updates } : m));
        setters.setVideoGenerators(prev => prev.map(m => m.id === evt.id ? { ...m, ...evt.updates } : m));
        setters.setMusicGenerators(prev => prev.map(m => m.id === evt.id ? { ...m, ...evt.updates } : m));
        setters.setTextGenerators(prev => prev.map(t => t.id === evt.id ? { ...t, ...evt.updates } : t));
      } else if (evt.type === 'generator.delete') {
        console.log('[Realtime] delete', evt.id);
        setters.setImageGenerators(prev => prev.filter(m => m.id !== evt.id));
        setters.setVideoGenerators(prev => prev.filter(m => m.id !== evt.id));
        setters.setMusicGenerators(prev => prev.filter(m => m.id !== evt.id));
        setters.setTextGenerators(prev => prev.filter(t => t.id !== evt.id));
        // Remove any connectors referencing this overlay id
        setters.setConnectors(prev => prev.filter(c => c.from !== evt.id && c.to !== evt.id));
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
        setters.setImages(prev => prev.some(img => (img as any).elementId === m.id) ? prev : [...prev, newItem]);
      } else if (evt.type === 'media.update') {
        const id = (evt as any).id;
        const updates = (evt as any).updates || {};
        console.log('[Realtime] media.update <-', id, Object.keys(updates));
        if (!id) return;
        setters.setImages(prev => prev.map(img => ((img as any).elementId === id) ? { ...img, ...updates } : img));
      } else if (evt.type === 'media.delete') {
        const id = (evt as any).id;
        console.log('[Realtime] media.delete <-', id);
        if (!id) return;
        setters.setImages(prev => prev.filter(img => (img as any).elementId !== id));
        // Remove any connectors referencing this media element
        setters.setConnectors(prev => prev.filter(c => c.from !== id && c.to !== id));
      }
    };

    client.on(handleEvent);
    client.connect(projectId);

    // bfcache support: close socket on pagehide, reconnect on pageshow
    const handlePageHide = () => {
      console.log('[Realtime] Page hidden (bfcache), disconnecting...');
      // Disconnect cleanly so browser can freeze the page
      try { client.disconnect(); } catch (e) { console.error(e); }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      // If persisted is true, page was restored from bfcache
      if (event.persisted) {
        console.log('[Realtime] Page restored from bfcache, reconnecting...');
        // Small delay to ensure browser networking is fully awake
        setTimeout(() => {
          client.connect(projectId);
        }, 100);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', handlePageHide);
      window.addEventListener('pageshow', handlePageShow);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('pagehide', handlePageHide);
        window.removeEventListener('pageshow', handlePageShow);
      }
      client.off(handleEvent);
      client.disconnect();
    };
  }, [projectId, setters]);

  return { realtimeRef, realtimeActive, realtimeActiveRef };
}

