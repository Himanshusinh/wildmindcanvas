
/**
 * Canvas Instruction Plan - 4-Layer Architecture (Layer 2)
 * 
 * This file defines the strictly typed structure for communication between:
 * 1. The Instruction Compiler (Code)
 * 2. The Execution Engine (Canvas API)
 */

export type ActionType = 'CREATE_NODE' | 'CONNECT_SEQUENTIALLY' | 'GROUP_NODES' | 'APPLY_PLUGIN' | 'DELETE_NODE';

export interface CanvasAction {
    id: string; // Unique ID for this action step
    action: ActionType;
    explanation?: string; // Human-readable explanation for preview
}

export interface CreateNodeAction extends CanvasAction {
    action: 'CREATE_NODE';
    nodeType: 'image-generator' | 'video-generator' | 'text' | 'music-generator' | 'plugin';
    count: number; // How many nodes to create (e.g., 8 for a 60s video)
    configTemplate: {
        model: string;
        duration?: number;
        aspectRatio?: string;
        style?: string;
        prompt?: string;
        [key: string]: any;
    };
    batchConfigs?: Array<{
        prompt?: string;
        duration?: number;
        [key: string]: any;
    }>;
    inputFrom?: string; // ID or reference to a previous step's output
}

export interface ConnectSequentiallyAction extends CanvasAction {
    action: 'CONNECT_SEQUENTIALLY';
    fromStepId: string; // The step creating the source nodes
    toStepId?: string; // If omitted, usually implies self-connection within a sequence or to the next immediate step
}

export interface GroupNodesAction extends CanvasAction {
    action: 'GROUP_NODES';
    stepIds: string[]; // Which steps' output nodes to group
    groupType: 'video-sequence' | 'story-board' | 'logical-group';
    label: string;
}

export interface ApplyPluginAction extends CanvasAction {
    action: 'APPLY_PLUGIN';
    pluginId: string;
    targetStepId: string; // Apply plugin to output of this step
}

export interface DeleteNodeAction extends CanvasAction {
    action: 'DELETE_NODE';
    targetType: 'image' | 'video' | 'text' | 'music' | 'plugin' | 'all';
    targetIds?: string[]; // If empty, delete all of targetType
    pluginType?: string; // Optional, to specify subtype of plugin (e.g. 'upscale')
}

export type CanvasInstructionStep =
    | CreateNodeAction
    | ConnectSequentiallyAction
    | GroupNodesAction
    | ApplyPluginAction
    | DeleteNodeAction;


export type GoalType =
    | 'IMAGE_GENERATION'
    | 'STORY_VIDEO'
    | 'MUSIC_VIDEO'
    | 'MOTION_COMIC'
    | 'IMAGE_ANIMATE'
    | 'EXPLAIN_CANVAS'
    | 'MODIFY_EXISTING_FLOW'
    | 'CLARIFY'
    | 'DELETE_CONTENT'
    | 'PLUGIN_ACTION'
    | 'UNKNOWN';

export interface SemanticGoal {
    goalType: GoalType;
    topic?: string; // Can be used for pluginType if generic, or prompt context
    pluginType?: string; // Specific plugin name e.g. 'upscale', 'remove-bg'
    durationSeconds?: number;
    style?: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    count?: number;
    model?: string;
    needs: Array<'text' | 'image' | 'video' | 'audio' | 'motion' | 'plugin'>;
    references?: string[];
    explanation?: string; // Conversational response from LLM
    rawInput?: string;
}

export interface CanvasInstructionPlan {
    id: string;
    summary: string;
    steps: CanvasInstructionStep[];
    metadata: {
        sourceGoal: SemanticGoal;
        compiledAt: number;
    };
    requiresConfirmation: boolean;
}
