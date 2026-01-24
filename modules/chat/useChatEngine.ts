import { useState, useCallback, useMemo, useRef } from 'react';
import { IntentAction } from './intentSchemas';
import { queryCanvasPrompt } from '@/core/api/api';
import { detectIntent } from './agent/intentAgent';
import { AgentSessionState, AgentTask, RequirementQuestion } from './agent/types';
import { buildRequirementQuestions, applyRequirementAnswer } from './agent/requirements';
import { generateScriptAndScenes } from './agent/scriptAgent';
import { buildVideoCanvasPlan } from './agent/graphPlanner';
import { validateCanvasPlan } from './agent/validator';
import { CanvasInstructionPlan, CanvasInstructionStep } from './compiler/types';
import { findTextToImageModel, findTextToVideoModel, getDefaultTextToImageModel, getDefaultTextToVideoModel, isValidImageAspectRatio, isValidImageResolution, isValidVideoAspectRatio, isValidVideoResolution } from './agent/modelCatalog';
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
            const selectedImageIds = getSelectedImageIds(context);
            const session = sessionRef.current;
            session.lastUserMessage = text;

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
                    if (q.key === 'reference_images') {
                        session.requirements.referenceImageIds = selectedImageIds.slice(0, session.requirements.referenceImageIds?.length || 1);
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
                        const validation = validateCanvasPlan(plan);
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
                    session.phase = 'GRAPH_PREVIEW';
                    const plan = buildVideoCanvasPlan({ requirements: session.requirements, script: session.scriptPlan });
                    const validation = validateCanvasPlan(plan);
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
                    const scriptBlock = session.scriptPlan?.script
                        ? [
                            `📝 **Script (approved)**`,
                            ``,
                            session.scriptPlan.script,
                            ``,
                            `## 🎬 Scenes`,
                            ...(session.scriptPlan.scenes || []).map(s => `- ${s.scene}. (${s.durationSeconds}s) ${s.prompt}`),
                            ``,
                          ].join('\n')
                        : '';
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: `${scriptBlock}${scriptBlock ? '\n' : ''}✅ Plan ready:\n\n${plan.summary}\n\nApprove execution?\nA) Execute\nB) Cancel`,
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
                    const validation = validateCanvasPlan(rebuilt);
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
                const nextPrompt = promptFromDecision || step0.configTemplate?.prompt;

                let nextModel = requestedModel?.name || step0.configTemplate?.model;
                // Rule: for image-to-image, always default to Google Nano Banana if model isn't specified or is unsupported.
                if (isImg2ImgPlan && (!nextModel || String(nextModel).toLowerCase().includes('z image turbo') || String(nextModel).toLowerCase().includes('z-image-turbo'))) {
                    nextModel = 'Google Nano Banana';
                }

                // Patch plan
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
                return;
                }
            }

            // Phase 1: intent detection
            const intent = await detectIntent(text, { selectedImageCount: selectedImageIds.length });
            session.intent = intent;
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
                referenceImageIds: selectedImageIds,
            };

            // Text-to-Image / Image-to-Image: create an executable plan (EXECUTE_PLAN)
            if (intent.task === 'text_to_image' || intent.task === 'image_to_image') {
                // For image-to-image, default to the selected image's aspect ratio (if available).
                const isImg2Img = intent.task === 'image_to_image';
                let inferredAspect: string | null = null;
                if (isImg2Img && selectedImageIds.length > 0) {
                    const srcId = selectedImageIds[0];
                    const srcModal = context.canvasState?.imageModalStates?.find((m: any) => m.id === srcId);
                    const srcUpload = context.canvasState?.images?.find((img: any) => img.elementId === srcId || img.id === srcId);
                    inferredAspect = srcModal?.aspectRatio || null;
                    if (!inferredAspect && srcUpload?.width && srcUpload?.height) {
                        const w = Number(srcUpload.width);
                        const h = Number(srcUpload.height);
                        if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
                            // Map to common ratios we already validate against.
                            const ratio = w / h;
                            const close = (a: number, b: number) => Math.abs(a - b) < 0.03;
                            if (close(ratio, 1)) inferredAspect = '1:1';
                            else if (close(ratio, 16 / 9)) inferredAspect = '16:9';
                            else if (close(ratio, 9 / 16)) inferredAspect = '9:16';
                            else if (close(ratio, 4 / 3)) inferredAspect = '4:3';
                            else if (close(ratio, 3 / 4)) inferredAspect = '3:4';
                            else if (close(ratio, 3 / 2)) inferredAspect = '3:2';
                            else if (close(ratio, 2 / 3)) inferredAspect = '2:3';
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
                const prompt = isImg2Img
                    ? `${text.trim()}. Preserve the original image and only apply the requested change. ${style} style.`
                    : `${topic} in ${style} style`;
                const targetIds = isImg2Img ? (session.requirements.referenceImageIds || []) : [];
                const requestedRes = (session.requirements.resolution || intent.resolution || '1024');
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
                            prompt,
                            targetIds: intent.task === 'image_to_image' ? targetIds : [],
                        },
                        batchConfigs: Array.from({ length: count }).map(() => ({ prompt })),
                    } as any,
                ];

                const plan: CanvasInstructionPlan = {
                    id: `plan-${Date.now()}`,
                    summary: [
                        `Frame: ${aspectRatio}`,
                        `Resolution: ${resolution}`,
                        `Images: ${count}`,
                        `Model: ${model}`,
                        `Prompt: ${prompt}`,
                    ].join('\n'),
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

                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: [
                        `✅ **Image Generation Plan**`,
                        ``,
                        `- **Frame**: ${aspectRatio}`,
                        `- **Resolution**: ${resolution}`,
                        `- **Number of images**: ${count}`,
                        `- **Model**: ${model}`,
                        `- **Prompt**: ${prompt}`,
                    ].join('\n'),
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
            const validation = validateCanvasPlan(plan);
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

    const clearMessages = useCallback(() => setMessages([]), []);

    return {
        messages,
        isProcessing,
        sendMessage,
        clearMessages
    };
};
