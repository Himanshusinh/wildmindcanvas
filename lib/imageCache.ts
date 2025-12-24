/**
 * Global Image Cache to prevent redundant network requests and DOM element creation.
 * Stores loaded HTMLImageElements keyed by URL.
 */
class ImageCache {
    private cache = new Map<string, Promise<HTMLImageElement>>();

    /**
     * Load an image from a URL. 
     * Returns a promise that resolves to the HTMLImageElement.
     * If the image is already loading or loaded, returns the existing promise.
     */
    load(url: string): Promise<HTMLImageElement> {
        if (!url) return Promise.reject(new Error('No URL provided'));

        if (this.cache.has(url)) {
            return this.cache.get(url)!;
        }

        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = url;

            img.onload = () => {
                resolve(img);
            };

            img.onerror = (e) => {
                // Remove from cache so we can try again later
                this.cache.delete(url);
                console.error(`[ImageCache] Failed to load image: ${url}`, e);
                reject(new Error(`Failed to load image: ${url}`));
            };
        });

        this.cache.set(url, promise);
        return promise;
    }

    /**
     * Check if an image is already cached (sync check).
     * Note: This returns the promise, not the image itself immediately, 
     * but useful for checking presence.
     */
    get(url: string): Promise<HTMLImageElement> | undefined {
        return this.cache.get(url);
    }

    /**
     * Manually remove an entry from the cache.
     */
    remove(url: string) {
        this.cache.delete(url);
    }

    /**
     * Clear the entire cache.
     */
    clear() {
        this.cache.clear();
    }
}

export const imageCache = new ImageCache();
