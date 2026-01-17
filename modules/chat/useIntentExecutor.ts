
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { IntentAction } from './intentSchemas';
import { CanvasInstructionPlan } from './compiler/types';

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
            const plan = action.payload as CanvasInstructionPlan;
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
                                    imageCount: step.configTemplate.imageCount || 1,
                                    initialCount: step.configTemplate.imageCount || 1,
                                    resolution: '1024',
                                    frameWidth: 600,
                                    frameHeight: 400,
                                    isGenerating: true, // This needs to be true for auto-start                         };
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

                    case 'DELETE_NODE': {
                        const targetType = step.targetType; // 'image', 'video', 'text', 'music', 'plugin', 'all'
                        const targetIds = step.targetIds || [];
                        const deleteMap: Record<string, boolean> = {};
                        targetIds.forEach((id: string) => deleteMap[id] = true);

                        // Helper to determine if an individual item should be deleted
                        const shouldDelete = (id: string, itemType: string) => {
                            if (targetType === 'all') {
                                return targetIds.length > 0 ? deleteMap[id] : true;
                            }
                            if (targetType === itemType) {
                                return targetIds.length > 0 ? deleteMap[id] : true;
                            }
                            // Plugin subtypes are handled by filtering the handlers list before calling this
                            return false;
                        };

                        // Helper to update state AND persist deletion
                        const processDeletion = (
                            items: any[],
                            setter: any,
                            persistFn: ((id: string) => void) | undefined,
                            typeTag: string
                        ) => {
                            if (!setter) return;

                            const safeItems = items || [];
                            const idsToDelete: string[] = [];

                            safeItems.forEach((item: any) => {
                                // If we are targeting specific IDs, we can just check those. 
                                // But if deleting "all videos", we need to check 'video' type matches.
                                if (shouldDelete(item.id, typeTag)) {
                                    idsToDelete.push(item.id);
                                }
                            });

                            if (idsToDelete.length > 0) {
                                // 1. Local State Update
                                setter((prev: any[]) => prev.filter((item: any) => !idsToDelete.includes(item.id)));

                                // 2. Persistence Call
                                if (persistFn) {
                                    idsToDelete.forEach(id => {
                                        // Fire and forget persistence
                                        persistFn(id);
                                    });
                                }
                            }
                        };

                        // Definition of all comprehensive handlers
                        const handlers = [
                            // Core Media
                            { type: 'image', subtype: null, items: canvasState.imageModalStates, setter: canvasState.setImageModalStates, persist: props.onPersistImageModalDelete },
                            { type: 'video', subtype: null, items: canvasState.videoModalStates, setter: canvasState.setVideoModalStates, persist: props.onPersistVideoModalDelete },
                            { type: 'music', subtype: null, items: canvasState.musicModalStates, setter: canvasState.setMusicModalStates, persist: props.onPersistMusicModalDelete },
                            { type: 'text', subtype: null, items: canvasState.richTextStates, setter: canvasState.setRichTextStates, persist: props.onPersistRichTextDelete },

                            // Plugins
                            { type: 'plugin', subtype: 'upscale', items: canvasState.upscaleModalStates, setter: canvasState.setUpscaleModalStates, persist: props.onPersistUpscaleModalDelete },
                            { type: 'plugin', subtype: 'multiangle', items: canvasState.multiangleCameraModalStates, setter: canvasState.setMultiangleCameraModalStates, persist: props.onPersistMultiangleCameraModalDelete },
                            { type: 'plugin', subtype: 'remove-bg', items: canvasState.removeBgModalStates, setter: canvasState.setRemoveBgModalStates, persist: props.onPersistRemoveBgModalDelete },
                            { type: 'plugin', subtype: 'erase', items: canvasState.eraseModalStates, setter: canvasState.setEraseModalStates, persist: props.onPersistEraseModalDelete },
                            { type: 'plugin', subtype: 'expand', items: canvasState.expandModalStates, setter: canvasState.setExpandModalStates, persist: props.onPersistExpandModalDelete },
                            { type: 'plugin', subtype: 'vectorize', items: canvasState.vectorizeModalStates, setter: canvasState.setVectorizeModalStates, persist: props.onPersistVectorizeModalDelete },
                            { type: 'plugin', subtype: 'next-scene', items: canvasState.nextSceneModalStates, setter: canvasState.setNextSceneModalStates, persist: props.onPersistNextSceneModalDelete },
                            { type: 'plugin', subtype: 'storyboard', items: canvasState.storyboardModalStates, setter: canvasState.setStoryboardModalStates, persist: props.onPersistStoryboardModalDelete },
                            { type: 'plugin', subtype: 'compare', items: canvasState.compareModalStates, setter: canvasState.setCompareModalStates, persist: props.onPersistCompareModalDelete },
                            { type: 'plugin', subtype: 'video-editor', items: canvasState.videoEditorModalStates, setter: canvasState.setVideoEditorModalStates, persist: props.onPersistVideoEditorModalDelete },
                            { type: 'plugin', subtype: 'image-editor', items: canvasState.imageEditorModalStates, setter: canvasState.setImageEditorModalStates, persist: props.onPersistImageEditorModalDelete },
                        ];

                        // Execute handlers based on target
                        handlers.forEach(h => {
                            // 1. If target is 'all', matches everything.
                            // 2. If target matches handler type (e.g. 'image').
                            // 3. If target is 'plugin' and handler is 'plugin':
                            //    - If step.pluginType is defined, must match handler subtype.
                            //    - If step.pluginType is undefined, matches all plugins.

                            let isMatch = false;
                            if (targetType === 'all') {
                                isMatch = true;
                            } else if (targetType === h.type) {
                                if (h.type === 'plugin') {
                                    // Check granularity
                                    if (step.pluginType) {
                                        isMatch = step.pluginType === h.subtype;
                                    } else {
                                        isMatch = true; // "Delete all plugins"
                                    }
                                } else {
                                    isMatch = true;
                                }
                            }

                            if (isMatch) {
                                // For 'plugin' type, we pass 'plugin' as typeTag to match the targetType check in shouldDelete,
                                // OR we pass the specific type if we want to be strict.
                                // However, shouldDelete checks if (targetType === type).
                                // If targetType is 'plugin', we should pass 'plugin'.
                                // If targetType is 'all', we pass whatever.
                                // Simplification: pass h.type (properties: 'image' or 'plugin').
                                processDeletion(h.items, h.setter, h.persist, h.type);
                            }
                        });


                        // 3. Clear Selection if deleted broad
                        if (targetType === 'all' && targetIds.length === 0) {
                            if (canvasSelection && canvasSelection.setSelectedIds) {
                                canvasSelection.setSelectedIds([]);
                            }
                        }

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
