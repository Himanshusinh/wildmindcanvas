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
  imageCount?: number,
  sourceImageUrl?: string
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
        sourceImageUrl, // Pass sourceImageUrl for image-to-image generation
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
 * Upscale image for Canvas
 */
export async function upscaleImageForCanvas(
  image: string,
  model: string,
  scale: number,
  projectId: string
): Promise<{ url: string; storagePath: string; mediaId?: string; generationId?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

  try {
    const response = await fetch(`${API_GATEWAY_URL}/canvas/upscale`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        image,
        model,
        scale,
        meta: {
          source: 'canvas',
          projectId,
        },
      }),
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    let text: string;
    let result: any;

    try {
      text = await response.text();
    } catch (readError: any) {
      throw new Error(`Failed to read response: ${readError.message}`);
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
      throw new Error(errorMessage || 'Failed to upscale image');
    }
    
    if (result.responseStatus === 'error') {
      throw new Error(result.message || 'Failed to upscale image');
    }

    return result.data || result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Image upscaling is taking too long. Please try again.');
    }
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Failed to upscale image. Please check your connection and try again.');
  }
}

/**
 * Vectorize image for Canvas
 */
export async function vectorizeImageForCanvas(
  image: string,
  projectId: string,
  mode?: string
): Promise<{ url: string; storagePath: string; mediaId?: string; generationId?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

  try {
    const response = await fetch(`${API_GATEWAY_URL}/canvas/vectorize`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        image,
        mode: mode || 'simple',
        meta: {
          source: 'canvas',
          projectId,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vectorize failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return {
      url: data.data?.url || data.url || '',
      storagePath: data.data?.storagePath || '',
      mediaId: data.data?.mediaId,
      generationId: data.data?.generationId,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Remove background from image for Canvas
 */
export async function removeBgImageForCanvas(
  image: string,
  projectId: string,
  model?: string,
  backgroundType?: string,
  scaleValue?: number
): Promise<{ url: string; storagePath: string; mediaId?: string; generationId?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

  try {
    const response = await fetch(`${API_GATEWAY_URL}/canvas/removebg`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        image,
        model: model || '851-labs/background-remover',
        backgroundType: backgroundType || 'rgba (transparent)',
        scaleValue: scaleValue !== undefined ? scaleValue : 0.5,
        meta: {
          source: 'canvas',
          projectId,
        },
      }),
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    let text: string;
    let result: any;

    try {
      text = await response.text();
    } catch (readError: any) {
      throw new Error(`Failed to read response: ${readError.message}`);
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
      throw new Error(errorMessage || 'Failed to remove background');
    }
    
    if (result.responseStatus === 'error') {
      throw new Error(result.message || 'Failed to remove background');
    }

    return result.data || result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Background removal is taking too long. Please try again.');
    }
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Failed to remove background. Please check your connection and try again.');
  }
}

/**
 * Erase parts of an image using AI
 */
export async function eraseImageForCanvas(
  image: string,
  projectId: string,
  model?: string,
  mask?: string,
  prompt?: string
): Promise<{ url: string; storagePath: string; mediaId?: string; generationId?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

  try {
    // Image should be composited with white mask overlay (mask is now part of the image)
    // So mask parameter is optional/null now

    // Analyze mask to verify it has white pixels
    let maskAnalysis = null;
    if (mask && mask.startsWith('data:image')) {
      try {
        const img = new Image();
        img.src = mask;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          setTimeout(reject, 5000); // 5 second timeout
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let whitePixelCount = 0;
          let blackPixelCount = 0;
          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            if (r > 128 && g > 128 && b > 128) {
              whitePixelCount++;
            } else {
              blackPixelCount++;
            }
          }
          maskAnalysis = {
            dimensions: { width: img.width, height: img.height },
            totalPixels: imageData.data.length / 4,
            whitePixels: whitePixelCount,
            blackPixels: blackPixelCount,
            whitePercentage: ((whitePixelCount / (imageData.data.length / 4)) * 100).toFixed(2) + '%',
            hasWhitePixels: whitePixelCount > 0
          };
        }
      } catch (e) {
        console.warn('[eraseImageForCanvas] Failed to analyze mask:', e);
      }
    }

    console.log('[eraseImageForCanvas] ========== API REQUEST ==========');
    console.log('[eraseImageForCanvas] Image:', {
      hasImage: !!image,
      imageLength: image?.length || 0,
      imagePreview: image ? image.substring(0, 100) + '...' : 'null'
    });
    console.log('[eraseImageForCanvas] Mask:', {
      hasMask: !!mask,
      maskLength: mask?.length || 0,
      maskPreview: mask ? mask.substring(0, 100) + '...' : 'null',
      maskAnalysis: maskAnalysis || 'N/A (not a data URI or analysis failed)'
    });
    console.log('[eraseImageForCanvas] User Prompt:', prompt || '(none)');
    console.log('[eraseImageForCanvas] Project ID:', projectId);
    console.log('[eraseImageForCanvas] Model:', model || 'default (google-nano-banana-edit)');
    console.log('[eraseImageForCanvas] ===================================');

    const response = await fetch(`${API_GATEWAY_URL}/canvas/erase`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        image,
        mask, // Mask data URI (white = erase, black = keep)
        prompt, // Optional user prompt (will be combined with base prompt)
        meta: {
          source: 'canvas',
          projectId,
        },
      }),
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    let text: string;
    let result: any;

    try {
      text = await response.text();
    } catch (readError: any) {
      throw new Error(`Failed to read response: ${readError.message}`);
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
      throw new Error(errorMessage || 'Failed to erase image');
    }
    
    if (result.responseStatus === 'error') {
      throw new Error(result.message || 'Failed to erase image');
    }

    return result.data || result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Image erasing is taking too long. Please try again.');
    }
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Failed to erase image. Please check your connection and try again.');
  }
}

/**
 * Replace parts of an image using AI (requires prompt)
 */
export async function replaceImageForCanvas(
  image: string,
  projectId: string,
  model?: string,
  mask?: string,
  prompt?: string
): Promise<{ url: string; storagePath: string; mediaId?: string; generationId?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout

  try {
    // Prompt is required for replace (unlike erase which has a default)
    if (!prompt || !prompt.trim()) {
      throw new Error('Prompt is required for image replace. Please describe what you want to replace the selected area with.');
    }

    // Analyze mask to verify it has white pixels
    let maskAnalysis = null;
    if (mask && mask.startsWith('data:image')) {
      try {
        const img = new Image();
        img.src = mask;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          setTimeout(reject, 5000); // 5 second timeout
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let whitePixelCount = 0;
          let blackPixelCount = 0;
          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            if (r > 128 && g > 128 && b > 128) {
              whitePixelCount++;
            } else {
              blackPixelCount++;
            }
          }
          maskAnalysis = {
            dimensions: { width: img.width, height: img.height },
            totalPixels: imageData.data.length / 4,
            whitePixels: whitePixelCount,
            blackPixels: blackPixelCount,
            whitePercentage: ((whitePixelCount / (imageData.data.length / 4)) * 100).toFixed(2) + '%',
            hasWhitePixels: whitePixelCount > 0
          };
        }
      } catch (e) {
        console.warn('[replaceImageForCanvas] Failed to analyze mask:', e);
      }
    }

    console.log('[replaceImageForCanvas] ========== API REQUEST ==========');
    console.log('[replaceImageForCanvas] Image:', {
      hasImage: !!image,
      imageLength: image?.length || 0,
      imagePreview: image ? image.substring(0, 100) + '...' : 'null'
    });
    console.log('[replaceImageForCanvas] Mask:', {
      hasMask: !!mask,
      maskLength: mask?.length || 0,
      maskPreview: mask ? mask.substring(0, 100) + '...' : 'null',
      maskAnalysis: maskAnalysis || 'N/A (not a data URI or analysis failed)'
    });
    console.log('[replaceImageForCanvas] User Prompt (REQUIRED):', prompt || '(MISSING - will fail)');
    console.log('[replaceImageForCanvas] Project ID:', projectId);
    console.log('[replaceImageForCanvas] Model:', model || 'default (google-nano-banana-edit)');
    console.log('[replaceImageForCanvas] ===================================');

    const response = await fetch(`${API_GATEWAY_URL}/canvas/replace`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        image,
        mask, // Mask data URI (white = replace, black = keep)
        prompt, // REQUIRED user prompt (what to replace the white area with)
        meta: {
          source: 'canvas',
          projectId,
        },
      }),
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    let text: string;
    let result: any;

    try {
      text = await response.text();
    } catch (readError: any) {
      throw new Error(`Failed to read response: ${readError.message}`);
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
      throw new Error(errorMessage || 'Failed to replace image');
    }
    
    if (result.responseStatus === 'error') {
      throw new Error(result.message || 'Failed to replace image');
    }

    return result.data || result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Image replacing is taking too long. Please try again.');
    }
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Failed to replace image. Please check your connection and try again.');
  }
}

/**
 * Expand image using Bria Expand API
 * Takes frame position and size to expand the image accordingly
 */
export async function expandImageForCanvas(
  image: string,
  projectId: string,
  canvasSize: [number, number], // [width, height] of the final canvas
  originalImageSize: [number, number], // [width, height] of the original image
  originalImageLocation: [number, number], // [x, y] position of original image in canvas
  prompt?: string,
  aspectRatio?: string
): Promise<{ url: string; storagePath: string; mediaId?: string; generationId?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout for expand

  try {
    // Validate inputs
    if (!canvasSize || canvasSize.length !== 2) {
      throw new Error('canvasSize must be an array of [width, height]');
    }
    if (!originalImageSize || originalImageSize.length !== 2) {
      throw new Error('originalImageSize must be an array of [width, height]');
    }
    if (!originalImageLocation || originalImageLocation.length !== 2) {
      throw new Error('originalImageLocation must be an array of [x, y]');
    }

    // Validate and clamp values to API requirements
    const canvasWidth = Math.max(1, Math.min(5000, Math.round(canvasSize[0])));
    const canvasHeight = Math.max(1, Math.min(5000, Math.round(canvasSize[1])));
    const origWidth = Math.max(1, Math.min(5000, Math.round(originalImageSize[0])));
    const origHeight = Math.max(1, Math.min(5000, Math.round(originalImageSize[1])));
    
    // Clamp image location to ensure image fits within canvas
    // Image must be fully contained: 0 <= x <= canvasWidth - origWidth and 0 <= y <= canvasHeight - origHeight
    const maxX = Math.max(0, canvasWidth - origWidth);
    const maxY = Math.max(0, canvasHeight - origHeight);
    const origX = Math.max(0, Math.min(maxX, Math.round(originalImageLocation[0])));
    const origY = Math.max(0, Math.min(maxY, Math.round(originalImageLocation[1])));
    
    // Validate that image fits within canvas
    if (origX + origWidth > canvasWidth || origY + origHeight > canvasHeight) {
      throw new Error(`Image does not fit within canvas. Image at [${origX}, ${origY}] with size [${origWidth}, ${origHeight}] extends beyond canvas [${canvasWidth}, ${canvasHeight}]`);
    }

    // Validate aspect ratio if provided
    const validAspectRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9'];
    if (aspectRatio && !validAspectRatios.includes(aspectRatio)) {
      console.warn('[expandImageForCanvas] Invalid aspect ratio, ignoring:', aspectRatio);
      aspectRatio = undefined;
    }

    console.log('[expandImageForCanvas] Starting expand:', {
      hasImage: !!image,
      canvasSize: [canvasWidth, canvasHeight],
      originalImageSize: [origWidth, origHeight],
      originalImageLocation: [origX, origY],
      prompt: prompt || '(optional)',
      aspectRatio: aspectRatio || '(not set)',
      projectId
    });

    const payload: any = {
      image_url: image,
      canvas_size: [canvasWidth, canvasHeight],
      original_image_size: [origWidth, origHeight],
      original_image_location: [origX, origY],
      sync_mode: true,
    };

    if (prompt && prompt.trim()) {
      payload.prompt = prompt.trim();
    }

    if (aspectRatio) {
      payload.aspect_ratio = aspectRatio;
    }

    const response = await fetch(`${API_GATEWAY_URL}/fal/bria/expand`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    let text: string;
    let result: any;

    try {
      text = await response.text();
    } catch (readError: any) {
      throw new Error(`Failed to read response: ${readError.message}`);
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
      // Extract detailed error message
      let errorMessage = result?.message || result?.error || `Server error: ${response.status}`;
      
      // If it's a validation error, try to extract more details
      if (response.status === 422 && result?.errors) {
        const validationErrors = Array.isArray(result.errors) 
          ? result.errors.map((e: any) => e.msg || e.message || String(e)).join(', ')
          : JSON.stringify(result.errors);
        errorMessage = `Validation error: ${validationErrors}`;
      } else if (result?.data?.error) {
        errorMessage = result.data.error;
      } else if (result?.error?.message) {
        errorMessage = result.error.message;
      }
      
      console.error('[expandImageForCanvas] API error details:', {
        status: response.status,
        statusText: response.statusText,
        result,
        payload: { ...payload, image_url: payload.image_url?.substring(0, 100) + '...' }
      });
      
      throw new Error(`FAL API error: "${errorMessage}"`);
    }

    // Extract image URL from response
    const imageUrl = result?.data?.image?.url || result?.data?.images?.[0]?.url || result?.images?.[0]?.url || result?.data?.url || result?.url;
    
    if (imageUrl) {
      console.log('[expandImageForCanvas] Expand completed:', imageUrl);
      return {
        url: imageUrl,
        storagePath: '', // Will be set by backend
        mediaId: result?.data?.historyId,
        generationId: result?.data?.historyId,
      };
    }
    
    throw new Error('Failed to expand image. No image URL in response.');
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Expand request timed out. Please try again.');
    }
    console.error('[expandImageForCanvas] Error:', error);
    throw error;
  }
}

/**
 * Query canvas prompt enhancement
 * Calls the /canvas/query endpoint to enhance prompts or get answers
 */
export async function queryCanvasPrompt(
  text: string,
  maxNewTokens?: number
): Promise<{ type: 'image' | 'video' | 'music' | 'answer'; enhanced_prompt: string | null; response: string | null }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(`${API_GATEWAY_URL}/canvas/query`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        text: text.trim(),
        max_new_tokens: maxNewTokens || 300,
      }),
    });

    clearTimeout(timeoutId);

    if (!response || response.status === 0) {
      throw new Error('Empty response from server. Please check if the API Gateway is running.');
    }

    const contentType = response.headers.get('content-type') || '';
    const textResponse = await response.text();

    if (!textResponse || textResponse.trim() === '') {
      throw new Error('Empty response body from server');
    }

    let result: any;
    if (contentType.includes('application/json')) {
      try {
        result = JSON.parse(textResponse);
      } catch (parseError: any) {
        throw new Error(`Invalid JSON response from server. Status: ${response.status}. Response: ${textResponse.substring(0, 200)}`);
      }
    } else {
      throw new Error(`Unexpected content type: ${contentType || 'unknown'}. Response: ${textResponse.substring(0, 200)}`);
    }

    if (!response.ok) {
      const errorMessage = result?.message || result?.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage || 'Failed to query canvas prompt');
    }

    if (result.responseStatus === 'error') {
      throw new Error(result.message || 'Failed to query canvas prompt');
    }

    return result.data || result;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout. The prompt enhancement service took too long to respond.');
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Failed to enhance prompt. Please check your connection and try again.');
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

