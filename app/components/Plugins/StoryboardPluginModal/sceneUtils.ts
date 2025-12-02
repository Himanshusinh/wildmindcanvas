
export const STORYBOARD_UTILS_BUILD_TAG = 'sceneUtils@2025-11-29T15:46Z';
if (typeof window !== 'undefined') {
    // Visible once per client load to confirm fresh code
    // eslint-disable-next-line no-console
    console.info('[WM Canvas] Loaded', STORYBOARD_UTILS_BUILD_TAG);
}


export interface ParsedScene {
    sceneNumber: number;
    content: string;
    heading?: string;
}

export function parseScriptIntoScenes(scriptText: string): ParsedScene[] {
    if (!scriptText || !scriptText.trim()) {
        return [];
    }

    const scenes: ParsedScene[] = [];
    const lines = scriptText.split('\n');

    let currentScene: ParsedScene | null = null;
    let sceneCounter = 1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const upperLine = line.toUpperCase();

        // Check if this line is a scene heading
        // Scene headings typically start with INT., EXT., or SCENE
        const isSceneHeading =
            upperLine.startsWith('INT.') ||
            upperLine.startsWith('EXT.') ||
            upperLine.startsWith('SCENE') ||
            /^SCENE\s+\d+/.test(upperLine) ||
            /^(INT\.|EXT\.)\s+/.test(upperLine);

        if (isSceneHeading) {
            // Save previous scene if exists
            if (currentScene) {
                currentScene.content = currentScene.content.trim();
                scenes.push(currentScene);
            }

            // Start new scene
            currentScene = {
                sceneNumber: sceneCounter++,
                heading: line,
                content: line + '\n',
            };
        } else if (currentScene) {
            // Add line to current scene
            currentScene.content += line + '\n';
        } else if (line) {
            // No scene heading yet, but we have content - create first scene
            currentScene = {
                sceneNumber: sceneCounter++,
                content: line + '\n',
            };
        }
    }

    // Don't forget the last scene
    if (currentScene) {
        currentScene.content = currentScene.content.trim();
        scenes.push(currentScene);
    }

    // If no scenes were detected but we have content, treat entire script as one scene
    if (scenes.length === 0 && scriptText.trim()) {
        scenes.push({
            sceneNumber: 1,
            content: scriptText.trim(),
        });
    }

    return scenes;
}

/**
 * Calculate positions for scene frames
 * Arranges ALL scenes in a single column to the right of the script frame
 */
export function calculateSceneFramePositions(
    scriptFrameX: number,
    scriptFrameY: number,
    scriptFrameWidth: number,
    scriptFrameHeight: number,
    numScenes: number,
    sceneFrameWidth: number = 350,
    sceneFrameHeight: number = 300,
    gap: number = 50
): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];

    // Start to the right of the script frame
    const startX = scriptFrameX + scriptFrameWidth + gap * 2;

    // Calculate total height of all scene frames including gaps
    const totalScenesHeight = numScenes * sceneFrameHeight + (numScenes - 1) * gap;

    // Calculate the starting Y position to center the block of scenes relative to the script frame
    // Center of script frame = scriptFrameY + scriptFrameHeight / 2
    // Top of scenes block = Center of script frame - totalScenesHeight / 2
    const startY = (scriptFrameY + scriptFrameHeight / 2) - (totalScenesHeight / 2);

    // Arrange in a single vertical column
    for (let i = 0; i < numScenes; i++) {
        positions.push({
            x: startX,
            y: startY + i * (sceneFrameHeight + gap),
        });
    }

    return positions;
}
