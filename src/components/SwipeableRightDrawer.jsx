// src/components/SwipeableRightDrawer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Drop-in replacement for MUI <Drawer anchor="right"> that adds swipe-right-
// to-dismiss on touch devices. Wraps a standard MUI Drawer so all existing
// props (PaperProps, ModalProps, slotProps, transitionDuration, etc.) pass
// through unchanged.
//
// Usage — just replace <Drawer anchor="right" ...> with <SwipeableRightDrawer ...>:
//
//   import SwipeableRightDrawer from '../../components/SwipeableRightDrawer';
//
//   <SwipeableRightDrawer
//       open={detailOpen}
//       onClose={() => setDetailOpen(false)}
//       PaperProps={{ sx: { width: '100vw' } }}
//   >
//       {children}
//   </SwipeableRightDrawer>
//
// How it works:
//   1. Tracks horizontal touch movement (touchstart → touchmove → touchend).
//   2. Translates the drawer paper in real-time as the user drags right.
//   3. If the user swipes far enough (>30% of width or with enough velocity),
//      it animates the drawer fully off-screen, then calls onClose().
//   4. Ignores horizontal-scrolling containers so carousels/sliders still work.
//   5. Only activates on touch — desktop mouse users are unaffected.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useRef, useState } from 'react';
import { Drawer } from '@mui/material';

const SWIPE_CLOSE_FRACTION = 0.30; // 30% of drawer width to dismiss
const VELOCITY_THRESHOLD = 0.4;    // px/ms — fast flick auto-dismisses
const DISMISS_ANIM_MS = 180;       // slide-off animation duration

export default function SwipeableRightDrawer({ open, onClose, children, PaperProps = {}, transitionDuration, ...rest }) {
    const touchStartRef = useRef(null);
    const touchCurrentRef = useRef(null);
    const paperRef = useRef(null);
    const isDragging = useRef(false);

    // Use state (not ref) so the re-render triggered by onClose() sees the correct value
    const [skipExitTransition, setSkipExitTransition] = useState(false);

    // Check if the touch started inside a horizontally-scrollable container
    const isHorizontalScroller = useCallback((el) => {
        let node = el;
        while (node && node !== paperRef.current) {
            if (node instanceof HTMLElement) {
                const { overflowX } = window.getComputedStyle(node);
                if ((overflowX === 'auto' || overflowX === 'scroll') && node.scrollWidth > node.clientWidth) {
                    return true;
                }
            }
            node = node.parentElement;
        }
        return false;
    }, []);

    const handleTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        if (!touch) return;
        // Don't intercept if inside a horizontal scroller
        if (isHorizontalScroller(e.target)) return;
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
        touchCurrentRef.current = null;
        isDragging.current = false;
    }, [isHorizontalScroller]);

    const handleTouchMove = useCallback((e) => {
        if (!touchStartRef.current) return;
        const touch = e.touches[0];
        if (!touch) return;

        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;

        // On the first significant move, decide if this is a horizontal swipe
        if (!isDragging.current) {
            // Ignore if the gesture is more vertical than horizontal
            if (Math.abs(dy) > Math.abs(dx)) {
                touchStartRef.current = null;
                return;
            }
            // Only track rightward swipes (positive dx)
            if (dx < 10) return;
            isDragging.current = true;
        }

        // Prevent browser from also scrolling/navigating while we're dragging
        if (isDragging.current) {
            try { e.preventDefault(); } catch { /* non-cancelable */ }
        }

        touchCurrentRef.current = { x: touch.clientX, time: Date.now() };

        // Translate the drawer paper to follow the finger (only rightward)
        const offset = Math.max(0, dx);
        if (paperRef.current) {
            paperRef.current.style.transition = 'none';
            paperRef.current.style.transform = `translateX(${offset}px)`;
        }
    }, []);

    const handleTouchEnd = useCallback((e) => {
        if (!touchStartRef.current || !isDragging.current) {
            touchStartRef.current = null;
            return;
        }

        const paper = paperRef.current;
        const start = touchStartRef.current;
        // Use touchend position for the most accurate final reading
        const endTouch = e?.changedTouches?.[0];
        const current = endTouch
            ? { x: endTouch.clientX, time: Date.now() }
            : touchCurrentRef.current;

        if (!paper || !current) {
            touchStartRef.current = null;
            isDragging.current = false;
            if (paper) {
                paper.style.transition = '';
                paper.style.transform = '';
            }
            return;
        }

        const dx = current.x - start.x;
        const dt = current.time - start.time;
        const velocity = dt > 0 ? dx / dt : 0; // px/ms
        const width = paper.offsetWidth || window.innerWidth;
        const fraction = dx / width;

        const shouldClose = fraction > SWIPE_CLOSE_FRACTION || velocity > VELOCITY_THRESHOLD;

        if (shouldClose) {
            // Animate the drawer fully off-screen from its current position,
            // THEN call onClose so MUI unmounts without a visible snap-back.
            setSkipExitTransition(true);
            paper.style.transition = `transform ${DISMISS_ANIM_MS}ms ease-out`;
            paper.style.transform = `translateX(${width}px)`;

            setTimeout(() => {
                paper.style.transition = '';
                paper.style.transform = '';
                onClose?.();
                // Reset after MUI has processed the close
                setTimeout(() => setSkipExitTransition(false), 50);
            }, DISMISS_ANIM_MS);
        } else {
            // Snap back
            paper.style.transition = 'transform 200ms ease-out';
            paper.style.transform = 'translateX(0)';
            setTimeout(() => {
                if (paper) {
                    paper.style.transition = '';
                    paper.style.transform = '';
                }
            }, 200);
        }

        touchStartRef.current = null;
        touchCurrentRef.current = null;
        isDragging.current = false;
    }, [onClose]);

    // Merge our ref + touch handlers with any existing PaperProps
    const mergedPaperProps = {
        ...PaperProps,
        ref: paperRef,
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        sx: {
            // Ensure GPU acceleration for smooth dragging
            willChange: 'transform',
            // Prevent overscroll bounce inside the drawer from interfering
            overscrollBehavior: 'contain',
            ...PaperProps.sx,
        },
    };

    // When dismissing via swipe, skip MUI's exit transition entirely (we already animated it)
    const effectiveTransitionDuration = skipExitTransition
        ? { enter: typeof transitionDuration === 'number' ? transitionDuration : transitionDuration?.enter ?? 225, exit: 0 }
        : transitionDuration;

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={mergedPaperProps}
            transitionDuration={effectiveTransitionDuration}
            {...rest}
        >
            {children}
        </Drawer>
    );
}
