'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, checkAuthStatus } from '@/lib/auth';
import { getCurrentUser } from '@/lib/api';

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
          apiBase: process.env.NEXT_PUBLIC_API_BASE_URL || 'NOT SET'
        });

        // Log all cookies
        if (typeof document !== 'undefined') {
          const allCookies = document.cookie;
          logDebug('[AuthGuard] All cookies', { cookies: allCookies });
          const cookieArray = document.cookie.split(';').map(c => c.trim());
          logDebug('[AuthGuard] Parsed cookies', { cookieArray });
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
          } catch (apiError: unknown) {
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
          // Production: Check cookie first, then verify with API
          const hasCookie = isAuthenticated();
          logDebug('[AuthGuard] Prod mode: cookie check', {
            hasCookie,
            cookieString: typeof document !== 'undefined' ? document.cookie : 'n/a',
            cookieLength: typeof document !== 'undefined' ? document.cookie.length : 0
          });
          
          if (hasCookie) {
            // Verify the session is still valid by checking with API
            try {
              logDebug('[AuthGuard] Prod mode: calling checkAuthStatus');
              const isValid = await checkAuthStatus();
              logDebug('[AuthGuard] Prod mode: checkAuthStatus result', { isValid });
              if (isValid) {
                // Fetch user info
                const user = await getCurrentUser();
                logDebug('[AuthGuard] Prod mode: fetched user', { uid: user?.uid, username: user?.username });
                if (user && onUserLoaded) {
                  onUserLoaded(user);
                }
                setIsAuth(true);
                setIsChecking(false);
                return;
              } else {
                logDebug('[AuthGuard] Prod mode: checkAuthStatus returned false - session invalid');
              }
            } catch (apiError) {
              logDebug('[AuthGuard] Prod mode: API auth check threw error', {
                error: String(apiError),
                errorName: (apiError as Error)?.name,
                errorMessage: (apiError as Error)?.message
              });
              // In production, if API check fails, redirect to login
            }
          } else {
            logDebug('[AuthGuard] Prod mode: No cookie found - will redirect');
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
        
        // Add longer delay to allow logs to be read (10 seconds)
        logDebug('[AuthGuard] Waiting 10 seconds before redirect - check debug panel below');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
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

