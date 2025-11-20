import { getCachedRequest, setCachedRequest } from './apiCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api-gateway-services-wildmind.onrender.com';
const API_GATEWAY_URL = `${API_BASE_URL}/api`;

export interface ImageGenerationRequest {
  prompt: string;
  model: string;
  aspectRatio: string;
  num_images?: number;
}

export interface ImageGenerationResponse {
  responseStatus: 'success' | 'error';
  message: string;
  data: {
    images: Array<{
      url: string;
      originalUrl: string;
      id: string;
    }>;
    historyId?: string;
  };
}

/**
 * Generate image using FAL API (Google Nano Banana, Seedream v4)
 */
export async function generateImageFAL(
  prompt: string,
  model: string,
  aspectRatio: string,
  token?: string
): Promise<ImageGenerationResponse> {
  // Map frontend model names to backend model names
  let backendModel = model.toLowerCase();
  if (backendModel.includes('google nano banana') || backendModel.includes('nano banana')) {
    backendModel = 'gemini-25-flash-image';
  } else if (backendModel.includes('seedream') && backendModel.includes('4k')) {
    backendModel = 'seedream-v4';
  } else if (backendModel.includes('seedream')) {
    backendModel = 'seedream-v4';
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_GATEWAY_URL}/fal/generate`, {
    method: 'POST',
    headers,
    credentials: 'include', // This will automatically send cookies if they exist
    body: JSON.stringify({
      prompt,
      model: backendModel,
      aspect_ratio: aspectRatio,
      num_images: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to generate image' }));
    throw new Error(error.message || 'Failed to generate image');
  }

  return response.json();
}

/**
 * Generate image using BFL API (Flux models)
 */
export async function generateImageBFL(
  prompt: string,
  model: string,
  aspectRatio: string,
  token?: string
): Promise<ImageGenerationResponse> {
  // Map frontend model names to backend model names
  let backendModel = model.toLowerCase().replace(/\s+/g, '-');
  if (backendModel.includes('flux-kontext-max')) {
    backendModel = 'flux-kontext-max';
  } else if (backendModel.includes('flux-kontext-pro')) {
    backendModel = 'flux-kontext-pro';
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_GATEWAY_URL}/bfl/generate`, {
    method: 'POST',
    headers,
    credentials: 'include', // This will automatically send cookies if they exist
    body: JSON.stringify({
      prompt,
      model: backendModel,
      frameSize: aspectRatio,
      n: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to generate image' }));
    throw new Error(error.message || 'Failed to generate image');
  }

  return response.json();
}

/**
 * Generate image using Replicate API (Seedream v4 alternative)
 */
export async function generateImageReplicate(
  prompt: string,
  model: string,
  aspectRatio: string,
  token?: string
): Promise<ImageGenerationResponse> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_GATEWAY_URL}/replicate/generate`, {
    method: 'POST',
    headers,
    credentials: 'include', // This will automatically send cookies if they exist
    body: JSON.stringify({
      prompt,
      model: 'bytedance/seedream-4',
      aspect_ratio: aspectRatio,
      size: '4K',
      max_images: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to generate image' }));
    throw new Error(error.message || 'Failed to generate image');
  }

  return response.json();
}

/**
 * Main function to generate image - routes to appropriate API based on model
 */
export async function generateImage(
  prompt: string,
  model: string,
  aspectRatio: string,
  token?: string
): Promise<string> {
  const modelLower = model.toLowerCase();
  
  // Determine which API to use based on model
  let response: ImageGenerationResponse;
  
  if (modelLower.includes('flux')) {
    // Use BFL API for Flux models
    response = await generateImageBFL(prompt, model, aspectRatio, token);
  } else if (modelLower.includes('seedream') && modelLower.includes('4k')) {
    // Use Replicate API for Seedream 4K
    response = await generateImageReplicate(prompt, model, aspectRatio, token);
  } else {
    // Use FAL API for Google Nano Banana and Seedream v4
    response = await generateImageFAL(prompt, model, aspectRatio, token);
  }

  if (response.responseStatus === 'error') {
    throw new Error(response.message || 'Failed to generate image');
  }

  // Handle different response structures
  if (response.data) {
    // FAL and BFL return { images: [...] }
    if (response.data.images && Array.isArray(response.data.images) && response.data.images.length > 0) {
      return response.data.images[0].url || response.data.images[0].originalUrl;
    }
  }

  throw new Error('No image URL returned from API');
}

/**
 * Generate image for Canvas using the Canvas-specific endpoint
 * This endpoint automatically uploads to Zata and creates media records
 */
export async function generateImageForCanvas(
  prompt: string,
  model: string,
  aspectRatio: string,
  projectId: string,
  width?: number,
  height?: number,
  imageCount?: number
): Promise<{ mediaId: string; url: string; storagePath: string; generationId?: string; images?: Array<{ mediaId: string; url: string; storagePath: string }> }> {
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

  try {
    const response = await fetch(`${API_GATEWAY_URL}/canvas/generate`, {
      method: 'POST',
      credentials: 'include', // Include cookies (app_session)
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        prompt,
        model,
        width,
        height,
        aspectRatio, // Pass aspectRatio for proper model mapping
        imageCount, // Pass imageCount to generate multiple images
        meta: {
          source: 'canvas',
          projectId,
        },
      }),
    });

    clearTimeout(timeoutId);

    // Handle empty response
    if (!response || response.status === 0) {
      throw new Error('Empty response from server. Please check if the API Gateway is running.');
    }

    // Try to parse response, handle empty body
    let result;
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    
    if (!text || text.trim() === '') {
      throw new Error('Empty response body from server');
    }
    
    if (contentType.includes('application/json')) {
      try {
        result = JSON.parse(text);
      } catch (parseError: any) {
        // If parsing fails, try to get more info
        if (parseError instanceof SyntaxError) {
          throw new Error(`Invalid JSON response from server. Status: ${response.status}. Response: ${text.substring(0, 200)}`);
        }
        throw new Error(`Failed to parse response: ${parseError.message}`);
      }
    } else {
      // Non-JSON response - include it in error
      throw new Error(`Unexpected content type: ${contentType || 'unknown'}. Response: ${text.substring(0, 200)}`);
    }

    if (!response.ok) {
      const errorMessage = result?.message || result?.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage || 'Failed to generate image');
    }
    
    // Handle API Gateway response format
    if (result.responseStatus === 'error') {
      throw new Error(result.message || 'Failed to generate image');
    }

    // Return the data object directly (contains mediaId, url, storagePath, generationId)
    return result.data || result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Image generation is taking too long. Please try again.');
    }
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Failed to generate image. Please check your connection and try again.');
  }
}

/**
 * Generate video for Canvas using Seedance 1.0 Pro
 * Returns taskId for polling the result
 */
export async function generateVideoForCanvas(
  prompt: string,
  model: string,
  aspectRatio: string,
  projectId: string,
  duration?: number,
  resolution?: string,
  firstFrameUrl?: string,
  lastFrameUrl?: string
): Promise<{ mediaId?: string; url?: string; storagePath?: string; generationId?: string; taskId?: string; provider?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

  try {
    const response = await fetch(`${API_GATEWAY_URL}/canvas/generate-video`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        prompt,
        model,
        aspectRatio,
        duration: duration || 5,
        resolution: resolution || '1080p',
        firstFrameUrl,
        lastFrameUrl,
        meta: {
          source: 'canvas',
          projectId,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response || response.status === 0) {
      throw new Error('Empty response from server. Please check if the API Gateway is running.');
    }

    let result;
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    
    if (!text || text.trim() === '') {
      throw new Error('Empty response body from server');
    }
    
    if (contentType.includes('application/json')) {
      try {
        result = JSON.parse(text);
      } catch (parseError: any) {
        if (parseError instanceof SyntaxError) {
          throw new Error(`Invalid JSON response from server. Status: ${response.status}. Response: ${text.substring(0, 200)}`);
        }
        throw new Error(`Failed to parse response: ${parseError.message}`);
      }
    } else {
      throw new Error(`Unexpected content type: ${contentType || 'unknown'}. Response: ${text.substring(0, 200)}`);
    }

    if (!response.ok) {
      const errorMessage = result?.message || result?.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage || 'Failed to generate video');
    }
    
    if (result.responseStatus === 'error') {
      throw new Error(result.message || 'Failed to generate video');
    }

    return result.data || result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Video generation is taking too long. Please try again.');
    }
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Failed to generate video. Please check your connection and try again.');
  }
}

/**
 * Poll FAL queue status
 */
export async function getFalQueueStatus(requestId: string): Promise<any> {
  const res = await fetch(`${API_GATEWAY_URL}/fal/queue/status?requestId=${encodeURIComponent(requestId)}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store', // Disable caching for polling
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to fetch FAL status');
  return json?.data || json;
}

/**
 * Fetch FAL queue result (final output)
 */
export async function getFalQueueResult(requestId: string): Promise<any> {
  const res = await fetch(`${API_GATEWAY_URL}/fal/queue/result?requestId=${encodeURIComponent(requestId)}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store', // Disable caching for polling
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to fetch FAL result');
  return json?.data || json;
}

/**
 * Poll Replicate queue status (generic for Seedance/Kling/WAN/etc.)
 */
export async function getReplicateQueueStatus(requestId: string): Promise<any> {
  const res = await fetch(`${API_GATEWAY_URL}/replicate/queue/status?requestId=${encodeURIComponent(requestId)}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store', // Disable caching for polling
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Handle 404 specifically - prediction not found
    if (res.status === 404) {
      const error = new Error(json?.message || 'Prediction not found. The prediction may have been deleted or expired.');
      (error as any).status = 404;
      (error as any).isNotFound = true;
      throw error;
    }
    throw new Error(json?.message || 'Failed to fetch status');
  }
  return json?.data || json;
}

/**
 * Poll MiniMax video status
 */
export async function getMiniMaxVideoStatus(taskId: string): Promise<any> {
  const res = await fetch(`${API_GATEWAY_URL}/minimax/video/status?task_id=${encodeURIComponent(taskId)}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store', // Disable caching for polling
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Handle 404 specifically - task not found
    if (res.status === 404) {
      const error = new Error(json?.message || 'Task not found. The task may have been deleted or expired.');
      (error as any).status = 404;
      (error as any).isNotFound = true;
      throw error;
    }
    throw new Error(json?.message || 'Failed to fetch MiniMax status');
  }
  return json?.data || json;
}

/**
 * Fetch MiniMax video file (final output)
 */
export async function getMiniMaxVideoFile(fileId: string, historyId?: string): Promise<any> {
  const params = new URLSearchParams({ file_id: fileId });
  if (historyId) params.append('history_id', historyId);
  const res = await fetch(`${API_GATEWAY_URL}/minimax/video/file?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || 'Failed to fetch MiniMax video file');
  }
  return json?.data || json;
}

/**
 * Fetch Replicate queue result (final output, persists history on backend)
 */
export async function getReplicateQueueResult(requestId: string): Promise<any> {
  const res = await fetch(`${API_GATEWAY_URL}/replicate/queue/result?requestId=${encodeURIComponent(requestId)}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store', // Disable caching for polling
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || 'Failed to fetch result');
  return json?.data || json;
}

/**
 * Get current user info from API (with request deduplication)
 */
export async function getCurrentUser(): Promise<{ uid: string; username: string; email: string; credits?: number } | null> {
  const cacheKey = 'getCurrentUser';
  
  // Check cache first
  const cached = getCachedRequest<{ uid: string; username: string; email: string; credits?: number } | null>(cacheKey);
  if (cached) {
    return cached;
  }

  // Create new request
  const requestPromise = (async () => {
    try {
      const response = await fetch(`${API_GATEWAY_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include', // Include cookies (app_session)
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      if (result.responseStatus === 'success' && result.data?.user) {
        return {
          uid: result.data.user.uid,
          username: result.data.user.username,
          email: result.data.user.email,
          credits: result.data.credits,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  })();

  // Cache the request
  return setCachedRequest(cacheKey, requestPromise);
}

/**
 * Media Library Types
 */
export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'music' | 'uploaded';
  thumbnail?: string;
  prompt?: string;
  model?: string;
  createdAt?: string;
  storagePath?: string;
  mediaId?: string;
}

export interface MediaLibraryResponse {
  responseStatus: 'success' | 'error';
  message?: string;
  data?: {
    images?: MediaItem[];
    videos?: MediaItem[];
    music?: MediaItem[];
    uploaded?: MediaItem[];
  };
}

/**
 * Get user's media library (generated and uploaded)
 */
export async function getMediaLibrary(): Promise<MediaLibraryResponse> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/canvas/media-library`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch media library' }));
      return {
        responseStatus: 'error',
        message: error.message || 'Failed to fetch media library',
      };
    }

    const result = await response.json();
    return {
      responseStatus: 'success',
      data: result.data || {
        images: [],
        videos: [],
        music: [],
        uploaded: [],
      },
    };
  } catch (error: any) {
    return {
      responseStatus: 'error',
      message: error.message || 'Failed to fetch media library',
    };
  }
}

/**
 * Save uploaded media from canvas to generation history
 * This allows uploaded files to appear in "My Uploads" in the library
 */
export async function saveUploadedMedia(
  url: string,
  type: 'image' | 'video',
  projectId?: string
): Promise<{ success: boolean; id?: string; url?: string; storagePath?: string; historyId?: string; error?: string }> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/canvas/media-library/upload`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        type,
        projectId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to save uploaded media' }));
      return {
        success: false,
        error: error.message || 'Failed to save uploaded media',
      };
    }

    const result = await response.json();
    if (result.responseStatus === 'success' && result.data) {
      return {
        success: true,
        id: result.data.id,
        url: result.data.url,
        storagePath: result.data.storagePath,
        historyId: result.data.historyId,
      };
    }

    return {
      success: false,
      error: result.message || 'Failed to save uploaded media',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to save uploaded media',
    };
  }
}

