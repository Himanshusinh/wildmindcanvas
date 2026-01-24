import { CAPABILITY_REGISTRY } from './capabilityRegistry';

/**
 * Format capability registry into a readable string for AI consumption
 */
export function formatCapabilitiesForAI(): string {
    let formatted = `# WILDMIND CANVAS CAPABILITIES\n\n`;
    formatted += `This canvas system has the following capabilities, models, and plugins available:\n\n`;

    // IMAGE MODELS
    formatted += `## IMAGE GENERATION MODELS\n\n`;
    const imageModels = CAPABILITY_REGISTRY.IMAGE.models;
    Object.values(imageModels).forEach(model => {
        formatted += `- **${model.name}** (${model.id})\n`;
        formatted += `  - Input: ${model.inputType}, Output: ${model.outputType}\n`;
        formatted += `  - Supports: ${model.supports.textToContent ? 'Text-to-Image' : ''}${model.supports.textToContent && model.supports.contentToContent ? ' + ' : ''}${model.supports.contentToContent ? 'Image-to-Image' : ''}\n`;
        formatted += `  - Resolutions: ${model.resolutions.join(', ') || 'Various'}\n`;
        formatted += `  - Aspect Ratios: ${model.aspectRatios.join(', ')}\n`;
        if (model.strengths && model.strengths.length > 0) {
            formatted += `  - Strengths: ${model.strengths.join(', ')}\n`;
        }
        formatted += `\n`;
    });

    // VIDEO MODELS
    formatted += `## VIDEO GENERATION MODELS\n\n`;
    const videoModels = CAPABILITY_REGISTRY.VIDEO.models;
    Object.values(videoModels).forEach(model => {
        formatted += `- **${model.name}** (${model.id})\n`;
        formatted += `  - Input: ${model.inputType}, Output: ${model.outputType}\n`;
        formatted += `  - Supports: ${model.supports.textToContent ? 'Text-to-Video' : ''}${model.supports.textToContent && model.supports.contentToContent ? ' + ' : ''}${model.supports.contentToContent ? 'Image-to-Video' : ''}\n`;
        if (model.temporal) {
            formatted += `  - Max Duration: ${model.temporal.maxOutputSeconds}s (stitchable: ${model.temporal.stitchable ? 'Yes' : 'No'})\n`;
        }
        formatted += `  - Resolutions: ${model.resolutions.join(', ') || 'Various'}\n`;
        formatted += `  - Aspect Ratios: ${model.aspectRatios.join(', ')}\n`;
        if (model.strengths && model.strengths.length > 0) {
            formatted += `  - Strengths: ${model.strengths.join(', ')}\n`;
        }
        formatted += `\n`;
    });

    // PLUGINS
    formatted += `## PLUGINS & TOOLS\n\n`;
    const plugins = CAPABILITY_REGISTRY.PLUGIN.models;
    Object.values(plugins).forEach(plugin => {
        formatted += `- **${plugin.name}** (${plugin.id})\n`;
        formatted += `  - Input: ${plugin.inputType}, Output: ${plugin.outputType}\n`;
        if (plugin.parameters) {
            formatted += `  - Parameters: ${Object.entries(plugin.parameters).map(([key, desc]) => `${key} (${desc})`).join(', ')}\n`;
        }
        formatted += `\n`;
    });

    formatted += `## KEY CONCEPTS\n\n`;
    formatted += `1. **Image-to-Image (I2I)**: Transform existing images using models that support contentToContent\n`;
    formatted += `2. **Text-to-Image (T2I)**: Generate images from text prompts\n`;
    formatted += `3. **Image-to-Video (I2V)**: Animate static images into videos\n`;
    formatted += `4. **Text-to-Video (T2V)**: Generate videos from text prompts\n`;
    formatted += `5. **Video Stitching**: Connect multiple video segments sequentially (models with stitchable: true)\n`;
    formatted += `6. **First & Last Frame**: Some video models (like Veo 3.1 Fast) support connecting 2 images (first frame + last frame) to a single video\n`;
    formatted += `7. **Sequential Frames**: Create multiple image frames, each connected to a video frame, then connect videos sequentially\n\n`;

    formatted += `## WORKFLOW PLANNING\n\n`;
    formatted += `When creating a video flow:\n`;
    formatted += `- For videos > 12 seconds: Divide into segments based on model max duration (usually 8 seconds)\n`;
    formatted += `- Each segment needs: Image frame(s) + Video frame\n`;
    formatted += `- For "Sequential Frames": 1 image → 1 video per segment, videos connected sequentially\n`;
    formatted += `- For "First & Last Frame": 2 images (first + last) → 1 video per segment, videos are independent\n`;
    formatted += `- Image frames can use Image-to-Image mode if a source image is provided\n`;
    formatted += `- Use appropriate models: Seedream 4.5 for images, Veo 3.1 Fast for videos (supports first/last frame)\n\n`;

    return formatted;
}

/**
 * Get relevant capabilities for a specific use case
 */
export function getRelevantCapabilities(useCase: 'image-generation' | 'video-generation' | 'image-to-video' | 'long-video'): string {
    const allCapabilities = formatCapabilitiesForAI();
    
    if (useCase === 'long-video') {
        return `${allCapabilities}\n\n## SPECIFIC GUIDANCE FOR LONG VIDEOS (>12 seconds)\n\n`;
    }
    
    return allCapabilities;
}
