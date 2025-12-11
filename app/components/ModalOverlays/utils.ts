import Konva from 'konva';
import { TextModalState, ImageModalState, VideoModalState, MusicModalState, UpscaleModalState, RemoveBgModalState, EraseModalState, ExpandModalState, VectorizeModalState, NextSceneModalState, StoryboardModalState, ScriptFrameModalState } from './types';

export const getComponentType = (id?: string | null): string | null => {
  if (!id) return null;
  const overlay = document.querySelector(`[data-overlay-id="${id}"]`) as HTMLElement | null;
  if (overlay) {
    const attr = overlay.getAttribute('data-modal-component') || (overlay.dataset as any).modalComponent;
    if (attr) return String(attr).toLowerCase();
  }
  const frameEl = document.querySelector(`[data-frame-id="${id}-frame"]`) as HTMLElement | null;
  if (frameEl) {
    const comp = frameEl.closest('[data-modal-component]') as HTMLElement | null;
    if (comp) return (comp.getAttribute('data-modal-component') || (comp.dataset as any).modalComponent || '').toLowerCase() || null;
  }
  const nodeEl = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
  if (nodeEl) {
    // First check if the node itself has data-component-type (for canvas images)
    const componentType = nodeEl.getAttribute('data-component-type');
    if (componentType) return componentType.toLowerCase();
    // Otherwise check for modal component in ancestor
    const comp = nodeEl.closest('[data-modal-component]') as HTMLElement | null;
    if (comp) return (comp.getAttribute('data-modal-component') || (comp.dataset as any).modalComponent || '').toLowerCase() || null;
  }
  // Check if this is a canvas image (uploaded image) by looking for the node element
  // Canvas images have IDs like "canvas-image-{index}" or "element-{timestamp}-{random}"
  if (id.startsWith('canvas-image-') || id.startsWith('element-')) {
    // Try to find the node element to get its component type
    const canvasNodeEl = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
    if (canvasNodeEl) {
      const componentType = canvasNodeEl.getAttribute('data-component-type');
      if (componentType) return componentType.toLowerCase();
    }
    // Fallback: assume 'image' for canvas images
    return 'image';
  }
  return null;
};

export const computeNodeCenter = (
  id: string,
  side: string,
  stageRef: React.RefObject<Konva.Stage | null>,
  position: { x: number; y: number },
  scale: number,
  textInputStates: TextModalState[],
  imageModalStates: ImageModalState[],
  videoModalStates: VideoModalState[],
  musicModalStates: MusicModalState[],
  upscaleModalStates?: UpscaleModalState[],
  removeBgModalStates?: RemoveBgModalState[],
  eraseModalStates?: EraseModalState[],
  expandModalStates?: ExpandModalState[],
  vectorizeModalStates?: VectorizeModalState[],
  nextSceneModalStates?: NextSceneModalState[],
  storyboardModalStates?: StoryboardModalState[],
  scriptFrameModalStates?: ScriptFrameModalState[],
  sceneFrameModalStates?: any[]
): { x: number; y: number } | null => {
  if (!id) return null;

  // First, try to use the actual node element position (most accurate for plugins with circular nodes)
  const el = document.querySelector(`[data-node-id="${id}"][data-node-side="${side}"]`);
  if (el) {
    const rect = el.getBoundingClientRect();
    // Return exact center of the circular node
    const centerX = Math.round(rect.left + rect.width / 2);
    const centerY = Math.round(rect.top + rect.height / 2);
    return { x: centerX, y: centerY };
  }

  // Fallback: Prefer frame element (set via data-frame-id on inner frame)
  const frameEl = document.querySelector(`[data-frame-id="${id}-frame"]`);
  if (frameEl) {
    const rect = frameEl.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    if (side === 'send') return { x: Math.round(rect.right), y: Math.round(centerY) };
    return { x: Math.round(rect.left), y: Math.round(centerY) };
  }

  // Next prefer the overlay container
  const overlay = document.querySelector(`[data-overlay-id="${id}"]`);
  if (overlay) {
    const rect = overlay.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    if (side === 'send') return { x: Math.round(rect.right), y: Math.round(centerY) };
    return { x: Math.round(rect.left), y: Math.round(centerY) };
  }

  // If DOM elements are not present (or during transforms), try computing from stage transform
  try {
    const stage = stageRef?.current as any;
    if (stage && typeof stage.container === 'function') {
      const containerRect = stage.container().getBoundingClientRect();
      // Try to find modal state by id to get its canvas coords and size
      const findModal = () => {
        const t = textInputStates.find(t => t.id === id);
        if (t) return { x: t.x, y: t.y, width: 300, height: 100 };
        const im = imageModalStates.find(m => m.id === id);
        if (im) return { x: im.x, y: im.y, width: im.frameWidth || 600, height: im.frameHeight || 400 };
        const vm = videoModalStates.find(m => m.id === id);
        if (vm) return { x: vm.x, y: vm.y, width: vm.frameWidth || 600, height: vm.frameHeight || 338 };
        const mm = musicModalStates.find(m => m.id === id);
        if (mm) return { x: mm.x, y: mm.y, width: mm.frameWidth || 600, height: mm.frameHeight || 300 };
        const um = upscaleModalStates?.find(m => m.id === id);
        if (um) return { x: um.x, y: um.y, width: um.frameWidth || 400, height: um.frameHeight || 500 };
        const rm = removeBgModalStates?.find(m => m.id === id);
        if (rm) return { x: rm.x, y: rm.y, width: rm.frameWidth || 400, height: rm.frameHeight || 500 };
        const em = eraseModalStates?.find(m => m.id === id);
        if (em) return { x: em.x, y: em.y, width: em.frameWidth || 400, height: em.frameHeight || 500 };
        const ep = expandModalStates?.find(m => m.id === id);
        if (ep) return { x: ep.x, y: ep.y, width: ep.frameWidth || 400, height: ep.frameHeight || 500 };
        const vzm = vectorizeModalStates?.find(m => m.id === id);
        if (vzm) return { x: vzm.x, y: vzm.y, width: vzm.frameWidth || 400, height: vzm.frameHeight || 500 };
        const nsm = nextSceneModalStates?.find(m => m.id === id);
        if (nsm) return { x: nsm.x, y: nsm.y, width: nsm.frameWidth || 400, height: nsm.frameHeight || 500 };
        const sb = storyboardModalStates?.find(m => m.id === id);
        if (sb) return { x: sb.x, y: sb.y, width: sb.frameWidth || 400, height: sb.frameHeight || 500 };
        const sfModal = scriptFrameModalStates?.find(m => m.id === id);
        if (sfModal) return { x: sfModal.x, y: sfModal.y, width: sfModal.frameWidth || 360, height: sfModal.frameHeight || 260 };
        const sf = sceneFrameModalStates?.find(m => m.id === id);
        if (sf) return { x: sf.x, y: sf.y, width: sf.frameWidth || 400, height: sf.frameHeight || 500 };
        return null;
      };
      const modal = findModal();
      if (modal) {
        const centerX = Math.round(containerRect.left + position.x + (modal.x * scale) + ((modal.width * scale) / 2));
        const centerY = Math.round(containerRect.top + position.y + (modal.y * scale) + ((modal.height * scale) / 2));
        if (side === 'send') return { x: Math.round(centerX + (modal.width * scale) / 2), y: centerY };
        return { x: Math.round(centerX - (modal.width * scale) / 2), y: centerY };
      }
    }
  } catch (err) {
    // ignore and fallback
  }
  return null;
};

export const computeStrokeForScale = (base: number, scale: number): number => {
  const effectiveScale = typeof scale === 'number' && !isNaN(scale) ? scale : 1;
  const raw = base * effectiveScale;
  return Math.max(0.5, Math.min(8, Math.round(raw * 10) / 10));
};

export const computeCircleRadiusForScale = (base: number, scale: number): number => {
  const effectiveScale = typeof scale === 'number' && !isNaN(scale) ? scale : 1;
  const raw = base * effectiveScale;
  return Math.max(1, Math.min(8, Math.round(raw * 10) / 10));
};
