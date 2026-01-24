import textToImageModels from '../data/textToImageModels.json';
import textToVideoModels from '../data/textToVideoModels.json';

type TextToImageJson = typeof textToImageModels;
type TextToVideoJson = typeof textToVideoModels;

export function getDefaultTextToImageModel(): { id: string; name: string } {
  const models = (textToImageModels as TextToImageJson).models as any[];
  const preferredIds = ['google-nano-banana', 'flux-1.1-pro', 'z-image-turbo'];
  // IMPORTANT: honor preferredIds order (don't depend on models array order).
  const byPreferred = preferredIds
    .map(id => models.find(m => String(m.id).toLowerCase() === String(id).toLowerCase()))
    .find(Boolean);
  const byDefault = models.find(m => m.isDefault);
  const chosen = byPreferred || byDefault || models[0];
  return { id: chosen?.id || 'google-nano-banana', name: chosen?.name || 'Google Nano Banana' };
}

export function findTextToImageModel(query: string): { id: string; name: string } | null {
  const q = (query || '').toLowerCase().trim();
  if (!q) return null;
  const models = (textToImageModels as TextToImageJson).models as any[];

  // Try to extract a likely model name from common phrases:
  // - "use model X"
  // - "change the model to X"
  // - "set model to X"
  // - typos like "chnage the model to X"
  let normalized = q;
  normalized = normalized.replace(/^use\s+model\s+/i, '').trim();
  normalized = normalized.replace(/^use\s+/i, '').trim();
  normalized = normalized.replace(/^set\s+model\s+to\s+/i, '').trim();
  normalized = normalized.replace(/^change\s+model\s+to\s+/i, '').trim();
  normalized = normalized.replace(/^change\s+the\s+model\s+to\s+/i, '').trim();
  normalized = normalized.replace(/^chnage\s+the\s+model\s+to\s+/i, '').trim();
  normalized = normalized.replace(/^model\s+/i, '').trim();

  // If still contains "... model ...", take everything after the word "model"
  const afterModel = q.match(/\bmodel\b\s*(?:to\s*)?(.*)$/i)?.[1]?.trim();
  if (afterModel && afterModel.length >= 3) {
    normalized = afterModel;
  }

  // match by id or name (case-insensitive, partial)
  const exactId = models.find(m => String(m.id).toLowerCase() === normalized);
  if (exactId) return { id: exactId.id, name: exactId.name };
  const exactName = models.find(m => String(m.name).toLowerCase() === normalized);
  if (exactName) return { id: exactName.id, name: exactName.name };

  const partial = models.find(m => String(m.name).toLowerCase().includes(normalized) || String(m.id).toLowerCase().includes(normalized));
  if (partial) return { id: partial.id, name: partial.name };

  // a few common aliases
  if (normalized.includes('nano') && normalized.includes('banana') && normalized.includes('pro')) {
    const m = models.find(x => String(x.id).toLowerCase() === 'google-nano-banana-pro');
    if (m) return { id: m.id, name: m.name };
  }
  if (normalized.includes('nano') && normalized.includes('banana')) {
    const m = models.find(x => String(x.id).toLowerCase() === 'google-nano-banana');
    if (m) return { id: m.id, name: m.name };
  }
  if (normalized.includes('z') && normalized.includes('turbo')) {
    const m = models.find(x => String(x.id).toLowerCase() === 'z-image-turbo');
    if (m) return { id: m.id, name: m.name };
  }

  return null;
}

export function isValidImageAspectRatio(ratio: string): boolean {
  const supported = (textToImageModels as TextToImageJson)?.features?.aspectRatioControl?.supportedRatios as string[] | undefined;
  if (!supported) return true;
  return supported.includes(ratio);
}

export function isValidImageResolution(resolution: string): boolean {
  const supported = (textToImageModels as TextToImageJson)?.features?.highResolution?.resolutions as string[] | undefined;
  if (!supported) return true;
  return supported.includes(resolution);
}

export function getDefaultTextToVideoModel(): { id: string; name: string } {
  const models = (textToVideoModels as TextToVideoJson).models as any[];
  const preferredIds = ['veo-3.1-fast', 'veo-3.1', 'sora-2-pro'];
  // IMPORTANT: honor preferredIds order (don't depend on models array order).
  const byPreferred = preferredIds
    .map(id => models.find(m => String(m.id).toLowerCase() === String(id).toLowerCase()))
    .find(Boolean);
  const byDefault = models.find(m => m.isDefault);
  const chosen = byPreferred || byDefault || models[0];
  return { id: chosen?.id || 'veo-3.1-fast', name: chosen?.name || 'Veo 3.1 Fast' };
}

export function findTextToVideoModel(query: string): { id: string; name: string } | null {
  const q = (query || '').toLowerCase().trim();
  if (!q) return null;
  const models = (textToVideoModels as TextToVideoJson).models as any[];

  let normalized = q;
  normalized = normalized.replace(/^use\s+model\s+/i, '').trim();
  normalized = normalized.replace(/^use\s+/i, '').trim();
  normalized = normalized.replace(/^set\s+model\s+to\s+/i, '').trim();
  normalized = normalized.replace(/^change\s+model\s+to\s+/i, '').trim();
  normalized = normalized.replace(/^change\s+the\s+model\s+to\s+/i, '').trim();
  normalized = normalized.replace(/^model\s+/i, '').trim();

  const afterModel = q.match(/\bmodel\b\s*(?:to\s*)?(.*)$/i)?.[1]?.trim();
  if (afterModel && afterModel.length >= 3) normalized = afterModel;

  const exactId = models.find(m => String(m.id).toLowerCase() === normalized);
  if (exactId) return { id: exactId.id, name: exactId.name };
  const exactName = models.find(m => String(m.name).toLowerCase() === normalized);
  if (exactName) return { id: exactName.id, name: exactName.name };
  const partial = models.find(m => String(m.name).toLowerCase().includes(normalized) || String(m.id).toLowerCase().includes(normalized));
  if (partial) return { id: partial.id, name: partial.name };
  return null;
}

export function isValidVideoAspectRatio(ratio: string): boolean {
  const supported = (textToVideoModels as TextToVideoJson)?.features?.aspectRatioControl?.supportedRatios as string[] | undefined;
  if (!supported) return true;
  return supported.includes(ratio);
}

export function isValidVideoResolution(resolution: string): boolean {
  const supported = (textToVideoModels as TextToVideoJson)?.features?.resolutionControl?.availableResolutions as string[] | undefined;
  if (!supported) return true;
  return supported.includes(resolution);
}
