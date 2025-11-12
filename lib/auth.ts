/**
 * Get authentication token from various sources
 * Checks cookies first, then localStorage
 */
export function getAuthToken(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  // Try to get token from cookies (app_session cookie)
  const cookies = document.cookie.split(';');
  const sessionCookie = cookies.find(c => c.trim().startsWith('app_session='));
  if (sessionCookie) {
    const token = sessionCookie.split('=')[1].trim();
    if (token) return token;
  }

  // Fallback to localStorage if available
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
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
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

