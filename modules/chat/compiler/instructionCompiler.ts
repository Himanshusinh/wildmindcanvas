import { v4 as uuidv4 } from 'uuid';
import {
    SemanticGoal,
    CanvasInstructionPlan,
    CanvasInstructionStep,
    GoalType
} from './types';
import { CAPABILITY_REGISTRY } from '../capabilityRegistry';

// Helper function to get model capability from registry
function getModelCapability(modelName: string) {
    if (!modelName) return null;
    // Normalize model name to match registry keys
    // Registry keys use format like "veo-3.1-fast", "seedance-1.0-pro"
    let modelKey = modelName.toLowerCase().trim();
    // Replace spaces with hyphens, but keep dots for version numbers
    modelKey = modelKey.replace(/\s+/g, '-');
    // Try exact match first
    if (CAPABILITY_REGISTRY.VIDEO.models[modelKey]) {
        return CAPABILITY_REGISTRY.VIDEO.models[modelKey];
    }
    // Try common variations
    const variations = [
        modelKey,
        modelKey.replace(/\./g, '-'), // "veo-3-1-fast"
        modelKey.replace(/-/g, '.'), // "veo.3.1.fast"
    ];
    for (const variant of variations) {
        if (CAPABILITY_REGISTRY.VIDEO.models[variant]) {
            return CAPABILITY_REGISTRY.VIDEO.models[variant];
        }
    }
    return null;
}

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

    // Generate a clear, formatted summary with all parameters
    const summaryParts: string[] = [];
    summaryParts.push(`Time Duration: ${duration} seconds`);
    summaryParts.push(`Frame Size: ${aspectRatio}`);
    summaryParts.push(`Scenes: ${segmentCount} segments`);
    summaryParts.push(`Topic: ${topic}`);

    return summaryParts.join('\n');
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

    // Generate a clear, formatted summary with all parameters
    const summaryParts: string[] = [];
    summaryParts.push(`Model: ${model}`);
    summaryParts.push(`Frame Size: ${goal.aspectRatio || '1:1'}`);
    summaryParts.push(`Prompt: ${topic} in ${style} style`);
    if (requestedCount > 1) {
        summaryParts.push(`Count: ${requestedCount} images`);
    }

    return summaryParts.join('\n');
}

/**
 * Strategy: IMAGE_ANIMATE
 */
function compileImageAnimate(goal: SemanticGoal, steps: CanvasInstructionStep[]): string {
    const topic = goal.topic || "Visual";
    const style = goal.style || "cinematic";
    // Always create 1 video generator, even if 2 images are selected (first/last frame mode)
    // The 2 images will be connected as first frame and last frame to the same video generator
    const count = 1;
    // Check if user explicitly specified a duration
    const userSpecifiedDuration = goal.durationSeconds !== undefined && goal.durationSeconds !== null;
    // Use durationSeconds from goal, default to 6 seconds ONLY if user didn't specify
    let duration = userSpecifiedDuration ? goal.durationSeconds! : 6;

    // Auto-select model based on duration if model not explicitly specified
    // Veo 3.1 / Veo 3.1 Fast: support 4, 6, 8 seconds
    // Seedance 1.0 Pro/Lite: support 2-12 seconds
    let model = goal.model;
    if (!model) {
        if (duration >= 4 && duration <= 8) {
            // Default to Veo 3.1 Fast for 4-8 second videos
            model = 'Veo 3.1 Fast';
        } else if (duration >= 9 && duration <= 12) {
            // Use Seedance for 9-12 second videos
            model = 'Seedance 1.0 Pro';
        } else {
            // Default fallback for durations outside normal ranges
            model = 'Veo 3.1 Fast';
        }
    }

    // Normalize model name (handle variations like "veo 3.1 fast", "veo3.1 fast", "veo-3.1-fast")
    const modelLower = model.toLowerCase().trim();
    
    // Normalize model names to frontend format
    if (modelLower.includes('veo') && modelLower.includes('3.1')) {
        if (modelLower.includes('fast')) {
            model = 'Veo 3.1 Fast';
        } else {
            model = 'Veo 3.1';
        }
    } else if (modelLower.includes('seedance')) {
        if (modelLower.includes('lite')) {
            model = 'Seedance 1.0 Lite';
        } else {
            model = 'Seedance 1.0 Pro';
        }
    }

    // Validate and clamp duration based on selected model using capability registry
    // IMPORTANT: Only modify duration if user didn't specify it OR if it's invalid for the model
    const modelLowerAfter = model.toLowerCase().trim();
    const modelCapability = getModelCapability(model);
    
    if (modelCapability && modelCapability.temporal) {
        const maxDuration = modelCapability.temporal.maxOutputSeconds;
        const minDuration = modelCapability.temporal.maxInputSeconds || 2;
        
        // For Veo models, valid durations are exactly 4, 6, or 8
        if (modelLowerAfter.includes('veo') && modelLowerAfter.includes('3.1')) {
            const validVeoDurations = [4, 6, 8];
            // If user specified a duration and it's valid, use it exactly
            if (userSpecifiedDuration && validVeoDurations.includes(duration)) {
                // Keep the exact user-specified value (4, 6, or 8)
            } else {
                // Only round/clamp if user didn't specify OR if value is invalid
                if (duration < minDuration) duration = minDuration;
                if (duration > maxDuration) duration = maxDuration;
                // Round to nearest valid duration
                if (duration < 5) duration = 4;
                else if (duration < 7) duration = 6;
                else duration = 8;
            }
        } else {
            // For other models (like Seedance), validate range but preserve user's value if valid
            if (userSpecifiedDuration && duration >= minDuration && duration <= maxDuration) {
                // Keep user's exact value if it's within valid range
                duration = Math.round(duration); // Just round to integer
            } else {
                // Only clamp/round if user didn't specify OR if value is invalid
                if (duration < minDuration) duration = minDuration;
                if (duration > maxDuration) duration = maxDuration;
                duration = Math.round(duration);
            }
        }
    } else {
        // Fallback to hardcoded logic if capability not found
        if (modelLowerAfter.includes('veo') && modelLowerAfter.includes('3.1')) {
            const validVeoDurations = [4, 6, 8];
            // If user specified a valid duration, use it exactly
            if (userSpecifiedDuration && validVeoDurations.includes(duration)) {
                // Keep exact value
            } else {
                // Only round if user didn't specify OR if value is invalid
                if (duration < 4) duration = 4;
                if (duration > 8) duration = 8;
                if (duration < 5) duration = 4;
                else if (duration < 7) duration = 6;
                else duration = 8;
            }
        } else if (modelLowerAfter.includes('seedance')) {
            // For Seedance, preserve user's value if within valid range
            if (userSpecifiedDuration && duration >= 2 && duration <= 12) {
                duration = Math.round(duration);
            } else {
                if (duration < 2) duration = 2;
                if (duration > 12) duration = 12;
                duration = Math.round(duration);
            }
        }
    }

    // Extract and normalize resolution using capability registry
    let resolution = goal.resolution;
    if (resolution) {
        // Normalize resolution format (e.g., "720p", "1080p", "480p")
        resolution = resolution.toLowerCase().trim();
        // Ensure it ends with 'p'
        if (!resolution.endsWith('p')) {
            resolution = resolution + 'p';
        }
        
        // Validate resolution against model capabilities from registry
        if (modelCapability && modelCapability.resolutions) {
            const validResolutions = modelCapability.resolutions;
            if (!validResolutions.includes(resolution)) {
                // Use first valid resolution as default if user's choice is invalid
                resolution = validResolutions[0] || '720p';
            }
        } else {
            // Fallback to hardcoded validation
            if (modelLowerAfter.includes('veo') && modelLowerAfter.includes('3.1')) {
                if (resolution !== '720p' && resolution !== '1080p') {
                    resolution = '720p';
                }
            } else if (modelLowerAfter.includes('seedance')) {
                if (resolution !== '480p' && resolution !== '720p' && resolution !== '1080p') {
                    resolution = '1080p';
                }
            }
        }
    }

    const videoStepId = generateId();
    steps.push({
        id: videoStepId,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count,
        configTemplate: {
            model: model,
            aspectRatio: goal.aspectRatio || '16:9',
            duration: duration,
            resolution: resolution, // Add resolution to config
            prompt: goal.topic ? `${topic} in ${style} style` : "Animate this image with cinematic motion",
            targetIds: goal.references
        }
    });

    // Generate a clear, formatted summary with all parameters
    const summaryParts: string[] = [];
    summaryParts.push(`Time Duration: ${duration} seconds`);
    summaryParts.push(`Frame Size: ${goal.aspectRatio || '16:9'}`);
    if (resolution) {
        summaryParts.push(`Resolution: ${resolution}`);
    }
    summaryParts.push(`Model: ${model}`);
    summaryParts.push(`Prompt: ${goal.topic ? `${topic} in ${style} style` : "Animate this image with cinematic motion"}`);
    // If 2 images are selected, indicate first/last frame mode
    if (goal.references && goal.references.length >= 2) {
        summaryParts.push(`Mode: First frame and last frame`);
    }

    return summaryParts.join('\n');
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

    // Generate a clear, formatted summary with all parameters
    const summaryParts: string[] = [];
    summaryParts.push(`Type: Music Video`);
    summaryParts.push(`Audio: 1 song`);
    summaryParts.push(`Video: 4-scene visual montage`);
    summaryParts.push(`Topic: ${topic}`);

    return summaryParts.join('\n');
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

