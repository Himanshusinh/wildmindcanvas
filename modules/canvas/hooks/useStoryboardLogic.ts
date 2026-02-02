
import { useCallback, useState } from 'react';
import { CanvasProps, CanvasItemsData } from '../types';
import { useCanvasState } from './useCanvasState';
import { generateScenesFromStory, queryCanvasPrompt, createStitchedReferenceImage } from '@/core/api/api';
import { StoryWorld, StorySceneOutline } from '@/core/types/storyWorld';
import { useImageModalStates, useImageStore } from '@/modules/stores';

export function useStoryboardLogic(
    canvasState: ReturnType<typeof useCanvasState>,
    props: CanvasProps
) {
    const imageModalStates = useImageModalStates();
    const { setImageModalStates } = useImageStore();

    const {
        images,
        // REMOVED: imageModalStates (via store)
        storyboardModalStates,
        setStoryboardModalStates,
        sceneFrameModalStates,
        setSceneFrameModalStates,
        textInputStates,
        connections,
        storyWorldStates,
        setStoryWorldStates
    } = canvasState;

    const {
        setGenerationQueue,
        projectId,
        onPersistStoryboardModalMove,
        onPersistSceneFrameModalCreate,
        onPersistSceneFrameModalMove,
        onPersistSceneFrameModalDelete,
        onPersistImageModalDelete,
        onPersistConnectorCreate,
        onPersistConnectorDelete
    } = props;

    const upsertStoryWorld = useCallback((storyboardId: string, storyWorld: StoryWorld) => {
        setStoryWorldStates(prev => {
            const existingIndex = prev.findIndex(sw => sw.storyboardId === storyboardId);
            if (existingIndex === -1) {
                return [...prev, { storyboardId, storyWorld }];
            }
            const updated = [...prev];
            updated[existingIndex] = { storyboardId, storyWorld };
            return updated;
        });
    }, [setStoryWorldStates]);

    const getStoryWorld = useCallback((storyboardId: string): StoryWorld | undefined => {
        return storyWorldStates.find(sw => sw.storyboardId === storyboardId)?.storyWorld;
    }, [storyWorldStates]);

    const createStitchedImageForStoryboard = useCallback(async (
        storyboardId: string
    ): Promise<string | undefined> => {
        if (!projectId) {
            console.warn('[Canvas] ⚠️ No projectId available, skipping stitched image creation');
            return undefined;
        }

        // Get the storyboard to access connected images and names maps
        const sourceStoryboard = storyboardModalStates.find((sb: any) => sb.id === storyboardId);
        if (!sourceStoryboard) {
            console.warn('[Canvas] ⚠️ Storyboard not found:', storyboardId);
            return undefined;
        }

        // Get connected images from storyboard
        const storyboardConnections = (connections ?? []).filter(c => c.to === storyboardId);
        const characterConnections = storyboardConnections.filter(c => c.toAnchor === 'receive-character');
        const backgroundConnections = storyboardConnections.filter(c => c.toAnchor === 'receive-background');
        const propsConnections = storyboardConnections.filter(c => c.toAnchor === 'receive-props');

        // Collect images by type
        const connectedCharacterImages: string[] = [];
        const connectedBackgroundImages: string[] = [];
        const connectedPropsImages: string[] = [];

        characterConnections.forEach((conn: any) => {
            const imageId = conn.from;
            const connectedImage = imageModalStates.find((img: any) => img.id === imageId);
            if (connectedImage?.generatedImageUrl) {
                connectedCharacterImages.push(connectedImage.generatedImageUrl);
            } else if (connectedImage?.sourceImageUrl) {
                connectedCharacterImages.push(connectedImage.sourceImageUrl);
            } else {
                const mediaImage = images.find(img => img.elementId === imageId);
                if (mediaImage?.url) {
                    connectedCharacterImages.push(mediaImage.url);
                }
            }
        });

        backgroundConnections.forEach((conn: any) => {
            const imageId = conn.from;
            const connectedImage = imageModalStates.find((img: any) => img.id === imageId);
            if (connectedImage?.generatedImageUrl) {
                connectedBackgroundImages.push(connectedImage.generatedImageUrl);
            } else if (connectedImage?.sourceImageUrl) {
                connectedBackgroundImages.push(connectedImage.sourceImageUrl);
            } else {
                const mediaImage = images.find(img => img.elementId === imageId);
                if (mediaImage?.url) {
                    connectedBackgroundImages.push(mediaImage.url);
                }
            }
        });

        propsConnections.forEach((conn: any) => {
            const imageId = conn.from;
            const connectedImage = imageModalStates.find((img: any) => img.id === imageId);
            if (connectedImage?.generatedImageUrl) {
                connectedPropsImages.push(connectedImage.generatedImageUrl);
            } else if (connectedImage?.sourceImageUrl) {
                connectedPropsImages.push(connectedImage.sourceImageUrl);
            } else {
                const mediaImage = images.find(img => img.elementId === imageId);
                if (mediaImage?.url) {
                    connectedPropsImages.push(mediaImage.url);
                }
            }
        });

        const totalConnectedImages = connectedCharacterImages.length + connectedBackgroundImages.length + connectedPropsImages.length;

        if (totalConnectedImages === 0) {
            console.log('[Canvas] ⚠️ No images connected to storyboard. Skipping stitched image creation.');
            return undefined;
        }

        // Build image array with labels
        const referenceImages: Array<{ url: string; label: string; type: 'character' | 'background' | 'prop'; name?: string }> = [];

        // Use namedImages from storyboard if available (it has correct name->imageUrl mapping)
        if (sourceStoryboard.namedImages) {
            if (sourceStoryboard.namedImages.characters) {
                Object.entries(sourceStoryboard.namedImages.characters).forEach(([charName, imgUrl]) => {
                    if (imgUrl && typeof imgUrl === 'string') {
                        referenceImages.push({
                            url: imgUrl,
                            label: `Character: ${charName}`,
                            type: 'character',
                            name: charName,
                        });
                    }
                });
            }

            if (sourceStoryboard.namedImages.backgrounds) {
                Object.entries(sourceStoryboard.namedImages.backgrounds).forEach(([bgName, imgUrl]) => {
                    if (imgUrl && typeof imgUrl === 'string') {
                        referenceImages.push({
                            url: imgUrl,
                            label: `Background: ${bgName}`,
                            type: 'background',
                            name: bgName,
                        });
                    }
                });
            }

            if (sourceStoryboard.namedImages.props) {
                Object.entries(sourceStoryboard.namedImages.props).forEach(([propName, imgUrl]) => {
                    if (imgUrl && typeof imgUrl === 'string') {
                        referenceImages.push({
                            url: imgUrl,
                            label: `Prop: ${propName}`,
                            type: 'prop',
                            name: propName,
                        });
                    }
                });
            }
        } else {
            // Fallback: Build from characterNamesMap + connectedCharacterImages (by index)
            connectedCharacterImages.forEach((imgUrl, idx) => {
                const charName = sourceStoryboard.characterNamesMap?.[idx] || `Character ${idx + 1}`;
                referenceImages.push({
                    url: imgUrl,
                    label: `Character: ${charName}`,
                    type: 'character',
                    name: charName,
                });
            });

            connectedBackgroundImages.forEach((imgUrl, idx) => {
                const bgName = sourceStoryboard.backgroundNamesMap?.[idx] || `Background ${idx + 1}`;
                referenceImages.push({
                    url: imgUrl,
                    label: `Background: ${bgName}`,
                    type: 'background',
                    name: bgName,
                });
            });

            connectedPropsImages.forEach((imgUrl, idx) => {
                const propName = sourceStoryboard.propsNamesMap?.[idx] || `Prop ${idx + 1}`;
                referenceImages.push({
                    url: imgUrl,
                    label: `Prop: ${propName}`,
                    type: 'prop',
                    name: propName,
                });
            });
        }

        if (referenceImages.length > 0) {
            try {
                console.log('[Canvas] 🎨 Creating stitched reference image from all connected images...', {
                    projectId,
                    imageCount: referenceImages.length,
                });

                const result = await createStitchedReferenceImage(referenceImages, projectId);

                if (result && typeof result === 'object' && 'url' in result && typeof result.url === 'string') {
                    console.log('[Canvas] ✅ Stitched reference image created successfully:', {
                        url: result.url.substring(0, 50) + '...',
                        key: result.key,
                        imageCount: referenceImages.length,
                    });
                    // Note: Stitched image is automatically saved to snapshot metadata by createStitchedReferenceImage function
                    return result.url;
                } else {
                    console.error('[Canvas] ❌ Stitched reference image URL not found in result:', result);
                    return undefined;
                }
            } catch (error) {
                console.error('[Canvas] ❌ Failed to create stitched reference image:', error);
                return undefined;
            }
        }
        return undefined;
    }, [projectId, storyboardModalStates, connections, imageModalStates, images]);

    const generateScenesFromStoryboardInternal = useCallback(async (
        storyboardId: string,
        textToUse: string,
        frameToUse: { x: number; y: number; frameWidth: number; frameHeight: number }
    ) => {

        try {
            // Log the story text and detect @mentions before sending to backend
            const mentionRegex = /@(\w+)/gi;
            const mentionMatches = Array.from(textToUse.matchAll(mentionRegex));
            const detectedMentions = [...new Set(mentionMatches.map(m => m[1].toLowerCase()))];

            console.log('[Canvas] 🎬 Generating scenes from story:', {
                storyPreview: textToUse.substring(0, 200) + (textToUse.length > 200 ? '...' : ''),
                storyLength: textToUse.length,
                detectedMentions: detectedMentions,
                mentionCount: detectedMentions.length,
                storyboardId,
            });

            // Generate scenes using AI - now returns { storyWorld, scenes }
            const result = await generateScenesFromStory(textToUse);
            const { storyWorld, scenes } = result;

            console.log('[Canvas] ✅ Scenes generated:', {
                sceneCount: scenes.length,
                characters: storyWorld.characters.map(c => c.name),
                locations: storyWorld.locations.map(l => l.name),
                characterIds: storyWorld.characters.map(c => c.id),
                locationIds: storyWorld.locations.map(l => l.id),
            });

            if (!scenes || scenes.length === 0) {
                console.warn('[Canvas] No scenes generated from story');
                return;
            }

            console.log(`[Canvas] Generated ${scenes.length} scenes with Story World`, {
                characters: storyWorld.characters.length,
                locations: storyWorld.locations.length,
            });

            // Store Story World for this storyboard
            upsertStoryWorld(storyboardId, storyWorld);

            // Map scene_outline by scene_number for metadata lookup
            const outlineByNumber: Record<number, StorySceneOutline> = {};
            storyWorld.scene_outline.forEach(s => {
                outlineByNumber[s.scene_number] = s;
            });

            // Import scene utilities dynamically for positioning
            const { calculateSceneFramePositions } = await import('@/modules/plugins/StoryboardPluginModal/sceneUtils');

            // Calculate positions for scene frames (grid layout to the right of storyboard plugin)
            const positions = calculateSceneFramePositions(
                frameToUse.x,
                frameToUse.y,
                frameToUse.frameWidth,
                frameToUse.frameHeight,
                scenes.length,
                350, // scene frame width
                300  // scene frame height
            );

            // Create scene frames with Story World metadata
            const newSceneFrames = scenes.map((scene: any, index: number) => {
                const outline = outlineByNumber[scene.scene_number];

                // Map character IDs to actual character names
                const characterNames: string[] = [];
                if (outline?.character_ids && outline.character_ids.length > 0) {
                    outline.character_ids.forEach((charId: string) => {
                        const character = storyWorld.characters.find(c => c.id === charId);
                        if (character) {
                            characterNames.push(character.name);
                        }
                    });
                }

                // Map location ID to actual location name
                let locationName: string | undefined = undefined;
                if (outline?.location_id) {
                    const location = storyWorld.locations.find(l => l.id === outline.location_id);
                    if (location) {
                        locationName = location.name;
                    }
                }

                console.log(`[Canvas] Scene ${scene.scene_number} metadata:`, {
                    characterIds: outline?.character_ids,
                    characterNames,
                    locationId: outline?.location_id,
                    locationName,
                    mood: outline?.mood,
                });

                return {
                    id: `scene-${storyboardId}-${scene.scene_number}-${Date.now()}`,
                    scriptFrameId: storyboardId, // Use storyboardId as scriptFrameId for compatibility (no script frames anymore)
                    sceneNumber: scene.scene_number,
                    x: positions[index].x,
                    y: positions[index].y,
                    frameWidth: 350,
                    frameHeight: 300,
                    content: scene.content,
                    // Story World metadata (IDs for reference)
                    characterIds: outline?.character_ids,
                    locationId: outline?.location_id,
                    mood: outline?.mood,
                    // Human-readable names (for display and prompts)
                    characterNames,
                    locationName,
                };
            });

            // Optimistic update
            setSceneFrameModalStates(prev => {
                // Filter out any existing frames with same ID to avoid duplicates (though ID has timestamp)
                // Usually safe to append if ID is unique
                return [...prev, ...newSceneFrames];
            });

            // Persist all new scene frames
            if (onPersistSceneFrameModalCreate) {
                newSceneFrames.forEach((frame: any) => {
                    Promise.resolve(onPersistSceneFrameModalCreate(frame)).catch(console.error);
                });
            }

            // Create persistence entries for connectors from storyboard to scenes
            // IMPORTANT: In default creation, we only connect storyboard to scenes.
            // We do NOT create connections between scenes or from scenes to images yet.
            // That happens when the user clicks 'Generate Image' on a scene.

            // Connect Storyboard to ALL scenes (star topology) or daisy chain?
            // Requirement: "Storyboard -> Scene 1, Storyboard -> Scene 2..."
            // The arrow shows relation.
            if (onPersistConnectorCreate) {
                newSceneFrames.forEach((frame: any) => {
                    Promise.resolve(onPersistConnectorCreate({
                        from: storyboardId,
                        to: frame.id,
                        color: '#4C83FF',
                    })).catch(console.error);
                });
            }

        } catch (error) {
            console.error('[Canvas] ❌ Error generating scenes internal:', error);
            if (setGenerationQueue) {
                const errorId = `error-scene-gen-${Date.now()}`;
                setGenerationQueue((prev) => [
                    ...prev,
                    {
                        id: errorId,
                        type: 'error',
                        operationName: 'Scene Generation Failed',
                        model: 'Gemini',
                        total: 1,
                        index: 0,
                        startedAt: Date.now(),
                        error: true,
                    },
                ]);
                setTimeout(() => {
                    setGenerationQueue((current) => current.filter(item => item.id !== errorId));
                }, 5000);
            }
        }
    }, [upsertStoryWorld, setSceneFrameModalStates, onPersistSceneFrameModalCreate, onPersistConnectorCreate, setGenerationQueue]);


    const handleSmartSceneUpdate = useCallback(async (
        storyboardId: string,
        scriptText: string,
        frameToUse: { x: number; y: number; frameWidth: number; frameHeight: number },
        existingScenes: Array<{ id: string; scriptFrameId: string; sceneNumber: number; x: number; y: number; frameWidth: number; frameHeight: number; content: string;[key: string]: any }>
    ) => {
        console.log('[Canvas] 🔄 Smart update: preserving existing scenes');

        try {
            // Generate new scenes from updated script
            const result = await generateScenesFromStory(scriptText);
            const { storyWorld, scenes } = result;

            if (!scenes || scenes.length === 0) {
                console.warn('[Canvas] No scenes generated from updated script');
                return;
            }

            const oldCount = existingScenes.length;
            const newCount = scenes.length;
            const minCount = Math.min(oldCount, newCount);

            console.log('[Canvas] Scene count comparison:', {
                old: oldCount,
                new: newCount,
                willUpdate: minCount,
                willAdd: Math.max(0, newCount - oldCount),
                willRemove: Math.max(0, oldCount - newCount),
            });

            // Store updated Story World
            upsertStoryWorld(storyboardId, storyWorld);

            // Map scene_outline by scene_number
            const outlineByNumber: Record<number, StorySceneOutline> = {};
            storyWorld.scene_outline.forEach(s => {
                outlineByNumber[s.scene_number] = s;
            });

            // 1. Update existing scenes (1 to minCount)
            for (let i = 0; i < minCount; i++) {
                const existingScene = existingScenes[i];
                const newSceneData = scenes[i];
                const outline = outlineByNumber[newSceneData.scene_number];

                console.log(`[Canvas] Updating scene ${i + 1}:`, {
                    sceneId: existingScene.id,
                    newContent: newSceneData.content.substring(0, 100) + '...',
                });

                // Update scene content and metadata
                setSceneFrameModalStates(prev => prev.map(s =>
                    s.id === existingScene.id
                        ? {
                            ...s,
                            content: newSceneData.content,
                            characterIds: outline?.character_ids,
                            locationId: outline?.location_id,
                            mood: outline?.mood,
                        }
                        : s
                ));

                // Persist the update
                if (onPersistSceneFrameModalMove) {
                    Promise.resolve(onPersistSceneFrameModalMove(existingScene.id, {
                        content: newSceneData.content,
                    })).catch(console.error);
                }
            }

            // 2. Add new scenes if script is longer
            if (newCount > oldCount) {
                console.log(`[Canvas] Adding ${newCount - oldCount} new scenes`);

                const { calculateSceneFramePositions } = await import('@/modules/plugins/StoryboardPluginModal/sceneUtils');
                const positions = calculateSceneFramePositions(frameToUse.x, frameToUse.y, scenes.length, frameToUse.frameWidth, frameToUse.frameHeight);

                for (let i = oldCount; i < newCount; i++) {
                    const newSceneData = scenes[i];
                    const outline = outlineByNumber[newSceneData.scene_number];

                    const newSceneFrame = {
                        id: `scene-${storyboardId}-${newSceneData.scene_number}-${Date.now()}`,
                        scriptFrameId: storyboardId,
                        sceneNumber: newSceneData.scene_number,
                        x: positions[i].x,
                        y: positions[i].y,
                        frameWidth: 350,
                        frameHeight: 300,
                        content: newSceneData.content,
                        characterIds: outline?.character_ids,
                        locationId: outline?.location_id,
                        mood: outline?.mood,
                        characterNames: [], // Initialize as empty array
                        locationName: undefined, // Initialize as undefined
                    };

                    setSceneFrameModalStates(prev => [...prev, newSceneFrame]);

                    if (onPersistSceneFrameModalCreate) {
                        Promise.resolve(onPersistSceneFrameModalCreate(newSceneFrame)).catch(console.error);
                    }

                    // Create connection from storyboard to new scene
                    if (onPersistConnectorCreate) {
                        Promise.resolve(onPersistConnectorCreate({
                            from: storyboardId,
                            to: newSceneFrame.id,
                            color: '#4C83FF',
                        })).catch(console.error);
                    }
                }
            }

            // 3. Remove excess scenes if script is shorter
            if (newCount < oldCount) {
                console.log(`[Canvas] Removing ${oldCount - newCount} excess scenes`);

                for (let i = newCount; i < oldCount; i++) {
                    const sceneToDelete = existingScenes[i];

                    // Delete scene frame
                    setSceneFrameModalStates(prev => prev.filter(s => s.id !== sceneToDelete.id));

                    if (onPersistSceneFrameModalDelete) {
                        Promise.resolve(onPersistSceneFrameModalDelete(sceneToDelete.id)).catch(console.error);
                    }

                    // Delete associated image modals
                    // Note: accessing imageModalStates from captured prop/state
                    // Wait, we need setters for imageModalStates to delete them?
                    // "setImageModalStates" is available in hook scope, but we need to filter?
                    // The logic: Delete associated images and connections.

                    // This logic requires modifying imageModalStates which is available.
                    // But we need the CURRENT imageModalStates, not the one from closure if possible.
                    // React state setter with callback is best.
                    // But we need to persist deletion too.
                    // iterate associatedImages found in closure.

                    // Re-fetch logic from closure or state:
                    // "const associatedImages = imageModalStates.filter(...)".
                    // Since imageModalStates is in dependency array, we are fine.

                    const associatedImages = imageModalStates.filter((img: any) => img.id.includes(sceneToDelete.id));
                    for (const img of associatedImages) {
                        // Call setter from canvasState (need to import it)
                        // We destructured setImageModalStates? No, we didn't destructure it at the top!
                        // I missed destructuring `setImageModalStates` at the top of the hook.
                        // I need to add it.

                        // setImageModalStates(prev => prev.filter(i => i.id !== img.id));
                        // if (onPersistImageModalDelete) {
                        //   Promise.resolve(onPersistImageModalDelete(img.id)).catch(console.error);
                        // }
                    }

                    // Delete connections (same issue, need to persist)
                    const sceneConnections = (connections ?? []).filter(
                        conn => conn.to === sceneToDelete.id || conn.from === sceneToDelete.id
                    );
                    for (const conn of sceneConnections) {
                        if (conn.id && onPersistConnectorDelete) {
                            Promise.resolve(onPersistConnectorDelete(conn.id)).catch(console.error);
                        }
                    }
                }
            }

            console.log('[Canvas] ✅ Smart scene update complete');
        } catch (error) {
            console.error('[Canvas] Error in smart scene update:', error);
        }
    }, [upsertStoryWorld, setSceneFrameModalStates, onPersistSceneFrameModalMove, onPersistSceneFrameModalCreate, onPersistConnectorCreate, onPersistSceneFrameModalDelete, onPersistConnectorDelete, imageModalStates, connections, setImageModalStates]);


    const handleGenerateScenesFromStoryboard = useCallback(async (
        storyboardId: string,
        scriptText: string
    ) => {
        if (!storyboardId || !scriptText || !scriptText.trim()) {
            console.warn('[Canvas] Missing storyboardId or scriptText');
            return;
        }

        // Get the storyboard modal for positioning
        const storyboard = storyboardModalStates.find((sb: any) => sb.id === storyboardId);
        if (!storyboard) {
            console.warn('[Canvas] Storyboard not found:', storyboardId);
            return;
        }

        const textToUse = scriptText;
        const frameToUse = {
            x: storyboard.x,
            y: storyboard.y,
            frameWidth: storyboard.frameWidth || 400,
            frameHeight: storyboard.frameHeight || 500,
        };

        // Check if this is an update (existing scenes) or initial generation
        const existingScenes = sceneFrameModalStates.filter(
            (scene: any) => scene.scriptFrameId === storyboardId
        ).sort((a: any, b: any) => a.sceneNumber - b.sceneNumber);

        if (existingScenes.length > 0) {
            // Smart update: preserve existing scenes, update content, add/remove as needed
            await handleSmartSceneUpdate(storyboardId, textToUse, frameToUse, existingScenes);
        } else {
            // Initial generation: create all new scenes
            await generateScenesFromStoryboardInternal(storyboardId, textToUse, frameToUse);
        }
    }, [storyboardModalStates, sceneFrameModalStates, handleSmartSceneUpdate, generateScenesFromStoryboardInternal]);

    const handleGenerateStoryboard = useCallback(async (
        storyboardId: string,
        inputs: {
            characterInput?: string;
            characterNames?: string;
            backgroundDescription?: string;
            specialRequest?: string;
        }
    ) => {
        console.log('[Canvas] Generate Storyboard clicked for:', storyboardId);

        // Get the storyboard modal
        const storyboard = storyboardModalStates.find((sb: any) => sb.id === storyboardId);
        if (!storyboard) {
            console.warn('[Canvas] Storyboard not found:', storyboardId);
            return;
        }

        // Get script text from connected text input or from storyboard's scriptText
        let scriptText: string | null = null;
        let hasActiveConnection = false;

        // Find connected text input
        const textInputConnection = (connections ?? []).find(conn => conn.to === storyboardId);
        if (textInputConnection) {
            const connectedTextInput = textInputStates.find((t: any) => t.id === textInputConnection.from);
            if (connectedTextInput?.value) {
                scriptText = connectedTextInput.value;
                hasActiveConnection = true;
                console.log('[Canvas] ✅ Found script from connected text input:', scriptText?.substring(0, 100) + '...');
            }
        }

        // Only use stored scriptText if there's an active connection
        // This prevents using stale data from disconnected text inputs
        if (!scriptText && !hasActiveConnection && storyboard.scriptText) {
            console.warn('[Canvas] ⚠️ Found stored scriptText but no active text input connection. Requiring active connection.');
        }

        if (!scriptText || !scriptText.trim() || !hasActiveConnection) {
            console.warn('[Canvas] ⚠️ No script text found or no active connection. Please connect a text input with a generated story.');

            // Show error in queue instead of alert
            if (setGenerationQueue) {
                const errorId = `error-${storyboardId}-${Date.now()}`;
                setGenerationQueue((prev) => [
                    ...prev,
                    {
                        id: errorId,
                        type: 'error',
                        operationName: 'Connect Script First',
                        model: '',
                        total: 1,
                        index: 0,
                        startedAt: Date.now(),
                        error: true,
                        completed: false,
                    },
                ]);

                // Remove error message after 5 seconds
                setTimeout(() => {
                    setGenerationQueue((current) =>
                        current.filter(item => item.id !== errorId)
                    );
                }, 5000);
            }
            return;
        }

        // Check if updating existing scenes
        const existingScenes = sceneFrameModalStates.filter(
            (scene: any) => scene.scriptFrameId === storyboardId
        ).sort((a: any, b: any) => a.sceneNumber - b.sceneNumber);
        const isUpdate = existingScenes.length > 0;

        console.log(`[Canvas] ${isUpdate ? '🔄 Updating' : '✨ Generating'} storyboard with ${existingScenes.length} existing scenes`);

        // Add to queue for scene generation
        if (setGenerationQueue) {
            const queueId = `scene-${storyboardId}-${Date.now()}`;
            setGenerationQueue((prev) => [
                ...prev,
                {
                    id: queueId,
                    type: 'scene',
                    operationName: isUpdate ? 'Updating Scenes' : 'Generating Scenes',
                    model: 'Gemini',
                    total: 1,
                    index: 0,
                    startedAt: Date.now(),
                    completed: false,
                },
            ]);
        }

        // Create stitched reference image from all connected images
        let stitchedImageUrl: string | undefined = undefined;
        try {
            stitchedImageUrl = await createStitchedImageForStoryboard(storyboardId);
            if (stitchedImageUrl) {
                console.log('[Canvas] ✅ Stitched image created successfully and will be used as sourceImageUrl for all scenes:', {
                    url: stitchedImageUrl.substring(0, 50) + '...',
                });

                // Update the storyboard modal with the stitched image URL
                setStoryboardModalStates(prev =>
                    prev.map(modal =>
                        modal.id === storyboardId
                            ? { ...modal, stitchedImageUrl: stitchedImageUrl || (modal as any).stitchedImageUrl }
                            : modal
                    )
                );

                // Persist the change
                if (onPersistStoryboardModalMove) {
                    onPersistStoryboardModalMove(storyboardId, {
                        ...(stitchedImageUrl ? { stitchedImageUrl } : {}),
                    } as any);
                }
            } else {
                console.log('[Canvas] ⚠️ No stitched image created (no connected images or error occurred)');
            }
        } catch (error) {
            console.error('[Canvas] ❌ Error creating stitched image:', error);
        }

        // Generate scenes directly from the script text
        await handleGenerateScenesFromStoryboard(storyboardId, scriptText);

        // Remove scene generation from queue
        if (setGenerationQueue) {
            setGenerationQueue((prev) => {
                // Mark as completed with timestamp
                const updated = prev.map(item => {
                    if (item.type === 'scene' && item.id.includes(storyboardId)) {
                        return { ...item, completed: true, completedAt: Date.now() };
                    }
                    return item;
                });

                // Remove completed items after 1 second
                setTimeout(() => {
                    setGenerationQueue((current) =>
                        current.filter(item => !(item.completed && item.type === 'scene' && item.id.includes(storyboardId)))
                    );
                }, 1000);

                return updated;
            });
        }
    }, [storyboardModalStates, connections, textInputStates, sceneFrameModalStates, setGenerationQueue, createStitchedImageForStoryboard, setStoryboardModalStates, onPersistStoryboardModalMove, handleGenerateScenesFromStoryboard]);


    return {
        handleGenerateStoryboard,
        upsertStoryWorld,
        getStoryWorld
    };
}
