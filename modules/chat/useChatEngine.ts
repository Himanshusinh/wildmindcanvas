import { useState, useCallback } from 'react';
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
    imageModalStates?: any[];
    richTextStates?: any[];
    sceneFrameModalStates?: any[];
    images?: any[];
    videoModalStates?: any[];
    canvasSelection?: {
        selectedImageModalIds?: string[];
        selectedVideoModalIds?: string[];
        selectedRichTextIds?: string[];
        selectedGroupIds?: string[];
        selectedImageIds?: string[];
    };
}

import { CAPABILITY_REGISTRY } from './capabilityRegistry';

export function useChatEngine(context?: CanvasContext) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const buildCanvasContextString = useCallback(() => {
        if (!context) return "";
        const { imageModalStates = [], richTextStates = [], images = [], sceneFrameModalStates = [] } = context;
        let summary = "Current Canvas Status:\n";
        if (imageModalStates.length > 0) {
            summary += `- ${imageModalStates.length} Image Generator(s): ${imageModalStates.map((m: any) => m.prompt ? `"${m.prompt}" (${m.model || 'unknown'})` : 'Empty').join(', ')}\n`;
        }
        if (context.videoModalStates && context.videoModalStates.length > 0) {
            summary += `- ${context.videoModalStates.length} Video Generator(s): ${context.videoModalStates.map((v: any) => v.prompt ? `"${v.prompt}" (${v.model || 'unknown'})` : 'Empty').join(', ')}\n`;
        }
        if (richTextStates.length > 0) {
            summary += `- ${richTextStates.length} Text Node(s): ${richTextStates.map((t: any) => {
                const content = t.text || t.htmlContent || "";
                return content ? `"${content.substring(0, 30)}..."` : 'Text';
            }).join(', ')}\n`;
        }
        return summary;
    }, [context]);

    const buildSystemPrompt = useCallback(() => {
        let prompt = `ROLE: You are the Intent Compiler for a generative canvas. Your job is to translate user requests into EXECUTABLE JSON intents.
STRICT OUTPUT FORMAT: JSON ONLY per the schema below. No conversational text.

CAPABILITY REGISTRY (Available Models):
`;

        // Serialize Image Models
        prompt += `TYPE: IMAGE\n`;
        if (CAPABILITY_REGISTRY.IMAGE && CAPABILITY_REGISTRY.IMAGE.models) {
            Object.values(CAPABILITY_REGISTRY.IMAGE.models).forEach((m: any) => {
                prompt += `- ID: "${m.id}" | Name: "${m.name}" | Batch: ${m.maxBatch} | Res: ${m.resolutions.join(',')} | AR: ${m.aspectRatios.join(',')}\n`;
                if (m.parameters) {
                    prompt += `  Params: ${JSON.stringify(m.parameters)}\n`;
                }
            });
        }


        // Serialize other capabilities similarly...
        prompt += `\nTYPE: PLUGIN\n`;
        if (CAPABILITY_REGISTRY.PLUGIN && CAPABILITY_REGISTRY.PLUGIN.models) {
            Object.values(CAPABILITY_REGISTRY.PLUGIN.models).forEach((m: any) => {
                prompt += `- ID: "${m.id}" | Name: "${m.name}" | Supports: ${JSON.stringify(m.supports)}\n`;
                if (m.parameters) {
                    prompt += `  Params: ${JSON.stringify(m.parameters)}\n`;
                }
            });
        }

        prompt += `\nTYPE: VIDEO (Default: seedance-1.0-pro)\n`;
        if (CAPABILITY_REGISTRY.VIDEO && CAPABILITY_REGISTRY.VIDEO.models) {
            Object.values(CAPABILITY_REGISTRY.VIDEO.models).forEach((m: any) => {
                prompt += `- ID: "${m.id}" | Name: "${m.name}" | Supports: ${JSON.stringify(m.supports)}\n`;
                if (m.parameters) {
                    prompt += `  Params: ${JSON.stringify(m.parameters)}\n`;
                }
            });
        }

        prompt += `TYPE: TEXT (Standard/Rich)\n`;
        prompt += `TYPE: MUSIC (suno-v3)\n`;

        prompt += `
OUTPUT SCHEMA:
{
  "capability": "IMAGE" | "VIDEO" | "TEXT" | "MUSIC" | "PLUGIN" | "UNKNOWN",
  "goal": "generate" | "upscale" | "remove-bg" | "answer",
  "prompt": "refined prompt optimized for the model",
  "preferences": {
    "count": number (respect maxBatch),
    "aspectRatio": "16:9" | "1:1" | "9:16",
    "resolution": "1024" | "4K",
    "preferredModel": "exact-model-id-from-registry",
    "[customParam]": "value matching Params schema"
  },
  "explanation": "brief confirmation of action"
}

RULES:
1. "preferredModel" MUST be one of the IDs listed above. Match loose terms (e.g. "turbo") to the correct ID (e.g. "z-image-turbo").
2. "count" must not exceed model's maxBatch (unless user explicitly asks for multiple batches, system handles it).
3. If "prompt" is missing, creatively infer it.
4. If "UNKNOWN", provide a helpful explanation.
`;
        return prompt;
    }, []);

    const parseAbstractIntent = useCallback((text: string): AbstractIntent => {
        // 1. Try JSON Parsing (Priority)
        try {
            // Find JSON object in text (in case there's noise)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.capability && parsed.goal) {
                    return {
                        capability: parsed.capability,
                        goal: parsed.goal,
                        prompt: parsed.prompt,
                        preferences: parsed.preferences,
                        explanation: parsed.explanation
                    };
                }
            }
        } catch (e) {
            // Fallback to regex below
        }

        // 2. Fallback Regex Parsing (Legacy support for simple queries or failure)
        const lowerText = text.toLowerCase().trim();
        let capability: CapabilityType = 'UNKNOWN';
        if (lowerText.match(/image|img|draw|paint/i)) capability = 'IMAGE';
        else if (lowerText.match(/video|vid|movie/i)) capability = 'VIDEO';
        else if (lowerText.match(/text|note|write/i)) capability = 'TEXT';
        else if (lowerText.match(/music|song|audio/i)) capability = 'MUSIC';

        // Extract preferences locally (Deterministic)
        const quality = lowerText.match(/high|best|quality|fidelity|ultra/i) ? 'high' : lowerText.match(/fast|quick|turbo|speed/i) ? 'fast' : undefined;
        const aspectRatio = lowerText.match(/(\d+:\d+)/)?.[1];

        // Robust Count Extraction
        // Matches "3 images", "generate 3 frames", "3 cats"
        const countMatch = lowerText.match(/(\d+)\s*(?:images|img|pics|vids|frames|sets|variations|copies|cats|dogs|items)?/);
        let count = countMatch ? parseInt(countMatch[1]) : 1;
        if (count > 4) count = 4; // Hard cap for initial parsing, resolved later by model constraints

        // Extract Model Preference
        // Check against known keys/names in registry (simplified list for performance)
        let preferredModel: string | undefined;
        const modelKeywords: Record<string, string> = {
            'z image': 'z-image-turbo',
            'z-image': 'z-image-turbo',
            'turbo': 'z-image-turbo',
            'p image': 'p-image',
            'p-image': 'p-image',
            'banana': 'google-nano-banana',
            'nano': 'google-nano-banana',
            'flux': 'flux-2-pro', // Match generic 'flux' to a stable one
            'flux pro': 'flux-pro-1.1',
            'flux ultra': 'flux-pro-1.1-ultra',
            'flux 1.1': 'flux-pro-1.1',
            'kontext': 'flux-kontext-pro',
            'seedream': 'seedream-v4',
            'seedream 4.5': 'seedream-4.5',
            'imagen': 'imagen-4',
            'imagen 4': 'imagen-4',
            'imagen 4 ultra': 'imagen-4-ultra',
            'imagen fast': 'imagen-4-fast',
            'chatgpt': 'chatgpt-1.5'
        };

        for (const [key, id] of Object.entries(modelKeywords)) {
            if (lowerText.includes(key)) {
                preferredModel = id;
                break; // Take first match
            }
        }

        return {
            capability,
            goal: "generate",
            prompt: text,
            preferences: { quality: quality as any, aspectRatio, count, preferredModel }
        };
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setIsProcessing(true);

        const selectedIds = [
            ...(context?.canvasSelection?.selectedImageModalIds || []),
            ...(context?.canvasSelection?.selectedVideoModalIds || []),
            ...(context?.canvasSelection?.selectedRichTextIds || []),
            ...(context?.canvasSelection?.selectedImageIds || []),
        ];

        // Default to local parse first for immediate optimisitic UI updates (optional, but skipping here for purity)
        // We go straight to AI now for the authoritative compile.
        let finalAbstract: AbstractIntent = parseAbstractIntent(text); // Fallback init
        finalAbstract.references = selectedIds;

        try {
            const contextStr = buildCanvasContextString();
            const systemPrompt = buildSystemPrompt();

            // We combine them. Note: 'queryCanvasPrompt' API treats input as 'text'.
            // Efficient way: "SYSTEM_INSTRUCTIONS\n\nCONTEXT\n\nUSER_REQUEST"
            const fullPayload = `${systemPrompt} \n\n[CONTEXT]\n${contextStr} \nSelected: ${selectedIds.join(', ')} \n\nUSER REQUEST: "${text}"`;

            const aiResult = await queryCanvasPrompt(fullPayload);

            if (aiResult && aiResult.response) { // Use 'response' field which contains the generated text
                // The AI might return the JSON in 'response' or 'enhanced_prompt' depending on the backend logic.
                // Assuming 'response' holds the completion.
                const parsedIntent = parseAbstractIntent(aiResult.response);

                // If parsed intent is valid (not UNKNOWN or has real data), replace finalAbstract
                if (parsedIntent.capability !== 'UNKNOWN') {
                    finalAbstract = { ...finalAbstract, ...parsedIntent };
                }
            } else if (aiResult && aiResult.enhanced_prompt) {
                // Fallback if it put the JSON in enhanced_prompt
                const parsedIntent = parseAbstractIntent(aiResult.enhanced_prompt);
                if (parsedIntent.capability !== 'UNKNOWN') {
                    finalAbstract = { ...finalAbstract, ...parsedIntent };
                }
            }
        } catch (err) {
            console.warn('[ChatEngine] AI Compiler Failed:', err);
        }

        const resolvedAction = resolveIntent(finalAbstract, context);

        const assistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: finalAbstract.explanation || resolvedAction.explanation || "I've compiled your request.",
            action: (resolvedAction.capability === 'UNKNOWN') ? undefined : {
                intent: resolvedAction.intent,
                confidence: 0.99,
                payload: resolvedAction.config,
                requiresConfirmation: resolvedAction.requiresConfirmation,
                explanation: resolvedAction.explanation
            } as any,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, assistantMsg]);
        setIsProcessing(false);
    }, [parseAbstractIntent, buildSystemPrompt, buildCanvasContextString, context]);

    return { messages, isProcessing, sendMessage, clearMessages: () => setMessages([]) };
}
