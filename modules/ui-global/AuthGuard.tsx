'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, checkAuthStatus } from '@/core/api/auth';
import { getCurrentUser } from '@/core/api/api';

interface AuthGuardProps {
  children: React.ReactNode;
  onUserLoaded?: (user: { uid: string; username: string; email: string; credits?: number }) => void;
}

/**
 * AuthGuard component that checks authentication before rendering children
 * Redirects to main project login if not authenticated
 * Also fetches and provides user info to children
 */
export function AuthGuard({ children, onUserLoaded }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const debugLogsRef = useRef<string[]>([]); // Keep ref for access in useEffect
  const router = useRouter();
  const checkedRef = useRef(false); // Prevent multiple checks

  useEffect(() => {
    const checkAuth = async () => {
      // Prevent multiple simultaneous checks
      if (checkedRef.current) return;
      checkedRef.current = true;

      // Check if auth token was passed via URL hash (from parent window)
      let passedToken: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          const hash = window.location.hash;
          const authTokenMatch = hash.match(/authToken=([^&]+)/);
          if (authTokenMatch) {
            passedToken = decodeURIComponent(authTokenMatch[1]);
            // Store it temporarily for authentication
            if (passedToken) {
              try {
                localStorage.setItem('authToken', passedToken);
                // Clear the hash to avoid exposing token in URL
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
              } catch (e) {
                console.warn('[AuthGuard] Failed to store passed auth token', e);
              }
            }
          }
        } catch (e) {
          console.warn('[AuthGuard] Failed to parse auth token from URL hash', e);
        }
      }

      // Helper to log to console, state (visible on page), and localStorage
      const logDebug = (message: string, data?: unknown) => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}${data ? `: ${JSON.stringify(data)}` : ''}`;
        console.log(logEntry);

        // Add to state so it's visible on page
        setDebugLogs(prev => {
          const newLogs = [...prev, logEntry];
          // Keep only last 30 logs in state
          const trimmed = newLogs.slice(-30);
          debugLogsRef.current = trimmed; // Update ref too
          return trimmed;
        });

        try {
          const existingLogs = localStorage.getItem('authguard_debug_logs') || '[]';
          const logs = JSON.parse(existingLogs);
          logs.push(logEntry);
          // Keep only last 50 logs
          if (logs.length > 50) logs.shift();
          localStorage.setItem('authguard_debug_logs', JSON.stringify(logs));
        } catch {
          // Ignore localStorage errors
        }
      };

      try {
        // Detect if we're in development (localhost with different ports)
        const isDev = typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

        logDebug('[AuthGuard] Starting auth check', {
          hostname: window.location.hostname,
          href: window.location.href,
          isDev,
          apiBase: process.env.NEXT_PUBLIC_API_BASE_URL || 'NOT SET',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent.substring(0, 100),
          cookieEnabled: navigator.cookieEnabled,
          sharedArrayBufferAvailable: typeof SharedArrayBuffer !== 'undefined',
          crossOriginIsolated: typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : 'unknown'
        });

        // Log all cookies with detailed analysis
        if (typeof document !== 'undefined') {
          const allCookies = document.cookie;
          const cookieArray = document.cookie.split(';').map(c => c.trim());
          const cookieDetails = cookieArray.map(c => {
            const parts = c.split('=');
            return {
              name: parts[0],
              hasValue: parts.length > 1 && parts[1].length > 0,
              valueLength: parts[1]?.length || 0,
              valuePreview: parts[1] ? (parts[1].length > 30 ? parts[1].substring(0, 30) + '...' : parts[1]) : '(empty)'
            };
          });

          logDebug('[AuthGuard] All cookies', {
            cookies: allCookies,
            cookieCount: cookieArray.length,
            cookieDetails,
            hasAppSession: cookieArray.some(c => c.startsWith('app_session=')),
            note: 'httpOnly cookies (like app_session) are NOT visible in document.cookie - this is normal and secure'
          });

          logDebug('[AuthGuard] Parsed cookies', {
            cookieArray,
            analysis: {
              totalCookies: cookieArray.length,
              appSessionVisible: cookieArray.some(c => c.startsWith('app_session=')),
              googleAnalyticsCookies: cookieArray.filter(c => c.startsWith('_ga')).length,
              note: 'If app_session is not visible, it might be httpOnly (normal) or not set. Check DevTools → Application → Cookies instead.'
            }
          });
        }

        // In development, cookies from localhost:3000 won't be accessible on localhost:3001
        // So we'll be more lenient - allow access if API check passes, otherwise allow anyway
        if (isDev) {
          // Try to verify with API - if it works, we're authenticated
          // Note: In dev, cookies won't be shared between ports, so API might fail
          // but we'll allow access anyway for development convenience
          try {
            logDebug('[AuthGuard] Dev mode: calling checkAuthStatus');
            const isValid = await checkAuthStatus();
            logDebug('[AuthGuard] Dev mode: checkAuthStatus result', { isValid });
            if (isValid) {
              // Fetch user info
              const user = await getCurrentUser();
              logDebug('[AuthGuard] Dev mode: fetched user', { uid: user?.uid, username: user?.username });
              if (user && onUserLoaded) {
                onUserLoaded(user);
              }
              setIsAuth(true);
              setIsChecking(false);
              return;
            }
          } catch (apiError: any) {
            // API check failed (connection refused, etc.) - in dev we allow access
            logDebug('[AuthGuard] Dev mode: API check failed', { error: String(apiError) });
          }

          // API check failed (likely no cookie on this port), but in dev we allow access
          // User is already logged in on main project, so allow canvas access
          logDebug('[AuthGuard] Dev mode: Allowing access for development');
          setIsAuth(true);
          setIsChecking(false);
          return;
        } else {
          // Production: Try API check first (even without cookie, in case cookie is on different subdomain)
          // The API will return 401 if no valid session, but we should still try
          // NEW: Also check for Bearer token in case cookies aren't working
          logDebug('[AuthGuard] Prod mode: Attempting API check (cookie may be on different subdomain, will also try Bearer token)');

          try {
            logDebug('[AuthGuard] Prod mode: calling checkAuthStatus (will check for cookie via API, with Bearer token fallback)');

            // Give a small delay to allow cookies to be sent (sometimes there's a race condition)
            await new Promise(resolve => setTimeout(resolve, 100));

            const isValid = await checkAuthStatus();
            logDebug('[AuthGuard] Prod mode: checkAuthStatus result', { isValid });

            if (isValid) {
              // Fetch user info
              try {
                const user = await getCurrentUser();
                logDebug('[AuthGuard] Prod mode: fetched user', { uid: user?.uid, username: user?.username, hasUser: !!user });

                if (user && user.uid) {
                  if (onUserLoaded) {
                    onUserLoaded(user);
                  }
                  setIsAuth(true);
                  setIsChecking(false);
                  return;
                } else {
                  logDebug('[AuthGuard] Prod mode: getCurrentUser returned empty/invalid user object - authentication may have failed');
                  // Continue to redirect
                }
              } catch (userError) {
                logDebug('[AuthGuard] Prod mode: Error fetching user info', { error: String(userError) });
                // Continue to redirect
              }
            } else {
              logDebug('[AuthGuard] Prod mode: checkAuthStatus returned false - no valid session (cookie or Bearer token)');

              // Check if we have a token in localStorage that we can try
              const hasToken = typeof window !== 'undefined' && (
                localStorage.getItem('authToken') ||
                localStorage.getItem('idToken') ||
                localStorage.getItem('user')
              );

              if (hasToken) {
                logDebug('[AuthGuard] Prod mode: Token found in localStorage but API check failed - retrying once more...');

                // Retry once more after a short delay (cookie might need time to be sent)
                await new Promise(resolve => setTimeout(resolve, 500));
                const retryIsValid = await checkAuthStatus();
                logDebug('[AuthGuard] Prod mode: Retry checkAuthStatus result', { retryIsValid });

                if (retryIsValid) {
                  try {
                    const user = await getCurrentUser();
                    logDebug('[AuthGuard] Prod mode: Retry succeeded, fetched user', { uid: user?.uid, username: user?.username, hasUser: !!user });

                    if (user && user.uid) {
                      if (onUserLoaded) {
                        onUserLoaded(user);
                      }
                      setIsAuth(true);
                      setIsChecking(false);
                      return;
                    } else {
                      logDebug('[AuthGuard] Prod mode: Retry getCurrentUser returned empty/invalid user object');
                    }
                  } catch (userError) {
                    logDebug('[AuthGuard] Prod mode: Error fetching user info on retry', { error: String(userError) });
                  }
                } else {
                  logDebug('[AuthGuard] Prod mode: Retry also failed - token may be expired or invalid');
                }
              } else {
                logDebug('[AuthGuard] Prod mode: No token in localStorage - user needs to authenticate on www.wildmindai.com first');
              }
            }
          } catch (apiError) {
            logDebug('[AuthGuard] Prod mode: API auth check threw error', {
              error: String(apiError),
              errorName: (apiError as Error)?.name,
              errorMessage: (apiError as Error)?.message
            });
            // Continue to redirect
          }

          // Also check for cookie locally (for logging)
          const hasCookie = isAuthenticated();

          // Try to check cookies from parent domain (www.wildmindai.com)
          // This won't work due to same-origin policy, but we can log the attempt
          logDebug('[AuthGuard] Prod mode: Local cookie check', {
            hasCookie,
            cookieString: typeof document !== 'undefined' ? document.cookie : 'n/a',
            cookieLength: typeof document !== 'undefined' ? document.cookie.length : 0,
            cookieAnalysis: {
              visibleCookies: typeof document !== 'undefined' ? document.cookie.split(';').filter(c => c.trim()).length : 0,
              appSessionInDocumentCookie: typeof document !== 'undefined' ? document.cookie.includes('app_session=') : false,
              note: 'httpOnly cookies are NOT in document.cookie. Check DevTools → Application → Cookies for actual cookies.'
            },
            nextSteps: [
              '1. Open DevTools → Application → Cookies → https://studio.wildmindai.com',
              '2. Check if app_session cookie exists',
              '3. If not, check https://www.wildmindai.com cookies',
              '4. Verify cookie has Domain: .wildmindai.com (with leading dot)',
              '5. If domain is www.wildmindai.com (no dot), COOKIE_DOMAIN env var is not set'
            ]
          });

          if (!hasCookie) {
            logDebug('[AuthGuard] Prod mode: No cookie found locally - will redirect');
          }
        }

        // Not authenticated - redirect to main project signup/login page
        const isProd = typeof window !== 'undefined' &&
          (window.location.hostname === 'wildmindai.com' ||
            window.location.hostname === 'www.wildmindai.com' ||
            window.location.hostname === 'studio.wildmindai.com');

        const mainProjectUrl = isProd
          ? 'https://www.wildmindai.com/view/signup'
          : 'http://localhost:3000/view/signup';

        // Redirect with return URL so user can come back after login
        const returnUrl = encodeURIComponent(window.location.href);

        // Collect key debug info to pass in URL
        // Read current logs from ref (avoids dependency issue)
        const currentLogs = debugLogsRef.current;
        const debugInfo = {
          hasCookie: isAuthenticated(),
          apiBase: process.env.NEXT_PUBLIC_API_BASE_URL || 'NOT SET',
          hostname: window.location.hostname,
          cookieCount: document.cookie.split(';').filter(c => c.trim()).length,
          lastLog: currentLogs[currentLogs.length - 1] || 'none'
        };

        logDebug('[AuthGuard] NOT AUTHENTICATED - Will redirect to signup', {
          mainProjectUrl,
          returnUrl,
          reason: 'No valid session found',
          debugInfo
        });

        // Shorter delay for better UX (was 10 seconds, now 2 seconds)
        logDebug('[AuthGuard] Waiting 2 seconds before redirect - check debug panel below');
        await new Promise(resolve => setTimeout(resolve, 2000));

        logDebug('[AuthGuard] Executing redirect now');
        // Encode debug info in URL so it can be read on redirect page
        const debugParam = encodeURIComponent(JSON.stringify(debugInfo));
        window.location.href = `${mainProjectUrl}?returnUrl=${returnUrl}&debug=${debugParam}`;
      } catch (error) {
        const logDebug = (message: string, data?: unknown) => {
          const timestamp = new Date().toISOString();
          const logEntry = `[${timestamp}] ${message}${data ? `: ${JSON.stringify(data)}` : ''}`;
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

        logDebug('[AuthGuard] Auth check threw error', {
          error: String(error),
          errorName: (error as Error)?.name,
          errorMessage: (error as Error)?.message,
          stack: (error as Error)?.stack
        });

        // On error, redirect to signup page
        const isProd = typeof window !== 'undefined' &&
          (window.location.hostname === 'wildmindai.com' ||
            window.location.hostname === 'www.wildmindai.com' ||
            window.location.hostname === 'studio.wildmindai.com');

        const mainProjectUrl = isProd
          ? 'https://www.wildmindai.com/view/signup'
          : 'http://localhost:3000/view/signup';

        logDebug('[AuthGuard] Redirecting due to error', { mainProjectUrl });

        // Add delay to allow logs to be saved
        await new Promise(resolve => setTimeout(resolve, 2000));

        window.location.href = mainProjectUrl;
      }
    };

    checkAuth();
  }, [router, onUserLoaded]);

  if (isChecking) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="text-center max-w-2xl w-full mb-4">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
            <p className="text-gray-600 mb-4">
              Please log in to access Canvas. Redirecting to login page...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Redirecting in 10 seconds... Check debug logs below</p>
          </div>

          {/* Debug Panel - Visible on page */}
          <div className="bg-gray-900 text-green-400 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-2 text-white">Debug Logs (Last 30 entries):</h3>
            <div className="font-mono text-xs space-y-1">
              {debugLogs.length === 0 ? (
                <p className="text-gray-500">No logs yet...</p>
              ) : (
                debugLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-gray-700 pb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Copy logs button */}
          <button
            onClick={() => {
              const logsText = debugLogs.join('\n');
              navigator.clipboard.writeText(logsText).then(() => {
                alert('Logs copied to clipboard!');
              });
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Copy All Logs to Clipboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

