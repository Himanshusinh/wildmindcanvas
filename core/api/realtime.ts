export type GeneratorOverlay = {
  id: string;
  type: 'image' | 'video' | 'music' | 'text' | 'upscale' | 'multiangle-camera' | 'removebg' | 'erase' | 'replace' | 'expand' | 'vectorize' | 'storyboard' | 'next-scene-plugin' | 'compare' | 'rich-text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  generatedImageUrl?: string | null;
  generatedVideoUrl?: string | null;
  generatedMusicUrl?: string | null;
  upscaledImageUrl?: string | null;
  removedBgImageUrl?: string | null;
  erasedImageUrl?: string | null;
  replacedImageUrl?: string | null;
  expandedImageUrl?: string | null;
  vectorizedImageUrl?: string | null;
  sourceImageUrl?: string | null;
  localUpscaledImageUrl?: string | null;
  localRemovedBgImageUrl?: string | null;
  localErasedImageUrl?: string | null;
  localReplacedImageUrl?: string | null;
  localExpandedImageUrl?: string | null;
  localVectorizedImageUrl?: string | null;
  nextSceneImageUrl?: string | null;
  localNextSceneImageUrl?: string | null;
  mode?: string;
  frameWidth?: number;
  frameHeight?: number;
  model?: string;
  backgroundType?: string;
  scaleValue?: number;
  frame?: string;
  aspectRatio?: string;
  prompt?: string;
  scale?: number;
  isUpscaling?: boolean;
  isRemovingBg?: boolean;
  isErasing?: boolean;
  isReplacing?: boolean;
  isExpanding?: boolean;
  isVectorizing?: boolean;
  isProcessing?: boolean;
  // text generator current value
  value?: string;
  // rich-text properties
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  textDecoration?: string;
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
  | { type: 'connected'; version?: number }
  | { type: 'disconnected' }
  | { type: 'init'; overlays: GeneratorOverlay[]; media?: MediaElement[]; version: number }
  | { type: 'sync_required' }
  | { type: 'ack'; version: number }
  | { type: 'op'; op: any; version: number }
  | { type: 'cursor'; x: number; y: number; authorId: string };

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<(evt: RealtimeEvent) => void>();
  private projectId: string | null = null;
  private url: string | null = null;
  private clientVersion: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.url = process.env.NEXT_PUBLIC_REALTIME_WS_URL || null;
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

  // Strict Sequential Consistency Check
  private validateSequence(msgVersion: number): boolean {
    if (msgVersion === this.clientVersion + 1) {
      this.clientVersion = msgVersion;
      return true;
    }

    if (msgVersion > this.clientVersion + 1) {
      console.warn(`[Realtime] Version gap! Client: ${this.clientVersion}, Msg: ${msgVersion}. Requesting sync.`);
      this.emit({ type: 'sync_required' });
      // Force reload or re-init logic here
      if (typeof window !== 'undefined') window.location.reload();
      return false;
    }

    // Duplicate/Old message
    return false;
  }

  connect(projectId: string) {
    this.projectId = projectId;
    this.clientVersion = 0;

    if (typeof window === 'undefined') return;
    // Offline-safe: if no URL, just act as disabled realtime
    if (!this.url) {
      console.warn('[Realtime] No URL configured, offline mode');
      this.emit({ type: 'disconnected' });
      return;
    }

    try {
      // Append projectId to URL
      const wsUrlStr = new URL(this.url);
      wsUrlStr.searchParams.set('projectId', projectId);
      const wsUrl = wsUrlStr.toString();

      console.log('[Realtime] Connecting to:', wsUrl, 'Current clientVersion:', this.clientVersion);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = (ev) => {
        console.log('[Realtime] WebSocket.onopen fired. Project:', projectId, 'ReadyState:', this.ws?.readyState);
        this.emit({ type: 'connected', version: this.clientVersion });
        // Ask server for initial overlays
        this.send({ type: 'init', projectId });
      };

      this.ws.onmessage = (ev) => {
        try {
          const raw = JSON.parse(ev.data);
          // Normalize type/kind
          const msg = { ...raw, type: raw.type || raw.kind };

          if (msg?.type && msg.type !== 'cursor') {
            const meta = msg.overlay?.id || msg.id || (msg.op ? msg.op.type : '');
            console.log('[Realtime] Message:', msg.type, meta, 'v:', msg.version);
          }

          if (!msg || !msg.type) return;

          // Special handling for init
          if (msg.type === 'init') {
            if (typeof msg.version === 'number') {
              this.clientVersion = msg.version;
              console.log('[Realtime] Synced to version:', this.clientVersion);
            }
            if (Array.isArray(msg.overlays)) {
              this.emit({ type: 'init', overlays: msg.overlays, media: Array.isArray(msg.media) ? msg.media : [], version: msg.version });
            }
            return;
          }

          // Special handling for ack
          if (msg.type === 'ack' && typeof msg.version === 'number') {
            // Confirm our outgoing op was sequenced
            if (msg.version > this.clientVersion) {
              this.clientVersion = msg.version;
            }
            this.emit({ type: 'ack', version: msg.version });
            return;
          }

          // Standard ops validation
          const isValid = this.validateSequence(msg.version);
          if (!isValid) return; // Drop message, sync requested

          // Dispatch
          if (msg.type === 'op') {
            this.emit({ type: 'op', op: msg.op, version: msg.version } as any);
          } else if (msg.type === 'generator.create' && msg.overlay) {
            this.emit({ type: 'generator.create', overlay: msg.overlay, src: msg.src, version: msg.version, seq: msg.seq } as any);
          } else if (msg.type === 'generator.update' && msg.id && msg.updates) {
            this.emit({ type: 'generator.update', id: msg.id, updates: msg.updates, src: msg.src, version: msg.version, seq: msg.seq } as any);
          } else if (msg.type === 'generator.delete' && msg.id) {
            this.emit({ type: 'generator.delete', id: msg.id, src: msg.src, version: msg.version, seq: msg.seq } as any);
          } else if (msg.type === 'media.create' && msg.media) {
            this.emit({ type: 'media.create', media: msg.media, src: msg.src, version: msg.version, seq: msg.seq } as any);
          } else if (msg.type === 'media.update' && msg.id && msg.updates) {
            this.emit({ type: 'media.update', id: msg.id, updates: msg.updates, src: msg.src, version: msg.version, seq: msg.seq } as any);
          } else if (msg.type === 'media.delete' && msg.id) {
            this.emit({ type: 'media.delete', id: msg.id, src: msg.src, version: msg.version, seq: msg.seq } as any);
          } else if (msg.type === 'history.appended' && msg.op) {
            this.emit({ type: 'op', op: msg.op, version: msg.version } as any);
          } else if (msg.type === 'history.undone' && msg.op) {
            this.emit({ type: 'undo', op: msg.op, version: msg.version } as any);
          } else if (msg.type === 'history.redone' && msg.op) {
            this.emit({ type: 'redo', op: msg.op, version: msg.version } as any);
          }
        } catch (e) {
          console.warn('Realtime message parse failed', e);
        }
      };

      this.ws.onclose = (ev) => {
        console.warn('[Realtime] WebSocket.onclose fired:', ev.code, ev.reason, 'Clean:', ev.wasClean);
        this.emit({ type: 'disconnected' });
      };

      this.ws.onerror = (err) => {
        console.error('[Realtime] WebSocket.onerror fired:', err);
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

  // Public helpers used by page to broadcast changes directly (Legacy mode)
  // NOTE: Moving to sendOperation for undoable actions
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

  // ------------------------------------------------------------------
  // NEW: History / Undo Redo API
  // ------------------------------------------------------------------

  /**
   * Send an undoable operation to the server.
   * Server will:
   * 1. Push to undo stack
   * 2. Clear redo stack
   * 3. Broadcast 'op' to OTHERS
   * 4. Ack version to US
   */
  sendOperation(op: any, inverse: any) {
    if (!this.isConnected()) return;
    this.send({
      type: 'history.push',
      op,
      inverse,
      projectId: this.projectId
    });
    // Optimistic: we don't increment version here, wait for Ack or Broadcast
  }

  sendUndo() {
    if (!this.isConnected()) return;
    this.send({
      type: 'history.undo',
      projectId: this.projectId
    });
  }

  sendRedo() {
    if (!this.isConnected()) return;
    this.send({
      type: 'history.redo',
      projectId: this.projectId
    });
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
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

