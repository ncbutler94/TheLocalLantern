/**
 * Shared geocode rate-limiting utility.
 *
 * Persists state in localStorage so limits survive page refreshes, modal
 * close/reopen, and navigation between pages. A single key is shared across
 * CreateListingModal, CreateEditEventModal, and BusinessAdminPage so that
 * spamming one form counts toward the global limit.
 *
 * Three independent protection layers:
 *  1. Rolling-window cap   – max 30 attempts in any 5-minute window →
 *                            30-minute cooldown.
 *  2. Consecutive failures – 10 failures in a row without a single success →
 *                            15-minute cooldown.
 *  3. Rapid-fire detection – less than 2 s between two attempts →
 *                            escalating cooldown (starts at 30 s, doubles each
 *                            time, caps at 5 min).
 */

const STORAGE_KEY = "ll:geocode:rateLimitState";

/* ── Tunables ───────────────────────────────────────────────────────── */
const MAX_ATTEMPTS        = 30;            // rolling-window cap
const WINDOW_MS           = 5 * 60 * 1000; // 5 min rolling window
const COOLDOWN_MS         = 30 * 60 * 1000;// 30 min cooldown after cap

const MAX_CONSECUTIVE_FAIL = 5;            // failures in a row
const FAIL_COOLDOWN_MS     = 15 * 60 * 1000;// 15 min cooldown after streak

const RAPID_FIRE_MIN_MS    = 2000;         // min ms between attempts
const RAPID_FIRE_BASE_MS   = 30 * 1000;    // 30 s initial rapid-fire cooldown
const RAPID_FIRE_MAX_MS    = 5 * 60 * 1000;// 5 min max rapid-fire cooldown
/* ──────────────────────────────────────────────────────────────────── */

function _load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return _defaults();
        const p = JSON.parse(raw);
        return {
            attempts:          Array.isArray(p.attempts) ? p.attempts : [],
            cooldownUntil:     p.cooldownUntil || null,
            consecutiveFails:  typeof p.consecutiveFails === "number" ? p.consecutiveFails : 0,
            lastAttemptTime:   p.lastAttemptTime || null,
            rapidFireStreak:   typeof p.rapidFireStreak === "number" ? p.rapidFireStreak : 0,
        };
    } catch {
        return _defaults();
    }
}

function _defaults() {
    return {
        attempts: [],
        cooldownUntil: null,
        consecutiveFails: 0,
        lastAttemptTime: null,
        rapidFireStreak: 0,
    };
}

function _save(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* quota / private-browsing — degrade gracefully */ }
}

/**
 * Call BEFORE every geocode API request.
 *
 * @returns {{ allowed: true } | { allowed: false, message: string }}
 */
export function checkGeocodeRateLimit() {
    const now = Date.now();
    const state = _load();

    // ─── 1. Active cooldown? ───────────────────────────────────────
    if (state.cooldownUntil && now < state.cooldownUntil) {
        const minsLeft = Math.ceil((state.cooldownUntil - now) / 60000);
        const secsLeft = Math.ceil((state.cooldownUntil - now) / 1000);
        const display = minsLeft >= 1
            ? `${minsLeft} minute${minsLeft !== 1 ? "s" : ""}`
            : `${secsLeft} second${secsLeft !== 1 ? "s" : ""}`;
        return {
            allowed: false,
            message: `Too many address verification attempts. Please wait ${display} before trying again.`,
        };
    }

    // Clear expired cooldown
    if (state.cooldownUntil && now >= state.cooldownUntil) {
        state.cooldownUntil = null;
        state.rapidFireStreak = 0; // reset escalation after cooldown served
    }

    // ─── 2. Rapid-fire check ───────────────────────────────────────
    if (state.lastAttemptTime && now - state.lastAttemptTime < RAPID_FIRE_MIN_MS) {
        state.rapidFireStreak += 1;
        const cooldown = Math.min(
            RAPID_FIRE_BASE_MS * Math.pow(2, state.rapidFireStreak - 1),
            RAPID_FIRE_MAX_MS
        );
        state.cooldownUntil = now + cooldown;
        state.lastAttemptTime = now;
        _save(state);

        const secs = Math.ceil(cooldown / 1000);
        const display = secs >= 60
            ? `${Math.ceil(secs / 60)} minute${Math.ceil(secs / 60) !== 1 ? "s" : ""}`
            : `${secs} second${secs !== 1 ? "s" : ""}`;
        return {
            allowed: false,
            message: `Slow down — please wait ${display} before verifying again.`,
        };
    }

    // ─── 3. Rolling-window cap ─────────────────────────────────────
    state.attempts = state.attempts.filter((t) => now - t < WINDOW_MS);

    if (state.attempts.length >= MAX_ATTEMPTS) {
        state.cooldownUntil = now + COOLDOWN_MS;
        _save(state);
        return {
            allowed: false,
            message: "Too many address verification attempts. Please wait 30 minutes before trying again.",
        };
    }

    // ─── 4. Consecutive-failure cap ────────────────────────────────
    if (state.consecutiveFails >= MAX_CONSECUTIVE_FAIL) {
        state.cooldownUntil = now + FAIL_COOLDOWN_MS;
        state.consecutiveFails = 0; // reset so they get another 10 after cooldown
        _save(state);
        return {
            allowed: false,
            message: "Too many failed verification attempts. Please double-check the address and try again in 15 minutes.",
        };
    }

    // ─── All clear — record the attempt ────────────────────────────
    state.attempts.push(now);
    state.lastAttemptTime = now;
    _save(state);
    return { allowed: true };
}

/**
 * Call AFTER a geocode request completes to track success / failure.
 *
 * @param {boolean} success  true → address verified; false → verification failed
 */
export function recordGeocodeResult(success) {
    const state = _load();
    if (success) {
        state.consecutiveFails = 0;
        state.rapidFireStreak = 0;
    } else {
        state.consecutiveFails = (state.consecutiveFails || 0) + 1;
    }
    _save(state);
}
