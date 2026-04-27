// src/utils/useRateLimit.js
// App-wide rate limiter hook. Tracks action timestamps in memory (shared across
// all mounted components via a module-level Map). Each action category (e.g.
// 'comment', 'post', 'service-create') gets its own independent bucket.
//
// Usage:
//   const { checkLimit, recordAction } = useRateLimit('comment', {
//       burstMax: 3,              // allow 3 actions ...
//       burstWindowMs: 10000,     // ... within a 10-second window
//       maxPerHour: 60,           // 60 actions per rolling hour
//   });
//
//   // Before submitting:
//   const result = checkLimit();
//   if (!result.allowed) {
//       // result.retryAfterSec  → seconds until they can act again
//       // result.reason         → 'cooldown' | 'hourly_limit'
//       return;
//   }
//   recordAction();
//   // ... proceed with submit

import { useCallback, useRef } from 'react';

// Module-level store so every component instance shares the same timestamps.
// Key = category string, Value = array of Date.now() timestamps.
const _actionLog = new Map();

function getLog(category) {
    if (!_actionLog.has(category)) _actionLog.set(category, []);
    return _actionLog.get(category);
}

function pruneOld(log, windowMs) {
    const cutoff = Date.now() - windowMs;
    while (log.length > 0 && log[0] < cutoff) {
        log.shift();
    }
}

const DEFAULT_OPTS = {
    burstMax: 3,                 // 3 actions per burst window
    burstWindowMs: 10_000,       // 10-second burst window
    maxPerHour: 60,              // 60 per rolling hour
};

export default function useRateLimit(category, opts = {}) {
    const { burstMax, burstWindowMs, maxPerHour } = { ...DEFAULT_OPTS, ...opts };

    // Stable ref so callbacks don't go stale
    const optsRef = useRef({ burstMax, burstWindowMs, maxPerHour, category });
    optsRef.current = { burstMax, burstWindowMs, maxPerHour, category };

    const checkLimit = useCallback(() => {
        const { burstMax: bm, burstWindowMs: bw, maxPerHour: mph, category: cat } = optsRef.current;
        const log = getLog(cat);
        const now = Date.now();

        // Prune entries older than 1 hour
        pruneOld(log, 60 * 60 * 1000);

        // Check burst window — how many actions in the last burstWindowMs?
        const burstCutoff = now - bw;
        const recentActions = log.filter((ts) => ts >= burstCutoff);
        if (recentActions.length >= bm) {
            // Earliest action in the burst window — wait until it expires
            const oldestInBurst = recentActions[0];
            const expiresAt = oldestInBurst + bw;
            const retryAfterSec = Math.max(1, Math.ceil((expiresAt - now) / 1000));
            return { allowed: false, reason: 'cooldown', retryAfterSec };
        }

        // Check hourly cap
        if (log.length >= mph) {
            const oldestInWindow = log[0];
            const expiresAt = oldestInWindow + 60 * 60 * 1000;
            const retryAfterSec = Math.max(1, Math.ceil((expiresAt - now) / 1000));
            return { allowed: false, reason: 'hourly_limit', retryAfterSec };
        }

        return { allowed: true, reason: null, retryAfterSec: 0 };
    }, []);

    const recordAction = useCallback(() => {
        const { category: cat } = optsRef.current;
        const log = getLog(cat);
        log.push(Date.now());
        pruneOld(log, 60 * 60 * 1000);
    }, []);

    // Utility: reset for testing / admin use
    const resetLimit = useCallback(() => {
        const { category: cat } = optsRef.current;
        _actionLog.set(cat, []);
    }, []);

    return { checkLimit, recordAction, resetLimit };
}
