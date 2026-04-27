// src/utils/useSubheaderScrollHide.js
//
// Subscribes a page's secondary subheader (filter chips, tab row, etc.) to
// the global scroll-hide offset published by Header.jsx via
// `subscribeScrollHideOffset`. The subheader's transform + marginBottom
// track the global value exactly — there is ONE scroll-hide system for the
// whole app and all chrome elements move together.
//
// This is the single source of truth pattern. Before this, each page ran its
// own scroll listener + rAF loop + settle animation, which meant the global
// app bar and the page's subheader could be at different offsets at any
// given moment (e.g. global bar 40% hidden, subheader 60%). That drift is
// what made the UI feel "fighty" — two independent motion systems on
// adjacent chrome elements.
//
// Now:
//   - Header.jsx listens to scroll, computes offset, broadcasts.
//   - Every subheader subscribes and mirrors the broadcast.
//   - Global bar and subheader always agree on how hidden they are.
//
// Usage (unchanged from the previous version — only headerRef + enabled matter):
//   const ref = useRef(null);
//   useSubheaderScrollHide({
//     headerRef: ref,
//     enabled: isMobile,
//   });
//
// The legacy options (`scrollTargetRef`, `scrollTargetSelector`, `options`)
// are accepted for backwards-compat but ignored — there's no per-page scroll
// listener anymore. Removing them from call sites is optional cleanup.

import { useEffect } from 'react';
import { subscribeScrollHideOffset } from './scrollHideOffset';

export default function useSubheaderScrollHide({
                                                   headerRef,
                                                   // Legacy params — accepted but unused (global offset drives everything).
                                                   // eslint-disable-next-line no-unused-vars
                                                   scrollTargetRef = null,
                                                   // eslint-disable-next-line no-unused-vars
                                                   scrollTargetSelector = null,
                                                   enabled = true,
                                                   // eslint-disable-next-line no-unused-vars
                                                   options = null,
                                               }) {
    useEffect(() => {
        const el = headerRef?.current;
        if (!enabled || !el) {
            // Clear any lingering inline styles from a previous enabled run
            if (el) {
                el.style.transform = '';
                el.style.marginBottom = '';
                el.style.willChange = '';
                el.style.transition = '';
            }
            return undefined;
        }

        // GPU-friendly: promote to its own layer, no CSS transition — we
        // drive motion via the continuous offset published by Header.
        el.style.willChange = 'transform, margin-bottom';
        el.style.transition = 'none';

        const apply = (offset /* , active */) => {
            if (!el) return;
            const h = el.offsetHeight || 0;
            const px = offset * h;
            el.style.transform = `translateY(${-px}px)`;
            // marginBottom: -px "reclaims" the vertical space so content
            // below tracks the hide smoothly (no gap when the subheader
            // slides away).
            el.style.marginBottom = `${-px}px`;
        };

        // subscribeScrollHideOffset() calls us synchronously with the current
        // value, so we pick up the right state even if the subscriber mounts
        // mid-scroll (e.g. after a tab switch).
        const unsubscribe = subscribeScrollHideOffset(apply);

        return () => {
            unsubscribe();
            if (el) {
                el.style.transform = '';
                el.style.marginBottom = '';
                el.style.willChange = '';
                el.style.transition = '';
            }
        };
    }, [enabled, headerRef]);
}
