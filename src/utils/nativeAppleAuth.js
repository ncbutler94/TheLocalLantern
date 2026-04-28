// src/utils/nativeAppleAuth.js
//
// Native Sign in with Apple for iOS (Capacitor).
// Uses @capgo/capacitor-social-login (the same plugin we use for Google).
//
// Apple requires that apps offering any third-party sign-in (Google,
// Facebook, etc.) ALSO offer Sign in with Apple. That's why this exists.
//
// Behavior by platform:
//   * iOS native   - uses the system Apple Sign-In sheet (this file)
//   * Web          - falls back to Apple's JS redirect flow (not exposed yet)
//   * Android      - Apple Sign-In isn't required on Android; we hide the button
//
// Flow:
//   1. User taps "Sign in with Apple"
//   2. iOS shows the native sheet (Face ID / Touch ID / password)
//   3. We get back an identityToken (JWT from Apple)
//   4. POST to /auth/apple/mobile -> backend verifies + mints our JWT
//   5. Store the JWT in mobile token storage and reload to /community

import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import axios from '../api/axiosInstance';
import { setMobileToken } from '../api/mobileToken';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');

// Apple's clientId for native iOS is the app's bundle ID.
const APPLE_CLIENT_ID = 'com.ncbutler.locallantern';

let initialized = false;
let initPromise = null;

async function ensureInit() {
    if (!Capacitor.isNativePlatform()) return;
    if (initialized) return;
    // De-dupe concurrent init calls.
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            await SocialLogin.initialize({
                apple: {
                    clientId: APPLE_CLIENT_ID,
                },
            });
            initialized = true;
            console.log('[apple-auth] SocialLogin.initialize OK (apple)');
        } catch (err) {
            console.warn('[apple-auth] SocialLogin.initialize FAILED: ' + (err?.message || err));
            initPromise = null;  // allow retry on next call
            throw err;
        }
    })();

    return initPromise;
}

/** True when native Apple Sign-In is available on this device. */
export function isNativeAppleAvailable() {
    const native = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    const available = native && platform === 'ios';
    console.log('[apple-auth] isNativeAppleAvailable check: ' + JSON.stringify({
        native,
        platform,
        available,
    }));
    return available;
}

/**
 * Run the full native Apple Sign-In flow.
 *
 * On success: stores the JWT in mobile token storage, then hard-reloads
 * the WebView to /onboarding or /community. On user cancel, throws an
 * Error with .cancelled = true.
 */
export async function signInWithAppleNative() {
    console.log('[apple-auth] signInWithAppleNative invoked');

    if (!isNativeAppleAvailable()) {
        throw new Error('Native Apple sign-in is only available on iOS');
    }

    await ensureInit();

    // 1. Show Apple's native sheet via the Capgo plugin.
    let result;
    try {
        console.log('[apple-auth] calling SocialLogin.login (apple)...');
        result = await SocialLogin.login({
            provider: 'apple',
            options: {
                scopes: ['email', 'name'],
            },
        });
        console.log('[apple-auth] SocialLogin.login returned: ' + JSON.stringify({
            provider: result?.provider,
            hasIdToken: !!result?.result?.idToken,
        }));
    } catch (err) {
        console.warn('[apple-auth] SocialLogin.login FAILED: ' + (err?.message || err));
        const cancelled = new Error(err?.message || 'Sign-in cancelled');
        cancelled.cancelled = true;
        throw cancelled;
    }

    // The Capgo plugin returns the identity token as `idToken` (not
    // `identityToken` like the apple-sign-in plugin used).
    const identityToken = result?.result?.idToken;
    if (!identityToken) {
        console.warn('[apple-auth] no idToken in response');
        throw new Error('Apple sign-in did not return an identity token');
    }

    // 2. Extract first/last name (only on first sign-in).
    //    The Capgo plugin exposes these on result.result.profile.
    const profile = result?.result?.profile || {};
    const firstName = profile.givenName || profile.firstName || '';
    const lastName  = profile.familyName || profile.lastName || '';

    // 3. Exchange with backend for an app JWT + onboarding flag.
    console.log('[apple-auth] POSTing identityToken to backend...');
    const res = await axios.post(`${API_BASE}/auth/apple/mobile`, {
        identityToken,
        firstName,
        lastName,
    });

    const { token, needsOnboarding } = res.data || {};
    console.log('[apple-auth] backend response: ' + JSON.stringify({
        hasToken: !!token,
        needsOnboarding,
    }));

    if (!token) {
        throw new Error('Backend did not return a session token');
    }

    // 4. Store the JWT for the rest of the session (mobile only).
    setMobileToken(token);

    // 5. Hard-reload to the right starting screen so AuthModalContext
    //    re-runs its initial /users/profile probe — which now succeeds
    //    because the axios interceptor attaches the Bearer header.
    const redirectPath = needsOnboarding ? '/onboarding' : '/community';
    console.log('[apple-auth] navigating to: ' + redirectPath);
    window.location.href = redirectPath;
}
