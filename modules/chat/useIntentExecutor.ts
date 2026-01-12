
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { IntentAction } from './intentSchemas';

interface IntentExecutorProps {
    canvasState: any;
    canvasSelection: any;
    props: any;
    viewportSize: { width: number; height: number };
    position: { x: number; y: number };
    scale: number;
}

export function useIntentExecutor({
    canvasState,
    canvasSelection,
    props,
    viewportSize,
    position,
    scale,
}: IntentExecutorProps) {

    const getViewportCenter = useCallback(() => {
        return {
            x: (viewportSize.width / 2 - position.x) / scale,
            y: (viewportSize.height / 2 - position.y) / scale,
        };
    }, [viewportSize, position, scale]);

    const executeIntent = useCallback(async (action: IntentAction) => {
        console.log('[IntentExecutor] Executing action:', action);

        const center = getViewportCenter();
        const payload = action.payload;
        const targetPos = payload.position === 'viewport_center' ? center : (payload.position || center);

        switch (action.intent) {
            case 'GENERATE_IMAGE': {
                const requestedCount = payload.imageCount || 1;
                const maxBatch = payload.maxBatch || 1;
                const newModals: any[] = [];
                const newIds: string[] = [];

                if (requestedCount <= maxBatch) {
                    const newId = `image-${uuidv4()}`;
                    newModals.push({
                        id: newId,
                        x: targetPos.x - 300,
                        y: targetPos.y - 200,
                        prompt: payload.prompt,
                        model: payload.model,
                        aspectRatio: payload.aspectRatio,
                        imageCount: requestedCount,
                        initialCount: requestedCount,
                        resolution: payload.resolution,
                        frameWidth: 600,
                        frameHeight: 400,
                        isGenerating: false,
                    });
                    newIds.push(newId);
                } else {
                    for (let i = 0; i < requestedCount; i++) {
                        const newId = `image-${uuidv4()}`;
                        const offsetX = i * (600 + 50);
                        newModals.push({
                            id: newId,
                            x: (targetPos.x - 300) + offsetX,
                            y: targetPos.y - 200,
                            prompt: payload.prompt,
                            model: payload.model,
                            aspectRatio: payload.aspectRatio,
                            imageCount: 1,
                            initialCount: 1,
                            resolution: payload.resolution,
                            frameWidth: 600,
                            frameHeight: 400,
                            isGenerating: false,
                        });
                        newIds.push(newId);
                    }
                }

                canvasState.setImageModalStates((prev: any) => [...prev, ...newModals]);
                if (props.onPersistImageModalCreate) {
                    // Persist all sequentially
                    for (const m of newModals) {
                        await props.onPersistImageModalCreate(m);
                    }
                }

                canvasSelection.clearAllSelections();
                if (newIds.length === 1) {
                    canvasSelection.setSelectedImageModalId(newIds[0]);
                }
                canvasSelection.setSelectedImageModalIds(newIds);
                break;
            }

            case 'CREATE_TEXT': {
                const newId = `text-${uuidv4()}`;
                if (payload.style === 'rich') {
                    const newRichText = {
                        id: newId,
                        x: targetPos.x - 150,
                        y: targetPos.y - 50,
                        htmlContent: payload.content,
                        width: 300,
                        height: 100,
                        fontSize: 24,
                        fontFamily: 'Inter',
                        color: '#ffffff',
                        textAlign: 'left' as const,
                    };
                    canvasState.setRichTextStates((prev: any) => [...prev, newRichText]);
                    if (props.onPersistRichTextCreate) await props.onPersistRichTextCreate(newRichText);

                    canvasSelection.clearAllSelections();
                    canvasSelection.setSelectedRichTextId(newId);
                    canvasSelection.setSelectedRichTextIds([newId]);
                } else {
                    const newText = {
                        id: newId,
                        x: targetPos.x - 150,
                        y: targetPos.y - 50,
                        text: payload.content,
                        fontSize: 24,
                        fontFamily: 'Arial',
                        fill: '#ffffff',
                    };
                    canvasState.effectiveSetCanvasTextStates?.((prev: any) => [...prev, newText]);
                    if (props.onPersistCanvasTextCreate) await props.onPersistCanvasTextCreate(newText);

                    canvasSelection.clearAllSelections();
                    canvasSelection.effectiveSetSelectedCanvasTextId?.(newId);
                    canvasSelection.effectiveSetSelectedCanvasTextIds?.([newId]);
                }
                break;
            }

            case 'GENERATE_VIDEO': {
                const newId = `video-${uuidv4()}`;
                const newModal = {
                    id: newId,
                    x: targetPos.x - 300,
                    y: targetPos.y - 200,
                    prompt: payload.prompt,
                    model: payload.model,
                    aspectRatio: payload.aspectRatio,
                    duration: payload.duration || 4,
                    frameWidth: 600,
                    frameHeight: 400,
                };
                canvasState.setVideoModalStates((prev: any) => [...prev, newModal]);
                if (props.onPersistVideoModalCreate) await props.onPersistVideoModalCreate(newModal);

                canvasSelection.clearAllSelections();
                canvasSelection.setSelectedVideoModalId(newId);
                canvasSelection.setSelectedVideoModalIds([newId]);
                break;
            }

            case 'GENERATE_MUSIC': {
                const newId = `music-${uuidv4()}`;
                const newModal = {
                    id: newId,
                    x: targetPos.x - 200,
                    y: targetPos.y - 75,
                    prompt: payload.prompt,
                    model: payload.model || 'Suno v3',
                    frameWidth: 400,
                    frameHeight: 150,
                };
                // Assuming musicModalStates exists in canvasState, otherwise fallback or warn
                if (canvasState.setMusicModalStates) {
                    canvasState.setMusicModalStates((prev: any) => [...prev, newModal]);
                    if (props.onPersistMusicModalCreate) await props.onPersistMusicModalCreate(newModal);

                    canvasSelection.clearAllSelections();
                    // Assuming setSelectedMusicModalId exists
                } else {
                    console.warn('[IntentExecutor] Music capabilities not fully integrated in CanvasState');
                }
                break;
            }

            case 'GENERATE_PLUGIN': {
                const pluginId = payload.pluginId;
                const targetId = payload.targetNodeId;

                if (!targetId) {
                    console.warn('[IntentExecutor] No target node for plugin action');
                    return;
                }

                const boxPos = { x: targetPos.x - 200, y: targetPos.y - 200 };

                if (pluginId === 'upscale') {
                    const newId = `upscale-${uuidv4()}`;
                    const newModal = {
                        id: newId,
                        targetNodeId: targetId,
                        x: boxPos.x,
                        y: boxPos.y,
                        model: payload.model,
                        scale: 2
                    };
                    canvasState.setUpscaleModalStates?.((prev: any) => [...prev, newModal]);
                    if (props.onPersistUpscaleModalCreate) await props.onPersistUpscaleModalCreate(newModal);
                } else if (pluginId === 'remove-bg') {
                    const newId = `remove-bg-${uuidv4()}`;
                    const newModal = {
                        id: newId,
                        targetNodeId: targetId,
                        x: boxPos.x,
                        y: boxPos.y,
                        model: payload.model
                    };
                    canvasState.setRemoveBgModalStates?.((prev: any) => [...prev, newModal]);
                    if (props.onPersistRemoveBgModalCreate) await props.onPersistRemoveBgModalCreate(newModal);
                }
                break;
            }

            default:
                console.warn('[IntentExecutor] Unknown intent:', action.intent);
        }
    }, [getViewportCenter, canvasState, canvasSelection, props]);

    return { executeIntent };
}
