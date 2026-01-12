
import { v4 as uuidv4 } from 'uuid';
import {
    SemanticGoal,
    CanvasInstructionPlan,
    CanvasInstructionStep,
    CreateNodeAction,
    ConnectSequentiallyAction,
    GroupNodesAction,
    ActionType
} from './types';
import { CAPABILITY_REGISTRY, ModelConstraint } from '../capabilityRegistry';

// Helper to create a unique ID
const generateId = () => uuidv4();

export function compileGoalToPlan(goal: SemanticGoal): CanvasInstructionPlan {
    const planId = generateId();
    const steps: CanvasInstructionStep[] = [];
    const summary = `Compiled plan for ${goal.goalType}`;

    // Select Strategy based on Goal Type (Compiler-Driven Branching)
    switch (goal.goalType) {
        case 'VIDEO_REQUEST':
            compileVideoRequest(goal, steps);
            break;
        case 'MUSIC_VIDEO':
            compileMusicVideo(goal, steps);
            break;
        case 'MOTION_COMIC':
            // Placeholder for future implementation
            break;
        default:
            // Fallback: Try to map 'needs' to a linear pipeline
            // e.g. ["text", "image"] -> Text -> Image
            // For now, minimal implementation
            break;
    }

    return {
        id: planId,
        planType: 'CANVAS_PIPELINE',
        summary,
        steps,
        metadata: {
            sourceGoal: goal,
            compiledAt: Date.now()
        }
    };
}

/**
 * Strategy: VIDEO_REQUEST
 * Linear: Video Generation (Stitched)
 */
function compileVideoRequest(goal: SemanticGoal, steps: CanvasInstructionStep[]) {
    // 1. Resolve Model
    // Logic: Look for video model with contracts.produces = ['video']
    // Validated against constraints (e.g. style)
    // Simplify: Default to 'veo-3.1' for now or find best fit from registry
    // In a real compiler, we'd have a 'resolveModel(capability, constraints)' helper.

    // Hardcoded logic for this sprint as per "Deterministic" requirement
    const modelId = 'veo-3.1';
    const model = CAPABILITY_REGISTRY.VIDEO.models[modelId] as ModelConstraint;

    if (!model) throw new Error(`Compiler Error: Model ${modelId} not found.`);

    // 2. Calculate Segments (The "Planner" Logic)
    const duration = goal.constraints?.duration || 10; // Default 10s
    const maxOutput = model.temporal?.maxOutputSeconds || 4;
    const segmentCount = Math.ceil(duration / maxOutput);

    // 3. Create CREATE_NODE instruction
    const videoStepId = generateId();
    const createAction: CreateNodeAction = {
        id: videoStepId,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count: segmentCount,
        configTemplate: {
            model: model.name, // Executor expects Name? Or ID? Let's use Name to be safe with existing executor.
            duration: maxOutput, // Base duration per node (last one might be trimmed by executor or here?) 
            // Better to let Executor handle exact time? 
            // Or strict: pass array of durations?
            // "configTemplate" implies all nodes get same config.
            // If we need variable durations (last segment), we might need a more advanced "VideoSequenceAction"
            // OR the executor handles "totalDuration" and splits it.
            // Let's stick to the "Planner" logic: 
            // The compiler outputs "count" and "config". 
            // If the last node needs to be shorter, the Executor needs to know the TOTAL duration and handle the trim?
            // OR the compiler should output specific configs for each node.
            // Existing "CanvasInstructionPlan" has "count".
            // Let's rely on "duration" in config as the MAX duration, and let executor clamp the last one?
            // Or add "totalDuration" to the configTemplate so executor knows the goal.
            totalDuration: duration,
            aspectRatio: goal.constraints?.aspectRatio || '16:9',
            prompt: goal.constraints?.topic || "Video"
        }
    };
    steps.push(createAction);

    // 4. Create CONNECT instruction
    if (segmentCount > 1) {
        steps.push({
            id: generateId(),
            action: 'CONNECT_SEQUENTIALLY',
            fromStepId: videoStepId
        });
    }

    // 5. Create GROUP instruction
    steps.push({
        id: generateId(),
        action: 'GROUP_NODES',
        stepIds: [videoStepId],
        groupType: 'video-sequence',
        label: `${goal.constraints?.topic || 'Video'} (${duration}s)`
    });
}

/**
 * Strategy: MUSIC_VIDEO
 * Parallel: Music || Image -> Video
 */
function compileMusicVideo(goal: SemanticGoal, steps: CanvasInstructionStep[]) {
    // 1. Music Generation
    const musicStepId = generateId();
    steps.push({
        id: musicStepId,
        action: 'CREATE_NODE',
        nodeType: 'music-generator',
        count: 1,
        configTemplate: {
            model: 'udio-v2', // Default high quality
            prompt: `Music about ${goal.constraints?.topic}`
        }
    });

    // 2. Image Generation (Parallel)
    const imageStepId = generateId();
    steps.push({
        id: imageStepId,
        action: 'CREATE_NODE',
        nodeType: 'image-generator',
        count: 1, // Or more?
        configTemplate: {
            model: 'midjourney-v6',
            prompt: `Visuals for ${goal.constraints?.topic}`
        }
    });

    // 3. Video Generation (Dependent)
    // Needs audio inputs from Music and image input from Image
    const videoStepId = generateId();
    steps.push({
        id: videoStepId,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count: 1,
        configTemplate: {
            model: 'veo-3.1',
            prompt: 'Music Video animation'
        },
        inputFrom: [musicStepId, imageStepId].join(',') // Rough way to signal multiple inputs? 
        // Our type definition says "inputFrom?: string". 
        // We might need to handle multiple inputs in the Executor.
        // For now, let's assume the executor can look up outputs from these steps.
    });

    // 4. Connections
    steps.push({
        id: generateId(),
        action: 'CONNECT_SEQUENTIALLY', // This type implies A -> B. 
        // We need explicit connections: Music -> Video, Image -> Video.
        // 'CONNECT_SEQUENTIALLY' might not be enough for this topology.
        // We might need 'CONNECT_NODES' { from: step, to: step }
        fromStepId: musicStepId,
        toStepId: videoStepId
    });
    steps.push({
        id: generateId(),
        action: 'CONNECT_SEQUENTIALLY',
        fromStepId: imageStepId,
        toStepId: videoStepId
    });
}
