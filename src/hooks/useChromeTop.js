// src/hooks/useChromeTop.js
//
// Returns the height (in px) needed to keep page content below the
// app's top chrome — either the rendered AppBar's bottom edge, OR the
// iOS safe-area inset (notch/status bar) when the AppBar is hidden.
//
// USAGE:
//   import useChromeTop from '../../hooks/useChromeTop';  // adjust path
//   ...
//   const chromeTop = useChromeTop();
//   <Box sx={{ pt: { xs: `${chromeTop}px`, sm: 0 }, minHeight: { xs: `calc(100vh - ${chromeTop}px)`, sm: '100vh' } }}>
//
// WHY:
//   The app's <AppBar> already handles its own safe-area padding (set
//   in index.html via env(safe-area-inset-top) on <body>). But pages
//   that go fullscreen on mobile (borderRadius: 0, transparent bg,
//   100vh) don't always render the AppBar at all, so any top-positioned
//   UI inside them — back buttons, headers — ends up jammed under the
//   iOS status bar / notch and can't be tapped.
//
//   This hook returns:
//     • The AppBar's bottom edge (the original behavior) when one is
//       rendered. AppBars already include the safe-area inset, so this
//       value is always >= the inset alone.
//     • Otherwise, env(safe-area-inset-top) — the height of the iOS
//       status bar / notch — so a fullscreen page still leaves room
//       for back buttons and avoids the notch.
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

export default function useChromeTop() {
    const [chromeTop, setChromeTop] = useState(0);

    useLayoutEffect(() => {
        const measure = () => {
            const h =
                document.querySelector('header.MuiAppBar-root') ||
                document.querySelector('header');

            const appBarBottom = h ? h.getBoundingClientRect().bottom : 0;

            // When the AppBar is rendered, its bottom edge already
            // includes the safe-area inset (via the <body> padding in
            // index.html), so it's always >= the inset alone.
            // When no AppBar is rendered, fall back to the inset so
            // back buttons / headers don't end up under the notch.
            const safeAreaInset = appBarBottom > 0 ? 0 : readSafeAreaInsetTop();

            setChromeTop(Math.max(appBarBottom, safeAreaInset));
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
