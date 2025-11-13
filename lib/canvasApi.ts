/**
 * Canvas-specific API functions
 * These functions interact with the Canvas backend endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';
const CANVAS_API = `${API_BASE_URL}/api/canvas`;

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
  createdAt: string;
  updatedAt: string;
}

export interface CanvasOp {
  type: 'create' | 'update' | 'delete' | 'move' | 'resize' | 'select' | 'connect' | 'group' | 'ungroup';
  elementId?: string;
  elementIds?: string[];
  data: Record<string, any>;
  requestId: string;
  clientTs: number;
  inverse?: CanvasOp;
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

  const response = await fetch(`${CANVAS_API}/projects`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
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
  const response = await fetch(`${CANVAS_API}/projects/${projectId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  return result.data?.project || null;
}

/**
 * Append an operation to a project
 */
export async function appendOp(
  projectId: string,
  op: CanvasOp
): Promise<{ opId: string; opIndex: number }> {
  const response = await fetch(`${CANVAS_API}/projects/${projectId}/ops`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
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
  const response = await fetch(
    `${CANVAS_API}/projects/${projectId}/ops?fromOp=${fromOp}&limit=${limit}`,
    {
      credentials: 'include',
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
      const response = await fetch(`${CANVAS_API}/projects?limit=${limit}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      return result.data?.projects || [];
    } catch (error) {
      console.error('Error fetching projects:', error);
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

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get snapshot');
  }

  const result = await response.json();
  return result.data;
}

