import { ImageUpload } from '@/types/canvas';
import Konva from 'konva';

/**
 * Check if a position is near any existing positions
 */
export function existsNearby(
  arr: Array<{ x: number; y: number }>,
  x: number,
  y: number,
  threshold = 12
): boolean {
  for (const it of arr) {
    const dx = (it.x || 0) - x;
    const dy = (it.y || 0) - y;
    if (dx * dx + dy * dy <= threshold * threshold) return true;
  }
  return false;
}

/**
 * Find an available canvas position near (cx, cy) that doesn't collide with existing components
 */
export function findAvailablePositionNear(
  cx: number,
  cy: number,
  occupied: Array<{ x: number; y: number }>,
  threshold = 60,
  maxRadius = 600
): { x: number; y: number } {
  if (!existsNearby(occupied, cx, cy, threshold)) return { x: cx, y: cy };

  // Spiral search: increment radius by step, sample multiple angles
  const step = 40;
  for (let r = step; r <= maxRadius; r += step) {
    const samples = Math.ceil((2 * Math.PI * r) / step);
    for (let i = 0; i < samples; i++) {
      const angle = (i / samples) * Math.PI * 2;
      const nx = Math.round(cx + Math.cos(angle) * r);
      const ny = Math.round(cy + Math.sin(angle) * r);
      if (!existsNearby(occupied, nx, ny, threshold)) {
        return { x: nx, y: ny };
      }
    }
  }

  // Fallback: return original center if no free spot found
  return { x: cx, y: cy };
}

/**
 * Set cursor on the Konva stage
 */
export function applyStageCursor(
  stage: Konva.Stage | null,
  style: string,
  selectedTool: 'cursor' | 'move' | 'text' | 'image' | 'video' | 'music' | undefined,
  force = false
): void {
  if (!stage) return;
  try {
    if (force) {
      stage.container().style.cursor = style;
      return;
    }
    // If callers want a text cursor but the user is actually interacting
    // with a text input overlay (focused textarea/input) or hovering a
    // text modal, don't force the global stage to show the I-beam; keep a
    // pointer/default instead so the experience feels like clicking a UI
    // control rather than editing the stage.
    if (style === 'text') {
      try {
        const active = document.activeElement;
        const hoveringTextOverlay = !!document.querySelector('[data-modal-component="text"]:hover');
        const isInputFocused = active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT' || (active as HTMLElement).isContentEditable);
        if (isInputFocused || hoveringTextOverlay) {
          stage.container().style.cursor = 'pointer';
          return;
        }
      } catch (err) { /* ignore DOM errors */ }
    }

    if (selectedTool === 'cursor' || selectedTool === 'move') {
      stage.container().style.cursor = style;
    } else if (selectedTool === 'text' && style === 'text') {
      stage.container().style.cursor = 'text';
    } else {
      stage.container().style.cursor = 'default';
    }
  } catch (err) {
    // ignore
  }
}

/**
 * Check if a position overlaps with existing components
 */
export function checkOverlap(
  x: number,
  y: number,
  width: number,
  height: number,
  images: ImageUpload[],
  textInputStates: Array<{ x: number; y: number }>,
  imageModalStates: Array<{ x: number; y: number }>,
  videoModalStates: Array<{ x: number; y: number }>,
  musicModalStates: Array<{ x: number; y: number }>,
  padding: number = 100
): boolean {
  // Expand check rect with padding
  const checkRect = {
    x: x - padding,
    y: y - padding,
    width: width + padding * 2,
    height: height + padding * 2
  };

  // Check against uploaded images/videos
  for (const img of images) {
    if (img.type === 'text' || img.type === 'model3d') continue;
    const imgWidth = img.width || 400;
    const imgHeight = img.height || 400;
    const imgRect = {
      x: (img.x || 0) - padding,
      y: (img.y || 0) - padding,
      width: imgWidth + padding * 2,
      height: imgHeight + padding * 2,
    };
    if (
      checkRect.x < imgRect.x + imgRect.width &&
      checkRect.x + checkRect.width > imgRect.x &&
      checkRect.y < imgRect.y + imgRect.height &&
      checkRect.y + checkRect.height > imgRect.y
    ) {
      return true;
    }
  }

  // Check against text inputs (estimated size: 300x100)
  for (const textState of textInputStates) {
    const textRect = {
      x: textState.x - padding,
      y: textState.y - padding,
      width: 300 + padding * 2,
      height: 100 + padding * 2
    };
    if (
      checkRect.x < textRect.x + textRect.width &&
      checkRect.x + checkRect.width > textRect.x &&
      checkRect.y < textRect.y + textRect.height &&
      checkRect.y + checkRect.height > textRect.y
    ) {
      return true;
    }
  }

  // Check against image modals (600px wide, ~400px tall for 1:1 aspect ratio)
  for (const modalState of imageModalStates) {
    const modalRect = {
      x: modalState.x - padding,
      y: modalState.y - padding,
      width: 600 + padding * 2,
      height: 400 + padding * 2
    };
    if (
      checkRect.x < modalRect.x + modalRect.width &&
      checkRect.x + checkRect.width > modalRect.x &&
      checkRect.y < modalRect.y + modalRect.height &&
      checkRect.y + checkRect.height > modalRect.y
    ) {
      return true;
    }
  }

  // Check against video modals (600px wide, ~400px tall for 16:9 aspect ratio)
  for (const modalState of videoModalStates) {
    const modalRect = {
      x: modalState.x - padding,
      y: modalState.y - padding,
      width: 600 + padding * 2,
      height: 400 + padding * 2
    };
    if (
      checkRect.x < modalRect.x + modalRect.width &&
      checkRect.x + checkRect.width > modalRect.x &&
      checkRect.y < modalRect.y + modalRect.height &&
      checkRect.y + checkRect.height > modalRect.y
    ) {
      return true;
    }
  }

  // Check against music modals (600px wide, ~300px tall)
  for (const modalState of musicModalStates) {
    const modalRect = {
      x: modalState.x - padding,
      y: modalState.y - padding,
      width: 600 + padding * 2,
      height: 300 + padding * 2
    };
    if (
      checkRect.x < modalRect.x + modalRect.width &&
      checkRect.x + checkRect.width > modalRect.x &&
      checkRect.y < modalRect.y + modalRect.height &&
      checkRect.y + checkRect.height > modalRect.y
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Find blank space for new component
 */
export function findBlankSpace(
  componentWidth: number,
  componentHeight: number,
  images: ImageUpload[],
  textInputStates: Array<{ x: number; y: number }>,
  imageModalStates: Array<{ x: number; y: number }>,
  videoModalStates: Array<{ x: number; y: number }>,
  musicModalStates: Array<{ x: number; y: number }>,
  viewportSize: { width: number; height: number },
  position: { x: number; y: number },
  scale: number
): { x: number; y: number } {
  // Check if canvas is empty
  const isEmpty = images.length === 0 &&
    textInputStates.length === 0 &&
    imageModalStates.length === 0 &&
    videoModalStates.length === 0 &&
    musicModalStates.length === 0;

  if (isEmpty) {
    // Center on screen when canvas is empty
    const centerX = (viewportSize.width / 2 - position.x) / scale;
    const centerY = (viewportSize.height / 2 - position.y) / scale;
    return { x: centerX - componentWidth / 2, y: centerY - componentHeight / 2 };
  }

  // Find blank space starting from viewport center
  const centerX = (viewportSize.width / 2 - position.x) / scale;
  const centerY = (viewportSize.height / 2 - position.y) / scale;

  // Try positions in a spiral pattern from center with larger spacing
  const spacing = Math.max(componentWidth, componentHeight) + 200; // Space between attempts (component size + padding)
  const maxAttempts = 100; // Search further

  // First try center position
  if (!checkOverlap(
    centerX - componentWidth / 2,
    centerY - componentHeight / 2,
    componentWidth,
    componentHeight,
    images,
    textInputStates,
    imageModalStates,
    videoModalStates,
    musicModalStates
  )) {
    return { x: centerX - componentWidth / 2, y: centerY - componentHeight / 2 };
  }

  // Spiral search pattern
  for (let radius = 1; radius < maxAttempts; radius++) {
    // Try 8 directions at each radius
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = (angle * Math.PI) / 180;
      const x = centerX - componentWidth / 2 + Math.cos(rad) * radius * spacing;
      const y = centerY - componentHeight / 2 + Math.sin(rad) * radius * spacing;

      if (!checkOverlap(x, y, componentWidth, componentHeight, images, textInputStates, imageModalStates, videoModalStates, musicModalStates)) {
        return { x, y };
      }
    }
  }

  // Fallback: try positions further away in a grid pattern
  const gridSpacing = spacing;
  for (let row = -10; row <= 10; row++) {
    for (let col = -10; col <= 10; col++) {
      if (row === 0 && col === 0) continue; // Skip center (already checked)
      const x = centerX - componentWidth / 2 + col * gridSpacing;
      const y = centerY - componentHeight / 2 + row * gridSpacing;

      if (!checkOverlap(x, y, componentWidth, componentHeight, images, textInputStates, imageModalStates, videoModalStates, musicModalStates)) {
        return { x, y };
      }
    }
  }

  // Last resort: return a position far to the right
  return { x: centerX + 1000, y: centerY - componentHeight / 2 };
}

/**
 * Pan viewport to focus on a component
 */
export function focusOnComponent(
  canvasX: number,
  canvasY: number,
  componentWidth: number,
  componentHeight: number,
  viewportSize: { width: number; height: number },
  scale: number,
  setPosition: (pos: { x: number; y: number }) => void,
  updateViewportCenter: (pos: { x: number; y: number }, scale: number) => void
): void {
  // Calculate the position to center the component on screen
  const targetScreenX = viewportSize.width / 2;
  const targetScreenY = viewportSize.height / 2;

  // Convert canvas coordinates to screen coordinates
  const componentCenterX = canvasX + componentWidth / 2;
  const componentCenterY = canvasY + componentHeight / 2;

  // Calculate new position to center the component
  const newPosX = targetScreenX - componentCenterX * scale;
  const newPosY = targetScreenY - componentCenterY * scale;

  setPosition({ x: newPosX, y: newPosY });
  setTimeout(() => updateViewportCenter({ x: newPosX, y: newPosY }, scale), 0);
}

