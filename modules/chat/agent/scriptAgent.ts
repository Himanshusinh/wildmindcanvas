import { queryCanvasPrompt } from '@/core/api/api';
import { extractFirstJsonObject, coerceNumber } from './llm';
import { ScriptPlan } from './types';

const SCRIPT_PROMPT = `
You are a Script + Scene Planning Agent for ads and story videos.
Output ONLY valid JSON (no markdown) with schema:
{
  "script": string,
  "scenes": [
    { "scene": number, "prompt": string, "durationSeconds": number }
  ],
  "style": string|null
}

CRITICAL CONSISTENCY RULES:
- Maintain visual consistency across ALL scenes: same product/character identity, color palette, lighting style, camera style, and overall aesthetic.
- Each scene prompt must be DETAILED and SPECIFIC: include camera angle, lighting, composition, colors, textures, mood, and visual style.
- Scene transitions should feel natural and connected - maintain the same visual language throughout.
- For product ads: keep product appearance, branding, and key visual elements consistent across all scenes.
- For story videos: maintain character appearance, setting style, and narrative tone consistently.
- Each scene prompt should build upon the previous one while maintaining visual coherence.

Rules:
- Total of scene durations should be close to requested duration. If shorter, keep pacing and leave last scene repeatable.
- Prompts must be specific and visual (camera, lighting, composition, colors, textures, mood).
- For product ads, include a strong opening hook and a clear CTA near the end.
- Include a "style" field that describes the overall visual style to maintain consistency (e.g., "cinematic, high-contrast, professional product photography").
`;

export async function generateScriptAndScenes(input: {
  product?: string;
  topic?: string;
  goal?: string;
  durationSeconds: number;
  platform?: string | null;
  style?: string | null;
  userNotes?: string;
  // Video planning hints
  targetClips?: number; // number of video segments we plan to stitch
  maxClipSeconds?: number; // max seconds per clip for the chosen model
  forceSingleScene?: boolean; // if true, return exactly 1 scene
}): Promise<ScriptPlan> {
  const payload = `${SCRIPT_PROMPT}

Extra rules for this request:
- If forceSingleScene=true OR targetClips=1: return EXACTLY 1 scene with durationSeconds=${input.durationSeconds}.
- If targetClips>1: return EXACTLY targetClips scenes. Each scene duration must be <= maxClipSeconds (if provided). Total should be close to durationSeconds and can be padded by repeating the last scene.

Input:
${JSON.stringify(input, null, 2)}`;
  const raw = await queryCanvasPrompt(payload);
  const text = typeof raw === 'string' ? raw : (raw.response || '');
  const parsed = extractFirstJsonObject<any>(text);
  if (!parsed) {
    // fallback minimal
    return {
      script: `Create a ${input.durationSeconds}s video about ${input.product || input.topic || 'the topic'}.`,
      scenes: [
        { scene: 1, prompt: input.topic || input.product || 'Visual', durationSeconds: Math.min(8, input.durationSeconds) },
      ],
      style: input.style ?? null,
    };
  }

  const scenes = Array.isArray(parsed.scenes) ? parsed.scenes : [];
  let mapped = scenes
    .map((s: any, idx: number) => ({
      scene: coerceNumber(s.scene) ?? idx + 1,
      prompt: String(s.prompt || ''),
      durationSeconds: coerceNumber(s.durationSeconds) ?? 6,
    }))
    .filter((s: any) => s.prompt && s.durationSeconds > 0);

  // Enforce single-scene mode for single-clip videos
  if (input.forceSingleScene || input.targetClips === 1) {
    const first = mapped[0] || { scene: 1, prompt: input.topic || input.product || 'Visual', durationSeconds: input.durationSeconds };
    mapped = [{ scene: 1, prompt: first.prompt, durationSeconds: input.durationSeconds }];
  } else if (typeof input.targetClips === 'number' && input.targetClips > 1) {
    // If LLM returned a different scene count, truncate/pad deterministically.
    const n = input.targetClips;
    if (mapped.length > n) mapped = mapped.slice(0, n);
    while (mapped.length < n) {
      const last = mapped[mapped.length - 1] || { scene: 1, prompt: input.topic || input.product || 'Visual', durationSeconds: 6 };
      mapped.push({ ...last, scene: mapped.length + 1 });
    }
    // Clamp each scene to maxClipSeconds if provided.
    if (typeof input.maxClipSeconds === 'number' && input.maxClipSeconds > 0) {
      mapped = mapped.map((s: any, idx: number) => ({
        ...s,
        scene: idx + 1,
        durationSeconds: Math.min(s.durationSeconds, input.maxClipSeconds as number),
      }));
    }
  }

  return {
    script: String(parsed.script || ''),
    style: parsed.style ?? input.style ?? null,
    scenes: mapped,
  };
}

