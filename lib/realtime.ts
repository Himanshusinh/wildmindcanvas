export type GeneratorOverlay = {
  id: string;
  type: 'image' | 'video' | 'music' | 'text';
  x: number;
  y: number;
  generatedImageUrl?: string | null;
  generatedVideoUrl?: string | null;
  generatedMusicUrl?: string | null;
  frameWidth?: number;
  frameHeight?: number;
  model?: string;
  frame?: string;
  aspectRatio?: string;
  prompt?: string;
  // text generator current value
  value?: string;
};

export type MediaElement = {
  id: string;
  kind: 'image' | 'video' | 'model3d' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  url?: string;
  frameWidth?: number;
  frameHeight?: number;
  model?: string;
  selected?: boolean;
};

// Realtime events that the CanvasApp expects
export type RealtimeEvent =
  | { type: 'connected' }
  | { type: 'disconnected' }
  | { type: 'init'; overlays: GeneratorOverlay[]; media?: MediaElement[] }
  | { type: 'generator.create'; overlay: GeneratorOverlay }
  | { type: 'generator.update'; id: string; updates: Partial<GeneratorOverlay> }
  | { type: 'generator.delete'; id: string }
  | { type: 'media.create'; media: MediaElement }
  | { type: 'media.update'; id: string; updates: Partial<MediaElement> }
  | { type: 'media.delete'; id: string }
  | { type: 'group.create'; group: any }
  | { type: 'group.update'; id: string; updates: any }
  | { type: 'group.delete'; id: string }
  | { type: 'group.move'; id: string; delta: { x: number; y: number }; elementIds?: string[] };

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<(evt: RealtimeEvent) => void>();
  private projectId: string | null = null;
  private url: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Important: use direct access so Next.js inlines the value
      this.url = process.env.NEXT_PUBLIC_REALTIME_WS_URL || null;
      // Debug: show configured WS URL
      console.log('[Realtime] Configured URL:', this.url);
    }
  }

  on(handler: (evt: RealtimeEvent) => void) {
    this.handlers.add(handler);
  }

  off(handler: (evt: RealtimeEvent) => void) {
    this.handlers.delete(handler);
  }

  private emit(evt: RealtimeEvent) {
    this.handlers.forEach((h) => {
      try { h(evt); } catch (e) { console.error('Realtime handler error', e); }
    });
  }

  connect(projectId: string) {
    this.projectId = projectId;

    // Offline-safe: if no URL, just act as disabled realtime
    if (!this.url || typeof window === 'undefined') {
      // Emit a no-op init so UI can hydrate if needed
      this.emit({ type: 'disconnected' });
      return;
    }

    try {
      const wsUrl = `${this.url}?projectId=${encodeURIComponent(projectId)}`;
      console.log('[Realtime] Connecting to:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[Realtime] Connected for project:', projectId);
        this.emit({ type: 'connected' });
        // Ask server for initial overlays
        this.send({ type: 'init', projectId });
      };

      this.ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.type) {
            const meta = msg.overlay?.id || msg.id || '';
            console.log('[Realtime] Message:', msg.type, meta);
          }
          // Expect messages in the same shape as RealtimeEvent
          if (msg && msg.type) {
            if (msg.type === 'init' && Array.isArray(msg.overlays)) {
              this.emit({ type: 'init', overlays: msg.overlays, media: Array.isArray(msg.media) ? msg.media : [] });
            } else if (msg.type === 'generator.create' && msg.overlay) {
              this.emit({ type: 'generator.create', overlay: msg.overlay });
            } else if (msg.type === 'group.create' && msg.group) {
              this.emit({ type: 'group.create', group: msg.group });
            } else if (msg.type === 'group.update' && msg.id && msg.updates) {
              this.emit({ type: 'group.update', id: msg.id, updates: msg.updates });
            } else if (msg.type === 'group.delete' && msg.id) {
              this.emit({ type: 'group.delete', id: msg.id });
            } else if (msg.type === 'group.move' && msg.id && msg.delta) {
              this.emit({ type: 'group.move', id: msg.id, delta: msg.delta, elementIds: Array.isArray(msg.elementIds) ? msg.elementIds : [] });
            } else if (msg.type === 'generator.update' && msg.id && msg.updates) {
              this.emit({ type: 'generator.update', id: msg.id, updates: msg.updates });
            } else if (msg.type === 'generator.delete' && msg.id) {
              this.emit({ type: 'generator.delete', id: msg.id });
            } else if (msg.type === 'media.create' && msg.media) {
              this.emit({ type: 'media.create', media: msg.media });
            } else if (msg.type === 'media.update' && msg.id && msg.updates) {
              this.emit({ type: 'media.update', id: msg.id, updates: msg.updates });
            } else if (msg.type === 'media.delete' && msg.id) {
              this.emit({ type: 'media.delete', id: msg.id });
            }
          }
        } catch (e) {
          console.warn('Realtime message parse failed', e);
        }
      };

      this.ws.onclose = () => {
        console.log('[Realtime] Disconnected');
        this.emit({ type: 'disconnected' });
      };

      this.ws.onerror = (err) => {
        console.warn('[Realtime] Socket error', err);
        this.emit({ type: 'disconnected' });
      };
    } catch (e) {
      console.warn('Realtime connection failed', e);
      this.emit({ type: 'disconnected' });
    }
  }

  private send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        if (payload?.type) {
          const meta = payload.overlay?.id || payload.id || '';
          console.log('[Realtime] Send:', payload.type, meta);
        }
        this.ws.send(JSON.stringify(payload));
      } catch (e) {
        console.warn('Realtime send failed', e);
      }
    }
  }

  // Public helpers used by page to broadcast changes
  sendCreate(overlay: GeneratorOverlay) {
    this.send({ type: 'generator.create', overlay, projectId: this.projectId });
  }

  sendUpdate(id: string, updates: Partial<GeneratorOverlay>) {
    this.send({ type: 'generator.update', id, updates, projectId: this.projectId });
  }

  sendDelete(id: string) {
    this.send({ type: 'generator.delete', id, projectId: this.projectId });
  }

  // Media helpers
  sendMediaCreate(media: MediaElement) {
    this.send({ type: 'media.create', media, projectId: this.projectId });
  }
  sendMediaUpdate(id: string, updates: Partial<MediaElement>) {
    this.send({ type: 'media.update', id, updates, projectId: this.projectId });
  }
  sendMediaDelete(id: string) {
    this.send({ type: 'media.delete', id, projectId: this.projectId });
  }

  // Group helpers
  sendGroupCreate(group: any) {
    this.send({ type: 'group.create', group, projectId: this.projectId });
  }
  sendGroupUpdate(id: string, updates: any) {
    this.send({ type: 'group.update', id, updates, projectId: this.projectId });
  }
  sendGroupDelete(id: string) {
    this.send({ type: 'group.delete', id, projectId: this.projectId });
  }
  sendGroupMove(id: string, delta: { x: number; y: number }, elementIds?: string[]) {
    this.send({ type: 'group.move', id, delta, elementIds, projectId: this.projectId });
  }

  disconnect() {
    try {
      if (this.ws) {
        this.ws.close();
      }
    } finally {
      this.ws = null;
      this.emit({ type: 'disconnected' });
    }
  }
}
