import { StoryWorld } from '@/types/storyWorld';
import { SceneFrameModalState } from '@/app/components/ModalOverlays/types';

export interface ImagePromptResult {
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: string;
    seedKey?: string; // Used to derive a deterministic seed if model supports it
    referenceImageUrls?: string[]; // Reference images for characters/locations in this scene
}

/**
 * Build a rich, context-aware image prompt for a scene using Story World data
 * 
 * This function creates prompts that maintain visual consistency across all scenes by:
 * - Including detailed character descriptions with consistency tokens
 * - Including detailed location descriptions with consistency tokens
 * - Enforcing global visual style
 * - Adding hard constraints to prevent inconsistencies
 * - Including reference image instructions when reference images are provided
 * 
 * @param params - Story world and scene frame data, plus optional reference images
 * @returns Image prompt with consistency constraints and reference image info
 */
export function buildImagePromptForScene(params: {
    storyWorld: StoryWorld;
    scene: SceneFrameModalState;
    referenceImageUrls?: string[]; // Optional reference images for characters/locations
    propsNamesMap?: Record<number, string>; // Map of props index to name
    connectedPropsImages?: string[]; // Connected props image URLs
    namedImages?: {
        characters?: Record<string, string>;
        backgrounds?: Record<string, string>;
        props?: Record<string, string>;
    }; // Direct name -> image URL mappings
}): ImagePromptResult {
    const { storyWorld, scene, referenceImageUrls = [], propsNamesMap = {}, connectedPropsImages = [], namedImages } = params;

    // Get characters present in this scene
    const characters = storyWorld.characters.filter(c =>
        scene.characterIds?.includes(c.id)
    );

    // Get location for this scene
    const location = storyWorld.locations.find(
        l => l.id === scene.locationId
    );

    // Extract props mentioned in the scene content
    // Look for props names in the scene content (case-insensitive)
    const propsInScene: Array<{ name: string; imageUrl?: string }> = [];
    
    if (propsNamesMap && Object.keys(propsNamesMap).length > 0) {
        // Build props map from namedImages if available, otherwise from propsNamesMap + connectedPropsImages
        const propsMap: Record<string, string> = {};
        
        if (namedImages?.props) {
            // Use pre-built namedImages from snapshot
            Object.assign(propsMap, namedImages.props);
        } else {
            // Build from propsNamesMap + connectedPropsImages
            Object.entries(propsNamesMap).forEach(([indexStr, name]) => {
                if (name && name.trim()) {
                    const index = parseInt(indexStr, 10);
                    if (index >= 0 && index < connectedPropsImages.length && connectedPropsImages[index]) {
                        propsMap[name.toLowerCase()] = connectedPropsImages[index];
                    }
                }
            });
        }

        // Check scene content for props mentions
        const sceneContentLower = scene.content.toLowerCase();
        Object.entries(propsMap).forEach(([propName, imageUrl]) => {
            // Check if prop name appears in scene content (as whole word)
            const propNameRegex = new RegExp(`\\b${propName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
            if (propNameRegex.test(scene.content)) {
                propsInScene.push({
                    name: propName,
                    imageUrl: imageUrl,
                });
            }
        });
    }

    // Build character section with reference image instructions
    const characterLines =
        characters.length > 0
            ? characters
                .map((c, index) => {
                    const hasReferenceImage = referenceImageUrls.length > index;
                    const imageRef = hasReferenceImage 
                        ? `Reference image: see attached image #${index + 1} (use this exact character design)`
                        : '';
                    return [
                        `Name: ${c.name}`,
                        `Role: ${c.role}`,
                        `Visual: ${c.visual_description}`,
                        `Emotion baseline: ${c.emotion_baseline}`,
                        `Consistency token: [${c.consistency_token}]`,
                        imageRef,
                    ].filter(Boolean).join(' | ');
                })
                .join('\n')
            : 'No visible characters in this scene.';

    // Build location section with reference image instructions
    const locationImageIndex = characters.length; // Location image comes after character images
    const hasLocationReference = referenceImageUrls.length > locationImageIndex;
    const locationBlock = location
        ? [
            `Name: ${location.name}`,
            `Visual: ${location.visual_description}`,
            `Color palette: ${location.color_palette}`,
            `Consistency token: [${location.consistency_token}]`,
            hasLocationReference ? `Reference image: see attached image #${locationImageIndex + 1} (use this exact location design)` : '',
        ].filter(Boolean).join(' | ')
        : 'No specific location. Use neutral background consistent with the story tone.';

    // Build props section for this scene
    const propsImageIndex = locationImageIndex + (location ? 1 : 0); // Props images come after location
    const propsBlock = propsInScene.length > 0
        ? propsInScene.map((prop, index) => {
            const propImageIndex = propsImageIndex + index;
            const hasPropReference = referenceImageUrls.length > propImageIndex;
            return [
                `Name: ${prop.name}`,
                hasPropReference ? `Reference image: see attached image #${propImageIndex + 1} (use this exact prop design)` : '',
            ].filter(Boolean).join(' | ');
        }).join('\n')
        : 'No specific props mentioned in this scene.';

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

PROPS IN THIS SCENE (KEEP DESIGN IDENTICAL ACROSS ALL SCENES):
${propsBlock}

SCENE DESCRIPTION (WHAT IS HAPPENING RIGHT NOW):
${scene.content}

${moodLine}

HARD CONSTRAINTS:
- Characters must look like the SAME actors across all scenes:
  same face, body type, hairstyle, clothing style, and main colors.
${referenceImageUrls.length > 0 ? `- CRITICAL: Use the attached reference images to match the exact character designs, location, and props.
  ${characters.map((char, idx) => `The character "${char.name}" must look identical to reference image #${idx + 1}.`).join('\n  ')}
  ${hasLocationReference ? `The location "${location?.name || ''}" must match reference image #${locationImageIndex + 1}.` : ''}
  ${propsInScene.map((prop, idx) => `The prop "${prop.name}" must match reference image #${propsImageIndex + idx + 1}.`).join('\n  ')}` : ''}
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
        referenceImageUrls, // Include reference images in result
    };
}
