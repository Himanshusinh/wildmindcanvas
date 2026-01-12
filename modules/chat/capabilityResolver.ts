import { AbstractIntent, ResolvedAction, CapabilityType } from './intentSchemas';
import { CAPABILITY_REGISTRY, ModelConstraint } from './capabilityRegistry';
import { compileGoalToPlan } from './compiler/instructionCompiler';

export function resolveIntent(intent: AbstractIntent, context: any): ResolvedAction {
    // 1. Capability Safety
    const capabilityType = (intent.capability === 'CONNECT' || intent.capability === 'UNKNOWN') ? 'IMAGE' : intent.capability;
    const capability = CAPABILITY_REGISTRY[capabilityType as keyof typeof CAPABILITY_REGISTRY] || CAPABILITY_REGISTRY.IMAGE;

    // 2. Model Selection Logic (Deterministic)
    const modelList = Object.values(capability.models) as ModelConstraint[];
    let selectedModel: ModelConstraint | undefined;

    // A. Priority: Explicit User Preference
    if (intent.preferences?.preferredModel) {
        selectedModel = modelList.find(m =>
            m.id === intent.preferences?.preferredModel ||
            m.name.toLowerCase().includes(intent.preferences?.preferredModel?.toLowerCase() || '')
        );
    }

    // B. Fallback: Content-aware or Default selection
    if (!selectedModel) {
        if (intent.references && intent.references.length > 0) {
            selectedModel = modelList.find(m => m.supports.contentToContent) || modelList.find(m => m.isDefault) || modelList[0];
        } else {
            selectedModel = modelList.find(m => m.isDefault) || modelList[0];
        }
    }

    // Safety fallback (should never happen with modelList[0])
    if (!selectedModel) selectedModel = modelList[0];

    // 3. Parameter Resolution
    const config: any = {
        prompt: intent.prompt || "something creative",
        position: 'viewport_center'
    };

    if (intent.capability === 'IMAGE' || intent.capability === 'VIDEO' || intent.capability === 'MUSIC') {
        const preferredAR = intent.preferences?.aspectRatio;
        // Music doesn't have AR, but logic safely defaults if model.aspectRatios is empty
        config.aspectRatio = (preferredAR && selectedModel.aspectRatios.includes(preferredAR))
            ? preferredAR
            : (selectedModel.aspectRatios[0] || '1:1');

        config.resolution = selectedModel.resolutions.includes('1024') ? '1024' : selectedModel.resolutions[0];
        // Pass the raw desired count to the executor (which creates 'n' frames)
        // We do NOT clamp to maxBatch here because maxBatch limits *per-request* generation,
        // but the executor creates multiple frames to fulfill the total count.
        config.maxBatch = selectedModel.maxBatch;
        config.imageCount = intent.preferences?.count || 1;
    }

    if (intent.capability === 'TEXT') {
        config.style = intent.goal === 'rich' ? 'rich' : 'standard';
        config.content = intent.prompt || "New Text";
    }

    if (intent.capability === 'PLUGIN') {
        // Plugin specific config
        config.pluginId = selectedModel.id; // upscale or remove-bg

        // TARGET RESOLUTION LOGIC
        // 1. Explicit reference from Intent (passed from UI selection)
        let targetId = intent.references?.[0];

        // 2. Selection Context (Deep check into canvasSelection)
        if (!targetId && context?.canvasSelection) {
            const sel = context.canvasSelection;
            targetId = sel.selectedImageModalIds?.[0] ||
                sel.selectedVideoModalIds?.[0] ||
                sel.selectedRichTextIds?.[0];

            if (!targetId && sel.selectedImageIndices?.length > 0) {
                const idx = sel.selectedImageIndices[0];
                const img = context.canvasState?.images?.[idx];
                if (img) {
                    targetId = img.elementId || `canvas-image-${idx}`;
                }
            }
        }

        // 3. Fallback: Recent Image Nodes (Smart Default)
        if (!targetId) {
            // Check imageModalStates for latest image
            const imageModals = context?.canvasState?.imageModalStates || [];
            if (imageModals.length > 0) {
                targetId = imageModals[imageModals.length - 1].id;
            }
        }

        if (!targetId) {
            return {
                intent: 'ERROR',
                capability: 'PLUGIN',
                modelId: selectedModel.id,
                payload: { error: "No target image found for plugin." },
                requiresConfirmation: false,
                explanation: "I couldn't find an image to apply the plugin to. Please select an image first."
            };
        }

        config.targetNodeId = targetId;
    }

    if (intent.capability === 'WORKFLOW') {
        config.workflowGraph = intent.preferences?.workflowGraph;
    }

    // 4. INSTRUCTION COMPILER INTEGRATION
    // If it's a known Semantic Goal (Video, Music Video, Etc), compile to Plan.

    // Check for explicit VIDEO request with duration
    const isVideoRequest = capabilityType === 'VIDEO' && (intent.preferences?.duration || 0) > 0;

    // CRITICAL: Intercept hallucinated WORKFLOW intents
    // If LLM ignores prompt and returns WORKFLOW, we discard its graph and re-compile semantics.
    const isLegacyWorkflow = (capabilityType as string) === 'WORKFLOW';

    if (isVideoRequest || isLegacyWorkflow) {
        // Construct Semantic Goal
        const goal = {
            goalType: isVideoRequest ? 'VIDEO_REQUEST' : 'UNKNOWN', // Try to infer specific type from intent.goal?
            needs: ['video'], // Default assumption, compiler might refine
            constraints: {
                duration: intent.preferences?.duration,
                aspectRatio: intent.preferences?.aspectRatio || config.aspectRatio,
                topic: config.prompt, // Best effort extraction
                style: intent.preferences?.style,
                strategy: intent.preferences?.videoStrategy,
                scenes: intent.preferences?.scenes
            },
            rawInput: config.prompt
        };

        // If it was a 'WORKFLOW' intent, try to infer real goal
        if (isLegacyWorkflow) {
            if (intent.goal?.includes('music')) goal.goalType = 'MUSIC_VIDEO';
            else if (intent.goal?.includes('video')) goal.goalType = 'VIDEO_REQUEST';
        }

        // COMPILE
        const plan = compileGoalToPlan(goal as any); // Cast for strict typing if needed

        // Return PLAN intent
        return {
            intent: 'EXECUTE_PLAN',
            capability: 'WORKFLOW', // Keeps UI happy? Or 'PLAN'? 
            modelId: selectedModel.id,
            payload: {
                ...plan // Spread plan into config/payload
            },
            requiresConfirmation: true,
            explanation: `I've compiled a plan: ${plan.summary}`
        };
    }

    if (capabilityType === 'TEXT' && intent.goal === 'answer') {
        return {
            intent: 'ANSWER',
            capability: 'TEXT',
            modelId: 'standard',
            payload: {},
            requiresConfirmation: false,
            explanation: intent.explanation || "No explanation provided."
        };
    }

    return {
        intent: capabilityType === 'TEXT' ? 'CREATE_TEXT' :
            capabilityType === 'WORKFLOW' ? 'WORKFLOW' :
                `GENERATE_${capabilityType}`,
        capability: capabilityType,
        modelId: selectedModel.id,
        payload: {
            ...config,
            model: selectedModel.id,
            canonicalId: capability.id,
        },
        requiresConfirmation: capabilityType !== 'TEXT',
        explanation: intent.explanation || `I've prepared ${selectedModel.name} for your request.`
    };
}
