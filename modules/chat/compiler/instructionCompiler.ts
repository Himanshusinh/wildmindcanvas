
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
        case 'DELETE_CONTENT':
            summary = compileDeleteContent(goal, steps);
            break;
        case 'PLUGIN_ACTION':
            summary = compilePluginAction(goal, steps);
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
    // Priority: Explicit Count > Needs Count > Default 1
    const requestedCount = goal.count || (goal.needs.includes('image') ? (goal.references?.length || 1) : 1);
    const style = goal.style || 'photorealistic';

    // Model Logic: Explicit Model > Style Inference > Default
    let model = goal.model;

    if (!model) {
        model = goal.style?.toLowerCase().includes('fast') || goal.style?.toLowerCase().includes('turbo')
            ? 'z-image-turbo'
            : 'Google Nano Banana Pro';
    }

    // For Image Generation, we create 1 Node with N images (batch mode)
    // instead of N nodes.
    steps.push({
        id: generateId(),
        action: 'CREATE_NODE',
        nodeType: 'image-generator',
        count: 1, // Only 1 specific tool instance
        configTemplate: {
            model,
            aspectRatio: goal.aspectRatio || '1:1',
            prompt: `${topic} in ${style} style`,
            imageCount: requestedCount, // Pass the batch size here
            targetIds: goal.references // Pass references for Auto-Connect/Img2Img
        }
    });

    return `Generate ${requestedCount} ${style} images of "${topic}" using ${model}.`;
}

/**
 * Strategy: IMAGE_ANIMATE
 */
function compileImageAnimate(goal: SemanticGoal, steps: CanvasInstructionStep[]): string {
    const topic = goal.topic || "Visual";
    const style = goal.style || "cinematic";
    const count = goal.references?.length || 1;
    // Use durationSeconds from goal, default to 6 seconds if not specified
    const duration = goal.durationSeconds || 6;

    const videoStepId = generateId();
    steps.push({
        id: videoStepId,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count,
        configTemplate: {
            model: goal.model || 'veo-3.1',
            aspectRatio: goal.aspectRatio || '16:9',
            duration: duration,
            prompt: goal.topic ? `${topic} in ${style} style` : "Animate this image with cinematic motion",
            targetIds: goal.references
        }
    });

    return `Animate ${count} images into cinematic video loops showing ${topic}.`;
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

/**
 * Strategy: DELETE_CONTENT
 */
function compileDeleteContent(goal: SemanticGoal, steps: CanvasInstructionStep[]): string {
    const topic = (goal.topic || "").toLowerCase();
    const needs = goal.needs || [];
    const references = goal.references || [];

    // Case 1: Delete specific selected items
    if (references.length > 0) {
        steps.push({
            id: generateId(),
            action: 'DELETE_NODE',
            targetType: 'all', // The executor will filter by ID regardless of type
            targetIds: references
        });
        return `Delete ${references.length} selected items.`;
    }

    // Case 2: Broad deletion based on topic/needs
    const targetTypes: Array<'image' | 'video' | 'text' | 'music' | 'plugin'> = [];

    // Map natural language to types
    if (topic.includes("image") || needs.includes("image")) targetTypes.push("image");
    if (topic.includes("video") || needs.includes("video")) targetTypes.push("video");
    if (topic.includes("text") || needs.includes("text")) targetTypes.push("text");
    if (topic.includes("music") || topic.includes("audio") || needs.includes("audio")) targetTypes.push("music");

    // Plugin Detection
    let isPlugin = topic.includes("plugin") || needs.includes("plugin");
    let specificPluginType: string | undefined;

    const pluginKeywords: Record<string, string> = {
        'remove bg': 'remove-bg',
        'remove background': 'remove-bg',
        'upscale': 'upscale',
        'erase': 'erase',
        'expand': 'expand',
        'vectorize': 'vectorize',
        'next scene': 'next-scene',
        'storyboard': 'storyboard',
        'multiangle': 'multiangle',
        'video editor': 'video-editor',
        'image editor': 'image-editor',
        'compare': 'compare'
    };

    for (const [keyword, type] of Object.entries(pluginKeywords)) {
        if (topic.includes(keyword)) {
            isPlugin = true;
            specificPluginType = type;
            break;
        }
    }

    if (isPlugin && !targetTypes.includes('plugin')) targetTypes.push("plugin");

    // "Delete all" -> if no specific type mentioned, assume EVERYTHING (dangerous but valid for strict instruction)
    // However, usually "delete all" implies clearing canvas.
    // If targetTypes is empty but goal is DELETE_CONTENT, we might default to all if user said "everything".

    if (targetTypes.length === 0) {
        if (topic.includes("all") || topic.includes("everything") || topic.includes("canvas")) {
            steps.push({
                id: generateId(),
                action: 'DELETE_NODE',
                targetType: 'all'
            });
            return "Clear the entire canvas.";
        } else {
            // Fallback: Clarify? Or just default to nothing?
            // Let's assume they want to delete what current context implies, but safely do nothing if unclear.
            return "I'm not sure what to delete. Please specify (e.g., 'delete all videos').";
        }
    }

    // Create steps for each identified type
    for (const type of targetTypes) {
        steps.push({
            id: generateId(),
            action: 'DELETE_NODE',
            targetType: type,
            pluginType: type === 'plugin' ? specificPluginType : undefined
        });
    }

    const typeDesc = specificPluginType ? `${specificPluginType} plugins` : `${targetTypes.join(', ')} components`;
    return `Delete all ${typeDesc}.`;
}

function compilePluginAction(goal: SemanticGoal, steps: CanvasInstructionStep[]): string {
    const pluginType = goal.pluginType || 'upscale';

    steps.push({
        id: generateId(),
        action: 'CREATE_NODE',
        nodeType: 'plugin',
        count: 1,
        configTemplate: {
            model: 'standard',
            pluginType: pluginType,
            targetIds: goal.references
        }
    });

    return `Applying ${pluginType} plugin...`;
}
