// src/components/MobileActivityShell.jsx
//
// Shared fullscreen mobile Activity shell used by BusinessPublicPage,
// ArtistProfilePage, and UserProfilePage.
//
// Provides:
//   • Fullscreen Dialog with proper scroll handling
//   • Sticky header (Activity bar + stickyHeader slot) that hides on
//     scroll-down and reappears on scroll-up
//   • Profile info area (name + handle + avatar) that navigates back on tap
//   • FAB "New" button pinned to the bottom-right of the screen
//   • Detail panel that slides in from the right for post/item detail views
//
// Usage:
//   const [detailContent, setDetailContent] = useState(null);
//
//   <MobileActivityShell
//       open={true}
//       onClose={() => setActiveTab(0)}
//       name="My Business"
//       handle="mybusiness"
//       avatarSrc="/img/avatar.jpg"
//       stickyHeader={<MyTabs />}
//       detailContent={detailContent}
//       detailTitle="Post"
//       onDetailClose={() => setDetailContent(null)}
//   >
//       <PostsList onPostClick={(post) => setDetailContent(<PostDetail post={post} />)} />
//   </MobileActivityShell>

import React, { useCallback, useEffect, useRef, useState, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Avatar,
    Box,
    Dialog,
    Fab,
    IconButton,
    MenuItem,
    Slide,
    Stack,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AddIcon from '@mui/icons-material/Add';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import SmartMenu from './SmartMenu';
import { topInsetSx, bottomInsetSx, contentBelowTopBarSx } from '../utils/safeArea';

/** Slide-up transition for the fullscreen activity dialog */
const SlideUpTransition = forwardRef(function SlideUpTransition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

/** Pick the correct fallback icon based on account type */
const getFallbackIcon = (accountType) => {
    if (accountType === 'business') return StorefrontRoundedIcon;
    if (accountType === 'artist') return MusicNoteRoundedIcon;
    return PersonRoundedIcon;
};

/* ────────────────────────────────────────────────────────────────
   Detail Panel — slides in from the right, full-screen overlay
   ──────────────────────────────────────────────────────────────── */
export function DetailPanel({ open, onClose, title, children, zIndex: panelZIndex }) {
    // Track mounted state separately so we can animate out before unmounting
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
            // Trigger the slide-in on the next frame so the transform transition fires
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true));
            });
        } else {
            // Slide out, then unmount after transition
            setVisible(false);
            const timer = setTimeout(() => setMounted(false), 300);
            return () => clearTimeout(timer);
        }
    }, [open]);

    if (!mounted) return null;

    return createPortal(
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                // Must be higher than the MobileActivityShell's Dialog which
                // gets z-index: 99999 from App.css (.MuiDialog-root override).
                zIndex: panelZIndex || 100000,
                overflow: 'hidden',
            }}
        >
            {/* Backdrop — fades in */}
            <Box
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.3)',
                    opacity: visible ? 1 : 0,
                    transition: 'opacity 300ms ease',
                }}
            />

            {/* Sliding panel */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    bgcolor: 'background.paper',
                    transform: visible ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
                    overflow: 'hidden',
                }}
            >
                {/* Detail header bar — absolute positioned like desktop PostDetailDialog */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        // Reserve space for the iOS status bar / Dynamic Island so
                        // the back button isn't trapped behind it on notched devices.
                        ...topInsetSx({ baseMinHeight: 48 }),
                        height: 'auto',
                        zIndex: 10,
                        bgcolor: 'background.paper',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        px: 1.5,
                        gap: 1,
                    }}
                >
                    <IconButton size="small" onClick={onClose} sx={{ color: 'text.primary' }}>
                        <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                    </IconButton>
                </Box>

                {/* Detail content — bounded scroll container matching desktop */}
                <Box sx={{ position: 'absolute', ...contentBelowTopBarSx({ baseBarHeight: 48 }), left: 0, right: 0, bottom: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
                    {children}
                </Box>
            </Box>
        </Box>,
        document.body
    );
}

/* ────────────────────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────────────────────── */
export default function MobileActivityShell({
                                                // Dialog control
                                                open = true,
                                                onClose,

                                                // Activity bar profile info
                                                name = '',
                                                handle = '',
                                                avatarSrc,
                                                avatarFallback,
                                                // Account type for default avatar icon: 'business' | 'artist' | 'personal'
                                                accountType = 'personal',

                                                // Content that goes inside the sticky header, below the Activity bar
                                                // (pill tabs, sub-tabs, filter rows, collapses, etc.)
                                                stickyHeader,

                                                // FAB create-menu items: [{ icon, label, onClick }]
                                                // Pass null/empty to hide the FAB entirely
                                                createMenuItems,

                                                // ── Detail panel props ──
                                                // Pass React content to show the detail panel (slides in from right).
                                                // Set to null/undefined to hide it.
                                                detailContent,
                                                // Optional title shown in the detail panel header bar (e.g. "Post", "Event")
                                                detailTitle,
                                                // Called when the user taps the back arrow in the detail panel
                                                onDetailClose,

                                                // Scrollable content
                                                children,

                                                // Called with (hidden: boolean) whenever the sticky header show/hide state changes
                                                onHeaderHiddenChange,

                                                // Optional z-index override (needed when rendered inside a high-z drawer)
                                                zIndex,
                                            }) {
    /* ── Scroll-direction hide / show (Facebook-style continuous tracking) ──
     * The header translates by `offset * headerHeight` tracking scroll delta.
     * Snaps to nearest endpoint (0 or 1) after 120ms of scroll idle.
     * `headerHidden` is kept as a derived boolean (offset > 0.5) so the
     * `onHeaderHiddenChange` callback parents rely on still fires at a
     * meaningful threshold.
     */
    const [headerHidden, setHeaderHidden] = useState(false);
    const headerRef = useRef(null);
    const offsetRef = useRef(0); // 0 = visible, 1 = hidden
    const lastScrollY = useRef(0);
    const firstEventRef = useRef(true);
    const scrollTicking = useRef(false);
    const settleTimerRef = useRef(null);
    const settleRafRef = useRef(null);
    const bottomHitAtRef = useRef(0);

    useEffect(() => {
        if (!open) {
            offsetRef.current = 0;
            setHeaderHidden(false);
            if (headerRef.current) {
                headerRef.current.style.opacity = '';
                headerRef.current.style.pointerEvents = '';
                // Clear legacy transform/marginBottom in case an older build
                // left them on the element.
                headerRef.current.style.transform = '';
                headerRef.current.style.marginBottom = '';
            }
            return;
        }

        // Tunables (match useSubheaderScrollHide defaults for consistency)
        const TOP_ZONE = 40;
        const BOTTOM_ZONE = 80;
        const BOUNCE_IGNORE = 1.5;
        const HIDE_DISTANCE = 60;
        const SETTLE_IDLE_MS = 120;
        const SETTLE_ANIM_MS = 160;
        const BOTTOM_BOUNCE_COOLDOWN_MS = 500;

        const findScrollParent = (el) => {
            let node = el?.parentElement;
            while (node) {
                const ov = getComputedStyle(node).overflowY;
                if (ov === 'auto' || ov === 'scroll') return node;
                node = node.parentElement;
            }
            return window;
        };

        // Small delay so the Dialog Paper is mounted
        const timer = setTimeout(() => {
            const scrollEl = findScrollParent(headerRef.current);
            const isWindowScroll = scrollEl === window;
            const getScrollTop = () =>
                isWindowScroll
                    ? (window.scrollY || document.documentElement.scrollTop)
                    : scrollEl.scrollTop;
            const getScrollHeight = () =>
                isWindowScroll
                    ? document.documentElement.scrollHeight
                    : scrollEl.scrollHeight;
            const getClientHeight = () =>
                isWindowScroll ? window.innerHeight : scrollEl.clientHeight;

            const applyOffset = (next) => {
                const clamped = next < 0 ? 0 : next > 1 ? 1 : next;
                if (clamped === offsetRef.current) return;
                offsetRef.current = clamped;
                const el = headerRef.current;
                if (!el) return;
                // FADE (not slide) to match the global chrome pattern. Previously
                // this translateY'd the header up — but sliding a sticky bar off
                // the top of a scroll container still leaves content visibly
                // "jumping" past it, which users perceive as jerkiness even
                // though the container height stays constant. Fading in place
                // avoids any motion at all; the bar just becomes transparent
                // (pointer events disabled when fully hidden so taps fall
                // through to content beneath).
                el.style.opacity = String(1 - clamped);
                el.style.pointerEvents = clamped > 0.98 ? 'none' : 'auto';
                // Coarse boolean for consumers
                const nowHidden = clamped > 0.5;
                setHeaderHidden((prev) => (prev === nowHidden ? prev : nowHidden));
            };

            const cancelSettle = () => {
                if (settleTimerRef.current) {
                    clearTimeout(settleTimerRef.current);
                    settleTimerRef.current = null;
                }
                if (settleRafRef.current) {
                    cancelAnimationFrame(settleRafRef.current);
                    settleRafRef.current = null;
                }
            };

            const settleTo = (target) => {
                cancelSettle();
                const start = offsetRef.current;
                if (start === target) return;
                const t0 = performance.now();
                const ease = (x) => 1 - Math.pow(1 - x, 2);
                const step = () => {
                    const t = Math.min(1, (performance.now() - t0) / SETTLE_ANIM_MS);
                    applyOffset(start + (target - start) * ease(t));
                    if (t < 1) {
                        settleRafRef.current = requestAnimationFrame(step);
                    } else {
                        settleRafRef.current = null;
                    }
                };
                settleRafRef.current = requestAnimationFrame(step);
            };

            const scheduleSettle = () => {
                if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
                settleTimerRef.current = setTimeout(() => {
                    settleTimerRef.current = null;
                    const v = offsetRef.current;
                    if (v > 0 && v < 1) settleTo(v >= 0.5 ? 1 : 0);
                }, SETTLE_IDLE_MS);
            };

            // Prepare header for GPU-friendly fades
            if (headerRef.current) {
                headerRef.current.style.willChange = 'opacity';
                headerRef.current.style.transition = 'none';
            }

            // Seed position
            lastScrollY.current = getScrollTop();
            firstEventRef.current = true;

            const onScroll = () => {
                if (scrollTicking.current) return;
                scrollTicking.current = true;
                requestAnimationFrame(() => {
                    scrollTicking.current = false;

                    const currentY = getScrollTop();
                    const scrollHeight = getScrollHeight();
                    const clientHeight = getClientHeight();
                    const totalScrollable = scrollHeight - clientHeight;
                    const distFromBottom = totalScrollable - currentY;

                    if (firstEventRef.current) {
                        lastScrollY.current = currentY;
                        firstEventRef.current = false;
                        return;
                    }

                    const delta = currentY - lastScrollY.current;
                    lastScrollY.current = currentY;
                    const now = Date.now();

                    // Near top: force fully visible
                    if (currentY < TOP_ZONE) {
                        cancelSettle();
                        applyOffset(0);
                        return;
                    }

                    // Near bottom: freeze (bounce guard)
                    if (distFromBottom < BOTTOM_ZONE) {
                        bottomHitAtRef.current = now;
                        return;
                    }

                    // Post-bottom bounce suppression
                    if (delta < 0 && now - bottomHitAtRef.current < BOTTOM_BOUNCE_COOLDOWN_MS) {
                        return;
                    }

                    if (Math.abs(delta) < BOUNCE_IGNORE) return;

                    cancelSettle();
                    applyOffset(offsetRef.current + delta / HIDE_DISTANCE);
                    scheduleSettle();
                });
            };

            const target = isWindowScroll ? window : scrollEl;
            target.addEventListener('scroll', onScroll, { passive: true });

            headerRef.current.__shellCleanup = () => {
                target.removeEventListener('scroll', onScroll);
                cancelSettle();
                if (headerRef.current) {
                    headerRef.current.style.opacity = '';
                    headerRef.current.style.pointerEvents = '';
                    headerRef.current.style.transform = '';
                    headerRef.current.style.marginBottom = '';
                    headerRef.current.style.willChange = '';
                    headerRef.current.style.transition = '';
                }
                offsetRef.current = 0;
            };
        }, 50);

        return () => {
            clearTimeout(timer);
            headerRef.current?.__shellCleanup?.();
        };
    }, [open]);

    // Notify parent
    useEffect(() => {
        if (typeof onHeaderHiddenChange === 'function') onHeaderHiddenChange(headerHidden);
    }, [headerHidden, onHeaderHiddenChange]);

    /* ── FAB menu ── */
    const [fabAnchor, setFabAnchor] = useState(null);
    const hasCreate = Array.isArray(createMenuItems) && createMenuItems.length > 0;

    /* ── Handle close ── */
    const handleClose = useCallback(() => {
        if (typeof onClose === 'function') onClose();
    }, [onClose]);

    /* ── Detail panel open state derived from detailContent ── */
    const detailOpen = detailContent != null;

    const handleDetailClose = useCallback(() => {
        if (typeof onDetailClose === 'function') onDetailClose();
    }, [onDetailClose]);

    if (!open) return null;

    return (
        <Dialog
            open
            fullScreen
            onClose={handleClose}
            TransitionComponent={SlideUpTransition}
            PaperProps={{
                sx: {
                    bgcolor: 'background.paper',
                    borderRadius: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    display: 'block',
                },
            }}
            TransitionProps={{ unmountOnExit: true }}
            disableScrollLock
            disableEnforceFocus
            {...(zIndex ? { sx: { zIndex } } : {})}
        >
            {/* ── Sticky header: Activity bar + injected tabs ── */}
            <Box
                ref={headerRef}
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 20,
                    bgcolor: 'background.paper',
                    // Reserve space for the iOS status bar / Dynamic Island so the
                    // Activity back button isn't trapped behind it. Without this,
                    // because the Dialog is fullScreen, the sticky bar sits at
                    // viewport y=0 and collides with the system clock / sensors.
                    ...topInsetSx(),
                    // Continuous scroll-fade: useEffect above applies `opacity` +
                    // `pointer-events` inline on every scroll frame. Previously
                    // this translated the header up, but sliding a sticky bar
                    // (even without container reflow) still reads as motion the
                    // user has to visually track. Fading in place is calmer
                    // and matches the global chrome behavior in Header.jsx.
                }}
            >
                {/* Activity bar row */}
                <Box
                    sx={{
                        bgcolor: 'background.paper',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 1.5,
                        py: 1,
                        minHeight: 48,
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton size="small" onClick={handleClose} sx={{ color: 'text.primary' }}>
                            <ArrowBackRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 800, fontSize: 16 }}>Activity</Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                        onClick={handleClose}
                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                    >
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.1 }}>
                                {name}
                            </Typography>
                            {handle && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontWeight: 600, fontSize: 11, lineHeight: 1, mt: -0.1, display: 'block' }}
                                >
                                    @{handle}
                                </Typography>
                            )}
                        </Box>
                        {(() => {
                            const FallbackIcon = getFallbackIcon(accountType);
                            return (
                                <Avatar
                                    src={avatarSrc || undefined}
                                    alt={name}
                                    imgProps={{ referrerPolicy: 'no-referrer', onError: (e) => { e.target.style.display = 'none'; } }}
                                    sx={(t) => ({
                                        width: 32, height: 32,
                                        border: '1px solid', borderColor: 'divider',
                                        ...(!avatarSrc ? {
                                            bgcolor: alpha(t.palette.primary.main, 0.08),
                                            color: t.palette.primary.main,
                                        } : {}),
                                    })}
                                >
                                    {avatarFallback || <FallbackIcon sx={{ fontSize: 18 }} />}
                                </Avatar>
                            );
                        })()}
                    </Stack>
                </Box>

                {/* Injected sticky content (tabs, sub-tabs, filters, collapses, etc.) */}
                {stickyHeader}
            </Box>

            {/* ── Scrollable content ── */}
            {children}

            {/* ── FAB for creating new content — pinned to bottom-right ── */}
            {hasCreate && (
                <>
                    <Fab
                        color="primary"
                        size="medium"
                        onClick={(e) => setFabAnchor(e.currentTarget)}
                        sx={(t) => ({
                            position: 'fixed',
                            // Lift above the iOS home indicator (gesture bar) so the
                            // FAB stays tappable on notched/no-home-button devices.
                            ...bottomInsetSx({ baseBottom: 16, baseRight: 14 }),
                            zIndex: 1200,
                            boxShadow: `0 3px 12px ${alpha(t.palette.primary.main, 0.35)}`,
                            '&:hover': {
                                bgcolor: alpha(t.palette.primary.main, 0.92),
                            },
                        })}
                        aria-label="Create new"
                    >
                        <AddIcon />
                    </Fab>
                    <SmartMenu
                        anchorEl={fabAnchor}
                        open={Boolean(fabAnchor)}
                        onClose={() => setFabAnchor(null)}
                        disableScrollLock
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        PaperProps={{
                            sx: (t) => ({
                                mb: 1,
                                borderRadius: 3,
                                minWidth: 180,
                                boxShadow: `0 12px 40px ${alpha(t.palette.text.primary, 0.18)}`,
                                py: 0.5,
                            }),
                        }}
                    >
                        {createMenuItems.map((item, idx) => (
                            <MenuItem
                                key={item.label || idx}
                                onClick={() => {
                                    setFabAnchor(null);
                                    item.onClick?.();
                                }}
                                sx={{ py: 1.25, gap: 1.5 }}
                            >
                                {item.icon &&
                                    React.cloneElement(item.icon, {
                                        sx: { fontSize: 20, color: 'primary.main' },
                                    })}
                                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                                    {item.label}
                                </Typography>
                            </MenuItem>
                        ))}
                    </SmartMenu>
                </>
            )}

            {/* ── Detail panel — slides in from the right ── */}
            <DetailPanel
                open={detailOpen}
                onClose={handleDetailClose}
                title={detailTitle}
                zIndex={zIndex ? zIndex + 100 : undefined}
            >
                {detailContent}
            </DetailPanel>
        </Dialog>
    );
}
