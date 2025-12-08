// ============================================
// Export Engine - Frame-by-Frame Video Renderer
// Uses WebCodecs VideoEncoder for frame-accurate export
// Supports GPU acceleration when available
// ============================================

import type { Track, TimelineItem, CanvasDimension } from '../../types';
import type { ExportSettings, ExportProgress } from '../types/export';
import { BITRATE_CONFIGS } from '../types/export';
import { gpuCompositor } from '../compositor/GPUCompositor';
import { hardwareAccel } from '../engine/HardwareAccel';
import { Muxer as WebmMuxer, ArrayBufferTarget as WebmArrayBufferTarget } from 'webm-muxer';
import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4ArrayBufferTarget } from 'mp4-muxer';

export class ExportEngine {
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private isExporting: boolean = false;
    private cancelled: boolean = false;

    // Media caches to avoid reloading for each frame
    private videoCache: Map<string, HTMLVideoElement> = new Map();
    private imageCache: Map<string, HTMLImageElement> = new Map();

    constructor() { }

    /**
     * Check if WebCodecs VideoEncoder is available
     */
    private supportsVideoEncoder(): boolean {
        return typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';
    }

    /**
     * Export the timeline to a video file
     * Uses WebCodecs VideoEncoder for frame-accurate timing
     * @param tracks Timeline tracks (video, audio, overlay)
     * @param duration Total video duration in seconds
     * @param dimension Canvas dimensions
     * @param settings Export settings
     * @param onProgress Progress callback
     * @returns Blob of the exported video
     */
    async export(
        tracks: Track[],
        duration: number,
        dimension: CanvasDimension,
        settings: ExportSettings,
        onProgress: (progress: ExportProgress) => void
    ): Promise<Blob> {
        this.isExporting = true;
        this.cancelled = false;

        // Use VideoEncoder if available, otherwise fall back to MediaRecorder
        if (this.supportsVideoEncoder()) {
            return this.exportWithVideoEncoder(tracks, duration, dimension, settings, onProgress);
        } else {
            console.warn('[ExportEngine] VideoEncoder not available, falling back to MediaRecorder');
            return this.exportWithMediaRecorder(tracks, duration, dimension, settings, onProgress);
        }
    }

    /**
     * Export using WebCodecs VideoEncoder for frame-accurate timing
     */
    private async exportWithVideoEncoder(
        tracks: Track[],
        duration: number,
        dimension: CanvasDimension,
        settings: ExportSettings,
        onProgress: (progress: ExportProgress) => void
    ): Promise<Blob> {
        try {
            onProgress({ phase: 'preparing', progress: 0 });

            // Initialize hardware acceleration
            await hardwareAccel.initialize();
            const capabilities = hardwareAccel.getCapabilities();
            const useGPU = settings.useGPU && (capabilities?.supportsWebGL2 ?? false);

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('%c🎬 STARTING VIDEO EXPORT (VideoEncoder)', 'font-weight: bold; font-size: 16px; color: #00ff00');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`%c📐 Resolution: ${settings.resolution.width}×${settings.resolution.height}`, 'font-weight: bold');
            console.log(`%c🎞️  FPS: ${settings.fps}`, 'color: #00aaff');
            console.log(`%c⏱️  Duration: ${duration.toFixed(2)}s`, 'color: #00aaff');
            console.log(`%c🎨 Quality: ${settings.quality.toUpperCase()}`, 'color: #ffaa00');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');

            // Create offscreen canvas for rendering
            this.canvas = document.createElement('canvas');
            this.canvas.width = settings.resolution.width;
            this.canvas.height = settings.resolution.height;
            this.ctx = this.canvas.getContext('2d', {
                alpha: false,
                willReadFrequently: false,
            });

            if (!this.ctx) {
                throw new Error('Failed to create canvas context');
            }

            // Initialize GPU compositor if enabled (with fallback)
            let actuallyUsingGPU = false;
            if (useGPU) {
                try {
                    const gpuInitSuccess = await gpuCompositor.initialize(this.canvas);
                    if (gpuInitSuccess) {
                        gpuCompositor.setResolution(settings.resolution.width, settings.resolution.height);
                        actuallyUsingGPU = true;
                        console.log('%c✨ GPU Compositor initialized for export', 'color: #00ff00');
                    }
                } catch (error) {
                    console.warn('%c⚠️ GPU initialization failed', 'color: #ff6600', error);
                }
            }

            // Pre-load all video elements
            console.log('%c📦 Pre-loading all video assets...', 'color: #00aaff');
            await this.preloadAllVideos(tracks);
            console.log('%c✅ All videos pre-loaded!', 'color: #00ff00');

            // Calculate frame parameters
            const totalFrames = Math.ceil(duration * settings.fps);
            const frameDurationMicros = Math.floor(1_000_000 / settings.fps);
            const bitrate = this.getBitrate(settings) * 1000; // Convert to bps

            console.log(`%c🎬 Rendering ${totalFrames} frames using H.264/MP4...`, 'font-weight: bold; color: #00ff00');

            // Set up mp4-muxer for H.264 (universal hardware decoding support)
            const muxerTarget = new Mp4ArrayBufferTarget();
            const muxer = new Mp4Muxer({
                target: muxerTarget,
                video: {
                    codec: 'avc', // H.264/AVC
                    width: settings.resolution.width,
                    height: settings.resolution.height,
                },
                fastStart: 'in-memory', // Enable fast start for streaming
            });

            // Set up VideoEncoder with H.264 for smooth VLC playback
            const encoder = new VideoEncoder({
                output: (chunk, meta) => {
                    muxer.addVideoChunk(chunk, meta);
                },
                error: (e) => {
                    console.error('[VideoEncoder] Error:', e);
                },
            });

            // H.264 Baseline Profile Level 3.1 - universal compatibility
            // avc1.42001f = Baseline Profile, Level 3.1
            encoder.configure({
                codec: 'avc1.42001f',
                width: settings.resolution.width,
                height: settings.resolution.height,
                bitrate: bitrate * 5, // High bitrate for quality
                framerate: settings.fps,
                avc: { format: 'avc' }, // Use AVC format for MP4 compatibility
            });

            console.log(`%c⚙️ VideoEncoder configured: H.264 (avc1.42001f), ${(bitrate * 5 / 1000).toFixed(0)}kbps, ${settings.fps}fps`, 'color: #00ff00');

            onProgress({ phase: 'rendering', progress: 0 });

            // Render and encode each frame
            for (let frameIndex = 0; frameIndex < totalFrames && !this.cancelled; frameIndex++) {
                const currentTime = frameIndex / settings.fps;
                const timestamp = frameIndex * frameDurationMicros;

                // Render frame to canvas
                await this.renderFrame(tracks, currentTime, dimension, settings, actuallyUsingGPU, frameIndex);

                // Create VideoFrame from canvas with exact timestamp
                const frame = new VideoFrame(this.canvas, {
                    timestamp: timestamp,
                    duration: frameDurationMicros,
                });

                // Keyframe every 15 frames (~0.5 second at 30fps) for good seeking without file bloat
                const isKeyframe = frameIndex % 15 === 0;
                encoder.encode(frame, { keyFrame: isKeyframe });
                frame.close();

                // Update progress
                const progress = ((frameIndex + 1) / totalFrames) * 100;
                onProgress({
                    phase: 'rendering',
                    progress,
                    currentFrame: frameIndex + 1,
                    totalFrames,
                    estimatedTimeRemaining: Math.ceil((totalFrames - frameIndex - 1) / 60),
                });

                // Log progress every 30 frames
                if ((frameIndex + 1) % 30 === 0) {
                    console.log(`%c⏳ Progress: ${progress.toFixed(1)}% (Frame ${frameIndex + 1}/${totalFrames})`, 'color: #ffaa00');
                }
            }

            if (this.cancelled) {
                encoder.close();
                throw new Error('Export cancelled by user');
            }

            // Flush encoder and finalize
            onProgress({ phase: 'encoding', progress: 95 });
            await encoder.flush();
            encoder.close();

            // Finalize muxer
            muxer.finalize();
            const buffer = muxerTarget.buffer;
            const blob = new Blob([buffer], { type: 'video/mp4' });

            onProgress({ phase: 'complete', progress: 100 });

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`%c🎉 EXPORT COMPLETE!`, 'font-weight: bold; font-size: 16px; color: #00ff00');
            console.log(`%c📦 File size: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`, 'color: #00aaff');
            console.log(`%c⏱️  Duration: ${duration.toFixed(2)}s (exact)`, 'color: #00aaff');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');

            return blob;

        } catch (error) {
            console.error('[ExportEngine] Export failed:', error);
            onProgress({
                phase: 'error',
                progress: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        } finally {
            this.cleanup();
            this.isExporting = false;
        }
    }

    /**
     * Fallback export using MediaRecorder for browsers without VideoEncoder
     */
    private async exportWithMediaRecorder(
        tracks: Track[],
        duration: number,
        dimension: CanvasDimension,
        settings: ExportSettings,
        onProgress: (progress: ExportProgress) => void
    ): Promise<Blob> {
        const recordedChunks: Blob[] = [];
        let mediaRecorder: MediaRecorder | null = null;

        try {
            onProgress({ phase: 'preparing', progress: 0 });

            // Initialize hardware acceleration
            await hardwareAccel.initialize();

            // Create offscreen canvas for rendering
            this.canvas = document.createElement('canvas');
            this.canvas.width = settings.resolution.width;
            this.canvas.height = settings.resolution.height;
            this.ctx = this.canvas.getContext('2d', { alpha: false });

            if (!this.ctx) {
                throw new Error('Failed to create canvas context');
            }

            // Pre-load all video elements
            await this.preloadAllVideos(tracks);

            // Set up MediaRecorder
            const stream = this.canvas.captureStream(settings.fps);
            const mimeType = this.getMimeType(settings);
            const bitrate = this.getBitrate(settings);

            mediaRecorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: bitrate * 1000,
            });

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.start(100);
            onProgress({ phase: 'rendering', progress: 0 });

            const totalFrames = Math.ceil(duration * settings.fps);
            const frameTime = 1000 / settings.fps;

            for (let frameIndex = 0; frameIndex < totalFrames && !this.cancelled; frameIndex++) {
                const currentTime = frameIndex / settings.fps;
                await this.renderFrame(tracks, currentTime, dimension, settings, false, frameIndex);

                const progress = ((frameIndex + 1) / totalFrames) * 100;
                onProgress({
                    phase: 'rendering',
                    progress,
                    currentFrame: frameIndex + 1,
                    totalFrames,
                });

                // Wait for frame duration to match real-time (required for MediaRecorder)
                await new Promise(resolve => setTimeout(resolve, frameTime));
            }

            if (this.cancelled) {
                throw new Error('Export cancelled by user');
            }

            onProgress({ phase: 'encoding', progress: 90 });

            // Stop recording and get blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                if (!mediaRecorder) {
                    reject(new Error('MediaRecorder not initialized'));
                    return;
                }
                mediaRecorder.onstop = () => {
                    resolve(new Blob(recordedChunks, { type: mediaRecorder!.mimeType }));
                };
                mediaRecorder.stop();
            });

            onProgress({ phase: 'complete', progress: 100 });
            return blob;

        } catch (error) {
            console.error('[ExportEngine] MediaRecorder export failed:', error);
            onProgress({
                phase: 'error',
                progress: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        } finally {
            this.cleanup();
            this.isExporting = false;
        }
    }

    /**
     * Render a single frame at the specified time
     */
    private async renderFrame(
        tracks: Track[],
        currentTime: number,
        dimension: CanvasDimension,
        settings: ExportSettings,
        useGPU: boolean,
        currentFrame: number
    ): Promise<void> {
        if (!this.canvas || !this.ctx) return;

        const ctx = this.ctx;
        const canvas = this.canvas;

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (useGPU) {
            gpuCompositor.clear();
        }

        // Get all active items at current time
        const activeItems = this.getActiveItems(tracks, currentTime);

        // Debug: Log active items
        if (activeItems.length > 0 && currentFrame === 0) {
            console.log(`%c📋 Found ${activeItems.length} items to render:`, 'color: #00aaff');
            activeItems.forEach(({ item }) => {
                console.log(`   - ${item.type}: ${item.name || item.src} (${item.start}s - ${item.start + item.duration}s)`);
            });
        }

        // Render each item (bottom to top)
        for (const { item, track } of activeItems) {
            if (track.isHidden) continue;

            // Skip audio items (handled by audio tracks)
            if (item.type === 'audio') continue;

            // Render based on type
            if (item.type === 'video' || item.type === 'image') {
                await this.renderMediaItem(item, ctx, canvas, useGPU, currentTime);
            } else if (item.type === 'color') {
                this.renderColorItem(item, ctx, canvas);
            } else if (item.type === 'text') {
                this.renderTextItem(item, ctx, canvas);
            }
        }
    }

    /**
     * Get all items that should be visible at the specified time
     */
    private getActiveItems(tracks: Track[], currentTime: number): Array<{ item: TimelineItem; track: Track }> {
        const activeItems: Array<{ item: TimelineItem; track: Track }> = [];

        // Sort tracks by layer (background first)
        const sortedTracks = [...tracks].sort((a, b) => {
            if (a.id === 'main-video') return -1;
            if (b.id === 'main-video') return 1;
            return 0;
        });

        for (const track of sortedTracks) {
            for (const item of track.items) {
                const itemStart = item.start;
                const itemEnd = item.start + item.duration;

                if (currentTime >= itemStart && currentTime < itemEnd) {
                    activeItems.push({ item, track });
                }
            }
        }

        return activeItems;
    }

    /**
     * Render a video or image item
     */
    private async renderMediaItem(
        item: TimelineItem,
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        useGPU: boolean,
        currentTime: number
    ): Promise<void> {
        // Load media element at the correct time position
        const mediaEl = await this.loadMediaElement(item, currentTime);
        if (!mediaEl) {
            console.warn(`[ExportEngine] Failed to load media: ${item.name || item.src}`);
            return;
        }

        // Calculate position and size
        const { x, y, width, height } = this.calculateItemBounds(item, canvas);

        // Save context state
        ctx.save();

        // Apply transformations
        ctx.translate(x + width / 2, y + height / 2);
        if (item.rotation) ctx.rotate((item.rotation * Math.PI) / 180);
        if (item.flipH || item.flipV) ctx.scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);
        ctx.globalAlpha = (item.opacity ?? 100) / 100;

        // Draw media
        try {
            ctx.drawImage(mediaEl, -width / 2, -height / 2, width, height);
        } catch (error) {
            console.warn(`[ExportEngine] Failed to draw media: ${item.name || item.src}`, error);
        }

        ctx.restore();
    }

    /**
     * Render a solid color item
     */
    private renderColorItem(item: TimelineItem, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
        const { x, y, width, height } = this.calculateItemBounds(item, canvas);

        ctx.save();
        ctx.fillStyle = item.src; // Color value
        ctx.globalAlpha = (item.opacity ?? 100) / 100;
        ctx.fillRect(x, y, width, height);
        ctx.restore();
    }

    /**
     * Render a text item
     */
    private renderTextItem(item: TimelineItem, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
        const { x, y, width } = this.calculateItemBounds(item, canvas);

        ctx.save();
        ctx.font = `${item.fontWeight || 'normal'} ${item.fontSize || 40}px ${item.fontFamily || 'Inter'}`;
        ctx.fillStyle = item.color || '#000000';
        ctx.textAlign = (item.textAlign as CanvasTextAlign) || 'center';
        ctx.globalAlpha = (item.opacity ?? 100) / 100;

        const textX = x + width / 2;
        const textY = y + (item.fontSize || 40);

        ctx.fillText(item.src, textX, textY);
        ctx.restore();
    }

    /**
     * Calculate item bounds in canvas pixels
     */
    private calculateItemBounds(item: TimelineItem, canvas: HTMLCanvasElement) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        let width: number;
        let height: number;

        if (item.isBackground) {
            width = canvasWidth;
            height = canvasHeight;
        } else {
            width = item.width ? (item.width / 100) * canvasWidth : canvasWidth * 0.5;
            height = item.height ? (item.height / 100) * canvasHeight : canvasHeight * 0.5;
        }

        const x = (canvasWidth / 2) + ((item.x || 0) / 100) * canvasWidth - width / 2;
        const y = (canvasHeight / 2) + ((item.y || 0) / 100) * canvasHeight - height / 2;

        return { x, y, width, height };
    }

    /**
     * Load media element (video or image)
     * For videos, seeks to the correct position based on timeline time
     */
    private async loadMediaElement(item: TimelineItem, currentTime: number): Promise<HTMLImageElement | HTMLVideoElement | null> {
        if (item.type === 'image') {
            // Check image cache
            let img = this.imageCache.get(item.src);
            if (img) {
                return img;
            }

            return new Promise((resolve) => {
                const newImg = new Image();
                newImg.crossOrigin = 'anonymous';
                newImg.onload = () => {
                    this.imageCache.set(item.src, newImg);
                    resolve(newImg);
                };
                newImg.onerror = () => {
                    console.error(`[ExportEngine] Failed to load image: ${item.src}`);
                    resolve(null);
                };
                newImg.src = item.src;
            });
        } else if (item.type === 'video') {
            // Get or create video element from cache
            let video = this.videoCache.get(item.id);

            if (video === undefined) {
                const newVideo = await this.createVideoElement(item);
                if (!newVideo) return null;
                video = newVideo;
                this.videoCache.set(item.id, video);
            }

            // Calculate the correct time position in the source video
            // Formula: timeInSourceVideo = offset + (currentTimelineTime - clipStartTime) * speed
            const speed = item.speed ?? 1;
            const offset = item.offset ?? 0;
            const timeInClip = (currentTime - item.start) * speed;
            const timeInSourceVideo = offset + timeInClip;

            // Clamp to valid video duration
            const clampedTime = Math.max(0, Math.min(timeInSourceVideo, video.duration - 0.01));

            // Seek to the correct time and wait for frame to be ready
            if (Math.abs(video.currentTime - clampedTime) > 0.01) {
                video.currentTime = clampedTime;

                // Wait for seek to complete with multiple fallback mechanisms
                await this.waitForVideoFrame(video);
            }

            return video;
        }

        return null;
    }

    /**
     * Wait for video frame to be ready after seeking
     * Fast but ensures frame is decoded
     */
    private async waitForVideoFrame(video: HTMLVideoElement): Promise<void> {
        return new Promise<void>((resolve) => {
            const videoAny = video as any;

            // requestVideoFrameCallback is fast AND guarantees frame is ready
            if (typeof videoAny.requestVideoFrameCallback === 'function') {
                videoAny.requestVideoFrameCallback(() => resolve());
                return;
            }

            // Fallback: wait for seeked + minimal decode time
            let isResolved = false;
            const done = () => {
                if (isResolved) return;
                isResolved = true;
                resolve();
            };

            video.addEventListener('seeked', () => {
                // Brief wait for decode - 16ms = 1 frame at 60fps
                setTimeout(done, 16);
            }, { once: true });

            // Quick timeout fallback
            setTimeout(done, 100);
        });
    }

    /**
     * Create and load a video element
     */
    private createVideoElement(item: TimelineItem): Promise<HTMLVideoElement | null> {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.muted = true;
            video.playsInline = true;
            video.preload = 'auto';

            const timeout = setTimeout(() => {
                console.error(`[ExportEngine] Video load timeout: ${item.src}`);
                resolve(null);
            }, 30000); // 30 second timeout

            video.onloadeddata = () => {
                clearTimeout(timeout);
                console.log(`[ExportEngine] Video loaded: ${item.name || item.src} (duration: ${video.duration.toFixed(2)}s)`);
                resolve(video);
            };

            video.onerror = (e) => {
                clearTimeout(timeout);
                console.error(`[ExportEngine] Failed to load video: ${item.src}`, e);
                resolve(null);
            };

            // For blob URLs or same-origin, NEVER set crossOrigin (causes loading failures)
            // For external URLs, try to set crossOrigin for canvas compatibility
            const isExternal = item.src.startsWith('http://') || item.src.startsWith('https://');
            const isBlobOrData = item.src.startsWith('blob:') || item.src.startsWith('data:');

            if (isExternal && !isBlobOrData) {
                video.crossOrigin = 'anonymous';
            }
            // Note: Do NOT set crossOrigin for blob/data URLs!

            video.src = item.src;
            video.load();
        });
    }

    /**
     * Pre-load all video elements from the timeline to ensure smooth export
     */
    private async preloadAllVideos(tracks: Track[]): Promise<void> {
        const videoItems: TimelineItem[] = [];

        // Collect all video items from all tracks
        for (const track of tracks) {
            for (const item of track.items) {
                if (item.type === 'video') {
                    videoItems.push(item);
                }
            }
        }

        if (videoItems.length === 0) {
            console.log('[ExportEngine] No video items to preload');
            return;
        }

        console.log(`[ExportEngine] Pre-loading ${videoItems.length} video(s)...`);

        // Load all videos in parallel
        const loadPromises = videoItems.map(async (item) => {
            // Skip if already cached
            if (this.videoCache.has(item.id)) {
                console.log(`   ✓ Already cached: ${item.name || item.id}`);
                return;
            }

            const video = await this.createVideoElement(item);
            if (video) {
                this.videoCache.set(item.id, video);

                // Pre-buffer the video by seeking through key positions
                try {
                    // Seek to start and wait
                    video.currentTime = item.offset ?? 0;
                    await new Promise<void>((resolve) => {
                        const onSeeked = () => {
                            video.removeEventListener('seeked', onSeeked);
                            resolve();
                        };
                        video.addEventListener('seeked', onSeeked);
                        setTimeout(resolve, 500);
                    });
                    console.log(`   ✓ Pre-loaded: ${item.name || item.id}`);
                } catch (e) {
                    console.warn(`   ⚠ Pre-buffer failed: ${item.name || item.id}`, e);
                }
            }
        });

        await Promise.all(loadPromises);
        console.log(`[ExportEngine] All ${videoItems.length} video(s) pre-loaded`);
    }

    /**
     * Set up audio tracks from timeline using Web Audio API
     * Creates a mixed audio stream from all audio clips in the timeline
     */
    private async setupAudioTracks(tracks: Track[], duration: number): Promise<MediaStreamTrack[]> {
        const audioTrack = tracks.find(t => t.type === 'audio');
        if (!audioTrack || audioTrack.items.length === 0) {
            console.log('%c🔇 No audio tracks found', 'color: #ffaa00');
            return [];
        }

        try {
            console.log(`%c🎵 Setting up audio (${audioTrack.items.length} clips)...`, 'color: #00aaff');

            // Create AudioContext
            const audioContext = new AudioContext({ sampleRate: 48000 });
            const destination = audioContext.createMediaStreamDestination();

            // Load and schedule all audio clips
            const audioBuffers: Array<{ buffer: AudioBuffer; item: TimelineItem }> = [];

            for (const item of audioTrack.items) {
                try {
                    const buffer = await this.loadAudioBuffer(audioContext, item.src);
                    if (buffer) {
                        audioBuffers.push({ buffer, item });
                        console.log(`   ✓ Loaded: ${item.name || 'Audio clip'}`);
                    }
                } catch (error) {
                    console.warn(`   ✗ Failed to load: ${item.name}`, error);
                }
            }

            if (audioBuffers.length === 0) {
                console.warn('%c⚠️ No audio clips could be loaded', 'color: #ff6600');
                return [];
            }

            // Schedule all audio clips to play at their timeline positions
            for (const { buffer, item } of audioBuffers) {
                const source = audioContext.createBufferSource();
                source.buffer = buffer;

                // Create gain node for volume control
                const gainNode = audioContext.createGain();
                gainNode.gain.value = (item.volume ?? 100) / 100;

                // Connect: source → gain → destination
                source.connect(gainNode);
                gainNode.connect(destination);

                // Calculate time within clip (accounting for offset and speed)
                const speed = item.speed ?? 1;
                const offset = item.offset ?? 0;
                source.playbackRate.value = speed;

                // Schedule clip to start at its timeline position
                const startTime = item.start;
                const clipDuration = Math.min(item.duration / speed, buffer.duration - offset);

                // Start playback
                source.start(startTime, offset, clipDuration);

                console.log(`   ⏯️  Scheduled: ${item.name} at ${startTime.toFixed(2)}s (duration: ${clipDuration.toFixed(2)}s, volume: ${(item.volume ?? 100)}%)`);
            }

            // Get the audio stream track
            const audioTracks = destination.stream.getAudioTracks();

            if (audioTracks.length > 0) {
                console.log(`%c✅ Audio setup complete! ${audioTracks.length} track(s) ready`, 'color: #00ff00');
                return audioTracks;
            } else {
                console.warn('%c⚠️ No audio tracks in destination stream', 'color: #ff6600');
                return [];
            }

        } catch (error) {
            console.error('[ExportEngine] Audio setup failed:', error);
            return [];
        }
    }

    /**
     * Load audio file as AudioBuffer
     */
    private async loadAudioBuffer(audioContext: AudioContext, src: string): Promise<AudioBuffer | null> {
        try {
            const response = await fetch(src);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load audio: ${src}`, error);
            return null;
        }
    }

    /**
     * Get appropriate MIME type for MediaRecorder
     */
    private getMimeType(settings: ExportSettings): string {
        const { format, encoder } = settings;

        if (format === 'mp4') {
            if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
                return 'video/mp4;codecs=h264';
            }
        } else if (format === 'webm') {
            if (encoder === 'vp9' && MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                return 'video/webm;codecs=vp9';
            }
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                return 'video/webm;codecs=vp8';
            }
        }

        // Fallback
        return 'video/webm';
    }

    /**
     * Get bitrate based on quality and resolution
     */
    private getBitrate(settings: ExportSettings): number {
        const config = BITRATE_CONFIGS[settings.resolution.label];
        if (!config) return 10000; // Default 10 Mbps

        return config[settings.quality];
    }

    /**
     * Cancel ongoing export
     */
    cancel(): void {
        this.cancelled = true;
    }

    /**
     * Cleanup resources
     */
    private cleanup(): void {
        // Clean up video elements
        for (const video of this.videoCache.values()) {
            video.pause();
            video.src = '';
            video.load();
        }
        this.videoCache.clear();
        this.imageCache.clear();

        this.canvas = null;
        this.ctx = null;
    }
}

export const exportEngine = new ExportEngine();
