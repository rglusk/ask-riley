// naive fixed-window rate limiter, in memory. State is per server instance —
// on serverless that means the cap applies per warm instance, not globally,
// which is fine for its job: keeping one visitor (or script) from burning
// through Anthropic credits. Swap for Upstash/KV if this ever needs to be exact.
const WINDOW_MS = 5 * 60_000;
const MAX_REQUESTS = 20;

const hits = new Map<string, { count: number; windowStart: number }>();

export function isRateLimited(key: string): boolean {
    const now = Date.now();

    // sweep expired windows so the map can't grow unbounded
    if (hits.size > 1000) {
        for (const [k, v] of hits) {
            if (now - v.windowStart >= WINDOW_MS) hits.delete(k);
        }
    }

    const entry = hits.get(key);
    if (!entry || now - entry.windowStart >= WINDOW_MS) {
        hits.set(key, { count: 1, windowStart: now });
        return false;
    }
    entry.count += 1;
    return entry.count > MAX_REQUESTS;
}
