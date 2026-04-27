// src/utils/nativeHaptics.js
//
// Semantic haptic feedback helpers. Each function is a no-op on web,
// so you can call them freely without platform checks in your UI code.
//
// Usage patterns (recommended — don't overuse these!):
//   tap()      → quick confirmation (liking a post, bookmarking)
//   select()   → picking a segmented control / tab
//   success()  → form submitted, task completed
//   warning()  → soft error, validation issue
//   error()    → hard failure (payment declined, network error)

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

function isNative() {
    return Capacitor.isNativePlatform();
}

/** Light tap — great for like buttons, bookmarks, toggles. */
export async function tap() {
    if (!isNative()) return;
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
}

/** Medium bump — good for button presses, selections. */
export async function select() {
    if (!isNative()) return;
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
}

/** Heavy thud — sparingly, for major actions like sending a message. */
export async function thud() {
    if (!isNative()) return;
    try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
}

/** Success pattern — form submitted, post created, etc. */
export async function success() {
    if (!isNative()) return;
    try { await Haptics.notification({ type: NotificationType.Success }); } catch {}
}

/** Warning pattern — something worth noticing but not fatal. */
export async function warning() {
    if (!isNative()) return;
    try { await Haptics.notification({ type: NotificationType.Warning }); } catch {}
}

/** Error pattern — use for real failures, not validation errors. */
export async function error() {
    if (!isNative()) return;
    try { await Haptics.notification({ type: NotificationType.Error }); } catch {}
}
