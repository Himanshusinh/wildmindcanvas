import { CanvasInstructionPlan } from '../compiler/types';

export function validateCanvasPlan(plan: CanvasInstructionPlan): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
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

  return { ok: errors.length === 0, errors };
}

