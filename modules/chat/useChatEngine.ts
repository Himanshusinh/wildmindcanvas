import { useState, useCallback, useEffect } from 'react';
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
        [key: string]: any;
    };
    canvasSelection: {
        selectedImageModalIds?: string[];
        selectedVideoModalIds?: string[];
        selectedRichTextIds?: string[];
        selectedGroupIds?: string[];
        selectedImageIds?: string[];
        [key: string]: any;
    };
    [key: string]: any;
}

import { CAPABILITY_REGISTRY } from './capabilityRegistry';

const STORAGE_KEY = 'wildmind_chat_history';

export function useChatEngine(context?: CanvasContext) {
    // Initialize from LocalStorage
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load chat history:', error);
            return [];
        }
    });

    const [isProcessing, setIsProcessing] = useState(false);

    // Persist to LocalStorage whenever messages change
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
            } catch (error) {
                console.error('Failed to save chat history:', error);
            }
        }
    }, [messages]);

    const buildCanvasContextString = useCallback(() => {
        if (!context || !context.canvasState) return "";
        const { imageModalStates = [], richTextStates = [], images = [], sceneFrameModalStates = [], videoModalStates = [] } = context.canvasState;

        let summary = "Current Canvas Status:\n";
        if (imageModalStates.length > 0) {
            summary += `- ${imageModalStates.length} Image Generator(s): ${imageModalStates.map((m: any) => m.prompt ? `"${m.prompt}" (${m.model || 'unknown'})` : 'Empty').join(', ')}\n`;
        }
        if (videoModalStates.length > 0) {
            summary += `- ${videoModalStates.length} Video Generator(s): ${videoModalStates.map((v: any) => v.prompt ? `"${v.prompt}" (${v.model || 'unknown'})` : 'Empty').join(', ')}\n`;
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
        let prompt = `ROLE: You are the Universal Workflow Engine for a generative canvas. Your job is to translate user requests into EXECUTABLE JSON intents.
STRICT OUTPUT FORMAT: JSON ONLY per the schema below. No conversational text.

CAPABILITY REGISTRY (Available Models with I/O):
`;

        // Serialize Image Models
        prompt += `TYPE: IMAGE\n`;
        if (CAPABILITY_REGISTRY.IMAGE && CAPABILITY_REGISTRY.IMAGE.models) {
            Object.values(CAPABILITY_REGISTRY.IMAGE.models).forEach((m: any) => {
                prompt += `- ID: "${m.id}" | In: ${m.inputType} | Out: ${m.outputType} | Batch: ${m.maxBatch} | Strengths: ${m.strengths?.join(', ')}\n`;
            });
        }

        // Serialize Video Models
        prompt += `\nTYPE: VIDEO\n`;
        if (CAPABILITY_REGISTRY.VIDEO && CAPABILITY_REGISTRY.VIDEO.models) {
            Object.values(CAPABILITY_REGISTRY.VIDEO.models).forEach((m: any) => {
                prompt += `- ID: "${m.id}" | In: ${m.inputType} | Out: ${m.outputType} | Window: ${m.contextWindow}s | Strengths: ${m.strengths?.join(', ')}\n`;
            });
        }

        prompt += `\nTYPE: MUSIC / AUDIO\n`;
        if (CAPABILITY_REGISTRY.MUSIC && CAPABILITY_REGISTRY.MUSIC.models) {
            Object.values(CAPABILITY_REGISTRY.MUSIC.models).forEach((m: any) => {
                prompt += `- ID: "${m.id}" | In: ${m.inputType} | Out: ${m.outputType}\n`;
            });
        }

        prompt += `\nTYPE: PLUGIN (Upscale, BG Removal, etc.)\n`;
        if (CAPABILITY_REGISTRY.PLUGIN && CAPABILITY_REGISTRY.PLUGIN.models) {
            Object.values(CAPABILITY_REGISTRY.PLUGIN.models).forEach((m: any) => {
                prompt += `- ID: "${m.id}" | In: ${m.inputType} | Out: ${m.outputType}\n`;
            });
        }

        prompt += `\nTYPE: TEXT\n`;
        prompt += `- ID: "standard" | In: none | Out: text\n`;

        prompt += `
OUTPUT SCHEMA (Single OR Workflow):

OPTION 1: SINGLE ACTION
{
  "capability": "IMAGE" | "VIDEO" | "TEXT" | "MUSIC" | "PLUGIN",
  "goal": "generate",
  "prompt": "...",
  "preferences": { ... },
  "explanation": "..."
}

OPTION 2: WORKFLOW (For multi-step or complex requests)
{
  "capability": "WORKFLOW",
  "explanation": "Brief summary of the plan",
  "nodes": [
    { 
      "id": "node-1", 
      "capability": "TEXT", 
      "model": "standard", 
      "params": { "text": "Script..." },
      "pos": { "x": 0, "y": 0 } 
    },
    { 
      "id": "node-2", 
      "capability": "IMAGE", 
      "model": "google-nano-banana", 
      "params": { "prompt": "..." },
      "inputFromNodeId": "node-1" // Optional: Just for logic, not strict
    }
  ],
  "connections": [
    { "fromNodeId": "node-1", "toNodeId": "node-2" }
  ]
}

You are the Semantic Interpreter for a Canvas AI.
Your ONLY job is to extract the user's INTENT and CONSTRAINTS.
You NEVER generate execution plans, nodes, or graphs.
You NEVER do math or calculate segments.

Output strictly valid JSON obeying AbstractIntent.

RULES:
1. For Video: Extract "topic", "duration" (in seconds), "style", "aspectRatio".
   - Put "duration" in preferences.duration.
   - Put "style" in preferences.style.
   - Do NOT try to split the video into clips. Just report the total duration.
2. For Music Video: Set intent="MUSIC_VIDEO" (if schema allows) or goal="MUSIC_VIDEO".
3. For Workflows: Just report the GOAL (e.g. "Create story about X"). Do NOT design the workflow.
4. For Plugins (Upscale, Remove BG, etc.): 
   - Set capability="PLUGIN".
   - Use the specific model ID (e.g. "upscale", "remove-bg").
   - VERY IMPORTANT: If the user refers to "this", "that", "the selection", or you see relevant node IDs in the context, ensure they are listed in the "references" array.

Example:
User: "Create a 1 minute video of Ramayan, cinematic style"
Output:
{
  "capability": "VIDEO",
  "goal": "VIDEO_REQUEST",
  "prompt": "Ramayan",
  "preferences": {
    "duration": 60,
    "style": "cinematic"
  }
}

User: "Create a music video for a cyberpunk song"
Output:
{
  "capability": "VIDEO", 
  "goal": "MUSIC_VIDEO",
  "prompt": "Cyberpunk song",
  "preferences": { ... }
}

CHAIN-OF-THOUGHT RULES:
1. **Analyze User Intent & Interactive Planning**: 
   - If the request is ambiguous, ASK the user for details first.
   - **Constraint Handling**: You do NOT need to calculate node counts. The system code handles duration math.
   - **Your Job**: Extract 'topic' and 'style'; Put 'duration' (in seconds) into 'preferences.duration'.
   
2. **Model Selection Strategy**:
   - For Long Videos (>10s): PREFER models with high 'contextWindow' (e.g. Veo, Sora).
   - For Character Consistency: PREFER models like Seedance.
   - For Upscaling: Use 'upscale' plugin.
   - For Removing Background: Use 'remove-bg' plugin.
   - For Removing Objects/Text/Chat/Watermarks: Use 'erase-replace' plugin.
   - For Expanding/Outpainting: Use 'expand-image' plugin.
   - For Vectorizing (Image to SVG): Use 'vectorize' plugin.
   - For Multiangle Camera: Use 'multiangle-camera' plugin.

4. **Layout & Coordinates**:
   - Use 'pos: { x, y }' purely as a hint; the system will auto-layout.

5. **Variety**: Use "strengths" metadata. If user asks for "Anime", pick a model with "anime" strength.
`;
        return prompt;
    }, []);

    const parseAbstractIntent = useCallback((text: string): AbstractIntent => {
        // 1. Try JSON Parsing (Priority)
        try {
            // Find JSON object in text
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                // Handle WORKFLOW
                if (parsed.capability === 'WORKFLOW') {
                    return {
                        capability: 'WORKFLOW',
                        goal: 'execute_workflow',
                        explanation: parsed.explanation,
                        // Pass the raw graph to the payload
                        preferences: { // abusing preferences to store the graph for now or use a specific field
                            workflowGraph: {
                                nodes: parsed.nodes,
                                connections: parsed.connections
                            }
                        }
                    };
                }

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
        else if (lowerText.match(/upscale|enhance|crystal|topaz|res/i)) capability = 'PLUGIN';
        else if (lowerText.match(/remove.*bg|bg.*remove|transparent|background/i)) capability = 'PLUGIN';
        else if (lowerText.match(/erase|replace|inpaint/i)) capability = 'PLUGIN';
        else if (lowerText.match(/expand|outpaint/i)) capability = 'PLUGIN';
        else if (lowerText.match(/vectorize|svg/i)) capability = 'PLUGIN';
        else if (lowerText.match(/camera|angle|tilt|rotate/i)) capability = 'PLUGIN';

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
            'flux 2 pro': 'flux-2-pro',
            'flux 2': 'flux-2-pro',
            'kontext max': 'flux-kontext-max',
            'context max': 'flux-kontext-max',
            'kontext pro': 'flux-kontext-pro',
            'context pro': 'flux-kontext-pro',
            'flux pro': 'flux-pro-1.1',
            'flux ultra': 'flux-pro-1.1-ultra',
            'flux 1.1': 'flux-pro-1.1',
            'flux': 'flux-2-pro', // Match generic 'flux' last
            'kontext': 'flux-kontext-pro',
            'seedream': 'seedream-v4',
            'seedream 4.5': 'seedream-4.5',
            'imagen': 'imagen-4',
            'imagen 4': 'imagen-4',
            'imagen 4 ultra': 'imagen-4-ultra',
            'imagen fast': 'imagen-4-fast',
            'chatgpt': 'chatgpt-1.5',
            'upscale': 'upscale',
            'enhance': 'upscale',
            'crystal': 'upscale',
            'topaz': 'upscale',
            'remove bg': 'remove-bg',
            'remove-bg': 'remove-bg',
            'background': 'remove-bg',
            'rembg': 'remove-bg',
            'erase': 'erase-replace',
            'replace': 'erase-replace',
            'inpaint': 'erase-replace',
            'clean': 'erase-replace',
            'remove': 'erase-replace',
            'delete': 'erase-replace',
            'expand': 'expand-image',
            'outpaint': 'expand-image',
            'vectorize': 'vectorize-image',
            'svg': 'vectorize-image',
            'camera': 'multiangle-camera',
            'multiangle': 'multiangle-camera'
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
                    finalAbstract = {
                        ...finalAbstract,
                        ...parsedIntent,
                        preferences: {
                            ...finalAbstract.preferences,
                            ...parsedIntent.preferences
                        }
                    };
                }
            } else if (aiResult && aiResult.enhanced_prompt) {
                // Fallback if it put the JSON in enhanced_prompt
                const parsedIntent = parseAbstractIntent(aiResult.enhanced_prompt);
                if (parsedIntent.capability !== 'UNKNOWN') {
                    finalAbstract = {
                        ...finalAbstract,
                        ...parsedIntent,
                        preferences: {
                            ...finalAbstract.preferences,
                            ...parsedIntent.preferences
                        }
                    };
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

    return {
        messages,
        isProcessing,
        sendMessage,
        clearMessages: () => {
            setMessages([]);
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(STORAGE_KEY);
            }
        }
    };
}
