/**
 * Canvas-specific API functions
 * These functions interact with the Canvas backend endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.wildmindai.com';
const CANVAS_API = `${API_BASE_URL}/api/canvas`;

/**
 * Get Bearer token for authentication (fallback when cookies don't work)
 * Uses the same logic as checkAuthStatus to get token from localStorage or URL hash
 */
async function getFirebaseIdToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    // First, check if token was passed via URL hash (from parent window when opening project)
    if (typeof window !== 'undefined') {
      try {
        const hash = window.location.hash;
        const authTokenMatch = hash.match(/authToken=([^&]+)/);
        if (authTokenMatch) {
          const passedToken = decodeURIComponent(authTokenMatch[1]);
          if (passedToken && passedToken.startsWith('eyJ')) {
            // Store it for future use
            try {
              localStorage.setItem('authToken', passedToken);
            } catch { }
            return passedToken;
          }
        }
      } catch (e) {
        // Ignore hash parsing errors
      }
    }

    // Try to get token from localStorage
    const storedToken = localStorage.getItem('authToken');
    if (storedToken && storedToken.startsWith('eyJ')) {
      return storedToken;
    }

    // Try to get from user object
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const userObj = JSON.parse(userString);
        const token = userObj?.idToken || userObj?.token || null;
        if (token && token.startsWith('eyJ')) {
          return token;
        }
      } catch { }
    }

    // Try idToken directly
    const idToken = localStorage.getItem('idToken');
    if (idToken && idToken.startsWith('eyJ')) {
      return idToken;
    }

    return null;
  } catch (error) {
    console.warn('[CanvasAPI] Error getting Firebase token:', error);
    return null;
  }
}

/**
 * Build headers with Bearer token if available
 */
async function buildAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const bearerToken = await getFirebaseIdToken();
  if (bearerToken) {
    headers['Authorization'] = `Bearer ${bearerToken}`;
  }

  return headers;
}

export interface CanvasProject {
  id: string;
  name: string;
  description?: string;
  ownerUid: string;
  collaborators: Array<{
    uid: string;
    role: 'owner' | 'editor' | 'viewer';
  }>;
  settings?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
  };
  thumbnail?: string;
  previewImages?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CanvasOp {
  type: 'create' | 'update' | 'delete' | 'move' | 'resize' | 'select' | 'connect' | 'bulk-create' | 'generator.delete' | 'media.delete';
  elementId?: string;
  elementIds?: string[];
  data: Record<string, any>;
  requestId: string;
  clientTs: number;
  inverse?: CanvasOp;
}

// Ephemeral generator overlay type and API helpers
export interface GeneratorOverlayDTO {
  id: string;
  type: 'image' | 'video' | 'music';
  x: number;
  y: number;
  generatedImageUrl?: string | null;
  generatedVideoUrl?: string | null;
  generatedMusicUrl?: string | null;
}

export async function listGenerators(projectId: string): Promise<GeneratorOverlayDTO[]> {
  const headers = await buildAuthHeaders();
  const res = await fetch(`${CANVAS_API}/projects/${projectId}/generators`, {
    credentials: 'include',
    headers,
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({ data: { overlays: [] } }));
  return json?.data?.overlays || [];
}

export async function upsertGenerator(projectId: string, overlay: GeneratorOverlayDTO): Promise<void> {
  const headers = await buildAuthHeaders();
  await fetch(`${CANVAS_API}/projects/${projectId}/generators/${encodeURIComponent(overlay.id)}`, {
    method: 'PUT',
    credentials: 'include',
    headers,
    body: JSON.stringify(overlay),
  });
}

export async function deleteGenerator(projectId: string, overlayId: string): Promise<void> {
  const headers = await buildAuthHeaders();
  await fetch(`${CANVAS_API}/projects/${projectId}/generators/${encodeURIComponent(overlayId)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers,
  });
}

/**
 * Create a new Canvas project
 */
export async function createProject(name: string, description?: string): Promise<CanvasProject> {
  // Build request body, excluding undefined values
  const body: { name: string; description?: string } = { name };
  if (description !== undefined && description !== null) {
    body.description = description;
  }

  const headers = await buildAuthHeaders();
  const response = await fetch(`${CANVAS_API}/projects`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create project' }));
    throw new Error(error.message || 'Failed to create project');
  }

  const result = await response.json();
  return result.data?.project;
}

/**
 * Get a Canvas project
 */
export async function getProject(projectId: string): Promise<CanvasProject | null> {
  const headers = await buildAuthHeaders();
  const response = await fetch(`${CANVAS_API}/projects/${projectId}`, {
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  return result.data?.project || null;
}

/**
 * Update a Canvas project
 */
export async function updateProject(
  projectId: string,
  updates: Partial<{ name: string; description: string; settings: CanvasProject['settings'] }>
): Promise<CanvasProject> {
  const headers = await buildAuthHeaders();
  const response = await fetch(`${CANVAS_API}/projects/${projectId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers,
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update project' }));
    throw new Error(error.message || 'Failed to update project');
  }

  const result = await response.json();
  return result.data?.project;
}

/**
 * Append an operation to a project
 */
export async function appendOp(
  projectId: string,
  op: CanvasOp
): Promise<{ opId: string; opIndex: number }> {
  const headers = await buildAuthHeaders();
  const response = await fetch(`${CANVAS_API}/projects/${projectId}/ops`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(op),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to append operation' }));
    throw new Error(error.message || 'Failed to append operation');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get operations after a specific index
 */
export async function getOps(
  projectId: string,
  fromOp: number,
  limit: number = 100
): Promise<CanvasOp[]> {
  const headers = await buildAuthHeaders();
  const response = await fetch(
    `${CANVAS_API}/projects/${projectId}/ops?fromOp=${fromOp}&limit=${limit}`,
    {
      credentials: 'include',
      headers,
    }
  );

  if (!response.ok) {
    return [];
  }

  const result = await response.json();
  return result.data?.ops || [];
}

/**
 * List user's Canvas projects (with request deduplication)
 */
export async function listProjects(limit: number = 20): Promise<CanvasProject[]> {
  const cacheKey = `listProjects:${limit}`;

  // Check cache first (import dynamically to avoid circular dependency)
  const { getCachedRequest, setCachedRequest } = await import('./apiCache');
  const cached = getCachedRequest<CanvasProject[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      const headers = await buildAuthHeaders();
      const response = await fetch(`${CANVAS_API}/projects?limit=${limit}`, {
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          console.error('[CanvasAPI] 401 Unauthorized - Authentication required', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
          });

          // Try to get error message from response
          let errorMessage = 'Unauthorized';
          try {
            const errorData = await response.json();
            errorMessage = errorData?.message || errorData?.error || 'Unauthorized';
          } catch {
            // If JSON parsing fails, use status text
            errorMessage = response.statusText || 'Unauthorized';
          }

          // Throw a specific error that can be caught by callers
          throw new Error(`Authentication required: ${errorMessage}. Please log in again.`);
        }

        // For other errors, log and return empty array (existing behavior)
        console.warn('[CanvasAPI] Failed to fetch projects:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        });
        return [];
      }

      const result = await response.json();
      return result.data?.projects || [];
    } catch (error) {
      // Re-throw authentication errors so callers can handle them
      if (error instanceof Error && error.message.includes('Authentication required')) {
        throw error;
      }

      // For other errors, log and return empty array
      console.error('[CanvasAPI] Error fetching projects:', error);
      return [];
    }
  })();

  // Cache the request
  return setCachedRequest(cacheKey, requestPromise);
}

/**
 * Get snapshot and operations
 */
export async function getSnapshot(
  projectId: string,
  fromOp?: number
): Promise<{
  snapshot: {
    projectId: string;
    snapshotOpIndex: number;
    elements: Record<string, any>;
  };
  ops: CanvasOp[];
  fromOp: number;
}> {
  const url = fromOp
    ? `${CANVAS_API}/projects/${projectId}/snapshot?fromOp=${fromOp}`
    : `${CANVAS_API}/projects/${projectId}/snapshot`;

  const headers = await buildAuthHeaders();
  const response = await fetch(url, {
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to get snapshot');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Overwrite model: get the current snapshot (no ops)
 */
export async function getCurrentSnapshot(
  projectId: string
): Promise<{
  snapshot: {
    projectId: string;
    snapshotOpIndex: number;
    elements: Record<string, any>;
    metadata?: Record<string, any>;
  } | null;
}> {
  const url = `${CANVAS_API}/projects/${projectId}/snapshot/current`;
  const headers = await buildAuthHeaders();
  const response = await fetch(url, {
    credentials: 'include',
    headers,
  });
  if (!response.ok) {
    throw new Error('Failed to get current snapshot');
  }
  const result = await response.json();
  return result.data;
}

/**
 * Overwrite model: set the current snapshot (send full state)
 */
export async function setCurrentSnapshot(
  projectId: string,
  snapshot: { elements: Record<string, any>; metadata?: Record<string, any> }
): Promise<void> {
  const url = `${CANVAS_API}/projects/${projectId}/snapshot/current`;
  const headers = await buildAuthHeaders();
  const response = await fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers,
    body: JSON.stringify(snapshot),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to set snapshot' }));
    throw new Error(err.message || 'Failed to set snapshot');
  }
}

