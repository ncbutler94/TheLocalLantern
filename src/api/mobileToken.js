// src/api/mobileToken.js
//
// Tiny helper for storing/reading the JWT on native mobile (Capacitor).
//
// Why this exists:
//   The web flow uses an httpOnly cookie set by the backend on the
//   `api.thelocallantern.com` domain. In Capacitor, the WebView's origin
//   is `capacitor://localhost`, so the cookie can't follow it across
//   requests — the cookie is set, but the WebView never sends it back.
//
//   On mobile we therefore fall back to the same `Authorization: Bearer`
//   path the backend's auth middleware already supports. The token is
//   stored in `localStorage` because:
//     - Capacitor's WebView gives each app its own isolated localStorage
//     - The app process is the only thing that can read it (no shared
//       cookie jar with random Safari tabs)
//     - It survives app restarts (sessionStorage doesn't)
//
//   On web this module is a no-op (everything returns null / does
//   nothing) so the cookie flow keeps working untouched.

import { Capacitor } from '@capacitor/core';

const STORAGE_KEY = 'll:mobile-auth-token';

/** True only when running inside the iOS / Android Capacitor shell. */
export function isMobileNative() {
    try {
        return Capacitor.isNativePlatform();
    } catch {
        return false;
    }
}

/** Read the stored mobile auth token, or null. No-op on web. */
export function getMobileToken() {
    if (!isMobileNative()) return null;
    try {
        return window.localStorage.getItem(STORAGE_KEY) || null;
    } catch {
        return null;
    }
}

/**
 * Store a JWT for the mobile session. No-op on web.
 * Pass null/empty to clear.
 */
export function setMobileToken(token) {
    if (!isMobileNative()) return;
    try {
        if (!token) {
            window.localStorage.removeItem(STORAGE_KEY);
        } else {
            window.localStorage.setItem(STORAGE_KEY, token);
        }
    } catch {
        // ignore — quota errors etc.
    }
}

/** Clear the stored mobile auth token. No-op on web. */
export function clearMobileToken() {
    setMobileToken(null);
}
