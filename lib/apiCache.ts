/**
 * Simple request cache to prevent duplicate API calls
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5000; // 5 seconds

export function getCachedRequest<T>(key: string): Promise<T> | null {
  const entry = cache.get(key);
  if (!entry) return null;

  // Check if cache is still valid
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  // If there's an ongoing request, return that promise
  if (entry.promise) {
    return entry.promise;
  }

  // Return cached data as resolved promise
  return Promise.resolve(entry.data);
}

export function setCachedRequest<T>(key: string, promise: Promise<T>): Promise<T> {
  // Store the promise so duplicate requests can await the same promise
  const entry: CacheEntry = {
    data: null,
    timestamp: Date.now(),
    promise,
  };
  cache.set(key, entry);

  // When promise resolves, store the data
  promise
    .then((data) => {
      if (entry) {
        entry.data = data;
        entry.promise = undefined;
      }
    })
    .catch(() => {
      // On error, remove from cache
      cache.delete(key);
    });

  return promise;
}

export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

