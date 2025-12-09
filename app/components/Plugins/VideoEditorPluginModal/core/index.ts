// ============================================
// Core Engine - Main Entry Point
// Re-exports all core modules for easy import
// ============================================

// Types
export * from './types/engine';

// Engine
export { hardwareAccel, HardwareAccel } from './engine/HardwareAccel';

// Compositor
export { gpuCompositor, GPUCompositor } from './compositor/GPUCompositor';
export { frameCache, FrameCache } from './compositor/FrameCache';

// Playback
export { playbackController, PlaybackController } from './PlaybackController';
export type { PlaybackEvent, PlaybackEventType } from './PlaybackController';

// Adapters
export {
    timelineItemToCompositorLayer,
    transitionToGPUParams,
    getVisibleLayersAtTime,
    calculateMediaTime,
    isItemVisibleAtTime,
    getItemsInBufferWindow,
} from './adapters';

// Export
export { exportEngine, ExportEngine, type ExportMode } from './export/ExportEngine';
export { ffmpegExportService } from './export/FFmpegExportService';
export { deviceDetector, DeviceDetector } from './export/DeviceDetector';
export type { ExportSettings, ExportProgress, DeviceCapabilities } from './types/export';
export { RESOLUTION_PRESETS, BITRATE_CONFIGS, DEFAULT_EXPORT_SETTINGS } from './types/export';

/**
 * Initialize the core engine
 * Call this once when the video editor mounts
 */
export async function initializeEngine(): Promise<{
    success: boolean;
    gpuName: string;
    webgl2: boolean;
    webgpu: boolean;
    can8K: boolean;
}> {
    const { hardwareAccel } = await import('./engine/HardwareAccel');

    try {
        const capabilities = await hardwareAccel.initialize();

        return {
            success: true,
            gpuName: capabilities.name,
            webgl2: capabilities.supportsWebGL2,
            webgpu: capabilities.supportsWebGPU,
            can8K: hardwareAccel.canHandle8K(),
        };
    } catch (error) {
        console.error('[CoreEngine] Initialization failed:', error);
        return {
            success: false,
            gpuName: 'Unknown',
            webgl2: false,
            webgpu: false,
            can8K: false,
        };
    }
}
