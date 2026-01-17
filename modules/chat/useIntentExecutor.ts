
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
                            const posX = currentX + (i * 250); // Inner spacing for batches
                            const posY = currentY;

                            const batchConfig = step.batchConfigs?.[i] || {};
                            const nodePrompt = batchConfig.prompt || step.configTemplate.prompt;
                            const nodeDuration = batchConfig.duration || step.configTemplate.duration || 4;

                            if (step.nodeType === 'video-generator') {
                                const newId = `video-${uuidv4()}`;
                                const newModal = {
                                    id: newId,
                                    x: posX,
                                    y: posY,
                                    prompt: nodePrompt,
                                    model: step.configTemplate.model,
                                    aspectRatio: step.configTemplate.aspectRatio || '16:9',
                                    duration: nodeDuration,
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
                                    prompt: nodePrompt,
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
                                    prompt: nodePrompt,
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
                            else if (step.nodeType === 'text') {
                                const newId = `text-${uuidv4()}`;
                                const newText = {
                                    id: newId,
                                    x: posX,
                                    y: posY,
                                    text: step.configTemplate.content || nodePrompt || "New Text",
                                    width: 400,
                                    height: 300,
                                    style: step.configTemplate.style || 'standard'
                                };
                                if (canvasState.setRichTextStates) {
                                    canvasState.setRichTextStates((prev: any) => [...prev, newText]);
                                    if (props.onPersistRichTextCreate) await props.onPersistRichTextCreate(newText);
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

                        if (toIds && fromIds) {
                            // Connect Step-to-Step (e.g. Image Group -> Video Group)
                            // We connect them 1-to-1 if counts match, otherwise many-to-one or one-to-many
                            const maxLen = Math.max(fromIds.length, toIds.length);
                            for (let i = 0; i < maxLen; i++) {
                                const source = fromIds[i] || fromIds[fromIds.length - 1];
                                const target = toIds[i] || toIds[0];
                                if (source && target) {
                                    const newConn = {
                                        id: `conn-${uuidv4()}`,
                                        from: source,
                                        to: target,
                                        color: '#555555'
                                    };
                                    if (props.onPersistConnectorCreate) await props.onPersistConnectorCreate(newConn);
                                }
                            }
                        } else if (fromIds && fromIds.length > 1) {
                            // Self-Sequence within a step
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
                        // TODO: Implement Visual Grouping
                        break;
                    }
                }
            }
            return;
        }

        // All single actions must now be routed via plans in the Resolver.
        console.warn('[IntentExecutor] Received legacy intent. Please route via EXECUTE_PLAN.', action.intent);
    }, [getViewportCenter, canvasState, props]);

    return { executeIntent };
}
