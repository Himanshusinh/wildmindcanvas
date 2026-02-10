import { CanvasInstructionPlan } from '../compiler/types';
import textToVideoModels from '../data/textToVideoModels.json';
import textToImageModels from '../data/textToImageModels.json';
import { CollectedRequirements } from './types';

export type PlanIssueSeverity = 'error' | 'warning';

export type PlanAutoFix =
  | { id: string; label: string; patch: { kind: 'SET_VIDEO_DURATION'; seconds: number } }
  | { id: string; label: string; patch: { kind: 'SET_VIDEO_RESOLUTION'; resolution: string } }
  | { id: string; label: string; patch: { kind: 'SET_VIDEO_ASPECT_RATIO'; aspectRatio: string } }
  | { id: string; label: string; patch: { kind: 'SET_IMAGE_RESOLUTION'; resolution: string } }
  | { id: string; label: string; patch: { kind: 'SET_IMAGE_ASPECT_RATIO'; aspectRatio: string } }
  | { id: string; label: string; patch: { kind: 'SET_IMAGE_MODEL'; model: string } }
  | { id: string; label: string; patch: { kind: 'SET_REFERENCE_PRIMARY_INDEX'; index: number } }
  | { id: string; label: string; patch: { kind: 'SET_REFERENCE_STRENGTH'; strength: 'low' | 'medium' | 'high' } };

export interface PlanValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  fixes: PlanAutoFix[];
}

type VideoModelRecord = (typeof textToVideoModels)['models'][number];
type ImageModelRecord = (typeof textToImageModels)['models'][number];

function findVideoModelRecord(modelNameOrId: string | undefined | null): VideoModelRecord | null {
  const q = String(modelNameOrId || '').toLowerCase().trim();
  if (!q) return null;
  return (
    (textToVideoModels.models as any[]).find(m => String(m.id).toLowerCase() === q) ||
    (textToVideoModels.models as any[]).find(m => String(m.name).toLowerCase() === q) ||
    (textToVideoModels.models as any[]).find(m => String(m.name).toLowerCase().includes(q) || String(m.id).toLowerCase().includes(q)) ||
    null
  ) as any;
}

function findImageModelRecord(modelNameOrId: string | undefined | null): ImageModelRecord | null {
  const q = String(modelNameOrId || '').toLowerCase().trim();
  if (!q) return null;
  return (
    (textToImageModels.models as any[]).find(m => String(m.id).toLowerCase() === q) ||
    (textToImageModels.models as any[]).find(m => String(m.name).toLowerCase() === q) ||
    (textToImageModels.models as any[]).find(m => String(m.name).toLowerCase().includes(q) || String(m.id).toLowerCase().includes(q)) ||
    null
  ) as any;
}

function pickClosestSeconds(supported: number[], requested: number): number {
  if (!supported || supported.length === 0) return requested;
  let best = supported[0];
  let bestDiff = Math.abs(best - requested);
  for (const s of supported) {
    const d = Math.abs(s - requested);
    if (d < bestDiff) {
      best = s;
      bestDiff = d;
    }
  }
  return best;
}

function pickClosestResolution(supported: string[], requested: string, fallback: string): string {
  const norm = (v: string) => String(v || '').toLowerCase();
  const req = norm(requested);
  if (!supported || supported.length === 0) return fallback;
  const exact = supported.find(r => norm(r) === req);
  if (exact) return exact;
  // numeric heuristic for values like 720p/1080p/2160p
  const parse = (v: string): number | null => {
    const m = String(v).match(/(\d{3,4})/);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };
  const reqN = parse(requested);
  if (reqN === null) return supported[0];
  let best = supported[0];
  let bestDiff = Infinity;
  for (const s of supported) {
    const n = parse(s);
    if (n === null) continue;
    const diff = Math.abs(n - reqN);
    if (diff < bestDiff) {
      best = s;
      bestDiff = diff;
    }
  }
  return best || supported[0];
}

export function validateCanvasPlan(plan: CanvasInstructionPlan, ctx?: { requirements?: CollectedRequirements }): PlanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fixes: PlanAutoFix[] = [];
  if (!plan.steps || plan.steps.length === 0) errors.push('Plan has no steps.');

  // Basic checks for connectToFrames correctness
  for (const step of plan.steps) {
    if ((step as any).action !== 'CREATE_NODE') continue;
    if ((step as any).nodeType !== 'video-generator') continue;
    const cfg = (step as any).configTemplate || {};
    const ctf = cfg.connectToFrames;
    if (!ctf) continue;
    if (ctf.connectionType === 'FIRST_LAST_FRAME') {
      if (ctf.firstFrameIndex === undefined || ctf.lastFrameIndex === undefined) {
        errors.push(`Video step ${step.id}: FIRST_LAST_FRAME missing frame indices.`);
      }
      if (!ctf.firstFrameStepId || !ctf.lastFrameStepId) {
        errors.push(`Video step ${step.id}: FIRST_LAST_FRAME missing frame step ids.`);
      }
    }
    if (ctf.connectionType === 'IMAGE_TO_VIDEO') {
      if (ctf.frameSource === 'USER_UPLOAD' && !ctf.frameId) {
        errors.push(`Video step ${step.id}: IMAGE_TO_VIDEO missing user frameId.`);
      }
    }
  }

  // User-facing validation (warnings + auto-fixes)
  const requirements = ctx?.requirements;
  const refIds = (requirements?.referenceImageIds || []).filter(Boolean);

  // Video parameter checks (duration/resolution/aspect per model)
  const videoSteps = (plan.steps || []).filter((s: any) => s.action === 'CREATE_NODE' && s.nodeType === 'video-generator') as any[];
  const firstVideoCfg = videoSteps[0]?.configTemplate;
  const videoModelName = firstVideoCfg?.model as string | undefined;
  const videoModel = findVideoModelRecord(videoModelName);
  if (videoSteps.length > 0) {
    const supportedDur = (videoModel?.temporal?.supportedDurations as number[] | undefined) || (textToVideoModels.features?.durationControl?.supportedDurations as number[] | undefined) || [];
    const supportedRes = (videoModel?.resolutions as string[] | undefined) || (textToVideoModels.features?.resolutionControl?.availableResolutions as string[] | undefined) || [];
    const supportedAR = (videoModel?.aspectRatios as string[] | undefined) || (textToVideoModels.features?.aspectRatioControl?.supportedRatios as string[] | undefined) || [];

    // duration: check each clip duration
    const clipDurations: number[] = [];
    for (const step of videoSteps) {
      const cfg = step?.configTemplate || {};
      const d = Number(cfg.duration);
      if (Number.isFinite(d) && d > 0) clipDurations.push(d);
    }
    const uniqueDur = Array.from(new Set(clipDurations));
    if (supportedDur.length > 0 && uniqueDur.some(d => !supportedDur.includes(d))) {
      const bad = uniqueDur.filter(d => !supportedDur.includes(d));
      warnings.push(`Some clip durations are not supported by ${videoModel?.name || videoModelName || 'the selected video model'}: ${bad.join(', ')}s. Supported: ${supportedDur.join(', ')}s.`);
      const suggested = pickClosestSeconds(supportedDur, bad[0] || uniqueDur[0] || supportedDur[0]);
      fixes.push({
        id: 'fix-video-duration',
        label: `Use supported duration (${suggested}s)`,
        patch: { kind: 'SET_VIDEO_DURATION', seconds: suggested },
      });
    }

    // resolution
    const reqRes = String(firstVideoCfg?.resolution || requirements?.resolution || '');
    if (reqRes && supportedRes.length > 0 && !supportedRes.map(r => r.toLowerCase()).includes(reqRes.toLowerCase())) {
      warnings.push(`Resolution "${reqRes}" is not supported by ${videoModel?.name || videoModelName || 'the selected video model'}. Supported: ${supportedRes.join(', ')}.`);
      const suggested = pickClosestResolution(supportedRes, reqRes, supportedRes[0] || '1080p');
      fixes.push({
        id: 'fix-video-resolution',
        label: `Pick closest resolution (${suggested})`,
        patch: { kind: 'SET_VIDEO_RESOLUTION', resolution: suggested },
      });
    }

    // aspect ratio
    const reqAR = String(firstVideoCfg?.aspectRatio || requirements?.aspectRatio || '');
    if (reqAR && supportedAR.length > 0 && !supportedAR.includes(reqAR)) {
      warnings.push(`Aspect ratio "${reqAR}" is not supported by ${videoModel?.name || videoModelName || 'the selected video model'}. Supported: ${supportedAR.join(', ')}.`);
      const suggested = supportedAR[0] || '16:9';
      fixes.push({
        id: 'fix-video-aspect',
        label: `Use supported aspect ratio (${suggested})`,
        patch: { kind: 'SET_VIDEO_ASPECT_RATIO', aspectRatio: suggested },
      });
    }
  }

  // Image parameter checks (resolution/aspect) for image-generator steps
  const imageSteps = (plan.steps || []).filter((s: any) => s.action === 'CREATE_NODE' && s.nodeType === 'image-generator') as any[];
  if (imageSteps.length > 0) {
    const step0 = imageSteps[0];
    const cfg = step0?.configTemplate || {};
    const imgModelName = cfg.model as string | undefined;
    const imgModel = findImageModelRecord(imgModelName);
    const supportedRes = (imgModel?.resolutions as string[] | undefined) || (textToImageModels.features?.highResolution?.resolutions as string[] | undefined) || [];
    const supportedAR = (imgModel?.aspectRatios as string[] | undefined) || (textToImageModels.features?.aspectRatioControl?.supportedRatios as string[] | undefined) || [];
    const reqRes = String(cfg.resolution || '');
    if (reqRes && supportedRes.length > 0 && !supportedRes.map(r => r.toLowerCase()).includes(reqRes.toLowerCase())) {
      warnings.push(`Image resolution "${reqRes}" is not supported by ${imgModel?.name || imgModelName || 'the selected image model'}. Supported: ${supportedRes.join(', ')}.`);
      const suggested = pickClosestResolution(supportedRes, reqRes, supportedRes[0] || '1024');
      fixes.push({
        id: 'fix-image-resolution',
        label: `Pick closest image resolution (${suggested})`,
        patch: { kind: 'SET_IMAGE_RESOLUTION', resolution: suggested },
      });
    }
    const reqAR = String(cfg.aspectRatio || '');
    if (reqAR && supportedAR.length > 0 && !supportedAR.includes(reqAR)) {
      warnings.push(`Image aspect ratio "${reqAR}" is not supported by ${imgModel?.name || imgModelName || 'the selected image model'}. Supported: ${supportedAR.join(', ')}.`);
      const suggested = supportedAR[0] || '1:1';
      fixes.push({
        id: 'fix-image-aspect',
        label: `Use supported image frame (${suggested})`,
        patch: { kind: 'SET_IMAGE_ASPECT_RATIO', aspectRatio: suggested },
      });
    }

    // Img2Img default model fix
    const needsImg2Img = Array.isArray(cfg.targetIds) && cfg.targetIds.length > 0;
    const img2imgFlag = Boolean((imgModel as any)?.imageToImage);
    if (needsImg2Img && imgModel && img2imgFlag === false) {
      warnings.push(`${imgModel.name} does not support image-to-image. Switch to a compatible model (default: Google Nano Banana).`);
      fixes.push({
        id: 'fix-img2img-model',
        label: `Switch to Google Nano Banana (img2img)`,
        patch: { kind: 'SET_IMAGE_MODEL', model: 'Google Nano Banana' },
      });
    }
  }

  // Missing reference images for image_to_video (we still allow it, but warn)
  const hasI2VSceneFrames = imageSteps.some(s => Array.isArray(s?.configTemplate?.targetIds));
  if (videoSteps.length > 0 && hasI2VSceneFrames) {
    const anyTargets = imageSteps.some(s => Array.isArray(s?.configTemplate?.targetIds) && s.configTemplate.targetIds.length > 0);
    if (!anyTargets || refIds.length === 0) {
      warnings.push(`No reference image is connected/selected for image-to-video. Select one or more images for better consistency.`);
    }
  }

  // Reference weighting helpers (only show as fixes if user selected multiple references)
  if (refIds.length >= 2) {
    fixes.push(
      { id: 'ref-primary-0', label: 'Primary ref: 1st', patch: { kind: 'SET_REFERENCE_PRIMARY_INDEX', index: 0 } },
      { id: 'ref-primary-1', label: 'Primary ref: 2nd', patch: { kind: 'SET_REFERENCE_PRIMARY_INDEX', index: 1 } },
      { id: 'ref-strength-low', label: 'Ref strength: Low', patch: { kind: 'SET_REFERENCE_STRENGTH', strength: 'low' } },
      { id: 'ref-strength-med', label: 'Ref strength: Medium', patch: { kind: 'SET_REFERENCE_STRENGTH', strength: 'medium' } },
      { id: 'ref-strength-high', label: 'Ref strength: High', patch: { kind: 'SET_REFERENCE_STRENGTH', strength: 'high' } },
    );
  }

  return { ok: errors.length === 0, errors, warnings, fixes };
}

