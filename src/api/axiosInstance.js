// frontend/src/api/axiosInstance.js
// ─────────────────────────────────────────────────────────────────────────────
// Centralized, security-hardened Axios instance.
//
// Every API module should import THIS instead of raw axios.
//   import api from '../axiosInstance';
//
// What it does:
//   1. CSRF — reads the csrf-token cookie (non-httpOnly) and attaches
//      X-CSRF-Token header on every state-changing request (POST/PUT/PATCH/DELETE).
//   2. Auth cookie — withCredentials is always true so the httpOnly
//      `token` cookie is sent automatically. Nothing is read from
//      localStorage and the old `access_token` cookie is never referenced.
//   3. TOKEN_EXPIRED handling — intercepts 401s with code TOKEN_EXPIRED
//      and redirects to login (or fires a custom event your UI can listen to).
//   4. Rate-limit awareness — surfaces RateLimit-* headers so callers can
//      optionally show retry countdowns.
//   5. Generic error normalisation — in production the backend only sends
//      "An unexpected error occurred." for 500s, so we normalise that.
//   6. MOBILE BEARER FALLBACK — Capacitor WebViews can't carry the
//      httpOnly cookie across the cross-origin API boundary, so on
//      native we attach `Authorization: Bearer <jwt>` from localStorage.
//      Web is unaffected.
// ─────────────────────────────────────────────────────────────────────────────
import axios from 'axios';
import { getMobileToken, isMobileNative, clearMobileToken } from './mobileToken';

const api = axios.create({
    baseURL: (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '') || undefined,
    withCredentials: true,                 // always send the httpOnly token cookie
    headers: { 'Accept': 'application/json' },
});/* ───────────── helpers ───────────── */

/**
 * Read a non-httpOnly cookie by name.
 * ONLY used for the csrf-token cookie which the backend intentionally
 * exposes to JS.  Never attempt to read the auth `token` cookie here —
 * it's httpOnly and inaccessible (by design).
 */
function getCookie(name) {
    const match = document.cookie
        .split('; ')
        .find((c) => c.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : null;
}

/** Methods that mutate state and therefore need CSRF protection. */
const CSRF_METHODS = new Set(['post', 'put', 'patch', 'delete']);

/**
 * In-memory CSRF token, populated from the X-CSRF-Token response header.
 * This is the primary source for cross-origin setups where the frontend
 * can't read cookies set by the backend domain.
 */
let csrfTokenFromHeader = null;

/* ───────────── request interceptor ───────────── */
api.interceptors.request.use((config) => {
    // ── Mark native requests so the backend knows to return tokens in
    // the response body (in addition to setting the cookie). The cookie
    // alone doesn't survive cross-origin in a Capacitor WebView.
    if (isMobileNative()) {
        config.headers['X-Client-Platform'] = 'native';
    }

    // Attach CSRF token on every state-changing request
    const method = (config.method || '').toLowerCase();
    if (CSRF_METHODS.has(method)) {
        // Prefer the token captured from response headers (works cross-origin),
        // fall back to cookie (works same-origin).
        const csrfToken = csrfTokenFromHeader || getCookie('csrf-token');
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }
    }

    // ── Mobile: attach Bearer token from localStorage ──
    //
    // On native Capacitor the auth cookie cannot survive cross-origin
    // requests, so we send the JWT in the Authorization header instead.
    // The backend's auth middleware already supports this (see
    // backend/src/middleware/auth.js — it reads either cookie OR bearer).
    //
    // We only set this header if the caller hasn't already provided one,
    // and we never set it on web (getMobileToken returns null there).
    if (!config.headers.Authorization) {
        const mobileToken = getMobileToken();
        if (mobileToken) {
            config.headers.Authorization = `Bearer ${mobileToken}`;
        }
    }

    return config;
});

/* ───────────── response interceptor ───────────── */
api.interceptors.response.use(
    (response) => {
        // Capture CSRF token from response header (cross-origin safe)
        const csrfHeader = response.headers['x-csrf-token'];
        if (csrfHeader) {
            csrfTokenFromHeader = csrfHeader;
        }

        // Optionally expose rate-limit info on the response for UI consumption
        const rlRemaining = response.headers['ratelimit-remaining'];
        const rlReset     = response.headers['ratelimit-reset'];
        if (rlRemaining !== undefined) {
            response.rateLimit = {
                limit:     Number(response.headers['ratelimit-limit']),
                remaining: Number(rlRemaining),
                reset:     Number(rlReset),           // seconds until window resets
            };
        }
        return response;
    },
    (error) => {
        const status = error?.response?.status;
        const code   = error?.response?.data?.code;

        // ── Token expired → redirect to login ──
        //
        // IMPORTANT: We skip this hard redirect for background auth-check
        // requests (marked with `x-auth-check: 1` by AuthModalContext.refresh).
        // Those are silent wake-on-focus / visibility probes — if one of
        // them fails, we must NOT yank the user to /login. AuthModalContext
        // has its own 3-strike guard (MAX_CONSECUTIVE_401S) specifically
        // designed to ride out transient 401s on wake; redirecting from
        // here defeats that entirely and was the cause of widespread
        // "logged out after locking my phone" reports on mobile.
        //
        // For user-initiated requests (no x-auth-check header), we still
        // redirect on TOKEN_EXPIRED so legitimately expired sessions get
        // routed to the login page.
        if (status === 401 && code === 'TOKEN_EXPIRED') {
            const isAuthCheck = String(
                error?.config?.headers?.['x-auth-check'] ||
                error?.config?.headers?.['X-Auth-Check'] ||
                ''
            ) === '1';

            // Wipe the mobile token if we have one — it's expired.
            if (isMobileNative()) {
                clearMobileToken();
            }

            // Always dispatch the event so listeners (if any) can react
            window.dispatchEvent(new CustomEvent('auth:token-expired'));

            if (!isAuthCheck && typeof window !== 'undefined' && window.location) {
                window.location.href = '/login?reason=session_expired';
            }
            return Promise.reject(error);
        }

        // ── 403 without CSRF token likely means the cookie wasn't set yet ──
        if (status === 403 && !getCookie('csrf-token')) {
            console.warn(
                '[axiosInstance] 403 received and no csrf-token cookie found. ' +
                'The backend may not have set the cookie yet — try refreshing.',
            );
        }

        // ── Rate limited ──
        if (status === 429) {
            const retryAfter = error.response.headers['retry-after']
                || error.response.headers['ratelimit-reset'];
            const waitSec = Math.min(retryAfter ? Number(retryAfter) : 5, 30);

            // Auto-retry once after the server's cooldown
            const config = error.config;
            if (!config._rateLimitRetried) {
                config._rateLimitRetried = true;
                return new Promise((resolve) => setTimeout(resolve, waitSec * 1000))
                    .then(() => api.request(config))
                    .catch(() => {
                        // Retry also failed — notify the app
                        error.retryAfterSeconds = retryAfter ? Number(retryAfter) : 60;
                        window.dispatchEvent(new CustomEvent('api:rate-limited', {
                            detail: {
                                url: config?.url,
                                retryAfterSec: error.retryAfterSeconds,
                            },
                        }));
                        return Promise.reject(error);
                    });
            }

            // Already retried once — notify the app
            error.retryAfterSeconds = retryAfter ? Number(retryAfter) : 60;
            window.dispatchEvent(new CustomEvent('api:rate-limited', {
                detail: {
                    url: config?.url,
                    retryAfterSec: error.retryAfterSeconds,
                },
            }));
        }

        // ── Normalise generic production errors ──
        if (status >= 500) {
            error.userMessage = 'Something went wrong. Please try again later.';
        }

        return Promise.reject(error);
    },
);

export default api;
