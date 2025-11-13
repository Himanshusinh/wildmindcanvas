# Canvas Frontend Integration Guide

## Overview

This guide explains how to integrate the Canvas frontend with the new backend API for collaborative editing, high-performance rendering, and Cursor Agent AI.

## API Integration

### Base URL
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';
const CANVAS_API = `${API_BASE}/api/canvas`;
```

### Authentication
All requests must include credentials:
```typescript
fetch(`${CANVAS_API}/projects`, {
  method: 'POST',
  credentials: 'include', // Important: includes app_session cookie
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'My Project' }),
});
```

## Core Features to Implement

### 1. Project Management

```typescript
// Create project
async function createProject(name: string) {
  const res = await fetch(`${CANVAS_API}/projects`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

// Get project
async function getProject(projectId: string) {
  const res = await fetch(`${CANVAS_API}/projects/${projectId}`, {
    credentials: 'include',
  });
  return res.json();
}
```

### 2. Operation System (CRDT)

```typescript
interface Op {
  type: 'create' | 'update' | 'delete' | 'move' | 'connect';
  elementId?: string;
  elementIds?: string[];
  data: any;
  requestId: string; // Client-generated UUID
  clientTs: number;
  inverse?: Op; // For undo
}

// Append operation
async function appendOp(projectId: string, op: Op) {
  const res = await fetch(`${CANVAS_API}/projects/${projectId}/ops`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(op),
  });
  const result = await res.json();
  return { opId: result.data.opId, opIndex: result.data.opIndex };
}

// Get operations after index
async function getOps(projectId: string, fromOp: number) {
  const res = await fetch(`${CANVAS_API}/projects/${projectId}/ops?fromOp=${fromOp}`, {
    credentials: 'include',
  });
  return res.json();
}
```

### 3. Optimistic Updates

```typescript
class OpManager {
  private pendingOps: Map<string, Op> = new Map();
  private appliedOps: Set<number> = new Set();
  private opIndex: number = 0;

  async applyOpOptimistically(op: Op): Promise<void> {
    // Apply locally immediately
    this.applyOpLocally(op);
    
    // Store pending
    this.pendingOps.set(op.requestId, op);
    
    // Send to server
    try {
      const { opIndex } = await appendOp(this.projectId, op);
      this.opIndex = opIndex;
      this.appliedOps.add(opIndex);
      this.pendingOps.delete(op.requestId);
    } catch (error) {
      // Rollback on error
      this.rollbackOp(op);
    }
  }

  async syncOps(): Promise<void> {
    const snapshot = await getSnapshot(this.projectId, this.opIndex);
    
    // Apply snapshot
    this.applySnapshot(snapshot.snapshot);
    
    // Apply remaining ops
    for (const op of snapshot.ops) {
      if (!this.appliedOps.has(op.opIndex)) {
        this.applyOpLocally(op);
        this.appliedOps.add(op.opIndex);
      }
    }
    
    this.opIndex = snapshot.fromOp;
  }
}
```

### 4. High-Performance Rendering

#### PixiJS Integration

```typescript
import * as PIXI from 'pixi.js';

class HighPerformanceCanvas {
  private app: PIXI.Application;
  private textureCache: Map<string, PIXI.Texture> = new Map();
  private maxCacheSize = 400 * 1024 * 1024; // 400MB
  private currentCacheSize = 0;

  constructor(container: HTMLDivElement) {
    this.app = new PIXI.Application({
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: 0xffffff,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });
    container.appendChild(this.app.view as HTMLCanvasElement);
  }

  async loadTexture(url: string, useCache: boolean = true): Promise<PIXI.Texture> {
    if (useCache && this.textureCache.has(url)) {
      return this.textureCache.get(url)!;
    }

    const texture = await PIXI.Texture.fromURL(url);
    
    if (useCache) {
      const size = this.estimateTextureSize(texture);
      if (this.currentCacheSize + size < this.maxCacheSize) {
        this.textureCache.set(url, texture);
        this.currentCacheSize += size;
      }
    }

    return texture;
  }

  private estimateTextureSize(texture: PIXI.Texture): number {
    return (texture.width * texture.height * 4) / 1024 / 1024; // MB
  }

  renderElement(element: CanvasElement): void {
    switch (element.type) {
      case 'image':
        this.renderImage(element);
        break;
      case 'text':
        this.renderText(element);
        break;
      case 'shape':
        this.renderShape(element);
        break;
    }
  }

  private async renderImage(element: CanvasElement): Promise<void> {
    if (!element.meta?.url) return;
    
    const texture = await this.loadTexture(element.meta.url);
    const sprite = new PIXI.Sprite(texture);
    
    sprite.x = element.x;
    sprite.y = element.y;
    sprite.width = element.width || texture.width;
    sprite.height = element.height || texture.height;
    sprite.rotation = element.rotation || 0;
    sprite.alpha = element.opacity || 1;
    
    this.app.stage.addChild(sprite);
  }
}
```

#### WebGL/WebGPU for 3D

```typescript
import * as THREE from 'three';

class ThreeJSRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  constructor(container: HTMLDivElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);
  }

  async loadModel3D(element: CanvasElement): Promise<void> {
    if (!element.meta?.model3d?.url) return;

    const loader = new THREE.GLTFLoader();
    const gltf = await loader.loadAsync(element.meta.model3d.url);
    
    const model = gltf.scene;
    model.position.set(element.x, element.y, 0);
    model.rotation.x = element.meta.model3d.rotationX || 0;
    model.rotation.y = element.meta.model3d.rotationY || 0;
    model.scale.set(
      element.meta.model3d.zoom || 1,
      element.meta.model3d.zoom || 1,
      element.meta.model3d.zoom || 1
    );
    
    this.scene.add(model);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
```

### 5. Cursor Agent Integration

```typescript
async function planAgentAction(
  projectId: string,
  instruction: string,
  context: CursorAgentContext
): Promise<CursorAgentPlan> {
  const res = await fetch(`${CANVAS_API}/agent/plan`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instruction, projectId, context }),
  });
  return res.json();
}

async function executeAgentPlan(plan: CursorAgentPlan): Promise<void> {
  // Show preview if confidence < 0.8
  if (plan.confidence < 0.8) {
    const confirmed = await showPreviewAndConfirm(plan);
    if (!confirmed) return;
  }

  // Execute actions
  for (const action of plan.actions) {
    if (action.type === 'move') {
      await animateCursor(action.x!, action.y!);
    } else if (action.type === 'pointerDown') {
      await simulatePointerDown(action.x!, action.y!);
    } else if (action.type === 'drag') {
      await animateDrag(action.from!, action.to!, action.steps || 10);
    } else if (action.type === 'selectSet') {
      await selectElements(action.elementIds!);
    } else if (action.type === 'connect') {
      await createConnector(action.fromId!, action.toId!, action.fromAnchor!, action.toAnchor!);
    }
  }
}
```

### 6. Generation Integration

```typescript
async function generateForCanvas(
  projectId: string,
  prompt: string,
  model: string,
  width?: number,
  height?: number
): Promise<{ mediaId: string; url: string }> {
  const res = await fetch(`${CANVAS_API}/generate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      model,
      width,
      height,
      meta: {
        source: 'canvas',
        projectId,
      },
    }),
  });
  
  const result = await res.json();
  return result.data;
}

// Usage: After generation, create element
const { mediaId, url } = await generateForCanvas(projectId, prompt, model);
const op: Op = {
  type: 'create',
  data: {
    element: {
      id: `element-${Date.now()}`,
      type: 'image',
      x: 0,
      y: 0,
      width: 400,
      height: 400,
      meta: { mediaId, url },
    },
  },
  requestId: uuidv4(),
  clientTs: Date.now(),
};
await appendOp(projectId, op);
```

## Performance Optimizations

### 1. Texture Caching
- Use LRU cache with 200-400MB limit
- Preload frequently used textures
- Evict unused textures on memory pressure

### 2. LOD (Level of Detail)
- Load high-res textures only when zoomed in
- Use mipmaps for smooth scaling
- Request tiles at appropriate zoom level

### 3. Batch Operations
- Batch multiple ops in single request (if supported)
- Debounce rapid operations
- Use requestAnimationFrame for smooth updates

### 4. Media Formats
- Use AVIF/WebP for images
- Use KTX2 for GPU textures
- Transcode videos to multiple resolutions

## Real-time Collaboration (Future)

```typescript
// WebSocket connection (when implemented)
const ws = new WebSocket(`wss://api-gateway-services-wildmind.onrender.com/ws/canvas/${projectId}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'op') {
    // Apply remote operation
    applyOpLocally(data.op);
  } else if (data.type === 'presence') {
    // Update presence indicators
    updatePresence(data.presence);
  }
};

// Send presence heartbeat
setInterval(() => {
  ws.send(JSON.stringify({
    type: 'presence',
    x: cursorX,
    y: cursorY,
    tool: selectedTool,
  }));
}, 2000);
```

## Testing Checklist

- [ ] Create project
- [ ] Append operations
- [ ] Get snapshot + ops
- [ ] Optimistic updates
- [ ] Undo/redo
- [ ] Generate image
- [ ] Cursor Agent selection
- [ ] Cursor Agent connection
- [ ] High-performance rendering (PixiJS)
- [ ] 3D model rendering (Three.js)
- [ ] Texture caching
- [ ] Multi-user collaboration (when WS ready)

## Next Steps

1. **Update Canvas component** to use new API
2. **Implement OpManager** for optimistic updates
3. **Integrate PixiJS** for 2D rendering
4. **Integrate Three.js** for 3D rendering
5. **Add Cursor Agent UI** (button + preview)
6. **Implement undo/redo** stack
7. **Add presence indicators** (when WS ready)
8. **Optimize rendering** with texture caching

