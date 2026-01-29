/**
 * Tiny helpers for LLM calls + robust JSON extraction.
 */

export function extractFirstJsonObject<T = any>(raw: string): T | null {
  if (!raw) return null;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let cleaned = match[0].trim();
  // Strip fenced blocks if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();
  }
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

export function coerceNumber(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(n)) return n;
  return undefined;
}

