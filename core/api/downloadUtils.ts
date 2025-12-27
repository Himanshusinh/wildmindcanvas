/**
 * Download utility functions for high-quality media downloads
 */

/**
 * Downloads a file (image, video, audio) from a URL while preserving original quality
 * Uses blob fetching to handle CORS and ensure no quality loss
 * For Zata URLs, uses proxy download endpoint to ensure proper download headers
 * 
 * @param fileUrl - The URL of the file to download
 * @param filename - The desired filename for the downloaded file
 */
export async function downloadFile(fileUrl: string, filename: string): Promise<void> {
    try {
        // Use proxy download URL for Zata URLs to ensure proper download headers
        let downloadUrl = fileUrl;
        if (fileUrl.includes('zata.ai') || fileUrl.includes('zata')) {
            const { buildProxyDownloadUrl } = await import('./proxyUtils');
            downloadUrl = buildProxyDownloadUrl(fileUrl);
        }

        // Method 1: Fetch as blob (handles CORS, preserves quality)
        const response = await fetch(downloadUrl, {
            mode: 'cors',
            credentials: 'same-origin',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';

        // CRITICAL: Append to body, click, and remove
        // DO NOT set target="_blank" - this causes opening in new tab instead of downloading
        document.body.appendChild(link);

        // Trigger download
        link.click();

        // Clean up immediately after click
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        }, 100);

        console.log(`✅ File downloaded successfully: ${filename}`);
    } catch (error) {
        console.error('Failed to download file via blob method:', error);

        // Fallback: Try direct download with proper attributes (for non-Zata URLs)
        try {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = filename;
            link.style.display = 'none';

            // IMPORTANT: Do NOT set target="_blank" - this causes opening in new tab
            // Instead, use proper download attributes
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);

            console.log(`✅ File downloaded successfully (fallback method): ${filename}`);
        } catch (fallbackError) {
            console.error('Failed to download file (both methods failed):', fallbackError);
            throw new Error('Unable to download file. Please try again.');
        }
    }
}

/**
 * Downloads an image from a URL while preserving original quality
 * Uses blob fetching to handle CORS and ensure no quality loss
 * 
 * @param imageUrl - The URL of the image to download
 * @param filename - The desired filename for the downloaded image
 */
export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
    return downloadFile(imageUrl, filename);
}

/**
 * Downloads a video from a URL while preserving original quality
 * Uses blob fetching to handle CORS and ensure no quality loss
 * 
 * @param videoUrl - The URL of the video to download
 * @param filename - The desired filename for the downloaded video
 */
export async function downloadVideo(videoUrl: string, filename: string): Promise<void> {
    return downloadFile(videoUrl, filename);
}

/**
 * Downloads an audio/music file from a URL while preserving original quality
 * Uses blob fetching to handle CORS and ensure no quality loss
 * 
 * @param audioUrl - The URL of the audio file to download
 * @param filename - The desired filename for the downloaded audio file
 */
export async function downloadAudio(audioUrl: string, filename: string): Promise<void> {
    return downloadFile(audioUrl, filename);
}

/**
 * Generates a filename for downloaded images
 * 
 * @param prefix - Prefix for the filename (e.g., 'generated', 'upscaled')
 * @param id - Unique identifier for the image
 * @param extension - File extension (default: 'png')
 * @returns Formatted filename
 */
export function generateDownloadFilename(
    prefix: string,
    id: string,
    extension: string = 'png'
): string {
    const timestamp = Date.now();
    const sanitizedPrefix = prefix.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const sanitizedId = id.replace(/[^a-z0-9-]/g, '-');

    return `${sanitizedPrefix}-${sanitizedId}-${timestamp}.${extension}`;
}
