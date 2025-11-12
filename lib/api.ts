const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

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

  const response = await fetch(`${API_BASE_URL}/fal/generate`, {
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

  const response = await fetch(`${API_BASE_URL}/bfl/generate`, {
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

  const response = await fetch(`${API_BASE_URL}/replicate/generate`, {
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

