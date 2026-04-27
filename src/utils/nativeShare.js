// src/utils/nativeShare.js
//
// Share a URL/title/text via the native share sheet on iOS/Android,
// or Web Share API in browsers that support it, or copy-to-clipboard
// as a final fallback.

import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

/**
 * Open the platform share sheet.
 *
 * @param {Object} opts
 * @param {string} [opts.title] Displayed in the share sheet (e.g. post title)
 * @param {string} [opts.text]  Body/caption text
 * @param {string} [opts.url]   The URL being shared
 * @param {string} [opts.dialogTitle='Share'] Android-only chooser title
 *
 * @returns {Promise<{shared: boolean, fallback?: 'clipboard'|'web-share'|'native'}>}
 */
export async function sharePost({ title, text, url, dialogTitle = 'Share' } = {}) {
    // Native Capacitor share
    if (Capacitor.isNativePlatform()) {
        try {
            const { value } = await Share.canShare();
            if (value) {
                await Share.share({ title, text, url, dialogTitle });
                return { shared: true, fallback: 'native' };
            }
        } catch (err) {
            // User cancelled OR something failed — fall through to clipboard
            if (err?.message?.toLowerCase().includes('cancel')) {
                return { shared: false };
            }
        }
    }

    // Web Share API (modern browsers, mostly mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
        try {
            await navigator.share({ title, text, url });
            return { shared: true, fallback: 'web-share' };
        } catch (err) {
            if (err?.name === 'AbortError') return { shared: false };
            // Fall through to clipboard
        }
    }

    // Clipboard fallback — copy the URL and let the caller show a toast
    if (url && typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(url);
            return { shared: true, fallback: 'clipboard' };
        } catch {
            // No clipboard access (e.g. non-HTTPS page)
        }
    }

    return { shared: false };
}
