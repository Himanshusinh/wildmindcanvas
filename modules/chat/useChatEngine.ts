import { useState, useCallback, useEffect, useMemo } from 'react';
import { IntentAction, AbstractIntent, CapabilityType } from './intentSchemas';
import { queryCanvasPrompt } from '@/core/api/api';
import { resolveIntent } from './capabilityResolver';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    action?: IntentAction;
    timestamp: number;
}

export interface CanvasContext {
    canvasState: {
        imageModalStates?: any[];
        richTextStates?: any[];
        sceneFrameModalStates?: any[];
        images?: any[];
        videoModalStates?: any[];
    };
    canvasSelection: any;
}

const buildCanvasContextString = (context: CanvasContext): string => {
    const { canvasState, canvasSelection } = context;
    const summaries: string[] = [];

    if (canvasState.images?.length) {
        summaries.push(`Images: ${canvasState.images.map(i => `${i.id} (${i.prompt || 'Untitled'})`).join(', ')}`);
    }
    if (canvasState.videoModalStates?.length) {
        summaries.push(`Videos: ${canvasState.videoModalStates.map(v => `${v.id} (${v.prompt || 'Untitled'})`).join(', ')}`);
    }

    const selectedIds = canvasSelection?.selectedIds || [];
    if (selectedIds.length) {
        summaries.push(`Currently Selected Item IDs: ${selectedIds.join(', ')}`);
    }

    return summaries.join('\n');
};

export const useChatEngine = (context: CanvasContext) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const buildSystemPrompt = useMemo(() => {
        return `
You are the "Semantic Understanding" layer of a Canvas AI Agent. 
Your role is to translate user requests into a high-level **SemanticGoal**.

CONSTRAINTS:
1. NEVER "create things". You only explain intent.
2. NEVER pick models or decide number of components.
3. NEVER perform duration math (e.g., segment counts).
4. NEVER decide layout or connections.

You output a SINGLE JSON object representing the user's creative goal.

GOAL TYPES:
- IMAGE_GENERATION: Create one or more static images.
- STORY_VIDEO: Cinematic, multi-scene video production.
- MUSIC_VIDEO: Production involving both audio and visuals.
- MOTION_COMIC: Stylized animated sequences.
- IMAGE_ANIMATE: Turning existing static images into motion.
- EXPLAIN_CANVAS: Answer questions about canvas content OR explain how to use features (tutorials).
- MODIFY_EXISTING_FLOW: Change specific parts of a previous production.
- DELETE_CONTENT: Remove items from the canvas (e.g. "delete all plugins", "remove video").
- PLUGIN_ACTION: Apply a specific tool or effect (e.g. "upscale", "remove background", "vectorize").
- CLARIFY: If the request is too vague to map to a goal.

SCHEMA:
{
  "goalType": "IMAGE_GENERATION" | "STORY_VIDEO" | "MUSIC_VIDEO" | "MOTION_COMIC" | "IMAGE_ANIMATE" | "EXPLAIN_CANVAS" | "MODIFY_EXISTING_FLOW" | "DELETE_CONTENT" | "PLUGIN_ACTION" | "CLARIFY",
  "topic": string (e.g. "Ramayan", "Space exploration"),
  "pluginType": string (e.g. "upscale", "remove-bg", "multiangle", "vectorize", "erase"),
  "durationSeconds": number (Optional, e.g. 60),
  "style": string (e.g. "cinematic", "cyberpunk"),
  "aspectRatio": "1:1" | "16:9" | "9:16" | "4:3" | "3:4" (Optional),
  "resolution": string (Optional, video resolution e.g. "720p", "1080p", "480p"),
  "count": number (Optional, quantity of items to generate),
  "model": string (Optional, specific model name if requested e.g. "seedream-4.5"),
  "needs": ["text", "image", "video", "audio", "motion", "plugin"],
  "references": string[] (IDs of selected/mentioned nodes),
  "explanation": "Your natural language conversational response"
}

UI KNOWLEDGE BASE (For Explanations):
- To use Plugins (Upscale, Remove BG, etc):
  1. Select an Image node on the canvas.
  2. Ask chat "Upscale this" (Automated) OR Drag the Plugin from the sidebar (Manual).
  3. If Manual: Connect the Image Node output to the Plugin Input.
  4. Click "Run" on the plugin.
- To Generate Images/Videos:
  1. Type "Create an image of..." in chat OR Drag "Image Gen" from sidebar.
  2. If using sidebar node: Connect a Text node (prompt) to input.
- Connections: Drag from the right-side handle of a node to the left-side handle of another.

INTENT NORMALIZATION RULES:
- If user says "1 minute", "one min" -> durationSeconds: 60
- If user says "reel", "short", "vertical" -> aspectRatio: "9:16"
- If user says "widescreen", "movie" -> aspectRatio: "16:9"
- If user says "cinematic", "epic" -> style: "cinematic"
- If user says "delete", "remove", "clear" -> goalType: "DELETE_CONTENT"
- If user COMMANDS "upscale", "enhance" -> goalType: "PLUGIN_ACTION", pluginType: "upscale"
- If user ASKS "how to upscale" -> goalType: "EXPLAIN_CANVAS"
- If user COMMANDS "remove background" -> goalType: "PLUGIN_ACTION", pluginType: "remove-bg"
- If user COMMANDS "add to image", "modify", "convert", "turn", "make it", "use this image" -> goalType: "IMAGE_GENERATION", needs: ["image"]
- If user COMMANDS "animate", "make it move", "make it video", "convert to video", "animate this", "bring to life" -> goalType: "IMAGE_ANIMATE"
- If user says "classic", "tv" -> aspectRatio: "4:3"

MODEL SELECTION AND PARAMETER EXTRACTION (for video generation):
- Auto-select model based on duration if not specified:
  * 4, 6, or 8 seconds -> Use "Veo 3.1 Fast" or "Veo 3.1" (they support 4, 6, 8s)
  * 9-12 seconds -> Use "Seedance 1.0 Pro" or "Seedance 1.0 Lite" (they support up to 12s)
- Model name variations to recognize (if explicitly mentioned):
  * "veo 3.1 fast", "veo3.1 fast", "veo-3.1-fast", "veo3.1fast" -> "Veo 3.1 Fast"
  * "veo 3.1", "veo3.1", "veo-3.1" -> "Veo 3.1"
  * "seedance 1.0 pro", "seedance1.0pro", "seedance-1.0-pro" -> "Seedance 1.0 Pro"
  * "seedance 1.0 lite", "seedance1.0lite", "seedance-1.0-lite" -> "Seedance 1.0 Lite"
- Resolution extraction:
  * Extract resolution from messages like "720p", "1080p", "480p", "720", "1080"
  * Set in "resolution" field
  * Veo 3.1 / Veo 3.1 Fast support: 720p, 1080p
  * Seedance 1.0 Pro/Lite support: 480p, 720p, 1080p
- Examples:
  * "convert this to video in veo 3.1 fast at 1080p" -> model: "Veo 3.1 Fast", resolution: "1080p"
  * "make this a 6 second video" -> model: "Veo 3.1 Fast" (auto-selected for 6s), durationSeconds: 6
  * "create a 10 second video at 720p" -> model: "Seedance 1.0 Pro" (auto-selected for 10s), durationSeconds: 10, resolution: "720p"
  * "animate this with seedance in 1080p" -> model: "Seedance 1.0 Pro", resolution: "1080p"
  * "convert to video at 720p resolution" -> model: "Veo 3.1 Fast" (default), resolution: "720p"

Your "explanation" should build rapport and enthusiasm like a Creative Director, but the structured JSON must remain strictly semantic.
`;
    }, []);

    const parseAbstractIntent = useCallback((text: string): AbstractIntent => {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                let cleaned = jsonMatch[0].trim();
                if (cleaned.startsWith('```')) {
                    cleaned = cleaned.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
                }

                if (cleaned.startsWith('{')) {
                    const parsed = JSON.parse(cleaned);
                    return {
                        goalType: parsed.goalType || 'UNKNOWN',
                        topic: parsed.topic,
                        durationSeconds: parsed.durationSeconds,
                        style: parsed.style,
                        aspectRatio: parsed.aspectRatio,
                        resolution: parsed.resolution,
                        count: parsed.count,
                        model: parsed.model,
                        pluginType: parsed.pluginType,
                        needs: parsed.needs || [],
                        references: parsed.references || [],
                        explanation: parsed.explanation || "I've extracted your intent."
                    };
                }
            }
        } catch (e) {
            console.warn('[ChatEngine] JSON Parse Failed', e);
        }

        return {
            goalType: 'CLARIFY',
            needs: [],
            explanation: text.trim()
        };
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsProcessing(true);

        try {
            const contextStr = buildCanvasContextString(context);
            const historyStr = messages.slice(-10).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
            const selectedIds = context.canvasSelection?.selectedIds || [];

            const fullPayload = `${buildSystemPrompt} \n\n[CONTEXT]\n${contextStr} \nSelected: ${selectedIds.join(', ')} \n\n[CHAT HISTORY]\n${historyStr} \n\nUSER REQUEST: "${text}"`;

            const rawResponse = await queryCanvasPrompt(fullPayload);
            // queryCanvasPrompt returns { type, enhanced_prompt, response }
            const assistantResponse = typeof rawResponse === 'string' ? rawResponse : (rawResponse.response || '');

            const intent = parseAbstractIntent(assistantResponse);
            // resolveIntent requires (intent, context)
            const resolvedAction = intent.goalType !== 'CLARIFY' ? resolveIntent(intent, context) : undefined;

            const assistantMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: intent.explanation || (typeof intent === 'string' ? intent : 'I understand.'),
                action: resolvedAction ? {
                    ...resolvedAction,
                    confidence: 1
                } : undefined,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            console.error('[ChatEngine] Error:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [context, messages, buildSystemPrompt, parseAbstractIntent]);

    const clearMessages = useCallback(() => setMessages([]), []);

    return {
        messages,
        isProcessing,
        sendMessage,
        clearMessages
    };
};
