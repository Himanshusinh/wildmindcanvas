import { SemanticGoal, CanvasInstructionPlan } from './compiler/types';

export type CapabilityType = 'IMAGE' | 'VIDEO' | 'TEXT' | 'PLUGIN' | 'MUSIC' | 'BREADCRUMB' | 'UNKNOWN';

/**
 * The Schema the AI is allowed to output.
 * STRICTLY Semantic Intent only.
 */
export interface AbstractIntent extends SemanticGoal {
    explanation: string; // Mandatory conversational response
}

/**
 * The final payload consumed by the system.
 * Deterministic and fully validated.
 */
export interface ResolvedAction {
    intent: string; // Internal intent string for executor
    capability: CapabilityType;
    modelId: string;
    payload: any; // Final params like { resolution, aspectRatio, imageCount, etc. }
    requiresConfirmation: boolean;
    explanation: string;
}

// ❌ WORKFLOW / GRAPH intents are BANNED for LLM output.
// The LLM must output a Semantic Goal.

export interface WorkflowConnection {
    id: string;
    fromNodeId: string;
    toNodeId: string;
}

export interface WorkflowNode {
    id: string;
    capability: CapabilityType;
    model: string;
    position: { x: number; y: number };
    params: Record<string, any>;
    label?: string;
}

// @deprecated - Do not use for LLM output. Only for internal Executor state if needed.
export interface WorkflowIntent {
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
    explanation: string;
}

export type IntentActionType = 'SINGLE' | 'WORKFLOW';

export interface IntentAction {
    type?: IntentActionType; // Default to SINGLE for backward compatibility
    intent: string; // Used for SINGLE: 'GENERATE_IMAGE', etc.
    confidence: number;
    payload: any | WorkflowIntent; // Payload is generic for SINGLE, strict for WORKFLOW
    requiresConfirmation: boolean;
    explanation?: string;
}
