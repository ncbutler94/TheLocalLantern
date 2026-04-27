// src/utils/safeArea.js
// ---------------------------------------------------------------
// Shared helpers for iOS / Android safe-area insets.
//
// WHY THIS EXISTS
//   On notched / Dynamic Island iPhones (and similar Android devices),
//   any element that sits at the top edge of a fullscreen surface
//   (a `fullScreen` Dialog, a `height: 100vh` Drawer, a slide-in panel
//   with `position: fixed; top: 0`) will land BEHIND the system status
//   bar / Dynamic Island unless it explicitly reserves space for the
//   safe-area inset.
//
//   Same problem at the bottom: FABs and bottom action bars get hidden
//   behind the iOS home indicator (gesture bar) without an inset.
//
//   These helpers encode the pattern in one place so every Drawer /
//   Dialog / sliding panel doesn't have to reinvent it. The actual CSS
//   values come from the browser's `env(safe-area-inset-*)` values,
//   which are populated by Capacitor when `viewport-fit=cover` is set
//   in index.html (it is) and the StatusBar plugin's `overlaysWebView`
//   is `true`.
//
// USAGE
//   import { topInsetSx, bottomInsetSx, topRightInsetSx } from '../../utils/safeArea';
//
//   // A sticky / absolute top bar inside a fullscreen Drawer / Dialog
//   <Box sx={{ ...topInsetSx({ basePadding: 12, baseMinHeight: 48 }), display: 'flex', ... }}>
//
//   // A FAB or bottom action bar that must clear the iOS home indicator
//   <Fab sx={{ position: 'fixed', ...bottomInsetSx({ baseBottom: 16, baseRight: 14 }) }}>
//
//   // A floating close / flag button at the top-right of a lightbox
//   <IconButton sx={{ position: 'absolute', ...topRightInsetSx({ baseTop: 8, baseRight: 8 }) }}>
//
// All numeric inputs are pixels (matching MUI's `sx` numeric convention).
// All return values are plain objects you can spread into any sx prop.
// ---------------------------------------------------------------

/** CSS expression for the top safe-area inset, with px fallback to 0. */
export const SAFE_TOP = 'env(safe-area-inset-top, 0px)';
/** CSS expression for the bottom safe-area inset, with px fallback to 0. */
export const SAFE_BOTTOM = 'env(safe-area-inset-bottom, 0px)';
/** CSS expression for the left safe-area inset, with px fallback to 0. */
export const SAFE_LEFT = 'env(safe-area-inset-left, 0px)';
/** CSS expression for the right safe-area inset, with px fallback to 0. */
export const SAFE_RIGHT = 'env(safe-area-inset-right, 0px)';

/**
 * Build sx for a top bar (sticky / absolute / fixed) that must clear the
 * iOS status bar / Dynamic Island on notched devices.
 *
 * Adds the safe-area-inset-top value to whatever top padding and minHeight
 * the bar would have used otherwise. Without this, back arrows and titles
 * land behind the system clock on notched iPhones.
 *
 * @param {Object} [opts]
 * @param {number} [opts.basePadding=0] - The padding-top the bar would use without an inset, in px.
 * @param {number} [opts.baseMinHeight] - The minHeight the bar would use without an inset, in px. If provided, the returned minHeight grows by the inset so the visible bar height stays the same.
 * @returns {Object} An sx object — spread into your component's sx prop.
 */
export function topInsetSx({ basePadding = 0, baseMinHeight } = {}) {
    const out = {
        paddingTop: `calc(${SAFE_TOP} + ${basePadding}px)`,
    };
    if (baseMinHeight != null) {
        out.minHeight = `calc(${baseMinHeight}px + ${SAFE_TOP})`;
    }
    return out;
}

/**
 * Build sx for a bottom-anchored element (FAB, action bar) that must clear
 * the iOS home indicator (gesture bar) on no-home-button iPhones.
 *
 * Adds the safe-area-inset-bottom value to whatever bottom offset the
 * element would have used. Optionally also handles the right inset, which
 * matters in landscape orientation on notched devices.
 *
 * @param {Object} [opts]
 * @param {number} [opts.baseBottom=0] - The bottom offset the element would use without an inset, in px.
 * @param {number} [opts.baseRight] - Optional right offset, in px. When set, the returned right also adds safe-area-inset-right.
 * @param {number} [opts.basePadding] - Optional padding-bottom (instead of `bottom`). Useful for bars that aren't position:fixed but need to reserve home-indicator space at the end of their scroll content.
 * @returns {Object} An sx object — spread into your component's sx prop.
 */
export function bottomInsetSx({ baseBottom, baseRight, basePadding } = {}) {
    const out = {};
    if (baseBottom != null) {
        out.bottom = `calc(${SAFE_BOTTOM} + ${baseBottom}px)`;
    }
    if (baseRight != null) {
        out.right = `calc(${SAFE_RIGHT} + ${baseRight}px)`;
    }
    if (basePadding != null) {
        out.paddingBottom = `calc(${SAFE_BOTTOM} + ${basePadding}px)`;
    }
    return out;
}

/**
 * Build sx for a floating button anchored at the top-right of a fullscreen
 * surface (lightbox close, flag/report icon). Lifts both `top` and `right`
 * by their respective safe-area insets so the button sits below the
 * Dynamic Island on portrait notched iPhones AND below the camera cutout
 * on landscape.
 *
 * @param {Object} [opts]
 * @param {number} [opts.baseTop=8] - The top offset the button would use without an inset, in px.
 * @param {number} [opts.baseRight=8] - The right offset the button would use without an inset, in px.
 * @returns {Object} An sx object — spread into your component's sx prop.
 */
export function topRightInsetSx({ baseTop = 8, baseRight = 8 } = {}) {
    return {
        top: `calc(${SAFE_TOP} + ${baseTop}px)`,
        right: `calc(${SAFE_RIGHT} + ${baseRight}px)`,
    };
}

/**
 * Build sx for an absolutely-positioned content region that sits BELOW a
 * top bar built with `topInsetSx`. Use when a panel has a top bar and a
 * scrollable content area below it; the content's `top` offset must
 * include the same inset as the bar so they don't overlap.
 *
 * @param {Object} opts
 * @param {number} opts.baseBarHeight - The visible bar height (the same number you passed as baseMinHeight to topInsetSx), in px.
 * @returns {Object} An sx object containing just the `top` value.
 */
export function contentBelowTopBarSx({ baseBarHeight }) {
    return {
        top: `calc(${baseBarHeight}px + ${SAFE_TOP})`,
    };
}
