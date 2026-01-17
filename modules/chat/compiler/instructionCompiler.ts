
import { v4 as uuidv4 } from 'uuid';
import {
    SemanticGoal,
    CanvasInstructionPlan,
    CanvasInstructionStep,
    GoalType
} from './types';
import { CAPABILITY_REGISTRY } from '../capabilityRegistry';

const generateId = () => uuidv4();

/**
 * Universal Instruction Compiler
 * Transforms high-level SemanticGoal into a deterministic CanvasInstructionPlan.
 */
export function compileGoalToPlan(goal: SemanticGoal): CanvasInstructionPlan {
    const steps: CanvasInstructionStep[] = [];
    let summary = "";

    switch (goal.goalType) {
        case 'STORY_VIDEO':
            summary = compileStoryVideo(goal, steps);
            break;
        case 'IMAGE_GENERATION':
            summary = compileImageGeneration(goal, steps);
            break;
        case 'MUSIC_VIDEO':
            summary = compileMusicVideo(goal, steps);
            break;
        case 'IMAGE_ANIMATE':
            summary = compileImageAnimate(goal, steps);
            break;
        case 'EXPLAIN_CANVAS':
            summary = "Explaining canvas contents...";
            break;
        case 'CLARIFY':
            summary = "Requesting clarification...";
            break;
        default:
            summary = `Creating ${goal.topic || 'production'}`;
            break;
    }

    return {
        id: generateId(),
        summary,
        steps,
        metadata: {
            sourceGoal: goal,
            compiledAt: Date.now()
        },
        requiresConfirmation: goal.goalType !== 'EXPLAIN_CANVAS' && goal.goalType !== 'CLARIFY'
    };
}

/**
 * Strategy: STORY_VIDEO
 * 1. Script -> 2. Sequential Visuals -> 3. Video Segments -> 4. Group
 */
function compileStoryVideo(goal: SemanticGoal, steps: CanvasInstructionStep[]): string {
    const topic = goal.topic || "Story";
    const duration = goal.durationSeconds || 30;
    const aspectRatio = goal.aspectRatio || '16:9';

    // Auth Rule: Segments are 8s by default for consistency
    const segmentDuration = 8;
    const segmentCount = Math.ceil(duration / segmentDuration);

    // 1. CREATE SCRIPT
    const scriptStepId = generateId();
    steps.push({
        id: scriptStepId,
        action: 'CREATE_NODE',
        nodeType: 'text',
        count: 1,
        configTemplate: {
            model: 'standard',
            prompt: `Script for ${topic} (${duration}s)`,
            style: 'rich',
            content: `[Scene 1(${segmentDuration}s)]: Introduction...\n...`
        }
    });

    // 2. CREATE IMAGES (1 per segment for consistency)
    const imageStepId = generateId();
    steps.push({
        id: imageStepId,
        action: 'CREATE_NODE',
        nodeType: 'image-generator',
        count: segmentCount,
        inputFrom: scriptStepId,
        configTemplate: {
            model: 'flux-1.1-pro', // High quality default
            aspectRatio,
            prompt: `Consistent cinematic visual for ${topic}`
        }
    });

    // 3. CREATE VIDEOS
    const videoStepId = generateId();
    steps.push({
        id: videoStepId,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count: segmentCount,
        inputFrom: imageStepId,
        configTemplate: {
            model: 'veo-3.1',
            aspectRatio,
            duration: segmentDuration,
            prompt: `Cinematic motion for ${topic}`
        }
    });

    // 4. CONNECT
    steps.push({
        id: generateId(),
        action: 'CONNECT_SEQUENTIALLY',
        fromStepId: imageStepId,
        toStepId: videoStepId
    });

    // 5. GROUP
    const groupStepId = generateId();
    steps.push({
        id: groupStepId,
        action: 'GROUP_NODES',
        stepIds: [scriptStepId, imageStepId, videoStepId],
        groupType: 'video-sequence',
        label: `${topic} (${duration}s Video Production)`
    });

    return `Create a ${duration}s ${topic} video with ${segmentCount} scenes (script, images, video segments).`;
}

/**
 * Strategy: IMAGE_GENERATION
 */
function compileImageGeneration(goal: SemanticGoal, steps: CanvasInstructionStep[]): string {
    const topic = goal.topic || "Art";
    const count = goal.needs.includes('image') ? (goal.references?.length || 1) : 1;
    const style = goal.style || 'photorealistic';

    // Auth Rule: Model selection logic lives here
    const model = goal.style?.toLowerCase().includes('fast') || goal.style?.toLowerCase().includes('turbo')
        ? 'z-image-turbo'
        : 'flux-1.1-pro';

    steps.push({
        id: generateId(),
        action: 'CREATE_NODE',
        nodeType: 'image-generator',
        count,
        configTemplate: {
            model,
            aspectRatio: goal.aspectRatio || '1:1',
            prompt: `${topic} in ${style} style`,
        }
    });

    return `Generate ${count} ${style} images of "${topic}" using ${model}.`;
}

/**
 * Strategy: IMAGE_ANIMATE
 */
function compileImageAnimate(goal: SemanticGoal, steps: CanvasInstructionStep[]): string {
    const count = goal.references?.length || 1;

    const videoStepId = generateId();
    steps.push({
        id: videoStepId,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count,
        configTemplate: {
            model: 'veo-3.1',
            prompt: "Animate this image with cinematic motion"
        }
    });

    // Connect existing references to new videos if possible
    // This requires the executor to mapped goal.references to the 'toStepId'

    return `Animate ${count} images into cinematic video loops.`;
}

/**
 * Strategy: MUSIC_VIDEO
 */
function compileMusicVideo(goal: SemanticGoal, steps: CanvasInstructionStep[]): string {
    const topic = goal.topic || "Song";

    const audioStepId = generateId();
    steps.push({
        id: audioStepId,
        action: 'CREATE_NODE',
        nodeType: 'music-generator',
        count: 1,
        configTemplate: {
            model: 'udio-v2',
            prompt: `Epic cinematic song about ${topic}`
        }
    });

    const videoStepId = generateId();
    steps.push({
        id: videoStepId,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count: 4, // 4 visuals for a song
        inputFrom: audioStepId,
        configTemplate: {
            model: 'veo-3.1',
            prompt: `Musical visual montage for ${topic}`
        }
    });

    return `Create a music video production: 1 song and a 4-scene visual montage.`;
}
