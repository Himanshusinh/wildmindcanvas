import { queryCanvasPrompt } from '@/core/api/api';
import { extractFirstJsonObject, coerceNumber } from './llm';
import textToImageModels from '../data/textToImageModels.json';
import textToVideoModels from '../data/textToVideoModels.json';

export type PlanDecisionIntent = 'EXECUTE' | 'CANCEL' | 'EDIT_PLAN' | 'CLARIFY';

export interface PlanDecisionResult {
  intent: PlanDecisionIntent;
  changes?: {
    model?: string | null;
    aspectRatio?: string | null;
    resolution?: string | null;
    count?: number | null;
    prompt?: string | null;
  };
  reply?: string;
}

function getAvailableModelNames(): { imageModels: string[]; videoModels: string[] } {
  const imageModels = ((textToImageModels as any)?.models || []).map((m: any) => String(m?.name || m?.id)).filter(Boolean);
  const videoModels = ((textToVideoModels as any)?.models || []).map((m: any) => String(m?.name || m?.id)).filter(Boolean);
  return { imageModels, videoModels };
}

const DECISION_PROMPT = `
You are a Plan Decision Agent for a creative canvas.
You will be given:
- The user's message (may come from voice transcription; can contain typos)
- The current plan summary (what will be generated)
- Lists of available model names

Your job: decide what the user wants to do NEXT with the existing plan.

Output ONLY valid JSON (no markdown) matching this schema:
{
  "intent": "EXECUTE" | "CANCEL" | "EDIT_PLAN" | "CLARIFY",
  "changes": {
    "model": string|null,
    "aspectRatio": string|null,
    "resolution": string|null,
    "count": number|null,
    "prompt": string|null
  },
  "reply": string
}

Rules:
- If the user clearly wants to start/run/generate now -> intent="EXECUTE"
- If the user clearly wants to stop/cancel -> intent="CANCEL"
- If the user asks to change any parameter (model/aspect ratio/count/resolution/prompt/style) -> intent="EDIT_PLAN" with ONLY the fields they want changed.
- If unclear -> intent="CLARIFY" with a short question in "reply".
- Prefer matching "model" to one of the provided model names (or very close name).
- If user says "yes", "go ahead", "do it", "run it", "proceed" -> EXECUTE.
- If user says "no", "stop", "cancel", "don't" -> CANCEL.
`;

export async function decideNextForPlan(input: {
  userMessage: string;
  planSummary: string;
}): Promise<PlanDecisionResult> {
  const { imageModels, videoModels } = getAvailableModelNames();

  // Keep prompt size reasonable while still being useful.
  const imageSample = imageModels.slice(0, 60);
  const videoSample = videoModels.slice(0, 60);

  const payload =
    `${DECISION_PROMPT}\n\n` +
    `Current plan summary:\n${input.planSummary}\n\n` +
    `Available image model names (sample): ${JSON.stringify(imageSample)}\n` +
    `Available video model names (sample): ${JSON.stringify(videoSample)}\n\n` +
    `User:\n${input.userMessage}`;

  const raw = await queryCanvasPrompt(payload);
  const text = typeof raw === 'string' ? raw : (raw.response || '');
  const parsed = extractFirstJsonObject<any>(text);

  if (!parsed) {
    // Conservative fallback: ask the user (do not execute).
    return { intent: 'CLARIFY', reply: 'Do you want me to execute this plan, cancel it, or change something (model/frame/count)?' };
  }

  const intent = (String(parsed.intent || '').toUpperCase() as PlanDecisionIntent) || 'CLARIFY';
  const changesRaw = parsed.changes || {};

  return {
    intent: (['EXECUTE', 'CANCEL', 'EDIT_PLAN', 'CLARIFY'] as const).includes(intent) ? intent : 'CLARIFY',
    changes: {
      model: changesRaw.model ?? undefined,
      aspectRatio: changesRaw.aspectRatio ?? undefined,
      resolution: changesRaw.resolution ?? undefined,
      count: coerceNumber(changesRaw.count),
      prompt: changesRaw.prompt ?? undefined,
    },
    reply: parsed.reply ?? undefined,
  };
}

