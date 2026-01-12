
export type CapabilityType = 'IMAGE' | 'VIDEO' | 'TEXT' | 'PLUGIN' | 'MUSIC';

export interface ModelConstraint {
    id: string;
    name: string;
    supports: {
        textToContent: boolean;
        contentToContent: boolean; // img2img, vid2vid
    };
    resolutions: string[];
    aspectRatios: string[];
    maxBatch: number;
    isDefault: boolean;
    isHighRes: boolean;
    isTurbo: boolean;
}

export interface CapabilityDefinition {
    id: CapabilityType;
    models: Record<string, ModelConstraint>;
}

export const CAPABILITY_REGISTRY: Record<CapabilityType, CapabilityDefinition> = {
    IMAGE: {
        id: 'IMAGE',
        models: {
            'google-nano-banana': {
                id: 'google-nano-banana',
                name: 'Google Nano Banana',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1024', '2048'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
                maxBatch: 4,
                isDefault: true,
                isHighRes: false,
                isTurbo: true
            },
            'google-nano-banana-pro': {
                id: 'google-nano-banana-pro',
                name: 'Google nano banana pro',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1024', '2048'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 4,
                isDefault: false,
                isHighRes: false,
                isTurbo: true
            },
            'flux-2-pro': {
                id: 'flux-2-pro',
                name: 'Flux 2 pro',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1024', '2048', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16', '21:9', '9:21'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'seedream-v4': {
                id: 'seedream-v4',
                name: 'Seedream v4',
                supports: { textToContent: true, contentToContent: false }, // Only v4 4K in I2I list
                resolutions: ['1024', '2048', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 2,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'seedream-v4-4k': {
                id: 'seedream-v4-4k',
                name: 'Seedream v4 4K',
                supports: { textToContent: false, contentToContent: true },
                resolutions: ['4K'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 2,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'seedream-4.5': {
                id: 'seedream-4.5',
                name: 'Seedream 4.5',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1024', '2048', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 2,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'imagen-4-ultra': {
                id: 'imagen-4-ultra',
                name: 'Imagen 4 Ultra',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1024', '2048', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'imagen-4': {
                id: 'imagen-4',
                name: 'Imagen 4',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1024', '2048'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'imagen-4-fast': {
                id: 'imagen-4-fast',
                name: 'Imagen 4 Fast',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1024'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 4,
                isDefault: false,
                isHighRes: false,
                isTurbo: true
            },
            'flux-kontext-max': {
                id: 'flux-kontext-max',
                name: 'Flux Kontext Max',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1024', '2048'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'flux-kontext-pro': {
                id: 'flux-kontext-pro',
                name: 'Flux Kontext Pro',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1024', '2048'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'flux-pro-1.1-ultra': {
                id: 'flux-pro-1.1-ultra',
                name: 'Flux Pro 1.1 Ultra',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1024', '2048', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16', '21:9', '9:21'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'flux-pro-1.1': {
                id: 'flux-pro-1.1',
                name: 'Flux Pro 1.1',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1024', '2048'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'chatgpt-1.5': {
                id: 'chatgpt-1.5',
                name: 'ChatGPT 1.5',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1024', '1024x1792', '1792x1024'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'z-image-turbo': {
                id: 'z-image-turbo',
                name: 'Z Image Turbo',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['512', '768', '1024', '1280', '1440'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'],
                maxBatch: 4,
                isDefault: false,
                isHighRes: false,
                isTurbo: true
            },
            'p-image': {
                id: 'p-image',
                name: 'P-Image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['512', '768', '1024'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false
            }
        }
    },
    VIDEO: {
        id: 'VIDEO',
        models: {
            'seedance-1.0-pro': {
                id: 'seedance-1.0-pro',
                name: 'Seedance 1.0 Pro',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1024'],
                aspectRatios: ['16:9', '9:16'],
                maxBatch: 1,
                isDefault: true,
                isHighRes: false,
                isTurbo: false
            }
        }
    },
    TEXT: {
        id: 'TEXT',
        models: {
            'standard': {
                id: 'standard',
                name: 'Standard Text',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: true,
                isHighRes: false,
                isTurbo: false
            },
            'rich': {
                id: 'rich',
                name: 'Rich Text',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false
            }
        }
    },
    PLUGIN: {
        id: 'PLUGIN',
        models: {
            'upscale': {
                id: 'upscale',
                name: 'Upscale',
                supports: { textToContent: false, contentToContent: true },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'remove-bg': {
                id: 'remove-bg',
                name: 'Remove BG',
                supports: { textToContent: false, contentToContent: true },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false
            }
        }
    },
    MUSIC: {
        id: 'MUSIC',
        models: {
            'suno-v3': {
                id: 'suno-v3',
                name: 'Suno v3',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: true,
                isHighRes: true,
                isTurbo: false
            }
        }
    }
};
