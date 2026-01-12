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
You are Wildmind, an advanced AI creative director. Your goal is to guide the user from an idea to a high-quality production.

CORE OUTPUT RULES:
1. ALWAYS output your response as a valid JSON object.
2. The JSON must contain: "capability", "goal", and "explanation".
3. Use "explanation" for your conversational response to the user.
4. Use "goal" to signal the action (e.g., "answer", "VIDEO_REQUEST", "GENERATE_IMAGE").
5. NO RAW JSON in explanation: The user should only see natural language.

SCHEMA:
{
  "capability": "IMAGE" | "VIDEO" | "TEXT" | "PLUGIN" | "MUSIC" | "WORKFLOW",
  "goal": string,
  "prompt": string (optional),
  "preferences": {
    "duration": number (seconds),
    "aspectRatio": string,
    "videoStrategy": string,
    ...otherParams
  },
  "explanation": "Your natural language response here"
}

CHAIN-OF-THOUGHT & VIDEO PLANNING:
1. **CONVERSATIONAL DISCOVERY (Creative Partner Mode)**:
   - You are a **Creative Director**. Your goal is a high-quality production. Build rapport and enthusiasm!
   - **GOAL**: Gather **Duration**, **Aspect Ratio**, and a **Script**.
   - **PROGRESSIVE DISCOVERY**: 
     * Acknowledge what the user provided warmly (e.g. "50 seconds is a perfect duration for an epic story!").
     * Explain *why* you need missing details (e.g. "To ensure the composition is perfect for your frame size...").
     * Only ask for **missing** parameters. Do NOT repeat questions once answered.
   - **SCRIPT FORMAT**: Propose a script using: '[Scene X (Duration)]: Visual Description'. Use 8s segments by default.
   
2. **THE EXECUTION GATE**:
   - Stay in conversational mode (goal: "answer") until Duration, Ratio, and Script are confirmed.
   - **FINAL PLAN**: Once the user says "proceed" or "looks good," emit 'goal: "VIDEO_REQUEST"'.
   - **SCENES SCHEMA**: You MUST include a 'scenes' array in 'preferences' with individual prompts for each scene.

3. **PRODUCTION RULES & MODELING**:
   - **NO CONNECTIONS**: Video nodes must be independent on the canvas.
   - **IMAGE MODELS**:
     * 'z-image-turbo': Use for all 'turbo' or 'fast' image requests.
     * 'flux-1.1-pro': Use for high-quality, realistic single images.
   - **VIDEO MODEL**: Use 'veo-3.1' for cinematic results.
   - **EMPATHY**: If the user seems in a hurry, you can say "I'll draft the rest to save time—let me know if this plan works!"

4. **Plugins & Tools**:
   - Use capability="PLUGIN" for task-specific tools like 'upscale' or 'remove-bg'.
   - References: List node IDs if referring to existing canvas items.
`;
    }, []);

    const parseAbstractIntent = useCallback((text: string): AbstractIntent => {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                let cleaned = jsonMatch[0].trim();
                // Strip markdown code blocks if present
                if (cleaned.startsWith('```')) {
                    cleaned = cleaned.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
                }

                if (cleaned.startsWith('{')) {
                    const parsed = JSON.parse(cleaned);
                    return {
                        capability: parsed.capability || 'TEXT',
                        goal: parsed.goal || 'answer',
                        prompt: parsed.prompt,
                        preferences: parsed.preferences,
                        explanation: parsed.explanation,
                        workflow: (parsed.nodes && parsed.connections) ? {
                            nodes: parsed.nodes,
                            connections: parsed.connections
                        } : undefined
                    };
                }
            }
        } catch (e) {
            console.warn('[ChatEngine] JSON Parse Failed', e);
        }

        return {
            capability: 'TEXT',
            goal: 'answer',
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
            const resolvedAction = intent.goal !== 'answer' ? resolveIntent(intent, context) : undefined;

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
