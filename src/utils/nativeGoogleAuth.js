// src/utils/nativeGoogleAuth.js
//
// Native Google Sign-In for mobile (Capacitor iOS/Android).
// Uses @capgo/capacitor-social-login — the maintained Capacitor 8 fork.

import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import axios from '../api/axiosInstance';
import { setMobileToken } from '../api/mobileToken';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/+$/, '');
const GOOGLE_WEB_CLIENT_ID = process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.REACT_APP_GOOGLE_IOS_CLIENT_ID || '';

let initialized = false;
let initPromise = null;

async function ensureInit() {
    if (!Capacitor.isNativePlatform()) return;
    if (initialized) return;
    // De-dupe concurrent init calls (e.g. user double-taps the button)
    if (initPromise) return initPromise;

    console.log('[google-auth] ensureInit starting, webClientId present: ' + !!GOOGLE_WEB_CLIENT_ID);

    if (!GOOGLE_WEB_CLIENT_ID) {
        console.warn('[google-auth] REACT_APP_GOOGLE_WEB_CLIENT_ID is not set');
        throw new Error('REACT_APP_GOOGLE_WEB_CLIENT_ID is not set — add it to your .env');
    }

    initPromise = (async () => {
        try {
            // mode: 'online' returns the idToken directly to the client.
            // (mode: 'offline' returns a serverAuthCode instead, which we
            // don't want — our backend verifies the idToken.)
            await SocialLogin.initialize({
                google: {
                    webClientId: GOOGLE_WEB_CLIENT_ID,
                    iOSClientId: GOOGLE_IOS_CLIENT_ID || undefined,
                    mode: 'online',
                },
            });
            initialized = true;
            console.log('[google-auth] SocialLogin.initialize OK');
        } catch (err) {
            // Re-throw so the caller actually sees the failure instead of
            // a confusing "Missing provider" error from the next login() call.
            console.warn('[google-auth] SocialLogin.initialize FAILED: ' + (err?.message || err));
            initPromise = null;  // allow retry on next call
            throw err;
        }
    })();

    return initPromise;
}

/** True when native Google Sign-In is available on this device. */
export function isNativeGoogleAvailable() {
    const native = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    console.log('[google-auth] isNativeGoogleAvailable check: ' + JSON.stringify({
        native,
        platform,
        hasWebClientId: !!GOOGLE_WEB_CLIENT_ID,
    }));
    return native;
}

/**
 * Run the full native Google Sign-In flow.
 *
 * On success: stores the JWT in mobile token storage, then hard-reloads
 * the WebView to /onboarding or /community. We do NOT route through
 * /social-login-success because that relay was designed for the web
 * cookie-exchange flow which doesn't apply on native.
 */
export async function signInWithGoogleNative() {
    console.log('[google-auth] signInWithGoogleNative invoked');

    if (!Capacitor.isNativePlatform()) {
        throw new Error('Native Google sign-in is only available on mobile');
    }

    await ensureInit();

    // 1. Native account picker
    let result;
    try {
        console.log('[google-auth] calling SocialLogin.login...');
        result = await SocialLogin.login({
            provider: 'google',
            options: {
                scopes: ['profile', 'email'],
            },
        });
        console.log('[google-auth] SocialLogin.login returned: ' + JSON.stringify({
            provider: result?.provider,
            hasIdToken: !!result?.result?.idToken,
            hasAccessToken: !!result?.result?.accessToken,
        }));
    } catch (err) {
        console.warn('[google-auth] SocialLogin.login FAILED: ' + (err?.message || err));
        const cancelled = new Error(err?.message || 'Sign-in cancelled');
        cancelled.cancelled = true;
        throw cancelled;
    }

    // Plugin returns:  { provider: 'google', result: { idToken, accessToken, profile, ... } }
    const idToken = result?.result?.idToken;
    if (!idToken) {
        console.warn('[google-auth] no idToken in response');
        throw new Error('Google sign-in did not return an ID token');
    }

    // 2. Exchange with backend for an app JWT + onboarding flag
    console.log('[google-auth] POSTing idToken to backend...');
    const res = await axios.post(`${API_BASE}/auth/google/mobile`, { idToken });
    const { token, needsOnboarding } = res.data || {};
    console.log('[google-auth] backend response: ' + JSON.stringify({
        hasToken: !!token,
        needsOnboarding,
    }));

    if (!token) {
        throw new Error('Backend did not return a session token');
    }

    // 3. Store the JWT for the rest of the session (mobile only).
    setMobileToken(token);

    // 4. Hard-reload to the right starting screen so all auth state
    //    rehydrates from the new token. Using window.location.href (not
    //    react-router navigate) guarantees the AuthModalContext re-runs
    //    its initial /users/profile probe, which now succeeds because
    //    the axios interceptor will attach the Bearer header.
    const redirectPath = needsOnboarding ? '/onboarding' : '/community';
    console.log('[google-auth] navigating to: ' + redirectPath);
    window.location.href = redirectPath;
}

/** Sign out of Google on the device (does not touch the app's own session). */
export async function signOutGoogleNative() {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await ensureInit();
        await SocialLogin.logout({ provider: 'google' });
    } catch {
        /* ignore */
    }
}
