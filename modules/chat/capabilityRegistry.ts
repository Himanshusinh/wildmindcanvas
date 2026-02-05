
export type CapabilityType = 'IMAGE' | 'VIDEO' | 'TEXT' | 'PLUGIN' | 'MUSIC' | 'WORKFLOW';

export interface ModelConstraint {
    id: string;
    name: string;
    inputType: 'text' | 'image' | 'video' | 'audio' | 'none'; // Primary input required
    outputType: 'image' | 'video' | 'audio' | 'text';
    supports: {
        textToContent: boolean;
        contentToContent: boolean; // img2img, vid2vid
        multimodal?: boolean; // Can accept text + image/audio
    };
    resolutions: string[];
    aspectRatios: string[];
    maxBatch: number;
    isDefault: boolean;
    isHighRes: boolean;
    isTurbo: boolean;
    contextWindow?: number; // Tokens or Seconds (Deprecated in favor of temporal)
    temporal?: {
        maxInputSeconds?: number;
        maxOutputSeconds: number;
        stitchable: boolean;
    };
    contracts?: {
        accepts: Array<'text' | 'image' | 'video' | 'audio'>;
        produces: Array<'text' | 'image' | 'video' | 'audio'>;
        requires?: Array<'image' | 'audio'>; // Hard requirement
        optional?: Array<'image' | 'audio' | 'video'>; // Optional input
    };
    strengths?: string[]; // Keywords: "realistic", "anime", "fast", "3d"
    parameters?: Record<string, string>; // Description of custom parameters
    qualityTier?: string; // e.g. 'cinematic', 'character-consistency'
}

export interface CapabilityDefinition {
    id: CapabilityType;
    models: Record<string, ModelConstraint>;
}

export const CAPABILITY_REGISTRY: Record<CapabilityType, CapabilityDefinition> = {
    IMAGE: {
        id: 'IMAGE',
        models: {
            'z-image-turbo': {
                id: 'z-image-turbo',
                name: 'Z Image Turbo',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1024'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 4,
                isDefault: false,
                isHighRes: false,
                isTurbo: true,
                strengths: ['fast', 'turbo', 'draft'],
                contracts: {
                    accepts: ['text', 'image'],
                    produces: ['image']
                }
            },
            'google-nano-banana': {
                id: 'google-nano-banana',
                name: 'Google Nano Banana',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1024', '1440'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
                maxBatch: 4,
                isDefault: true,
                isHighRes: false,
                isTurbo: true,
                strengths: ['fast', 'sketch', 'draft']
            },
            'google-nano-banana-pro': {
                id: 'google-nano-banana-pro',
                name: 'Google nano banana pro',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1K', '2K', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
                maxBatch: 4,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                strengths: ['balanced', 'standard']
            },
            'flux-2-pro': {
                id: 'flux-2-pro',
                name: 'Flux 2 pro',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1K', '2K', '1024x2048'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9', '9:21', '16:10', '10:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                strengths: ['quality', 'rich', 'detailed']
            },
            'flux-kontext-max': {
                id: 'flux-kontext-max',
                name: 'Flux Kontext Max',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1K', '2K'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                strengths: ['context', 'large-scale']
            },
            'flux-kontext-pro': {
                id: 'flux-kontext-pro',
                name: 'Flux Kontext Pro',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1K', '2K'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'seedream-v4': {
                id: 'seedream-v4',
                name: 'Seedream v4',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1K', '2K', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                strengths: ['artistic', 'surreal', 'dreamy']
            },
            'seedream-v4-4k': {
                id: 'seedream-v4-4k',
                name: 'Seedream v4 4K',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1K', '2K', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                contracts: {
                    accepts: ['text'],
                    produces: ['image']
                },
                strengths: ['4k', 'ultra-hd']
            },
            'flux-1.1-pro': {
                id: 'flux-1.1-pro',
                name: 'Flux 1.1 Pro',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1024x1024', '1024x768', '768x1024'],
                aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
                maxBatch: 4,
                isDefault: true,
                isHighRes: true,
                isTurbo: false,
                contracts: {
                    accepts: ['text'],
                    produces: ['image']
                },
                strengths: ['realistic', 'prompt-adherence', 'text-rendering'],
                qualityTier: 'standard'
            },
            'midjourney-v6': {
                id: 'midjourney-v6',
                name: 'Midjourney v6',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1024x1024'],
                aspectRatios: ['1:1', '16:9', '9:16', '2:3', '3:2'],
                maxBatch: 4,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                contracts: {
                    accepts: ['text'],
                    produces: ['image']
                },
                strengths: ['artistic', 'lighting', 'composition'],
                qualityTier: 'cinematic'
            },
            'seedream-4.5': {
                id: 'seedream-4.5',
                name: 'Seedream 4.5',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1K', '2K', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                contracts: {
                    accepts: ['text'],
                    produces: ['image']
                },
                strengths: ['latest', 'vibrant']
            },
            'imagen-4': {
                id: 'imagen-4',
                name: 'Imagen 4',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1K', '2K'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                contracts: {
                    accepts: ['text'],
                    produces: ['image']
                },
                strengths: ['photorealistic', 'google']
            },
            'imagen-4-fast': {
                id: 'imagen-4-fast',
                name: 'Imagen 4 Fast',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 4,
                isDefault: false,
                isHighRes: false,
                isTurbo: true,
                contracts: {
                    accepts: ['text'],
                    produces: ['image']
                },
                strengths: ['speed', 'quick']
            },
            'imagen-4-ultra': {
                id: 'imagen-4-ultra',
                name: 'Imagen 4 Ultra',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1K', '2K', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                contracts: {
                    accepts: ['text'],
                    produces: ['image']
                },
                strengths: ['ultra-quality', 'premium']
            },
            'flux-pro-1.1': {
                id: 'flux-pro-1.1',
                name: 'Flux Pro 1.1',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1K', '2K'],
                aspectRatios: ['1:1', '16:9', '9:16', '21:9', '9:21'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                contracts: {
                    accepts: ['text'],
                    produces: ['image']
                }
            },
            'flux-pro-1.1-ultra': {
                id: 'flux-pro-1.1-ultra',
                name: 'Flux Pro 1.1 Ultra',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1K', '2K'],
                aspectRatios: ['1:1', '16:9', '9:16', '21:9', '9:21'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                contracts: {
                    accepts: ['text'],
                    produces: ['image']
                }
            },
            'chatgpt-1.5': {
                id: 'chatgpt-1.5',
                name: 'ChatGPT 1.5',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1024'],
                aspectRatios: ['1:1', '3:2', '2:3'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false,
                contracts: {
                    accepts: ['text'],
                    produces: ['image']
                },
                strengths: ['dalle', 'conversational']
            },
            'p-image': {
                id: 'p-image',
                name: 'P-Image',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['512', '768', '1024', '1280', '1440'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
                maxBatch: 4,
                isDefault: false,
                isHighRes: false,
                isTurbo: true,
                contracts: {
                    accepts: ['text'],
                    produces: ['image']
                }
            }
        }
    },
    VIDEO: {
        id: 'VIDEO',
        models: {
            'sora-2-pro': {
                id: 'sora-2-pro',
                name: 'Sora 2 Pro',
                inputType: 'text',
                outputType: 'video',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['720p', '1080p'],
                aspectRatios: ['16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                contextWindow: 60,
                temporal: {
                    maxInputSeconds: 60,
                    maxOutputSeconds: 20,
                    stitchable: true
                },
                contracts: {
                    accepts: ['text'],
                    produces: ['video']
                },
                strengths: ['realistic', 'complex-motion'],
                qualityTier: 'realistic'
            },
            'veo-3.1': {
                id: 'veo-3.1',
                name: 'Veo 3.1',
                inputType: 'text',
                outputType: 'video',
                supports: { textToContent: true, contentToContent: true, multimodal: true },
                resolutions: ['720p', '1080p'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isHighRes: true,
                isTurbo: false,
                isDefault: true,
                contextWindow: 60,
                temporal: {
                    maxInputSeconds: 60,
                    maxOutputSeconds: 8,
                    stitchable: true
                },
                contracts: {
                    accepts: ['text', 'image', 'video'],
                    produces: ['video'],
                    optional: ['image', 'video']
                },
                strengths: ['realistic', 'cinematic'],
                qualityTier: 'cinematic'
            },
            'veo-3.1-fast': {
                id: 'veo-3.1-fast',
                name: 'Veo 3.1 Fast',
                inputType: 'text',
                outputType: 'video',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['720p', '1080p'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: true,
                temporal: {
                    maxInputSeconds: 60,
                    maxOutputSeconds: 8, // Supports 4, 6, 8 seconds for image-to-video
                    stitchable: true
                },
                contracts: {
                    accepts: ['text', 'image', 'video'],
                    produces: ['video'],
                    optional: ['image', 'video']
                },
                qualityTier: 'fast'
            },
            'kling-2.5-turbo-pro': {
                id: 'kling-2.5-turbo-pro',
                name: 'Kling 2.5 Turbo Pro',
                inputType: 'text',
                outputType: 'video',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['720p', '1080p'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: true,
                contextWindow: 5,
                temporal: {
                    maxInputSeconds: 5,
                    maxOutputSeconds: 5,
                    stitchable: true
                },
                contracts: {
                    accepts: ['text', 'image'],
                    produces: ['video'],
                    optional: ['image']
                },
                strengths: ['fast', 'motion'],
                qualityTier: 'fast'
            },
            'seedance-1.0-pro': {
                id: 'seedance-1.0-pro',
                name: 'Seedance 1.0 Pro',
                inputType: 'image',
                outputType: 'video',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['480p', '720p', '1080p'],
                aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                contextWindow: 4,
                temporal: {
                    maxInputSeconds: 12,
                    maxOutputSeconds: 12, // Supports 2-12 seconds for image-to-video
                    stitchable: true
                },
                contracts: {
                    accepts: ['image', 'audio'],
                    produces: ['video'],
                    requires: ['image']
                },
                strengths: ['animation', 'dance', 'character-consistency'],
                qualityTier: 'character-consistency'
            },
            'seedance-1.0-lite': {
                id: 'seedance-1.0-lite',
                name: 'Seedance 1.0 Lite',
                inputType: 'image',
                outputType: 'video',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['480p', '720p', '1080p'],
                aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: true,
                temporal: {
                    maxInputSeconds: 12,
                    maxOutputSeconds: 12, // Supports 2-12 seconds for image-to-video
                    stitchable: true
                },
                contracts: {
                    accepts: ['image', 'text'],
                    produces: ['video'],
                    requires: ['image']
                }
            },
            'pixverse-v5': {
                id: 'pixverse-v5',
                name: 'PixVerse v5',
                inputType: 'text',
                outputType: 'video',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['360p', '540p', '720p', '1080p'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                contextWindow: 5,
                temporal: {
                    maxInputSeconds: 5,
                    maxOutputSeconds: 5,
                    stitchable: true
                },
                contracts: {
                    accepts: ['text'],
                    produces: ['video']
                }
            },
            'ltx-v2-pro': {
                id: 'ltx-v2-pro',
                name: 'LTX V2 Pro',
                inputType: 'text',
                outputType: 'video',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1080p', '1440p', '2160p'],
                aspectRatios: ['16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                temporal: {
                    maxInputSeconds: 10,
                    maxOutputSeconds: 5,
                    stitchable: true
                },
                contracts: {
                    accepts: ['text'],
                    produces: ['video']
                }
            },
            'ltx-v2-fast': {
                id: 'ltx-v2-fast',
                name: 'LTX V2 Fast',
                inputType: 'text',
                outputType: 'video',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1080p', '1440p', '2160p'],
                aspectRatios: ['16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: true,
                temporal: {
                    maxInputSeconds: 10,
                    maxOutputSeconds: 5,
                    stitchable: true
                },
                contracts: {
                    accepts: ['text'],
                    produces: ['video']
                }
            },
            'wan-2.5': {
                id: 'wan-2.5',
                name: 'WAN 2.5',
                inputType: 'image',
                outputType: 'video',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['480p', '720p', '1080p'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                temporal: {
                    maxInputSeconds: 5,
                    maxOutputSeconds: 5,
                    stitchable: true
                },
                contracts: {
                    accepts: ['image', 'text'],
                    produces: ['video'],
                    requires: ['image']
                }
            },
            'wan-2.5-fast': {
                id: 'wan-2.5-fast',
                name: 'WAN 2.5 Fast',
                inputType: 'image',
                outputType: 'video',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['480p', '720p', '1080p'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: true,
                temporal: {
                    maxInputSeconds: 5,
                    maxOutputSeconds: 5,
                    stitchable: true
                },
                contracts: {
                    accepts: ['image', 'text'],
                    produces: ['video'],
                    requires: ['image']
                }
            },
            'minimax-hailuo-02': {
                id: 'minimax-hailuo-02',
                name: 'MiniMax-Hailuo-02',
                inputType: 'text',
                outputType: 'video',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['768P', '1080P'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                temporal: {
                    maxInputSeconds: 6,
                    maxOutputSeconds: 6,
                    stitchable: true
                },
                contracts: {
                    accepts: ['text'],
                    produces: ['video']
                }
            },
            't2v-01-director': {
                id: 't2v-01-director',
                name: 'T2V-01-Director',
                inputType: 'text',
                outputType: 'video',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['720P'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false,
                strengths: ['camera-control', 'director-mode'],
                temporal: {
                    maxInputSeconds: 5,
                    maxOutputSeconds: 5,
                    stitchable: false // Director modes usually standalone
                },
                contracts: {
                    accepts: ['text'],
                    produces: ['video']
                }
            }
        }
    },
    TEXT: {
        id: 'TEXT',
        models: {
            'udio-v2': {
                id: 'udio-v2',
                name: 'Udio v2',
                inputType: 'text',
                outputType: 'audio',
                supports: { textToContent: true, contentToContent: true },
                maxBatch: 1,
                isDefault: true,
                isHighRes: true,
                isTurbo: false,
                resolutions: [],
                aspectRatios: [],
                contracts: {
                    accepts: ['text'],
                    produces: ['audio']
                },
                qualityTier: 'high-fidelity'
            },
            'suno-v3.5': {
                id: 'suno-v3.5',
                name: 'Suno v3.5',
                inputType: 'text',
                outputType: 'audio',
                supports: { textToContent: true, contentToContent: true },
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: true,
                resolutions: [],
                aspectRatios: [],
                contracts: {
                    accepts: ['text'],
                    produces: ['audio']
                },
                qualityTier: 'fast'
            },
            'standard': {
                id: 'standard',
                name: 'Standard Text',
                inputType: 'none',
                outputType: 'text',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: true,
                isHighRes: false,
                isTurbo: false,
                contracts: {
                    accepts: ['text'],
                    produces: ['text']
                }
            },
            'rich': {
                id: 'rich',
                name: 'Rich Text',
                inputType: 'none',
                outputType: 'text',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false,
                contracts: {
                    accepts: ['text'],
                    produces: ['text']
                }
            }
        }
    },
    PLUGIN: {
        id: 'PLUGIN',
        models: {
            'upscale': {
                id: 'upscale',
                name: 'Crystal Upscaler',
                inputType: 'image', // Requires image input
                outputType: 'image',
                supports: { textToContent: false, contentToContent: true },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: true,
                isHighRes: true,
                isTurbo: false
            },
            'crystal-upscaler': {
                id: 'crystal-upscaler',
                name: 'Crystal Upscaler',
                inputType: 'image',
                outputType: 'image',
                supports: { textToContent: false, contentToContent: true },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'topaz-upscaler': {
                id: 'topaz-upscaler',
                name: 'Topaz Upscaler',
                inputType: 'image',
                outputType: 'image',
                supports: { textToContent: false, contentToContent: true },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'real-esrgan': {
                id: 'real-esrgan',
                name: 'Real-ESRGAN',
                inputType: 'image',
                outputType: 'image',
                supports: { textToContent: false, contentToContent: true },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                parameters: {
                    faceEnhance: 'boolean (default false)'
                }
            },
            'remove-bg': {
                id: 'remove-bg',
                name: 'Remove BG',
                inputType: 'image',
                outputType: 'image',
                supports: { textToContent: false, contentToContent: true },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false,
                parameters: {
                    backgroundType: 'string (green, rgba (transparent), white, blue, overlay, map)',
                    scaleValue: 'number (default 0.5)'
                }
            },
            'multiangle-camera': {
                id: 'multiangle-camera',
                name: 'Multiangle Camera',
                inputType: 'image',
                outputType: 'image',
                supports: { textToContent: false, contentToContent: true },
                resolutions: [],
                aspectRatios: ['match_input_image', '1:1', '16:9', '9:16', '4:3', '3:4'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                parameters: {
                    prompt: 'string (optional)',
                    loraScale: 'number 0-4 (default 1.25)',
                    aspectRatio: 'string (match_input_image, 1:1, etc)',
                    moveForward: 'number 0-10 (default 0)',
                    verticalTilt: 'number -1 to 1 (default 0)',
                    rotateDegrees: 'number -90 to 90 (default 0)',
                    useWideAngle: 'boolean (default false)'
                }
            },
            'erase-replace': {
                id: 'erase-replace',
                name: 'Erase / Replace',
                inputType: 'image',
                outputType: 'image',
                supports: { textToContent: false, contentToContent: true },
                resolutions: [],
                aspectRatios: ['1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                parameters: {
                    prompt: 'string (optional - for replacement)'
                }
            },
            'expand-image': {
                id: 'expand-image',
                name: 'Expand Image',
                inputType: 'image',
                outputType: 'image',
                supports: { textToContent: false, contentToContent: true },
                resolutions: [],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', 'custom'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                parameters: {
                    prompt: 'string (optional)',
                    aspectRatio: 'string (1:1, 16:9, etc or custom)'
                }
            },
            'vectorize-image': {
                id: 'vectorize-image',
                name: 'Vectorize Image',
                inputType: 'image',
                outputType: 'image',
                supports: { textToContent: false, contentToContent: true },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false,
                parameters: {
                    mode: 'string (simple, Detailed)'
                }
            },
            'next-scene': {
                id: 'next-scene',
                name: 'Next Scene',
                inputType: 'image',
                outputType: 'image',
                supports: { textToContent: false, contentToContent: true },
                resolutions: [],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                parameters: {
                    mode: 'string (scene [Single], nextscene [MultiScene], multiangle)',
                    prompt: 'string (optional)',
                    aspectRatio: 'string (1:1, 16:9, etc)',
                    loraScale: 'number 0-4 (default 1.15)',
                    trueGuidanceScale: 'number 0-10',
                    category: 'string (human, product - for multiangle)',
                    model: 'string (Google nano banana pro, Seedream 4.5, P-Image - for multiangle)',
                    resolution: 'string (1K, 2K, 4K - for multiangle)'
                }
            },
            'storyboard-generator': {
                id: 'storyboard-generator',
                name: 'Storyboard Generator',
                inputType: 'text', // Takes script text
                outputType: 'image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: ['16:9'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false,
                parameters: {
                    characterInput: 'string (optional)',
                    characterNames: 'string (optional)',
                    backgroundDescription: 'string (optional)',
                    specialRequest: 'string (optional)',
                    scriptText: 'string (required for generation - the story script)'
                }
            },
            'compare-image-models': {
                id: 'compare-image-models',
                name: 'Compare Models',
                inputType: 'text',
                outputType: 'image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: ['1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false,
                parameters: {
                    prompt: 'string (required)',
                    models: 'string (comma-separated list: Google Nano Banana, Flux 2 pro, Seedream v4, Imagen 4 Ultra, Runway Gen4 Image, P-Image)'
                }
            }
        }
    },
    MUSIC: {
        id: 'MUSIC',
        models: {
            'music-generation': {
                id: 'music-generation',
                name: 'Music Generation (MiniMax)',
                inputType: 'text',
                outputType: 'audio',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: true,
                isHighRes: true,
                isTurbo: false,
                parameters: {
                    prompt: 'string (description of music)',
                    lyricsPrompt: 'string (optional lyrics)',
                    isLyricsDisabled: 'boolean',
                    model: 'string (MiniMax Music 2)'
                }
            },
            'voice-generation-elevenlabs': {
                id: 'voice-generation-elevenlabs',
                name: 'Voice Generation (ElevenLabs)',
                inputType: 'text',
                outputType: 'audio',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false,
                parameters: {
                    prompt: 'string (text to speak)',
                    voiceId: 'string (optional)',
                    stability: 'number 0-1',
                    similarityBoost: 'number 0-1',
                    style: 'number 0-1',
                    speed: 'number 0.5-2',
                    model: 'string (ElevenLabs TTS v3)'
                }
            },
            'voice-generation-chatterbox': {
                id: 'voice-generation-chatterbox',
                name: 'Voice Generation (Chatterbox)',
                inputType: 'text',
                outputType: 'audio',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false,
                parameters: {
                    prompt: 'string (text to speak)',
                    language: 'string (mapped to voiceId)',
                    exaggeration: 'number 0-2',
                    temperature: 'number 0-2',
                    cfgScale: 'number 0-1',
                    model: 'string (Chatterbox Multilingual)'
                }
            },
            'voice-generation-maya': {
                id: 'voice-generation-maya',
                name: 'Voice Generation (Maya)',
                inputType: 'text',
                outputType: 'audio',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false,
                parameters: {
                    prompt: 'string (text to speak)',
                    voicePrompt: 'string (description of voice)',
                    temperature: 'number 0-2',
                    topP: 'number 0-1',
                    maxTokens: 'number 1-4000',
                    repetitionPenalty: 'number 1-2',
                    model: 'string (Maya TTS)'
                }
            },
            'dialogue-generation': {
                id: 'dialogue-generation',
                name: 'Dialogue Generation',
                inputType: 'text',
                outputType: 'audio',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false,
                parameters: {
                    dialogueInputs: 'array (objects with speaker and text)',
                    stability: 'number 0-1',
                    useSpeakerBoost: 'boolean',
                    model: 'string (ElevenLabs Dialogue V3)'
                }
            },
            'sfx-generation': {
                id: 'sfx-generation',
                name: 'Sound Effects (SFX)',
                inputType: 'text',
                outputType: 'audio',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false,
                parameters: {
                    prompt: 'string (description of sound)',
                    duration: 'number (seconds)',
                    promptInfluence: 'number',
                    loop: 'boolean',
                    model: 'string (ElevenLabs Sound Effects)'
                }
            },
            'voice-cloning': {
                id: 'voice-cloning',
                name: 'Voice Cloning',
                inputType: 'audio', // Requires reference audio
                outputType: 'audio',
                supports: { textToContent: true, contentToContent: true },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false,
                parameters: {
                    prompt: 'string (text to speak with cloned voice)',
                    voicePrompt: 'string (reference audio or description)',
                    model: 'string (CloneGen, VoiceCraft, Audio-LM)'
                }
            }
        }
    },
    WORKFLOW: {
        id: 'WORKFLOW',
        models: {
            'standard': {
                id: 'standard',
                name: 'Standard Workflow',
                inputType: 'text',
                outputType: 'image', // Generic, can be anything
                supports: { textToContent: true, contentToContent: true },
                resolutions: [],
                aspectRatios: [],
                maxBatch: 1,
                isDefault: true,
                isHighRes: false,
                isTurbo: false
            }
        }
    }
};
