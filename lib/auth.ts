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
    const apiUrl = `${apiBase}/api/auth/me`;
    
    // Log to localStorage for debugging
    const logDebug = (message: string, data?: unknown) => {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [checkAuthStatus] ${message}${data ? `: ${JSON.stringify(data)}` : ''}`;
      console.log(logEntry);
      try {
        const existingLogs = localStorage.getItem('authguard_debug_logs') || '[]';
        const logs = JSON.parse(existingLogs);
        logs.push(logEntry);
        if (logs.length > 50) logs.shift();
        localStorage.setItem('authguard_debug_logs', JSON.stringify(logs));
      } catch {
        // Ignore localStorage errors
      }
    };
    
    logDebug('Starting auth check', { apiUrl, apiBase, cookies: document.cookie });
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      logDebug('Making fetch request', { url: apiUrl, credentials: 'include' });
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include', // Include cookies (app_session)
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      logDebug('Received response', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const data = await response.json();
        logDebug('Response data', { hasUser: !!data?.data?.user, userId: data?.data?.user?.uid });
        return !!data?.data?.user;
      }

      // 401 or other error means not authenticated
      const errorText = await response.text().catch(() => '');
      logDebug('Response not OK', { status: response.status, errorText: errorText.substring(0, 200) });
      return false;
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      
      const logDebug = (message: string, data?: unknown) => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [checkAuthStatus] ${message}${data ? `: ${JSON.stringify(data)}` : ''}`;
        console.error(logEntry);
        try {
          const existingLogs = localStorage.getItem('authguard_debug_logs') || '[]';
          const logs = JSON.parse(existingLogs);
          logs.push(logEntry);
          if (logs.length > 50) logs.shift();
          localStorage.setItem('authguard_debug_logs', JSON.stringify(logs));
        } catch {
          // Ignore localStorage errors
        }
      };
      
      const error = fetchError as Error;
      if (error.name === 'AbortError') {
        logDebug('Auth check timeout - API Gateway may be unreachable', { apiUrl });
      } else if (error.message === 'Failed to fetch' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        logDebug('Failed to fetch auth status - API Gateway may not be running', {
          apiBase,
          apiUrl,
          error: error.message
        });
        // In development, allow access even if API is down
        const isDev = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (isDev) {
          logDebug('Development mode: Allowing access despite API connection failure');
          return true; // Allow access in dev mode
        }
      } else {
        logDebug('Error checking auth status', {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack
        });
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

