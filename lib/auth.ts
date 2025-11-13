/**
 * Get authentication token from various sources
 * Checks cookies first (for cross-subdomain support), then localStorage
 */
export function getAuthToken(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  // Try to get token from cookies (app_session cookie) - this works across subdomains
  const cookies = document.cookie.split(';');
  const sessionCookie = cookies.find(c => c.trim().startsWith('app_session='));
  if (sessionCookie) {
    const token = sessionCookie.split('=')[1].trim();
    if (token) return token;
  }

  // Fallback to localStorage if available (for development/testing)
  if (typeof window !== 'undefined') {
    return (
      localStorage.getItem('auth_token') ||
      localStorage.getItem('app_session') ||
      localStorage.getItem('idToken') ||
      localStorage.getItem('firebase:authUser') || // Firebase auth
      undefined
    );
  }

  return undefined;
}

/**
 * Check if user is authenticated by checking for app_session cookie
 * This is the primary method for cross-subdomain authentication
 */
export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  // Check for app_session cookie (works across subdomains when domain=.wildmindai.com)
  const cookies = document.cookie.split(';');
  const hasSessionCookie = cookies.some(c => c.trim().startsWith('app_session='));
  
  if (hasSessionCookie) {
    return true;
  }

  // Fallback: check for token in localStorage (development/testing)
  if (typeof window !== 'undefined') {
    return !!(
      localStorage.getItem('auth_token') ||
      localStorage.getItem('app_session') ||
      localStorage.getItem('idToken')
    );
  }

  return false;
}

/**
 * Check authentication status with the API gateway
 * Verifies that the session cookie is still valid
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(`${apiBase}/api/auth/me`, {
        method: 'GET',
        credentials: 'include', // Include cookies (app_session)
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return !!data?.data?.user;
      }

      // 401 or other error means not authenticated
      return false;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Auth check timeout - API Gateway may be unreachable');
      } else if (fetchError.message === 'Failed to fetch' || fetchError.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Failed to fetch auth status - API Gateway may not be running');
        console.error('API Base URL:', apiBase);
        console.error('Make sure the API Gateway is running and NEXT_PUBLIC_API_BASE_URL is set correctly');
        // In development, allow access even if API is down
        const isDev = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isDev) {
          console.warn('Development mode: Allowing access despite API connection failure');
          return true; // Allow access in dev mode
        }
      } else {
        console.error('Error checking auth status:', fetchError);
      }
      return false;
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
}

/**
 * Set authentication token in localStorage (for manual auth)
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('app_session', token);
  }
}

