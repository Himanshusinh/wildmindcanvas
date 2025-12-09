// ============================================
// FFmpeg Export Service
// Uses FFmpeg.wasm for professional-grade video export in browser
// Produces smooth, high-quality video output
// ============================================

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Track, TimelineItem, CanvasDimension } from '../../types';
import type { ExportSettings, ExportProgress } from '../types/export';

export interface FFmpegExportOptions {
    tracks: Track[];
    duration: number;
    dimension: CanvasDimension;
    settings: ExportSettings;
    onProgress: (progress: ExportProgress) => void;
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
     * Returns the number of items rendered
     */
    private async renderFrame(
        tracks: Track[],
        currentTime: number,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ): Promise<number> {
        // Get active items at current time
        const activeItems: { item: TimelineItem; track: Track }[] = [];

        for (const track of tracks) {
            if (track.isHidden) continue;
            for (const item of track.items) {
                if (currentTime >= item.start && currentTime < item.start + item.duration) {
                    activeItems.push({ item, track });
                }
            }
        }

        let renderedCount = 0;

        // Render each item
        for (const { item } of activeItems) {
            if (item.type === 'video' || item.type === 'image') {
                const success = await this.renderMediaItem(item, currentTime, canvas, ctx);
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
     * Render video or image item
     * Returns true if successfully rendered
     */
    private async renderMediaItem(
        item: TimelineItem,
        currentTime: number,
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D
    ): Promise<boolean> {
        const mediaEl = await this.loadMedia(item, currentTime);
        if (!mediaEl) return false;

        const { x, y, width, height } = this.calculateBounds(item, canvas);

        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        if (item.rotation) ctx.rotate((item.rotation * Math.PI) / 180);
        if (item.flipH || item.flipV) ctx.scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);
        ctx.globalAlpha = (item.opacity ?? 100) / 100;

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
     * Render text item
     */
    private renderTextItem(item: TimelineItem, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        const { x, y, width } = this.calculateBounds(item, canvas);
        ctx.save();
        ctx.font = `${item.fontWeight || 'normal'} ${item.fontSize || 40}px ${item.fontFamily || 'Inter'}`;
        ctx.fillStyle = item.color || '#000000';
        ctx.textAlign = (item.textAlign as CanvasTextAlign) || 'center';
        ctx.globalAlpha = (item.opacity ?? 100) / 100;
        ctx.fillText(item.src, x + width / 2, y + (item.fontSize || 40));
        ctx.restore();
    }

    /**
     * Calculate item bounds
     */
    private calculateBounds(item: TimelineItem, canvas: HTMLCanvasElement) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        let width = item.isBackground ? canvasWidth : (item.width ? (item.width / 100) * canvasWidth : canvasWidth * 0.5);
        let height = item.isBackground ? canvasHeight : (item.height ? (item.height / 100) * canvasHeight : canvasHeight * 0.5);

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
