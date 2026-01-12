
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
    parameters?: Record<string, string>; // Description of custom parameters
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
                resolutions: ['1024', '1440'], // Simplified standard
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
                resolutions: ['1K', '2K', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
                maxBatch: 4,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'flux-2-pro': {
                id: 'flux-2-pro',
                name: 'Flux 2 pro',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1K', '2K', '1024x2048'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9', '9:21', '16:10', '10:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'flux-kontext-max': {
                id: 'flux-kontext-max',
                name: 'Flux Kontext Max',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1K', '2K'],
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
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1K', '2K', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'seedream-v4-4k': {
                id: 'seedream-v4-4k',
                name: 'Seedream v4 4K',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1K', '2K', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'seedream-4.5': {
                id: 'seedream-4.5',
                name: 'Seedream 4.5',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1K', '2K', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'imagen-4': {
                id: 'imagen-4',
                name: 'Imagen 4',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1K', '2K'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'imagen-4-fast': {
                id: 'imagen-4-fast',
                name: 'Imagen 4 Fast',
                supports: { textToContent: true, contentToContent: false },
                resolutions: [], // Fixed: no resolution selector per ImageUploadModal
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 4,
                isDefault: false,
                isHighRes: false,
                isTurbo: true
            },
            'imagen-4-ultra': {
                id: 'imagen-4-ultra',
                name: 'Imagen 4 Ultra',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1K', '2K', '4K'],
                aspectRatios: ['1:1', '16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'flux-pro-1.1': {
                id: 'flux-pro-1.1',
                name: 'Flux Pro 1.1',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1K', '2K'],
                aspectRatios: ['1:1', '16:9', '9:16', '21:9', '9:21'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'flux-pro-1.1-ultra': {
                id: 'flux-pro-1.1-ultra',
                name: 'Flux Pro 1.1 Ultra',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1K', '2K'],
                aspectRatios: ['1:1', '16:9', '9:16', '21:9', '9:21'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'chatgpt-1.5': {
                id: 'chatgpt-1.5',
                name: 'ChatGPT 1.5',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['1024'], // Fixed default
                aspectRatios: ['1:1', '3:2', '2:3'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: false
            },
            'z-image-turbo': {
                id: 'z-image-turbo',
                name: 'Z Image Turbo',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1024', '1440'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
                maxBatch: 4,
                isDefault: false,
                isHighRes: false,
                isTurbo: true
            },
            'p-image': {
                id: 'p-image',
                name: 'P-Image',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['512', '768', '1024', '1280', '1440'],
                aspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
                maxBatch: 4,
                isDefault: false,
                isHighRes: false,
                isTurbo: true
            }
        }
    },
    VIDEO: {
        id: 'VIDEO',
        models: {
            'sora-2-pro': {
                id: 'sora-2-pro',
                name: 'Sora 2 Pro',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['720p', '1080p'],
                aspectRatios: ['16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'veo-3.1': {
                id: 'veo-3.1',
                name: 'Veo 3.1',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['720p', '1080p'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'veo-3.1-fast': {
                id: 'veo-3.1-fast',
                name: 'Veo 3.1 Fast',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['720p', '1080p'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: true
            },
            'kling-2.5-turbo-pro': {
                id: 'kling-2.5-turbo-pro',
                name: 'Kling 2.5 Turbo Pro',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['720p', '1080p'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: true
            },
            'seedance-1.0-pro': {
                id: 'seedance-1.0-pro',
                name: 'Seedance 1.0 Pro',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['480p', '720p', '1080p'],
                aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21'],
                maxBatch: 1,
                isDefault: true,
                isHighRes: true,
                isTurbo: false
            },
            'seedance-1.0-lite': {
                id: 'seedance-1.0-lite',
                name: 'Seedance 1.0 Lite',
                supports: { textToContent: true, contentToContent: true },
                resolutions: ['480p', '720p', '1080p'],
                aspectRatios: ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', '9:21'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: false,
                isTurbo: true
            },
            'pixverse-v5': {
                id: 'pixverse-v5',
                name: 'PixVerse v5',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['360p', '540p', '720p', '1080p'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'ltx-v2-pro': {
                id: 'ltx-v2-pro',
                name: 'LTX V2 Pro',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1080p', '1440p', '2160p'],
                aspectRatios: ['16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'ltx-v2-fast': {
                id: 'ltx-v2-fast',
                name: 'LTX V2 Fast',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['1080p', '1440p', '2160p'],
                aspectRatios: ['16:9', '9:16'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: true
            },
            'wan-2.5': {
                id: 'wan-2.5',
                name: 'WAN 2.5',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['480p', '720p', '1080p'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            'wan-2.5-fast': {
                id: 'wan-2.5-fast',
                name: 'WAN 2.5 Fast',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['480p', '720p', '1080p'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: true
            },
            'minimax-hailuo-02': {
                id: 'minimax-hailuo-02',
                name: 'MiniMax-Hailuo-02',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['768P', '1080P'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
                isHighRes: true,
                isTurbo: false
            },
            't2v-01-director': {
                id: 't2v-01-director',
                name: 'T2V-01-Director',
                supports: { textToContent: true, contentToContent: false },
                resolutions: ['720P'],
                aspectRatios: ['16:9', '9:16', '1:1'],
                maxBatch: 1,
                isDefault: false,
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
                isDefault: true,
                isHighRes: true,
                isTurbo: false
            },
            'crystal-upscaler': {
                id: 'crystal-upscaler',
                name: 'Crystal Upscaler',
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
                supports: { textToContent: true, contentToContent: false },
                resolutions: [],
                aspectRatios: ['16:9'], // Default for storyboard frames
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
                supports: { textToContent: true, contentToContent: false },
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
    }
};
