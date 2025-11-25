

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
 * Calculate grid positions for scene frames
 * Arranges them in a grid to the right of the script frame
 */
export function calculateSceneFramePositions(
    scriptFrameX: number,
    scriptFrameY: number,
    scriptFrameWidth: number,
    numScenes: number,
    sceneFrameWidth: number = 350,
    sceneFrameHeight: number = 300,
    gap: number = 50
): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];

    // Start to the right of the script frame
    const startX = scriptFrameX + scriptFrameWidth + gap * 2;
    const startY = scriptFrameY;

    // Arrange in a grid (2 columns)
    const columns = 2;

    for (let i = 0; i < numScenes; i++) {
        const col = i % columns;
        const row = Math.floor(i / columns);

        positions.push({
            x: startX + col * (sceneFrameWidth + gap),
            y: startY + row * (sceneFrameHeight + gap),
        });
    }

    return positions;
}
