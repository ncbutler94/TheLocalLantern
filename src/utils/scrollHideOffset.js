// src/utils/scrollHideOffset.js
//
// Shared continuous scroll-hide offset for mobile.
//
// offset = 0   → bars fully visible
// offset = 1   → bars fully hidden
//
// Consumers (Header top bar, Header bottom nav, CommunityPage container)
// subscribe to the value and apply their own transform/layout logic.
//
// The Header is the single source of truth — it listens to scroll events
// and calls `setOffset(...)`. Other components only read.
//
// Design notes:
// - The value is stored in a plain `ref-like` variable to avoid triggering
//   React re-renders on every scroll frame; subscribers get called directly.
// - React consumers use `useScrollHideOffset(onChange)` which subscribes
//   and stores the value in a ref the consumer manages (via style mutation
//   in a useEffect) — this keeps re-renders out of the scroll hot path.

import { useEffect, useRef } from 'react';

let currentOffset = 0; // 0..1
let active = false;    // whether Header has activated the system (mobile)
const subscribers = new Set();

function notify() {
    // Call each subscriber with the current offset. Subscribers should be
    // lightweight — ideally mutating a style or class, not calling setState.
    for (const cb of subscribers) {
        try { cb(currentOffset, active); } catch (_) { /* isolate failures */ }
    }
}

export function getScrollHideOffset() {
    return currentOffset;
}

export function isScrollHideActive() {
    return active;
}

export function setScrollHideOffset(next) {
    const clamped = next < 0 ? 0 : next > 1 ? 1 : next;
    if (clamped === currentOffset) return;
    currentOffset = clamped;
    notify();
}

export function setScrollHideActive(next) {
    const value = Boolean(next);
    if (value === active) return;
    active = value;
    if (!value) {
        // Deactivating: snap offset back to 0 so bars are visible.
        currentOffset = 0;
    }
    notify();
}

/**
 * Subscribe to offset changes. Returns an unsubscribe function.
 * The callback is invoked with (offset, active) whenever either changes.
 * The callback is ALSO invoked once synchronously on subscribe, so the
 * consumer has the current value immediately.
 */
export function subscribeScrollHideOffset(cb) {
    if (typeof cb !== 'function') return () => {};
    subscribers.add(cb);
    try { cb(currentOffset, active); } catch (_) { /* ignore */ }
    return () => { subscribers.delete(cb); };
}

/**
 * React hook: subscribe in a useEffect, pass the current offset to `onChange`.
 * Does NOT cause re-renders. Use this when you want to mutate a DOM node's
 * style on every scroll frame without going through React reconciliation.
 *
 * Example:
 *   const ref = useRef(null);
 *   useScrollHideOffset((offset, active) => {
 *     if (!ref.current) return;
 *     ref.current.style.transform = `translateY(${-offset * 100}%)`;
 *   });
 */
export function useScrollHideOffset(onChange) {
    const cbRef = useRef(onChange);
    cbRef.current = onChange;

    useEffect(() => {
        const fn = (offset, activeNow) => {
            const cb = cbRef.current;
            if (typeof cb === 'function') cb(offset, activeNow);
        };
        const unsub = subscribeScrollHideOffset(fn);
        return unsub;
    }, []);
}
