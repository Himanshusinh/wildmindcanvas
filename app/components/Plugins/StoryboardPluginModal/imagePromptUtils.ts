import { StoryWorld } from '@/types/storyWorld';
import { SceneFrameModalState } from '@/app/components/ModalOverlays/types';

export interface ImagePromptResult {
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: string;
    seedKey?: string; // Used to derive a deterministic seed if model supports it
}

/**
 * Build a rich, context-aware image prompt for a scene using Story World data
 * 
 * This function creates prompts that maintain visual consistency across all scenes by:
 * - Including detailed character descriptions with consistency tokens
 * - Including detailed location descriptions with consistency tokens
 * - Enforcing global visual style
 * - Adding hard constraints to prevent inconsistencies
 * 
 * @param params - Story world and scene frame data
 * @returns Image prompt with consistency constraints
 */
export function buildImagePromptForScene(params: {
    storyWorld: StoryWorld;
    scene: SceneFrameModalState;
}): ImagePromptResult {
    const { storyWorld, scene } = params;

    // Get characters present in this scene
    const characters = storyWorld.characters.filter(c =>
        scene.characterIds?.includes(c.id)
    );

    // Get location for this scene
    const location = storyWorld.locations.find(
        l => l.id === scene.locationId
    );

    // Build character section
    const characterLines =
        characters.length > 0
            ? characters
                .map(c =>
                    [
                        `Name: ${c.name}`,
                        `Role: ${c.role}`,
                        `Visual: ${c.visual_description}`,
                        `Emotion baseline: ${c.emotion_baseline}`,
                        `Consistency token: [${c.consistency_token}]`,
                    ].join(' | ')
                )
                .join('\n')
            : 'No visible characters in this scene.';

    // Build location section
    const locationBlock = location
        ? [
            `Name: ${location.name}`,
            `Visual: ${location.visual_description}`,
            `Color palette: ${location.color_palette}`,
            `Consistency token: [${location.consistency_token}]`,
        ].join(' | ')
        : 'No specific location. Use neutral background consistent with the story tone.';

    const style = storyWorld.global_style;

    const moodLine = scene.mood
        ? `Scene mood: ${scene.mood}.`
        : 'Scene mood: match the overall story mood.';

    // Build the comprehensive prompt
    const prompt = `
Cinematic storyboard frame from a continuous film.

GLOBAL VISUAL STYLE (MUST stay consistent across all scenes):
- Art style: ${style.art_style}
- Global color palette: ${style.color_palette}
- Camera style: ${style.camera_style}
- Aspect ratio: ${style.aspect_ratio}

CHARACTERS IN THIS SCENE (KEEP DESIGN IDENTICAL ACROSS ALL SCENES):
${characterLines}

LOCATION IN THIS SCENE (KEEP DESIGN IDENTICAL ACROSS ALL SCENES):
${locationBlock}

SCENE DESCRIPTION (WHAT IS HAPPENING RIGHT NOW):
${scene.content}

${moodLine}

HARD CONSTRAINTS:
- Characters must look like the SAME actors across all scenes:
  same face, body type, hairstyle, clothing style, and main colors.
- The location must keep the same architecture, layout, furniture, and lighting mood
  whenever it reappears.
- Do NOT introduce new characters, props, or wild outfit changes unless described in the scene.
- Keep a cinematic, film-still composition with clear foreground, midground, and background.
- Avoid stylization shifts: keep the same art style as previous scenes.

OUTPUT:
- Single, detailed, cinematic frame.
- No text or captions in the image.
  `.trim();

    // Build negative prompt to penalize inconsistencies
    const negativePrompt = `
inconsistent character design, new random characters, different actor face,
different costume, different time period, different architecture, cartoonish,
overly stylized, anime style, chibi, pixel art, text, watermark, logo,
multiple scenes, comic panels, split screen
  `.trim();

    // Generate a seed key for deterministic generation (if model supports it)
    const seedKey = `story-${characters.map(c => c.consistency_token).join('-')}-${location?.consistency_token || 'no-location'
        }-scene-${scene.sceneNumber}`;

    return {
        prompt,
        negativePrompt,
        aspectRatio: style.aspect_ratio,
        seedKey,
    };
}
