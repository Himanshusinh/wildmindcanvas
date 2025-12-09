// ============================================
// Server Export Service
// Frontend service that calls the backend API for server-side FFmpeg export
// ============================================

import type { Track, CanvasDimension } from '../../types';
import type { ExportSettings, ExportProgress } from '../types/export';

// API base URL for video export
// NOTE: The main .env has NEXT_PUBLIC_API_BASE_URL set to port 5001 but backend is on 3000
// For video export, we use the correct backend port directly
const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_BASE = isDev
    ? 'http://localhost:3000/api'  // Local dev backend
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.wildmindai.com') + '/api';

interface ServerExportOptions {
    tracks: Track[];
    duration: number;
    dimension: CanvasDimension;
    settings: ExportSettings;
    onProgress: (progress: ExportProgress) => void;
}

class ServerExportService {
    private pollingInterval: NodeJS.Timeout | null = null;

    /**
     * Check if server-side export is available
     * Returns true if the backend video-export API responds
     */
    async isAvailable(): Promise<boolean> {
        try {
            // Use AbortController for quick timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            // Try to start a job - if it returns any JSON response, server is available
            const response = await fetch(`${API_BASE}/video-export/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Check if we got a successful response
            if (response.ok) {
                // Clean up the test job we just created
                const data = await response.json();
                if (data.jobId) {
                    fetch(`${API_BASE}/video-export/${data.jobId}`, { method: 'DELETE' }).catch(() => { });
                }
                console.log('[ServerExport] Server available - routes loaded');
                return true;
            }

            // 404 means routes not loaded
            console.log('[ServerExport] Server not available - status:', response.status);
            return false;
        } catch (error) {
            // Network error or abort - server not available
            console.log('[ServerExport] Server not available:', error instanceof Error ? error.message : 'unknown');
            return false;
        }
    }

    /**
     * Export video using server-side FFmpeg
     */
    async export(options: ServerExportOptions): Promise<Blob> {
        const { tracks, duration, dimension, settings, onProgress } = options;

        onProgress({ phase: 'preparing', progress: 0 });

        // Step 1: Start export job
        const startResponse = await fetch(`${API_BASE}/video-export/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!startResponse.ok) {
            throw new Error('Failed to start export job');
        }

        const { jobId } = await startResponse.json();
        console.log(`[ServerExport] Started job ${jobId}`);

        onProgress({ phase: 'preparing', progress: 5 });

        // Step 2: Collect and upload assets
        const assets = this.collectAssets(tracks);

        if (assets.length > 0) {
            onProgress({ phase: 'preparing', progress: 10 });
            await this.uploadAssets(jobId, assets, (uploadProgress) => {
                onProgress({
                    phase: 'rendering',
                    progress: 10 + uploadProgress * 0.2 // 10-30%
                });
            });
        }

        // Step 3: Start processing
        const timeline = {
            tracks: tracks.map(track => ({
                id: track.id,
                type: track.type,
                items: track.items.map(item => ({
                    ...item,
                    localPath: undefined // Will be set by server
                }))
            })),
            duration,
            dimension: { width: dimension.width, height: dimension.height }
        };

        const processResponse = await fetch(`${API_BASE}/video-export/process/${jobId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                timeline,
                settings: {
                    resolution: settings.resolution,
                    fps: settings.fps,
                    quality: settings.quality,
                    format: settings.format,
                    useHardwareAccel: settings.useGPU
                }
            })
        });

        if (!processResponse.ok) {
            throw new Error('Failed to start processing');
        }

        // Step 4: Poll for progress
        onProgress({ phase: 'encoding', progress: 30 });

        let errorCount = 0;
        const MAX_ERRORS = 5;

        return new Promise((resolve, reject) => {
            this.pollingInterval = setInterval(async () => {
                try {
                    const statusResponse = await fetch(`${API_BASE}/video-export/status/${jobId}`);

                    if (!statusResponse.ok) {
                        throw new Error(`Status check failed: ${statusResponse.status}`);
                    }

                    const status = await statusResponse.json();
                    errorCount = 0; // Reset on success

                    if (status.status === 'complete' && status.downloadReady) {
                        this.stopPolling();
                        onProgress({ phase: 'finalizing', progress: 95 });

                        // Download the video
                        const downloadResponse = await fetch(`${API_BASE}/video-export/download/${jobId}`);
                        const blob = await downloadResponse.blob();

                        // Cleanup
                        fetch(`${API_BASE}/video-export/${jobId}`, { method: 'DELETE' }).catch(() => { });

                        onProgress({ phase: 'complete', progress: 100 });
                        resolve(blob);
                    } else if (status.status === 'error') {
                        this.stopPolling();
                        reject(new Error(status.error || 'Export failed'));
                    } else {
                        // Update progress
                        const progress = 30 + (status.progress || 0) * 0.65; // 30-95%
                        onProgress({ phase: 'encoding', progress });
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`[ServerExport] Polling error (${errorCount}/${MAX_ERRORS}):`, error);

                    if (errorCount >= MAX_ERRORS) {
                        this.stopPolling();
                        reject(new Error('Server connection lost. Please try client-side export instead.'));
                    }
                }
            }, 2000); // Poll every 2 seconds instead of 1
        });
    }

    /**
     * Collect all media assets from tracks
     */
    private collectAssets(tracks: Track[]): { id: string; name: string; blob: Blob | null; url: string }[] {
        const assets: { id: string; name: string; blob: Blob | null; url: string }[] = [];

        for (const track of tracks) {
            for (const item of track.items) {
                if ((item.type === 'video' || item.type === 'image' || item.type === 'audio') && item.src) {
                    assets.push({
                        id: item.id,
                        name: item.name || item.id,
                        blob: null,
                        url: item.src
                    });
                }
            }
        }

        return assets;
    }

    /**
     * Upload assets to server
     */
    private async uploadAssets(
        jobId: string,
        assets: { id: string; name: string; url: string }[],
        onProgress: (progress: number) => void
    ): Promise<void> {
        const formData = new FormData();
        let uploadedCount = 0;

        for (const asset of assets) {
            try {
                // Fetch the asset as blob if it's a URL
                const response = await fetch(asset.url);
                const blob = await response.blob();

                // Add to form data
                const filename = `${asset.id}-${asset.name}`;
                formData.append('files', blob, filename);

                uploadedCount++;
                onProgress(uploadedCount / assets.length);
            } catch (error) {
                console.warn(`[ServerExport] Failed to fetch asset ${asset.name}:`, error);
            }
        }

        // Upload all files
        await fetch(`${API_BASE}/video-export/upload/${jobId}`, {
            method: 'POST',
            body: formData
        });
    }

    /**
     * Stop polling
     */
    private stopPolling(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * Cancel export
     */
    cancel(jobId: string): void {
        this.stopPolling();
        fetch(`${API_BASE}/video-export/${jobId}`, { method: 'DELETE' });
    }
}

export const serverExportService = new ServerExportService();
