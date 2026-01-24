import { CanvasInstructionPlan } from '../compiler/types';

export type AgentPhase =
  | 'IDLE'
  | 'COLLECTING_REQUIREMENTS'
  | 'SCRIPT_REVIEW'
  | 'GRAPH_PREVIEW';

export type AgentTask =
  | 'text_to_image'
  | 'image_to_image'
  | 'text_to_video'
  | 'image_to_video'
  | 'plugin_action'
  | 'delete_content'
  | 'explain'
  | 'unknown';

export type VideoMode = 'single' | 'first_last';

export interface IntentResult {
  task: AgentTask;
  goal?: string; // e.g. advertisement, tutorial, etc.
  product?: string;
  topic?: string;
  durationSeconds?: number;
  count?: number; // e.g. "generate 2 images"
  platform?: string | null;
  style?: string | null;
  needsReferenceImage?: boolean;
  needsScript?: boolean;
  // If user already provided something like "16:9", "1080p", "Veo 3.1 Fast"
  aspectRatio?: string | null;
  resolution?: string | null;
  model?: string | null;
  explanation?: string; // user-facing
}

export interface ScenePlan {
  scene: number;
  prompt: string;
  durationSeconds: number;
}

export interface ScriptPlan {
  script: string;
  scenes: ScenePlan[];
  style?: string | null;
}

export type RequirementKey =
  | 'reference_images'
  | 'topic'
  | 'platform'
  | 'aspect_ratio'
  | 'resolution'
  | 'duration'
  | 'needs_script_confirmation'
  | 'transition_mode';

export interface RequirementQuestionOption {
  label: string; // "A", "B", ...
  value: string;
  text: string;
}

export interface RequirementQuestion {
  key: RequirementKey;
  question: string;
  options?: RequirementQuestionOption[];
  freeform?: boolean;
}

export interface CollectedRequirements {
  task: AgentTask;
  goal?: string;
  topic?: string;
  product?: string;
  durationSeconds?: number;
  platform?: string | null;
  style?: string | null;
  aspectRatio?: string | null;
  resolution?: string | null;
  model?: string | null;
  mode?: VideoMode; // for image_to_video
  referenceImageIds?: string[]; // selected ids on canvas
  needsScript?: boolean;
}

export interface AgentSessionState {
  phase: AgentPhase;
  intent?: IntentResult;
  requirements: CollectedRequirements;
  pendingQuestions: RequirementQuestion[];
  currentQuestionIndex: number;
  scriptPlan?: ScriptPlan;
  lastUserMessage?: string;
  graphPlan?: CanvasInstructionPlan;
}

