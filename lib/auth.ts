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
 * 
 * CRITICAL FIX: In production, cookies should be shared across subdomains
 * (www.wildmindai.com <-> studio.wildmindai.com) if cookie domain is set to .wildmindai.com
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.wildmindai.com';
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

    // Check if we're in production (cross-subdomain scenario)
    const isProd = typeof window !== 'undefined' &&
      (window.location.hostname === 'studio.wildmindai.com' ||
        window.location.hostname === 'wildmindai.com' ||
        window.location.hostname === 'www.wildmindai.com');

    logDebug('Starting auth check', {
      apiUrl,
      apiBase,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
      isProd,
      cookies: typeof document !== 'undefined' ? document.cookie : 'n/a',
      cookieCount: typeof document !== 'undefined' ? document.cookie.split(';').filter(c => c.trim()).length : 0,
      allCookiesDetailed: typeof document !== 'undefined' ? document.cookie.split(';').map(c => {
        const parts = c.trim().split('=');
        return {
          name: parts[0],
          value: parts[1] ? (parts[1].length > 20 ? parts[1].substring(0, 20) + '...' : parts[1]) : '(empty)',
          fullLength: parts[1]?.length || 0
        };
      }) : []
    });

    // In production, check if cookie exists (might be httpOnly and not visible)
    // But we can still try the API call - if cookie domain is set correctly, it will be sent
    if (isProd) {
      // Check for app_session cookie (might not be visible if httpOnly, but that's OK)
      const cookies = typeof document !== 'undefined' ? document.cookie.split(';').map(c => c.trim()) : [];
      const hasAppSessionCookie = cookies.some(c => c.startsWith('app_session='));

      // CRITICAL: Check if user is logged in on main site
      // Try to check cookies from www.wildmindai.com domain
      logDebug('Production cookie check', {
        hasAppSessionCookie,
        allCookies: cookies,
        note: 'httpOnly cookies may not be visible in document.cookie - this is normal',
        important: 'If cookie is httpOnly, it exists but JavaScript cannot read it. The API call will tell us if it\'s being sent.',
        troubleshooting: [
          '1. Check if you are logged in on www.wildmindai.com',
          '2. Check DevTools → Application → Cookies → https://www.wildmindai.com',
          '3. Look for app_session cookie with Domain: .wildmindai.com',
          '4. If domain is www.wildmindai.com (no leading dot), COOKIE_DOMAIN env var is not set',
          '5. If domain is .wildmindai.com (with dot), cookie should work but might need to log in again'
        ]
      });
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      logDebug('Making fetch request', { url: apiUrl, credentials: 'include' });

      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include', // CRITICAL: Include cookies (app_session) - works across subdomains if domain=.wildmindai.com
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if Set-Cookie header is present (might indicate cookie refresh)
      const setCookieHeader = response.headers.get('set-cookie');
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      logDebug('Received response', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: responseHeaders,
        hasSetCookieHeader: !!setCookieHeader,
        setCookieHeader: setCookieHeader ? (setCookieHeader.length > 100 ? setCookieHeader.substring(0, 100) + '...' : setCookieHeader) : null,
        note: setCookieHeader ? 'Backend sent Set-Cookie header - cookie might have been refreshed' : 'No Set-Cookie header - cookie was not set/refreshed'
      });

      if (response.ok) {
        const data = await response.json();
        logDebug('Response data', { hasUser: !!data?.data?.user, userId: data?.data?.user?.uid });
        return !!data?.data?.user;
      }

      // 401 or other error means not authenticated
      const errorText = await response.text().catch(() => '');
      let errorData: { raw?: string; responseStatus?: string; message?: string; data?: unknown } | null = null;
      try {
        errorData = JSON.parse(errorText) as { responseStatus?: string; message?: string; data?: unknown };
      } catch {
        errorData = { raw: errorText.substring(0, 200) };
      }

      logDebug('Response not OK', {
        status: response.status,
        errorText: errorText.substring(0, 200),
        errorData,
        note: isProd ? 'Cookie may not be shared across subdomains - check COOKIE_DOMAIN env var' : '',
        diagnosis: response.status === 401 ? {
          possibleCauses: [
            '1. COOKIE_DOMAIN env var is NOT set in backend (most likely)',
            '2. Cookie was set without Domain attribute (old cookie before env var was set)',
            '3. User is not logged in on www.wildmindai.com',
            '4. Cookie domain mismatch (cookie set for www.wildmindai.com instead of .wildmindai.com)'
          ],
          howToFix: [
            '1. Go to Render.com → API Gateway service → Environment tab',
            '2. Add: COOKIE_DOMAIN=.wildmindai.com',
            '3. Restart backend service',
            '4. Log in again on www.wildmindai.com (old cookies won\'t have domain)',
            '5. Check DevTools → Application → Cookies → verify Domain: .wildmindai.com',
            '6. Then try studio.wildmindai.com again'
          ],
          testEndpoint: 'https://api-gateway-services-wildmind.onrender.com/api/auth/debug/cookie-config'
        } : 'Unknown error'
      });

      // CRITICAL FIX: If 401, clear any invalid/expired cookies
      if (response.status === 401 && typeof document !== 'undefined') {
        // Check if error is due to cookie not being sent (domain issue)
        // Check both errorData object and raw errorText to be safe
        const errorMessage = errorData?.message || errorText || '';
        const isDomainIssue = errorMessage.includes('Cookie not sent') ||
          errorMessage.includes('No session token') ||
          errorMessage.includes('cookie domain');

        if (isDomainIssue) {
          logDebug('401 due to cookie domain issue - NOT clearing cookies', { error: errorData?.message });
          // Don't clear cookies - let user know they need to log in again or fix domain
        } else {
          logDebug('401 Unauthorized - clearing invalid/expired cookies');
          try {
            const expired = 'Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/';
            // Clear all cookie variants
            document.cookie = `app_session=; ${expired}; SameSite=None; Secure`;
            document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=None; Secure`;
            document.cookie = `app_session=; ${expired}; SameSite=Lax`;
            document.cookie = `app_session=; Domain=.wildmindai.com; ${expired}; SameSite=Lax`;
            logDebug('Cleared invalid/expired cookies');
          } catch (e) {
            logDebug('Failed to clear cookies', { error: String(e) });
          }
        }
      }

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

