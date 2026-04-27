// frontend/src/utils/secureFetch.js
// ─────────────────────────────────────────────────────────────────────────────
// CSRF-aware fetch wrapper for components that use raw fetch() instead of axios.
//
// Usage:
//   import { secureFetch, getCsrfToken } from '../../utils/secureFetch';
//
//   // For state-changing requests (POST/PUT/PATCH/DELETE):
//   const res = await secureFetch('/api/community/123/mark-found', {
//     method: 'POST',
//     credentials: 'include',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ found: true }),
//   });
//
// What it does:
//   1. Reads the csrf-token cookie (non-httpOnly, set by the backend).
//   2. Attaches X-CSRF-Token header on every POST/PUT/PATCH/DELETE request.
//   3. Detects TOKEN_EXPIRED responses and dispatches the same custom event
//      that axiosInstance uses, so the app can redirect to login.
//   4. Passes through all other options unchanged — this is a drop-in wrapper.
//   5. MOBILE NATIVE: attaches X-Client-Platform: native and a Bearer token
//      (when one is stored) so the backend can authenticate Capacitor
//      WebViews where the cross-origin auth cookie can't reach.
//
// NOTE: GET/HEAD/OPTIONS requests are passed through without modification
// EXCEPT that the platform header and Bearer token are still attached on
// native — those need to flow on every request, not just mutations.
// ─────────────────────────────────────────────────────────────────────────────

import { getMobileToken, isMobileNative, clearMobileToken } from '../api/mobileToken';

/** Methods that mutate state and therefore need CSRF protection. */
const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Read the csrf-token cookie value.
 * The backend sets this as a non-httpOnly cookie specifically so JS can read it
 * for the double-submit pattern. Do NOT attempt to read the auth `token` cookie —
 * it's httpOnly and inaccessible by design.
 */
export function getCsrfToken() {
    try {
        const match = document.cookie
            .split('; ')
            .find((c) => c.startsWith('csrf-token='));
        return match ? decodeURIComponent(match.split('=')[1]) : null;
    } catch {
        return null;
    }
}

/**
 * CSRF-aware wrapper around the native fetch() API.
 *
 * - Automatically adds X-CSRF-Token header on same-origin state-changing requests.
 * - Detects TOKEN_EXPIRED 401s and dispatches 'auth:token-expired'.
 * - Sets credentials: 'include' for same-origin requests so the httpOnly auth cookie is sent.
 * - Skips credentials and CSRF headers for cross-origin requests (e.g. GCS signed-URL uploads)
 *   to avoid CORS preflight failures.
 *
 * @param {string|Request} input - URL or Request object
 * @param {RequestInit} [init={}] - fetch options
 * @returns {Promise<Response>}
 */
export async function secureFetch(input, init = {}) {
    const method = (init.method || 'GET').toUpperCase();

    // Resolve relative API paths (e.g. '/api/community') to the backend origin.
    // Without this, relative URLs resolve against window.location.origin (the
    // frontend), which won't reach Cloud Run. True external URLs (GCS signed
    // uploads, etc.) are left untouched.
    const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
    if (typeof input === 'string' && input.startsWith('/') && apiBase) {
        input = `${apiBase}${input}`;
    }

    // Detect cross-origin requests (e.g. GCS signed-URL uploads).
    // These must NOT send credentials or CSRF headers — external servers
    // like storage.googleapis.com don't return Access-Control-Allow-Credentials
    // and the browser will block the request with a CORS error.
    let isCrossOrigin = false;
    try {
        const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
        const parsed = new URL(url, window.location.origin);
        isCrossOrigin = parsed.origin !== window.location.origin;
    } catch {
        // If URL parsing fails, treat as same-origin to be safe
    }

    const options = {
        ...init,
        // Don't force credentials on cross-origin requests (breaks GCS, S3, etc.)
        credentials: isCrossOrigin
            ? (init.credentials || 'omit')
            : (init.credentials || 'include'),
    };

    // ── Mobile native: tag the request and attach Bearer token ──
    //
    // On Capacitor (iOS/Android) the cross-origin auth cookie can't follow
    // the WebView from capacitor://localhost back to api.thelocallantern.com,
    // so we send the JWT in the Authorization header (matching what
    // axiosInstance does) and tell the backend "this is a native client" so
    // login/register endpoints know to also return the JWT in the response
    // body (the auth middleware otherwise reads either cookie or bearer).
    //
    // We ONLY do this for same-origin (i.e. our API) — never for GCS/S3
    // signed-URL uploads, which would reject foreign Authorization headers
    // and probably leak our token if they didn't.
    if (!isCrossOrigin && isMobileNative()) {
        const headers = { ...options.headers };
        headers['X-Client-Platform'] = 'native';
        if (!headers.Authorization && !headers.authorization) {
            const mobileToken = getMobileToken();
            if (mobileToken) {
                headers.Authorization = `Bearer ${mobileToken}`;
            }
        }
        options.headers = headers;
    }

    // Attach CSRF token only on same-origin, state-changing requests
    if (CSRF_METHODS.has(method) && !isCrossOrigin) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            options.headers = {
                ...options.headers,
                'X-CSRF-Token': csrfToken,
            };
        }
    }

    let response = await fetch(input, options);

    // ── Rate limited (429) — auto-retry once after the server's cooldown ──
    if (response.status === 429) {
        const retryAfter = Number(response.headers.get('Retry-After') || response.headers.get('ratelimit-reset')) || 5;
        // Cap the wait to 30s so the UI doesn't hang forever
        const waitSec = Math.min(retryAfter, 30);

        await new Promise((r) => setTimeout(r, waitSec * 1000));
        response = await fetch(input, options);

        // If still rate-limited after the retry, notify the app so the UI can
        // show a friendly message instead of silently breaking.
        if (response.status === 429) {
            const retryAfter2 = Number(response.headers.get('Retry-After') || response.headers.get('ratelimit-reset')) || 10;
            window.dispatchEvent(new CustomEvent('api:rate-limited', {
                detail: {
                    url: typeof input === 'string' ? input : input?.url,
                    retryAfterSec: retryAfter2,
                },
            }));
        }
    }

    // Detect TOKEN_EXPIRED and notify the app (same-origin responses only)
    if (response.status === 401 && !isCrossOrigin) {
        try {
            // Clone so the original response body is still readable by the caller
            const clone = response.clone();
            const data = await clone.json();
            if (data?.code === 'TOKEN_EXPIRED') {
                // Wipe the stored mobile token — it's expired.
                if (isMobileNative()) clearMobileToken();
                window.dispatchEvent(new CustomEvent('auth:token-expired'));
            }
        } catch {
            // JSON parse failed — not a TOKEN_EXPIRED response, move on
        }
    }

    return response;
}

export default secureFetch;
