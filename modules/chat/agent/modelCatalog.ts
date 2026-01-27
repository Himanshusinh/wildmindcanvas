import textToImageModels from '../data/textToImageModels.json';
import textToVideoModels from '../data/textToVideoModels.json';
import plugins from '../data/plugins.json';

type TextToImageJson = typeof textToImageModels;
type TextToVideoJson = typeof textToVideoModels;
type PluginsJson = typeof plugins;

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

/**
 * Find the closest supported resolution from reference image dimensions.
 * Returns a resolution string that matches the model's supported resolutions.
 */
export function findClosestImageResolution(
  width: number,
  height: number,
  modelName?: string | null
): string {
  const models = (textToImageModels as TextToImageJson).models as any[];
  const q = (modelName || '').toLowerCase().trim();
  const model = q
    ? models.find(m => String(m.name).toLowerCase() === q || String(m.id).toLowerCase() === q)
    : null;
  
  // Get model-specific resolutions or fallback to feature-level resolutions
  const modelResolutions = model?.resolutions as string[] | undefined;
  const featureResolutions = (textToImageModels as TextToImageJson)?.features?.highResolution?.resolutions as string[] | undefined;
  const availableResolutions = modelResolutions && modelResolutions.length > 0 ? modelResolutions : featureResolutions;
  
  if (!availableResolutions || availableResolutions.length === 0) {
    // Default fallback
    const maxDim = Math.max(width, height);
    if (maxDim <= 512) return '512';
    if (maxDim <= 768) return '768';
    if (maxDim <= 1024) return '1024';
    if (maxDim <= 1440) return '1440';
    return '1024';
  }
  
  // Normalize resolution strings and find closest match
  const normalizeRes = (res: string): number => {
    const r = res.toLowerCase().trim();
    if (r === '1k' || r === '1024') return 1024;
    if (r === '2k' || r === '2048') return 2048;
    if (r === '4k' || r === '4096') return 4096;
    const num = parseInt(r, 10);
    return Number.isFinite(num) ? num : 1024;
  };
  
  const targetDim = Math.max(width, height);
  let closest = availableResolutions[0];
  let minDiff = Math.abs(normalizeRes(closest) - targetDim);
  
  for (const res of availableResolutions) {
    const diff = Math.abs(normalizeRes(res) - targetDim);
    if (diff < minDiff) {
      minDiff = diff;
      closest = res;
    }
  }
  
  return closest;
}

// ==================== PLUGIN ACCESS FUNCTIONS ====================

/**
 * Get all plugin categories
 */
export function getPluginCategories(): Array<{ id: string; name: string; description: string }> {
  const categories = (plugins as PluginsJson).categories as any[];
  return categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    description: cat.description || '',
  }));
}

/**
 * Find a plugin by ID or name
 */
export function findPlugin(query: string): any | null {
  const q = (query || '').toLowerCase().trim();
  if (!q) return null;
  const categories = (plugins as PluginsJson).categories as any[];
  
  // Search through all categories and plugins
  for (const category of categories) {
    const categoryPlugins = category.plugins || [];
    for (const plugin of categoryPlugins) {
      if (String(plugin.id).toLowerCase() === q || 
          String(plugin.name).toLowerCase() === q ||
          String(plugin.name).toLowerCase().includes(q) ||
          String(plugin.id).toLowerCase().includes(q)) {
        return { ...plugin, categoryId: category.id, categoryName: category.name };
      }
    }
  }
  
  return null;
}

/**
 * Find a plugin model by plugin ID and model query
 */
export function findPluginModel(pluginId: string, modelQuery: string): any | null {
  const plugin = findPlugin(pluginId);
  if (!plugin || !plugin.models) return null;
  
  const q = (modelQuery || '').toLowerCase().trim();
  if (!q) {
    // Return default model if no query
    const defaultModelId = plugin.defaultModel;
    return plugin.models.find((m: any) => m.id === defaultModelId) || plugin.models[0] || null;
  }
  
  const models = plugin.models as any[];
  const exactId = models.find(m => String(m.id).toLowerCase() === q);
  if (exactId) return exactId;
  
  const exactName = models.find(m => String(m.name).toLowerCase() === q);
  if (exactName) return exactName;
  
  const partial = models.find(m => 
    String(m.name).toLowerCase().includes(q) || 
    String(m.id).toLowerCase().includes(q)
  );
  if (partial) return partial;
  
  return null;
}

/**
 * Get all plugins in a category
 */
export function getPluginsByCategory(categoryId: string): any[] {
  const categories = (plugins as PluginsJson).categories as any[];
  const category = categories.find(c => c.id === categoryId);
  return category?.plugins || [];
}

/**
 * Get default model for a plugin
 */
export function getDefaultPluginModel(pluginId: string): any | null {
  const plugin = findPlugin(pluginId);
  if (!plugin || !plugin.models) return null;
  
  const defaultModelId = plugin.defaultModel;
  if (defaultModelId) {
    return plugin.models.find((m: any) => m.id === defaultModelId) || null;
  }
  
  return plugin.models[0] || null;
}

/**
 * Get all available plugins (flattened list)
 */
export function getAllPlugins(): Array<{ id: string; name: string; description: string; categoryId: string; categoryName: string }> {
  const categories = (plugins as PluginsJson).categories as any[];
  const result: any[] = [];
  
  for (const category of categories) {
    const categoryPlugins = category.plugins || [];
    for (const plugin of categoryPlugins) {
      result.push({
        id: plugin.id,
        name: plugin.name,
        description: plugin.description || '',
        categoryId: category.id,
        categoryName: category.name,
      });
    }
  }
  
  return result;
}
