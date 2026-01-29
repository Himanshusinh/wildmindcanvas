import { v4 as uuidv4 } from 'uuid';
import { CanvasInstructionPlan, CanvasInstructionStep } from '../compiler/types';
import { CollectedRequirements, ScenePlan, VideoMode, ScriptPlan } from './types';
import textToVideoModels from '../data/textToVideoModels.json';
import { getDefaultTextToVideoModel, getDefaultTextToImageModel, getDefaultImageToImageModel } from './modelCatalog';
import { sanitizeVideoPrompt } from './promptSanitizer';

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
  script?: ScriptPlan;
}): CanvasInstructionPlan {
  const { requirements, script } = input;
  const steps: CanvasInstructionStep[] = [];
  // Track prompts for structured summary
  const imagePromptsList: Array<{ index: number; prompt: string; timeMark?: string }> = [];
  const videoPromptsList: Array<{ index: number; prompt: string; duration: number }> = [];

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
  
  // Extract overall style from script for consistency
  const overallStyle = (script && 'style' in script && script.style) 
    ? script.style 
    : 'cinematic, professional, high-quality';

  // Music consistency:
  // For multi-clip videos, we want a single consistent soundtrack across all segments.
  // We (1) embed a shared soundtrack directive into every video prompt and (2) create one
  // `music-generator` node so the user can generate/reuse the same music explicitly.
  const wantsConsistentMusic = expanded.length > 1;
  const sharedMusicPrompt = (() => {
    const topic = requirements.topic || requirements.product || requirements.goal || 'the video';
    const platform = requirements.platform ? `for ${requirements.platform}` : '';
    // Prefer instrumental for consistency across stitched clips.
    return `Consistent instrumental background music ${platform} matching the visual style (${overallStyle}) and theme (${topic}). Keep tempo, key, and instrumentation consistent; no vocals.`;
  })();
  const musicStepId = wantsConsistentMusic ? `music-${uuidv4()}` : null;

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

  // Optional shared music node for multi-clip plans (helps avoid per-clip music mismatch)
  if (wantsConsistentMusic && musicStepId) {
    steps.push({
      id: musicStepId,
      action: 'CREATE_NODE',
      nodeType: 'music-generator',
      count: 1,
      configTemplate: {
        model: 'udio-v2',
        prompt: sharedMusicPrompt,
      },
    } as any);
  }

  const task = requirements.task;
  if (task === 'image_to_video') {
    const selected = requirements.referenceImageIds || [];
    const mode = requirements.mode || 'single';
    const strength = requirements.referenceStrength || 'medium';
    const strengthPrefix =
      strength === 'high'
        ? 'Match the reference image strongly (same product identity, materials, branding).'
        : strength === 'low'
          ? 'Use the reference image loosely (keep general identity but allow variation).'
          : 'Use the reference image as guidance (keep product identity consistent).';

    // FIRST_FRAME mode: Generate scene images (one per clip) using selected image as reference, then connect each to video
    if (mode === 'first_frame' && selected.length > 0) {
      // For long-form videos (multiple clips), generate scene images first
      // Each scene image uses the selected image as reference (img2img)
      // Then connect each scene image to its corresponding video segment
      if (expanded.length > 1) {
        // Generate N scene images (one per clip) using the selected image as reference
        const imageStepId = `scene-frames-${uuidv4()}`;
        const imagePrompts = expanded.map((clip, idx) => {
          const timeMark = idx * clampToSupportedDuration(videoModel, clip.durationSeconds);
          const prevClip = idx > 0 ? expanded[idx - 1] : null;
          const consistencyNote = idx > 0 
            ? `Maintain visual consistency with previous scenes: same product/character identity, color palette, lighting style, and overall aesthetic. `
            : '';
          const prompt = `${strengthPrefix} ${consistencyNote}Scene ${idx + 1} (${timeMark}s): ${clip.prompt}. Detailed, high-quality scene frame. Maintain consistent visual style: ${overallStyle}. Preserve reference image's core identity while adapting to this specific scene moment. Include specific details: camera angle, lighting, composition, colors, textures, and mood.`;
          imagePromptsList.push({ index: idx + 1, prompt, timeMark: `${timeMark}s` });
          return prompt;
        });

        steps.push({
          id: imageStepId,
          action: 'CREATE_NODE',
          nodeType: 'image-generator',
          count: expanded.length,
          configTemplate: {
            model: getDefaultImageToImageModel().name, // Use img2img model
            aspectRatio,
            resolution,
            prompt: 'Scene frame based on reference image',
            sourceImageUrl: selected[0], // Use first selected image as reference
            targetIds: selected, // Connect to reference images
          },
          batchConfigs: imagePrompts.map(p => ({ prompt: p })),
        } as any);

        // Connect each scene image to its corresponding video segment
        expanded.forEach((clip, idx) => {
          const prevClip = idx > 0 ? expanded[idx - 1] : null;
          const consistencyNote = idx > 0 
            ? `Maintain visual consistency with previous video segments: same product/character identity, color palette, lighting style, camera style, and overall aesthetic. `
            : '';
          const videoPrompt = `${consistencyNote}${clip.prompt}. Visual style: ${overallStyle}. Ensure smooth, natural motion that maintains consistency with the first frame image. Keep the same visual language, color grading, and aesthetic throughout.${wantsConsistentMusic ? ` Soundtrack (shared across all clips): ${sharedMusicPrompt}` : ''}`;
          const sanitizedPrompt = sanitizeVideoPrompt(videoPrompt);
          const videoDuration = clampToSupportedDuration(videoModel, clip.durationSeconds);
          videoPromptsList.push({ index: idx + 1, prompt: sanitizedPrompt, duration: videoDuration });
          steps.push({
            id: `video-${idx + 1}-${uuidv4()}`,
            action: 'CREATE_NODE',
            nodeType: 'video-generator',
            count: 1,
            configTemplate: {
              model: videoModel,
              aspectRatio,
              resolution,
              duration: videoDuration,
              prompt: sanitizedPrompt,
              connectToFrames: {
                connectionType: 'FIRST_FRAME_ONLY',
                firstFrameSource: 'GENERATED',
                firstFrameStepId: imageStepId,
                firstFrameIndex: idx,
              },
            },
          } as any);
        });
      } else {
        // Single clip: directly connect selected image to video
        selected.forEach((imageId, idx) => {
          const clip = expanded[idx] || expanded[0] || { prompt: 'Video from image', durationSeconds: maxClip };
          const sanitizedClipPrompt = sanitizeVideoPrompt(clip.prompt);
          const videoDuration = clampToSupportedDuration(videoModel, clip.durationSeconds);
          videoPromptsList.push({ index: idx + 1, prompt: sanitizedClipPrompt, duration: videoDuration });
          steps.push({
            id: `video-${idx + 1}-${uuidv4()}`,
            action: 'CREATE_NODE',
            nodeType: 'video-generator',
            count: 1,
            configTemplate: {
              model: videoModel,
              aspectRatio,
              resolution,
              duration: videoDuration,
              prompt: sanitizedClipPrompt,
              connectToFrames: {
                connectionType: 'FIRST_FRAME_ONLY',
                firstFrameSource: 'USER_UPLOAD',
                firstFrameId: imageId,
              },
            },
          } as any);
        });
      }
    } else if (mode === 'first_last' && selected.length >= 1) {
      // FIRST_LAST mode: Use boundary scene frames (N+1) generated WITH the selected reference image(s),
      // then connect each video segment to consecutive frames:
      // video i uses frame i (first) + frame i+1 (last).
      //
      // This yields the desired 3-column flow:
      // Reference Image(s) → Scene Frame Images → Video Segments.
      const imageStepId = `frames-${uuidv4()}`;
      const imageCount = expanded.length + 1;
      const imagePrompts = Array.from({ length: imageCount }).map((_, i) => {
        if (i === 0) {
          const firstPrompt = expanded[0]?.prompt || 'Opening frame';
          const prompt = `${strengthPrefix} First frame (0s): ${firstPrompt}. Detailed, high-quality scene frame. Visual style: ${overallStyle}. Include specific details: camera angle, lighting, composition, colors, textures, and mood. This is the opening frame - establish the visual identity and aesthetic.`;
          imagePromptsList.push({ index: i + 1, prompt, timeMark: '0s' });
          return prompt;
        }
        const prev = expanded[i - 1];
        const timeMark = i * clampToSupportedDuration(videoModel, prev?.durationSeconds ?? maxClip);
        const prevPrompt = prev?.prompt || 'Closing frame';
        const consistencyNote = `Maintain visual consistency with previous frames: same product/character identity, color palette, lighting style, and overall aesthetic. `;
        const prompt = `${strengthPrefix} ${consistencyNote}Last frame (${timeMark}s) for clip ${i}: ${prevPrompt}. Detailed, high-quality scene frame. Visual style: ${overallStyle}. Include specific details: camera angle, lighting, composition, colors, textures, and mood. This frame should naturally transition from the previous scene while maintaining visual coherence.`;
        imagePromptsList.push({ index: i + 1, prompt, timeMark: `${timeMark}s` });
        return prompt;
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
        const prevClip = idx > 0 ? expanded[idx - 1] : null;
        const consistencyNote = idx > 0 
          ? `Maintain visual consistency with previous video segments: same product/character identity, color palette, lighting style, camera style, and overall aesthetic. `
          : '';
        const videoPrompt = `${consistencyNote}${clip.prompt}. Visual style: ${overallStyle}. Ensure smooth, natural motion that maintains consistency between the first and last frame images. Keep the same visual language, color grading, and aesthetic throughout. The motion should feel natural and connected to both boundary frames.${wantsConsistentMusic ? ` Soundtrack (shared across all clips): ${sharedMusicPrompt}` : ''}`;
        const sanitizedPrompt = sanitizeVideoPrompt(videoPrompt);
        const videoDuration = clampToSupportedDuration(videoModel, clip.durationSeconds);
        videoPromptsList.push({ index: idx + 1, prompt: sanitizedPrompt, duration: videoDuration });
        steps.push({
          id: `video-${idx + 1}-${uuidv4()}`,
          action: 'CREATE_NODE',
          nodeType: 'video-generator',
          count: 1,
          configTemplate: {
            model: videoModel,
            aspectRatio,
            resolution,
            duration: videoDuration,
            prompt: sanitizedPrompt,
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
      // SINGLE mode: Use only the first selected image (or generate if none selected)
      const firstImage = selected[0];
      expanded.forEach((clip, idx) => {
        const prevClip = idx > 0 ? expanded[idx - 1] : null;
        const consistencyNote = idx > 0 
          ? `Maintain visual consistency with previous video segments: same product/character identity, color palette, lighting style, camera style, and overall aesthetic. `
          : '';
        const videoPrompt = `${consistencyNote}${clip.prompt}. Visual style: ${overallStyle}. Ensure smooth, natural motion that maintains consistency with the reference image. Keep the same visual language, color grading, and aesthetic throughout.${wantsConsistentMusic ? ` Soundtrack (shared across all clips): ${sharedMusicPrompt}` : ''}`;
        const sanitizedPrompt = sanitizeVideoPrompt(videoPrompt);
        const videoDuration = clampToSupportedDuration(videoModel, clip.durationSeconds);
        videoPromptsList.push({ index: idx + 1, prompt: sanitizedPrompt, duration: videoDuration });
        steps.push({
          id: `video-${idx + 1}-${uuidv4()}`,
          action: 'CREATE_NODE',
          nodeType: 'video-generator',
          count: 1,
          configTemplate: {
            model: videoModel,
            aspectRatio,
            resolution,
            duration: videoDuration,
            prompt: sanitizedPrompt,
            ...(firstImage ? {
              connectToFrames: {
                connectionType: 'FIRST_FRAME_ONLY',
                firstFrameSource: 'USER_UPLOAD',
                firstFrameId: firstImage,
              },
            } : {}),
          },
        } as any);
      });
    }
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
        if (i === 0) {
          const firstPrompt = expanded[0]?.prompt || 'Opening frame';
          const prompt = `First frame (0s): ${firstPrompt}. Detailed, high-quality scene frame. Visual style: ${overallStyle}. Include specific details: camera angle, lighting, composition, colors, textures, and mood. This is the opening frame - establish the visual identity and aesthetic.`;
          imagePromptsList.push({ index: i + 1, prompt, timeMark: '0s' });
          return prompt;
        }
        const prev = expanded[i - 1];
        const timeMark = i * clampToSupportedDuration(videoModel, prev?.durationSeconds ?? maxClip);
        const prevPrompt = prev?.prompt || 'Closing frame';
        const consistencyNote = `Maintain visual consistency with previous frames: same product/character identity, color palette, lighting style, and overall aesthetic. `;
        const prompt = `${consistencyNote}Last frame (${timeMark}s) for clip ${i}: ${prevPrompt}. Detailed, high-quality scene frame. Visual style: ${overallStyle}. Include specific details: camera angle, lighting, composition, colors, textures, and mood. This frame should naturally transition from the previous scene while maintaining visual coherence.`;
        imagePromptsList.push({ index: i + 1, prompt, timeMark: `${timeMark}s` });
        return prompt;
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
        const videoDuration = clampToSupportedDuration(videoModel, clip.durationSeconds);
        const prompt = `${clip.prompt}${wantsConsistentMusic ? ` Soundtrack (shared across all clips): ${sharedMusicPrompt}` : ''}`;
        const sanitizedPrompt = sanitizeVideoPrompt(prompt);
        videoPromptsList.push({ index: idx + 1, prompt: sanitizedPrompt, duration: videoDuration });
        steps.push({
          id: `video-${idx + 1}-${uuidv4()}`,
          action: 'CREATE_NODE',
          nodeType: 'video-generator',
          count: 1,
          configTemplate: {
            model: videoModel,
            aspectRatio,
            resolution,
            duration: videoDuration,
            prompt: sanitizedPrompt,
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
        batchConfigs: expanded.map((c, idx) => {
          const videoDuration = clampToSupportedDuration(videoModel, c.durationSeconds);
          const sanitizedPrompt = sanitizeVideoPrompt(c.prompt);
          videoPromptsList.push({ index: idx + 1, prompt: sanitizedPrompt, duration: videoDuration });
          return {
            prompt: sanitizedPrompt,
            duration: videoDuration,
          };
        }),
      } as any);
    }
  }

  // Build structured summary with script, image prompts, and video prompts
  const summaryParts: string[] = [];
  
  // Basic info
  summaryParts.push(`Task: ${requirements.task}`);
  summaryParts.push(`Duration: ${duration}s`);
  summaryParts.push(`Aspect Ratio: ${aspectRatio}`);
  summaryParts.push(`Resolution: ${resolution}`);
  summaryParts.push(`Model: ${videoModel}`);
  summaryParts.push(`Clips: ${expanded.length}`);
  
  // Add mode information
  if (task === 'image_to_video') {
    const mode = requirements.mode || 'single';
    if (mode === 'first_frame') {
      if (expanded.length > 1) {
        summaryParts.push(`Mode: First Frame (${expanded.length} scene images + ${expanded.length} video segments)`);
      } else {
        const selectedCount = (requirements.referenceImageIds || []).length;
        summaryParts.push(`Mode: First Frame (${selectedCount} videos, one per image)`);
      }
    } else if (mode === 'first_last') {
      summaryParts.push(`Mode: First-Last Frame (boundary images)`);
      summaryParts.push(`Boundary Images: ${expanded.length + 1}`);
    } else {
      summaryParts.push(`Mode: Single Image`);
    }
  } else if (task === 'text_to_video' && expanded.length > 1 && modelSupportsFirstLastFrame(videoModel)) {
    summaryParts.push(`Boundary Images: ${expanded.length + 1} (first/last frame)`);
  }

  // Add script if available
  if (script?.script) {
    summaryParts.push('');
    summaryParts.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    summaryParts.push('📝 SCRIPT:');
    summaryParts.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    summaryParts.push(script.script);
  }

  // Add shared music (multi-clip) to make audio consistent across stitched segments
  if (wantsConsistentMusic) {
    summaryParts.push('');
    summaryParts.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    summaryParts.push('🎵 MUSIC (SHARED ACROSS ALL CLIPS):');
    summaryParts.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    summaryParts.push(sharedMusicPrompt);
  }

  // Add image prompts if available
  if (imagePromptsList.length > 0) {
    summaryParts.push('');
    summaryParts.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    summaryParts.push('🖼️ IMAGE PROMPTS:');
    summaryParts.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    imagePromptsList.forEach((img, idx) => {
      const timeInfo = img.timeMark ? ` (${img.timeMark})` : '';
      summaryParts.push(`Image ${img.index}${timeInfo}:`);
      summaryParts.push(img.prompt);
      if (idx < imagePromptsList.length - 1) summaryParts.push('');
    });
  }

  // Add video prompts if available
  if (videoPromptsList.length > 0) {
    summaryParts.push('');
    summaryParts.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    summaryParts.push('🎬 VIDEO PROMPTS:');
    summaryParts.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    videoPromptsList.forEach((vid, idx) => {
      summaryParts.push(`Video ${vid.index} (${vid.duration}s):`);
      summaryParts.push(vid.prompt);
      if (idx < videoPromptsList.length - 1) summaryParts.push('');
    });
  }

  return {
    id: `plan-${uuidv4()}`,
    summary: summaryParts.join('\n'),
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

