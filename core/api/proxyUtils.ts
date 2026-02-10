/**
 * Utility functions for using API Gateway proxy routes
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';

/**
 * Extract storage path from Zata URL
 * @param url - Zata URL (e.g., https://idr01.zata.ai/devstoragev1/canvas/project-123/image.jpg)
 * @returns Storage path (e.g., canvas/project-123/image.jpg)
 */
export function extractZataPath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    // Zata URLs usually follow: endpoint/devstoragev1/bucket/key...
    // or endpoint/bucket/key...
    // We need to extract only the 'key...' part because the proxy adds the bucket back.
    let startIndex = 0;

    if (pathParts[0] === 'devstoragev1') {
      startIndex = 1;
    }

    // Check if the next part is the known bucket name 'canvas'
    if (pathParts[startIndex] && (pathParts[startIndex] === 'canvas' || pathParts[startIndex].startsWith('canvas/'))) {
      startIndex++;
    }

    if (startIndex > 0) {
      return pathParts.slice(startIndex).join('/');
    }

    // If no bucket found, return path without first segment
    return pathParts.slice(1).join('/') || null;
  } catch {
    return null;
  }
}

/**
 * Strips any existing /api/proxy/ wrappers from a URL to get the actual target URL or path.
 */
export function unwrapProxyUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;

  // Pattern to match /api/proxy/[type]/[encodedPath]
  const proxyMatch = url.match(/\/api\/proxy\/(?:resource|thumb|media)\/([^?#]+)/);
  if (proxyMatch && proxyMatch[1]) {
    try {
      return decodeURIComponent(proxyMatch[1]);
    } catch (e) {
      console.warn('[proxyUtils] Failed to decode proxied URL:', proxyMatch[1]);
      return proxyMatch[1];
    }
  }
  return url;
}

/**
 * Build proxy download URL
 * @param resourceUrl - Original resource URL (Zata URL or external URL)
 * @returns Proxy download URL
 */
export function buildProxyDownloadUrl(resourceUrl: string): string {
  if (!resourceUrl) return '';
  const actualUrl = unwrapProxyUrl(resourceUrl);

  // Check if it's a Zata URL (or already a path from unwrap)
  if (actualUrl.includes('zata.ai') || actualUrl.includes('zata')) {
    const zataPath = extractZataPath(actualUrl);
    if (zataPath) {
      return `${API_BASE_URL}/api/proxy/download/${encodeURIComponent(zataPath)}`;
    }
  }

  // If it's a relative path (e.g. from a previous unwrap), re-proxy it
  if (!actualUrl.startsWith('http') && actualUrl.includes('/')) {
    return `${API_BASE_URL}/api/proxy/download/${encodeURIComponent(actualUrl)}`;
  }

  // For external URLs, use the full URL as the path
  return `${API_BASE_URL}/api/proxy/download/${encodeURIComponent(actualUrl)}`;
}

/**
 * Build proxy resource URL (for viewing, not downloading)
 * @param resourceUrl - Original resource URL
 * @returns Proxy resource URL
 */
export function buildProxyResourceUrl(resourceUrl: string): string {
  if (!resourceUrl) return '';
  const actualUrl = unwrapProxyUrl(resourceUrl);

  // Check if it's a Zata URL
  if (actualUrl.includes('zata.ai') || actualUrl.includes('zata')) {
    const zataPath = extractZataPath(actualUrl);
    if (zataPath) {
      return `${API_BASE_URL}/api/proxy/resource/${encodeURIComponent(zataPath)}`;
    }
  }

  if (!actualUrl.startsWith('http') && actualUrl.includes('/')) {
    return `${API_BASE_URL}/api/proxy/resource/${encodeURIComponent(actualUrl)}`;
  }

  // For external URLs, use the full URL as the path
  return `${API_BASE_URL}/api/proxy/resource/${encodeURIComponent(actualUrl)}`;
}

/**
 * Build proxy media URL (for media streaming)
 * @param resourceUrl - Original resource URL
 * @returns Proxy media URL
 */
export function buildProxyMediaUrl(resourceUrl: string): string {
  if (!resourceUrl) return '';
  const actualUrl = unwrapProxyUrl(resourceUrl);

  // Check if it's a Zata URL
  if (actualUrl.includes('zata.ai') || actualUrl.includes('zata')) {
    const zataPath = extractZataPath(actualUrl);
    if (zataPath) {
      return `${API_BASE_URL}/api/proxy/media/${encodeURIComponent(zataPath)}`;
    }
  }

  if (!actualUrl.startsWith('http') && actualUrl.includes('/')) {
    return `${API_BASE_URL}/api/proxy/media/${encodeURIComponent(actualUrl)}`;
  }

  // For external URLs, use the full URL as the path
  return `${API_BASE_URL}/api/proxy/media/${encodeURIComponent(actualUrl)}`;
}

/**
 * Build proxy thumbnail URL
 * @param resourceUrl - Original resource URL
 * @param width - Thumbnail width (default: 512)
 * @param quality - Thumbnail quality 10-95 (default: 60)
 * @param format - Output format: 'webp' | 'avif' | 'auto' (default: 'auto')
 * @returns Proxy thumbnail URL
 */
export function buildProxyThumbnailUrl(
  resourceUrl: string,
  width: number = 512,
  quality: number = 60,
  format: 'webp' | 'avif' | 'auto' = 'auto'
): string {
  // If it's already a proxy URL, extract the original path
  let pathToUse: string | null = null;

  if (resourceUrl.includes('/api/proxy/')) {
    // Extract path from proxy URL
    // Format: /api/proxy/resource/ENCODED_PATH or /api/proxy/thumb/ENCODED_PATH
    const match = resourceUrl.match(/\/api\/proxy\/(?:resource|thumb|media)\/([^?]+)/);
    if (match && match[1]) {
      // Decode the path
      pathToUse = decodeURIComponent(match[1]);
    }
  }

  // If not a proxy URL, try to extract Zata path
  if (!pathToUse) {
    pathToUse = extractZataPath(resourceUrl);
  }

  if (!pathToUse) {
    if (resourceUrl.startsWith('http')) {
      // For external URLs, treat full URL as the path to be proxied
      pathToUse = resourceUrl;
    } else {
      // If no path extraction possible and not a URL, return original
      return resourceUrl;
    }
  }

  const params = new URLSearchParams({
    w: String(Math.max(16, Math.min(4096, width))),
    q: String(Math.max(10, Math.min(95, quality))),
    fmt: format,
  });

  return `${API_BASE_URL}/api/proxy/thumb/${encodeURIComponent(pathToUse)}?${params.toString()}`;
}

