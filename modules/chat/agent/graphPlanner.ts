import { v4 as uuidv4 } from 'uuid';
import { CanvasInstructionPlan, CanvasInstructionStep } from '../compiler/types';
import { CollectedRequirements, ScenePlan, VideoMode } from './types';
import textToVideoModels from '../data/textToVideoModels.json';
import { getDefaultTextToVideoModel, getDefaultTextToImageModel } from './modelCatalog';

type VideoJson = typeof textToVideoModels;

function getVideoModelRecord(query: string): any | null {
  const models = (textToVideoModels as VideoJson).models as any[];
  const q = (query || '').toLowerCase().trim();
  if (!q) return null;
  const byId = models.find(m => String(m.id).toLowerCase() === q);
  if (byId) return byId;
  const byName = models.find(m => String(m.name).toLowerCase() === q);
  if (byName) return byName;
  const partial = models.find(m => String(m.name).toLowerCase().includes(q) || String(m.id).toLowerCase().includes(q));
  return partial || null;
}

function resolveVideoModelName(model?: string | null): string {
  const fallback = getDefaultTextToVideoModel().name;
  if (!model) return fallback;
  const rec = getVideoModelRecord(model);
  return rec?.name || fallback;
}

function clampToSupportedDuration(modelName: string, seconds: number): number {
  const rec = getVideoModelRecord(modelName);
  const max = rec?.temporal?.maxOutputSeconds ?? 8;
  const supported = rec?.temporal?.supportedDurations;
  if (Array.isArray(supported) && supported.length > 0) {
    // pick nearest supported
    let best = supported[0];
    let bestDiff = Math.abs(best - seconds);
    for (const c of supported) {
      const d = Math.abs(c - seconds);
      if (d < bestDiff) {
        best = c;
        bestDiff = d;
      }
    }
    return best;
  }
  return Math.min(seconds, max);
}

function modelSupportsFirstLastFrame(modelName: string): boolean {
  const rec = getVideoModelRecord(modelName);
  return Boolean(rec?.firstLastFrame || rec?.firstLastFrameDetails?.supported);
}

function expandScenesToClips(scenes: ScenePlan[], requestedTotal: number, maxClip: number): ScenePlan[] {
  const clips: ScenePlan[] = [];
  // split scenes longer than maxClip
  scenes.forEach((s) => {
    let remaining = s.durationSeconds;
    while (remaining > 0) {
      const d = Math.min(remaining, maxClip);
      clips.push({ ...s, durationSeconds: d });
      remaining -= d;
    }
  });

  // pad by repeating last clip until reaching requestedTotal
  let total = clips.reduce((sum, c) => sum + c.durationSeconds, 0);
  const fallback = clips[clips.length - 1] || { scene: 1, prompt: 'Product beauty shot', durationSeconds: Math.min(maxClip, requestedTotal) };
  while (total < requestedTotal) {
    const needed = Math.min(maxClip, requestedTotal - total);
    clips.push({ ...fallback, scene: fallback.scene + 1, durationSeconds: needed });
    total += needed;
  }

  // normalize scene numbers
  return clips.map((c, i) => ({ ...c, scene: i + 1 }));
}

export function buildVideoCanvasPlan(input: {
  requirements: CollectedRequirements;
  script?: { script: string; scenes: ScenePlan[] };
}): CanvasInstructionPlan {
  const { requirements, script } = input;
  const steps: CanvasInstructionStep[] = [];

  const duration = requirements.durationSeconds ?? 8;
  const aspectRatio = requirements.aspectRatio ?? (requirements.platform === 'instagram_reel' ? '9:16' : '16:9');
  const resolution = requirements.resolution ?? '720p';
  const videoModel = resolveVideoModelName(requirements.model);

  const cap = getVideoModelRecord(videoModel);
  const maxClip = cap?.temporal?.maxOutputSeconds ?? 8;

  const scenes = (script?.scenes && script.scenes.length > 0)
    ? script.scenes
    : [{ scene: 1, prompt: requirements.topic || requirements.product || 'Cinematic video', durationSeconds: Math.min(maxClip, duration) }];

  const expanded = expandScenesToClips(scenes, duration, maxClip);

  // Optional script node for visibility
  if (script?.script) {
    steps.push({
      id: `script-${uuidv4()}`,
      action: 'CREATE_NODE',
      nodeType: 'text',
      count: 1,
      configTemplate: {
        model: 'standard',
        content: script.script,
        style: 'rich',
      },
    } as any);
  }

  const task = requirements.task;
  if (task === 'image_to_video') {
    const selected = requirements.referenceImageIds || [];
    const strength = requirements.referenceStrength || 'medium';
    const strengthPrefix =
      strength === 'high'
        ? 'Match the reference image strongly (same product identity, materials, branding).'
        : strength === 'low'
          ? 'Use the reference image loosely (keep general identity but allow variation).'
          : 'Use the reference image as guidance (keep product identity consistent).';
    // Always use boundary scene frames (N+1) generated WITH the selected reference image(s),
    // then connect each video segment to consecutive frames:
    // video i uses frame i (first) + frame i+1 (last).
    //
    // This yields the desired 3-column flow:
    // Reference Image(s) → Scene Frame Images → Video Segments.
    const imageStepId = `frames-${uuidv4()}`;
    const imageCount = expanded.length + 1;
    const imagePrompts = Array.from({ length: imageCount }).map((_, i) => {
      if (i === 0) return `${strengthPrefix} First frame (0s): ${expanded[0]?.prompt || 'Opening frame'}`;
      const prev = expanded[i - 1];
      return `${strengthPrefix} Last frame (${i * clampToSupportedDuration(videoModel, prev?.durationSeconds ?? maxClip)}s) for clip ${i}: ${prev?.prompt || 'Closing frame'}`;
    });

    steps.push({
      id: imageStepId,
      action: 'CREATE_NODE',
      nodeType: 'image-generator',
      count: imageCount,
      configTemplate: {
        model: getDefaultTextToImageModel().name,
        aspectRatio,
        prompt: 'Scene boundary frame',
        // IMPORTANT: this makes each generated scene frame use the user's reference image(s) (img2img),
        // and the executor will also connect the reference image(s) to every scene frame.
        targetIds: selected,
      },
      batchConfigs: imagePrompts.map(p => ({ prompt: p })),
    } as any);

    expanded.forEach((clip, idx) => {
      steps.push({
        id: `video-${idx + 1}-${uuidv4()}`,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count: 1,
        configTemplate: {
          model: videoModel,
          aspectRatio,
          resolution,
          duration: clampToSupportedDuration(videoModel, clip.durationSeconds),
          prompt: clip.prompt,
          connectToFrames: {
            connectionType: 'FIRST_LAST_FRAME',
            firstFrameSource: 'GENERATED',
            lastFrameSource: 'GENERATED',
            firstFrameStepId: imageStepId,
            lastFrameStepId: imageStepId,
            firstFrameIndex: idx,
            lastFrameIndex: idx + 1,
          },
        },
      } as any);
    });
  } else {
    // text_to_video:
    // For long-form videos where the model supports first/last-frame, use boundary images (N+1)
    // and connect each segment to consecutive frames:
    // video i uses image i (first) + image i+1 (last).
    const useFirstLast = expanded.length > 1 && modelSupportsFirstLastFrame(videoModel);
    if (useFirstLast) {
      const imageStepId = `frames-${uuidv4()}`;
      const imageCount = expanded.length + 1;
      const imagePrompts = Array.from({ length: imageCount }).map((_, i) => {
        if (i === 0) return `First frame (0s): ${expanded[0]?.prompt || 'Opening frame'}`;
        const prev = expanded[i - 1];
        return `Last frame (${i * clampToSupportedDuration(videoModel, prev?.durationSeconds ?? maxClip)}s) for clip ${i}: ${prev?.prompt || 'Closing frame'}`;
      });

      steps.push({
        id: imageStepId,
        action: 'CREATE_NODE',
        nodeType: 'image-generator',
        count: imageCount,
        configTemplate: {
          model: getDefaultTextToImageModel().name,
          aspectRatio,
          prompt: 'Boundary frame',
        },
        batchConfigs: imagePrompts.map(p => ({ prompt: p })),
      } as any);

      expanded.forEach((clip, idx) => {
        steps.push({
          id: `video-${idx + 1}-${uuidv4()}`,
          action: 'CREATE_NODE',
          nodeType: 'video-generator',
          count: 1,
          configTemplate: {
            model: videoModel,
            aspectRatio,
            resolution,
            duration: clampToSupportedDuration(videoModel, clip.durationSeconds),
            prompt: clip.prompt,
            connectToFrames: {
              connectionType: 'FIRST_LAST_FRAME',
              firstFrameSource: 'GENERATED',
              lastFrameSource: 'GENERATED',
              firstFrameStepId: imageStepId,
              lastFrameStepId: imageStepId,
              firstFrameIndex: idx,
              lastFrameIndex: idx + 1,
            },
          },
        } as any);
      });
    } else {
      // Fallback: plain text-to-video clips without boundary images
      steps.push({
        id: `videos-${uuidv4()}`,
        action: 'CREATE_NODE',
        nodeType: 'video-generator',
        count: expanded.length,
        configTemplate: {
          model: videoModel,
          aspectRatio,
          resolution,
          duration: clampToSupportedDuration(videoModel, expanded[0]?.durationSeconds ?? maxClip),
          prompt: expanded[0]?.prompt,
        },
        batchConfigs: expanded.map(c => ({
          prompt: c.prompt,
          duration: clampToSupportedDuration(videoModel, c.durationSeconds),
        })),
      } as any);
    }
  }

  const summaryLines = [
    `Task: ${requirements.task}`,
    `Duration: ${duration}s`,
    `Aspect Ratio: ${aspectRatio}`,
    `Resolution: ${resolution}`,
    `Model: ${videoModel}`,
    `Clips: ${expanded.length}`,
  ];
  if (task === 'text_to_video' && expanded.length > 1 && modelSupportsFirstLastFrame(videoModel)) {
    summaryLines.push(`Boundary Images: ${expanded.length + 1} (first/last frame)`);
  }

  return {
    id: `plan-${uuidv4()}`,
    summary: summaryLines.join('\n'),
    steps,
    metadata: {
      sourceGoal: {
        goalType: 'STORY_VIDEO',
        topic: requirements.topic || requirements.product,
        durationSeconds: duration,
        aspectRatio: aspectRatio as any,
        resolution,
        needs: ['video'],
        explanation: 'Generated by multi-phase chat agent',
      },
      compiledAt: Date.now(),
    },
    requiresConfirmation: true,
  };
}

