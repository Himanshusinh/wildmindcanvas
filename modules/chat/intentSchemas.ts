
export type CapabilityType = 'IMAGE' | 'VIDEO' | 'TEXT' | 'PLUGIN' | 'MUSIC' | 'CONNECT' | 'UNKNOWN';

/**
 * The Schema the AI is allowed to output.
 * Minimal and abstract.
 */
export interface AbstractIntent {
    capability: CapabilityType;
    goal: string; // e.g., "generate", "create", "upscale", "answer"
    prompt?: string;
    references?: string[]; // IDs of selected nodes
    preferences?: {
        quality?: 'high' | 'fast' | 'cheapest';
        aspectRatio?: string;
        count?: number;
        preferredModel?: string;
    };
    explanation?: string;
}

/**
 * The final payload consumed by the system.
 * Deterministic and fully validated.
 */
export interface ResolvedAction {
    intent: string; // Internal intent string for executor
    capability: CapabilityType;
    modelId: string;
    config: any; // Final params like { resolution, aspectRatio, imageCount, etc. }
    requiresConfirmation: boolean;
    explanation: string;
}

export interface IntentAction {
    intent: string;
    confidence: number;
    payload: any;
    requiresConfirmation: boolean;
    explanation?: string;
}
