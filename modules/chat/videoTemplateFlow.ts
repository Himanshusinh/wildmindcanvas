import { v4 as uuidv4 } from 'uuid';
import { queryCanvasPrompt } from '../../core/api/api';

export interface VideoTemplate {
    id: string;
    name: string;
    description: string;
    icon?: string;
}

export interface VideoFlowConfig {
    totalDuration: number; // in seconds
    topic: string;
    style?: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    resolution?: string;
    model?: string;
    userScript?: string; // Optional user-provided script
}

export interface Scene {
    sceneNumber: number;
    timeStart: number; // seconds
    timeEnd: number; // seconds
    duration: number; // seconds
    script: string;
    description: string;
}

export interface FramePrompt {
    frameIndex: number;
    timeStart: number; // seconds
    timeEnd: number; // seconds
    prompt: string;
    sceneNumber?: number;
    sceneScript?: string;
}

// Maximum video duration per model
export const MODEL_MAX_DURATIONS: Record<string, number> = {
    'Veo 3.1 Fast': 8,
    'Veo 3.1': 8,
    'Veo 3.1 Pro': 8,
    'Veo 3 Fast Pro': 8,
    'Veo 3 Pro': 8,
    'Seedance 1.0 Pro': 12,
    'Seedance 1.0 Lite': 12,
    'Sora 2 Pro': 8,
    'LTX V2 Pro': 8,
    'LTX V2 Fast': 8,
    'default': 8, // Default to 8 seconds for unknown models
};

// Available templates
export const VIDEO_TEMPLATES: VideoTemplate[] = [
    {
        id: 'sequential-frames',
        name: 'Sequential Frames',
        description: 'Creates sequential image frames that flow into video segments. Each frame becomes a video segment.',
    },
    {
        id: 'first-last-frame',
        name: 'First & Last Frame',
        description: 'Uses Veo 3.1 Fast first frame and last frame feature. Generates 2 images per video segment (first and last frame) for smooth transitions.',
    },
];

/**
 * Calculate number of frames needed based on total duration and model max duration
 */
export function calculateFrameCount(totalDuration: number, model: string = 'Veo 3.1 Fast'): number {
    const maxDuration = MODEL_MAX_DURATIONS[model] || MODEL_MAX_DURATIONS['default'];
    return Math.ceil(totalDuration / maxDuration);
}

/**
 * Generate a detailed script/story for the video topic
 */
export async function generateVideoScript(
    config: VideoFlowConfig,
    frameCount: number
): Promise<string> {
    // If user provided a script, use it
    if (config.userScript && config.userScript.trim()) {
        return config.userScript.trim();
    }
    
    // Generate script using AI
    const scriptPrompt = `Create a detailed video script for a ${config.totalDuration} second video about "${config.topic}". 
The video will be divided into ${frameCount} scenes, each approximately ${Math.ceil(config.totalDuration / frameCount)} seconds long.
${config.style ? `Style: ${config.style}.` : ''}

Requirements:
1. Write a compelling, detailed script that tells a complete story
2. The script should be suitable for visual storytelling
3. Include vivid descriptions of scenes, actions, and visual elements
4. Make it engaging and cinematic
5. The script should flow naturally from scene to scene

Format the script as a continuous narrative that can be divided into ${frameCount} scenes.`;

    try {
        const response = await queryCanvasPrompt(scriptPrompt, 1500);
        const script = typeof response === 'string' 
            ? response 
            : (response.response || response.enhanced_prompt || '');
        
        if (!script || script.trim().length < 50) {
            // Fallback to a simple generated script
            return generateFallbackScript(config, frameCount);
        }
        
        return script.trim();
    } catch (error) {
        console.error('[generateVideoScript] Error generating script:', error);
        // Fallback to a simple generated script
        return generateFallbackScript(config, frameCount);
    }
}

/**
 * Generate a fallback script if AI generation fails
 */
function generateFallbackScript(config: VideoFlowConfig, frameCount: number): string {
    const scenes: string[] = [];
    const sceneDuration = Math.ceil(config.totalDuration / frameCount);
    
    for (let i = 0; i < frameCount; i++) {
        if (i === 0) {
            scenes.push(`Scene ${i + 1} (0-${sceneDuration}s): Opening scene of ${config.topic}. Introduction and establishing shot.`);
        } else if (i === frameCount - 1) {
            scenes.push(`Scene ${frameCount} (${i * sceneDuration}-${config.totalDuration}s): Final scene of ${config.topic}. Conclusion and closing.`);
        } else {
            scenes.push(`Scene ${i + 1} (${i * sceneDuration}-${(i + 1) * sceneDuration}s): Middle scene of ${config.topic}. Development and progression.`);
        }
    }
    
    return scenes.join('\n\n');
}

/**
 * Divide script into time-based scenes
 */
export function divideScriptIntoScenes(
    script: string,
    totalDuration: number,
    frameCount: number
): Scene[] {
    const scenes: Scene[] = [];
    const sceneDuration = Math.ceil(totalDuration / frameCount);
    
    // Try to split script by paragraphs or natural breaks
    const paragraphs = script.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    // If we have enough paragraphs, use them
    if (paragraphs.length >= frameCount) {
        const paragraphsPerScene = Math.ceil(paragraphs.length / frameCount);
        
        for (let i = 0; i < frameCount; i++) {
            const startIdx = i * paragraphsPerScene;
            const endIdx = Math.min(startIdx + paragraphsPerScene, paragraphs.length);
            const sceneParagraphs = paragraphs.slice(startIdx, endIdx);
            const sceneScript = sceneParagraphs.join('\n\n');
            
            const timeStart = i * sceneDuration;
            const timeEnd = Math.min((i + 1) * sceneDuration, totalDuration);
            
            scenes.push({
                sceneNumber: i + 1,
                timeStart,
                timeEnd,
                duration: timeEnd - timeStart,
                script: sceneScript,
                description: sceneScript.substring(0, 150) + (sceneScript.length > 150 ? '...' : ''),
            });
        }
    } else {
        // Split script evenly by character count
        const scriptLength = script.length;
        const charsPerScene = Math.ceil(scriptLength / frameCount);
        
        for (let i = 0; i < frameCount; i++) {
            const startIdx = i * charsPerScene;
            const endIdx = Math.min(startIdx + charsPerScene, scriptLength);
            const sceneScript = script.substring(startIdx, endIdx).trim();
            
            const timeStart = i * sceneDuration;
            const timeEnd = Math.min((i + 1) * sceneDuration, totalDuration);
            
            scenes.push({
                sceneNumber: i + 1,
                timeStart,
                timeEnd,
                duration: timeEnd - timeStart,
                script: sceneScript,
                description: sceneScript.substring(0, 150) + (sceneScript.length > 150 ? '...' : ''),
            });
        }
    }
    
    return scenes;
}

/**
 * Generate time-wise prompts for each frame based on scenes
 */
export async function generateFramePrompts(
    config: VideoFlowConfig,
    frameCount: number
): Promise<FramePrompt[]> {
    const maxDuration = MODEL_MAX_DURATIONS[config.model || 'Veo 3.1 Fast'] || 8;
    
    // Generate or use provided script
    const script = await generateVideoScript(config, frameCount);
    
    // Divide script into scenes
    const scenes = divideScriptIntoScenes(script, config.totalDuration, frameCount);
    
    const frames: FramePrompt[] = [];
    
    for (let i = 0; i < frameCount; i++) {
        const timeStart = i * maxDuration;
        const timeEnd = Math.min((i + 1) * maxDuration, config.totalDuration);
        const scene = scenes[i] || scenes[scenes.length - 1];
        
        // Generate visual prompt from scene script
        let prompt = scene.script;
        
        // If script is too long, summarize it for the prompt
        if (prompt.length > 200) {
            // Use AI to create a concise visual prompt from the scene
            try {
                const visualPromptRequest = `Create a concise visual description (max 100 words) for a video scene based on this script excerpt:

${scene.script}

The description should be:
- Visual and cinematic
- Suitable for AI video generation
- Focus on what can be seen on screen
- Include key visual elements, actions, and atmosphere

Return only the visual description, no explanations.`;
                
                const visualResponse = await queryCanvasPrompt(visualPromptRequest, 200);
                prompt = typeof visualResponse === 'string' 
                    ? visualResponse 
                    : (visualResponse.response || visualResponse.enhanced_prompt || scene.description);
            } catch (error) {
                console.error('[generateFramePrompts] Error generating visual prompt:', error);
                // Use scene description as fallback
                prompt = scene.description;
            }
        }
        
        // Add style if specified
        if (config.style) {
            prompt = `${prompt}, ${config.style} style`;
        }
        
        frames.push({
            frameIndex: i,
            timeStart,
            timeEnd,
            prompt: prompt.trim(),
            sceneNumber: scene.sceneNumber,
            sceneScript: scene.script,
        });
    }
    
    return frames;
}

/**
 * Parse user message to extract video flow config
 */
export function parseVideoFlowRequest(message: string): VideoFlowConfig | null {
    const lowerMessage = message.toLowerCase();
    
    // Normalize common typos
    const normalizedMessage = lowerMessage
        .replace(/minite/g, 'minute')
        .replace(/minit/g, 'minute')
        .replace(/vidoe/g, 'video')
        .replace(/vido/g, 'video')
        .replace(/vedio/g, 'video');
    
    // Check if it's a video generation request - more flexible patterns
    const videoKeywords = [
        'video', 
        'generate video', 
        'create video', 
        'make video', 
        'produce video',
        'want to generate',
        'want to create',
        'want to make',
        'i want',
        'generate a video',
        'create a video',
        'make a video',
        'advertisement', // "video advertisement" is a common pattern
        'ad', // "video ad"
        'commercial', // "video commercial"
    ];
    const isVideoRequest = videoKeywords.some(keyword => normalizedMessage.includes(keyword));
    
    if (!isVideoRequest) {
        console.log('[parseVideoFlowRequest] Not a video request - no video keywords found in:', normalizedMessage);
        return null;
    }
    
    console.log('[parseVideoFlowRequest] Video request detected, extracting duration from:', message);
    
    // Extract duration - more flexible patterns (check both original and normalized)
    let totalDuration = 0;
    const durationPatterns = [
        // "1 minute video" or "1 min video" (with typo tolerance)
        { pattern: /(\d+)\s*(?:minute|minit|minite|min|m)\s*(?:video|vidoe|vido|vedio|vid|advertisement|ad|commercial)/i, multiplier: 60 },
        // "1 second video" or "1 sec video"
        { pattern: /(\d+)\s*(?:second|sec|s)\s*(?:video|vidoe|vido|vedio|vid|advertisement|ad|commercial)/i, multiplier: 1 },
        // "1 minute" anywhere in message (with typo tolerance)
        { pattern: /(\d+)\s*(?:minute|minit|minite|min|m)\b/i, multiplier: 60 },
        // "1 second" anywhere in message
        { pattern: /(\d+)\s*(?:second|sec|s)\b/i, multiplier: 1 },
        // "60 seconds" or "60s"
        { pattern: /(\d+)\s*s\b/i, multiplier: 1 },
    ];
    
    // Try original message first, then normalized
    for (const { pattern, multiplier } of durationPatterns) {
        let match = message.match(pattern);
        if (!match) {
            match = normalizedMessage.match(pattern);
        }
        if (match) {
            totalDuration = parseInt(match[1]) * multiplier;
            console.log('[parseVideoFlowRequest] Duration extracted:', totalDuration, 'seconds (from pattern match:', match[0], ')');
            break;
        }
    }
    
    // If duration > 12 seconds, this qualifies for template flow
    if (totalDuration <= 12) {
        console.log('[parseVideoFlowRequest] Duration', totalDuration, 'seconds is <= 12, not qualifying for template flow');
        return null;
    }
    
    console.log('[parseVideoFlowRequest] Duration', totalDuration, 'seconds qualifies for template flow');
    
    // Extract topic (everything after "of" or "about" or before duration)
    // Use normalized message for better matching
    let topic = message;
    const topicPatterns = [
        // "video advertisement of X" or "video ad of X"
        /(?:video|vidoe|vido|vedio)\s+(?:advertisement|ad|commercial)\s+(?:of|about)\s+(.+?)(?:\s+\d+|\s+and|\s+tell|\s*$)/i,
        // "video of X" or "generate video of X"
        /(?:video|vidoe|vido|vedio|generate|create|make|produce)\s+(?:of|about)\s+(.+?)(?:\s+\d+|\s+and|\s+tell|\s*$)/i,
        // "of X" or "about X"
        /(?:of|about)\s+(.+?)(?:\s+\d+|\s+and|\s+tell|\s*$)/i,
        // "1 minute video of X" - more specific (with typo tolerance)
        /\d+\s*(?:minute|minit|minite|min|m|second|sec|s)\s*(?:video|vidoe|vido|vedio|vid|advertisement|ad|commercial)\s+(?:of|about)\s+(.+?)(?:\s+and|\s+tell|\s*$)/i,
        // "generate X video" - topic before video
        /(?:generate|create|make|produce)\s+(.+?)\s+(?:video|vidoe|vido|vedio|advertisement|ad|commercial)/i,
    ];
    
    // Try both original and normalized message
    for (const pattern of topicPatterns) {
        let match = message.match(pattern);
        if (!match) {
            match = normalizedMessage.match(pattern);
        }
        if (match && match[1]) {
            topic = match[1].trim();
            // Remove duration mentions from topic
            topic = topic.replace(/\d+\s*(?:minute|minit|minite|min|second|sec|m|s)/gi, '').trim();
            // Remove common words that might interfere
            topic = topic.replace(/\b(?:video|vidoe|vido|vedio|vid|advertisement|ad|commercial|and|telling|is|all|things|benefits|benfirst)\b/gi, '').trim();
            if (topic.length > 3) {
                break;
            }
        }
    }
    
    // If topic extraction failed, try to extract from common patterns
    if (topic === message || topic.length < 3) {
        // Try to find topic after "of" or before duration
        let ofMatch = message.match(/(?:of|about)\s+([^0-9]+?)(?:\s+\d+|\s+and|\s+tell|\s*$)/i);
        if (!ofMatch) {
            ofMatch = normalizedMessage.match(/(?:of|about)\s+([^0-9]+?)(?:\s+\d+|\s+and|\s+tell|\s*$)/i);
        }
        if (ofMatch && ofMatch[1]) {
            topic = ofMatch[1].trim();
            topic = topic.replace(/\d+\s*(?:minute|minit|minite|min|second|sec|m|s)/gi, '').trim();
            topic = topic.replace(/\b(?:video|vidoe|vido|vedio|vid|advertisement|ad|commercial|and|telling|is|all|things|benefits|benfirst)\b/gi, '').trim();
        }
    }
    
    // Final fallback: if topic is still the whole message, try to extract meaningful part
    if (topic === message || topic.length < 3) {
        // Look for common product/service words
        const productMatch = normalizedMessage.match(/(?:of|about|for)\s+([a-z\s]{3,30}?)(?:\s+\d+|\s+and|\s+tell|\s+benefit|\s*$)/i);
        if (productMatch && productMatch[1]) {
            topic = productMatch[1].trim();
        }
    }
    
    console.log('[parseVideoFlowRequest] Topic extracted:', topic);
    
    // Extract style
    let style: string | undefined;
    const styleKeywords = ['cinematic', 'epic', 'dramatic', 'realistic', 'animated', 'cartoon'];
    for (const keyword of styleKeywords) {
        if (lowerMessage.includes(keyword)) {
            style = keyword;
            break;
        }
    }
    
    // Extract aspect ratio
    let aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | undefined;
    if (lowerMessage.includes('reel') || lowerMessage.includes('vertical') || lowerMessage.includes('9:16')) {
        aspectRatio = '9:16';
    } else if (lowerMessage.includes('widescreen') || lowerMessage.includes('movie') || lowerMessage.includes('16:9')) {
        aspectRatio = '16:9';
    } else if (lowerMessage.includes('square') || lowerMessage.includes('1:1')) {
        aspectRatio = '1:1';
    }
    
    // Extract resolution
    let resolution: string | undefined;
    const resolutionMatch = message.match(/(\d+)p/i);
    if (resolutionMatch) {
        resolution = resolutionMatch[1] + 'p';
    }
    
    // Extract model
    let model: string | undefined;
    if (lowerMessage.includes('veo 3.1 fast') || lowerMessage.includes('veo3.1 fast')) {
        model = 'Veo 3.1 Fast';
    } else if (lowerMessage.includes('veo 3.1') || lowerMessage.includes('veo3.1')) {
        model = 'Veo 3.1';
    } else if (lowerMessage.includes('seedance 1.0 pro') || lowerMessage.includes('seedance1.0pro')) {
        model = 'Seedance 1.0 Pro';
    } else if (lowerMessage.includes('seedance 1.0 lite') || lowerMessage.includes('seedance1.0lite')) {
        model = 'Seedance 1.0 Lite';
    }
    
    // Extract user-provided script (if any)
    let userScript: string | undefined;
    const scriptPatterns = [
        /script[:\s]+(.+?)(?:\s+\d+|\s*$)/i,
        /here is the script[:\s]+(.+?)(?:\s+\d+|\s*$)/i,
        /use this script[:\s]+(.+?)(?:\s+\d+|\s*$)/i,
    ];
    
    for (const pattern of scriptPatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
            userScript = match[1].trim();
            break;
        }
    }
    
    // If no explicit script pattern found, check if message contains a long text that might be a script
    // (e.g., if message is very long and contains multiple sentences/paragraphs)
    if (!userScript && message.length > 200) {
        // Check if it looks like a script (has multiple sentences, paragraphs, etc.)
        const sentenceCount = (message.match(/[.!?]+/g) || []).length;
        const paragraphCount = (message.match(/\n\n+/) || []).length;
        
        if (sentenceCount > 3 || paragraphCount > 0) {
            // Might be a script, extract everything after topic extraction
            const topicIndex = message.toLowerCase().indexOf(topic.toLowerCase());
            if (topicIndex >= 0) {
                const afterTopic = message.substring(topicIndex + topic.length).trim();
                if (afterTopic.length > 100) {
                    userScript = afterTopic;
                }
            }
        }
    }
    
    return {
        totalDuration,
        topic: topic || 'Untitled Video',
        style,
        aspectRatio: aspectRatio || '16:9',
        resolution: resolution || '720p',
        model: model || 'Veo 3.1 Fast',
        userScript,
    };
}
