import { useState, useCallback, useMemo, useRef } from 'react';
import { IntentAction } from './intentSchemas';
import { queryCanvasPrompt, queryGeneralChat } from '@/core/api/api';
import { detectIntent } from './agent/intentAgent';
import { AgentSessionState, AgentTask, RequirementQuestion, VideoMode } from './agent/types';
import { buildRequirementQuestions, applyRequirementAnswer } from './agent/requirements';
import { generateScriptAndScenes } from './agent/scriptAgent';
import { buildVideoCanvasPlan } from './agent/graphPlanner';
import { validateCanvasPlan } from './agent/validator';
import type { PlanAutoFix } from './agent/validator';
import { CanvasInstructionPlan, CanvasInstructionStep } from './compiler/types';
import { findTextToImageModel, findTextToVideoModel, getDefaultTextToImageModel, getDefaultTextToVideoModel, isValidImageAspectRatio, isValidImageResolution, isValidVideoAspectRatio, isValidVideoResolution, findClosestImageResolution, findPlugin, getDefaultPluginModel } from './agent/modelCatalog';
import { decideNextForPlan } from './agent/planDecisionAgent';
import textToVideoModels from './data/textToVideoModels.json';

function parseAspectRatioFromText(text: string): string | null {
    const m = text.match(/(1:1|16:9|9:16|4:3|3:4|3:2|2:3|21:9|9:21|16:10|10:16)/);
    return m ? m[1] : null;
}

function parseResolutionFromText(text: string): string | null {
    const t = text.toLowerCase();
    const m1 = t.match(/\b(\d{3,4}x\d{3,4})\b/); // e.g. 1024x1024
    if (m1?.[1]) return m1[1];
    const m2 = t.match(/\b(1k|2k|4k|8k)\b/);
    if (m2?.[1]) return m2[1];
    const m3 = t.match(/\b(720p|1080p|1440p|2160p)\b/);
    if (m3?.[1]) return m3[1];
    const m4 = t.match(/\b(512|768|1024|1440|2048)\b/);
    if (m4?.[1]) return m4[1];
    return null;
}

function parseImageCountFromText(text: string): number | null {
    const m = text.toLowerCase().match(/(\d+)\s*(images?|pics?|pictures?)/);
    if (!m?.[1]) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Parse image reference from user message (e.g., "2nd image", "image 2", "second image")
 * Returns the 1-based index of the referenced image, or null if no reference found
 */
function parseImageReference(text: string): number | null {
    const lowerText = text.toLowerCase();
    
    // Pattern 1: "2nd image", "3rd image", "1st image", etc.
    const ordinalMatch = lowerText.match(/\b(\d+)(?:st|nd|rd|th)\s+(?:image|pic|picture)\b/);
    if (ordinalMatch?.[1]) {
        const idx = Number(ordinalMatch[1]);
        if (Number.isFinite(idx) && idx > 0) return idx;
    }
    
    // Pattern 2: "image 2", "pic 3", "picture 1", etc.
    const numberAfterMatch = lowerText.match(/\b(?:image|pic|picture)\s+(\d+)\b/);
    if (numberAfterMatch?.[1]) {
        const idx = Number(numberAfterMatch[1]);
        if (Number.isFinite(idx) && idx > 0) return idx;
    }
    
    // Pattern 3: "second image", "third image", "first image", etc.
    const wordToNumber: Record<string, number> = {
        'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
        'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
        'eleventh': 11, 'twelfth': 12, 'thirteenth': 13, 'fourteenth': 14, 'fifteenth': 15, 'sixteenth': 16
    };
    
    for (const [word, num] of Object.entries(wordToNumber)) {
        if (lowerText.includes(`${word} image`) || lowerText.includes(`${word} pic`) || lowerText.includes(`${word} picture`)) {
            return num;
        }
    }
    
    return null;
}

/**
 * Extract image reference and remaining text from user message
 * Returns { imageIndex: 1-based index or null, remainingText: text without image reference }
 */
function extractImageReference(text: string): { imageIndex: number | null; remainingText: string } {
    const imageIndex = parseImageReference(text);
    if (!imageIndex) {
        return { imageIndex: null, remainingText: text };
    }
    
    // Remove the image reference from the text
    let remainingText = text;
    const lowerText = text.toLowerCase();
    
    // Remove ordinal patterns
    remainingText = remainingText.replace(/\b\d+(?:st|nd|rd|th)\s+(?:image|pic|picture)\b/gi, '').trim();
    // Remove "image X" patterns
    remainingText = remainingText.replace(/\b(?:image|pic|picture)\s+\d+\b/gi, '').trim();
    // Remove word-based patterns
    const wordToNumber: Record<string, number> = {
        'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
        'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
        'eleventh': 11, 'twelfth': 12, 'thirteenth': 13, 'fourteenth': 14, 'fifteenth': 15, 'sixteenth': 16
    };
    for (const [word] of Object.entries(wordToNumber)) {
        remainingText = remainingText.replace(new RegExp(`\\b${word}\\s+(?:image|pic|picture)\\b`, 'gi'), '').trim();
    }
    
    // Clean up extra spaces
    remainingText = remainingText.replace(/\s+/g, ' ').trim();
    
    return { imageIndex, remainingText };
}

function parseVideoDurationSecondsFromText(text: string): number | null {
    const t = text.toLowerCase();
    const sec = t.match(/(\d+)\s*(seconds?|sec|s)\b/);
    if (sec?.[1]) {
        const n = Number(sec[1]);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    const min = t.match(/(\d+)\s*(minutes?|mins?|m)\b/);
    if (min?.[1]) {
        const n = Number(min[1]);
        const seconds = n * 60;
        return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
    }
    return null;
}

function getVideoMaxClipSeconds(modelName?: string | null): number {
    const fallback = 8;
    const models = (textToVideoModels as any)?.models as any[] | undefined;
    if (!models || models.length === 0) return fallback;
    const q = (modelName || '').toLowerCase().trim();
    const rec =
        (q ? models.find(m => String(m.name).toLowerCase() === q) : null) ||
        (q ? models.find(m => String(m.id).toLowerCase() === q) : null) ||
        models.find(m => m.isDefault) ||
        models[0];
    return rec?.temporal?.maxOutputSeconds ?? fallback;
}

/**
 * Build structured prompt for image-to-image edits.
 * Format: "Preserve original" + "Apply change" + "Keep lighting/style consistent"
 */
function buildImg2ImgPrompt(userRequest: string, style: string): string {
    const parts: string[] = [];
    
    // Preserve original
    parts.push('Preserve the original image composition, colors, and overall structure.');
    
    // Apply change
    const cleanRequest = userRequest.trim();
    if (cleanRequest) {
        parts.push(`Apply the following change: ${cleanRequest}.`);
    }
    
    // Keep lighting/style consistent
    parts.push(`Maintain consistent lighting, style, and visual coherence with the original. ${style} style.`);
    
    return parts.join(' ');
}

/**
 * Generate batch variation prompts based on variation mode.
 */
function generateBatchVariations(
    basePrompt: string,
    count: number,
    variationMode: 'same_prompt' | 'different_angles' | 'different_lighting' | 'different_styles' = 'same_prompt'
): string[] {
    if (count === 1) return [basePrompt];
    
    if (variationMode === 'same_prompt') {
        return Array(count).fill(basePrompt);
    }
    
    const variations: string[] = [];
    const angleVariations = [
        'front view',
        'side view',
        'three-quarter view',
        'back view',
        'top-down view',
        'low angle view',
        'bird\'s eye view',
        'close-up detail'
    ];
    
    const lightingVariations = [
        'natural daylight',
        'golden hour lighting',
        'soft diffused lighting',
        'dramatic high contrast lighting',
        'warm ambient lighting',
        'cool blue hour lighting',
        'studio lighting',
        'cinematic lighting'
    ];
    
    const styleVariations = [
        'photorealistic',
        'cinematic',
        'artistic',
        'minimalist',
        'vibrant',
        'muted tones',
        'high contrast',
        'soft pastel'
    ];
    
    for (let i = 0; i < count; i++) {
        let variation = basePrompt;
        
        if (variationMode === 'different_angles') {
            const angle = angleVariations[i % angleVariations.length];
            variation = `${basePrompt}, ${angle}`;
        } else if (variationMode === 'different_lighting') {
            const lighting = lightingVariations[i % lightingVariations.length];
            variation = `${basePrompt}, ${lighting}`;
        } else if (variationMode === 'different_styles') {
            const style = styleVariations[i % styleVariations.length];
            variation = `${basePrompt}, ${style} style`;
        }
        
        variations.push(variation);
    }
    
    return variations;
}

function looksLikePlanModification(text: string): boolean {
    const t = text.toLowerCase();
    return (
        t.includes('model') ||
        t.includes('use model') ||
        t.startsWith('use ') ||
        t.includes('change model') ||
        t.includes('change the model') ||
        t.includes('chnage model') ||
        t.includes('chnage the model') ||
        t.includes('switch model') ||
        t.includes('set model') ||
        t.includes('update model') ||
        t.includes('resolution') ||
        t.includes('size') ||
        t.includes('frame') ||
        t.includes('aspect') ||
        t.includes('ratio') ||
        t.includes('images') ||
        t.includes('image') && /\d+/.test(t)
    );
}

function findLastImagePlanInMessages(messages: ChatMessage[]): CanvasInstructionPlan | null {
    for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.role !== 'assistant') continue;
        const action: any = m.action;
        if (!action || action.intent !== 'EXECUTE_PLAN') continue;
        const plan = action.payload as CanvasInstructionPlan;
        const hasImageStep = Array.isArray(plan?.steps) && plan.steps.some((s: any) => s.action === 'CREATE_NODE' && s.nodeType === 'image-generator');
        if (hasImageStep) return plan;
    }
    return null;
}

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

type PlanPreviewExtras = {
    warnings: string[];
    fixes: PlanAutoFix[];
    timeline?: {
        boundaryMarks: string; // "0s → 8s → 16s ..."
        clips: Array<{ index: number; start: number; end: number; prompt?: string }>;
    };
};

const computeVideoTimeline = (plan: any): PlanPreviewExtras['timeline'] | undefined => {
    const steps = Array.isArray(plan?.steps) ? plan.steps : [];
    const videoSteps = steps.filter((s: any) => s?.action === 'CREATE_NODE' && s?.nodeType === 'video-generator');
    if (videoSteps.length === 0) return undefined;

    const clips: Array<{ duration: number; prompt?: string }> = [];
    for (const s of videoSteps) {
        const cfg = s?.configTemplate || {};
        const count = Number(s?.count || 1);
        const batch = Array.isArray(s?.batchConfigs) ? s.batchConfigs : [];
        if (count > 1) {
            for (let i = 0; i < count; i++) {
                const bc = batch[i] || {};
                const d = Number(bc.duration ?? cfg.duration);
                if (Number.isFinite(d) && d > 0) clips.push({ duration: d, prompt: String(bc.prompt ?? cfg.prompt ?? '').trim() || undefined });
            }
        } else {
            const d = Number(cfg.duration);
            if (Number.isFinite(d) && d > 0) clips.push({ duration: d, prompt: String(cfg.prompt ?? '').trim() || undefined });
        }
    }
    if (clips.length === 0) return undefined;

    let t = 0;
    const detailed = clips.map((c, idx) => {
        const start = t;
        const end = t + c.duration;
        t = end;
        return { index: idx + 1, start, end, prompt: c.prompt };
    });
    const marks = [0, ...detailed.map(d => d.end)].map(x => `${Math.round(x)}s`).join(' → ');
    return { boundaryMarks: marks, clips: detailed };
};

const attachPlanPreview = (plan: any, requirements: any): PlanPreviewExtras => {
    const validation = validateCanvasPlan(plan, { requirements });
    const extras: PlanPreviewExtras = {
        warnings: validation.warnings || [],
        fixes: validation.fixes || [],
        timeline: computeVideoTimeline(plan),
    };
    plan.__preview = extras;
    return extras;
};

const getSelectedImageIds = (context: CanvasContext): string[] => {
    const ids = new Set<string>(context.canvasSelection?.selectedIds || []);
    if (ids.size === 0) return [];
    const selected: string[] = [];

    // 1) Canvas uploaded images:
    // Selection may contain `img.id` OR `img.elementId`, but connection nodes (and connectors) should use:
    // `img.elementId || canvas-image-{index}` (see CanvasImageConnectionNodes).
    const canvasImages = context.canvasState?.images;
    if (Array.isArray(canvasImages)) {
        canvasImages.forEach((img: any, idx: number) => {
            const rawIds = [img?.id, img?.elementId].filter(Boolean) as string[];
            const matched = rawIds.some(rid => ids.has(rid));
            if (!matched) return;
            const nodeId = (img?.elementId || `canvas-image-${idx}`) as string;
            selected.push(nodeId);
        });
    }

    // 2) Modals (image generators, scene frames, etc.) use their `id` directly.
    const modalArrays = [
        context.canvasState?.imageModalStates,
        context.canvasState?.sceneFrameModalStates,
    ];
    modalArrays.forEach(arr => {
        if (!Array.isArray(arr)) return;
        arr.forEach((item: any) => {
            const cid = item?.id;
            if (cid && ids.has(cid)) selected.push(cid);
        });
    });

    // unique + stable
    return Array.from(new Set(selected));
};

const buildCanvasContextString = (context: CanvasContext, selectedImageIds?: string[]): string => {
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
    
    // Add image numbering information for agent mode
    if (selectedImageIds && selectedImageIds.length > 0) {
        const imageNumbering: string[] = [];
        selectedImageIds.forEach((id, index) => {
            const imageNumber = index + 1;
            const imageInfo = `Image ${imageNumber} (ID: ${id})`;
            imageNumbering.push(imageInfo);
        });
        if (imageNumbering.length > 0) {
            summaries.push(`Selected Images (numbered): ${imageNumbering.join(', ')}`);
            summaries.push(`Note: Users can reference images by number (e.g., "apply this to 2nd image", "modify image 3", "use the first image").`);
        }
    }

    return summaries.join('\n');
};

export const useChatEngine = (context: CanvasContext) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const sessionRef = useRef<AgentSessionState>({
        phase: 'IDLE',
        requirements: { task: 'unknown' as AgentTask },
        pendingQuestions: [],
        currentQuestionIndex: 0,
    });

    const resetSession = () => {
        sessionRef.current = {
            phase: 'IDLE',
            requirements: { task: 'unknown' as AgentTask },
            pendingQuestions: [],
            currentQuestionIndex: 0,
        };
    };

    const applyEditsFromDecision = useCallback(async (decision: any) => {
        const session = sessionRef.current;
        const currentPlan: any = session.graphPlan;
        if (!currentPlan) return;

        const videoNodeSteps: any[] = (currentPlan.steps || []).filter((s: any) => s.action === 'CREATE_NODE' && s.nodeType === 'video-generator');
        if (videoNodeSteps.length > 0) {
            const requestedModelText = (decision.changes?.model || '').toString().trim();
            const requestedVideoModel = requestedModelText ? findTextToVideoModel(requestedModelText) : null;
            if (requestedModelText && !requestedVideoModel) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `I couldn't find that video model in the registry. Try: "Veo 3.1 Fast", "Veo 3.1", "Sora 2 Pro".`,
                    timestamp: Date.now(),
                }]);
                return;
            }

            const nextVideoModel = requestedVideoModel?.name || session.requirements.model || getDefaultTextToVideoModel().name;
            const nextRatioRaw = (decision.changes?.aspectRatio || '').toString().trim() || session.requirements.aspectRatio || '16:9';
            const nextRatio = isValidVideoAspectRatio(nextRatioRaw) ? nextRatioRaw : '16:9';
            const nextResRaw = (decision.changes?.resolution || '').toString().trim() || session.requirements.resolution || '1080p';
            const nextRes = isValidVideoResolution(nextResRaw) ? nextResRaw : '1080p';
            const nextDuration = Number(decision.changes?.durationSeconds || session.requirements.durationSeconds || 8);

            session.requirements = {
                ...session.requirements,
                model: nextVideoModel,
                aspectRatio: nextRatio,
                resolution: nextRes,
                durationSeconds: nextDuration,
            };

            const rebuilt = buildVideoCanvasPlan({ requirements: session.requirements, script: session.scriptPlan });
            const validation = validateCanvasPlan(rebuilt, { requirements: session.requirements });
            if (!validation.ok) {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `❌ I couldn't update the video plan:\n- ${validation.errors.join('\n- ')}`,
                    timestamp: Date.now(),
                }]);
                return;
            }

            session.graphPlan = rebuilt;
            attachPlanPreview(rebuilt as any, session.requirements);
            session.phase = 'GRAPH_PREVIEW';

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: [
                    `✅ **Updated Video Plan**`,
                    ``,
                    `- **Duration**: ${nextDuration}s`,
                    `- **Frame**: ${nextRatio}`,
                    `- **Resolution**: ${nextRes}`,
                    `- **Model**: ${nextVideoModel}`,
                    ``,
                    `Approve execution?`,
                    `A) Execute\nB) Cancel`,
                ].join('\n'),
                action: {
                    type: 'SINGLE',
                    intent: 'EXECUTE_PLAN',
                    confidence: 1,
                    payload: rebuilt,
                    requiresConfirmation: true,
                    explanation: rebuilt.summary,
                },
                timestamp: Date.now(),
            }]);
            return;
        }

        // Image plan edits
        const step0: any = currentPlan.steps?.find((s: any) => s.action === 'CREATE_NODE' && s.nodeType === 'image-generator');
        if (!step0) return;

        const requestedModelText = (decision.changes?.model || '').toString().trim();
        const requestedModel = requestedModelText ? findTextToImageModel(requestedModelText) : null;
        if (requestedModelText && !requestedModel) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `I couldn't find that image model in the registry. Try: "Google Nano Banana", "Z Image Turbo", "Flux 1.1 Pro".`,
                timestamp: Date.now(),
            }]);
            return;
        }

        const ratioFromDecision = (decision.changes?.aspectRatio || '').toString().trim() || null;
        const nextRatioRaw = ratioFromDecision || step0.configTemplate?.aspectRatio || '1:1';
        const nextRatio = isValidImageAspectRatio(nextRatioRaw) ? nextRatioRaw : '1:1';

        const resFromDecision = (decision.changes?.resolution || '').toString().trim() || null;
        const nextResolutionRaw = resFromDecision || step0.configTemplate?.resolution || '1024';
        const nextResolution = isValidImageResolution(nextResolutionRaw) ? nextResolutionRaw : '1024';

        const countFromDecision = decision.changes?.count ?? null;
        const nextCount = Math.max(1, Math.min(4, (countFromDecision || step0.count || 1)));

        const promptFromDecision = (decision.changes?.prompt || '').toString().trim();
        const nextPrompt = promptFromDecision || step0.configTemplate?.prompt;

        const isImg2ImgPlan = Array.isArray(step0.configTemplate?.targetIds) && step0.configTemplate.targetIds.length > 0;
        let nextModel = requestedModel?.name || step0.configTemplate?.model;
        if (isImg2ImgPlan && (!nextModel || String(nextModel).toLowerCase().includes('z image turbo') || String(nextModel).toLowerCase().includes('z-image-turbo'))) {
            nextModel = 'Google Nano Banana';
        }

        step0.configTemplate = { ...(step0.configTemplate || {}), model: nextModel, aspectRatio: nextRatio, resolution: nextResolution, prompt: nextPrompt };
        step0.count = nextCount;
        step0.batchConfigs = Array.from({ length: nextCount }).map(() => ({ prompt: nextPrompt }));

        currentPlan.summary = [
            `Frame: ${nextRatio}`,
            `Resolution: ${nextResolution}`,
            `Images: ${nextCount}`,
            `Model: ${nextModel}`,
            `Prompt: ${nextPrompt}`,
        ].join('\n');

        attachPlanPreview(currentPlan as any, session.requirements);

        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: [
                `✅ **Updated Image Generation Plan**`,
                ``,
                `- **Frame**: ${nextRatio}`,
                `- **Resolution**: ${nextResolution}`,
                `- **Number of images**: ${nextCount}`,
                `- **Model**: ${nextModel}`,
                `- **Prompt**: ${nextPrompt}`,
            ].join('\n'),
            action: {
                type: 'SINGLE',
                intent: 'EXECUTE_PLAN',
                confidence: 1,
                payload: currentPlan,
                requiresConfirmation: true,
                explanation: currentPlan.summary,
            },
            timestamp: Date.now(),
        }]);
    }, []);

    const sendMessage = useCallback(async (text: string, mode: 'agent' | 'general' = 'agent') => {
        if (!text.trim()) return;

        // Parse image reference from user message (e.g., "apply this to 2nd image")
        const { imageIndex, remainingText } = extractImageReference(text);
        const processedText = remainingText || text; // Use remaining text if reference was found
        
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text, // Keep original text for display
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setIsProcessing(true);

        try {
            const selectedImageIds = getSelectedImageIds(context);
            const session = sessionRef.current;
            session.lastUserMessage = processedText; // Use processed text for agent processing
            
            // If user referenced a specific image, map it to the actual image ID
            let targetImageId: string | null = null;
            if (imageIndex !== null && selectedImageIds.length > 0) {
                // imageIndex is 1-based, convert to 0-based array index
                const arrayIndex = imageIndex - 1;
                if (arrayIndex >= 0 && arrayIndex < selectedImageIds.length) {
                    targetImageId = selectedImageIds[arrayIndex];
                    // Store the target image ID in session for use in execution
                    (session as any).targetImageId = targetImageId;
                    (session as any).targetImageIndex = imageIndex;
                } else {
                    // Invalid image index - notify user
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `I found a reference to image ${imageIndex}, but you only have ${selectedImageIds.length} image(s) selected. Please select the correct number of images.`,
                        timestamp: Date.now(),
                    }]);
                    setIsProcessing(false);
                    return;
                }
            } else if (imageIndex !== null && selectedImageIds.length === 0) {
                // User referenced an image but none are selected
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `You referenced image ${imageIndex}, but no images are currently selected. Please select the image(s) you want to work with.`,
                    timestamp: Date.now(),
                }]);
                setIsProcessing(false);
                return;
            } else {
                // Clear any previous target image
                (session as any).targetImageId = null;
                (session as any).targetImageIndex = null;
            }

            // If mode is 'general', skip intent detection and go straight to general question handler
            // Use pure conversational chat without any canvas/website context
            if (mode === 'general') {
                try {
                    // Build conversation history from recent messages for context
                    const recentMessages = messages.slice(-10).map(msg => ({
                        role: msg.role,
                        content: msg.content,
                    })) as Array<{ role: 'user' | 'assistant'; content: string }>;
                    
                    const answer = await queryGeneralChat(text, recentMessages);
                    
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: answer,
                        timestamp: Date.now(),
                    }]);
                    return;
                } catch (error: any) {
                    console.error('[ChatEngine] Error handling general question:', error);
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: error.message || "I apologize, but I encountered an error. Please try again.",
                        timestamp: Date.now(),
                    }]);
                    return;
                }
            }

            // Phase: confirm a proposed plan edit (voice-friendly)
            if (session.phase === 'EDIT_CONFIRMATION' && session.pendingPlanEdits && session.graphPlan) {
                const normalized = text.trim().toLowerCase();
                const apply = normalized === 'a' || /\b(yes|apply|ok|okay|confirm)\b/.test(normalized);
                const cancel = normalized === 'b' || /\b(no|cancel|stop)\b/.test(normalized);
                if (cancel) {
                    session.pendingPlanEdits = undefined;
                    session.phase = 'GRAPH_PREVIEW';
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `Ok — keeping the current plan as-is.`,
                        timestamp: Date.now(),
                    }]);
                    return;
                }
                if (apply) {
                    const decision = session.pendingPlanEdits;
                    session.pendingPlanEdits = undefined;
                    session.phase = 'GRAPH_PREVIEW';
                    await applyEditsFromDecision(decision);
                    return;
                }
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `Please say "yes" to apply the changes, or "no" to keep the current plan.\nA) Apply\nB) Keep current`,
                    timestamp: Date.now(),
                }]);
                return;
            }

            // If user is modifying a plan but the session lost the plan (e.g., after refresh / state reset),
            // recover it from the last assistant EXECUTE_PLAN message.
            if ((!session.graphPlan || session.phase === 'IDLE') && looksLikePlanModification(text)) {
                const recovered = findLastImagePlanInMessages(messages);
                if (recovered) {
                    session.graphPlan = recovered;
                    session.phase = 'GRAPH_PREVIEW';
                }
            }

            // Phase: collecting requirements
            if (session.phase === 'COLLECTING_REQUIREMENTS') {
                const q = session.pendingQuestions[session.currentQuestionIndex];
                if (!q) {
                    session.phase = 'IDLE';
                        } else {
                    session.requirements = applyRequirementAnswer(session.requirements, q, text, { selectedImageIds });
                    session.currentQuestionIndex += 1;

                    // If we asked for selecting images, re-check selection now.
                    // NOTE: First-Last Frame is allowed with 1 reference image (we generate boundary frames from it),
                    // so do NOT force a second image selection.
                    if (q.key === 'reference_images') {
                        session.requirements.referenceImageIds = selectedImageIds.slice(0, session.requirements.referenceImageIds?.length || 1);
                    }
                    
                    // If user selected "wait_for_images", check if they've now selected images
                    if (q.key === 'transition_mode' && session.requirements.mode === undefined && selectedImageIds.length > 0) {
                        // User selected images after choosing to wait - ask about mode again
                        if (selectedImageIds.length >= 2) {
                            const modeQ: RequirementQuestion = {
                                key: 'transition_mode',
                                question:
                                    `You selected ${selectedImageIds.length} images. Which video generation method?\n` +
                                    `A) First-Last Frame (each video uses 2 consecutive images: first + last)\n` +
                                    `B) First Frame (each image becomes the first frame of its own video)\n` +
                                    `C) Single Image (use only the first image for all videos)`,
                                options: [
                                    { label: 'A', value: 'first_last', text: 'First-Last Frame' },
                                    { label: 'B', value: 'first_frame', text: 'First Frame' },
                                    { label: 'C', value: 'single', text: 'Single Image' },
                                ],
                            };
                            // Insert this question before the next one
                            session.pendingQuestions.splice(session.currentQuestionIndex, 0, modeQ);
                            const nextQ = session.pendingQuestions[session.currentQuestionIndex];
                            setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                                content: nextQ.question,
                                timestamp: Date.now(),
                            }]);
                            return;
                        } else if (selectedImageIds.length === 1) {
                            const modeQ: RequirementQuestion = {
                                key: 'transition_mode',
                                question:
                                    `You selected 1 image. Which video generation method?\n` +
                                    `A) First-Last Frame (generate boundary frames from this image; best for long ads)\n` +
                                    `B) First Frame (use this image as first frame for all videos)`,
                                options: [
                                    { label: 'A', value: 'first_last', text: 'First-Last Frame (auto-generate boundary frames)' },
                                    { label: 'B', value: 'first_frame', text: 'First Frame (use current image)' },
                                ],
                            };
                            session.pendingQuestions.splice(session.currentQuestionIndex, 0, modeQ);
                            const nextQ = session.pendingQuestions[session.currentQuestionIndex];
                            setMessages(prev => [...prev, {
                                id: (Date.now() + 1).toString(),
                                role: 'assistant',
                                content: nextQ.question,
                                timestamp: Date.now(),
                            }]);
                    return;
                        }
                    }
                    
                    // Handle "done" response when user was asked to select images
                    if (q.key === 'transition_mode' && (text.toLowerCase().includes('done') || text.toLowerCase().includes('selected'))) {
                        const currentSelected = getSelectedImageIds(context);
                        if (currentSelected.length >= 2) {
                            const modeQ: RequirementQuestion = {
                                key: 'transition_mode',
                                question:
                                    `You selected ${currentSelected.length} images. Which video generation method?\n` +
                                    `A) First-Last Frame (each video uses 2 consecutive images: first + last)\n` +
                                    `B) First Frame (each image becomes the first frame of its own video)\n` +
                                    `C) Single Image (use only the first image for all videos)`,
                                options: [
                                    { label: 'A', value: 'first_last', text: 'First-Last Frame' },
                                    { label: 'B', value: 'first_frame', text: 'First Frame' },
                                    { label: 'C', value: 'single', text: 'Single Image' },
                                ],
                            };
                            session.pendingQuestions.splice(session.currentQuestionIndex, 0, modeQ);
                            const nextQ = session.pendingQuestions[session.currentQuestionIndex];
                            setMessages(prev => [...prev, {
                                id: (Date.now() + 1).toString(),
                                role: 'assistant',
                                content: nextQ.question,
                                timestamp: Date.now(),
                            }]);
                            return;
                        } else if (currentSelected.length === 1) {
                            const modeQ: RequirementQuestion = {
                                key: 'transition_mode',
                                question:
                                    `You selected 1 image. Do you want to use it as reference?\n` +
                                    `A) Yes, use this image as first frame for all videos\n` +
                                    `B) No, generate from text only`,
                                options: [
                                    { label: 'A', value: 'single', text: 'Yes, use this image' },
                                    { label: 'B', value: 'text_only', text: 'No, text only' },
                                ],
                            };
                            session.pendingQuestions.splice(session.currentQuestionIndex, 0, modeQ);
                            const nextQ = session.pendingQuestions[session.currentQuestionIndex];
                            setMessages(prev => [...prev, {
                                id: (Date.now() + 1).toString(),
                                role: 'assistant',
                                content: nextQ.question,
                                timestamp: Date.now(),
                            }]);
                            return;
                        }
                    }

                    if (session.currentQuestionIndex < session.pendingQuestions.length) {
                        const nextQ = session.pendingQuestions[session.currentQuestionIndex];
                        setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                            content: nextQ.question,
                            timestamp: Date.now(),
                        }]);
                    return;
                }
                    // Done collecting → move to script review or graph
                    if (session.requirements.needsScript) {
                        session.phase = 'SCRIPT_REVIEW';
                        const videoModelName = session.requirements.model || getDefaultTextToVideoModel().name;
                        const maxClipSeconds = getVideoMaxClipSeconds(videoModelName);
                        const durationSeconds = session.requirements.durationSeconds || 8;
                        const targetClips = Math.max(1, Math.ceil(durationSeconds / Math.max(1, maxClipSeconds)));
                        const plan = await generateScriptAndScenes({
                            product: session.requirements.product,
                            topic: session.requirements.topic,
                            goal: session.requirements.goal,
                            durationSeconds,
                            platform: session.requirements.platform,
                            style: session.requirements.style,
                            userNotes: session.intent?.explanation,
                            targetClips,
                            maxClipSeconds,
                            forceSingleScene: targetClips === 1,
                        });
                        session.scriptPlan = plan;
                        const preview = [
                            `📝 **Script Draft**`,
                            ``,
                            plan.script,
                            ``,
                            `## 🎬 Scenes`,
                            ...plan.scenes.map(s => `- ${s.scene}. (${s.durationSeconds}s) ${s.prompt}`),
                            ``,
                            `Approve this script?`,
                            `A) Approve\nB) Modify`,
                        ].join('\n');
                        setMessages(prev => [...prev, {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                            content: preview,
                            timestamp: Date.now(),
                        }]);
                        return;
                        } else {
                        session.phase = 'GRAPH_PREVIEW';
                        const plan = buildVideoCanvasPlan({ requirements: session.requirements, script: session.scriptPlan });
                        const validation = validateCanvasPlan(plan, { requirements: session.requirements });
                        if (!validation.ok) {
                            resetSession();
                            setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                                content: `❌ I couldn't build a valid plan:\n- ${validation.errors.join('\n- ')}`,
                                timestamp: Date.now(),
                            }]);
                    return;
                }
                        session.graphPlan = plan;
                        attachPlanPreview(plan as any, session.requirements);
                        setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                            content: `✅ Plan ready:\n\n${plan.summary}\n\nApprove execution?\nA) Execute\nB) Cancel`,
                            action: {
                                type: 'SINGLE',
                                intent: 'EXECUTE_PLAN',
                                confidence: 1,
                                payload: plan,
                                requiresConfirmation: true,
                                explanation: plan.summary,
                            },
                            timestamp: Date.now(),
                        }]);
                    return;
                }
                }
            }

            // Phase: script review (approve/modify)
            if (session.phase === 'SCRIPT_REVIEW') {
                const normalized = text.trim().toLowerCase();
                const isApprove = normalized === 'a' || normalized.includes('approve') || normalized === 'yes' || normalized === 'proceed';
                const isModify = normalized === 'b' || normalized.includes('modify') || normalized.includes('change') || normalized.includes('edit');
                
                // Video mode is now asked in the requirements collection phase (before script generation)
                // So we don't need to handle it here after script approval
                // This block is kept for backward compatibility but should rarely be needed
                const selectedImageIds = getSelectedImageIds(context);
                const task = session.requirements.task;
                const needsModeSelection = 
                    !session.requirements.mode && 
                    (task === 'text_to_video' || task === 'image_to_video') &&
                    session.scriptPlan;
                
                // Only handle mode selection if somehow it wasn't set during requirements collection
                if (needsModeSelection && !isApprove && !isModify && false) { // Disabled - mode should be set earlier
                    // User is answering the mode question
                    let mode: VideoMode | undefined = undefined;
                    let useReferenceImages = true;
                    let shouldProceed = false;
                    
                    // Handle "done" response when user was asked to select images
                    if (normalized.includes('done') || normalized.includes('selected')) {
                        // User has selected images, re-check and ask about mode
                        const currentSelected = getSelectedImageIds(context);
                        if (currentSelected.length >= 2) {
                            // Ask about video mode with new selection
                            setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                                content: [
                                    `📝 **Script (approved)**`,
                                    ``,
                                    session.scriptPlan?.script || '',
                                    ``,
                                    `## 🎬 Scenes`,
                                    ...(session.scriptPlan?.scenes || []).map(s => `- ${s.scene}. (${s.durationSeconds}s) ${s.prompt}`),
                                    ``,
                                    `You have ${currentSelected.length} images selected. Which video generation method?`,
                                    ``,
                                    `A) First-Last Frame (each video uses 2 consecutive images: first + last)`,
                                    `B) First Frame (each image becomes the first frame of its own video)`,
                                    `C) Single Image (use only the first image for all videos)`,
                                    `D) No reference images (generate from text only)`,
                                ].join('\n'),
                                timestamp: Date.now(),
                            }]);
                            return;
                        } else if (currentSelected.length === 1) {
                            // Ask about single image usage
                            setMessages(prev => [...prev, {
                                id: (Date.now() + 1).toString(),
                                role: 'assistant',
                                content: [
                                    `📝 **Script (approved)**`,
                                    ``,
                                    session.scriptPlan?.script || '',
                                    ``,
                                    `## 🎬 Scenes`,
                                    ...(session.scriptPlan?.scenes || []).map(s => `- ${s.scene}. (${s.durationSeconds}s) ${s.prompt}`),
                                    ``,
                                    `You have 1 image selected. Do you want to use it as reference?`,
                                    ``,
                                    `A) Yes, use this image as first frame for all videos`,
                                    `B) No, generate from text only (ignore selected image)`,
                                ].join('\n'),
                                timestamp: Date.now(),
                            }]);
                    return;
                        }
                    }
                    
                    // Check current selection count
                    const currentSelected = getSelectedImageIds(context);
                    
                    if (currentSelected.length >= 2) {
                        // Multiple images - A/B/C/D options
                        if (normalized === 'a' || (normalized.includes('first') && normalized.includes('last'))) {
                            mode = 'first_last';
                            shouldProceed = true;
                        } else if (normalized === 'b' || (normalized.includes('first') && !normalized.includes('last') && !normalized.includes('frame'))) {
                            mode = 'first_frame';
                            shouldProceed = true;
                        } else if (normalized === 'c' || normalized.includes('single')) {
                            mode = 'single';
                            shouldProceed = true;
                        } else if (normalized === 'd' || normalized.includes('no reference') || normalized.includes('text only') || normalized.includes('ignore')) {
                            useReferenceImages = false;
                            mode = undefined;
                            shouldProceed = true;
                        }
                    } else if (currentSelected.length === 1) {
                        // Single image - A/B options
                        if (normalized === 'a' || normalized.includes('yes') || normalized.includes('use')) {
                            mode = 'single';
                            useReferenceImages = true;
                            shouldProceed = true;
                        } else if (normalized === 'b' || normalized.includes('no') || normalized.includes('ignore') || normalized.includes('text only')) {
                            useReferenceImages = false;
                            mode = undefined;
                            shouldProceed = true;
                        }
                    } else {
                        // No images - A/B options (add images or proceed without)
                        if (normalized === 'a' || normalized.includes('yes') || normalized.includes('select')) {
                            // User wants to add images - ask them to select and reply "done"
                            setMessages(prev => [...prev, {
                                id: (Date.now() + 1).toString(),
                                role: 'assistant',
                                content: `Please select 1 or more images on the canvas, then reply "done" or "selected".`,
                                timestamp: Date.now(),
                            }]);
                            return;
                        } else if (normalized === 'b' || normalized.includes('no') || normalized.includes('text only')) {
                            useReferenceImages = false;
                            mode = undefined;
                            shouldProceed = true;
                    }
                    }
                    
                    if (shouldProceed) {
                        // Update requirements
                        if (useReferenceImages && mode) {
                            session.requirements.mode = mode;
                            session.requirements.referenceImageIds = currentSelected;
                            // Convert text_to_video to image_to_video if using images
                            if (task === 'text_to_video') {
                                session.requirements.task = 'image_to_video';
                            }
                        } else {
                            // Don't use reference images
                            session.requirements.referenceImageIds = [];
                            session.requirements.mode = undefined as any; // Explicitly set to undefined
                        }
                        
                        // Now proceed to build plan
                        session.phase = 'GRAPH_PREVIEW';
                        if (!session.scriptPlan) {
                            setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                                content: `❌ Script plan is missing. Please try again.`,
                                timestamp: Date.now(),
                            }]);
                    return;
                }
                        const plan = buildVideoCanvasPlan({ requirements: session.requirements, script: session.scriptPlan });
                        const validation = validateCanvasPlan(plan, { requirements: session.requirements });
                        if (!validation.ok) {
                            resetSession();
                            setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                                content: `❌ I couldn't build a valid plan:\n- ${validation.errors.join('\n- ')}`,
                                timestamp: Date.now(),
                            }]);
                    return;
                        }
                        session.graphPlan = plan;
                        attachPlanPreview(plan as any, session.requirements);
                        setMessages(prev => [...prev, {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                            // NOTE: `plan.summary` already contains the full script + structured prompts (images + videos).
                            // Don't print the script twice in chat.
                            content: `✅ Plan ready:\n\n${plan.summary}\n\nApprove execution?\nA) Execute\nB) Cancel`,
                            action: {
                                type: 'SINGLE',
                                intent: 'EXECUTE_PLAN',
                                confidence: 1,
                                payload: plan,
                                requiresConfirmation: true,
                                explanation: plan.summary,
                            },
                            timestamp: Date.now(),
                        }]);
                        return;
                    }
                    // If mode not recognized, fall through to normal approve/modify logic
                }

                if (isModify) {
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `Tell me what to change (e.g. "make it more premium", "add more close-ups").`,
                        timestamp: Date.now(),
                    }]);
                    return;
                }
                
                if (!isApprove && session.scriptPlan) {
                    // Treat as modification text
                    const videoModelName = session.requirements.model || getDefaultTextToVideoModel().name;
                    const maxClipSeconds = getVideoMaxClipSeconds(videoModelName);
                    const durationSeconds = session.requirements.durationSeconds || 8;
                    const targetClips = Math.max(1, Math.ceil(durationSeconds / Math.max(1, maxClipSeconds)));
                    const updated = await generateScriptAndScenes({
                        product: session.requirements.product,
                        topic: session.requirements.topic,
                        goal: session.requirements.goal,
                        durationSeconds,
                        platform: session.requirements.platform,
                        style: session.requirements.style,
                        userNotes: `Modify script with: ${text}\n\nCurrent script:\n${session.scriptPlan.script}`,
                        targetClips,
                        maxClipSeconds,
                        forceSingleScene: targetClips === 1,
                    });
                    session.scriptPlan = updated;
                    const preview = [
                        `📝 **Updated Script Draft**`,
                        ``,
                        updated.script,
                        ``,
                        `## 🎬 Scenes`,
                        ...updated.scenes.map(s => `- ${s.scene}. (${s.durationSeconds}s) ${s.prompt}`),
                        ``,
                        `Approve this script?`,
                        `A) Approve\nB) Modify`,
                    ].join('\n');
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: preview,
                        timestamp: Date.now(),
                    }]);
                    return;
                }

                if (isApprove) {
                    // After script approval, ALWAYS ask about video mode if not already set
                    // This gives users the chance to select images and choose their preferred mode
                    const selectedImageIds = getSelectedImageIds(context);
                    const task = session.requirements.task;
                    
                    // Ask about mode if not set (for both text_to_video and image_to_video)
                    if (!session.requirements.mode && (task === 'text_to_video' || task === 'image_to_video')) {
                        
                        if (selectedImageIds.length >= 2) {
                            // Multiple images - ask about video mode
                            setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                                content: [
                                    `📝 **Script (approved)**`,
                                    ``,
                                    session.scriptPlan?.script || '',
                                    ``,
                                    `## 🎬 Scenes`,
                                    ...(session.scriptPlan?.scenes || []).map(s => `- ${s.scene}. (${s.durationSeconds}s) ${s.prompt}`),
                                    ``,
                                    `You have ${selectedImageIds.length} images selected. Which video generation method?`,
                                    ``,
                                    `A) First-Last Frame (each video uses 2 consecutive images: first + last)`,
                                    `B) First Frame (each image becomes the first frame of its own video)`,
                                    `C) Single Image (use only the first image for all videos)`,
                                    `D) No reference images (generate from text only)`,
                                ].join('\n'),
                                timestamp: Date.now(),
                            }]);
                            // Stay in SCRIPT_REVIEW phase to collect the mode answer
                            return;
                        } else if (selectedImageIds.length === 1) {
                            // Single image - ask if they want to use it
                            setMessages(prev => [...prev, {
                                id: (Date.now() + 1).toString(),
                                role: 'assistant',
                                content: [
                                    `📝 **Script (approved)**`,
                                    ``,
                                    session.scriptPlan?.script || '',
                                    ``,
                                    `## 🎬 Scenes`,
                                    ...(session.scriptPlan?.scenes || []).map(s => `- ${s.scene}. (${s.durationSeconds}s) ${s.prompt}`),
                                    ``,
                                    `You have 1 image selected. Do you want to use it as reference?`,
                                    ``,
                                    `A) Yes, use this image as first frame for all videos`,
                                    `B) No, generate from text only (ignore selected image)`,
                                ].join('\n'),
                                timestamp: Date.now(),
                            }]);
                            return;
                        } else {
                            // No images selected - ask if they want to add reference images
                            setMessages(prev => [...prev, {
                                id: (Date.now() + 1).toString(),
                                role: 'assistant',
                                content: [
                                    `📝 **Script (approved)**`,
                                    ``,
                                    session.scriptPlan?.script || '',
                                    ``,
                                    `## 🎬 Scenes`,
                                    ...(session.scriptPlan?.scenes || []).map(s => `- ${s.scene}. (${s.durationSeconds}s) ${s.prompt}`),
                                    ``,
                                    `Do you want to use reference images for video generation?`,
                                    ``,
                                    `A) Yes, I'll select images (you can select 1 or more images on canvas, then reply "done")`,
                                    `B) No, generate from text only`,
                                ].join('\n'),
                                timestamp: Date.now(),
                            }]);
                    return;
                }
                    }
                    
                    // If mode is already set or no images selected, proceed to build plan
                    session.phase = 'GRAPH_PREVIEW';
                    const plan = buildVideoCanvasPlan({ requirements: session.requirements, script: session.scriptPlan });
                    const validation = validateCanvasPlan(plan, { requirements: session.requirements });
                    if (!validation.ok) {
                        resetSession();
                        setMessages(prev => [...prev, {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                            content: `❌ I couldn't build a valid plan:\n- ${validation.errors.join('\n- ')}`,
                            timestamp: Date.now(),
                        }]);
                        return;
                    }
                    session.graphPlan = plan;
                    attachPlanPreview(plan as any, session.requirements);
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        // NOTE: `plan.summary` already contains the full script + structured prompts (images + videos).
                        // Don't print the script twice in chat.
                        content: `✅ Plan ready:\n\n${plan.summary}\n\nApprove execution?\nA) Execute\nB) Cancel`,
                        action: {
                            type: 'SINGLE',
                            intent: 'EXECUTE_PLAN',
                            confidence: 1,
                            payload: plan,
                            requiresConfirmation: true,
                            explanation: plan.summary,
                        },
                        timestamp: Date.now(),
                    }]);
                    return;
                }
            }
            
            // Phase: graph preview (execute/cancel OR modify parameters)
            if (session.phase === 'GRAPH_PREVIEW' && session.graphPlan) {
                const currentPlan = session.graphPlan;
                const normalized = text.trim().toLowerCase();
                
                // If a plan is open but the user clearly starts a NEW request (e.g. "generate a video..."),
                // reset the session and fall through to intent detection.
                const isNewRequestVerb = /\b(generate|create|make|animate)\b/.test(normalized);
                const wantsVideo = /\b(vidoe|video|animation|animate)\b/.test(normalized);
                const wantsImage = /\b(images?|pics?|pictures?)\b/.test(normalized);
                const planHasImage = Array.isArray(currentPlan.steps) && currentPlan.steps.some((s: any) => s.action === 'CREATE_NODE' && s.nodeType === 'image-generator');
                const planHasVideo = Array.isArray(currentPlan.steps) && currentPlan.steps.some((s: any) => s.action === 'CREATE_NODE' && s.nodeType === 'video-generator');
                const shouldStartNewTask = isNewRequestVerb && ((wantsVideo && planHasImage) || (wantsImage && planHasVideo));
                if (shouldStartNewTask) {
                    resetSession();
                } else {
                // IMPORTANT: use word boundaries so we don't match substrings like "naNO" (nano) as "no".
                const isExecute =
                    normalized === 'a' ||
                    /\b(execute|run|proceed|yes)\b/.test(normalized);
                const isCancel =
                    normalized === 'b' ||
                    /\b(cancel|stop)\b/.test(normalized) ||
                    /^no$/.test(normalized);

                if (isCancel) {
                    resetSession();
                    setMessages(prev => [...prev, {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                        content: `Cancelled. Tell me what you want to do instead.`,
                        timestamp: Date.now(),
                    }]);
                    return;
                }
                if (isExecute) {
                    const plan = currentPlan;
                    resetSession();
                    setMessages(prev => [...prev, {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                        content: `🚀 Executing your plan now...`,
                            action: {
                                type: 'SINGLE',
                                intent: 'EXECUTE_PLAN',
                                confidence: 1,
                            payload: plan,
                                requiresConfirmation: false,
                            explanation: plan.summary,
                            },
                        timestamp: Date.now(),
                    }]);
                        return;
                }

                // No explicit execute/cancel => decide using LLM so voice/typos/synonyms work without keyword bloat.
                const decision = await decideNextForPlan({
                    userMessage: text,
                    planSummary: String(currentPlan.summary || ''),
                });

                if (decision.intent === 'CANCEL') {
                    resetSession();
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: decision.reply || `Cancelled. Tell me what you want to do instead.`,
                        timestamp: Date.now(),
                    }]);
                        return;
                    }

                if (decision.intent === 'EXECUTE') {
                    const plan = currentPlan;
                    resetSession();
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: decision.reply || `🚀 Executing your plan now...`,
                        action: {
                            type: 'SINGLE',
                            intent: 'EXECUTE_PLAN',
                            confidence: 1,
                            payload: plan,
                            requiresConfirmation: false,
                            explanation: plan.summary,
                        },
                        timestamp: Date.now(),
                    }]);
                    return;
                }

                if (decision.intent === 'CLARIFY') {
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: decision.reply || `Do you want me to execute this plan, cancel it, or change something (model/frame/count)?`,
                        timestamp: Date.now(),
                    }]);
                    return;
                }

                if (decision.intent === 'EDIT_PLAN') {
                    session.pendingPlanEdits = decision;
                    session.phase = 'EDIT_CONFIRMATION';
                    const changes = decision.changes || {};
                    const parts: string[] = [];
                    if (changes.model) parts.push(`model → ${changes.model}`);
                    if (changes.aspectRatio) parts.push(`frame → ${changes.aspectRatio}`);
                    if (changes.resolution) parts.push(`resolution → ${changes.resolution}`);
                    if (changes.count) parts.push(`count → ${changes.count}`);
                    const dur = (changes as any).durationSeconds ?? (changes as any).duration;
                    if (dur) parts.push(`duration → ${dur}s`);
                    const summary = parts.length ? parts.join(', ') : 'a plan update';
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `I will apply: **${summary}** and keep everything else the same.\n\nConfirm?\nA) Apply\nB) Keep current`,
                        timestamp: Date.now(),
                    }]);
                    return;
                }

                // EDIT_PLAN (apply validated edits to the current plan)
                const videoNodeSteps: any[] = (currentPlan.steps || []).filter((s: any) => s.action === 'CREATE_NODE' && s.nodeType === 'video-generator');
                if (videoNodeSteps.length > 0) {
                    const requestedModelText = (decision.changes?.model || '').toString().trim();
                    const requestedVideoModel = requestedModelText ? findTextToVideoModel(requestedModelText) : null;
                    if (requestedModelText && !requestedVideoModel) {
                        setMessages(prev => [...prev, {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                            content: `I couldn't find that video model in the registry. Try: "Veo 3.1 Fast", "Veo 3.1", "Sora 2 Pro".`,
                            timestamp: Date.now(),
                        }]);
                        return;
                    }

                    // Update requirements (source of truth for rebuilding the plan)
                    const nextVideoModel = requestedVideoModel?.name || session.requirements.model || getDefaultTextToVideoModel().name;

                    const ratioFromDecision = (decision.changes?.aspectRatio || '').toString().trim() || null;
                    const ratioFallback = parseAspectRatioFromText(text);
                    const nextRatioRaw = ratioFromDecision || ratioFallback || session.requirements.aspectRatio || '16:9';
                    const nextRatio = isValidVideoAspectRatio(nextRatioRaw) ? nextRatioRaw : '16:9';

                    const resFromDecision = (decision.changes?.resolution || '').toString().trim() || null;
                    const resFallback = parseResolutionFromText(text);
                    const nextResRaw = resFromDecision || resFallback || session.requirements.resolution || '1080p';
                    const nextRes = isValidVideoResolution(nextResRaw) ? nextResRaw : '1080p';

                    const durFromText = parseVideoDurationSecondsFromText(text);
                    const nextDuration = durFromText || session.requirements.durationSeconds || 8;

                    session.requirements = {
                        ...session.requirements,
                        task: session.requirements.task,
                        model: nextVideoModel,
                        aspectRatio: nextRatio,
                        resolution: nextRes,
                        durationSeconds: nextDuration,
                    };

                    // If this model/duration implies a different segmentation, regenerate script and re-ask approval.
                    const maxClipSeconds = getVideoMaxClipSeconds(nextVideoModel);
                    const targetClips = Math.max(1, Math.ceil(nextDuration / Math.max(1, maxClipSeconds)));
                    const currentClips = Number(String(currentPlan.summary || '').match(/Clips:\s*(\d+)/i)?.[1] || '0') || videoNodeSteps.length;
                    const needsScriptRegen = Boolean(session.requirements.needsScript) && (targetClips !== currentClips) && Boolean(session.requirements.topic || session.requirements.product);

                    if (needsScriptRegen) {
                        session.phase = 'SCRIPT_REVIEW';
                        const plan = await generateScriptAndScenes({
                            product: session.requirements.product,
                            topic: session.requirements.topic,
                            goal: session.requirements.goal,
                            durationSeconds: nextDuration,
                            platform: session.requirements.platform,
                            style: session.requirements.style,
                            userNotes: `Regenerate script for model=${nextVideoModel}, duration=${nextDuration}s, clips=${targetClips}.`,
                            targetClips,
                            maxClipSeconds,
                            forceSingleScene: targetClips === 1,
                        });
                        session.scriptPlan = plan;
                        const preview = [
                            `📝 **Updated Script Draft**`,
                            ``,
                            plan.script,
                            ``,
                            `## 🎬 Scenes`,
                            ...plan.scenes.map(s => `- ${s.scene}. (${s.durationSeconds}s) ${s.prompt}`),
                            ``,
                            `Approve this script?`,
                            `A) Approve\nB) Modify`,
                        ].join('\n');
                        setMessages(prev => [...prev, {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                            content: preview,
                            timestamp: Date.now(),
                        }]);
                        return;
                    }

                    // Rebuild plan deterministically from requirements + (optional) current script
                    const rebuilt = buildVideoCanvasPlan({ requirements: session.requirements, script: session.scriptPlan });
                    const validation = validateCanvasPlan(rebuilt, { requirements: session.requirements });
                    if (!validation.ok) {
                        setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                            content: `❌ I couldn't update the video plan:\n- ${validation.errors.join('\n- ')}`,
                            timestamp: Date.now(),
                        }]);
                        return;
                    }

                    session.graphPlan = rebuilt;
                    attachPlanPreview(rebuilt as any, session.requirements);

                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: [
                            `✅ **Updated Video Plan**`,
                            ``,
                            `- **Duration**: ${nextDuration}s`,
                            `- **Frame**: ${nextRatio}`,
                            `- **Resolution**: ${nextRes}`,
                            `- **Model**: ${nextVideoModel}`,
                            ``,
                            `Approve execution?`,
                            `A) Execute\nB) Cancel`,
                        ].join('\n'),
                        action: {
                            type: 'SINGLE',
                            intent: 'EXECUTE_PLAN',
                            confidence: 1,
                            payload: rebuilt,
                            requiresConfirmation: true,
                            explanation: rebuilt.summary,
                        },
                        timestamp: Date.now(),
                    }]);
                    return;
                }

                const step0: any = currentPlan.steps?.find((s: any) => s.action === 'CREATE_NODE' && s.nodeType === 'image-generator');
                if (!step0) {
                    setMessages(prev => [...prev, {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                        content: decision.reply || `I can edit this plan, but I couldn't find an editable image/video generation step.`,
                        timestamp: Date.now(),
                    }]);
                    return;
                }

                const requestedModelText = (decision.changes?.model || '').toString().trim();
                const requestedModel = requestedModelText ? findTextToImageModel(requestedModelText) : null;
                if (requestedModelText && !requestedModel) {
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `I couldn't find that image model in the registry. Try: "Google Nano Banana", "Z Image Turbo", "Flux 1.1 Pro".`,
                        timestamp: Date.now(),
                    }]);
                    return;
                }

                const isImg2ImgPlan = Array.isArray(step0.configTemplate?.targetIds) && step0.configTemplate.targetIds.length > 0;

                const ratioFromDecision = (decision.changes?.aspectRatio || '').toString().trim() || null;
                const ratioFallback = parseAspectRatioFromText(text);
                const nextRatioRaw = ratioFromDecision || ratioFallback || step0.configTemplate?.aspectRatio || '1:1';
                const nextRatio = isValidImageAspectRatio(nextRatioRaw) ? nextRatioRaw : '1:1';

                const resFromDecision = (decision.changes?.resolution || '').toString().trim() || null;
                const resFallback = parseResolutionFromText(text);
                const nextResolutionRaw = resFromDecision || resFallback || step0.configTemplate?.resolution || '1024';
                const nextResolution = isValidImageResolution(nextResolutionRaw) ? nextResolutionRaw : '1024';

                const countFromDecision = decision.changes?.count ?? null;
                const countFallback = parseImageCountFromText(text);
                const nextCount = Math.max(1, Math.min(4, (countFromDecision || countFallback || step0.count || 1)));

                const promptFromDecision = (decision.changes?.prompt || '').toString().trim();
                const basePrompt = promptFromDecision || step0.configTemplate?.prompt || '';

                let nextModel = requestedModel?.name || step0.configTemplate?.model;
                // Rule: for image-to-image, always default to Google Nano Banana if model isn't specified or is unsupported.
                if (isImg2ImgPlan && (!nextModel || String(nextModel).toLowerCase().includes('z image turbo') || String(nextModel).toLowerCase().includes('z-image-turbo'))) {
                    nextModel = 'Google Nano Banana';
                }

                // Get or default variation mode
                const variationMode = session.requirements.batchVariationMode || 'same_prompt';
                const promptVariations = generateBatchVariations(basePrompt, nextCount, variationMode);

                // Patch plan
                step0.configTemplate = { ...(step0.configTemplate || {}), model: nextModel, aspectRatio: nextRatio, resolution: nextResolution, prompt: basePrompt };
                step0.count = nextCount;
                step0.batchConfigs = promptVariations.map(p => ({ prompt: p }));

                currentPlan.summary = [
                    `Frame: ${nextRatio}`,
                    `Resolution: ${nextResolution}`,
                    `Images: ${nextCount}${nextCount > 1 && variationMode !== 'same_prompt' ? ` (${variationMode.replace(/_/g, ' ')})` : ''}`,
                    `Model: ${nextModel}`,
                    `Prompt: ${basePrompt.substring(0, 60)}${basePrompt.length > 60 ? '...' : ''}`,
                ].join('\n');
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: [
                        `✅ **Updated Image Generation Plan**`,
                        ``,
                        `- **Frame**: ${nextRatio}`,
                        `- **Resolution**: ${nextResolution}`,
                        `- **Number of images**: ${nextCount}${nextCount > 1 && variationMode !== 'same_prompt' ? ` (variation: ${variationMode.replace(/_/g, ' ')})` : ''}`,
                        `- **Model**: ${nextModel}`,
                        `- **Prompt**: ${basePrompt.substring(0, 60)}${basePrompt.length > 60 ? '...' : ''}`,
                    ].join('\n'),
                            action: {
                                type: 'SINGLE',
                                intent: 'EXECUTE_PLAN',
                                confidence: 1,
                        payload: currentPlan,
                        requiresConfirmation: true,
                        explanation: currentPlan.summary,
                            },
                    timestamp: Date.now(),
                }]);
                        return;
                    }
                }

            // Phase 1: intent detection
            // Use processedText (with image reference removed) for intent detection
            // Pass selectedImageIds for image numbering context
            const intent = await detectIntent(processedText, { 
                selectedImageCount: selectedImageIds.length,
                selectedImageIds: selectedImageIds 
            });
            session.intent = intent;
            
            // If user referenced a specific image, use only that image
            let referenceImageIds = selectedImageIds;
            if (targetImageId) {
                referenceImageIds = [targetImageId];
                // Add context about which image was referenced
                (session as any).referencedImageIndex = imageIndex;
            }
            
            session.requirements = {
                task: intent.task,
                goal: intent.goal,
                product: intent.product,
                topic: intent.topic,
                durationSeconds: intent.durationSeconds,
                // map count into requirements via topic parsing later (for images)
                platform: intent.platform ?? null,
                style: intent.style ?? null,
                aspectRatio: intent.aspectRatio ?? null,
                resolution: intent.resolution ?? null,
                model: intent.model ?? null,
                needsScript: intent.needsScript,
                referenceImageIds: referenceImageIds, // Use specific image if referenced
            };

            // Handle general questions (unknown or explain tasks) - provide conversational response
            if (intent.task === 'unknown' || intent.task === 'explain') {
                try {
                    const response = await queryCanvasPrompt(text, 500);
                    const answer = response.response || response.enhanced_prompt || intent.explanation || "I'm here to help! You can ask me to generate images, create videos, or ask general questions. What would you like to do?";
                    
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: answer,
                        timestamp: Date.now(),
                    }]);
                    return;
                } catch (error: any) {
                    console.error('[ChatEngine] Error handling general question:', error);
                    // Fallback to explanation from intent
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: intent.explanation || "I'm here to help! You can ask me to generate images, create videos, or ask general questions. What would you like to do?",
                        timestamp: Date.now(),
                    }]);
                    return;
                }
            }

            // Plugin Action: create plugin node plan
            if (intent.task === 'plugin_action') {
                const detectedPluginId = (intent as any).pluginId;
                if (!detectedPluginId) {
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `I couldn't identify which plugin you want to use. Available plugins: Upscale, Remove Background, Expand, Erase, Vectorize, Multiangle Camera, Storyboard, Next Scene.`,
                        timestamp: Date.now(),
                    }]);
                        return;
                    }

                // Map detected plugin ID to executor's expected pluginType
                // Executor uses shorter IDs (e.g., 'multiangle' instead of 'multiangle-camera')
                const pluginTypeMap: Record<string, string> = {
                    'upscale': 'upscale',
                    'remove-bg': 'remove-bg',
                    'expand': 'expand',
                    'erase': 'erase',
                    'vectorize': 'vectorize',
                    'multiangle-camera': 'multiangle',
                    'multiangle': 'multiangle',
                    'storyboard': 'storyboard',
                    'next-scene': 'next-scene',
                };
                const executorPluginType = pluginTypeMap[detectedPluginId] || detectedPluginId;

                // Find plugin in registry (use original ID for lookup)
                const plugin = findPlugin(detectedPluginId);
                if (!plugin) {
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `I couldn't find the plugin "${detectedPluginId}". Please try again.`,
                        timestamp: Date.now(),
                    }]);
                    return;
                }

                // Check if plugin requires source image
                if (plugin.requiresSourceImage && selectedImageIds.length === 0) {
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `To use the **${plugin.name}** plugin, please select an image first. Click on an image on the canvas, then try again.`,
                        timestamp: Date.now(),
                    }]);
                    return;
                }

                const defaultModel = getDefaultPluginModel(detectedPluginId);
                const model = defaultModel || plugin.models?.[0];

                // Build plugin plan
                const pluginPlan: CanvasInstructionPlan = {
                    id: `plugin-plan-${Date.now()}`,
                    summary: [
                        `Plugin: ${plugin.name}`,
                        `Model: ${model?.name || 'Default'}`,
                        `Input: ${plugin.inputType}`,
                        `Output: ${plugin.outputType}`,
                    ].join('\n'),
                    steps: [
                        {
                            id: `plugin-${Date.now()}`,
                            action: 'CREATE_NODE',
                            nodeType: 'plugin',
                            count: 1,
                            configTemplate: {
                                pluginType: executorPluginType, // Executor expects pluginType in configTemplate
                                model: model?.name || model?.id || 'default',
                                ...(model?.parameters ? Object.fromEntries(
                                    Object.entries(model.parameters).map(([key, param]: [string, any]) => [
                                        key,
                                        param.default !== undefined ? param.default : null
                                    ])
                                ) : {}),
                                targetIds: plugin.requiresSourceImage ? selectedImageIds : [],
                            },
                        } as any,
                    ],
                    metadata: {
                        sourceGoal: {
                            goalType: 'PLUGIN_ACTION',
                            pluginType: executorPluginType,
                            topic: plugin.name,
                            needs: plugin.requiresSourceImage ? ['image'] : [],
                            explanation: `Apply ${plugin.name} plugin`,
                        },
                        compiledAt: Date.now(),
                    },
                    requiresConfirmation: true,
                };

                // Build user-friendly message
                const modelParams = model?.parameters ? Object.entries(model.parameters)
                    .filter(([_, param]: [string, any]) => param.default !== undefined)
                    .map(([key, param]: [string, any]) => {
                        const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                        return `- **${label}**: ${param.default}`;
                    }) : [];

                const guideMessage = [
                    `✅ **${plugin.name} Plugin Ready**`,
                    ``,
                    `I've created a ${plugin.name} plugin node for you.`,
                    ``,
                    `**How to use:**`,
                    `1. The plugin is connected to your selected image${selectedImageIds.length > 1 ? 's' : ''}`,
                    `2. You can adjust settings in the plugin controls`,
                    modelParams.length > 0 ? `3. Default settings:\n${modelParams.join('\n')}` : `3. Click the plugin to configure settings`,
                    `4. Click the action button to process`,
                    ``,
                    plugin.description ? `**About:** ${plugin.description}` : '',
                ].filter(Boolean).join('\n');

                setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                    content: guideMessage,
                    action: {
                        type: 'SINGLE',
                        intent: 'EXECUTE_PLAN',
                        confidence: 1,
                        payload: pluginPlan,
                        requiresConfirmation: true,
                        explanation: pluginPlan.summary,
                    },
                    timestamp: Date.now(),
                }]);
                return;
            }

            // Text-to-Image / Image-to-Image: create an executable plan (EXECUTE_PLAN)
            if (intent.task === 'text_to_image' || intent.task === 'image_to_image') {
                // For image-to-image, default to the selected image's aspect ratio (if available).
                const isImg2Img = intent.task === 'image_to_image';
                let inferredAspect: string | null = null;
                let inferredResolution: string | null = null;
                let refWidth: number | null = null;
                let refHeight: number | null = null;
                
                // Use targetImageId if user referenced a specific image, otherwise use first selected
                const imageIdsToUse = targetImageId ? [targetImageId] : selectedImageIds;
                
                if (isImg2Img && imageIdsToUse.length > 0) {
                    const srcId = imageIdsToUse[0];
                    const srcModal = context.canvasState?.imageModalStates?.find((m: any) => m.id === srcId);
                    const srcUpload = context.canvasState?.images?.find((img: any) => img.elementId === srcId || img.id === srcId);
                    inferredAspect = srcModal?.aspectRatio || null;
                    
                    if (srcUpload?.width && srcUpload?.height) {
                        refWidth = Number(srcUpload.width);
                        refHeight = Number(srcUpload.height);
                        if (Number.isFinite(refWidth) && Number.isFinite(refHeight) && refWidth > 0 && refHeight > 0) {
                            // Map to common ratios we already validate against.
                            const ratio = refWidth / refHeight;
                            const close = (a: number, b: number) => Math.abs(a - b) < 0.03;
                            if (close(ratio, 1)) inferredAspect = '1:1';
                            else if (close(ratio, 16 / 9)) inferredAspect = '16:9';
                            else if (close(ratio, 9 / 16)) inferredAspect = '9:16';
                            else if (close(ratio, 4 / 3)) inferredAspect = '4:3';
                            else if (close(ratio, 3 / 4)) inferredAspect = '3:4';
                            else if (close(ratio, 3 / 2)) inferredAspect = '3:2';
                            else if (close(ratio, 2 / 3)) inferredAspect = '2:3';
                            
                            // Auto-detect closest resolution from reference image dimensions
                            const defaultModel = getDefaultTextToImageModel();
                            const rawModel = session.requirements.model || defaultModel.name;
                            const resolvedModel = rawModel ? findTextToImageModel(rawModel) : null;
                            const modelName = resolvedModel?.name || defaultModel.name;
                            inferredResolution = findClosestImageResolution(refWidth, refHeight, modelName);
                        }
                    } else if (srcModal?.frameWidth && srcModal?.frameHeight) {
                        refWidth = Number(srcModal.frameWidth);
                        refHeight = Number(srcModal.frameHeight);
                        if (Number.isFinite(refWidth) && Number.isFinite(refHeight) && refWidth > 0 && refHeight > 0) {
                            const defaultModel = getDefaultTextToImageModel();
                            const rawModel = session.requirements.model || defaultModel.name;
                            const resolvedModel = rawModel ? findTextToImageModel(rawModel) : null;
                            const modelName = resolvedModel?.name || defaultModel.name;
                            inferredResolution = findClosestImageResolution(refWidth, refHeight, modelName);
                        }
                    }
                }

                const requestedAspect = (session.requirements.aspectRatio || inferredAspect || '1:1');
                const aspectRatio = (isValidImageAspectRatio(requestedAspect) ? requestedAspect : '1:1') as any;
                const defaultModel = getDefaultTextToImageModel();
                // Normalize model so it matches UI/backends (handle ids like "z-image-turbo" as well as names).
                const rawModel = session.requirements.model || defaultModel.name;
                const resolvedModel = rawModel ? findTextToImageModel(rawModel) : null;
                let model = resolvedModel?.name || defaultModel.name;
                // Rule: for image-to-image, default to Google Nano Banana.
                if (isImg2Img && (!model || String(model).toLowerCase().includes('z image turbo') || String(model).toLowerCase().includes('z-image-turbo'))) {
                    model = 'Google Nano Banana';
                }
                const count = Math.max(1, Math.min(4, intent.count || 1)); // respect registry max batch (4)
                const style = session.requirements.style || 'photorealistic';
                const topic = session.requirements.topic || session.requirements.product || text;
                
                // Detect variation mode from user input
                const textLower = text.toLowerCase();
                let detectedVariationMode: 'same_prompt' | 'different_angles' | 'different_lighting' | 'different_styles' = 'same_prompt';
                if (count > 1) {
                    if (textLower.includes('different angle') || textLower.includes('various angle') || textLower.includes('multiple angle')) {
                        detectedVariationMode = 'different_angles';
                    } else if (textLower.includes('different light') || textLower.includes('various light') || textLower.includes('multiple light')) {
                        detectedVariationMode = 'different_lighting';
                    } else if (textLower.includes('different style') || textLower.includes('various style') || textLower.includes('multiple style')) {
                        detectedVariationMode = 'different_styles';
                    }
                }
                
                // Use structured prompt builder for img2img, regular prompt for t2i
                // Use processedText (with image reference removed) for prompt building
                const basePrompt = isImg2Img
                    ? buildImg2ImgPrompt(processedText.trim(), style)
                    : `${topic} in ${style} style`;
                
                // Generate batch variations if count > 1
                const variationMode = session.requirements.batchVariationMode || detectedVariationMode;
                const promptVariations = generateBatchVariations(basePrompt, count, variationMode);
                
                const targetIds = isImg2Img ? (session.requirements.referenceImageIds || []) : [];
                const requestedRes = (session.requirements.resolution || intent.resolution || inferredResolution || '1024');
                const resolution = isValidImageResolution(requestedRes) ? requestedRes : '1024';

                const steps: CanvasInstructionStep[] = [
                    {
                        id: `img-${Date.now()}`,
                        action: 'CREATE_NODE',
                        nodeType: 'image-generator',
                        count, // IMPORTANT: executor creates one image node per count
                        configTemplate: {
                            model,
                            aspectRatio,
                            resolution,
                            prompt: basePrompt, // Base prompt (variations in batchConfigs)
                            targetIds: intent.task === 'image_to_image' ? targetIds : [],
                        },
                        batchConfigs: promptVariations.map(p => ({ prompt: p })),
                    } as any,
                ];

                // Build summary with auto-detected values highlighted
                const summaryParts = [
                        `Frame: ${aspectRatio}${inferredAspect ? ' (auto from reference)' : ''}`,
                        `Resolution: ${resolution}${inferredResolution ? ' (auto from reference)' : ''}`,
                        `Images: ${count}${count > 1 && variationMode !== 'same_prompt' ? ` (${variationMode.replace('_', ' ')})` : ''}`,
                        `Model: ${model}`,
                        `Prompt: ${basePrompt.substring(0, 60)}${basePrompt.length > 60 ? '...' : ''}`,
                    ];
                
                const plan: CanvasInstructionPlan = {
                    id: `plan-${Date.now()}`,
                    summary: summaryParts.join('\n'),
                    steps,
                    metadata: {
                        sourceGoal: {
                            goalType: 'IMAGE_GENERATION',
                            topic,
                            style,
                            aspectRatio,
                            count,
                            model,
                            needs: ['image'],
                            references: targetIds,
                            explanation: 'Generated by multi-phase chat agent',
                        },
                        compiledAt: Date.now(),
                    },
                    requiresConfirmation: true,
                };

                // Put image plans into GRAPH_PREVIEW so the user can modify parameters before executing.
                session.phase = 'GRAPH_PREVIEW';
                session.graphPlan = plan;
                attachPlanPreview(plan as any, session.requirements);

                const displayParts = [
                        `✅ **Image Generation Plan**`,
                        ``,
                        `- **Frame**: ${aspectRatio}${inferredAspect ? ' (auto from reference)' : ''}`,
                        `- **Resolution**: ${resolution}${inferredResolution ? ' (auto from reference)' : ''}`,
                        `- **Number of images**: ${count}${count > 1 && variationMode !== 'same_prompt' ? ` (variation: ${variationMode.replace(/_/g, ' ')})` : ''}`,
                        `- **Model**: ${model}`,
                    ];
                
                if (isImg2Img) {
                    displayParts.push(`- **Structured Prompt**:`);
                    displayParts.push(`  • Preserve original composition and structure`);
                    displayParts.push(`  • Apply: ${processedText.trim()}`);
                    displayParts.push(`  • Maintain consistent lighting and ${style} style`);
                    // Show which image is being used if a specific one was referenced
                    if (targetImageId && imageIndex !== null) {
                        displayParts.push(`  • Using: Image ${imageIndex} (from your selection)`);
                    }
                } else {
                    displayParts.push(`- **Prompt**: ${basePrompt}`);
                }
                
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: displayParts.join('\n'),
                    action: {
                        type: 'SINGLE',
                        intent: 'EXECUTE_PLAN',
                        confidence: 1,
                        payload: plan,
                        requiresConfirmation: true,
                        explanation: plan.summary,
                    },
                    timestamp: Date.now(),
                }]);
                return;
            }

            // Other non-video tasks: reply only (no Proceed)
            if (intent.task !== 'text_to_video' && intent.task !== 'image_to_video') {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: intent.explanation || 'OK.',
                    timestamp: Date.now(),
                }]);
                return;
            }

            // Phase 2: requirement collection
            const questions = buildRequirementQuestions(intent, { selectedImageIds });
            session.pendingQuestions = questions;
            session.currentQuestionIndex = 0;

            if (questions.length > 0) {
                session.phase = 'COLLECTING_REQUIREMENTS';
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `${intent.explanation}\n\n${questions[0].question}`,
                    timestamp: Date.now(),
                }]);
                return;
            }

            // If no questions, go straight to script or plan
            if (session.requirements.needsScript) {
                session.phase = 'SCRIPT_REVIEW';
                const videoModelName = session.requirements.model || getDefaultTextToVideoModel().name;
                const maxClipSeconds = getVideoMaxClipSeconds(videoModelName);
                const durationSeconds = session.requirements.durationSeconds || 8;
                const targetClips = Math.max(1, Math.ceil(durationSeconds / Math.max(1, maxClipSeconds)));
                const plan = await generateScriptAndScenes({
                    product: session.requirements.product,
                    topic: session.requirements.topic,
                    goal: session.requirements.goal,
                    durationSeconds,
                    platform: session.requirements.platform,
                    style: session.requirements.style,
                    targetClips,
                    maxClipSeconds,
                    forceSingleScene: targetClips === 1,
                });
                session.scriptPlan = plan;
                const preview = [
                    `📝 **Script Draft**`,
                    ``,
                    plan.script,
                    ``,
                    `## 🎬 Scenes`,
                    ...plan.scenes.map(s => `- ${s.scene}. (${s.durationSeconds}s) ${s.prompt}`),
                    ``,
                    `Approve this script?`,
                    `A) Approve\nB) Modify`,
                ].join('\n');
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: preview,
                    timestamp: Date.now(),
                }]);
                return;
            }

            session.phase = 'GRAPH_PREVIEW';
            const plan = buildVideoCanvasPlan({ requirements: session.requirements, script: session.scriptPlan });
            const validation = validateCanvasPlan(plan, { requirements: session.requirements });
            if (!validation.ok) {
                resetSession();
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: `❌ I couldn't build a valid plan:\n- ${validation.errors.join('\n- ')}`,
                    timestamp: Date.now(),
                }]);
                return;
            }
            session.graphPlan = plan;
            attachPlanPreview(plan as any, session.requirements);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `✅ Plan ready:\n\n${plan.summary}\n\nApprove execution?\nA) Execute\nB) Cancel`,
                action: {
                    type: 'SINGLE',
                    intent: 'EXECUTE_PLAN',
                    confidence: 1,
                    payload: plan,
                    requiresConfirmation: true,
                    explanation: plan.summary,
                },
                timestamp: Date.now(),
            }]);
        } catch (error) {
            console.error('[ChatEngine] Error:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [context, messages]);

    const applyAutoFix = useCallback(async (fix: PlanAutoFix) => {
        const session = sessionRef.current;
        if (!session.graphPlan) {
            const recovered = findLastImagePlanInMessages(messages);
            if (recovered) {
                session.graphPlan = recovered;
                session.phase = 'GRAPH_PREVIEW';
            }
        }
        if (!session.graphPlan) return;

        const task = session.requirements.task;

        // Apply patch to requirements (source of truth) where possible.
        switch (fix.patch.kind) {
            case 'SET_VIDEO_DURATION':
                session.requirements.durationSeconds = fix.patch.seconds;
                break;
            case 'SET_VIDEO_RESOLUTION':
                session.requirements.resolution = fix.patch.resolution;
                break;
            case 'SET_VIDEO_ASPECT_RATIO':
                session.requirements.aspectRatio = fix.patch.aspectRatio;
                break;
            case 'SET_IMAGE_MODEL':
                session.requirements.model = fix.patch.model;
                break;
            case 'SET_IMAGE_RESOLUTION':
                session.requirements.resolution = fix.patch.resolution;
                break;
            case 'SET_IMAGE_ASPECT_RATIO':
                session.requirements.aspectRatio = fix.patch.aspectRatio;
                break;
            case 'SET_REFERENCE_PRIMARY_INDEX': {
                const ids = (session.requirements.referenceImageIds || []).filter(Boolean);
                if (ids.length > 0) {
                    const idx = Math.max(0, Math.min(ids.length - 1, fix.patch.index));
                    const primary = ids[idx];
                    session.requirements.referenceImageIds = [primary, ...ids.filter((_, i) => i !== idx)];
                }
                break;
            }
            case 'SET_REFERENCE_STRENGTH':
                session.requirements.referenceStrength = fix.patch.strength;
                break;
            default:
                break;
        }

        // Rebuild plan
        let rebuilt: any = null;
        if (task === 'text_to_video' || task === 'image_to_video') {
            rebuilt = buildVideoCanvasPlan({ requirements: session.requirements, script: session.scriptPlan });
        } else if (task === 'text_to_image' || task === 'image_to_image') {
            // Re-use current plan's base prompt if available
            const currentImageStep: any = session.graphPlan.steps?.find((s: any) => s.action === 'CREATE_NODE' && s.nodeType === 'image-generator');
            const isImg2Img = task === 'image_to_image';
            const model = session.requirements.model || currentImageStep?.configTemplate?.model || getDefaultTextToImageModel().name;
            const aspectRatio = session.requirements.aspectRatio || currentImageStep?.configTemplate?.aspectRatio || '1:1';
            const resolution = session.requirements.resolution || currentImageStep?.configTemplate?.resolution || '1024';
            const prompt = currentImageStep?.configTemplate?.prompt || session.lastUserMessage || 'Image';
            const targetIds = isImg2Img ? (session.requirements.referenceImageIds || []) : [];
            const count = Math.max(1, Math.min(4, Number(currentImageStep?.count || session.intent?.count || 1)));
            rebuilt = {
                ...session.graphPlan,
                summary: [
                    `Frame: ${aspectRatio}`,
                    `Resolution: ${resolution}`,
                    `Images: ${count}`,
                    `Model: ${model}`,
                    `Prompt: ${prompt}`,
                ].join('\n'),
                steps: [
                    {
                        ...(currentImageStep || {}),
                        id: currentImageStep?.id || `img-${Date.now()}`,
                        action: 'CREATE_NODE',
                        nodeType: 'image-generator',
                        count,
                        configTemplate: {
                            ...(currentImageStep?.configTemplate || {}),
                            model,
                            aspectRatio,
                            resolution,
                            prompt,
                            targetIds,
                        },
                        batchConfigs: Array.from({ length: count }).map(() => ({ prompt })),
                    } as any,
                ],
            };
        }
        if (!rebuilt) return;

        const validation = validateCanvasPlan(rebuilt, { requirements: session.requirements });
        if (!validation.ok) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `❌ I couldn't apply that fix:\n- ${validation.errors.join('\n- ')}`,
                timestamp: Date.now(),
            }]);
            return;
        }

        attachPlanPreview(rebuilt as any, session.requirements);
        session.graphPlan = rebuilt;
        session.phase = 'GRAPH_PREVIEW';

        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `✅ **Updated Plan**\n\n${rebuilt.summary}\n\nApprove execution?\nA) Execute\nB) Cancel`,
            action: {
                type: 'SINGLE',
                intent: 'EXECUTE_PLAN',
                confidence: 1,
                payload: rebuilt,
                requiresConfirmation: true,
                explanation: rebuilt.summary,
            },
            timestamp: Date.now(),
        }]);
    }, [messages]);

    const clearMessages = useCallback(() => setMessages([]), []);

    return {
        messages,
        isProcessing,
        sendMessage,
        applyAutoFix,
        clearMessages
    };
};
