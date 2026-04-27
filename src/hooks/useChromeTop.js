// src/hooks/useChromeTop.js
//
// Returns the height (in px) of the app's top bar / AppBar so that
// fullscreen pages on mobile can sit BELOW it — keeping back arrows,
// headers, and other top-row controls reachable instead of jammed
// under the iOS status bar / notch.
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
//   100vh) don't reserve space for the AppBar's height, so any
//   top-positioned UI inside them ends up directly under / behind it.
//
//   This hook measures the AppBar's bottom edge on mount, on resize,
//   and on orientationchange so the value stays correct.

import { useLayoutEffect, useState } from 'react';

export default function useChromeTop() {
    const [chromeTop, setChromeTop] = useState(0);

    useLayoutEffect(() => {
        const measure = () => {
            const h =
                document.querySelector('header.MuiAppBar-root') ||
                document.querySelector('header');
            setChromeTop(h ? h.getBoundingClientRect().bottom : 0);
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
