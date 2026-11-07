/**
 * Small in-memory rate limiter for public (no-login) endpoints.
 *
 * Note: memory is per server instance, so on serverless hosting each instance
 * counts separately. Public submission also has a per-email limit stored in the
 * database (see /api/public/challenges), which holds across instances.
 */
const buckets = new Map<string, number[]>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return true;
  }
  recent.push(now);
  buckets.set(key, recent);

  // Keep the map from growing forever
  if (buckets.size > 5000) {
    for (const [k, times] of buckets) {
      if (times.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return false;
}
