import GlobalStyles from '@mui/material/GlobalStyles';
// src/components/Header/Header.jsx
// Header with visible text on white, quick actions, and Messages button that highlights when on /messages
// Updates in this version:
// - Removes Deals + Real Estate tabs from the header.
// - Adds gold marker variants for the ACTIVE tab (matches the header underline).
// - Uses location.pathname as a reliable fallback to determine the active tab (works on refresh / direct URLs).
// - Keeps all previous behavior intact (tabs, routes, account menu).
// - Listens for `me:updated` (CustomEvent) and a `localStorage` signal to refresh the header's user
//   object (and avatar) immediately after profile avatar changes without a full reload.
// - Polishes header UI: improves menu link readability, and visually separates the profile section.
// - Removes the Messages button from the profile section (messages route logic remains intact).
//
// Additional polish (requested next steps):
// - Empty states & onboarding hints: a small non-modal tip bar that appears once and can be dismissed (X top-right).
// - Micro-animations: subtle hover/press transitions for buttons, tabs container, and icon buttons.
// - Mobile header behavior: improved wrapping/scroll for tabs and tighter profile controls on small screens.
// - First-time user experience: guest hint + logged-in hint, both one-time per browser unless dismissed.

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
// NOTE: useMediaQuery intentionally NOT imported here — see breakpoint hook below.
import {
    AppBar,
    Toolbar,
    Box,
    Avatar,
    Typography,
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Divider,
    Badge,
    CircularProgress,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Snackbar,
    Alert,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import PublicIcon from '@mui/icons-material/Public';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CloseIcon from '@mui/icons-material/Close';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
// MusicNoteRoundedIcon is imported below — used for artist default avatars everywhere
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import ContactSupportOutlinedIcon from '@mui/icons-material/ContactSupportOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

// Mobile bottom-nav icons
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import MusicNoteRoundedIcon from '@mui/icons-material/MusicNoteRounded';
import PaletteRoundedIcon from '@mui/icons-material/PaletteRounded';
import StarsRoundedIcon from '@mui/icons-material/StarsRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import PanToolRoundedIcon from '@mui/icons-material/PanToolRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import LocalMallRoundedIcon from '@mui/icons-material/LocalMallRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import CreateRoundedIcon from '@mui/icons-material/CreateRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import WifiOffRoundedIcon from '@mui/icons-material/WifiOffRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';

import TabBar from './TabBar';
import logoLight from '../../assets/LocalLanternLogo.png';
import logoDark from '../../assets/LocalLanternLogoDarkMode.png';
// Round "profile" version of the Local Lantern logo, used on the Messages
// page for the system sender avatar. Reusing the same asset for approval
// notifications keeps the visual identity consistent between places where
// The Local Lantern speaks to the user (messages + notifications).
import LocalLanternProfilePic from '../../assets/LocalLanternProfilePic.png';
import defaultAvatar from '../../assets/profile/default_avatar.png';
import SellerReviewsPopup from '../../pages/profile/userProfile/SellerReviewsPopup';

// Theme picker
import ThemePickerMenuItem from '../../themes/ThemePickerMenuItem';

// Unified auth hook
import { useAuth } from '../AuthModalContext';

// Security: centralized fetch wrapper with CSRF + TOKEN_EXPIRED handling
import { secureFetch } from '../../utils/secureFetch';

// Static account headers for fetch() calls (not covered by the axios interceptor)
import { getAccountHeaders } from '../../utils/getAccountHeadersStatic';

// Rate limiting for create actions
import useRateLimit from '../../utils/useRateLimit';
import RateLimitDialog from '../RateLimitDialog';

// Continuous mobile nav scroll-hide: CSS-variable driven, tracks finger movement
import {
    setScrollHideOffset,
    setScrollHideActive,
} from '../../utils/scrollHideOffset';

// Business accounts (personal + business)
import { fetchMyBusinessAccounts } from '../../pages/business/api/businessApi';

// Artist accounts (uses existing artists API)
import { fetchMyArtistAccounts } from '../../pages/music/api/artists';

// Tabs (includes "Talent" after "Events") - Deals + Real Estate removed
const rawTabs = ['Community', 'Businesses', 'Events', 'Talent', 'Jobs', 'Services', 'Marketplace'];

// Tab -> MUI icon mapping (reuses the same Rounded icons as mobile bottom nav)
const TAB_ICONS = {
    Community:   PeopleAltRoundedIcon,
    Businesses:  StorefrontRoundedIcon,
    Events:      EventRoundedIcon,
    Talent:      StarsRoundedIcon,
    Jobs:        WorkRoundedIcon,
    Services:    BuildRoundedIcon,
    Marketplace: ShoppingCartRoundedIcon,
};

// Helper to produce API base if provided, else use relative (dev proxy)
const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

// Cache the last-known logged-in user so the header doesn't briefly blank/flicker
// during route transitions while parent auth state is re-hydrating.
const ME_CACHE_KEY = 'll:me:cache';

function readCachedMe() {
    try {
        const raw = localStorage.getItem(ME_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

function writeCachedMe(nextUser) {
    try {
        if (!nextUser) return;
        localStorage.setItem(ME_CACHE_KEY, JSON.stringify(nextUser));
    } catch {
        /* ignore */
    }
}

function clearCachedMe() {
    try {
        localStorage.removeItem(ME_CACHE_KEY);
    } catch {
        /* ignore */
    }
}


// Top-level route names that are **not** user profiles.
// Anything not in this set (and not empty) is treated as a profile route.
const KNOWN_ROOTS = new Set([
    '',
    'community',
    'events',
    'jobs',
    'business',
    'music', // legacy — still reserved so redirects work
    'artists',
    'services',
    'marketplace',
    // Keeping these even though tabs are removed so these routes are not misclassified as profile routes
    'deals',
    'real-estate',
    'social',
    'messages',
    'login',
    'register',
    'posts',
    'social-login-success',
    'social-signup',
    'u',
    'groups',
    'admin',
]);

// ── Stable references (defined outside the component to avoid re-creation on every render) ──
const HEADER_PREVIEW_TYPES = new Set([
    'post_comment', 'comment_reply', 'comment_like',
    'photo_comment', 'photo_comment_like',
    'service_photo_comment', 'service_photo_comment_like',
    'event_comment', 'comment_share',
    'business_review', 'business_review_reply',
    'poll_ended',
]);

const EMPTY_HIGHLIGHT_NOTIF_IDS = [];

// Utility: path matches a base segment (e.g., "/alice" or "/alice/...").
const pathIs = (pathname, base) => pathname === base || pathname.startsWith(`${base}/`);

function tabFromPathname(pathname) {
    if (pathname === '/' || pathname === '') return '';
    if (/^\/community(\/|$)/.test(pathname)) return 'Community';
    if (/^\/business(\/|$)/.test(pathname)) return 'Businesses';
    if (/^\/events(\/|$)/.test(pathname)) return 'Events';
    if (/^\/artists(\/|$)/.test(pathname)) return 'Talent';
    if (/^\/music(\/|$)/.test(pathname)) return 'Talent'; // legacy — redirects to /artists
    if (/^\/jobs(\/|$)/.test(pathname)) return 'Jobs';
    if (/^\/services(\/|$)/.test(pathname)) return 'Services';
    if (/^\/marketplace(\/|$)/.test(pathname)) return 'Marketplace';
    return '';
}

// Motion ease — aligned with theme.custom.motion.ease
const UI_EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

/** Icon components used by the mobile bottom tab bar */
const MOBILE_TAB_ICONS = {
    Community:   PeopleAltRoundedIcon,
    Businesses:  StorefrontRoundedIcon,
    Events:      EventRoundedIcon,
    Talent:      StarsRoundedIcon,
    Jobs:        WorkRoundedIcon,
    Services:    BuildRoundedIcon,
    Marketplace: ShoppingCartRoundedIcon,
};

/** Height of the mobile bottom tab bar (px) — exported so page layouts can add matching bottom padding */
export const MOBILE_BOTTOM_NAV_HEIGHT = 56;
export const HEADER_HEIGHT_MOBILE = 52;
export const HEADER_HEIGHT_DESKTOP = 72;

export default function Header({ user, activeTab, onTabChange }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { openLogin, openLoginPopup } = useAuth();
    const theme = useTheme();
    const logo = theme.palette.mode === 'dark' ? logoDark : logoLight;

    // ── Breakpoint detection (scrollbar-stable) ─────────────────────────────
    // `useMediaQuery` subscribes to `matchMedia` which reads viewport width
    // INCLUDING the scrollbar. At a breakpoint boundary, flipping a breakpoint
    // can toggle a scrollbar, which shifts the width by ~15-17px and flips
    // the breakpoint back — an infinite loop that fires as "Maximum update
    // depth exceeded" while dragging dev-tools near the boundary. Using
    // `documentElement.clientWidth` excludes the scrollbar and is stable.
    // Both breakpoints below use the same debounced resize listener so
    // coincident flips are evaluated together, not in a race.
    const mdBreakpointPx = theme.breakpoints.values.md; // default 900
    const readBreakpoints = () => {
        if (typeof document === 'undefined') {
            return { isMobile: false, isTabletOrBelow: false };
        }
        const w = document.documentElement.clientWidth;
        return {
            isMobile: w < mdBreakpointPx,
            isTabletOrBelow: w <= 1439,
        };
    };
    const [breakpoints, setBreakpoints] = useState(readBreakpoints);
    useEffect(() => {
        let t = null;
        const check = () => {
            const next = readBreakpoints();
            setBreakpoints((prev) => {
                if (
                    prev.isMobile === next.isMobile &&
                    prev.isTabletOrBelow === next.isTabletOrBelow
                ) {
                    return prev;
                }
                return next;
            });
        };
        const onResize = () => {
            if (t) clearTimeout(t);
            t = setTimeout(check, 150);
        };
        window.addEventListener('resize', onResize);
        // Ensure we land on the right values once the DOM has settled
        // (in case initial measurement happened before layout was final).
        check();
        return () => {
            window.removeEventListener('resize', onResize);
            if (t) clearTimeout(t);
        };
        // mdBreakpointPx is theme-dependent; re-subscribe if theme changes.
    }, [mdBreakpointPx]);
    const { isMobile, isTabletOrBelow } = breakpoints;

    // Anchor only opens from the three-dots button
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);

    // Account-switcher menu (opened by tapping profile avatar/name)
    const [acctSwitcherAnchorEl, setAcctSwitcherAnchorEl] = useState(null);
    const acctSwitcherOpen = Boolean(acctSwitcherAnchorEl);

    // Notifications popover
    const [notifAnchorEl, setNotifAnchorEl] = useState(null);
    const notifOpen = Boolean(notifAnchorEl);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifItems, setNotifItems] = useState([]);
    const [notifLoading, setNotifLoading] = useState(false);
    const [highlightNotifIds, setHighlightNotifIds] = useState([]);
    const [followedBackIds, setFollowedBackIds] = useState(new Set());
    const [alreadyFollowingIds, setAlreadyFollowingIds] = useState(new Set());
    const [sellerReviewsPopup, setSellerReviewsPopup] = useState({ open: false, sellerId: null, highlightReviewId: null });

    // Unread messages badge
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);

    // Hovered main nav tab (used to swap icons to gold on hover)
    const [hoverTab, setHoverTab] = useState('');

    // ── Create (+) menu anchor (handlers defined after activeAccount is computed) ──
    const [createMenuAnchorEl, setCreateMenuAnchorEl] = useState(null);
    const createMenuOpen = Boolean(createMenuAnchorEl);
    // ── Mobile scroll-hide: CONTINUOUS tracking (Facebook/Instagram style) ──
    // The nav bars translate proportionally with scroll motion instead of
    // snapping on thresholds. The shared `scrollHideOffset` module owns the
    // value (0 = visible, 1 = hidden); the Header writes to it from scroll
    // events, and a CSS custom property `--ll-nav-offset` is kept in sync
    // so bars animate via transforms without React re-renders.
    //
    // Thumb-tracking: while a finger is on the screen (touchstart..touchend),
    // the bars follow the drag and DO NOT settle. If you drag halfway down
    // and hold, the bars stay at half-hidden. On lift-off, they gently settle
    // to the nearest endpoint (0 or 1) after a brief idle.
    //
    // `mobileNavHidden` state here is derived (offset > 0.5 = "hidden") —
    // it's ONLY used by CommunityPage's body-class layout expansion, and
    // updates at most twice per scroll gesture (cross of the 0.5 threshold).
    const [mobileNavHidden, setMobileNavHidden] = useState(false);
    const lastScrollPositions = useRef(new WeakMap());
    const scrollTicking = useRef(false);
    const offsetRef = useRef(0); // continuous 0..1 offset
    // Ref to the AppBar DOM node so we can measure its live height and write
    // it to --ll-nav-height. We do NOT rely on the isMobile/isDesktop breakpoint
    // toggle to pick a fixed 52/72 because MUI's Toolbar uses the `sm`
    // breakpoint (600px) while our `isMobile` uses `md` (900px), and on iOS
    // safe-area-inset-top adds extra pixels that don't show up in either
    // static value. Measuring the real node keeps the CSS var honest.
    const appBarRef = useRef(null);
    const settleTimerRef = useRef(null);
    const settleRafRef = useRef(null);
    // True while a finger is actively on the screen. While true, we do NOT
    // settle the bars — they track the thumb. Settle only runs after lift-off.
    const touchActiveRef = useRef(false);

    useEffect(() => {
        if (!isTabletOrBelow) {
            setScrollHideActive(false);
            setMobileNavHidden(false);
            // Clear CSS vars so desktop bars never have stray values
            document.documentElement.style.removeProperty('--ll-nav-offset');
            document.documentElement.style.removeProperty('--ll-nav-pointer-events');
            document.documentElement.style.removeProperty('--ll-nav-height');
            document.documentElement.style.removeProperty('--ll-bottom-nav-height');
            return;
        }
        setScrollHideActive(true);
        document.documentElement.style.setProperty('--ll-nav-offset', '0');
        document.documentElement.style.setProperty('--ll-nav-pointer-events', 'auto');
        // --ll-nav-height is set by the dedicated measurement effect below
        // (ResizeObserver on the AppBar). We only seed the bottom-nav height
        // here since that bar has a fixed known height.
        document.documentElement.style.setProperty('--ll-bottom-nav-height', `${MOBILE_BOTTOM_NAV_HEIGHT}px`);

        const TOP_ZONE = 160;       // always fully visible in the first 160px of scroll
                                    // — bumped from 80 to avoid accidental hides on short scrolls
        const BOTTOM_ZONE = 140;    // px from bottom edge — freeze offset in this zone
                                    // — bumped from 80 to prevent bottom-bounce jitter
        const BOUNCE_DELTA_IGNORE = 1.5; // sub-pixel deltas are bounce artifacts
        const MIN_SCROLLABLE = 500; // if page barely scrolls, never hide
                                    // — bumped from 300 so short pages don't hide the header at all
        const BOTTOM_BOUNCE_COOLDOWN_MS = 500;
        // Scroll distance (px) that corresponds to a full hide (offset 0 → 1).
        // Larger = slower hiding; smaller = snappier. Facebook uses ~1x bar
        // height; we use a more gradual feel on both phone and tablet.
        const HIDE_DISTANCE = 100;  // bumped from 60 for a slower, more gradual hide
        // After this long with no scroll events, settle to the nearest endpoint.
        const SETTLE_IDLE_MS = 120;
        // Duration of the settle animation.
        const SETTLE_ANIM_MS = 160;

        const bottomHitAt = { current: 0 };

        // Disable on fixed-layout pages where the layout shift from hiding
        // causes more problems than it solves.
        const isFixedLayoutPage = () => /^\/(messages)(\/|$|\?)/.test(window.location.pathname);

        // Apply current offset to DOM. This runs on the scroll hot path so it
        // avoids React state updates — only CSS var mutation + threshold-cross
        // state sync for layout consumers.
        const applyOffset = (next) => {
            const clamped = next < 0 ? 0 : next > 1 ? 1 : next;
            if (clamped === offsetRef.current) return;
            offsetRef.current = clamped;
            // Broadcast to subscribers (CommunityPage reads via useScrollHideOffset)
            setScrollHideOffset(clamped);
            // CSS var drives the transforms on the bars directly
            document.documentElement.style.setProperty('--ll-nav-offset', String(clamped));
            // Companion var so bars that fade out can also disable pointer events
            // (an invisible sticky bar shouldn't intercept taps on content beneath).
            // Flips to 'none' once the bar is mostly hidden; otherwise 'auto'.
            document.documentElement.style.setProperty(
                '--ll-nav-pointer-events',
                clamped > 0.98 ? 'none' : 'auto'
            );
            // Sync the coarse hidden/visible state for body class consumers
            const nowHidden = clamped > 0.5;
            setMobileNavHidden((prev) => (prev === nowHidden ? prev : nowHidden));
        };

        // Cancel any pending settle animation
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

        // Animate offset to target (0 or 1) over SETTLE_ANIM_MS
        const settleTo = (target) => {
            cancelSettle();
            const start = offsetRef.current;
            if (start === target) return;
            const t0 = performance.now();
            const ease = (x) => 1 - Math.pow(1 - x, 2); // easeOutQuad
            const step = () => {
                const t = Math.min(1, (performance.now() - t0) / SETTLE_ANIM_MS);
                const v = start + (target - start) * ease(t);
                applyOffset(v);
                if (t < 1) {
                    settleRafRef.current = requestAnimationFrame(step);
                } else {
                    settleRafRef.current = null;
                }
            };
            settleRafRef.current = requestAnimationFrame(step);
        };

        // Schedule a settle to nearest endpoint when scroll goes idle.
        // IMPORTANT: if a finger is still on the screen, do NOT settle —
        // the bars should continue tracking the thumb. The touchend handler
        // will call this again once the finger lifts.
        const scheduleSettle = () => {
            if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
            if (touchActiveRef.current) return;
            settleTimerRef.current = setTimeout(() => {
                settleTimerRef.current = null;
                if (touchActiveRef.current) return;
                const v = offsetRef.current;
                if (v > 0 && v < 1) {
                    settleTo(v >= 0.5 ? 1 : 0);
                }
            }, SETTLE_IDLE_MS);
        };

        const handleScroll = (e, options) => {
            const onlyWindow = options && options.onlyWindow;
            const onlyElement = options && options.onlyElement;
            if (scrollTicking.current) return;
            if (isFixedLayoutPage()) {
                cancelSettle();
                applyOffset(0);
                return;
            }
            scrollTicking.current = true;

            requestAnimationFrame(() => {
                scrollTicking.current = false;

                const target = e?.target;
                const isWindowLike = !target || target === document || target === window;

                // Route events to the correct handler invocation to prevent
                // double-processing. The window listener gets window-scroll events;
                // the capture-phase document listener gets internal-container
                // scroll events. Without this guard, a window scroll fires BOTH
                // listeners and we process the same delta twice per rAF frame,
                // which caused rapid offset oscillation on window-scrolling pages
                // like the user profile (visible as the app bar blinking).
                if (onlyWindow && !isWindowLike) return;
                if (onlyElement && isWindowLike) return;

                // Ignore scroll events from inside MUI Menus / Poppers / Dialogs
                if (target instanceof HTMLElement && target.closest('[role="menu"], [role="dialog"], [role="presentation"], .MuiPopover-root, .MuiMenu-root, .MuiDialog-root')) {
                    return;
                }

                let currentY, storageKey, scrollHeight, clientHeight;

                if (isWindowLike) {
                    currentY = window.scrollY;
                    storageKey = document;
                    scrollHeight = document.documentElement.scrollHeight;
                    clientHeight = window.innerHeight;
                } else if (target instanceof HTMLElement) {
                    // Only react to elements with meaningful scroll area
                    if (target.scrollHeight <= target.clientHeight + 10) return;
                    currentY = target.scrollTop;
                    storageKey = target;
                    scrollHeight = target.scrollHeight;
                    clientHeight = target.clientHeight;
                } else {
                    return;
                }

                const lastY = lastScrollPositions.current.get(storageKey);
                lastScrollPositions.current.set(storageKey, currentY);

                // Skip direction check on the very first event (no baseline yet)
                if (lastY == null) return;

                // Near top / too little content: always fully visible
                const totalScrollable = scrollHeight - clientHeight;
                if (currentY < TOP_ZONE || totalScrollable < MIN_SCROLLABLE) {
                    cancelSettle();
                    applyOffset(0);
                    return;
                }

                const distFromBottom = totalScrollable - currentY;
                const delta = currentY - lastY;
                const now = Date.now();

                // Freeze the offset when near the bottom edge — overscroll bounce
                // otherwise produces oscillating deltas that unhide the bar.
                if (distFromBottom < BOTTOM_ZONE) {
                    bottomHitAt.current = now;
                    return;
                }

                // Suppress upward scroll shortly after hitting the bottom (bounce-back).
                if (delta < 0 && now - bottomHitAt.current < BOTTOM_BOUNCE_COOLDOWN_MS) {
                    return;
                }

                // Ignore sub-pixel artifacts
                if (Math.abs(delta) < BOUNCE_DELTA_IGNORE) return;

                // Cancel any in-flight settle — user is actively scrolling again
                cancelSettle();

                // Continuous update: map pixel delta to offset delta.
                // Scroll down (delta > 0) → increase offset toward 1 (hide).
                // Scroll up (delta < 0) → decrease offset toward 0 (show).
                const offsetDelta = delta / HIDE_DISTANCE;
                applyOffset(offsetRef.current + offsetDelta);

                // Settle to nearest endpoint when scroll goes idle
                scheduleSettle();
            });
        };

        // Window scroll for normal pages (only processes window-level scrolls)
        const windowHandler = (e) => handleScroll(e, { onlyWindow: true });
        window.addEventListener('scroll', windowHandler, { passive: true });
        // Capture-phase document listener catches scroll events from internal
        // scroll containers (e.g. CommunityPage's inner feed). It explicitly
        // skips window-level scrolls to avoid duplicating the above.
        const documentHandler = (e) => handleScroll(e, { onlyElement: true });
        document.addEventListener('scroll', documentHandler, { passive: true, capture: true });

        // ── Touch tracking: while a finger is down, we do NOT settle. ──
        // This gives the Instagram/FB feel where bars sit at whatever offset
        // the drag leaves them and only snap to an endpoint after lift-off.
        const onTouchStart = () => {
            touchActiveRef.current = true;
            // Cancel any in-flight settle so a finger-down "grabs" the bars
            // wherever they currently are instead of fighting the animation.
            cancelSettle();
        };
        const onTouchEnd = () => {
            touchActiveRef.current = false;
            // Small delay before settling so a quick fling (touchend fires
            // before momentum scroll completes) doesn't yank the bars mid-fling.
            scheduleSettle();
        };
        document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
        document.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
        document.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });

        return () => {
            window.removeEventListener('scroll', windowHandler);
            document.removeEventListener('scroll', documentHandler, { capture: true });
            document.removeEventListener('touchstart', onTouchStart, { capture: true });
            document.removeEventListener('touchend', onTouchEnd, { capture: true });
            document.removeEventListener('touchcancel', onTouchEnd, { capture: true });
            cancelSettle();
            setScrollHideActive(false);
            document.documentElement.style.removeProperty('--ll-nav-offset');
            document.documentElement.style.removeProperty('--ll-nav-pointer-events');
            document.documentElement.style.removeProperty('--ll-nav-height');
            document.documentElement.style.removeProperty('--ll-bottom-nav-height');
        };
    }, [isMobile, isTabletOrBelow]);

    // ── Measure live AppBar height and write --ll-nav-height ──
    // The actual AppBar height depends on several factors that don't line up
    // with our `isMobile` (md=900px) breakpoint: MUI's Toolbar uses the `sm`
    // (600px) breakpoint to switch between 52/72, and iOS adds
    // safe-area-inset-top. Measuring the node itself is the only way to get
    // a value that matches what the user actually sees. The subheaders on
    // each page position themselves at `top: var(--ll-nav-height)`, so if
    // this value is wrong they overlap or leave a gap.
    useLayoutEffect(() => {
        if (!isTabletOrBelow) return;
        const el = appBarRef.current;
        if (!el || typeof ResizeObserver === 'undefined') {
            // Fallback: set a sensible default so the subheader still shows
            // somewhere reasonable even without ResizeObserver.
            document.documentElement.style.setProperty('--ll-nav-height', '72px');
            return;
        }
        const apply = () => {
            const h = el.getBoundingClientRect().height;
            if (h > 0) {
                document.documentElement.style.setProperty('--ll-nav-height', `${Math.ceil(h)}px`);
            }
        };
        apply();
        const ro = new ResizeObserver(apply);
        ro.observe(el);
        return () => {
            ro.disconnect();
        };
    }, [isTabletOrBelow]);

    // Reset nav visibility on route change so bars don't stay hidden after navigation
    useEffect(() => {
        setMobileNavHidden(false);
        lastScrollPositions.current = new WeakMap();
        offsetRef.current = 0;
        setScrollHideOffset(0);
        document.documentElement.style.setProperty('--ll-nav-offset', '0');
        document.documentElement.style.setProperty('--ll-nav-pointer-events', 'auto');
    }, [location.pathname]);

    // Sync mobileNavHidden to a body class so fixed-layout pages (CommunityPage etc.)
    // can expand their content area into the freed space via CSS.
    useEffect(() => {
        const cl = document.body.classList;
        if (mobileNavHidden) {
            cl.add('ll-mobile-nav-hidden');
        } else {
            cl.remove('ll-mobile-nav-hidden');
        }
        return () => cl.remove('ll-mobile-nav-hidden');
    }, [mobileNavHidden]);

    // Maintain an internal copy that can update via events even if parent prop hasn't re-rendered yet
    const [headerUser, setHeaderUser] = useState(() => user || readCachedMe() || null);

    // ── Backend connectivity check ──
    // Pings a lightweight endpoint to detect if the backend is unreachable.
    // Shows a subtle offline indicator in the user section.
    // Uses a simple health-check approach: any HTTP response (including 401)
    // means the backend is reachable. Only network failures = offline.
    // Only polls when the tab is visible to save requests (Cloud Run billing).
    const [backendOffline, setBackendOffline] = useState(false);
    useEffect(() => {
        let active = true;
        let interval = null;

        const check = async () => {
            if (!active || document.hidden) return;
            try {
                const res = await fetch(`${API_BASE}/api/health`, {
                    method: 'GET',
                    cache: 'no-store',
                });
                if (active) setBackendOffline(false);
            } catch {
                if (active) setBackendOffline(true);
            }
        };

        const startPolling = () => {
            clearInterval(interval);
            check(); // fetch immediately when tab becomes visible
            interval = setInterval(check, 120_000); // re-check every 2 min
        };

        const handleVisibility = () => {
            if (document.hidden) {
                clearInterval(interval);
            } else {
                startPolling();
            }
        };

        startPolling();
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            active = false;
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    // ── TOKEN_EXPIRED listener — redirect to login when session expires ──
    useEffect(() => {
        const handleTokenExpired = () => {
            // If we're in the middle of an intentional sign-out, don't redirect
            // to /login — handleSignOut will hard-redirect to / instead.
            if (window.__loggingOut) return;
            clearCachedMe();
            try { localStorage.removeItem('ll:activeAccount'); } catch { /* ignore */ }
            navigate('/login', { replace: true });
        };
        window.addEventListener('auth:token-expired', handleTokenExpired);
        return () => window.removeEventListener('auth:token-expired', handleTokenExpired);
    }, [navigate]);

    // ===== Accounts (personal + business + artist) =====
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [businessAccounts, setBusinessAccounts] = useState([]);
    const [artistAccounts, setArtistAccounts] = useState([]);
    const [pendingBusinessApps, setPendingBusinessApps] = useState([]);
    const [pendingArtistApps, setPendingArtistApps] = useState([]);
    const [activeAccountId, setActiveAccountId] = useState(() => {
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            const parsed = raw ? JSON.parse(raw) : null;
            return parsed?.id ?? 'personal';
        } catch {
            return 'personal';
        }
    });

    // When true, the header freezes its display to prevent a flash of the
    // wrong account avatar/name while the page reloads with the new identity.
    const [accountSwitching, setAccountSwitching] = useState(false);

    // Stores the account being switched TO, so we can render an elegant
    // full-screen "Switching to ..." overlay instead of a white flash.
    const [switchingToAccount, setSwitchingToAccount] = useState(null);

    // Keep in sync with prop when it changes.
// IMPORTANT: don't overwrite the header user with null during transient auth re-hydration.
// This prevents the profile section from flickering when navigating between routes.
    useEffect(() => {
        if (user) {
            setHeaderUser(user);
            try {
                writeCachedMe(user);
            } catch {
                /* ignore */
            }
            return;
        }

        // If parent temporarily provides no user (e.g. while fetching), keep the last known value.
        // If we truly have nothing yet, fall back to cached.
        setHeaderUser((prev) => prev || readCachedMe() || null);
    }, [user]);

    // Listen for profile updates from the profile page (same-tab + cross-tab)
    useEffect(() => {
        const onMeUpdated = (e) => {
            const next = e?.detail?.user || e?.detail || null;
            if (!next) return;
            setHeaderUser((prev) => ({ ...(prev || {}), ...next }));
        };

        const onStorage = (ev) => {
            if (ev.key === 'll:me:updated' && ev.newValue) {
                try {
                    const parsed = JSON.parse(ev.newValue);
                    const next = parsed?.user || null;
                    if (next) setHeaderUser((prev) => ({ ...(prev || {}), ...next }));
                } catch {
                    /* ignore */
                }
            }
        };

        window.addEventListener('me:updated', onMeUpdated);
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener('me:updated', onMeUpdated);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    // Persist the most recent user snapshot (including updates from events)
    useEffect(() => {
        if (!headerUser) return;
        try {
            writeCachedMe(headerUser);
        } catch {
            /* ignore */
        }
    }, [headerUser]);

    // Prefer the live-updated user object
    const u = headerUser || user;
    const personalAccount = useMemo(() => {
        if (!u) return null;
        const fullName = [u.first_name || u.firstName || '', u.last_name || u.lastName || '']
            .join(' ')
            .trim();
        return {
            id: 'personal',
            type: 'personal',
            name: fullName || u.username || u.handle || 'Personal Account',
            subtitle: 'Personal',
            status: 'active',
            avatar_url: u.avatar_url || u.profile_picture || null,
            slug: u.handle || u.public_id || u.id || null,
        };
    }, [u]);

    const normalizedBusinessAccounts = useMemo(() => {
        const list = Array.isArray(businessAccounts) ? businessAccounts : [];
        return list
            .map((a) => {
                const rawStatus = String(a?.status || a?.setup_status || '').toLowerCase();
                const hasSetupUrl = Boolean(a?.setup_url || a?.invite_url || a?.inviteUrl || a?.setupUrl);

                // Determine effective status
                let effectiveStatus;
                if (rawStatus === 'pending_approval') {
                    effectiveStatus = 'pending_approval';
                } else if (rawStatus === 'pending_setup' || rawStatus === 'pending') {
                    effectiveStatus = 'pending_setup';
                } else if (rawStatus === 'draft') {
                    effectiveStatus = 'draft';
                } else if (hasSetupUrl && rawStatus !== 'published' && rawStatus !== 'active' && rawStatus !== 'ready') {
                    effectiveStatus = 'pending_setup';
                } else if (rawStatus === 'published' || rawStatus === 'active') {
                    effectiveStatus = 'ready';
                } else {
                    effectiveStatus = rawStatus || (hasSetupUrl ? 'pending_setup' : 'ready');
                }

                return {
                    id: a?.id ?? a?.account_id ?? a?.business_account_id ?? a?.business_id ?? null,
                    businessId: a?.business_id ?? a?.id ?? a?.account_id ?? a?.business_account_id ?? null,
                    type: 'business',
                    name: a?.business_name || a?.name || 'Business Account',
                    city: a?.city || null,
                    status: effectiveStatus,
                    setupUrl: a?.setup_url || a?.invite_url || a?.inviteUrl || a?.setupUrl || null,
                    avatar_url: a?.avatar_url || a?.logo_url || null,
                    slug: a?.slug || a?.handle || a?.public_id || null,
                };
            })
            .filter((a) => a.id !== null && a.id !== undefined);
    }, [businessAccounts]);

    const normalizedArtistAccounts = useMemo(() => {
        const list = Array.isArray(artistAccounts) ? artistAccounts : [];
        return list
            .map((a) => {
                const rawStatus = String(a?.status || a?.setup_status || '').toLowerCase();
                const hasSetupUrl = Boolean(a?.setup_url || a?.invite_url || a?.inviteUrl || a?.setupUrl);

                // Determine effective status:
                // 1. If the backend explicitly says pending_setup or draft, honor it
                // 2. If there's an invite/setup URL, the artist needs setup regardless
                //    of what status the backend reports (override)
                // 3. Only treat as 'active' if there's no setup URL AND status is
                //    not one of the pending/draft values
                let effectiveStatus;
                if (rawStatus === 'pending_approval') {
                    effectiveStatus = 'pending_approval';
                } else if (rawStatus === 'pending_setup' || rawStatus === 'pending') {
                    effectiveStatus = 'pending_setup';
                } else if (rawStatus === 'draft') {
                    effectiveStatus = 'draft';
                } else if (hasSetupUrl) {
                    effectiveStatus = 'pending_setup';
                } else {
                    effectiveStatus = rawStatus || 'active';
                }

                // Sub-type for artist accounts: 'music' (musicians, default) or
                // 'artist' (visual artists). Read from the music_artists.profile_type
                // column via the /api/music/my-artists endpoint. Check both
                // snake_case and camelCase to tolerate serializer variations.
                const rawProfileType = String(a?.profile_type || a?.profileType || '').toLowerCase();
                const profileType = (rawProfileType === 'artist') ? 'artist' : 'music';

                return {
                    id: `artist:${a?.id}`,
                    artistId: a?.id,
                    type: 'artist',
                    profileType,
                    name: a?.name || (profileType === 'artist' ? 'Artist Page' : 'Music Page'),
                    city: a?.city || null,
                    county: a?.county || null,
                    status: effectiveStatus,
                    setupUrl: a?.setup_url || a?.invite_url || a?.inviteUrl || a?.setupUrl || null,
                    avatar_url: a?.avatar_url || null,
                    slug: a?.handle || null,
                };
            })
            .filter((a) => a.artistId !== null && a.artistId !== undefined);
    }, [artistAccounts]);

    const allAccounts = useMemo(() => {
        const base = [];
        if (personalAccount) base.push(personalAccount);
        base.push(...normalizedBusinessAccounts);
        base.push(...normalizedArtistAccounts);

        // Sort order: personal first, then by status group, then business before artist within each group.
        // Result: personal → business(active) → artist(active) → business(pending_approval) →
        //         artist(pending_approval) → business(draft) → artist(draft)
        const statusPriority = (s) => {
            const st = String(s || '').toLowerCase();
            if (st === 'active' || st === 'ready' || st === 'published') return 0;
            if (st === 'pending_approval') return 1;
            if (st === 'pending_setup' || st === 'pending') return 2;
            if (st === 'draft') return 3;
            return 0; // treat unknown as active
        };
        const typePriority = { personal: 0, business: 1, artist: 2 };

        base.sort((a, b) => {
            // Personal always first
            const tA = typePriority[a.type] ?? 9;
            const tB = typePriority[b.type] ?? 9;
            if (tA === 0 && tB !== 0) return -1;
            if (tB === 0 && tA !== 0) return 1;
            // Then sort by status group (active → pending_approval → draft)
            const sA = statusPriority(a.status);
            const sB = statusPriority(b.status);
            if (sA !== sB) return sA - sB;
            // Within same status group, business before artist
            return tA - tB;
        });

        return base;
    }, [personalAccount, normalizedBusinessAccounts, normalizedArtistAccounts]);

    // Determine the currently active account (personal, business, or artist)
    // When the page first loads, business/artist lists are empty (still fetching).
    // To avoid a flash of the personal account, we read the cached account data
    // from localStorage and use it as a placeholder until the real list arrives.
    const activeAccount = useMemo(() => {
        if (activeAccountId === 'personal' || !activeAccountId) {
            return personalAccount;
        }
        const businessAcct = normalizedBusinessAccounts.find((a) => a.id === activeAccountId);
        if (businessAcct) return businessAcct;
        const artistAcct = normalizedArtistAccounts.find((a) => a.id === activeAccountId);
        if (artistAcct) return artistAcct;

        // Lists haven't loaded yet — use the cached account from localStorage
        // so we don't briefly flash the personal account avatar/name.
        try {
            const raw = localStorage.getItem('ll:activeAccount');
            if (raw) {
                const cached = JSON.parse(raw);
                if (cached && cached.id === activeAccountId && cached.type) {
                    // Normalize cached profileType so downstream checks
                    // (isVisualArtistActiveAccount, composer fallbacks) work
                    // even before the artist list finishes loading.
                    const rawProfileType = String(cached.profileType || cached.profile_type || '').toLowerCase();
                    const normalizedProfileType = cached.type === 'artist'
                        ? (rawProfileType === 'artist' ? 'artist' : 'music')
                        : null;
                    return {
                        id: cached.id,
                        type: cached.type,
                        profileType: normalizedProfileType,
                        name: cached.name || '',
                        avatar_url: cached.avatar_url || null,
                        slug: cached.slug || null,
                        artistId: cached.artistId || null,
                        businessId: cached.businessId || null,
                        role: cached.role || 'owner',
                    };
                }
            }
        } catch {
            // ignore
        }

        return personalAccount;
    }, [activeAccountId, personalAccount, normalizedBusinessAccounts, normalizedArtistAccounts]);

    // Avatar and display name based on active account
    const activeAvatarSrc = useMemo(() => {
        const isPlaceholder = (url) => {
            if (!url) return true;
            const s = String(url).trim().toLowerCase();
            if (!s || s === 'null' || s === 'undefined') return true;
            return s.includes('default_avatar') || s.includes('default_business') || s.includes('default_logo') || s.includes('default-avatar') || s.includes('placeholder');
        };
        if (activeAccount?.type === 'business') {
            // Business account: use business avatar only — never fall back to personal profile pic
            const raw = activeAccount?.avatar_url || activeAccount?.logo_url || null;
            return isPlaceholder(raw) ? null : raw;
        }
        if (activeAccount?.type === 'artist') {
            // Artist account: use artist avatar only — never fall back to personal profile pic
            const raw = activeAccount?.avatar_url || null;
            return isPlaceholder(raw) ? null : raw;
        }
        const raw = u?.avatar_url || u?.profile_picture || null;
        return isPlaceholder(raw) ? null : raw;
    }, [activeAccount, u]);

    const activeDisplayName = useMemo(() => {
        if (activeAccount?.type === 'business') {
            return activeAccount.name;
        }
        if (activeAccount?.type === 'artist') {
            return activeAccount.name;
        }
        return u?.first_name || u?.firstName || 'there';
    }, [activeAccount, u]);

    const isBusinessAccount = activeAccount?.type === 'business';
    const isArtistAccount = activeAccount?.type === 'artist';

    // Authoritative artist profile_type. The normalized artist list usually
    // has profileType populated from /api/music/my-artists, but there are
    // race conditions (list hasn't loaded, stale localStorage fallback, or
    // the DB row was updated after the list was cached) where it can be
    // stale or missing. Mirror the ArtistAdminConsole pattern and fetch
    // the artist row directly — this is the only source of truth.
    const [fetchedActiveArtistProfileType, setFetchedActiveArtistProfileType] = useState('');
    useEffect(() => {
        const artistId = Number(activeAccount?.artistId || 0);
        if (!isArtistAccount || !artistId) {
            setFetchedActiveArtistProfileType('');
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const res = await secureFetch(
                    `/api/music/artists/${encodeURIComponent(String(artistId))}`,
                    { credentials: 'include', headers: { Accept: 'application/json' } }
                );
                if (!res.ok || cancelled) return;
                const data = await res.json();
                const entity = data?.artist || data || {};
                const pt = String(entity?.profile_type || entity?.profileType || '').toLowerCase();
                if (cancelled) return;
                setFetchedActiveArtistProfileType(pt === 'artist' ? 'artist' : 'music');
                // Patch localStorage so AccountContext + other consumers
                // (BusinessPostPage, modals, etc.) see the fresh value.
                try {
                    const raw = localStorage.getItem('ll:activeAccount');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed && typeof parsed === 'object') {
                            const normalized = pt === 'artist' ? 'artist' : 'music';
                            if (parsed.profile_type !== normalized || parsed.profileType !== normalized) {
                                parsed.profile_type = normalized;
                                parsed.profileType = normalized;
                                localStorage.setItem('ll:activeAccount', JSON.stringify(parsed));
                            }
                        }
                    }
                } catch { /* ignore */ }
            } catch { /* non-critical */ }
        })();
        return () => { cancelled = true; };
    }, [isArtistAccount, activeAccount?.artistId]);

    // For artist accounts, distinguish musicians from visual artists so the
    // header avatar fallback can render a palette vs music-note icon. The
    // fresh fetch wins over the possibly-stale context / normalized list.
    const isVisualArtistActiveAccount = isArtistAccount && (
        fetchedActiveArtistProfileType === 'artist' ||
        (!fetchedActiveArtistProfileType && activeAccount?.profileType === 'artist')
    );

    // ── Create menu handlers ──
    const isPersonalAccount = !isBusinessAccount && !isArtistAccount;

    // Rate limiters (same configs as their respective pages)
    const { checkLimit: checkCommunityPostLimit } = useRateLimit('community-post', {
        burstMax: 3,
        burstWindowMs: 60_000,
        maxPerHour: 15,
    });
    const { checkLimit: checkBusinessPostLimit } = useRateLimit('business-post', {
        burstMax: 3,
        burstWindowMs: 60_000,
        maxPerHour: 15,
    });
    const { checkLimit: checkGroupLimit } = useRateLimit('community-group', {
        burstMax: 2,
        burstWindowMs: 60_000,
        maxPerHour: 5,
    });
    const { checkLimit: checkDraftCreateLimit } = useRateLimit('business-draft-create', {
        burstMax: 3,
        burstWindowMs: 60_000,
        maxPerHour: 10,
    });
    const { checkLimit: checkEventCreateLimit } = useRateLimit('event-create', {
        burstMax: 3,
        burstWindowMs: 120_000,
        maxPerHour: 10,
    });
    const { checkLimit: checkJobCreateLimit } = useRateLimit('job-create', {
        burstMax: 3,
        burstWindowMs: 120_000,
        maxPerHour: 10,
    });
    const { checkLimit: checkServiceCreateLimit } = useRateLimit('service-create', {
        burstMax: 3,
        burstWindowMs: 120_000,
        maxPerHour: 10,
    });
    const { checkLimit: checkServiceRequestLimit } = useRateLimit('service-request', {
        burstMax: 3,
        burstWindowMs: 120_000,
        maxPerHour: 10,
    });

    // ── Business page draft/pending limit dialog ──
    const [draftLimitDialogOpen, setDraftLimitDialogOpen] = useState(false);
    const [draftLimitTitle, setDraftLimitTitle] = useState('');
    const [draftLimitMessage, setDraftLimitMessage] = useState('');
    const [draftLimitChecking, setDraftLimitChecking] = useState(false);

    // ── Rate limit dialog (for create-business-page flow) ──
    const [headerRateLimitOpen, setHeaderRateLimitOpen] = useState(false);
    const [headerRateLimitInfo, setHeaderRateLimitInfo] = useState({
        retryAfterSec: 10,
        reason: 'cooldown',
        actionLabel: 'business drafts',
    });

    // ── Contact Us dialog ──
    const [contactUsOpen, setContactUsOpen] = useState(false);
    const [contactUsMsg, setContactUsMsg] = useState('');
    const [contactUsSending, setContactUsSending] = useState(false);
    const [contactUsSnackbar, setContactUsSnackbar] = useState({ open: false, severity: 'success', message: '' });

    /** Navigate to business page setup — mirrors BusinessHubPage.handleSubmitPage */
    const handleCreateBusinessPage = useCallback(async () => {
        if (!u) { openLoginPopup('Log in to create content on The Local Lantern'); return; }
        // Must be on a personal account
        if (!isPersonalAccount) {
            setDraftLimitTitle('Personal Account Required');
            setDraftLimitMessage('Business pages can only be created from a personal account. Please switch to your personal profile first.');
            setDraftLimitDialogOpen(true);
            return;
        }
        // Rate-limit check
        const rl = checkDraftCreateLimit();
        if (!rl.allowed) {
            setHeaderRateLimitInfo({ retryAfterSec: rl.retryAfterSec, reason: rl.reason, actionLabel: 'business drafts' });
            setHeaderRateLimitOpen(true);
            return;
        }
        // Check draft & pending counts before navigating
        try {
            setDraftLimitChecking(true);
            const resp = await fetchMyBusinessAccounts();
            const list = Array.isArray(resp?.businesses) ? resp.businesses : (Array.isArray(resp) ? resp : []);
            const draftCount = list.filter((b) => String(b?.status || '').toLowerCase() === 'draft').length;
            const pendingCount = list.filter((b) => String(b?.status || '').toLowerCase() === 'pending_approval').length;
            if (draftCount >= 5) {
                setDraftLimitTitle('Limit Reached');
                setDraftLimitMessage('You already have 5 business page drafts. Please finish or delete an existing draft before starting a new one.');
                setDraftLimitDialogOpen(true);
                return;
            }
            if (pendingCount >= 5) {
                setDraftLimitTitle('Limit Reached');
                setDraftLimitMessage('You already have 5 business pages waiting for review. Please wait for some to be approved before submitting more.');
                setDraftLimitDialogOpen(true);
                return;
            }
        } catch {
            // If the check fails, let them through — backend will enforce
        } finally {
            setDraftLimitChecking(false);
        }
        navigate('/business/admin/setup');
    }, [navigate, isPersonalAccount, u, openLoginPopup, checkDraftCreateLimit]);

    /** Navigate to artist profile setup — mirrors MusicPage.handleOpenCreate */
    const { checkLimit: checkArtistDraftLimit } = useRateLimit('artist-draft-create', {
        burstMax: 3,
        burstWindowMs: 60_000,
        maxPerHour: 10,
    });

    const handleCreateArtistProfile = useCallback(async (profileType = 'music') => {
        if (!u) { openLoginPopup('Log in to create content on The Local Lantern'); return; }
        // Normalize the profile type — only 'music' or 'artist' are valid.
        const normalizedType = (profileType === 'artist') ? 'artist' : 'music';
        const typeNoun = (normalizedType === 'artist') ? 'artist page' : 'music page';
        const typeNounPlural = (normalizedType === 'artist') ? 'artist pages' : 'music pages';

        // Must be on a personal account
        if (!isPersonalAccount) {
            setDraftLimitTitle('Personal Account Required');
            setDraftLimitMessage(`${typeNoun.charAt(0).toUpperCase() + typeNoun.slice(1)}s can only be created from a personal account. Please switch to your personal profile first.`);
            setDraftLimitDialogOpen(true);
            return;
        }
        // Rate-limit check
        const rl = checkArtistDraftLimit();
        if (!rl.allowed) {
            setHeaderRateLimitInfo({ retryAfterSec: rl.retryAfterSec, reason: rl.reason, actionLabel: `${typeNoun} drafts` });
            setHeaderRateLimitOpen(true);
            return;
        }
        // Check draft & pending counts before navigating
        try {
            setDraftLimitChecking(true);
            const resp = await fetchMyArtistAccounts();
            const list = Array.isArray(resp?.artists) ? resp.artists : (Array.isArray(resp) ? resp : []);
            const draftCount = list.filter((a) => String(a?.status || '').toLowerCase() === 'draft').length;
            const pendingCount = list.filter((a) => String(a?.status || '').toLowerCase() === 'pending_approval').length;
            if (draftCount >= 5) {
                setDraftLimitTitle('Limit Reached');
                setDraftLimitMessage(`You already have 5 ${typeNoun} drafts. Please finish or delete an existing draft before starting a new one.`);
                setDraftLimitDialogOpen(true);
                return;
            }
            if (pendingCount >= 5) {
                setDraftLimitTitle('Limit Reached');
                setDraftLimitMessage(`You already have 5 ${typeNounPlural} waiting for review. Please wait for some to be approved before submitting more.`);
                setDraftLimitDialogOpen(true);
                return;
            }
        } catch {
            // If the check fails, let them through — backend will enforce
        } finally {
            setDraftLimitChecking(false);
        }
        navigate(`/artists/setup?type=${normalizedType}`);
    }, [navigate, isPersonalAccount, u, openLoginPopup, checkArtistDraftLimit]);

    const handleCreateMenuOpen = useCallback((e) => {
        if (!u) { openLoginPopup('Log in to create content on The Local Lantern'); return; }
        setCreateMenuAnchorEl(e.currentTarget);
    }, [u, openLoginPopup]);

    const handleCreateMenuClose = useCallback(() => {
        setCreateMenuAnchorEl(null);
    }, []);

    // "Post" menu item — adapts to account type
    const handleCreatePost = useCallback(() => {
        handleCreateMenuClose();
        if (!u) { openLoginPopup('Log in to create content on The Local Lantern'); return; }

        if (isBusinessAccount) {
            // Business post — rate limit, then dispatch
            const result = checkBusinessPostLimit();
            if (!result.allowed) {
                window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'businessPost', blocked: 'rateLimit', retryAfterSec: result.retryAfterSec, reason: result.reason } }));
                return;
            }
            window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'businessPost' } }));
            return;
        }

        if (isArtistAccount) {
            // Artist post — rate limit, then dispatch
            const result = checkCommunityPostLimit();
            if (!result.allowed) {
                window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'artistPost', blocked: 'rateLimit', retryAfterSec: result.retryAfterSec, reason: result.reason } }));
                return;
            }
            window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'artistPost' } }));
            return;
        }

        // Personal account — community post with rate limit
        const result = checkCommunityPostLimit();
        if (!result.allowed) {
            window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'communityPost', blocked: 'rateLimit', retryAfterSec: result.retryAfterSec, reason: result.reason } }));
            return;
        }
        window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'communityPost' } }));
    }, [u, openLoginPopup, isBusinessAccount, isArtistAccount, checkCommunityPostLimit, checkBusinessPostLimit, handleCreateMenuClose]);

    // "Group" menu item — personal only, shows switch dialog for business/artist
    const handleHeaderCreateGroup = useCallback(() => {
        handleCreateMenuClose();
        if (!u) { openLoginPopup('Log in to create content on The Local Lantern'); return; }
        if (!isPersonalAccount) {
            window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'group', blocked: 'account' } }));
            return;
        }
        const result = checkGroupLimit();
        if (!result.allowed) {
            window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'group', blocked: 'rateLimit', retryAfterSec: result.retryAfterSec, reason: result.reason } }));
            return;
        }
        window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'group' } }));
    }, [u, openLoginPopup, isPersonalAccount, checkGroupLimit, handleCreateMenuClose]);

    // "Event" menu item
    const handleHeaderCreateEvent = useCallback(() => {
        handleCreateMenuClose();
        if (!u) { openLoginPopup('Log in to create content on The Local Lantern'); return; }
        const result = checkEventCreateLimit();
        if (!result.allowed) {
            window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'event', blocked: 'rateLimit', retryAfterSec: result.retryAfterSec, reason: result.reason } }));
            return;
        }
        window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'event' } }));
    }, [u, openLoginPopup, checkEventCreateLimit, handleCreateMenuClose]);

    // "Job" menu item
    const handleHeaderCreateJob = useCallback(() => {
        handleCreateMenuClose();
        if (!u) { openLoginPopup('Log in to create content on The Local Lantern'); return; }
        const result = checkJobCreateLimit();
        if (!result.allowed) {
            window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'job', blocked: 'rateLimit', retryAfterSec: result.retryAfterSec, reason: result.reason } }));
            return;
        }
        window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'job' } }));
    }, [u, openLoginPopup, checkJobCreateLimit, handleCreateMenuClose]);

    // "Service" menu item — navigates to /services/create
    const handleHeaderCreateService = useCallback(() => {
        handleCreateMenuClose();
        if (!u) { openLoginPopup('Log in to create content on The Local Lantern'); return; }
        const result = checkServiceCreateLimit();
        if (!result.allowed) {
            window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'service', blocked: 'rateLimit', retryAfterSec: result.retryAfterSec, reason: result.reason } }));
            return;
        }
        window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'service' } }));
    }, [u, openLoginPopup, checkServiceCreateLimit, handleCreateMenuClose]);

    // "Service Request" menu item
    const handleHeaderCreateServiceRequest = useCallback(() => {
        handleCreateMenuClose();
        if (!u) { openLoginPopup('Log in to create content on The Local Lantern'); return; }
        const result = checkServiceRequestLimit();
        if (!result.allowed) {
            window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'serviceRequest', blocked: 'rateLimit', retryAfterSec: result.retryAfterSec, reason: result.reason } }));
            return;
        }
        window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'serviceRequest' } }));
    }, [u, openLoginPopup, checkServiceRequestLimit, handleCreateMenuClose]);

    // "Marketplace Listing" menu item
    const handleHeaderCreateListing = useCallback(() => {
        handleCreateMenuClose();
        if (!u) { openLoginPopup('Log in to create content on The Local Lantern'); return; }
        window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'listing' } }));
    }, [u, openLoginPopup, handleCreateMenuClose]);

    // "Yard Sale" menu item
    const handleHeaderCreateYardSale = useCallback(() => {
        handleCreateMenuClose();
        if (!u) { openLoginPopup('Log in to create content on The Local Lantern'); return; }
        window.dispatchEvent(new CustomEvent('ll:header:create', { detail: { action: 'yardSale' } }));
    }, [u, openLoginPopup, handleCreateMenuClose]);

    const pendingBusinessCount = useMemo(() => {
        const setupCount = normalizedBusinessAccounts.filter((a) => {
            const s = String(a.status);
            return s === 'pending_setup' || s === 'draft' || s === 'pending_approval';
        }).length;
        const approvalCount = Array.isArray(pendingBusinessApps) ? pendingBusinessApps.length : 0;
        return setupCount + approvalCount;
    }, [normalizedBusinessAccounts, pendingBusinessApps]);



    // Badge "notifications" for business accounts: cleared once the menu is opened and then closed.
    // We store the last-seen count (per-user) so the badge only reappears when new items are added.
    const [seenBusinessNotifCount, setSeenBusinessNotifCount] = useState(0);

    // ── Account notification highlight (gold glow for new/unseen accounts) ──
    // Tracks which account IDs should be highlighted with the brass/gold color
    // when the three-dot menu is opened. Once the menu closes, they are persisted
    // as "seen" in localStorage so they won't highlight again on next login.
    const [highlightAccountIds, setHighlightAccountIds] = useState(new Set());

    useEffect(() => {
        if (!u?.id) {
            setSeenBusinessNotifCount(0);
            return;
        }
        try {
            const key = `ll:accounts:seenPendingCount:${u.id}`;
            const raw = localStorage.getItem(key);
            const parsed = raw ? Number(raw) : 0;
            setSeenBusinessNotifCount(Number.isFinite(parsed) ? parsed : 0);
        } catch {
            setSeenBusinessNotifCount(0);
        }
    }, [u?.id]);

    const businessNotifBadgeCount = useMemo(() => {
        const diff = Number(pendingBusinessCount || 0) - Number(seenBusinessNotifCount || 0);
        return diff > 0 ? diff : 0;
    }, [pendingBusinessCount, seenBusinessNotifCount]);
    const handleSelectAccount = (acct) => {
        if (!acct) return;

        // Skip if selecting the already-active account
        if (acct.id === activeAccountId) {
            closeMenu();
            return;
        }

        // Freeze the header display immediately to prevent flash of wrong account
        setAccountSwitching(true);

        // Show the elegant "Switching to..." overlay
        setSwitchingToAccount(acct);

        // Close the menu right away
        closeMenu();

        // Persist the new account to localStorage (will be read on page load)
        try {
            localStorage.setItem('ll:activeAccount', JSON.stringify({
                id: acct.id,
                type: acct.type,
                profileType: acct.profileType || null,
                name: acct.name,
                avatar_url: acct.avatar_url || null,
                slug: acct.slug || null,
                artistId: acct.artistId || null,
                businessId: acct.type === 'business' ? (acct.businessId ?? acct.id) : null,
                role: acct.role || 'owner',
            }));
        } catch {
            // ignore
        }

        try {
            window.dispatchEvent(new CustomEvent('ll:account:changed', { detail: { account: acct } }));
        } catch {
            // ignore
        }

        // Determine where to navigate — use a short delay so the
        // "Switching to..." overlay paints before the browser navigates.
        const navigateAfterOverlay = (url) => {
            // Double rAF + small timeout ensures the overlay is visible
            requestAnimationFrame(() => {
                setTimeout(() => {
                    window.location.assign(url);
                }, 400);
            });
        };

        requestAnimationFrame(() => {
            const currentPath = window.location.pathname;

            if (currentPath.includes('/business/admin/setup') || currentPath.includes('/business/setup')) {
                if (acct.type === 'business' && acct.slug) {
                    navigateAfterOverlay(`/${acct.slug}/admin`);
                } else {
                    navigateAfterOverlay('/');
                }
                return;
            }

            if (currentPath.includes('/artists/setup') || currentPath.includes('/music/artist/setup') || currentPath.includes('/music/setup')) {
                if (acct.type === 'artist' && acct.slug) {
                    navigateAfterOverlay(`/${acct.slug}/admin`);
                } else {
                    navigateAfterOverlay('/');
                }
                return;
            }

            // If on any admin console page, redirect appropriately:
            // - Switching to a business/artist account → go to their public profile
            // - Switching to personal → go home
            const isOnAdmin = currentPath.endsWith('/admin') || currentPath.includes('/admin/');
            if (isOnAdmin) {
                if (acct.type === 'personal') {
                    navigateAfterOverlay('/');
                } else if ((acct.type === 'business' || acct.type === 'artist') && acct.slug) {
                    navigateAfterOverlay(`/${acct.slug}`);
                } else {
                    navigateAfterOverlay('/');
                }
                return;
            }

            // Hard-refresh the page so every component re-fetches with the
            // new account identity.
            requestAnimationFrame(() => {
                setTimeout(() => {
                    window.location.reload();
                }, 400);
            });
        });
    };

    const handleOpenSetup = (acct) => {
        if (!acct) return;

        // For business accounts: route to the new admin setup page
        if (acct.type === 'business') {
            // Extract token from the setupUrl if available (e.g. "/business/setup?token=abc123")
            const setupUrl = acct.setupUrl || '';
            const tokenMatch = setupUrl.match(/[?&]token=([^&]+)/);
            const token = tokenMatch ? tokenMatch[1] : '';
            if (token) {
                navigate(`/business/admin/setup?token=${encodeURIComponent(token)}`);
            } else {
                // No token — go to the create new flow
                navigate('/business/admin/setup');
            }
            return;
        }

        // For artist accounts: route to the new admin setup page (mirrors business pattern)
        // Carry the profileType forward so ArtistAdminConsole can correct any
        // stale value on save — see the profileType memo in that component.
        const artistType = String(acct.profileType || acct.profile_type || "").toLowerCase();
        const typeParam = (artistType === "artist" || artistType === "music")
            ? `&type=${artistType}`
            : "";
        if (acct.setupUrl) {
            const setupUrl = acct.setupUrl || '';
            const tokenMatch = setupUrl.match(/[?&]token=([^&]+)/);
            const token = tokenMatch ? tokenMatch[1] : '';
            if (token) {
                navigate(`/artists/setup?token=${encodeURIComponent(token)}${typeParam}`);
            } else {
                navigate(`/artists/setup${typeParam ? `?${typeParam.slice(1)}` : ""}`);
            }
            return;
        }
        if (acct.type === 'artist') {
            navigate(`/artists/setup${typeParam ? `?${typeParam.slice(1)}` : ""}`);
            return;
        }
        navigate('/business/admin/setup');
    };

    // Load business accounts / pending setups / artist accounts (safe if endpoint isn't present yet)
    useEffect(() => {
        if (!u?.id) {
            setBusinessAccounts([]);
            setArtistAccounts([]);
            setPendingBusinessApps([]);
            return;
        }

        let didCancel = false;

        const run = async () => {
            setAccountsLoading(true);
            try {
                // Fetch business accounts
                const businessData = await fetchMyBusinessAccounts();

                const businesses = Array.isArray(businessData?.businesses) ? businessData.businesses : [];
                const pendingSetups = Array.isArray(businessData?.pendingSetups) ? businessData.pendingSetups : [];
                const pendingApps = Array.isArray(businessData?.pendingApplications) ? businessData.pendingApplications : [];

                const mergedAccounts = [
                    ...businesses,
                    ...pendingSetups.map((row) => ({
                        business_id: row?.business_id,
                        business_name: row?.business_name,
                        status: 'pending_setup',
                        invite_url: row?.invite_url,
                    }))
                ];

                if (!didCancel) {
                    setBusinessAccounts(mergedAccounts);
                    setPendingBusinessApps(pendingApps);
                }
            } catch {
                if (!didCancel) {
                    setBusinessAccounts([]);
                    setPendingBusinessApps([]);
                }
            }

            // Fetch artist accounts (separate try/catch so one failure doesn't block the other)
            try {
                const artistData = await fetchMyArtistAccounts();
                const artists = Array.isArray(artistData?.artists) ? artistData.artists : [];

                // Also fetch pending artist setups/applications
                let artistPendingSetups = [];
                let artistPendingApps = [];
                try {
                    const setupsRes = await secureFetch('/api/music/my-artist-setups', { credentials: 'include', headers: { Accept: 'application/json' } });
                    if (setupsRes.ok) {
                        const setupsData = await setupsRes.json();
                        artistPendingSetups = Array.isArray(setupsData?.pendingSetups) ? setupsData.pendingSetups : [];
                        artistPendingApps = Array.isArray(setupsData?.pendingApplications) ? setupsData.pendingApplications : [];
                    }
                } catch { /* ignore if endpoint not available */ }

                // Build a lookup of pending setup URLs by artist_id so draft
                // artists that already appear in the artists list still get
                // their invite_url (needed to navigate back to the setup page).
                const setupUrlByArtistId = {};
                for (const row of artistPendingSetups) {
                    if (row?.artist_id && row?.invite_url) {
                        setupUrlByArtistId[Number(row.artist_id)] = row.invite_url;
                    }
                }

                // Merge published/draft artists + pending setups that don't
                // already appear in the artists list.
                const existingIds = new Set(artists.map((a) => Number(a.id)));
                const mergedArtists = [
                    ...artists.map((a) => {
                        const numId = Number(a.id);
                        const setupUrl = setupUrlByArtistId[numId] || null;
                        // Attach invite_url from pending setups so
                        // normalizedArtistAccounts can detect pending state
                        if (setupUrl && !a.invite_url && !a.setup_url) {
                            return { ...a, invite_url: setupUrl };
                        }
                        return a;
                    }),
                    ...artistPendingSetups
                        .filter((row) => !existingIds.has(Number(row?.artist_id)))
                        .map((row) => ({
                            id: row?.artist_id,
                            name: row?.artist_name,
                            status: 'pending_setup',
                            invite_url: row?.invite_url,
                        }))
                ];

                if (!didCancel) {
                    setArtistAccounts(mergedArtists);
                    setPendingArtistApps(artistPendingApps);
                }
            } catch {
                if (!didCancel) {
                    setArtistAccounts([]);
                    setPendingArtistApps([]);
                }
            }

            if (!didCancel) setAccountsLoading(false);
        };

        run();
        return () => {
            didCancel = true;
        };
    }, [u?.id]);

    // Re-fetch artist accounts when an artist profile is updated (e.g., name/handle change)
    useEffect(() => {
        const handleArtistUpdated = async () => {
            if (!u?.id) return;
            try {
                const artistData = await fetchMyArtistAccounts();
                const artists = Array.isArray(artistData?.artists) ? artistData.artists : [];
                setArtistAccounts(artists);

                // If an artist account is active, update the cached slug/name in localStorage
                if (activeAccountId && String(activeAccountId).startsWith('artist:')) {
                    const artistNumId = Number(String(activeAccountId).replace('artist:', ''));
                    const updated = artists.find((a) => a.id === artistNumId);
                    if (updated) {
                        try {
                            // Preserve profile_type (music vs artist) so the
                            // header avatar and downstream composers can pick
                            // the correct fallback icon. Read from the updated
                            // artist row first; fall back to whatever is
                            // currently cached so we never clobber it.
                            const rawUpdatedPt = String(updated.profile_type || updated.profileType || '').toLowerCase();
                            let profileType = rawUpdatedPt === 'artist' ? 'artist' : rawUpdatedPt === 'music' ? 'music' : null;
                            if (!profileType) {
                                try {
                                    const prev = JSON.parse(localStorage.getItem('ll:activeAccount') || '{}');
                                    const prevPt = String(prev?.profileType || prev?.profile_type || '').toLowerCase();
                                    profileType = prevPt === 'artist' ? 'artist' : 'music';
                                } catch { profileType = 'music'; }
                            }
                            localStorage.setItem('ll:activeAccount', JSON.stringify({
                                id: activeAccountId,
                                type: 'artist',
                                profileType,
                                name: updated.name || (profileType === 'artist' ? 'Artist Page' : 'Music Page'),
                                avatar_url: updated.avatar_url || updated.avatarUrl || null,
                                slug: updated.handle || null,
                                artistId: updated.id || artistNumId || null,
                                role: updated.role || 'owner',
                            }));
                        } catch {
                            // ignore
                        }
                    }
                }
            } catch {
                // ignore
            }
        };
        window.addEventListener('ll:artist:updated', handleArtistUpdated);
        return () => window.removeEventListener('ll:artist:updated', handleArtistUpdated);
    }, [u?.id, activeAccountId]);

    // Re-fetch artist accounts when a draft is created, saved, or submitted for review
    // Also periodically poll (every 5 min) to detect admin-side status changes (e.g. published)
    useEffect(() => {
        if (!u?.id) return undefined;

        const handleArtistAccountsUpdated = async () => {
            try {
                const artistData = await fetchMyArtistAccounts();
                const artists = Array.isArray(artistData?.artists) ? artistData.artists : [];

                let artistPendingSetups = [];
                try {
                    const setupsRes = await secureFetch('/api/music/my-artist-setups', { credentials: 'include', headers: { Accept: 'application/json' } });
                    if (setupsRes.ok) {
                        const setupsData = await setupsRes.json();
                        artistPendingSetups = Array.isArray(setupsData?.pendingSetups) ? setupsData.pendingSetups : [];
                    }
                } catch { /* ignore */ }

                const setupUrlByArtistId = {};
                for (const row of artistPendingSetups) {
                    if (row?.artist_id && row?.invite_url) {
                        setupUrlByArtistId[Number(row.artist_id)] = row.invite_url;
                    }
                }

                const existingIds = new Set(artists.map((a) => Number(a.id)));
                const mergedArtists = [
                    ...artists.map((a) => {
                        const numId = Number(a.id);
                        const setupUrl = setupUrlByArtistId[numId] || null;
                        if (setupUrl && !a.invite_url && !a.setup_url) {
                            return { ...a, invite_url: setupUrl };
                        }
                        return a;
                    }),
                    ...artistPendingSetups
                        .filter((row) => !existingIds.has(Number(row?.artist_id)))
                        .map((row) => ({
                            id: row?.artist_id,
                            name: row?.artist_name,
                            status: 'pending_setup',
                            invite_url: row?.invite_url,
                        }))
                ];

                setArtistAccounts(mergedArtists);
            } catch {
                // ignore
            }
        };

        // Poll every 5 min (not 30s) and only when the tab is visible
        const ARTIST_POLL_MS = 300_000;
        let pollTimer = null;

        const startArtistPoll = () => {
            if (pollTimer) clearInterval(pollTimer);
            pollTimer = setInterval(() => {
                if (!document.hidden) handleArtistAccountsUpdated();
            }, ARTIST_POLL_MS);
        };

        const handleArtistVisibility = () => {
            if (document.hidden) {
                if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
            } else {
                handleArtistAccountsUpdated();
                startArtistPoll();
            }
        };

        startArtistPoll();
        document.addEventListener('visibilitychange', handleArtistVisibility);
        window.addEventListener('ll:artist:accounts-updated', handleArtistAccountsUpdated);
        return () => {
            if (pollTimer) clearInterval(pollTimer);
            document.removeEventListener('visibilitychange', handleArtistVisibility);
            window.removeEventListener('ll:artist:accounts-updated', handleArtistAccountsUpdated);
        };
    }, [u?.id]);

    // Re-fetch business accounts when a business is created, draft saved, or submitted for review
    // Also periodically poll (every 5 min) to detect admin-side status changes (e.g. published)
    useEffect(() => {
        if (!u?.id) return undefined;

        const handleBusinessAccountsUpdated = async () => {
            try {
                const businessData = await fetchMyBusinessAccounts();
                const businesses = Array.isArray(businessData?.businesses) ? businessData.businesses : [];
                const pendingSetups = Array.isArray(businessData?.pendingSetups) ? businessData.pendingSetups : [];
                const pendingApps = Array.isArray(businessData?.pendingApplications) ? businessData.pendingApplications : [];
                const mergedAccounts = [
                    ...businesses,
                    ...pendingSetups.map((row) => ({
                        business_id: row?.business_id,
                        business_name: row?.business_name,
                        status: 'pending_setup',
                        invite_url: row?.invite_url,
                    }))
                ];
                setBusinessAccounts(mergedAccounts);
                setPendingBusinessApps(pendingApps);
            } catch {
                // ignore
            }
        };

        // Poll every 5 min (not 30s) and only when the tab is visible
        const BIZ_POLL_MS = 300_000;
        let pollTimer = null;

        const startBizPoll = () => {
            if (pollTimer) clearInterval(pollTimer);
            pollTimer = setInterval(() => {
                if (!document.hidden) handleBusinessAccountsUpdated();
            }, BIZ_POLL_MS);
        };

        const handleBizVisibility = () => {
            if (document.hidden) {
                if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
            } else {
                handleBusinessAccountsUpdated();
                startBizPoll();
            }
        };

        startBizPoll();
        document.addEventListener('visibilitychange', handleBizVisibility);
        window.addEventListener('ll:business:accounts-updated', handleBusinessAccountsUpdated);
        return () => {
            if (pollTimer) clearInterval(pollTimer);
            document.removeEventListener('visibilitychange', handleBizVisibility);
            window.removeEventListener('ll:business:accounts-updated', handleBusinessAccountsUpdated);
        };
    }, [u?.id]);

    useEffect(() => {
        const handleBusinessDeleted = (event) => {
            const deletedBusinessId = event?.detail?.businessId;
            if (!deletedBusinessId) return;

            const deletedAccountId = String(deletedBusinessId);

            setBusinessAccounts((current) => {
                if (!Array.isArray(current)) return current;
                return current.filter((acct) => {
                    const acctId = acct?.id ?? acct?.account_id ?? acct?.business_account_id ?? acct?.business_id ?? null;
                    return String(acctId) !== deletedAccountId;
                });
            });

            if (String(activeAccountId) === deletedAccountId && personalAccount) {
                setActiveAccountId('personal');

                try {
                    localStorage.setItem('ll:activeAccount', JSON.stringify({
                        id: 'personal',
                        type: 'personal',
                        name: personalAccount.name,
                        avatar_url: personalAccount.avatar_url || null,
                        slug: personalAccount.slug || null,
                        artistId: null,
                        businessId: null,
                    }));
                } catch {
                    // ignore
                }

                try {
                    window.dispatchEvent(new CustomEvent('ll:account:changed', { detail: { account: personalAccount } }));
                } catch {
                    // ignore
                }
            }
        };

        window.addEventListener('ll:business:deleted', handleBusinessDeleted);
        return () => window.removeEventListener('ll:business:deleted', handleBusinessDeleted);
    }, [activeAccountId, personalAccount]);


    // Local Lantern admin flag (server-authoritative) + handle guard
    const isLLAdmin = Boolean(
        u && (
            Number(u.is_local_lantern_admin) === 1 ||
            u.is_local_lantern_admin === true ||
            u.isLLAdmin === true
        ) && String(u.handle || '').toLowerCase().trim() === 'thelocallantern'
    );
    // Use MUI icon fallback when the user doesn't have a profile picture set
    const avatarSrc = u?.avatar_url || u?.profile_picture || null;
    const slug = u ? u.handle || u.public_id || u.id : '';
    // Navigate directly to the canonical profile route
    const profilePath = u ? `/${slug}` : '/login';

    // Determine the active profile path based on whether a business or artist account is selected
    const activeProfilePath = useMemo(() => {
        if (isBusinessAccount && activeAccount?.slug) {
            return `/${activeAccount.slug}`;
        }
        if (isArtistAccount && activeAccount?.slug) {
            return `/${activeAccount.slug}`;
        }
        return profilePath;
    }, [isBusinessAccount, isArtistAccount, activeAccount?.slug, profilePath]);

    // Route checks
    const firstSeg = (location.pathname.split('/')[1] || '').toLowerCase();
    const isBareProfileRoute = Boolean(firstSeg) && !KNOWN_ROOTS.has(firstSeg);
    const onLegacyProfileRoute = /^\/u(\/|$)/.test(location.pathname);
    const onAnyProfileRoute = isBareProfileRoute || onLegacyProfileRoute;

    // Only highlight "My Profile" when the personal account is active AND you're on your own personal profile.
    // Switching to a business or artist account while on the user profile page should NOT highlight the icon.
    const onMyProfileRoute = useMemo(() => {
        if (!u) return false;
        // Only highlight for personal account
        if (activeAccountId !== 'personal') return false;
        // Check personal profile
        return pathIs(location.pathname, `/${slug}`) || pathIs(location.pathname, `/u/${slug}`);
    }, [u, slug, location.pathname, activeAccountId]);

    const onSocialRoute = /^\/social(\/|$)/.test(location.pathname);
    const onMessagesRoute = /^\/messages(\/|$)/.test(location.pathname);
    // Post detail is a non-tabbed route; keep tabs unselected so re-clicking a tab always navigates.
    const onPostsRoute = /^\/posts(\/|$)/.test(location.pathname);

    // Auth pages should not highlight any main navigation tab
    const onAuthRoute = /^\/(login|register|reset-password)(\/|$)/.test(location.pathname);

    // Clear activeTab whenever we're on a non-tabbed route (profile, social, messages, auth, post detail, or own business profile)
    useEffect(() => {
        if (onAnyProfileRoute || onSocialRoute || onMessagesRoute || onAuthRoute || onPostsRoute || onMyProfileRoute) onTabChange('');
    }, [onAnyProfileRoute, onSocialRoute, onMessagesRoute, onAuthRoute, onPostsRoute, onMyProfileRoute, onTabChange]);

    const derivedActiveTab = useMemo(
        () => (onAnyProfileRoute || onSocialRoute || onMessagesRoute || onAuthRoute || onPostsRoute || onMyProfileRoute ? '' : activeTab),
        [activeTab, onAnyProfileRoute, onSocialRoute, onMessagesRoute, onAuthRoute, onPostsRoute, onMyProfileRoute]
    );

    const resolvedTab = useMemo(() => {
        if (derivedActiveTab) return derivedActiveTab;
        if (onAnyProfileRoute || onSocialRoute || onMessagesRoute || onAuthRoute || onPostsRoute || onMyProfileRoute) return '';
        return tabFromPathname(location.pathname);
    }, [derivedActiveTab, location.pathname, onAnyProfileRoute, onSocialRoute, onMessagesRoute, onAuthRoute, onPostsRoute, onMyProfileRoute]);

    // Build TabBar config with themed MUI icons
    const tabsForBar = useMemo(() => {
        return rawTabs.map((t) => {
            const IconComp = TAB_ICONS[t];
            const isActive = resolvedTab === t;
            const isHover = hoverTab === t;
            const isEmph = isActive || isHover;

            const handleEnter = () => setHoverTab(t);
            const handleLeave = () => setHoverTab((prev) => (prev === t ? '' : prev));

            return {
                value: t,
                label: (
                    <Box
                        onMouseEnter={handleEnter}
                        onMouseLeave={handleLeave}
                        onFocus={handleEnter}
                        onBlur={handleLeave}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 0.5, sm: 0.75, md: 0.5, lg: 0.75 },
                            transition: `transform 160ms ${UI_EASE}`,
                            transform: isActive ? 'translateY(-0.5px)' : 'none',
                        }}
                    >
                        {IconComp && (
                            <IconComp
                                sx={(theme) => ({
                                    fontSize: { xs: 17, sm: 19 },
                                    color: isActive
                                        ? theme.palette.secondary.main
                                        : isHover
                                            ? theme.palette.secondary.light
                                            : theme.palette.text.secondary,
                                    transition: `color ${theme.custom.motion.fast}ms ${theme.custom.motion.ease}, transform ${theme.custom.motion.fast}ms ${theme.custom.motion.ease}`,
                                    transform: isEmph ? 'scale(1.08)' : 'scale(1)',
                                })}
                            />
                        )}
                        <Typography
                            component="span"
                            sx={{
                                fontSize: { xs: 11, sm: 13 },
                                lineHeight: 1,
                                fontWeight: isActive ? 800 : isHover ? 750 : 650,
                                color: isActive ? 'secondary.main' : isHover ? 'secondary.light' : 'text.secondary',
                                textDecoration: 'none',
                                transition: `color 160ms ${UI_EASE}`,
                            }}
                        >
                            {t === 'Community' ? 'Local' : t === 'Businesses' ? 'Business' : t}
                        </Typography>
                    </Box>
                ),
            };
        });
    }, [resolvedTab, hoverTab]);

    // Ref for the tab-change fade timer so we can clean it up
    const tabFadeTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (tabFadeTimerRef.current) {
                clearTimeout(tabFadeTimerRef.current);
                tabFadeTimerRef.current = null;
            }
        };
    }, []);

    const handleTabChange = (val) => {
        onTabChange(val);

        // Cancel any in-flight fade timer
        if (tabFadeTimerRef.current) {
            clearTimeout(tabFadeTimerRef.current);
            tabFadeTimerRef.current = null;
        }

        // Dispatch fade-out event so PageFadeWrapper starts fading immediately
        try { window.dispatchEvent(new CustomEvent('ll:page:fadeOut')); } catch { /* ignore */ }

        const doNavigate = () => {
            // Route by tab (Talent replaces old Music tab); Deals + Real Estate removed from header
            if (val === 'Businesses') navigate('/business', { replace: location.pathname === '/business', state: { _ts: Date.now() } });
            else if (val === 'Events') navigate('/events', { replace: location.pathname === '/events', state: { _ts: Date.now() } });
            else if (val === 'Talent') navigate('/artists', { replace: location.pathname === '/artists', state: { _ts: Date.now() } });
            else if (val === 'Jobs') navigate('/jobs', { replace: location.pathname === '/jobs', state: { _ts: Date.now() } });
            else if (val === 'Services') navigate('/services', { replace: location.pathname === '/services', state: { _ts: Date.now() } });
            else if (val === 'Marketplace') navigate('/marketplace', { replace: location.pathname === '/marketplace', state: { _ts: Date.now() } });
            else if (val === 'Community') {
                // Navigate to community — saved filters/state will restore from sessionStorage.
                // Only pass llCommunityReset when re-clicking while already on community
                // (clears selection but preserves filters).
                const isAlreadyOnCommunity = location.pathname === '/community';
                navigate('/community', {
                    replace: isAlreadyOnCommunity,
                    state: {
                        _ts: Date.now(),
                        ...(isAlreadyOnCommunity ? { llCommunityReset: Date.now() } : {}),
                    },
                });
            } else navigate('/community', { state: { _ts: Date.now() } });
        };

        // Delay navigation so the fade-out plays first (matches community tab-fade timing)
        tabFadeTimerRef.current = setTimeout(() => {
            tabFadeTimerRef.current = null;
            doNavigate();
        }, 160);
    };

    // Open the dropdown only from the three-dots button
    const handleDotsClick = (e) => {
        e.stopPropagation();
        if (!u) {
            openLogin();
            return;
        }
        setAnchorEl(e.currentTarget);
    };

    const closeMenu = () => {
        setAnchorEl(null);
    };

    // Close the menu on click-away, ESC, or programmatic close.
    const handleMenuClose = () => closeMenu();

    // ── Account-switcher (opened by tapping profile avatar / name on both mobile and desktop) ──
    const handleAvatarClick = (e) => {
        if (!u) {
            openLogin();
            return;
        }
        e.stopPropagation();

        // Compute gold-highlighted accounts (same logic as handleDotsClick)
        const seenKey = `ll:accounts:seenAccountIds:${u.id}`;
        let seenIds = new Set();
        try {
            const raw = localStorage.getItem(seenKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) seenIds = new Set(parsed.map(String));
            }
        } catch { /* ignore */ }

        const newHighlightIds = new Set();
        for (const acct of allAccounts) {
            if (acct.type === 'personal') continue;
            const acctKey = `${acct.type}:${acct.id}`;
            const acctStatus = String(acct.status || '').toLowerCase();
            const isNotifiable = acctStatus === 'pending_setup' || acctStatus === 'draft' || acctStatus === 'pending_approval';
            if (isNotifiable && !seenIds.has(acctKey)) {
                newHighlightIds.add(acctKey);
            }
        }
        setHighlightAccountIds(newHighlightIds);

        setAcctSwitcherAnchorEl(e.currentTarget);
    };

    const closeAcctSwitcher = () => {
        setAcctSwitcherAnchorEl(null);

        // Persist seen account IDs (same logic as closeMenu)
        if (u?.id) {
            try {
                const seenKey = `ll:accounts:seenAccountIds:${u.id}`;
                let existingSeen = [];
                try {
                    const raw = localStorage.getItem(seenKey);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) existingSeen = parsed;
                    }
                } catch { /* ignore */ }

                const mergedSeen = new Set(existingSeen.map(String));
                for (const id of highlightAccountIds) {
                    mergedSeen.add(id);
                }
                localStorage.setItem(seenKey, JSON.stringify([...mergedSeen]));
            } catch { /* ignore */ }

            setHighlightAccountIds(new Set());
        }
    };


// ===== Notifications helpers =====
    const notifApiUrl = (path) => (API_BASE ? `${API_BASE}${path}` : path);

    // ── Stable refs so polling effects don't depend on activeAccount/activeAccountId ──
    const activeAccountRef = useRef(activeAccount);
    const activeAccountIdRef = useRef(activeAccountId);
    useEffect(() => { activeAccountRef.current = activeAccount; }, [activeAccount]);
    useEffect(() => { activeAccountIdRef.current = activeAccountId; }, [activeAccountId]);

    // ── Stable refs for headerUser/user so callbacks don't depend on object references ──
    const headerUserRef = useRef(headerUser);
    const userPropRef = useRef(user);
    useEffect(() => { headerUserRef.current = headerUser; }, [headerUser]);
    useEffect(() => { userPropRef.current = user; }, [user]);

    /**
     * Build account_id + account_type query params for notification API calls
     * based on the currently active account in the header.
     * Uses refs so it reads the latest values without causing re-renders.
     */
    const getNotifAccountParams = useCallback(() => {
        const acct = activeAccountRef.current;
        const acctId = activeAccountIdRef.current;
        if (!acct || acct.type === 'personal' || acctId === 'personal') {
            return { account_id: 'personal', account_type: 'personal' };
        }
        if (acct.type === 'business') {
            return { account_id: String(acct.id), account_type: 'business' };
        }
        if (acct.type === 'artist') {
            const artistId = acct.artistId || String(acct.id).replace('artist:', '');
            return { account_id: String(artistId), account_type: 'artist' };
        }
        return { account_id: 'personal', account_type: 'personal' };
    }, []);

    /** Append account params to a URL string */
    const appendAccountParams = useCallback((url) => {
        const params = getNotifAccountParams();
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}account_id=${encodeURIComponent(params.account_id)}&account_type=${encodeURIComponent(params.account_type)}`;
    }, [getNotifAccountParams]);

    /** Common headers for notification fetch() calls (includes account identity) */
    const notifFetchHeaders = useCallback(() => ({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...getAccountHeaders(),
    }), []);

    const fetchUnreadCount = useCallback(async () => {
        const currentUser = headerUserRef.current || userPropRef.current;
        if (!currentUser?.id) return;
        try {
            const url = appendAccountParams(notifApiUrl('/api/notifications/unread-count'));
            const res = await secureFetch(url, { credentials: 'include', headers: notifFetchHeaders() });
            if (!res.ok) return;
            const data = await res.json();
            const next = Number(data?.count || 0);
            setUnreadCount(Number.isFinite(next) ? next : 0);
        } catch {
            // ignore
        }
    }, [appendAccountParams, notifFetchHeaders]);

    const fetchNotifications = useCallback(async ({ beforeId = null } = {}) => {
        const currentUser = headerUserRef.current || userPropRef.current;
        if (!currentUser?.id) return [];
        setNotifLoading(true);
        try {
            const qs = new URLSearchParams();
            qs.set('limit', '12');
            if (beforeId) qs.set('before', String(beforeId));
            const acctParams = getNotifAccountParams();
            qs.set('account_id', acctParams.account_id);
            qs.set('account_type', acctParams.account_type);
            const url = `${notifApiUrl('/api/notifications')}?${qs.toString()}`;
            const res = await secureFetch(url, { credentials: 'include', headers: notifFetchHeaders() });
            if (!res.ok) return [];
            const data = await res.json();
            const items = Array.isArray(data?.items) ? data.items : [];
            setNotifItems(items);
            return items;
        } catch {
            // ignore
            return [];
        } finally {
            setNotifLoading(false);
        }
    }, [getNotifAccountParams, notifFetchHeaders]);

    // ── Check existing follow status for follower notifications in header dropdown ──
    useEffect(() => {
        let cancelled = false;

        async function checkFollowStatuses() {
            const targets = [];
            const seen = new Set();

            for (const n of notifItems) {
                if (String(n?.type || '') !== 'new_follower') continue;
                const nd = (() => {
                    if (!n?.data) return {};
                    if (typeof n.data === 'object') return n.data;
                    try { return JSON.parse(n.data); } catch { return {}; }
                })();
                const targetId = Number(
                    nd?.followerAccountId || nd?.followerUserId ||
                    n?.actor_id || n?.actor_user_id || 0
                );
                const targetType = String(nd?.followerAccountType || 'personal').toLowerCase();
                if (!targetId || seen.has(targetId)) continue;
                seen.add(targetId);
                targets.push({ targetId, targetType });
            }

            if (targets.length === 0) return;

            const alreadyFollowing = new Set();
            const headers = { Accept: 'application/json', ...getAccountHeaders() };

            await Promise.all(
                targets.map(async ({ targetId, targetType }) => {
                    try {
                        const qs = new URLSearchParams({
                            target_id: String(targetId),
                            target_type: targetType,
                        });
                        const res = await secureFetch(`/api/follows/status?${qs}`, {
                            credentials: 'include',
                            headers,
                        });
                        if (!res.ok) return;
                        const data = await res.json();
                        if (data?.following) {
                            alreadyFollowing.add(targetId);
                        }
                    } catch {
                        // ignore
                    }
                })
            );

            if (cancelled || alreadyFollowing.size === 0) return;

            setAlreadyFollowingIds((prev) => {
                const next = new Set(prev);
                for (const id of alreadyFollowing) next.add(id);
                return next;
            });
        }

        if (notifItems.length > 0 && !notifLoading) {
            checkFollowStatuses();
        }

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notifItems, notifLoading]);

    const closeNotifications = () => {
        setNotifAnchorEl(null);
        setHighlightNotifIds(EMPTY_HIGHLIGHT_NOTIF_IDS);
    };

    const clearAllNotifications = async () => {
        if (!u?.id) return;
        try {
            const acctParams = getNotifAccountParams();
            await secureFetch(notifApiUrl('/api/notifications/clear'), {
                method: 'DELETE',
                credentials: 'include',
                headers: notifFetchHeaders(),
                body: JSON.stringify(acctParams),
            });
        } catch {
            // ignore
        } finally {
            setNotifItems([]);
            setUnreadCount(0);
            setHighlightNotifIds(EMPTY_HIGHLIGHT_NOTIF_IDS);
            setAlreadyFollowingIds(new Set());
        }
    };


    const handleNotifClick = async (e) => {
        e.stopPropagation();
        if (!u) {
            openLogin();
            return;
        }

        setNotifAnchorEl(e.currentTarget);

        // Load notifications on open.
        const items = await fetchNotifications();

        // Highlight only the notifications that were unread at the moment of opening.
        const freshIds = (items || [])
            .filter((n) => !n?.is_read)
            .map((n) => Number(n?.id))
            .filter((id) => Number.isFinite(id) && id > 0);
        setHighlightNotifIds(freshIds);

        // Mark all as read to clear the badge and remove highlight next open.
        try {
            const acctParams = getNotifAccountParams();
            await secureFetch(notifApiUrl('/api/notifications/read-all'), {
                method: 'POST',
                credentials: 'include',
                headers: notifFetchHeaders(),
                body: JSON.stringify(acctParams),
            });
        } catch {
            // ignore
        }

        setUnreadCount(0);
        setNotifItems((prev) => (prev || []).map((n) => ({ ...n, is_read: true })));
    };

    const markNotificationRead = async (id) => {
        if (!u?.id || !id) return;
        try {
            await secureFetch(notifApiUrl(`/api/notifications/${id}/read`), {
                method: 'POST',
                credentials: 'include',
                headers: notifFetchHeaders(),
            });
        } catch {
            // ignore
        }
    };

    /** Mark multiple notification IDs as read in a single request (for grouped notifs). */
    const markNotificationsReadBatch = async (ids) => {
        if (!u?.id || !ids || !ids.length) return;
        try {
            await secureFetch(notifApiUrl('/api/notifications/read-batch'), {
                method: 'POST',
                credentials: 'include',
                headers: { ...notifFetchHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
        } catch {
            // ignore — fall through silently
        }
    };

    /** Truncate a string with ellipsis */
    const truncateStr = (str, max = 35) => {
        const s = String(str || '').trim();
        return s.length > max ? s.slice(0, max) + '…' : s;
    };

    const getNotifLabel = (n) => {
        const type = String(n?.type || '');
        const others = Number(n?.othersCount) || 0;
        const andOthers = others === 1 ? 'and 1 other ' : others > 1 ? `and ${others} others ` : '';

        const safeJsonParse = (v) => {
            if (!v) return null;
            if (typeof v === 'object') return v;
            try { return JSON.parse(String(v)); } catch { return null; }
        };
        const d = safeJsonParse(n?.data || n?.metadata) || {};

        const postTitle = d?.postTitle || d?.post_title || d?.title || '';
        const postAuthorName = d?.postAuthorName || d?.post_author_name || d?.authorName || d?.author_name || '';
        const titleBit = postTitle ? ` "${truncateStr(postTitle)}"` : '';

        // Slice 2d: news-article comments — label "on [article title]" when
        // the notification was fired by news.js / community.js with the
        // isNewsArticle flag set (or entityType === 'news_article').
        const labelEntityType = String(n?.entity_type || n?.entityType || '').trim();
        const isNewsArticleNotif = d?.isNewsArticle === true || labelEntityType === 'news_article';
        const articleTitleLabel = d?.articleTitle || d?.article_title || '';
        const articleTitleBit = articleTitleLabel ? ` "${truncateStr(articleTitleLabel)}"` : '';

        // Community
        if (type === 'post_comment') return `${andOthers}commented on your post${titleBit}`;
        if (type === 'post_like') return `${andOthers}liked your post${titleBit}`;
        if (type === 'post_repost') return `${andOthers}reposted your post${titleBit}`;
        if (type === 'comment_reply') {
            if (isNewsArticleNotif) {
                return articleTitleLabel
                    ? `${andOthers}replied to your comment on${articleTitleBit}`
                    : `${andOthers}replied to your comment on a news article`;
            }
            return postAuthorName ? `${andOthers}replied to your comment on ${postAuthorName}'s post` : `${andOthers}replied to your comment`;
        }
        if (type === 'comment_like') {
            if (isNewsArticleNotif) {
                return articleTitleLabel
                    ? `${andOthers}liked your comment on${articleTitleBit}`
                    : `${andOthers}liked your comment on a news article`;
            }
            return `${andOthers}liked your comment`;
        }
        if (type === 'post_mention') return 'mentioned you in a post';

        // Photos
        const photoKind = String(d?.photoKind ?? d?.photo_kind ?? d?.kind ?? '').toLowerCase();
        const photoLabel = photoKind === 'cover' ? 'cover photo' : photoKind === 'gallery' ? 'photo' : 'profile photo';
        if (type === 'photo_comment') return `${andOthers}commented on your ${photoLabel}`;
        if (type === 'photo_like') return `${andOthers}liked your ${photoLabel}`;
        if (type === 'photo_comment_like') return `${andOthers}liked a comment on your ${photoLabel}`;

        // Business
        if (type === 'business_review') return 'left a review on your business';
        if (type === 'business_review_helpful') return `${andOthers}found your review helpful`;
        if (type === 'business_review_reply') return 'replied to your review';

        // Events
        if (type === 'event_comment') return `${andOthers}commented on your event`;
        if (type === 'event_engagement' || type === 'event_rsvp') {
            const eventTitle = d?.eventTitle || d?.event_title || '';
            return `${andOthers}RSVP'd to your event${eventTitle ? ` "${truncateStr(eventTitle)}"` : ''}`;
        }
        if (type === 'event_interested') {
            const eventTitle = d?.eventTitle || d?.event_title || '';
            return `${andOthers}is interested in your event${eventTitle ? ` "${truncateStr(eventTitle)}"` : ''}`;
        }
        if (type === 'event_like') {
            const eventTitle = d?.eventTitle || d?.event_title || '';
            return `${andOthers}liked your event${eventTitle ? ` "${truncateStr(eventTitle)}"` : ''}`;
        }
        if (type === 'event_repost') {
            const eventTitle = d?.eventTitle || d?.event_title || '';
            return `${andOthers}reposted your event${eventTitle ? ` "${truncateStr(eventTitle)}"` : ''}`;
        }

        // Jobs
        if (type === 'job_application') {
            const jt = d?.jobTitle || d?.job_title || '';
            return `${andOthers}applied to your job${jt ? ` "${truncateStr(jt)}"` : ''}`;
        }
        if (type === 'job_saved') {
            const jt = d?.jobTitle || d?.job_title || '';
            return `${andOthers}saved your job posting${jt ? ` "${truncateStr(jt)}"` : ''}`;
        }

        // Marketplace
        if (type === 'listing_favorite') {
            const lTitle = d?.listingTitle || d?.listing_title || d?.title || '';
            return `${andOthers}saved your listing${lTitle ? ` "${truncateStr(lTitle)}"` : ''}`;
        }
        if (type === 'listing_repost') {
            const lTitle = d?.listingTitle || d?.listing_title || d?.title || '';
            return `${andOthers}reposted your listing${lTitle ? ` "${truncateStr(lTitle)}"` : ''}`;
        }
        if (type === 'listing_message') return 'messaged you about your listing';
        if (type === 'listing_share') {
            const lTitle = d?.listingTitle || d?.listing_title || d?.title || '';
            if (d?.isAuthorNotif === true) return `${andOthers}shared your listing${lTitle ? ` "${truncateStr(lTitle)}"` : ''}`;
            return `shared a listing with you${lTitle ? ` — "${truncateStr(lTitle)}"` : ''}`;
        }
        if (type === 'listing_share_recipient') {
            const lTitle = d?.listingTitle || d?.listing_title || d?.title || '';
            return `shared a listing with you${lTitle ? ` — "${truncateStr(lTitle)}"` : ''}`;
        }
        // Slice 4c: news article shares — match NotificationsPage.jsx labels
        // exactly so the bell dropdown and full notifications feed read the
        // same copy. Type strings come from shares.js CONTENT_TYPES.news_article
        // (notifType: "news_article_share_recipient").
        if (type === 'news_article_share') {
            const artTitle = d?.articleTitle || d?.article_title || '';
            if (d?.isAuthorNotif === true) return `${andOthers}shared a news article${artTitle ? ` "${truncateStr(artTitle)}"` : ''}`;
            return `shared a news article with you${artTitle ? ` — "${truncateStr(artTitle)}"` : ''}`;
        }
        if (type === 'news_article_share_recipient') {
            const artTitle = d?.articleTitle || d?.article_title || '';
            return `shared a news article with you${artTitle ? ` — "${truncateStr(artTitle)}"` : ''}`;
        }
        if (type === 'listing_sold') {
            const lTitle = d?.listingTitle || d?.listing_title || d?.title || '';
            return lTitle ? `"${truncateStr(lTitle)}" was marked as sold` : 'A listing you saved was marked sold';
        }
        if (type === 'seller_review') return 'left you a seller review';
        if (type === 'seller_review_reply') return 'replied to your seller review';

        // Services
        if (type === 'service_review') {
            const sTitle = d?.listingTitle || d?.listing_title || '';
            return `${andOthers}reviewed your service${sTitle ? ` "${truncateStr(sTitle)}"` : ' listing'}`;
        }
        if (type === 'service_favorited') {
            const sTitle = d?.listingTitle || d?.listing_title || '';
            return `${andOthers}favorited your service${sTitle ? ` "${truncateStr(sTitle)}"` : ' listing'}`;
        }
        if (type === 'service_quote_request') return 'requested a quote from you';
        if (type === 'service_request_response') return 'responded to your service request';
        if (type === 'service_response_accepted') return 'accepted your service response';
        if (type === 'service_response_declined') return 'declined your service response';
        if (type === 'service_request_shared') {
            const rTitle = d?.requestTitle || d?.request_title || '';
            return `${andOthers}shared your service request${rTitle ? ` "${truncateStr(rTitle)}"` : ''}`;
        }
        if (type === 'service_request_share_recipient') {
            const rTitle = d?.requestTitle || d?.request_title || '';
            return `shared a service request with you${rTitle ? ` — "${truncateStr(rTitle)}"` : ''}`;
        }

        // Service Photos
        if (type === 'service_photo_comment') {
            const svcPhotoKind = String(d?.photoType ?? d?.photo_type ?? '').toLowerCase();
            const svcPhotoLabel = svcPhotoKind === 'cover' ? 'service cover photo' : svcPhotoKind === 'avatar' ? 'service profile photo' : 'service photo';
            return `${andOthers}commented on your ${svcPhotoLabel}`;
        }
        if (type === 'service_photo_like') {
            const svcPhotoKind = String(d?.photoType ?? d?.photo_type ?? '').toLowerCase();
            const svcPhotoLabel = svcPhotoKind === 'cover' ? 'service cover photo' : svcPhotoKind === 'avatar' ? 'service profile photo' : 'service photo';
            return `${andOthers}liked your ${svcPhotoLabel}`;
        }
        if (type === 'service_photo_comment_like') {
            return `${andOthers}liked your comment`;
        }

        // Shares
        if (type === 'post_share') {
            const sharePostTypeH = String(d?.postType ?? d?.post_type ?? '').toLowerCase();
            if (sharePostTypeH === 'profile') {
                const profName = d?.profileName || d?.profile_name || '';
                return profName ? `shared ${profName}'s profile with you` : 'shared a profile with you';
            }
            if (sharePostTypeH === 'service_request') {
                const rTitle = d?.requestTitle || d?.request_title || d?.title || '';
                return `shared a service request with you${rTitle ? ` — "${truncateStr(rTitle)}"` : ''}`;
            }
            if (sharePostTypeH === 'service') {
                const sTitle = d?.serviceTitle || d?.listingTitle || d?.listing_title || '';
                return `shared a service with you${sTitle ? ` — "${truncateStr(sTitle)}"` : ''}`;
            }
            if (sharePostTypeH === 'listing') {
                const lTitle = d?.listingTitle || d?.listing_title || d?.title || '';
                return `shared a listing with you${lTitle ? ` — "${truncateStr(lTitle)}"` : ''}`;
            }
            if (sharePostTypeH === 'comment') {
                return 'shared a comment with you';
            }
            if (sharePostTypeH === 'business') {
                const bizName = d?.businessName || d?.business_name || '';
                return bizName ? `shared ${bizName}'s business page with you` : 'shared a business page with you';
            }
            if (sharePostTypeH === 'artist') {
                const artName = d?.artistName || d?.artist_name || '';
                return artName ? `shared ${artName}'s music page with you` : 'shared a music page with you';
            }
            if (d?.isAuthorNotif === true) return `${andOthers}shared your post${titleBit}`;
            return postAuthorName ? `shared ${postAuthorName}'s post with you` : 'shared a post with you';
        }
        if (type === 'profile_share') {
            const profName = d?.profileName || d?.profile_name || '';
            if (d?.isAuthorNotif === true) return `${andOthers}shared your profile`;
            return profName ? `shared ${profName}'s profile with you` : 'shared a profile with you';
        }
        if (type === 'comment_share') return 'shared a comment with you';
        if (type === 'event_share') {
            const eventTitle = d?.eventTitle || d?.event_title || d?.postTitle || d?.post_title || '';
            if (d?.isAuthorNotif === true) return `${andOthers}shared your event${eventTitle ? ` "${truncateStr(eventTitle)}"` : ''}`;
            return `shared an event with you${eventTitle ? ` — "${truncateStr(eventTitle)}"` : ''}`;
        }
        if (type === 'job_share') return 'shared a job listing with you';
        if (type === 'group_share') return 'shared a group with you';
        if (type === 'artist_share') return 'shared a music page with you';
        if (type === 'business_share') return 'shared a business page with you';
        if (type === 'music_post_share') {
            const artName = d?.artistName || d?.artist_name || '';
            if (d?.isAuthorNotif === true) return `${andOthers}shared your music post${artName ? ` on ${artName}` : ''}`;
            return 'shared a music post with you';
        }

        // Poll
        if (type === 'poll_ended') {
            const pollTitle = d?.postTitle || d?.post_title || d?.title || '';
            return pollTitle ? `Your poll "${truncateStr(pollTitle)}" has ended` : 'Your poll has ended';
        }

        // Groups
        if (type === 'group_invite') {
            const groupName = d?.groupName || d?.group_name || '';
            return groupName ? `invited you to join the group ${truncateStr(groupName)}` : 'invited you to join a group';
        }
        if (type === 'group_join') return 'joined your group';
        if (type === 'group_join_request') return 'requested to join your group';
        if (type === 'group_request_approved') {
            const groupName = d?.groupName || d?.group_name || '';
            return groupName ? `Your request to join ${truncateStr(groupName)} was approved!` : 'Your group join request was approved!';
        }
        if (type === 'group_ban') {
            const groupName = d?.groupName || d?.group_name || '';
            const reason = d?.reason || '';
            const base = groupName ? `You have been banned from ${truncateStr(groupName)}` : 'You have been banned from a group';
            return reason ? `${base} — "${truncateStr(reason)}"` : base;
        }
        if (type === 'group_timeout') {
            const groupName = d?.groupName || d?.group_name || '';
            const reason = d?.reason || '';
            const mins = Number(d?.duration_minutes || 0);
            const durLabel = mins >= 1440 ? `${Math.round(mins / 1440)} day${Math.round(mins / 1440) !== 1 ? 's' : ''}`
                : mins >= 60 ? `${Math.round(mins / 60)} hour${Math.round(mins / 60) !== 1 ? 's' : ''}`
                    : `${mins} minute${mins !== 1 ? 's' : ''}`;
            const base = groupName
                ? `You have been timed out from ${truncateStr(groupName)} for ${durLabel}`
                : `You have been timed out from a group for ${durLabel}`;
            return reason ? `${base} — "${truncateStr(reason)}"` : base;
        }

        // Follow
        if (type === 'new_follower') return `${andOthers}started following you`;
        if (type === 'follow_request') return `${andOthers}requested to follow you`;
        if (type === 'follow_request_accepted') return `accepted your follow request`;

        // Account Approval
        if (type === 'business_approved') {
            const bizName = d?.businessName || d?.business_name || 'Your business';
            return `approved your business "${truncateStr(bizName)}"!`;
        }
        if (type === 'artist_approved') {
            const artName = d?.artistName || d?.artist_name || 'Your artist profile';
            // Branch label on the notification's profile_type so visual
            // artists see "artist profile" and musicians see "music profile".
            // Defaults to 'music' when the backend hasn't tagged the field.
            const pt = String(d?.profileType || d?.profile_type || '').toLowerCase();
            const noun = (pt === 'artist') ? 'artist' : 'music';
            return `approved your ${noun} profile "${truncateStr(artName)}"!`;
        }

        return 'sent you a notification';
    };

    /** Extract a brief preview for comment/reply/share notifications */
    const getNotifPreview = (n) => {
        const type = String(n?.type || '');

        const safeJsonParse = (v) => {
            if (!v) return null;
            if (typeof v === 'object') return v;
            try { return JSON.parse(String(v)); } catch { return null; }
        };
        const d = safeJsonParse(n?.data || n?.metadata) || {};

        // Allow preview for post_share with postType='comment' (comment shares via generic share endpoint)
        const isCommentShare = type === 'post_share' && String(d?.postType ?? d?.post_type ?? '').toLowerCase() === 'comment';
        if (!HEADER_PREVIEW_TYPES.has(type) && !isCommentShare) return '';

        // For poll_ended, show the results summary
        if (type === 'poll_ended') {
            const summary = d?.resultsSummary || '';
            const votes = Number(d?.totalVotes || 0);
            if (summary) return truncateStr(summary, 60);
            if (votes > 0) return `${votes} total vote${votes !== 1 ? 's' : ''}`;
            return '';
        }

        const text = String(
            d?.preview || d?.comment_preview || d?.commentPreview ||
            d?.snippet || d?.text || d?.comment || d?.body ||
            d?.commentText || d?.comment_text || d?.review_text || d?.reviewText || ''
        ).trim();
        if (!text) return '';
        return truncateStr(text, 60);
    };

    const getActorDisplayName = (n) => {
        // Prefer business/artist account name when the actor was operating as one
        const d = (() => {
            const raw = n?.data || n?.metadata;
            if (!raw) return {};
            if (typeof raw === 'object') return raw;
            try { return JSON.parse(String(raw)); } catch { return {}; }
        })();
        const accountName = String(d?.actorAccountName || '').trim();
        if (accountName) return accountName;

        const first = String(n?.actor_first_name || '').trim();
        const last = String(n?.actor_last_name || '').trim();
        const full = `${first} ${last}`.trim();
        if (full) return full;

        const handle = String(n?.actor_handle || '').trim();
        if (handle) return handle;

        return 'Unknown user';
    };

    const getActorNameParts = (n) => {
        // System notifications (approvals) — show platform name
        const nType = String(n?.type || '');
        if (nType === 'business_approved' || nType === 'artist_approved') {
            return { first: 'The Local Lantern', last: '' };
        }

        // Prefer business/artist account name when the actor was operating as one
        const d = (() => {
            const raw = n?.data || n?.metadata;
            if (!raw) return {};
            if (typeof raw === 'object') return raw;
            try { return JSON.parse(String(raw)); } catch { return {}; }
        })();
        const accountName = String(d?.actorAccountName || '').trim();
        if (accountName) return { first: accountName, last: '' };

        const first = String(n?.actor_first_name || '').trim();
        const last = String(n?.actor_last_name || '').trim();
        const handle = String(n?.actor_handle || '').trim();

        const displayFirst = first || (handle ? handle : 'Unknown');
        const displayLast = first ? last : '';
        return { first: displayFirst, last: displayLast };
    };


    const getNotifActorAvatarSrc = (n) => {
        // System notifications (approvals) — use the round Local Lantern
        // profile pic that the Messages page uses for the system sender.
        // The horizontal logo asset (`logo`) looks cropped inside a circular
        // avatar, so use the purpose-built round asset instead.
        const nType = String(n?.type || '');
        if (nType === 'business_approved' || nType === 'artist_approved') {
            return LocalLanternProfilePic;
        }

        // actor_avatar_url is now hydrated fresh from the DB by the backend,
        // so prefer it over the stale snapshot in data.actorAccountAvatarUrl.
        const candidate =
            n?.actor_avatar_url ||
            n?.actor_profile_picture ||
            n?.actor_avatar ||
            n?.from_avatar_url ||
            n?.from_profile_picture ||
            n?.from_avatar ||
            n?.avatar_url ||
            n?.profile_picture ||
            '';
        return candidate || null;
    };

    /** Check if avatar URL points to a default/placeholder image */
    const isDefaultAvatar = (src) => {
        if (!src) return true;
        const s = String(src).toLowerCase();
        return s.includes('default_avatar') || s.includes('default_business') || s.includes('default_logo') || s === String(defaultAvatar).toLowerCase();
    };

    /** Determine actor account type from notification data: 'business' | 'artist' | 'personal' */
    const getNotifActorAccountType = (n) => {
        const d = (() => {
            const raw = n?.data || n?.metadata;
            if (!raw) return {};
            if (typeof raw === 'object') return raw;
            try { return JSON.parse(String(raw)); } catch { return {}; }
        })();
        const accountType = String(d?.actorAccountType || d?.actor_account_type || n?.actor_account_type || '').trim().toLowerCase();
        if (accountType === 'business') return 'business';
        if (accountType === 'artist') return 'artist';
        if (d?.actorBusinessId || d?.actor_business_id || n?.actor_business_id) return 'business';
        if (d?.actorArtistId || d?.actor_artist_id || n?.actor_artist_id) return 'artist';
        return 'personal';
    };

    /** Actor profile sub-type for artist accounts: 'music' | 'artist'.
     *  Only meaningful when the account type is 'artist'. Defaults to 'music'
     *  for legacy notifications created before actorProfileType was packed
     *  into the notification data payload. */
    const getNotifActorProfileType = (n) => {
        const d = (() => {
            const raw = n?.data || n?.metadata;
            if (!raw) return {};
            if (typeof raw === 'object') return raw;
            try { return JSON.parse(String(raw)); } catch { return {}; }
        })();
        const raw = String(d?.actorProfileType || d?.actor_profile_type || '').trim().toLowerCase();
        return (raw === 'artist') ? 'artist' : 'music';
    };

    /** Get the appropriate default avatar icon based on account type */
    const NotifDefaultAvatarIcon = ({ accountType, profileType, size = 22 }) => {
        if (accountType === 'business') return <StorefrontOutlinedIcon sx={{ fontSize: size }} />;
        if (accountType === 'artist') {
            return (profileType === 'artist')
                ? <PaletteRoundedIcon sx={{ fontSize: size - 2 }} />
                : <MusicNoteRoundedIcon sx={{ fontSize: size - 2 }} />;
        }
        return <PersonRoundedIcon sx={{ fontSize: size }} />;
    };

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return '';

        const now = Date.now();
        let t;

        // Handle Date objects directly (knex may return these)
        if (dateStr instanceof Date) {
            t = dateStr.getTime();
        } else {
            const raw = String(dateStr).trim();

            // Always try both UTC and local interpretations and pick whichever
            // gives the most recent past time. This handles the common case where
            // the server stores local time but knex/JSON adds a Z suffix.
            if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(raw)) {
                const stripped = raw.replace(/[Zz]$/, '').replace(/[+-]\d{2}:\d{2}$/, '').replace(' ', 'T');
                const asLocal = new Date(stripped).getTime();
                const withZ = stripped.endsWith('Z') ? stripped : stripped + 'Z';
                const asUtc = new Date(withZ).getTime();

                const diffLocal = now - asLocal;
                const diffUtc = now - asUtc;

                if (Number.isFinite(asLocal) && Number.isFinite(asUtc) && diffLocal > 0 && diffUtc > 0) {
                    t = diffLocal < diffUtc ? asLocal : asUtc;
                } else if (Number.isFinite(asLocal) && diffLocal >= 0) {
                    t = asLocal;
                } else if (Number.isFinite(asUtc) && diffUtc >= 0) {
                    t = asUtc;
                }
            }

            if (!t) {
                t = new Date(raw).getTime();
            }
        }

        if (!Number.isFinite(t)) return '';

        const diffSec = Math.max(0, Math.floor((now - t) / 1000));

        if (diffSec < 60) return 'Just now';

        const min = Math.floor(diffSec / 60);
        if (min < 60) return `${min}m ago`;

        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}hr ago`;

        const day = Math.floor(hr / 24);
        if (day < 7) return `${day}d ago`;

        const wk = Math.floor(day / 7);
        if (wk < 5) return `${wk}wk ago`;

        const mo = Math.floor(day / 30);
        if (mo < 12) return `${mo}mo ago`;

        const yr = Math.floor(day / 365);
        return `${yr}y ago`;
    };

    const handleFollowBack = async (e, notif) => {
        e.stopPropagation();
        e.preventDefault();
        const d = (() => {
            if (!notif?.data) return {};
            if (typeof notif.data === 'object') return notif.data;
            try { return JSON.parse(notif.data); } catch { return {}; }
        })();
        const targetHandle = String(d?.actorAccountHandle || d?.actorHandle || d?.actor_handle || notif?.actor_handle || '').trim();
        const targetType = String(d?.followerAccountType || 'personal').toLowerCase();
        const targetId = Number(d?.followerAccountId || d?.followerUserId || notif?.actor_id || notif?.actor_user_id || 0);
        if (!targetId || followedBackIds.has(targetId)) return;

        setFollowedBackIds((prev) => new Set(prev).add(targetId));
        try {
            await secureFetch('/api/follows/toggle', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', ...getAccountHeaders() },
                body: JSON.stringify({
                    target_id: targetId,
                    target_type: targetType,
                    action: 'follow',
                }),
            });
        } catch {
            setFollowedBackIds((prev) => {
                const next = new Set(prev);
                next.delete(targetId);
                return next;
            });
        }
    };

    const handleNotifItemClick = async (item) => {
        const id = Number(item?.id);

        // Mark as read immediately so the badge/highlight clears even if navigation is fast.
        // For GROUPED notifications, mark ALL underlying IDs as read — not just the
        // representative — otherwise the same group keeps reappearing as unread.
        const allIds = Array.isArray(item?.groupedIds) && item.groupedIds.length > 0
            ? item.groupedIds.map(Number).filter((n) => Number.isFinite(n) && n > 0)
            : (Number.isFinite(id) && id > 0 ? [id] : []);

        if (allIds.length > 0) {
            // Use batch endpoint for grouped notifications (single request instead of N)
            if (allIds.length > 1) {
                await markNotificationsReadBatch(allIds);
            } else {
                await markNotificationRead(allIds[0]);
            }
            const idSet = new Set(allIds);
            setNotifItems((prev) => prev.map((x) => (idSet.has(x.id) ? { ...x, is_read: true } : x)));
            setHighlightNotifIds((prev) => (prev || []).filter((x) => !idSet.has(x)));
            await fetchUnreadCount();
        }

        const safeJsonParse = (v) => {
            if (!v) return null;
            if (typeof v === 'object') return v;
            const s = String(v);
            try {
                return JSON.parse(s);
            } catch {
                return null;
            }
        };

        const getMyProfilePath = () => {
            const handle = String(u?.handle || u?.username || '').trim().replace(/^@+/, '');
            if (handle) return `/${handle}`;
            return '/account';
        };

        const type = String(item?.type || '').trim();
        const entityType = String(item?.entity_type || item?.entityType || '').trim();
        const entityId = Number(item?.entity_id ?? item?.entityId ?? item?.post_id ?? item?.postId ?? 0);
        const subId = Number(item?.sub_entity_id ?? item?.subEntityId ?? item?.comment_id ?? item?.commentId ?? 0);
        const data = safeJsonParse(item?.data || item?.metadata || item?.extra) || {};
        const dataCommentId = Number(data?.commentId ?? data?.comment_id ?? 0);

        const postId = Number.isFinite(entityId) && entityId > 0 ? entityId : 0;
        const commentId = (Number.isFinite(dataCommentId) && dataCommentId > 0 ? dataCommentId : 0) || (Number.isFinite(subId) && subId > 0 ? subId : 0) || 0;
        const dataPostId = Number(data?.postId ?? data?.post_id ?? 0);

        // Unique timestamp so React Router always treats this as a fresh navigation,
        // even if the destination path is the same as the current one.
        const navTs = Date.now();

        // Helper: navigate then close popover on the next frame.
        // We navigate FIRST so the route change is queued before any
        // re-render from closing the popover can interfere.
        const navThen = (path, state) => {
            navigate(path, { state: { ...state, _ts: navTs } });
            requestAnimationFrame(() => {
                setNotifAnchorEl(null);
                setHighlightNotifIds(EMPTY_HIGHLIGHT_NOTIF_IDS);
            });
        };

        // Post -> Post detail
        const isPostComment = type === 'post_comment' || type === 'comment_reply' || type === 'comment_like';
        const isGrouped = Number(item?.othersCount || 0) > 0;

        // Slice 2d: news-article comments
        //
        // Replies/likes on news-article comments come through with
        // entityType='news_article' and data.isNewsArticle=true (see news.js
        // POST /article/:id/comments and community.js comment_like). Route
        // them to /news/article/:id and seed the panel so the page paints
        // instantly and RedditComments scrolls to the target comment.
        const isNewsArticleComment =
            isPostComment && (entityType === 'news_article' || data?.isNewsArticle === true);
        if (isNewsArticleComment) {
            const newsArticleId = Number(
                data?.articleId ?? data?.article_id ?? data?.postId ?? data?.post_id ?? entityId ?? 0
            );
            const newsCommentId = (type === 'comment_like' && entityType === 'news_article')
                ? (Number(data?.commentId ?? data?.comment_id ?? commentId ?? 0) || Number(entityId) || 0)
                : (Number(commentId) || 0);

            if (Number.isFinite(newsArticleId) && newsArticleId > 0) {
                navThen(`/news/article/${newsArticleId}`, {
                    article: {
                        id: newsArticleId,
                        title: data?.articleTitle || data?.article_title || '',
                        source_name: data?.articleSourceName || data?.article_source_name || '',
                        image_url: data?.articleImageUrl || data?.article_image_url || '',
                        url: data?.articleUrl || data?.article_url || '',
                    },
                    scrollToCommentId: newsCommentId && !isGrouped ? newsCommentId : undefined,
                    highlightCommentId: newsCommentId && !isGrouped ? newsCommentId : undefined,
                    fromNotifications: true,
                    notifId: Number.isFinite(id) ? id : undefined,
                    notifType: type,
                });
                return;
            }
        }

        // For comment_like, entityId may be the comment ID (when entityType='post_comment').
        // Use data.postId as the real post ID in that case.
        const resolvedPostId = (entityType === 'post_comment' && dataPostId > 0)
            ? dataPostId
            : (type === 'comment_like' && dataPostId > 0) ? dataPostId : postId;
        const resolvedCommentId = (entityType === 'post_comment' && type === 'comment_like')
            ? entityId : commentId;

        // NOTE: comment_reply and comment_like are generic types used across posts AND events.
        // Only route them to the post page when entityType is NOT 'event'.
        const isEventEntity = entityType === 'event';
        const isGenericCommentOnEvent = isEventEntity && (type === 'comment_reply' || type === 'comment_like');

        if (!isGenericCommentOnEvent && (entityType === 'community_post' || entityType === 'business_post' || entityType === 'artist_post' || entityType === 'post_comment' || (type.startsWith('post_') && type !== 'post_share') || (type.startsWith('comment_') && !type.endsWith('_share')) || type === 'poll_ended') && resolvedPostId > 0) {
            // Business or artist post: navigate to /:slug/posts/:id when slug is available
            const bizSlug = data?.businessSlug || data?.business_slug || data?.pageSlug || data?.page_slug || '';
            const artSlug = data?.artistSlug || data?.artist_slug || data?.artistHandle || data?.artist_handle || '';
            const isBizPost = entityType === 'business_post' || (bizSlug && !entityType?.includes('community') && !entityType?.includes('artist'));
            const isArtPost = entityType === 'artist_post' || (artSlug && !entityType?.includes('community') && !entityType?.includes('business'));
            const basePath = isBizPost && bizSlug ? `/${bizSlug}/posts/${resolvedPostId}`
                : isArtPost && artSlug ? `/${artSlug}/posts/${resolvedPostId}`
                    : `/posts/${resolvedPostId}`;
            console.log(`[Header notif click] type=${type} entityType=${entityType} bizSlug=${bizSlug} artSlug=${artSlug} path=${basePath} postId=${resolvedPostId}`);
            navThen(basePath, {
                scrollToCommentId: isPostComment && resolvedCommentId && !isGrouped ? resolvedCommentId : undefined,
                highlightCommentId: isPostComment && resolvedCommentId && !isGrouped ? resolvedCommentId : undefined,
                scrollToComments: isPostComment && isGrouped ? true : undefined,
                fromNotifications: true,
                notifId: Number.isFinite(id) ? id : undefined,
                notifType: type,
            });
            return;
        }

        // Follow — single: go to follower's profile; grouped: go to social page
        if (type === 'new_follower') {
            const isFollowGrouped = Number(item?.othersCount || 0) > 0;
            if (isFollowGrouped) {
                navThen('/social', {
                    fromNotifications: true,
                    notifId: Number.isFinite(id) ? id : undefined,
                    notifType: type,
                    socialTab: 'followers',
                    sortFollowersBy: 'recent',
                });
                return;
            }
            const handle = String(data?.actorAccountHandle || data?.actorHandle || data?.actor_handle || item?.actor_handle || '').trim();
            const actorId = Number(data?.followerId || data?.followerUserId || item?.actor_id || item?.actor_user_id || 0);
            if (handle) {
                navThen(`/${handle}`, { fromNotifications: true, notifId: Number.isFinite(id) ? id : undefined, notifType: type });
                return;
            }
            if (Number.isFinite(actorId) && actorId > 0) {
                navThen(`/${actorId}`, { fromNotifications: true, notifId: Number.isFinite(id) ? id : undefined, notifType: type });
                return;
            }
        }

        // Follow request — navigate to social page with Requests tab selected
        if (type === 'follow_request') {
            navThen('/social', { fromNotifications: true, notifId: Number.isFinite(id) ? id : undefined, notifType: type, socialTab: 'requests' });
            return;
        }

        // Follow request accepted — go to the profile of the person who accepted
        if (type === 'follow_request_accepted') {
            const handle = String(data?.actorAccountHandle || data?.actorHandle || data?.actor_handle || item?.actor_handle || '').trim();
            const actorId = Number(data?.acceptedByUserId || item?.actor_id || item?.actor_user_id || 0);
            if (handle) {
                navThen(`/${handle}`, { fromNotifications: true, notifId: Number.isFinite(id) ? id : undefined, notifType: type });
                return;
            }
            if (Number.isFinite(actorId) && actorId > 0) {
                navThen(`/${actorId}`, { fromNotifications: true, notifId: Number.isFinite(id) ? id : undefined, notifType: type });
                return;
            }
        }

        // Service photo comments/likes → navigate to service detail page with photo dialog
        const isServicePhoto = type === 'service_photo_comment' || type === 'service_photo_comment_like' || type === 'service_photo_like';
        if (isServicePhoto) {
            const svcId = Number(data?.serviceId ?? data?.service_id ?? 0);
            if (Number.isFinite(svcId) && svcId > 0) {
                const svcPhotoKind = String(data?.photoType ?? data?.photo_type ?? 'avatar').toLowerCase();
                navThen(`/services`, {
                    fromNotifications: true,
                    notifId: Number.isFinite(id) ? id : undefined,
                    notifType: type,
                    openServiceId: svcId,
                    llOpenPhotoComments: true,
                    llPhotoCommentId: commentId || undefined,
                    llPhotoType: svcPhotoKind === 'gallery' ? 'gallery' : svcPhotoKind === 'cover' ? 'cover' : 'avatar',
                    ...(svcPhotoKind === 'gallery' ? {
                        llPhotoId: Number(data?.photoId ?? data?.photo_id ?? 0) || undefined,
                        llPhotoUrl: data?.photoUrl ?? data?.photo_url ?? undefined,
                    } : {}),
                });
                return;
            }
        }

        // Profile photo -> open avatar viewer/comments on the correct profile
        const isPhoto = type === 'photo_comment' || type === 'photo_comment_like' || type === 'photo_like';
        if (isPhoto) {
            const photoArtistId = Number(data?.artistId ?? data?.artist_id ?? 0);
            const photoBizId = Number(data?.businessId ?? data?.business_id ?? 0);
            const rawPhotoKind = String(data?.photoKind ?? data?.photo_kind ?? 'avatar').toLowerCase();
            const photoCommonState = {
                fromNotifications: true,
                notifId: Number.isFinite(id) ? id : undefined,
                notifType: type,
            };

            if (photoArtistId > 0) {
                // Artist photo → navigate to artist profile page (/{handle})
                const artHandle = String(data?.artistHandle ?? data?.artistSlug ?? data?.artist_handle ?? data?.artist_slug ?? '').trim();
                if (artHandle) {
                    navThen(`/${artHandle}`, {
                        ...photoCommonState,
                        llOpenPhotoComments: true,
                        llPhotoCommentId: commentId || undefined,
                        llPhotoType: rawPhotoKind === 'gallery' ? 'gallery' : rawPhotoKind === 'cover' ? 'cover' : 'avatar',
                        ...(rawPhotoKind === 'gallery' ? {
                            llPhotoId: Number(data?.photoId ?? data?.photo_id ?? 0) || undefined,
                            llPhotoUrl: data?.photoUrl ?? data?.photo_url ?? undefined,
                        } : {}),
                    });
                    return;
                }
            }

            if (photoBizId > 0) {
                // Business photo → navigate to business page with proper state for highlighting
                const bizSlug = String(data?.businessSlug ?? data?.business_slug ?? data?.slug ?? '').trim();
                const bizPath = bizSlug ? `/${bizSlug}` : `/business/${photoBizId}`;
                navThen(bizPath, {
                    ...photoCommonState,
                    llOpenPhotoComments: true,
                    llPhotoCommentId: commentId || undefined,
                    llPhotoType: rawPhotoKind === 'gallery' ? 'gallery' : rawPhotoKind === 'cover' ? 'cover' : 'avatar',
                    ...(rawPhotoKind === 'gallery' ? {
                        llPhotoId: Number(data?.photoId ?? data?.photo_id ?? 0) || undefined,
                        llPhotoUrl: data?.photoUrl ?? data?.photo_url ?? undefined,
                    } : {}),
                });
                return;
            }

            // Personal photo → navigate to own profile with photo type
            navThen(getMyProfilePath(), {
                ...photoCommonState,
                llOpenAvatarComments: true,
                llAvatarCommentId: commentId || undefined,
                llPhotoType: rawPhotoKind === 'gallery' ? 'gallery' : rawPhotoKind === 'cover' ? 'cover' : 'avatar',
                ...(rawPhotoKind === 'gallery' ? {
                    llPhotoId: Number(data?.photoId ?? data?.photo_id ?? 0) || undefined,
                    llPhotoUrl: data?.photoUrl ?? data?.photo_url ?? undefined,
                } : {}),
            });
            return;
        }

        // Events — RSVP, interested, like, repost, comment, engagement
        const isEventType = entityType === 'event' || type.startsWith('event_');

        // Business reviews → navigate to business page with reviews tab + highlight
        if (type === 'business_review' || type === 'business_review_helpful' || type === 'business_review_reply') {
            // Try every known field the backend might use for the business slug.
            const bizSlug = data?.businessSlug || data?.business_slug || data?.pageSlug || data?.page_slug
                || data?.slug || data?.handle
                || item?.business_slug || item?.businessSlug || item?.page_slug || item?.pageSlug || '';
            // Review ID: data.reviewId, sub_entity_id, or entity_id (when entity is the review itself).
            const reviewId = Number(data?.reviewId ?? data?.review_id ?? subId ?? entityId ?? 0);
            // Business ID: data.businessId, entity_id (when entity is the business), or fall back.
            const bizIdFromData = Number(data?.businessId ?? data?.business_id ?? data?.business ?? 0);
            const bizId = bizIdFromData > 0 ? bizIdFromData
                : (subId > 0 && Number.isFinite(entityId) && entityId > 0) ? entityId
                    : Number(item?.business_id ?? entityId ?? 0);
            const reviewState = {
                fromNotifications: true,
                notifId: Number.isFinite(id) ? id : undefined,
                notifType: type,
                scrollToReviews: true,
                highlightReviewId: reviewId > 0 ? reviewId : undefined,
            };
            if (bizSlug) { navThen(`/${bizSlug}`, reviewState); return; }
            // No slug available — resolve it from the business API using the numeric ID.
            if (Number.isFinite(bizId) && bizId > 0) {
                try {
                    const res = await secureFetch(`/api/business/${bizId}`, { credentials: 'include' });
                    if (res.ok) {
                        const biz = await res.json();
                        const resolvedSlug = biz?.slug || biz?.handle || biz?.business?.slug || biz?.business?.handle || '';
                        if (resolvedSlug) { navThen(`/${resolvedSlug}`, reviewState); return; }
                    }
                } catch { /* ignore – fall through */ }
                navThen(`/${bizId}`, reviewState);
                return;
            }
        }

        if (isEventType) {
            const eventIdFromData = Number(data?.eventId ?? data?.event_id ?? entityId ?? 0);
            if (Number.isFinite(eventIdFromData) && eventIdFromData > 0) {
                const isEventComment = type === 'event_comment' || (type === 'comment_reply' && entityType === 'event') || (type === 'comment_like' && entityType === 'event');
                const eventCommentId = isEventComment ? Number(data?.commentId ?? data?.comment_id ?? 0) : 0;
                navThen(`/events/${eventIdFromData}`, {
                    fromNotifications: true,
                    notifId: Number.isFinite(id) ? id : undefined,
                    notifType: type,
                    scrollToCommentId: eventCommentId || undefined,
                    highlightCommentId: eventCommentId || undefined,
                });
                return;
            }
        }

        // Groups — invite, join, join request
        if (type === 'group_invite' || type === 'group_join' || type === 'group_request_approved') {
            const groupSlug = data?.groupSlug || data?.group_slug || '';
            const groupIdFromData = Number(data?.groupId ?? data?.group_id ?? entityId ?? 0);
            if (groupSlug) {
                navThen(`/${groupSlug}`, {
                    fromNotifications: true,
                    notifId: Number.isFinite(id) ? id : undefined,
                    notifType: type,
                });
                return;
            }
            if (Number.isFinite(groupIdFromData) && groupIdFromData > 0) {
                navThen(`/groups/${groupIdFromData}`, {
                    fromNotifications: true,
                    notifId: Number.isFinite(id) ? id : undefined,
                    notifType: type,
                });
                return;
            }
        }
        if (type === 'group_ban' || type === 'group_timeout') {
            const groupSlug = data?.groupSlug || data?.group_slug || '';
            const groupIdFromData = Number(data?.groupId ?? data?.group_id ?? entityId ?? 0);
            if (groupSlug) {
                navThen(`/${groupSlug}`, {
                    fromNotifications: true,
                    notifId: Number.isFinite(id) ? id : undefined,
                    notifType: type,
                });
                return;
            }
            if (Number.isFinite(groupIdFromData) && groupIdFromData > 0) {
                navThen(`/groups/${groupIdFromData}`, {
                    fromNotifications: true,
                    notifId: Number.isFinite(id) ? id : undefined,
                    notifType: type,
                });
                return;
            }
        }
        if (type === 'group_join_request') {
            const groupSlug = data?.groupSlug || data?.group_slug || '';
            const groupIdFromData = Number(data?.groupId ?? data?.group_id ?? entityId ?? 0);
            if (groupSlug) {
                navThen(`/${groupSlug}/admin`, {
                    fromNotifications: true,
                    notifId: Number.isFinite(id) ? id : undefined,
                    notifType: type,
                    adminTab: 'members',
                });
                return;
            }
            if (Number.isFinite(groupIdFromData) && groupIdFromData > 0) {
                navThen(`/groups/${groupIdFromData}/admin`, {
                    fromNotifications: true,
                    notifId: Number.isFinite(id) ? id : undefined,
                    notifType: type,
                    adminTab: 'members',
                });
                return;
            }
        }

        // Shares — route based on share type
        // Slice 4c: widened the gate to also catch *_share_recipient types.
        // Previously this block only caught types ending in '_share', which
        // silently excluded listing_share_recipient, service_request_share_recipient,
        // and news_article_share_recipient — meaning clicks on those notifications
        // fell through to the generic default. The more specific suffix
        // '_share_recipient' ensures we only catch intentional share-recipient
        // types (not arbitrary future '_recipient' types unrelated to sharing).
        if (type.endsWith('_share') || type.endsWith('_share_recipient') || type === 'service_request_shared') {
            const shareDeepLink = String(data?.deepLink ?? data?.deep_link ?? '');
            const sharePostId = Number(data?.postId ?? data?.post_id ?? entityId ?? 0);

            if (type === 'comment_share' || (type === 'post_share' && String(data?.postType ?? data?.post_type ?? '').toLowerCase() === 'comment')) {
                const shareCommentId = Number(data?.commentId ?? data?.comment_id ?? 0);
                let navPostId = Number(data?.realPostId ?? data?.real_post_id ?? 0);
                let navCommentId = shareCommentId;
                const shareEntityType = String(data?.entityType ?? data?.entity_type ?? '').toLowerCase();
                const shareBizSlug = data?.businessSlug || data?.business_slug || data?.pageSlug || data?.page_slug || '';
                const shareArtSlug = data?.artistSlug || data?.artist_slug || data?.artistHandle || data?.artist_handle || '';
                const shareEventId = Number(data?.eventId ?? data?.event_id ?? 0);

                // Slice 2d: sniff the deep link for /news/article/:id in
                // addition to /posts and /events — this is the most reliable
                // signal that a shared comment belongs to a news article when
                // the share-notification backend doesn't tag the data shape
                // explicitly.
                let deepLinkNewsArticleId = 0;

                if (shareDeepLink) {
                    try {
                        const url = new URL(shareDeepLink, window.location.origin);
                        const postsMatch = url.pathname.match(/\/posts\/(\d+)/);
                        const eventsMatch = url.pathname.match(/\/events\/(\d+)/);
                        const newsMatch = url.pathname.match(/\/news\/article\/(\d+)/);
                        if (postsMatch) navPostId = navPostId || Number(postsMatch[1]);
                        if (eventsMatch && !navPostId) navPostId = Number(eventsMatch[1]);
                        if (newsMatch) deepLinkNewsArticleId = Number(newsMatch[1]) || 0;
                        const qComment = url.searchParams.get('comment');
                        if (qComment) navCommentId = Number(qComment) || navCommentId;
                    } catch { /* ignore */ }
                }

                if ((!navPostId || navPostId <= 0) && Number.isFinite(sharePostId) && sharePostId > 0) {
                    navPostId = sharePostId;
                }

                const commentNavState = {
                    scrollToCommentId: navCommentId || undefined,
                    highlightCommentId: navCommentId || undefined,
                    fromNotifications: true,
                    notifId: Number.isFinite(id) ? id : undefined,
                    notifType: type,
                };

                // Slice 2d: news-article comment share — route to
                // /news/article/:id with seed + scroll/highlight state. We
                // accept a deep-link match as sufficient signal here
                // (backends that don't tag data.isNewsArticle still produce
                // a /news/article/:id permalink when the share originated
                // from the news panel's ShareDialog).
                const isNewsArticleShare =
                    data?.isNewsArticle === true ||
                    shareEntityType === 'news_article' ||
                    shareEntityType === 'news' ||
                    deepLinkNewsArticleId > 0;
                if (isNewsArticleShare) {
                    const shareArticleId = Number(
                        data?.articleId ?? data?.article_id ?? deepLinkNewsArticleId ?? navPostId ?? sharePostId ?? 0
                    );
                    if (Number.isFinite(shareArticleId) && shareArticleId > 0) {
                        navThen(`/news/article/${shareArticleId}`, {
                            ...commentNavState,
                            article: {
                                id: shareArticleId,
                                title: data?.articleTitle || data?.article_title || '',
                                source_name: data?.articleSourceName || data?.article_source_name || '',
                                image_url: data?.articleImageUrl || data?.article_image_url || '',
                                url: data?.articleUrl || data?.article_url || '',
                            },
                        });
                        return;
                    }
                }

                if (Number.isFinite(navPostId) && navPostId > 0) {
                    if (shareEntityType === 'event' || shareEntityType.includes('event') || shareEventId > 0) {
                        navThen(`/events/${shareEventId || navPostId}`, commentNavState);
                        return;
                    }
                    if (shareEntityType === 'business_post' || shareEntityType === 'business' || shareBizSlug) {
                        navThen(shareBizSlug ? `/${shareBizSlug}/posts/${navPostId}` : `/posts/${navPostId}`, commentNavState);
                        return;
                    }
                    if (shareEntityType === 'artist_post' || shareEntityType === 'artist' || shareArtSlug) {
                        navThen(shareArtSlug ? `/${shareArtSlug}/posts/${navPostId}` : `/posts/${navPostId}`, commentNavState);
                        return;
                    }
                    navThen(`/posts/${navPostId}`, commentNavState);
                    return;
                }

                if (shareDeepLink) {
                    try {
                        const url = new URL(shareDeepLink, window.location.origin);
                        navThen(url.pathname + url.search, commentNavState);
                    } catch {
                        navThen(shareDeepLink, commentNavState);
                    }
                    return;
                }
            }

            if (type === 'post_share' && Number.isFinite(sharePostId) && sharePostId > 0) {
                const sharePostTypeClick = String(data?.postType ?? data?.post_type ?? '').toLowerCase();
                // Comment shares already handled above — skip here
                if (sharePostTypeClick === 'comment') {
                    // Fallthrough handled above
                }
                // Service request shares → type='post_share' with postType='service_request'
                else if (sharePostTypeClick === 'service_request') {
                    navThen(`/services/requests/${sharePostId}`, { fromNotifications: true, notifId: id, notifType: type });
                    return;
                }
                // Service shares routed through generic /api/shares → type='post_share' with postType='service'
                else if (sharePostTypeClick === 'service') {
                    navThen(`/services`, { fromNotifications: true, notifId: id, notifType: type, openServiceId: sharePostId });
                    return;
                }
                // Marketplace listing shares → type='post_share' with postType='listing'
                else if (sharePostTypeClick === 'listing') {
                    navThen(`/marketplace/${sharePostId}`, { fromNotifications: true, notifId: id, notifType: type });
                    return;
                }
                // Business profile shares → type='post_share' with postType='business'
                else if (sharePostTypeClick === 'business') {
                    const bizSlug = data?.businessSlug || data?.business_slug || '';
                    if (bizSlug) {
                        navThen(`/${bizSlug}`, { fromNotifications: true, notifId: id, notifType: type });
                        return;
                    }
                    // Fallback: try deep link
                    const dl = String(data?.deepLink ?? data?.deep_link ?? '').trim();
                    if (dl) {
                        try { const u = new URL(dl, window.location.origin); navThen(u.pathname, { fromNotifications: true, notifId: id, notifType: type }); return; } catch {}
                    }
                }
                // Artist profile shares → type='post_share' with postType='artist'
                else if (sharePostTypeClick === 'artist') {
                    const artHandle = data?.artistHandle || data?.artist_handle || '';
                    if (artHandle) {
                        navThen(`/${artHandle}`, { fromNotifications: true, notifId: id, notifType: type });
                        return;
                    }
                    const dl = String(data?.deepLink ?? data?.deep_link ?? '').trim();
                    if (dl) {
                        try { const u = new URL(dl, window.location.origin); navThen(u.pathname, { fromNotifications: true, notifId: id, notifType: type }); return; } catch {}
                    }
                }
                else {
                    const shareBizSlug = data?.businessSlug || data?.business_slug || data?.pageSlug || '';
                    const shareEntityType = String(item?.entity_type || '').trim();
                    const shareIsBiz = shareEntityType === 'business_post' || Boolean(shareBizSlug);
                    const sharePath = shareIsBiz && shareBizSlug ? `/${shareBizSlug}/posts/${sharePostId}` : `/posts/${sharePostId}`;
                    navThen(sharePath, { fromNotifications: true, notifId: id, notifType: type });
                    return;
                }
            }
            if (type === 'event_share' && Number.isFinite(sharePostId) && sharePostId > 0) {
                navThen(`/events/${sharePostId}`, { fromNotifications: true, notifId: id, notifType: type });
                return;
            }
            if (type === 'job_share' && Number.isFinite(sharePostId) && sharePostId > 0) {
                navThen(`/jobs/${sharePostId}`, { fromNotifications: true, notifId: id, notifType: type });
                return;
            }
            if (type === 'group_share') {
                const gSlug = data?.groupSlug || data?.group_slug || '';
                if (gSlug) {
                    navThen(`/${gSlug}`, { fromNotifications: true, notifId: id, notifType: type });
                    return;
                }
                if (Number.isFinite(sharePostId) && sharePostId > 0) {
                    navThen(`/groups/${sharePostId}`, { fromNotifications: true, notifId: id, notifType: type });
                    return;
                }
            }
            if (type === 'listing_share' && Number.isFinite(sharePostId) && sharePostId > 0) {
                navThen(`/marketplace/${sharePostId}`, { fromNotifications: true, notifId: id, notifType: type });
                return;
            }
            if (type === 'listing_share_recipient') {
                const lId = Number(data?.listingId ?? data?.listing_id ?? sharePostId ?? 0);
                if (Number.isFinite(lId) && lId > 0) {
                    navThen(`/marketplace/${lId}`, { fromNotifications: true, notifId: id, notifType: type });
                    return;
                }
            }
            if (type === 'service_request_shared' || type === 'service_request_share_recipient') {
                const rId = Number(data?.requestId ?? data?.request_id ?? entityId ?? 0);
                if (Number.isFinite(rId) && rId > 0) {
                    navThen(`/services/requests/${rId}`, { fromNotifications: true, notifId: id, notifType: type });
                    return;
                }
            }
            // Slice 4c: News article share — route to the full-page news route
            // (/news/article/:id — added in Slice 3). Article ID lives in
            // data.articleId primarily, with several fallbacks because older
            // notifications may use slightly different field names.
            if (type === 'news_article_share' || type === 'news_article_share_recipient') {
                const aId = Number(
                    data?.articleId ?? data?.article_id ??
                    data?.postId ?? data?.post_id ??
                    entityId ?? sharePostId ?? 0
                );
                if (Number.isFinite(aId) && aId > 0) {
                    navThen(`/news/article/${aId}`, { fromNotifications: true, notifId: id, notifType: type });
                    return;
                }
            }
            if (type === 'business_share') {
                const bizSlug = data?.businessSlug || data?.business_slug || data?.sharerAccountSlug || data?.sharer_account_slug || '';
                if (bizSlug) {
                    navThen(`/${bizSlug}`, { fromNotifications: true, notifId: id, notifType: type });
                    return;
                }
                const dl = String(data?.deepLink ?? data?.deep_link ?? '').trim();
                if (dl) {
                    try { const u = new URL(dl, window.location.origin); navThen(u.pathname, { fromNotifications: true, notifId: id, notifType: type }); return; } catch {}
                }
            }
            if (type === 'artist_share') {
                const artHandle = data?.artistHandle || data?.artist_handle || data?.sharerAccountSlug || data?.sharer_account_slug || '';
                if (artHandle) {
                    navThen(`/${artHandle}`, { fromNotifications: true, notifId: id, notifType: type });
                    return;
                }
                const dl = String(data?.deepLink ?? data?.deep_link ?? '').trim();
                if (dl) {
                    try { const u = new URL(dl, window.location.origin); navThen(u.pathname, { fromNotifications: true, notifId: id, notifType: type }); return; } catch {}
                }
            }
            // Profile share — navigate to the shared profile
            if (type === 'profile_share' || (type === 'post_share' && String(data?.postType ?? data?.post_type ?? '').toLowerCase() === 'profile')) {
                const profHandle = data?.profileHandle || data?.profile_handle || '';
                const profId = Number(data?.profileId ?? data?.profile_id ?? sharePostId ?? 0);
                if (profHandle) {
                    navThen(`/${profHandle}`, { fromNotifications: true, notifId: id, notifType: type });
                    return;
                }
                if (Number.isFinite(profId) && profId > 0) {
                    navThen(`/${profId}`, { fromNotifications: true, notifId: id, notifType: type });
                    return;
                }
            }

            // Generic deep link fallback
            if (shareDeepLink) {
                try {
                    const url = new URL(shareDeepLink, window.location.origin);
                    navThen(url.pathname + url.search, { fromNotifications: true, notifId: id, notifType: type });
                } catch {
                    navThen(shareDeepLink, { fromNotifications: true, notifId: id, notifType: type });
                }
                return;
            }
        }

        // Jobs — application, saved
        const isJobType = entityType === 'job' || type === 'job_application' || type === 'job_saved';
        if (isJobType) {
            const jId = Number(data?.jobId ?? data?.job_id ?? entityId ?? 0);
            if (Number.isFinite(jId) && jId > 0) {
                const jobState = { fromNotifications: true, notifId: Number.isFinite(id) ? id : undefined, notifType: type };

                if (type === 'job_application') {
                    jobState.detailTab = 'applications';
                    const groupedCount = Number(item?.groupedCount || 1);
                    if (groupedCount <= 1) {
                        const applicantId = Number(data?.applicantId ?? data?.applicant_id ?? item?.actor_id ?? item?.actor_user_id ?? 0);
                        if (Number.isFinite(applicantId) && applicantId > 0) {
                            jobState.highlightApplicationUserId = applicantId;
                        }
                    }
                }

                navThen(`/jobs/${jId}`, jobState);
                return;
            }
        }

        // Service Requests — response, accepted, declined navigate to request detail page
        const isServiceRequestType =
            type === 'service_request_response' || type === 'service_response_accepted' ||
            type === 'service_response_declined' ||
            type === 'service_request_shared' || type === 'service_request_share_recipient';
        if (isServiceRequestType) {
            const rId = Number(data?.requestId ?? data?.request_id ?? entityId ?? 0);
            if (Number.isFinite(rId) && rId > 0) {
                const responseNavState = { fromNotifications: true, notifId: Number.isFinite(id) ? id : undefined, notifType: type };
                // Open the responses tab and highlight the specific response
                if (type === 'service_request_response') {
                    responseNavState.openResponsesTab = true;
                    const respId = Number(data?.responseId ?? data?.response_id ?? 0);
                    if (Number.isFinite(respId) && respId > 0) {
                        responseNavState.highlightResponseId = respId;
                    }
                }
                navThen(`/services/requests/${rId}`, responseNavState);
                return;
            }
        }

        // Services (listings) — review, favorited, quote request
        const isServiceType = entityType === 'service' ||
            type === 'service_review' || type === 'service_review_response' ||
            type === 'service_quote_request' ||
            type === 'service_favorited';
        if (isServiceType) {
            const sId = Number(data?.listingId ?? data?.listing_id ?? data?.serviceId ?? data?.service_id ?? entityId ?? 0);
            if (Number.isFinite(sId) && sId > 0) {
                // For review-related notifications, open the reviews tab and scroll to the specific review
                const isReviewType = type === 'service_review' || type === 'service_review_response';
                const reviewId = Number(data?.reviewId ?? data?.review_id ?? subId ?? 0);
                const svcState = isReviewType
                    ? {
                        fromNotifications: true,
                        notifId: Number.isFinite(id) ? id : undefined,
                        notifType: type,
                        openServiceId: sId,
                        scrollToReviews: true,
                        highlightReviewId: Number.isFinite(reviewId) && reviewId > 0 ? reviewId : undefined,
                    }
                    : { fromNotifications: true, notifId: Number.isFinite(id) ? id : undefined, notifType: type, openServiceId: sId };
                navThen(`/services`, svcState);
                return;
            }
        }

        // Marketplace: Seller Reviews
        if (type === 'seller_review' || type === 'seller_review_reply') {
            const reviewId = Number(data?.reviewId ?? data?.review_id ?? 0);
            const sellerHandle = String(data?.sellerHandle ?? data?.seller_handle ?? '').trim();
            const sellerIdFromData = Number(data?.sellerId ?? data?.seller_id ?? 0);

            if (type === 'seller_review') {
                // seller_review: I'm the seller — go to my own profile's seller info tab
                const profilePath = sellerHandle ? `/${sellerHandle}` : getMyProfilePath();
                navThen(profilePath, {
                    fromNotifications: true,
                    notifId: Number.isFinite(id) ? id : undefined,
                    notifType: type,
                    rightRailView: 'marketplace',
                    marketplaceSubTab: 'seller_info',
                    highlightSellerReviewId: Number.isFinite(reviewId) && reviewId > 0 ? reviewId : undefined,
                });
                return;
            }

            // seller_review_reply: I'm the reviewer — the seller's profile may be private,
            // so open the seller reviews popup in-place instead of navigating.
            const sellerId = Number.isFinite(sellerIdFromData) && sellerIdFromData > 0 ? sellerIdFromData : null;
            if (sellerId) {
                setSellerReviewsPopup({
                    open: true,
                    sellerId,
                    highlightReviewId: Number.isFinite(reviewId) && reviewId > 0 ? reviewId : null,
                });
                return;
            }
        }

        // Marketplace — favorite, repost, share, message, sold
        const isMarketplaceType = entityType === 'marketplace_listing' ||
            type === 'listing_favorite' || type === 'listing_repost' ||
            type === 'listing_message' || type === 'listing_mention' ||
            type === 'listing_sold' ||
            type === 'listing_share' || type === 'listing_share_recipient';
        if (isMarketplaceType) {
            const lId = Number(data?.listingId ?? data?.listing_id ?? entityId ?? 0);
            if (Number.isFinite(lId) && lId > 0) {
                navThen(`/marketplace/${lId}`, { fromNotifications: true, notifId: Number.isFinite(id) ? id : undefined, notifType: type });
                return;
            }
        }

        // Account Approval → navigate to the approved profile
        if (type === 'business_approved') {
            const bizSlug = data?.businessSlug || data?.business_slug || '';
            if (bizSlug) {
                navThen(`/${bizSlug}`, { fromNotifications: true, notifId: Number.isFinite(id) ? id : undefined, notifType: type });
            } else {
                navThen('/', { fromNotifications: true });
            }
            return;
        }
        if (type === 'artist_approved') {
            const artHandle = data?.artistHandle || data?.artist_handle || '';
            if (artHandle) {
                navThen(`/${artHandle}`, { fromNotifications: true, notifId: Number.isFinite(id) ? id : undefined, notifType: type });
            } else {
                navThen('/', { fromNotifications: true });
            }
            return;
        }

        // Fallback
        navThen('/community', { fromNotifications: true });
    };

    // ── Unified badge polling (notifications + messages) ──
    // Fetches on: mount, route change, tab re-focus, account switch,
    // and as a safety-net every 2 min while the tab is visible.
    // Pauses entirely when the tab is hidden or the notif popover is open
    // (prevents race condition with read-all that causes ghost badges).
    useEffect(() => {
        let alive = true;
        let interval = null;
        const POLL_INTERVAL = 120_000; // 2 minutes

        if (!u?.id) {
            setUnreadCount(0);
            setUnreadMsgCount(0);
            return undefined;
        }

        const fetchNotifCount = async () => {
            try {
                const url = appendAccountParams(notifApiUrl('/api/notifications/unread-count'));
                const res = await secureFetch(url, { credentials: 'include', headers: notifFetchHeaders() });
                if (!res.ok || !alive) return;
                const json = await res.json();
                const next = Number(json?.count || 0);
                setUnreadCount(Number.isFinite(next) ? next : 0);
            } catch { /* ignore */ }
        };

        const fetchMsgCount = async () => {
            try {
                const url = appendAccountParams(notifApiUrl('/api/messages/unread-count'));
                const res = await secureFetch(url, { credentials: 'include', headers: notifFetchHeaders() });
                if (!res.ok || !alive) return;
                const json = await res.json();
                const next = Number(json?.count || 0);
                if (alive) setUnreadMsgCount(Number.isFinite(next) ? next : 0);
            } catch { /* ignore */ }
        };

        const sendHeartbeat = async () => {
            try {
                await secureFetch(notifApiUrl('/api/users/heartbeat'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: notifFetchHeaders(),
                });
            } catch { /* ignore — non-critical */ }
        };

        const runBoth = () => {
            if (!alive || document.hidden || notifOpen) return;
            fetchNotifCount();
            fetchMsgCount();
            sendHeartbeat();
        };

        const startPolling = () => {
            clearInterval(interval);
            runBoth(); // fetch immediately
            interval = setInterval(runBoth, POLL_INTERVAL);
        };

        const handleVisibility = () => {
            if (document.hidden) {
                clearInterval(interval);
            } else {
                // Tab became visible — fetch fresh counts and restart the timer
                startPolling();
            }
        };

        // Listen for instant notification refresh events (from other components)
        const handleRefresh = () => runBoth();

        // Reset badge immediately on account switch, then fetch fresh counts
        setUnreadCount(0);
        setUnreadMsgCount(0);
        setNotifItems([]);
        setAlreadyFollowingIds(new Set());

        startPolling();
        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('ll:notifications:refresh', handleRefresh);

        return () => {
            alive = false;
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('ll:notifications:refresh', handleRefresh);
        };
    }, [u?.id, activeAccountId, appendAccountParams, notifFetchHeaders, notifOpen]);

    // Re-fetch badge counts on route change (gives near-instant feedback
    // without polling — users see fresh counts whenever they navigate).
    useEffect(() => {
        if (!u?.id || notifOpen || document.hidden) return;
        const fetchCounts = async () => {
            try {
                const notifUrl = appendAccountParams(notifApiUrl('/api/notifications/unread-count'));
                const msgUrl = appendAccountParams(notifApiUrl('/api/messages/unread-count'));
                const [notifRes, msgRes] = await Promise.allSettled([
                    secureFetch(notifUrl, { credentials: 'include', headers: notifFetchHeaders() }),
                    secureFetch(msgUrl, { credentials: 'include', headers: notifFetchHeaders() }),
                ]);
                if (notifRes.status === 'fulfilled' && notifRes.value.ok) {
                    const json = await notifRes.value.json();
                    const next = Number(json?.count || 0);
                    setUnreadCount(Number.isFinite(next) ? next : 0);
                }
                if (msgRes.status === 'fulfilled' && msgRes.value.ok) {
                    const json = await msgRes.value.json();
                    const next = Number(json?.count || 0);
                    setUnreadMsgCount(Number.isFinite(next) ? next : 0);
                }
            } catch { /* ignore */ }
        };
        fetchCounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // Clear the messages badge when the user is viewing the messages page
    useEffect(() => {
        if (onMessagesRoute) setUnreadMsgCount(0);
    }, [onMessagesRoute]);

    // ── Contact Us: send message to @thelocallantern ──
    const handleContactUsSend = async () => {
        const trimmed = contactUsMsg.trim();
        if (!trimmed || contactUsSending) return;

        setContactUsSending(true);
        try {
            // 1. Resolve @thelocallantern → user ID via /api/users/resolve/:handle
            const resolveRes = await secureFetch('/api/users/resolve/thelocallantern', { credentials: 'include' });
            if (!resolveRes.ok) throw new Error('Could not reach The Local Lantern. Please try again later.');
            const resolved = await resolveRes.json();
            if (resolved.type !== 'user' || !resolved.id) {
                throw new Error('Could not reach The Local Lantern. Please try again later.');
            }

            // 2. Send the message
            const sendRes = await secureFetch('/api/messages/send', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient_type: 'personal',
                    recipient_id: resolved.id,
                    subject: 'Contact Us',
                    body: trimmed,
                }),
            });

            if (!sendRes.ok) {
                const err = await sendRes.json().catch(() => ({}));
                throw new Error(err.message || 'Failed to send message.');
            }

            setContactUsMsg('');
            setContactUsOpen(false);
            setContactUsSnackbar({ open: true, severity: 'success', message: 'Message sent! We\'ll get back to you soon.' });
        } catch (err) {
            setContactUsSnackbar({ open: true, severity: 'error', message: err.message || 'Something went wrong. Please try again.' });
        } finally {
            setContactUsSending(false);
        }
    };

    // Sign out by calling backend, clearing local state, then hard-redirecting home.
    // Uses window.location.href instead of navigate() + reload() to fully tear down
    // the SPA and avoid race conditions with the TOKEN_EXPIRED listener.
    const handleSignOut = async () => {
        // Prevent the TOKEN_EXPIRED listener from racing with intentional logout
        window.__loggingOut = true;
        try {
            const url = API_BASE ? `${API_BASE}/auth/logout` : '/auth/logout';
            await secureFetch(url, { method: 'POST', credentials: 'include' });
        } catch (err) {
            // Non-fatal: even if the request fails, proceed to clear UI state
            // eslint-disable-next-line no-console
            console.error('Logout error:', err);
        } finally {
            closeMenu();
            try { clearCachedMe(); } catch { /* ignore */ }
            try { localStorage.removeItem('ll:activeAccount'); } catch { /* ignore */ }
            // Hard redirect — fully tears down React, clears all in-memory state,
            // and guarantees a fresh page load on home.
            window.location.href = '/';
        }
    };

    return (
        <>
            {/* ── Account Switching Overlay ── */}
            {switchingToAccount && (
                <Box
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99999,
                        bgcolor: 'background.default',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2.5,
                        animation: 'llSwitchFadeIn 220ms ease-out both',
                        '@keyframes llSwitchFadeIn': {
                            '0%': { opacity: 0 },
                            '100%': { opacity: 1 },
                        },
                    }}
                >
                    {/* Profile picture with subtle pulse */}
                    <Box
                        sx={{
                            position: 'relative',
                            animation: 'llSwitchScaleIn 350ms cubic-bezier(.34,1.56,.64,1) both',
                            animationDelay: '80ms',
                            '@keyframes llSwitchScaleIn': {
                                '0%': { opacity: 0, transform: 'scale(0.7)' },
                                '100%': { opacity: 1, transform: 'scale(1)' },
                            },
                        }}
                    >
                        {(() => {
                            const rawAvatarUrl = switchingToAccount.avatar_url || switchingToAccount.logo_url || '';
                            const hasValidSwitchAvatar = (() => {
                                if (!rawAvatarUrl) return false;
                                const s = String(rawAvatarUrl).toLowerCase();
                                if (s.includes('default_avatar') || s.includes('default_business') || s.includes('default_logo')) return false;
                                if (s === String(defaultAvatar).toLowerCase()) return false;
                                return true;
                            })();
                            return (
                                <Avatar
                                    src={hasValidSwitchAvatar ? rawAvatarUrl : undefined}
                                    alt={switchingToAccount.name || ''}
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        fontSize: 32,
                                        fontWeight: 700,
                                        bgcolor: (t) => hasValidSwitchAvatar ? t.palette.primary.main : alpha(t.palette.primary.main, 0.10),
                                        color: (t) => hasValidSwitchAvatar ? '#fff' : t.palette.primary.main,
                                        border: '3px solid',
                                        borderColor: 'background.paper',
                                        boxShadow: (t) => `0 2px 12px ${alpha(t.palette.common.black, 0.10)}`,
                                    }}
                                >
                                    {switchingToAccount.type === 'business'
                                        ? <StorefrontOutlinedIcon sx={{ fontSize: 38 }} />
                                        : switchingToAccount.type === 'artist'
                                            ? (switchingToAccount.profileType === 'artist'
                                                ? <PaletteRoundedIcon sx={{ fontSize: 36 }} />
                                                : <MusicNoteRoundedIcon sx={{ fontSize: 36 }} />)
                                            : <PersonRoundedIcon sx={{ fontSize: 38 }} />}
                                </Avatar>
                            );
                        })()}
                        {/* Rotating ring */}
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: -5,
                                borderRadius: '50%',
                                border: '2px solid transparent',
                                borderTopColor: 'primary.main',
                                animation: 'llSwitchSpin 1s linear infinite',
                                '@keyframes llSwitchSpin': {
                                    '0%': { transform: 'rotate(0deg)' },
                                    '100%': { transform: 'rotate(360deg)' },
                                },
                            }}
                        />
                    </Box>

                    {/* "Switching to..." text */}
                    <Box
                        sx={{
                            textAlign: 'center',
                            animation: 'llSwitchTextIn 300ms ease-out both',
                            animationDelay: '150ms',
                            '@keyframes llSwitchTextIn': {
                                '0%': { opacity: 0, transform: 'translateY(8px)' },
                                '100%': { opacity: 1, transform: 'translateY(0)' },
                            },
                        }}
                    >
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: 700,
                                color: 'text.primary',
                                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                            }}
                        >
                            Switching to {switchingToAccount.name || 'account'}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                color: 'text.secondary',
                                mt: 0.5,
                                display: 'block',
                                fontSize: '0.8rem',
                            }}
                        >
                            {switchingToAccount.type === 'business'
                                ? 'Business'
                                : switchingToAccount.type === 'artist'
                                    ? 'Music'
                                    : 'Personal'}
                            {switchingToAccount.slug
                                ? ` · @${switchingToAccount.slug}`
                                : ''}
                        </Typography>
                    </Box>
                </Box>
            )}

            <GlobalStyles styles={{ html: { overflowY: 'scroll' }, body: { overflowY: 'scroll' } }} />
            <AppBar
                ref={appBarRef}
                position="fixed"
                elevation={0}
                color="default"
                sx={{                    // Keep AppBar layout stable (avoid 100vw which can include the scrollbar and cause horizontal shift)
                    width: '100%',
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    zIndex: (t) => t.zIndex.appBar + 1,
                    // Phone + tablet/laptop: FADE in/out continuously with scroll.
                    // Previously this used translateY to slide the bar up, but the
                    // layout reclaim/return cycle caused content below to jerk.
                    // Fading keeps the bar in its slot so content underneath never
                    // reflows — the frosted blur keeps content legible as it scrolls
                    // under the partially-visible bar. `--ll-nav-offset` (0..1) is
                    // updated every scroll frame; no CSS transition so it tracks the
                    // input in real time. When fully hidden we disable pointer events
                    // so taps fall through to content behind the (invisible) bar.
                    transition: isTabletOrBelow ? 'none' : 'opacity 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    opacity: isTabletOrBelow
                        ? 'calc(1 - var(--ll-nav-offset, 0))'
                        : 1,
                    pointerEvents: isTabletOrBelow
                        ? 'var(--ll-nav-pointer-events, auto)'
                        : 'auto',
                    transform: 'translateY(0)',
                    willChange: isTabletOrBelow ? 'opacity' : undefined,
                    // Frosted glass when the header may overlap scrolling content.
                    // Applied on phone + tablet (where scroll-hide is active) so posts
                    // reading under the partially-visible bar stay legible.
                    ...(isTabletOrBelow && {
                        backdropFilter: 'saturate(140%) blur(10px)',
                        WebkitBackdropFilter: 'saturate(140%) blur(10px)',
                    }),
                    // Phone-only: safe-area padding for notch / Dynamic Island.
                    ...(isMobile && {
                        pt: 'env(safe-area-inset-top, 0px)',
                    }),
                }}
            >
                <Toolbar
                    sx={{
                        minHeight: { xs: 52, sm: 72 },
                        px: { xs: 0.75, sm: 2 },
                        gap: { xs: 0.5, sm: 1.5 }
                    }}
                >
                    {/* LEFT group: logo + tabs (now left-aligned) */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: { xs: 0.5, sm: 2 },
                            minWidth: 0,
                            flexShrink: 1
                        }}
                    >
                        <Box
                            component="img"
                            src={logo}
                            alt="Local Lantern"
                            sx={{
                                height: { xs: 60, sm: 66, md: 72 },
                                width: 'auto',
                                cursor: 'pointer',
                                flexShrink: 0,
                                display: 'block',
                                filter: (t) => `drop-shadow(0px 1px 1px ${t.palette.action.disabledBackground})`,
                                transition: `transform 160ms ${UI_EASE}, filter 160ms ${UI_EASE}`,
                                '&:hover': {
                                    transform: 'scale(1.04)',
                                    filter: (t) => `drop-shadow(0px 2px 2px ${t.palette.action.disabledBackground})`
                                },
                                '&:active': {
                                    transform: 'scale(1.0)'
                                },
                            }}
                            onClick={() => {
                                onTabChange('');
                                navigate('/community');
                            }}
                        />

                        <Box
                            sx={{
                                minWidth: 0,
                                flex: '1 1 auto',
                                borderRadius: 999,
                                border: 'none',
                                bgcolor: 'transparent',
                                backgroundImage: 'none',
                                px: 0,
                                py: 0,
                                display: { xs: 'none', md: 'block' },
                                overflowX: { xs: 'auto', sm: 'visible' },
                                WebkitOverflowScrolling: 'touch',
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { display: 'none' },
                                transition: `transform 180ms ${UI_EASE}`,
                                '&:hover': { transform: 'none' },
                                '&:active': { transform: 'none' }
                            }}
                        >
                            <TabBar tabs={tabsForBar} activeTab={resolvedTab} onTabChange={handleTabChange} />
                        </Box>
                    </Box>

                    {/* Spacer pushes account actions to the far right */}
                    <Box sx={{ flexGrow: 1 }} />

                    {/* RIGHT group: account actions */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid',
                            borderColor: backendOffline ? (t) => alpha(t.palette.warning.main, 0.4) : 'divider',
                            borderRadius: 999,
                            px: { xs: 0.5, sm: 0.75 },
                            py: { xs: 0.35, sm: 0.5 },
                            gap: { xs: 0.5, sm: 0.75 },
                            bgcolor: 'background.paper',
                            boxShadow: (t) => t.shadows[1],
                            flexShrink: 0,
                            opacity: accountSwitching ? 0.45 : 1,
                            pointerEvents: accountSwitching ? 'none' : 'auto',
                            transition: `box-shadow 180ms ${UI_EASE}, border-color 300ms ${UI_EASE}, opacity 120ms ${UI_EASE}`,
                            '&:hover': {
                                boxShadow: (t) => t.shadows[3]
                            }
                        }}
                    >
                        {/* Offline indicator */}
                        {backendOffline && (
                            <Tooltip title="The Local Lantern is currently offline" arrow>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        px: { xs: 0.5, sm: 0.75 },
                                        py: 0.25,
                                        borderRadius: 999,
                                        bgcolor: (t) => alpha(t.palette.warning.main, 0.1),
                                        cursor: 'default',
                                    }}
                                >
                                    <WifiOffRoundedIcon sx={{ fontSize: 16, color: 'warning.dark' }} />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            display: { xs: 'none', sm: 'block' },
                                            fontWeight: 800,
                                            fontSize: '0.68rem',
                                            color: 'warning.dark',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        Offline
                                    </Typography>
                                </Box>
                            </Tooltip>
                        )}
                        {/* Avatar — clickable to open account switcher on both mobile and desktop */}
                        <Tooltip title="Switch account" arrow>
                            <Avatar
                                src={activeAvatarSrc}
                                alt={isBusinessAccount ? activeAccount?.name : isArtistAccount ? activeAccount?.name : (u ? `${u.first_name} ${u.last_name}` : 'Guest')}
                                sx={{
                                    bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                    color: 'primary.main',
                                    width: { xs: 30, sm: 36 },
                                    height: { xs: 30, sm: 36 },
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    border: '2px solid',
                                    borderColor: acctSwitcherOpen
                                        ? 'primary.main'
                                        : isBusinessAccount ? 'primary.light' : isArtistAccount ? 'primary.light' : 'divider',
                                    transition: `box-shadow 140ms ${UI_EASE}, border-color 140ms ${UI_EASE}`,
                                    '&:hover': { boxShadow: (t) => `0 0 0 2px ${alpha(t.palette.primary.main, 0.25)}` },
                                    '& .MuiAvatar-img': {
                                        objectFit: 'cover',
                                        transform: 'scale(1.15)',
                                    },
                                }}
                                imgProps={{ referrerPolicy: 'no-referrer' }}
                                onClick={handleAvatarClick}
                            >
                                {isBusinessAccount ? <StorefrontOutlinedIcon sx={{ fontSize: 20 }} />
                                    : isArtistAccount
                                        ? (isVisualArtistActiveAccount
                                            ? <PaletteRoundedIcon sx={{ fontSize: 20 }} />
                                            : <MusicNoteRoundedIcon sx={{ fontSize: 20 }} />)
                                        : <PersonRoundedIcon sx={{ fontSize: 20 }} />}
                            </Avatar>
                        </Tooltip>

                        {/* Mobile-only down/up arrow next to avatar */}
                        {u && (
                            <Box
                                onClick={handleAvatarClick}
                                sx={{
                                    display: { xs: 'flex', md: 'none' },
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    ml: -0.5,
                                    color: 'text.secondary',
                                    transition: `color 140ms ${UI_EASE}`,
                                }}
                            >
                                {acctSwitcherOpen
                                    ? <KeyboardArrowUpRoundedIcon sx={{ fontSize: 18 }} />
                                    : <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18 }} />
                                }
                            </Box>
                        )}

                        {u ? (
                            <>
                                {/* Name + username — single compact column, clickable to open account switcher */}
                                <Box
                                    onClick={handleAvatarClick}
                                    sx={{
                                        display: { xs: 'none', md: 'flex' },
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        minWidth: 0,
                                        maxWidth: 140,
                                        // On wide desktop (≥1440) where @handle is visible again,
                                        // restore the original 200px cap so long names don't truncate.
                                        '@media (min-width: 1440px)': { maxWidth: 200 },
                                        mr: 0.75,
                                        cursor: 'pointer',
                                        borderRadius: 1,
                                        px: 0.75,
                                        py: 0.25,
                                        transition: `background-color 140ms ${UI_EASE}`,
                                        '&:hover': {
                                            bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                                        },
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                                        <Typography
                                            variant="body2"
                                            noWrap
                                            sx={{
                                                fontWeight: 800,
                                                fontSize: '0.82rem',
                                                letterSpacing: 0.1,
                                                color: 'text.primary',
                                                lineHeight: 1.2
                                            }}
                                        >
                                            {activeDisplayName}
                                        </Typography>
                                        {activeAccount?.slug && (
                                            <Typography
                                                variant="caption"
                                                noWrap
                                                sx={{
                                                    // Tablet (900–1439px): hide @handle to reclaim space.
                                                    // It's still shown in the account switcher dropdown.
                                                    display: 'none',
                                                    '@media (min-width: 1440px)': { display: 'block' },
                                                    color: 'text.secondary',
                                                    fontWeight: 600,
                                                    fontSize: '0.65rem',
                                                    lineHeight: 1.2,
                                                    letterSpacing: 0.2,
                                                }}
                                            >
                                                @{activeAccount.slug}
                                            </Typography>
                                        )}
                                    </Box>
                                    {/* Desktop down/up arrow after name */}
                                    {acctSwitcherOpen
                                        ? <KeyboardArrowUpRoundedIcon sx={{ fontSize: 18, color: 'text.secondary', ml: 0.25, flexShrink: 0 }} />
                                        : <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: 'text.secondary', ml: 0.25, flexShrink: 0 }} />
                                    }
                                </Box>

                            </>
                        ) : (
                            <>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    onClick={openLogin}
                                    sx={{
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800,
                                        minHeight: 30,
                                        px: 1.5,
                                        fontSize: '0.8rem',
                                        transition: `transform 140ms ${UI_EASE}, box-shadow 140ms ${UI_EASE}`,
                                        '&:hover': { transform: 'translateY(-1px)', boxShadow: (t) => t.shadows[4] },
                                        '&:active': { transform: 'translateY(0px)' }
                                    }}
                                >
                                    Login
                                </Button>
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    onClick={() => navigate('/register')}
                                    sx={{
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 900,
                                        minHeight: 30,
                                        px: 1.5,
                                        fontSize: '0.8rem',
                                        transition: `transform 140ms ${UI_EASE}, box-shadow 140ms ${UI_EASE}`,
                                        '&:hover': { transform: 'translateY(-1px)', boxShadow: (t) => t.shadows[5] },
                                        '&:active': { transform: 'translateY(0px)' }
                                    }}
                                >
                                    Sign Up
                                </Button>
                            </>
                        )}


                        {/* Create button — logged-in only */}
                        {u && (
                            <Tooltip title="Create" arrow>
                                <Button
                                    size="small"
                                    aria-label="Create"
                                    aria-controls={createMenuOpen ? 'create-menu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={createMenuOpen ? 'true' : undefined}
                                    onClick={handleCreateMenuOpen}
                                    startIcon={
                                        <AddRoundedIcon
                                            sx={{
                                                fontSize: 20,
                                                fontWeight: 900,
                                                transition: `transform 200ms ${UI_EASE}`,
                                                transform: createMenuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                                            }}
                                        />
                                    }
                                    sx={(t) => {
                                        const isDark = t.palette.mode === 'dark';
                                        return {
                                            height: 34,
                                            minWidth: 0,
                                            px: 1.5,
                                            borderRadius: 999,
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            fontSize: 14,
                                            lineHeight: 1,
                                            bgcolor: createMenuOpen
                                                ? (isDark ? t.palette.primary.light : t.palette.primary.dark)
                                                : t.palette.primary.main,
                                            color: '#fff',
                                            boxShadow: createMenuOpen
                                                ? `0 0 0 3px ${alpha(t.palette.primary.main, 0.3)}`
                                                : `0 2px 8px ${alpha(t.palette.primary.main, isDark ? 0.45 : 0.35)}`,
                                            transition: `background-color 180ms ${UI_EASE}, box-shadow 200ms ${UI_EASE}, transform 180ms ${UI_EASE}, color 140ms ${UI_EASE}`,
                                            '& .MuiButton-startIcon': {
                                                mr: 0.5,
                                                ml: -0.25,
                                            },
                                            '&:hover': {
                                                bgcolor: isDark ? t.palette.primary.light : t.palette.primary.dark,
                                                boxShadow: `0 0 0 3px ${alpha(t.palette.primary.main, 0.25)}, 0 4px 12px ${alpha(t.palette.primary.main, isDark ? 0.5 : 0.4)}`,
                                                transform: 'scale(1.08)',
                                            },
                                            '&:active': {
                                                transform: 'scale(0.95)',
                                            },
                                            // ── Tablet (900–1439px): ghost icon styling ──
                                            // Strips the filled CTA treatment so the button visually
                                            // joins the mail/bell/kebab icon row instead of fighting it.
                                            // Size, shape, color, and hover all mirror the sibling IconButtons.
                                            '@media (min-width: 900px) and (max-width: 1439px)': {
                                                width: 32,
                                                height: 32,
                                                minWidth: 32,
                                                px: 0,
                                                bgcolor: createMenuOpen ? alpha(t.palette.primary.main, 0.12) : 'transparent',
                                                color: createMenuOpen ? t.palette.primary.main : t.palette.text.secondary,
                                                boxShadow: 'none',
                                                '& .MuiButton-startIcon': {
                                                    mr: 0,
                                                    ml: 0,
                                                },
                                                '&:hover': {
                                                    bgcolor: alpha(t.palette.primary.main, 0.1),
                                                    color: t.palette.primary.main,
                                                    boxShadow: 'none',
                                                    transform: 'none',
                                                },
                                                '&:active': {
                                                    transform: 'none',
                                                    bgcolor: alpha(t.palette.primary.main, 0.16),
                                                },
                                            },
                                        };
                                    }}
                                >
                                    <Box
                                        component="span"
                                        sx={{
                                            // Hide the "Create" label on tablet; the + icon carries the meaning.
                                            '@media (min-width: 900px) and (max-width: 1439px)': {
                                                display: 'none',
                                            },
                                        }}
                                    >
                                        Create
                                    </Box>
                                </Button>
                            </Tooltip>
                        )}

                        {/* Messages button — logged-in only */}
                        {u && (
                            <Tooltip title="Messages" arrow>
                                <IconButton
                                    size="small"
                                    aria-label="Messages"
                                    onClick={() => {
                                        setUnreadMsgCount(0);
                                        onTabChange('');
                                        navigate('/messages');
                                    }}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: 'transparent',
                                        color: onMessagesRoute ? 'primary.main' : 'text.secondary',
                                        transition: `background-color 140ms ${UI_EASE}, color 140ms ${UI_EASE}`,
                                        '&:hover': {
                                            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                                            color: 'primary.main',
                                        },
                                    }}
                                >
                                    <Badge
                                        color="primary"
                                        variant={unreadMsgCount > 0 ? 'standard' : 'dot'}
                                        badgeContent={unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                                        invisible={unreadMsgCount <= 0}
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                fontSize: 10,
                                                minWidth: 16,
                                                height: 16,
                                                px: 0.4,
                                            },
                                        }}
                                    >
                                        <MailOutlinedIcon sx={{ fontSize: 20 }} />
                                    </Badge>
                                </IconButton>
                            </Tooltip>
                        )}

                        {/* Notifications bell — logged-in only */}
                        {u && (
                            <Tooltip title="Notifications" arrow>
                                <IconButton
                                    size="small"
                                    aria-label="Notifications"
                                    aria-controls={notifOpen ? 'notifications-menu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={notifOpen ? 'true' : undefined}
                                    onClick={handleNotifClick}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        transition: `background-color 140ms ${UI_EASE}, color 140ms ${UI_EASE}`,
                                        '&:hover': {
                                            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                                            color: 'primary.main',
                                        },
                                    }}
                                >
                                    <Badge
                                        color="primary"
                                        variant={unreadCount > 0 ? 'standard' : 'dot'}
                                        badgeContent={unreadCount > 9 ? '9+' : unreadCount}
                                        invisible={unreadCount <= 0}
                                    >
                                        <NotificationsNoneIcon sx={{ fontSize: 20 }} />
                                    </Badge>
                                </IconButton>
                            </Tooltip>
                        )}

                        {/* Social button — logged-in only.
                            Hidden on tablet (900–1439px) to save horizontal space; still
                            reachable from the kebab menu. Visible on phone (bottom nav) and wide desktop. */}
                        {u && (
                            <Tooltip title="Social" arrow>
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        onTabChange('');
                                        navigate('/social');
                                    }}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        bgcolor: 'transparent',
                                        color: onSocialRoute ? 'primary.main' : 'text.secondary',
                                        transition: `background-color 140ms ${UI_EASE}, color 140ms ${UI_EASE}`,
                                        // Tablet: hide — accessible via the Settings kebab menu.
                                        '@media (min-width: 900px) and (max-width: 1439px)': {
                                            display: 'none',
                                        },
                                        '&:hover': {
                                            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                                            color: 'primary.main',
                                        },
                                    }}
                                >
                                    <PublicIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                            </Tooltip>
                        )}

                        {/* Three-dot settings menu — logged-in only */}
                        {u && (
                            <Tooltip title="Settings" arrow>
                                <IconButton
                                    size="small"
                                    aria-label="Settings"
                                    aria-controls={menuOpen ? 'account-menu' : undefined}
                                    aria-haspopup="true"
                                    aria-expanded={menuOpen ? 'true' : undefined}
                                    onClick={handleDotsClick}
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        transition: `background-color 140ms ${UI_EASE}, color 140ms ${UI_EASE}`,
                                        '&:hover': {
                                            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                                            color: 'primary.main',
                                        },
                                    }}
                                >
                                    <MoreVertIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Spacer to push content below the fixed AppBar */}
            <Toolbar sx={{ minHeight: { xs: 52, sm: 72 }, ...(isMobile ? { pt: 'env(safe-area-inset-top, 0px)' } : {}) }} />

            {u && (
                <Menu
                    id="notifications-menu"
                    anchorEl={notifAnchorEl}
                    open={notifOpen}
                    onClose={closeNotifications}
                    disableScrollLock
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    MenuListProps={{ disablePadding: true, component: 'div' }}
                    PaperProps={{
                        sx: {
                            width: { xs: 'calc(100vw - 16px)', sm: 340 },
                            minWidth: { xs: 280, sm: 340 },
                            maxWidth: { xs: 'calc(100vw - 16px)', sm: 360 },
                            p: 1,
                            pt: 0.5,
                            borderRadius: 2
                        }
                    }}
                >
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5, pb: 0.25 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <NotificationsNoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                                    Notifications
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Button
                                    size="small"
                                    variant="text"
                                    startIcon={<SettingsOutlinedIcon sx={{ fontSize: 18 }} />}
                                    onClick={() => {
                                        closeNotifications();
                                        navigate('/account/notifications');
                                    }}
                                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 800 }}
                                >
                                    Settings
                                </Button>

                                <IconButton size="small" aria-label="Close notifications" onClick={closeNotifications}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 0.75 }} />

                        <Box sx={{ px: 0.5, pb: 0.5, display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 0.75 }}>
                                <Button
                                    size="small"
                                    variant="text"
                                    onClick={() => {
                                        const ids = Array.isArray(highlightNotifIds) ? highlightNotifIds : [];
                                        closeNotifications();
                                        navigate('/notifications', { state: { llHighlightNotifIds: ids } });
                                    }}
                                    sx={{
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800
                                    }}
                                >
                                    View all
                                </Button>

                                <Button
                                    size="small"
                                    variant="text"
                                    onClick={async () => {
                                        await clearAllNotifications();
                                        closeNotifications();
                                    }}
                                    sx={{
                                        borderRadius: 999,
                                        textTransform: 'none',
                                        fontWeight: 800
                                    }}
                                >
                                    Clear
                                </Button>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 0.5 }} />

                        <Box sx={{ maxHeight: 360, overflowY: 'auto', pr: 0.25 }}>
                            {notifLoading ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress size={22} />
                                </Box>
                            ) : notifItems.length === 0 ? (
                                <Box sx={{ px: 1, py: 2 }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                        You're all caught up.
                                    </Typography>
                                </Box>
                            ) : (
                                (() => {
                                    // Deduplicate: if someone replies to your comment on your own post,
                                    // you get both comment_reply and post_comment. Keep only comment_reply.
                                    const replyKeys = new Set();
                                    for (const n of notifItems) {
                                        if (n?.type === 'comment_reply') {
                                            const actorId = n?.actor_id || n?.actor_user_id || '';
                                            const entityId = n?.entity_id || '';
                                            if (actorId && entityId) replyKeys.add(`${actorId}:${entityId}`);
                                        }
                                    }
                                    return notifItems.filter((n) => {
                                        if (n?.type !== 'post_comment') return true;
                                        const actorId = n?.actor_id || n?.actor_user_id || '';
                                        const entityId = n?.entity_id || '';
                                        if (actorId && entityId && replyKeys.has(`${actorId}:${entityId}`)) return false;
                                        return true;
                                    });
                                })().map((n) => {
                                    const idNum = Number(n?.id);
                                    const isHighlighted = Number.isFinite(idNum) && highlightNotifIds.includes(idNum);
                                    return (
                                        <MenuItem
                                            key={n.id}
                                            onClick={() => handleNotifItemClick(n)}
                                            sx={{
                                                alignItems: 'flex-start',
                                                borderRadius: 1.5,
                                                mx: 0.5,
                                                my: 0.25,
                                                px: 1,
                                                py: 1,
                                                gap: 1,
                                                bgcolor: (theme) => {
                                                    const brass = theme.custom?.brand?.brass || '#A87822';
                                                    return isHighlighted ? alpha(brass, 0.14) : 'transparent';
                                                },
                                                '&:hover': {
                                                    bgcolor: (theme) => {
                                                        const brass = theme.custom?.brand?.brass || '#A87822';
                                                        return alpha(brass, isHighlighted ? 0.20 : 0.06);
                                                    },
                                                },
                                            }}
                                        >
                                            <Avatar
                                                src={isDefaultAvatar(getNotifActorAvatarSrc(n)) ? undefined : getNotifActorAvatarSrc(n)}
                                                alt="User"
                                                sx={(t) => ({
                                                    width: 36,
                                                    height: 36,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    mt: 0.15,
                                                    flexShrink: 0,
                                                    bgcolor: alpha(t.palette.primary.main, 0.08),
                                                    color: t.palette.primary.main,
                                                    '& .MuiAvatar-img': {
                                                        objectFit: 'cover',
                                                        transform: 'scale(1.15)',
                                                    },
                                                })}
                                                imgProps={{ referrerPolicy: 'no-referrer' }}
                                            >
                                                <NotifDefaultAvatarIcon accountType={getNotifActorAccountType(n)} profileType={getNotifActorProfileType(n)} size={20} />
                                            </Avatar>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 0.25 }}>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: n.is_read ? 700 : 900,
                                                        color: 'text.primary',
                                                        fontSize: 14,
                                                        lineHeight: 1.2,
                                                        whiteSpace: 'normal',
                                                        overflowWrap: 'anywhere',
                                                        wordBreak: 'break-word'
                                                    }}>
                                                    <Box component="span" sx={{ fontWeight: 900 }}>
                                                        {getActorNameParts(n).first}
                                                    </Box>
                                                    {getActorNameParts(n).last ? ` ${getActorNameParts(n).last}` : ''}{' '}
                                                    {getNotifLabel(n)}
                                                </Typography>
                                                {(() => {
                                                    const preview = getNotifPreview(n);
                                                    return preview ? (
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontStyle: 'italic',
                                                                color: 'text.secondary',
                                                                fontWeight: 700,
                                                                fontSize: 12,
                                                                lineHeight: 1.2,
                                                                mt: 0.25,
                                                                whiteSpace: 'normal',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 1,
                                                                WebkitBoxOrient: 'vertical',
                                                            }}
                                                        >
                                                            &ldquo;{preview}&rdquo;
                                                        </Typography>
                                                    ) : null;
                                                })()}
                                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                                    {formatTimeAgo(n.created_at)}
                                                </Typography>
                                                {String(n?.type || '') === 'new_follower' && (() => {
                                                    const nd = (() => { try { return typeof n.data === 'object' ? n.data : JSON.parse(n.data || '{}'); } catch { return {}; } })();
                                                    const fbTargetId = Number(nd?.followerAccountId || nd?.followerUserId || n?.actor_id || n?.actor_user_id || 0);
                                                    if (fbTargetId > 0 && alreadyFollowingIds.has(fbTargetId)) return null;
                                                    const didFollowBack = fbTargetId > 0 && followedBackIds.has(fbTargetId);
                                                    return fbTargetId > 0 ? (
                                                        <Box
                                                            onClick={(ev) => !didFollowBack && handleFollowBack(ev, n)}
                                                            role="button"
                                                            tabIndex={0}
                                                            sx={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                alignSelf: 'flex-start',
                                                                gap: 0.5,
                                                                mt: 0.5,
                                                                px: 1.25,
                                                                py: 0.35,
                                                                borderRadius: 999,
                                                                fontSize: 12,
                                                                fontWeight: 800,
                                                                cursor: didFollowBack ? 'default' : 'pointer',
                                                                color: didFollowBack ? 'primary.main' : 'primary.contrastText',
                                                                bgcolor: didFollowBack ? (t) => alpha(t.palette.primary.main, 0.08) : 'primary.main',
                                                                border: '1px solid',
                                                                borderColor: didFollowBack ? (t) => alpha(t.palette.primary.main, 0.3) : 'primary.main',
                                                                transition: 'all 150ms ease',
                                                                '&:hover': didFollowBack ? {} : { bgcolor: 'primary.dark' },
                                                            }}
                                                        >
                                                            {didFollowBack
                                                                ? <HowToRegRoundedIcon sx={{ fontSize: 14 }} />
                                                                : <PersonAddRoundedIcon sx={{ fontSize: 14 }} />}
                                                            {didFollowBack ? 'Following' : 'Follow back'}
                                                        </Box>
                                                    ) : null;
                                                })()}
                                                {(String(n?.type || '') === 'business_approved' || String(n?.type || '') === 'artist_approved') && (() => {
                                                    const nd = (() => { try { return typeof n.data === 'object' ? n.data : JSON.parse(n.data || '{}'); } catch { return {}; } })();
                                                    const isBusinessApproval = String(n?.type || '') === 'business_approved';
                                                    const acctId = isBusinessApproval
                                                        ? String(nd?.businessId || nd?.business_id || '')
                                                        : `artist:${nd?.artistId || nd?.artist_id || ''}`;
                                                    const acctName = isBusinessApproval
                                                        ? (nd?.businessName || nd?.business_name || 'Business')
                                                        : (nd?.artistName || nd?.artist_name || 'Artist');
                                                    const acctSlug = isBusinessApproval
                                                        ? (nd?.businessSlug || nd?.business_slug || '')
                                                        : (nd?.artistHandle || nd?.artist_handle || '');
                                                    const acctAvatar = isBusinessApproval
                                                        ? (nd?.businessAvatarUrl || nd?.business_avatar_url || '')
                                                        : (nd?.artistAvatarUrl || nd?.artist_avatar_url || '');
                                                    return (
                                                        <Box
                                                            onClick={(ev) => {
                                                                ev.stopPropagation();
                                                                ev.preventDefault();
                                                                const acct = {
                                                                    id: acctId,
                                                                    type: isBusinessApproval ? 'business' : 'artist',
                                                                    name: acctName,
                                                                    avatar_url: acctAvatar || null,
                                                                    slug: acctSlug || null,
                                                                    artistId: isBusinessApproval ? null : (nd?.artistId || nd?.artist_id || null),
                                                                    businessId: isBusinessApproval ? (nd?.businessId || nd?.business_id || null) : null,
                                                                    role: 'owner',
                                                                };
                                                                try { localStorage.setItem('ll:activeAccount', JSON.stringify(acct)); } catch { /* ignore */ }
                                                                try { window.dispatchEvent(new CustomEvent('ll:account:changed', { detail: { account: acct } })); } catch { /* ignore */ }
                                                                window.location.assign(acctSlug ? `/${acctSlug}` : '/');
                                                            }}
                                                            role="button"
                                                            tabIndex={0}
                                                            sx={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                alignSelf: 'flex-start',
                                                                gap: 0.5,
                                                                mt: 0.5,
                                                                px: 1.25,
                                                                py: 0.35,
                                                                borderRadius: 999,
                                                                fontSize: 12,
                                                                fontWeight: 800,
                                                                cursor: 'pointer',
                                                                color: 'primary.contrastText',
                                                                bgcolor: 'primary.main',
                                                                border: '1px solid',
                                                                borderColor: 'primary.main',
                                                                transition: 'all 150ms ease',
                                                                '&:hover': { bgcolor: 'primary.dark' },
                                                            }}
                                                        >
                                                            <SwapHorizRoundedIcon sx={{ fontSize: 14 }} />
                                                            Switch to {isBusinessApproval ? 'Business' : (String(n?.data?.profileType || n?.data?.profile_type || '').toLowerCase() === 'artist' ? 'Artist' : 'Music')}
                                                        </Box>
                                                    );
                                                })()}
                                            </Box>
                                        </MenuItem>
                                    );
                                })
                            )}
                        </Box>

                        <Divider sx={{ mt: 0.75, mb: 0.5 }} />
                    </Box>
                </Menu>
            )}
            {u && (
                <Menu
                    id="account-menu"
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={handleMenuClose}
                    disableScrollLock
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    MenuListProps={{ disablePadding: true, component: 'div' }}
                    PaperProps={{
                        sx: {
                            width: { xs: 220, sm: 240 },
                            minWidth: { xs: 200, sm: 220 },
                            maxWidth: { xs: 280, sm: 280 },
                            p: { xs: 0.75, sm: 1 },
                            pt: 0.5,
                            borderRadius: 2,
                            ...(isMobile && {
                                maxHeight: 'calc(100vh - 80px)',
                                overflowY: 'auto',
                            }),
                        }
                    }}
                >
                    <Box>
                        {/* Close button */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <IconButton size="small" aria-label="Close" onClick={() => closeMenu()} sx={{ alignSelf: 'flex-end' }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>

                        {/* Settings only */}
                        <Box sx={{ px: 0.25, pb: 0.25 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, px: 0.75, pb: 0.25 }}>
                                Settings
                            </Typography>

                            <ThemePickerMenuItem />

                            {/* Hide Notifications on mobile when active account is a draft artist/music account */}
                            {!(isArtistAccount && String(activeAccount?.status) === 'draft') && (
                                <MenuItem
                                    sx={(t) => ({
                                        minHeight: 44,
                                        borderRadius: 1.5,
                                        px: 1.25,
                                        py: 1,
                                        fontWeight: 700,
                                        gap: 0.25,
                                        transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.07) },
                                        '&:hover .ll-menu-icon-wrap': { bgcolor: alpha(t.palette.primary.main, 0.14) },
                                    })}
                                    onClick={() => {
                                        closeMenu();
                                        navigate('/account/notifications');
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 34 }}>
                                        <Box
                                            className="ll-menu-icon-wrap"
                                            sx={(t) => ({
                                                width: 28,
                                                height: 28,
                                                borderRadius: 1.25,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: alpha(t.palette.primary.main, 0.08),
                                                transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                            })}
                                        >
                                            <NotificationsNoneIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                                        </Box>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={isMobile ? 'Notifications' : 'Notification Settings'}
                                        primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                                    />
                                </MenuItem>
                            )}

                            <MenuItem
                                sx={(t) => ({
                                    minHeight: 44,
                                    borderRadius: 1.5,
                                    px: 1.25,
                                    py: 1,
                                    fontWeight: 700,
                                    gap: 0.25,
                                    transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.07) },
                                    '&:hover .ll-menu-icon-wrap': { bgcolor: alpha(t.palette.info.main, 0.14) },
                                })}
                                onClick={() => {
                                    closeMenu();
                                    navigate('/account');
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 34 }}>
                                    <Box
                                        className="ll-menu-icon-wrap"
                                        sx={(t) => ({
                                            width: 28,
                                            height: 28,
                                            borderRadius: 1.25,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: alpha(t.palette.info.main, 0.08),
                                            transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        })}
                                    >
                                        <SettingsRoundedIcon sx={{ fontSize: 17, color: 'info.main' }} />
                                    </Box>
                                </ListItemIcon>
                                <ListItemText
                                    primary={isMobile ? 'Account' : 'Account Settings'}
                                    primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                                />
                            </MenuItem>

                            {/* Social — only shown in this menu on tablet widths (900–1439px),
                                where the Social icon in the header row is hidden to save space.
                                On phone (<900px) and wide desktop (≥1440px) the Social icon is visible
                                elsewhere, so this menu item is hidden to avoid duplicate navigation. */}
                            <MenuItem
                                sx={(t) => ({
                                    display: 'none',
                                    '@media (min-width: 900px) and (max-width: 1439px)': {
                                        display: 'flex',
                                    },
                                    minHeight: 44,
                                    borderRadius: 1.5,
                                    px: 1.25,
                                    py: 1,
                                    fontWeight: 700,
                                    gap: 0.25,
                                    transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.07) },
                                    '&:hover .ll-menu-icon-wrap': { bgcolor: alpha(t.palette.primary.main, 0.14) },
                                })}
                                onClick={() => {
                                    closeMenu();
                                    onTabChange('');
                                    navigate('/social');
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 34 }}>
                                    <Box
                                        className="ll-menu-icon-wrap"
                                        sx={(t) => ({
                                            width: 28,
                                            height: 28,
                                            borderRadius: 1.25,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: alpha(t.palette.primary.main, 0.08),
                                            transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        })}
                                    >
                                        <PublicIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                                    </Box>
                                </ListItemIcon>
                                <ListItemText
                                    primary="Social"
                                    primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                                />
                            </MenuItem>

                            {isLLAdmin && (
                                <MenuItem
                                    sx={(t) => ({
                                        minHeight: 44,
                                        borderRadius: 1.5,
                                        px: 1.25,
                                        py: 1,
                                        fontWeight: 700,
                                        gap: 0.25,
                                        transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        '&:hover': { bgcolor: alpha(t.palette.warning.main, 0.07) },
                                        '&:hover .ll-menu-icon-wrap': { bgcolor: alpha(t.palette.warning.main, 0.16) },
                                    })}
                                    onClick={() => {
                                        closeMenu();
                                        onTabChange('');
                                        navigate('/admin');
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 34 }}>
                                        <Box
                                            className="ll-menu-icon-wrap"
                                            sx={(t) => ({
                                                width: 28,
                                                height: 28,
                                                borderRadius: 1.25,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: alpha(t.palette.warning.main, 0.10),
                                                transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                            })}
                                        >
                                            <AdminPanelSettingsRoundedIcon sx={{ fontSize: 17, color: 'warning.dark' }} />
                                        </Box>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={isMobile ? 'Admin' : 'Admin Console'}
                                        primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                                    />
                                </MenuItem>
                            )}

                            {/* Legal */}
                            <MenuItem
                                sx={(t) => ({
                                    minHeight: 44,
                                    borderRadius: 1.5,
                                    px: 1.25,
                                    py: 1,
                                    fontWeight: 700,
                                    gap: 0.25,
                                    transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.07) },
                                    '&:hover .ll-menu-icon-wrap': { bgcolor: alpha(t.palette.primary.main, 0.14) },
                                })}
                                onClick={() => {
                                    closeMenu();
                                    onTabChange('');
                                    navigate('/legal');
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 34 }}>
                                    <Box
                                        className="ll-menu-icon-wrap"
                                        sx={(t) => ({
                                            width: 28,
                                            height: 28,
                                            borderRadius: 1.25,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: alpha(t.palette.primary.main, 0.08),
                                            transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        })}
                                    >
                                        <GavelRoundedIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                                    </Box>
                                </ListItemIcon>
                                <ListItemText
                                    primary="Legal"
                                    primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                                />
                            </MenuItem>

                            {/* Contact Us */}
                            <MenuItem
                                sx={(t) => ({
                                    minHeight: 44,
                                    borderRadius: 1.5,
                                    px: 1.25,
                                    py: 1,
                                    fontWeight: 700,
                                    gap: 0.25,
                                    transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.07) },
                                    '&:hover .ll-menu-icon-wrap': { bgcolor: alpha(t.palette.primary.main, 0.14) },
                                })}
                                onClick={() => {
                                    closeMenu();
                                    if (!user) {
                                        openLogin();
                                        return;
                                    }
                                    setContactUsOpen(true);
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 34 }}>
                                    <Box
                                        className="ll-menu-icon-wrap"
                                        sx={(t) => ({
                                            width: 28,
                                            height: 28,
                                            borderRadius: 1.25,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: alpha(t.palette.primary.main, 0.08),
                                            transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        })}
                                    >
                                        <ContactSupportOutlinedIcon sx={{ fontSize: 17, color: 'primary.main' }} />
                                    </Box>
                                </ListItemIcon>
                                <ListItemText
                                    primary="Contact Us"
                                    primaryTypographyProps={{ variant: 'body2', fontWeight: 700 }}
                                />
                            </MenuItem>

                            <Divider sx={{ my: 0.5 }} />

                            <MenuItem
                                sx={(t) => ({
                                    minHeight: 44,
                                    borderRadius: 1.5,
                                    px: 1.25,
                                    py: 1,
                                    fontWeight: 700,
                                    gap: 0.25,
                                    transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    '&:hover': { bgcolor: alpha(t.palette.error.main, 0.06) },
                                    '&:hover .ll-menu-icon-wrap': { bgcolor: alpha(t.palette.error.main, 0.14) },
                                    '&:hover .ll-signout-label': { color: t.palette.error.main },
                                })}
                                onClick={handleSignOut}
                            >
                                <ListItemIcon sx={{ minWidth: 34 }}>
                                    <Box
                                        className="ll-menu-icon-wrap"
                                        sx={(t) => ({
                                            width: 28,
                                            height: 28,
                                            borderRadius: 1.25,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor: alpha(t.palette.error.main, 0.07),
                                            transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                        })}
                                    >
                                        <LogoutRoundedIcon sx={{ fontSize: 17, color: 'error.main' }} />
                                    </Box>
                                </ListItemIcon>
                                <ListItemText
                                    className="ll-signout-label"
                                    primary="Sign Out"
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        fontWeight: 700,
                                        sx: (t) => ({ transition: `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}` }),
                                    }}
                                />
                            </MenuItem>
                        </Box>
                    </Box>
                </Menu>
            )}

            {/* ── Account-switcher menu (opened by tapping avatar/name on both mobile and desktop) ── */}
            {u && (
                <Menu
                    id="account-switcher"
                    anchorEl={acctSwitcherAnchorEl}
                    open={acctSwitcherOpen}
                    onClose={closeAcctSwitcher}
                    disableScrollLock
                    anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'left' : 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: isMobile ? 'left' : 'right' }}
                    MenuListProps={{ disablePadding: true, component: 'div' }}
                    PaperProps={{
                        onScroll: (e) => e.stopPropagation(),
                        sx: {
                            width: isMobile ? 'calc(100vw - 24px)' : 320,
                            maxWidth: 320,
                            minWidth: 260,
                            p: 1,
                            pt: 0.5,
                            borderRadius: 2.5,
                            maxHeight: 'calc(100vh - 80px)',
                            overflowY: 'auto',
                            overscrollBehavior: 'contain',
                        }
                    }}
                >
                    <Box>
                        {/* Header row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.75, pb: 0.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                                Accounts
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {accountsLoading && <CircularProgress size={14} />}
                                <IconButton size="small" aria-label="Close" onClick={closeAcctSwitcher}>
                                    <CloseIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Box>
                        </Box>

                        <Divider sx={{ mb: 0.5 }} />

                        {/* "View profile" link */}
                        <MenuItem
                            sx={(t) => ({
                                minHeight: 40,
                                borderRadius: 1.5,
                                px: 1,
                                py: 0.75,
                                mb: 0.25,
                                transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.07) },
                            })}
                            onClick={() => {
                                closeAcctSwitcher();
                                onTabChange('');
                                navigate(activeProfilePath);
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 34 }}>
                                <Avatar
                                    src={activeAvatarSrc}
                                    sx={{
                                        width: 26,
                                        height: 26,
                                        bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                        color: 'primary.main',
                                        '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                                    }}
                                    imgProps={{ referrerPolicy: 'no-referrer' }}
                                >
                                    {isBusinessAccount ? <StorefrontOutlinedIcon sx={{ fontSize: 14 }} />
                                        : isArtistAccount
                                            ? (isVisualArtistActiveAccount
                                                ? <PaletteRoundedIcon sx={{ fontSize: 14 }} />
                                                : <MusicNoteRoundedIcon sx={{ fontSize: 14 }} />)
                                            : <PersonRoundedIcon sx={{ fontSize: 14 }} />}
                                </Avatar>
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                        View Profile
                                    </Typography>
                                }
                                secondary={
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        @{activeAccount?.slug || slug}
                                    </Typography>
                                }
                                secondaryTypographyProps={{ component: 'div' }}
                            />
                        </MenuItem>

                        <Divider sx={{ my: 0.5 }} />

                        {/* Accounts list */}
                        <Box
                            onScroll={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.25,
                                maxHeight: 320,
                                overflowY: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                overscrollBehavior: 'contain',
                                pr: 0.5,
                                '&::-webkit-scrollbar': { width: 5 },
                                '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
                                '&::-webkit-scrollbar-thumb': {
                                    backgroundColor: (t) => alpha(t.palette.primary.main, 0.2),
                                    borderRadius: 3,
                                },
                            }}
                        >
                            {/* Pending business apps */}
                            {normalizedBusinessAccounts.length === 0 && pendingBusinessApps.length > 0 && (
                                pendingBusinessApps.map((app) => (
                                    <MenuItem
                                        key={`pending-app:${app?.id}`}
                                        sx={{
                                            minHeight: 48,
                                            borderRadius: 1.5,
                                            px: 1,
                                            py: 0.75,
                                            alignItems: 'flex-start',
                                            '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                        }}
                                        onClick={() => {
                                            closeAcctSwitcher();
                                            navigate('/business/apply');
                                        }}
                                    >
                                        <ListItemIcon sx={{ mt: 0.2, minWidth: 36 }}>
                                            <StorefrontOutlinedIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" sx={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {app?.business_name || 'Business Application'}
                                                </Typography>
                                            }
                                            secondary={<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Status: Pending Approval</Typography>}
                                            secondaryTypographyProps={{ component: 'div' }}
                                        />
                                    </MenuItem>
                                ))
                            )}

                            {/* Pending artist apps */}
                            {normalizedArtistAccounts.length === 0 && pendingArtistApps.length > 0 && (
                                pendingArtistApps.map((app) => (
                                    <MenuItem
                                        key={`pending-artist-app:${app?.id}`}
                                        sx={{
                                            minHeight: 48,
                                            borderRadius: 1.5,
                                            px: 1,
                                            py: 0.75,
                                            alignItems: 'flex-start',
                                            '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                                        }}
                                        onClick={() => {
                                            closeAcctSwitcher();
                                            navigate('/music/apply');
                                        }}
                                    >
                                        <ListItemIcon sx={{ mt: 0.2, minWidth: 36 }}>
                                            <MusicNoteRoundedIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" sx={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {app?.artist_name || 'Music Application'}
                                                </Typography>
                                            }
                                            secondary={<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Status: Pending Approval</Typography>}
                                            secondaryTypographyProps={{ component: 'div' }}
                                        />
                                    </MenuItem>
                                ))
                            )}

                            {/* All accounts */}
                            {allAccounts.map((acct) => {
                                const isActive = String(activeAccountId) === String(acct.id);
                                const acctStatus = String(acct.status || '').toLowerCase();
                                const isPending = (acct.type === 'business' || acct.type === 'artist') && acctStatus === 'pending_setup';
                                const isDraft = (acct.type === 'business' || acct.type === 'artist') && acctStatus === 'draft';
                                const isPendingApproval = (acct.type === 'business' || acct.type === 'artist') && acctStatus === 'pending_approval';
                                const needsSetup = isPending || isDraft;
                                const cannotSwitch = needsSetup || isPendingApproval;
                                const acctHighlightKey = `${acct.type}:${acct.id}`;
                                const isGoldHighlighted = highlightAccountIds.has(acctHighlightKey);
                                return (
                                    <MenuItem
                                        key={`${acct.type}:${acct.id}`}
                                        sx={(t) => {
                                            const brass = t.custom?.brand?.brass || '#A87822';
                                            const motionFast = t.custom?.motion?.fast || 120;
                                            const motionEase = t.custom?.motion?.ease || 'cubic-bezier(.2,.8,.2,1)';
                                            return {
                                                minHeight: 48,
                                                borderRadius: 1.5,
                                                px: 1,
                                                py: 0.75,
                                                alignItems: 'flex-start',
                                                transition: `background-color ${motionFast}ms ${motionEase}, box-shadow ${motionFast}ms ${motionEase}, border-color ${motionFast}ms ${motionEase}`,
                                                bgcolor: isGoldHighlighted
                                                    ? alpha(brass, 0.14)
                                                    : isActive
                                                        ? alpha(t.palette.primary.main, 0.12)
                                                        : 'transparent',
                                                border: '1px solid',
                                                borderColor: isGoldHighlighted ? alpha(brass, 0.32) : 'transparent',
                                                boxShadow: isGoldHighlighted
                                                    ? `inset 0 0 0 1px ${alpha(brass, 0.08)}, 0 2px 8px ${alpha(brass, 0.12)}`
                                                    : 'none',
                                                '&:hover': {
                                                    bgcolor: isGoldHighlighted
                                                        ? alpha(brass, 0.22)
                                                        : isActive
                                                            ? alpha(t.palette.primary.main, 0.16)
                                                            : alpha(t.palette.primary.main, 0.08),
                                                },
                                            };
                                        }}
                                        onClick={() => {
                                            if (needsSetup || isPendingApproval) {
                                                closeAcctSwitcher();
                                                handleOpenSetup(acct);
                                                return;
                                            }
                                            closeAcctSwitcher();
                                            handleSelectAccount(acct);
                                        }}
                                    >
                                        <ListItemIcon sx={{ mt: 0.2, minWidth: 36 }}>
                                            <Avatar
                                                src={
                                                    acct.type === 'business'
                                                        ? (acct.avatar_url || acct.logo_url || null)
                                                        : acct.type === 'artist'
                                                            ? (acct.avatar_url || null)
                                                            : (acct.avatar_url || null)
                                                }
                                                alt={acct.name}
                                                imgProps={{ referrerPolicy: 'no-referrer' }}
                                                sx={{
                                                    width: 26,
                                                    height: 26,
                                                    bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                                                    color: 'primary.main',
                                                    '& .MuiAvatar-img': { objectFit: 'cover', transform: 'scale(1.15)' },
                                                }}
                                            >
                                                {acct.type === 'business' ? <StorefrontOutlinedIcon sx={{ fontSize: 14 }} />
                                                    : acct.type === 'artist'
                                                        ? (acct.profileType === 'artist'
                                                            ? <PaletteRoundedIcon sx={{ fontSize: 14 }} />
                                                            : <MusicNoteRoundedIcon sx={{ fontSize: 14 }} />)
                                                        : <PersonRoundedIcon sx={{ fontSize: 14 }} />}
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}
                                                    >
                                                        {acct.name}
                                                    </Typography>
                                                    {isPending && (
                                                        <Badge color="primary" variant="dot" overlap="circular">
                                                            <PendingActionsRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                        </Badge>
                                                    )}
                                                    {isDraft && <PendingActionsRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                                                    {isPendingApproval && <HowToRegRoundedIcon sx={{ fontSize: 16, color: 'warning.main' }} />}
                                                    {isActive && !cannotSwitch && (
                                                        <CheckRoundedIcon sx={{ fontSize: 18, color: 'primary.main', ml: 'auto' }} />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="caption" sx={{ color: isPendingApproval ? 'warning.main' : isDraft ? 'warning.main' : 'text.secondary', fontWeight: 700 }}>
                                                    {(() => {
                                                        // Sub-label for artist rows — branch on profileType so visual
                                                        // artist drafts / ready-to-set-up rows don't say "Music".
                                                        const isArtistRow = acct.type === 'artist';
                                                        const isVA = isArtistRow && acct.profileType === 'artist';
                                                        const artistNoun = isVA ? 'Artist' : 'Music';
                                                        if (isPendingApproval) return 'Pending admin approval (24-48 hrs)';
                                                        if (isPending) {
                                                            if (acct.type === 'business') return 'Business ready to set up';
                                                            if (isArtistRow) return `${artistNoun} ready to set up`;
                                                            return '';
                                                        }
                                                        if (isDraft) {
                                                            if (acct.type === 'business') return 'Business draft — continue setup';
                                                            if (isArtistRow) return `${artistNoun} draft — continue setup`;
                                                            return '';
                                                        }
                                                        if (acct.type === 'business') {
                                                            return [acct.city].filter(Boolean).join(' • ') || 'Business';
                                                        }
                                                        if (isArtistRow) {
                                                            return [acct.city, acct.county].filter(Boolean).join(' • ') || artistNoun;
                                                        }
                                                        return acct.subtitle;
                                                    })()}
                                                </Typography>
                                            }
                                            secondaryTypographyProps={{ component: 'div' }}
                                        />
                                    </MenuItem>
                                );
                            })}


                        </Box>

                        {/* ── Create a Business Page CTA ── */}
                        <Divider sx={{ my: 0.75 }} />
                        <MenuItem
                            disabled={draftLimitChecking}
                            sx={(t) => ({
                                minHeight: 44,
                                borderRadius: 1.5,
                                px: 1,
                                py: 0.75,
                                transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.07) },
                            })}
                            onClick={() => {
                                closeAcctSwitcher();
                                handleCreateBusinessPage();
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                                <StorefrontRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                        Create a Business Page
                                    </Typography>
                                }
                                secondary={
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        Set up a page for your business
                                    </Typography>
                                }
                                secondaryTypographyProps={{ component: 'div' }}
                            />
                        </MenuItem>

                        {/* ── Create a Music Profile CTA ── */}
                        <MenuItem
                            disabled={draftLimitChecking}
                            sx={(t) => ({
                                minHeight: 44,
                                borderRadius: 1.5,
                                px: 1,
                                py: 0.75,
                                transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.07) },
                            })}
                            onClick={() => {
                                closeAcctSwitcher();
                                handleCreateArtistProfile('music');
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                                <MusicNoteRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                        Create a Music Profile
                                    </Typography>
                                }
                                secondary={
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        Set up a profile for your music
                                    </Typography>
                                }
                                secondaryTypographyProps={{ component: 'div' }}
                            />
                        </MenuItem>

                        {/* ── Create an Artist Profile CTA (visual artists) ── */}
                        <MenuItem
                            disabled={draftLimitChecking}
                            sx={(t) => ({
                                minHeight: 44,
                                borderRadius: 1.5,
                                px: 1,
                                py: 0.75,
                                transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.07) },
                            })}
                            onClick={() => {
                                closeAcctSwitcher();
                                handleCreateArtistProfile('artist');
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                                <PaletteRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                        Create an Artist Profile
                                    </Typography>
                                }
                                secondary={
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        Set up a profile for your visual art
                                    </Typography>
                                }
                                secondaryTypographyProps={{ component: 'div' }}
                            />
                        </MenuItem>

                        {/* ── Create a Service CTA ── */}
                        <MenuItem
                            sx={(t) => ({
                                minHeight: 44,
                                borderRadius: 1.5,
                                px: 1,
                                py: 0.75,
                                transition: `background-color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                '&:hover': { bgcolor: alpha(t.palette.primary.main, 0.07) },
                            })}
                            onClick={() => {
                                closeAcctSwitcher();
                                handleHeaderCreateService();
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                                <BuildRoundedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                        Create a Service
                                    </Typography>
                                }
                                secondary={
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        List a service you offer
                                    </Typography>
                                }
                                secondaryTypographyProps={{ component: 'div' }}
                            />
                        </MenuItem>
                    </Box>
                </Menu>
            )}

            {/* ── Create menu ── */}
            {u && (
                <Menu
                    id="create-menu"
                    anchorEl={createMenuAnchorEl}
                    open={createMenuOpen}
                    onClose={handleCreateMenuClose}
                    disableScrollLock
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{
                        paper: {
                            sx: {
                                mt: 1,
                                minWidth: 220,
                                borderRadius: 3,
                                boxShadow: (t) => t.shadows[8],
                                border: '1px solid',
                                borderColor: 'divider',
                            },
                        },
                    }}
                >
                    <MenuItem onClick={handleCreatePost} sx={{ gap: 1.5, py: 1.25, fontWeight: 700, fontSize: 14 }}>
                        <ListItemIcon sx={{ minWidth: '0 !important' }}>
                            <EditRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText
                            primary={isBusinessAccount ? 'Business Post' : isArtistAccount ? 'Artist Post' : 'Community Post'}
                            primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }}
                        />
                    </MenuItem>
                    {/* Hide Group option when signed in as a business */}
                    {!isBusinessAccount && (
                        <MenuItem onClick={handleHeaderCreateGroup} sx={{ gap: 1.5, py: 1.25, fontWeight: 700, fontSize: 14 }}>
                            <ListItemIcon sx={{ minWidth: '0 !important' }}>
                                <GroupAddRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            </ListItemIcon>
                            <ListItemText primary="Group" primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }} />
                        </MenuItem>
                    )}
                    <MenuItem onClick={handleHeaderCreateEvent} sx={{ gap: 1.5, py: 1.25, fontWeight: 700, fontSize: 14 }}>
                        <ListItemIcon sx={{ minWidth: '0 !important' }}>
                            <EventRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText primary="Event" primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }} />
                    </MenuItem>
                    <MenuItem onClick={handleHeaderCreateJob} sx={{ gap: 1.5, py: 1.25, fontWeight: 700, fontSize: 14 }}>
                        <ListItemIcon sx={{ minWidth: '0 !important' }}>
                            <WorkRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText primary="Job" primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }} />
                    </MenuItem>
                    <MenuItem onClick={handleHeaderCreateServiceRequest} sx={{ gap: 1.5, py: 1.25, fontWeight: 700, fontSize: 14 }}>
                        <ListItemIcon sx={{ minWidth: '0 !important' }}>
                            <PanToolRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText primary="Service Request" primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }} />
                    </MenuItem>
                    {!isBusinessAccount && !isArtistAccount && (
                        <MenuItem onClick={handleHeaderCreateListing} sx={{ gap: 1.5, py: 1.25, fontWeight: 700, fontSize: 14 }}>
                            <ListItemIcon sx={{ minWidth: '0 !important' }}>
                                <ShoppingCartRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            </ListItemIcon>
                            <ListItemText primary="Marketplace Listing" primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }} />
                        </MenuItem>
                    )}
                    {!isBusinessAccount && !isArtistAccount && (
                        <MenuItem onClick={handleHeaderCreateYardSale} sx={{ gap: 1.5, py: 1.25, fontWeight: 700, fontSize: 14 }}>
                            <ListItemIcon sx={{ minWidth: '0 !important' }}>
                                <LocalMallRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                            </ListItemIcon>
                            <ListItemText primary="Yard Sale" primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }} />
                        </MenuItem>
                    )}
                </Menu>
            )}

            {/* ── Mobile bottom tab bar ── */}
            {isMobile && (
                <Box
                    component="nav"
                    aria-label="Main navigation"
                    sx={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: (t) => t.zIndex.appBar,
                        height: MOBILE_BOTTOM_NAV_HEIGHT,
                        bgcolor: 'background.paper',
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'stretch',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        '&::-webkit-scrollbar': { display: 'none' },
                        boxShadow: (t) => `0 -2px 12px ${alpha(t.palette.common.black, 0.06)}`,
                        // Safe area padding for iPhones with home indicator
                        pb: 'env(safe-area-inset-bottom, 0px)',
                        // Continuous scroll-fade: opacity tracks the CSS var so the
                        // bottom nav fades out/in in sync with the top header. Previously
                        // it translated down, which caused the same layout-reclaim jerk
                        // users perceived at the top. Fading keeps the bar in place;
                        // pointer events are disabled (via `--ll-nav-pointer-events`)
                        // once the bar is effectively invisible so taps fall through
                        // to content beneath.
                        transition: 'none',
                        opacity: 'calc(1 - var(--ll-nav-offset, 0))',
                        pointerEvents: 'var(--ll-nav-pointer-events, auto)',
                        transform: 'translateY(0)',
                        willChange: 'opacity',
                    }}
                >
                    {rawTabs.map((tab) => {
                        const isActive = resolvedTab === tab;
                        const TabIcon = MOBILE_TAB_ICONS[tab] || HomeRoundedIcon;

                        return (
                            <Box
                                key={tab}
                                role="tab"
                                aria-selected={isActive}
                                tabIndex={0}
                                onClick={() => handleTabChange(tab)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleTabChange(tab);
                                    }
                                }}
                                sx={(t) => ({
                                    flex: '1 1 0',
                                    minWidth: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 0.25,
                                    px: 0.25,
                                    py: 0.5,
                                    cursor: 'pointer',
                                    WebkitTapHighlightColor: 'transparent',
                                    userSelect: 'none',
                                    position: 'relative',
                                    color: isActive ? t.palette.secondary.main : t.palette.text.secondary,
                                    transition: `color ${t.custom.motion.fast}ms ${t.custom.motion.ease}`,
                                    '&:active': {
                                        color: t.palette.secondary.main,
                                    },
                                })}
                            >
                                <TabIcon sx={{ fontSize: 22 }} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontSize: 11,
                                        fontWeight: isActive ? 800 : 600,
                                        lineHeight: 1.1,
                                        letterSpacing: 0,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '100%',
                                    }}
                                >
                                    {tab === 'Marketplace' ? 'Market' : tab === 'Businesses' ? 'Business' : tab === 'Community' ? 'Local' : tab}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            )}

            {/* ═══════════ Seller Reviews Popup (for seller_review_reply notifications) ═══════════ */}
            <SellerReviewsPopup
                open={sellerReviewsPopup.open}
                onClose={() => setSellerReviewsPopup({ open: false, sellerId: null, highlightReviewId: null })}
                sellerId={sellerReviewsPopup.sellerId}
                highlightReviewId={sellerReviewsPopup.highlightReviewId}
            />

            {/* ── Business draft/pending limit dialog ── */}
            <Dialog open={draftLimitDialogOpen} onClose={() => setDraftLimitDialogOpen(false)} maxWidth="xs" fullWidth disableScrollLock>
                <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>{draftLimitTitle || 'Limit Reached'}</DialogTitle>
                <DialogContent>
                    <Typography sx={{ lineHeight: 1.6, color: 'text.secondary' }}>
                        {draftLimitMessage}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setDraftLimitDialogOpen(false)}
                        variant="contained"
                        disableElevation
                        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
                    >
                        Got it
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Rate limit dialog (business page creation) ── */}
            <RateLimitDialog
                open={headerRateLimitOpen}
                onClose={() => setHeaderRateLimitOpen(false)}
                retryAfterSec={headerRateLimitInfo.retryAfterSec}
                reason={headerRateLimitInfo.reason}
                actionLabel={headerRateLimitInfo.actionLabel}
            />

            {/* ═══════════ Contact Us Dialog ═══════════ */}
            <Dialog
                open={contactUsOpen}
                onClose={() => { if (!contactUsSending) { setContactUsOpen(false); setContactUsMsg(''); } }}
                maxWidth="sm"
                fullWidth
                fullScreen={isMobile}
                disableScrollLock
                PaperProps={{
                    sx: (t) => ({
                        ...(!isMobile && {
                            borderRadius: 3,
                            overflow: 'hidden',
                        }),
                        ...(isMobile && {
                            display: 'flex',
                            flexDirection: 'column',
                        }),
                    }),
                }}
            >
                {/* ── Mobile: close button row at top ── */}
                {isMobile && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1, pb: 0 }}>
                        <IconButton
                            aria-label="Close"
                            onClick={() => { if (!contactUsSending) { setContactUsOpen(false); setContactUsMsg(''); } }}
                            size="small"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )}

                {/* ── Content wrapper: centered vertically on mobile ── */}
                <Box
                    sx={{
                        ...(isMobile && {
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            px: 2,
                            pb: 3,
                        }),
                    }}
                >
                    {/* Header with logo */}
                    <DialogTitle
                        sx={(t) => ({
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: 'center',
                            gap: 1.5,
                            pb: 0.5,
                            pr: isMobile ? 2 : 6,
                            ...(isMobile && { textAlign: 'center', pt: 0 }),
                        })}
                    >
                        <Box
                            component="img"
                            src={theme.palette.mode === 'dark' ? logoDark : logoLight}
                            alt="Local Lantern"
                            sx={{ height: isMobile ? 48 : 36, width: 'auto', objectFit: 'contain' }}
                        />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: isMobile ? '1.35rem' : undefined }}>
                                Contact Us
                            </Typography>
                        </Box>
                        {/* Close button — desktop only (mobile has its own at top) */}
                        {!isMobile && (
                            <IconButton
                                aria-label="Close"
                                onClick={() => { if (!contactUsSending) { setContactUsOpen(false); setContactUsMsg(''); } }}
                                sx={{ position: 'absolute', top: 8, right: 8 }}
                                size="small"
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        )}
                    </DialogTitle>

                    <DialogContent sx={{ pt: 1, pb: 0, ...(isMobile && { textAlign: 'center', overflow: 'visible' }) }}>
                        <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6, ...(isMobile && { mx: 'auto', maxWidth: 360 }) }}
                        >
                            Send The Local Lantern a message. Whether you have a general question,
                            want to report an issue, or just want to share feedback — we're here to help!
                        </Typography>

                        <TextField
                            autoFocus={!isMobile}
                            fullWidth
                            multiline
                            minRows={isMobile ? 4 : 3}
                            maxRows={8}
                            placeholder="Type your message here..."
                            value={contactUsMsg}
                            onChange={(e) => {
                                if (e.target.value.length <= 5000) setContactUsMsg(e.target.value);
                            }}
                            disabled={contactUsSending}
                            variant="outlined"
                            inputProps={{ maxLength: 5000 }}
                            sx={(t) => ({
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    fontSize: 14,
                                },
                            })}
                        />
                        <Typography
                            variant="caption"
                            sx={{ display: 'block', textAlign: 'right', mt: 0.5, color: 'text.disabled' }}
                        >
                            {contactUsMsg.length} / 5,000
                        </Typography>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: isMobile ? 1 : 2.5, pt: 1.5, gap: 1, justifyContent: isMobile ? 'center' : 'flex-end' }}>
                        <Button
                            onClick={() => { setContactUsOpen(false); setContactUsMsg(''); }}
                            disabled={contactUsSending}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, color: 'text.secondary' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleContactUsSend}
                            variant="contained"
                            disableElevation
                            disabled={!contactUsMsg.trim() || contactUsSending}
                            startIcon={contactUsSending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon sx={{ fontSize: 16 }} />}
                            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700, px: 3 }}
                        >
                            {contactUsSending ? 'Sending…' : 'Send Message'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* ── Contact Us snackbar ── */}
            <Snackbar
                open={contactUsSnackbar.open}
                autoHideDuration={5000}
                onClose={() => setContactUsSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                sx={{ mb: isMobile ? 8 : 0 }}
            >
                <Alert
                    onClose={() => setContactUsSnackbar((prev) => ({ ...prev, open: false }))}
                    severity={contactUsSnackbar.severity}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
                >
                    {contactUsSnackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}