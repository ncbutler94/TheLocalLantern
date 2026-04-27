// src/hooks/usePullToRefresh.js
// ─────────────────────────────────────────────────────────────────
// Drop-in pull-to-refresh for fixed-layout scroll containers.
//
// Usage:
//   const { pullRef, pullIndicator } = usePullToRefresh({
//       onRefresh: refresh,   // your existing refresh() function
//       disabled: !isMobile,  // only on mobile
//   });
//
//   <Box ref={pullRef} sx={{ overflowY: 'scroll', ... }}>
//       {pullIndicator}
//       {/* ...existing list children... */}
//   </Box>
//
// The user pulls down from scrollTop === 0, a spinner appears,
// and on release past threshold it calls onRefresh(). The spinner
// stays visible until onRefresh resolves (or 800ms minimum so
// the animation doesn't flash).
// ─────────────────────────────────────────────────────────────────

import React, { useCallback, useRef, useState } from "react";
import { Box, CircularProgress } from "@mui/material";

const THRESHOLD = 72;        // px pull distance to trigger refresh
const MAX_PULL = 120;        // visual cap
const RESISTANCE = 0.42;     // rubber-band damping

export default function usePullToRefresh({ onRefresh, disabled = false } = {}) {
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const startYRef = useRef(0);
    const pullingRef = useRef(false);
    const currentPullRef = useRef(0); // mirror of pullDistance for use in touchend
    const elRef = useRef(null);
    const onRefreshRef = useRef(onRefresh);
    onRefreshRef.current = onRefresh;

    // ── Touch handlers ──────────────────────────────────────────

    const handleTouchStart = useCallback((e) => {
        if (disabled || refreshing) return;
        const el = elRef.current;
        if (!el || el.scrollTop > 0) return;
        startYRef.current = e.touches[0].clientY;
        pullingRef.current = true;
    }, [disabled, refreshing]);

    const handleTouchMove = useCallback((e) => {
        if (!pullingRef.current || disabled || refreshing) return;
        const el = elRef.current;
        if (!el) return;

        // If user scrolled down since touchstart, abort pull
        if (el.scrollTop > 0) {
            pullingRef.current = false;
            setPullDistance(0);
            currentPullRef.current = 0;
            return;
        }

        const deltaY = e.touches[0].clientY - startYRef.current;
        if (deltaY <= 0) {
            setPullDistance(0);
            currentPullRef.current = 0;
            return;
        }

        // Prevent native scroll while pulling
        e.preventDefault();

        const dampened = Math.min(deltaY * RESISTANCE, MAX_PULL);
        setPullDistance(dampened);
        currentPullRef.current = dampened;
    }, [disabled, refreshing]);

    const handleTouchEnd = useCallback(() => {
        if (!pullingRef.current || disabled) return;
        pullingRef.current = false;

        const dist = currentPullRef.current;

        if (dist >= THRESHOLD && !refreshing && onRefreshRef.current) {
            setRefreshing(true);
            setPullDistance(THRESHOLD); // hold at threshold while refreshing
            currentPullRef.current = THRESHOLD;

            const start = Date.now();
            const result = onRefreshRef.current();

            const finish = () => {
                const elapsed = Date.now() - start;
                const remaining = Math.max(0, 800 - elapsed);
                setTimeout(() => {
                    setRefreshing(false);
                    setPullDistance(0);
                    currentPullRef.current = 0;
                }, remaining);
            };

            if (result && typeof result.then === "function") {
                result.then(finish, finish);
            } else {
                finish();
            }
        } else {
            setPullDistance(0);
            currentPullRef.current = 0;
        }
    }, [refreshing, disabled]);

    // ── Ref callback — attaches touch listeners with { passive: false } ──

    const prevNodeRef = useRef(null);
    const handlersRef = useRef({ ts: null, tm: null, te: null });

    const pullRef = useCallback((node) => {
        // Detach from old node
        const prev = prevNodeRef.current;
        if (prev && handlersRef.current.ts) {
            prev.removeEventListener("touchstart", handlersRef.current.ts);
            prev.removeEventListener("touchmove", handlersRef.current.tm);
            prev.removeEventListener("touchend", handlersRef.current.te);
        }

        prevNodeRef.current = node;
        elRef.current = node;
        if (!node || disabled) return;

        handlersRef.current = {
            ts: handleTouchStart,
            tm: handleTouchMove,
            te: handleTouchEnd,
        };

        node.addEventListener("touchstart", handleTouchStart, { passive: true });
        node.addEventListener("touchmove", handleTouchMove, { passive: false });
        node.addEventListener("touchend", handleTouchEnd, { passive: true });
    }, [handleTouchStart, handleTouchMove, handleTouchEnd, disabled]);

    // ── Indicator element ───────────────────────────────────────
    // Matches the pull-to-refresh indicator used in BusinessHubPage:
    // a MUI CircularProgress that fades in as the user pulls down and
    // spins while refreshing.

    const visible = pullDistance > 2 || refreshing;

    const pullIndicator = visible ? (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: refreshing ? 56 : Math.max(pullDistance, 0),
                overflow: 'hidden',
                transition: refreshing ? 'height 0.2s ease' : 'none',
                flexShrink: 0,
            }}
        >
            <CircularProgress
                size={24}
                thickness={4}
                sx={{
                    opacity: refreshing ? 1 : Math.min(pullDistance / THRESHOLD, 1),
                }}
            />
        </Box>
    ) : null;

    return { pullRef, pullIndicator };
}
