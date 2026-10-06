// Lightweight in-memory rate limiter. Not cluster-safe, but good enough for
// the single-instance editor to prevent a jittery Publish/Rollback button
// from triggering a burst of writes.

type Bucket = {
  windowStart: number;
  hits: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, maxHits: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { windowStart: now, hits: 1 });
    return { allowed: true as const, remaining: Math.max(0, maxHits - 1), retryAfterMs: 0 };
  }

  if (bucket.hits >= maxHits) {
    return {
      allowed: false as const,
      remaining: 0,
      retryAfterMs: windowMs - (now - bucket.windowStart)
    };
  }

  bucket.hits += 1;
  return { allowed: true as const, remaining: Math.max(0, maxHits - bucket.hits), retryAfterMs: 0 };
}

export function resetRateLimit(key?: string) {
  if (key) {
    buckets.delete(key);
    return;
  }
  buckets.clear();
}
