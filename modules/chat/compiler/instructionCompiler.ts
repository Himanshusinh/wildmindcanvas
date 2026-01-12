
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
    const strategy = goal.constraints?.strategy || 'SCRIPT_TO_SCENES';
    const duration = goal.constraints?.duration || 10;
    const topic = goal.constraints?.topic || "Video";

    switch (strategy) {
        case 'SCRIPT_TO_SCENES':
            compileScriptToScenes(goal, steps);
            break;
        case 'KEYFRAME_I2V':
            compileKeyframeI2V(goal, steps);
            break;
        case 'AUDIO_MONTAGE':
            compileAudioFirst(goal, steps);
            break;
        case 'CHARACTER_SHEET':
            compileCharacterSheet(goal, steps);
            break;
        case 'FRAME_LOCK':
        default:
            compileStandardVideo(goal, steps);
            break;
    }
}

function compileStandardVideo(goal: SemanticGoal, steps: CanvasInstructionStep[]) {
    const modelId = 'veo-3.1';
    const model = CAPABILITY_REGISTRY.VIDEO.models[modelId] as ModelConstraint;
    const duration = goal.constraints?.duration || 10;
    const maxOutput = model.temporal?.maxOutputSeconds || 4;

    const videoStepId = generateId();
    const scenes = goal.constraints?.scenes;
    const segmentCount = scenes ? scenes.length : Math.ceil(duration / maxOutput);

    steps.push({
        id: videoStepId,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count: segmentCount,
        configTemplate: {
            model: model.name,
            totalDuration: duration,
            aspectRatio: goal.constraints?.aspectRatio || '16:9',
            prompt: goal.constraints?.topic || "Video",
            continuityMode: goal.constraints?.strategy === 'FRAME_LOCK' ? 'frame-lock' : undefined
        },
        batchConfigs: scenes ? scenes.map(s => ({
            prompt: s.prompt,
            duration: s.duration
        })) : undefined
    });

    steps.push({
        id: generateId(),
        action: 'GROUP_NODES',
        stepIds: [videoStepId],
        groupType: 'video-sequence',
        label: `${goal.constraints?.topic || 'Video'} (${duration}s)`
    });
}

function compileScriptToScenes(goal: SemanticGoal, steps: CanvasInstructionStep[]) {
    // 1. Script Node
    const scriptStepId = generateId();
    steps.push({
        id: scriptStepId,
        action: 'CREATE_NODE',
        nodeType: 'text',
        count: 1,
        configTemplate: {
            model: 'standard',
            text: `Scene Decomposition for: ${goal.constraints?.topic || 'Untitled Video'}\n\n[Scene 1] Introduce the character and setting...\n[Scene 2] Establish the conflict or main action...\n[Scene 3] Resolution and cinematic closing.`,
            label: "Production Script"
        }
    });

    // 2. Video Sequence (Dependent on Script)
    const videoStepId = generateId();
    const modelId = 'veo-3.1';
    const model = CAPABILITY_REGISTRY.VIDEO.models[modelId] as ModelConstraint;
    const duration = goal.constraints?.duration || 10;
    const maxOutput = model.temporal?.maxOutputSeconds || 5; // 5s segments for script decomposition
    const segmentCount = Math.ceil(duration / maxOutput);

    steps.push({
        id: videoStepId,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count: segmentCount,
        inputFrom: scriptStepId,
        configTemplate: {
            model: model.name,
            totalDuration: duration,
            aspectRatio: goal.constraints?.aspectRatio || '16:9',
            prompt: `Generate scenes based on script for ${goal.constraints?.topic}`
        }
    });

    steps.push({
        id: generateId(),
        action: 'GROUP_NODES',
        stepIds: [scriptStepId, videoStepId],
        groupType: 'logical-group',
        label: `Scripted Production: ${goal.constraints?.topic}`
    });
}

function compileKeyframeI2V(goal: SemanticGoal, steps: CanvasInstructionStep[]) {
    // 1. Keyframe Images
    const imageStepId = generateId();
    steps.push({
        id: imageStepId,
        action: 'CREATE_NODE',
        nodeType: 'image-generator',
        count: 3, // Start with 3 keyframes
        configTemplate: {
            model: 'flux-2-pro',
            prompt: `Keyframe image for ${goal.constraints?.topic}, high consistency`
        }
    });

    // 2. I2V Animation
    const videoStepId = generateId();
    steps.push({
        id: videoStepId,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count: 3,
        inputFrom: imageStepId,
        configTemplate: {
            model: 'luma-dream-machine', // I2V pro model
            prompt: `Animate keyframe with cinematic motion`
        }
    });

    steps.push({
        id: generateId(),
        action: 'GROUP_NODES',
        stepIds: [imageStepId, videoStepId],
        groupType: 'story-board',
        label: `Keyframe Animation: ${goal.constraints?.topic}`
    });
}

function compileAudioFirst(goal: SemanticGoal, steps: CanvasInstructionStep[]) {
    // 1. Audio (Voiceover)
    const audioStepId = generateId();
    steps.push({
        id: audioStepId,
        action: 'CREATE_NODE',
        nodeType: 'music-generator',
        count: 1,
        configTemplate: {
            model: 'udio-v2',
            prompt: `Narration voiceover for ${goal.constraints?.topic}`,
            type: 'voice'
        }
    });

    // 2. Visual Sequence (Montage)
    const videoStepId = generateId();
    steps.push({
        id: videoStepId,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count: 5,
        inputFrom: audioStepId,
        configTemplate: {
            model: 'veo-3.1',
            prompt: `Visual montage matching the audio beats for ${goal.constraints?.topic}`
        }
    });

    steps.push({
        id: generateId(),
        action: 'GROUP_NODES',
        stepIds: [audioStepId, videoStepId],
        groupType: 'logical-group',
        label: `Audio-Visual Production: ${goal.constraints?.topic}`
    });
}

function compileCharacterSheet(goal: SemanticGoal, steps: CanvasInstructionStep[]) {
    // 1. Character Sheet Assets
    const assetStepId = generateId();
    steps.push({
        id: assetStepId,
        action: 'CREATE_NODE',
        nodeType: 'image-generator',
        count: 1,
        configTemplate: {
            model: 'flux-2-pro',
            prompt: `Character sheet for ${goal.constraints?.topic}: front view, side view, and expressions. White background, cinematic style.`
        }
    });

    // 2. Video Sequence (Referencing Assets)
    const videoStepId = generateId();
    const modelId = 'veo-3.1';
    const model = CAPABILITY_REGISTRY.VIDEO.models[modelId] as ModelConstraint;
    const duration = goal.constraints?.duration || 10;
    const maxOutput = model.temporal?.maxOutputSeconds || 4;
    const segmentCount = Math.ceil(duration / maxOutput);

    steps.push({
        id: videoStepId,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count: segmentCount,
        inputFrom: assetStepId,
        configTemplate: {
            model: model.name,
            totalDuration: duration,
            aspectRatio: goal.constraints?.aspectRatio || '16:9',
            prompt: `Generate scenes for ${goal.constraints?.topic} maintaining consistency with character sheet.`
        }
    });

    steps.push({
        id: generateId(),
        action: 'GROUP_NODES',
        stepIds: [assetStepId, videoStepId],
        groupType: 'logical-group',
        label: `Character-Driven Production: ${goal.constraints?.topic}`
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
