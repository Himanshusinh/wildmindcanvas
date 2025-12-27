/**
 * Storyboard Prompt Generator
 * Generates AI prompts with visual continuity for sequential scene generation
 */

export interface ReferenceDetails {
    character?: string;
    background?: string;
    objects?: string;
    clothing?: string;
    artStyle?: string;
    camera?: string;
    lighting?: string;
    tone?: string;
    environment?: string;
    style?: string;
    mood?: string;
}

export interface SceneInput {
    text: string;
    sceneNumber: number;
}

export interface GeneratedPrompt {
    sceneNumber: number;
    prompt: string;
    visualSummary: string;
}

/**
 * Generate a visual summary from scene text for continuity
 */
function generateVisualSummary(sceneText: string, referenceDetails: ReferenceDetails): string {
    // Extract key visual elements that should carry forward
    const summary = `Visual elements: ${sceneText.substring(0, 200)}. 
Character appearance maintained as: ${referenceDetails.character || 'described in reference'}. 
Background style: ${referenceDetails.background || 'as established'}. 
Lighting: ${referenceDetails.lighting || 'consistent with previous frame'}.`;

    return summary;
}

/**
 * Generate prompt for Scene 1 (uses ONLY master reference)
 */
function generateScene1Prompt(
    sceneText: string,
    referenceDetails: ReferenceDetails
): string {
    return `You are generating the first storyboard frame.

USE THIS PERMANENT REFERENCE STYLE:
- Character: ${referenceDetails.character || 'Not specified'}
- Clothing & Appearance Rules: ${referenceDetails.clothing || 'As shown in reference image'}
- Background style: ${referenceDetails.background || 'Not specified'}
- Objects: ${referenceDetails.objects || 'None specified'}
- Camera framing: ${referenceDetails.camera || 'Standard framing'}
- Lighting style: ${referenceDetails.lighting || 'Natural lighting'}
- Art direction: ${referenceDetails.artStyle || referenceDetails.style || 'Cinematic'}
- Tone & Mood: ${referenceDetails.tone || referenceDetails.mood || 'Dramatic'}
${referenceDetails.environment ? `- Environment: ${referenceDetails.environment}` : ''}

Now generate this scene:

**Scene Description:**
${sceneText}

The generated result MUST match the reference EXACTLY, including:
body proportions, hairstyle, color palette, outfit structure, facial identity, background style, lighting, and art style.`;
}

/**
 * Generate prompt for Scene 2+ (uses master reference + previous scene)
 */
function generateContinuationPrompt(
    sceneText: string,
    referenceDetails: ReferenceDetails,
    previousSceneVisualSummary: string
): string {
    return `You are continuing a storyboard. Maintain PERFECT visual continuity.

PERMANENT STYLE RULES (NEVER CHANGE):
- Character: ${referenceDetails.character || 'Not specified'}
- Clothing & Appearance Consistency: ${referenceDetails.clothing || 'As shown in reference image'}
- Background style: ${referenceDetails.background || 'Not specified'}
- Objects: ${referenceDetails.objects || 'None specified'}
- Camera framing: ${referenceDetails.camera || 'Standard framing'}
- Lighting style: ${referenceDetails.lighting || 'Natural lighting'}
- Art direction: ${referenceDetails.artStyle || referenceDetails.style || 'Cinematic'}
- Tone & Mood: ${referenceDetails.tone || referenceDetails.mood || 'Dramatic'}
${referenceDetails.environment ? `- Environment: ${referenceDetails.environment}` : ''}

PREVIOUS FRAME SUMMARY (use as visual continuity anchor):
${previousSceneVisualSummary}

NOW GENERATE:
**Next Scene:**
${sceneText}

MANDATORY RULES:
- Character face shape, identity, hair, clothing MUST match EXACTLY.
- Colors, textures, and background style must remain consistent.
- Add ONLY new narrative elements where required.

The result must feel like one continuous cinematic story.`;
}

/**
 * Main function: Generate prompts for all scenes with continuity
 */
export function generateStoryboardPrompts(
    referenceDetails: ReferenceDetails,
    scenes: SceneInput[],
    previousSceneVisualSummary: string | null = null
): GeneratedPrompt[] {
    const results: GeneratedPrompt[] = [];
    let lastVisualSummary = previousSceneVisualSummary;

    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const isFirstScene = i === 0;

        let prompt: string;

        if (isFirstScene) {
            // Scene 1: Use ONLY master reference
            prompt = generateScene1Prompt(scene.text, referenceDetails);
        } else {
            // Scene 2+: Use master reference + previous scene summary
            prompt = generateContinuationPrompt(
                scene.text,
                referenceDetails,
                lastVisualSummary || 'First scene visual elements'
            );
        }

        // Generate visual summary for this scene (to be used by next scene)
        const visualSummary = generateVisualSummary(scene.text, referenceDetails);

        results.push({
            sceneNumber: scene.sceneNumber,
            prompt,
            visualSummary,
        });

        // Update for next iteration
        lastVisualSummary = visualSummary;
    }

    return results;
}

/**
 * Generate a single scene prompt (for individual scene generation)
 */
export function generateSingleScenePrompt(
    sceneText: string,
    sceneNumber: number,
    referenceDetails: ReferenceDetails,
    previousSceneVisualSummary?: string
): GeneratedPrompt {
    const isFirstScene = sceneNumber === 1;

    const prompt = isFirstScene
        ? generateScene1Prompt(sceneText, referenceDetails)
        : generateContinuationPrompt(sceneText, referenceDetails, previousSceneVisualSummary || '');

    const visualSummary = generateVisualSummary(sceneText, referenceDetails);

    return {
        sceneNumber,
        prompt,
        visualSummary,
    };
}
