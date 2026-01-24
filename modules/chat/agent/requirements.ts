import { IntentResult, RequirementQuestion, CollectedRequirements, VideoMode } from './types';

function formatOptions(options: { label: string; text: string }[]): string {
  return options.map(o => `${o.label}) ${o.text}`).join('\n');
}

export function buildRequirementQuestions(
  intent: IntentResult,
  ctx: { selectedImageIds: string[] }
): RequirementQuestion[] {
  const questions: RequirementQuestion[] = [];

  // Topic (needed to generate a useful script/scenes for video)
  if ((intent.task === 'text_to_video' || intent.task === 'image_to_video') && !intent.topic && !intent.product) {
    questions.push({
      key: 'topic',
      question: `What is the video about? (Give a short topic/product/story in 1 line)`,
      freeform: true,
    });
  }

  // Duration (if missing for video)
  if ((intent.task === 'text_to_video' || intent.task === 'image_to_video') && !intent.durationSeconds) {
    questions.push({
      key: 'duration',
      question:
        `How long should the video be?\n` +
        `A) 8 seconds\nB) 20 seconds\nC) 40 seconds\nD) 60 seconds`,
      options: [
        { label: 'A', value: '8', text: '8 seconds' },
        { label: 'B', value: '20', text: '20 seconds' },
        { label: 'C', value: '40', text: '40 seconds' },
        { label: 'D', value: '60', text: '60 seconds' },
      ],
    });
  }

  // Platform (helps ratio)
  if ((intent.task === 'text_to_video' || intent.task === 'image_to_video') && !intent.platform) {
    questions.push({
      key: 'platform',
      question:
        `Which platform is this for?\n` +
        `A) Instagram Reel / TikTok\nB) YouTube\nC) Website / Landing page\nD) Other (type it)`,
      options: [
        { label: 'A', value: 'instagram_reel', text: 'Instagram Reel / TikTok' },
        { label: 'B', value: 'youtube', text: 'YouTube' },
        { label: 'C', value: 'website', text: 'Website / Landing page' },
        { label: 'D', value: 'other', text: 'Other (type it)' },
      ],
    });
  }

  // Aspect ratio
  if ((intent.task === 'text_to_video' || intent.task === 'image_to_video') && !intent.aspectRatio) {
    questions.push({
      key: 'aspect_ratio',
      question:
        `What frame size/aspect ratio do you want?\n` +
        `A) 9:16 (vertical)\nB) 16:9 (widescreen)\nC) 1:1 (square)`,
      options: [
        { label: 'A', value: '9:16', text: '9:16 (vertical)' },
        { label: 'B', value: '16:9', text: '16:9 (widescreen)' },
        { label: 'C', value: '1:1', text: '1:1 (square)' },
      ],
    });
  }

  // Resolution
  if ((intent.task === 'text_to_video' || intent.task === 'image_to_video') && !intent.resolution) {
    questions.push({
      key: 'resolution',
      question: `What resolution do you want?\nA) 720p\nB) 1080p`,
      options: [
        { label: 'A', value: '720p', text: '720p' },
        { label: 'B', value: '1080p', text: '1080p' },
      ],
    });
  }

  // Reference images for image_to_video
  if (intent.task === 'image_to_video') {
    if (!ctx.selectedImageIds || ctx.selectedImageIds.length === 0) {
      questions.push({
        key: 'reference_images',
        question:
          `Please select/upload your product image on the canvas, then reply:\n` +
          `A) Done (I selected 1 image)\nB) Done (I selected 2 images: start + end)\n\n` +
          `Tip: selecting 2 images enables First/Last frame mode.`,
        options: [
          { label: 'A', value: '1', text: 'Done (selected 1 image)' },
          { label: 'B', value: '2', text: 'Done (selected 2 images)' },
        ],
      });
    } else if (ctx.selectedImageIds.length >= 2) {
      // Ask mode (single vs first_last)
      questions.push({
        key: 'transition_mode',
        question:
          `You selected ${ctx.selectedImageIds.length} images. Which consistency method?\n` +
          `A) First-Last Frame (recommended)\nB) Single Image (use only the first image)`,
        options: [
          { label: 'A', value: 'first_last', text: 'First-Last Frame (recommended)' },
          { label: 'B', value: 'single', text: 'Single Image' },
        ],
      });
    }
  }

  // Script confirmation for ads/long videos
  if ((intent.task === 'text_to_video' || intent.task === 'image_to_video') && intent.needsScript) {
    questions.push({
      key: 'needs_script_confirmation',
      question: `Do you want me to generate a script + scenes?\nA) Yes, generate\nB) No, I’ll provide my own`,
      options: [
        { label: 'A', value: 'yes', text: 'Yes, generate' },
        { label: 'B', value: 'no', text: 'No, I’ll provide my own' },
      ],
    });
  }

  return questions;
}

export function applyRequirementAnswer(
  requirements: CollectedRequirements,
  question: RequirementQuestion,
  userMessage: string,
  ctx: { selectedImageIds: string[] }
): CollectedRequirements {
  const normalized = userMessage.trim().toLowerCase();
  const option =
    question.options?.find(o => normalized === o.label.toLowerCase()) ||
    question.options?.find(o => normalized.includes(`option ${o.label.toLowerCase()}`)) ||
    question.options?.find(o => normalized === o.value.toLowerCase());

  const value = option?.value ?? userMessage.trim();

  switch (question.key) {
    case 'topic':
      return { ...requirements, topic: userMessage.trim() };
    case 'duration':
      return { ...requirements, durationSeconds: Number(value) };
    case 'platform':
      return { ...requirements, platform: value };
    case 'aspect_ratio':
      return { ...requirements, aspectRatio: value };
    case 'resolution':
      return { ...requirements, resolution: value };
    case 'reference_images': {
      // user says done; take current selection
      return { ...requirements, referenceImageIds: ctx.selectedImageIds.slice(0, Number(value) || 1) };
    }
    case 'transition_mode': {
      const mode: VideoMode = value === 'first_last' ? 'first_last' : 'single';
      return { ...requirements, mode };
    }
    case 'needs_script_confirmation': {
      const needsScript = value === 'yes';
      return { ...requirements, needsScript };
    }
    default:
      return requirements;
  }
}

