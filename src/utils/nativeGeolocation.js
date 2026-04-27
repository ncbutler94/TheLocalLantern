// src/utils/nativeGeolocation.js
//
// Thin wrapper around @capacitor/geolocation that works on web too.
// On web it falls back to the standard navigator.geolocation API.
// On native it handles permission requests and returns a consistent
// { lat, lng, accuracy } shape.

import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

/**
 * Request the user's current position.
 * Returns { lat, lng, accuracy } on success, throws on failure.
 *
 * @param {Object} opts
 * @param {boolean} [opts.highAccuracy=false]
 * @param {number}  [opts.timeoutMs=10000]
 */
export async function getCurrentPosition({ highAccuracy = false, timeoutMs = 10_000 } = {}) {
    if (Capacitor.isNativePlatform()) {
        // Ensure permission first; Capacitor will auto-prompt if needed.
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
            const req = await Geolocation.requestPermissions({ permissions: ['location'] });
            if (req.location !== 'granted' && req.coarseLocation !== 'granted') {
                throw new Error('Location permission denied');
            }
        }

        const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: highAccuracy,
            timeout: timeoutMs,
        });

        return {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
        };
    }

    // Web fallback — standard browser geolocation API
    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            reject(new Error('Geolocation not supported in this browser'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
            }),
            (err) => reject(err),
            { enableHighAccuracy: highAccuracy, timeout: timeoutMs }
        );
    });
}

/**
 * Check whether the app has location permission without prompting.
 * Useful if you want to show a "enable location" UI before requesting.
 */
export async function hasLocationPermission() {
    if (!Capacitor.isNativePlatform()) {
        // Web: navigator.permissions is the closest thing
        if (!('permissions' in navigator)) return false;
        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return result.state === 'granted';
        } catch {
            return false;
        }
    }
    const perm = await Geolocation.checkPermissions();
    return perm.location === 'granted' || perm.coarseLocation === 'granted';
}
