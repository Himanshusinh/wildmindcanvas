
import { AbstractIntent, ResolvedAction, CapabilityType } from './intentSchemas';
import { CAPABILITY_REGISTRY, ModelConstraint } from './capabilityRegistry';

export function resolveIntent(intent: AbstractIntent, context: any): ResolvedAction {
    // 1. Capability Safety
    const capabilityType = (intent.capability === 'CONNECT' || intent.capability === 'UNKNOWN') ? 'IMAGE' : intent.capability;
    const capability = CAPABILITY_REGISTRY[capabilityType as CapabilityType] || CAPABILITY_REGISTRY.IMAGE;

    // 2. Model Selection Logic (Deterministic)
    const modelList = Object.values(capability.models) as ModelConstraint[];
    let selectedModel: ModelConstraint;

    // Filter models based on task
    // Filter models based on task
    if (intent.references && intent.references.length > 0) {
        selectedModel = modelList.find(m => m.supports.contentToContent) || modelList.find(m => m.isDefault) || modelList[0];
    } else if (intent.preferences?.preferredModel) {
        // Try strict ID match or loose name match
        selectedModel = modelList.find(m => m.id === intent.preferences?.preferredModel || m.name.toLowerCase().includes(intent.preferences.preferredModel!.toLowerCase()))
            || modelList.find(m => m.isDefault)
            || modelList[0];
    } else if (intent.preferences?.quality === 'high') {
        selectedModel = modelList.find(m => m.isHighRes) || modelList.find(m => m.isDefault) || modelList[0];
    } else if (intent.preferences?.quality === 'fast') {
        selectedModel = modelList.find(m => m.isTurbo) || modelList.find(m => m.isDefault) || modelList[0];
    } else {
        selectedModel = modelList.find(m => m.isDefault) || modelList[0];
    }

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
        config.targetNodeId = intent.references?.[0];
    }

    return {
        intent: capabilityType === 'TEXT' ? 'CREATE_TEXT' : `GENERATE_${capabilityType}`,
        capability: capabilityType,
        modelId: selectedModel.id,
        config: {
            ...config,
            model: selectedModel.name
        },
        requiresConfirmation: capabilityType !== 'TEXT',
        explanation: intent.explanation || `I've prepared ${selectedModel.name} for your request.`
    };
}
