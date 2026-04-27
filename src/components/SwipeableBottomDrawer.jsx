// src/components/SwipeableBottomDrawer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Drop-in replacement for MUI <Drawer anchor="bottom"> that adds swipe-down-
// to-dismiss on touch devices. Wraps a standard MUI Drawer so all existing
// props (PaperProps, ModalProps, slotProps, transitionDuration, etc.) pass
// through unchanged.
//
// Usage — just replace <Drawer anchor="bottom" ...> with <SwipeableBottomDrawer ...>:
//
//   import SwipeableBottomDrawer from '../../components/SwipeableBottomDrawer';
//
//   <SwipeableBottomDrawer
//       open={mobileMapOpen}
//       onClose={() => setMobileMapOpen(false)}
//       PaperProps={{ sx: { height: '100dvh' } }}
//   >
//       {children}
//   </SwipeableBottomDrawer>
//
// How it works:
//   1. Tracks vertical touch movement (touchstart → touchmove → touchend).
//   2. Translates the drawer paper downward in real-time as the user drags.
//   3. If the user swipes far enough (>25% of height or with enough velocity),
//      it animates the drawer fully off-screen, then calls onClose().
//   4. Ignores vertically-scrollable containers that aren't scrolled to the top,
//      so list scrolling still works normally.
//   5. Only activates on touch — desktop mouse users are unaffected.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useRef, useState } from 'react';
import { Drawer } from '@mui/material';

const SWIPE_CLOSE_FRACTION = 0.25; // 25% of drawer height to dismiss
const VELOCITY_THRESHOLD = 0.5;    // px/ms — fast flick auto-dismisses
const DISMISS_ANIM_MS = 180;       // slide-off animation duration

export default function SwipeableBottomDrawer({ open, onClose, children, PaperProps = {}, transitionDuration, ...rest }) {
    const touchStartRef = useRef(null);
    const touchCurrentRef = useRef(null);
    const paperRef = useRef(null);
    const isDragging = useRef(false);

    // Use state (not ref) so the re-render triggered by onClose() sees the correct value
    const [skipExitTransition, setSkipExitTransition] = useState(false);

    // Check if the touch started inside a vertically-scrollable container
    // that is NOT scrolled to the top (user is scrolling content, not dismissing).
    // Also re-checks during first move to catch containers that gained scrollTop
    // between touchstart and the first meaningful touchmove.
    const isScrolledContainer = useCallback((el) => {
        let node = el;
        while (node && node !== paperRef.current) {
            if (node instanceof HTMLElement) {
                const { overflowY } = window.getComputedStyle(node);
                if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
                    // If the container is scrolled down, let it scroll normally
                    if (node.scrollTop > 0) return true;
                }
            }
            node = node.parentElement;
        }
        return false;
    }, []);

    // Store the touch target so we can re-check scrollTop on first move
    const touchTargetRef = useRef(null);

    const handleTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        if (!touch) return;
        // Don't intercept if inside a scrolled container
        if (isScrolledContainer(e.target)) return;
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
        touchCurrentRef.current = null;
        touchTargetRef.current = e.target;
        isDragging.current = false;
    }, [isScrolledContainer]);

    const handleTouchMove = useCallback((e) => {
        if (!touchStartRef.current) return;
        const touch = e.touches[0];
        if (!touch) return;

        const dx = touch.clientX - touchStartRef.current.x;
        const dy = touch.clientY - touchStartRef.current.y;

        // On the first significant move, decide if this is a vertical swipe down
        if (!isDragging.current) {
            // Ignore if the gesture is more horizontal than vertical
            if (Math.abs(dx) > Math.abs(dy)) {
                touchStartRef.current = null;
                return;
            }
            // Only track downward swipes (positive dy)
            if (dy < 10) return;
            // Re-check: container might have scrolled between touchstart and now
            if (touchTargetRef.current && isScrolledContainer(touchTargetRef.current)) {
                touchStartRef.current = null;
                return;
            }
            isDragging.current = true;
        }

        // Prevent browser from also scrolling while we're dragging the drawer
        if (isDragging.current) {
            try { e.preventDefault(); } catch { /* non-cancelable */ }
        }

        touchCurrentRef.current = { y: touch.clientY, time: Date.now() };

        // Translate the drawer paper downward to follow the finger
        const offset = Math.max(0, dy);
        if (paperRef.current) {
            paperRef.current.style.transition = 'none';
            paperRef.current.style.transform = `translateY(${offset}px)`;
        }
    }, [isScrolledContainer]);

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
            ? { y: endTouch.clientY, time: Date.now() }
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

        const dy = current.y - start.y;
        const dt = current.time - start.time;
        const velocity = dt > 0 ? dy / dt : 0; // px/ms
        const height = paper.offsetHeight || window.innerHeight;
        const fraction = dy / height;

        const shouldClose = fraction > SWIPE_CLOSE_FRACTION || velocity > VELOCITY_THRESHOLD;

        if (shouldClose) {
            // Animate the drawer fully off-screen from its current position,
            // THEN call onClose so MUI unmounts without a visible snap-back.
            setSkipExitTransition(true);
            paper.style.transition = `transform ${DISMISS_ANIM_MS}ms ease-out`;
            paper.style.transform = `translateY(${height}px)`;

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
            paper.style.transform = 'translateY(0)';
            setTimeout(() => {
                if (paper) {
                    paper.style.transition = '';
                    paper.style.transform = '';
                }
            }, 200);
        }

        touchStartRef.current = null;
        touchCurrentRef.current = null;
        touchTargetRef.current = null;
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
            anchor="bottom"
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
