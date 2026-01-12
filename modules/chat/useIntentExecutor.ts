
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

            case 'GENERATE_PLUGIN': {
                const { pluginId, targetNodeId } = payload;
                const newId = `${pluginId}-${uuidv4()}`;

                // Position plugin node to the right of the target or at center
                const posX = targetPos.x + 200;
                const posY = targetPos.y;

                // Look up source image URL from targetNodeId
                let sourceImageUrl = payload.sourceImageUrl || null;
                if (!sourceImageUrl && targetNodeId) {
                    // Try generation modals first
                    const imageModals = (canvasState.imageModalStates || []) as any[];
                    const targetImageModal = imageModals.find((m: any) => m.id === targetNodeId);
                    if (targetImageModal) {
                        sourceImageUrl = targetImageModal.generatedImageUrl || targetImageModal.sourceImageUrl;
                    } else {
                        // Fallback to uploaded images
                        const images = (canvasState.images || []) as any[];
                        const targetImage = images.find((img: any, idx: number) =>
                            img.elementId === targetNodeId ||
                            `canvas-image-${idx}` === targetNodeId
                        );
                        if (targetImage) {
                            sourceImageUrl = targetImage.url;
                        }
                    }
                }

                // 1. Create Connection if target exists
                if (targetNodeId) {
                    const newConn = {
                        id: `conn-${uuidv4()}`,
                        from: targetNodeId,
                        to: newId,
                        color: '#555555'
                    };
                    if (props.onPersistConnectorCreate) await props.onPersistConnectorCreate(newConn);
                }

                // 2. Create the Plugin Node based on ID
                switch (pluginId) {
                    case 'upscale': {
                        let model = payload.model || 'Crystal Upscaler';
                        if (model === 'Upscale') model = 'Crystal Upscaler';

                        const newModal = {
                            id: newId,
                            x: posX,
                            y: posY,
                            model,
                            scale: 2,
                            frameWidth: 400,
                            frameHeight: 300,
                            sourceImageUrl,
                            isExpanded: true,
                        };
                        if (canvasState.setUpscaleModalStates) {
                            canvasState.setUpscaleModalStates((prev: any) => [...prev, newModal]);
                            if (props.onPersistUpscaleModalCreate) await props.onPersistUpscaleModalCreate(newModal);
                        }
                        break;
                    }
                    case 'remove-bg': {
                        let model = payload.model || 'Fast Remove BG';
                        if (model === 'Remove BG') model = 'Fast Remove BG';

                        const newModal = {
                            id: newId,
                            x: posX,
                            y: posY,
                            model,
                            frameWidth: 400,
                            frameHeight: 300,
                            sourceImageUrl,
                            isExpanded: true,
                        };
                        if (canvasState.setRemoveBgModalStates) {
                            canvasState.setRemoveBgModalStates((prev: any) => [...prev, newModal]);
                            if (props.onPersistRemoveBgModalCreate) await props.onPersistRemoveBgModalCreate(newModal);
                        }
                        break;
                    }
                    case 'vectorize':
                    case 'vectorize-image': {
                        const newModal = {
                            id: newId,
                            x: posX,
                            y: posY,
                            mode: 'detailed',
                            frameWidth: 400,
                            frameHeight: 300,
                            sourceImageUrl,
                            isExpanded: true,
                        };
                        if (canvasState.setVectorizeModalStates) {
                            canvasState.setVectorizeModalStates((prev: any) => [...prev, newModal]);
                            if (props.onPersistVectorizeModalCreate) await props.onPersistVectorizeModalCreate(newModal);
                        }
                        break;
                    }
                    case 'erase':
                    case 'erase-replace': {
                        const newModal = {
                            id: newId,
                            x: posX,
                            y: posY,
                            model: 'Flux-1.1-Pro-Fill',
                            frameWidth: 500,
                            frameHeight: 400,
                            sourceImageUrl,
                            isExpanded: true,
                        };
                        if (canvasState.setEraseModalStates) {
                            canvasState.setEraseModalStates((prev: any) => [...prev, newModal]);
                            if (props.onPersistEraseModalCreate) await props.onPersistEraseModalCreate(newModal);
                        }
                        break;
                    }
                    case 'expand':
                    case 'expand-image':
                    case 'outpaint': {
                        const newModal = {
                            id: newId,
                            x: posX,
                            y: posY,
                            model: 'Flux-1.1-Pro-Fill',
                            frameWidth: 500,
                            frameHeight: 400,
                            sourceImageUrl,
                            isExpanded: true,
                        };
                        if (canvasState.setExpandModalStates) {
                            canvasState.setExpandModalStates((prev: any) => [...prev, newModal]);
                            if (props.onPersistExpandModalCreate) await props.onPersistExpandModalCreate(newModal);
                        }
                        break;
                    }
                    case 'camera':
                    case 'multiangle':
                    case 'multiangle-camera': {
                        const newModal = {
                            id: newId,
                            x: posX,
                            y: posY,
                            sourceImageUrl,
                            isExpanded: true,
                        };
                        if (canvasState.setMultiangleCameraModalStates) {
                            canvasState.setMultiangleCameraModalStates((prev: any) => [...prev, newModal]);
                            if (props.onPersistMultiangleCameraModalCreate) await props.onPersistMultiangleCameraModalCreate(newModal);
                        }
                        break;
                    }
                }
                break;
            }
        }
    }, [getViewportCenter, canvasState, canvasSelection, props]);

    return { executeIntent };
}
