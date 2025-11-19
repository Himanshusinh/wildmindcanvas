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
  const router = useRouter();
  const checkedRef = useRef(false); // Prevent multiple checks

  useEffect(() => {
    const checkAuth = async () => {
      // Prevent multiple simultaneous checks
      if (checkedRef.current) return;
      checkedRef.current = true;

      try {
        // Detect if we're in development (localhost with different ports)
        const isDev = typeof window !== 'undefined' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        
        // In development, cookies from localhost:3000 won't be accessible on localhost:3001
        // So we'll be more lenient - allow access if API check passes, otherwise allow anyway
        console.log('[AuthGuard] environment', { hostname: window.location.hostname, isDev });

        if (isDev) {
          // Try to verify with API - if it works, we're authenticated
          // Note: In dev, cookies won't be shared between ports, so API might fail
          // but we'll allow access anyway for development convenience
          try {
            console.log('[AuthGuard] Dev mode: calling checkAuthStatus');
            const isValid = await checkAuthStatus();
            console.log('[AuthGuard] Dev mode: checkAuthStatus result', isValid);
            if (isValid) {
              // Fetch user info
              const user = await getCurrentUser();
              console.log('[AuthGuard] Dev mode: fetched user', user?.uid);
              if (user && onUserLoaded) {
                onUserLoaded(user);
              }
              setIsAuth(true);
              setIsChecking(false);
              return;
            }
          } catch (apiError: unknown) {
            // API check failed (connection refused, etc.) - in dev we allow access
            console.warn('Development mode: API check failed, allowing access for development');
          }
          
          // API check failed (likely no cookie on this port), but in dev we allow access
          // User is already logged in on main project, so allow canvas access
          console.warn('Development mode: Allowing access for development. In production, cookies will be shared across subdomains.');
          setIsAuth(true);
          setIsChecking(false);
          return;
        } else {
          // Production: Check cookie first, then verify with API
          const hasCookie = isAuthenticated();
          console.log('[AuthGuard] Prod mode: cookie present?', hasCookie, 'cookies', typeof document !== 'undefined' ? document.cookie : 'n/a');
          
          // Debug logging in production
          if (typeof window !== 'undefined') {
            const cookies = document.cookie.split(';').map(c => c.trim());
            const sessionCookie = cookies.find(c => c.startsWith('app_session='));
            console.log('[AuthGuard] Production auth check:', {
              hasCookie,
              sessionCookiePresent: !!sessionCookie,
              allCookies: cookies,
              hostname: window.location.hostname,
            });
          }
          
          if (hasCookie) {
            // Verify the session is still valid by checking with API
            try {
              console.log('[AuthGuard] Prod mode: calling checkAuthStatus');
              const isValid = await checkAuthStatus();
              console.log('[AuthGuard] Prod mode: checkAuthStatus result', isValid);
              if (isValid) {
                // Fetch user info
                const user = await getCurrentUser();
                console.log('[AuthGuard] Prod mode: fetched user', user?.uid);
                if (user && onUserLoaded) {
                  onUserLoaded(user);
                }
                setIsAuth(true);
                setIsChecking(false);
                return;
              } else {
                console.warn('[AuthGuard] Cookie present but API verification failed');
              }
            } catch (apiError) {
              console.error('[AuthGuard] Prod mode: API auth check failed', apiError);
              // In production, if API check fails, redirect to login
            }
          } else {
            console.warn('[AuthGuard] No authentication cookie found in production');
          }
        }

        // Not authenticated - redirect to main project signup/login page
        const isProd = typeof window !== 'undefined' && 
          (window.location.hostname === 'wildmindai.com' || 
           window.location.hostname === 'www.wildmindai.com' ||
           window.location.hostname === 'studio.wildmindai.com');
        
        const mainProjectUrl = isProd 
          ? 'https://wildmindai.com/view/signup'
          : 'http://localhost:3000/view/signup';
        
        // Redirect with return URL so user can come back after login
        const returnUrl = encodeURIComponent(window.location.href);
        console.log('[AuthGuard] Redirecting to signup', { mainProjectUrl, returnUrl });
        window.location.href = `${mainProjectUrl}?returnUrl=${returnUrl}`;
      } catch (error) {
        console.error('[AuthGuard] Auth check threw error', error);
        // On error, redirect to signup page
        const isProd = typeof window !== 'undefined' && 
          (window.location.hostname === 'wildmindai.com' || 
           window.location.hostname === 'www.wildmindai.com' ||
           window.location.hostname === 'studio.wildmindai.com');
        
        const mainProjectUrl = isProd 
          ? 'https://wildmindai.com/view/signup'
          : 'http://localhost:3000/view/signup';
        console.log('[AuthGuard] Redirecting due to error', { mainProjectUrl });
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
      <div className="w-screen h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please log in to access Canvas. Redirecting to login page...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

