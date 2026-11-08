import { prisma } from "@/lib/prisma";

/**
 * Rate limiting backed by the database (RateLimitHit table), so limits survive
 * server restarts and hold across several server instances.
 *
 * If the database itself is unavailable the limiter lets the request through
 * (and logs it) rather than locking everybody out.
 */

const ONE_DAY = 24 * 60 * 60 * 1000;
const CLEANUP_PROBABILITY = 0.02; // roughly 1 request in 50 tidies up old rows

/** How many hits `key` has had within the last `windowMs`. */
export async function countRecentHits(key: string, windowMs: number): Promise<number> {
  try {
    return await prisma.rateLimitHit.count({
      where: { key, createdAt: { gte: new Date(Date.now() - windowMs) } },
    });
  } catch (err) {
    console.error("[rate-limit] count failed, allowing request:", err);
    return 0;
  }
}

/** Count one hit for `key`. */
export async function recordHit(key: string): Promise<void> {
  try {
    await prisma.rateLimitHit.create({ data: { key } });
    if (Math.random() < CLEANUP_PROBABILITY) {
      await prisma.rateLimitHit.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - ONE_DAY) } },
      });
    }
  } catch (err) {
    console.error("[rate-limit] record failed:", err);
  }
}

/** Forget all hits for `key` (e.g. after a successful sign-in). */
export async function clearHits(key: string): Promise<void> {
  try {
    await prisma.rateLimitHit.deleteMany({ where: { key } });
  } catch (err) {
    console.error("[rate-limit] clear failed:", err);
  }
}

/**
 * Check-and-count in one step: returns true when `key` has already reached `limit`
 * hits within `windowMs` (the request should be refused); otherwise counts this
 * request and returns false.
 */
export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  if ((await countRecentHits(key, windowMs)) >= limit) return true;
  await recordHit(key);
  return false;
}
