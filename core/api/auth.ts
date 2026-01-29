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
 * Get Firebase ID token for Bearer authentication (fallback when cookies don't work)
 * Note: wildmindcanvas doesn't have Firebase configured, so we rely on tokens stored in localStorage
 * from the main www.wildmindai.com app
 */
async function getFirebaseIdToken(): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    // First, check if token was passed via URL hash (from parent window when opening project)
    // This allows cross-subdomain authentication when localStorage isn't shared
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
            // Clear hash to avoid exposing token
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            return passedToken;
          }
        }
      } catch (e) {
        // Ignore hash parsing errors
      }
    }

    // Try to get token from localStorage (faster)
    // These are set by the main www.wildmindai.com app when user logs in
    const storedToken = localStorage.getItem('authToken');
    if (storedToken && storedToken.startsWith('eyJ')) {
      return storedToken;
    }

    // Try to get from user object (set by main app)
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

    // Try other localStorage keys that might contain the token
    const idToken = localStorage.getItem('idToken');
    if (idToken && idToken.startsWith('eyJ')) {
      return idToken;
    }

    // Try Firebase auth user object (if main app stored it)
    try {
      const firebaseUser = localStorage.getItem('firebase:authUser');
      if (firebaseUser) {
        const userObj = JSON.parse(firebaseUser);
        const token = userObj?.stsTokenManager?.accessToken || userObj?.accessToken || null;
        if (token && token.startsWith('eyJ')) {
          return token;
        }
      }
    } catch { }

    return null;
  } catch (error) {
    console.warn('[checkAuthStatus] Error getting Firebase token:', error);
    return null;
  }
}

/**
 * Check authentication status with the API gateway
 * Verifies that the session cookie is still valid
 * 
 * CRITICAL FIX: In production, cookies should be shared across subdomains
 * (www.wildmindai.com <-> studio.wildmindai.com) if cookie domain is set to .wildmindai.com
 * 
 * NEW: Also supports Bearer token authentication as fallback when cookies don't work
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

    // Try to get Bearer token as fallback (even if cookie exists, it might not work due to domain issues)
    const bearerToken = await getFirebaseIdToken();

    logDebug('Making fetch request', {
      url: apiUrl,
      credentials: 'include',
      hasBearerToken: !!bearerToken,
      authStrategy: bearerToken ? 'Bearer token (fallback)' : 'Session cookie only'
    });

    // Build headers with Bearer token if available
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
      logDebug('Using Bearer token authentication (works across subdomains)');
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        credentials: 'include', // CRITICAL: Include cookies (app_session) - works across subdomains if domain=.wildmindai.com
        headers,
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
        const hasUser = !!data?.data?.user;
        const userId = data?.data?.user?.uid;

        logDebug('Response data', {
          hasUser,
          userId,
          responseStatus: data?.responseStatus,
          hasData: !!data?.data,
          userKeys: data?.data?.user ? Object.keys(data.data.user) : [],
        });

        // CRITICAL: Only return true if we have a valid user with required fields
        if (hasUser && userId && data?.data?.user?.username && data?.data?.user?.email) {
          return true;
        } else {
          logDebug('Response OK but user object is invalid or missing required fields', {
            hasUser,
            hasUserId: !!userId,
            hasUsername: !!data?.data?.user?.username,
            hasEmail: !!data?.data?.user?.email,
          });
          return false;
        }
      }

      // 401 or other error means not authenticated
      const errorText = await response.text().catch(() => '');
      let errorData: { raw?: string; responseStatus?: string; message?: string; data?: unknown } | null = null;
      try {
        errorData = JSON.parse(errorText) as { responseStatus?: string; message?: string; data?: unknown };
      } catch {
        errorData = { raw: errorText.substring(0, 200) };
      }

      // If 401 and we haven't tried Bearer token yet, retry with Bearer token only
      if (response.status === 401 && bearerToken) {
        logDebug('401 with Bearer token - token may be invalid, trying fresh token...');
        // Try getting a fresh token
        const freshToken = await getFirebaseIdToken();
        if (freshToken && freshToken !== bearerToken) {
          logDebug('Got fresh token, retrying with fresh Bearer token...');
          const retryResponse = await fetch(apiUrl, {
            method: 'GET',
            credentials: 'omit', // Don't send cookies on retry
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${freshToken}`,
            },
            signal: controller.signal,
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            logDebug('✅ Retry with fresh Bearer token succeeded!', { hasUser: !!retryData?.data?.user });
            return !!retryData?.data?.user;
          }
        }
      }

      logDebug('Response not OK', {
        status: response.status,
        errorText: errorText.substring(0, 200),
        errorData,
        hasBearerToken: !!bearerToken,
        note: isProd ? 'Cookie may not be shared across subdomains - check COOKIE_DOMAIN env var' : '',
        diagnosis: response.status === 401 ? {
          possibleCauses: [
            '1. COOKIE_DOMAIN env var is NOT set in backend (most likely)',
            '2. Cookie was set without Domain attribute (old cookie before env var was set)',
            '3. User is not logged in on www.wildmindai.com',
            '4. Cookie domain mismatch (cookie set for www.wildmindai.com instead of .wildmindai.com)',
            bearerToken ? '5. Bearer token is invalid or expired' : '5. No Bearer token available (user not logged in via Firebase)'
          ],
          howToFix: [
            '1. Go to Render.com → API Gateway service → Environment tab',
            '2. Add: COOKIE_DOMAIN=.wildmindai.com',
            '3. Restart backend service',
            '4. Log in again on www.wildmindai.com (old cookies won\'t have domain)',
            '5. Check DevTools → Application → Cookies → verify Domain: .wildmindai.com',
            '6. Then try studio.wildmindai.com again',
            bearerToken ? '7. Bearer token fallback attempted but failed - user may need to log in again' : '7. No Bearer token available - ensure user is logged in via Firebase'
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

      const isDev =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1');

      const logDebug = (message: string, data?: unknown) => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [checkAuthStatus] ${message}${data ? `: ${JSON.stringify(data)}` : ''}`;
        // In dev, avoid noisy red console errors when the API gateway isn't running.
        // Keep errors in production (or for unexpected failures).
        const isExpectedDevConnectivityIssue =
          isDev &&
          (message.includes('API Gateway may not be running') ||
            message.includes('API Gateway may be unreachable') ||
            message.includes('Development mode: Allowing access'));
        if (isExpectedDevConnectivityIssue) {
          console.warn(logEntry);
        } else {
        console.error(logEntry);
        }
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

        // In development, allow access even if API times out (likely hanging)
        if (isDev) {
          logDebug('Development mode: Allowing access despite API timeout');
          return true; // Allow access in dev mode
        }
      } else if (error.message === 'Failed to fetch' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        logDebug('Failed to fetch auth status - API Gateway may not be running', {
          apiBase,
          apiUrl,
          error: error.message
        });
        // In development, allow access even if API is down
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
  } catch (outerError) {
    console.error('Error checking auth status:', outerError);
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

