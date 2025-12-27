import { buildProxyResourceUrl } from '@/core/api/proxyUtils';

export function normalizeCanvasMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  const u = String(url);
  if (u.includes('/api/proxy/')) return u;
  if (u.includes('zata.ai') || u.includes('zata')) {
    return buildProxyResourceUrl(u);
  }
  return u;
}

