import { queryCanvasPrompt } from '@/core/api/api';
import { extractFirstJsonObject, coerceNumber } from './llm';
import { IntentResult } from './types';

const INTENT_PROMPT = `
You are an Intent Detection Agent for a creative canvas.
Output ONLY valid JSON (no markdown) matching this schema:
{
  "task": "text_to_image" | "image_to_image" | "text_to_video" | "image_to_video" | "plugin_action" | "delete_content" | "explain" | "unknown",
  "goal": string|null,
  "product": string|null,
  "topic": string|null,
  "durationSeconds": number|null,
  "count": number|null,
  "platform": string|null,
  "style": string|null,
  "needsReferenceImage": boolean,
  "needsScript": boolean,
  "aspectRatio": string|null,
  "resolution": string|null,
  "model": string|null,
  "explanation": string
}

Rules:
- If user wants to animate an existing image into video -> task = "image_to_video"
- If user wants a video from scratch (no image) -> task = "text_to_video"
- If user says remove/delete -> task = "delete_content"
- If user asks how to use canvas -> task = "explain"
- needsReferenceImage=true for image_to_video when no reference images are provided.
- needsScript=true for ads/long videos unless user says they already have a script.
`;

export async function detectIntent(userMessage: string, ctx: { selectedImageCount: number }): Promise<IntentResult> {
  const payload = `${INTENT_PROMPT}\n\nContext:\n- selectedImageCount=${ctx.selectedImageCount}\n\nUser:\n${userMessage}`;
  const raw = await queryCanvasPrompt(payload);
  const text = typeof raw === 'string' ? raw : (raw.response || '');
  const parsed = extractFirstJsonObject<any>(text);
  if (!parsed) {
    return {
      task: 'unknown',
      explanation: text || "I couldn't understand the request.",
    };
  }

  const intent: IntentResult = {
    task: parsed.task || 'unknown',
    goal: parsed.goal ?? undefined,
    product: parsed.product ?? undefined,
    topic: parsed.topic ?? undefined,
    durationSeconds: coerceNumber(parsed.durationSeconds),
    count: coerceNumber(parsed.count),
    platform: parsed.platform ?? undefined,
    style: parsed.style ?? undefined,
    needsReferenceImage: Boolean(parsed.needsReferenceImage),
    needsScript: Boolean(parsed.needsScript),
    aspectRatio: parsed.aspectRatio ?? undefined,
    resolution: parsed.resolution ?? undefined,
    model: parsed.model ?? undefined,
    explanation: parsed.explanation || "I've understood your request.",
  };

  // Deterministic guardrail: if user asks for a video, pick T2V vs I2V based on selected image count.
  // This avoids the LLM misrouting into image tasks.
  {
    const t = userMessage.toLowerCase();
    const wantsVideo = /\b(vidoe|video|animation|animate)\b/.test(t);
    if (wantsVideo && intent.task !== 'delete_content' && intent.task !== 'explain') {
      if (ctx.selectedImageCount > 0) {
        intent.task = 'image_to_video';
        intent.needsReferenceImage = false;
      } else {
        intent.task = 'text_to_video';
      }
    }
  }

  // Product requirement: for video generation, always go through a script/scenes step unless user explicitly opts out.
  // This enables the "how the video will be created" preview and user verification.
  if (intent.task === 'text_to_video' || intent.task === 'image_to_video') {
    const t = userMessage.toLowerCase();
    const userOptedOut =
      /\b(no script|without script|skip script|dont generate script|don't generate script)\b/.test(t);
    const userProvidedScript = /\bscript\s*:/i.test(userMessage) || /\bscene\s*:/i.test(userMessage);
    intent.needsScript = !userOptedOut && !userProvidedScript;
  }

  // Deterministic guardrail: if the user has an image selected and the message looks like an edit,
  // force image-to-image even if the LLM misclassifies it.
  if (ctx.selectedImageCount > 0) {
    const t = userMessage.toLowerCase();
    const looksLikeEdit =
      /\b(add|remove|replace|edit|change|modify|erase|inpaint|outpaint|insert|put|add a|add an)\b/.test(t) &&
      !/\b(generate|create|make)\s+\d+\s*(images?|pics?|pictures?)\b/.test(t);
    if (looksLikeEdit && (intent.task === 'text_to_image' || intent.task === 'unknown')) {
      intent.task = 'image_to_image';
      intent.needsReferenceImage = false;
      if (!intent.count) intent.count = 1;
    }
  }

  // Deterministic fallback: extract "2 images"/"3 image" etc. from the raw text if LLM missed it
  if (!intent.count) {
    const m = userMessage.toLowerCase().match(/(\d+)\s*(images?|pics?|pictures?)/);
    if (m?.[1]) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > 0) intent.count = n;
    }
  }

  // Context guardrails
  if (intent.task === 'image_to_video' && ctx.selectedImageCount > 0) {
    intent.needsReferenceImage = false;
  }

  return intent;
}

