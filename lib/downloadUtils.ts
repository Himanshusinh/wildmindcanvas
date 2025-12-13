/**
 * Download utility functions for high-quality image downloads
 */

/**
 * Downloads an image from a URL while preserving original quality
 * Uses blob fetching to handle CORS and ensure no quality loss
 * 
 * @param imageUrl - The URL of the image to download
 * @param filename - The desired filename for the downloaded image
 */
export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
    try {
        // Method 1: Fetch as blob (handles CORS, preserves quality)
        const response = await fetch(imageUrl, {
            mode: 'cors',
            credentials: 'same-origin',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';

        // CRITICAL: Append to body, click, and remove
        document.body.appendChild(link);

        // Trigger download
        link.click();

        // Clean up immediately after click
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        }, 100);

        console.log(`✅ Image downloaded successfully: ${filename}`);
    } catch (error) {
        console.error('Failed to download image via blob method:', error);

        // Fallback: Try direct download with proper attributes
        try {
            const link = document.createElement('a');
            link.href = imageUrl;
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

            console.log(`✅ Image downloaded successfully (fallback method): ${filename}`);
        } catch (fallbackError) {
            console.error('Failed to download image (both methods failed):', fallbackError);
            throw new Error('Unable to download image. Please try again.');
        }
    }
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
