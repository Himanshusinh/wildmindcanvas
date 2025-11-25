import { ImageUpload } from '@/types/canvas';
import { CanvasAppState } from '../types';

export function buildSnapshotElements(
  state: CanvasAppState,
  connectorsOverride?: Array<any>
): Record<string, any> {
  const elements: Record<string, any> = {};

  // Build connection map keyed by source element id
  const connectionsBySource: Record<string, Array<any>> = {};
  const connectorsToUse = connectorsOverride ?? state.connectors;
  connectorsToUse.forEach((c) => {
    if (!c || !c.id) return;
    const src = c.from;
    if (!src) return;
    connectionsBySource[src] = connectionsBySource[src] || [];
    connectionsBySource[src].push({ id: c.id, to: c.to, color: c.color, fromAnchor: c.fromAnchor, toAnchor: c.toAnchor });
  });

  // Uploaded media and text/models
  state.images.forEach((img, idx) => {
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
    // Attach any connections originating from this element into its meta
    if (connectionsBySource[id] && connectionsBySource[id].length) {
      meta.connections = connectionsBySource[id];
    }
    elements[id] = { id, type, x: img.x || 0, y: img.y || 0, width: img.width, height: img.height, rotation: img.rotation || 0, meta };
  });

  // Generators (image/video/music)
  state.imageGenerators.forEach((g) => {
    const metaObj: any = { generatedImageUrl: g.generatedImageUrl || null, frameWidth: g.frameWidth, frameHeight: g.frameHeight, model: g.model, frame: g.frame, aspectRatio: g.aspectRatio, prompt: g.prompt };
    if (connectionsBySource[g.id] && connectionsBySource[g.id].length) metaObj.connections = connectionsBySource[g.id];
    elements[g.id] = { id: g.id, type: 'image-generator', x: g.x, y: g.y, meta: metaObj };
  });

  state.videoGenerators.forEach((g) => {
    const metaObj: any = { generatedVideoUrl: g.generatedVideoUrl || null, frameWidth: g.frameWidth, frameHeight: g.frameHeight, model: g.model, frame: g.frame, aspectRatio: g.aspectRatio, prompt: g.prompt, taskId: (g as any).taskId, generationId: (g as any).generationId, status: (g as any).status };
    if (connectionsBySource[g.id] && connectionsBySource[g.id].length) metaObj.connections = connectionsBySource[g.id];
    elements[g.id] = { id: g.id, type: 'video-generator', x: g.x, y: g.y, meta: metaObj };
  });

  state.musicGenerators.forEach((g) => {
    const metaObj: any = { generatedMusicUrl: g.generatedMusicUrl || null, frameWidth: g.frameWidth, frameHeight: g.frameHeight, model: g.model, frame: g.frame, aspectRatio: g.aspectRatio, prompt: g.prompt };
    if (connectionsBySource[g.id] && connectionsBySource[g.id].length) metaObj.connections = connectionsBySource[g.id];
    elements[g.id] = { id: g.id, type: 'music-generator', x: g.x, y: g.y, meta: metaObj };
  });

  // Upscale generators
  state.upscaleGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      upscaledImageUrl: modal.upscaledImageUrl || null,
      sourceImageUrl: modal.sourceImageUrl || null,
      localUpscaledImageUrl: modal.localUpscaledImageUrl || null,
      model: modal.model || 'Crystal Upscaler',
      scale: modal.scale || 2,
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      isUpscaling: modal.isUpscaling || false,
    };
    // Attach any connections originating from this element into its meta
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'upscale-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Remove BG generators
  state.removeBgGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      removedBgImageUrl: modal.removedBgImageUrl || null,
      sourceImageUrl: modal.sourceImageUrl || null,
      localRemovedBgImageUrl: modal.localRemovedBgImageUrl || null,
      model: modal.model || '851-labs/background-remover',
      backgroundType: modal.backgroundType || 'rgba (transparent)',
      scaleValue: modal.scaleValue || 0.5,
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      isRemovingBg: modal.isRemovingBg || false,
    };
    // Attach any connections originating from this element into its meta
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'removebg-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Erase generators
  state.eraseGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      erasedImageUrl: modal.erasedImageUrl || null,
      sourceImageUrl: modal.sourceImageUrl || null,
      localErasedImageUrl: modal.localErasedImageUrl || null,
      model: modal.model || 'bria/eraser',
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      isErasing: modal.isErasing || false,
    };
    // Attach any connections originating from this element into its meta
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'erase-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Replace generators
  state.replaceGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      replacedImageUrl: modal.replacedImageUrl || null,
      sourceImageUrl: modal.sourceImageUrl || null,
      localReplacedImageUrl: modal.localReplacedImageUrl || null,
      model: modal.model || 'bria/eraser',
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      isReplacing: modal.isReplacing || false,
    };
    // Attach any connections originating from this element into its meta
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'replace-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Expand generators
  state.expandGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      expandedImageUrl: modal.expandedImageUrl || null,
      sourceImageUrl: modal.sourceImageUrl || null,
      localExpandedImageUrl: modal.localExpandedImageUrl || null,
      model: modal.model || 'expand/base',
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      isExpanding: modal.isExpanding || false,
    };
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'expand-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Vectorize generators
  state.vectorizeGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      vectorizedImageUrl: modal.vectorizedImageUrl || null,
      sourceImageUrl: modal.sourceImageUrl || null,
      localVectorizedImageUrl: modal.localVectorizedImageUrl || null,
      mode: modal.mode || 'simple',
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      isVectorizing: modal.isVectorizing || false,
    };
    // Attach any connections originating from this element into its meta
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'vectorize-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Storyboard generators
  state.storyboardGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      frameWidth: modal.frameWidth || 400,
      frameHeight: modal.frameHeight || 500,
      scriptText: modal.scriptText || null,
    };
    // Attach any connections originating from this element into its meta
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'storyboard-plugin',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Script frame generators
  state.scriptFrameGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      pluginId: modal.pluginId,
      frameWidth: modal.frameWidth || 360,
      frameHeight: modal.frameHeight || 260,
      text: modal.text || '',
    };
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'script-frame',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Scene frame generators
  state.sceneFrameGenerators.forEach((modal) => {
    if (!modal || !modal.id) return;
    const metaObj: any = {
      scriptFrameId: modal.scriptFrameId,
      sceneNumber: modal.sceneNumber,
      frameWidth: modal.frameWidth || 350,
      frameHeight: modal.frameHeight || 300,
      content: modal.content || '',
    };
    if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
      metaObj.connections = connectionsBySource[modal.id];
    }
    elements[modal.id] = {
      id: modal.id,
      type: 'scene-frame',
      x: modal.x,
      y: modal.y,
      meta: metaObj,
    };
  });

  // Text input overlays (generators) - persist current value
  state.textGenerators.forEach((t) => {
    elements[t.id] = { id: t.id, type: 'text-generator', x: t.x, y: t.y, meta: { value: t.value || '' } };
  });

  // Note: connectors are stored inside the source element's meta.connections (see connectionsBySource)
  // Also include connector elements as top-level elements so snapshots contain explicit connector records
  const connectorsToUseFinal = connectorsOverride ?? state.connectors;
  connectorsToUseFinal.forEach(c => {
    if (!c || !c.id) return;
    elements[c.id] = { id: c.id, type: 'connector', from: c.from, to: c.to, meta: { color: c.color || '#437eb5', fromAnchor: c.fromAnchor, toAnchor: c.toAnchor } };
  });

  return elements;
}

