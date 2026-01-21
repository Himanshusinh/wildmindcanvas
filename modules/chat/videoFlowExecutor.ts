import { v4 as uuidv4 } from 'uuid';
import { VideoFlowConfig, FramePrompt, calculateFrameCount, generateFramePrompts, MODEL_MAX_DURATIONS } from './videoTemplateFlow';

export interface FlowExecutorProps {
    canvasState: any;
    props: any;
    viewportSize: { width: number; height: number };
    position: { x: number; y: number };
    scale: number;
}

/**
 * Execute a video template flow
 * Creates image generation frames and connects them to video generation nodes
 */
export async function executeVideoFlow(
    config: VideoFlowConfig,
    templateId: string,
    executorProps: FlowExecutorProps
): Promise<void> {
    const { canvasState, props, viewportSize, position, scale } = executorProps;
    
    console.log('[executeVideoFlow] ===== STARTING VIDEO FLOW =====');
    console.log('[executeVideoFlow] Template ID received:', JSON.stringify(templateId));
    console.log('[executeVideoFlow] Template ID type:', typeof templateId);
    console.log('[executeVideoFlow] Template ID length:', templateId?.length);
    console.log('[executeVideoFlow] Template ID === "first-last-frame":', templateId === 'first-last-frame');
    console.log('[executeVideoFlow] Config:', config);
    
    // Normalize template ID (handle any whitespace or case issues)
    const normalizedTemplateId = templateId?.trim().toLowerCase();
    console.log('[executeVideoFlow] Normalized template ID:', JSON.stringify(normalizedTemplateId));
    console.log('[executeVideoFlow] Normalized === "first-last-frame":', normalizedTemplateId === 'first-last-frame');
    
    // STRICT CHECK: Only execute First & Last Frame if template ID exactly matches
    const isFirstLastFrame = templateId === 'first-last-frame' || normalizedTemplateId === 'first-last-frame';
    
    console.log('[executeVideoFlow] Template ID check result:', {
        original: templateId,
        normalized: normalizedTemplateId,
        exactMatch: templateId === 'first-last-frame',
        normalizedMatch: normalizedTemplateId === 'first-last-frame',
        isFirstLastFrame: isFirstLastFrame
    });
    
    if (isFirstLastFrame) {
        console.log('[executeVideoFlow] ✅✅✅ ROUTING TO: First & Last Frame flow ✅✅✅');
        console.log('[executeVideoFlow] This should create 2 images per video segment');
        console.log('[executeVideoFlow] If you see 1 image per video, something is wrong!');
        await executeFirstLastFrameFlow(config, executorProps);
        console.log('[executeVideoFlow] ✅ First & Last Frame flow execution completed');
    } else {
        console.log('[executeVideoFlow] ⚠️⚠️⚠️ ROUTING TO: Sequential Frames flow ⚠️⚠️⚠️');
        console.log('[executeVideoFlow] Template ID was:', JSON.stringify(templateId), '(not "first-last-frame")');
        console.log('[executeVideoFlow] This will create 1 image per video segment');
        await executeSequentialFramesFlow(config, templateId, executorProps);
        console.log('[executeVideoFlow] ✅ Sequential Frames flow execution completed');
    }
    
    console.log('[executeVideoFlow] ===== VIDEO FLOW COMPLETED =====');
}

/**
 * Execute Sequential Frames flow
 * Creates one image per video segment
 */
async function executeSequentialFramesFlow(
    config: VideoFlowConfig,
    templateId: string,
    executorProps: FlowExecutorProps
): Promise<void> {
    const { canvasState, props, viewportSize, position, scale } = executorProps;
    
    console.log('[executeSequentialFramesFlow] ========================================');
    console.log('[executeSequentialFramesFlow] 🎯 SEQUENTIAL FRAMES FLOW STARTED 🎯');
    console.log('[executeSequentialFramesFlow] This flow creates 1 image per video segment');
    console.log('[executeSequentialFramesFlow] ========================================');
    
    // Calculate viewport center
    const centerX = (viewportSize.width / 2 - position.x) / scale;
    const centerY = (viewportSize.height / 2 - position.y) / scale;
    
    // Calculate frame count
    const frameCount = calculateFrameCount(config.totalDuration, config.model);
    
    // Generate frame prompts
    const framePrompts = await generateFramePrompts(config, frameCount);
    
    // Layout configuration
    const IMAGE_SPACING = 300;
    const VIDEO_OFFSET_Y = 400;
    const START_X = centerX - ((frameCount - 1) * IMAGE_SPACING) / 2;
    const START_Y = centerY - 200;
    
    // Create image generation nodes
    const imageNodeIds: string[] = [];
    
    for (let i = 0; i < frameCount; i++) {
        const frame = framePrompts[i];
        const imageId = `image-${uuidv4()}`;
        const posX = START_X + (i * IMAGE_SPACING);
        const posY = START_Y;
        
        const imageModal = {
            id: imageId,
            x: posX,
            y: posY,
            prompt: frame.prompt,
            model: 'seedream-4.5', // Default image model
            aspectRatio: config.aspectRatio || '16:9',
            imageCount: 1,
            initialCount: 1,
            resolution: '1024',
            frameWidth: 600,
            frameHeight: 400,
            isGenerating: false,
        };
        
        // Add to canvas state
        if (canvasState.setImageModalStates) {
            canvasState.setImageModalStates((prev: any) => [...prev, imageModal]);
        }
        
        // Persist
        if (props.onPersistImageModalCreate) {
            await props.onPersistImageModalCreate(imageModal);
        }
        
        imageNodeIds.push(imageId);
    }
    
    // Create video generation nodes (one per image frame)
    const videoNodeIds: string[] = [];
    
    for (let i = 0; i < frameCount; i++) {
        const frame = framePrompts[i];
        const videoId = `video-${uuidv4()}`;
        const posX = START_X + (i * IMAGE_SPACING);
        const posY = START_Y + VIDEO_OFFSET_Y;
        
        const videoModal = {
            id: videoId,
            x: posX,
            y: posY,
            prompt: frame.prompt,
            model: config.model || 'Veo 3.1 Fast',
            aspectRatio: config.aspectRatio || '16:9',
            duration: MODEL_MAX_DURATIONS[config.model || 'Veo 3.1 Fast'] || 8,
            resolution: config.resolution || '720p',
            frameWidth: 600,
            frameHeight: 400,
        };
        
        // Add to canvas state
        if (canvasState.setVideoModalStates) {
            canvasState.setVideoModalStates((prev: any) => [...prev, videoModal]);
        }
        
        // Persist
        if (props.onPersistVideoModalCreate) {
            await props.onPersistVideoModalCreate(videoModal);
        }
        
        videoNodeIds.push(videoId);
        
        // Connect image to video
        const connectionId = `conn-${uuidv4()}`;
        const connection = {
            id: connectionId,
            from: imageNodeIds[i],
            to: videoId,
            color: '#555555',
        };
        
        if (props.onPersistConnectorCreate) {
            await props.onPersistConnectorCreate(connection);
        }
    }
    
    // If using sequential template, connect videos sequentially
    if (templateId === 'sequential-frames' && videoNodeIds.length > 1) {
        for (let i = 0; i < videoNodeIds.length - 1; i++) {
            const connectionId = `conn-${uuidv4()}`;
            const connection = {
                id: connectionId,
                from: videoNodeIds[i],
                to: videoNodeIds[i + 1],
                color: '#555555',
            };
            
            if (props.onPersistConnectorCreate) {
                await props.onPersistConnectorCreate(connection);
            }
        }
    }
}

/**
 * Execute First & Last Frame flow
 * Creates 2 images per video segment (first frame and last frame)
 * Uses Veo 3.1 Fast's first frame and last frame feature
 */
async function executeFirstLastFrameFlow(
    config: VideoFlowConfig,
    executorProps: FlowExecutorProps
): Promise<void> {
    const { canvasState, props, viewportSize, position, scale } = executorProps;
    
    console.log('[executeFirstLastFrameFlow] ========================================');
    console.log('[executeFirstLastFrameFlow] 🎯 FIRST & LAST FRAME FLOW STARTED 🎯');
    console.log('[executeFirstLastFrameFlow] This flow creates 2 images per video segment');
    console.log('[executeFirstLastFrameFlow] ========================================');
    
    // Calculate viewport center
    const centerX = (viewportSize.width / 2 - position.x) / scale;
    const centerY = (viewportSize.height / 2 - position.y) / scale;
    
    // Calculate video segment count
    const videoSegmentCount = calculateFrameCount(config.totalDuration, config.model);
    const maxDuration = MODEL_MAX_DURATIONS[config.model || 'Veo 3.1 Fast'] || 8;
    
    console.log('[executeFirstLastFrameFlow] Video segments:', videoSegmentCount, 'Duration per segment:', maxDuration);
    
    // Generate frame prompts for all segments
    const framePrompts = await generateFramePrompts(config, videoSegmentCount);
    
    // Layout configuration
    const IMAGE_SPACING = 300;
    const VIDEO_OFFSET_Y = 500;
    const FIRST_LAST_SPACING = 150; // Spacing between first and last frame images
    const START_X = centerX - ((videoSegmentCount - 1) * IMAGE_SPACING) / 2;
    const START_Y = centerY - 300;
    
    // Create image generation nodes (2 per video segment: first frame + last frame)
    const firstFrameImageIds: string[] = [];
    const lastFrameImageIds: string[] = [];
    const videoNodeIds: string[] = [];
    
    console.log('[executeFirstLastFrameFlow] Creating', videoSegmentCount, 'video segments with 2 images each');
    console.log('[executeFirstLastFrameFlow] Expected: ', videoSegmentCount, 'videos,', videoSegmentCount * 2, 'images,', videoSegmentCount * 2, 'connections');
    
    for (let i = 0; i < videoSegmentCount; i++) {
        console.log('[executeFirstLastFrameFlow] ===== Creating segment', i + 1, 'of', videoSegmentCount, '=====');
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] ⚠️ IMPORTANT: This is FIRST & LAST FRAME flow - MUST create 2 images per video!');
        const frame = framePrompts[i];
        const segmentStartTime = i * maxDuration;
        const segmentEndTime = Math.min((i + 1) * maxDuration, config.totalDuration);
        
        // ========== CREATE FIRST FRAME IMAGE ==========
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] STEP 1/5: Creating FIRST frame image...');
        const firstFrameId = `image-first-${uuidv4()}`;
        const firstFramePosX = START_X + (i * IMAGE_SPACING);
        const firstFramePosY = START_Y;
        
        // Generate prompt for first frame (beginning of scene)
        const firstFramePrompt = frame.sceneScript 
            ? `Opening scene: ${frame.sceneScript.substring(0, 200)}...`
            : `${frame.prompt}, opening frame, beginning of scene`;
        
        const firstFrameModal = {
            id: firstFrameId,
            x: firstFramePosX,
            y: firstFramePosY,
            prompt: firstFramePrompt,
            model: 'seedream-4.5',
            aspectRatio: config.aspectRatio || '16:9',
            imageCount: 1,
            initialCount: 1,
            resolution: '1024',
            frameWidth: 600,
            frameHeight: 400,
            isGenerating: false,
        };
        
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] Creating FIRST frame image:', firstFrameId, 'at position (', firstFramePosX, ',', firstFramePosY, ')');
        if (canvasState.setImageModalStates) {
            canvasState.setImageModalStates((prev: any) => [...prev, firstFrameModal]);
            console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] First frame added to state');
        }
        if (props.onPersistImageModalCreate) {
            await props.onPersistImageModalCreate(firstFrameModal);
            console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] First frame persisted');
        }
        firstFrameImageIds.push(firstFrameId);
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] First frame ID stored:', firstFrameId);
        
        // ========== CREATE LAST FRAME IMAGE ==========
        const lastFrameId = `image-last-${uuidv4()}`;
        const lastFramePosX = START_X + (i * IMAGE_SPACING);
        const lastFramePosY = START_Y + FIRST_LAST_SPACING;
        
        // Generate prompt for last frame (ending of scene)
        const lastFramePrompt = frame.sceneScript 
            ? `Closing scene: ${frame.sceneScript.substring(Math.max(0, frame.sceneScript.length - 200))}`
            : `${frame.prompt}, closing frame, ending of scene`;
        
        const lastFrameModal = {
            id: lastFrameId,
            x: lastFramePosX,
            y: lastFramePosY,
            prompt: lastFramePrompt,
            model: 'seedream-4.5',
            aspectRatio: config.aspectRatio || '16:9',
            imageCount: 1,
            initialCount: 1,
            resolution: '1024',
            frameWidth: 600,
            frameHeight: 400,
            isGenerating: false,
        };
        
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] Creating LAST frame image:', lastFrameId, 'at position (', lastFramePosX, ',', lastFramePosY, ')');
        if (canvasState.setImageModalStates) {
            canvasState.setImageModalStates((prev: any) => [...prev, lastFrameModal]);
            console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] Last frame added to state');
        }
        if (props.onPersistImageModalCreate) {
            await props.onPersistImageModalCreate(lastFrameModal);
            console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] Last frame persisted');
        }
        lastFrameImageIds.push(lastFrameId);
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] Last frame ID stored:', lastFrameId);
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] ✅ STEP 2/5 COMPLETE: Both images created! First:', firstFrameId, 'Last:', lastFrameId);
        
        // ========== CREATE VIDEO NODE ==========
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] STEP 3/5: Creating VIDEO node...');
        const videoId = `video-${uuidv4()}`;
        const videoPosX = START_X + (i * IMAGE_SPACING);
        const videoPosY = START_Y + VIDEO_OFFSET_Y;
        
        const videoModal = {
            id: videoId,
            x: videoPosX,
            y: videoPosY,
            prompt: frame.prompt,
            model: config.model || 'Veo 3.1 Fast',
            aspectRatio: config.aspectRatio || '16:9',
            duration: maxDuration,
            resolution: config.resolution || '720p',
            frameWidth: 600,
            frameHeight: 400,
            // Store first and last frame IDs for reference
            firstFrameId: firstFrameId,
            lastFrameId: lastFrameId,
        };
        
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] Creating VIDEO node:', videoId, 'at position (', videoPosX, ',', videoPosY, ')');
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] Video will connect to FIRST:', firstFrameId, 'and LAST:', lastFrameId);
        if (canvasState.setVideoModalStates) {
            canvasState.setVideoModalStates((prev: any) => [...prev, videoModal]);
            console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] Video added to state');
        }
        if (props.onPersistVideoModalCreate) {
            await props.onPersistVideoModalCreate(videoModal);
            console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] Video persisted');
        }
        videoNodeIds.push(videoId);
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] Video ID stored:', videoId);
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] ✅ STEP 3/5 COMPLETE: Video created:', videoId);
        
        // ========== CONNECT FIRST FRAME TO VIDEO ==========
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] STEP 4/5: Connecting FIRST frame to video...');
        const firstConnId = `conn-first-${uuidv4()}`;
        const firstConnection = {
            id: firstConnId,
            from: firstFrameId,
            to: videoId,
            color: '#555555',
        };
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] Creating FIRST connection:', firstFrameId, '->', videoId, '(conn ID:', firstConnId, ')');
        if (props.onPersistConnectorCreate) {
            await props.onPersistConnectorCreate(firstConnection);
            console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] First connection persisted');
        } else {
            console.error('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] ERROR: onPersistConnectorCreate is not available!');
        }
        
        // ========== CONNECT LAST FRAME TO VIDEO ==========
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] STEP 5/5: Connecting LAST frame to video...');
        const lastConnId = `conn-last-${uuidv4()}`;
        const lastConnection = {
            id: lastConnId,
            from: lastFrameId,
            to: videoId,
            color: '#555555',
        };
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] Creating LAST connection:', lastFrameId, '->', videoId, '(conn ID:', lastConnId, ')');
        if (props.onPersistConnectorCreate) {
            await props.onPersistConnectorCreate(lastConnection);
            console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] Last connection persisted');
        } else {
            console.error('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] ERROR: onPersistConnectorCreate is not available!');
        }
        
        // Verify both images were created for this segment
        const segmentFirstFrame = firstFrameImageIds[i];
        const segmentLastFrame = lastFrameImageIds[i];
        const segmentVideo = videoNodeIds[i];
        
        if (!segmentFirstFrame || !segmentLastFrame || !segmentVideo) {
            console.error('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] ❌ ERROR: Missing components!', {
                firstFrame: segmentFirstFrame,
                lastFrame: segmentLastFrame,
                video: segmentVideo
            });
        } else {
            console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] ✅ VERIFIED: Both images and video created:', {
                firstFrame: segmentFirstFrame,
                lastFrame: segmentLastFrame,
                video: segmentVideo
            });
        }
        
        console.log('[executeFirstLastFrameFlow] [SEGMENT', i + 1, '] ===== COMPLETED: 2 images + 1 video + 2 connections =====');
    }
    
    console.log('[executeFirstLastFrameFlow] ===== SUMMARY =====');
    console.log('[executeFirstLastFrameFlow] Total videos created:', videoNodeIds.length);
    console.log('[executeFirstLastFrameFlow] Total first frames created:', firstFrameImageIds.length);
    console.log('[executeFirstLastFrameFlow] Total last frames created:', lastFrameImageIds.length);
    console.log('[executeFirstLastFrameFlow] Expected connections:', videoNodeIds.length * 2);
    
    // DO NOT connect videos sequentially for First & Last Frame flow
    // Each video segment is independent: 2 images → 1 video (no video-to-video connections)
    console.log('[executeFirstLastFrameFlow] First & Last Frame flow: Videos are independent (no sequential connections)');
    
    // Final verification
    console.log('[executeFirstLastFrameFlow] ===== FINAL VERIFICATION =====');
    console.log('[executeFirstLastFrameFlow] ✅ Created', videoSegmentCount, 'video segments');
    console.log('[executeFirstLastFrameFlow] ✅ Created', firstFrameImageIds.length, 'first frame images');
    console.log('[executeFirstLastFrameFlow] ✅ Created', lastFrameImageIds.length, 'last frame images');
    console.log('[executeFirstLastFrameFlow] ✅ Created', videoNodeIds.length, 'video nodes');
    console.log('[executeFirstLastFrameFlow] ✅ Expected connections: 2 per video =', videoNodeIds.length * 2, 'image-to-video connections');
    console.log('[executeFirstLastFrameFlow] ✅ Each video is independent: 2 images → 1 video (no video-to-video connections)');
    
    if (firstFrameImageIds.length !== videoSegmentCount || lastFrameImageIds.length !== videoSegmentCount) {
        console.error('[executeFirstLastFrameFlow] ❌ MISMATCH: Expected', videoSegmentCount, 'first frames and', videoSegmentCount, 'last frames, but got', firstFrameImageIds.length, 'and', lastFrameImageIds.length);
    } else {
        console.log('[executeFirstLastFrameFlow] ✅ Image count matches video segment count');
    }
    
    // Detailed breakdown of what was created
    console.log('[executeFirstLastFrameFlow] ===== DETAILED BREAKDOWN =====');
    for (let i = 0; i < videoSegmentCount; i++) {
        console.log('[executeFirstLastFrameFlow] Segment', i + 1, ':', {
            firstFrame: firstFrameImageIds[i],
            lastFrame: lastFrameImageIds[i],
            video: videoNodeIds[i],
            hasBothImages: !!(firstFrameImageIds[i] && lastFrameImageIds[i]),
            hasVideo: !!videoNodeIds[i]
        });
    }
}
