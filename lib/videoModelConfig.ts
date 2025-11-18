/**
 * Video Generation Model Configuration
 * 
 * This file contains the constraints and supported parameters for all video generation models.
 * Used to dynamically configure the UI (duration, resolution, aspect ratio options) based on selected model.
 */

export interface VideoModelConfig {
  model: string;
  durations: number[]; // Available durations in seconds
  defaultDuration: number;
  resolutions: string[]; // Available resolutions (e.g., '720p', '1080p')
  defaultResolution: string;
  aspectRatios: string[]; // Available aspect ratios (e.g., '16:9', '9:16', '1:1')
  defaultAspectRatio: string;
  maxDuration?: number; // Maximum duration constraint
  minDuration?: number; // Minimum duration constraint
  notes?: string; // Additional constraints or notes
}

export const VIDEO_MODEL_CONFIGS: Record<string, VideoModelConfig> = {
  // OpenAI Models
  'Sora 2 Pro': {
    model: 'Sora 2 Pro',
    durations: [4, 8, 12],
    defaultDuration: 8,
    resolutions: ['720p', '1080p'],
    defaultResolution: '720p',
    aspectRatios: ['16:9', '9:16'],
    defaultAspectRatio: '16:9',
    notes: 'Text-to-Video and Image-to-Video support 720p and 1080p',
  },

  // Google Models
  'Veo 3.1 Pro': {
    model: 'Veo 3.1 Pro',
    durations: [8],
    defaultDuration: 8,
    resolutions: ['720p', '1080p'],
    defaultResolution: '720p',
    aspectRatios: ['16:9', '9:16', '1:1'],
    defaultAspectRatio: '16:9',
  },
  'Veo 3.1 Fast Pro': {
    model: 'Veo 3.1 Fast Pro',
    durations: [8],
    defaultDuration: 8,
    resolutions: ['720p', '1080p'],
    defaultResolution: '720p',
    aspectRatios: ['16:9', '9:16', '1:1'],
    defaultAspectRatio: '16:9',
  },

  // Kling Models
  'Kling 2.5 Turbo Pro': {
    model: 'Kling 2.5 Turbo Pro',
    durations: [5, 10],
    defaultDuration: 5,
    resolutions: ['720p', '1080p'], // Mode 'standard' = 720p, 'pro' = 1080p
    defaultResolution: '720p',
    aspectRatios: ['16:9', '9:16', '1:1'],
    defaultAspectRatio: '16:9',
    notes: 'Resolution controlled via mode parameter (standard=720p, pro=1080p)',
  },

  // Seedance Models
  'Seedance 1.0 Pro': {
    model: 'Seedance 1.0 Pro',
    durations: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    defaultDuration: 5,
    minDuration: 2,
    maxDuration: 12,
    resolutions: ['480p', '720p', '1080p'],
    defaultResolution: '1080p',
    aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21'],
    defaultAspectRatio: '16:9',
  },
  'Seedance 1.0 Lite': {
    model: 'Seedance 1.0 Lite',
    durations: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    defaultDuration: 5,
    minDuration: 2,
    maxDuration: 12,
    resolutions: ['480p', '720p', '1080p'],
    defaultResolution: '1080p',
    aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21'],
    defaultAspectRatio: '16:9',
  },

  // PixVerse Models
  'PixVerse v5': {
    model: 'PixVerse v5',
    durations: [5, 8],
    defaultDuration: 5,
    resolutions: ['360p', '540p', '720p', '1080p'],
    defaultResolution: '720p',
    aspectRatios: ['16:9', '9:16', '1:1'],
    defaultAspectRatio: '16:9',
    notes: 'Supports quality parameter: 360p, 540p, 720p, 1080p',
  },

  // LTX Models
  'LTX V2 Pro': {
    model: 'LTX V2 Pro',
    durations: [6, 8, 10],
    defaultDuration: 8,
    resolutions: ['1080p', '1440p', '2160p'],
    defaultResolution: '1080p',
    aspectRatios: ['16:9', '9:16'],
    defaultAspectRatio: '16:9',
  },
  'LTX V2 Fast': {
    model: 'LTX V2 Fast',
    durations: [6, 8, 10],
    defaultDuration: 8,
    resolutions: ['1080p', '1440p', '2160p'],
    defaultResolution: '1080p',
    aspectRatios: ['16:9', '9:16'],
    defaultAspectRatio: '16:9',
  },

  // WAN Models
  'WAN 2.5': {
    model: 'WAN 2.5',
    durations: [5, 10],
    defaultDuration: 5,
    resolutions: ['480p', '720p', '1080p'], // Mapped from size options
    defaultResolution: '720p',
    aspectRatios: ['16:9', '9:16', '1:1'], // Mapped from size options
    defaultAspectRatio: '16:9',
  },
  'WAN 2.5 Fast': {
    model: 'WAN 2.5 Fast',
    durations: [5, 10],
    defaultDuration: 5,
    resolutions: ['480p', '720p', '1080p'],
    defaultResolution: '720p',
    aspectRatios: ['16:9', '9:16', '1:1'],
    defaultAspectRatio: '16:9',
  },

  // MiniMax Models
  'MiniMax-Hailuo-02': {
    model: 'MiniMax-Hailuo-02',
    durations: [6, 10],
    defaultDuration: 6,
    resolutions: ['768P', '1080P'], // 512P only supported with first_frame_image (I2V), not for T2V
    defaultResolution: '768P',
    aspectRatios: ['16:9', '9:16', '1:1'], // Common ratios
    defaultAspectRatio: '16:9',
    notes: '1080P supports only 6s duration. 6s supports 768P, 1080P. 10s supports 768P only. 512P is only available for image-to-video (I2V).',
  },
  'T2V-01-Director': {
    model: 'T2V-01-Director',
    durations: [6],
    defaultDuration: 6,
    resolutions: ['720P'],
    defaultResolution: '720P',
    aspectRatios: ['16:9', '9:16', '1:1'],
    defaultAspectRatio: '16:9',
    notes: 'Fixed 6s duration, 720P resolution only',
  },
};

/**
 * Get configuration for a specific model
 */
export function getVideoModelConfig(modelName: string): VideoModelConfig | null {
  return VIDEO_MODEL_CONFIGS[modelName] || null;
}

/**
 * Get available durations for a model
 */
export function getModelDurations(modelName: string): number[] {
  const config = getVideoModelConfig(modelName);
  return config?.durations || [5, 10]; // Default fallback
}

/**
 * Get default duration for a model
 */
export function getModelDefaultDuration(modelName: string): number {
  const config = getVideoModelConfig(modelName);
  return config?.defaultDuration || 5; // Default fallback
}

/**
 * Get available resolutions for a model
 */
export function getModelResolutions(modelName: string): string[] {
  const config = getVideoModelConfig(modelName);
  return config?.resolutions || ['720p']; // Default fallback
}

/**
 * Get default resolution for a model
 */
export function getModelDefaultResolution(modelName: string): string {
  const config = getVideoModelConfig(modelName);
  return config?.defaultResolution || '720p'; // Default fallback
}

/**
 * Get available aspect ratios for a model
 */
export function getModelAspectRatios(modelName: string): string[] {
  const config = getVideoModelConfig(modelName);
  return config?.aspectRatios || ['16:9', '9:16', '1:1']; // Default fallback
}

/**
 * Get default aspect ratio for a model
 */
export function getModelDefaultAspectRatio(modelName: string): string {
  const config = getVideoModelConfig(modelName);
  return config?.defaultAspectRatio || '16:9'; // Default fallback
}

/**
 * Check if a duration is valid for a model
 */
export function isValidDurationForModel(modelName: string, duration: number): boolean {
  const config = getVideoModelConfig(modelName);
  if (!config) return true; // Allow if no config found
  return config.durations.includes(duration);
}

/**
 * Check if a resolution is valid for a model
 */
export function isValidResolutionForModel(modelName: string, resolution: string): boolean {
  const config = getVideoModelConfig(modelName);
  if (!config) return true; // Allow if no config found
  return config.resolutions.includes(resolution);
}

/**
 * Check if an aspect ratio is valid for a model
 */
export function isValidAspectRatioForModel(modelName: string, aspectRatio: string): boolean {
  const config = getVideoModelConfig(modelName);
  if (!config) return true; // Allow if no config found
  return config.aspectRatios.includes(aspectRatio);
}

