
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

        // EXECUTION ENGINE: Process CanvasInstructionPlan
        if (action.intent === 'EXECUTE_PLAN') {
            const plan = action.payload as any; // CanvasInstructionPlan
            const steps = plan.steps;
            const stepToNodeIds: Record<string, string[]> = {};

            // Layout State
            let currentX = center.x - 400;
            let currentY = center.y - 200;
            const X_SPACING = 500;

            for (const step of steps) {
                switch (step.action) {
                    case 'CREATE_NODE': {
                        const newIds: string[] = [];
                        const count = step.count || 1;

                        for (let i = 0; i < count; i++) {
                            // Calculate position (simple horizontal flow)
                            const posX = currentX + (i * 200); // Inner spacing for batches
                            const posY = currentY;

                            if (step.nodeType === 'video-generator') {
                                const newId = `video-${uuidv4()}`;
                                const newModal = {
                                    id: newId,
                                    x: posX,
                                    y: posY,
                                    prompt: step.configTemplate.prompt,
                                    model: step.configTemplate.model,
                                    aspectRatio: step.configTemplate.aspectRatio || '16:9',
                                    duration: step.configTemplate.duration || 4,
                                    frameWidth: 600,
                                    frameHeight: 400,
                                };
                                canvasState.setVideoModalStates((prev: any) => [...prev, newModal]);
                                if (props.onPersistVideoModalCreate) await props.onPersistVideoModalCreate(newModal);
                                newIds.push(newId);
                            }
                            else if (step.nodeType === 'image-generator') {
                                const newId = `image-${uuidv4()}`;
                                const newModal = {
                                    id: newId,
                                    x: posX,
                                    y: posY,
                                    prompt: step.configTemplate.prompt,
                                    model: step.configTemplate.model,
                                    aspectRatio: step.configTemplate.aspectRatio || '1:1',
                                    imageCount: 1,
                                    initialCount: 1,
                                    resolution: '1024',
                                    frameWidth: 600,
                                    frameHeight: 400,
                                    isGenerating: false,
                                };
                                canvasState.setImageModalStates((prev: any) => [...prev, newModal]);
                                if (props.onPersistImageModalCreate) await props.onPersistImageModalCreate(newModal);
                                newIds.push(newId);
                            }
                            else if (step.nodeType === 'music-generator') {
                                const newId = `music-${uuidv4()}`;
                                const newModal = {
                                    id: newId,
                                    x: posX,
                                    y: posY,
                                    prompt: step.configTemplate.prompt,
                                    model: step.configTemplate.model,
                                    frameWidth: 400,
                                    frameHeight: 150
                                };
                                if (canvasState.setMusicModalStates) {
                                    canvasState.setMusicModalStates((prev: any) => [...prev, newModal]);
                                    if (props.onPersistMusicModalCreate) await props.onPersistMusicModalCreate(newModal);
                                }
                                newIds.push(newId);
                            }
                        }

                        stepToNodeIds[step.id] = newIds;
                        // Advance Layout Cursor for next step
                        currentX += X_SPACING;
                        break;
                    }

                    case 'CONNECT_SEQUENTIALLY': {
                        const fromIds = stepToNodeIds[step.fromStepId];
                        const toIds = step.toStepId ? stepToNodeIds[step.toStepId] : null;

                        // Logic: 
                        // If explicit 'toStepId', connect All From -> All To (or 1-to-1?)
                        // If no 'toStepId', connect nodes WITHIN the fromStep (batch sequence)

                        if (toIds) {
                            // Connect Step A to Step B
                            // Simple: Last of A -> First of B? Or All A -> First B? 
                            // For "Music Video" (Music -> Video), it's 1-to-1.
                            // For "Video Sequence" (Video A -> Video B), handled internally?

                            // Heuristic: Connect Last of From to First of To
                            const source = fromIds[fromIds.length - 1];
                            const target = toIds[0];
                            if (source && target) {
                                const newConn = {
                                    id: `conn-${uuidv4()}`,
                                    from: source,
                                    to: target,
                                    color: '#555555'
                                };
                                if (props.onPersistConnectorCreate) await props.onPersistConnectorCreate(newConn);
                            }
                        } else {
                            // Self-Sequence (e.g. 8 video nodes)
                            // Connect n -> n+1
                            for (let i = 0; i < fromIds.length - 1; i++) {
                                const newConn = {
                                    id: `conn-${uuidv4()}`,
                                    from: fromIds[i],
                                    to: fromIds[i + 1],
                                    color: '#555555'
                                };
                                if (props.onPersistConnectorCreate) await props.onPersistConnectorCreate(newConn);
                            }
                        }
                        break;
                    }

                    case 'GROUP_NODES': {
                        // TODO: Implement Grouping Overlay
                        // For now, implicit grouping via layout
                        break;
                    }
                }
            }
            return;
        }

        // --- BACKWARD COMPATIBILITY (Single Actions) ---
        // (Keep existing switch case logic for single actions like GENERATE_IMAGE if needed, 
        // OR map them to a 1-step plan in the resolver?
        // User asked for "Refactor executor to consume Plan".
        // Safe to keep old logic as fallback or assume Resolver ALWAYS emits plans?
        // Let's keep old logic for safety during transition.)

        const payload = action.payload;
        const targetPos = payload.position === 'viewport_center' ? center : (payload.position || center);

        switch (action.intent) {
            case 'GENERATE_IMAGE': {
                const newId = `image-${uuidv4()}`;
                const newModal = {
                    id: newId,
                    x: targetPos.x - 300,
                    y: targetPos.y - 200,
                    prompt: payload.prompt,
                    model: payload.model,
                    aspectRatio: payload.aspectRatio || '1:1',
                    imageCount: payload.imageCount || 1,
                    initialCount: payload.imageCount || 1,
                    resolution: payload.resolution || '1024',
                    frameWidth: 600,
                    frameHeight: 400,
                    isGenerating: false,
                };
                canvasState.setImageModalStates((prev: any) => [...prev, newModal]);
                if (props.onPersistImageModalCreate) await props.onPersistImageModalCreate(newModal);
                break;
            }

            case 'CREATE_TEXT': {
                const newId = `text-${uuidv4()}`;
                const newText = {
                    id: newId,
                    x: targetPos.x,
                    y: targetPos.y,
                    text: payload.content,
                    width: 300,
                    height: 100,
                    style: payload.style || 'standard'
                };
                if (canvasState.setRichTextStates) {
                    canvasState.setRichTextStates((prev: any) => [...prev, newText]);
                    if (props.onPersistRichTextCreate) await props.onPersistRichTextCreate(newText);
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
                    aspectRatio: payload.aspectRatio || '16:9',
                    duration: payload.duration || 4,
                    frameWidth: 600,
                    frameHeight: 400,
                };
                canvasState.setVideoModalStates((prev: any) => [...prev, newModal]);
                if (props.onPersistVideoModalCreate) await props.onPersistVideoModalCreate(newModal);
                break;
            }
        }
    }, [getViewportCenter, canvasState, canvasSelection, props]);

    return { executeIntent };
}
