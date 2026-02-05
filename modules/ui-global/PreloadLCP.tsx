import { cookies } from 'next/headers';
import { buildProxyThumbnailUrl } from '@/core/api/proxyUtils';

export async function PreloadLCP() {
    try {
        const cookieStore = await cookies();
        const appSession = cookieStore.get('app_session');

        // If no session, no user avatar to preload
        if (!appSession) return null;

        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-gateway-services-wildmind.onrender.com';

        // Fetch user data server-side
        // We need to pass the cookie for authentication
        const response = await fetch(`${apiBase}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Cookie': `app_session=${appSession.value}`,
                'Content-Type': 'application/json',
            },
            // Cache for a short time or verify if Next.js caching behavior is desired
            // For auth/me, usually we don't want strict caching, or we want per-request
            // In Server Components, default is 'force-cache' unless dynamic func used (cookies is dynamic)
            // Since we use cookies(), this request is dynamic.
            cache: 'no-store',
        });

        if (!response.ok) return null;

        const userResult = await response.json();
        const user = userResult?.data?.user || userResult?.user || userResult?.data;

        // If user has a photoURL, generate the proxy URL and preload it
        if (user?.photoURL) {
            // Use exact same logic as Profile.tsx: width 96, quality 85, avif
            const avatarUrl = buildProxyThumbnailUrl(user.photoURL, 96, 85, 'avif');
            return (
                <link
                    rel="preload"
                    as="image"
                    href={avatarUrl}
                    fetchPriority="high"
                />
            );
        }
    } catch (err) {
        // Fail silently, don't crash the page header for a preload optimization
        console.warn('[PreloadLCP] Failed to preload avatar:', err);
    }

    return null;
}
