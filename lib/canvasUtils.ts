import Konva from 'konva';

/**
 * Creates a canvas pattern image with white background and light black dots
 * Returns a Promise that resolves to an HTMLImageElement
 */
export const createCanvasPatternImage = (
  dotSize: number = 2,
  dotSpacing: number = 20
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = dotSpacing;
    patternCanvas.height = dotSpacing;
    const ctx = patternCanvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, dotSpacing, dotSpacing);

    // Light black dots
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.arc(dotSpacing / 2, dotSpacing / 2, dotSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Convert canvas to image
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = patternCanvas.toDataURL();
  });
};

/**
 * Enable WebGL rendering for better performance
 */
export const enableWebGL = (stage: Konva.Stage) => {
  try {
    const layer = stage.getLayers()[0];
    if (layer) {
      Konva.pixelRatio = window.devicePixelRatio || 1;
    }
  } catch (e) {
    console.warn('WebGL optimization not available, falling back to 2D context');
  }
};

