
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { IntentAction } from './intentSchemas';
import { CanvasInstructionPlan } from './compiler/types';
import { getStorageInfo, getCurrentUser } from '@/core/api/api';

interface IntentExecutorProps {
    canvasState: any;
    canvasSelection: any;
    props: any;
    viewportSize: { width: number; height: number };
    position: { x: number; y: number };
    scale: number;
    onShowStorageWarning?: () => void;
}

export function useIntentExecutor({
    canvasState,
    canvasSelection,
    props,
    viewportSize,
    position,
    scale,
    onShowStorageWarning,
}: IntentExecutorProps) {

    const getViewportCenter = useCallback(() => {
        return {
            x: (viewportSize.width / 2 - position.x) / scale,
            y: (viewportSize.height / 2 - position.y) / scale,
        };
    }, [viewportSize, position, scale]);

    const executeIntent = useCallback(async (action: IntentAction) => {
        console.log('[IntentExecutor] Executing action:', action);

        // Storage Validation
        if (action.intent === 'EXECUTE_PLAN' && onShowStorageWarning) {
             try {
                const user = await getCurrentUser();
                if (user?.uid) {
                    const storageInfo = await getStorageInfo(user.uid);
                    const quota = BigInt(storageInfo.quotaBytes);
                    const used = BigInt(storageInfo.usedBytes);
                    
                    if (quota > 0 && used >= quota) {
                        console.warn('[IntentExecutor] Storage limit reached. Blocking execution.');
                        onShowStorageWarning();
                        return;
                    }
                }
             } catch (error) {
                 console.error('[IntentExecutor] Storage check failed:', error);
             }
        }

        const center = getViewportCenter();
        const resolveCanvasImageNodeId = (rawId: string): string => {
            if (!rawId) return rawId;
            const images = canvasState?.images;
            if (!Array.isArray(images) || images.length === 0) return rawId;
            // CanvasImageConnectionNodes uses: imageData.elementId || `canvas-image-${actualIndex}`
            for (let idx = 0; idx < images.length; idx++) {
                const img = images[idx];
                if (!img) continue;
                if (img.elementId === rawId || img.id === rawId) {
                    return (img.elementId || `canvas-image-${idx}`) as string;
                }
            }
            return rawId;
        };

        // EXECUTION ENGINE: Process CanvasInstructionPlan
        if (action.intent === 'EXECUTE_PLAN') {
            const plan = action.payload as CanvasInstructionPlan;
            const steps = plan.steps;
            const stepToNodeIds: Record<string, string[]> = {};

            console.log(`[Executor] ===== STARTING PLAN EXECUTION =====`);
            console.log(`[Executor] Total steps: ${steps.length}`);
            steps.forEach((step, idx) => {
                const nodeType = (step as any).nodeType || 'N/A';
                console.log(`[Executor] Step ${idx + 1}: ${step.action} - ${nodeType} (id: ${step.id})`);
            });

            // ✅ FIX: Improved Layout - Images in left column, Videos in right column
            // Calculate layout dimensions
            const FRAME_WIDTH = 600;
            const FRAME_HEIGHT = 400;
            const VERTICAL_SPACING = 500; // Space between frames in same column
            const COLUMN_GAP = 800; // Horizontal gap between image and video columns
            // 3-column layout:
            // - Left: user reference images (already on canvas)
            // - Middle: generated scene-frame images (img2img uses targetIds)
            // - Right: video frames
            const SCENE_COLUMN_X = center.x; // middle column for scene frames
            
            // Track image and video counts for proper positioning
            let imageCount = 0;
            let videoCount = 0;
            
            // Pre-count images and videos to center them properly
            steps.forEach(step => {
                if (step.action === 'CREATE_NODE') {
                    if ((step as any).nodeType === 'image-generator') {
                        imageCount += (step.count || 1);
                    } else if ((step as any).nodeType === 'video-generator') {
                        videoCount += (step.count || 1);
                    }
                }
            });
            
            // Left column (images) - centered vertically
            const IMAGE_COLUMN_X = center.x - COLUMN_GAP / 2;
            const IMAGE_START_Y = center.y - ((imageCount - 1) * VERTICAL_SPACING) / 2;
            
            // Right column (videos) - centered vertically
            const VIDEO_COLUMN_X = center.x + COLUMN_GAP / 2;
            const VIDEO_START_Y = center.y - ((videoCount - 1) * VERTICAL_SPACING) / 2;
            
            // Track current positions
            let currentImageIndex = 0;
            let currentVideoIndex = 0;
            
            // Fallback for other node types
            let currentX = center.x - 400;
            let currentY = center.y - 200;
            const X_SPACING = 500;

            for (const step of steps) {
                switch (step.action) {
                    case 'CREATE_NODE': {
                        const newIds: string[] = [];
                        const count = step.count || 1;

                        // ✅ FIX: Handle image-generator FIRST with an early path.
                        // The current control-flow below can skip image creation entirely due to brace/flow issues.
                        if (step.nodeType === 'image-generator') {
                            const nodeCount = count;
                            const batchConfigs = step.batchConfigs || [];

                            console.log(`[Executor] ✅ Creating ${nodeCount} image node(s) (early path)`, {
                                stepId: step.id,
                                nodeCount,
                                batchConfigs: batchConfigs.length
                            });

                            for (let imgIdx = 0; imgIdx < nodeCount; imgIdx++) {
                                const newId = `image-${uuidv4()}`;
                                const batchConfig = batchConfigs[imgIdx] || {};
                                const imgPrompt = batchConfig.prompt || step.configTemplate.prompt;

                                // Img2Img / Auto-Connect Logic
                                const explicitTargets = (step as any).configTemplate?.targetIds;
                                const targetIds = (explicitTargets && explicitTargets.length > 0)
                                    ? explicitTargets
                                    : (canvasSelection.selectedIds || []);

                                let sourceImageConfig: any = {};
                                let sourceId: string | null = null;

                                if (targetIds.length > 0) {
                                    sourceId = targetIds[0];
                                    const sourceModal = canvasState.imageModalStates?.find((m: any) => m.id === sourceId);
                                    const sourceUpload = canvasState.images?.find((img: any) => img.elementId === sourceId || img.id === sourceId);

                                    if (sourceModal) {
                                        sourceImageConfig = {
                                            frameWidth: sourceModal.frameWidth,
                                            frameHeight: sourceModal.frameHeight,
                                            sourceImageUrl: sourceModal.generatedImageUrl || sourceModal.url,
                                            aspectRatio: sourceModal.aspectRatio
                                        };
                                    } else if (sourceUpload) {
                                        sourceImageConfig = {
                                            frameWidth: sourceUpload.width,
                                            frameHeight: sourceUpload.height,
                                            sourceImageUrl: sourceUpload.url
                                        };
                                    }
                                }

                                // Position: left column, vertical stack
                                const isSceneFrame = Array.isArray((step as any).configTemplate?.targetIds) && (step as any).configTemplate.targetIds.length > 0;
                                const imagePosX = isSceneFrame ? SCENE_COLUMN_X : IMAGE_COLUMN_X;
                                const imagePosY = IMAGE_START_Y + (currentImageIndex * VERTICAL_SPACING);
                                currentImageIndex++;

                                const imgResolution = (batchConfig as any)?.resolution || step.configTemplate.resolution || '1024';

                                const newModal = {
                                    id: newId,
                                    x: imagePosX,
                                    y: imagePosY,
                                    prompt: imgPrompt,
                                    model: step.configTemplate.model,
                                    aspectRatio: step.configTemplate.aspectRatio || '1:1',
                                    imageCount: 1,
                                    initialCount: 1,
                                    resolution: imgResolution,
                                    frameWidth: 600,
                                    frameHeight: 400,
                                    isGenerating: true,
                                    ...sourceImageConfig
                                };

                                if (canvasState.setImageModalStates) {
                                    canvasState.setImageModalStates((prev: any) => [...prev, newModal]);
                                } else {
                                    console.error('[Executor] ❌ setImageModalStates is not available on canvasState');
                                }

                                if (props.onPersistImageModalCreate) {
                                    await props.onPersistImageModalCreate(newModal);
                                } else {
                                    console.warn('[Executor] ⚠️ onPersistImageModalCreate not available; image will not persist');
                                }

                                newIds.push(newId);

                                // Create connectors from ALL selected reference images to this scene frame (3-column chain)
                                if (props.onPersistConnectorCreate) {
                                    const uniqueTargets = Array.from(new Set(targetIds)).filter(Boolean);
                                    for (const fromIdRaw of uniqueTargets) {
                                        const fromId = resolveCanvasImageNodeId(String(fromIdRaw));
                                        if (!fromId || fromId === newId) continue;
                                        await props.onPersistConnectorCreate({
                                            id: `conn-${uuidv4()}`,
                                            from: fromId,
                                            to: newId,
                                            color: '#555555'
                                        });
                                    }
                                }
                            }

                            // Store mapping for this step
                            stepToNodeIds[step.id] = [...newIds];

                            console.log(`[Executor] ✅ Step "${step.id}" completed (image-generator early path):`, {
                                stepId: step.id,
                                action: step.action,
                                nodeType: (step as any).nodeType,
                                createdNodes: newIds.length,
                                nodeIds: newIds
                            });

                            // Advance layout cursor for next step
                            currentX += X_SPACING;
                            break;
                        }
                        
                        // ✅ Handle image-generator separately (outside the general loop)
                        if ((step as any).nodeType === 'image-generator') {
                            // Skip the general loop - images handled below
                        } else {
                            // Handle video-generator and other types in the loop
                            for (let i = 0; i < count; i++) {
                                // ✅ Calculate position based on node type
                                let posX: number;
                                let posY: number;
                                
                                if (step.nodeType === 'video-generator') {
                                    // Videos in right column, vertical layout
                                    posX = VIDEO_COLUMN_X;
                                    posY = VIDEO_START_Y + (currentVideoIndex * VERTICAL_SPACING);
                                    currentVideoIndex++;
                                    console.log(`[Executor] Video ${currentVideoIndex} position: (${posX}, ${posY})`);
                                } else {
                                    // Other node types: use fallback horizontal flow
                                    posX = currentX + (i * 250);
                                    posY = currentY;
                                }

                                const batchConfig = step.batchConfigs?.[i] || {};
                                const nodePrompt = batchConfig.prompt || step.configTemplate.prompt;
                                // Use duration from step config, default to 6 seconds for image-to-video (matching compileImageAnimate default)
                                const nodeDuration = batchConfig.duration ?? step.configTemplate.duration ?? 6;
                                // Get resolution from step config
                                const nodeResolution = batchConfig.resolution || step.configTemplate.resolution;

                                if (step.nodeType === 'video-generator') {
                                const newId = `video-${uuidv4()}`;
                                const config = step.configTemplate;
                                
                                console.log(`[Executor] ✅ Creating video ${currentVideoIndex + 1} at position (${posX}, ${posY})`);

                                const newModal = {
                                    id: newId,
                                    x: posX,
                                    y: posY,
                                    prompt: nodePrompt,
                                    model: config.model,
                                    aspectRatio: config.aspectRatio || '16:9',
                                    duration: nodeDuration,
                                    resolution: nodeResolution,
                                    frameWidth: 600,
                                    frameHeight: 400,
                                };
                                
                                console.log(`[Executor] Video modal created:`, {
                                    id: newId,
                                    position: { x: posX, y: posY },
                                    model: config.model,
                                    duration: nodeDuration
                                });
                                
                                canvasState.setVideoModalStates((prev: any) => [...prev, newModal]);
                                if (props.onPersistVideoModalCreate) {
                                    await props.onPersistVideoModalCreate(newModal);
                                    console.log(`[Executor] Video persisted: ${newId}`);
                                } else {
                                    console.error(`[Executor] ❌ ERROR: onPersistVideoModalCreate is not available!`);
                                }
                                newIds.push(newId);
                                stepToNodeIds[step.id] = stepToNodeIds[step.id] || [];
                                stepToNodeIds[step.id].push(newId);
                                
                                console.log(`[Executor] Video ${newId} added to step ${step.id}, total videos in step: ${stepToNodeIds[step.id].length}`);

                                // ✅ FIX: Connect frame images to video node using new connectToFrames structure
                                if (config.connectToFrames) {
                                    const connConfig = config.connectToFrames;
                                    
                                    console.log(`[Executor] Video ${newId} connecting frames:`, {
                                        connectionType: connConfig.connectionType,
                                        hasUserUpload: !!(connConfig.firstFrameSource === "USER_UPLOAD" || connConfig.frameSource === "USER_UPLOAD")
                                    });
                                    
                                    if (connConfig.connectionType === "FIRST_LAST_FRAME") {
                                        // Connect first frame
                                        let firstFrameNodeId: string | undefined;
                                        if (connConfig.firstFrameSource === "USER_UPLOAD") {
                                            firstFrameNodeId = connConfig.firstFrameId;
                                            console.log(`[Executor] Using user-uploaded image as first frame: ${firstFrameNodeId}`);
                                        } else {
                                            const sourceNodeIds = stepToNodeIds[connConfig.firstFrameStepId];
                                            console.log(`[Executor] FIRST_LAST_FRAME - Looking for first frame:`, {
                                                stepId: connConfig.firstFrameStepId,
                                                frameIndex: connConfig.firstFrameIndex,
                                                availableNodeIds: sourceNodeIds,
                                                nodeCount: sourceNodeIds?.length || 0,
                                                selectedNodeId: sourceNodeIds?.[connConfig.firstFrameIndex]
                                            });
                                            if (sourceNodeIds && Array.isArray(sourceNodeIds)) {
                                                if (connConfig.firstFrameIndex >= 0 && connConfig.firstFrameIndex < sourceNodeIds.length) {
                                                    firstFrameNodeId = sourceNodeIds[connConfig.firstFrameIndex];
                                                    console.log(`[Executor] ✅ Found first frame at index ${connConfig.firstFrameIndex}: ${firstFrameNodeId}`);
                                                } else {
                                                    console.error(`[Executor] ❌ Invalid first frame index: ${connConfig.firstFrameIndex} (array length: ${sourceNodeIds.length})`);
                                                }
                                            } else {
                                                console.error(`[Executor] ❌ Source node IDs not found for step: ${connConfig.firstFrameStepId}`);
                                            }
                                        }
                                        
                                        // Connect last frame
                                        let lastFrameNodeId: string | undefined;
                                        if (connConfig.lastFrameSource === "USER_UPLOAD") {
                                            lastFrameNodeId = connConfig.lastFrameId;
                                            console.log(`[Executor] Using user-uploaded image as last frame: ${lastFrameNodeId}`);
                                        } else {
                                            const sourceNodeIds = stepToNodeIds[connConfig.lastFrameStepId];
                                            console.log(`[Executor] FIRST_LAST_FRAME - Looking for last frame:`, {
                                                stepId: connConfig.lastFrameStepId,
                                                frameIndex: connConfig.lastFrameIndex,
                                                availableNodeIds: sourceNodeIds,
                                                nodeCount: sourceNodeIds?.length || 0,
                                                selectedNodeId: sourceNodeIds?.[connConfig.lastFrameIndex]
                                            });
                                            if (sourceNodeIds && Array.isArray(sourceNodeIds)) {
                                                if (connConfig.lastFrameIndex >= 0 && connConfig.lastFrameIndex < sourceNodeIds.length) {
                                                    lastFrameNodeId = sourceNodeIds[connConfig.lastFrameIndex];
                                                    console.log(`[Executor] ✅ Found last frame at index ${connConfig.lastFrameIndex}: ${lastFrameNodeId}`);
                                                } else {
                                                    console.error(`[Executor] ❌ Invalid last frame index: ${connConfig.lastFrameIndex} (array length: ${sourceNodeIds.length})`);
                                                }
                                            } else {
                                                console.error(`[Executor] ❌ Source node IDs not found for step: ${connConfig.lastFrameStepId}`);
                                            }
                                        }
                                        
                                        console.log(`[Executor] FIRST_LAST_FRAME Connection Summary:`, {
                                            videoId: newId,
                                            firstFrame: firstFrameNodeId,
                                            lastFrame: lastFrameNodeId,
                                            firstFrameIndex: connConfig.firstFrameIndex,
                                            lastFrameIndex: connConfig.lastFrameIndex
                                        });
                                        
                                        // ✅ FIX: Ensure exactly 2 connections (first + last frame only)
                                        if (firstFrameNodeId && lastFrameNodeId) {
                                            // First frame connection
                                            const conn1 = {
                                                id: `conn-first-${uuidv4()}`,
                                                from: firstFrameNodeId,
                                                to: newId,
                                                color: '#3b82f6', // Blue for first frame
                                                label: 'First Frame',
                                                strokeWidth: 2
                                            };
                                            if (props.onPersistConnectorCreate) {
                                                await props.onPersistConnectorCreate(conn1);
                                                console.log(`[Executor] ✅ Connected FIRST frame: ${firstFrameNodeId} → ${newId}`);
                                            }
                                            
                                            // Last frame connection
                                            const conn2 = {
                                                id: `conn-last-${uuidv4()}`,
                                                from: lastFrameNodeId,
                                                to: newId,
                                                color: '#ef4444', // Red for last frame
                                                label: 'Last Frame',
                                                strokeWidth: 2
                                            };
                                            if (props.onPersistConnectorCreate) {
                                                await props.onPersistConnectorCreate(conn2);
                                                console.log(`[Executor] ✅ Connected LAST frame: ${lastFrameNodeId} → ${newId}`);
                                            }
                                            
                                            console.log(`[Executor] ✅ FIRST_LAST_FRAME: Connected exactly 2 frames to video ${newId}`);
                                            
                                            // ✅ Log detailed connection summary for debugging
                                            const allFrames = stepToNodeIds[connConfig.firstFrameStepId] || [];
                                            console.log(`[Executor] 📊 Connection Summary for Video ${newId}:`, {
                                                videoIndex: (stepToNodeIds[step.id]?.length || 1) - 1,
                                                firstFrame: {
                                                    nodeId: firstFrameNodeId,
                                                    index: connConfig.firstFrameIndex,
                                                    stepId: connConfig.firstFrameStepId
                                                },
                                                lastFrame: {
                                                    nodeId: lastFrameNodeId,
                                                    index: connConfig.lastFrameIndex,
                                                    stepId: connConfig.lastFrameStepId
                                                },
                                                allAvailableFrames: allFrames,
                                                frameCount: allFrames.length
                                            });
                                        } else {
                                            console.error(`[Executor] ❌ Missing frames for FIRST_LAST_FRAME:`, {
                                                firstFrame: firstFrameNodeId,
                                                lastFrame: lastFrameNodeId,
                                                videoId: newId,
                                                firstFrameStepId: connConfig.firstFrameStepId,
                                                firstFrameIndex: connConfig.firstFrameIndex,
                                                lastFrameStepId: connConfig.lastFrameStepId,
                                                lastFrameIndex: connConfig.lastFrameIndex,
                                                stepToNodeIds: Object.keys(stepToNodeIds),
                                                availableFrames: stepToNodeIds[connConfig.firstFrameStepId] || []
                                            });
                                        }
                                        
                                    } else if (connConfig.connectionType === "FIRST_FRAME_ONLY") {
                                        // Connect only the first frame (single image to video)
                                        let firstFrameNodeId: string | undefined;
                                        if (connConfig.firstFrameSource === "USER_UPLOAD") {
                                            firstFrameNodeId = resolveCanvasImageNodeId(connConfig.firstFrameId);
                                            console.log(`[Executor] Using user-uploaded image as first frame: ${firstFrameNodeId}`);
                                        } else if (connConfig.firstFrameStepId) {
                                            const sourceNodeIds = stepToNodeIds[connConfig.firstFrameStepId];
                                            if (sourceNodeIds && Array.isArray(sourceNodeIds)) {
                                                const frameIndex = connConfig.firstFrameIndex ?? 0;
                                                if (frameIndex >= 0 && frameIndex < sourceNodeIds.length) {
                                                    firstFrameNodeId = sourceNodeIds[frameIndex];
                                                    console.log(`[Executor] ✅ Found first frame at index ${frameIndex}: ${firstFrameNodeId}`);
                                                }
                                            }
                                        }
                                        
                                        if (firstFrameNodeId) {
                                            const conn = {
                                                id: `conn-first-only-${uuidv4()}`,
                                                from: firstFrameNodeId,
                                                to: newId,
                                                color: '#3b82f6', // Blue for first frame
                                                label: 'First Frame',
                                                strokeWidth: 2
                                            };
                                            if (props.onPersistConnectorCreate) {
                                                await props.onPersistConnectorCreate(conn);
                                                console.log(`[Executor] ✅ Connected FIRST_FRAME_ONLY: ${firstFrameNodeId} → ${newId}`);
                                            }
                                        } else {
                                            console.error(`[Executor] ❌ Missing first frame for FIRST_FRAME_ONLY connection`);
                                        }
                                    } else if (connConfig.connectionType === "IMAGE_TO_VIDEO") {
                                        
                                        let frameNodeId: string | undefined;
                                        if (connConfig.frameSource === "USER_UPLOAD") {
                                            frameNodeId = connConfig.frameId;
                                            console.log(`[Executor] Using user-uploaded image: ${frameNodeId}`);
                                        } else {
                                            const sourceNodeIds = stepToNodeIds[connConfig.frameStepId];
                                            if (sourceNodeIds && Array.isArray(sourceNodeIds)) {
                                                frameNodeId = sourceNodeIds[connConfig.frameIndex];
                                            }
                                        }
                                        
                                        console.log(`[Executor] Connecting IMAGE_TO_VIDEO: ${frameNodeId} → ${newId}`);
                                        
                                        if (frameNodeId) {
                                            const conn = {
                                                id: `conn-${uuidv4()}`,
                                                from: frameNodeId,
                                                to: newId,
                                                color: '#555555',
                                                label: 'Source Frame'
                                            };
                                            if (props.onPersistConnectorCreate) {
                                                await props.onPersistConnectorCreate(conn);
                                            }
                                        } else {
                                            console.warn(`[Executor] ⚠️ Frame not found`);
                                        }
                                    }
                                } else {
                                    // Fallback: Original auto-connect logic for selected images
                                    const explicitTargets = step.configTemplate.targetIds;
                                    const targetIds = (explicitTargets && explicitTargets.length > 0)
                                        ? explicitTargets
                                        : (canvasSelection.selectedIds || []);

                                    if (targetIds.length >= 1) {
                                        const firstFrameId = targetIds[0];
                                        const firstConn = {
                                            id: `conn-${uuidv4()}`,
                                            from: firstFrameId,
                                            to: newId,
                                            color: '#555555'
                                        };
                                        if (props.onPersistConnectorCreate) {
                                            await props.onPersistConnectorCreate(firstConn);
                                        }

                                        if (targetIds.length >= 2) {
                                            const lastFrameId = targetIds[1];
                                            const lastConn = {
                                        id: `conn-${uuidv4()}`,
                                                from: lastFrameId,
                                        to: newId,
                                        color: '#555555'
                                    };
                                    if (props.onPersistConnectorCreate) {
                                                await props.onPersistConnectorCreate(lastConn);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        // ✅ Handle image-generator separately (outside the loop)
                        // Fallback layout locals for non-image nodes in this legacy chain
                        const fallbackPosX = currentX;
                        const fallbackPosY = currentY;
                        const fallbackNodePrompt = (step.batchConfigs?.[0] as any)?.prompt || step.configTemplate?.prompt;

                        if ((step as any).nodeType === 'image-generator') {
                            // ✅ FIX: Create individual nodes for each image (needed for frame references)
                            const nodeCount = step.count || 1;
                            const batchConfigs = step.batchConfigs || [];
                            
                            // ✅ VALIDATION: Ensure batchConfigs doesn't exceed nodeCount
                            const actualConfigCount = Math.min(batchConfigs.length, nodeCount);
                            if (batchConfigs.length > nodeCount) {
                                console.warn(`[Executor] ⚠️ Warning: batchConfigs (${batchConfigs.length}) exceeds nodeCount (${nodeCount}). Using first ${nodeCount} configs.`);
                            }
                            
                            console.log(`[Executor] Creating ${nodeCount} image node(s)`, {
                                stepId: step.id,
                                batchConfigs: batchConfigs.length,
                                actualConfigCount,
                                nodeCount
                            });
                            
                            // ✅ FIX: Create exactly nodeCount nodes, not more
                            // Create one node per image (for proper frame referencing)
                            for (let imgIdx = 0; imgIdx < nodeCount; imgIdx++) {
                                const newId = `image-${uuidv4()}`;
                                const batchConfig = batchConfigs[imgIdx] || {};
                                const imgPrompt = batchConfig.prompt || step.configTemplate.prompt;

                                    // Img2Img / Auto-Connect Logic
                                    const explicitTargets = step.configTemplate.targetIds;
                                    const targetIds = (explicitTargets && explicitTargets.length > 0)
                                        ? explicitTargets
                                        : (canvasSelection.selectedIds || []);

                                    let sourceImageConfig = {};
                                    let sourceId: string | null = null;

                                    if (targetIds.length > 0) {
                                        sourceId = targetIds[0];
                                        const sourceModal = canvasState.imageModalStates?.find((m: any) => m.id === sourceId);
                                        const sourceUpload = canvasState.images?.find((img: any) => img.elementId === sourceId || img.id === sourceId);

                                        if (sourceModal) {
                                            sourceImageConfig = {
                                                frameWidth: sourceModal.frameWidth,
                                                frameHeight: sourceModal.frameHeight,
                                                sourceImageUrl: sourceModal.generatedImageUrl || sourceModal.url,
                                                aspectRatio: sourceModal.aspectRatio
                                            };
                                        } else if (sourceUpload) {
                                            sourceImageConfig = {
                                                frameWidth: sourceUpload.width,
                                                frameHeight: sourceUpload.height,
                                                sourceImageUrl: sourceUpload.url
                                            };
                                        }
                                    }

                                    // ✅ Calculate position for images in vertical column
                                    const imagePosX = IMAGE_COLUMN_X;
                                    const imagePosY = IMAGE_START_Y + (currentImageIndex * VERTICAL_SPACING);
                                    
                                    console.log(`[Executor] Creating image ${currentImageIndex + 1} at position (${imagePosX}, ${imagePosY})`);
                                    
                                    const newModal = {
                                        id: newId,
                                        x: imagePosX,
                                        y: imagePosY,
                                        prompt: imgPrompt,
                                    model: step.configTemplate.model,
                                    aspectRatio: step.configTemplate.aspectRatio || '1:1',
                                        imageCount: 1,
                                        initialCount: 1,
                                    resolution: (batchConfig as any)?.resolution || step.configTemplate.resolution || '1024',
                                        frameWidth: 600,
                                        frameHeight: 400,
                                        isGenerating: true,
                                        ...sourceImageConfig
                                    };
                                    
                                    canvasState.setImageModalStates((prev: any) => [...prev, newModal]);
                                    if (props.onPersistImageModalCreate) await props.onPersistImageModalCreate(newModal);
                                    newIds.push(newId);
                                    
                                    // Increment image index for next image
                                    currentImageIndex++;

                                    // Create Connection if source existed
                                    if (sourceId) {
                                        const newConn = {
                                            id: `conn-${uuidv4()}`,
                                            from: sourceId,
                                            to: newId,
                                            color: '#555555'
                                        };
                                        if (props.onPersistConnectorCreate) {
                                            await props.onPersistConnectorCreate(newConn);
                                        }
                                    }
                                }
                                
                                // ✅ FIX: Store all image node IDs in stepToNodeIds for frame references
                                // IMPORTANT: Replace the array, don't append, to ensure correct order
                                const imageNodeIds = newIds.filter(id => id.startsWith('image-'));
                                stepToNodeIds[step.id] = [...imageNodeIds]; // Create new array copy to ensure clean state
                                
                                console.log(`[Executor] ✅ Created ${imageNodeIds.length} image nodes for step ${step.id}:`, {
                                    stepId: step.id,
                                    nodeIds: imageNodeIds,
                                    nodeCount: imageNodeIds.length,
                                    expectedCount: nodeCount,
                                    batchConfigsCount: batchConfigs.length,
                                    storedInStepToNodeIds: stepToNodeIds[step.id]
                                });
                                
                                // Verify order matches frame prompts
                                if (batchConfigs.length > 0 && batchConfigs.length === imageNodeIds.length) {
                                    console.log(`[Executor] 📋 Frame order verification (${imageNodeIds.length} frames):`);
                                    imageNodeIds.forEach((id, idx) => {
                                        const prompt = batchConfigs[idx]?.prompt || 'N/A';
                                        const isFirst = idx % 2 === 0;
                                        const isLast = idx % 2 === 1;
                                        const segmentNum = Math.floor(idx / 2) + 1;
                                        console.log(`[Executor]   Frame ${idx}: ${id} (Segment ${segmentNum} ${isFirst ? 'FIRST' : 'LAST'}) - "${prompt.substring(0, 60)}..."`);
                                    });
                                }
                            }
                        if (step.nodeType === 'music-generator') {
                                const newId = `music-${uuidv4()}`;
                                const newModal = {
                                    id: newId,
                                    x: fallbackPosX,
                                    y: fallbackPosY,
                                    prompt: fallbackNodePrompt,
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
                            if (step.nodeType === 'text') {
                                const newId = `text-${uuidv4()}`;
                                const newText = {
                                    id: newId,
                                    x: fallbackPosX,
                                    y: fallbackPosY,
                                    text: step.configTemplate.content || fallbackNodePrompt || "New Text",
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
                            if (step.nodeType === 'plugin') {
                                const pluginType = step.configTemplate.pluginType || 'upscale';
                                const newId = `${pluginType}-${uuidv4()}`;

                                let setter: any = null;
                                let persister: any = null;

                                switch (pluginType) {
                                    case 'upscale':
                                        setter = canvasState.setUpscaleModalStates;
                                        persister = props.onPersistUpscaleModalCreate;
                                        break;
                                    case 'remove-bg':
                                        setter = canvasState.setRemoveBgModalStates;
                                        persister = props.onPersistRemoveBgModalCreate;
                                        break;
                                    case 'multiangle':
                                        setter = canvasState.setMultiangleCameraModalStates;
                                        persister = props.onPersistMultiangleCameraModalCreate;
                                        break;
                                    case 'vectorize':
                                        setter = canvasState.setVectorizeModalStates;
                                        persister = props.onPersistVectorizeModalCreate;
                                        break;
                                    case 'erase':
                                        setter = canvasState.setEraseModalStates;
                                        persister = props.onPersistEraseModalCreate;
                                        break;
                                    case 'expand':
                                        setter = canvasState.setExpandModalStates;
                                        persister = props.onPersistExpandModalCreate;
                                        break;
                                    case 'next-scene':
                                        setter = canvasState.setNextSceneModalStates;
                                        persister = props.onPersistNextSceneModalCreate;
                                        break;
                                    case 'storyboard':
                                        setter = canvasState.setStoryboardModalStates;
                                        persister = props.onPersistStoryboardModalCreate;
                                        break;
                                    case 'compare':
                                        setter = canvasState.setCompareModalStates;
                                        persister = props.onPersistCompareModalCreate;
                                        break;
                                    case 'video-editor':
                                        setter = canvasState.setVideoEditorModalStates;
                                        persister = props.onPersistVideoEditorModalCreate;
                                        break;
                                    case 'image-editor':
                                        setter = canvasState.setImageEditorModalStates;
                                        persister = props.onPersistImageEditorModalCreate;
                                        break;
                                }

                                if (setter) {
                                    const newModal = {
                                        id: newId,
                                        x: fallbackPosX,
                                        y: fallbackPosY,
                                        width: 500,
                                        height: 500,
                                        pluginType: pluginType
                                    };

                                    setter((prev: any) => [...prev, newModal]);
                                    if (persister) await persister(newModal);
                                    newIds.push(newId);

                                    // Auto-Connect to Selected Items (Smart Context)
                                    // If items were selected when this intent was formed, connect them!
                                    const explicitTargets = step.configTemplate.targetIds;
                                    const targetIds = (explicitTargets && explicitTargets.length > 0)
                                        ? explicitTargets
                                        : (canvasSelection.selectedIds || []);

                                    console.log('[IntentExecutor] Auto-Connecting Plugin to:', targetIds);

                                    for (const targetId of targetIds) {
                                        // Simple validation: don't connect to self
                                        if (targetId !== newId) {
                                            const newConn = {
                                                id: `conn-${uuidv4()}`,
                                                from: targetId,
                                                to: newId,
                                                color: '#555555'
                                            };
                                            if (props.onPersistConnectorCreate) {
                                                await props.onPersistConnectorCreate(newConn);
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        stepToNodeIds[step.id] = newIds;
                        
                        // ✅ Log step completion summary
                        console.log(`[Executor] ✅ Step "${step.id}" completed:`, {
                            stepId: step.id,
                            action: step.action,
                            nodeType: (step as any).nodeType,
                            createdNodes: newIds.length,
                            nodeIds: newIds
                        });
                        
                        // Advance Layout Cursor for next step
                        currentX += X_SPACING;
                        break;
                    }

                    case 'CONNECT_SEQUENTIALLY': {
                        const fromIds = stepToNodeIds[step.fromStepId];
                        const toIds = step.toStepId ? stepToNodeIds[step.toStepId] : null;

                        console.log(`[Executor] CONNECT_SEQUENTIALLY: ${step.fromStepId} → ${step.toStepId || 'self'}`, {
                            fromIds: fromIds?.length,
                            toIds: toIds?.length
                        });

                        if (toIds && fromIds && Array.isArray(fromIds) && Array.isArray(toIds)) {
                            // ✅ FIX: Video-to-Video sequential connections
                            // For video-to-video, connect first video to second, second to third, etc.
                            if (fromIds.length === toIds.length && fromIds.length > 1) {
                                // Connect corresponding videos sequentially
                                for (let i = 0; i < fromIds.length - 1; i++) {
                                    const fromId = fromIds[i];
                                    const toId = toIds[i + 1];
                                    
                                    if (fromId && toId) {
                                        console.log(`[Executor] Connecting video-to-video: ${fromId} → ${toId}`);
                                        const newConn = {
                                            id: `conn-${uuidv4()}`,
                                            from: fromId,
                                            to: toId,
                                            color: '#555555'
                                        };
                                        if (props.onPersistConnectorCreate) {
                                            await props.onPersistConnectorCreate(newConn);
                                        }
                                    }
                                }
                            } else {
                            // Connect Step-to-Step (e.g. Image Group -> Video Group)
                            // We connect them 1-to-1 if counts match, otherwise many-to-one or one-to-many
                            const maxLen = Math.max(fromIds.length, toIds.length);
                            for (let i = 0; i < maxLen; i++) {
                                const source = fromIds[i] || fromIds[fromIds.length - 1];
                                const target = toIds[i] || toIds[0];
                                if (source && target) {
                                        console.log(`[Executor] Connecting step-to-step: ${source} → ${target}`);
                                    const newConn = {
                                        id: `conn-${uuidv4()}`,
                                        from: source,
                                        to: target,
                                        color: '#555555'
                                    };
                                    if (props.onPersistConnectorCreate) await props.onPersistConnectorCreate(newConn);
                                }
                            }
                            }
                        } else if (fromIds && Array.isArray(fromIds) && fromIds.length > 1) {
                            // Self-Sequence within a step (e.g., video-1 → video-2 → video-3)
                            // Connect n -> n+1
                            console.log(`[Executor] Self-sequencing ${fromIds.length} nodes`);
                            for (let i = 0; i < fromIds.length - 1; i++) {
                                const newConn = {
                                    id: `conn-${uuidv4()}`,
                                    from: fromIds[i],
                                    to: fromIds[i + 1],
                                    color: '#555555'
                                };
                                if (props.onPersistConnectorCreate) await props.onPersistConnectorCreate(newConn);
                            }
                        } else {
                            console.warn(`[Executor] ⚠️ Cannot connect: fromIds=${!!fromIds}, toIds=${!!toIds}`);
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
                
                // ✅ Final summary after all steps are processed
                console.log(`[Executor] ===== PLAN EXECUTION COMPLETE =====`);
                console.log(`[Executor] Step-to-Node mapping:`, Object.keys(stepToNodeIds).map(stepId => ({
                    stepId,
                    nodeCount: stepToNodeIds[stepId]?.length || 0,
                    nodeIds: stepToNodeIds[stepId]?.slice(0, 5) || [] // Show first 5 for brevity
                })));
                
                // ✅ Verify FIRST_LAST_FRAME connections
                const frameStepId = Object.keys(stepToNodeIds).find(id => id.includes('frame') || id.includes('image'));
                if (frameStepId) {
                    const frameNodes = stepToNodeIds[frameStepId] || [];
                    console.log(`[Executor] 📋 Frame nodes created: ${frameNodes.length} frames`);
                    frameNodes.forEach((nodeId, idx) => {
                        const segmentNum = Math.floor(idx / 2) + 1;
                        const isFirst = idx % 2 === 0;
                        console.log(`[Executor]   Frame ${idx}: ${nodeId} → Segment ${segmentNum} ${isFirst ? 'FIRST' : 'LAST'}`);
                    });
                }
            }
            return;
        }

        // All single actions must now be routed via plans in the Resolver.
        console.warn('[IntentExecutor] Received legacy intent. Please route via EXECUTE_PLAN.', action.intent);
    }, [getViewportCenter, canvasState, props, canvasSelection]);

    return { executeIntent };
}
