
/**
 * Canvas Instruction Plan - 4-Layer Architecture (Layer 2)
 * 
 * This file defines the strictly typed structure for communication between:
 * 1. The Instruction Compiler (Code)
 * 2. The Execution Engine (Canvas API)
 */

export type ActionType = 'CREATE_NODE' | 'CONNECT_SEQUENTIALLY' | 'GROUP_NODES' | 'APPLY_PLUGIN';

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

export type CanvasInstructionStep =
    | CreateNodeAction
    | ConnectSequentiallyAction
    | GroupNodesAction
    | ApplyPluginAction;

export type GoalType = 'VIDEO_REQUEST' | 'MUSIC_VIDEO' | 'MOTION_COMIC' | 'STORY_BOARD' | 'IMAGE_GENERATION' | 'UNKNOWN';

export interface SemanticGoal {
    goalType: GoalType;
    needs: Array<'text' | 'image' | 'video' | 'audio' | 'motion'>;
    constraints?: {
        duration?: number;
        style?: string;
        mood?: string;
        aspectRatio?: string;
        strategy?: 'SCRIPT_TO_SCENES' | 'KEYFRAME_I2V' | 'FRAME_LOCK' | 'CHARACTER_SHEET' | 'AUDIO_MONTAGE';
        scenes?: Array<{
            prompt: string;
            duration: number;
        }>;
        [key: string]: any; // Allow extracted entities like 'topic'
    };
    rawInput?: string;
}

export interface CanvasInstructionPlan {
    id: string;
    planType: 'CANVAS_PIPELINE' | 'SINGLE_ACTION';
    summary: string;
    steps: CanvasInstructionStep[];
    metadata?: {
        sourceGoal?: SemanticGoal; // Reference to Semantic Goal
        compiledAt: number;
    };
}
