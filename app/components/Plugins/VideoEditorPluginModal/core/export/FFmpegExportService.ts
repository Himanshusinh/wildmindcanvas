// ============================================
// FFmpeg Export Service
// Uses FFmpeg.wasm for professional-grade video export in browser
// Produces smooth, high-quality video output
// ============================================

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Track, TimelineItem, CanvasDimension, Transition, Animation } from '../../types';
import { getAdjustmentStyle, getPresetFilterStyle, getTextEffectStyle, DEFAULT_ADJUSTMENTS } from '../../types';
import type { ExportSettings, ExportProgress } from '../types/export';

export interface FFmpegExportOptions {
    tracks: Track[];
    duration: number;
    dimension: CanvasDimension;
    settings: ExportSettings;
    onProgress: (progress: ExportProgress) => void;
}

// Internal type for rendering items with transition info
interface RenderItem {
    item: TimelineItem;
    track: Track;
    role: 'main' | 'outgoing';
    transition: Transition | null;
    transitionProgress: number;
}

// Transition style properties for rendering
interface TransitionStyle {
    opacity?: number;
    scale?: number;
    rotate?: number;
    translateX?: number;
    translateY?: number;
    blur?: number;
    clipX?: number;
    clipWidth?: number;
}

class FFmpegExportService {
    private ffmpeg: FFmpeg | null = null;
    private loaded = false;
    private loading = false;

    /**
     * Check if FFmpeg is available in browser
     */
    isSupported(): boolean {
        return typeof SharedArrayBuffer !== 'undefined';
    }

    /**
     * Load FFmpeg.wasm (one-time, ~25MB download)
     */
    async load(onProgress?: (progress: number) => void): Promise<boolean> {
        if (this.loaded) return true;
        if (this.loading) {
            // Wait for loading to complete
            while (this.loading) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.loaded;
        }

        this.loading = true;

        try {
            this.ffmpeg = new FFmpeg();

            // Use CDN for WASM files
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

            this.ffmpeg.on('progress', ({ progress }) => {
                onProgress?.(progress * 100);
            });

            this.ffmpeg.on('log', ({ message }) => {
                console.log('[FFmpeg]', message);
            });

            await this.ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });

            this.loaded = true;
            console.log('%c✅ FFmpeg.wasm loaded successfully!', 'color: #00ff00; font-weight: bold');
            return true;

        } catch (error) {
            console.error('[FFmpegExportService] Failed to load FFmpeg:', error);
            this.loaded = false;
            return false;
        } finally {
            this.loading = false;
        }
    }

    /**
     * Export video using FFmpeg
     * OPTIMIZED for speed:
     * 1. Uses JPEG instead of PNG (faster encoding)
     * 2. Uses 'ultrafast' FFmpeg preset
     * 3. Reduced video seek wait time
     */
    async export(options: FFmpegExportOptions): Promise<Blob> {
        const { tracks, duration, dimension, settings, onProgress } = options;

        if (!this.ffmpeg || !this.loaded) {
            throw new Error('FFmpeg not loaded. Call load() first.');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('%c🎬 STARTING FFMPEG EXPORT', 'font-weight: bold; font-size: 16px; color: #ff6600');
        console.log(`%c📐 Resolution: ${settings.resolution.width}x${settings.resolution.height}`, 'color: #00aaff');
        console.log(`%c⏱️  Duration: ${duration.toFixed(2)}s`, 'color: #00aaff');
        console.log(`%c🎞️  FPS: ${settings.fps}`, 'color: #00aaff');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        onProgress({ phase: 'preparing', progress: 0 });

        // Create offscreen canvas for rendering
        const canvas = document.createElement('canvas');
        canvas.width = settings.resolution.width;
        canvas.height = settings.resolution.height;
        const ctx = canvas.getContext('2d')!;

        const totalFrames = Math.ceil(duration * settings.fps);
        const framePrefix = 'frame_';

        onProgress({ phase: 'rendering', progress: 5 });

        // Step 1: Preload all video elements BEFORE rendering frames
        console.log('%c📥 Preloading all media...', 'color: #00aaff');
        await this.preloadAllMedia(tracks);
        console.log('%c✅ Media preloaded!', 'color: #00ff00');

        // Step 2: Render each frame and write to FFmpeg filesystem
        console.log(`%c📸 Rendering ${totalFrames} frames...`, 'color: #ffaa00');

        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            const currentTime = frameIndex / settings.fps;

            // Clear canvas
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Render all active items at this time
            const itemsRendered = await this.renderFrame(tracks, currentTime, canvas, ctx);

            // Debug first few frames
            if (frameIndex < 3) {
                console.log(`[Frame ${frameIndex}] time=${currentTime.toFixed(3)}s, items rendered: ${itemsRendered}`);
            }

            // Convert canvas to JPEG (faster than PNG!) and write to FFmpeg filesystem
            const frameData = await this.canvasToUint8Array(canvas);
            const frameName = `${framePrefix}${String(frameIndex).padStart(5, '0')}.jpg`;
            await this.ffmpeg!.writeFile(frameName, frameData);

            // Update progress
            const progress = 5 + ((frameIndex + 1) / totalFrames) * 70; // 5-75%
            onProgress({
                phase: 'rendering',
                progress,
                currentFrame: frameIndex + 1,
                totalFrames,
            });

            // Log every 30 frames
            if ((frameIndex + 1) % 30 === 0) {
                console.log(`%c⏳ Rendered ${frameIndex + 1}/${totalFrames} frames`, 'color: #ffaa00');
            }
        }

        console.log('%c✅ All frames rendered!', 'color: #00ff00');
        onProgress({ phase: 'encoding', progress: 70 });

        // Step 2: Load and write audio files to FFmpeg filesystem
        const audioItems = this.getAudioItems(tracks);
        const videoItems = this.getVideoItemsWithAudio(tracks);
        const hasAudio = audioItems.length > 0 || videoItems.length > 0;

        // Store audio input info with timing
        type AudioInput = { file: string; startTime: number; offset: number; clipDuration: number };
        let audioInputs: AudioInput[] = [];

        if (hasAudio) {
            console.log(`%c🎵 Processing ${audioItems.length} audio + ${videoItems.length} video audio tracks...`, 'color: #00aaff');

            // Load audio tracks with timeline info
            for (let i = 0; i < audioItems.length; i++) {
                const item = audioItems[i];
                try {
                    const audioData = await this.fetchFile(item.src);
                    const audioFileName = `audio_${i}.mp3`;
                    await this.ffmpeg!.writeFile(audioFileName, audioData);
                    audioInputs.push({
                        file: audioFileName,
                        startTime: item.start,
                        offset: item.offset ?? 0,
                        clipDuration: item.duration
                    });
                    console.log(`   ✓ Audio loaded: ${item.name || audioFileName} (start: ${item.start.toFixed(2)}s, dur: ${item.duration.toFixed(2)}s)`);
                } catch (e) {
                    console.warn(`   ✗ Failed to load audio: ${item.name}`, e);
                }
            }

            // Extract audio from video clips with timeline info
            for (let i = 0; i < videoItems.length; i++) {
                const item = videoItems[i];
                try {
                    const videoData = await this.fetchFile(item.src);
                    const videoAudioFile = `video_audio_${i}.mp4`;
                    await this.ffmpeg!.writeFile(videoAudioFile, videoData);
                    audioInputs.push({
                        file: videoAudioFile,
                        startTime: item.start,
                        offset: item.offset ?? 0,
                        clipDuration: item.duration
                    });
                    console.log(`   ✓ Video audio: ${item.name || videoAudioFile} (start: ${item.start.toFixed(2)}s, offset: ${(item.offset ?? 0).toFixed(2)}s, dur: ${item.duration.toFixed(2)}s)`);
                } catch (e) {
                    console.warn(`   ✗ Failed to extract video audio: ${item.name}`, e);
                }
            }
        }

        onProgress({ phase: 'encoding', progress: 75 });

        // Step 3: Use FFmpeg to encode frames into video
        console.log('%c🎬 Encoding video with FFmpeg...', 'color: #ff6600');

        const outputFile = 'output.mp4';
        const tempVideoFile = 'temp_video.mp4';

        // First, encode just the video frames
        await this.ffmpeg.exec([
            '-framerate', String(settings.fps),
            '-i', `${framePrefix}%05d.jpg`,
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '20',
            '-pix_fmt', 'yuv420p',
            '-y',
            tempVideoFile
        ]);

        // Then mux with audio if available
        if (audioInputs.length > 0) {
            console.log('%c🎵 Muxing audio with video (with trimming)...', 'color: #00aaff');

            // Create FFmpeg command with all audio inputs
            const ffmpegArgs: string[] = [
                '-i', tempVideoFile, // Video input (stream 0)
            ];

            // Add all audio inputs
            for (const audio of audioInputs) {
                ffmpegArgs.push('-i', audio.file);
            }

            // Build filter_complex to trim and position each audio
            // Each audio: trim from offset, pad with silence to position at startTime
            let filterParts: string[] = [];
            for (let i = 0; i < audioInputs.length; i++) {
                const audio = audioInputs[i];
                const streamIdx = i + 1; // 0 is video
                // atrim: trim audio from offset for clipDuration
                // adelay: delay audio to start at the right position (in ms)
                const delayMs = Math.round(audio.startTime * 1000);
                filterParts.push(
                    `[${streamIdx}:a]atrim=start=${audio.offset}:duration=${audio.clipDuration},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs}[a${i}]`
                );
            }

            // Mix all trimmed/positioned audio streams
            const mixInputs = audioInputs.map((_, i) => `[a${i}]`).join('');
            const mixFilter = `${mixInputs}amix=inputs=${audioInputs.length}:duration=longest:dropout_transition=0[aout]`;
            filterParts.push(mixFilter);

            ffmpegArgs.push(
                '-filter_complex', filterParts.join(';'),
                '-map', '0:v',
                '-map', '[aout]',
                '-c:v', 'copy',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-t', String(duration), // Limit to timeline duration
                '-movflags', '+faststart',
                '-y',
                outputFile
            );

            await this.ffmpeg.exec(ffmpegArgs);
        } else {
            // No audio - just copy video with duration limit
            await this.ffmpeg.exec([
                '-i', tempVideoFile,
                '-c', 'copy',
                '-t', String(duration),
                '-movflags', '+faststart',
                '-y',
                outputFile
            ]);
        }

        onProgress({ phase: 'encoding', progress: 95 });

        // Step 4: Read output file
        const data = await this.ffmpeg.readFile(outputFile) as Uint8Array;
        // Create a copy of the buffer to avoid SharedArrayBuffer issues
        const arrayBuffer = new ArrayBuffer(data.byteLength);
        new Uint8Array(arrayBuffer).set(data);
        const videoBlob = new Blob([arrayBuffer], { type: 'video/mp4' });

        // Cleanup: delete frame files
        for (let i = 0; i < totalFrames; i++) {
            const frameName = `${framePrefix}${String(i).padStart(5, '0')}.jpg`;
            try {
                await this.ffmpeg.deleteFile(frameName);
            } catch {
                // Ignore cleanup errors
            }
        }
        // Cleanup audio and temp files
        try { await this.ffmpeg.deleteFile(tempVideoFile); } catch { }
        try { await this.ffmpeg.deleteFile(outputFile); } catch { }
        for (const audio of audioInputs) {
            try { await this.ffmpeg.deleteFile(audio.file); } catch { }
        }

        onProgress({ phase: 'complete', progress: 100 });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`%c🎉 FFMPEG EXPORT COMPLETE!`, 'font-weight: bold; font-size: 16px; color: #00ff00');
        console.log(`%c📦 File size: ${(videoBlob.size / (1024 * 1024)).toFixed(2)} MB`, 'color: #00aaff');
        console.log(`%c🎵 Audio tracks: ${audioInputs.length}`, 'color: #00aaff');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return videoBlob;
    }

    /**
     * Get audio items from tracks
     */
    private getAudioItems(tracks: Track[]): TimelineItem[] {
        const items: TimelineItem[] = [];
        for (const track of tracks) {
            if (track.type === 'audio') {
                items.push(...track.items);
            }
        }
        return items;
    }

    /**
     * Get video items that may have embedded audio
     */
    private getVideoItemsWithAudio(tracks: Track[]): TimelineItem[] {
        const items: TimelineItem[] = [];
        for (const track of tracks) {
            if (track.type === 'video' || track.id === 'main-video') {
                for (const item of track.items) {
                    if (item.type === 'video') {
                        items.push(item);
                    }
                }
            }
        }
        return items;
    }

    /**
     * Fetch file as Uint8Array
     */
    private async fetchFile(src: string): Promise<Uint8Array> {
        const response = await fetch(src);
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
    }

    /**
     * Render a single frame with all active timeline items
     * Handles transitions between overlapping clips
     */
    private async renderFrame(
        tracks: Track[],
        currentTime: number,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ): Promise<number> {
        // Get active items at current time with transition info
        const renderItems: RenderItem[] = [];

        for (const track of tracks) {
            if (track.isHidden) continue;

            const trackItems = track.items
                .filter(item => currentTime >= item.start && currentTime < item.start + item.duration)
                .sort((a, b) => a.start - b.start);

            // Detect overlapping clips for transitions
            for (let i = 0; i < trackItems.length; i++) {
                const item = trackItems[i];
                const nextItem = trackItems[i + 1];

                // Check if this item has a transition with the next item
                if (nextItem && nextItem.transition && nextItem.transition.type !== 'none') {
                    const transitionStart = nextItem.start;
                    const transitionDuration = nextItem.transition.duration;
                    const transitionEnd = transitionStart + transitionDuration;

                    if (currentTime >= transitionStart && currentTime < transitionEnd) {
                        // We're in a transition zone
                        const transitionProgress = (currentTime - transitionStart) / transitionDuration;

                        // Outgoing clip
                        renderItems.push({
                            item,
                            track,
                            role: 'outgoing',
                            transition: nextItem.transition,
                            transitionProgress
                        });

                        // Incoming clip
                        renderItems.push({
                            item: nextItem,
                            track,
                            role: 'main',
                            transition: nextItem.transition,
                            transitionProgress
                        });

                        i++; // Skip the next item as we've already added it
                        continue;
                    }
                }

                // No transition, render normally
                renderItems.push({
                    item,
                    track,
                    role: 'main',
                    transition: null,
                    transitionProgress: 0
                });
            }
        }

        // Sort by layer (background first, then by z-index)
        renderItems.sort((a, b) => {
            if (a.item.isBackground && !b.item.isBackground) return -1;
            if (!a.item.isBackground && b.item.isBackground) return 1;
            return (a.item.layer || 0) - (b.item.layer || 0);
        });

        let renderedCount = 0;

        // Render each item with transition effects
        for (const renderItem of renderItems) {
            const { item, role, transition, transitionProgress } = renderItem;

            if (item.type === 'video' || item.type === 'image') {
                const success = await this.renderMediaItemWithTransition(
                    item, currentTime, canvas, ctx, role, transition, transitionProgress
                );
                if (success) renderedCount++;
            } else if (item.type === 'color') {
                this.renderColorItem(item, canvas, ctx);
                renderedCount++;
            } else if (item.type === 'text') {
                this.renderTextItem(item, canvas, ctx);
                renderedCount++;
            }
        }

        return renderedCount;
    }

    /**
     * Render item interface for transition handling
     */
    private renderMediaItemWithTransition(
        item: TimelineItem,
        currentTime: number,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        role: 'main' | 'outgoing',
        transition: Transition | null,
        transitionProgress: number
    ): Promise<boolean> {
        // If in transition, apply transition style
        if (transition && transition.type !== 'none') {
            const transitionStyle = this.calculateTransitionStyle(transition.type, transitionProgress, role);
            return this.renderMediaItemWithStyle(item, currentTime, canvas, ctx, transitionStyle);
        }

        // Normal render
        return this.renderMediaItem(item, currentTime, canvas, ctx);
    }

    /**
     * Calculate transition effect style based on type and progress
     */
    private calculateTransitionStyle(
        type: string,
        progress: number,
        role: 'main' | 'outgoing'
    ): TransitionStyle {
        const p = progress;
        const outP = 1 - p;

        switch (type) {
            case 'dissolve':
            case 'fade-dissolve':
                return { opacity: role === 'outgoing' ? outP : p };

            case 'dip-to-black':
                return {
                    opacity: role === 'outgoing' ? Math.max(0, 1 - p * 2) : Math.max(0, p * 2 - 1)
                };

            case 'slide':
            case 'push':
                const slideDir = role === 'outgoing' ? -1 : 1;
                return {
                    translateX: role === 'outgoing' ? -p * 100 : (1 - p) * 100 * slideDir,
                    opacity: 1
                };

            case 'wipe':
                return {
                    clipX: role === 'outgoing' ? p : 0,
                    clipWidth: role === 'outgoing' ? 1 - p : p,
                    opacity: 1
                };

            case 'zoom-in':
                return {
                    scale: role === 'outgoing' ? 1 : 0.5 + 0.5 * p,
                    opacity: role === 'outgoing' ? outP : p
                };

            case 'zoom-out':
                return {
                    scale: role === 'outgoing' ? 1 + p * 0.5 : 1,
                    opacity: role === 'outgoing' ? outP : p
                };

            case 'spin':
                return {
                    rotate: role === 'outgoing' ? p * 360 : (1 - p) * -360,
                    scale: role === 'outgoing' ? outP : p,
                    opacity: role === 'outgoing' ? outP : p
                };

            case 'flash':
                return {
                    opacity: role === 'outgoing'
                        ? (p < 0.5 ? 1 : 0)
                        : (p >= 0.5 ? 1 : 0)
                };

            case 'blur':
            case 'zoom-blur':
                return {
                    blur: role === 'outgoing' ? p * 20 : (1 - p) * 20,
                    opacity: role === 'outgoing' ? outP : p
                };

            default:
                // Default to dissolve
                return { opacity: role === 'outgoing' ? outP : p };
        }
    }

    /**
     * Render media item with transition style applied
     */
    private async renderMediaItemWithStyle(
        item: TimelineItem,
        currentTime: number,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        style: TransitionStyle
    ): Promise<boolean> {
        const mediaEl = await this.loadMedia(item, currentTime);
        if (!mediaEl) return false;

        const { x, y, width, height } = this.calculateBounds(item, canvas, mediaEl);

        ctx.save();

        // Apply CSS filters
        let filterString = this.buildFilterString(item);
        if (style.blur) {
            filterString += ` blur(${style.blur}px)`;
        }
        if (filterString) {
            ctx.filter = filterString.trim();
        }

        // Apply animation
        const animStyle = this.calculateAnimationStyle(item, currentTime);

        // Base transform
        let tx = x + width / 2;
        let ty = y + height / 2;

        // Transition translate
        if (style.translateX) tx += (style.translateX / 100) * canvas.width;
        if (style.translateY) ty += (style.translateY / 100) * canvas.height;

        ctx.translate(tx, ty);

        // Transition + animation scale
        const totalScale = (style.scale ?? 1) * (animStyle.scale ?? 1);
        if (totalScale !== 1) ctx.scale(totalScale, totalScale);

        // Transition + animation rotate
        const totalRotate = (style.rotate ?? 0) + (animStyle.rotate ?? 0);
        if (totalRotate) ctx.rotate((totalRotate * Math.PI) / 180);

        // Animation translate
        if (animStyle.translateX || animStyle.translateY) {
            ctx.translate(animStyle.translateX || 0, animStyle.translateY || 0);
        }

        // Item transforms
        if (item.rotation) ctx.rotate((item.rotation * Math.PI) / 180);
        if (item.flipH || item.flipV) ctx.scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);

        // Opacity (combine all)
        const baseOpacity = (item.opacity ?? 100) / 100;
        const animOpacity = animStyle.opacity ?? 1;
        const transitionOpacity = style.opacity ?? 1;
        ctx.globalAlpha = baseOpacity * animOpacity * transitionOpacity;

        // Clip for wipe transitions
        if (style.clipX !== undefined || style.clipWidth !== undefined) {
            ctx.beginPath();
            const clipX = (style.clipX ?? 0) * width;
            const clipW = (style.clipWidth ?? 1) * width;
            ctx.rect(-width / 2 + clipX, -height / 2, clipW, height);
            ctx.clip();
        }

        try {
            ctx.drawImage(mediaEl, -width / 2, -height / 2, width, height);
            ctx.restore();
            return true;
        } catch (e) {
            console.error('[FFmpegExportService] Error drawing media:', e);
            ctx.restore();
            return false;
        }
    }


    /**
     * Render video or image item with all effects
     * Supports: filters, animations, fit property, transformations
     */
    private async renderMediaItem(
        item: TimelineItem,
        currentTime: number,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ): Promise<boolean> {
        const mediaEl = await this.loadMedia(item, currentTime);
        if (!mediaEl) return false;

        // Calculate bounds with fit property support
        const { x, y, width, height } = this.calculateBounds(item, canvas, mediaEl);

        ctx.save();

        // === APPLY CSS FILTERS ===
        const filterString = this.buildFilterString(item);
        if (filterString) {
            ctx.filter = filterString;
        }

        // === APPLY ANIMATION ===
        const animStyle = this.calculateAnimationStyle(item, currentTime);

        // Base transform
        ctx.translate(x + width / 2, y + height / 2);

        // Animation transforms
        if (animStyle.scale) {
            ctx.scale(animStyle.scale, animStyle.scale);
        }
        if (animStyle.rotate) {
            ctx.rotate((animStyle.rotate * Math.PI) / 180);
        }
        if (animStyle.translateX || animStyle.translateY) {
            ctx.translate(animStyle.translateX || 0, animStyle.translateY || 0);
        }

        // Item transforms
        if (item.rotation) ctx.rotate((item.rotation * Math.PI) / 180);
        if (item.flipH || item.flipV) ctx.scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);

        // Opacity (combine with animation opacity)
        const baseOpacity = (item.opacity ?? 100) / 100;
        const animOpacity = animStyle.opacity ?? 1;
        ctx.globalAlpha = baseOpacity * animOpacity;

        try {
            ctx.drawImage(mediaEl, -width / 2, -height / 2, width, height);
            ctx.restore();
            return true;
        } catch (e) {
            console.error('[FFmpegExportService] Error drawing media:', e);
            ctx.restore();
            return false;
        }
    }

    /**
     * Build CSS filter string from item adjustments and presets
     */
    private buildFilterString(item: TimelineItem): string {
        const adjustmentFilter = getAdjustmentStyle(item, 1);
        const presetFilter = getPresetFilterStyle(item.filter || 'none');
        return [adjustmentFilter, presetFilter].filter(Boolean).join(' ').trim();
    }

    /**
     * Calculate animation style based on current time
     */
    private calculateAnimationStyle(item: TimelineItem, currentTime: number): {
        opacity?: number;
        scale?: number;
        rotate?: number;
        translateX?: number;
        translateY?: number;
    } {
        if (!item.animation) return {};

        const animType = item.animation.type;
        const animDur = item.animation.duration || 1;
        const timing = item.animation.timing || 'enter';
        const itemTime = currentTime - item.start;
        const clipDur = item.duration;

        let progress = 0;
        let isActive = false;

        if (timing === 'enter' || timing === 'both') {
            if (itemTime < animDur) {
                progress = itemTime / animDur;
                isActive = true;
            }
        }
        if (timing === 'exit' || timing === 'both') {
            const exitStart = clipDur - animDur;
            if (itemTime >= exitStart && itemTime <= clipDur) {
                progress = 1 - ((itemTime - exitStart) / animDur);
                isActive = true;
            }
        }

        if (!isActive) return {};

        // Apply easing (ease-out)
        const p = 1 - Math.pow(1 - progress, 3);

        switch (animType) {
            case 'fade-in':
                return { opacity: p };
            case 'zoom-in-1':
            case 'zoom-in-center':
                return { scale: 0.5 + 0.5 * p, opacity: p };
            case 'zoom-out-1':
                return { scale: 1.5 - 0.5 * p, opacity: p };
            case 'fade-slide-left':
                return { opacity: p, translateX: (1 - p) * -50 };
            case 'fade-slide-right':
                return { opacity: p, translateX: (1 - p) * 50 };
            case 'fade-slide-up':
                return { opacity: p, translateY: (1 - p) * -50 };
            case 'fade-slide-down':
                return { opacity: p, translateY: (1 - p) * 50 };
            case 'rotate-cw-1':
                return { rotate: (1 - p) * -360 };
            case 'rotate-ccw':
                return { rotate: (1 - p) * 360 };
            case 'boom':
                return { scale: p, opacity: p };
            case 'bounce-left':
            case 'bounce-right':
            case 'bounce-up':
            case 'bounce-down':
                const bounceDir = animType.includes('left') ? -1 : animType.includes('right') ? 1 : 0;
                const bounceVertDir = animType.includes('up') ? -1 : animType.includes('down') ? 1 : 0;
                const bounce = Math.sin(p * Math.PI * 2) * (1 - p) * 20;
                return {
                    translateX: bounceDir * bounce,
                    translateY: bounceVertDir * bounce,
                    opacity: p
                };
            default:
                return { opacity: p };
        }
    }

    /**
     * Preload all media elements before rendering
     */
    private async preloadAllMedia(tracks: Track[]): Promise<void> {
        const mediaItems: TimelineItem[] = [];

        for (const track of tracks) {
            if (track.isHidden) continue;
            for (const item of track.items) {
                if (item.type === 'video' || item.type === 'image') {
                    mediaItems.push(item);
                }
            }
        }

        console.log(`[FFmpegExportService] Preloading ${mediaItems.length} media items...`);

        for (const item of mediaItems) {
            if (item.type === 'video') {
                const video = await this.createVideo(item);
                if (video) {
                    this.mediaCache.set(item.id, video);
                    console.log(`   ✓ Video preloaded: ${item.name || item.id}`);
                } else {
                    console.warn(`   ✗ Failed to preload video: ${item.name || item.id}`);
                }
            } else if (item.type === 'image') {
                const img = await this.loadMedia(item, 0);
                if (img) {
                    console.log(`   ✓ Image preloaded: ${item.name || 'image'}`);
                } else {
                    console.warn(`   ✗ Failed to preload image: ${item.name || 'image'}`);
                }
            }
        }
    }

    /**
     * Load media element (video or image)
     */
    private mediaCache = new Map<string, HTMLImageElement | HTMLVideoElement>();

    private async loadMedia(item: TimelineItem, currentTime: number): Promise<HTMLImageElement | HTMLVideoElement | null> {
        if (item.type === 'image') {
            let img = this.mediaCache.get(item.src) as HTMLImageElement;
            if (img) return img;

            return new Promise((resolve) => {
                const newImg = new Image();

                // Handle CORS - don't set crossOrigin for blob/data URLs
                const isExternal = item.src.startsWith('http://') || item.src.startsWith('https://');
                const isBlobOrData = item.src.startsWith('blob:') || item.src.startsWith('data:');
                if (isExternal && !isBlobOrData) {
                    newImg.crossOrigin = 'anonymous';
                }

                const timeout = setTimeout(() => {
                    console.warn(`[FFmpegExportService] Image load timeout: ${item.src.substring(0, 50)}...`);
                    resolve(null);
                }, 10000); // 10 second timeout

                newImg.onload = () => {
                    clearTimeout(timeout);
                    console.log(`[FFmpegExportService] Image loaded: ${item.name || 'image'}`);
                    this.mediaCache.set(item.src, newImg);
                    resolve(newImg);
                };
                newImg.onerror = (e) => {
                    clearTimeout(timeout);
                    console.error(`[FFmpegExportService] Failed to load image: ${item.src.substring(0, 50)}...`, e);
                    resolve(null);
                };
                newImg.src = item.src;
            });
        }

        if (item.type === 'video') {
            let video = this.mediaCache.get(item.id) as HTMLVideoElement;

            if (!video) {
                const newVideo = await this.createVideo(item);
                if (!newVideo) return null;
                video = newVideo;
                this.mediaCache.set(item.id, video);
            }

            // Seek to correct time
            const speed = item.speed ?? 1;
            const offset = item.offset ?? 0;
            const timeInClip = (currentTime - item.start) * speed;
            const targetTime = Math.max(0, Math.min(offset + timeInClip, video.duration - 0.01));

            if (Math.abs(video.currentTime - targetTime) > 0.01) {
                video.currentTime = targetTime;
                await new Promise<void>((resolve) => {
                    const onSeeked = () => {
                        video.removeEventListener('seeked', onSeeked);
                        resolve();
                    };
                    video.addEventListener('seeked', onSeeked);
                    setTimeout(resolve, 50); // Fast timeout
                });
            }

            return video;
        }

        return null;
    }

    /**
     * Create video element
     */
    private createVideo(item: TimelineItem): Promise<HTMLVideoElement | null> {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto';

            const timeout = setTimeout(() => resolve(null), 30000);

            video.onloadeddata = () => {
                clearTimeout(timeout);
                resolve(video);
            };
            video.onerror = () => {
                clearTimeout(timeout);
                resolve(null);
            };

            // Handle CORS
            const isExternal = item.src.startsWith('http://') || item.src.startsWith('https://');
            const isBlobOrData = item.src.startsWith('blob:') || item.src.startsWith('data:');
            if (isExternal && !isBlobOrData) {
                video.crossOrigin = 'anonymous';
            }

            video.src = item.src;
            video.load();
        });
    }

    /**
     * Render color item
     */
    private renderColorItem(item: TimelineItem, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        const { x, y, width, height } = this.calculateBounds(item, canvas);
        ctx.save();
        ctx.fillStyle = item.src;
        ctx.globalAlpha = (item.opacity ?? 100) / 100;
        ctx.fillRect(x, y, width, height);
        ctx.restore();
    }

    /**
     * Render text item with text effects
     * Supports: shadow, outline, neon, glitch, etc.
     */
    private renderTextItem(item: TimelineItem, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        const { x, y, width, height } = this.calculateBounds(item, canvas);
        ctx.save();

        const fontSize = item.fontSize || 40;
        ctx.font = `${item.fontWeight || 'normal'} ${fontSize}px ${item.fontFamily || 'Inter'}`;
        ctx.fillStyle = item.color || '#000000';
        ctx.textAlign = (item.textAlign as CanvasTextAlign) || 'center';
        ctx.globalAlpha = (item.opacity ?? 100) / 100;

        const textX = x + width / 2;
        const textY = y + fontSize;
        const text = item.name || item.src || '';

        // === APPLY TEXT EFFECTS ===
        if (item.textEffect && item.textEffect.type !== 'none') {
            const effect = item.textEffect;
            const effColor = effect.color || '#000000';
            const intensity = effect.intensity ?? 50;
            const offset = effect.offset ?? 50;
            const dist = (offset / 100) * 20;
            const blur = (intensity / 100) * 20;

            switch (effect.type) {
                case 'shadow':
                    ctx.shadowColor = effColor;
                    ctx.shadowBlur = blur;
                    ctx.shadowOffsetX = dist;
                    ctx.shadowOffsetY = dist;
                    break;
                case 'lift':
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = blur + 10;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = dist * 0.5 + 4;
                    break;
                case 'outline':
                    ctx.strokeStyle = effColor;
                    ctx.lineWidth = (intensity / 100) * 3 + 1;
                    ctx.strokeText(text, textX, textY);
                    break;
                case 'hollow':
                    ctx.strokeStyle = item.color || '#000000';
                    ctx.lineWidth = (intensity / 100) * 3 + 1;
                    ctx.strokeText(text, textX, textY);
                    ctx.restore();
                    return; // Don't fill, just stroke for hollow effect
                case 'neon':
                    // Multiple glow layers
                    ctx.shadowColor = effColor;
                    ctx.shadowBlur = intensity * 0.4;
                    ctx.fillText(text, textX, textY);
                    ctx.shadowBlur = intensity * 0.2;
                    ctx.fillText(text, textX, textY);
                    ctx.shadowBlur = intensity * 0.1;
                    break;
                case 'glitch':
                    const gOff = (offset / 100) * 5 + 2;
                    // Cyan layer
                    ctx.fillStyle = '#00ffff';
                    ctx.fillText(text, textX - gOff, textY - gOff);
                    // Magenta layer
                    ctx.fillStyle = '#ff00ff';
                    ctx.fillText(text, textX + gOff, textY + gOff);
                    // Original
                    ctx.fillStyle = item.color || '#000000';
                    break;
                case 'echo':
                    const echoAlpha = ctx.globalAlpha;
                    ctx.globalAlpha = echoAlpha * 0.2;
                    ctx.fillText(text, textX + dist * 3, textY + dist * 3);
                    ctx.globalAlpha = echoAlpha * 0.4;
                    ctx.fillText(text, textX + dist * 2, textY + dist * 2);
                    ctx.globalAlpha = echoAlpha * 0.8;
                    ctx.fillText(text, textX + dist, textY + dist);
                    ctx.globalAlpha = echoAlpha;
                    break;
            }
        }

        // Draw main text
        ctx.fillText(text, textX, textY);
        ctx.restore();
    }

    /**
     * Calculate item bounds with fit property support
     * @param item Timeline item
     * @param canvas HTML canvas element
     * @param mediaEl Optional media element for aspect ratio calculation
     */
    private calculateBounds(
        item: TimelineItem,
        canvas: HTMLCanvasElement,
        mediaEl?: HTMLImageElement | HTMLVideoElement | null
    ) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        let width: number;
        let height: number;

        if (item.isBackground) {
            // Get media aspect ratio for proper fit calculation
            let mediaAspect = 1;
            if (mediaEl) {
                if (mediaEl instanceof HTMLVideoElement) {
                    mediaAspect = mediaEl.videoWidth / mediaEl.videoHeight || 1;
                } else if (mediaEl instanceof HTMLImageElement) {
                    mediaAspect = mediaEl.naturalWidth / mediaEl.naturalHeight || 1;
                }
            }

            const canvasAspect = canvasWidth / canvasHeight;
            const fit = item.fit || 'contain';

            if (fit === 'fill') {
                // Stretch to fill (ignores aspect ratio)
                width = canvasWidth;
                height = canvasHeight;
            } else if (fit === 'cover') {
                // Cover - fill canvas while maintaining aspect ratio (may crop)
                if (mediaAspect > canvasAspect) {
                    height = canvasHeight;
                    width = height * mediaAspect;
                } else {
                    width = canvasWidth;
                    height = width / mediaAspect;
                }
            } else {
                // Contain - fit inside canvas while maintaining aspect ratio (may letterbox)
                if (mediaAspect > canvasAspect) {
                    width = canvasWidth;
                    height = width / mediaAspect;
                } else {
                    height = canvasHeight;
                    width = height * mediaAspect;
                }
            }
        } else {
            width = item.width ? (item.width / 100) * canvasWidth : canvasWidth * 0.5;
            height = item.height ? (item.height / 100) * canvasHeight : canvasHeight * 0.5;
        }

        // Center the item
        const x = (canvasWidth / 2) + ((item.x || 0) / 100) * canvasWidth - width / 2;
        const y = (canvasHeight / 2) + ((item.y || 0) / 100) * canvasHeight - height / 2;

        return { x, y, width, height };
    }

    /**
     * Convert canvas to Uint8Array PNG
     */
    private async canvasToUint8Array(canvas: HTMLCanvasElement): Promise<Uint8Array> {
        return new Promise((resolve) => {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    resolve(new Uint8Array());
                    return;
                }
                const buffer = await blob.arrayBuffer();
                resolve(new Uint8Array(buffer));
            }, 'image/jpeg', 0.8); // JPEG at 80% quality (faster than PNG!)
        });
    }

    /**
     * Get bitrate based on settings
     */
    private getBitrate(settings: ExportSettings): number {
        const resolution = settings.resolution.width * settings.resolution.height;
        const base = Math.floor(resolution / 1000);
        const qualityMultiplier = settings.quality === 'high' ? 1.5 : settings.quality === 'medium' ? 1 : 0.7;
        return Math.floor(base * qualityMultiplier);
    }

    /**
     * Cleanup media cache
     */
    cleanup(): void {
        for (const [key, media] of this.mediaCache) {
            if (media instanceof HTMLVideoElement) {
                media.pause();
                media.src = '';
                media.load();
            }
        }
        this.mediaCache.clear();
    }
}

export const ffmpegExportService = new FFmpegExportService();
