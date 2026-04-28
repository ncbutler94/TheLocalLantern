// src/hooks/useChromeTop.js
//
// Returns the additional top-padding (in px) a page needs to keep its
// own content reachable on mobile.
//
// USAGE:
//   import useChromeTop from '../../hooks/useChromeTop';  // adjust path
//   ...
//   const chromeTop = useChromeTop();
//   <Box sx={{ pt: { xs: `${chromeTop}px`, sm: 0 }, ... }}>
//
// HOW IT WORKS:
//   The global Header.jsx renders a fixed AppBar AND a spacer Toolbar
//   immediately after it. When the AppBar is visible, the spacer
//   reserves space in the document flow so subsequent content already
//   sits below the AppBar without any page-side padding.
//
//   So: when the AppBar is rendered → this hook returns 0 (the spacer
//   handles it). When the AppBar is hidden (some fullscreen pages do
//   this) → this hook returns env(safe-area-inset-top) so back buttons
//   etc. don't end up under the iOS notch.
//
//   This used to return appBar.bottom, but that double-counted the
//   spacer's height and produced ~118px of empty space at the top of
//   pages that consumed both. The current logic gives correct top
//   padding in both AppBar-visible and AppBar-hidden cases.
//
//   Re-measures on resize and orientationchange.

import { useLayoutEffect, useState } from 'react';

/**
 * Read the iOS safe-area-inset-top via a temporary off-screen probe.
 *
 * `env(safe-area-inset-top)` is a CSS-only value — there's no direct
 * JS API to read it. We mount a 1px hidden div whose padding-top is
 * set to env(safe-area-inset-top), measure that padding via
 * getComputedStyle, then unmount.
 *
 * Returns 0 on browsers/platforms where env() resolves to 0
 * (anything that isn't iOS/Android with viewport-fit=cover).
 */
function readSafeAreaInsetTop() {
    if (typeof document === 'undefined') return 0;

    const probe = document.createElement('div');
    probe.style.cssText =
        'position:fixed;top:-100px;left:0;width:1px;height:1px;' +
        'padding-top:env(safe-area-inset-top, 0px);' +
        'visibility:hidden;pointer-events:none;';
    document.body.appendChild(probe);

    let inset = 0;
    try {
        const computed = getComputedStyle(probe).paddingTop;
        inset = parseFloat(computed) || 0;
    } finally {
        document.body.removeChild(probe);
    }
    return inset;
}

/**
 * Returns true when the AppBar is rendered AND visible.
 * "Visible" here means it has a non-zero rendered height — display:none
 * or simply not mounted both produce 0.
 */
function appBarIsVisible() {
    const h =
        document.querySelector('header.MuiAppBar-root') ||
        document.querySelector('header');
    if (!h) return false;
    const rect = h.getBoundingClientRect();
    return rect.height > 0;
}

export default function useChromeTop() {
    const [chromeTop, setChromeTop] = useState(0);

    useLayoutEffect(() => {
        const measure = () => {
            // When the AppBar is visible, Header.jsx's spacer Toolbar
            // already handles pushing content below it. Page-side
            // padding is unnecessary and would double-pad.
            if (appBarIsVisible()) {
                setChromeTop(0);
                return;
            }
            // No AppBar — page is fullscreen. Return the iOS safe-area
            // inset so headers / back buttons don't sit under the notch.
            setChromeTop(readSafeAreaInsetTop());
        };
        measure();
        window.addEventListener('resize', measure);
        window.addEventListener('orientationchange', measure);
        return () => {
            window.removeEventListener('resize', measure);
            window.removeEventListener('orientationchange', measure);
        };
    }, []);

    return chromeTop;
}
