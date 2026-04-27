// src/index.js

// Keep your Leaflet bootstrap (unchanged)
import 'leaflet/dist/leaflet.css';
import './App.css';
// Plus Jakarta Sans – all weights used by createLanternTheme
import '@fontsource/plus-jakarta-sans/300.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';

// ═══════════════════════════════════════════════════════════════════
// Capacitor native setup
// ═══════════════════════════════════════════════════════════════════
// Runs only on iOS/Android (no-op in the browser).
//
// Status bar appearance (navy strip + light icons) is baked into the
// native Android theme at android/app/src/main/res/values/styles.xml.
// We intentionally do NOT call any StatusBar plugin methods here —
// the Capacitor plugin's calls are unreliable on Android 12+ and were
// overriding the theme XML in earlier attempts. The theme-XML-only
// approach is the one that actually works.
// ═══════════════════════════════════════════════════════════════════
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

const isNative = Capacitor.isNativePlatform();

if (isNative) {
    // --- Keyboard behavior ---------------------------------------------
    // Shrink the webview when the keyboard opens so inputs stay visible.
    Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {});
    // iOS only — hides the accessory toolbar above the keyboard (no-op on Android).
    Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});

    // NOTE: SplashScreen.hide() is intentionally NOT called here — it is
    // deferred until AFTER React's first paint to prevent the white flash
    // between native splash dismissal and React's AppSplash rendering.
    // See the hideSplashAfterPaint block at the bottom of this file.
}

// Axios defaults for cookie-based auth (unchanged)
axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';

// ═══════════════════════════════════════════════════════════════════
// Scroll-freeze recovery watchdog
// ═══════════════════════════════════════════════════════════════════
// MUI modals/dialogs/drawers set overflow:hidden on <body> and <html>
// when they open, and remove it on close. If a component unmounts
// mid-transition (e.g. fast route changes), the cleanup can be skipped,
// leaving the page unscrollable. This watchdog detects the stuck state
// and clears it automatically.
//
// It also watches for stale pointer-events:none and aria-hidden on the
// app root, which MUI's backdrop/overlay can leave behind.
// ═══════════════════════════════════════════════════════════════════
(function installScrollFreezeWatchdog() {
    if (typeof window === 'undefined') return;

    const POLL_INTERVAL_MS = 1500;
    // How long overflow:hidden must persist with no open modal before we clear it
    const STUCK_THRESHOLD_MS = 3000;

    let stuckSince = null;

    function isModalOpen() {
        // MUI adds role="presentation" wrappers and .MuiModal-root for open modals/dialogs/drawers
        const muiModals = document.querySelectorAll(
            '.MuiModal-root, .MuiDrawer-root, .MuiDialog-root, [role="dialog"], [role="presentation"]'
        );
        for (const el of muiModals) {
            // Check it's actually visible (not display:none or unmounted)
            if (el.offsetParent !== null || el.style.display !== 'none') {
                return true;
            }
        }
        return false;
    }

    function isOverflowLocked() {
        const bodyOF = window.getComputedStyle(document.body).overflow;
        const htmlOF = window.getComputedStyle(document.documentElement).overflow;
        return bodyOF === 'hidden' || htmlOF === 'hidden';
    }

    function clearStuckOverflow() {
        // Only clear overflow:hidden, not other overflow values
        if (window.getComputedStyle(document.body).overflow === 'hidden') {
            document.body.style.overflow = '';
        }
        if (window.getComputedStyle(document.documentElement).overflow === 'hidden') {
            document.documentElement.style.overflow = '';
        }

        // Also remove stale padding-right that MUI adds to compensate for scrollbar removal
        if (document.body.style.paddingRight) {
            document.body.style.paddingRight = '';
        }

        stuckSince = null;
    }

    function clearStalePointerEvents() {
        const root = document.getElementById('root');
        if (root && root.getAttribute('aria-hidden') === 'true' && !isModalOpen()) {
            root.removeAttribute('aria-hidden');
        }
        if (root && window.getComputedStyle(root).pointerEvents === 'none' && !isModalOpen()) {
            root.style.pointerEvents = '';
        }
    }

    function poll() {
        // If a modal is actually open, the lock is intentional — reset timer
        if (isModalOpen()) {
            stuckSince = null;
            return;
        }

        if (isOverflowLocked()) {
            if (!stuckSince) {
                stuckSince = Date.now();
            } else if (Date.now() - stuckSince > STUCK_THRESHOLD_MS) {
                if (process.env.NODE_ENV === 'development') {
                    console.warn('[scroll-watchdog] Clearing stuck overflow:hidden — no modal is open');
                }
                clearStuckOverflow();
            }
        } else {
            stuckSince = null;
        }

        // Also clean up stale pointer-events / aria-hidden
        clearStalePointerEvents();
    }

    setInterval(poll, POLL_INTERVAL_MS);

    // Also run on route changes (popstate) and visibilitychange (returning to tab)
    window.addEventListener('popstate', () => {
        // Small delay to let React finish rendering
        setTimeout(poll, 300);
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            setTimeout(poll, 500);
        }
    });
})();

const root = ReactDOM.createRoot(document.getElementById('root'));

// NOTE: ThemeProvider + CssBaseline are now inside ThemeContextProvider
// (which wraps AppShell in App.js). No need for them here anymore.
root.render(<App />);

// ═══════════════════════════════════════════════════════════════════
// Dismiss native splash AFTER React has painted
// ═══════════════════════════════════════════════════════════════════
// This must happen AFTER root.render() so React has scheduled its first
// paint. We wait two animation frames:
//   - Frame 1: React renders, browser lays out the DOM
//   - Frame 2: Browser paints the frame to screen
// Only then do we dismiss the native splash, so the transition is
// directly from native splash → painted React content (AppSplash with
// the Ken Burns lantern) with no white gap.
//
// A 3-second failsafe ensures we never leave the splash stuck on screen
// if anything throws during React's first render.
// ═══════════════════════════════════════════════════════════════════
if (isNative) {
    let splashHidden = false;
    const hideOnce = () => {
        if (splashHidden) return;
        splashHidden = true;
        SplashScreen.hide({ fadeOutDuration: 150 }).catch(() => {});
    };

    // Happy path: wait for two RAFs after React renders, then hide.
    requestAnimationFrame(() => {
        requestAnimationFrame(hideOnce);
    });

    // Failsafe: force-hide after 3s so we never get stuck on the native splash.
    setTimeout(hideOnce, 3000);
}
