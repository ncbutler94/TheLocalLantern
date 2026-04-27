import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Snackbar, Box, useMediaQuery } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

// Height of the mobile bottom tab bar — kept in sync with Header.jsx
const MOBILE_BOTTOM_NAV_HEIGHT = 56;
// Height of the mobile bottom action bar (Save/Submit buttons) that sits above the nav
const MOBILE_ACTION_BAR_HEIGHT = 72;

/**
 * SuccessSnackbar
 *
 * Reusable confirmation snackbar with a green checkmark icon.
 * Renders via portal to document.body so it always stays fixed
 * to the viewport regardless of parent transforms or overflow.
 *
 * Theme-aware: pulls frost, motion tokens, shadows, and palette
 * values from the Lantern theme (createLanternTheme) for full
 * light/dark mode compatibility.
 *
 * Mobile-friendly: on xs screens the snackbar spans full width
 * with comfortable touch-target sizing and bottom-safe-area inset.
 * It also tracks the mobile bottom nav bar visibility (via the
 * `ll-mobile-nav-hidden` body class set by Header.jsx) and adjusts
 * its position so it always sits just above the bottom nav when
 * visible, or drops to the screen edge when the nav is hidden.
 *
 * Props:
 * - open: boolean
 * - message: string
 * - onClose: () => void
 * - autoHideDuration?: number (default 3500)
 * - anchorOrigin?: object (default bottom-center)
 */
export default function SuccessSnackbar({
                                            open,
                                            message,
                                            onClose,
                                            autoHideDuration = 3500,
                                            anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
                                            sx,
                                        }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // On mobile, use a shorter duration so the toast doesn't linger over the UI
    const effectiveDuration = isMobile ? Math.min(autoHideDuration, 2000) : autoHideDuration;

    // Track whether the mobile bottom nav is hidden (user scrolled down).
    // Header.jsx toggles the `ll-mobile-nav-hidden` class on document.body.
    const [navHidden, setNavHidden] = useState(() => {
        if (typeof document === 'undefined') return false;
        return document.body.classList.contains('ll-mobile-nav-hidden');
    });

    // Track whether a fullscreen overlay (Drawer/Dialog) is covering the screen.
    // When one is open, the bottom nav and action bar aren't visible, so the
    // snackbar should sit at the very bottom of the viewport.
    const [hasFullscreenOverlay, setHasFullscreenOverlay] = useState(false);

    useEffect(() => {
        if (!isMobile || typeof document === 'undefined') return;

        // Check initial state
        setNavHidden(document.body.classList.contains('ll-mobile-nav-hidden'));

        const checkOverlay = () => {
            // MUI fullscreen Dialogs/Drawers add role="presentation" or role="dialog"
            // containers that cover the viewport. Check for any visible fullscreen overlay.
            const overlays = document.querySelectorAll(
                '.MuiDrawer-root, .MuiDialog-root'
            );
            let found = false;
            for (const el of overlays) {
                // Only count if it's actually visible (not display:none or hidden)
                if (el.offsetParent !== null || el.style.display !== 'none') {
                    const paper = el.querySelector('.MuiDrawer-paper, .MuiDialog-paper');
                    if (paper) {
                        const rect = paper.getBoundingClientRect();
                        // Consider it fullscreen if it covers most of the viewport
                        if (rect.height > window.innerHeight * 0.85 && rect.width > window.innerWidth * 0.85) {
                            found = true;
                            break;
                        }
                    }
                }
            }
            setHasFullscreenOverlay(found);
        };

        checkOverlay();

        // Watch for class changes on body AND DOM mutations (drawers opening/closing)
        const observer = new MutationObserver(() => {
            setNavHidden(document.body.classList.contains('ll-mobile-nav-hidden'));
            checkOverlay();
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });

        return () => observer.disconnect();
    }, [isMobile]);

    // Calculate mobile bottom offset:
    // When a fullscreen overlay (Drawer/Dialog) is open, the bottom nav and
    // action bar aren't visible — sit at the very bottom with just safe area.
    // Otherwise, clear the bottom nav bar so the snackbar doesn't cover it.
    const mobileBottom = hasFullscreenOverlay
        ? `calc(env(safe-area-inset-bottom, 0px) + 12px)`
        : navHidden
            ? `calc(env(safe-area-inset-bottom, 0px) + 12px)`
            : `calc(env(safe-area-inset-bottom, 0px) + ${MOBILE_BOTTOM_NAV_HEIGHT + 12}px)`;

    const snackbar = (
        <Snackbar
            open={open}
            autoHideDuration={effectiveDuration}
            onClose={onClose}
            anchorOrigin={anchorOrigin}
            sx={{
                zIndex: 200001,
                // Mobile: respect bottom safe area (notched phones)
                // and stay above the bottom nav bar when it's visible
                ...(isMobile && {
                    bottom: { xs: mobileBottom },
                    left: { xs: 8 },
                    right: { xs: 8 },
                    // Smooth slide when bottom nav shows/hides
                    transition: 'bottom 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }),
                ...sx,
            }}
            ContentProps={{
                sx: (t) => {
                    const isDark = t.palette.mode === 'dark';
                    const frost = t.custom?.brand?.frost || (isDark ? '#232D3D' : '#E7EBF1');
                    const motion = t.custom?.motion;
                    const shadows = t.custom?.shadows;

                    return {
                        // Background: use theme frost token for dark, white for light
                        bgcolor: isDark
                            ? alpha(frost, 0.92)
                            : alpha(t.palette.common.white, 0.96),
                        backdropFilter: 'saturate(160%) blur(14px)',
                        WebkitBackdropFilter: 'saturate(160%) blur(14px)',
                        color: t.palette.text.primary,

                        // Border: success-tinted, respects dark/light opacity
                        border: '1px solid',
                        borderColor: alpha(t.palette.success.main, isDark ? 0.35 : 0.25),
                        borderRadius: 2.5,

                        // Shadow: use theme shadow tokens when available
                        boxShadow: shadows?.sm
                            ? `${shadows.sm}, 0 0 0 1px ${alpha(t.palette.success.main, isDark ? 0.12 : 0.08)}`
                            : isDark
                                ? `0 4px 24px ${alpha('#000', 0.35)}, 0 0 0 1px ${alpha(t.palette.success.main, 0.12)}`
                                : `0 4px 20px ${alpha('#000', 0.08)}, 0 0 0 1px ${alpha(t.palette.success.main, 0.08)}`,

                        // Typography: match theme body2 / subtitle2 weight
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        fontSize: { xs: 15, sm: 14 },
                        lineHeight: 1.4,

                        // Mobile: full width, larger touch target
                        ...(isMobile && {
                            width: '100%',
                            minWidth: 'unset',
                            py: 1.25,
                            px: 2,
                        }),
                        ...(!isMobile && {
                            minWidth: 240,
                            maxWidth: 420,
                        }),

                        // Transition: use theme motion tokens
                        transition: motion?.all || 'all 160ms cubic-bezier(.2,.8,.2,1)',
                    };
                },
            }}
            message={
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        // Mobile: slightly larger text area for readability
                        minHeight: { xs: 28, sm: 'auto' },
                    }}
                >
                    <CheckCircleRoundedIcon
                        sx={(t) => ({
                            fontSize: { xs: 22, sm: 20 },
                            color: t.palette.success.main,
                            flexShrink: 0,
                        })}
                    />
                    {message}
                </Box>
            }
        />
    );

    if (typeof document !== 'undefined') {
        return createPortal(snackbar, document.body);
    }
    return snackbar;
}

/**
 * useSuccessSnackbar
 *
 * Convenience hook that manages open/message state internally.
 *
 * Returns:
 * - showSuccess(message: string) — call to trigger the snackbar
 * - snackbarProps — spread onto <SuccessSnackbar {...snackbarProps} />
 *
 * Usage:
 *   const { showSuccess, snackbarProps } = useSuccessSnackbar();
 *   showSuccess('Post updated successfully');
 *   return <SuccessSnackbar {...snackbarProps} />;
 */
export function useSuccessSnackbar() {
    const [state, setState] = useState({ open: false, message: '' });

    const showSuccess = useCallback((message) => {
        setState({ open: true, message });
    }, []);

    const onClose = useCallback(() => {
        setState((prev) => ({ ...prev, open: false }));
    }, []);

    return {
        showSuccess,
        snackbarProps: {
            open: state.open,
            message: state.message,
            onClose,
        },
    };
}
