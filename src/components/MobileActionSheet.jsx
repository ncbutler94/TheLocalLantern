// src/components/MobileActionSheet.jsx
//
// Portal-based bottom action sheet for mobile card menus.
// Renders directly to document.body via createPortal, completely outside
// any Dialog / Drawer / Modal tree — so z-index, focus traps, and
// stacking contexts never interfere.
//
// Usage:
//   <MobileActionSheet
//       open={menuOpen}
//       onClose={() => setMenuOpen(false)}
//       items={[
//           { icon: <LinkIcon />, label: 'Copy link', onClick: handleCopy },
//           { icon: <EditIcon />, label: 'Edit post', onClick: handleEdit },
//           { icon: <DeleteIcon />, label: 'Delete post', onClick: handleDelete, color: 'error' },
//           { divider: true },
//           { icon: <FlagIcon />, label: 'Report', onClick: handleReport },
//       ]}
//   />

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

const ANIMATION_MS = 250;
const SWIPE_CLOSE_FRACTION = 0.25; // 25% of sheet height to dismiss
const VELOCITY_THRESHOLD = 0.5;    // px/ms — fast flick auto-dismisses
const DISMISS_ANIM_MS = 180;       // slide-off animation duration

export default function MobileActionSheet({ open, onClose, items = [], title }) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
            // Double-rAF so the initial transform is applied before transitioning
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true));
            });
        } else {
            setVisible(false);
            const timer = setTimeout(() => setMounted(false), ANIMATION_MS + 50);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const handleItemClick = useCallback((item) => {
        if (item.onClick) item.onClick();
        if (onClose) onClose();
    }, [onClose]);

    // ── Swipe-down-to-dismiss ──────────────────────────────────────────────
    const sheetRef = useRef(null);
    const touchStartRef = useRef(null);
    const touchCurrentRef = useRef(null);
    const touchTargetRef = useRef(null);
    const isDragging = useRef(false);

    // Check if touch started inside a scrolled-down container so we don't
    // hijack normal content scrolling.
    const isScrolledContainer = useCallback((el) => {
        let node = el;
        while (node && node !== sheetRef.current) {
            if (node instanceof HTMLElement) {
                const { overflowY } = window.getComputedStyle(node);
                if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
                    if (node.scrollTop > 0) return true;
                }
            }
            node = node.parentElement;
        }
        return false;
    }, []);

    const handleTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        if (!touch) return;
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

        if (!isDragging.current) {
            if (Math.abs(dx) > Math.abs(dy)) {
                touchStartRef.current = null;
                return;
            }
            // Only track downward swipes
            if (dy < 10) return;
            if (touchTargetRef.current && isScrolledContainer(touchTargetRef.current)) {
                touchStartRef.current = null;
                return;
            }
            isDragging.current = true;
        }

        if (isDragging.current) {
            try { e.preventDefault(); } catch { /* non-cancelable */ }
        }

        touchCurrentRef.current = { y: touch.clientY, time: Date.now() };

        const offset = Math.max(0, dy);
        if (sheetRef.current) {
            sheetRef.current.style.transition = 'none';
            sheetRef.current.style.transform = `translateY(${offset}px)`;
        }
    }, [isScrolledContainer]);

    const handleTouchEnd = useCallback((e) => {
        if (!touchStartRef.current || !isDragging.current) {
            touchStartRef.current = null;
            isDragging.current = false;
            return;
        }

        const sheet = sheetRef.current;
        const start = touchStartRef.current;
        const endTouch = e?.changedTouches?.[0];
        const current = endTouch
            ? { y: endTouch.clientY, time: Date.now() }
            : touchCurrentRef.current;

        if (!sheet || !current) {
            touchStartRef.current = null;
            isDragging.current = false;
            if (sheet) {
                sheet.style.transition = '';
                sheet.style.transform = '';
            }
            return;
        }

        const dy = current.y - start.y;
        const dt = current.time - start.time;
        const velocity = dt > 0 ? dy / dt : 0;
        const height = sheet.offsetHeight || window.innerHeight;
        const fraction = dy / height;

        const shouldClose = fraction > SWIPE_CLOSE_FRACTION || velocity > VELOCITY_THRESHOLD;

        if (shouldClose) {
            // Animate the sheet fully off-screen, then call onClose.
            sheet.style.transition = `transform ${DISMISS_ANIM_MS}ms ease-out`;
            sheet.style.transform = `translateY(${height}px)`;
            setTimeout(() => {
                if (sheet) {
                    sheet.style.transition = '';
                    sheet.style.transform = '';
                }
                if (onClose) onClose();
            }, DISMISS_ANIM_MS);
        } else {
            // Snap back
            sheet.style.transition = 'transform 200ms ease-out';
            sheet.style.transform = 'translateY(0)';
            setTimeout(() => {
                if (sheet) {
                    sheet.style.transition = '';
                    sheet.style.transform = '';
                }
            }, 200);
        }

        touchStartRef.current = null;
        touchCurrentRef.current = null;
        touchTargetRef.current = null;
        isDragging.current = false;
    }, [onClose]);

    if (!mounted) return null;

    return createPortal(
        <Box
            // Capture ALL pointer events so nothing bleeds through to content below
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            sx={{
                position: 'fixed',
                inset: 0,
                // Above everything — Dialogs, Drawers, Modals, Menus, Popovers,
                // and the MobileActivityShell's DetailPanel (which is at 100000).
                zIndex: 200000,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
            }}
        >
            {/* Backdrop */}
            <Box
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }}
                onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); }}
                sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.45)',
                    opacity: visible ? 1 : 0,
                    transition: `opacity ${ANIMATION_MS}ms ease`,
                }}
            />

            {/* Sheet */}
            <Box
                ref={sheetRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                sx={(t) => ({
                    position: 'relative',
                    bgcolor: t.palette.background.paper,
                    borderRadius: '16px 16px 0 0',
                    transform: visible ? 'translateY(0)' : 'translateY(100%)',
                    transition: `transform ${ANIMATION_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`,
                    pb: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    overscrollBehavior: 'contain',
                    willChange: 'transform',
                    boxShadow: `0 -8px 40px ${alpha(t.palette.common.black, 0.2)}`,
                })}
            >
                {/* Drag handle */}
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.25, pb: 0.5 }}>
                    <Box sx={(t) => ({
                        width: 36,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: alpha(t.palette.text.primary, 0.2),
                    })} />
                </Box>

                {/* Optional title */}
                {title && (
                    <Typography sx={{
                        px: 2.5,
                        pt: 0.5,
                        pb: 1,
                        fontWeight: 800,
                        fontSize: 15,
                        color: 'text.secondary',
                    }}>
                        {title}
                    </Typography>
                )}

                {/* Items */}
                <Box sx={{ px: 1, pb: 1 }}>
                    {items.filter(Boolean).map((item, idx) => {
                        if (item.divider) {
                            return (
                                <Box
                                    key={`divider-${idx}`}
                                    sx={(t) => ({
                                        height: 1,
                                        bgcolor: alpha(t.palette.text.primary, 0.08),
                                        mx: 1.5,
                                        my: 0.5,
                                    })}
                                />
                            );
                        }

                        const isDestructive = item.color === 'error';

                        return (
                            <Box
                                key={item.label || idx}
                                onClick={(e) => { e.stopPropagation(); handleItemClick(item); }}
                                sx={(t) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.75,
                                    px: 2,
                                    py: 1.5,
                                    mx: 0.5,
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    color: isDestructive ? t.palette.error.main : t.palette.text.primary,
                                    transition: 'background-color 120ms ease',
                                    '&:active': {
                                        bgcolor: alpha(
                                            isDestructive ? t.palette.error.main : t.palette.text.primary,
                                            0.08
                                        ),
                                    },
                                    WebkitTapHighlightColor: 'transparent',
                                })}
                            >
                                {item.icon && (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        '& svg': { fontSize: 22 },
                                        color: 'inherit',
                                        opacity: 0.85,
                                    }}>
                                        {item.icon}
                                    </Box>
                                )}
                                <Typography sx={{
                                    fontWeight: 700,
                                    fontSize: 15,
                                    color: 'inherit',
                                }}>
                                    {item.label}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>

                {/* Cancel button */}
                <Box sx={{ px: 1.5, pt: 0.5, pb: 0.5 }}>
                    <Box
                        onClick={onClose}
                        sx={(t) => ({
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 1.5,
                            borderRadius: 2.5,
                            cursor: 'pointer',
                            bgcolor: alpha(t.palette.text.primary, 0.05),
                            '&:active': {
                                bgcolor: alpha(t.palette.text.primary, 0.1),
                            },
                            WebkitTapHighlightColor: 'transparent',
                        })}
                    >
                        <Typography sx={{ fontWeight: 800, fontSize: 15, color: 'text.secondary' }}>
                            Cancel
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>,
        document.body
    );
}
